// Deterministic fixed-step fight simulation (60 ticks per second).
window.G = window.G || {};
G.Sim = (function () {
  const GRAV = 0.34, JUMP_VY = 6.3, JUMP_VX = 2.1, DASH_V = 4.4, BDASH_V = 3.8;
  const WALK = { MUHYEOK: [1.75, 1.3, 4.9], SERIN: [1.4, 1.1, 4.2] };
  const NEUTRAL = new Set(['idle', 'walk', 'crouch']);
  const STOP = [0, 7, 10, 13];

  function newFighter(id, pal, side) {
    return {
      id, pal, side, x: G.STAGE_W / 2 + (side ? 62 : -62), y: 0, vx: 0, vy: 0, face: side ? -1 : 1,
      hp: G.HP[id], maxHp: G.HP[id], st: 'idle', t: 0, mv: null, mvName: null, mt: 0, hitDone: false, connected: false, root: [0, 0],
      stun: 0, juggle: 0, combo: 0, comboDmg: 0, buf: [], prevA: false, prevB: false, pa: 0, pb: 0,
      airUsed: false, jdir: 0, wins: 0, dir: 5, inp: null, crouchBlock: false, showCombo: null, lastHitT: 0
    };
  }

  function newGame(cfg) {
    const g = {
      mode: cfg.mode, f: [newFighter(cfg.p1, cfg.pal1 || 0, 0), newFighter(cfg.p2, cfg.pal2 || 0, 1)],
      proj: [], events: [], stop: 0, tick: 0, round: 1, timer: G.ROUND_TIME * 60, phase: 'intro', phaseT: 0,
      winner: -1, matchWinner: -1, slow: 0, training: cfg.mode === 'training', dummy: cfg.dummy || 'stand'
    };
    if (g.training) g.phase = 'fight';
    return g;
  }

  function resetRound(g) {
    const w = [g.f[0].wins, g.f[1].wins];
    g.f = [newFighter(g.f[0].id, g.f[0].pal, 0), newFighter(g.f[1].id, g.f[1].pal, 1)];
    g.f[0].wins = w[0]; g.f[1].wins = w[1];
    g.proj = []; g.stop = 0; g.timer = G.ROUND_TIME * 60; g.phase = 'intro'; g.phaseT = 0; g.winner = -1; g.slow = 0;
  }

  const ex = f => f.x + f.face * f.root[0];
  const ey = f => f.y + f.root[1];
  const spr = (f, anim) => G.SPR[f.id][f.pal][anim];

  // ---------- command detection ----------
  function seqIn(buf, seq, win, recent) {
    const n = buf.length, start = Math.max(0, n - win);
    let k = seq.length - 1, lastPos = -1;
    for (let i = n - 1; i >= start && k >= 0; i--) {
      if (seq[k].includes(buf[i])) { if (k === seq.length - 1) lastPos = i; k--; }
    }
    return k < 0 && lastPos >= n - recent;
  }
  function motion(f, code) {
    const b = f.buf;
    if (code === '236') return seqIn(b, [[2], [3], [6]], 18, 8);
    if (code === '214') return seqIn(b, [[2], [1], [4]], 18, 8);
    if (code === '6_8') return seqIn(b, [[6], [7, 8, 9]], 14, 7);
    if (code === '66') return seqIn(b, [[6], [5, 2, 8, 4, 1, 3, 7], [6]], 18, 8);
    return false;
  }
  function dashTap(f, d) {
    const b = f.buf, n = b.length;
    if (n < 3 || b[n - 1] !== d || b[n - 2] === d) return false;
    for (let i = n - 2; i >= Math.max(0, n - 14); i--) if (b[i] === d && b[i + 1] !== d) return true;
    return false;
  }
  function trySpecial(f, btn) {
    const M = G.MOVES[f.id];
    for (const code of ['6_8', '236', '214', '66']) for (const k in M) {
      const m = M[k];
      if (m.special === code && m.btn === btn && motion(f, code)) return k;
    }
    return null;
  }
  function normalFor(f, btn, air) {
    const N = G.NORMALS[f.id];
    if (air) return N['j' + btn];
    return f.dir <= 3 ? N['c' + btn] : N[btn];
  }

  // ---------- state helpers ----------
  function setSt(f, st) { f.st = st; f.t = 0; }
  function commitRoot(f) {
    if (f.root[0] || f.root[1]) { f.x += f.face * f.root[0]; f.y += f.root[1]; f.root = [0, 0]; }
  }
  function startMove(g, f, name) {
    commitRoot(f);
    const mv = G.MOVES[f.id][name];
    f.st = 'attack'; f.t = 0; f.mv = mv; f.mvName = name; f.mt = 0; f.hitDone = false; f.connected = false; f.root = [0, 0];
    if (!mv.air) { f.vx = 0; f.vy = 0; }
    f.pa = 0; f.pb = 0;
    if (mv.air) f.airUsed = true;
  }
  function toNeutral(f) {
    commitRoot(f);
    f.mv = null; f.mvName = null;
    if (f.y > 0) { setSt(f, 'air'); return; }
    f.y = 0; f.vx = 0;
    setSt(f, f.dir <= 3 ? 'crouch' : 'idle');
  }
  function isCrouching(f) {
    return f.st === 'crouch' || f.st === 'cblock' || f.st === 'hurtc' || (f.st === 'attack' && !!f.mv && !!f.mv.crouch) || (f.st === 'land');
  }
  function airborne(f) {
    return f.y > 0.01 || f.st === 'juggle' || f.st === 'air' || f.root[1] > 2;
  }

  // ---------- boxes ----------
  function worldBox(f, b) {
    const X = ex(f), Y = ey(f);
    const x0 = f.face > 0 ? X + b[0] : X - b[2], x1 = f.face > 0 ? X + b[2] : X - b[0];
    return [x0, Y + b[1], x1, Y + b[3]];
  }
  function moveBox(f) {
    const s = spr(f, f.mv.anim), fi = G.moveFrame(s, f.mv, f.mt);
    const b = f.mv.box || s.frames[fi].box || s.hb;
    return b ? worldBox(f, b) : null;
  }
  function hurtBoxes(f) {
    if (f.st === 'down' || f.st === 'getup' || f.st === 'ko' || f.st === 'win' || f.st === 'lose') return [];
    if (f.st === 'attack' && f.mv.inv && f.mt >= f.mv.inv[0] && f.mt < f.mv.inv[1]) return [];
    const X = ex(f), Y = ey(f), out = [];
    if (f.st === 'juggle') out.push([X - 16, Y + 6, X + 16, Y + 38]);
    else if (isCrouching(f)) out.push([X - 11, Y, X + 11, Y + 44]);
    else if (f.st === 'air' || (f.st === 'attack' && f.mv.air)) out.push([X - 10, Y + 4, X + 10, Y + 60]);
    else out.push([X - 10, Y, X + 10, Y + 66]);
    if (f.st === 'attack' && f.mt >= f.mv.s && !f.mv.proj) { const b = moveBox(f); if (b) out.push([b[0] + 2, b[1], b[2] - 2, b[3]]); }
    return out;
  }
  const overlap = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

  // ---------- hits ----------
  function canBlock(d, lvl) {
    const ok = NEUTRAL.has(d.st) || d.st === 'block' || d.st === 'cblock' || d.st === 'land' || (d.st === 'dash' && d.t > 10) || d.st === 'bdash';
    if (!ok || airborne(d)) return false;
    const back = d.dir === 4 || d.dir === 1;
    if (!back) return false;
    const crouch = d.dir === 1;
    if (lvl === 'low' && !crouch) return false;
    if (lvl === 'over' && crouch) return false;
    return true;
  }

  function applyHit(g, att, def, mv, pt, isProj) {
    const dir = Math.sign(ex(def) - (isProj ? pt[0] - att.face * 10 : ex(att))) || att.face;
    const str = mv.str || 1;
    att.connected = true; att.hitDone = true;
    if (canBlock(def, mv.lvl)) {
      const c = def.dir === 1;
      def.st = c ? 'cblock' : 'block'; def.t = 0; def.stun = mv.bs; def.vx = dir * (mv.push || 2) * 0.9;
      if (atWall(def, dir) && !isProj) att.vx = -dir * (mv.push || 2) * 0.7;
      g.stop = Math.round(STOP[str] * 0.6);
      g.events.push({ type: 'block', x: pt[0], y: pt[1], str, blade: !!mv.blade, side: att.side });
      return;
    }
    const counter = def.st === 'attack' && def.mt < def.mv.s;
    const wasCrouch = isCrouching(def) || def.dir <= 3;
    def.combo++;
    const scale = def.combo <= 2 ? 1 : Math.max(0.35, 1 - 0.12 * (def.combo - 2));
    const dmg = Math.max(1, Math.round(mv.dmg * scale * (counter ? 1.15 : 1)));
    def.hp = Math.max(g.training ? 1 : 0, def.hp - dmg);
    def.comboDmg += dmg; def.lastHitT = g.tick;
    att.showCombo = { hits: def.combo, dmg: def.comboDmg, t: g.tick };
    const wasAir = airborne(def);
    if (def.st === 'attack') { commitRoot(def); def.mv = null; }
    else commitRoot(def);
    if (def.y < 0) def.y = 0;
    if (mv.launch || wasAir || mv.kd || def.hp <= 0) {
      setSt(def, 'juggle');
      if (mv.launch) { def.vx = dir * mv.launch[0]; def.vy = Math.max(3.5, -mv.launch[1] - def.juggle * 0.5); }
      else if (mv.trip) { def.vx = dir * 1; def.vy = 2.8; }
      else if (wasAir) { def.vx = dir * 0.9; def.vy = Math.max(1.6, 4.8 - def.juggle * 0.4); }
      else { def.vx = dir * 2.6; def.vy = 4.4; }
      def.juggle += mv.launch ? 2 : 1;
      if (def.y <= 0) def.y = 0.1;
    } else {
      setSt(def, wasCrouch ? 'hurtc' : 'hurt');
      def.stun = mv.hs + (counter ? 6 : 0); def.vx = dir * (mv.push || 2) * 0.5;
      if (atWall(def, dir) && !isProj) att.vx = -dir * (mv.push || 2) * 0.7;
    }
    g.stop = STOP[str] + (counter ? 3 : 0);
    g.events.push({ type: 'hit', x: pt[0], y: pt[1], str, blade: !!mv.blade, counter, side: att.side, combo: def.combo });
    if (def.hp <= 0 && !g.training && !def.ko) { def.ko = true; g.events.push({ type: 'ko', side: def.side }); }
  }
  function atWall(f, dir) { const X = ex(f); return (dir < 0 && X <= G.WALL + 2) || (dir > 0 && X >= G.STAGE_W - G.WALL - 2); }

  // ---------- per-fighter update ----------
  function readInput(g, f, inp) {
    f.inp = inp;
    f.dir = G.relDir(inp, f.face);
    f.buf.push(f.dir); if (f.buf.length > 40) f.buf.shift();
    const pA = inp.A && !f.prevA, pB = inp.B && !f.prevB;
    f.prevA = inp.A; f.prevB = inp.B;
    if (pA) f.pa = 6; else if (f.pa > 0 && g.stop <= 0) f.pa--;
    if (pB) f.pb = 6; else if (f.pb > 0 && g.stop <= 0) f.pb--;
  }

  function neutralAct(g, f) {
    if (f.pa || f.pb) {
      const btn = f.pa ? 'A' : 'B';
      const sp = trySpecial(f, btn);
      if (sp) { startMove(g, f, sp); return true; }
      startMove(g, f, normalFor(f, btn, false)); return true;
    }
    const d = f.dir;
    if (d >= 7) { setSt(f, 'jsq'); f.jdir = d === 9 ? 1 : d === 7 ? -1 : 0; f.vx = 0; return true; }
    if (dashTap(f, 6)) { setSt(f, 'dash'); f.vx = f.face * WALK[f.id][2]; g.events.push({ type: 'dash', side: f.side }); return true; }
    if (dashTap(f, 4)) { setSt(f, 'bdash'); f.vx = -f.face * BDASH_V; f.vy = 2.2; return true; }
    return false;
  }

  function update(g, f, o) {
    f.t++;
    switch (f.st) {
      case 'idle': case 'walk': case 'crouch': {
        if (g.phase !== 'fight') { f.vx = 0; if (f.st !== 'idle') setSt(f, 'idle'); break; }
        if (neutralAct(g, f)) break;
        const d = f.dir;
        if (d <= 3) { if (f.st !== 'crouch') setSt(f, 'crouch'); f.vx = 0; }
        else if (d === 6) { if (f.st !== 'walk') setSt(f, 'walk'); f.vx = f.face * WALK[f.id][0]; f.back = false; }
        else if (d === 4) { if (f.st !== 'walk') setSt(f, 'walk'); f.vx = -f.face * WALK[f.id][1]; f.back = true; }
        else { if (f.st !== 'idle') setSt(f, 'idle'); f.vx = 0; }
        f.x += f.vx;
        break;
      }
      case 'jsq':
        if (f.pa || f.pb) { const sp = trySpecial(f, f.pa ? 'A' : 'B'); if (sp) { startMove(g, f, sp); break; } }
        if (f.t >= 4) { setSt(f, 'air'); f.vy = JUMP_VY; f.vx = f.jdir * JUMP_VX * f.face; f.airUsed = false; g.events.push({ type: 'jump', side: f.side }); }
        break;
      case 'air':
        if ((f.pa || f.pb) && !f.airUsed) { startMove(g, f, normalFor(f, f.pa ? 'A' : 'B', true)); }
        airPhys(g, f);
        break;
      case 'land':
        f.vx = 0;
        if (f.t >= 4) { setSt(f, 'idle'); neutralAct(g, f); }
        break;
      case 'dash':
        f.x += f.vx; f.vx *= 0.9;
        if (f.pa || f.pb) { const sp = trySpecial(f, f.pa ? 'A' : 'B'); if (sp) { startMove(g, f, sp); break; } if (f.t > 6) { neutralAct(g, f); break; } }
        if (f.t >= 15) setSt(f, 'idle');
        break;
      case 'bdash':
        f.x += f.vx; f.vx *= 0.9; f.y += f.vy; f.vy -= 0.4; if (f.y < 0) f.y = 0;
        if (f.t >= 16) { f.y = 0; setSt(f, 'idle'); }
        break;
      case 'attack': {
        const mv = f.mv; f.mt++;
        const s = spr(f, mv.anim), fi = G.moveFrame(s, mv, f.mt);
        if (!mv.air) f.root = s.frames[fi].root.slice();
        if (f.mt === mv.s) g.events.push({ type: 'swing', side: f.side, str: mv.str, blade: !!mv.blade });
        if (mv.proj && f.mt === mv.s && !g.proj.some(p => p.owner === f.side)) {
          g.proj.push({ owner: f.side, x: ex(f) + f.face * 30, y: 40, vx: f.face * mv.proj.spd, mv: mv.proj, life: 240 });
          g.events.push({ type: 'proj', side: f.side });
        }
        if (mv.air) { airPhys(g, f); if (f.st !== 'attack') break; }
        if (f.connected && f.mt >= mv.s && (f.pa || f.pb)) {
          const btn = f.pa ? 'A' : 'B';
          let next = null;
          if (mv.chain && mv.chain[btn]) next = mv.chain[btn];
          if (mv.cancel) { const sp = trySpecial(f, btn); if (sp) next = sp; }
          if (next) { startMove(g, f, next); break; }
        }
        if (f.vx) { f.x += f.vx; f.vx *= 0.8; if (Math.abs(f.vx) < 0.05) f.vx = 0; }
        if (f.mt >= mv.s + mv.a + mv.r && !mv.air) toNeutral(f);
        break;
      }
      case 'hurt': case 'hurtc': case 'block': case 'cblock':
        f.x += f.vx; f.vx *= 0.82;
        if (f.st === 'block' || f.st === 'cblock') { if (f.dir === 1) f.st = 'cblock'; else if (f.dir === 4) f.st = 'block'; }
        if (f.t >= f.stun) { f.vx = 0; setSt(f, f.dir <= 3 ? 'crouch' : 'idle'); }
        break;
      case 'juggle':
        f.x += f.vx; f.y += f.vy; f.vy -= 0.3; f.vx *= 0.98;
        if (f.y <= 0 && f.vy < 0) {
          f.y = 0; f.vx = 0; f.vy = 0;
          g.events.push({ type: 'down', x: ex(f), side: f.side });
          setSt(f, f.hp <= 0 && !g.training ? 'ko' : 'down');
          f.combo = 0; f.juggle = 0;
        }
        break;
      case 'down':
        if (f.t >= 30) setSt(f, 'getup');
        break;
      case 'getup':
        if (f.t >= 22) setSt(f, 'idle');
        break;
      case 'ko': case 'win': case 'lose':
        f.vx *= 0.9; f.x += f.vx;
        break;
    }
    if (NEUTRAL.has(f.st) || f.st === 'land') { f.combo = 0; f.juggle = 0; }
  }

  function airPhys(g, f) {
    f.x += f.vx; f.y += f.vy; f.vy -= GRAV;
    if (f.y <= 0 && f.vy < 0) {
      f.y = 0; f.vy = 0; f.vx = 0; f.mv = null; f.root = [0, 0];
      setSt(f, 'land'); g.events.push({ type: 'land', x: ex(f), side: f.side });
    }
  }

  // ---------- main step ----------
  function step(g, ins) {
    g.events.length = 0;
    g.tick++;
    const [a, b] = g.f;
    readInput(g, a, ins[0]); readInput(g, b, ins[1]);
    if (g.stop > 0) { g.stop--; return; }
    if (g.slow > 0) { g.slow--; if (g.slow % 2) return; }

    phaseTick(g);
    update(g, a, b); update(g, b, a);

    // projectiles
    for (const p of g.proj) {
      p.x += p.vx; p.life--;
      const tgt = g.f[1 - p.owner];
      const pb = [p.x - 8, p.y - 14, p.x + 8, p.y + 14];
      if (!p.dead && hurtBoxes(tgt).some(h => overlap(pb, h))) {
        p.dead = true;
        const owner = g.f[p.owner];
        applyHit(g, { side: p.owner, face: Math.sign(p.vx), connected: false, hitDone: false, showCombo: null, x: p.x, root: [0, 0], y: 0 }, tgt, p.mv, [p.x, p.y], true);
        owner.showCombo = { hits: tgt.combo, dmg: tgt.comboDmg, t: g.tick };
      }
      if (p.x < -20 || p.x > G.STAGE_W + 20 || p.life <= 0) p.dead = true;
    }
    if (g.proj.length === 2 && !g.proj[0].dead && !g.proj[1].dead && Math.abs(g.proj[0].x - g.proj[1].x) < 14) {
      g.proj.forEach(p => p.dead = true);
      g.events.push({ type: 'block', x: (g.proj[0].x + g.proj[1].x) / 2, y: 40, str: 2, blade: true });
    }
    g.proj = g.proj.filter(p => !p.dead);

    // melee hits (simultaneous -> trade)
    const hits = [];
    for (const [att, def] of [[a, b], [b, a]]) {
      if (att.st !== 'attack' || att.hitDone || att.mv.proj) continue;
      const mv = att.mv;
      if (att.mt < mv.s || att.mt >= mv.s + mv.a) continue;
      const hb = moveBox(att); if (!hb) continue;
      if (def.st === 'juggle' && def.juggle >= 7) continue;
      const hurts = hurtBoxes(def);
      for (const h of hurts) if (overlap(hb, h)) { hits.push([att, def, mv, [(Math.max(hb[0], h[0]) + Math.min(hb[2], h[2])) / 2, (Math.max(hb[1], h[1]) + Math.min(hb[3], h[3])) / 2]]); break; }
    }
    for (const h of hits) applyHit(g, ...h);

    // push boxes
    const pushable = f => !(f.st === 'down' || f.st === 'ko' || f.st === 'getup' || (f.st === 'attack' && f.mv.pass && f.mt < f.mv.s + f.mv.a + 4));
    if (pushable(a) && pushable(b)) {
      const ax = ex(a), bx = ex(b), dx = bx - ax, need = 20;
      const vOverlap = Math.abs(ey(a) - ey(b)) < 50;
      if (Math.abs(dx) < need && vOverlap) {
        const s = dx === 0 ? (a.face > 0 ? 1 : -1) : Math.sign(dx);
        const push = (need - Math.abs(dx)) / 2;
        a.x -= s * push; b.x += s * push;
      }
    }
    for (const f of g.f) {
      const X = ex(f);
      if (X < G.WALL) f.x += G.WALL - X;
      if (X > G.STAGE_W - G.WALL) f.x -= X - (G.STAGE_W - G.WALL);
    }
    const d = ex(b) - ex(a);
    if (Math.abs(d) > G.MAX_DIST) { const c = (Math.abs(d) - G.MAX_DIST) / 2 * Math.sign(d); a.x += c; b.x -= c; }

    // facing
    for (const [f, o] of [[a, b], [b, a]]) {
      if (NEUTRAL.has(f.st) || f.st === 'land' || f.st === 'jsq' || f.st === 'getup') {
        const dd = ex(o) - ex(f);
        if (Math.abs(dd) > 2) f.face = Math.sign(dd);
      }
    }
    // training refill
    if (g.training) for (const f of g.f) if ((NEUTRAL.has(f.st) || f.st === 'land') && g.tick - f.lastHitT > 50) { f.hp = f.maxHp; f.comboDmg = 0; }
    for (const f of g.f) if ((NEUTRAL.has(f.st)) && !g.training && g.tick - f.lastHitT > 60) f.comboDmg = 0;
  }

  function phaseTick(g) {
    g.phaseT++;
    if (g.training) return;
    const [a, b] = g.f;
    if (g.phase === 'intro') { if (g.phaseT >= 110) { g.phase = 'fight'; g.phaseT = 0; } return; }
    if (g.phase === 'fight') {
      g.timer--;
      if (a.hp <= 0 || b.hp <= 0) {
        g.phase = 'ko'; g.phaseT = 0; g.slow = 50;
        g.winner = a.hp <= 0 && b.hp <= 0 ? -1 : a.hp <= 0 ? 1 : 0;
      } else if (g.timer <= 0) {
        g.phase = 'timeup'; g.phaseT = 0;
        g.winner = a.hp / a.maxHp === b.hp / b.maxHp ? -1 : a.hp / a.maxHp > b.hp / b.maxHp ? 0 : 1;
      }
      return;
    }
    if (g.phase === 'ko' || g.phase === 'timeup') {
      if (g.phaseT === 80) {
        if (g.winner >= 0) {
          const w = g.f[g.winner], l = g.f[1 - g.winner];
          w.wins++;
          if (w.st !== 'juggle' && w.st !== 'down') { commitRoot(w); w.mv = null; w.y = 0; setSt(w, 'win'); }
          if (l.st !== 'ko' && l.st !== 'juggle') { commitRoot(l); l.mv = null; setSt(l, 'lose'); }
        } else { a.wins++; b.wins++; }
      }
      if (g.phaseT >= 200) {
        const done = a.wins >= G.ROUNDS_TO_WIN || b.wins >= G.ROUNDS_TO_WIN;
        if (done) { g.phase = 'end'; g.phaseT = 0; g.matchWinner = a.wins === b.wins ? -1 : a.wins > b.wins ? 0 : 1; }
        else { g.round++; resetRound(g); }
      }
    }
  }

  return { newGame, step, ex, ey, hurtBoxes, moveBox, spr };
})();
