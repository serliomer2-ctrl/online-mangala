/* =========================================================
   v3.6: Şans Çarkı, kuyu ısı haritası, grafik kalitesi & 3B kartlar,
   müzik temaları, mağaza indirimi, duyuru şeridi,
   kurucu paneli "Oyun Ayarları"
   ========================================================= */
const cfg = () => CONTENT.config || {};

/* ---------- Şans Çarkı ---------- */
const WHEEL_DEF = [{ t: 'coins', n: 50, w: 26 }, { t: 'xp', n: 80, w: 18 }, { t: 'coins', n: 100, w: 20 }, { t: 'coins', n: 200, w: 10 },
  { t: 'xp', n: 200, w: 9 }, { t: 'coins', n: 500, w: 4 }, { t: 'item', c: 'bgs', id: 'kar', w: 3 }, { t: 'coins', n: 1000, w: 1 }];
const WCOL = ['#f2c14e', '#e5534b', '#4cc38a', '#5aa9e6', '#a77bf3', '#ff922b', '#20c997', '#f06595', '#94d82d', '#339af0', '#cc5de8', '#fcc419'];
function wheelCfg() { const c = cfg(); return { list: Array.isArray(c.wheel) && c.wheel.length >= 4 ? c.wheel : WHEEL_DEF, cost: c.wheelCost != null ? c.wheelCost : 150 }; }
const prizeIcon = p => p.t === 'coins' ? '🪙' : p.t === 'xp' ? '⭐' : ((CAT[p.c] && CAT[p.c][p.id] && CAT[p.c][p.id].icon) || '🎁');
const prizeTxt = p => p.t === 'coins' ? p.n + ' 🪙' : p.t === 'xp' ? p.n + ' XP' : CAT[p.c] && CAT[p.c][p.id] ? '🎁 ' + nm(CAT[p.c][p.id]) : '🎁';
const freeSpin = () => !S.wheel || S.wheel.day !== dayKey();
let wheelRot = 0, spinning = false;
(function () { const s = document.createElement('section'); s.className = 'screen'; s.id = 'scr-wheel'; $('scr-mode').after(s); })();
function wheelSVG(list) {
  const n = list.length, R = 150, a = 2 * Math.PI / n; let s = '';
  list.forEach((p, i) => {
    const a0 = -Math.PI / 2 + i * a - a / 2, a1 = a0 + a, P = (an, r) => `${(R + r * Math.cos(an)).toFixed(2)},${(R + r * Math.sin(an)).toFixed(2)}`;
    s += `<path d="M${R},${R} L${P(a0, R)} A${R},${R} 0 0 1 ${P(a1, R)} Z" fill="${WCOL[i % WCOL.length]}" stroke="#2a1a10" stroke-width="2"/>`;
    const mid = -Math.PI / 2 + i * a, [tx, ty] = P(mid, R * .64).split(',');
    s += `<g transform="translate(${tx},${ty}) rotate(${(mid * 180 / Math.PI + 90).toFixed(1)})"><text text-anchor="middle" y="-4" font-size="24">${prizeIcon(p)}</text><text text-anchor="middle" y="17" font-size="14" font-weight="900" fill="#2a1a10">${p.t === 'item' ? '' : p.n}</text></g>`;
  });
  for (let i = 0; i < n; i++) { const an = -Math.PI / 2 + i * a - a / 2; s += `<circle cx="${(R + (R - 7) * Math.cos(an)).toFixed(1)}" cy="${(R + (R - 7) * Math.sin(an)).toFixed(1)}" r="4" fill="#fff8e0" stroke="#2a1a10"/>`; }
  return `<svg viewBox="0 0 300 300" class="wheel" id="wheel" style="transform:rotate(${wheelRot}deg)">${s}<circle cx="150" cy="150" r="30" fill="#2a1a10" stroke="#f2c14e" stroke-width="5"/><text x="150" y="159" text-anchor="middle" font-size="26">🎡</text></svg>`;
}
RENDER.wheel = () => {
  const { list, cost } = wheelCfg(), tot = list.reduce((a, p) => a + (p.w || 1), 0), free = freeSpin();
  $('scr-wheel').innerHTML = `<button class="btn sec sm back" onclick="go('menu')">← ${t('Menü')}</button><h2>🎡 ${t('Şans Çarkı')}</h2>
    <p class="muted" style="margin-top:-6px">${t('Her gün 1 ücretsiz çevirme hakkın var. Şansını dene!')}</p>
    <div class="wheelwrap"><div class="wpointer">▼</div>${wheelSVG(list)}</div>
    <div class="row" style="justify-content:center;margin-top:14px">
      ${free ? `<button class="btn big" id="spinbtn" onclick="spinWheel(false)">🎡 ${t('Ücretsiz Çevir')}</button>`
        : cost ? `<button class="btn" id="spinbtn" onclick="spinWheel(true)">🎡 ${t('Tekrar Çevir')} · ${isAdmin() ? '∞' : cost} 🪙</button>` : ''}
      ${free ? '' : `<span class="muted small">${t('Sonraki ücretsiz çevirme')}: ${until(tomorrow())}</span>`}</div>
    <div class="sec-title"><h3>🎁 ${t('Ödüller')}</h3><span class="muted small">${t('Toplam çevirme')}: ${(S.wheel && S.wheel.spins) || 0}</span></div>
    <div class="wprizes">${list.map((p, i) => `<div class="wpz"><i style="background:${WCOL[i % WCOL.length]}"></i><b>${prizeTxt(p)}</b><span class="muted small">%${Math.round((p.w || 1) / tot * 1000) / 10}</span></div>`).join('')}</div>`;
};
async function spinWheel(paid) {
  if (spinning) return;
  const { list, cost } = wheelCfg();
  if (!paid && !freeSpin()) return;
  if (paid) { if (!cost) return; if (!isAdmin() && S.coins < cost) { Sound.sfx.error(); toast(t('Yetersiz para! {0} 🪙 daha lazım.', cost - S.coins)); return; } if (!spend(cost)) return; updTop(true); }
  spinning = true; const btn = $('spinbtn'); if (btn) btn.disabled = true;
  const tot = list.reduce((a, p) => a + (p.w || 1), 0); let r = Math.random() * tot, k = 0;
  for (; k < list.length - 1; k++) { r -= list[k].w || 1; if (r < 0) break; }
  const seg = 360 / list.length, jitter = (Math.random() - .5) * seg * .7;
  wheelRot = Math.ceil(wheelRot / 360) * 360 + 360 * 6 + ((360 - k * seg) % 360) + jitter;
  const w = $('wheel'); if (w) { w.style.transition = 'transform 4.8s cubic-bezier(.15,.7,.1,1)'; w.style.transform = `rotate(${wheelRot}deg)`; }
  S.wheel = { day: paid ? S.wheel.day : dayKey(), spins: ((S.wheel && S.wheel.spins) || 0) + 1 }; persist();
  Sound.sfx.riser(1);
  const t0 = performance.now(); (function tk() { const e = (performance.now() - t0) / 4800; if (e >= 1) return; Sound.sfx.tick(); vib(5); setTimeout(tk, 45 + 420 * e * e); })();
  await wait(5000);
  const p = list[k]; let rw = p.t === 'coins' ? { coins: p.n } : p.t === 'xp' ? { xp: p.n } : { item: [p.c, p.id] };
  if (rw.item && !(CAT[p.c] && CAT[p.c][p.id])) rw = { coins: 300 };
  const had = rw.item && owns(rw.item[0], rw.item[1]);
  grant(rw, true); persist(); updTop(true);
  if (S.wheel.spins >= 10) unlockAch('carkci');
  Sound.sfx.win(); if (p.t !== 'xp' || p.n >= 200) confetti();
  spinning = false;
  if (curScreen === 'wheel') RENDER.wheel();
  const txt = had ? t('{0} zaten vardı → +200 🪙', nm(item(rw.item[0], rw.item[1]))) : rw.item ? prizeTxt(p) : rw.coins ? rw.coins + ' 🪙' : rw.xp + ' XP';
  await modal(`<div class="big">${prizeIcon(p)}</div><h3>${t('Tebrikler!')}</h3><p style="font-size:20px;font-weight:900">${txt}</p>`, [{ label: t('Harika!'), value: 1 }]);
}

