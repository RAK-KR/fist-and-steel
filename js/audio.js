// Synthesized sound effects (no audio files). Low, heavy impacts.
window.G = window.G || {};
G.Audio = (function () {
  let ctx = null, master = null, noiseBuf = null, muted = false;
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.55;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function noise(t, dur, type, f0, f1, peak, q) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f0, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur); fl.Q.value = q || 0.8;
    const g = ctx.createGain(); env(g, t, 0.004, peak, dur);
    s.connect(fl); fl.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.05);
  }
  function tone(t, dur, f0, f1, peak, type) {
    const o = ctx.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); env(g, t, 0.003, peak, dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function play(type, o) {
    if (!ctx || muted) return;
    const t = ctx.currentTime, str = (o && o.str) || 1;
    switch (type) {
      case 'hit':
        tone(t, 0.12 + str * 0.05, 120 + str * 10, 38, 0.5 + str * 0.12);
        noise(t, 0.08 + str * 0.04, 'lowpass', o.blade ? 2600 : 1500, 300, 0.35 + str * 0.1);
        if (o.blade) noise(t, 0.06, 'bandpass', 1800, 900, 0.18, 2);
        if (o.counter) tone(t + 0.01, 0.2, 70, 45, 0.5);
        break;
      case 'block':
        tone(t, 0.07, 340, 180, 0.22, 'triangle');
        noise(t, 0.05, 'bandpass', 1200, 600, 0.2, 1.5);
        break;
      case 'swing':
        noise(t, 0.12 + str * 0.03, 'bandpass', o.blade ? 1400 : 900, o.blade ? 500 : 300, 0.12 + str * 0.04, 1.2);
        break;
      case 'proj':
        noise(t, 0.3, 'bandpass', 1600, 500, 0.18, 2);
        tone(t, 0.25, 220, 110, 0.1, 'triangle');
        break;
      case 'land': tone(t, 0.08, 90, 50, 0.15); break;
      case 'down': tone(t, 0.25, 80, 35, 0.6); noise(t, 0.2, 'lowpass', 600, 120, 0.3); break;
      case 'ko': tone(t, 0.9, 70, 28, 0.9); noise(t, 0.6, 'lowpass', 900, 80, 0.45); break;
      case 'ui': tone(t, 0.06, 260, 220, 0.12, 'triangle'); break;
      case 'select': tone(t, 0.12, 196, 147, 0.2, 'triangle'); tone(t + 0.04, 0.12, 147, 110, 0.15, 'triangle'); break;
      case 'round': tone(t, 0.5, 110, 82, 0.35, 'sawtooth'); noise(t, 0.4, 'lowpass', 500, 100, 0.2); break;
    }
  }
  return { init, play, toggle() { muted = !muted; return !muted; } };
})();
