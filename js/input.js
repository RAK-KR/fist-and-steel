// Keyboard and gamepad input. Produces absolute direction + button bits per player each tick.
window.G = window.G || {};
G.Input = (function () {
  const held = {};
  const MAP = {
    p1: { u: ['KeyW'], d: ['KeyS'], l: ['KeyA'], r: ['KeyD'], A: ['KeyJ'], B: ['KeyK'] },
    p2: { u: ['ArrowUp'], d: ['ArrowDown'], l: ['ArrowLeft'], r: ['ArrowRight'], A: ['Numpad1', 'Period'], B: ['Numpad2', 'Slash'] }
  };
  const GAME_KEYS = new Set([].concat(...Object.values(MAP.p1), ...Object.values(MAP.p2)));
  let solo = true;
  window.addEventListener('keydown', e => {
    if (GAME_KEYS.has(e.code)) { e.preventDefault(); held[e.code] = true; }
    if (G.onKey) G.onKey(e);
  });
  window.addEventListener('keyup', e => { if (GAME_KEYS.has(e.code)) held[e.code] = false; });
  window.addEventListener('blur', () => { for (const k in held) held[k] = false; });

  function any(list) { for (const k of list) if (held[k]) return true; return false; }
  function fromKeys(m) { return { u: any(m.u), d: any(m.d), l: any(m.l), r: any(m.r), A: any(m.A), B: any(m.B) }; }
  function fromPad(i) {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && pads[i];
    if (!p) return null;
    const b = k => !!(p.buttons[k] && p.buttons[k].pressed);
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    return { u: b(12) || ay < -0.5, d: b(13) || ay > 0.5, l: b(14) || ax < -0.5, r: b(15) || ax > 0.5, A: b(2) || b(0), B: b(3) || b(1), start: b(9) };
  }
  function or(a, b) { if (!b) return a; return { u: a.u || b.u, d: a.d || b.d, l: a.l || b.l, r: a.r || b.r, A: a.A || b.A, B: a.B || b.B }; }

  return {
    setSolo(v) { solo = v; },
    read(player) {
      if (player === 0) {
        let s = fromKeys(MAP.p1);
        if (solo) s = or(s, fromKeys(MAP.p2));
        return or(s, fromPad(0));
      }
      return or(fromKeys(MAP.p2), fromPad(1));
    },
    padStart(i) { const p = fromPad(i); return p && p.start; },
    held
  };
})();

// Relative numpad direction (6 = toward the opponent).
G.relDir = function (inp, face) {
  const f = face > 0 ? inp.r : inp.l, b = face > 0 ? inp.l : inp.r;
  const h = f && !b ? 1 : b && !f ? -1 : 0;
  const v = inp.u && !inp.d ? 1 : inp.d && !inp.u ? -1 : 0;
  return 5 + h + v * 3;
};
