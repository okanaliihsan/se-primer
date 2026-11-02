"""Bonus diferansiyel test: kendi sunucunuzdaki tüketici (server/app.py) tests/parite.json'daki
5 referans girdide Python test kahiniyle < 1e-4 farkla aynı olasılığı veriyor mu?

    python tests/parite_sunucu.py http://localhost:3100
    python tests/parite_sunucu.py https://se-primer-api.onrender.com
"""
import json
import sys
import urllib.request
from pathlib import Path

taban = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3100").rstrip("/")
kayit = json.loads((Path(__file__).parent / "parite.json").read_text(encoding="utf-8"))
en = 0.0
for v in kayit["vakalar"]:
    istek = urllib.request.Request(taban + "/api/v1/predictions", data=json.dumps({"inputs": v["girdi"]}).encode(),
                                   headers={"Content-Type": "application/json"}, method="POST")
    p = json.loads(urllib.request.urlopen(istek, timeout=60).read())["proba"]
    fark = abs(p - v["p_python"])
    en = max(en, fark)
    print(f"  sunucu {p:.6f}  python {v['p_python']:.6f}  fark {fark:.1e}  {v['ad']}")
print(f"maks fark {en:.2e} (tolerans {kayit['tolerans']})")
sys.exit(0 if en < kayit["tolerans"] else 1)
