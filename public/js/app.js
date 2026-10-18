/* =========================================================
   Dijital Mangala — çekirdek: kayıt/hesap, çizim, menüler
   (oyun akışı, çevrimiçi, turnuva, tekrar: play.js)
   ========================================================= */
const $ = id => document.getElementById(id);
const STORE = Engine.STORE, INIT = Engine.INIT, isPit = Engine.isPit;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const wait = ms => new Promise(r => setTimeout(r, ms));
const pad2 = n => String(n).padStart(2, '0');
const dayKey = (d = new Date()) => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
function hashStr(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffled(arr, seed) { const r = rng(hashStr(seed)), a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const lsGet = (k, d = null) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
const lsDel = k => { try { localStorage.removeItem(k); } catch { } };

/* =========================================================
   KAYIT / HESAP
   ========================================================= */
const DEF = { coins: 0, tutorialDone: false, tutStep: 0,
  own: { boards: ['klasik'], stones: ['renkli'], hands: ['klasik'], avatars: ['gulen'], frames: ['yok'], emojis: ['temel'], msgs: ['temel'] },
  eq: { board: 'klasik', stone: 'renkli', hand: 'klasik', avatar: 'gulen', frame: 'yok' },
  bots: ['kolay'], speed: 'normal', handAnim: true, music: true, musicVol: 0.4, sfxVol: 0.8, haptics: true, layout: 'auto',
  name: '', xp: 0, stats: {}, totals: { games: 0, wins: 0, draws: 0, online: 0, onlineWins: 0, even: 0, empty: 0, extra: 0, best: 0, tourWins: 0 },
  pass: { season: '', xp: 0, premium: false, free: [], prem: [] }, daily: { day: '', prog: {}, claimed: [] }, login: { last: '', streak: 0 },
  event: { key: '', prog: 0, claimed: false }, achs: {}, title: 'caylak', puzzles: {}, replays: [], streak: 0, botsBeaten: [], btour: null, botMode: 'classic', tourWins: 0 };
function normalize(raw) {
  raw = raw && typeof raw === 'object' && !raw.reset ? raw : {};
  const s = Object.assign(JSON.parse(JSON.stringify(DEF)), raw);
  for (const k of ['own', 'eq', 'totals', 'pass', 'daily', 'login', 'event']) s[k] = Object.assign(JSON.parse(JSON.stringify(DEF[k])), raw[k] || {});
  for (const c in DEF.own) if (!Array.isArray(s.own[c])) s.own[c] = DEF.own[c].slice();
  for (const c in s.eq) { const cat = { board: 'boards', stone: 'stones', hand: 'hands', avatar: 'avatars', frame: 'frames' }[c]; if (!CAT[cat][s.eq[c]]) s.eq[c] = DEF.eq[c]; }
  if (!Array.isArray(s.replays)) s.replays = [];
  if (!s.name) s.name = (LANG === 'en' ? 'Player' : 'Oyuncu') + Math.floor(1000 + Math.random() * 9000);
  return s;
}
let S = normalize({});
const AUTH = { token: null, user: null, rev: 0, guest: false, offline: false };
const unlimited = () => !!(AUTH.user && AUTH.user.unlimited);
const can = p => !!(AUTH.user && Array.isArray(AUTH.user.perms) && AUTH.user.perms.includes(p));
const isAdmin = unlimited;   // eski adı: sadece "sınırsız para" anlamına gelir
function fixCoins() { if (!unlimited() && S.coins >= 999999999) S.coins = 0; }
const rankBadge = r => r ? `<span class="rk-b" style="color:${r.color};border-color:${r.color}">${r.icon || ''} ${esc(nm(r))}</span>` : '';
/* ---------- kurucunun yönettiği içerik (ranklar, etkinlikler, arayüz) ---------- */
let CONTENT = lsGet('mangala_content', null) || { ranks: [], events: [], ui: null };
function setContent(c) {
  if (!c) return; CONTENT = c; lsSet('mangala_content', c); applyAccent();
  if (typeof S !== 'undefined' && S.event) ensurePeriods();
  if (['menu', 'events', 'shop'].includes(curScreen)) go(curScreen);
}
async function loadContent() { try { const { s: st, j } = await api('GET', '/api/content', null, 70000); if (st === 200) setContent(j); } catch { } }
function applyAccent() { document.body.dataset.acc = (CONTENT.ui && CONTENT.ui.accent) || 'gold'; }
applyAccent();
const myName = () => AUTH.user ? AUTH.user.name : S.name;
const cacheKey = () => AUTH.guest ? 'mangala_guest_v3' : 'mangala_cache_' + (AUTH.user ? AUTH.user.name.toLowerCase() : 'x');
let syncTimer = null, syncing = false, syncAgain = false;
function persist() {
  lsSet(cacheKey(), { save: S, rev: AUTH.rev });
  if (!AUTH.guest && AUTH.token) { clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, 1200); }
}
async function syncNow() {
  if (AUTH.guest || !AUTH.token) return true;
  if (syncing) { syncAgain = true; return; }
  syncing = true; clearTimeout(syncTimer);
  try {
    const { s, j } = await api('POST', '/api/save', { save: S, rev: AUTH.rev });
    AUTH.offline = false;
    if (s === 200) AUTH.rev = j.rev;
    else if (s === 409) adoptServer(j.save, j.rev, t('Hesabın başka bir yerden güncellendi, en yeni kayıt yüklendi.'));
    else if (s === 401) logout(t('Oturum süren doldu, tekrar giriş yap.'));
    else if (s === 403) bannedScreen(j.banned);
    lsSet(cacheKey(), { save: S, rev: AUTH.rev });
  } catch (e) { AUTH.offline = true; syncTimer = setTimeout(syncNow, 10000); }
  syncing = false;
  if (syncAgain) { syncAgain = false; syncNow(); }
  return true;
}
function adoptServer(save, rev, msg) {
  S = normalize(save || {}); AUTH.rev = rev;
  fixCoins();
  lsSet(cacheKey(), { save: S, rev: AUTH.rev });
  applySettings(); updTop(true);
  if (msg) toast(msg);
  if (!S.tutorialDone) { if (!(G && !G.over)) go('tutorial'); return; }
  if (!(G && !G.over) && curScreen !== 'tutorial') go(curScreen === 'auth' ? 'menu' : curScreen);
}
window.addEventListener('visibilitychange', () => { if (document.hidden && AUTH.token && !AUTH.guest) syncNow(); });

/* ---------- sunucu adresi + API ---------- */
function serverHttp() {
  let u = lsGet('mangala_server', '');
  if (u) { u = u.trim().replace(/\/+$/, ''); if (/^wss?:\/\//.test(u)) u = u.replace(/^ws/, 'http'); if (!/^https?:\/\//.test(u)) u = 'https://' + u; return u; }
  if (location.protocol === 'http:' || location.protocol === 'https:') return location.origin;
  return null;
}
async function api(method, path, body, timeout = 12000) {
  const base = serverHttp(); if (!base) throw new Error('noserver');
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(base + path, { method, signal: ctl.signal, keepalive: method === 'POST' && path === '/api/save',
      headers: { 'content-type': 'application/json', ...(AUTH.token ? { authorization: 'Bearer ' + AUTH.token } : {}) }, body: body ? JSON.stringify(body) : undefined });
    let j = {}; try { j = await r.json(); } catch { }
    if (j && j.error) j.error = t(j.error);
    return { s: r.status, j };
  } finally { clearTimeout(to); }
}

/* =========================================================
   GİRİŞ / KAYIT EKRANI
   ========================================================= */
let authTab = 'login', serverOk = null;
async function checkServer() {
  serverOk = null; renderAuth();
  try { const { s } = await api('GET', '/api/config', null, 70000); serverOk = s === 200; } catch { serverOk = false; }
  if (curScreen === 'auth') renderAuth();
}
function renderAuth() {
  document.body.classList.add('authscr');
  const st = serverOk === null ? `<span class="net-status wait"><span class="led"></span>${t('Sunucuya bağlanılıyor... (ücretsiz sunucu uyanıyorsa ~1 dk sürebilir)')}</span>`
    : serverOk ? `<span class="net-status ok"><span class="led"></span>${t('Sunucu hazır')}</span>`
    : `<span class="net-status bad"><span class="led"></span>${t('Sunucuya ulaşılamadı')}</span> <button class="linkbtn" onclick="checkServer()">${t('Tekrar dene')}</button>`;
  const f = authTab === 'login'
    ? `<label class="fl">${t('Kullanıcı adı')}</label><input class="inp" id="au-user" autocomplete="username" maxlength="16">
       <label class="fl">${t('Şifre')}</label><input class="inp" id="au-pass" type="password" autocomplete="current-password" maxlength="100">
       <div class="err" id="au-err"></div><button class="btn wide" id="au-go" onclick="doLogin()">${t('Giriş Yap')}</button>
       <div class="row center" style="margin-top:12px"><button class="linkbtn" onclick="forgotFlow()">${t('Şifremi unuttum')}</button></div>`
    : `<label class="fl">${t('Kullanıcı adı')} <span class="muted">(${t('3-16 karakter: harf, rakam, _')})</span></label><input class="inp" id="au-user" autocomplete="username" maxlength="16">
       <label class="fl">${t('Şifre')} <span class="muted">(${t('en az 6 karakter')})</span></label><input class="inp" id="au-pass" type="password" autocomplete="new-password" maxlength="100">
       <label class="fl">${t('Şifre (tekrar)')}</label><input class="inp" id="au-pass2" type="password" autocomplete="new-password" maxlength="100">
       <label class="fl">${t('E-posta')} <span class="muted">(${t('isteğe bağlı — şifreni unutursan kod gönderilir')})</span></label><input class="inp" id="au-mail" type="email" autocomplete="email" maxlength="120">
       <div class="err" id="au-err"></div><button class="btn wide" id="au-go" onclick="doRegister()">${t('Hesap Oluştur')}</button>
       ${lsGet('mangala_guest_v3') ? `<p class="muted small" style="text-align:center">${t('Misafir ilerlemen yeni hesabına aktarılacak.')}</p>` : ''}`;
  $('scr-auth').innerHTML = `<div class="auth">
    <div class="logo-big"><div style="font-size:54px">🪨</div><h1>MANGALA</h1><p class="muted" style="margin:4px 0 0">${t('Binlerce yıllık Türk zekâ ve strateji oyunu')}</p></div>
    <div class="card">
      <div class="tabs2"><button class="${authTab === 'login' ? 'on' : ''}" onclick="authTab='login';renderAuth()">${t('Giriş')}</button><button class="${authTab === 'reg' ? 'on' : ''}" onclick="authTab='reg';renderAuth()">${t('Kayıt Ol')}</button></div>
      ${f}
      <div style="margin-top:14px;text-align:center;font-size:13px">${st}</div>
    </div>
    <div class="row center" style="margin-top:14px"><button class="btn sec sm" onclick="playGuest()">👤 ${t('Misafir olarak oyna')}</button></div>
    <p class="muted small" style="text-align:center">${t('Misafir modunda ilerlemen sadece bu cihazda kalır; dereceli ve turnuva kapalıdır.')}</p>
    <div class="langsel">${langButtons()}</div>
  </div>`;
  const inp = $('au-pass2') || $('au-pass'); if (inp) inp.onkeydown = e => { if (e.key === 'Enter') $('au-go').click(); };
}
const langButtons = () => [['tr', '🇹🇷 Türkçe'], ['en', '🇬🇧 English']].map(([k, v]) => `<button class="${LANG === k ? 'on' : ''}" onclick="setLang('${k}')">${v}</button>`).join('');
function setLang(l) { LANG = l; lsSet('mangala_lang', l); document.documentElement.lang = l; if (curScreen === 'auth') renderAuth(); else go(curScreen); updTop(); }
async function doLogin() {
  const u = $('au-user').value.trim(), p = $('au-pass').value, err = $('au-err');
  if (!u || !p) { err.textContent = t('Kullanıcı adı ve şifre gerekli.'); return; }
  $('au-go').disabled = true; err.textContent = '';
  try {
    const { s, j } = await api('POST', '/api/login', { username: u, password: p }, 70000);
    if (s === 200) return loggedIn(j);
    if (s === 403 && j.banned) return bannedScreen(j.banned);
    err.textContent = j.error || t('Giriş başarısız.');
  } catch { err.textContent = t('Sunucuya ulaşılamadı. Biraz bekleyip tekrar dene.'); }
  $('au-go').disabled = false;
}
async function doRegister() {
  const u = $('au-user').value.trim(), p = $('au-pass').value, p2 = $('au-pass2').value, m = $('au-mail').value.trim(), err = $('au-err');
  if (!/^[a-zA-Z0-9_]{3,16}$/.test(u)) { err.textContent = t('Kullanıcı adı 3-16 karakter olmalı (harf, rakam, _).'); return; }
  if (p.length < 6) { err.textContent = t('Şifre en az 6 karakter olmalı.'); return; }
  if (p !== p2) { err.textContent = t('Şifreler aynı değil.'); return; }
  $('au-go').disabled = true; err.textContent = '';
  const guest = lsGet('mangala_guest_v3'); const legacy = lsGet('mangala_save_v2');
  const save = guest ? guest.save : legacy || null;
  try {
    const { s, j } = await api('POST', '/api/register', { username: u, password: p, email: m, save, lang: LANG }, 70000);
    if (s === 200) {
      if (guest) lsDel('mangala_guest_v3');
      await loggedIn(j);
      if (m) verifyEmailFlow(j.mailStatus);
      return;
    }
    err.textContent = j.error || t('Kayıt başarısız.');
  } catch { err.textContent = t('Sunucuya ulaşılamadı. Biraz bekleyip tekrar dene.'); }
  $('au-go').disabled = false;
}
async function loggedIn(j) {
  AUTH.token = j.token; AUTH.user = j.user; AUTH.rev = j.rev || 0; AUTH.guest = false;
  lsSet('mangala_auth', { token: j.token, name: j.user.name }); lsDel('mangala_guestmode');
  S = normalize(j.save || {});
  if (!j.save) persist();
  enterGame();
}
function playGuest() {
  AUTH.guest = true; AUTH.token = null; AUTH.user = null; lsSet('mangala_guestmode', true);
  const g = lsGet('mangala_guest_v3'); const legacy = lsGet('mangala_save_v2');
  S = normalize(g ? g.save : legacy || {});
  persist(); enterGame();
}
function enterGame() {
  document.body.classList.remove('authscr');
  fixCoins(); applySettings(); ensurePeriods(); persist(); updTop(); loadContent();
  go(S.tutorialDone ? 'menu' : 'tutorial');
  netConnect();
}
async function logout(msg) {
  if (AUTH.token) { try { await syncNow(); await api('POST', '/api/logout'); } catch { } }
  netClose(); G = null;
  AUTH.token = null; AUTH.user = null; AUTH.guest = false; AUTH.rev = 0;
  lsDel('mangala_auth'); lsDel('mangala_guestmode');
  closeModal(); go('auth'); if (msg) toast(msg);
}
function bannedScreen(b) {
  netClose(); lsDel('mangala_auth'); AUTH.token = null; AUTH.user = null;
  const until = b && b.until ? new Date(b.until).toLocaleString(LANG === 'en' ? 'en-GB' : 'tr-TR') : t('süresiz');
  go('auth');
  modal(`<div class="big">⛔</div><h3>${t('Hesabın yasaklandı')}</h3><p>${t('Bitiş')}: <b>${until}</b></p>${b && b.reason ? `<p class="muted">${t('Sebep')}: ${esc(b.reason)}</p>` : ''}`, [{ label: t('Tamam'), value: 1 }]);
}
async function forgotFlow() {
  const v = await promptModal(`<div class="big">🔑</div><h3>${t('Şifremi unuttum')}</h3><p class="muted">${t('Kullanıcı adını veya e-posta adresini yaz. Hesabındaki e-postaya 6 haneli bir kod göndereceğiz.')}</p>`,
    [{ id: 'fg-login', ph: t('Kullanıcı adı veya e-posta') }], t('Kod Gönder'));
  if (!v) return;
  let r; try { r = await api('POST', '/api/forgot', { login: v['fg-login'], lang: LANG }, 70000); } catch { return toast(t('Sunucuya ulaşılamadı.')); }
  if (r.s !== 200) return modal(`<div class="big">⚠️</div><p>${esc(r.j.error || '')}</p>`, [{ label: t('Tamam'), value: 1 }]);
  const info = r.j.mailStatus === 'mail' ? t('Kod {0} adresine gönderildi. Gelen kutunu (ve spam klasörünü) kontrol et.', esc(r.j.email))
    : t('E-posta servisi henüz kurulmamış. Kodu oyunun yöneticisinden (admin panelinden) isteyebilirsin.');
  for (let tries = 0; tries < 5; tries++) {
    const v2 = await promptModal(`<div class="big">📧</div><h3>${t('Kodu gir')}</h3><p class="muted">${info}</p>`,
      [{ id: 'fg-code', ph: t('6 haneli kod'), max: 6 }, { id: 'fg-pass', ph: t('Yeni şifre (en az 6)'), type: 'password' }], t('Şifreyi Değiştir'));
    if (!v2) return;
    const r2 = await api('POST', '/api/reset', { username: r.j.username, code: v2['fg-code'], password: v2['fg-pass'] });
    if (r2.s === 200) { toast('✅ ' + t('Şifren değişti, giriş yapıldı!')); return loggedIn(r2.j); }
    if (r2.s === 403) return bannedScreen(r2.j.banned);
    toast('❌ ' + (r2.j.error || ''));
    if (/süres|expired|yeni kod|new code/i.test(r2.j.error || '')) return;
  }
}
async function verifyEmailFlow(mailStatus) {
  const info = mailStatus === 'mail' ? t('E-postana 6 haneli bir doğrulama kodu gönderdik.') : t('E-posta servisi henüz kurulmamış. Kodu admin panelinden alabilirsin.');
  const v = await promptModal(`<div class="big">📧</div><h3>${t('E-postanı doğrula')}</h3><p class="muted">${info}</p>`, [{ id: 'vf-code', ph: t('6 haneli kod'), max: 6 }], t('Doğrula'), t('Sonra'));
  if (!v) return;
  const { s, j } = await api('POST', '/api/email/verify', { code: v['vf-code'] });
  if (s === 200) { AUTH.user = j.user; toast('✅ ' + t('E-posta doğrulandı!')); if (curScreen === 'profile') renderProfile(); }
  else toast('❌ ' + (j.error || ''));
}
async function changeEmail() {
  const v = await promptModal(`<div class="big">📧</div><h3>${t('E-posta adresi')}</h3><p class="muted">${t('Şifreni unutursan sıfırlama kodu bu adrese gelir.')}</p>`,
    [{ id: 'em', ph: 'ornek@mail.com', type: 'email', val: AUTH.user.email }], t('Kaydet'));
  if (!v) return;
  const { s, j } = await api('POST', '/api/email', { email: v.em, lang: LANG });
  if (s !== 200) return toast('❌ ' + (j.error || ''));
  AUTH.user.email = v.em.toLowerCase(); AUTH.user.emailVerified = false;
  verifyEmailFlow(j.mailStatus);
}
async function changeUsername() {
  const u = AUTH.user; if (!u) return;
  if (!u.email) { const ok = await modal(`<div class="big">📧</div><h3>${t('Önce e-posta ekle')}</h3><p class="muted">${t('Kullanıcı adını değiştirmek için hesabında e-posta olmalı. Değişiklik kodu bu adrese gönderilir.')}</p>`, [{ label: t('Vazgeç'), cls: 'sec', value: 0 }, { label: t('E-posta Ekle'), value: 1 }]); if (ok) changeEmail(); return; }
  if (!u.emailVerified) { const ok = await modal(`<div class="big">📧</div><h3>${t('Önce e-postanı doğrula')}</h3><p class="muted">${esc(u.email)}</p>`, [{ label: t('Vazgeç'), cls: 'sec', value: 0 }, { label: t('Kod Gönder'), value: 1 }]);
    if (ok) { const r = await api('POST', '/api/email', { email: u.email, lang: LANG }); if (r.s === 200) verifyEmailFlow(r.j.mailStatus); else toast('❌ ' + (r.j.error || '')); } return; }
  const v = await promptModal(`<div class="big">✏️</div><h3>${t('Kullanıcı adını değiştir')}</h3><p class="muted">${t('3-16 karakter: harf, rakam, _')}. ${t('Onay kodu e-postana gönderilir. 7 günde bir değiştirebilirsin.')}</p>`, [{ id: 'nn', ph: t('Yeni kullanıcı adı'), max: 16, val: u.name }], t('Kod Gönder'));
  if (!v) return;
  const r = await api('POST', '/api/username/request', { newName: v.nn, lang: LANG });
  if (r.s !== 200) { toast('❌ ' + (r.j.error || ''), 4000); return; }
  const info = r.j.mailStatus === 'mail' ? t('Kod {0} adresine gönderildi. Gelen kutunu (ve spam klasörünü) kontrol et.', esc(r.j.email)) : t('E-posta servisi henüz kurulmamış. Kodu admin panelinden alabilirsin.');
  const c = await promptModal(`<div class="big">📧</div><h3>${t('Kodu gir')}</h3><p class="muted">${info}</p>`, [{ id: 'cd', ph: t('6 haneli kod'), max: 6 }], t('Onayla'));
  if (!c) return;
  const r2 = await api('POST', '/api/username/confirm', { code: c.cd });
  if (r2.s !== 200) { toast('❌ ' + (r2.j.error || ''), 4000); return; }
  const oldKey = cacheKey(); AUTH.user = r2.j.user; lsDel(oldKey);
  lsSet('mangala_auth', { token: AUTH.token, name: AUTH.user.name }); persist(); updTop(true);
  netClose(); netConnect(); toast('✅ ' + t('Kullanıcı adın değişti: {0}', esc(AUTH.user.name))); renderProfile();
}
async function viewProfile(name) {
  let r; try { r = await api('GET', '/api/profile?name=' + encodeURIComponent(name)); } catch { return toast(t('Sunucuya ulaşılamadı.')); }
  if (r.s !== 200) return toast('❌ ' + (r.j.error || ''));
  const p = r.j, T = p.totals, li = levelInfo(p.xp);
  modal(`${avatarHTML(CAT.avatars[p.avatar] ? p.avatar : 'gulen', CAT.frames[p.frame] ? p.frame : 'yok', 92)}<h3 style="margin:10px 0 2px">${p.online ? '<span class="on-dot"></span>' : ''}${esc(p.name)} ${rankBadge(p.rank)}</h3>
    <div class="ttl" style="font-size:14px">${esc(titleTxt(p.title))}</div>${p.bio ? `<p class="muted">“${esc(p.bio)}”</p>` : ''}
    <div class="row center" style="margin:8px 0">${leagueBadge(p.elo)} <b>${p.elo}</b> Elo · <span class="badge">${t('Seviye')} ${li.L}</span></div>
    <div class="stat-grid" style="text-align:left"><div class="stat"><b>${T.games}</b>${t('Toplam oyun')}</div><div class="stat"><b>${T.wins}</b>${t('Galibiyet')}</div>
      <div class="stat"><b>${T.onlineWins}</b>${t('Çevrimiçi galibiyet')}</div><div class="stat"><b>${p.ranked ? p.ranked.w + 'G ' + p.ranked.l + 'M' : '-'}</b>${t('Dereceli')}</div>
      <div class="stat"><b>${p.achs}/${ACHS.length}</b>${t('Başarımlar')}</div><div class="stat"><b>${p.tourWins}</b>${t('Turnuva zaferi')}</div></div>`, [{ label: t('Kapat'), value: 1 }]);
}
async function changePassword() {
  const v = await promptModal(`<div class="big">🔒</div><h3>${t('Şifre değiştir')}</h3>`,
    [{ id: 'op', ph: t('Mevcut şifre'), type: 'password' }, { id: 'np', ph: t('Yeni şifre (en az 6)'), type: 'password' }, { id: 'np2', ph: t('Yeni şifre (tekrar)'), type: 'password' }], t('Değiştir'));
  if (!v) return;
  if (v.np !== v.np2) return toast('❌ ' + t('Şifreler aynı değil.'));
  const { s, j } = await api('POST', '/api/password', { old: v.op, password: v.np });
  if (s === 200) { AUTH.token = j.token; lsSet('mangala_auth', { token: j.token, name: AUTH.user.name }); toast('✅ ' + t('Şifren değiştirildi. Diğer cihazlardaki oturumlar kapatıldı.')); netClose(); netConnect(); }
  else toast('❌ ' + (j.error || ''));
}

/* =========================================================
   DÖNEMLER / ÖDÜLLER / XP
   ========================================================= */
const nm = o => o ? (LANG === 'en' && o.en ? o.en : o.name) : '';
const dsc = o => o ? (LANG === 'en' && o.den ? o.den : o.desc || '') : '';
const fmtLeft = ms => { ms = Math.max(0, ms); const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
  if (d > 0) return t('{0}g {1}sa', d, h); if (h > 0) return t('{0}sa {1}dk', h, m); return t('{0}dk {1}sn', m, s % 60); };
const seasonId = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1); };
const seasonName = () => SEASON_NAMES[LANG === 'en' ? 'en' : 'tr'][new Date().getMonth()];
const seasonEnd = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 1); };
function weekInfo() { const n = new Date(), tt = new Date(n.getFullYear(), n.getMonth(), n.getDate()); const day = (tt.getDay() + 6) % 7;
  const mon = new Date(tt); mon.setDate(tt.getDate() - day); const end = new Date(mon); end.setDate(mon.getDate() + 7);
  const idx = Math.round((mon - new Date(2024, 0, 1)) / (7 * 864e5)); return { key: 'W' + idx, idx, end }; }
