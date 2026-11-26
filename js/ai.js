// CPU opponent. Produces the same input bits a player would.
window.G = window.G || {};
G.AI = (function () {
  const R = Math.random;
  function create(level) {
    const L = { easy: { react: [16, 24], block: 0.3, combo: 0.35, aa: 0.2, think: [18, 30] },
      normal: { react: [10, 16], block: 0.55, combo: 0.7, aa: 0.45, think: [10, 20] },
      hard: { react: [6, 10], block: 0.8, combo: 0.9, aa: 0.7, think: [6, 12] } }[level || 'normal'];
    return { L, plan: [], wait: 20, threat: false, reactAt: 0, willBlock: false };
  }
  const rnd = (a, b) => a + Math.floor(R() * (b - a + 1));
  function toAbs(s, face) {
    const d = s.d || 5, h = ((d - 1) % 3) - 1, v = d >= 7 ? 1 : d <= 3 ? -1 : 0;
    return { u: v > 0, d: v < 0, r: (h === 1 && face > 0) || (h === -1 && face < 0), l: (h === 1 && face < 0) || (h === -1 && face > 0), A: !!s.A, B: !!s.B };
  }
  function motionPlan(code, btn) {
    const P = o => Object.assign(o, {});
    if (code === '236') return [{ d: 2 }, { d: 2 }, { d: 3 }, { d: 3 }, P({ d: 6, [btn]: 1 }), { d: 6 }];
    if (code === '214') return [{ d: 2 }, { d: 2 }, { d: 1 }, { d: 1 }, P({ d: 4, [btn]: 1 }), { d: 4 }];
    if (code === '6_8') return [{ d: 6 }, { d: 6 }, P({ d: 9, [btn]: 1 }), { d: 5 }];
    if (code === '66') return [{ d: 6 }, { d: 5 }, P({ d: 6, [btn]: 1 }), { d: 5 }];
    return [];
  }
  const press = (btn, d) => [{ d: d || 5, [btn]: 1 }, { d: d || 5 }];
  const hold = (d, n) => Array.from({ length: n }, () => ({ d }));
  function special(f, name) { const m = G.MOVES[f.id][name]; return motionPlan(m.special, m.btn); }

  function think(ai, g, f, o) {
    const dx = Math.abs(G.Sim.ex(o) - G.Sim.ex(f));
    const M = f.id === 'MUHYEOK';
    const r = R();
    if (o.st === 'juggle' && dx < 80) { ai.plan = M ? press('A') : press('A'); return; }
    if (M) {
      if (dx > 100) ai.plan = r < 0.2 ? hold(9, 2).concat(hold(5, 18), press('B')) : r < 0.5 ? [{ d: 6 }, { d: 5 }, { d: 6 }].concat(hold(5, 8)) : hold(6, rnd(12, 26));
      else if (dx > 62) ai.plan = r < 0.25 ? special(f, 'elbow') : r < 0.5 ? [{ d: 6 }, { d: 5 }, { d: 6 }].concat(hold(5, 6)) : r < 0.6 ? hold(1, 14) : r < 0.7 ? hold(9, 2).concat(hold(5, 16), press('B')) : hold(6, rnd(8, 16));
      else ai.plan = r < 0.28 ? press('A') : r < 0.42 ? press('A', 2) : r < 0.55 ? press('B', 2) : r < 0.66 ? press('B') : r < 0.74 ? special(f, 'spin') : r < 0.86 ? hold(4, 14) : hold(1, 16);
    } else {
      if (dx > 160) ai.plan = r < 0.4 ? special(f, 'wave').concat(hold(5, 20)) : hold(6, rnd(10, 22));
      else if (dx > 85) ai.plan = r < 0.3 ? special(f, 'wave').concat(hold(5, 14)) : r < 0.45 ? special(f, 'flash') : r < 0.65 ? press('A') : hold(6, rnd(8, 14));
      else ai.plan = r < 0.25 ? press('A') : r < 0.4 ? press('A', 2) : r < 0.52 ? press('B', 2) : r < 0.62 ? press('B') : r < 0.75 ? [{ d: 4 }, { d: 5 }, { d: 4 }].concat(hold(5, 10)) : hold(4, 14);
    }
  }

  function input(ai, g, side) {
    const f = g.f[side], o = g.f[1 - side];
    if (g.phase !== 'fight') { ai.plan = []; return toAbs({ d: 5 }, f.face); }
    const dx = Math.abs(G.Sim.ex(o) - G.Sim.ex(f));
    // combos
    if (f.st === 'attack' && f.connected && f.mt >= f.mv.s && !ai.plan.length) {
      if (R() < ai.L.combo) {
        const mv = f.mv;
        if (mv.chain) { const b = Object.keys(mv.chain)[0]; ai.plan = press(b, G.MOVES[f.id][mv.chain[b]].crouch ? 2 : 5); }
        else if (mv.cancel) ai.plan = f.id === 'MUHYEOK' ? (R() < 0.6 ? special(f, 'elbow') : special(f, 'upper')) : (R() < 0.5 ? special(f, 'crescent') : special(f, 'flash'));
      } else ai.plan = hold(5, 4);
    }
    if (ai.plan.length) return toAbs(ai.plan.shift(), f.face);
    const free = ['idle', 'walk', 'crouch', 'block', 'cblock', 'land'].includes(f.st);
    // defense
    const projIn = g.proj.find(p => p.owner !== side && Math.abs(p.x - G.Sim.ex(f)) < 130 && Math.sign(G.Sim.ex(f) - p.x) === Math.sign(p.vx));
    const threat = (o.st === 'attack' && o.mt < o.mv.s + o.mv.a && dx < 120 && !o.mv.proj) || !!projIn;
    if (threat && !ai.threat) { ai.threat = true; ai.reactAt = g.tick + rnd(...ai.L.react); ai.willBlock = R() < ai.L.block; ai.low = o.st === 'attack' && (o.mv.lvl === 'low' || (o.mv.lvl !== 'over' && o.mv.lvl !== 'high' && R() < 0.5)); ai.over = o.st === 'attack' && o.mv.lvl === 'over'; }
    if (!threat) ai.threat = false;
    if (ai.threat && free && g.tick >= ai.reactAt) {
      if (projIn && !ai.projJudged) { ai.projJudged = true; const pd = Math.abs(projIn.x - G.Sim.ex(f)); if (pd > 45 && R() < ai.L.block * 0.8) { ai.plan = hold(9, 3).concat(hold(5, 16), press('B')); return toAbs(ai.plan.shift(), f.face); } }
      if (ai.willBlock) return toAbs({ d: ai.low ? 1 : 4 }, f.face);
    }
    if (!projIn) ai.projJudged = false;
    // anti-air
    if (free && (o.st === 'air' || (o.st === 'attack' && o.mv.air)) && dx < 85 && dx > 20 && !ai.aaTried) {
      ai.aaTried = true;
      if (R() < ai.L.aa) { ai.plan = special(f, f.id === 'MUHYEOK' ? 'upper' : 'crescent'); return toAbs(ai.plan.shift(), f.face); }
    }
    if (!(o.st === 'air' || (o.st === 'attack' && o.mv && o.mv.air))) ai.aaTried = false;
    if (!free) return toAbs({ d: 5 }, f.face);
    if (--ai.wait > 0) return toAbs({ d: f.st === 'crouch' ? 2 : 5 }, f.face);
    ai.wait = rnd(...ai.L.think);
    think(ai, g, f, o);
    return toAbs(ai.plan.length ? ai.plan.shift() : { d: 5 }, f.face);
  }

  function dummy(mode, g, side) {
    const f = g.f[side], o = g.f[1 - side];
    if (mode === 'crouch') return toAbs({ d: 2 }, f.face);
    if (mode === 'block') {
      const atk = o.st === 'attack' && o.mv;
      const proj = g.proj.some(p => p.owner !== side);
      if (!atk && !proj && f.st !== 'block' && f.st !== 'cblock') return toAbs({ d: 5 }, f.face);
      const low = atk && o.mv.lvl === 'low', over = atk && o.mv.lvl === 'over';
      return toAbs({ d: low ? 1 : over ? 4 : (f.dir === 1 ? 1 : 4) }, f.face);
    }
    return toAbs({ d: 5 }, f.face);
  }

  return { create, input, dummy };
})();
