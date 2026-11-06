/* SE Primer v2 · uygulama (durum makinesi + arayüz + veri toplama + model müdahalesi). Bağımlılık yok. */
(function () {
  const S = window.STORY;
  const T = window.Tutor;
  const TEL = window.Telemetri;
  const M = window.RiskModeli;
  const app = document.getElementById('app');
  const GEMINI_KEY = window.SE_PRIMER_GEMINI_KEY || null;
  const Q = new URLSearchParams(location.search);
  const VERI_MODU = Q.get('mod') === 'veri';
  const SIRA_SABIT = Q.get('sira') === 'sabit';

  const state = {
    screen: Q.get('parite') === '1' ? 'parite' : 'profile', // profile | intro | decision | outcome | ending | veri | parite
    profile: { level: null, role: null, goal: null },
    oyuncuKodu: '',
    step: 0,
    choices: {},
    pressured: {},
    tutorLog: [],
    usedQuestions: [],
    timerLeft: 60,
    timerId: null,
    hintOpen: false,
    oturum: null,
    feats: {},
    order: {},
    model: {},     // karar id → { p, mudahale }
    kaydedildi: false
  };

  try {
    const saved = JSON.parse(localStorage.getItem('se-primer-profile') || 'null');
    if (saved && saved.level && !VERI_MODU) state.profile = saved;
  } catch (e) { /* depolama yoksa sorun değil */ }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const h = (html) => { app.innerHTML = html; app.scrollTop = 0; window.scrollTo(0, 0); };

  function stopTimer() { if (state.timerId) { clearInterval(state.timerId); state.timerId = null; } }

  function progressBar() {
    const total = S.decisions.length;
    const done = state.screen === 'ending' ? total : Math.min(state.step + (state.screen === 'outcome' ? 1 : 0), total);
    let dots = '';
    for (let i = 0; i < total; i++) dots += '<span class="pip ' + (i < done ? 'on' : '') + '"></span>';
    return '<div class="progress" aria-label="İlerleme: ' + done + '/' + total + '">' + dots + '</div>';
  }

  const veriBandi = () => (VERI_MODU ? '<div class="veri-band" data-cy="veri-band">Veri toplama modu · kararlar anonim olarak bu cihazda kaydediliyor</div>' : '');

  /* ---------- Ekran 1: Profil ---------- */
  function renderProfile() {
    const group = (key) => {
      const g = S.profile[key];
      return '<fieldset class="group"><legend>' + esc(g.label) + '</legend><div class="chips">' +
        g.options.map((o) => '<button type="button" class="chip ' + (state.profile[key] === o.id ? 'sel' : '') + '" data-key="' + key + '" data-val="' + o.id + '" data-cy="opt-' + key + '-' + o.id + '" aria-pressed="' + (state.profile[key] === o.id) + '">' +
          '<span>' + esc(o.label) + '</span>' + (o.note ? '<small>' + esc(o.note) + '</small>' : '') + '</button>').join('') +
        '</div></fieldset>';
    };
    const kodBlok = VERI_MODU
      ? '<fieldset class="group"><legend>Oyuncu kodu</legend><input id="oyuncu-kodu" data-cy="oyuncu-kodu" class="kod" maxlength="8" autocomplete="off" placeholder="ör. O1" value="' + esc(state.oyuncuKodu) + '">' +
        '<small class="hint-small">Ad yazma. Aynı kişi her oyunda aynı kodu kullansın (O1, O2, O3).</small></fieldset>'
      : '';
    const ready = state.profile.level && state.profile.role && state.profile.goal && (!VERI_MODU || state.oyuncuKodu.trim());
    h('<main class="screen profile" data-cy="screen-profile">' + veriBandi() +
      '<header class="cover"><p class="eyebrow">SE Primer · Bölüm 1</p>' +
      '<h1>' + esc(S.title) + '</h1><p class="sub">' + esc(S.subtitle) + '</p>' +
      '<p class="based">Gerçek olaya dayanır: ' + esc(S.realEvent) + '</p></header>' +
      '<p class="lead">Bu kitap sana göre yazılır. Üç soru:</p>' +
      kodBlok + group('level') + group('role') + group('goal') +
      '<button class="primary" data-cy="start" ' + (ready ? '' : 'disabled') + '>Bölümü başlat</button>' +
      (VERI_MODU ? '<button class="ghost" data-cy="veri-paneli">Toplanan veriyi gör</button>' : '') +
      '</main>');
    app.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => {
      state.profile[b.dataset.key] = b.dataset.val;
      renderProfile();
    }));
    const kod = app.querySelector('#oyuncu-kodu');
    if (kod) kod.addEventListener('input', () => {
      state.oyuncuKodu = kod.value;
      const ok = state.profile.level && state.profile.role && state.profile.goal && kod.value.trim();
      app.querySelector('[data-cy=start]').disabled = !ok;
    });
    const vp = app.querySelector('[data-cy=veri-paneli]');
    if (vp) vp.addEventListener('click', () => { state.screen = 'veri'; render(); });
    app.querySelector('[data-cy=start]').addEventListener('click', () => {
      try { if (!VERI_MODU) localStorage.setItem('se-primer-profile', JSON.stringify(state.profile)); } catch (e) {}
      state.oturum = TEL.yeniOturum(state.oyuncuKodu, Object.assign({}, state.profile));
      state.feats = {}; state.order = {}; state.model = {}; state.kaydedildi = false;
      if (!VERI_MODU) M.yukle();
      state.screen = 'intro'; render();
    });
  }

  /* ---------- Giriş sahnesi ---------- */
  function renderIntro() {
    h('<main class="screen scene" data-cy="screen-intro">' + veriBandi() + progressBar() +
      '<div class="clock" aria-label="Saat">' + esc(S.intro.clock) + '</div>' +
      '<div class="bsod" aria-hidden="true"><span>:(</span> Bilgisayarınız bir sorunla karşılaştı ve yeniden başlatılması gerekiyor.</div>' +
      S.intro.text.map((p) => '<p class="story">' + esc(p) + '</p>').join('') +
      '<aside class="fact"><b>Gerçek olay</b>' + esc(S.intro.fact) + '</aside>' +
      '<button class="primary" data-cy="intro-next">İlk karara geç</button></main>');
    app.querySelector('[data-cy=intro-next]').addEventListener('click', () => { state.screen = 'decision'; state.step = 0; render(); });
  }

  /* ---------- Ekran 2: Karar sahnesi ---------- */
  function hintHtml(d) {
    const lvl = state.profile.level;
    if (lvl !== 'yeni' && lvl !== 'orta') return '';
    const open = lvl === 'yeni' || state.hintOpen;
    return (lvl === 'orta' ? '<button class="ghost" data-cy="hint-toggle" aria-expanded="' + open + '">' + (open ? 'İpucunu gizle' : 'İpucu göster') + '</button>' : '') +
      (open ? '<div class="hint" data-cy="hint-panel"><b>İpucu</b>' + esc(d.hint) + '</div>' : '');
  }
  function wireHint(d) {
    const tg = app.querySelector('[data-cy=hint-toggle]');
    if (tg) tg.addEventListener('click', () => {
      state.hintOpen = !state.hintOpen;
      if (state.hintOpen) TEL.ipucuAcildi(state.oturum);
      app.querySelector('#ipucu-slot').innerHTML = hintHtml(d);
      wireHint(d);
    });
  }

  function renderDecision() {
    stopTimer();
    const d = S.decisions[state.step];
    const lvl = state.profile.level;
    const timed = lvl === 'deneyimli';
    state.timerLeft = 60;
    if (!state.feats[d.id]) state.feats[d.id] = TEL.kararEkraniAcildi(state.oturum, state.step + 1);
    if (!state.order[d.id]) state.order[d.id] = (SIRA_SABIT || Math.random() < 0.5) ? ['A', 'B'] : ['B', 'A'];

    const sample = d.sample ? '<div class="paper" aria-label="Ameliyat listesi örneği (sahte veri)"><div class="paper-row head"><span>Hasta</span><span>T.C. no</span><span>Tanı</span></div>' +
      '<div class="paper-row"><span>Ayşe Kaya</span><span>12345678901</span><span>' + esc(d.sample.dx) + '</span></div>' +
      '<div class="paper-row"><span>Mehmet Demir</span><span>23456789012</span><span>Herni onarımı</span></div><p class="paper-note">Sahte veri</p></div>' : '';

    h('<main class="screen scene" data-cy="decision-' + d.id + '">' + veriBandi() + progressBar() +
      '<div class="scene-head"><span class="tag">' + esc(d.tag) + '</span><span class="clock small">' + esc(d.clock) + '</span>' +
      (timed ? '<span class="timer" data-cy="timer" role="timer" aria-live="off">60</span>' : '') + '</div>' +
      '<p class="story">' + esc(d.situation) + '</p>' + sample +
      '<p class="lens" data-cy="role-lens">' + esc(d.roleLens[state.profile.role]) + '</p>' +
      '<div id="mudahale-slot"></div>' +
      '<h2 class="question">' + esc(d.question) + '</h2>' +
      '<div class="timeout" data-cy="timeout-msg" hidden>Süre doldu. Karar yine senin; ama bu karar raporda "süre baskısı" olarak görünecek.</div>' +
      '<div class="choices">' +
      state.order[d.id].map((k, i) => '<button class="choice" data-cy="choice-' + k + '" data-k="' + k + '"><span class="letter">' + 'AB'[i] + '</span><span>' + esc(d.options[k].label) + '</span></button>').join('') +
      '</div><div id="ipucu-slot">' + hintHtml(d) + '</div>' +
      tutorPanel(d) +
      '<p class="model-rozet" data-cy="model-rozet" hidden></p>' +
      '</main>');

    app.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => choose(b.dataset.k)));
    wireHint(d);
    wireTutor(d);
    if (!VERI_MODU) uygulaModel(d);

    if (timed) {
      const el = app.querySelector('[data-cy=timer]');
      state.timerId = setInterval(() => {
        state.timerLeft -= 1;
        el.textContent = String(Math.max(state.timerLeft, 0));
        if (state.timerLeft <= 10) el.classList.add('low');
        if (state.timerLeft <= 0) {
          stopTimer();
          state.pressured[d.id] = true;
          el.textContent = '0';
          app.querySelector('[data-cy=timeout-msg]').hidden = false;
        }
      }, 1000);
    }
  }

  /* Model: "Bu oyuncu bu kararda riskli seçeneğe gidecek mi?" Olasılık eşiği geçerse tutor
     cevabı söylemeden, karar vermeden ÖNCE devreye girer; 'orta' seviyede ipucu kendiliğinden açılır. */
  function uygulaModel(d) {
    const id = d.id;
    const goster = (p) => {
      if (state.screen !== 'decision' || S.decisions[state.step].id !== id) return;
      const esik = M.esik();
      const olurdu = p !== null && p >= esik;      // modelin kararı
      const golge = p !== null && M.golge();        // kabul eşiğini geçemeyen aday: karar uygulanmaz
      const mud = olurdu && !golge;
      state.model[id] = { p, mudahale: mud, olurdu, golge };
      const rozet = app.querySelector('[data-cy=model-rozet]');
      if (rozet) {
        rozet.hidden = false;
        rozet.dataset.karar = p === null ? 'yok' : (olurdu ? 'ederdi' : 'etmezdi');
        rozet.textContent = p === null ? 'Uyum modeli: kullanılamıyor (' + (M.durum.hata || 'yüklenemedi') + '), kural tabanlı akış'
          : golge
            ? 'Uyum modeli (gölge mod) · riskli seçim olasılığı ' + Math.round(p * 100) + '% · eşik ' + Math.round(esik * 100) + '% · model müdahale ' + (olurdu ? 'EDERDİ' : 'ETMEZDİ') + '. Model kabul eşiğini geçemediği için oyunu değiştirmiyor.'
            : 'Uyum modeli · riskli seçim olasılığı ' + Math.round(p * 100) + '% · eşik ' + Math.round(esik * 100) + '% · ' + (mud ? 'tutor devreye girdi' : 'müdahale yok');
      }
      if (!mud) return;
      const soru = T.firstQuestion(d, state.profile);
      // Müdahale sorusu, tutorun ilk sorusundan farklı ve 1. sıradaki soru değil: v1 eval'inde (eval/RAPOR.md)
      // k2'nin 1. sorusu "cevabı ima ediyor" (dolaylı yönlendirme) diye işaretlenmişti.
      const alt = [1, 2, 3, 0].map((i) => d.socratic[i]).find((x) => x && x !== soru) || soru;
      app.querySelector('#mudahale-slot').innerHTML =
        '<aside class="mudahale" data-cy="model-mudahale"><b>Seçmeden önce bir dakika</b>' +
        '<p>' + esc(alt) + '</p><small>Bu soruyu, senin gibi oynayanların bu noktada sık yanıldığını gören model gösteriyor. Cevabı söylemez.</small></aside>';
      if (state.profile.level === 'orta' && !state.hintOpen) {
        state.hintOpen = true;
        app.querySelector('#ipucu-slot').innerHTML = hintHtml(d);
        wireHint(d);
      }
    };
    M.tahmin(state.feats[id]).then(goster).catch((e) => { M.durum.hata = String(e.message || e); goster(null); });
  }

  function tutorPanel(d) {
    const log = state.tutorLog.filter((m) => m.d === d.id);
    const first = T.firstQuestion(d, state.profile);
    const msgs = [{ who: 'tutor', text: first }].concat(log);
    return '<section class="tutor" aria-label="Tutor">' +
      '<div class="tutor-head"><span class="dot" aria-hidden="true"></span><b>Tutor</b><small>Cevabı söylemez, soru sorar</small></div>' +
      '<div class="thread" data-cy="tutor-thread">' +
      msgs.map((m) => '<p class="msg ' + m.who + '" ' + (m.who === 'tutor' ? 'data-cy="tutor-msg"' : 'data-cy="me-msg"') + '>' + esc(m.text) + '</p>').join('') +
      '</div><form class="ask" data-cy="tutor-form"><label for="tutor-input-' + d.id + '" class="sr">Tutor\'a yaz</label>' +
      '<input id="tutor-input-' + d.id + '" data-cy="tutor-input" placeholder="Düşündüğünü yaz ya da soru sor" autocomplete="off">' +
      '<button data-cy="tutor-send" type="submit">Gönder</button></form></section>';
  }

  function wireTutor(d) {
    const form = app.querySelector('[data-cy=tutor-form]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input');
      const text = input.value.trim();
      if (!text) return;
      state.tutorLog.push({ d: d.id, who: 'me', text });
      TEL.tutorMesaji(state.oturum);
      const used = state.usedQuestions.concat([T.firstQuestion(d, state.profile)]);
      const r = await T.reply(d, text, state.profile, used, GEMINI_KEY);
      state.usedQuestions.push(r.question);
      state.tutorLog.push({ d: d.id, who: 'tutor', text: r.text });
      const thread = app.querySelector('[data-cy=tutor-thread]');
      thread.insertAdjacentHTML('beforeend', '<p class="msg me" data-cy="me-msg">' + esc(text) + '</p><p class="msg tutor" data-cy="tutor-msg">' + esc(r.text) + '</p>');
      input.value = '';
      thread.lastElementChild.scrollIntoView({ block: 'nearest' });
    });
  }

  function choose(k) {
    stopTimer();
    const d = S.decisions[state.step];
    state.choices[d.id] = k;
    const m = state.model[d.id] || {};
    TEL.secimYapildi(state.oturum, state.feats[d.id], {
      secim: k, riskliUstte: state.order[d.id][0] === 'B', sureDoldu: !!state.pressured[d.id],
      modelP: m.p == null ? null : m.p, mudahale: !!m.mudahale
    });
    state.screen = 'outcome';
    render();
  }

  /* ---------- Sonuç kartı ---------- */
  function renderOutcome() {
    const d = S.decisions[state.step];
    const k = state.choices[d.id];
    const o = d.outcomes[k];
    const last = state.step === S.decisions.length - 1;
    h('<main class="screen scene" data-cy="outcome">' + veriBandi() + progressBar() +
      '<div class="scene-head"><span class="tag">' + esc(d.tag) + '</span><span class="picked">Seçimin: ' + esc(d.options[k].short) + '</span></div>' +
      '<h2 class="outcome-title" data-cy="outcome-title">' + esc(o.title) + '</h2>' +
      '<dl class="ledger">' +
      '<div><dt>Ne oldu?</dt><dd>' + esc(o.what) + '</dd></div>' +
      '<div><dt>Neden oldu?</dt><dd>' + esc(o.why) + '</dd></div>' +
      '<div class="real"><dt>Gerçekte ne oldu?</dt><dd>' + esc(o.real) + '</dd></div>' +
      '</dl>' +
      '<div class="concept"><b>' + esc(d.lesson.term) + '</b><p>' + esc(d.lesson.text) + '</p></div>' +
      '<button class="primary" data-cy="outcome-next">' + (last ? 'Sonu gör' : 'Sonraki karar') + '</button></main>');
    app.querySelector('[data-cy=outcome-next]').addEventListener('click', () => {
      if (last) state.screen = 'ending';
      else { state.step += 1; state.screen = 'decision'; state.hintOpen = false; }
      render();
    });
  }

  /* ---------- Ekran 3: Son ---------- */
  function renderEnding() {
    const code = window.decideEnding(state.choices);
    const e = S.endings[code];
    const goalId = S.goalLessons[state.profile.goal];
    const ordered = S.decisions.slice().sort((a, b) => (a.id === goalId ? -1 : b.id === goalId ? 1 : 0));
    let veriKutu = '';
    if (VERI_MODU) {
      if (!state.kaydedildi) { TEL.oturumuKaydet(state.oturum); state.kaydedildi = true; }
      const oz = TEL.ozet();
      veriKutu = '<aside class="veri-kutu" data-cy="veri-kaydedildi"><b>Bu oyunun 3 kararı kaydedildi.</b>' +
        '<p>Bu cihazda toplam <span data-cy="veri-oturum">' + oz.oturum + '</span> oyun (' + oz.satir + ' satır) var. Hedef: en az 15 oyun.</p>' +
        '<div class="veri-dugmeler"><button class="primary" data-cy="sonraki-oyuncu">Sonraki oyun</button>' +
        '<button class="ghost" data-cy="veri-paneli">Toplanan veriyi gör</button></div></aside>';
    }
    h('<main class="screen ending tone-' + e.tone + '" data-cy="ending">' + veriBandi() +
      '<p class="eyebrow">' + esc(e.code) + '</p><h1>' + esc(e.title) + '</h1><p class="story">' + esc(e.text) + '</p>' + veriKutu +
      '<h3>Karar izin</h3><ol class="trail" data-cy="trail">' +
      S.decisions.map((d) => {
        const k = state.choices[d.id];
        return '<li><span class="t-tag">' + esc(d.tag) + '</span><span>' + k + ' · ' + esc(d.options[k].short) + '</span>' +
          (state.pressured[d.id] ? '<em class="pressure" data-cy="pressure-' + d.id + '">süre baskısı</em>' : '') +
          (state.model[d.id] && state.model[d.id].mudahale ? '<em class="pressure tut" data-cy="mudahale-iz-' + d.id + '">tutor devreye girdi</em>' : '') +
          (state.model[d.id] && state.model[d.id].golge && state.model[d.id].olurdu ? '<em class="pressure golge" data-cy="golge-iz-' + d.id + '">gölge: model müdahale ederdi</em>' : '') + '</li>';
      }).join('') + '</ol>' +
      '<h3>Bugün öğrendiğim</h3><div class="lessons" data-cy="lessons">' +
      ordered.map((d) => '<label class="lesson ' + (d.id === goalId ? 'goal' : '') + '"><input type="checkbox" id="learned-' + d.id + '" data-cy="learned-' + d.id + '"><span><b>' + esc(d.lesson.term) + '</b>' + esc(d.lesson.text) + '</span></label>').join('') +
      '</div><button class="primary" data-cy="restart">Baştan oyna</button>' +
      '<p class="credit">Olay: 19 Temmuz 2024 CrowdStrike kesintisi. Hastane, kişiler ve hasta verileri kurgusaldır.</p></main>');
    const reset = (keepCode) => {
      state.choices = {}; state.pressured = {}; state.tutorLog = []; state.usedQuestions = []; state.step = 0; state.hintOpen = false;
      if (VERI_MODU) { state.profile = { level: null, role: null, goal: null }; if (!keepCode) state.oyuncuKodu = ''; }
      state.screen = 'profile'; render();
    };
    app.querySelector('[data-cy=restart]').addEventListener('click', () => reset(true));
    const so = app.querySelector('[data-cy=sonraki-oyuncu]');
    if (so) so.addEventListener('click', () => reset(true));
    const vp = app.querySelector('[data-cy=veri-paneli]');
    if (vp) vp.addEventListener('click', () => { reset(true); state.screen = 'veri'; render(); });
  }

  /* ---------- Veri paneli (yalnız ?mod=veri) ---------- */
  function renderVeri() {
    const oz = TEL.ozet();
    const kisiler = Object.entries(oz.kisi).map(([k, n]) => '<li><span>' + esc(k) + '</span><b>' + n + ' oyun</b></li>').join('') || '<li><span>Henüz veri yok</span></li>';
    h('<main class="screen" data-cy="screen-veri">' + veriBandi() +
      '<p class="eyebrow">Veri paneli</p><h1>' + oz.oturum + ' oyun, ' + oz.satir + ' karar</h1>' +
      '<p class="story">Hedef: en az 15 gerçek oyun (ör. 3 kişi × 5 oyun). Her karar bir satır.</p>' +
      '<ul class="kisi-liste" data-cy="kisi-liste">' + kisiler + '</ul>' +
      '<div class="veri-dugmeler"><button class="primary" data-cy="csv-indir">CSV indir</button>' +
      '<button class="ghost" data-cy="csv-kopyala">CSV\'yi kopyala</button></div>' +
      '<p class="durum" data-cy="veri-durum" role="status"></p>' +
      '<textarea class="csv-alan" data-cy="csv-alan" readonly hidden></textarea>' +
      '<button class="primary" data-cy="yeni-oyun">Yeni oyun başlat</button>' +
      '<details class="tehlike"><summary>Verileri sil</summary><p>Bu cihazdaki tüm kayıtlar silinir. Önce CSV\'yi indirdiğinden emin ol.</p>' +
      '<button class="ghost tehlike-btn" data-cy="veri-sil">Evet, hepsini sil</button></details>' +
      '</main>');
    const durum = app.querySelector('[data-cy=veri-durum]');
    app.querySelector('[data-cy=csv-indir]').addEventListener('click', () => {
      const blob = new Blob([TEL.csv()], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'oturumlar.csv';
      document.body.appendChild(a); a.click(); a.remove();
      durum.textContent = 'oturumlar.csv indirildi. Bu dosyayı Claude sohbetine gönder.';
    });
    app.querySelector('[data-cy=csv-kopyala]').addEventListener('click', async () => {
      const metin = TEL.csv();
      try { await navigator.clipboard.writeText(metin); durum.textContent = 'Kopyalandı. Sohbete yapıştırabilirsin.'; }
      catch (e) {
        const ta = app.querySelector('[data-cy=csv-alan]'); ta.hidden = false; ta.value = metin; ta.select();
        durum.textContent = 'Otomatik kopyalanamadı; metin seçildi, elle kopyala.';
      }
    });
    app.querySelector('[data-cy=yeni-oyun]').addEventListener('click', () => { state.screen = 'profile'; render(); });
    app.querySelector('[data-cy=veri-sil]').addEventListener('click', () => { TEL.sil(); render(); });
  }

  /* ---------- Parite (diferansiyel test) ekranı: ?parite=1 ---------- */
  async function renderParite() {
    h('<main class="screen" data-cy="screen-parite"><p class="eyebrow">Diferansiyel test · uygulama tarafı</p><h1>Parite</h1>' +
      '<p class="story">Python (test kahini) ile aynı 5 girdiyi bu uygulamanın çıkarım motoruna veriyoruz.</p>' +
      '<p class="based">Motor: <span data-cy="motor">yükleniyor…</span> · Kaynak: <span data-cy="model-kaynak">—</span></p>' +
      '<div class="tablo-kap"><table class="parite"><thead><tr><th>#</th><th>Uygulama p</th><th>Python p</th><th>|fark|</th></tr></thead><tbody data-cy="parite-tablo"></tbody></table></div></main>');
    try {
      const vakalar = await (await fetch('tests/parite.json', { cache: 'no-store' })).json();
      await M.yukle();
      app.querySelector('[data-cy=motor]').textContent = M.durum.motor || ('yok: ' + M.durum.hata);
      app.querySelector('[data-cy=model-kaynak]').textContent = M.durum.kaynak || '—';
      const tb = app.querySelector('[data-cy=parite-tablo]');
      for (let i = 0; i < vakalar.vakalar.length; i++) {
        const v = vakalar.vakalar[i];
        const p = await M.tahmin(v.girdi);
        const fark = Math.abs(p - v.p_python);
        tb.insertAdjacentHTML('beforeend', '<tr data-cy="parite-vaka" data-p="' + p + '" data-py="' + v.p_python + '"><td>' + (i + 1) + '</td><td data-cy="p">' + p.toFixed(6) +
          '</td><td data-cy="p-python">' + v.p_python.toFixed(6) + '</td><td data-cy="fark">' + fark.toExponential(2) + '</td></tr>');
      }
    } catch (e) {
      app.querySelector('[data-cy=motor]').textContent = 'hata: ' + (e.message || e);
    }
  }

  function render() {
    if (state.screen !== 'decision') stopTimer();
    ({ profile: renderProfile, intro: renderIntro, decision: renderDecision, outcome: renderOutcome, ending: renderEnding, veri: renderVeri, parite: renderParite })[state.screen]();
  }
  render();
})();