const tomorrow = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); };
function serverEvents() { const n = Date.now(); return (CONTENT.events || []).filter(e => e.start <= n && e.end > n).sort((a, b) => a.end - b.end); }
function curEvent() {
  const se = serverEvents()[0];
  if (se) { const it = se.reward && se.reward.item; return { ...se, key: 'S' + se.id + ':' + se.start, endD: new Date(se.end), server: true,
    reward: { coins: se.reward.coins || 0, xp: se.reward.xp || 0, item: it && CAT[it[0]] && CAT[it[0]][it[1]] ? it : null } }; }
  const w = weekInfo(), ev = EVENTS[w.idx % EVENTS.length];
  return { ...ev, key: w.key, endD: w.end, coinMult: ev.id === 'hazine' ? 2 : 1, xpMult: 1 };
}
function upcomingEvents() { const n = Date.now(); return (CONTENT.events || []).filter(e => e.start > n).sort((a, b) => a.start - b.start); }
const rewardTxt = r => [r.item && CAT[r.item[0]] && CAT[r.item[0]][r.item[1]] ? '🎁 ' + nm(item(...r.item)) : '', r.coins ? '+' + r.coins + ' 🪙' : '', r.xp ? '+' + r.xp + ' XP' : ''].filter(Boolean).join(' · ');
function ensurePeriods() {
  if (S.pass.season !== seasonId()) S.pass = { season: seasonId(), xp: 0, premium: false, free: [], prem: [] };
  if (S.daily.day !== dayKey()) S.daily = { day: dayKey(), prog: {}, claimed: [] };
  const ek = curEvent().key; if (S.event.key !== ek) S.event = { key: ek, prog: 0, claimed: false };
}
const dailyQuests = () => shuffled(QUESTS, 'q' + dayKey()).slice(0, 3);
const owns = (c, id) => S.own[c].includes(id);
const item = (c, id) => CAT[c][id];
function spend(n) { if (isAdmin()) return true; if (S.coins < n) return false; S.coins -= n; return true; }
const coinTxt = () => isAdmin() ? '∞' : S.coins;
function updTop(bump) {
  $('coinval').textContent = coinTxt();
  if (bump) { const c = $('coins'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
  const li = levelInfo(S.xp);
  $('tb-lvl').textContent = t('Sv') + ' ' + li.L; $('tb-xp').style.width = (li.cur / li.need * 100) + '%';
  $('tb-name').innerHTML = esc(myName()) + (AUTH.user && AUTH.user.rank ? ` <span class="rk-i" title="${esc(nm(AUTH.user.rank))}">${AUTH.user.rank.icon || '★'}</span>` : ''); $('tb-av').innerHTML = avatarHTML(S.eq.avatar, S.eq.frame, 38);
  const can = S.tutorialDone && S.login.last !== dayKey();
  const db = $('dailybtn'); db.classList.toggle('glow', can); db.innerHTML = '🎁' + (can || hasClaimables() ? '<span class="dot"></span>' : '');
  $('musicbtn').textContent = S.music ? '🎵' : '🔇';
}
function addCoins(n) { S.coins += n; persist(); updTop(true); if (n > 0) Sound.sfx.coin(); }
function levelInfo(xp) { let L = 1, need = 250; while (xp >= need) { xp -= need; L++; need = 250 + 50 * (L - 1); } return { L, cur: xp, need }; }
const passTier = () => Math.min(PASS_TIERS, Math.floor(S.pass.xp / PASS_XP));
function addXP(n) {
  ensurePeriods();
  const L0 = levelInfo(S.xp).L, T0 = passTier();
  S.xp += n; S.pass.xp += n;
  const L1 = levelInfo(S.xp).L, T1 = passTier(); let lvCoins = 0;
  for (let l = L0 + 1; l <= L1; l++) lvCoins += 50 + l * 10;
  if (lvCoins) S.coins += lvCoins;
  if (T1 >= 30) unlockAch('sezon30');
  persist(); updTop(!!lvCoins);
  return { levelUp: L1 > L0 ? L1 : 0, lvCoins, tierUp: T1 > T0 ? T1 : 0 };
}
function grant(r, silent) {
  const txt = [];
  if (r.coins) { S.coins += r.coins; txt.push('+' + r.coins + ' 🪙'); }
  if (r.xp) { addXP(r.xp); txt.push('+' + r.xp + ' XP'); }
  if (r.item) { const [c, id] = r.item;
    if (owns(c, id)) { S.coins += 200; txt.push(t('{0} zaten vardı → +200 🪙', nm(item(c, id)))); }
    else { S.own[c].push(id); txt.push('🎁 ' + nm(item(c, id))); checkCollection(); } }
  persist(); updTop(true);
  if (!silent) { toast(txt.join(' · ')); Sound.sfx.coin(); }
  return txt;
}
function track(metric, n = 1) {
  ensurePeriods();
  for (const q of dailyQuests()) if (q.metric === metric) S.daily.prog[q.id] = (S.daily.prog[q.id] || 0) + n;
  const ev = curEvent(); if (ev.metric === metric || ev.extra === metric) S.event.prog += n;
  persist();
}
function hasClaimables() {
  ensurePeriods(); const tt = passTier();
  for (let i = 1; i <= tt; i++) { if (!S.pass.free.includes(i)) return true; if (S.pass.premium && !S.pass.prem.includes(i)) return true; }
  for (const q of dailyQuests()) if ((S.daily.prog[q.id] || 0) >= q.goal && !S.daily.claimed.includes(q.id)) return true;
  return S.event.prog >= curEvent().goal && !S.event.claimed;
}
/* ---------- başarımlar ---------- */
let achQueue = [], achShowing = false;
function unlockAch(id) {
  if (S.achs[id]) return;
  const a = ACHS.find(x => x.id === id); if (!a) return;
  S.achs[id] = Date.now(); S.coins += a.reward; persist(); updTop(true);
  achQueue.push(a); if (!achShowing) showAchQueue();
}
async function showAchQueue() {
  achShowing = true;
  while (achQueue.length) {
    const a = achQueue.shift(), el = $('achpop');
    el.innerHTML = `<span class="ai">${a.icon}</span><div><div class="small muted">🏅 ${t('Başarım açıldı!')}</div><b>${nm(a)}</b><div class="small">+${a.reward} 🪙${a.title ? ' · ' + t('Unvan') + ': <span class="ttl">' + nm(TITLES[a.title]) + '</span>' : ''}</div></div>`;
    el.classList.add('on'); Sound.sfx.extra(); vib([20, 40, 20]);
    await wait(3200); el.classList.remove('on'); await wait(500);
  }
  achShowing = false;
}
function checkCollection() { const n = Object.values(S.own).reduce((a, b) => a + b.length, 0); if (n >= 25) unlockAch('koleksiyon'); }
function checkLeague(elo) { if (elo >= 1300) unlockAch('altin_lig'); if (elo >= 1700) unlockAch('usta_lig'); }
const leagueOf = elo => LEAGUES.filter(l => elo >= l.min).pop();
const leagueBadge = elo => { const l = leagueOf(elo || 1000); return `<span class="lg" style="color:${l.color}">${l.icon} ${nm(l)}</span>`; };
const titleTxt = id => TITLES[id] ? nm(TITLES[id]) : '';
const myTitles = () => ['caylak', ...ACHS.filter(a => a.title && S.achs[a.id]).map(a => a.title)];

/* =========================================================
   ÇİZİM: avatar, el, tahta, efektler
   ========================================================= */
function avatarHTML(av, frame, size = 44) {
  const a = typeof av === 'object' ? av : (CAT.avatars[av] || CAT.avatars.gulen);
  const [c1, c2] = (a.bg || '#888,#444').split(',');
  const fr = CAT.frames[frame] ? frame : 'yok';
  return `<span class="av fr-${fr}" style="--s:${size}px"><span class="av-in" style="background:radial-gradient(circle at 35% 30%,${c1},${c2})">${a.e}</span></span>`;
}
function handSVG(id, pal) {
  const h = CAT.hands[id] || CAT.hands.klasik, s = h.skin, d = h.shade, n = h.nail, c = h.cuff;
  const st = (x, y, k) => `<circle cx="${x}" cy="${y}" r="7.5" fill="${pal[k % pal.length]}" stroke="rgba(0,0,0,.35)"/><circle cx="${x - 2.4}" cy="${y - 2.6}" r="2.2" fill="rgba(255,255,255,.85)"/>`;
  const f = (x, y, w, hh, rot, ox, oy) => `<g transform="rotate(${rot} ${ox} ${oy})"><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="${w / 2}" fill="${s}" stroke="${d}" stroke-width="1.3"/>` +
    (n ? `<rect x="${x + 2.2}" y="${y + 2}" width="${w - 4.4}" height="${Math.min(11, w)}" rx="${(w - 4.4) / 2}" fill="${n}" stroke="${d}" stroke-width=".6"/>` : '') +
    `<path d="M${x + 2.5} ${y + hh * 0.38} q${w / 2 - 2.5} 3 ${w - 5} 0 M${x + 2.5} ${y + hh * 0.62} q${w / 2 - 2.5} 3 ${w - 5} 0" stroke="${d}" stroke-width="1.1" fill="none" opacity=".55"/></g>`;
  return `<svg viewBox="0 0 100 170" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <g class="hs">${st(38, 16, 0)}${st(54, 11, 1)}${st(47, 25, 2)}${st(62, 22, 3)}${st(30, 27, 4)}</g>
    <rect x="23" y="128" width="54" height="50" rx="9" fill="${c}"/><rect x="23" y="128" width="54" height="8" rx="4" fill="rgba(255,255,255,.22)"/>
    <path d="M23 150 h54" stroke="rgba(0,0,0,.25)" stroke-width="2"/>
    <path d="M30 132 L27 104 Q50 94 73 104 L70 132 Z" fill="${s}" stroke="${d}" stroke-width="1.3"/>
    ${f(9, 60, 14, 46, -34, 16, 102)}${f(22, 24, 13.5, 68, -9, 29, 90)}${f(36.5, 13, 14.5, 77, -1, 44, 90)}${f(52, 18, 13.5, 71, 6, 58, 90)}${f(65.5, 35, 11.5, 54, 14, 71, 88)}
    <ellipse cx="49" cy="97" rx="28" ry="25" fill="${s}" stroke="${d}" stroke-width="1.3"/>
    <g fill="${d}" opacity=".35"><ellipse cx="31" cy="81" rx="4.5" ry="2.6"/><ellipse cx="44" cy="77" rx="4.8" ry="2.6"/><ellipse cx="58" cy="79" rx="4.5" ry="2.6"/><ellipse cx="69" cy="85" rx="3.6" ry="2.2"/></g>
    <path d="M36 112 Q42 100 40 86 M50 114 Q52 100 47 84 M62 112 Q60 100 59 86" stroke="${d}" stroke-width="1.2" fill="none" opacity=".35"/>
    <ellipse cx="40" cy="92" rx="12" ry="7" fill="rgba(255,255,255,.18)"/></svg>`;
}
function stonesHTML(i, n, isStore, pal, drop) {
  let s = ''; if (!n) return s;
  const N = Math.max(n, isStore ? 12 : 6);
  const size = isStore ? (n > 30 ? 17 : 20) : (n > 14 ? 19 : n > 8 ? 22 : 25);
  const v = isStore && LAYOUT === 'v';
  for (let k = 0; k < n; k++) {
    const ang = k * 2.39996 + i * 1.3, rr = Math.sqrt((k + .5) / N);
    const x = 50 + Math.cos(ang) * rr * (isStore ? (v ? 40 : 30) : 28), y = 50 + Math.sin(ang) * rr * (isStore ? (v ? 30 : 38) : 28);
    s += `<i class="st${drop && k === n - 1 ? ' drop' : ''}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;width:${v ? size * 0.55 : size}%;--c:${pal[(k * 5 + i * 3) % pal.length]}"></i>`;
  }
  return s;
}
let LAYOUT = 'h';
function calcLayout() { const w = innerWidth, h = innerHeight; LAYOUT = S.layout === 'h' || S.layout === 'v' ? S.layout : (w < 640 && h > w * 1.1 ? 'v' : 'h'); return LAYOUT; }
function renderBoard(el, b, o = {}) {
  const theme = CAT.boards[o.boardTheme || S.eq.board] || CAT.boards.klasik, pal = (CAT.stones[o.stoneTheme || S.eq.stone] || CAT.stones.renkli).colors;
  const L = o.layout || LAYOUT;
  el.className = 'board ' + L + ' ' + theme.cls;
  const shdP = o.st && o.st.shield != null ? o.st.shield : null;
  const cls = i => { const c = [];
    if (o.hl && o.hl.has(i)) c.push('hl'); if (o.click && o.click.has(i)) c.push('click'); if (o.tgt && o.tgt.has(i)) c.push('tgt');
    if (o.active === i) c.push('active'); if (o.cap && o.cap.has(i)) c.push('cap'); if (o.target === i) c.push('target'); if (o.dim && o.dim.has(i)) c.push('skip');
    if (o.st) { if (o.st.mystery === i) c.push('mys'); if (o.st.frozen && o.st.frozen.pit === i) c.push('frz'); if (shdP != null && i !== 6 && i !== 13 && Engine.ownerOf(i) === shdP) c.push('shd'); }
    return c.join(' '); };
  const extras = i => (o.order && o.order[i] != null ? `<span class="order">${o.order[i]}</span>` : '') + (o.target === i && o.tap !== false ? `<span class="tapme">👆</span>` : '');
  const bonus = p => o.st && o.st.bonus && o.st.bonus[p] ? `<span class="bonus">+${o.st.bonus[p]}⭐</span>` : '';
  const pos = i => {
    if (L === 'h') { if (i === 13) return 'grid-column:1;grid-row:1/3'; if (i === 6) return 'grid-column:8;grid-row:1/3';
      return i < 6 ? `grid-column:${i + 2};grid-row:2` : `grid-column:${12 - i + 2};grid-row:1`; }
    if (i === 13) return 'grid-row:1;grid-column:1/3'; if (i === 6) return 'grid-row:8;grid-column:1/3';
    return i < 6 ? `grid-column:1;grid-row:${i + 2}` : `grid-column:2;grid-row:${12 - i + 2}`;
  };
  const store = (i, lbl, p) => `<div class="store ${cls(i)}" data-i="${i}" style="${pos(i)}">${stonesHTML(i, b[i], true, pal, o.dropAt === i)}<span class="cnt">${b[i]}</span>${bonus(p)}${o.labels !== false ? `<span class="slbl">${lbl}</span>` : ''}${extras(i)}</div>`;
  let h = store(13, o.oppName ? esc(o.oppName) : t('Rakip hazinesi'), 1);
  for (let i = 12; i >= 7; i--) h += `<div class="pit popp ${cls(i)}" data-i="${i}" style="${pos(i)}">${stonesHTML(i, b[i], false, pal, o.dropAt === i)}<span class="cnt">${b[i]}</span>${extras(i)}</div>`;
  for (let i = 0; i < 6; i++) h += `<div class="pit pme ${cls(i)}" data-i="${i}" style="${pos(i)}">${stonesHTML(i, b[i], false, pal, o.dropAt === i)}<span class="cnt">${b[i]}</span>${extras(i)}</div>`;
  h += store(6, o.meName ? esc(o.meName) : t('Senin hazinen'), 0);
  el.innerHTML = h;
  el.onclick = e => { const tg = e.target.closest('[data-i]'); if (tg && o.onClick) o.onClick(+tg.dataset.i, tg); };
}
function pitCenter(wrap, i) {
  const el = wrap.querySelector(`[data-i="${i}"]`); if (!el) return { x: 0, y: 0 };
  const r = el.getBoundingClientRect(), w = wrap.getBoundingClientRect();
  return { x: r.left - w.left + r.width / 2, y: r.top - w.top + r.height / 2 };
}
function floater(wrap, i, text, color) {
  const lay = wrap && wrap.querySelector('.fxlayer'); if (!lay) return;
  const c = pitCenter(wrap, i), el = document.createElement('div');
  el.className = 'floater'; el.textContent = text; el.style.left = c.x + 'px'; el.style.top = c.y + 'px'; if (color) el.style.color = color;
  lay.appendChild(el); setTimeout(() => el.remove(), 1400);
}
const vib = p => { if (S.haptics && navigator.vibrate) try { navigator.vibrate(p); } catch { } };

/* ---------- el animasyonu ---------- */
const SPEEDS = { slow: 640, normal: 440, fast: 250 };
function makeHand(wrap, p, handId) {
  const layer = wrap.querySelector('.handlayer');
  const pal = (CAT.stones[S.eq.stone] || CAT.stones.renkli).colors;
  const pw = wrap.querySelector('.pit').getBoundingClientRect().width;
  const W = Math.max(46, pw * 1.3), H = W * 1.7;
  layer.innerHTML = `<div class="hand3"><div class="hand-in" style="width:${W}px;height:${H}px;left:${-W * 0.48}px;top:${-H * 18 / 170}px">${handSVG(handId, pal)}</div></div><span class="held"></span>`;
  const el = layer.querySelector('.hand3'), badge = layer.querySelector('.held');
  const wr = wrap.getBoundingClientRect(), cx = wr.width / 2;
  const tf = (x, y) => `translate(${x}px,${y}px) rotate(${p === 0 ? (x - cx) / wr.width * 35 : 180 + (cx - x) / wr.width * 35}deg)`;
  const bt = (x, y) => `translate(${x}px,${y + (p === 0 ? H * 0.62 : -H * 0.62)}px) translate(-50%,-50%)`;
  const v = LAYOUT === 'v';
  const start = { x: p === 0 ? (v ? wr.width * 0.28 : cx + wr.width * 0.2) : (v ? wr.width * 0.72 : cx - wr.width * 0.2), y: p === 0 ? wr.height + H * 0.35 : -H * 0.35 };
  el.style.transition = 'none'; el.style.transform = tf(start.x, start.y); badge.style.transform = bt(start.x, start.y);
  void el.offsetWidth;
  const ease = 'cubic-bezier(.45,.05,.35,1)';
  return {
    async to(x, y, ms) { el.style.transition = `transform ${ms}ms ${ease},opacity .25s`; badge.style.transition = `transform ${ms}ms ${ease},opacity .2s`;
      el.style.transform = tf(x, y); badge.style.transform = bt(x, y); await wait(ms); },
    show() { el.classList.add('on'); },
    async press() { el.classList.add('press'); await wait(110); el.classList.remove('press'); },
    hold(n) { el.classList.toggle('holding', n > 0); badge.textContent = n; badge.classList.toggle('on', n > 0); },
    async leave(ms) { badge.classList.remove('on'); el.classList.remove('holding'); await this.to(start.x, start.y, ms); el.classList.remove('on'); await wait(200); layer.innerHTML = ''; },
    kill() { layer.innerHTML = ''; }
  };
}
/* st0: hamleden önceki durum, r: Engine.play(...,true).r, st1: sonraki durum */
async function animate(el, st0, p, pit, r, st1, base = {}) {
  const sp = (SPEEDS[S.speed] || 300) * (base.speedMul || 1);
  const wrap = el.parentElement;
  const useHand = S.handAnim && base.hands && !base.instant;
  const B = o => ({ ...base, st: st0, ...o });
  let d = st0.b.slice();
  const sfxDrop = idx => { if (idx === 6 || idx === 13) Sound.sfx.thunk(); else Sound.sfx.clack(); vib(6); };
  if (base.instant) { renderBoard(el, st1.b, { ...base, st: st1 }); return; }
  if (!useHand) {
    d[pit] = 0; renderBoard(el, d, B({ active: pit })); Sound.sfx.grab(); await wait(sp * .8);
    for (const idx of r.path) { d[idx]++; renderBoard(el, d, B({ active: idx, dropAt: idx })); sfxDrop(idx); await wait(sp * .8); }
  } else {
    var hand = makeHand(wrap, p, base.hands[p]);
  }
  try {
    if (useHand) {
      renderBoard(el, d, B({ active: pit }));
      const c0 = pitCenter(wrap, pit); hand.show(); await hand.to(c0.x, c0.y, sp * 1.5);
      await hand.press(); let held = d[pit]; d[pit] = 0; hand.hold(held); renderBoard(el, d, B({ active: pit })); Sound.sfx.grab();
      await wait(sp * .35);
      let first = true;
      for (const idx of r.path) {
        if (!(first && idx === pit)) { const c = pitCenter(wrap, idx); await hand.to(c.x, c.y, sp * .7); }
        first = false;
        d[idx]++; held--; hand.hold(held); renderBoard(el, d, B({ active: idx, dropAt: idx })); sfxDrop(idx);
        await hand.press(); await wait(sp * .25);
      }
      hand.held = held;
    }
    if (r.blocked) { renderBoard(el, d, B({ cap: new Set(r.blocked.pits) })); floater(wrap, r.blocked.pits[0], '🛡️'); Sound.sfx.shield(); await wait(sp * 2); }
    if (r.cap) {
      renderBoard(el, d, B({ cap: new Set(r.cap.pits) })); Sound.sfx.capture(); vib([30, 30, 30]); await wait(sp * 1.6);
      if (useHand) {
        let held = 0;
        for (const ci of r.cap.pits) { const c = pitCenter(wrap, ci); await hand.to(c.x, c.y, sp * .8); await hand.press(); held += d[ci]; d[ci] = 0; hand.hold(held); renderBoard(el, d, B()); Sound.sfx.grab(); await wait(sp * .3); }
        const sc = pitCenter(wrap, STORE[p]); await hand.to(sc.x, sc.y, sp * 1.2); await hand.press(); hand.hold(0);
      }
      d = r.afterCap.slice(); renderBoard(el, d, B({ hl: new Set([STORE[p]]), dropAt: STORE[p] })); Sound.sfx.thunk();
      floater(wrap, STORE[p], '+' + r.cap.amount + (r.mysteryCap ? ' ×2' : ''), r.mysteryCap ? '#d0b0ff' : null);
      await wait(sp * 1.2);
    } else if (r.extra) { renderBoard(el, d, B({ hl: new Set([STORE[p]]) })); Sound.sfx.extra(); vib([15, 40, 15]); floater(wrap, STORE[p], '⭐ ' + t('Tekrar!')); await wait(sp * 1.5); }
    if (r.mysteryHit) { floater(wrap, r.last, '❓ +2', '#d0b0ff'); Sound.sfx.mystery(); await wait(sp * 1.5); }
    if (r.end) {
      const col = r.end.collector;
      if (useHand && col !== p) { await hand.leave(sp); hand = makeHand(wrap, col, base.hands[col]); hand.show(); }
      renderBoard(el, d, B({ cap: new Set(r.end.pits) })); await wait(sp * 2);
      if (useHand) {
        let h2 = 0;
        for (const ci of r.end.pits) { if (!d[ci]) continue; const c = pitCenter(wrap, ci); await hand.to(c.x, c.y, sp * .7); await hand.press(); h2 += d[ci]; d[ci] = 0; hand.hold(h2); renderBoard(el, d, B()); Sound.sfx.grab(); }
        const sc = pitCenter(wrap, STORE[col]); await hand.to(sc.x, sc.y, sp * 1.2); await hand.press(); hand.hold(0);
      }
      renderBoard(el, st1.b, { ...base, st: st1, hl: new Set([STORE[col]]), dropAt: STORE[col] }); Sound.sfx.thunk();
      if (r.end.amount) floater(wrap, STORE[col], '+' + r.end.amount);
      await wait(sp * 1.5);
    }
    if (useHand) await hand.leave(sp * 1.2);
  } catch (e) { if (hand) hand.kill(); throw e; }
}
async function animateCard(el, st0, p, card, arg, st1, base = {}) {
  const wrap = el.parentElement;
  if (card === 'swap') {
    renderBoard(el, st0.b, { ...base, st: st0, cap: new Set([arg, arg + 1]) }); Sound.sfx.swap(); await wait(500);
    floater(wrap, arg, '🔀');
  } else if (card === 'freeze') { Sound.sfx.freeze(); floater(wrap, arg, '❄️'); }
  else if (card === 'shield') { Sound.sfx.shield(); floater(wrap, STORE[p], '🛡️'); }
  vib(25);
  renderBoard(el, st1.b, { ...base, st: st1 }); await wait(500);
}

/* ---------- konfeti + arka plan parçacıkları ---------- */
function confetti() {
  const c = $('confetti'), x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
  const cols = ['#f2c14e', '#e5534b', '#4cc38a', '#5aa9e6', '#a77bf3', '#fff'];
  const P = Array.from({ length: 160 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4,
    r: 4 + Math.random() * 5, c: cols[Math.floor(Math.random() * cols.length)], a: Math.random() * 6, va: (Math.random() - .5) * .3 }));
  const T0 = performance.now();
  (function step() { x.clearRect(0, 0, c.width, c.height); const f = (performance.now() - T0) / 16.7;
    for (const p of P) { p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.a += p.va;
      x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); x.restore(); }
    if (f < 180) requestAnimationFrame(step); else x.clearRect(0, 0, c.width, c.height); })();
  setTimeout(() => x.clearRect(0, 0, c.width, c.height), 3500);
}
(function dust() {
  const c = $('fx'), x = c.getContext('2d'); let P = [];
  const resize = () => { c.width = innerWidth; c.height = innerHeight; P = Array.from({ length: Math.min(40, Math.round(innerWidth / 30)) }, () => ({ x: Math.random() * c.width, y: Math.random() * c.height, r: Math.random() * 2 + .5, v: Math.random() * .25 + .05, a: Math.random() * .4 + .1 })); };
  resize(); addEventListener('resize', resize);
  (function loop() { if (!document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches) { x.clearRect(0, 0, c.width, c.height);
    for (const p of P) { p.y -= p.v; p.x += Math.sin(p.y / 60) * .2; if (p.y < -5) { p.y = c.height + 5; p.x = Math.random() * c.width; }
      x.fillStyle = `rgba(255,210,140,${p.a})`; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill(); } }
    setTimeout(() => requestAnimationFrame(loop), 50); })();
})();