/* ---------- Mağaza indirimi & duyuru şeridi (kurucu ayarlar) ---------- */
const saleNow = () => { const s = cfg().sale; return s && s.off > 0 && s.end > Date.now() ? s : null; };
const _priceOf = priceOf;
priceOf = function (c, id) { const p = _priceOf(c, id), s = saleNow(), it = item(c, id); if (s && it.price && !evShop(c, id)) return Math.min(p, Math.round(it.price * (100 - s.off) / 100)); return p; };
const _rshop = RENDER.shop;
RENDER.shop = () => { _rshop(); const s = saleNow(), h = document.querySelector('#scr-shop h2'); if (s && h) h.insertAdjacentHTML('afterend', `<div class="salebar">🏷️ <b>${t('BÜYÜK İNDİRİM')}</b> — ${t('Tüm mağazada %{0}!', s.off)} ${until(s.end)}</div>`); };
const _rmenu = RENDER.menu;
RENDER.menu = () => {
  _rmenu();
  const tk = cfg().ticker, s = saleNow(), hero = document.querySelector('#scr-menu .hero');
  const msgs = [tk ? '📣 ' + esc(tk) : '', s ? '🏷️ ' + t('Mağazada %{0} indirim!', s.off) : ''].filter(Boolean);
  if (msgs.length && hero) hero.insertAdjacentHTML('beforebegin', `<div class="ticker"><div class="tk-in">${(msgs.join(' &nbsp;•&nbsp; ') + ' &nbsp;•&nbsp; ').repeat(3)}</div></div>`);
  const grid = document.querySelector('#scr-menu .menu-grid');
  if (grid) grid.insertAdjacentHTML('afterbegin', `<button class="mcard wheelcard" onclick="go('wheel')">${freeSpin() ? `<span class="note new">${t('ÜCRETSİZ')}</span>` : ''}<div class="ic spinic">🎡</div><h3>${t('Şans Çarkı')}</h3><p>${freeSpin() ? t('Günlük çevirme hakkın hazır!') : t('Yarın yine gel')}</p></button>`);
};

