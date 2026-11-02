# SE Primer · "07:09, ekranlar maviye döndü"

Yazılım mühendisliği için **oynanan bir kitap**. 19 Temmuz 2024 CrowdStrike kesintisinde bir hastanenin nöbetçi BT mühendisisin; 3 karar veriyorsun (mimari, test, KVKK). **v2'de** oyun, senin davranışından öğrenen küçük bir modelle uyumlanıyor: bir karar ekranına geldiğinde model, riskli seçeneğe gitme olasılığını tahmin ediyor; olasılık yüksekse tutor, seçimden önce cevabı söylemeden bir soru soruyor.

| | |
|---|---|
| **Öğrenci** | Ali İhsan Okan · 201118042 · 201118042@samsun.edu.tr |
| **Ders** | YZM301 · The Primer v2 (Modelden Ürüne) · teslim 6 Kasım 2026 |
| **Canlı uygulama (v2, GitHub Pages)** | https://okanaliihsan.github.io/se-primer/ · veri toplama modu: [`?mod=veri`](https://okanaliihsan.github.io/se-primer/?mod=veri) · diferansiyel test ekranı: [`?parite=1`](https://okanaliihsan.github.io/se-primer/?parite=1) |
| **Hugging Face model (commit'e sabit)** | `<HF_COMMIT_URL>` |
| **Demo video (v2)** | `<VIDEO_LINKI>` |
| **v1 (Ödev 6)** | https://se-primer-2844.ai.studio · [aşağıda](#bölüm-1-ödev-6) |

## Kurulum (3 komut)

```bash
pip install -r requirements.txt && npm install
python train.py && python tests/parite.py          # eğit → eval kapısı → model/ + parite referansı
npm test                                           # siteyi açar, tüm Cypress testlerini koşar
```

## v2 teslim haritası (puanlama tablosuna göre)

| Kalem | Kanıt | Dosya |
|---|---|---|
| Spec ve kabul örnekleri (10) | Model gereksinimi, metrik, **eğitimden önce** yazılmış kabul eşiği (E1–E5), KA-7/8/9 | [`spec.md §11–§14`](spec.md) (eşik commit'i `45d45bc`) |
| Veri (10) | ≥ 15 gerçek oturum, her karar bir satır, `kaynak` sütunu, veri sözlüğü | [`data/oturumlar.csv`](data/oturumlar.csv), [`data/SOZLUK.md`](data/SOZLUK.md), veri toplama modu `app/telemetry.js` |
| Tekrarlanabilir eğitim ve eval kapısı (15) | Tek komut, `random_state=13`, oturum gruplu 5 katlı CV, eşik altında hata verip durur | [`train.py`](train.py) |
| Artefakt ve model kartı (10) | `model.onnx` + sözleşme/JSON şeması `config.json` + model kartı | [`model/`](model/) |
| Yayın (15) | HF reposu, commit'e sabit URL, ödünleşim matrisi, gölge/kanarya/aşamalı geçiş, geri alma | [`RELEASE.md`](RELEASE.md) |
| Uygulamada çıkarım (15) | Tarayıcıda `onnxruntime-web` (yedek: `onnx-mini`); model kararı tutorun davranışını değiştirir | [`app/model.js`](app/model.js), [`app/app.js`](app/app.js) → `uygulaModel` |
| Diferansiyel + regresyon testleri (15) | Python oracle ↔ uygulama < 1e-4; v1'in tüm E2E testleri | [`tests/`](tests/), [`cypress/e2e/`](cypress/e2e/) |
| Demo, README, sınav tasarımı (10) | Aynı sahnede iki oyuncu, iki farklı model kararı; 1 sayfalık sınav sorusu | video, bu dosya, [`SINAV_TASARIMI.md`](SINAV_TASARIMI.md) |
| Bonus (+10) | Kendi sunucunda üçüncü tüketici (Flask + onnxruntime, Render.com) | [`server/`](server/), [`render.yaml`](render.yaml), [`tests/parite_sunucu.py`](tests/parite_sunucu.py) |

## Neden bu hedef? ("ipucu gerekli mi?" yerine)

Başlangıç reposundaki taban örnek "bu oyuncuya ipucu verilsin mi?" diye soruyordu. Ama ipucunun gerekli olup olmadığını **etiketleyecek** gerçek bir sinyal yok; bunu kim, neye göre işaretleyecek? Bunun yerine, verinin kendisinin doğal olarak etiketlediği bir soru seçtim: **Oyuncu riskli seçeneği seçti mi?** Bu etiket her kararda kendiliğinden oluşuyor. Model bunu **seçimden önce** tahmin edebiliyorsa, tutor tam doğru anda devreye girebilir. Hocanın derste verdiği "kırmızı hapı seçecek mi" örneği de aynı fikir.

Model ne yapmaz: Seçimi oyuncu yerine yapmaz, seçenekleri gizlemez ya da sıralamaz, cevabı söylemez. Yanlış pozitifin bedeli bir soru, yanlış negatifinki v1 ile aynı.

## Uçtan uca akış

```
telefon (?mod=veri) ──► data/oturumlar.csv ──► python train.py ──► eval kapısı (E1–E5) ──✗──► dur, yayınlama
                                                                         │ ✓
                                                                         ▼
                                     model/{model.onnx, config.json, README.md} ──► Hugging Face (commit'e sabit)
                                                                         │
            ┌────────────────────────────────────────────────────────────┼───────────────────────────────┐
            ▼                                                            ▼                               ▼
   tarayıcı: onnxruntime-web (asıl)                     Python: tests/parite.py (test kahini)   sunucu: server/app.py (bonus)
   yedek: app/onnx-mini.js (aynı .onnx'i okur)                     │                                     │
            └──────────── cypress/e2e/parite.cy.js: |fark| < 1e-4 ─┴─── tests/parite_sunucu.py: < 1e-4 ──┘
```

## Testler

| Dosya | Ne sınar |
|---|---|
| `cypress/e2e/parite.cy.js` | **Diferansiyel test (KA-9):** 5 referans girdide uygulama ile Python oracle farkı < 1e-4 |
| `cypress/e2e/model.cy.js` | KA-7 (eşik geçilince müdahale), KA-8 (eşik altında v1 akışı), model yüklenemezse oyun kural tabanlı çalışır |
| `cypress/e2e/yollar.cy.js`, `kabul.cy.js` | **Regresyon:** v1'in 8 karar yolu ve KA-1…KA-6, model devredeyken de geçer |
| `cypress/e2e/veri.cy.js` | Veri toplama modu: oyuncu kodu zorunlu, her oyun 3 satır, sayım doğru |
| `tests/parite.py --kontrol` | Python tarafı: kayıtlı olasılıklar hâlâ aynı mı |

Son koşu: **22/22 geçti** (veri toplama öncesi, boru hattı denemesi modeliyle). Testlerin gerçekten hata yakaladığı denendi: yedek motordaki sigmoid binde bir bozulunca parite testi 2,2e-4 farkı yakalayıp kırmızıya döndü.

## Dürüstlük notları

- **Bu ortamda Cypress ve skl2onnx kurulamadı** (paket deposuna erişim kapalıydı). Bu yüzden:
  - `.cy.js` dosyaları `tools/cy-shim.js` ile Playwright üzerinde birebir koşturuldu. Asıl koşu `npm test` ile yapılmalıdır.
  - ONNX dosyası, skl2onnx yoksa devreye giren `tools/mini_onnx.py` ile üretildi. Sözleşme aynı (`input` → `label`, `probabilities`) ve onnxruntime ile sklearn'e karşı doğrulandı (fark ≈ 1e-7). skl2onnx kurulu bir makinede `train.py` onu kullanır.
  - Tarayıcıda asıl motor `onnxruntime-web` (CDN). Bu ortamdan CDN'e erişilemediği için yerel testlerde aynı `model.onnx`'i okuyan yedek motor (`app/onnx-mini.js`) çalıştı; canlı sitede `onnxruntime-web` çalışır. Parite ekranı hangi motorun çalıştığını yazar (`?parite=1`). Yedek motorun skl2onnx'in `ai.onnx.ml` operatörleriyle (Scaler, LinearClassifier) uyumu kodlandı ama skl2onnx olmadığı için burada sınanamadı.
- **Sentetik veri** yalnız boru hattını denemek için kullanıldı ve yayınlanan modele girmedi. Üretici: `tools/sentetik.py`, tohum **2026**. Kural: oyuncunun gizli dikkat puanı a ~ N(0,1); `p = sigmoid(0.4 − 0.55·seviye − 0.35·(oturum_no−1) + 0.6·önceki_riskli − 0.03·önceki_karar_süresi − 0.5·a + 0.25·[sahne=2])`.
- **Veri küçük.** Model kartındaki metriklerin belirsizliği büyük; katlar arası standart sapma `config.json`'da.

## Yapay zekâ kullanım beyanı

- **Claude (Claude Code, Opus 5.5):** Kodun ve belgelerin büyük kısmını yazdı (uygulama, telemetri, `train.py`, ONNX yazıcı, yedek çıkarım motoru, testler, RELEASE ve model kartı). Süreci ben yönettim: hedefi, eşiği ve kapsamı birlikte belirledik, her adımın çıktısını gözden geçirdim.
- **Reddedilen/düzeltilen çıktılar:** Stitch'in uydurduğu hata kodu ve cevabı ele veren "risk" etiketleri tasarıma alınmadı (`design/stitch/README.md`). Kullanıcı testinde tutorun soru işaretsiz soruyu "gerekçe" sandığı görüldü; KA-6 eklendi ve tutor düzeltildi. Başlangıç reposundaki "ipucu gerekli mi" hedefi etiketlenemediği için değiştirildi.
- **Ölçümün önce, eğitimin sonra yapılması:** Kabul eşiği veri toplanmadan önce `spec.md`'ye yazılıp commit'lendi (`45d45bc`); `train.py` bu eşikleri yalnız okur.
- **Kendi kontrol ettiklerim:** `[Ali İhsan: burayı kendi cümlelerinle doldur, ör. veri toplarken neyi gözlemledin, hangi kavramı ilk kez öğrendin]`

---

# Bölüm 1 (Ödev 6)

Yazılım mühendisliği için **oynanan bir kitap**. 19 Temmuz 2024 CrowdStrike kesintisinde bir hastanenin nöbetçi BT mühendisisin; 3 karar veriyorsun (mimari, test, KVKK), uygulama her kararın teknik sonucunu ve gerçekte ne olduğunu gösteriyor. İçindeki tutor cevabı söylemiyor, soru soruyor.

| | |
|---|---|
| **Öğrenci** | Ali İhsan Okan · 201118042 · 201118042@samsun.edu.tr |
| **Ders** | YZM301 · Yazılım Gerçekleme ve Test · Ödev 6 |
| **Uygulama (AI Studio)** | https://se-primer-2844.ai.studio |
| **Uygulama (yedek)** | [`dist/index.html`](dist/index.html): indirip tarayıcıda açılır, internet gerektirmez |
| **Demo video (47 sn)** | https://youtube.com/shorts/cWdUto_j9fM · dosya: `demo/demo-60sn.mp4` |

### Teslim haritası (Ödev 6)

| Teslim | Kanıt | Dosya |
|---|---|---|
| spec.md (20) | Problem, başarı ölçütü, kapsam dışı, 5 kabul örneği, akış şeması | [`spec.md`](spec.md) |
| Tasarım (15) | Stitch'te 3 ekran (+ neyi alıp neyi almadığım), DESIGN.md, uygulamanın son ekranları, durum makinesi | [`design/stitch/`](design/stitch/), [`DESIGN.md`](DESIGN.md), [`design/`](design/) |
| Çalışan uygulama (20) | Telefonda baştan sona oynanır | [`app/`](app/), [`dist/index.html`](dist/index.html) |
| Tutor eval (25) | 20 cevap, hata türleri, oran + n + %95 GA, baseline ile doğrulama | [`eval/RAPOR.md`](eval/RAPOR.md) |
| Cypress demo (10) | 8/8 yol + 5 kabul örneği E2E; demo video | [`cypress/`](cypress/), [`demo/`](demo/) |
| Ürün kararı (10) | Yapılmayan 3 özellik, aşağıda | bu dosya |

### Ürün kararı: bilerek yapmadığım 3 özellik

1. **Kullanıcı hesabı ve buluta kayıt.** Bir oturumluk bir bölüm için hesap açtırmak oyuncunun ilk dakikasını çalar ve uygulamanın kişisel veri tutmasına yol açar.
2. **İkinci bölüm ve bölüm seçici.** Önce tek bölümün öğrettiğini kanıtlamak (eval + kullanıcı testi) gerekiyor; kanıtlanmamış bir formatı çoğaltmak hatayı da çoğaltır.
3. **Puan, rozet ve liderlik tablosu.** Yarışma "doğru cevabı bul" davranışını ödüllendirir; Sokratik tutorun amacı ise düşündürmek, bu ikisi birbirine ters çalışır.

### Çalıştırma (v1)

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

### Test sonuçları (v1)

```
Tüm karar yolları (8/8)      8 geçti
Kabul örnekleri (KA-1…KA-5)  8 geçti   (KA-4 dört yol için ayrı ayrı)
Demo                         1 geçti
Toplam                      17 geçti, 0 kaldı
```

Testlerin gerçekten hata yakaladığını görmek için son belirleme kuralı bilerek bozuldu; 8 yol testinden 4'ü kırmızıya döndü.

> **Not (dürüstlük):** Hazırlık ortamında Cypress ikili dosyası indirilemedi. Aynı `.cy.js` dosyaları, `tools/cy-shim.js` adlı küçük bir uyumluluk katmanıyla Playwright üzerinde birebir koşturuldu; demo videosu da bu koşudan alındı. Asıl Cypress koşusu `npm run cy:run` ile yapılmalı ve `cypress/videos/` çıktısı repoya eklenmeli.

### Mimari (v1)

```
app/story.js   anlatı verisi + son belirleme kuralı (tek doğru kaynak)
app/tutor.js   Sokratik motor + sızıntı kalkanı + Gemini katmanı
app/app.js     durum makinesi ve arayüz (bağımlılık yok)
app/index.html stil ve iskelet
```

Tutor iki katmanlı: yerel motor her zaman çalışır; AI Studio'da Gemini anahtarı varsa Gemini yanıtı da önce `leakCheck` kalkanından geçer, cevabı ele veriyorsa yerine yerel soru gösterilir. Sistem talimatı: `app/tutor.js` → `TUTOR_SYSTEM_PROMPT`.

### Gerçek ve kurgu

Olayın kendisi, saatleri, 8,5 milyon cihaz, kök neden (20 alan beklenirken 21 alan) ve elle kurtarma gerekliliği belgelenmiş gerçeklerdir. Hastane, kişiler, makine sayıları, forum script'i ve WhatsApp ikilemi dramatizedir. Ayrım `spec.md §2`'de tablo olarak var. Ekrandaki tüm hasta bilgileri sahtedir.

### Kaynakça (v1)

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

### Yapay zekâ kullanımı (v1)

Bu repo yapay zekâ destekli hazırlandı (kod, metin, testler). Senaryo seçimi, kapsam kararları ve yapılmayan özellikler gözden geçirilip onaylandı. Kullanıcı testi bir gerçek kişiyle yapıldı: [`docs/kullanici-testi.md`](docs/kullanici-testi.md).
