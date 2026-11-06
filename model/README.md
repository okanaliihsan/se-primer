---
library_name: sklearn
tags: [onnx, tabular-classification, education, se-primer]
pipeline_tag: tabular-classification
license: mit
---

# SE Primer v2 · Riskli seçim tahmini

> ⚠️ **Durum: REDDEDİLDİ · GÖLGE ADAY.** Bu model kabul eşiğini geçemedi: E2 ROC-AUC 0.557 < 0.65; E3 dengeli doğruluk 0.542 < 0.6. Uygulamada yalnız **gölge modda** çalışır: tahmin yapar ve gösterilir/kaydedilir, ama oyunun davranışını **değiştirmez**. Gerçek bir kararda kullanmayın. Gerekçe: spec.md §15, RELEASE.md.

Oyuncu bir karar ekranına geldiğinde riskli seçeneği seçme olasılığını tahmin eder. Yalnız eğitim uygulamasındaki tutorun ne zaman soru soracağına yardım eder; öğrenci hakkında karar vermek için KULLANILMAZ.

## Amaç
SE Primer, yazılım mühendisliği öğrencilerine bir kriz senaryosunda (19 Temmuz 2024 CrowdStrike kesintisine dayalı) karar verdiren etkileşimli bir kitaptır. Bu model, oyuncu bir karar ekranına geldiği anda **riskli seçeneği seçme olasılığını** tahmin eder. Olasılık 0.50 ve üstündeyse uygulamadaki tutor, seçimden önce cevabı söylemeden bir Sokratik soru sorar.

## Girdiler (sıra = sözleşme)
| # | Ad | Anlam | Birim |
|---|---|---|---|
| 1 | `seviye` | Seviye (0 yeni, 1 orta, 2 deneyimli) | kod |
| 2 | `sahne_no` | Karar numarası (1 mimari, 2 test, 3 KVKK) | kod |
| 3 | `oturum_no` | Oyuncunun kaçıncı oyunu | adet |
| 4 | `onceki_sahne_sure_sn` | Önceki ekranda geçen süre | sn |
| 5 | `onceki_karar_sure_sn` | Önceki kararın süresi | sn |
| 6 | `onceki_riskli_sayisi` | Bu oyunda önceki riskli seçim sayısı | adet |
| 7 | `tutor_mesaj_onceki` | Bu karardan önce tutora yazılan mesaj | adet |
| 8 | `ipucu_acma_onceki` | Bu karardan önce ipucu açma | adet |

Çıktı: `probabilities` float32 `[n, 2]` (sıra `classes` = ['0', '1']), `label` int64 `[n]`.

## Veri
- `data/oturumlar.csv`: uygulamanın veri toplama modunda gerçek kişilerin oynadığı oyunlar. Her satır bir karar.
- 60 satır · 20 oturum · 8 oyuncu · riskli seçim oranı 0.32
- Kaynak dağılımı: {'gercek': 20}
- Kişisel veri yok: ad, e-posta, cihaz kimliği, konum, tutora yazılan metin toplanmaz.
- Veri özeti (SHA-256): `c82b3b40a5c50537…`

## Model
`Pipeline(StandardScaler → LogisticRegression(class_weight="balanced"))`, `random_state=13`.
Eğitim: Python 3.13, scikit-learn 1.9.1. ONNX: tools/mini_onnx.py (skl2onnx yok).

## Metrikler (5 katlı, oturum gruplu çapraz doğrulama)
| Metrik | Değer | Kabul eşiği |
|---|---|---|
| ROC-AUC (ort ± std) | 0.557 ± 0.148 | ≥ 0.65 |
| Dengeli doğruluk (ort ± std) | 0.542 ± 0.053 | ≥ 0.6 |
| Taban ROC-AUC (yalnız seviye) | 0.510 | model bundan iyi olmalı |
| ONNX ↔ sklearn maks fark | 5.9e-08 | ≤ 0.0001 |

## Veriden bulgular
- Hiç değişmeyen girdiler (veride hep aynı değer, modelde etkisiz): `tutor_mesaj_onceki`, `ipucu_acma_onceki`. Veri toplarken hiçbir oyuncu tutora yazmadı ve ipucu açmadı; model bu iki davranıştan hiçbir şey öğrenemedi.
- Medyan karar süresi 5.0 sn; kararların %25'i 3 saniyenin altında verildi. Bu sürede metin okunamaz; bu kararlar davranıştan çok gürültü taşır.
- Mutlak değerce en büyük iki katsayı: `oturum_no` (-0.50), `onceki_riskli_sayisi` (-0.31). `oturum_no` negatifse: aynı kişi tekrar oynadıkça daha az riskli seçiyor, yani model kısmen "hikâyeyi ezberleme"yi öğreniyor.

## Sınırlar
- **Çok küçük veri.** 20 oturumla ölçülen her metriğin belirsizliği büyüktür; katlar arası standart sapmaya bakın.
- **Az ve benzer kişi.** Oyuncular az sayıda ve büyük ihtimalle aynı çevreden (öğrenci arkadaşları). Başka kitleye genellenmez.
- **Ezber etkisi.** Aynı kişi hikâyeyi tekrar oynadıkça cevapları öğrenir; `oturum_no`nun etkisi kısmen "deneyim" değil "ezber"dir.
- **Süreler gürültülü.** Uygulama arka plana atılırsa süre şişer.

## Kullanılmaması gereken durumlar
- Öğrenciyi **notlamak, sıralamak veya hakkında karar vermek** için. Model yalnız "bir soru sorulsun mu?" sorusuna yardım eder.
- Başka bir hikâye veya karar seti için (girdiler bu 3 karara özgü).
- Seçimi oyuncu yerine yapmak, seçenekleri gizlemek ya da sıralamak için.

## Kullanım
Commit'e sabitlenmiş URL'den indirin (sürüm: `RELEASE.md`):
```
https://huggingface.co/<kullanici>/<repo>/resolve/<commit>/model.onnx
```
```python
import onnxruntime as ort, numpy as np
s = ort.InferenceSession("model.onnx")
x = np.array([[1, 2, 1, 12.0, 20.5, 0, 1, 0]], dtype=np.float32)  # sıra: config.json → features
print(s.run(["probabilities"], {"input": x})[0][0, 1])
```