/* =========================================================
   EKRANLAR
   ========================================================= */
let curScreen = 'auth';
const RENDER = {};
function go(name) {
  if (name !== 'auth' && !AUTH.guest && !AUTH.token) name = 'auth';
  if (name !== 'auth' && !S.tutorialDone) name = 'tutorial';
  if (curScreen === 'game' && name !== 'game' && G && !G.over && G.kind !== 'spectate' && G.kind !== 'puzzle') { leaveGameConfirm(name); return; }
  if (curScreen === 'game' && name !== 'game' && G && G.kind === 'spectate') netSend({ t: 'unspec' });
  ensurePeriods();
  curScreen = name; closePanel();
  document.body.classList.toggle('ingame', name === 'game' || name === 'tutorial');
  document.body.classList.toggle('authscr', name === 'auth');
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === 'scr-' + name));
  calcLayout();
  if (name === 'auth') renderAuth(); else (RENDER[name] || (() => { }))();
  if (name !== 'auth') updTop();
  Sound.duck(name === 'game' || name === 'tutorial');
  window.scrollTo(0, 0);
}
async function leaveGameConfirm(name) {
  const ok = await modal(`<div class="big">🚪</div><h3>${t('Maçtan çıkmak istiyor musun?')}</h3><p class="muted">${t('Çıkarsan bu maç mağlubiyet sayılır.')}</p>`,
    [{ label: t('Maça Dön'), cls: 'sec', value: false }, { label: t('Çık'), cls: 'red', value: true }]);
  if (ok && G && !G.over) { await resignNow(); }
}
setInterval(() => document.querySelectorAll('[data-until]').forEach(e => e.textContent = fmtLeft(+e.dataset.until - Date.now())), 1000);
const until = d => `<span class="timer">⏳ <span data-until="${+d}">${fmtLeft(d - Date.now())}</span></span>`;
function toast(m, ms = 2800) { const tt = $('toast'); tt.innerHTML = m; tt.classList.add('on'); clearTimeout(tt._t); tt._t = setTimeout(() => tt.classList.remove('on'), ms); }
function modal(html, buttons) {
  return new Promise(res => {
    const m = $('modal');
    m.innerHTML = `<div class="mbox">${html}<div class="row">${buttons.map((b, k) => `<button class="btn ${b.cls || ''}" data-k="${k}">${b.label}</button>`).join('')}</div></div>`;
    m.classList.add('on'); m._res = res;
    m.querySelectorAll('button[data-k]').forEach(btn => btn.onclick = () => { Sound.sfx.click(); m.classList.remove('on'); res(buttons[+btn.dataset.k].value); });
  });
}
function promptModal(html, fields, okLabel, cancelLabel) {
  return new Promise(res => {
    const m = $('modal');
    m.innerHTML = `<div class="mbox">${html}${fields.map(f => `<input class="inp" style="margin-top:8px" id="${f.id}" placeholder="${esc(f.ph || '')}" type="${f.type || 'text'}" ${f.max ? `maxlength="${f.max}"` : ''} value="${esc(f.val || '')}">`).join('')}
      <div class="row"><button class="btn sec" data-k="0">${cancelLabel || t('Vazgeç')}</button><button class="btn" data-k="1">${okLabel}</button></div></div>`;
    m.classList.add('on');
    const done = ok => { m.classList.remove('on'); if (!ok) return res(null); const o = {}; fields.forEach(f => o[f.id] = $(f.id).value.trim()); res(o); };
    m.querySelector('[data-k="0"]').onclick = () => done(false); m.querySelector('[data-k="1"]').onclick = () => done(true);
    m.querySelectorAll('input').forEach((i, k, arr) => i.onkeydown = e => { if (e.key === 'Enter') { if (k === arr.length - 1) done(true); else arr[k + 1].focus(); } });
    setTimeout(() => { const f = m.querySelector('input'); if (f) f.focus(); }, 50);
  });
}
const closeModal = () => $('modal').classList.remove('on');
$('pchip').onclick = () => go('profile');
$('dailybtn').onclick = () => openDaily();
$('musicbtn').onclick = () => { S.music = !S.music; persist(); applySettings(); updTop(); };
document.addEventListener('pointerdown', () => { Sound.unlock(); if (S.music && !Sound.musicPlaying && curScreen !== 'auth') Sound.music(true); }, { passive: true });
function applySettings() { Sound.setSfx(S.sfxVol); Sound.setMusicVol(S.musicVol); if (curScreen !== 'auth') Sound.music(!!S.music); }
let rsT; addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { const old = LAYOUT; calcLayout(); if (old !== LAYOUT) refreshBoards(); }, 200); });
function refreshBoards() { if (curScreen === 'tutorial') tutRender(); else if (curScreen === 'game' && G) gRender(); else if (curScreen === 'menu') RENDER.menu(); else if (curScreen === 'replay') repRender(); }

