# RELEASE · SE Primer risk modeli

| | |
|---|---|
| Sürüm | **v2.0.0-golge**: ilk model adayı. **Eval kapısını geçemedi → yalnız gölge modda yayında** (oyunu değiştirmez) |
| Model reposu | `https://huggingface.co/aliihsanokan/se-primer-risk` |
| Sabit commit | `471548857ca8f6b0c58f190a605a913da1f710e2` |
| Tüketicilerin indirdiği URL | `https://huggingface.co/aliihsanokan/se-primer-risk/resolve/471548857ca8f6b0c58f190a605a913da1f710e2/model.onnx` |
| Sözleşme | `.../resolve/471548857ca8f6b0c58f190a605a913da1f710e2/config.json` (özellik sırası, sınıflar, JSON şeması, karar eşiği, metrikler) |
| Eğitim verisi | `data/oturumlar.csv`, SHA-256 `config.json → veri.sha256` |
| Eval kapısı | spec.md §12 (E1–E5), eğitimden önce yazıldı (commit `45d45bc`). Sonuç: **reddedildi** (E2 AUC 0,557 < 0,65; E3 dengeli doğruluk 0,542 < 0,60). Ayrıntı: spec.md §15 |

## Bu sürümün durumu (önce bunu okuyun)

Model iki kez eğitildi ve iki kez de **eval kapısında reddedildi** (15 oturumda E3, 20 oturumda E2+E3). Eşik düşürülmedi. Aday, `python train.py --golge-aday` ile **gölge aday** olarak paketlendi (`config.json → "mod": "golge"`) ve bu haliyle yayınlandı:

- Uygulama modeli **gerçekten çalıştırır**: her karar ekranında olasılığı hesaplar, "müdahale ederdi/etmezdi" kararını rozette gösterir ve veri toplama modunda `model_p` sütununa yazar.
- Ama müdahale kartı ve ipucu açılışı **devre dışıdır**. Oyuncunun deneyimi v1 ile aynıdır.
- Yani aşağıdaki "Yeni sürümü güvenle devreye alma" planının **1. adımı (gölge dağıtım) bu sürümde fiilen uygulanmaktadır.** Kanarya adımına ancak bir aday eşiği geçince geçilir.

## v2.0'da ne değişti?

- **v1.x (kural):** Uyum yalnız girişteki 3 soruya bağlıydı. "Yeni başladım" diyen herkes her kararda aynı ipucunu görüyordu; "deneyimli" diyen hiç görmüyordu. Oyunun içindeki davranış hiç kullanılmıyordu.
- **v2.0 (model):** Her karar ekranı açıldığında, oyuncunun o ana kadarki davranışından (önceki ekranda ne kadar kaldığı, önceki kararı ne kadar sürede verdiği, kaç riskli seçim yaptığı, tutora kaç kez yazdığı, ipucu açıp açmadığı, kaçıncı oyunu olduğu) **riskli seçeneği seçme olasılığı** tahmin edilir. Olasılık ≥ 0,50 ise tutor seçimden önce bir soru sorar ("orta" seviyede ipucu da açılır). Altındaysa v1 akışı aynen sürer. **Bu sürümde bu politika gölgede: hesaplanır, uygulanmaz** (yukarıya bakın).
- **Değişmeyen:** Hikâye, sonlar, tutorun "cevabı söylemez" kuralı ve v1'in tüm E2E testleri (regresyon).

## Neden `main` değil, commit?

`main` dalı hareket eder: biri yeni bir model yüklerse, uygulama ertesi açılışta habersizce onu kullanır. Yani bugün geçen parite testi yarın, kod hiç değişmeden kırılabilir. Commit'e sabitlenmiş URL değişmez: **aynı URL = aynı bayt = aynı tahmin.** Yeni sürüm, uygulamadaki URL bilerek değiştirilince yayına girer (`app/model.js → KAYNAK.hf`, `server` için `MODEL_URL`).

## Geri alma (rollback)

