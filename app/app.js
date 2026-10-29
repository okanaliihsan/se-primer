/* SE Primer · uygulama (durum makinesi + arayüz). Bağımlılık yok. */
(function () {
  const S = window.STORY;
  const T = window.Tutor;
  const app = document.getElementById('app');
  const GEMINI_KEY = window.SE_PRIMER_GEMINI_KEY || null; // AI Studio'da process.env.API_KEY ile doldurulur

  const state = {
    screen: 'profile', // profile | intro | decision | outcome | ending
    profile: { level: null, role: null, goal: null },
    step: 0,
    choices: {},
    pressured: {}, // deneyimli oyuncuda süresi dolan kararlar
    tutorLog: [],
    usedQuestions: [],
    timerLeft: 60,
    timerId: null,
    hintOpen: false
  };

  try {
    const saved = JSON.parse(localStorage.getItem('se-primer-profile') || 'null');
    if (saved && saved.level) state.profile = saved;
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

  /* ---------- Ekran 1: Profil ---------- */
  function renderProfile() {
    const group = (key) => {
      const g = S.profile[key];
      return '<fieldset class="group"><legend>' + esc(g.label) + '</legend><div class="chips">' +
        g.options.map((o) => '<button type="button" class="chip ' + (state.profile[key] === o.id ? 'sel' : '') + '" data-key="' + key + '" data-val="' + o.id + '" data-cy="opt-' + key + '-' + o.id + '" aria-pressed="' + (state.profile[key] === o.id) + '">' +
          '<span>' + esc(o.label) + '</span>' + (o.note ? '<small>' + esc(o.note) + '</small>' : '') + '</button>').join('') +
        '</div></fieldset>';
    };
    const ready = state.profile.level && state.profile.role && state.profile.goal;
    h('<main class="screen profile" data-cy="screen-profile">' +
      '<header class="cover"><p class="eyebrow">SE Primer · Bölüm 1</p>' +
      '<h1>' + esc(S.title) + '</h1><p class="sub">' + esc(S.subtitle) + '</p>' +
      '<p class="based">Gerçek olaya dayanır: ' + esc(S.realEvent) + '</p></header>' +
      '<p class="lead">Bu kitap sana göre yazılır. Üç soru:</p>' +
      group('level') + group('role') + group('goal') +
      '<button class="primary" data-cy="start" ' + (ready ? '' : 'disabled') + '>Bölümü başlat</button>' +
      '</main>');
    app.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => {
      state.profile[b.dataset.key] = b.dataset.val;
      renderProfile();
    }));
    app.querySelector('[data-cy=start]').addEventListener('click', () => {
      try { localStorage.setItem('se-primer-profile', JSON.stringify(state.profile)); } catch (e) {}
      state.screen = 'intro'; render();
    });
  }

  /* ---------- Giriş sahnesi ---------- */
  function renderIntro() {
    h('<main class="screen scene" data-cy="screen-intro">' + progressBar() +
      '<div class="clock" aria-label="Saat">' + esc(S.intro.clock) + '</div>' +
      '<div class="bsod" aria-hidden="true"><span>:(</span> Bilgisayarınız bir sorunla karşılaştı ve yeniden başlatılması gerekiyor.</div>' +
      S.intro.text.map((p) => '<p class="story">' + esc(p) + '</p>').join('') +
      '<aside class="fact"><b>Gerçek olay</b>' + esc(S.intro.fact) + '</aside>' +
      '<button class="primary" data-cy="intro-next">İlk karara geç</button></main>');
    app.querySelector('[data-cy=intro-next]').addEventListener('click', () => { state.screen = 'decision'; state.step = 0; render(); });
  }

  /* ---------- Ekran 2: Karar sahnesi ---------- */
  function renderDecision() {
    stopTimer();
    const d = S.decisions[state.step];
    const lvl = state.profile.level;
    const showHintPanel = lvl === 'yeni' || (lvl === 'orta' && state.hintOpen);
    const timed = lvl === 'deneyimli';
    state.timerLeft = 60;

    let hintBlock = '';
    if (lvl === 'yeni' || lvl === 'orta') {
      hintBlock = (lvl === 'orta' ? '<button class="ghost" data-cy="hint-toggle" aria-expanded="' + showHintPanel + '">' + (showHintPanel ? 'İpucunu gizle' : 'İpucu göster') + '</button>' : '') +
        (showHintPanel ? '<div class="hint" data-cy="hint-panel"><b>İpucu</b>' + esc(d.hint) + '</div>' : '');
    }

    const sample = d.sample ? '<div class="paper" aria-label="Ameliyat listesi örneği (sahte veri)"><div class="paper-row head"><span>Hasta</span><span>T.C. no</span><span>Tanı</span></div>' +
      '<div class="paper-row"><span>Ayşe Kaya</span><span>12345678901</span><span>' + esc(d.sample.dx) + '</span></div>' +
      '<div class="paper-row"><span>Mehmet Demir</span><span>23456789012</span><span>Herni onarımı</span></div><p class="paper-note">Sahte veri</p></div>' : '';

    h('<main class="screen scene" data-cy="decision-' + d.id + '">' + progressBar() +
      '<div class="scene-head"><span class="tag">' + esc(d.tag) + '</span><span class="clock small">' + esc(d.clock) + '</span>' +
      (timed ? '<span class="timer" data-cy="timer" role="timer" aria-live="off">60</span>' : '') + '</div>' +
      '<p class="story">' + esc(d.situation) + '</p>' + sample +
      '<p class="lens" data-cy="role-lens">' + esc(d.roleLens[state.profile.role]) + '</p>' +
      '<h2 class="question">' + esc(d.question) + '</h2>' +
      '<div class="timeout" data-cy="timeout-msg" hidden>Süre doldu. Karar yine senin; ama bu karar raporda "süre baskısı" olarak görünecek.</div>' +
      '<div class="choices">' +
      ['A', 'B'].map((k) => '<button class="choice" data-cy="choice-' + k + '" data-k="' + k + '"><span class="letter">' + k + '</span><span>' + esc(d.options[k].label) + '</span></button>').join('') +
      '</div>' + hintBlock +
      tutorPanel(d) +
      '</main>');

    app.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => choose(b.dataset.k)));
    const tg = app.querySelector('[data-cy=hint-toggle]');
    if (tg) tg.addEventListener('click', () => { state.hintOpen = !state.hintOpen; renderDecision(); });
    wireTutor(d);

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
    state.screen = 'outcome';
    render();
  }

  /* ---------- Sonuç kartı ---------- */
  function renderOutcome() {
    const d = S.decisions[state.step];
    const k = state.choices[d.id];
    const o = d.outcomes[k];
    const last = state.step === S.decisions.length - 1;
    h('<main class="screen scene" data-cy="outcome">' + progressBar() +
      '<div class="scene-head"><span class="tag">' + esc(d.tag) + '</span><span class="picked">Seçimin: ' + k + ' · ' + esc(d.options[k].short) + '</span></div>' +
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
    h('<main class="screen ending tone-' + e.tone + '" data-cy="ending">' +
      '<p class="eyebrow">' + esc(e.code) + '</p><h1>' + esc(e.title) + '</h1><p class="story">' + esc(e.text) + '</p>' +
      '<h3>Karar izin</h3><ol class="trail" data-cy="trail">' +
      S.decisions.map((d) => {
        const k = state.choices[d.id];
        return '<li><span class="t-tag">' + esc(d.tag) + '</span><span>' + k + ' · ' + esc(d.options[k].short) + '</span>' +
          (state.pressured[d.id] ? '<em class="pressure" data-cy="pressure-' + d.id + '">süre baskısı</em>' : '') + '</li>';
      }).join('') + '</ol>' +
      '<h3>Bugün öğrendiğim</h3><div class="lessons" data-cy="lessons">' +
      ordered.map((d) => '<label class="lesson ' + (d.id === goalId ? 'goal' : '') + '"><input type="checkbox" id="learned-' + d.id + '" data-cy="learned-' + d.id + '"><span><b>' + esc(d.lesson.term) + '</b>' + esc(d.lesson.text) + '</span></label>').join('') +
      '</div><button class="primary" data-cy="restart">Baştan oyna</button>' +
      '<p class="credit">Olay: 19 Temmuz 2024 CrowdStrike kesintisi. Hastane, kişiler ve hasta verileri kurgusaldır.</p></main>');
    app.querySelector('[data-cy=restart]').addEventListener('click', () => {
      state.choices = {}; state.pressured = {}; state.tutorLog = []; state.usedQuestions = []; state.step = 0;
      state.screen = 'profile'; render();
    });
  }

  function render() {
    if (state.screen !== 'decision') stopTimer();
    ({ profile: renderProfile, intro: renderIntro, decision: renderDecision, outcome: renderOutcome, ending: renderEnding })[state.screen]();
  }
  render();
})();
