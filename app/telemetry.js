/* SE Primer v2 · Telemetri ve veri toplama modu.
   Her karar bir satır (data/oturumlar.csv ile aynı sütunlar, bkz. data/SOZLUK.md).
   KVKK: ad, e-posta, cihaz kimliği, konum, IP TOPLANMAZ. Oturum kimliği rastgele üretilir.
   Veriler yalnızca bu cihazdaki tarayıcıda (localStorage) durur; dışarı ancak oyunu yöneten kişi
   "CSV indir / Kopyala" ile çıkarır. */
(function (root) {
  const KEY = 'se-primer-veri-v2';
  const SURUM = 'app-2.0';

  const SUTUNLAR = [
    'oturum_id', 'oyuncu_kodu', 'oturum_no', 'kaynak', 'surum', 'tarih',
    'seviye', 'rol', 'hedef', 'sahne_no', 'riskli_ustte',
    'onceki_sahne_sure_sn', 'onceki_karar_sure_sn', 'onceki_riskli_sayisi',
    'tutor_mesaj_onceki', 'ipucu_acma_onceki',
    'karar_sure_sn', 'tutor_mesaj_bu_sahne', 'sure_doldu',
    'model_p', 'model_mudahale', 'riskli_secti'
  ];

  // Modelin girdi olarak kullandığı, karar ekranı AÇILDIĞI ANDA bilinen sütunlar (sıra = model sözleşmesi).
  const OZELLIKLER = [
    'seviye', 'sahne_no', 'oturum_no', 'onceki_sahne_sure_sn', 'onceki_karar_sure_sn',
    'onceki_riskli_sayisi', 'tutor_mesaj_onceki', 'ipucu_acma_onceki'
  ];

  const SEVIYE_KOD = { yeni: 0, orta: 1, deneyimli: 2 };

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{"satirlar":[],"oyuncular":{}}'); }
    catch (e) { return { satirlar: [], oyuncular: {} }; }
  }
  function save(db) { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }

  function rastgeleId() {
    const a = new Uint8Array(4);
    (root.crypto || {}).getRandomValues ? root.crypto.getRandomValues(a) : a.forEach((_, i) => { a[i] = Math.random() * 256; });
    return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  const r1 = (x) => Math.round(x * 10) / 10;

  /* Bir oturumun canlı ölçümleri. */
  function yeniOturum(oyuncuKodu, profil) {
    const db = load();
    const kod = (oyuncuKodu || '').trim().toUpperCase().slice(0, 8) || null;
    let no = 1;
    if (kod) { no = (db.oyuncular[kod] || 0) + 1; }
    return {
      id: rastgeleId(), kod, no, profil,
      ekranAcildi: Date.now(), oncekiEkranSure: 0, oncekiKararSure: 0, riskliSayisi: 0,
      tutorToplam: 0, tutorBuSahne: 0, ipucuToplam: 0, satirlar: []
    };
  }

  /* Karar ekranı açılırken çağrılır: modelin göreceği özellikleri döndürür. */
  function kararEkraniAcildi(o, sahneNo) {
    const simdi = Date.now();
    o.oncekiEkranSure = r1((simdi - o.ekranAcildi) / 1000);
    o.ekranAcildi = simdi;
    o.tutorOnceki = o.tutorToplam;
    o.ipucuOnceki = o.ipucuToplam;
    o.tutorBuSahne = 0;
    return {
      seviye: SEVIYE_KOD[o.profil.level],
      sahne_no: sahneNo,
      oturum_no: o.no,
      onceki_sahne_sure_sn: o.oncekiEkranSure,
      onceki_karar_sure_sn: o.oncekiKararSure,
      onceki_riskli_sayisi: o.riskliSayisi,
      tutor_mesaj_onceki: o.tutorOnceki,
      ipucu_acma_onceki: o.ipucuOnceki
    };
  }

  function tutorMesaji(o) { if (o) { o.tutorToplam++; o.tutorBuSahne++; } }
  function ipucuAcildi(o) { if (o) o.ipucuToplam++; }

  /* Seçim yapılınca: satırı tamamla. riskli = B seçeneği (her kararda daha kötü sonuçlanan yol). */
  function secimYapildi(o, ozellikler, ek) {
    const simdi = Date.now();
    const sure = r1((simdi - o.ekranAcildi) / 1000);
    const riskli = ek.secim === 'B' ? 1 : 0;
    const satir = Object.assign({
      oturum_id: o.id, oyuncu_kodu: o.kod || '', oturum_no: o.no, kaynak: 'gercek', surum: SURUM,
      tarih: new Date().toISOString().slice(0, 10),
      rol: o.profil.role, hedef: o.profil.goal, riskli_ustte: ek.riskliUstte ? 1 : 0,
      karar_sure_sn: sure, tutor_mesaj_bu_sahne: o.tutorBuSahne, sure_doldu: ek.sureDoldu ? 1 : 0,
      model_p: ek.modelP == null ? '' : Math.round(ek.modelP * 10000) / 10000,
      model_mudahale: ek.mudahale ? 1 : 0, riskli_secti: riskli
    }, ozellikler);
    o.satirlar.push(satir);
    o.oncekiKararSure = sure;
    o.riskliSayisi += riskli;
    o.ekranAcildi = simdi;
    return satir;
  }

  /* Oturum sona erince (veri modunda) kalıcı kayda yaz. Yarım kalan oturum kaydedilmez. */
  function oturumuKaydet(o) {
    if (!o || o.satirlar.length === 0) return 0;
    const db = load();
    db.satirlar.push(...o.satirlar);
    if (o.kod) db.oyuncular[o.kod] = o.no;
    save(db);
    return o.satirlar.length;
  }

  function ozet() {
    const db = load();
    const oturumlar = new Set(db.satirlar.map((s) => s.oturum_id));
    const kisi = {};
    db.satirlar.forEach((s) => { const k = s.oyuncu_kodu || '?'; kisi[k] = kisi[k] || new Set(); kisi[k].add(s.oturum_id); });
    return { satir: db.satirlar.length, oturum: oturumlar.size, kisi: Object.fromEntries(Object.entries(kisi).map(([k, v]) => [k, v.size])) };
  }

  function csv() {
    const db = load();
    const esc = (v) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return [SUTUNLAR.join(',')].concat(db.satirlar.map((s) => SUTUNLAR.map((c) => esc(s[c])).join(','))).join('\n') + '\n';
  }

  function sil() { try { localStorage.removeItem(KEY); } catch (e) {} }

  const api = { SUTUNLAR, OZELLIKLER, SURUM, yeniOturum, kararEkraniAcildi, tutorMesaji, ipucuAcildi, secimYapildi, oturumuKaydet, ozet, csv, sil };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Telemetri = api;
})(typeof window !== 'undefined' ? window : globalThis);
