/* SE Primer v2 · Modelin uygulamadaki tüketicisi (çıkarım / inference).
   Sözleşme: model/config.json → features (sıra), classes, karar_esigi.
   Model dosyası önce Hugging Face'teki COMMIT'E SABİTLENMİŞ URL'den, olmazsa sitedeki kopyadan alınır.
   Motor: onnxruntime-web (asıl); yüklenemezse OnnxMini (aynı model.onnx'i okuyan yedek motor). */
(function (root) {
  const KAYNAK = root.SE_PRIMER_MODEL || {
    // RELEASE.md ile aynı tutulur. Commit değişmeden model değişmez (sürüm sabitleme).
    hf: null,          // ör. 'https://huggingface.co/<kullanici>/se-primer-risk/resolve/<commit>/'
    yerel: 'model/'    // GitHub Pages'teki kopya (yedek)
  };

  const durum = { hazir: false, motor: null, kaynak: null, config: null, hata: null, oturum: null };
  let yukleniyor = null;

  const q = new URLSearchParams(root.location ? root.location.search : '');

  async function jsonAl(url) { const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); }

  async function oturumAc(taban) {
    const config = await jsonAl(taban + 'config.json');
    const zorlaMini = q.get('motor') === 'mini';
    if (!zorlaMini && root.ort && root.ort.InferenceSession) {
      try {
        const s = await root.ort.InferenceSession.create(taban + 'model.onnx');
        return { config, motor: 'onnxruntime-web', run: async (x) => {
          const t = new root.ort.Tensor('float32', Float32Array.from(x), [1, x.length]);
          const out = await s.run({ input: t });
          return Array.from(out.probabilities.data);
        } };
      } catch (e) { /* yedek motora düş */ }
    }
    const s = await root.OnnxMini.Session.create(taban + 'model.onnx');
    return { config, motor: 'onnx-mini (yedek)', run: async (x) => Array.from(s.run({ input: { dims: [1, x.length], data: x } }).probabilities.data) };
  }

  function yukle() {
    if (yukleniyor) return yukleniyor;
    yukleniyor = (async () => {
      if (q.get('model') === 'kapali') { durum.hata = 'kapalı (?model=kapali)'; return durum; }
      const adaylar = [KAYNAK.hf, KAYNAK.yerel].filter(Boolean);
      for (const taban of adaylar) {
        try {
          const o = await oturumAc(taban);
          Object.assign(durum, { hazir: true, motor: o.motor, kaynak: taban, config: o.config, oturum: o });
          return durum;
        } catch (e) { durum.hata = String(e.message || e); }
      }
      return durum;
    })();
    return yukleniyor;
  }

  function esik() {
    const e = q.get('esik');
    if (e !== null && e !== '' && !isNaN(+e)) return +e;
    return durum.config && typeof durum.config.karar_esigi === 'number' ? durum.config.karar_esigi : 0.5;
  }

  /* Gölge mod: eval kapısını geçemeyen aday (config.mod === 'golge') çalışır ve tahmin yapar,
     ama oyunun davranışını DEĞİŞTİREMEZ. Tek istisna: testlerin ve demonun müdahale politikasını
     gösterebilmesi için açık bir URL parametresi (?golge=kapali). Canlı kullanıcı bunu görmez. */
  function golge() {
    if (q.get('golge') === 'kapali') return false;
    return !!(durum.config && durum.config.mod === 'golge');
  }

  /* ozellikler: { ad: değer } → riskli seçim olasılığı (sınıf "1") */
  async function tahmin(ozellikler) {
    await yukle();
    if (!durum.hazir) return null;
    const x = durum.config.features.map((f) => {
      const v = ozellikler[f.name];
      if (typeof v !== 'number' || !isFinite(v)) throw new Error('sözleşme ihlali: eksik özellik ' + f.name);
      return v;
    });
    const p = await durum.oturum.run(x);
    const i = durum.config.classes.indexOf('1');
    return p[i < 0 ? p.length - 1 : i];
  }

  const api = { yukle, tahmin, esik, golge, durum };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RiskModeli = api;
})(typeof window !== 'undefined' ? window : globalThis);
