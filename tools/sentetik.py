"""Sentetik oturum üretici: YALNIZ boru hattını (eğitim → ONNX → uygulama → parite) gerçek veri
gelmeden denemek için. Çıktıdaki her satır kaynak=sentetik olarak işaretlenir.

    python tools/sentetik.py --oturum 60 --cikti _out/sentetik.csv     # tohum: 2026

Üretici kural (README'de de yazılı): her oyuncunun gizli bir "dikkat" puanı a ~ N(0, 1) vardır.
Bir kararda riskli seçim olasılığı
    p = sigmoid(0.4 − 0.55·seviye − 0.35·(oturum_no − 1) + 0.6·onceki_riskli_sayisi
                − 0.03·onceki_karar_sure_sn − 0.5·a + 0.25·[sahne_no = 2])
Süreler dikkat puanına bağlı log-normal dağılır (dikkatli oyuncu daha uzun okur).
"""
import argparse
import csv
import math
import random
from pathlib import Path

SUTUNLAR = ["oturum_id", "oyuncu_kodu", "oturum_no", "kaynak", "surum", "tarih", "seviye", "rol", "hedef", "sahne_no",
            "riskli_ustte", "onceki_sahne_sure_sn", "onceki_karar_sure_sn", "onceki_riskli_sayisi", "tutor_mesaj_onceki",
            "ipucu_acma_onceki", "karar_sure_sn", "tutor_mesaj_bu_sahne", "sure_doldu", "model_p", "model_mudahale", "riskli_secti"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--oturum", type=int, default=60)
    ap.add_argument("--tohum", type=int, default=2026)
    ap.add_argument("--cikti", default="_out/sentetik.csv")
    a = ap.parse_args()
    r = random.Random(a.tohum)
    sig = lambda z: 1 / (1 + math.exp(-z))
    satirlar, oyuncular = [], {}
    for i in range(a.oturum):
        kod = f"S{r.randint(1, max(3, a.oturum // 5))}"
        if kod not in oyuncular:
            oyuncular[kod] = {"a": r.gauss(0, 1), "n": 0, "seviye": r.choice([0, 0, 1, 1, 2])}
        o = oyuncular[kod]
        o["n"] += 1
        oid = "%08x" % r.getrandbits(32)
        riskli, tutor, ipucu, onceki_karar = 0, 0, 0, 0.0
        onceki_sahne = round(r.lognormvariate(2.6 + 0.3 * o["a"] - 0.15 * (o["n"] - 1), 0.4), 1)
        for sahne in (1, 2, 3):
            z = (0.4 - 0.55 * o["seviye"] - 0.35 * (o["n"] - 1) + 0.6 * riskli - 0.03 * onceki_karar
                 - 0.5 * o["a"] + (0.25 if sahne == 2 else 0))
            y = 1 if r.random() < sig(z) else 0
            karar = round(r.lognormvariate(2.5 + 0.25 * o["a"] - 0.1 * (o["n"] - 1), 0.5), 1)
            bu_tutor = 1 if r.random() < 0.25 else 0
            satirlar.append({
                "oturum_id": oid, "oyuncu_kodu": kod, "oturum_no": o["n"], "kaynak": "sentetik", "surum": "sentetik-1",
                "tarih": "", "seviye": o["seviye"], "rol": r.choice(["backend", "devops", "qa", "mobil"]),
                "hedef": r.choice(["mimari", "kriz", "kvkk"]), "sahne_no": sahne, "riskli_ustte": r.randint(0, 1),
                "onceki_sahne_sure_sn": onceki_sahne, "onceki_karar_sure_sn": onceki_karar, "onceki_riskli_sayisi": riskli,
                "tutor_mesaj_onceki": tutor, "ipucu_acma_onceki": ipucu, "karar_sure_sn": karar,
                "tutor_mesaj_bu_sahne": bu_tutor, "sure_doldu": 0, "model_p": "", "model_mudahale": 0, "riskli_secti": y})
            riskli += y
            tutor += bu_tutor
            ipucu += 1 if (o["seviye"] == 1 and r.random() < 0.3) else 0
            onceki_karar = karar
            onceki_sahne = round(r.lognormvariate(2.2 + 0.3 * o["a"], 0.4), 1)
    yol = Path(a.cikti)
    yol.parent.mkdir(parents=True, exist_ok=True)
    with yol.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=SUTUNLAR)
        w.writeheader()
        w.writerows(satirlar)
    print(f"{yol}: {len(satirlar)} satır, {a.oturum} oturum, {len(oyuncular)} oyuncu (tohum {a.tohum})")


if __name__ == "__main__":
    main()
