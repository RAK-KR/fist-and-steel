(function (root) {
  const { MUHYEOK: M, SERIN: S, mix, seq, seqLen } = root.Fighters;
  const K = (p, d, e) => ({ p, d, e });

  const MI = { hip: [0, 37], lean: 9, footF: [11, 0], footB: [-12, 0], handF: [16.5, 55], handB: [10, 59.5], headTilt: -4, sway: 0, root: [0, 0] };
  const SI = { hip: [0, 35], lean: 5, footF: [12, 0], footB: [-11, 0], handF: [13, 47], wrist: -14, headTilt: -2, sway: 0, root: [0, 0] };

  function loopAnim(base, fn, frames, fps) { return { loop: true, frames, fps, pose: f => mix(base, fn(f), 1) }; }
  function seqAnim(label, cmd, kind, keys, fps) { const len = seqLen(keys); return { loop: false, label, cmd, kind, keys, len, frames: Math.round(len) + 1, fps: fps || 15, pose: f => seq(keys, f) }; }

  M.anims = {
    idle: loopAnim(MI, f => { const s = Math.sin(f / 8 * Math.PI * 2); return { hip: [0, 36.4 + s * 0.6], handF: [16.5, 55 + s * 0.8], handB: [10, 59.5 + s * 0.7], sway: s * 0.8, lean: 9 + s * 0.6 }; }, 8, 8),
    walk: loopAnim(MI, f => { const ph = f / 8 * Math.PI * 2; return { hip: [0.5 + Math.cos(ph) * 0.5, 37 - Math.abs(Math.sin(ph)) * 1.2], footF: [11 + 4.5 * Math.cos(ph), Math.max(0, -Math.sin(ph)) * 3.5], footB: [-12 + 4.5 * Math.cos(ph + Math.PI), Math.max(0, -Math.sin(ph + Math.PI)) * 3.5], sway: Math.sin(ph) * 1.2 }; }, 8, 10),

    straight: seqAnim('스트레이트', 'A', 'basic', [
      K(MI, 2),
      K({ ...MI, hip: [-1.5, 36.5], lean: 5, handF: [12, 57], handB: [9, 60], headTilt: -2, sway: 1 }, 1, 'lin'),
      K({ ...MI, hip: [5, 35.5], lean: 18, footF: [14, 0], footBA: -16, handF: [42, 58], handB: [11, 58.5], headTilt: -8, sway: -1.6, hit: 'handF', streak: 1 }, 2, 'hold'),
      K({ ...MI, hip: [6, 35.3], lean: 20, footF: [14, 0], footBA: -16, handF: [42, 57.5], handB: [11, 58.5], headTilt: -8, sway: -2 }, 3),
      K(MI, 0)
    ]),
    kick: seqAnim('하이킥', 'B', 'basic', [
      K(MI, 2),
      K({ ...MI, hip: [-2, 38], lean: -2, footF: [6, 13], footFA: 30, handF: [9, 59], handB: [4, 58], headTilt: -2, sway: 1 }, 1, 'lin'),
      K({ ...MI, hip: [-4, 39], lean: -16, footB: [-11, 0], footF: [35, 50], footFA: 75, kneeF: 0.1, handF: [1, 61], handB: [-10, 53], headTilt: 10, sway: 2.2, hit: 'ankF' }, 2, 'hold'),
      K({ ...MI, hip: [-4, 39], lean: -16, footB: [-11, 0], footF: [35, 50], footFA: 75, kneeF: 0.1, handF: [1, 61], handB: [-10, 53], headTilt: 10, sway: 2.2 }, 1, 'lin'),
      K({ ...MI, hip: [-1, 37.5], lean: 3, footF: [9, 13], footFA: 20 }, 2),
      K(MI, 0)
    ]),
    elbow: seqAnim('붕격', '↓↘→ + A', 'special', [
      K(MI, 2),
      K({ ...MI, hip: [-3, 34.5], lean: 3, handF: [10, 56], handB: [5, 58], footBA: 0, headTilt: 0, sway: 1.5 }, 1, 'hold'),
      K({ ...MI, hip: [-3, 34.5], lean: 3, handF: [10, 56], handB: [5, 58], headTilt: 0, sway: 1.5 }, 2, 'out'),
      K({ ...MI, root: [30, 0], hip: [6, 33], lean: 26, footF: [19, 0], footB: [-15, 1], footBA: -26, handF: [16.4, 50], handB: [6, 50], elbB: -1, headTilt: -10, sway: -2.6, hit: 'elbF', ghost: 1 }, 2, 'hold'),
      K({ ...MI, root: [32, 0], hip: [6, 33], lean: 26, footF: [19, 0], footB: [-15, 1], footBA: -26, handF: [16.4, 50], handB: [6, 50], headTilt: -10, sway: -3 }, 4),
      K({ ...MI, root: [32, 0] }, 0)
    ]),
    upper: seqAnim('올려치기', '→↑ + A', 'special', [
      K(MI, 1),
      K({ ...MI, hip: [1, 32], lean: 16, footF: [12, 0], handF: [15, 45], handB: [9, 57], headTilt: -6, sway: 1 }, 1, 'lin'),
      K({ ...MI, root: [3, 6], hip: [2, 37], lean: 6, footF: [10, 2], footB: [-8, 0], handF: [15, 62], handB: [6, 57], headTilt: 4, sway: 1.5, hit: 'handF', streak: 1 }, 1, 'lin'),
      K({ ...MI, root: [6, 16], hip: [2, 39], lean: -2, footF: [9, 6], footFA: -10, footB: [-6, 2], handF: [12, 74], handB: [3, 57], headTilt: 12, sway: 2.2, hit: 'handF', streak: 1 }, 1, 'lin'),
      K({ ...MI, root: [9, 26], hip: [2, 39], lean: -4, footF: [9, 8], footFA: -10, footB: [-6, 3], handF: [11, 76], handB: [2, 57], headTilt: 14, sway: 2.6, hit: 'handF' }, 1, 'out'),
      K({ ...MI, root: [11, 33], hip: [2, 39], lean: -5, footF: [9, 9], footFA: -10, footB: [-6, 3], handF: [10, 76], handB: [1, 57], headTilt: 15, sway: 2.4 }, 1, 'out'),
      K({ ...MI, root: [12, 36], hip: [2, 39], lean: -6, footF: [9, 9], footFA: -10, footB: [-6, 3], handF: [10, 76], handB: [1, 57], headTilt: 16, sway: 2 }, 1, 'in'),
      K({ ...MI, root: [13, 30], hip: [1, 38], lean: 4, footF: [10, 5], footB: [-7, 3], handF: [15, 62], handB: [6, 58], headTilt: 4, sway: 0 }, 1, 'in'),
      K({ ...MI, root: [14, 14], hip: [1, 38], lean: 6, footF: [11, 3], footB: [-9, 2], handF: [16, 57], handB: [8, 59], sway: -1 }, 1, 'in'),
      K({ ...MI, root: [14, 0], hip: [0, 32], lean: 12, footF: [12, 0], handF: [15, 52], handB: [9, 57], sway: -1.5 }, 2),
      K({ ...MI, root: [14, 0] }, 0)
    ]),
    spin: seqAnim('회전 뒤차기', '↓↙← + B', 'special', [
      K(MI, 2),
      K({ ...MI, hip: [1, 37], lean: 14, footF: [5, 0], footB: [-9, 0], handF: [12, 58], handB: [4, 58], headTilt: -2, sway: 2 }, 1, 'lin'),
      K({ ...MI, flip: 1, hip: [1, 38], lean: 4, footF: [-6, 0], footB: [6, 6], handF: [-8, 58], handB: [2, 60], headTilt: 6, sway: -2, root: [4, 0] }, 1, 'lin'),
      K({ ...MI, flip: 1, root: [6, 0], hip: [3, 39], lean: 24, footF: [-6, 0], footB: [-38, 44], footBA: -80, kneeB: -0.05, handF: [6, 58], handB: [10, 50], headTilt: -16, sway: -3, hit: 'ankB' }, 2, 'hold'),
      K({ ...MI, flip: 1, root: [6, 0], hip: [3, 39], lean: 24, footF: [-6, 0], footB: [-38, 44], footBA: -80, kneeB: -0.05, handF: [6, 58], handB: [10, 50], headTilt: -16, sway: -3 }, 1, 'lin'),
      K({ ...MI, root: [8, 0], hip: [0, 36], lean: 6, footF: [8, 5], footFA: 10 }, 3),
      K({ ...MI, root: [8, 0] }, 0)
    ])
  };

  S.anims = {
    idle: loopAnim(SI, f => { const s = Math.sin(f / 8 * Math.PI * 2); return { hip: [0, 34.5 + s * 0.5], handF: [13, 47 + s * 0.6], sway: s, wrist: -14 + s * 1.5 }; }, 8, 8),
    walk: loopAnim(SI, f => { const ph = f / 8 * Math.PI * 2; return { hip: [0.5 + Math.cos(ph) * 0.5, 35 - Math.abs(Math.sin(ph)) * 1.1], footF: [12 + 4.5 * Math.cos(ph), Math.max(0, -Math.sin(ph)) * 3.5], footB: [-11 + 4.5 * Math.cos(ph + Math.PI), Math.max(0, -Math.sin(ph + Math.PI)) * 3.5], sway: Math.sin(ph) * 1.4 }; }, 8, 10),

    slash: seqAnim('내려베기', 'A', 'basic', [
      K(SI, 2),
      K({ ...SI, hip: [-4, 35.5], lean: -9, footF: [11, 0], handF: [-8, 67], wrist: 24, headTilt: 5, sway: 1.6 }, 1, 'hold'),
      K({ ...SI, hip: [-4, 35.5], lean: -9, footF: [11, 0], handF: [-8, 67], wrist: 24, headTilt: 5, sway: 1.6 }, 1, 'lin'),
      K({ ...SI, hip: [2, 33], lean: 12, footF: [15, 0], handF: [18, 71], wrist: 12, headTilt: -4, sway: 0, smear: [168, 78] }, 1, 'lin'),
      K({ ...SI, hip: [7, 31], lean: 27, footF: [18, 0], footB: [-12, 0], footBA: -20, handF: [39, 50], wrist: -6, headTilt: -10, sway: -2.2, smear: [78, 10], hit: 'tip' }, 2, 'hold'),
      K({ ...SI, hip: [7.5, 30.5], lean: 29, footF: [18, 0], footB: [-12, 0], footBA: -20, handF: [38, 40], wrist: -8, headTilt: -12, sway: -2.8 }, 4),
      K(SI, 0)
    ]),
    thrust: seqAnim('찌르기', 'B', 'basic', [
      K(SI, 1),
      K({ ...SI, hip: [-5, 35], lean: -4, footF: [10, 0], handF: [0, 50], wrist: -71, sway: 1.4 }, 2, 'in'),
      K({ ...SI, hip: [11, 30], lean: 28, footF: [25, 0], footB: [-10, 0], footBA: -18, handF: [47, 48], wrist: -11, headTilt: -12, sway: -2.6, hit: 'tip', streak: 1 }, 2, 'hold'),
      K({ ...SI, hip: [11, 30], lean: 28, footF: [25, 0], footB: [-10, 0], footBA: -18, handF: [47, 48], wrist: -11, headTilt: -12, sway: -2.6 }, 4),
      K(SI, 0)
    ]),
    wave: seqAnim('검기', '↓↘→ + A', 'special', [
      K(SI, 2),
      K({ ...SI, hip: [-4, 33], lean: 10, footF: [12, 0], handF: [2, 34], wrist: 240, headTilt: -4, sway: 1.5 }, 1, 'hold'),
      K({ ...SI, hip: [-4, 33], lean: 10, footF: [12, 0], handF: [2, 34], wrist: 240, headTilt: -4, sway: 1.5 }, 1, 'lin'),
      K({ ...SI, hip: [2, 33], lean: 14, footF: [15, 0], handF: [30, 52], wrist: 300, headTilt: -6, sway: 0, smear: [295, 335] }, 1, 'lin'),
      K({ ...SI, hip: [5, 33.5], lean: 10, footF: [16, 0], footBA: -14, handF: [28, 64], wrist: 364, headTilt: -6, sway: -2, smear: [335, 405], hit: 'tip', fx: 'wave' }, 2, 'hold'),
      K({ ...SI, hip: [4, 34], lean: 8, footF: [16, 0], footBA: -10, handF: [24, 68], wrist: 368, headTilt: -4, sway: -2.2 }, 4),
      K({ ...SI, wrist: 346 }, 0)
    ]),
    flash: seqAnim('섬광', '→→ + A', 'special', [
      K(SI, 2),
      K({ ...SI, hip: [-3, 31], lean: 16, footF: [13, 0], footB: [-12, 0], handF: [4, 40], wrist: 202, headTilt: -6, sway: 1.8 }, 2, 'hold'),
      K({ ...SI, hip: [-3, 31], lean: 16, footF: [13, 0], footB: [-12, 0], handF: [4, 40], wrist: 202, headTilt: -6, sway: 1.8 }, 1, 'lin'),
      K({ ...SI, root: [64, 0], hip: [8, 30], lean: 30, footF: [21, 0], footB: [-15, 1], footBA: -26, handF: [42, 51], wrist: 348, headTilt: -12, sway: -3, smear: [318, 368], hit: 'tip', ghost: 1 }, 2, 'hold'),
      K({ ...SI, root: [66, 0], hip: [8, 30], lean: 30, footF: [21, 0], footB: [-15, 1], footBA: -26, handF: [40, 42], wrist: 350, headTilt: -12, sway: -3.2 }, 1, 'hold'),
      K({ ...SI, root: [66, 0], hip: [8, 30], lean: 30, footF: [21, 0], footB: [-15, 1], footBA: -26, handF: [40, 42], wrist: 350, headTilt: -12, sway: -3.2 }, 4),
      K({ ...SI, root: [66, 0], wrist: 346 }, 0)
    ]),
    crescent: seqAnim('초승달', '→↑ + A', 'special', [
      K(SI, 1),
      K({ ...SI, hip: [1, 30], lean: 18, footF: [14, 0], handF: [16, 33], wrist: -31, headTilt: -8, sway: 1 }, 1, 'lin'),
      K({ ...SI, root: [3, 7], hip: [2, 36], lean: 6, footF: [11, 2], footB: [-8, 0], handF: [18, 52], wrist: -4, headTilt: 2, sway: 1.6, smear: [-32, 38], hit: 'tip' }, 1, 'lin'),
      K({ ...SI, root: [6, 17], hip: [2, 38], lean: -4, footF: [10, 8], footFA: -10, footB: [-6, 4], handF: [15, 68], wrist: 6, headTilt: 10, sway: 2.2, smear: [38, 78], hit: 'tip' }, 1, 'lin'),
      K({ ...SI, root: [9, 27], hip: [2, 38], lean: -6, footF: [10, 8], footFA: -10, footB: [-6, 4], handF: [13, 74], wrist: 10, headTilt: 12, sway: 2.6, smear: [78, 96], hit: 'tip' }, 1, 'out'),
      K({ ...SI, root: [11, 34], hip: [2, 38], lean: -7, footF: [10, 8], footFA: -10, footB: [-6, 4], handF: [12, 74], wrist: 12, headTilt: 14, sway: 2.4 }, 1, 'out'),
      K({ ...SI, root: [12, 37], hip: [2, 38], lean: -8, footF: [10, 8], footFA: -10, footB: [-6, 4], handF: [12, 74], wrist: 14, headTilt: 14, sway: 2 }, 1, 'in'),
      K({ ...SI, root: [13, 30], hip: [1, 36], lean: 6, footF: [11, 5], footB: [-7, 3], handF: [14, 55], wrist: -10, headTilt: 2, sway: 0 }, 1, 'in'),
      K({ ...SI, root: [14, 14], hip: [1, 36], lean: 8, footF: [12, 3], footB: [-9, 2], handF: [14, 50], wrist: -14, sway: -1 }, 1, 'in'),
      K({ ...SI, root: [14, 0], hip: [0, 31], lean: 12, footF: [14, 0], handF: [14, 42], wrist: -20, sway: -1.5 }, 2),
      K({ ...SI, root: [14, 0] }, 0)
    ])
  };

  // ---------- game-state animations ----------
  const MC = { ...MI, hip: [0, 25], lean: 20, footF: [12, 0], footB: [-12, 0], handF: [17, 44], handB: [11, 47], headTilt: -6 };
  const MA = { ...MI, hip: [0, 40], lean: 8, footF: [10, 10], footB: [-6, 8], handF: [14, 58], handB: [8, 60], headTilt: -2 };
  const SC = { ...SI, hip: [0, 24], lean: 18, footF: [13, 0], footB: [-12, 0], handF: [15, 36], wrist: -8, headTilt: -6 };
  const SA = { ...SI, hip: [0, 40], lean: 6, footF: [10, 10], footB: [-6, 8], handF: [14, 52], wrist: -10, headTilt: -2 };
  const pose1 = p => ({ loop: true, frames: 1, fps: 1, pose: () => p });
  const keysA = (keys, fps) => seqAnim('', '', 'sys', keys, fps);

  function commonAnims(I, C, A, extra) {
    const X = extra;
    return {
      crouch: loopAnim(C, f => { const s = Math.sin(f / 6 * Math.PI * 2); return { hip: [C.hip[0], C.hip[1] + s * 0.4], sway: s * 0.6 }; }, 6, 8),
      block: pose1({ ...I, ...X.block }),
      cblock: pose1({ ...C, ...X.cblock }),
      jump: keysA([K({ ...I, hip: [0, 30], lean: 14, ...X.squat }, 1, 'lin'), K({ ...A, footF: [10, 4], footB: [-8, 2], lean: 4 }, 1, 'lin'), K({ ...A, footF: [12, 14], footB: [-4, 13], lean: 10, sway: 2 }, 1, 'lin'), K({ ...A, footF: [10, 6], footB: [-8, 4], sway: -1 }, 1, 'lin'), K({ ...A, footF: [10, 1], footB: [-8, 0], lean: 6 }, 0)], 15),
      air: pose1(A),
      dash: keysA([K({ ...I, hip: [2, 34], lean: 24, footF: [15, 1], footB: [-14, 3], footBA: -20, sway: -2, ...X.dash }, 2, 'lin'), K({ ...I, hip: [2, 35], lean: 18, footF: [14, 0], footB: [-10, 1], sway: -1, ...X.dash }, 2), K(I, 0)], 15),
      bdash: keysA([K({ ...I, hip: [-2, 39], lean: -8, footF: [8, 5], footB: [-12, 2], sway: 2 }, 2, 'lin'), K({ ...I, hip: [-1, 36], lean: 2, footF: [10, 1], footB: [-13, 0], sway: 1 }, 2), K(I, 0)], 15),
      hurt: keysA([K({ ...I, hip: [-4, 37], lean: -18, headTilt: 20, headRot: 16, sway: 3, ...X.hurt }, 1, 'hold'), K({ ...I, hip: [-4, 37], lean: -18, headTilt: 20, headRot: 16, sway: 3, ...X.hurt }, 2, 'out'), K({ ...I, hip: [-2, 36.5], lean: -6, headTilt: 8, headRot: 6, sway: 1, ...X.hurt }, 2), K(I, 0)], 15),
      hurtLow: keysA([K({ ...C, lean: 0, headTilt: 16, headRot: 12, sway: 2.5, ...X.hurtLow }, 3, 'out'), K({ ...C, lean: 10, headTilt: 6, ...X.hurtLow }, 2), K(C, 0)], 15),
      tumble: pose1({ ...I, hip: [0, 20], lean: -70, headTilt: -20, headRot: 50, footF: [18, 26], footB: [12, 32], kneeF: 1, kneeB: 1, sway: 3, ...X.tumble }),
      down: pose1({ ...I, hip: [0, 5], lean: -92, headTilt: -64, headRot: 88, footF: [34, 0], footB: [30, 0], footFA: -60, footBA: -60, sway: 2, ...X.down }),
      getup: keysA([K({ ...I, hip: [0, 5], lean: -92, headTilt: -64, headRot: 88, footF: [34, 0], footB: [30, 0], footFA: -60, footBA: -60, ...X.down }, 2), K({ ...C, hip: [-2, 14], lean: 34, footF: [16, 0], footB: [2, 0], headTilt: -10, ...X.sit }, 2), K(C, 2), K(I, 0)], 12),
      win: loopAnim({ ...I, ...X.win }, f => { const s = Math.sin(f / 8 * Math.PI * 2); return { hip: [I.hip[0], (X.win.hip || I.hip)[1] + s * 0.4], sway: s }; }, 8, 6)
    };
  }

  Object.assign(M.anims, commonAnims(MI, MC, MA, {
    block: { hip: [-1, 37], lean: -2, handF: [13, 65], handB: [11, 62], headTilt: 6 },
    cblock: { lean: 12, handF: [14, 51], handB: [12, 49], headTilt: 2 },
    squat: { handF: [15, 50], handB: [10, 53] },
    dash: { handF: [20, 50], handB: [12, 54] },
    hurt: { handF: [8, 52], handB: [2, 54] },
    hurtLow: { handF: [10, 40], handB: [6, 42] },
    tumble: { handF: [-10, 32], handB: [-14, 26] },
    down: { handF: [-14, 4], handB: [-10, 6] },
    sit: { handF: [6, 10], handB: [-6, 8] },
    win: { hip: [0, 38], lean: 2, footF: [8, 0], footB: [-8, 0], handF: [6, 82], handB: [8, 57], headTilt: -8, headRot: -6 }
  }));
  Object.assign(S.anims, commonAnims(SI, SC, SA, {
    block: { lean: -4, handF: [10, 58], wrist: -16, headTilt: 4 },
    cblock: { lean: 10, handF: [12, 42], wrist: -15 },
    squat: { handF: [13, 40] },
    dash: { handF: [20, 44], wrist: -4 },
    hurt: { handF: [6, 46], wrist: 30 },
    hurtLow: { handF: [8, 32], wrist: 20 },
    tumble: { handF: [-8, 30], wrist: 90 },
    down: { handF: [-8, 6], wrist: 91 },
    sit: { handF: [8, 12], wrist: 10 },
    win: { hip: [0, 37], lean: 0, footF: [9, 0], footB: [-8, 0], handF: [6, 60], wrist: 24, headTilt: -6, headRot: -4 }
  }));

  Object.assign(M.anims, {
    jab: seqAnim('잽', 'A', 'basic', [
      K(MI, 1),
      K({ ...MI, hip: [1, 37], lean: 11, handF: [14, 57] }, 1, 'lin'),
      K({ ...MI, hip: [3, 36.5], lean: 14, footF: [12, 0], handF: [38, 60], handB: [10, 59], headTilt: -6, sway: -1, hit: 'handF', streak: 1 }, 1, 'hold'),
      K({ ...MI, hip: [3, 36.5], lean: 14, footF: [12, 0], handF: [38, 60], handB: [10, 59], headTilt: -6, sway: -1 }, 2),
      K(MI, 0)
    ]),
    cjab: seqAnim('앉아 지르기', '↓ + A', 'basic', [
      K(MC, 1),
      K({ ...MC, hip: [2, 25], lean: 22, handF: [37, 46], handB: [10, 46], sway: -1, hit: 'handF', streak: 1 }, 1, 'hold'),
      K({ ...MC, hip: [2, 25], lean: 22, handF: [37, 46], handB: [10, 46], sway: -1 }, 2),
      K(MC, 0)
    ]),
    sweep: seqAnim('다리 쓸기', '↓ + B', 'basic', [
      K(MC, 1),
      K({ ...MC, hip: [-3, 22], lean: 26, footF: [6, 2], handF: [10, 30], handB: [-2, 26] }, 1, 'lin'),
      K({ ...MC, hip: [-4, 20], lean: 34, footB: [-12, 0], footF: [39, 1], footFA: -8, kneeF: 0.2, handF: [6, 24], handB: [-6, 22], sway: 2, hit: 'ankF' }, 2, 'hold'),
      K({ ...MC, hip: [-4, 20], lean: 34, footB: [-12, 0], footF: [39, 1], footFA: -8, kneeF: 0.2, handF: [6, 24], handB: [-6, 22], sway: 2 }, 3),
      K(MC, 0)
    ]),
    jA: seqAnim('공중 주먹', '공중 A', 'basic', [
      K(MA, 1),
      K({ ...MA, lean: 22, handF: [34, 44], handB: [8, 58], hit: 'handF', streak: 1 }, 1, 'hold'),
      K({ ...MA, lean: 22, handF: [34, 44], handB: [8, 58] }, 3),
      K(MA, 0)
    ]),
    jB: seqAnim('날아차기', '공중 B', 'basic', [
      K(MA, 1),
      K({ ...MA, lean: -8, footF: [35, 22], footFA: 20, kneeF: 0.1, footB: [-6, 14], handF: [10, 60], handB: [-2, 58], sway: 2, hit: 'ankF' }, 1, 'hold'),
      K({ ...MA, lean: -8, footF: [35, 22], footFA: 20, kneeF: 0.1, footB: [-6, 14], handF: [10, 60], handB: [-2, 58], sway: 2 }, 4),
      K(MA, 0)
    ])
  });

  Object.assign(S.anims, {
    cthrust: seqAnim('앉아 찌르기', '↓ + A', 'basic', [
      K(SC, 1),
      K({ ...SC, hip: [-2, 24], lean: 14, handF: [6, 34], wrist: -24 }, 1, 'lin'),
      K({ ...SC, hip: [6, 22], lean: 30, footF: [22, 0], handF: [40, 24], wrist: -8, hit: 'tip', streak: 1 }, 1, 'hold'),
      K({ ...SC, hip: [6, 22], lean: 30, footF: [22, 0], handF: [40, 24], wrist: -8 }, 3),
      K(SC, 0)
    ]),
    lowslash: seqAnim('다리 베기', '↓ + B', 'basic', [
      K(SC, 1),
      K({ ...SC, hip: [-3, 25], lean: 6, handF: [4, 48], wrist: 50 }, 1, 'hold'),
      K({ ...SC, hip: [-3, 25], lean: 6, handF: [4, 48], wrist: 50 }, 1, 'lin'),
      K({ ...SC, hip: [5, 21], lean: 32, footF: [21, 0], handF: [36, 22], wrist: -14, smear: [100, -32], hit: 'tip' }, 2, 'hold'),
      K({ ...SC, hip: [5, 21], lean: 32, footF: [21, 0], handF: [35, 18], wrist: -18 }, 3),
      K(SC, 0)
    ]),
    jA: seqAnim('공중 베기', '공중 A', 'basic', [
      K(SA, 1),
      K({ ...SA, handF: [6, 58], wrist: 40 }, 1, 'lin'),
      K({ ...SA, lean: 18, handF: [34, 44], wrist: -6, smear: [110, -10], hit: 'tip' }, 1, 'hold'),
      K({ ...SA, lean: 18, handF: [34, 44], wrist: -6 }, 3),
      K(SA, 0)
    ]),
    jB: seqAnim('공중 내려베기', '공중 B', 'basic', [
      K(SA, 1),
      K({ ...SA, lean: -6, handF: [-4, 66], wrist: 30 }, 1, 'hold'),
      K({ ...SA, lean: -6, handF: [-4, 66], wrist: 30 }, 1, 'lin'),
      K({ ...SA, lean: 24, handF: [28, 34], wrist: -10, smear: [160, -44], hit: 'tip' }, 1, 'hold'),
      K({ ...SA, lean: 24, handF: [28, 34], wrist: -10 }, 3),
      K(SA, 0)
    ])
  });
  root.BasePoses = { MI, MC, MA, SI, SC, SA };
})(typeof window !== 'undefined' ? window : globalThis);