Bir sorun çıkarsa (parite testi kırılırsa, müdahale oranı beklenmedik biçimde artarsa, oyuncular şikâyet ederse):

1. **Anında (1 dakika):** `app/model.js` içinde `KAYNAK.hf` bir önceki commit URL'sine döndürülür → `node tools/build.js` → commit + push. GitHub Pages 1–2 dakikada yeni sürümü sunar. Sunucu için Render'da `MODEL_URL` önceki commit'e çekilir ve servis yeniden başlatılır.
2. **Model hiç kullanılmasın:** `KAYNAK.hf = null` ve sitedeki `model/` kopyası kaldırılır → uygulama yedek akışa (v1 kuralları) düşer. Oyun oynanabilir kalır (`cypress/e2e/model.cy.js` → "Model yüklenemezse…" testi bunu güvenceye alır).
3. Hugging Face'te hiçbir şey silinmez: eski commit'ler yerinde durduğu için geri dönüş her zaman mümkündür.

| Sürüm | HF commit | Durum |
|---|---|---|
| v2.0.0-golge | `471548857ca8f6b0c58f190a605a913da1f710e2` | yayında, **yalnız gölge** (eval kapısı: reddedildi) |
| v1.x | — (model yok, kural tabanlı) | yedek akış |

## Yeni sürümü güvenle devreye alma

Bir sonraki aday (v2.1) bu sırayla devreye alınır. **1. adım şu an v2.0.0-golge ile fiilen çalışıyor**; 2. ve 3. adımlar, eşiği geçen bir aday için plandır:

**1. Gölge dağıtım (shadow).** v2.1, v2.0 ile birlikte tarayıcıya iner. Her karar ekranında **iki model de** çalışır, ama oyuncuya yalnız v2.0'ın kararı uygulanır. v2.1'in olasılığı `oturumlar.csv`'ye ayrı bir sütun (`model_p_golge`) olarak yazılır. Kabul ölçütü: ≥ 30 oturumda iki modelin müdahale kararları en az %80 örtüşür, ayrıştığı yerlerde v2.1'in tahmini gerçek seçime daha yakındır (gerçek etiket zaten veride var).
**2. Kanarya (%5).** Oturum kimliğinin özetine göre oyuncuların %5'i v2.1'i gerçekten kullanır (`hash(oturum_id) % 100 < 5`). Kimin hangi sürümde olduğu `surum` sütununda yazılır. Bir hafta izlenen sinyaller: müdahale oranı, müdahaleden sonra riskli seçim oranı, oyunu yarıda bırakma oranı ve konsol hataları. Müdahale oranı v2.0'ın iki katını geçerse veya yarıda bırakma artarsa → geri alma.
**3. Aşamalı geçiş (progressive rollout).** %25 → %50 → %100. Her adımda aynı sinyaller en az 15 oturum boyunca izlenir. %100'de v2.0 bir sürüm daha yedek olarak tutulur.

Dürüst not: Bu ödevdeki oyuncu sayısıyla (birkaç kişi) %5'lik bir kanarya istatistiksel olarak anlamsızdır; aynı plan, uygulama bir sınıfa veya bölüme açıldığında (yüzlerce oturum) anlam kazanır.

## Mimari karar: model nerede çalışsın?

Dersteki üç soruya göre üç seçenek:

