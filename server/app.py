"""SE Primer v2 · Kendi sunucunuzda üçüncü tüketici (bonus): Flask + onnxruntime.

    pip install -r server/requirements.txt
    MODEL_URL=https://huggingface.co/<kullanici>/<repo>/resolve/<commit>/ python server/app.py   # ya da MODEL_DIR=model

Uç noktalar (başlangıç reposundaki Rails API ile aynı sözleşme):
    GET  /api/v1/model         → config.json (sözleşme, sürüm, metrikler)
    POST /api/v1/predictions   {"inputs": {<özellik>: sayı, ...}} → {"proba": p, "label": 0|1, "mudahale": bool, "model_surum": ...}

Render.com ücretsiz katmanda çalışır (render.yaml). Model dosyası açılışta commit'e sabitlenmiş
Hugging Face URL'sinden indirilir; istemci modeli hiç görmez (model gizli kalır, ama veri sunucuya gelir).
"""
import json
import os
import urllib.request
from pathlib import Path

import numpy as np
import onnxruntime as ort
from flask import Flask, jsonify, request

KOK = Path(__file__).resolve().parent.parent


def model_yukle():
    url = os.environ.get("MODEL_URL")  # sonu '/' ile biten, commit'e sabitlenmiş klasör URL'si
    if url:
        config = json.loads(urllib.request.urlopen(url + "config.json", timeout=30).read())
        onnx = urllib.request.urlopen(url + "model.onnx", timeout=30).read()
        kaynak = url
    else:
        d = Path(os.environ.get("MODEL_DIR", KOK / "model"))
        config = json.loads((d / "config.json").read_text(encoding="utf-8"))
        onnx = (d / "model.onnx").read_bytes()
        kaynak = str(d)
    return config, ort.InferenceSession(onnx, providers=["CPUExecutionProvider"]), kaynak


CONFIG, OTURUM, KAYNAK = model_yukle()
OZ = [f["name"] for f in CONFIG["features"]]
I1 = CONFIG["classes"].index("1")
app = Flask(__name__)


@app.after_request
def cors(r):
    r.headers["Access-Control-Allow-Origin"] = "*"
    r.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return r


@app.get("/api/v1/model")
def model_bilgi():
    return jsonify(dict(CONFIG, kaynak=KAYNAK))


@app.route("/api/v1/predictions", methods=["POST", "OPTIONS"])
def tahmin():
    if request.method == "OPTIONS":
        return ("", 204)
    girdi = (request.get_json(silent=True) or {}).get("inputs")
    if not isinstance(girdi, dict):
        return jsonify(hata="gövde {\"inputs\": {...}} olmalı"), 400
    eksik = [n for n in OZ if n not in girdi]
    fazla = [n for n in girdi if n not in OZ]
    if eksik or fazla:
        return jsonify(hata="sözleşme ihlali", eksik=eksik, fazla=fazla, beklenen=OZ), 422
    try:
        x = np.array([[float(girdi[n]) for n in OZ]], dtype=np.float32)
    except (TypeError, ValueError):
        return jsonify(hata="tüm girdiler sayı olmalı"), 422
    p = float(OTURUM.run(["probabilities"], {"input": x})[0][0, I1])
    return jsonify(proba=p, label=int(p >= 0.5), mudahale=p >= CONFIG.get("karar_esigi", 0.5),
                   model_surum=CONFIG.get("surum"))


@app.get("/")
def saglik():
    return jsonify(durum="ok", model_surum=CONFIG.get("surum"), kaynak=KAYNAK)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 3100)))