/* ---------- Menü ---------- */
RENDER.menu = () => {
  const tt = passTier(), ev = curEvent(), ui = CONTENT.ui || {}, hidden = new Set(ui.hidden || []);
  const dq = dailyQuests(), dDone = dq.filter(q => (S.daily.prog[q.id] || 0) >= q.goal).length;
  const solved = Object.keys(S.puzzles).length;
  const tiles = [
    ['pass', `<button class="mcard pass" onclick="go('pass')"><span class="note">${S.pass.premium ? '👑' : t('ÜCRETSİZ')}</span><div class="ic">🎫</div><h3>${t('Sezon Kartı')}</h3><p>${t('{0} Sezonu', seasonName())} · ${tt}/${PASS_TIERS}</p><div class="mini-prog"><i style="width:${tt / PASS_TIERS * 100}%"></i></div></button>`],
    ['event', `<button class="mcard event" onclick="go('events')"><span class="note">${t('SINIRLI SÜRE')}</span><div class="ic">${ev.icon}</div><h3>${esc(nm(ev))}</h3><p>${Math.min(S.event.prog, ev.goal)}/${ev.goal} · ${until(ev.endD)}</p></button>`],
    ['quests', `<button class="mcard" onclick="go('events')"><span class="note">${dDone}/3</span><div class="ic">📋</div><h3>${t('Görevler')}</h3><p>${t('Günlük görevler ve ödüller')}</p></button>`],
    ['puzzles', `<button class="mcard" onclick="go('puzzles')"><span class="note">${solved}/${PUZZLES.length}</span><div class="ic">🧩</div><h3>${t('Bulmacalar')}</h3><p>${t('Taktik görevleri çöz')}</p></button>`],
    ['shop', `<button class="mcard" onclick="go('shop')"><div class="ic">🛒</div><h3>${t('Mağaza')}</h3><p>${t('Tahta, taş, el, avatar, emoji...')}</p></button>`],
    ['profile', `<button class="mcard" onclick="go('profile')"><div class="ic">👤</div><h3>${t('Profil')}</h3><p>${t('Başarımlar, unvanlar, hesap')}</p></button>`],
    ['replay', `<button class="mcard" onclick="openReplays()"><div class="ic">🎬</div><h3>${t('Maç Tekrarları')}</h3><p>${t('Tekrar izle ve koç analizi')}</p></button>`],
    ['rules', `<button class="mcard" onclick="go('rules')"><div class="ic">📜</div><h3>${t('Kurallar')}</h3><p>${t('Tüm kurallar ve modlar')}</p></button>`],
    ['settings', `<button class="mcard" onclick="go('settings')"><div class="ic">⚙️</div><h3>${t('Ayarlar')}</h3><p>${t('Dil, ses, müzik, titreşim')}</p></button>`]
  ].filter(([k]) => !hidden.has(k)).map(x => x[1]).join('');
  $('scr-menu').innerHTML = `<div class="hero"><h1>${esc((ui.hero && ui.hero.title) || 'MANGALA')}</h1><p>${esc((ui.hero && ui.hero.sub) || t('Binlerce yıllık Türk zekâ ve strateji oyunu'))}</p></div>
    <div class="preview"><div class="bwrap"><div id="mboard" class="board"></div></div></div>
    ${uiBlocksHTML(ui.blocks || [])}
    <div class="menu-grid">
      <button class="mcard main" onclick="go('mode')"><div class="ic">⚔️</div><h3>${t('OYNA')}</h3><p>${t('Botlar, çevrimiçi, dereceli, turnuva')}</p></button>
      ${tiles}
      ${can('panel') ? `<button class="mcard admin" onclick="go('admin')"><div class="ic">${AUTH.user.rank ? AUTH.user.rank.icon : '🛡️'}</div><h3>${t('Yönetim Paneli')}</h3><p>${esc(nm(AUTH.user.rank))} · ${t('yetkilerine göre')}</p></button>` : ''}
    </div>`;
  renderBoard($('mboard'), INIT, { labels: false, layout: 'h' });
};
/* ---------- kurucunun hazır bileşenleri ---------- */
function uiBlocksHTML(blocks) { return blocks && blocks.length ? `<div class="ublocks">${blocks.map(uiBlockHTML).join('')}</div>` : ''; }
function uiBlockHTML(b) {
  const go2 = b.target ? `onclick="go('${b.target}')"` : '';
  if (b.type === 'banner') return `<div class="ub ub-${b.color} ub-banner">${b.icon ? `<div class="ub-ic">${esc(b.icon)}</div>` : ''}<div class="ub-body"><h3>${esc(b.title)}</h3>${b.text ? `<p>${esc(b.text)}</p>` : ''}</div>${b.target ? `<button class="btn sm" ${go2}>${esc(b.btn || t('Git'))}</button>` : ''}</div>`;
  if (b.type === 'news') return `<div class="ub ub-${b.color} ub-news"><b>${esc(b.icon || '📰')} ${esc(b.title)}</b>${b.text ? `<p>${esc(b.text)}</p>` : ''}${b.target ? `<button class="linkbtn" ${go2}>${esc(b.btn || t('Git'))} →</button>` : ''}</div>`;
  if (b.type === 'countdown') return `<div class="ub ub-${b.color} ub-count"><div><b>${esc(b.icon || '⏳')} ${esc(b.title)}</b>${b.text ? `<p>${esc(b.text)}</p>` : ''}</div>${b.date > Date.now() ? `<span class="ub-timer" data-until="${b.date}">${fmtLeft(b.date - Date.now())}</span>` : `<span class="ub-timer">${t('Başladı!')}</span>`}</div>`;
  if (b.type === 'event') { const e = curEvent(); return `<div class="ub ub-${b.color} ub-banner"><div class="ub-ic">${e.icon}</div><div class="ub-body"><h3>${esc(b.title || nm(e))}</h3><p>${dsc(e)}</p><div class="mini-prog"><i style="width:${Math.min(1, S.event.prog / e.goal) * 100}%"></i></div></div><button class="btn sm" onclick="go('events')">${esc(b.btn || t('Etkinliğe Git'))}</button></div>`; }
  if (b.type === 'buttons') return `<div class="ub ub-${b.color} ub-btns">${b.title ? `<b>${esc(b.title)}</b>` : ''}<div class="row">${(b.buttons || []).map(x => `<button class="btn sm" onclick="go('${x.target}')">${esc(x.icon || '')} ${esc(x.label)}</button>`).join('')}</div></div>`;
  return '';
}
async function openDaily() {
  if (!S.tutorialDone) return;
  ensurePeriods();
  const today = dayKey(), can = S.login.last !== today;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const streak = can ? (S.login.last === dayKey(y) ? S.login.streak + 1 : 1) : S.login.streak;
  const idx = (streak - 1) % 7;
  const days = LOGIN_REWARDS.map((r, k) => `<div class="d ${k < idx || (!can && k === idx) ? 'got' : ''} ${k === idx && can ? 'today' : ''}">${t('Gün {0}', k + 1)}<br><b>${r} 🪙</b></div>`).join('');
  const v = await modal(`<div class="big">🎁</div><h3>${t('Günlük Ödül')}</h3><p class="muted">${t('Her gün giriş yap, seriyi bozma! Seri: {0} gün', streak)}</p><div class="chest">${days}</div>${can ? '' : `<p class="muted">${t('Bugünün ödülünü aldın. Yarın tekrar gel!')}</p>`}`,
    can ? [{ label: t('Kapat'), cls: 'sec', value: 0 }, { label: t('Al: {0} 🪙', LOGIN_REWARDS[idx]), value: 1 }] : [{ label: t('Tamam'), value: 0 }]);
  if (v) { S.login = { last: today, streak }; grant({ coins: LOGIN_REWARDS[idx], xp: 30 }); if (curScreen === 'menu') RENDER.menu(); }
}

