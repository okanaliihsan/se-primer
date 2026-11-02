/* SE Primer v2 · Küçük, bağımlılıksız ONNX yorumlayıcısı (yedek çıkarım motoru).
   Asıl motor onnxruntime-web'dir. Bu dosya, CDN'e erişilemeyen ortamlarda (çevrimdışı, kısıtlı ağ)
   AYNI model.onnx dosyasını okuyup çalıştırır. Yalnızca bu projedeki küçük modellerin kullandığı
   operatörleri destekler; desteklemediği bir operatörde açıkça hata verir (sessizce yanlış sonuç vermez).
   Desteklenen: Sub, Div, Mul, Add, MatMul, Gemm, Sigmoid, Concat, ArgMax, Cast, Identity, Reshape,
   ai.onnx.ml: Scaler, LinearClassifier, Normalizer. */
(function (root) {
  /* ---------- protobuf okuyucu ---------- */
  function Reader(buf) { this.b = buf; this.p = 0; this.dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength); }
  Reader.prototype.eof = function () { return this.p >= this.b.length; };
  Reader.prototype.varint = function () {
    let r = 0n, s = 0n, x;
    do { x = this.b[this.p++]; r |= BigInt(x & 0x7f) << s; s += 7n; } while (x & 0x80);
    return r;
  };
  Reader.prototype.tag = function () { const t = Number(this.varint()); return [t >>> 3, t & 7]; };
  Reader.prototype.bytes = function () { const n = Number(this.varint()); const v = this.b.subarray(this.p, this.p + n); this.p += n; return v; };
  Reader.prototype.f32 = function () { const v = this.dv.getFloat32(this.p, true); this.p += 4; return v; };
  Reader.prototype.f64 = function () { const v = this.dv.getFloat64(this.p, true); this.p += 8; return v; };
  Reader.prototype.skip = function (w) {
    if (w === 0) this.varint(); else if (w === 1) this.p += 8; else if (w === 2) this.bytes(); else if (w === 5) this.p += 4;
    else throw new Error('protobuf: bilinmeyen tel tipi ' + w);
  };
  const dec = new TextDecoder();
  const str = (u8) => dec.decode(u8);
  const toInt = (b) => { b = BigInt.asIntN(64, b); return Number(b); };

  function packedOr(r, w, one, out) {
    if (w === 2) { const sub = new Reader(r.bytes()); while (!sub.eof()) out.push(one(sub)); }
    else out.push(one(r));
  }

  function parseTensor(u8) {
    const r = new Reader(u8); const t = { dims: [], type: 1, f: [], i: [], d: [], raw: null, name: '' };
    while (!r.eof()) {
      const [f, w] = r.tag();
      if (f === 1) packedOr(r, w, (x) => toInt(x.varint()), t.dims);
      else if (f === 2) t.type = Number(r.varint());
      else if (f === 4) packedOr(r, w, (x) => x.f32(), t.f);
      else if (f === 7) packedOr(r, w, (x) => toInt(x.varint()), t.i);
      else if (f === 10) packedOr(r, w, (x) => x.f64(), t.d);
      else if (f === 8) t.name = str(r.bytes());
      else if (f === 9) t.raw = r.bytes();
      else r.skip(w);
    }
    let data;
    if (t.raw) {
      const ab = t.raw.slice().buffer, n = t.raw.length;
      if (t.type === 1) data = Array.from(new Float32Array(ab, 0, n / 4));
      else if (t.type === 7) data = Array.from(new BigInt64Array(ab, 0, n / 8), Number);
      else if (t.type === 11) data = Array.from(new Float64Array(ab, 0, n / 8));
      else throw new Error('ONNX: desteklenmeyen raw tensör tipi ' + t.type);
    } else data = t.type === 7 ? t.i : t.type === 11 ? t.d : t.f;
    return { name: t.name, dims: t.dims, type: t.type, data };
  }

  function parseAttr(u8) {
    const r = new Reader(u8); const a = { name: '', floats: [], ints: [], strings: [] };
    while (!r.eof()) {
      const [f, w] = r.tag();
      if (f === 1) a.name = str(r.bytes());
      else if (f === 2) a.f = r.f32();
      else if (f === 3) a.i = toInt(r.varint());
      else if (f === 4) a.s = str(r.bytes());
      else if (f === 5) a.t = parseTensor(r.bytes());
      else if (f === 7) packedOr(r, w, (x) => x.f32(), a.floats);
      else if (f === 8) packedOr(r, w, (x) => toInt(x.varint()), a.ints);
      else if (f === 9) a.strings.push(str(r.bytes()));
      else r.skip(w);
    }
    return a;
  }

  function parseNode(u8) {
    const r = new Reader(u8); const n = { input: [], output: [], op: '', domain: '', attr: {} };
    while (!r.eof()) {
      const [f, w] = r.tag();
      if (f === 1) n.input.push(str(r.bytes()));
      else if (f === 2) n.output.push(str(r.bytes()));
      else if (f === 4) n.op = str(r.bytes());
      else if (f === 7) n.domain = str(r.bytes());
      else if (f === 5) { const a = parseAttr(r.bytes()); n.attr[a.name] = a; }
      else r.skip(w);
    }
    return n;
  }

  function parseValueInfoName(u8) { const r = new Reader(u8); while (!r.eof()) { const [f, w] = r.tag(); if (f === 1) return str(r.bytes()); r.skip(w); } return ''; }

  function parseGraph(u8) {
    const r = new Reader(u8); const g = { nodes: [], init: {}, inputs: [], outputs: [] };
    while (!r.eof()) {
      const [f, w] = r.tag();
      if (f === 1) g.nodes.push(parseNode(r.bytes()));
      else if (f === 5) { const t = parseTensor(r.bytes()); g.init[t.name] = t; }
      else if (f === 11) g.inputs.push(parseValueInfoName(r.bytes()));
      else if (f === 12) g.outputs.push(parseValueInfoName(r.bytes()));
      else r.skip(w);
    }
    return g;
  }

  function parseModel(buf) {
    const r = new Reader(buf instanceof Uint8Array ? buf : new Uint8Array(buf));
    let graph = null;
    while (!r.eof()) { const [f, w] = r.tag(); if (f === 7) graph = parseGraph(r.bytes()); else r.skip(w); }
    if (!graph) throw new Error('ONNX: graph bulunamadı');
    return graph;
  }

  /* ---------- tensör yardımcıları (2B'ye kadar, satır öncelikli) ---------- */
  const T = (dims, data) => ({ dims, data });
  const size = (d) => d.reduce((a, b) => a * b, 1);
  function bcast(a, b, fn) {
    const nd = Math.max(a.dims.length, b.dims.length);
    const pa = Array(nd - a.dims.length).fill(1).concat(a.dims), pb = Array(nd - b.dims.length).fill(1).concat(b.dims);
    const od = pa.map((x, i) => Math.max(x, pb[i]));
    const out = new Array(size(od));
    const idx = (p, pd) => { let k = 0, m = 1; for (let i = nd - 1; i >= 0; i--) { k += (pd[i] === 1 ? 0 : p[i]) * m; m *= pd[i]; } return k; };
    for (let n = 0; n < out.length; n++) {
      const p = []; let rem = n; for (let i = nd - 1; i >= 0; i--) { p[i] = rem % od[i]; rem = Math.floor(rem / od[i]); }
      out[n] = fn(a.data[idx(p, pa)], b.data[idx(p, pb)]);
    }
    return T(od, out);
  }
  function matmul(a, b) {
    const [m, k] = a.dims, n = b.dims[1]; const out = new Array(m * n).fill(0);
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) { let s = 0; for (let x = 0; x < k; x++) s += a.data[i * k + x] * b.data[x * n + j]; out[i * n + j] = s; }
    return T([m, n], out);
  }
  const f32 = (x) => Math.fround(x);
  const sig = (x) => 1 / (1 + Math.exp(-x));

  const OPS = {
    Identity: (n, [a]) => [a],
    Cast: (n, [a]) => [a],
    Reshape: (n, [a, s]) => { const d = s.data.slice(); const k = d.indexOf(-1); if (k >= 0) d[k] = size(a.dims) / -size(d); return [T(d, a.data)]; },
    Sub: (n, [a, b]) => [bcast(a, b, (x, y) => f32(x - y))],
    Add: (n, [a, b]) => [bcast(a, b, (x, y) => f32(x + y))],
    Mul: (n, [a, b]) => [bcast(a, b, (x, y) => f32(x * y))],
    Div: (n, [a, b]) => [bcast(a, b, (x, y) => f32(x / y))],
    MatMul: (n, [a, b]) => [matmul(a, b)],
    Gemm: (n, [a, b, c]) => {
      const tb = n.attr.transB ? n.attr.transB.i : 0;
      let bb = b; if (tb) { const [r, k] = b.dims; const d = new Array(r * k); for (let i = 0; i < r; i++) for (let j = 0; j < k; j++) d[j * r + i] = b.data[i * k + j]; bb = T([k, r], d); }
      let y = matmul(a, bb); if (c) y = bcast(y, c, (x, z) => x + z); return [y];
    },
    Sigmoid: (n, [a]) => [T(a.dims, a.data.map((x) => f32(sig(x))))],
    Concat: (n, xs) => {
      const ax = n.attr.axis.i; if (ax !== 1 && ax !== -1) throw new Error('Concat: yalnız axis=1');
      const m = xs[0].dims[0]; const cols = xs.reduce((s, x) => s + x.dims[1], 0); const out = [];
      for (let i = 0; i < m; i++) xs.forEach((x) => { for (let j = 0; j < x.dims[1]; j++) out.push(x.data[i * x.dims[1] + j]); });
      return [T([m, cols], out)];
    },
    ArgMax: (n, [a]) => {
      const [m, c] = a.dims; const out = [];
      for (let i = 0; i < m; i++) { let b = 0; for (let j = 1; j < c; j++) if (a.data[i * c + j] > a.data[i * c + b]) b = j; out.push(b); }
      return [T((n.attr.keepdims && n.attr.keepdims.i === 0) ? [m] : [m, 1], out)];
    },
    Scaler: (n, [a]) => {
      const off = n.attr.offset ? n.attr.offset.floats : [0], sc = n.attr.scale ? n.attr.scale.floats : [1]; const c = a.dims[1];
      return [T(a.dims, a.data.map((x, k) => f32((x - off[off.length === 1 ? 0 : k % c]) * sc[sc.length === 1 ? 0 : k % c])))];
    },
    LinearClassifier: (n, [a]) => {
      const C = n.attr.coefficients.floats, B = n.attr.intercepts ? n.attr.intercepts.floats : [];
      const labels = n.attr.classlabels_ints ? n.attr.classlabels_ints.ints : [0, 1];
      const post = n.attr.post_transform ? n.attr.post_transform.s : 'NONE';
      const [m, k] = a.dims; const rows = C.length / k; const lab = [], sc = [];
      for (let i = 0; i < m; i++) {
        let s = []; for (let r = 0; r < rows; r++) { let z = B[r] || 0; for (let j = 0; j < k; j++) z += C[r * k + j] * a.data[i * k + j]; s.push(z); }
        if (post === 'LOGISTIC') s = s.map(sig);
        else if (post === 'SOFTMAX') { const mx = Math.max(...s); const e = s.map((z) => Math.exp(z - mx)); const t = e.reduce((x, y) => x + y, 0); s = e.map((z) => z / t); }
        if (rows === 1) s = [1 - s[0], s[0]];
        sc.push(...s.map(f32));
        lab.push(labels[s.indexOf(Math.max(...s))]);
      }
      return [T([m], lab), T([m, sc.length / m], sc)];
    },
    Normalizer: (n, [a]) => {
      const norm = n.attr.norm ? n.attr.norm.s : 'MAX'; const [m, c] = a.dims; const out = [];
      for (let i = 0; i < m; i++) {
        const row = a.data.slice(i * c, i * c + c);
        const d = norm === 'L1' ? row.reduce((s, x) => s + Math.abs(x), 0) : norm === 'L2' ? Math.sqrt(row.reduce((s, x) => s + x * x, 0)) : Math.max(...row);
        out.push(...row.map((x) => f32(x / d)));
      }
      return [T(a.dims, out)];
    }
  };

  function Session(graph) { this.g = graph; }
  Session.create = async function (src) {
    let buf = src;
    if (typeof src === 'string') { const r = await fetch(src); if (!r.ok) throw new Error('model indirilemedi: ' + r.status); buf = new Uint8Array(await r.arrayBuffer()); }
    return new Session(parseModel(buf));
  };
  /* feeds: { input: { dims:[n,f], data:[...] } } → { label, probabilities } */
  Session.prototype.run = function (feeds) {
    const env = {};
    for (const [k, t] of Object.entries(this.g.init)) env[k] = T(t.dims, t.data);
    for (const [k, v] of Object.entries(feeds)) env[k] = T(v.dims, Array.from(v.data, f32));
    for (const n of this.g.nodes) {
      const fn = OPS[n.op]; if (!fn) throw new Error('ONNX mini: desteklenmeyen operatör ' + (n.domain ? n.domain + '.' : '') + n.op);
      const outs = fn(n, n.input.map((x) => (x ? env[x] : null)));
      n.output.forEach((o, i) => { if (o) env[o] = outs[i]; });
    }
    const res = {}; this.g.outputs.forEach((o) => { res[o] = env[o]; }); return res;
  };

  const api = { Session, parseModel };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.OnnxMini = api;
})(typeof window !== 'undefined' ? window : globalThis);
