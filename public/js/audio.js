/* =========================================================
   SES: efektler + lo-fi arka plan müziği (Web Audio ile üretilir, dosya yok)
   ========================================================= */
const Sound = (() => {
  let ctx = null, master, sfxBus, musicBus, noiseBuf = null;
  let sfxVol = 0.8, musicVol = 0.45, musicOn = false, musicTimer = null, nextBeat = 0, beat = 0, duck = 1;
  function init() {
    if (ctx) return ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
      master.connect(comp).connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = sfxVol; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { ctx = null; }
    return ctx;
  }
  const t0 = () => ctx.currentTime;
  function env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); }
  function tone(freq, { type = 'sine', t = t0(), a = 0.004, dec = 0.15, vol = 0.3, bus = sfxBus, slide = 0, filter = 0 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + a + dec);
    let node = o;
    if (filter) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; o.connect(f); node = f; }
    node.connect(g).connect(bus); env(g, t, a, vol, dec); o.start(t); o.stop(t + a + dec + 0.05);
  }
  function noise({ t = t0(), dec = 0.05, vol = 0.2, type = 'bandpass', freq = 3000, q = 1, bus = sfxBus } = {}) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); s.connect(f).connect(g).connect(bus); env(g, t, 0.002, vol, dec);
    s.start(t, Math.random()); s.stop(t + dec + 0.05);
  }
  const ok = () => init() && ctx.state !== 'closed' && (ctx.state === 'running' || ctx.resume(), true);
  const sfx = {
    // taş kuyuya düşer: tok "tık" (ahşap + taş)
    clack(k) { if (!ok()) return; const t = t0(), SC = [1, 1.125, 1.26, 1.5, 1.68, 2, 2.25, 2.52, 3], p = k == null ? 0.85 + Math.random() * 0.3 : SC[k % SC.length] * (1 + Math.floor(k / SC.length) * 0.12) * 0.8;
      tone(1900 * p, { type: 'triangle', t, dec: 0.035, vol: 0.18 }); tone(620 * p, { type: 'sine', t, dec: 0.08, vol: 0.22, slide: 0.7 });
      noise({ t, dec: 0.03, vol: 0.18, freq: 4200 * p, q: 2 }); },
    // hazineye taş: derin, tok bas
    thunk() { if (!ok()) return; const t = t0(); tone(150, { t, dec: 0.25, vol: 0.45, slide: 0.55 }); tone(300, { type: 'triangle', t, dec: 0.08, vol: 0.15 });
      noise({ t, dec: 0.06, vol: 0.12, type: 'lowpass', freq: 900 }); },
    grab() { if (!ok()) return; const t = t0(); noise({ t, dec: 0.12, vol: 0.15, type: 'bandpass', freq: 1500, q: 0.7 }); tone(330, { t, dec: 0.08, vol: 0.08 }); },
    click() { if (!ok()) return; tone(880, { type: 'triangle', dec: 0.04, vol: 0.12 }); },
    error() { if (!ok()) return; const t = t0(); tone(180, { type: 'square', t, dec: 0.12, vol: 0.08, filter: 900 }); tone(140, { type: 'square', t: t + 0.1, dec: 0.15, vol: 0.08, filter: 900 }); },
    capture() { if (!ok()) return; const t = t0(); [523, 659, 784, 1047].forEach((f, i) => tone(f, { type: 'triangle', t: t + i * 0.07, dec: 0.25, vol: 0.2 })); },
    lose() { if (!ok()) return; const t = t0(); [440, 392, 349].forEach((f, i) => tone(f, { type: 'triangle', t: t + i * 0.12, dec: 0.3, vol: 0.18 })); },
    extra() { if (!ok()) return; const t = t0(); tone(784, { type: 'sine', t, dec: 0.3, vol: 0.2 }); tone(1175, { type: 'sine', t: t + 0.09, dec: 0.4, vol: 0.2 }); tone(1568, { type: 'triangle', t: t + 0.18, dec: 0.4, vol: 0.12 }); },
    win() { if (!ok()) return; const t = t0(); const seq = [523, 659, 784, 1047, 784, 1047, 1319];
      seq.forEach((f, i) => tone(f, { type: 'triangle', t: t + i * 0.11, dec: 0.3, vol: 0.2 }));
      [523, 659, 784, 1047].forEach(f => tone(f, { type: 'sine', t: t + 0.8, dec: 1.2, vol: 0.12 })); },
    defeat() { if (!ok()) return; const t = t0(); [392, 370, 349, 330].forEach((f, i) => tone(f, { type: 'triangle', t: t + i * 0.22, dec: 0.4, vol: 0.16, filter: 2000 })); },
    coin() { if (!ok()) return; const t = t0(); tone(1319, { type: 'square', t, dec: 0.06, vol: 0.07, filter: 5000 }); tone(1760, { type: 'square', t: t + 0.06, dec: 0.2, vol: 0.07, filter: 5000 }); },
    freeze() { if (!ok()) return; const t = t0(); for (let i = 0; i < 6; i++) tone(2000 + i * 300, { type: 'sine', t: t + i * 0.03, dec: 0.15, vol: 0.06 }); noise({ t, dec: 0.4, vol: 0.08, type: 'highpass', freq: 6000 }); },
    shield() { if (!ok()) return; const t = t0(); tone(220, { type: 'sawtooth', t, dec: 0.5, vol: 0.1, slide: 2, filter: 1500 }); },
    swap() { if (!ok()) return; const t = t0(); tone(500, { t, dec: 0.12, vol: 0.15, slide: 1.8 }); tone(900, { t: t + 0.12, dec: 0.12, vol: 0.15, slide: 0.55 }); },
    mystery() { if (!ok()) return; const t = t0(); [660, 880, 990, 1320].forEach((f, i) => tone(f, { type: 'sine', t: t + i * 0.05, dec: 0.3, vol: 0.12 })); },
    tick() { if (!ok()) return; tone(1500, { type: 'square', dec: 0.02, vol: 0.05, filter: 3000 }); },
    boom() { if (!ok()) return; const t = t0(); tone(70, { t, a: 0.005, dec: 0.9, vol: 0.7, slide: 0.45 }); tone(140, { type: 'triangle', t, dec: 0.25, vol: 0.25, slide: 0.5 }); noise({ t, dec: 0.4, vol: 0.25, type: 'lowpass', freq: 400 }); },
    crash() { if (!ok()) return; const t = t0(); noise({ t, dec: 0.9, vol: 0.5, type: 'bandpass', freq: 1200, q: 0.4 }); noise({ t: t + 0.05, dec: 0.6, vol: 0.35, type: 'highpass', freq: 3000 });
      tone(90, { t, dec: 0.6, vol: 0.5, slide: 0.4 }); for (let i = 0; i < 10; i++) tone(500 + Math.random() * 1800, { type: 'triangle', t: t + 0.1 + Math.random() * 0.6, dec: 0.05, vol: 0.08 }); },
    riser(n = 2) { if (!ok()) return; const t = t0(), f = 300 + n * 90; tone(f, { type: 'sawtooth', t, a: 0.02, dec: 0.45, vol: 0.06, slide: 2.2, filter: 2500 }); [0, 0.08, 0.16].forEach((d, i) => tone(f * (1.5 + i * 0.5), { type: 'triangle', t: t + 0.3 + d, dec: 0.25, vol: 0.12 })); },
    cheer() { if (!ok()) return; const t = t0(); for (let i = 0; i < 4; i++) noise({ t: t + i * 0.18, dec: 0.7, vol: 0.07, type: 'bandpass', freq: 900 + i * 400, q: 0.6 }); },
    vote() { if (!ok()) return; tone(1320, { type: 'sine', dec: 0.06, vol: 0.06 }); },
    pop() { if (!ok()) return; tone(600, { type: 'sine', dec: 0.08, vol: 0.15, slide: 1.6 }); }
  };

  /* ---------- lo-fi müzik ---------- */
  const BPM = 76, STEP = 60 / BPM / 2; // sekizlik
  // Fmaj7 – Em7 – Dm7 – Cmaj7 (her biri 1 ölçü = 8 sekizlik)
  const CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
  const SCALE = [72, 74, 76, 79, 81, 84];
  const mtof = m => 440 * 2 ** ((m - 69) / 12);
  function pad(m, t, dur) {
    for (const det of [-6, 6]) { const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'triangle'; o.frequency.value = mtof(m); o.detune.value = det; f.type = 'lowpass'; f.frequency.value = 900;
      o.connect(f).connect(g).connect(musicBus);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.035, t + 0.4); g.gain.setValueAtTime(0.035, t + dur - 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.05); }
  }
  function kick(t) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    o.connect(g).connect(musicBus); env(g, t, 0.003, 0.5, 0.25); o.start(t); o.stop(t + 0.3); }
  function schedule() {
    while (nextBeat < ctx.currentTime + 0.25) {
      const t = nextBeat, bar = Math.floor(beat / 8) % 4, b = beat % 8, swing = b % 2 ? STEP * 0.18 : 0, tt = t + swing;
      if (b === 0) { CHORDS[bar].forEach(m => pad(m, t, STEP * 8)); tone(mtof(CHORDS[bar][0] - 12), { t, a: 0.02, dec: STEP * 6, vol: 0.12, bus: musicBus, filter: 400 }); }
      if (b === 0 || b === 5) kick(tt);
      if (b === 4) noise({ t: tt, dec: 0.16, vol: 0.09, freq: 1800, q: 0.8, bus: musicBus });
      if (b % 2 === 1 || Math.random() < 0.3) noise({ t: tt, dec: 0.03, vol: 0.035, type: 'highpass', freq: 8000, bus: musicBus });
      if (Math.random() < 0.22) { const m = SCALE[Math.floor(Math.random() * SCALE.length)]; tone(mtof(m), { type: 'sine', t: tt, a: 0.01, dec: STEP * 2.5, vol: 0.05, bus: musicBus });
        tone(mtof(m), { type: 'sine', t: tt + STEP * 1.5, a: 0.01, dec: STEP * 2, vol: 0.02, bus: musicBus }); }
      if (Math.random() < 0.5) noise({ t: t + Math.random() * STEP, dec: 0.004, vol: 0.02 + Math.random() * 0.03, type: 'highpass', freq: 3000, bus: musicBus }); // plak cızırtısı
      nextBeat += STEP; beat++;
    }
  }
  function applyMusicGain(fast) { if (!ctx) return; musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.linearRampToValueAtTime(musicOn ? musicVol * duck : 0, ctx.currentTime + (fast ? 0.1 : 1.2)); }
  function startMusic() {
    if (!ok()) return; musicOn = true;
    if (!musicTimer) { nextBeat = ctx.currentTime + 0.1; musicTimer = setInterval(schedule, 80); }
    applyMusicGain();
  }
  function stopMusic() { musicOn = false; applyMusicGain(); setTimeout(() => { if (!musicOn && musicTimer) { clearInterval(musicTimer); musicTimer = null; } }, 1500); }
  return {
    sfx: new Proxy(sfx, { get: (o, k) => (...a) => { try { if (sfxVol > 0) o[k] && o[k](...a); } catch (e) { } } }),
    unlock() { if (init() && ctx.state === 'suspended') ctx.resume(); },
    setSfx(v) { sfxVol = v; if (sfxBus) sfxBus.gain.value = v; },
    setMusicVol(v) { musicVol = v; applyMusicGain(true); },
    music(on) { on ? startMusic() : stopMusic(); },
    duck(on) { duck = on ? 0.45 : 1; applyMusicGain(); },
    get musicPlaying() { return musicOn; }
  };
})();
