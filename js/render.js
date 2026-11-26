// Drawing: stage, fighters, effects (pixel canvas) and HUD (crisp overlay canvas).
window.G = window.G || {};
G.Render = (function () {
  const W = G.W, H = G.H, GY = G.GROUND;
  let gc, gx, hc, hx, scale = 3, bgFar, bgWall, bgFloor;
  const fx = { sparks: [], dust: [], ghosts: [], texts: [] };
  let camX = (G.STAGE_W - W) / 2, shake = 0, showBoxes = false;
  const trail = [99999, 99999], trailWait = [0, 0];
  let rng = 7;
  const rand = () => { rng = (rng * 16807) % 2147483647; return rng / 2147483647; };

  function init(game, hud) {
    gc = game; gx = gc.getContext('2d'); gc.width = W; gc.height = H; gx.imageSmoothingEnabled = false;
    hc = hud; hx = hc.getContext('2d');
    buildStage();
    resize(); window.addEventListener('resize', resize);
  }
  function resize() {
    const wrap = gc.parentElement, ww = wrap.clientWidth, wh = wrap.clientHeight;
    const s = Math.min(ww / W, wh / H);
    scale = s >= 2 ? Math.floor(s) : s;
    const cw = Math.round(W * scale), ch = Math.round(H * scale);
    for (const c of [gc, hc]) { c.style.width = cw + 'px'; c.style.height = ch + 'px'; }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    hc.width = Math.round(cw * dpr); hc.height = Math.round(ch * dpr);
  }

  // ---------- stage ----------
  function px(c, x, y, col) { c.fillStyle = col; c.fillRect(x | 0, y | 0, 1, 1); }
  function buildStage() {
    rng = 7;
    const FW = Math.round(G.STAGE_W * 0.45 + W * 0.55);
    bgFar = document.createElement('canvas'); bgFar.width = FW; bgFar.height = H;
    let c = bgFar.getContext('2d');
    const sky = c.createLinearGradient(0, 0, 0, 150); sky.addColorStop(0, '#07060b'); sky.addColorStop(1, '#1a1220');
    c.fillStyle = sky; c.fillRect(0, 0, FW, H);
    for (let i = 0; i < 70; i++) px(c, rand() * FW, rand() * 60, rand() < 0.5 ? '#3a3346' : '#2a2534');
    c.fillStyle = '#c9b8a0'; c.beginPath(); c.arc(FW * 0.72, 30, 9, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1a1220'; c.beginPath(); c.arc(FW * 0.72 + 4, 27, 8, 0, Math.PI * 2); c.fill();
    let x = 0;
    while (x < FW) {
      const bw = 18 + rand() * 34, bh = 40 + rand() * 70;
      c.fillStyle = '#0f0c14'; c.fillRect(x, 150 - bh, bw, bh + 20);
      for (let wy = 150 - bh + 5; wy < 145; wy += 6) for (let wx = x + 3; wx < x + bw - 3; wx += 5) if (rand() < 0.12) px(c, wx, wy, rand() < 0.7 ? '#6e5a3a' : '#3c4a5a');
      x += bw + rand() * 4;
    }

    bgWall = document.createElement('canvas'); bgWall.width = G.STAGE_W; bgWall.height = H;
    c = bgWall.getContext('2d');
    c.fillStyle = '#1b161f'; c.fillRect(0, 0, G.STAGE_W, 172);
    for (let y = 0; y < 172; y += 6) for (let bx = ((y / 6) % 2) * 7; bx < G.STAGE_W; bx += 14) {
      const v = rand();
      c.fillStyle = v < 0.2 ? '#221b26' : v < 0.5 ? '#1e1823' : '#19141d'; c.fillRect(bx, y, 13, 5);
    }
    const winXs = [];
    for (let wx = 60; wx < G.STAGE_W - 60; wx += 120) winXs.push(wx);
    for (const wx of winXs) {
      c.clearRect(wx, 26, 56, 70);
      c.fillStyle = '#2a222e'; c.fillRect(wx - 3, 22, 62, 4); c.fillRect(wx - 3, 96, 62, 5);
      c.fillStyle = '#120e15'; for (let k = 0; k <= 4; k++) c.fillRect(wx + k * 14 - 1, 26, 2, 70); c.fillRect(wx, 59, 56, 2);
      if (rand() < 0.8) { c.fillStyle = '#1b161f'; c.beginPath(); c.moveTo(wx + 14, 26); c.lineTo(wx + 28, 26); c.lineTo(wx + 20, 44); c.fill(); }
    }
    for (let pxl = 0; pxl < G.STAGE_W; pxl += 120) {
      c.fillStyle = '#100d13'; c.fillRect(pxl, 0, 10, 172); c.fillStyle = '#2b2430'; c.fillRect(pxl + 1, 0, 2, 172); c.fillStyle = '#0a080c'; c.fillRect(pxl + 8, 0, 2, 172);
    }
    c.fillStyle = '#0c0a0e'; c.fillRect(0, 0, G.STAGE_W, 10); c.fillStyle = '#2b2430'; c.fillRect(0, 10, G.STAGE_W, 1);
    for (const lx of [150, 384, 618]) {
      c.fillStyle = '#0a080c'; c.fillRect(lx, 0, 1, 34);
      c.fillStyle = '#2d2530'; c.fillRect(lx - 6, 34, 13, 4); c.fillStyle = '#ffcf87'; c.fillRect(lx - 3, 38, 7, 2);
      const g = c.createRadialGradient(lx, 40, 2, lx, 40, 90); g.addColorStop(0, 'rgba(255,190,110,0.22)'); g.addColorStop(1, 'rgba(255,190,110,0)');
      c.fillStyle = g; c.fillRect(lx - 100, 0, 200, 172);
    }
    c.fillStyle = '#120f15'; c.fillRect(0, 150, G.STAGE_W, 22);
    for (let bx = 0; bx < G.STAGE_W; bx += 32) { c.fillStyle = '#1a151d'; c.fillRect(bx, 152, 30, 18); }
    c.fillStyle = '#0b090d'; c.fillRect(0, 170, G.STAGE_W, 2);

    bgFloor = document.createElement('canvas'); bgFloor.width = G.STAGE_W; bgFloor.height = H - 172;
    c = bgFloor.getContext('2d');
    c.fillStyle = '#1f1a22'; c.fillRect(0, 0, G.STAGE_W, H);
    for (let y = 0; y < H - 172; y += 1) { c.fillStyle = `rgba(0,0,0,${0.35 - y * 0.008})`; c.fillRect(0, y, G.STAGE_W, 1); }
    for (let i = 0; i < 260; i++) px(c, rand() * G.STAGE_W, rand() * 44, rand() < 0.5 ? '#29222d' : '#17131a');
    for (const lx of [150, 384, 618]) {
      const g = c.createRadialGradient(lx, 26, 2, lx, 26, 70); g.addColorStop(0, 'rgba(255,180,100,0.13)'); g.addColorStop(1, 'rgba(255,180,100,0)');
      c.fillStyle = g; c.fillRect(lx - 80, 0, 160, 44);
    }
    c.fillStyle = 'rgba(120,28,30,0.55)';
    c.fillRect(G.STAGE_W / 2 - 1, 8, 2, 30);
    c.fillRect(G.WALL + 40, 26, G.STAGE_W - 2 * G.WALL - 80, 1);
    c.fillStyle = 'rgba(40,52,70,0.35)';
    c.beginPath(); c.ellipse(250, 34, 34, 4, 0, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(560, 20, 22, 3, 0, 0, Math.PI * 2); c.fill();
  }

  // ---------- fighter frame selection ----------
  function frameOf(g, f) {
    const S = G.SPR[f.id][f.pal];
    const pick = (a, i) => { const s = S[a]; return s.frames[Math.max(0, Math.min(s.n - 1, i | 0))]; };
    switch (f.st) {
      case 'idle': return pick('idle', (f.t / 7.5) % 8);
      case 'walk': { const k = Math.floor(f.t / 6) % 8; return pick('walk', f.back ? 7 - k : k); }
      case 'crouch': return pick('crouch', (f.t / 10) % 6);
      case 'jsq': case 'land': return pick('jump', 0);
      case 'air': return pick('jump', f.vy > 3 ? 1 : f.vy > 0 ? 2 : f.vy > -3 ? 3 : 4);
      case 'dash': return pick('dash', f.t / 4);
      case 'bdash': return pick('bdash', f.t / 4);
      case 'attack': { const s = S[f.mv.anim]; return s.frames[G.moveFrame(s, f.mv, f.mt)]; }
      case 'hurt': return pick('hurt', f.t / Math.max(1, f.stun) * S.hurt.n);
      case 'hurtc': return pick('hurtLow', f.t / Math.max(1, f.stun) * S.hurtLow.n);
      case 'block': return pick('block', 0);
      case 'cblock': return pick('cblock', 0);
      case 'juggle': return pick('tumble', 0);
      case 'down': case 'ko': return pick('down', 0);
      case 'getup': return pick('getup', f.t / 22 * S.getup.n);
      case 'win': return pick('win', (f.t / 10) % 8);
      case 'lose': return pick('hurtLow', 99);
    }
    return pick('idle', 0);
  }

  // ---------- events -> effects ----------
  function onEvents(g) {
    for (const e of g.events) {
      if (e.type === 'hit') {
        const col = e.blade ? [190, 230, 240] : [255, 196, 120];
        fx.sparks.push({ x: e.x, y: e.y, t: 0, col, big: e.str, dir: e.side === 0 ? 1 : -1 });
        shake = Math.max(shake, 3 + e.str * 2);
        if (e.counter) fx.texts.push({ text: 'COUNTER', side: e.side, t: 0 });
        G.Audio.play('hit', e);
      } else if (e.type === 'block') {
        fx.sparks.push({ x: e.x, y: e.y, t: 0, col: [150, 190, 255], block: true, big: e.str, dir: e.side === 0 ? 1 : -1 });
        shake = Math.max(shake, 2);
        G.Audio.play('block', e);
      } else if (e.type === 'swing') G.Audio.play('swing', e);
      else if (e.type === 'proj') G.Audio.play('proj', e);
      else if (e.type === 'land') { fx.dust.push({ x: e.x, t: 0, n: 4 }); G.Audio.play('land'); }
      else if (e.type === 'down') { fx.dust.push({ x: e.x, t: 0, n: 9 }); shake = Math.max(shake, 4); G.Audio.play('down'); }
      else if (e.type === 'ko') { G.Audio.play('ko'); shake = 10; }
      else if (e.type === 'dash') fx.dust.push({ x: G.Sim.ex(g.f[e.side]) - g.f[e.side].face * 8, t: 0, n: 3 });
    }
  }

  // ---------- drawing ----------
  function drawSpark(s) {
    const life = s.block ? 0.22 : 0.28; if (s.t > life) return;
    const k = s.t / life, fade = 1 - k, X = s.x - camX, Y = GY - s.y;
    if (s.block) {
      const r = 6 + k * 10;
      gx.globalAlpha = fade;
      for (let a = -1.2; a <= 1.2; a += 0.08) { const xx = X - s.dir * Math.cos(a) * r * 0.5 + s.dir * 2, yy = Y + Math.sin(a) * r; gx.fillStyle = 'rgb(220,235,255)'; gx.fillRect(xx | 0, yy | 0, 1, 1); }
      gx.globalAlpha = 1; return;
    }
    if (s.t < 0.05) { gx.fillStyle = '#fff'; const z = 2 + s.big; gx.fillRect((X - z) | 0, (Y - z) | 0, z * 2 + 1, z * 2 + 1); }
    const n = 8 + s.big * 2;
    gx.globalAlpha = fade;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + (i % 2) * 0.3;
      const len = (i % 2 ? 7 : 12) * (0.6 + s.big * 0.25) * (0.4 + k * 0.9);
      const r0 = 3 + k * (8 + s.big * 3);
      for (let r = r0; r < r0 + len * (1 - k * 0.6); r++) {
        const fwd = Math.cos(ang) * s.dir > 0 ? 1.5 : 1;
        gx.fillStyle = r < r0 + 3 ? '#fff' : `rgb(${s.col})`;
        gx.fillRect((X + Math.cos(ang) * r * fwd) | 0, (Y + Math.sin(ang) * r * 0.8) | 0, 1, 1);
      }
    }
    gx.globalAlpha = 1;
  }
  function drawProj(p) {
    const sg = Math.sign(p.vx), R = 15, X = p.x - camX, Y = GY - p.y;
    const cols = ['rgb(240,250,255)', 'rgb(176,222,236)', 'rgba(104,168,198,0.75)'];
    const co = Math.cos(0.42), si = Math.sin(0.42);
    for (let dy = -R - 4; dy <= R + 4; dy++) for (let dx = -R - 4; dx <= R + 4; dx++) {
      const u = dx * co - dy * si, y = dx * si + dy * co;
      const d1 = Math.hypot(u * 1.5, y), d2 = Math.hypot((u + 5) * 1.5, y * 1.06);
      if (d1 <= R && d2 > R - 0.5) { gx.fillStyle = cols[d1 > R - 2.4 ? 0 : d1 > R - 5 ? 1 : 2]; gx.fillRect((X + dx * sg) | 0, (Y + dy) | 0, 1, 1); }
    }
    for (let i = 1; i <= 3; i++) for (let y = -R + 4; y <= R - 4; y += 3) { gx.fillStyle = `rgba(176,222,236,${0.5 - i * 0.13})`; gx.fillRect((X - sg * (4 + i * 6) + (rand() * 2 - 1)) | 0, (Y + y + (rand() * 2 - 1)) | 0, 1, 1); }
  }
  function drawFighter(g, f, fr) {
    const X = Math.round(G.Sim.ex(f) - camX), Y = Math.round(GY - G.Sim.ey(f));
    const { OX, OY } = PixelRig;
    gx.save(); gx.translate(X, Y - OY + 1); gx.scale(f.face, 1); gx.drawImage(fr.c, -OX, 0); gx.restore();
  }
  function drawShadow(f) {
    const X = G.Sim.ex(f) - camX, h = G.Sim.ey(f);
    const w = Math.max(5, 15 - h * 0.12);
    gx.fillStyle = 'rgba(0,0,0,0.38)'; gx.beginPath(); gx.ellipse(X, GY + 0.5, w, 2.4, 0, 0, Math.PI * 2); gx.fill();
  }

  function draw(g, dt) {
    const [a, b] = g.f;
    const mid = (G.Sim.ex(a) + G.Sim.ex(b)) / 2;
    const target = Math.max(0, Math.min(G.STAGE_W - W, mid - W / 2));
    camX += (target - camX) * Math.min(1, dt * 8);
    let sx = 0, sy = 0;
    if (shake > 0) { sx = Math.round((rand() * 2 - 1) * shake * 0.5); sy = Math.round((rand() * 2 - 1) * shake * 0.4); shake = Math.max(0, shake - dt * 40); }
    gx.setTransform(1, 0, 0, 1, sx, sy);
    gx.fillStyle = '#07060b'; gx.fillRect(-4, -4, W + 8, H + 8);
    gx.drawImage(bgFar, Math.round(-camX * 0.45), 0);
    gx.drawImage(bgWall, Math.round(-camX), 0);
    gx.drawImage(bgFloor, Math.round(-camX), 172);

    for (const f of g.f) drawShadow(f);
    for (const gh of fx.ghosts) { gh.life -= dt; if (gh.life <= 0) continue; gx.save(); gx.globalAlpha = Math.min(0.4, gh.life * 1.6); gx.translate(Math.round(gh.x - camX), Math.round(gh.y)); gx.scale(gh.face, 1); gx.drawImage(gh.c, -PixelRig.OX, 0); gx.restore(); }
    fx.ghosts = fx.ghosts.filter(gh => gh.life > 0);
    const order = (a.st === 'attack' ? 1 : 0) - (b.st === 'attack' ? 1 : 0) > 0 ? [b, a] : [a, b];
    for (const f of order) {
      const fr = frameOf(g, f);
      if (fr.ghost && f.lastGhostT !== g.tick && g.stop <= 0) {
        f.lastGhostT = g.tick;
        fx.ghosts.push({ c: fr.c, x: G.Sim.ex(f), y: GY - G.Sim.ey(f) - PixelRig.OY + 1, face: f.face, life: 0.25 });
      }
      drawFighter(g, f, fr);
    }
    for (const p of g.proj) drawProj(p);
    for (const d of fx.dust) {
      d.t += dt; const k = d.t / 0.4; if (k > 1) continue;
      for (let i = 0; i < d.n; i++) { const ang = (i / d.n) * Math.PI, r = 4 + k * 14; gx.fillStyle = `rgba(120,110,120,${0.6 * (1 - k)})`; gx.fillRect((d.x - camX + Math.cos(ang) * r * 1.6) | 0, (GY - Math.sin(ang) * r * 0.4 - 1) | 0, 2, 1); }
    }
    fx.dust = fx.dust.filter(d => d.t < 0.4);
    for (const s of fx.sparks) { s.t += dt; drawSpark(s); }
    fx.sparks = fx.sparks.filter(s => s.t < 0.3);

    if (showBoxes) {
      for (const f of g.f) {
        for (const h of G.Sim.hurtBoxes(f)) { gx.strokeStyle = 'rgba(80,160,255,0.8)'; gx.strokeRect(h[0] - camX + 0.5, GY - h[3] + 0.5, h[2] - h[0], h[3] - h[1]); }
        if (f.st === 'attack' && !f.mv.proj && f.mt >= f.mv.s && f.mt < f.mv.s + f.mv.a) { const hb = G.Sim.moveBox(f); if (hb) { gx.strokeStyle = 'rgba(255,60,60,0.95)'; gx.strokeRect(hb[0] - camX + 0.5, GY - hb[3] + 0.5, hb[2] - hb[0], hb[3] - hb[1]); } }
      }
    }
    gx.setTransform(1, 0, 0, 1, 0, 0);
    drawHud(g, dt);
  }

  // ---------- HUD ----------
  function txt(t, x, y, size, col, align, weight, stroke) {
    hx.font = `${weight || 800} ${size}px "Pretendard", system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
    hx.textAlign = align || 'left'; hx.textBaseline = 'alphabetic';
    if (stroke) { hx.lineWidth = stroke; hx.strokeStyle = 'rgba(0,0,0,0.85)'; hx.strokeText(t, x, y); }
    hx.fillStyle = col; hx.fillText(t, x, y);
  }
  function drawHud(g, dt) {
    const k = hc.width / W;
    hx.setTransform(1, 0, 0, 1, 0, 0); hx.clearRect(0, 0, hc.width, hc.height);
    hx.setTransform(k, 0, 0, k, 0, 0);
    const bw = 150, by = 10, bh = 8;
    for (const side of [0, 1]) {
      const f = g.f[side], hp = f.hp / f.maxHp;
      if (trail[side] > f.maxHp) trail[side] = f.hp;
      if (f.hp < trail[side]) { if (trailWait[side] <= 0 && g.stop <= 0) trail[side] = Math.max(f.hp, trail[side] - 600 * dt); else trailWait[side] -= dt; } else { trail[side] = f.hp; }
      if (f.hp < trail[side] && f.combo > 0) trailWait[side] = 0.4;
      const x0 = side === 0 ? 12 : W - 12 - bw;
      hx.fillStyle = 'rgba(0,0,0,0.6)'; hx.fillRect(x0 - 1, by - 1, bw + 2, bh + 2);
      hx.fillStyle = '#2a1416'; hx.fillRect(x0, by, bw, bh);
      const tw = bw * Math.min(1, trail[side] / f.maxHp), cw = bw * hp;
      hx.fillStyle = '#b8322c';
      if (side === 0) hx.fillRect(x0 + bw - tw, by, tw, bh); else hx.fillRect(x0, by, tw, bh);
      hx.fillStyle = hp > 0.3 ? '#e8c35e' : '#e86a3e';
      if (side === 0) hx.fillRect(x0 + bw - cw, by, cw, bh); else hx.fillRect(x0, by, cw, bh);
      hx.fillStyle = 'rgba(255,255,255,0.25)';
      if (side === 0) hx.fillRect(x0 + bw - cw, by, cw, 2); else hx.fillRect(x0, by, cw, 2);
      const info = G.CHAR_INFO[f.id];
      txt(info.name, side === 0 ? x0 : x0 + bw, by + bh + 10, 8, '#efe7ef', side === 0 ? 'left' : 'right', 800, 2.5);
      txt(info.en, side === 0 ? x0 + 22 : x0 + bw - 22, by + bh + 10, 5, '#9a8fa3', side === 0 ? 'left' : 'right', 700);
      if (!g.training) for (let i = 0; i < G.ROUNDS_TO_WIN; i++) {
        const cx = side === 0 ? x0 + bw - 4 - i * 9 : x0 + 4 + i * 9, cy = by + bh + 7;
        hx.fillStyle = i < f.wins ? '#e8c35e' : 'rgba(255,255,255,0.18)';
        hx.beginPath(); hx.moveTo(cx, cy - 3); hx.lineTo(cx + 3, cy); hx.lineTo(cx, cy + 3); hx.lineTo(cx - 3, cy); hx.fill();
      }
      if (f.showCombo && f.showCombo.hits >= 2 && g.tick - f.showCombo.t < 90) {
        const a2 = Math.min(1, (90 - (g.tick - f.showCombo.t)) / 20);
        hx.globalAlpha = a2;
        const cxp = side === 0 ? 14 : W - 14, al = side === 0 ? 'left' : 'right';
        txt(f.showCombo.hits + ' HITS', cxp, 62, 13, '#f2d27a', al, 900, 3);
        txt(f.showCombo.dmg + ' 데미지', cxp, 72, 6, '#e8dfe9', al, 700, 2);
        hx.globalAlpha = 1;
      }
    }
    if (!g.training) {
      const sec = Math.max(0, Math.ceil(g.timer / 60));
      hx.fillStyle = 'rgba(0,0,0,0.55)'; hx.fillRect(W / 2 - 13, 5, 26, 18);
      txt(String(sec).padStart(2, '0'), W / 2, 20, 14, sec <= 10 ? '#e86a3e' : '#efe7ef', 'center', 900);
    } else {
      txt('트레이닝', W / 2, 16, 7, '#9a8fa3', 'center', 800);
    }
    for (const t of fx.texts) {
      t.t += dt; if (t.t > 0.8) continue;
      hx.globalAlpha = Math.min(1, (0.8 - t.t) * 4);
      txt(t.text, t.side === 0 ? 14 : W - 14, 50, 8, '#ff7a5a', t.side === 0 ? 'left' : 'right', 900, 2.5);
      hx.globalAlpha = 1;
    }
    fx.texts = fx.texts.filter(t => t.t <= 0.8);
    // banners
    let banner = null, sub = null;
    if (g.phase === 'intro') { banner = g.phaseT < 70 ? (g.round >= 3 ? 'FINAL ROUND' : 'ROUND ' + g.round) : 'FIGHT'; }
    else if (g.phase === 'ko' && g.phaseT < 110) banner = 'K.O.';
    else if (g.phase === 'timeup' && g.phaseT < 110) banner = 'TIME';
    else if ((g.phase === 'ko' || g.phase === 'timeup') && g.phaseT >= 110) { banner = g.winner < 0 ? 'DRAW' : G.CHAR_INFO[g.f[g.winner].id].name + ' 승리'; }
    if (banner) {
      const big = banner === 'K.O.' ? 40 : 26;
      hx.fillStyle = 'rgba(0,0,0,0.45)'; hx.fillRect(0, H / 2 - big * 0.9, W, big * 1.25);
      txt(banner, W / 2, H / 2 + big * 0.2, big, banner === 'K.O.' ? '#e0483e' : '#f1e7ef', 'center', 900, 4);
    }
  }

  return {
    init, draw, onEvents, resize,
    toggleBoxes() { showBoxes = !showBoxes; return showBoxes; },
    reset() { fx.sparks.length = 0; fx.dust.length = 0; fx.ghosts.length = 0; fx.texts.length = 0; trail[0] = trail[1] = 99999; camX = (G.STAGE_W - W) / 2; }
  };
})();