/* ---------- Mağaza ---------- */
let shopCur = 'featured';
function dailyDeals() {
  const pool = []; for (const c of ['boards', 'stones', 'hands', 'avatars', 'frames', 'emojis', 'msgs']) for (const [id, it] of Object.entries(CAT[c])) if (it.price > 0 && !it.src) pool.push([c, id]);
  return shuffled(pool, 'deal' + dayKey()).slice(0, 3).map(([c, id], k) => ({ c, id, off: [30, 40, 50][k] }));
}
const evShop = (c, id) => (curEvent().shop || []).find(x => x[0] === c && x[1] === id);
function priceOf(c, id) { const it = item(c, id), es = evShop(c, id); if (es && es[2] != null) return es[2]; const d = dailyDeals().find(x => x.c === c && x.id === id); return d ? Math.round(it.price * (100 - d.off) / 100) : it.price; }
function canBuy(c, id) { const it = item(c, id); if (evShop(c, id)) return true; if (!it.price) return false; if (!it.src) return true; return it.src === 'event:' + curEvent().id; }
function previewHTML(c, id) {
  const it = item(c, id), pal = CAT.stones[S.eq.stone].colors;
  if (c === 'boards') return `<div class="board mini ${it.cls}"><div class="store">${stonesHTML(1, 5, true, pal)}</div>${[3, 4, 2].map((n, k) => `<div class="pit">${stonesHTML(k, n, false, pal)}</div>`).join('')}<div class="store">${stonesHTML(4, 7, true, pal)}</div></div>`;
  if (c === 'stones') return `<div class="prev stonebox board ${CAT.boards[S.eq.board].cls}" style="padding:0;display:grid"><div class="pit">${stonesHTML(2, 8, false, it.colors)}</div></div>`;
  if (c === 'hands') return `<div class="prev"><div class="handprev">${handSVG(id, pal)}</div></div>`;
  if (c === 'avatars') return `<div class="prev">${avatarHTML(id, S.eq.frame, 76)}</div>`;
  if (c === 'frames') return `<div class="prev">${avatarHTML(S.eq.avatar, id, 76)}</div>`;
  if (c === 'emojis') return `<div class="prev a-${it.anim}" style="font-size:26px;letter-spacing:2px;padding:6px">${it.list.map(e => `<span class="em">${e}</span>`).join('')}</div>`;
  if (c === 'msgs') return `<div class="prev" style="font-size:12px;padding:8px;gap:4px;display:flex;flex-direction:column;align-items:flex-start">${msgList(it).slice(0, 3).map(m => `<span style="background:#fff;color:#2a1a10;border-radius:10px;padding:2px 8px;font-weight:700">${esc(m)}</span>`).join('')}</div>`;
}
const msgList = it => LANG === 'en' && it.len ? it.len : it.list;
function itemCard(c, id, extra = {}) {
  const it = item(c, id), has = owns(c, id), eqKey = CAT_INFO[c].eq, on = eqKey && S.eq[eqKey] === id, price = priceOf(c, id);
  let btn;
  if (on) btn = `<button class="btn sec sm" disabled>✓ ${t('Kullanılıyor')}</button>`;
  else if (has) btn = eqKey ? `<button class="btn sec sm" onclick="equip('${c}','${id}')">${t('Kullan')}</button>` : `<button class="btn sec sm" disabled>✓ ${t('Oyunda aktif')}</button>`;
  else if (canBuy(c, id)) btn = `<button class="btn sm ${isAdmin() || S.coins >= price ? '' : 'sec'}" onclick="buyItem('${c}','${id}')">${t('Satın Al')} · ${isAdmin() ? '∞' : price} 🪙</button>`;
  else btn = `<button class="btn sec sm" disabled>${it.src === 'pass' ? '🎫 ' + t('Sezon Kartı') : '🎊 ' + t('Etkinlik ödülü')}</button>`;
  const priceTxt = has ? `<span style="color:var(--green)">${t('Sahipsin')}</span>` : canBuy(c, id) ? (price < it.price ? `<span class="old">${it.price}</span>` : '') + price + ' 🪙' : `<span class="muted">${t('Satılmaz')}</span>`;
  return `<div class="card item ${on ? 'eq' : ''}">${extra.ribbon ? `<span class="ribbon ${extra.ev ? 'ev' : ''}">${extra.ribbon}</span>` : ''}${previewHTML(c, id)}<div><h4>${nm(it)}</h4>${dsc(it) ? `<div class="muted small">${dsc(it)}</div>` : ''}</div><div class="price">${priceTxt}</div>${btn}</div>`;
}
function shopTab(x) { shopCur = x; RENDER.shop(); }
RENDER.shop = () => {
  let h = `<button class="btn sec sm back" onclick="go('menu')">← ${t('Menü')}</button><h2>🛒 ${t('Mağaza')}</h2>
    <div class="tabs">${Object.entries(CAT_INFO).map(([k, v]) => `<button class="tab ${k === shopCur ? 'on' : ''}" onclick="shopTab('${k}')">${nm(v)}</button>`).join('')}</div>`;
  if (shopCur === 'featured') {
    const ev = curEvent();
    h += `<div class="sec-title"><h3>🔥 ${t('Günün Fırsatları')}</h3>${until(tomorrow())}</div><div class="items">${dailyDeals().map(d => itemCard(d.c, d.id, { ribbon: '-%' + d.off })).join('')}</div>
      <div class="sec-title"><h3>${ev.icon} ${t('Etkinlik Özel')}: ${esc(nm(ev))}</h3>${until(ev.endD)}</div>
      <div class="items">${(ev.shop || []).filter(([c, id]) => CAT[c] && CAT[c][id]).map(([c, id]) => itemCard(c, id, { ribbon: t('SINIRLI'), ev: true })).join('')}
        <div class="card item" style="justify-content:center;text-align:center"><div style="font-size:46px">${ev.icon}</div><h4>${t('Etkinlik ödülü')}</h4><p class="muted small" style="margin:0">${rewardTxt(ev.reward)}</p><button class="btn sec sm" onclick="go('events')">${t('Etkinliğe Git')}</button></div></div>
      <div class="sec-title"><h3>🎫 ${t('Sezon Kartı')}</h3>${until(seasonEnd())}</div>
      <div class="card row" style="background:linear-gradient(135deg,#5b3a8a,#2e1b4a);border-color:#8f6ad6"><div style="font-size:46px">👑</div><div style="flex:1;min-width:200px"><h3 style="margin:0">${t('Altın Bilet')}</h3><p class="muted" style="margin:4px 0 0">${t('Ejderha tahtası, Alev çerçeve, Ejder Pençesi eli ve çok daha fazlası!')}</p></div><button class="btn purple" onclick="go('pass')">${t('İncele')}</button></div>`;
  } else {
    const list = Object.keys(CAT[shopCur]).filter(id => { const it = item(shopCur, id); return !it.src || owns(shopCur, id) || canBuy(shopCur, id); });
    h += `<div class="items">${list.map(id => itemCard(shopCur, id)).join('')}</div><p class="muted small" style="margin-top:14px">💡 ${t('Bazı özel ürünler sadece Sezon Kartı ve etkinliklerden kazanılır.')}</p>`;
  }
  $('scr-shop').innerHTML = h;
};
async function buyItem(c, id) {
  const it = item(c, id), price = priceOf(c, id);
  if (!canBuy(c, id) || owns(c, id)) return;
  if (!isAdmin() && S.coins < price) { Sound.sfx.error(); toast(t('Yetersiz para! {0} 🪙 daha lazım.', price - S.coins)); return; }
  const ok = await modal(`<div style="max-width:220px;margin:0 auto">${previewHTML(c, id)}</div><h3 style="margin-top:12px">${nm(it)}</h3><p>${t('{0} 🪙 karşılığında satın alınsın mı?', isAdmin() ? '∞' : price)}</p>`, [{ label: t('Vazgeç'), cls: 'sec', value: false }, { label: t('Satın Al'), value: true }]);
  if (!ok || !spend(price)) return;
  S.own[c].push(id); const k = CAT_INFO[c].eq; if (k) S.eq[k] = id;
  persist(); updTop(true); Sound.sfx.coin(); toast('✨ ' + t('{0} satın alındı!', nm(it))); checkCollection(); RENDER.shop();
}
function equip(c, id) { const k = CAT_INFO[c].eq; if (!k || !owns(c, id)) return; S.eq[k] = id; persist(); updTop(); Sound.sfx.click(); if (curScreen === 'shop') RENDER.shop(); if (curScreen === 'profile') renderProfile(); netHello(); }

