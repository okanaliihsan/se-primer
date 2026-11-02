"""Bağımlılıksız ONNX yazıcı: StandardScaler → LogisticRegression (ikili) Pipeline'ını standart
ONNX operatörleriyle (opset 17) model.onnx'e çevirir.

Neden var? Asıl yol `skl2onnx`dur ve train.py önce onu dener. skl2onnx kurulamayan ortamlarda
(ör. paket deposuna erişimi kısıtlı bir makine) bu dosya AYNI sözleşmeyi üretir:
  girdi  'input'         float32 [N, F]
  çıktı  'label'         int64   [N]
         'probabilities' float32 [N, 2]   (sıra = model.classes_)
Doğruluğu train.py'de onnxruntime ile sklearn'e karşı ölçülür (fark ≤ 1e-4, aksi hâlde durur).
"""
import struct


def _varint(n: int) -> bytes:
    if n < 0:
        n += 1 << 64
    out = bytearray()
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            return bytes(out)


def _key(field: int, wire: int) -> bytes:
    return _varint((field << 3) | wire)


def _len(field: int, data: bytes) -> bytes:
    return _key(field, 2) + _varint(len(data)) + data


def _str(field: int, s: str) -> bytes:
    return _len(field, s.encode("utf-8"))


def _int(field: int, v: int) -> bytes:
    return _key(field, 0) + _varint(v)


def _tensor(name, dims, values):
    body = b"".join(_int(1, d) for d in dims)
    body += _int(2, 1)  # FLOAT
    body += _len(4, struct.pack("<%df" % len(values), *values))  # float_data (packed)
    body += _str(8, name)
    return body


def _value_info(name, elem_type, dims):
    shape = b""
    for d in dims:
        dim = _str(2, d) if isinstance(d, str) else _int(1, d)
        shape += _len(1, dim)
    tensor_type = _int(1, elem_type) + _len(2, shape)
    type_proto = _len(1, tensor_type)
    return _str(1, name) + _len(2, type_proto)


def _attr_int(name, v):
    return _str(1, name) + _int(3, v) + _int(20, 2)  # type INT


def _node(op, inputs, outputs, name, attrs=()):
    body = b"".join(_str(1, i) for i in inputs) + b"".join(_str(2, o) for o in outputs)
    body += _str(3, name) + _str(4, op)
    body += b"".join(_len(5, a) for a in attrs)
    return body


def pipeline_to_onnx(mean, scale, coef, intercept, doc="") -> bytes:
    """mean/scale/coef: uzunluğu F olan listeler; intercept: float. İkili lojistik regresyon."""
    F = len(mean)
    nodes = [
        _node("Sub", ["input", "mean"], ["centered"], "olcek_cikar"),
        _node("Div", ["centered", "scale"], ["z"], "olcek_bol"),
        _node("MatMul", ["z", "W"], ["lin0"], "lr_carp"),
        _node("Add", ["lin0", "b"], ["lin"], "lr_ekle"),
        _node("Sigmoid", ["lin"], ["p1"], "lojistik"),
        _node("Sub", ["one", "p1"], ["p0"], "tumleyen"),
        _node("Concat", ["p0", "p1"], ["probabilities"], "olasiliklar", [_attr_int("axis", 1)]),
        _node("ArgMax", ["probabilities"], ["label"], "etiket", [_attr_int("axis", 1), _attr_int("keepdims", 0)]),
    ]
    inits = [
        _tensor("mean", [F], [float(x) for x in mean]),
        _tensor("scale", [F], [float(x) for x in scale]),
        _tensor("W", [F, 1], [float(x) for x in coef]),
        _tensor("b", [1], [float(intercept)]),
        _tensor("one", [1], [1.0]),
    ]
    graph = b"".join(_len(1, n) for n in nodes)
    graph += _str(2, "se_primer_risk")
    graph += b"".join(_len(5, t) for t in inits)
    graph += _len(11, _value_info("input", 1, ["N", F]))
    graph += _len(12, _value_info("label", 7, ["N"]))
    graph += _len(12, _value_info("probabilities", 1, ["N", 2]))
    model = _int(1, 8)  # ir_version 8
    model += _str(2, "se-primer/mini_onnx") + _str(3, "1.0")
    model += _int(5, 1)
    if doc:
        model += _str(6, doc)
    model += _len(7, graph)
    model += _len(8, _str(1, "") + _int(2, 17))  # opset_import: ai.onnx v17
    return model