/* ---------- Kuyu ısı haritası ---------- */
const _sendAct = sendAct;
sendAct = function (act) { if (act && act.type === 'move' && G && !['local', 'puzzle', 'spectate'].includes(G.kind) && act.pit >= 0 && act.pit < 6) { S.pitUse[act.pit]++; } return _sendAct(act); };
function heatHTML() {
  const u = S.pitUse || [], tot = u.reduce((a, b) => a + b, 0); if (!tot) return '';
  const mx = Math.max(...u), fav = u.indexOf(mx);
  return `<div class="sec-title"><h3>🔥 ${t('Kuyu Isı Haritası')}</h3><span class="muted small">${t('{0} hamle', tot)}</span></div>
    <div class="card"><div class="heat">${u.map((n, i) => `<div class="hc" style="--h:${(n / mx).toFixed(2)}"><b>%${Math.round(n / tot * 100)}</b><small>${i + 1}</small></div>`).join('')}</div>
    <p class="muted small" style="margin:8px 0 0">${t('En çok oynadığın kuyu: soldan {0}. kuyu. Rakipler tahmin edilebilir oyuncuları sever, biraz karıştır!', fav + 1)}</p></div>`;
}
const _rprof2 = renderProfile;
renderProfile = function () { _rprof2(); const h = document.querySelector('#scr-profile .histsvg'); const box = h ? h.closest('.card') : document.querySelector('#scr-profile .stat-grid'); if (box) box.insertAdjacentHTML('afterend', heatHTML()); };
RENDER.profile = renderProfile;

