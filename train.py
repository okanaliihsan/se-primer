"""SE Primer v2 · Tek komutla tekrarlanabilir eğitim + eval kapısı + artefakt.

    python train.py                      # data/oturumlar.csv → model/ (eşik geçilirse)

Ne yapar (spec.md §11–§12):
  1. Veriyi okur, sözleşmeyi (sütunlar, kaynak) denetler.
  2. 5 katlı, oturum gruplu çapraz doğrulama ile ROC-AUC ve dengeli doğruluğu ölçer; tabanla kıyaslar.
  3. Kabul eşiklerinden (E1–E4) biri sağlanmazsa HATA VERİP DURUR; model/ değişmez.
  4. Geçerse tüm veriyle son modeli eğitir, model.onnx'e çevirir (E5: ONNX↔sklearn ≤ 1e-4),
     config.json (sözleşme + JSON şeması + metrikler) ve model kartını (model/README.md) yazar.

Aynı veri + aynı kod = aynı sayılar (random_state sabit, zaman damgası yok, veri özeti config'te).
"""
import argparse
import hashlib
import json
import platform
import sys
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
import sklearn
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import balanced_accuracy_score, roc_auc_score
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

KOK = Path(__file__).resolve().parent
SEED = 13
HEDEF = "riskli_secti"
GRUP = "oturum_id"
OZELLIKLER = [  # sıra = model sözleşmesi (app/telemetry.js OZELLIKLER ile aynı)
    ("seviye", "Seviye (0 yeni, 1 orta, 2 deneyimli)", "kod"),
    ("sahne_no", "Karar numarası (1 mimari, 2 test, 3 KVKK)", "kod"),
    ("oturum_no", "Oyuncunun kaçıncı oyunu", "adet"),
    ("onceki_sahne_sure_sn", "Önceki ekranda geçen süre", "sn"),
    ("onceki_karar_sure_sn", "Önceki kararın süresi", "sn"),
    ("onceki_riskli_sayisi", "Bu oyunda önceki riskli seçim sayısı", "adet"),
    ("tutor_mesaj_onceki", "Bu karardan önce tutora yazılan mesaj", "adet"),
    ("ipucu_acma_onceki", "Bu karardan önce ipucu açma", "adet"),
]
OZ = [o[0] for o in OZELLIKLER]

# spec.md §12 — eğitimden ÖNCE yazıldı (commit 45d45bc). Burada yalnız okunur.
ESIKLER = {"min_gercek_oturum": 15, "cv_auc": 0.65, "cv_dengeli_dogruluk": 0.60, "onnx_fark": 1e-4}
KARAR_ESIGI = 0.50


def model_kur():
    return Pipeline([
        ("scaler", StandardScaler()),
        ("lr", LogisticRegression(class_weight="balanced", random_state=SEED, max_iter=1000)),
    ])


def dur(mesaj, rapor=None, rapor_yolu=None):
    if rapor is not None and rapor_yolu is not None:
        rapor_yolu.parent.mkdir(parents=True, exist_ok=True)
        rapor_yolu.write_text(json.dumps(rapor, indent=2, ensure_ascii=False), encoding="utf-8")
    sys.exit(f"✗ EVAL KAPISI: {mesaj}\n  Model YAYINLANMADI; model/ klasörü değiştirilmedi.")