/* ---------- Sezon kartı ---------- */
function passReward(lane, tt) { const map = lane === 'free' ? PASS_FREE_ITEMS : PASS_PREM_ITEMS, v = map[tt]; if (Array.isArray(v)) return { item: v }; if (v) return v; return { coins: lane === 'free' ? 30 + tt * 4 : 60 + tt * 5 }; }
function rewardBox(lane, tt) {
  const r = passReward(lane, tt), reached = passTier() >= tt, done = (lane === 'free' ? S.pass.free : S.pass.prem).includes(tt), locked = lane === 'prem' && !S.pass.premium;
  let icon = '🪙', name = r.coins + ' 🪙';
  if (r.item) { const [c, id] = r.item, it = item(c, id); name = nm(it);
    icon = c === 'avatars' ? avatarHTML(id, 'yok', 40) : c === 'frames' ? avatarHTML(S.eq.avatar, id, 40) : c === 'emojis' ? it.list[0] : c === 'msgs' ? '💬'
      : c === 'hands' ? `<div style="width:26px;height:40px">${handSVG(id, CAT.stones[S.eq.stone].colors)}</div>` : c === 'boards' ? `<div class="board h ${it.cls}" style="width:46px;height:28px;padding:0;border-radius:8px"></div>`
      : `<span style="display:inline-flex;gap:2px">${it.colors.slice(0, 3).map(cl => `<i class="st" style="position:relative;transform:none;width:14px;--c:${cl}"></i>`).join('')}</span>`; }
  const claim = reached && !done && !locked;
  return `<div class="rw ${lane === 'prem' ? 'prem' : ''} ${done ? 'done' : ''} ${!reached ? 'lock' : ''} ${claim ? 'claim' : ''}" ${claim ? `onclick="claimPass('${lane}',${tt})"` : ''}>${locked ? '<span class="lk">🔒</span>' : ''}<div class="ri">${icon}</div><div class="rn">${name}</div>${claim ? `<b style="color:var(--gold)">${t('AL!')}</b>` : ''}</div>`;
}
RENDER.pass = () => {
  ensurePeriods();
  const tt = passTier(), cur = S.pass.xp - tt * PASS_XP;
  let n = 0; for (let i = 1; i <= tt; i++) { if (!S.pass.free.includes(i)) n++; if (S.pass.premium && !S.pass.prem.includes(i)) n++; }
  $('scr-pass').innerHTML = `<button class="btn sec sm back" onclick="go('menu')">← ${t('Menü')}</button>
    <div class="pass-head"><div class="big">🎫</div>
      <div style="flex:1;min-width:220px"><h2 style="margin:0">${t('{0} Sezonu', seasonName())}</h2><p class="muted" style="margin:2px 0 8px">${t('Oyna, XP kazan, kademe atla! Sezon bitince ilerleme sıfırlanır ama kazandıkların seninle kalır.')}</p>
        <div class="row" style="gap:8px"><b>${t('Kademe')} ${tt}/${PASS_TIERS}</b>${tt < PASS_TIERS ? `<span class="muted">${cur}/${PASS_XP} XP</span>` : ''}${until(seasonEnd())}</div>
        <div class="pbar-g" style="margin-top:8px"><i style="width:${tt >= PASS_TIERS ? 100 : cur / PASS_XP * 100}%;background:linear-gradient(90deg,#a77bf3,#f2c14e)"></i></div></div>
      <div style="text-align:center">${S.pass.premium ? `<div class="badge" style="font-size:15px">👑 ${t('ALTIN BİLET AKTİF')}</div>` : `<button class="btn purple" onclick="buyPass()">👑 ${t('Altın Bilet')} · ${isAdmin() ? '∞' : PASS_PRICE} 🪙</button>`}
        ${n ? `<div style="margin-top:10px"><button class="btn green sm" onclick="claimAllPass()">${t('Hepsini Al')} (${n})</button></div>` : ''}</div></div>
    <div class="lane-lbl"><span>⬆ ${t('Ücretsiz')}</span><span style="margin-left:auto;color:#c6a5ff">⬇ ${t('Altın Bilet')}</span></div>
    <div class="pass-track" id="ptrack">${Array.from({ length: PASS_TIERS }, (_, k) => k + 1).map(i => `<div class="tier ${tt >= i ? 'reached' : ''}">${rewardBox('free', i)}<div class="num">${i}</div>${rewardBox('prem', i)}</div>`).join('')}</div>
    <div class="card"><h3 style="margin-top:0">${t('XP nasıl kazanılır?')}</h3><div class="muted" style="line-height:1.7">${t('🏆 Galibiyet: 120 XP + rakip bonusu · 🤝 Beraberlik: 70 XP · 🎮 Mağlubiyet: 40 XP<br>🌍 Çevrimiçi +%50 XP · 📋 Görev 100 XP · 🧩 Bulmaca 50 XP · 🎁 Günlük ödül 30 XP')}</div></div>`;
  $('ptrack').scrollLeft = Math.max(0, (tt - 2) * 116);
};
function claimPass(lane, tt) { const arr = lane === 'free' ? S.pass.free : S.pass.prem; if (arr.includes(tt) || passTier() < tt || (lane === 'prem' && !S.pass.premium)) return; arr.push(tt); grant(passReward(lane, tt)); RENDER.pass(); }
function claimAllPass() {
  const tt = passTier(), got = [];
  for (let i = 1; i <= tt; i++) {
    if (!S.pass.free.includes(i)) { S.pass.free.push(i); got.push(...grant(passReward('free', i), true)); }
    if (S.pass.premium && !S.pass.prem.includes(i)) { S.pass.prem.push(i); got.push(...grant(passReward('prem', i), true)); }
  }
  Sound.sfx.coin(); RENDER.pass();
  modal(`<div class="big">🎁</div><h3>${t('Ödüller alındı!')}</h3><div class="rewards">${got.map(g => `<span>${g}</span>`).join('')}</div>`, [{ label: t('Harika!'), value: 1 }]);
}
async function buyPass() {
  if (S.pass.premium) return;
  if (!isAdmin() && S.coins < PASS_PRICE) { Sound.sfx.error(); toast(t('Yetersiz para! {0} 🪙 daha lazım.', PASS_PRICE - S.coins)); return; }
  const ok = await modal(`<div class="big">👑</div><h3>${t('Altın Bilet')}</h3><p>${t('Bu sezonun tüm altın ödüllerini açmak için {0} 🪙 öde.', isAdmin() ? '∞' : PASS_PRICE)}</p>`, [{ label: t('Vazgeç'), cls: 'sec', value: false }, { label: t('Satın Al'), cls: 'purple', value: true }]);
  if (!ok || !spend(PASS_PRICE)) return;
  S.pass.premium = true; persist(); updTop(true); Sound.sfx.win(); toast('👑 ' + t('Altın Bilet aktif!')); RENDER.pass();
}