/* ---------- Grafik kalitesi, 3B kart eğimi, skor animasyonu ---------- */
function applyGfx() { const g = S.gfx || 'high'; document.body.classList.toggle('gfx-high', g === 'high'); document.body.classList.toggle('gfx-low', g === 'low'); }
applyGfx();
let tiltEl = null;
document.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || !document.body.classList.contains('gfx-high')) return;
  const c = e.target.closest && e.target.closest('.mcard, .card.item');
  if (tiltEl && tiltEl !== c) { ['--rx', '--ry'].forEach(k => tiltEl.style.removeProperty(k)); tiltEl = null; }
  if (!c) return; tiltEl = c;
  const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  c.style.setProperty('--rx', ((.5 - y) * 9).toFixed(2) + 'deg'); c.style.setProperty('--ry', ((x - .5) * 11).toFixed(2) + 'deg');
  c.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
}, { passive: true });
const _gRender = gRender;
gRender = function () {
  const a = $('g-s0').textContent, b = $('g-s1').textContent; _gRender();
  if (!G) return;
  [['g-s0', a, 6], ['g-s1', b, 13]].forEach(([id, old, si]) => { const el = $(id); if (old !== '' && el.textContent !== old && +el.textContent > +old) {
    el.classList.remove('scbump'); void el.offsetWidth; el.classList.add('scbump');
    const st = document.querySelector(`#gboard [data-i="${si}"]`); if (st) st.classList.add('sglow'); } });
};
const GFX_INFO = { high: ['✨', 'Yüksek'], normal: ['🙂', 'Normal'], low: ['🔋', 'Düşük (pil tasarrufu)'] };
const MUSIC_INFO = { lofi: ['🎧', 'Lo-fi'], cay: ['🫖', 'Çay Ocağı'], chip: ['👾', '8-Bit'], gece: ['🌙', 'Gece'] };
function settingsExtra() {
  const chips = (info, cur, key) => `<div class="chips sm">${Object.entries(info).map(([k, [ic, n]]) => `<button class="chip ${cur === k ? 'on' : ''}" onclick="S.${key}='${k}';persist();applySettings();RENDER.settings()">${ic} ${t(n)}</button>`).join('')}</div>`;
  return `<div class="set-row wrap"><span>🎼 ${t('Müzik teması')}</span>${chips(MUSIC_INFO, S.musicTheme || 'lofi', 'musicTheme')}</div>
    <div class="set-row wrap"><span>🎨 ${t('Grafik kalitesi')}</span>${chips(GFX_INFO, S.gfx || 'high', 'gfx')}</div>`;
}

/* ---------- Kurucu / sınırsız hesap: yeni eşyaların hepsi hesapta ---------- */
function ownAll(manual) {
  let n = 0;
  for (const c of Object.keys(CAT)) { if (!S.own[c]) S.own[c] = []; for (const id of Object.keys(CAT[c])) if (!S.own[c].includes(id)) { S.own[c].push(id); n++; } }
  if (n) { persist(); checkCollection(); }
  if (manual) { toast(n ? '🎁 ' + t('{0} yeni eşya hesabına eklendi!', n) : '✓ ' + t('Zaten her şeye sahipsin.')); if (curScreen === 'admin') RENDER.admin(); }
  return n;
}
let ownAllFor = null;
const _updTop = updTop;
updTop = function (bump) { if (AUTH.user && unlimited() && ownAllFor !== AUTH.user.name) { ownAllFor = AUTH.user.name; ownAll(false); } return _updTop(bump); };

