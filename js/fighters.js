(function (root) {
  const R = root.PixelRig;
  const { capsule, ellipse, poly, putRaw, ik, add, lerp, dir, rotAround } = R;

  const DISC = new Set(['smear', 'hit', 'fx', 'ghost', 'streak', 'flip', 'hbw']);
  function mix(a, b, t) {
    if (typeof a === 'number') return a + (b - a) * t;
    if (Array.isArray(a)) return a.map((v, i) => v + (b[i] - v) * t);
    const o = {};
    for (const k in a) { const D = DISC.has(k); if (k in b) o[k] = D ? (t < 0.5 ? a[k] : b[k]) : mix(a[k], b[k], t); else if (!D || t < 0.5) o[k] = a[k]; }
    for (const k in b) if (!(k in a) && (!DISC.has(k) || t >= 0.5)) o[k] = b[k];
    return o;
  }
  const ease = t => t * t * (3 - 2 * t);

  function seq(keys, f) {
    let acc = 0;
    for (let i = 0; i < keys.length - 1; i++) {
      const d = keys[i].d;
      if (f < acc + d) { const t = (f - acc) / d, e = keys[i].e; const tt = keys[i].hold || e === 'hold' ? 0 : e === 'lin' ? t : e === 'out' ? 1 - Math.pow(1 - t, 3) : e === 'in' ? t * t * t : ease(t); return mix(keys[i].p, keys[i + 1].p, tt); }
      acc += d;
    }
    return keys[keys.length - 1].p;
  }
  const seqLen = keys => keys.slice(0, -1).reduce((s, k) => s + k.d, 0);

  function solve(def, P) {
    const hip = P.hip;
    const chest = add(hip, dir(90 - P.lean, def.spine));
    const neckTop = add(chest, dir(90 - P.lean * 0.6 - (P.neck || 0), def.neck));
    const head = add(neckTop, dir(90 - (P.headTilt || 0) - P.lean * 0.3, def.headR - 0.6));
    const shF = add(chest, rotAround(def.shF, [0, 0], -P.lean * 0.5));
    const shB = add(chest, rotAround(def.shB, [0, 0], -P.lean * 0.5));
    const hipF = add(hip, def.hipF), hipB = add(hip, def.hipB);
    const ankF = add(P.footF, [0, def.ankleH]), ankB = add(P.footB, [0, def.ankleH]);
    const lF = ik(hipF, ankF, def.thigh, def.shin, P.kneeF == null ? 1 : P.kneeF);
    const lB = ik(hipB, ankB, def.thigh, def.shin, P.kneeB == null ? 1 : P.kneeB);
    const aF = ik(shF, P.handF, def.upper, def.fore, P.elbF == null ? -1 : P.elbF);
    const aB = ik(shB, P.handB, def.upper, def.fore, P.elbB == null ? -1 : P.elbB);
    return { hip, chest, neckTop, head, shF, shB, hipF, hipB, kneeF: lF.j, ankF: lF.e, kneeB: lB.j, ankB: lB.e, elbF: aF.j, handF: aF.e, elbB: aB.j, handB: aB.e };
  }

  function foot(B, ank, ang, m, g, bias, len, r1, r2) {
    const heel = rotAround(add(ank, [-2.2, -2.6]), ank, ang || 0);
    const toe = rotAround(add(ank, [len, -2.9]), ank, ang || 0);
    capsule(B, heel, toe, r1, r2, m, g, bias);
  }

  const PAL = (o, s, b, l) => [o, s, b, l];

  const MUHYEOK = {
    name: 'MUHYEOK', kname: '무혁',
    spine: 17.5, neck: 4, headR: 5.8, thigh: 20.5, shin: 20, upper: 12.5, fore: 12, ankleH: 3.6,
    shF: [1.8, -2.4], shB: [-2.6, -1.6], hipF: [1.6, -1.2], hipB: [-1.8, -0.6],
    mats: {
      skin: PAL([58, 30, 26], [118, 66, 50], [166, 104, 78], [204, 144, 108]),
      hair: PAL([10, 9, 12], [22, 20, 26], [36, 34, 42], [58, 56, 68]),
      top: PAL([12, 12, 16], [30, 30, 38], [46, 46, 56], [72, 72, 86]),
      pants: PAL([10, 12, 22], [26, 30, 50], [40, 46, 74], [62, 70, 104]),
      sash: PAL([44, 8, 12], [104, 20, 26], [152, 32, 36], [196, 62, 56]),
      wrap: PAL([64, 56, 50], [138, 128, 114], [186, 176, 160], [224, 216, 200])
    },
    draw(B, P) {
      const J = solve(this, P), M = this.mat;
      const sw = P.sway || 0;
      capsule(B, J.shB, J.elbB, 4.4, 3.8, M.skin, 0, -0.3);
      capsule(B, J.elbB, J.handB, 3.8, 3.1, M.skin, 0, -0.3);
      capsule(B, lerp(J.elbB, J.handB, 0.45), J.handB, 3.7, 3.4, M.wrap, 0, -0.3);
      ellipse(B, J.handB, 3.5, 3.3, 0, M.wrap, 0, -0.3);

      capsule(B, J.hipB, J.kneeB, 6.0, 4.9, M.pants, 1, -0.3);
      capsule(B, J.kneeB, add(J.ankB, [0, 1.5]), 4.9, 4.3, M.pants, 1, -0.3);
      capsule(B, add(J.ankB, [0, 1.2]), add(J.ankB, [0, -1.2]), 3.2, 3.1, M.wrap, 1, -0.3);
      foot(B, J.ankB, P.footBA, M.skin, 1, -0.3, 5.6, 2.1, 1.7);

      const tailBase = add(J.hip, [-5.5, 0.8]);
      poly(B, [add(tailBase, [1.5, 1.5]), add(tailBase, [-2.5, 1]), add(tailBase, [-6 + sw * 2, -11]), add(tailBase, [-2.2 + sw * 2, -13]), add(tailBase, [0.5 + sw, -5])], M.sash, 2, null, -0.1);
      capsule(B, add(J.chest, [0.4, -1]), J.neckTop, 3.5, 3.0, M.skin, 2);
      capsule(B, add(J.hip, [0, 1.5]), add(J.chest, [0.6, -1.2]), 6.6, 8.8, M.top, 2);
      capsule(B, add(J.hip, [-7.4, 0.6]), add(J.hip, [7.8, 0.9]), 2.7, 2.7, M.sash, 2);
      capsule(B, add(J.chest, [3.8, -8]), add(J.chest, [5.2, -2]), 0.6, 0.6, M.top, 2, -0.6);

      capsule(B, J.hipF, J.kneeF, 6.2, 5.1, M.pants, 3);
      capsule(B, J.kneeF, add(J.ankF, [0, 1.5]), 5.1, 4.4, M.pants, 3);
      capsule(B, add(J.ankF, [0, 1.2]), add(J.ankF, [0, -1.2]), 3.3, 3.2, M.wrap, 3);
      foot(B, J.ankF, P.footFA, M.skin, 3, 0, 6, 2.2, 1.8);

      const H = J.head, t = (P.headTilt || 0), hr = P.headRot || 0, hp = v => rotAround(add(H, v), H, hr), hrr = hr * Math.PI / 180;
      ellipse(B, hp([-1.2, 0.4]), 1.3, 1.8, 0, M.skin, 4);
      ellipse(B, H, 5.0, 6.0, -t * Math.PI / 180 + hrr, M.skin, 4);
      capsule(B, hp([0.4, -2.2]), hp([2.6, -5.0]), 3.4, 2.3, M.skin, 4);
      ellipse(B, hp([-1.4, 2.2]), 5.4, 4.9, hrr, M.hair, 4);
      poly(B, [hp([-4, 5]), hp([-9.5, 3.5 + sw]), hp([-5.5, 1])], M.hair, 4);
      poly(B, [hp([-5, 1.8]), hp([-8.5, -1.5 + sw]), hp([-4.5, -1.5])], M.hair, 4);
      poly(B, [hp([0, 6.6]), hp([5.4, 5.0]), hp([3.0, 4.0]), hp([-1, 4.4])], M.hair, 4);
      capsule(B, hp([-5.4, 2.6]), hp([5.2, 3.0]), 1.1, 1.1, M.sash, 4);
      poly(B, [hp([-5.2, 3.2]), hp([-13 + sw * 3, 1.5 + sw]), hp([-12.5 + sw * 3, -0.5 + sw]), hp([-5, 1.8])], M.sash, 4);
      const dk = [24, 14, 14];
      putRaw(B, ...hp([3.2, 0.9]), dk, 4);
      putRaw(B, ...hp([3.2, 2.2]), [20, 18, 22], 4);
      putRaw(B, ...hp([3.4, -3.2]), [96, 46, 40], 4);
      putRaw(B, ...hp([0.6, -0.6]), [118, 66, 50], 4);

      if (P.streak) streak(B, J.shF, J.handF, M.wrap, 3);
      capsule(B, J.shF, J.elbF, 4.7, 4.0, M.skin, 5);
      capsule(B, J.elbF, J.handF, 4.0, 3.3, M.skin, 5);
      capsule(B, lerp(J.elbF, J.handF, 0.45), J.handF, 3.9, 3.6, M.wrap, 5);
      ellipse(B, J.handF, 3.7, 3.5, 0, M.wrap, 5);
      return J;
    },
    anims: {}
  };

  const SERIN = {
    name: 'SERIN', kname: '세린',
    spine: 17.5, neck: 4.2, headR: 5.6, thigh: 19.5, shin: 19, upper: 11.5, fore: 11.5, ankleH: 3.8,
    shF: [1.4, -2.2], shB: [-2.2, -1.4], hipF: [1.2, -1], hipB: [-1.4, -0.5],
    mats: {
      skin: PAL([62, 36, 34], [150, 102, 84], [196, 146, 120], [226, 184, 156]),
      hair: PAL([40, 42, 54], [104, 108, 128], [156, 160, 178], [208, 210, 222]),
      coat: PAL([8, 14, 16], [20, 34, 38], [32, 52, 56], [52, 80, 82]),
      trim: PAL([46, 32, 10], [112, 82, 28], [164, 124, 50], [208, 172, 88]),
      inner: PAL([10, 10, 12], [24, 24, 28], [36, 36, 42], [56, 56, 64]),
      boot: PAL([12, 10, 10], [30, 24, 22], [46, 38, 34], [70, 58, 50]),
      steel: PAL([28, 32, 40], [96, 104, 120], [150, 160, 176], [222, 228, 238]),
      grip: PAL([40, 8, 10], [90, 20, 22], [130, 30, 30], [170, 56, 50]),
      glove: PAL([10, 10, 12], [26, 24, 28], [40, 38, 44], [62, 60, 68])
    },
    draw(B, P) {
      let sa = P.sword == null ? 30 : P.sword;
      if (P.wrist != null) { const J0 = solve(this, { ...P, handB: P.handF }); sa = Math.atan2(J0.handF[1] - J0.elbF[1], J0.handF[0] - J0.elbF[0]) * 180 / Math.PI + P.wrist; }
      if (P.oneHand == null || P.oneHand < 0.5) P = { ...P, handB: add(P.handF, dir(sa, -4.6)) };
      const J = solve(this, P), M = this.mat;
      const sw = P.sway || 0;
      const grip = J.handF;
      const tip = add(grip, dir(sa, 35)), guardC = add(grip, dir(sa, 3.2)), pommel = add(grip, dir(sa, -6));

      capsule(B, J.shB, J.elbB, 3.8, 3.3, M.coat, 0, -0.3);
      capsule(B, J.elbB, J.handB, 3.3, 2.9, M.coat, 0, -0.3);
      capsule(B, lerp(J.elbB, J.handB, 0.78), J.handB, 3.2, 3.0, M.trim, 0, -0.3);
      ellipse(B, J.handB, 2.8, 2.7, 0, M.glove, 0, -0.3);

      const hb = add(J.hip, [-3, 2]);
      poly(B, [add(J.chest, [-4, -2]), add(hb, [-3, 0]), add(hb, [-9 + sw * 2.5, -22]), add(hb, [-1 + sw * 1.5, -24]), add(J.hip, [3, -1])], M.coat, 1, null, -0.2);
      poly(B, [add(hb, [-9 + sw * 2.5, -22]), add(hb, [-1 + sw * 1.5, -24]), add(hb, [-1 + sw * 1.5, -22.4]), add(hb, [-8.8 + sw * 2.5, -20.4])], M.trim, 1, 2);

      capsule(B, J.hipB, J.kneeB, 5.2, 4.2, M.inner, 1, -0.3);
      capsule(B, J.kneeB, add(J.ankB, [0, 1]), 4.2, 3.5, M.boot, 1, -0.3);
      foot(B, J.ankB, P.footBA, M.boot, 1, -0.3, 6, 2.2, 1.6);

      const hairRoot = add(J.head, [-3.8, 2.2]);
      poly(B, [add(hairRoot, [1, 1.5]), add(hairRoot, [-1.5, -1]), add(hairRoot, [-6 + sw * 3, -14]), add(hairRoot, [-3.5 + sw * 3.5, -22]), add(hairRoot, [-1 + sw * 2, -12]), add(hairRoot, [2, -2])], M.hair, 1, null, -0.15);

      capsule(B, add(J.chest, [0.3, -1]), J.neckTop, 2.7, 2.4, M.skin, 2);
      capsule(B, add(J.hip, [0, 1]), add(J.chest, [0.4, -1]), 5.8, 7.2, M.inner, 2);
      poly(B, [add(J.chest, [-6.5, 2]), add(J.chest, [-1, 3.4]), add(J.chest, [2.5, -4]), add(J.hip, [4, 0]), add(J.hip, [6, -9]), add(J.hip, [0, -10]), add(J.hip, [-6.5, -4]), add(J.hip, [-6.5, 4])], M.coat, 2, null, 0.05);
      capsule(B, add(J.chest, [2.6, -4]), add(J.hip, [4.2, 0]), 0.7, 0.7, M.trim, 2);
      capsule(B, add(J.hip, [4.2, 0]), add(J.hip, [6, -9]), 0.7, 0.7, M.trim, 2);
      capsule(B, add(J.hip, [-6.4, 1.6]), add(J.hip, [5.4, 2.2]), 1.5, 1.5, M.inner, 2, 0.2);
      capsule(B, add(J.chest, [-1, 3.2]), add(J.chest, [2.4, 1.2]), 1.2, 1.0, M.coat, 2, 0.3);

      capsule(B, J.hipF, J.kneeF, 5.4, 4.4, M.inner, 3);
      capsule(B, J.kneeF, add(J.ankF, [0, 1]), 4.4, 3.6, M.boot, 3);
      capsule(B, add(J.kneeF, [0.6, 0.4]), add(J.kneeF, [1.4, -2.2]), 2.6, 2.4, M.boot, 3, 0.3);
      foot(B, J.ankF, P.footFA, M.boot, 3, 0, 6.4, 2.3, 1.7);

      const H = J.head, hr = P.headRot || 0, hp = v => rotAround(add(H, v), H, hr), hrr = hr * Math.PI / 180;
      ellipse(B, H, 4.6, 5.6, hrr, M.skin, 4);
      capsule(B, hp([0.4, -2]), hp([2.3, -4.6]), 3.0, 2.0, M.skin, 4);
      ellipse(B, hp([-1.3, 2.1]), 5.0, 4.6, hrr, M.hair, 4);
      poly(B, [hp([-0.5, 6.2]), hp([5.0, 4.2]), hp([4.4, 0.6]), hp([2.4, 3.2]), hp([0.8, 2.6])], M.hair, 4);
      poly(B, [hp([-4.5, 3]), hp([-6, -4.5 + sw * 0.5]), hp([-3, -1])], M.hair, 4);
      const dk = [22, 16, 20];
      putRaw(B, ...hp([2.4, 0.6]), dk, 4); putRaw(B, ...hp([3.3, 0.6]), [150, 40, 44], 4);
      putRaw(B, ...hp([2.2, 1.7]), [70, 72, 88], 4); putRaw(B, ...hp([3.2, 1.8]), [70, 72, 88], 4);
      putRaw(B, ...hp([3.0, -3.0]), [140, 70, 66], 4);

      if (P.smear) {
        const c = J.shF, a0 = P.smear[0], a1 = P.smear[1], N = 14, ro = Math.hypot(tip[0] - c[0], tip[1] - c[1]) + 1;
        const outer = [], inner = [];
        for (let k = 0; k <= N; k++) { const t = k / N, a = a0 + (a1 - a0) * t, w = 1.5 + 7 * Math.sin(Math.PI * Math.pow(t, 0.7)); outer.push(add(c, dir(a, ro))); inner.push(add(c, dir(a, ro - w))); }
        poly(B, outer.concat(inner.reverse()), M.steel, 60, 2);
        const outer2 = [], inner2 = [];
        for (let k = 0; k <= N; k++) { const t = k / N, a = a0 + (a1 - a0) * t, w = 0.8 + 3 * Math.sin(Math.PI * Math.pow(t, 0.7)); outer2.push(add(c, dir(a, ro + 0.4))); inner2.push(add(c, dir(a, ro - w))); }
        poly(B, outer2.concat(inner2.reverse()), M.steel, 60, 3);
      }
      J.tip = tip;
      if (P.streak) streak(B, add(grip, dir(sa, -22)), tip, M.steel, 3);
      capsule(B, pommel, guardC, 1.3, 1.3, M.grip, 5);
      capsule(B, add(guardC, dir(sa + 90, 3)), add(guardC, dir(sa - 90, 3)), 1.2, 1.2, M.trim, 5);
      poly(B, [add(guardC, dir(sa + 90, 1.4)), add(tip, dir(sa + 90, 0.3)), add(tip, dir(sa, 1.5)), add(tip, dir(sa - 90, 0.6)), add(guardC, dir(sa - 90, 1.4))], M.steel, 5, null, 0.1);
      capsule(B, add(guardC, dir(sa + 90, 0.6)), add(tip, dir(sa + 90, 0.2)), 0.35, 0.3, M.steel, 5, 0.8);

      capsule(B, J.shF, J.elbF, 4.4, 3.9, M.coat, 6);
      capsule(B, J.elbF, J.handF, 3.9, 3.4, M.coat, 6);
      capsule(B, lerp(J.elbF, J.handF, 0.76), J.handF, 3.4, 3.2, M.trim, 6);
      ellipse(B, J.handF, 3.0, 2.9, 0, M.glove, 6);
      return J;
    },
    anims: {}
  };

  MUHYEOK.alt = {
    sash: PAL([10, 24, 48], [22, 52, 98], [36, 84, 150], [70, 124, 196]),
    pants: PAL([18, 18, 12], [40, 40, 28], [60, 60, 42], [86, 86, 62]),
    top: PAL([30, 10, 10], [62, 22, 22], [88, 32, 30], [120, 50, 46])
  };
  SERIN.alt = {
    coat: PAL([22, 8, 12], [48, 18, 26], [74, 28, 38], [104, 46, 56]),
    hair: PAL([10, 10, 14], [26, 26, 32], [42, 42, 50], [66, 66, 78]),
    trim: PAL([30, 34, 40], [100, 108, 120], [150, 158, 170], [200, 206, 216])
  };
  for (const C of [MUHYEOK, SERIN]) {
    C.mat = {}; C.matList = []; C.matListAlt = [];
    for (const k in C.mats) { C.mat[k] = C.matList.length; C.matList.push(C.mats[k]); C.matListAlt.push((C.alt && C.alt[k]) || C.mats[k]); }
  }

  function renderFrame(C, P, alt) {
    const B = R.makeBuf(); const J = C.draw(B, P); let img = R.finish(B, alt ? C.matListAlt : C.matList);
    if (P.flip) {
      const FW = R.FW, FH = R.FH, OX = R.OX, m = new Uint8ClampedArray(img.length);
      for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) { const sx = 2 * OX - x - 1; if (sx < 0 || sx >= FW) continue; const a = (y * FW + sx) * 4, b = (y * FW + x) * 4; m[b] = img[a]; m[b + 1] = img[a + 1]; m[b + 2] = img[a + 2]; m[b + 3] = img[a + 3]; }
      img = m; for (const k in J) J[k] = [-J[k][0], J[k][1]];
    }
    return { img, J };
  }
  function streak(B, from, to, mat, n) {
    const d = [to[0] - from[0], to[1] - from[1]], L = Math.hypot(d[0], d[1]) || 1, px = -d[1] / L, py = d[0] / L;
    const offs = [-6.5, -4.6, 5.2];
    offs.forEach((o, i) => { const s = 0.15 + i * 0.22; capsule(B, [from[0] + d[0] * s + px * o, from[1] + d[1] * s + py * o], [to[0] - d[0] * 0.12 + px * o, to[1] - d[1] * 0.12 + py * o], 0.4, 0.4, mat, 60, 1); });
  }
  root.Fighters = { MUHYEOK, SERIN, renderFrame, mix, seq, seqLen };
})(typeof window !== 'undefined' ? window : globalThis);