def capraz_dogrulama(X, y, gruplar):
    cv = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=SEED)
    auc, bal, taban = [], [], []
    for egitim, test in cv.split(X, y, gruplar):
        if y.iloc[test].nunique() < 2 or y.iloc[egitim].nunique() < 2:
            continue  # tek sınıflı katta AUC tanımsız
        m = model_kur().fit(X.iloc[egitim], y.iloc[egitim])
        p = m.predict_proba(X.iloc[test])[:, 1]
        auc.append(roc_auc_score(y.iloc[test], p))
        bal.append(balanced_accuracy_score(y.iloc[test], (p >= KARAR_ESIGI).astype(int)))
        t = model_kur().fit(X.iloc[egitim][["seviye"]], y.iloc[egitim])  # taban: yalnız seviye
        taban.append(roc_auc_score(y.iloc[test], t.predict_proba(X.iloc[test][["seviye"]])[:, 1]))
    if len(auc) < 3:
        return None
    r = lambda a: round(float(np.mean(a)), 4)
    s = lambda a: round(float(np.std(a)), 4)
    return {"cv_auc": r(auc), "cv_auc_std": s(auc), "cv_dengeli_dogruluk": r(bal), "cv_dengeli_dogruluk_std": s(bal),
            "taban_auc": r(taban), "kat_sayisi": len(auc)}


def onnx_aktar(model, X, yol: Path):
    """Önce skl2onnx (asıl yol); yoksa tools/mini_onnx.py. Her iki durumda onnxruntime ile doğrulanır."""
    import onnxruntime as ort
    try:
        from skl2onnx import to_onnx
        from skl2onnx.common.data_types import FloatTensorType
        onx = to_onnx(model, initial_types=[("input", FloatTensorType([None, X.shape[1]]))],
                      options={id(model): {"zipmap": False}}, target_opset=17)
        yol.write_bytes(onx.SerializeToString())
        uretici = f"skl2onnx {__import__('skl2onnx').__version__}"
    except ImportError:
        sys.path.insert(0, str(KOK / "tools"))
        from mini_onnx import pipeline_to_onnx
        sc, lr = model.named_steps["scaler"], model.named_steps["lr"]
        yol.write_bytes(pipeline_to_onnx(sc.mean_, sc.scale_, lr.coef_[0], lr.intercept_[0],
                                         doc="SE Primer v2 risk modeli"))
        uretici = "tools/mini_onnx.py (skl2onnx yok)"
    oturum = ort.InferenceSession(str(yol), providers=["CPUExecutionProvider"])
    p_onnx = oturum.run(["probabilities"], {"input": X.to_numpy(np.float32)})[0]
    fark = float(np.abs(p_onnx - model.predict_proba(X)).max())
    return fark, uretici


def _durum_bandi(c):
    if c.get("mod") != "golge":
        return "> **Durum: KABUL.** Eval kapısını (spec.md §12, E1–E5) geçti; uygulamada etkin."
    return ("> ⚠️ **Durum: REDDEDİLDİ · GÖLGE ADAY.** Bu model kabul eşiğini geçemedi: " + "; ".join(c["kapi_hatalari"]) +
            ". Uygulamada yalnız **gölge modda** çalışır: tahmin yapar ve gösterilir/kaydedilir, ama oyunun davranışını "
            "**değiştirmez**. Gerçek bir kararda kullanmayın. Gerekçe: spec.md §15, RELEASE.md.")