| | **Tarayıcı** (`onnxruntime-web`, GitHub Pages) ✅ seçilen | **Cihaz içi mobil** (Expo + `onnxruntime-react-native`, gömülü) | **Kendi sunucum** (Flask + `onnxruntime`, Render.com) |
|---|---|---|---|
| **1. İnternet gerekli mi, gecikme?** | İlk açılışta model (≈1 KB) ve çıkarım kütüphanesi (wasm, megabaytlar mertebesinde) iner; sonra tarayıcı önbelleğinden gelir. Tahmin yerelde, milisaniyeler içinde. İnternet kesilirse ilk yüklemeden sonra çalışır. | İnternetsiz çalışır, ilk indirme gecikmesi yoktur (model uygulamanın içinde). Mağaza/APK kurulumu gerekir. | Her tahmin bir ağ isteğidir. Ücretsiz katmanda servis uykuya geçer; uyanması 30–60 sn sürebilir. Karar ekranında bu gecikme müdahaleyi geç gösterir. |
| **2. Veri cihazdan çıkar mı?** | **Hayır.** Özellikler yalnız tarayıcıda hesaplanır ve kullanılır. KVKK açısından en temiz yol. | **Hayır.** | **Evet.** Her karardaki davranış verisi sunucuya gider; aydınlatma metni, saklama süresi ve sunucunun yeri (yurt dışı aktarımı) düşünülmeli. |
| **3. Model gizli kalır mı?** | **Hayır.** `model.onnx` herkese açık indirilir, katsayılar okunabilir. Bu model için sorun değil: kişisel veri içermez, ticari sırrı yoktur. | **Hayır.** APK açılıp model çıkarılabilir. | **Kısmen.** Dosya inmez, ama çok sayıda istekle tersine mühendislik yapılabilir. Sunucunun kendisi de güncel tutulmazsa açık verir. |
| Maliyet | Ücretsiz (GitHub Pages + HF Hub) | Ücretsiz (Expo), ama derleme ve dağıtım zahmetli | Ücretsiz katman yavaş; ücretli katman aylık ücret |
| Bu proje için | Uygulama zaten statik bir web sayfası; tahmin anında ve çevrimdışı. | Ödevin kapsamında native uygulama yok (v1 kapsam dışı). | Bonus olarak var (`server/`), aynı sözleşme ve parite testiyle. Model gizli olmak zorunda olsaydı tercih bu olurdu. |

**Karar:** Tarayıcı. Belirleyici olan 2. soru: oyuncunun davranışı cihazından çıkmıyor ve bu model için gizlilik (3. soru) gereksiz. Feragat ettiğim şey: modelin herkese açık olması ve modeli güncellemek için sitenin yeniden yayınlanması gerekmesi. Sağlık verisiyle çalışan bir model olsaydı (dersteki diyabet örneği), aynı tabloyla kendi sunucusu seçilirdi.

## Doğrulama zinciri (bu sürüm için)

| Kontrol | Nerede | Sonuç |
|---|---|---|
| Eval kapısı E1–E4 | `train.py` | **Reddedildi** (iki deneme, `raporlar/`); gölge aday `--golge-aday` ile |
| ONNX ↔ sklearn (E5) | `train.py` | `metrics.onnx_sklearn_maks_fark` |
| Python test kahini | `tests/parite.py --kontrol` | fark < 1e-4 |
| Uygulama ↔ Python (diferansiyel) | `cypress/e2e/parite.cy.js` | 5/5 vaka < 1e-4 |
| Sunucu ↔ Python (bonus) | `tests/parite_sunucu.py <url>` | 5/5 vaka < 1e-4 |
| Regresyon | `cypress/e2e/yollar.cy.js`, `kabul.cy.js` | v1 testleri geçer |

## Kaynaklar

- Amershi vd. (2019), *Software Engineering for Machine Learning: A Case Study*, ICSE-SEIP. (Yaşayan ML yaşam döngüsü)
- Shankar vd. (2022), *Operationalizing Machine Learning: An Interview Study*. (Velocity, Validation, Versioning)
- Breck vd. (2017), *The ML Test Score*. (Üretim hazırlığı; model ve veri testleri)
- Hugging Face Hub belgeleri: `resolve/<revision>` URL'leri ve `revision` ile sürüm sabitleme.
- ONNX Runtime belgeleri: `onnxruntime-web` (tarayıcı), Python API.
- Sommerville, *Software Engineering* (10. baskı), Bl. 17 Dağıtık yazılım, Bl. 25 Konfigürasyon yönetimi (sürüm ve sürüm sabitleme).
