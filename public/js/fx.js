/* =========================================================
   EĞLENCE EFEKTLERİ: kombo, sarsıntı, flaş, dev yazılar,
   emoji patlaması, Masayı Devir, slow-motion K.O.
   ========================================================= */
const FX = (() => {
  const layer = () => { let l = document.getElementById('fxtop'); if (!l) { l = document.createElement('div'); l.id = 'fxtop'; document.body.appendChild(l); } return l; };
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function shake(power = 1) {
    if (reduced()) return; const a = document.getElementById('app');
    a.style.setProperty('--sh', (6 * power) + 'px'); a.classList.remove('scr-shake'); void a.offsetWidth; a.classList.add('scr-shake');
    setTimeout(() => a.classList.remove('scr-shake'), 520);
  }
  function flash(color = '#fff', ms = 650) {
    const f = document.createElement('div'); f.className = 'fx-flash'; f.style.background = color; f.style.animationDuration = ms + 'ms';
    layer().appendChild(f); setTimeout(() => f.remove(), ms + 50);
  }
  function bigText(text, cls = '', ms = 1500) {
    const d = document.createElement('div'); d.className = 'fx-big ' + cls; d.textContent = text; d.style.animationDuration = ms + 'ms';
    layer().appendChild(d); setTimeout(() => d.remove(), ms + 50);
  }
  function burst(x, y, chars, n = 14, spread = 1) {
    if (reduced()) return;
    const L = layer(); const arr = Array.isArray(chars) ? chars : [chars];
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div'); p.className = 'fx-p'; p.textContent = arr[i % arr.length];
      const ang = Math.random() * Math.PI * 2, sp = (60 + Math.random() * 140) * spread;
      p.style.left = x + 'px'; p.style.top = y + 'px';
      p.style.setProperty('--dx', Math.cos(ang) * sp + 'px'); p.style.setProperty('--dy', (Math.sin(ang) * sp - 60) + 'px');
      p.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg'); p.style.fontSize = (16 + Math.random() * 18) + 'px';
      p.style.animationDelay = (Math.random() * 80) + 'ms';
      L.appendChild(p); setTimeout(() => p.remove(), 1300);
    }
  }
  const at = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  function combo(n, el) {
    const words = ['', '', 'KOMBO x2!', 'KOMBO x3!!', 'SÜPER KOMBO x4!', 'ÇILGIN KOMBO x5!', 'EFSANE KOMBO x' + n + '!'];
    bigText(t(words[Math.min(n, 6)] || ('KOMBO x' + n + '!')), 'combo c' + Math.min(n, 6), 1300);
    Sound.sfx.riser(n); if (n >= 3) shake(0.6);
    if (el) { const [x, y] = at(el); burst(x, y, ['⭐', '✨', '🔥'], 8 + n * 3); }
  }
  function megaCapture(amount, el) {
    bigText(amount >= 10 ? t('DEV VURGUN!') : t('MEGA ÇİFT!'), 'mega', 1300); shake(amount >= 10 ? 1.6 : 1); Sound.sfx.boom();
    if (el) { const [x, y] = at(el); burst(x, y, ['💰', '🪙', '💎'], 16); }
  }
  /* ---------- Masayı Devir ---------- */
  async function rageQuit(boardEl) {
    if (!boardEl) return;
    Sound.sfx.crash(); shake(2.2); vib([60, 40, 120]);
    const stones = [...boardEl.querySelectorAll('.st')].slice(0, 70);
    const L = layer();
    const flying = stones.map(s => {
      const r = s.getBoundingClientRect(), c = document.createElement('i');
      c.className = 'st fx-stone'; c.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;transform:none;--c:${getComputedStyle(s).getPropertyValue('--c')}`;
      L.appendChild(c);
      return { el: c, x: r.left, y: r.top, vx: (Math.random() - .5) * 26, vy: -Math.random() * 22 - 8, s: 1, vs: 0.03 + Math.random() * 0.06, rot: 0, vr: (Math.random() - .5) * 40 };
    });
    stones.forEach(s => s.style.visibility = 'hidden');
    boardEl.classList.add('fx-rage');
    const t0 = performance.now();
    await new Promise(res => (function step() {
      const k = (performance.now() - t0) / 16.7;
      for (const f of flying) { f.vy += 0.9; f.x += f.vx; f.y += f.vy; f.s += f.vs; f.rot += f.vr;
        f.el.style.transform = `translate(${f.x - parseFloat(f.el.style.left)}px,${f.y - parseFloat(f.el.style.top)}px) scale(${f.s}) rotate(${f.rot}deg)`; f.el.style.opacity = Math.max(0, 1 - k / 90); }
      if (k < 95) requestAnimationFrame(step); else res();
    })());
    flying.forEach(f => f.el.remove());
    boardEl.classList.remove('fx-rage'); stones.forEach(s => s.style.visibility = '');
  }
  /* ---------- slow-motion K.O. ---------- */
  async function koZoom(wrap, x, y, on) {
    if (reduced()) return;
    wrap.style.transformOrigin = `${x}px ${y}px`;
    wrap.classList.toggle('ko-zoom', on);
    document.body.classList.toggle('ko-dim', on);
    await wait(on ? 650 : 450);
  }
  return { shake, flash, bigText, burst, combo, megaCapture, rageQuit, koZoom, at };
})();