/* ---------- Yönetim paneli: Oyun Ayarları (kurucu) ---------- */
function admCfgInit() {
  if (ADM.cfg) return ADM.cfg;
  const c = cfg();
  ADM.cfg = clone({ wheel: Array.isArray(c.wheel) && c.wheel.length >= 4 ? c.wheel : WHEEL_DEF, wheelCost: c.wheelCost != null ? c.wheelCost : 150,
    sale: c.sale || { off: 0, end: 0 }, dpzMult: c.dpzMult || 1, ticker: c.ticker || '' });
  return ADM.cfg;
}
function admWh(i, k, v) {
  const p = ADM.cfg.wheel[i]; p[k] = v;
  if (k === 't' && v === 'item' && !p.c) { p.c = 'bgs'; p.id = Object.keys(CAT.bgs)[1]; }
  if (k === 't' && v !== 'item' && !p.n) p.n = 100;
  if (k === 'c') p.id = Object.keys(CAT[v] || {})[0];
  RENDER.admin();
}
async function admConfig(el) {
  const c = admCfgInit(), tot = c.wheel.reduce((a, p) => a + (+p.w || 1), 0), s = c.sale, live = s.off > 0 && s.end > Date.now();
  el.innerHTML = `<p class="muted small" style="margin-top:0">${t('Buradaki ayarlar Kaydet\'e basınca bütün oyunculara anında gider.')}</p>
    <div class="sec-title"><h3>🎡 ${t('Şans Çarkı')}</h3><button class="btn sec xs" ${c.wheel.length >= 12 ? 'disabled' : ''} onclick="ADM.cfg.wheel.push({t:'coins',n:100,w:10});RENDER.admin()">+ ${t('Dilim')}</button></div>
    <div class="card tscroll"><table class="atable"><tr><th>${t('Ödül')}</th><th>${t('Miktar / Eşya')}</th><th>${t('Şans ağırlığı')}</th><th>%</th><th></th></tr>
      ${c.wheel.map((p, i) => `<tr><td><select class="inp" onchange="admWh(${i},'t',this.value)">${opt({ coins: '🪙 Para', xp: '⭐ XP', item: '🎁 Eşya' }, p.t)}</select></td>
        <td>${p.t === 'item' ? `<div class="row" style="gap:6px;flex-wrap:nowrap"><select class="inp" onchange="admWh(${i},'c',this.value)">${catOpts(p.c)}</select><select class="inp" onchange="admWh(${i},'id',this.value)">${itemOpts(p.c, p.id)}</select></div>`
          : `<input class="inp" type="number" min="1" max="100000" value="${p.n || 0}" style="width:110px" onchange="ADM.cfg.wheel[${i}].n=+this.value">`}</td>
        <td><input class="inp" type="number" min="1" max="1000" value="${p.w || 1}" style="width:90px" onchange="admWh(${i},'w',+this.value)"></td><td><b>%${Math.round((+p.w || 1) / tot * 1000) / 10}</b></td>
        <td><button class="btn red xs" ${c.wheel.length <= 4 ? 'disabled' : ''} onclick="ADM.cfg.wheel.splice(${i},1);RENDER.admin()">✖</button></td></tr>`).join('')}</table>
      <div class="row" style="margin-top:10px"><label class="mini-f">${t('Ek çevirme ücreti (0 = kapalı)')}<input class="inp" type="number" min="0" max="100000" value="${c.wheelCost}" style="width:140px" onchange="ADM.cfg.wheelCost=+this.value"></label>
        <button class="btn sec xs" onclick="ADM.cfg.wheel=clone(WHEEL_DEF);RENDER.admin()">↺ ${t('Varsayılan dilimler')}</button></div></div>
    <div class="sec-title"><h3>🏷️ ${t('Mağaza İndirimi')}</h3><span class="badge">${live ? '🟢 ' + t('Yayında') : '⚪ ' + t('Kapalı')}</span></div>
    <div class="card row" style="align-items:flex-end"><label class="mini-f">${t('İndirim %')}<input class="inp" type="number" min="0" max="90" value="${s.off}" style="width:100px" onchange="ADM.cfg.sale.off=+this.value"></label>
      <label class="mini-f">${t('Bitiş')}<input class="inp" type="datetime-local" value="${toLocalInput(s.end || Date.now() + 2 * 864e5)}" onchange="ADM.cfg.sale.end=fromLocalInput(this.value)"></label>
      ${[[20, 1], [30, 2], [50, 1]].map(([o, d]) => `<button class="btn sec xs" onclick="ADM.cfg.sale={off:${o},end:Date.now()+${d}*864e5};RENDER.admin()">%${o} · ${d} ${t('gün')}</button>`).join('')}
      <button class="btn sec xs" onclick="ADM.cfg.sale={off:0,end:0};RENDER.admin()">✖ ${t('Kapat')}</button>
      <p class="muted small" style="width:100%;margin:4px 0 0">${t('Tüm eşyalarda geçerli; etkinlik fiyatları ve günün fırsatları daha ucuzsa onlar kalır.')}</p></div>
    <div class="sec-title"><h3>📅 ${t('Günün Bulmacası')}</h3></div>
    <div class="card row"><span>${t('Ödül çarpanı')}</span><div class="chips sm">${[1, 2, 3, 5].map(m => `<button class="chip ${c.dpzMult === m ? 'on' : ''}" onclick="ADM.cfg.dpzMult=${m};RENDER.admin()">x${m}</button>`).join('')}</div></div>
    <div class="sec-title"><h3>📣 ${t('Kayan Duyuru Şeridi')}</h3></div>
    <div class="card"><input class="inp" maxlength="200" value="${esc(c.ticker)}" placeholder="${t('Örn: Hafta sonu turnuvası Cumartesi 20:00\'de!')}" onchange="ADM.cfg.ticker=this.value"><p class="muted small" style="margin-bottom:0">${t('Ana menünün en üstünde kayar. Boş bırakırsan gizlenir.')}</p></div>
    <div class="row" style="margin-top:14px"><button class="btn" onclick="admCfgSave()">💾 ${t('Kaydet ve herkese yayınla')}</button><button class="btn sec" onclick="ADM.cfg=null;RENDER.admin()">↺ ${t('Değişiklikleri at')}</button><button class="btn sec" onclick="go('wheel')">🎡 ${t('Çarkı aç')}</button></div>
    ${unlimited() ? `<div class="sec-title"><h3>👑 ${t('Hesabım')}</h3></div><div class="card row"><span style="flex:1;min-width:200px">${t('Mağazadaki bütün eşyaları (yeni arka planlar, zafer efektleri dahil) hesabına ekler. Sınırsız hesaplarda girişte kendiliğinden yapılır.')}</span><button class="btn" onclick="ownAll(true)">🎁 ${t('Hepsini hesabıma ekle')}</button></div>` : ''}`;
}
async function admCfgSave() {
  const j = await admPost('config', { config: ADM.cfg });
  if (j) { setContent({ ...j.content, inviteUrl: CONTENT.inviteUrl }); ADM.cfg = null; if (curScreen === 'admin') RENDER.admin(); }
}

