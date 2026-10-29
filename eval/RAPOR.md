# Tutor Eval Raporu · SE Primer Bölüm 1

**Soru:** Tutor cevabı ele veriyor mu? Her yanıtta soru soruyor mu?

## Yöntem

- **Veri:** 20 sentetik öğrenci cevabı (`ogrenci-cevaplari.json`), 3 karara dağılmış (k1: 7, k2: 7, k3: 6).
  Türler: cevap baskısı (4), doğru gerekçe (3), yanlış gerekçe (3), kavram sorusu (4), kısmi düşünce (3), kararsız (2), alakasız (1).
- **Etiketler:**
  - `LEAK`: Tutor hangi seçeneğin doğru/yanlış olduğunu söyledi, seçenek harfini/metnini önerdi ya da öğrencinin seçimini onayladı/reddetti.
  - `QUESTION`: Yanıtta en az bir soru var.
  - `ON_TOPIC`: Yanıt sahneyle ilgili.
  - Hata türleri (sızıntı olmayan ama kaliteyi düşüren): `genel-kalip` (öğrencinin söylediği özel şeyi ele almıyor), `dolayli-yonlendirme` (soru cevabı ima ediyor), `cift-soru`, `soruyu-duymadi`.
- **Etiketleme:** Önce otomatik dedektör (`Tutor.leakCheck`), sonra 20 yanıtın hepsi elle okunup etiketlendi (`etiketler-elle.json`, her satırda gerekçe notu).
- **Değerlendiricinin doğrulanması:** Aynı 20 cevap, cevabı doğrudan veren "saf" bir tutora verildi (`--baseline`). Dedektör 20/20 sızıntı yakaladı. Yani ölçüm aracı sızıntıyı görebiliyor; 0 sonucu aracın kör olmasından gelmiyor.

## Sonuçlar

| Ölçüm | v1 | v2 (teslim edilen) | 95% Wilson GA (v2) |
|---|---|---|---|
| Sızıntı (`LEAK`) | 0/20 (%0) | **0/20 (%0)** | %0 – %16,1 |
| Soru soruyor (`QUESTION`) | 20/20 | **20/20 (%100)** | %83,9 – %100 |
| Konuda (`ON_TOPIC`) | 20/20 | 20/20 | %83,9 – %100 |
| Otomatik dedektör ↔ elle etiket uyumu | 20/20 | 20/20 | — |
| Baseline (saf tutor) sızıntı | — | 20/20 (%100) | %83,9 – %100 |

**Hata türleri (v2, n = 20):** `dolayli-yonlendirme` 3 (#8, #11, #14) · `genel-kalip` 3 (#7, #13, #19).

**v1 → v2 değişikliği:** v1'de 5 yanıt iki soruyu üst üste soruyordu (`cift-soru`: #3, #9, #10, #15, #16) ve #20'de öğrencinin kendi sorusu ("hasta adı olmadan ekip karıştırır mı?") duyulmuyordu (`soruyu-duymadi`). v2'de seçim yanıtı tek soruya indi ve öğrenci sorusu sınıfı eklendi; bu 6 hata kayboldu. (`sonuclar-v1.csv` ↔ `sonuclar.csv`)

## Yorum

- **0/20, "hiç sızdırmaz" demek değil.** 20 örnekle gerçek sızıntı oranının %16'ya kadar çıkabileceğini dışlayamıyoruz. %5'in altında olduğunu ~%95 güvenle söylemek için sıfır sızıntılı 60 (üçler kuralı) ile 73 (Wilson) arası örnek gerekir.
- **Yerel motor yapısı gereği sızdırmıyor:** Yanıtlar önceden yazılmış sorulardan seçiliyor. Asıl risk Gemini katmanında. Bu yüzden Gemini çıktısı da aynı `leakCheck` kalkanından geçiyor; takılırsa yerel soru gösteriliyor. Gemini ile koşu: `GEMINI_API_KEY=... node eval/run-eval.js`.
- **En öğretici bulgu sızıntı değil, yönlendirme:** k2'nin "Bir şey herkese aynı anda mı gitti?" sorusu cevabı neredeyse söylüyor. Sonraki sürümde bu soru, "deneyimli" seviyede gösterilmeyecek.
- **Genel kalıp:** Öğrenci çok yaklaştığında (#7) tutor bunu fark etmiyor. Bu, kurallı motorun sınırı; Gemini katmanının asıl katkısı burada beklenir.

## Dosyalar

`ogrenci-cevaplari.json` · `etiketler-elle.json` · `run-eval.js` · `sonuclar.csv/json` (v2) · `sonuclar-v1.csv/json` · `sonuclar-baseline.csv/json`
