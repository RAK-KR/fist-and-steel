// Frame data (60 ticks per second).
// s: startup, a: active, r: recovery, dmg: damage, hs: hitstun, bs: blockstun
// lvl: high | mid | low | over, str: hit strength 1-3 (hitstop / sound / spark)
// chain: next normal on button press after connecting, cancel: can cancel into specials
// launch: [vx, vy] puts the opponent airborne, kd: knockdown, inv: [from, to] invincible ticks
window.G = window.G || {};
G.MOVES = {
  MUHYEOK: {
    jab: { anim: 'jab', s: 4, a: 3, r: 9, dmg: 45, hs: 15, bs: 10, lvl: 'high', push: 2.2, str: 1, chain: { A: 'straight' }, cancel: true },
    straight: { anim: 'straight', s: 6, a: 3, r: 14, dmg: 62, hs: 18, bs: 12, lvl: 'high', push: 2.6, str: 2, chain: { B: 'kick' }, cancel: true },
    kick: { anim: 'kick', s: 10, a: 4, r: 18, dmg: 88, hs: 20, bs: 14, lvl: 'mid', push: 3.4, str: 2, cancel: true },
    cjab: { anim: 'cjab', s: 4, a: 3, r: 9, dmg: 35, hs: 14, bs: 9, lvl: 'high', push: 2, str: 1, crouch: true, chain: { A: 'cjab', B: 'sweep' }, cancel: true },
    sweep: { anim: 'sweep', s: 8, a: 4, r: 22, dmg: 70, hs: 0, bs: 12, lvl: 'low', push: 2, str: 2, crouch: true, kd: true, trip: true },
    jA: { anim: 'jA', s: 5, a: 8, r: 4, dmg: 50, hs: 16, bs: 10, lvl: 'over', push: 1.8, str: 1, air: true },
    jB: { anim: 'jB', s: 7, a: 10, r: 4, dmg: 70, hs: 19, bs: 12, lvl: 'over', push: 2.4, str: 2, air: true },
    elbow: { anim: 'elbow', s: 11, a: 4, r: 22, dmg: 120, hs: 24, bs: 16, lvl: 'mid', push: 4, str: 3, special: '236', btn: 'A' },
    upper: { anim: 'upper', box: [4, 16, 32, 84], s: 5, a: 8, r: 17, dmg: 100, hs: 0, bs: 16, lvl: 'mid', push: 1, str: 3, launch: [0.3, -6.2], inv: [0, 9], special: '6_8', btn: 'A' },
    spin: { anim: 'spin', s: 14, a: 4, r: 24, dmg: 140, hs: 0, bs: 18, lvl: 'mid', push: 3, str: 3, launch: [3.6, -4.6], kd: true, special: '214', btn: 'B' }
  },
  SERIN: {
    thrust: { anim: 'thrust', s: 8, a: 3, r: 16, dmg: 38, hs: 15, bs: 10, lvl: 'mid', push: 2.4, str: 1, chain: { A: 'slash' }, cancel: true, blade: true },
    slash: { anim: 'slash', s: 13, a: 3, r: 22, dmg: 72, hs: 20, bs: 14, lvl: 'mid', push: 3.2, str: 2, cancel: true, blade: true },
    cthrust: { anim: 'cthrust', s: 6, a: 3, r: 13, dmg: 35, hs: 14, bs: 9, lvl: 'low', push: 2, str: 1, crouch: true, chain: { B: 'lowslash' }, cancel: true, blade: true },
    lowslash: { anim: 'lowslash', s: 12, a: 4, r: 30, dmg: 52, hs: 0, bs: 12, lvl: 'low', push: 2, str: 2, crouch: true, kd: true, trip: true, blade: true },
    jA: { anim: 'jA', s: 5, a: 8, r: 4, dmg: 50, hs: 16, bs: 10, lvl: 'over', push: 1.8, str: 1, air: true, blade: true },
    jB: { anim: 'jB', s: 8, a: 8, r: 4, dmg: 75, hs: 19, bs: 12, lvl: 'over', push: 2.4, str: 2, air: true, blade: true },
    wave: { anim: 'wave', s: 12, a: 2, r: 30, dmg: 0, hs: 0, bs: 0, lvl: 'mid', str: 2, special: '236', btn: 'A', proj: { dmg: 60, hs: 18, bs: 12, lvl: 'mid', spd: 4.2, push: 2.6, str: 2 } },
    flash: { anim: 'flash', box: [-34, 16, 34, 62], s: 10, a: 4, r: 22, dmg: 110, hs: 24, bs: 16, lvl: 'mid', push: 3, str: 3, special: '66', btn: 'A', pass: true, blade: true },
    crescent: { anim: 'crescent', box: [6, 16, 42, 86], s: 6, a: 8, r: 17, dmg: 100, hs: 0, bs: 16, lvl: 'mid', push: 1, str: 3, launch: [0.3, -6.2], inv: [0, 9], special: '6_8', btn: 'A', blade: true }
  }
};
G.NORMALS = {
  MUHYEOK: { A: 'jab', B: 'kick', cA: 'cjab', cB: 'sweep', jA: 'jA', jB: 'jB' },
  SERIN: { A: 'thrust', B: 'slash', cA: 'cthrust', cB: 'lowslash', jA: 'jA', jB: 'jB' }
};
G.MOTION_LABEL = { '236': '↓↘→', '214': '↓↙←', '6_8': '→↑', '66': '→→' };