/* ---------- başarım + rehber sayfası ---------- */
ACHS.push({ id: 'carkci', icon: '🎡', name: 'Çarkçıbaşı', en: 'Wheel Master', desc: 'Şans Çarkı\'nı 10 kez çevir.', den: 'Spin the Lucky Wheel 10 times.', reward: 150 });
GUIDE.splice(GUIDE.length - 1, 0, { ic: '🎡', t: 'Şans Çarkı & Yeni Görünüm', te: 'Lucky Wheel & New Look',
  x: '🎡 <b>Şans Çarkı</b>: her gün ana menüden 1 ücretsiz çevirme. Para, XP, hatta eşya çıkabilir!<br>🔥 Profilinde <b>kuyu ısı haritası</b>: en çok hangi kuyuyu oynadığını gör.<br>🎼 Ayarlar\'dan <b>müzik teması</b> seç: Lo-fi, Çay Ocağı, 8-Bit, Gece.<br>🎨 <b>Grafik kalitesi</b>: Yüksek (3B kartlar, parlayan taşlar) ya da pil dostu Düşük.',
  xe: '🎡 <b>Lucky Wheel</b>: 1 free spin every day from the main menu. Coins, XP, even items!<br>🔥 A <b>pit heatmap</b> on your profile: see which pit you play most.<br>🎼 Pick a <b>music theme</b> in Settings: Lo-fi, Tea House, 8-Bit, Night.<br>🎨 <b>Graphics quality</b>: High (3D cards, shiny stones) or battery-friendly Low.' });
