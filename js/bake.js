// Pre-renders every animation frame into canvases and extracts hit boxes.
window.G = window.G || {};
G.SPR = {};

G.bakeAll = function (onProgress, onDone, palettes) {
  const jobs = [];
  for (const id of G.CHARS) {
    const C = Fighters[id];
    for (const pal of (palettes || [0, 1])) for (const name in C.anims) jobs.push([id, pal, name]);
  }
  let i = 0;
  function step() {
    const t0 = performance.now();
    while (i < jobs.length && performance.now() - t0 < 24) { G.bakeAnim(...jobs[i]); i++; }
    onProgress && onProgress(i / jobs.length);
    if (i < jobs.length) setTimeout(step, 0); else onDone && onDone();
  }
  step();
};

G.bakeAnim = function (id, pal, name) {
  const C = Fighters[id], A = C.anims[name];
  const { FW, FH } = PixelRig;
  const frames = [];
  let hitIdx = -1, hitN = 0, hb = null;
  for (let k = 0; k < A.frames; k++) {
    const P = A.pose(k);
    const r = Fighters.renderFrame(C, P, pal === 1);
    const c = document.createElement('canvas'); c.width = FW; c.height = FH;
    c.getContext('2d').putImageData(new ImageData(r.img, FW, FH), 0, 0);
    let box = null;
    if (P.hit) {
      if (hitIdx < 0) hitIdx = k;
      hitN++;
      const SEG = { handF: 'elbF', handB: 'elbB', elbF: 'shF', ankF: 'kneeF', ankB: 'kneeB' };
      let p0, p1;
      if (P.hit === 'tip') { const g = r.J.handF, t0 = r.J.tip, e = r.J.elbF; p0 = [(e[0] + g[0]) / 2, (e[1] + g[1]) / 2]; p1 = [g[0] + (t0[0] - g[0]) * 0.88, g[1] + (t0[1] - g[1]) * 0.88]; }
      else { p1 = r.J[P.hit]; const j = r.J[SEG[P.hit]] || p1; p0 = [j[0] + (p1[0] - j[0]) * 0.25, j[1] + (p1[1] - j[1]) * 0.25]; }
      const pad = P.hit === 'tip' ? 3 : 5;
      box = [Math.min(p0[0], p1[0]) - pad, Math.min(p0[1], p1[1]) - pad, Math.max(p0[0], p1[0]) + pad, Math.max(p0[1], p1[1]) + pad];
      if (!hb) hb = box;
    }
    frames.push({ c, root: P.root || [0, 0], box, flip: !!P.flip, fx: P.fx || null, ghost: !!P.ghost });
  }
  G.SPR[id] = G.SPR[id] || {};
  G.SPR[id][pal] = G.SPR[id][pal] || {};
  G.SPR[id][pal][name] = { frames, n: frames.length, hitIdx, hitN, hb, loop: !!A.loop, fps: A.fps };
};

// Map a move tick to an animation frame using startup / active / recovery.
G.moveFrame = function (spr, mv, t) {
  const n = spr.n, h = Math.max(1, spr.hitIdx), hn = Math.max(1, spr.hitN);
  if (t < mv.s) return Math.min(h - 1, Math.floor(t / mv.s * h));
  if (t < mv.s + mv.a) return Math.min(h + hn - 1, h + Math.floor((t - mv.s) / mv.a * hn));
  const rest = n - h - hn;
  if (rest <= 0) return n - 1;
  return Math.min(n - 1, h + hn + Math.floor((t - mv.s - mv.a) / mv.r * rest));
};
