# SE Primer · Bölüm 1: "07:09, ekranlar maviye döndü"

Yazılım mühendisliği için **oynanan bir kitap**. 19 Temmuz 2024 CrowdStrike kesintisinde bir hastanenin nöbetçi BT mühendisisin; 3 karar veriyorsun (mimari, test, KVKK), uygulama her kararın teknik sonucunu ve gerçekte ne olduğunu gösteriyor. İçindeki tutor cevabı söylemiyor, soru soruyor.

| | |
|---|---|
| **Öğrenci** | Ali İhsan Okan · 201118042 · 201118042@samsun.edu.tr |
| **Ders** | YZM301 · Yazılım Gerçekleme ve Test · Ödev 6 |
| **Uygulama (AI Studio)** | https://se-primer-2844.ai.studio |
| **Uygulama (yedek)** | [`dist/index.html`](dist/index.html): indirip tarayıcıda açılır, internet gerektirmez |
| **Demo video (47 sn)** | https://youtube.com/shorts/cWdUto_j9fM · dosya: `demo/demo-60sn.mp4` |

## Teslim haritası (puanlama tablosuna göre)

| Teslim | Kanıt | Dosya |
|---|---|---|
| spec.md (20) | Problem, başarı ölçütü, kapsam dışı, 5 kabul örneği, akış şeması | [`spec.md`](spec.md) |
| Tasarım (15) | Stitch'te 3 ekran (+ neyi alıp neyi almadığım), DESIGN.md, uygulamanın son ekranları, durum makinesi | [`design/stitch/`](design/stitch/), [`DESIGN.md`](DESIGN.md), [`design/`](design/) |
| Çalışan uygulama (20) | Telefonda baştan sona oynanır | [`app/`](app/), [`dist/index.html`](dist/index.html) |
| Tutor eval (25) | 20 cevap, hata türleri, oran + n + %95 GA, baseline ile doğrulama | [`eval/RAPOR.md`](eval/RAPOR.md) |
| Cypress demo (10) | 8/8 yol + 5 kabul örneği E2E; demo video | [`cypress/`](cypress/), [`demo/`](demo/) |
| Ürün kararı (10) | Yapılmayan 3 özellik, aşağıda | bu dosya |

## Ürün kararı: bilerek yapmadığım 3 özellik

1. **Kullanıcı hesabı ve buluta kayıt.** Bir oturumluk bir bölüm için hesap açtırmak oyuncunun ilk dakikasını çalar ve uygulamanın kişisel veri tutmasına yol açar.
2. **İkinci bölüm ve bölüm seçici.** Önce tek bölümün öğrettiğini kanıtlamak (eval + kullanıcı testi) gerekiyor; kanıtlanmamış bir formatı çoğaltmak hatayı da çoğaltır.
3. **Puan, rozet ve liderlik tablosu.** Yarışma "doğru cevabı bul" davranışını ödüllendirir; Sokratik tutorun amacı ise düşündürmek, bu ikisi birbirine ters çalışır.

## Çalıştırma

```bash
# 1) Tek dosyalık sürümü üret (bağımlılık yok)
node tools/build.js            # → dist/index.html, tarayıcıda doğrudan açılır

# 2) Cypress (yerel makinede)
npm install
npm run serve                  # http://localhost:8080
npm run cy:run                 # tüm E2E testleri, video: cypress/videos/
npm run cy:demo                # yalnızca demo koşusu (≈47 sn video)

# 3) Tutor eval
node eval/run-eval.js                      # yerel tutor
node eval/run-eval.js --baseline           # değerlendiricinin doğrulanması
GEMINI_API_KEY=... node eval/run-eval.js   # Gemini katmanıyla
```

## Test sonuçları

```
Tüm karar yolları (8/8)      8 geçti
Kabul örnekleri (KA-1…KA-5)  8 geçti   (KA-4 dört yol için ayrı ayrı)
Demo                         1 geçti
Toplam                      17 geçti, 0 kaldı
```

Testlerin gerçekten hata yakaladığını görmek için son belirleme kuralı bilerek bozuldu; 8 yol testinden 4'ü kırmızıya döndü.

> **Not (dürüstlük):** Hazırlık ortamında Cypress ikili dosyası indirilemedi. Aynı `.cy.js` dosyaları, `tools/cy-shim.js` adlı küçük bir uyumluluk katmanıyla Playwright üzerinde birebir koşturuldu; demo videosu da bu koşudan alındı. Asıl Cypress koşusu `npm run cy:run` ile yapılmalı ve `cypress/videos/` çıktısı repoya eklenmeli.

## Mimari

```
app/story.js   anlatı verisi + son belirleme kuralı (tek doğru kaynak)
app/tutor.js   Sokratik motor + sızıntı kalkanı + Gemini katmanı
app/app.js     durum makinesi ve arayüz (bağımlılık yok)
app/index.html stil ve iskelet
```

Tutor iki katmanlı: yerel motor her zaman çalışır; AI Studio'da Gemini anahtarı varsa Gemini yanıtı da önce `leakCheck` kalkanından geçer, cevabı ele veriyorsa yerine yerel soru gösterilir. Sistem talimatı: `app/tutor.js` → `TUTOR_SYSTEM_PROMPT`.

## Gerçek ve kurgu

Olayın kendisi, saatleri, 8,5 milyon cihaz, kök neden (20 alan beklenirken 21 alan) ve elle kurtarma gerekliliği belgelenmiş gerçeklerdir. Hastane, kişiler, makine sayıları, forum script'i ve WhatsApp ikilemi dramatizedir. Ayrım `spec.md §2`'de tablo olarak var. Ekrandaki tüm hasta bilgileri sahtedir.

## Kaynakça

1. Stephenson, N. (1995). *The Diamond Age: Or, A Young Lady's Illustrated Primer.* Bantam Spectra.
2. Y Combinator (2026). Requests for Startups, Güz 2026: "The Primer". ycombinator.com/rfs
3. American Hospital Association (19 Temmuz 2024). *CrowdStrike Technology Outage Causing Global Disruption Across Industries, Including Impacts on Hospitals and Health Systems.* aha.org
4. American Hospital Association (25 Temmuz 2024). *CrowdStrike posts preliminary post-incident report on recent global IT outage.* aha.org
5. Communications of the ACM. *How CrowdStrike Stopped Everything.* cacm.acm.org/news/how-crowdstrike-stopped-everything
6. CrowdStrike. *Falcon Content Update Remediation and Guidance Hub* (ön ve nihai kök neden analizi). crowdstrike.com
7. 6698 sayılı Kişisel Verilerin Korunması Kanunu (2016), md. 6 ve md. 12. kvkk.gov.tr
8. Sommerville, I. (2016). *Software Engineering* (10. baskı), Bölüm 5: durum makineleri. Pearson.
9. GitHub (2025). Spec Kit: spec-driven development. github.com/github/spec-kit
10. Cypress. E2E testing, screenshots and videos. docs.cypress.io
11. OpenAI (2025). Introducing study mode. openai.com
12. Ng, A. (2026, 14 Ağustos). The AI Engineering Skills Map. X / DeepLearning.AI
13. Google Labs. Stitch (stitch.withgoogle.com) · Google AI Studio (aistudio.google.com)

## Yapay zekâ kullanımı

Bu repo yapay zekâ destekli hazırlandı (kod, metin, testler). Senaryo seçimi, kapsam kararları ve yapılmayan özellikler gözden geçirilip onaylandı. Kullanıcı testi bir gerçek kişiyle yapıldı: [`docs/kullanici-testi.md`](docs/kullanici-testi.md).