def model_karti(c):
    m = c["metrics"]
    oz = "\n".join(f"| {i + 1} | `{f['name']}` | {f['label']} | {f['birim']} |" for i, f in enumerate(c["features"]))
    return f"""---
library_name: sklearn
tags: [onnx, tabular-classification, education, se-primer]
pipeline_tag: tabular-classification
license: mit
---

# {c["title"]}

{_durum_bandi(c)}

{c["description"]}

## Amaç
SE Primer, yazılım mühendisliği öğrencilerine bir kriz senaryosunda (19 Temmuz 2024 CrowdStrike kesintisine dayalı) karar verdiren etkileşimli bir kitaptır. Bu model, oyuncu bir karar ekranına geldiği anda **riskli seçeneği seçme olasılığını** tahmin eder. Olasılık {c["karar_esigi"]:.2f} ve üstündeyse uygulamadaki tutor, seçimden önce cevabı söylemeden bir Sokratik soru sorar.

## Girdiler (sıra = sözleşme)
| # | Ad | Anlam | Birim |
|---|---|---|---|
{oz}

Çıktı: `probabilities` float32 `[n, 2]` (sıra `classes` = {c["classes"]}), `label` int64 `[n]`.

## Veri
- `data/oturumlar.csv`: uygulamanın veri toplama modunda gerçek kişilerin oynadığı oyunlar. Her satır bir karar.
- {m["n_satir"]} satır · {m["n_oturum"]} oturum · {m["n_oyuncu"]} oyuncu · riskli seçim oranı {m["pozitif_oran"]:.2f}
- Kaynak dağılımı: {c["veri"]["kaynak"]}
- Kişisel veri yok: ad, e-posta, cihaz kimliği, konum, tutora yazılan metin toplanmaz.
- Veri özeti (SHA-256): `{c["veri"]["sha256"][:16]}…`

## Model
`Pipeline(StandardScaler → LogisticRegression(class_weight="balanced"))`, `random_state={c["seed"]}`.
Eğitim: Python {c["python_version"]}, scikit-learn {c["sklearn_version"]}. ONNX: {c["onnx_uretici"]}.

## Metrikler (5 katlı, oturum gruplu çapraz doğrulama)
| Metrik | Değer | Kabul eşiği |
|---|---|---|
| ROC-AUC (ort ± std) | {m["cv_auc"]:.3f} ± {m["cv_auc_std"]:.3f} | ≥ {c["esikler"]["cv_auc"]} |
| Dengeli doğruluk (ort ± std) | {m["cv_dengeli_dogruluk"]:.3f} ± {m["cv_dengeli_dogruluk_std"]:.3f} | ≥ {c["esikler"]["cv_dengeli_dogruluk"]} |
| Taban ROC-AUC (yalnız seviye) | {m["taban_auc"]:.3f} | model bundan iyi olmalı |
| ONNX ↔ sklearn maks fark | {m["onnx_sklearn_maks_fark"]:.1e} | ≤ {c["esikler"]["onnx_fark"]} |

## Veriden bulgular
- Hiç değişmeyen girdiler (veride hep aynı değer, modelde etkisiz): {", ".join(f"`{x}`" for x in c["veri_bulgulari"]["sabit_ozellikler"]) or "yok"}. Veri toplarken hiçbir oyuncu tutora yazmadı ve ipucu açmadı; model bu iki davranıştan hiçbir şey öğrenemedi.
- Medyan karar süresi {c["veri_bulgulari"]["medyan_karar_suresi_sn"]} sn; kararların %{round(100 * c["veri_bulgulari"]["karar_suresi_3sn_alti_oran"])}'i 3 saniyenin altında verildi. Bu sürede metin okunamaz; bu kararlar davranıştan çok gürültü taşır.
- Mutlak değerce en büyük iki katsayı: {", ".join(f"`{k}` ({v:+.2f})" for k, v in sorted(c["katsayilar"].items(), key=lambda kv: -abs(kv[1]))[:2])}. `oturum_no` negatifse: aynı kişi tekrar oynadıkça daha az riskli seçiyor, yani model kısmen "hikâyeyi ezberleme"yi öğreniyor.

## Sınırlar
- **Çok küçük veri.** {m["n_oturum"]} oturumla ölçülen her metriğin belirsizliği büyüktür; katlar arası standart sapmaya bakın.
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
https://huggingface.co/aliihsanokan/se-primer-risk/resolve/<commit>/model.onnx   # <commit>: GitHub repodaki RELEASE.md
```
```python
import onnxruntime as ort, numpy as np
s = ort.InferenceSession("model.onnx")
x = np.array([[1, 2, 1, 12.0, 20.5, 0, 1, 0]], dtype=np.float32)  # sıra: config.json → features
print(s.run(["probabilities"], {{"input": x}})[0][0, 1])
```
"""


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--veri", default=str(KOK / "data" / "oturumlar.csv"))
    ap.add_argument("--cikti", default=str(KOK / "model"))
    ap.add_argument("--golge-aday", action="store_true",
                    help="Eşik geçilmezse YİNE DURUR ama artefaktı 'gölge aday' olarak yazar: uygulama modeli çalıştırır, "
                         "tahminini gösterir/kaydeder, oyunun davranışını DEĞİŞTİRMEZ (spec.md §15, ADR-10)")
    ap.add_argument("--izin-sentetik", action="store_true",
                    help="YALNIZ boru hattı denemesi: sentetik oturumlar da E1'e sayılır, config 'deneme' olarak işaretlenir")
    a = ap.parse_args()
    warnings.filterwarnings("ignore", category=UserWarning)

    veri_yolu = Path(a.veri)
    ham = veri_yolu.read_bytes()
    df = pd.read_csv(veri_yolu)
    eksik = [s for s in OZ + [HEDEF, GRUP, "kaynak"] if s not in df.columns]
    if eksik:
        sys.exit(f"✗ veri sözleşmesi: eksik sütun {eksik} (bkz. data/SOZLUK.md)")
    if not set(df["kaynak"]).issubset({"gercek", "sentetik"}):
        sys.exit("✗ veri sözleşmesi: kaynak yalnız 'gercek' | 'sentetik' olabilir")

    rapor_yolu = KOK / "_out" / "egitim_raporu.json"
    n_gercek = df.loc[df["kaynak"] == "gercek", GRUP].nunique()
    n_say = df[GRUP].nunique() if a.izin_sentetik else n_gercek
    print(f"veri: {len(df)} satır · {df[GRUP].nunique()} oturum (gerçek {n_gercek}) · riskli oranı {df[HEDEF].mean():.2f}")
    if n_say < ESIKLER["min_gercek_oturum"]:
        dur(f"E1 gerçek oturum {n_say} < {ESIKLER['min_gercek_oturum']}")

    X, y, g = df[OZ].astype(float), df[HEDEF].astype(int), df[GRUP]
    cv = capraz_dogrulama(X, y, g)
    if cv is None:
        dur("çapraz doğrulama yapılamadı (iki sınıfı da içeren en az 3 kat yok; veri çok az ya da tek sınıflı)")
    print(f"CV: ROC-AUC {cv['cv_auc']:.3f} ± {cv['cv_auc_std']:.3f} · dengeli doğruluk {cv['cv_dengeli_dogruluk']:.3f} "
          f"· taban AUC {cv['taban_auc']:.3f} · {cv['kat_sayisi']} kat")

    hatalar = []
    if cv["cv_auc"] < ESIKLER["cv_auc"]:
        hatalar.append(f"E2 ROC-AUC {cv['cv_auc']:.3f} < {ESIKLER['cv_auc']}")
    if cv["cv_dengeli_dogruluk"] < ESIKLER["cv_dengeli_dogruluk"]:
        hatalar.append(f"E3 dengeli doğruluk {cv['cv_dengeli_dogruluk']:.3f} < {ESIKLER['cv_dengeli_dogruluk']}")
    if cv["cv_auc"] <= cv["taban_auc"]:
        hatalar.append(f"E4 ROC-AUC {cv['cv_auc']:.3f} ≤ taban {cv['taban_auc']:.3f}")
    if hatalar and not a.golge_aday:
        dur(" · ".join(hatalar), {"durum": "reddedildi", "hatalar": hatalar, "cv": cv, "esikler": ESIKLER}, rapor_yolu)
    if hatalar:
        print("⚠ EVAL KAPISI GEÇİLEMEDİ: " + " · ".join(hatalar))
        print("  --golge-aday: artefakt GÖLGE ADAY olarak yazılıyor (mod=golge). Uygulama bu modelle oyunu DEĞİŞTİRMEZ.")

    model = model_kur().fit(X, y)
    cikti = Path(a.cikti)
    gecici = KOK / "_out" / "aday"
    gecici.mkdir(parents=True, exist_ok=True)
    fark, uretici = onnx_aktar(model, X, gecici / "model.onnx")
    if fark > ESIKLER["onnx_fark"]:
        dur(f"E5 ONNX↔sklearn farkı {fark:.2e} > {ESIKLER['onnx_fark']}")
    print(f"✓ ONNX ({uretici}) ↔ sklearn maks fark {fark:.1e}")

    lr = model.named_steps["lr"]
    ornek = X.median()
    config = {
        "title": "SE Primer v2 · Riskli seçim tahmini",
        "description": "Oyuncu bir karar ekranına geldiğinde riskli seçeneği seçme olasılığını tahmin eder. "
                       "Yalnız eğitim uygulamasındaki tutorun ne zaman soru soracağına yardım eder; öğrenci hakkında karar vermek için KULLANILMAZ.",
        "surum": "2.0.0",
        "deneme": bool(a.izin_sentetik),
        "durum": "reddedildi" if hatalar else "kabul",
        "mod": "golge" if hatalar else "aktif",
        "kapi_hatalari": hatalar,
        "target": HEDEF,
        "classes": [str(c) for c in model.classes_],
        "class_labels": {"0": "riskli olmayan seçim", "1": "riskli seçim"},
        "features": [{"name": n, "label": l, "birim": b, "example": round(float(ornek[n]), 1)} for n, l, b in OZELLIKLER],
        "girdi_semasi": {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "type": "object", "additionalProperties": False, "required": OZ,
            "properties": {n: {"type": "number", "minimum": 0} for n in OZ},
        },
        "karar_esigi": KARAR_ESIGI,
        "esikler": ESIKLER,
        "metrics": dict(cv, onnx_sklearn_maks_fark=float(f"{fark:.2e}"), n_satir=int(len(df)),
                        n_oturum=int(df[GRUP].nunique()), n_oyuncu=int(df["oyuncu_kodu"].nunique()) if "oyuncu_kodu" in df else None,
                        pozitif_oran=round(float(y.mean()), 4)),
        "katsayilar": {n: round(float(c), 4) for n, c in zip(OZ, lr.coef_[0])},
        "veri_bulgulari": {
            "sabit_ozellikler": [n for n in OZ if X[n].nunique() == 1],
            "medyan_karar_suresi_sn": round(float(df["karar_sure_sn"].median()), 1) if "karar_sure_sn" in df else None,
            "karar_suresi_3sn_alti_oran": round(float((df["karar_sure_sn"] < 3).mean()), 3) if "karar_sure_sn" in df else None,
        },
        "veri": {"dosya": "data/oturumlar.csv", "sha256": hashlib.sha256(ham).hexdigest(),
                 "kaynak": {k: int(v) for k, v in df.groupby("kaynak")[GRUP].nunique().items()}},
        "seed": SEED,
        "sklearn_version": sklearn.__version__,
        "python_version": f"{sys.version_info.major}.{sys.version_info.minor}",
        "onnx_uretici": uretici,
        "platform": platform.machine(),
    }
    cikti.mkdir(parents=True, exist_ok=True)
    (cikti / "model.onnx").write_bytes((gecici / "model.onnx").read_bytes())
    (cikti / "config.json").write_text(json.dumps(config, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (cikti / "README.md").write_text(model_karti(config), encoding="utf-8")
    rapor_yolu.parent.mkdir(parents=True, exist_ok=True)
    rapor_yolu.write_text(json.dumps({"durum": config["durum"], "mod": config["mod"], "hatalar": hatalar, "cv": cv,
                                      "esikler": ESIKLER}, indent=2, ensure_ascii=False), encoding="utf-8")
    if hatalar:
        print(f"✓ GÖLGE ADAY yazıldı → {cikti}/ (mod=golge; oyunu değiştirmez)")
    else:
        print(f"✓ EVAL KAPISI GEÇİLDİ → {cikti}/ (model.onnx, config.json, README.md)")
    print("  katsayılar:", config["katsayilar"])


if __name__ == "__main__":
    main()
