// Tutor eval: 20 öğrenci cevabını tutora verir, çıktıları otomatik ön-etiketler,
// elle verilmiş etiketlerle (etiketler-elle.json) birleştirip rapor üretir.
// Kullanım: node eval/run-eval.js            (yerel tutor)
//           GEMINI_API_KEY=... node eval/run-eval.js   (Gemini katmanı dahil)
//           node eval/run-eval.js --baseline  (cevabı veren saf tutor: değerlendiricinin sızıntıyı yakaladığını doğrular)
const fs = require('fs');
const path = require('path');
const { STORY } = require('../app/story.js');
const Tutor = require('../app/tutor.js');

const dir = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(dir, 'ogrenci-cevaplari.json'), 'utf8'));
const baseline = process.argv.includes('--baseline');
const decisions = Object.fromEntries(STORY.decisions.map((d) => [d.id, d]));

// Değerlendiriciyi doğrulamak için "saf" tutor: cevabı doğrudan veriyor.
function naiveTutor(d) {
  const best = d.id === 'k3' ? 'A' : 'A';
  return { text: `Doğru cevap ${best}: ${d.options[best].label}. Bunu seçmelisin.`, source: 'baseline' };
}

function wilson(k, n, z = 1.96) {
  if (n === 0) return [0, 0];
  const p = k / n, d = 1 + z * z / n;
  const c = (p + z * z / (2 * n)) / d;
  const m = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d;
  return [Math.max(0, c - m), Math.min(1, c + m)];
}

(async () => {
  const key = process.env.GEMINI_API_KEY || null;
  const rows = [];
  for (const s of data) {
    const d = decisions[s.karar];
    const profile = { level: s.seviye, role: 'devops', goal: 'kriz' };
    const r = baseline ? naiveTutor(d) : await Tutor.reply(d, s.metin, profile, [], key);
    const leak = Tutor.leakCheck(r.text, d);
    rows.push({
      id: s.id, karar: s.karar, tur: s.tur, ogrenci: s.metin, tutor: r.text, kaynak: r.source,
      oto_LEAK: leak.leak, oto_QUESTION: /\?\s*$/.test(r.text.trim()) || r.text.includes('?'), sebep: leak.reasons.join('|')
    });
  }

  const manualPath = path.join(dir, 'etiketler-elle.json');
  const manual = !baseline && fs.existsSync(manualPath) ? JSON.parse(fs.readFileSync(manualPath, 'utf8')) : {};
  for (const r of rows) {
    const m = manual[r.id];
    r.LEAK = m ? m.LEAK : r.oto_LEAK;
    r.QUESTION = m ? m.QUESTION : r.oto_QUESTION;
    r.ON_TOPIC = m ? m.ON_TOPIC : true;
    r.hata = m ? m.hata : '';
    r.not = m ? m.not : '';
    r.elle = Boolean(m);
  }

  const n = rows.length;
  const count = (f) => rows.filter(f).length;
  const leaks = count((r) => r.LEAK), qs = count((r) => r.QUESTION), on = count((r) => r.ON_TOPIC);
  const agree = count((r) => r.oto_LEAK === r.LEAK);
  const pct = (k) => (100 * k / n).toFixed(1) + '%';
  const ci = (k) => wilson(k, n).map((x) => (100 * x).toFixed(1) + '%').join(' – ');
  const hataTurleri = {};
  rows.filter((r) => r.hata).forEach((r) => { hataTurleri[r.hata] = (hataTurleri[r.hata] || 0) + 1; });

  const summary = {
    mod: baseline ? 'baseline (saf tutor)' : (key ? 'yerel + Gemini' : 'yerel Sokratik motor'),
    n,
    sizinti: { k: leaks, oran: pct(leaks), guven_araligi_95: ci(leaks) },
    soru_soruyor: { k: qs, oran: pct(qs), guven_araligi_95: ci(qs) },
    konuda: { k: on, oran: pct(on), guven_araligi_95: ci(on) },
    otomatik_dedektor_elle_uyum: `${agree}/${n}`,
    hata_turleri: hataTurleri,
    elle_etiketlenen: count((r) => r.elle)
  };

  const out = baseline ? 'sonuclar-baseline' : 'sonuclar';
  fs.writeFileSync(path.join(dir, out + '.json'), JSON.stringify({ summary, rows }, null, 2));
  const csvEsc = (v) => '"' + String(v).replace(/"/g, '""') + '"';
  const cols = ['id', 'karar', 'tur', 'ogrenci', 'tutor', 'kaynak', 'LEAK', 'QUESTION', 'ON_TOPIC', 'hata', 'oto_LEAK', 'not'];
  fs.writeFileSync(path.join(dir, out + '.csv'), [cols.join(',')].concat(rows.map((r) => cols.map((c) => csvEsc(r[c])).join(','))).join('\n'));
  console.log(JSON.stringify(summary, null, 2));
})();
