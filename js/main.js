// Screens, menus and the fixed-step game loop.
(function () {
  const ui = document.getElementById('ui');
  const app = { screen: 'loading', mode: 'cpu', diff: 'normal', game: null, ai: null, dummy: 'stand', paused: false, menuIdx: 0, sel: null, items: [], back: null };
  const DIFF = ['easy', 'normal', 'hard'], DIFF_K = { easy: '쉬움', normal: '보통', hard: '어려움' };
  const DUMMY = ['stand', 'crouch', 'block', 'cpu'], DUMMY_K = { stand: '서 있기', crouch: '앉아 있기', block: '전부 가드', cpu: 'CPU' };

  G.Render.init(document.getElementById('game'), document.getElementById('hud'));

  function screen(html, cls) { ui.innerHTML = `<div class="screen ${cls || ''}">${html}</div>`; return ui.firstChild; }

  // ---------- loading ----------
  screen(`<div class="title-logo">FIST <span>&amp;</span> STEEL</div><div class="title-sub">LOADING</div><div class="loading"><div id="lb"></div></div>`, 'solid');
  G.bakeAll(p => { const lb = document.getElementById('lb'); if (lb) lb.style.width = (p * 100) + '%'; }, () => showTitle());

  // ---------- generic menu ----------
  function showMenu(title, items, back, cls, extraHtml) {
    app.items = items; app.menuIdx = Math.min(app.menuIdx, items.length - 1); app.back = back;
    const el = screen(`<div class="menu"><h2>${title}</h2>${items.map((it, i) => `<div class="item" data-i="${i}"><span>${it.label}</span><small>${it.value ? it.value() : ''}</small></div>`).join('')}</div>${extraHtml || ''}`, cls || 'solid');
    el.querySelectorAll('.item').forEach(d => {
      d.addEventListener('mouseenter', () => { app.menuIdx = +d.dataset.i; paintMenu(); });
      d.addEventListener('click', () => { app.menuIdx = +d.dataset.i; G.Audio.init(); activate(); });
    });
    paintMenu();
  }
  function paintMenu() {
    ui.querySelectorAll('.item').forEach((d, i) => {
      d.classList.toggle('on', i === app.menuIdx);
      const it = app.items[i]; if (it && it.value) d.querySelector('small').textContent = it.value();
    });
  }
  function activate() { const it = app.items[app.menuIdx]; if (it && it.go) { G.Audio.play('select'); it.go(); } }
  function cycle(dir) { const it = app.items[app.menuIdx]; if (it && it.cycle) { it.cycle(dir); G.Audio.play('ui'); paintMenu(); } }

  // ---------- title & main menu ----------
  function showTitle() {
    app.screen = 'title';
    screen(`<div class="title-logo">FIST <span>&amp;</span> STEEL</div><div class="title-sub">PIXEL FIGHTING GAME</div><div class="blink">아무 키나 누르세요</div><div class="ver">v${G.VERSION}</div>`, 'solid');
    ui.firstChild.addEventListener('click', () => { G.Audio.init(); showMain(); });
  }
  function showMain() {
    app.screen = 'menu'; app.menuIdx = 0;
    showMenu('MAIN MENU', [
      { label: 'CPU 대전', value: () => '난이도 ' + DIFF_K[app.diff], cycle: d => { app.diff = DIFF[(DIFF.indexOf(app.diff) + d + 3) % 3]; }, go: () => startSelect('cpu') },
      { label: '2인 대전', value: () => '한 키보드 / 게임패드', go: () => startSelect('vs') },
      { label: '트레이닝', value: () => '콤보 연습', go: () => startSelect('training') },
      { label: '조작법 · 기술표', go: showHowto }
    ], null, 'solid', `<div class="hint"><b>W S</b> 또는 <b>↑ ↓</b> 이동 · <b>J</b> 또는 <b>Enter</b> 선택 · CPU 대전 난이도는 <b>A D</b>로 변경</div><div class="ver">v${G.VERSION}</div>`);
  }

  // ---------- character select ----------
  function startSelect(mode) {
    app.mode = mode; app.screen = 'select';
    app.sel = { cur: [0, 1], ok: [false, false], step: 0 };
    G.Input.setSolo(mode !== 'vs');
    renderSelect();
  }
  function renderSelect() {
    const s = app.sel, two = app.mode === 'vs';
    const who = [two ? '1P' : '플레이어', two ? '2P' : app.mode === 'training' ? '연습 상대' : 'CPU'];
    const el = screen(`<div class="menu"><h2>CHARACTER SELECT</h2></div><div class="select">${[0, 1].map(i => {
      const id = G.CHARS[s.cur[i]], info = G.CHAR_INFO[id];
      const active = two ? !s.ok[i] : (s.step === i && !s.ok[i]);
      return `<div class="card" style="border-color:${active ? info.color : '#2c2433'}"><div class="who ${s.ok[i] ? 'ok' : ''}">${who[i]} ${s.ok[i] ? '· 결정' : active ? '· 선택 중' : ''}</div><canvas id="pv${i}" width="168" height="110"></canvas><div><span class="nm" style="color:${info.color}">${info.name}</span><span class="en">${info.en}</span></div><div class="ds">${info.desc}</div><div class="arrows"><span>◀ ${two ? (i ? '←' : 'A') : 'A / ←'}</span><span>${two ? (i ? '→' : 'D') : 'D / →'} ▶</span></div></div>`;
    }).join('')}</div><div class="hint">${two ? '1P: <b>A D</b> 고르기 · <b>J</b> 결정 · <b>K</b> 취소 &nbsp;&nbsp; 2P: <b>← →</b> 고르기 · <b>. 또는 Num1</b> 결정 · <b>/ 또는 Num2</b> 취소' : '<b>A D</b> 고르기 · <b>J</b> 결정 · <b>K</b> 취소 (먼저 내 캐릭터, 다음 상대)'}</div>`, 'solid');
    el.querySelectorAll('.card').forEach((c, i) => c.addEventListener('click', () => { G.Audio.init(); if (two) { s.ok[i] = true; } else selConfirm(); afterSel(); }));
  }
  function selMove(i, d) { const s = app.sel; if (s.ok[i]) return; s.cur[i] = (s.cur[i] + d + G.CHARS.length) % G.CHARS.length; G.Audio.play('ui'); renderSelect(); }
  function selConfirm() { const s = app.sel; if (s.step < 2) { s.ok[s.step] = true; s.step++; } }
  function afterSel() {
    const s = app.sel; G.Audio.play('select');
    if (s.ok[0] && s.ok[1]) { setTimeout(() => startFight(), 250); }
    renderSelect();
  }
  function selCancel(i) {
    const s = app.sel;
    if (app.mode === 'vs') { if (s.ok[i]) { s.ok[i] = false; renderSelect(); } else if (i === 0) showMain(); return; }
    if (s.step > 0) { s.step--; s.ok[s.step] = false; renderSelect(); } else showMain();
  }

  // ---------- fight ----------
  function startFight() {
    const s = app.sel, p1 = G.CHARS[s.cur[0]], p2 = G.CHARS[s.cur[1]];
    app.cfg = { mode: app.mode, p1, p2, pal1: 0, pal2: p1 === p2 ? 1 : 0, dummy: app.dummy };
    beginFight();
  }
  function beginFight() {
    app.game = G.Sim.newGame(app.cfg);
    app.game.dummy = app.dummy;
    app.ai = G.AI.create(app.diff);
    app.screen = 'fight'; app.paused = false; app.resultShown = false;
    G.Render.reset();
    ui.innerHTML = '';
  }
  function tick() {
    const g = app.game;
    const p1 = app.autoP1 ? G.AI.input(app.autoP1, g, 0) : G.Input.read(0);
    let p2;
    if (app.mode === 'vs') p2 = G.Input.read(1);
    else if (app.mode === 'cpu') p2 = G.AI.input(app.ai, g, 1);
    else p2 = app.dummy === 'cpu' ? G.AI.input(app.ai, g, 1) : G.AI.dummy(app.dummy, g, 1);
    G.Sim.step(g, [p1, p2]);
    G.Render.onEvents(g);
    if (g.phase === 'intro' && g.phaseT === 1) G.Audio.play('round');
    if (g.phase === 'end' && g.phaseT >= 40 && !app.resultShown) { app.resultShown = true; showResult(); }
  }

  function showPause() {
    app.paused = true; app.screen = 'pause'; app.menuIdx = 0;
    const items = [{ label: '계속하기', go: resume }];
    if (app.mode === 'training') {
      items.push({ label: '연습 상대', value: () => DUMMY_K[app.dummy], cycle: d => { app.dummy = DUMMY[(DUMMY.indexOf(app.dummy) + d + DUMMY.length) % DUMMY.length]; app.game.dummy = app.dummy; }, go: () => cycle(1) });
      items.push({ label: '판정 박스', value: () => app.boxes ? '보이기' : '숨기기', go: () => { app.boxes = G.Render.toggleBoxes(); paintMenu(); } });
      items.push({ label: '위치 초기화', go: () => { beginFight(); } });
    }
    items.push({ label: '조작법 · 기술표', go: () => showHowto(true) });
    items.push({ label: '캐릭터 다시 선택', go: () => startSelect(app.mode) });
    items.push({ label: '메인 메뉴', go: () => { app.game = null; showMain(); } });
    showMenu('PAUSE', items, resume, 'dim', `<div class="hint"><b>Esc</b> 계속하기 · 연습 상대와 판정 박스는 <b>A D</b>로 변경</div>`);
  }
  function resume() { app.paused = false; app.screen = 'fight'; ui.innerHTML = ''; }

  function showResult() {
    const g = app.game;
    app.screen = 'result'; app.menuIdx = 0;
    const w = g.matchWinner;
    const head = w < 0 ? '무승부' : (G.CHAR_INFO[g.f[w].id].name + ' 승리');
    const sub = app.mode === 'vs' ? (w < 0 ? '' : (w === 0 ? '1P WIN' : '2P WIN')) : app.mode === 'cpu' ? (w === 0 ? 'YOU WIN' : w === 1 ? 'YOU LOSE' : '') : '';
    showMenu(`<div class="result"><div class="big">${head}</div><div class="title-sub">${sub}</div></div>`, [
      { label: '재대결', go: () => beginFight() },
      { label: '캐릭터 다시 선택', go: () => startSelect(app.mode) },
      { label: '메인 메뉴', go: () => { app.game = null; showMain(); } }
    ], null, 'dim');
  }

  function showHowto(fromPause) {
    app.screen = 'howto'; app.howtoBack = fromPause ? showPause : showMain;
    const lbl = (id, k) => Fighters[id].anims[G.MOVES[id][k].anim].label;
    const chainText = id => {
      const M = G.MOVES[id], N = G.NORMALS[id], rows = [];
      const starts = [['A', N.A], ['↓A', N.cA]];
      for (const [inp, k] of starts) {
        const walk = (names, cmds, key, depth) => {
          const mv = M[key]; let ext = false;
          if (mv.chain && depth < 3) for (const b in mv.chain) { const nx = mv.chain[b]; if (nx === key && depth > 1) continue; ext = true; walk(names.concat(lbl(id, nx)), cmds.concat((M[nx].crouch ? '↓' : '') + b), nx, depth + 1); }
          if (!ext && names.length > 1) rows.push(`<tr><td>${names.join(' → ')}</td><td class="cmd">${cmds.join(' → ')}</td></tr>`);
        };
        walk([lbl(id, k)], [inp], k, 1);
      }
      return rows.join('');
    };
    const table = id => {
      const N = G.NORMALS[id], M = G.MOVES[id];
      const rows = [['A', N.A], ['B', N.B], ['↓ + A', N.cA], ['↓ + B', N.cB], ['공중 A', N.jA], ['공중 B', N.jB]].map(([c, k]) => `<tr><td>${lbl(id, k)}</td><td class="cmd">${c}</td></tr>`).join('');
      const sp = Object.keys(M).filter(k => M[k].special).map(k => `<tr><td>${lbl(id, k)}</td><td class="cmd">${G.MOTION_LABEL[M[k].special]} + ${M[k].btn}</td></tr>`).join('');
      return `<h3 style="color:${G.CHAR_INFO[id].color}">${G.CHAR_INFO[id].name}</h3><table><tr><td colspan="2" style="color:#8b8093">기본기</td></tr>${rows}<tr><td colspan="2" style="color:#8b8093">연속기 (맞히거나 막혔을 때 이어서 입력)</td></tr>${chainText(id)}<tr><td colspan="2" style="color:#8b8093">기술</td></tr>${sp}</table>`;
    };
    screen(`<div class="howto"><div class="cols"><div><h3>조작</h3><div class="keys">
      <div><b>1P 이동</b>W A S D (혼자 할 때는 방향키도 됨)</div><div><b>1P 공격</b>J = A, K = B</div>
      <div><b>2P 이동</b>방향키</div><div><b>2P 공격</b>. 또는 Num1 = A, / 또는 Num2 = B</div>
      <div><b>게임패드</b>방향 + X/A 버튼 = A, Y/B 버튼 = B</div>
      <div><b>점프</b>↑ (↖ ↗로 앞뒤 점프)</div><div><b>앉기</b>↓</div><div><b>가드</b>상대 반대쪽(←)을 누르고 있기, 하단은 ↙</div>
      <div><b>대시</b>→→, 백대시 ←←</div><div><b>일시정지</b>Esc</div></div>
      <h3 style="margin-top:18px">규칙</h3><div class="keys">
      <div>→는 항상 상대 쪽 방향입니다.</div>
      <div>기본기가 맞거나 막히면 그 즉시 기술 커맨드로 캔슬할 수 있습니다.</div>
      <div>→↑ + A 기술은 상대를 띄웁니다. 떠 있는 상대에게는 공격이 계속 들어갑니다.</div>
      <div>하단(↓ + B 등)은 앉아서, 점프 공격은 서서 막아야 합니다.</div>
      <div>상대 공격의 발동 중에 맞히면 카운터로 데미지와 경직이 늘어납니다.</div></div></div>
      <div>${table('MUHYEOK')}${table('SERIN')}</div></div>
      <div class="hint"><b>Esc</b> 또는 <b>K</b> 돌아가기</div></div>`, fromPause ? 'dim' : 'solid');
  }

  // ---------- keys ----------
  const UP = ['ArrowUp', 'KeyW'], DOWN = ['ArrowDown', 'KeyS'], LEFT = ['ArrowLeft', 'KeyA'], RIGHT = ['ArrowRight', 'KeyD'];
  const OK = ['Enter', 'KeyJ', 'Space', 'Numpad1', 'Period', 'NumpadEnter'], BACK = ['Escape', 'KeyK', 'Backspace', 'Numpad2', 'Slash'];
  G.onKey = e => {
    G.Audio.init();
    if (e.repeat && app.screen !== 'menu') return;
    const c = e.code;
    switch (app.screen) {
      case 'title': showMain(); return;
      case 'menu': case 'pause': case 'result':
        if (UP.includes(c)) { app.menuIdx = (app.menuIdx + app.items.length - 1) % app.items.length; G.Audio.play('ui'); paintMenu(); }
        else if (DOWN.includes(c)) { app.menuIdx = (app.menuIdx + 1) % app.items.length; G.Audio.play('ui'); paintMenu(); }
        else if (LEFT.includes(c)) cycle(-1);
        else if (RIGHT.includes(c)) cycle(1);
        else if (OK.includes(c)) activate();
        else if (BACK.includes(c) && app.back) app.back();
        if (c === 'Space') e.preventDefault();
        return;
      case 'howto': if (BACK.includes(c) || OK.includes(c)) app.howtoBack(); return;
      case 'select': {
        const s = app.sel, two = app.mode === 'vs';
        if (two) {
          if (c === 'KeyA') selMove(0, -1); else if (c === 'KeyD') selMove(0, 1);
          else if (c === 'KeyJ' && !s.ok[0]) { s.ok[0] = true; afterSel(); } else if (c === 'KeyK' || c === 'Escape') selCancel(0);
          else if (c === 'ArrowLeft') selMove(1, -1); else if (c === 'ArrowRight') selMove(1, 1);
          else if ((c === 'Period' || c === 'Numpad1' || c === 'Enter') && !s.ok[1]) { s.ok[1] = true; afterSel(); } else if (c === 'Slash' || c === 'Numpad2') selCancel(1);
        } else {
          const i = Math.min(1, s.step);
          if (LEFT.includes(c)) selMove(i, -1); else if (RIGHT.includes(c)) selMove(i, 1);
          else if (OK.includes(c) && s.step < 2) { selConfirm(); afterSel(); } else if (BACK.includes(c)) selCancel(i);
        }
        return;
      }
      case 'fight': if (c === 'Escape' || c === 'KeyP') showPause(); return;
    }
  };

  // ---------- loop ----------
  let acc = 0, last = performance.now(), selT = 0, padPrev = false;
  function loop(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const pad = G.Input.padStart(0) || G.Input.padStart(1);
    if (pad && !padPrev) { if (app.screen === 'fight') showPause(); else if (app.screen === 'pause') resume(); }
    padPrev = pad;
    if (app.screen === 'fight' && !app.paused && app.game) {
      acc += dt;
      while (acc >= 1 / 60) { acc -= 1 / 60; tick(); if (app.screen !== 'fight') break; }
    } else acc = 0;
    if (app.game) G.Render.draw(app.game, (app.screen === 'fight' && !app.paused) || app.screen === 'result' ? dt : 0);
    if (app.screen === 'select') {
      selT += dt;
      for (const i of [0, 1]) {
        const cv = document.getElementById('pv' + i); if (!cv) continue;
        const id = G.CHARS[app.sel.cur[i]], pal = (i === 1 && app.sel.cur[0] === app.sel.cur[1]) ? 1 : 0;
        const S = G.SPR[id][pal].idle, fr = S.frames[Math.floor(selT * 8) % S.n];
        const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.clearRect(0, 0, cv.width, cv.height);
        x.save(); if (i === 1) { x.translate(cv.width, 0); x.scale(-1, 1); } x.drawImage(fr.c, 0, -14); x.restore();
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.__app = app; window.__tick = tick;
  window.__test = (p1, p2, mode, bothAI, diff) => { app.mode = mode || 'cpu'; app.diff = diff || 'normal'; app.cfg = { mode: app.mode, p1, p2, pal1: 0, pal2: p1 === p2 ? 1 : 0 }; beginFight(); app.autoP1 = bothAI ? G.AI.create(diff || 'normal') : null; };
})();
