"""Test kahini (oracle): AYNI model.onnx'i Python + onnxruntime ile çalıştırır.

    python tests/parite.py            # tests/parite.json'u (yeniden) yazar
    python tests/parite.py --kontrol  # mevcut parite.json'daki olasılıkları yeniden hesaplar, fark ≤ 1e-4 mü?

Diferansiyel test: uygulama (onnxruntime-web ya da yedek motor) bu dosyadaki 5 girdiyi çalıştırır ve
her biri için |p_uygulama − p_python| < 1e-4 olmalıdır (cypress/e2e/parite.cy.js).
Girdiler bilerek çeşitlendirildi: tipik oyuncu, uç değerler (0 ve büyük süreler), her seviye, her sahne.
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort

KOK = Path(__file__).resolve().parent.parent
TOLERANS = 1e-4

REFERANS = [
    ("tipik yeni başlayan, 1. karar", {"seviye": 0, "sahne_no": 1, "oturum_no": 1, "onceki_sahne_sure_sn": 14.2, "onceki_karar_sure_sn": 0, "onceki_riskli_sayisi": 0, "tutor_mesaj_onceki": 0, "ipucu_acma_onceki": 0}),
    ("aceleci, önceki kararda riskli", {"seviye": 1, "sahne_no": 2, "oturum_no": 1, "onceki_sahne_sure_sn": 2.1, "onceki_karar_sure_sn": 3.4, "onceki_riskli_sayisi": 1, "tutor_mesaj_onceki": 0, "ipucu_acma_onceki": 2}),
    ("deneyimli, 4. oyun, son karar", {"seviye": 2, "sahne_no": 3, "oturum_no": 4, "onceki_sahne_sure_sn": 9.8, "onceki_karar_sure_sn": 21.0, "onceki_riskli_sayisi": 0, "tutor_mesaj_onceki": 3, "ipucu_acma_onceki": 0}),
    ("uç: tüm değerler sıfır", {"seviye": 0, "sahne_no": 1, "oturum_no": 0, "onceki_sahne_sure_sn": 0, "onceki_karar_sure_sn": 0, "onceki_riskli_sayisi": 0, "tutor_mesaj_onceki": 0, "ipucu_acma_onceki": 0}),
    ("uç: çok uzun süreler, 2 riskli", {"seviye": 1, "sahne_no": 3, "oturum_no": 9, "onceki_sahne_sure_sn": 240.0, "onceki_karar_sure_sn": 180.5, "onceki_riskli_sayisi": 2, "tutor_mesaj_onceki": 7, "ipucu_acma_onceki": 4}),
]


def oracle(model_dir: Path):
    config = json.loads((model_dir / "config.json").read_text(encoding="utf-8"))
    oz = [f["name"] for f in config["features"]]
    s = ort.InferenceSession(str(model_dir / "model.onnx"), providers=["CPUExecutionProvider"])
    i1 = config["classes"].index("1")

    def p(girdi):
        x = np.array([[girdi[n] for n in oz]], dtype=np.float32)
        return float(s.run(["probabilities"], {"input": x})[0][0, i1])
    return p, config


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default=str(KOK / "model"))
    ap.add_argument("--json", default=str(KOK / "tests" / "parite.json"))
    ap.add_argument("--kontrol", action="store_true")
    a = ap.parse_args()
    p, config = oracle(Path(a.model))
    yol = Path(a.json)
    if a.kontrol:
        kayit = json.loads(yol.read_text(encoding="utf-8"))
        en = max(abs(p(v["girdi"]) - v["p_python"]) for v in kayit["vakalar"])
        print(f"maks fark {en:.2e} (tolerans {TOLERANS})")
        sys.exit(0 if en < TOLERANS else 1)
    kayit = {
        "aciklama": "Diferansiyel test referansı: Python + onnxruntime (test kahini) olasılıkları. Uygulama aynı girdilerde < tolerans farkla aynı sonucu vermeli.",
        "tolerans": TOLERANS,
        "model_surum": config.get("surum"),
        "onnxruntime": ort.__version__,
        "vakalar": [{"ad": ad, "girdi": g, "p_python": round(p(g), 8)} for ad, g in REFERANS],
    }
    yol.write_text(json.dumps(kayit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for v in kayit["vakalar"]:
        print(f"  {v['p_python']:.6f}  {v['ad']}")
    print(f"✓ {yol}")


if __name__ == "__main__":
    main()
