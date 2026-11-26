(function (root) {
  const FW = 168, FH = 126, OX = 64, OY = 120;
  const OUTLINE = [16, 12, 14];
  const L3 = (() => { const v = [0.4, 0.62, 0.66]; const l = Math.hypot(...v); return v.map(x => x / l); })();

  function makeBuf() {
    return { mat: new Int16Array(FW * FH).fill(-1), tone: new Int8Array(FW * FH), grp: new Int8Array(FW * FH).fill(-1), raw: new Array(FW * FH).fill(null) };
  }
  const toPx = (x, y) => [OX + x, OY - y];
  const toSk = (px, py) => [px + 0.5 - OX, OY - (py + 0.5)];

  function shadeTone(nx, ny, bias) {
    const l2 = nx * nx + ny * ny;
    const nz = l2 < 1 ? Math.sqrt(1 - l2) : 0;
    const s = nx * L3[0] + ny * L3[1] + nz * L3[2] + (bias || 0);
    if (s > 0.82) return 3;
    if (s > 0.38) return 2;
    return 1;
  }
  function put(B, px, py, m, t, g) {
    px |= 0; py |= 0;
    if (px < 0 || py < 0 || px >= FW || py >= FH) return;
    const i = py * FW + px;
    B.mat[i] = m; B.tone[i] = t; B.grp[i] = g; B.raw[i] = null;
  }
  function putRaw(B, x, y, rgb, g) {
    const [px, py] = toPx(x, y);
    const ix = Math.floor(px), iy = Math.floor(py);
    if (ix < 0 || iy < 0 || ix >= FW || iy >= FH) return;
    const i = iy * FW + ix;
    B.mat[i] = 999; B.raw[i] = rgb; B.grp[i] = g;
  }
  function capsule(B, a, b, r1, r2, m, g, bias) {
    const [ax, ay] = a, [bx, by] = b;
    const rm = Math.max(r1, r2) + 1;
    const p0 = toPx(Math.min(ax, bx) - rm, Math.max(ay, by) + rm), p1 = toPx(Math.max(ax, bx) + rm, Math.min(ay, by) - rm);
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-6;
    for (let py = Math.floor(p0[1]); py <= Math.ceil(p1[1]); py++) for (let px = Math.floor(p0[0]); px <= Math.ceil(p1[0]); px++) {
      const [sx, sy] = toSk(px, py);
      let t = ((sx - ax) * dx + (sy - ay) * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const cx = ax + dx * t, cy = ay + dy * t, r = r1 + (r2 - r1) * t;
      const ex = sx - cx, ey = sy - cy, d = Math.hypot(ex, ey);
      if (d <= r) put(B, px, py, m, shadeTone(ex / r, ey / r, bias), g);
    }
  }
  function ellipse(B, c, rx, ry, rot, m, g, bias) {
    const [cx, cy] = c, R = Math.max(rx, ry) + 1, co = Math.cos(rot), si = Math.sin(rot);
    const p0 = toPx(cx - R, cy + R), p1 = toPx(cx + R, cy - R);
    for (let py = Math.floor(p0[1]); py <= Math.ceil(p1[1]); py++) for (let px = Math.floor(p0[0]); px <= Math.ceil(p1[0]); px++) {
      const [sx, sy] = toSk(px, py);
      const u = (sx - cx) * co + (sy - cy) * si, v = -(sx - cx) * si + (sy - cy) * co;
      const q = (u / rx) ** 2 + (v / ry) ** 2;
      if (q <= 1) { const nu = u / rx, nv = v / ry; put(B, px, py, m, shadeTone(nu * co - nv * si, nu * si + nv * co, bias), g); }
    }
  }
  function poly(B, pts, m, g, toneFixed, bias) {
    let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9, cx = 0, cy = 0;
    for (const [x, y] of pts) { mnx = Math.min(mnx, x); mxx = Math.max(mxx, x); mny = Math.min(mny, y); mxy = Math.max(mxy, y); cx += x; cy += y; }
    cx /= pts.length; cy /= pts.length;
    const R = Math.max(mxx - mnx, mxy - mny) / 2 + 0.01;
    const p0 = toPx(mnx, mxy), p1 = toPx(mxx, mny);
    for (let py = Math.floor(p0[1]); py <= Math.ceil(p1[1]); py++) for (let px = Math.floor(p0[0]); px <= Math.ceil(p1[0]); px++) {
      const [sx, sy] = toSk(px, py);
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > sy) !== (yj > sy) && sx < (xj - xi) * (sy - yi) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) put(B, px, py, m, toneFixed != null ? toneFixed : shadeTone((sx - cx) / R * 0.8, (sy - cy) / R * 0.8, bias), g);
    }
  }
  function ik(a, t, L1, L2, bend) {
    let dx = t[0] - a[0], dy = t[1] - a[1];
    let d = Math.hypot(dx, dy);
    const dmax = L1 + L2 - 0.01, dmin = Math.abs(L1 - L2) + 0.5;
    const base = Math.atan2(dy, dx);
    d = Math.max(dmin, Math.min(dmax, d));
    const cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
    const A = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const ang = base + bend * A;
    const j = [a[0] + L1 * Math.cos(ang), a[1] + L1 * Math.sin(ang)];
    const e = [a[0] + d * Math.cos(base), a[1] + d * Math.sin(base)];
    return { j, e };
  }
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const dir = (deg, len) => [Math.cos(deg * Math.PI / 180) * len, Math.sin(deg * Math.PI / 180) * len];
  const rotAround = (p, c, deg) => { const r = deg * Math.PI / 180, co = Math.cos(r), si = Math.sin(r), x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * co - y * si, c[1] + x * si + y * co]; };

  function finish(B, mats) {
    const n = FW * FH;
    const inner = new Uint8Array(n);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const i = y * FW + x; if (B.mat[i] < 0) continue;
      const g = B.grp[i];
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const [dx, dy] of nb) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= FW || yy >= FH) continue;
        const j = yy * FW + xx; if (B.mat[j] < 0) continue;
        if (B.grp[j] > g + 0 && B.grp[j] !== g && !(B.grp[j] >= 50 && g >= 50)) { inner[i] = 1; break; }
      }
    }
    const out = new Uint8ClampedArray(n * 4);
    for (let i = 0; i < n; i++) {
      if (B.mat[i] < 0) continue;
      let c;
      if (B.mat[i] === 999) c = B.raw[i];
      else { const pal = mats[B.mat[i]]; c = inner[i] ? pal[0] : pal[B.tone[i]]; }
      out[i * 4] = c[0]; out[i * 4 + 1] = c[1]; out[i * 4 + 2] = c[2]; out[i * 4 + 3] = 255;
    }
    const filled = i => out[i * 4 + 3] > 0 && B.grp[i] < 50;
    const res = new Uint8ClampedArray(out);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const i = y * FW + x; if (out[i * 4 + 3] > 0) continue;
      let near = false;
      if (x > 0 && filled(i - 1)) near = true; else if (x < FW - 1 && filled(i + 1)) near = true;
      else if (y > 0 && filled(i - FW)) near = true; else if (y < FH - 1 && filled(i + FW)) near = true;
      if (near) { res[i * 4] = OUTLINE[0]; res[i * 4 + 1] = OUTLINE[1]; res[i * 4 + 2] = OUTLINE[2]; res[i * 4 + 3] = 255; }
    }
    return res;
  }

  root.PixelRig = { FW, FH, OX, OY, makeBuf, capsule, ellipse, poly, put, putRaw, ik, add, lerp, dir, rotAround, finish };
})(typeof window !== 'undefined' ? window : globalThis);