/* ---------- Etkinlik & görevler ---------- */
RENDER.events = () => {
  ensurePeriods();
  const ev = curEvent(), done = S.event.prog >= ev.goal, up = upcomingEvents(), r = ev.reward, ri = r.item;
  const w = weekInfo(), nextBuiltin = EVENTS[(w.idx + 1) % EVENTS.length];
  const mult = [ev.coinMult > 1 ? '🪙 x' + ev.coinMult : '', ev.xpMult > 1 ? '⭐ XP x' + ev.xpMult : ''].filter(Boolean);
  $('scr-events').innerHTML = `<button class="btn sec sm back" onclick="go('menu')">← ${t('Menü')}</button><h2>🎊 ${t('Etkinlikler & Görevler')}</h2>
    <div class="ev-big"><div class="ic">${ev.icon}</div>
      <div style="flex:1;min-width:220px"><div class="row"><span class="badge">${ev.server ? t('ÖZEL ETKİNLİK') : t('HAFTALIK ETKİNLİK')}</span>${until(ev.endD)}${mult.map(m => `<span class="badge">${m}</span>`).join('')}</div><h2 style="margin:8px 0 4px">${esc(nm(ev))}</h2><p class="muted" style="margin:0 0 10px">${dsc(ev)}</p>
      <div class="pbar-g"><i style="width:${Math.min(1, S.event.prog / ev.goal) * 100}%"></i></div><div style="margin-top:6px;font-weight:800">${Math.min(S.event.prog, ev.goal)} / ${ev.goal}</div></div>
      <div class="card" style="text-align:center;min-width:160px"><div class="muted small">${t('Ödül')}</div><div style="max-width:150px;margin:6px auto">${ri ? previewHTML(ri[0], ri[1]) : '<div style="font-size:54px">🎁</div>'}</div><b>${rewardTxt(r)}</b>
        <div style="margin-top:8px">${S.event.claimed ? `<span class="badge">✓ ${t('Alındı')}</span>` : `<button class="btn sm ${done ? '' : 'sec'}" ${done ? '' : 'disabled'} onclick="claimEvent()">${done ? t('Ödülü Al') : t('Devam et')}</button>`}</div></div></div>
    ${up.length ? `<div class="sec-title"><h3>📅 ${t('Yakındaki etkinlikler')}</h3></div><div class="list">${up.slice(0, 5).map(e => `<div class="lrow"><span style="font-size:26px">${esc(e.icon)}</span><div class="grow"><b>${esc(nm(e))}</b><span class="muted small">${esc(dsc(e))}</span></div>${until(new Date(e.start))}</div>`).join('')}</div>`
      : `<p class="muted small">${t('Sıradaki etkinlik')}: ${nextBuiltin.icon} <b>${nm(nextBuiltin)}</b></p>`}
    <div class="sec-title"><h3>📋 ${t('Günlük Görevler')}</h3>${until(tomorrow())}</div>
    <div class="card">${dailyQuests().map(q => { const p = Math.min(S.daily.prog[q.id] || 0, q.goal), cl = S.daily.claimed.includes(q.id), ok = p >= q.goal;
      return `<div class="quest"><div style="font-size:26px">${ok ? '✅' : '🎯'}</div><div class="q-txt"><b>${LANG === 'en' ? q.en : q.txt}</b> <span class="muted small">· ${QUEST_REWARD.coins} 🪙 + ${QUEST_REWARD.xp} XP</span><div class="pbar-g"><i style="width:${p / q.goal * 100}%"></i></div></div><div style="min-width:80px;text-align:right">${cl ? `<span class="badge">✓</span>` : `<button class="btn xs ${ok ? '' : 'sec'}" ${ok ? '' : 'disabled'} onclick="claimQuest('${q.id}')">${ok ? t('Al') : p + '/' + q.goal}</button>`}</div></div>`; }).join('')}</div>
    <div class="sec-title"><h3>🎁 ${t('Günlük Giriş Ödülü')}</h3></div>
    <div class="card row between"><span>${t('Seri: {0} gün', S.login.streak)} ${S.login.last === dayKey() ? '· ✓' : ''}</span><button class="btn sm ${S.login.last === dayKey() ? 'sec' : ''}" onclick="openDaily()">${t('Ödül Takvimi')}</button></div>`;
};
function claimQuest(id) { const q = QUESTS.find(x => x.id === id); if (!q || S.daily.claimed.includes(id) || (S.daily.prog[id] || 0) < q.goal) return; S.daily.claimed.push(id); grant(QUEST_REWARD); RENDER.events(); }
function claimEvent() { const ev = curEvent(); if (S.event.claimed || S.event.prog < ev.goal) return; S.event.claimed = true; grant(ev.reward); RENDER.events(); }

