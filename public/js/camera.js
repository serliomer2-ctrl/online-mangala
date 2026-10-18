/* =========================================================
   KAMERA İLE EL KONTROLÜ (deneysel) — MediaPipe Hand Landmarker
   ✋ Elini kameraya göster → imleç elini takip eder
   ✊ Yumruk yap → kuyudaki taşları "al" (ya da butona bas)
   🖐️ Elini aç → taşları kuyuya "bırak" (hamle yapılır / buton tıklanır)
   ========================================================= */
const Cam = (() => {
  const VER = '0.10.14';
  const LIB = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/vision_bundle.mjs`;
  const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`;
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
  let on = false, video, stream, lm, raf, box, cur, cvs, ctx;
  let pos = { x: innerWidth / 2, y: innerHeight / 2 }, closed = false, pressed = null, openFrames = 0, closedFrames = 0, lastSeen = 0;
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function extendedCount(h) {
    let n = 0; for (const [tip, pip] of [[8, 6], [12, 10], [16, 14], [20, 18]]) if (d(h[tip], h[0]) > d(h[pip], h[0]) * 1.12) n++; return n;
  }
  function ui() {
    box = document.createElement('div'); box.id = 'cambox';
    box.innerHTML = `<video playsinline muted></video><canvas></canvas><div class="cam-lbl">✋ ${t('El kontrolü')} · ✊ ${t('al')} · 🖐️ ${t('bırak')}</div><button class="cam-x" title="${t('Kapat')}">✖</button>`;
    document.body.appendChild(box);
    video = box.querySelector('video'); cvs = box.querySelector('canvas'); ctx = cvs.getContext('2d');
    box.querySelector('.cam-x').onclick = () => { S.camera = false; persist(); stop(); if (curScreen === 'settings') RENDER.settings(); };
    cur = document.createElement('div'); cur.id = 'camcur'; cur.innerHTML = '<span>🖐️</span>'; document.body.appendChild(cur);
  }
  async function start() {
    if (on) return; on = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast('❌ ' + t('Bu tarayıcı kamerayı desteklemiyor (HTTPS gerekir).')); return fail(); }
    ui(); toast('📷 ' + t('Kamera ve el modeli yükleniyor...'), 4000);
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false });
      video.srcObject = stream; await video.play();
      const vision = await import(LIB);
      const fs = await vision.FilesetResolver.forVisionTasks(WASM);
      lm = await vision.HandLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' }, runningMode: 'VIDEO', numHands: 1 });
    } catch (e) { console.error(e); toast('❌ ' + t('Kamera açılamadı: izin verilmedi ya da model yüklenemedi.'), 5000); return fail(); }
    if (!on) return;
    toast('✋ ' + t('Elini kameraya göster! Yumruk yap = al, aç = bırak.'), 5000); Sound.sfx.extra();
    loop();
  }
  function fail() { S.camera = false; persist(); stop(); if (curScreen === 'settings') RENDER.settings(); }
  function stop() {
    on = false; cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach(tr => tr.stop()); stream = null;
    if (lm) { try { lm.close(); } catch { } lm = null; }
    if (box) box.remove(); if (cur) cur.remove(); box = cur = null; unmark();
  }
  const unmark = () => document.querySelectorAll('.cam-hover,.cam-sel').forEach(e => e.classList.remove('cam-hover', 'cam-sel'));
  function target() {
    cur.style.visibility = 'hidden'; const el = document.elementFromPoint(pos.x, pos.y); cur.style.visibility = '';
    if (!el) return null;
    return el.closest('[data-i], button, .mcard, .chip, .tab, .lrow, .rw.claim, .quiz button') || null;
  }
  function loop() {
    if (!on || !lm) return;
    raf = requestAnimationFrame(loop);
    if (video.readyState < 2) return;
    let res; try { res = lm.detectForVideo(video, performance.now()); } catch { return; }
    cvs.width = video.videoWidth; cvs.height = video.videoHeight; ctx.clearRect(0, 0, cvs.width, cvs.height);
    const h = res && res.landmarks && res.landmarks[0];
    if (!h) { if (performance.now() - lastSeen > 600) cur.classList.add('lost'); return; }
    lastSeen = performance.now(); cur.classList.remove('lost');
    ctx.fillStyle = '#f2c14e'; for (const p of h) { ctx.beginPath(); ctx.arc(p.x * cvs.width, p.y * cvs.height, 4, 0, 7); ctx.fill(); }
    // avuç merkezi (yumrukta da sabit kalır), ayna görüntüsü
    const c = [0, 5, 9, 13, 17].reduce((a, i) => ({ x: a.x + h[i].x / 5, y: a.y + h[i].y / 5 }), { x: 0, y: 0 });
    const nx = Math.min(1, Math.max(0, ((1 - c.x) - 0.15) / 0.7)), ny = Math.min(1, Math.max(0, (c.y - 0.12) / 0.66));
    pos.x += (nx * innerWidth - pos.x) * 0.35; pos.y += (ny * innerHeight - pos.y) * 0.35;
    cur.style.transform = `translate(${pos.x}px,${pos.y}px)`;
    const ext = extendedCount(h);
    if (ext <= 1) { closedFrames++; openFrames = 0; } else if (ext >= 3) { openFrames++; closedFrames = 0; }
    const tg = target();
    document.querySelectorAll('.cam-hover').forEach(e => { if (e !== tg) e.classList.remove('cam-hover'); });
    if (tg) tg.classList.add('cam-hover');
    if (!closed && closedFrames >= 3) {          // ✊ yumruk: al / bas
      closed = true; cur.firstChild.textContent = '✊'; cur.classList.add('closed');
      pressed = tg; if (pressed) { pressed.classList.add('cam-sel'); Sound.sfx.grab(); vib(15); }
    }
    if (closed && openFrames >= 3) {             // 🖐️ aç: bırak / tıkla
      closed = false; cur.firstChild.textContent = '🖐️'; cur.classList.remove('closed');
      const p = pressed; pressed = null; unmark();
      if (p && document.body.contains(p)) {
        const isPit = p.hasAttribute('data-i');
        if (isPit || p === tg || p.contains(tg)) { Sound.sfx.click(); p.click(); if (isPit) FX.burst(pos.x, pos.y, ['✨'], 6); }
      }
    }
  }
  return { start, stop, get on() { return on; } };
})();
