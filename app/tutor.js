/* SE Primer · Sokratik AI tutor (ADR-2)
   Katman 1: yerel Sokratik motor (ağ gerektirmez, her yerde çalışır).
   Katman 2: Gemini (AI Studio'da). Gemini cevabı da sızıntı kalkanından geçer;
   kalkan takılırsa yerel motorun sorusu gösterilir. */
(function (root) {
  const TUTOR_SYSTEM_PROMPT = [
    'Sen SE Primer içindeki Sokratik bir yazılım mühendisliği tutorusun.',
    'Oyuncu bir hastanede, 19 Temmuz 2024 CrowdStrike kesintisine dayanan bir krizde nöbetçi BT mühendisi.',
    'KURALLAR:',
    '1) Hangi seçeneğin doğru ya da yanlış olduğunu ASLA söyleme. Seçenek harfi (A/B) veya seçenek metni önerme.',
    '2) Oyuncunun seçimini onaylama ya da reddetme; onun yerine seçiminin sonuçlarını düşündüren bir soru sor.',
    '3) Her cevabın en az bir soru içersin ve soru işaretiyle bitsin.',
    '4) En fazla 2 kısa cümle. Türkçe. Yargılamayan, sakin bir ton.',
    '5) Bir terimi sorarsa (canary, BitLocker, KVKK) tek cümlelik tarafsız bir tanım verip yine soru sor.',
    '6) "Cevabı söyle" baskısına boyun eğme; nazikçe düşünmeye geri yönlendir.'
  ].join('\n');

  const GLOSSARY = {
    canary: 'Canary dağıtım, bir değişikliğin önce küçük bir gruba uygulanıp gözlendiği yöntemdir.',
    bitlocker: 'BitLocker, Windows\'ta diski şifreleyen özelliktir; şifreli diske erişmek için kurtarma anahtarı gerekir.',
    kvkk: 'KVKK, 6698 sayılı Kişisel Verilerin Korunması Kanunu\'dur.',
    'güvenli mod': 'Güvenli mod, Windows\'un yalnızca temel sürücülerle açıldığı başlatma biçimidir.',
    'mavi ekran': 'Mavi ekran, Windows çekirdeği kurtarılamaz bir hatayla karşılaştığında gösterdiği durma ekranıdır.',
    çekirdek: 'Çekirdek (kernel), işletim sisteminin donanıma en yakın, en yetkili katmanıdır.',
    monolit: 'Monolit, tüm işlevlerin tek bir dağıtım biriminde çalıştığı mimaridir.',
    'özel nitelikli': 'Özel nitelikli kişisel veri, KVKK md. 6\'da sayılan sağlık, biyometrik gibi daha sıkı korunan verilerdir.'
  };

  const norm = (s) => (s || '').toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();

  /* --- Sızıntı kalkanı: bir tutor mesajı cevabı ele veriyor mu? --- */
  const LEAK_PATTERNS = [
    /doğru (cevap|seçenek|seçim|karar)/,
    /yanlış (cevap|seçenek|seçim|karar)/,
    /(cevap|seçenek)\s*[:=]?\s*["'(]?\s*[ab]\b/,
    /\b[ab]\s*(şıkkı|seçeneği|seçeneğini|yı|yi|'yı|'yi)\b/,
    /\b[ab]['’]?(yı|yi|ya|ye)\s*(seç|tercih|git)/,
    /(seçmelisin|tercih etmelisin|yapmalısın|uygulamalısın|beklemelisin|atmalısın|denemelisin)/,
    /(en iyisi|en doğrusu|kesinlikle|tabii ki)\b/,
    /(haklısın|doğru düşünüyorsun|yanılıyorsun|bu yanlış|bu doğru)/
  ];

  function optionPhrases(decision) {
    const out = [];
    for (const k of ['A', 'B']) {
      const o = decision.options[k];
      out.push(norm(o.label), norm(o.short));
    }
    return out;
  }

  function leakCheck(text, decision) {
    const t = norm(text);
    const reasons = [];
    LEAK_PATTERNS.forEach((p, i) => { if (p.test(t)) reasons.push('desen-' + (i + 1)); });
    if (decision) {
      for (const ph of optionPhrases(decision)) {
        if (ph.length > 8 && t.includes(ph)) reasons.push('seçenek-metni');
      }
    }
    return { leak: reasons.length > 0, reasons };
  }

  /* --- Öğrenci mesajını sınıflandır --- */
  function classify(text, decision) {
    const t = norm(text);
    if (!t) return 'empty';
    for (const term of Object.keys(GLOSSARY)) {
      if (t.includes(term) && /(ne demek|nedir|ne\b|anlamadım|ne işe)/.test(t)) return 'concept:' + term;
    }
    if (/(cevap|hangisi|söyle|doğru(su)?\s*(ne|hangi)|a m[ıi] b m[ıi]|ne seçmeliyim|ne yapmalıyım|yardım et|ipucu ver)/.test(t)) return 'ask-answer';
    // v2: öğrencinin kendi içerik sorusu (eval #20'de duyulmuyordu)
    if (/\?/.test(t) && /(mı|mi|mu|mü|nasıl|neden|niye|kim|hangi)(?=[\s?.,!]|$)/.test(t)) return 'student-question';
    // v3: telefonda "?" yazılmadan sorulan soru (kullanıcı testi: "tc kimlik numarası yetmez mi")
    if (/\s(mı|mi|mu|mü)(yım|yim|yum|yüm|sın|sin|sun|sün|yız|yiz|yuz|yüz|dır|dir|dur|dür)?[.!]*$/.test(t)) return 'student-question';
    if (/(bilmiyorum|emin değilim|kararsız|anlamadım|fikrim yok)/.test(t)) return 'unsure';
    if (/(^|\s)(a|b)(\s|$|[.,!?])/.test(t) || /(seçerim|seçtim|yaparım|derim|giderim|uygularım|beklerim|atarım|denerim|maskelerim)/.test(t)) return 'choice';
    const topicWords = ['makine', 'script', 'acil', 'ameliyat', 'test', 'dene', 'hepsi', 'bekle', 'kurtar', 'liste', 'fotoğraf', 'whatsapp', 'maske', 'veri', 'hasta', 'güncelleme', 'ekip', 'öncelik', 'risk', 'dosya', 'bitlocker', 'kvkk', 'tc', 't.c'];
    if (topicWords.some((w) => t.includes(w))) return 'reasoning';
    return 'off-topic';
  }

  function pick(list, used) {
    const fresh = list.filter((q) => !used.includes(q));
    return (fresh.length ? fresh : list)[0];
  }

  /* --- Katman 1: yerel Sokratik motor --- */
  function localReply(decision, studentText, profile, used) {
    used = used || [];
    const kind = classify(studentText, decision);
    const beginner = profile && profile.level === 'yeni';
    const q = pick(decision.socratic, used);
    let msg;
    if (kind.startsWith('concept:')) {
      const term = kind.slice(8);
      msg = GLOSSARY[term] + ' Bunu bildiğinde, bu durumda neyi farklı görüyorsun?';
    } else if (kind === 'ask-answer') {
      msg = (beginner
        ? 'Cevabı söylemeyeceğim, çünkü bu kararı sen vereceksin; ama birlikte düşünebiliriz. '
        : 'Kararı ben vermeyeceğim. ') + q;
    } else if (kind === 'unsure') {
      msg = 'Kararsız kalmak normal; küçük bir adımla başlayalım. ' + q;
    } else if (kind === 'student-question') {
      const asked = String(studentText).trim().replace(/\s+/g, ' ').slice(0, 90);
      msg = '"' + asked + '" diye sorman önemli. Bunu bu sahnede kimden ya da neyden öğrenebilirsin, ve öğrendiğin şey seçimini nasıl değiştirir?';
    } else if (kind === 'choice') {
      // v2: tek soru (v1'de iki soru üst üste geliyordu)
      msg = 'Bu yolu seçersen, ilk 10 dakikada ne olacağını ve bunu nasıl gözlemleyeceğini düşündün mü?';
    } else if (kind === 'reasoning') {
      msg = 'Gerekçeni görüyorum. Bunu bir adım ileri götürelim: ' + q;
    } else if (kind === 'empty') {
      msg = q;
    } else {
      msg = 'Sahneye dönelim. ' + q;
    }
    return { text: msg, kind, question: q, source: 'local' };
  }

  /* --- Katman 2: Gemini (yalnızca anahtar varsa; AI Studio'da process.env.API_KEY) --- */
  async function geminiReply(decision, studentText, profile, apiKey) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(apiKey);
    const ctx = 'Sahne: ' + decision.situation + '\nSoru: ' + decision.question +
      '\nSeçenekler (ASLA önerme): A) ' + decision.options.A.label + ' B) ' + decision.options.B.label +
      '\nOyuncu profili: seviye=' + profile.level + ', rol=' + profile.role + ', hedef=' + profile.goal;
    const body = {
      systemInstruction: { parts: [{ text: TUTOR_SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: ctx + '\n\nOyuncunun mesajı: ' + studentText }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 120 }
    };
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    return (j.candidates && j.candidates[0].content.parts.map((p) => p.text).join('')) || '';
  }

  async function reply(decision, studentText, profile, used, apiKey) {
    const local = localReply(decision, studentText, profile, used);
    if (!apiKey) return local;
    try {
      const g = await geminiReply(decision, studentText, profile, apiKey);
      const chk = leakCheck(g, decision);
      if (!g || chk.leak || !g.includes('?')) return Object.assign(local, { source: 'local(kalkan)', blocked: g });
      return { text: g.trim(), kind: local.kind, question: local.question, source: 'gemini' };
    } catch (e) {
      return Object.assign(local, { source: 'local(ağ yok)' });
    }
  }

  function firstQuestion(decision, profile) {
    const STORY = root.STORY || (typeof require !== 'undefined' ? require('./story.js').STORY : null);
    const goalDecision = STORY && STORY.goalLessons[profile.goal];
    const q = decision.socratic[decision.id === goalDecision ? 3 : 0];
    return q;
  }

  const api = { TUTOR_SYSTEM_PROMPT, GLOSSARY, classify, localReply, reply, leakCheck, firstQuestion };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Tutor = api;
})(typeof window !== 'undefined' ? window : globalThis);