/* ---------- Profil ---------- */
function renderProfile() {
  const li = levelInfo(S.xp), T = S.totals, wr = T.games ? Math.round(T.wins / T.games * 100) : 0;
  const pick = (c, key, size) => `<div class="pick">${S.own[c].map(id => `<button class="${S.eq[key] === id ? 'on' : ''}" title="${esc(nm(item(c, id)))}" onclick="equip('${c}','${id}')">${c === 'avatars' ? avatarHTML(id, S.eq.frame, size) : avatarHTML(S.eq.avatar, id, size)}</button>`).join('')}</div>`;
  const u = AUTH.user;
  const acct = AUTH.guest ? `<div class="card" style="border-color:var(--gold)"><h3 style="margin-top:0">👤 ${t('Misafir hesabı')}</h3><p class="muted">${t('İlerlemen sadece bu cihazda. Hesap oluşturursan her cihazdan giriş yapabilirsin ve ilerlemen aktarılır.')}</p>
      <div class="row"><input class="inp" id="pname" maxlength="16" value="${esc(S.name)}" style="max-width:220px"><button class="btn sm sec" onclick="saveName()">${t('İsmi Kaydet')}</button><button class="btn sm" onclick="logout()">${t('Hesap Oluştur / Giriş')}</button></div></div>`
    : `<div class="card"><h3 style="margin-top:0">🔐 ${t('Hesap')}</h3>
      <div class="set-row"><span>${t('Kullanıcı adı')}</span><span><b>${esc(u.name)}</b> ${rankBadge(u.rank)} <button class="btn xs sec" onclick="changeUsername()">✏️ ${t('Değiştir')}</button></span></div>
      <div class="set-row"><span>${t('E-posta')}</span><span>${u.email ? esc(u.email) + ' ' + (u.emailVerified ? '<span class="okmsg">✓ ' + t('doğrulandı') + '</span>' : `<button class="linkbtn" onclick="verifyEmailFlow()">${t('doğrula')}</button>`) : '<span class="muted">' + t('yok') + '</span>'} <button class="btn xs sec" onclick="changeEmail()">${u.email ? t('Değiştir') : t('Ekle')}</button></span></div>
      <div class="set-row"><span>${t('Dereceli')}</span><span>${leagueBadge(u.elo)} <b>${u.elo}</b> Elo · ${u.ranked ? `${u.ranked.w}G ${u.ranked.d}B ${u.ranked.l}M` : ''}</span></div>
      <div class="row" style="margin-top:12px"><button class="btn sm sec" onclick="changePassword()">🔒 ${t('Şifre Değiştir')}</button><button class="btn sm red" onclick="logout()">🚪 ${t('Çıkış Yap')}</button></div></div>`;
  const unlocked = ACHS.filter(a => S.achs[a.id]).length;
  $('scr-profile').innerHTML = `<button class="btn sec sm back" onclick="go('menu')">← ${t('Menü')}</button><h2>👤 ${t('Profil')}</h2>
    <div class="card prof-head">${avatarHTML(S.eq.avatar, S.eq.frame, 104)}
      <div style="flex:1;min-width:200px"><h2 style="margin:0">${esc(myName())} ${AUTH.user ? rankBadge(AUTH.user.rank) : ''}</h2><div class="ttl" style="font-size:14px">${titleTxt(S.title)}</div><input class="inp" id="pbio" maxlength="80" placeholder="${t('Durum mesajı (profilinde herkes görür)')}" value="${esc(S.bio || '')}" onchange="S.bio=this.value.replace(/[<>]/g,'').slice(0,80);persist();toast('✓')" style="margin-top:8px;max-width:380px">
        <div class="row" style="margin-top:8px"><span class="badge" style="font-size:14px">${t('Seviye')} ${li.L}</span><span class="muted">${li.cur}/${li.need} XP</span></div>
        <div class="pbar-g" style="margin-top:6px;max-width:320px"><i style="width:${li.cur / li.need * 100}%;background:linear-gradient(90deg,#7bd3ff,#4b8df8)"></i></div></div></div>
    <div style="margin-top:12px">${acct}</div>
    <div class="sec-title"><h3>🏷️ ${t('Unvanlar')}</h3></div><div class="card"><div class="titles">${myTitles().map(id => `<button class="${S.title === id ? 'on' : ''}" onclick="S.title='${id}';persist();netHello();renderProfile()">${titleTxt(id)}</button>`).join('')}</div><p class="muted small" style="margin-bottom:0">${t('Yeni unvanları başarımlardan kazanırsın. Unvanın çevrimiçi rakiplerine görünür.')}</p></div>
    <div class="sec-title"><h3>🏅 ${t('Başarımlar')} (${unlocked}/${ACHS.length})</h3></div>
    <div class="achs">${ACHS.map(a => `<div class="ach ${S.achs[a.id] ? '' : 'lockd'}"><div class="ai">${a.icon}</div><div><b>${nm(a)}</b><small>${dsc(a)}</small><div class="small" style="color:var(--gold)">+${a.reward} 🪙${a.title ? ' · 🏷️ ' + titleTxt(a.title) : ''}</div></div></div>`).join('')}</div>
    <div class="sec-title"><h3>📊 ${t('İstatistikler')}</h3></div>
    <div class="stat-grid"><div class="stat"><b>${T.games}</b>${t('Toplam oyun')}</div><div class="stat"><b>${T.wins}</b>${t('Galibiyet')}</div><div class="stat"><b>%${wr}</b>${t('Kazanma oranı')}</div>
      <div class="stat"><b>${T.online}</b>${t('Çevrimiçi oyun')}</div><div class="stat"><b>${T.onlineWins}</b>${t('Çevrimiçi galibiyet')}</div><div class="stat"><b>${T.best}</b>${t('En yüksek skor')}</div>
      <div class="stat"><b>${T.even}</b>${t('Çift kuralı alımı')}</div><div class="stat"><b>${T.empty}</b>${t('Boş kuyu alımı')}</div><div class="stat"><b>${T.extra}</b>${t('Ekstra hamle')}</div>
      <div class="stat"><b>${Object.keys(S.puzzles).length}/${PUZZLES.length}</b>${t('Bulmaca')}</div><div class="stat"><b>${S.tourWins || 0}</b>${t('Turnuva zaferi')}</div><div class="stat"><b>${S.streak}</b>${t('Galibiyet serisi')}</div>
      ${BOTS.map(b => { const s = stat(b.id); return `<div class="stat">${b.emoji} <b style="display:inline;font-size:15px">${nm(b)}</b><br><span class="muted">${s.w}G · ${s.d}B · ${s.l}M</span></div>`; }).join('')}</div>
    <div class="sec-title"><h3>🙂 ${t('Avatarlarım')}</h3><button class="btn sec xs" onclick="shopCur='avatars';go('shop')">${t('Daha fazla')}</button></div><div class="card">${pick('avatars', 'avatar', 56)}</div>
    <div class="sec-title"><h3>⭕ ${t('Çerçevelerim')}</h3><button class="btn sec xs" onclick="shopCur='frames';go('shop')">${t('Daha fazla')}</button></div><div class="card">${pick('frames', 'frame', 56)}</div>
    <div class="sec-title"><h3>✋ ${t('Ellerim')}</h3><button class="btn sec xs" onclick="shopCur='hands';go('shop')">${t('Daha fazla')}</button></div>
    <div class="card"><div class="pick sq">${S.own.hands.map(id => `<button class="${S.eq.hand === id ? 'on' : ''}" title="${esc(nm(item('hands', id)))}" onclick="equip('hands','${id}')"><div style="width:40px;height:64px">${handSVG(id, CAT.stones[S.eq.stone].colors)}</div></button>`).join('')}</div></div>`;
}
RENDER.profile = renderProfile;
function saveName() { const v = $('pname').value.replace(/[<>&"'`]/g, '').trim().slice(0, 16); if (!v) return toast(t('İsim boş olamaz')); S.name = v; persist(); updTop(); toast('✓'); netHello(); }
const stat = id => S.stats[id] || (S.stats[id] = { w: 0, l: 0, d: 0 });

/* ---------- Kurallar & Ayarlar ---------- */
RENDER.rules = () => { $('scr-rules').innerHTML = `<button class="btn sec sm back" onclick="go('menu')">← ${t('Menü')}</button><h2>📜 ${t('Mangala Kuralları')}</h2><div class="panel">${RULES[LANG === 'en' ? 'en' : 'tr']}</div>`; };
let installPrompt = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; if (curScreen === 'settings') RENDER.settings(); });
RENDER.settings = () => {
  const sw = (on, js) => `<button class="switch ${on ? 'on' : ''}" onclick="${js};persist();applySettings();RENDER.settings()"></button>`;
  const sp = k => `<button class="tab ${S.speed === k ? 'on' : ''}" onclick="S.speed='${k}';persist();RENDER.settings()">${t({ slow: 'Yavaş', normal: 'Normal', fast: 'Hızlı' }[k])}</button>`;
  const ly = k => `<button class="tab ${S.layout === k ? 'on' : ''}" onclick="S.layout='${k}';persist();calcLayout();RENDER.settings()">${t({ auto: 'Otomatik', h: 'Yatay', v: 'Dikey' }[k])}</button>`;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  $('scr-settings').innerHTML = `<button class="btn sec sm back" onclick="go('menu')">← ${t('Menü')}</button><h2>⚙️ ${t('Ayarlar')}</h2><div class="panel">
    <div class="set-row"><span>🌐 ${t('Dil')}</span><div class="langsel" style="margin:0">${langButtons()}</div></div>
    <div class="set-row"><span>🎵 ${t('Arka plan müziği')}</span>${sw(S.music, 'S.music=!S.music')}</div>
    <div class="set-row"><span>🎚️ ${t('Müzik sesi')}</span><input type="range" min="0" max="1" step="0.05" value="${S.musicVol}" oninput="S.musicVol=+this.value;applySettings()" onchange="persist()"></div>
    <div class="set-row"><span>🔊 ${t('Efekt sesi')}</span><input type="range" min="0" max="1" step="0.05" value="${S.sfxVol}" oninput="S.sfxVol=+this.value;applySettings()" onchange="persist();Sound.sfx.clack()"></div>
    <div class="set-row"><span>📳 ${t('Titreşim (mobil)')}</span>${sw(S.haptics, 'S.haptics=!S.haptics')}</div>
    <div class="set-row"><span>✋ ${t('El animasyonu')}</span>${sw(S.handAnim, 'S.handAnim=!S.handAnim')}</div>
    <div class="set-row"><span>⏩ ${t('Taş dağıtma hızı')}</span><div class="row">${sp('slow')}${sp('normal')}${sp('fast')}</div></div>
    <div class="set-row"><span>📱 ${t('Tahta düzeni')}</span><div class="row">${ly('auto')}${ly('h')}${ly('v')}</div></div>
    <div class="set-row"><div><div>📲 ${t('Uygulama olarak yükle')}</div><div class="muted small">${standalone ? t('Zaten uygulama olarak açık ✓') : installPrompt ? t('Ana ekrana ekle, tam ekran oyna.') : t('iPhone: Paylaş → Ana Ekrana Ekle. Android/PC: tarayıcı menüsü → Uygulamayı yükle.')}</div></div>${installPrompt && !standalone ? `<button class="btn sm" onclick="installPrompt.prompt();installPrompt=null">${t('Yükle')}</button>` : ''}</div>
    <div class="set-row"><div><div>🖥️ ${t('Sunucu adresi')}</div><div class="muted small">${t('Oyunu sunucunun adresinden açıyorsan boş bırak. Örn: https://mangala-online.onrender.com')}</div></div>
      <div class="row"><input class="inp" id="srv" style="width:240px" value="${esc(lsGet('mangala_server', ''))}" placeholder="(${t('otomatik')})"><button class="btn sm" onclick="lsSet('mangala_server',$('srv').value.trim());netClose();netConnect();toast('✓')">${t('Kaydet')}</button></div></div>
    ${AUTH.guest ? `<div class="set-row" style="border:0"><span class="muted">${t('Misafir ilerlemesini siler (eğitim dahil).')}</span><button class="btn red sm" onclick="resetGuest()">${t('İlerlemeyi Sıfırla')}</button></div>` : ''}
  </div>`;
};
async function resetGuest() {
  const ok = await modal(`<div class="big">⚠️</div><h3>${t('Emin misin?')}</h3><p>${t('Tüm misafir ilerlemen silinecek.')}</p>`, [{ label: t('Vazgeç'), cls: 'sec', value: false }, { label: t('Sıfırla'), cls: 'red', value: true }]);
  if (!ok) return; lsDel('mangala_guest_v3'); S = normalize({}); persist(); go('tutorial');
}

/* =========================================================
   EĞİTİM
   ========================================================= */
const tut = { board: INIT.slice(), stepDone: false, busy: false };
const TUT_HANDS = () => [S.eq.hand, 'bugday'];
const tutTxt = s => s.replace(/\[\[(\w+)\]\]/g, (m, k) => TUT_WORDS[LAYOUT][k] || m);
const tf = (s, tr, en) => tutTxt(LANG === 'en' && s[en] ? s[en] : s[tr]);
function tutBoard(s) { return s.board === 'INIT' ? INIT.slice() : s.board.slice(); }
RENDER.tutorial = () => { tut.inited = false; tutShow(); };
function tutShow() {
  const i = Math.min(S.tutStep, TUT.length - 1), s = TUT[i];
  if (s.board) tut.board = tutBoard(s);
  else if (!tut.inited) { for (let k = i; k >= 0; k--) if (TUT[k].board) { tut.board = tutBoard(TUT[k]); break; } }
  tut.inited = true; tut.stepDone = !s.type || s.type === 'final'; tut.busy = false;
  $('tut-lbl').textContent = '🎓 ' + t('Eğitim');
  $('tut-opp').innerHTML = `<span>${LAYOUT === 'v' ? '' : '⬆ '}${t('RAKİP')}${LAYOUT === 'v' ? ' ➡' : ''}</span>`;
  $('tut-me').innerHTML = `<span>${LAYOUT === 'v' ? '⬅ ' : '⬇ '}${t('SEN')}</span>`;
  $('tprog').style.width = (i / (TUT.length - 1) * 100) + '%'; $('tstep').textContent = (i + 1) + ' / ' + TUT.length;
  const card = $('tcard');
  let h = `<h3>${tf(s, 't', 'te')}</h3>`;
  if (s.type === 'quiz') h += `<p>${tf(s, 'q', 'qe')}</p><div class="quiz">${(LANG === 'en' ? s.oe : s.opts).map((o, k) => `<button data-k="${k}">${o}</button>`).join('')}</div><div id="tres"></div>`;
  else { h += `<p>${tf(s, 'x', 'xe')}</p><div id="tres"></div>`;
    if (s.type === 'move') h += `<p class="hint" id="thint">${t('Parlayan kuyuya dokun.')}</p>`;
    if (s.type === 'bot') h += `<div class="row"><button class="btn sec" id="botgo">▶ ${t('Rakibin hamlesini izle')}</button></div>`; }
  h += `<div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" id="tnext" ${tut.stepDone ? '' : 'disabled'}>${s.type === 'final' ? t('Ödülü Al ve Başla 🪙') : t('Devam →')}</button></div>`;
  card.innerHTML = h; tutRender();
  $('tnext').onclick = tutNext;
  if (s.type === 'quiz') card.querySelectorAll('.quiz button').forEach(btn => btn.onclick = () => {
    if (tut.stepDone) return; const k = +btn.dataset.k, res = $('tres');
    if (k === s.a) { btn.classList.add('ok'); res.innerHTML = `<div class="result">✅ ${tf(s, 'ok', 'oke')}</div>`; tut.stepDone = true; $('tnext').disabled = false; Sound.sfx.extra(); }
    else { btn.classList.add('no', 'shake'); res.innerHTML = `<div class="result bad">❌ ${t('Yanlış.')} ${tf(s, 'no', 'noe')} ${t('Tekrar dene!')}</div>`; Sound.sfx.error(); vib(60); }
  });
  if (s.type === 'bot') $('botgo').onclick = async e => { if (tut.busy || tut.stepDone) return; tut.busy = true; e.target.disabled = true; await tutPlay(1, s.pit); tutAfter(s); };
}
async function tutPlay(p, pit) {
  const st0 = Engine.newState('classic', 1, p, tut.board);
  const { st, r } = Engine.play(st0, p, pit, true);
  await animate($('tboard'), st0, p, pit, r, st, { hands: TUT_HANDS() });
  tut.board = st.b;
}
function tutRender() {
  const s = TUT[S.tutStep], o = {};
  if (s.hl) o.hl = new Set(s.hl); if (s.order) o.order = ORDER; if (s.dim) o.dim = new Set(s.dim);
  if (!tut.stepDone && s.type === 'move') { o.target = s.pit; o.click = new Set([s.pit]); }
  if (!tut.stepDone && s.type === 'bot') { o.target = s.pit; o.tap = false; }
  o.onClick = tutClick; renderBoard($('tboard'), tut.board, o);
}
async function tutClick(i, el) {
  const s = TUT[S.tutStep];
  if (s.type !== 'move' || tut.stepDone || tut.busy) return;
  if (i !== s.pit) { const hint = $('thint'); if (hint) { hint.innerHTML = isPit(1, i) || i === 13 ? '❌ ' + t('Bu rakibinin tarafı! Sadece kendi kuyularından oynayabilirsin.') : i === 6 ? '❌ ' + t('Hazineden oynanmaz.') : '👉 ' + t('Şimdilik parlayan kuyuya dokun.'); hint.style.color = 'var(--red)'; }
    el.classList.add('shake'); Sound.sfx.error(); vib(50); return; }
  tut.busy = true; await tutPlay(0, i); tutAfter(s);
}
function tutAfter(s) {
  tut.busy = false; tut.stepDone = true; const h = $('thint'); if (h) h.remove();
  $('tres').innerHTML = `<div class="result">✅ ${tf(s, 'after', 'afe')}</div>`; $('tnext').disabled = false; tutRender();
}
function tutNext() {
  if (!tut.stepDone) return; const s = TUT[S.tutStep]; Sound.sfx.click();
  if (s.type === 'final') { S.tutorialDone = true; S.tutStep = 0; persist(); addCoins(TUT_BONUS); confetti(); Sound.sfx.win(); toast('🎓 ' + t('Eğitim tamamlandı!') + ' +' + TUT_BONUS + ' 🪙'); go('menu'); return; }
  S.tutStep++; persist(); tutShow(); window.scrollTo({ top: 0, behavior: 'smooth' });
}
