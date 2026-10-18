// =====================================================
//  Dijital Mangala - Sunucu
//  • Oyunun web sayfasını sunar (public/)
//  • Hesaplar: kayıt, giriş, şifre değiştirme, e-posta kodu
//  • Admin paneli API'si (ban, para verme, ...)
//  • Çevrimiçi maçlar: normal, dereceli (Elo), yıldırım, parti modları
//  • Turnuvalar (4/8 kişi) ve izleyici modu
// =====================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');
const E = require('./public/js/engine.js');
const DB = require('./lib/db');
const mail = require('./lib/mail');

// ---------------- AYARLAR ----------------
const PORT = process.env.PORT || 3000;
const TURN_MS = 30000;              // normal hamle süresi
const BLITZ_MS = 8000;              // yıldırım modu hamle süresi
const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';   // Render'da ADMIN_PASSWORD ile değiştir!
const START_ELO = 1000, ELO_K = 32;
const TOUR_FEE = { 4: 100, 8: 150 };  // turnuva giriş ücreti (kazanan tüm potu alır)
const MAX_MSG_PER_SEC = 30;
const EMOTE_COOLDOWN_MS = 1500;
const SESSION_DAYS = 30;
// ------------------------------------------

const LEAGUES = [{ id: 'bronz', min: 0 }, { id: 'gumus', min: 1100 }, { id: 'altin', min: 1300 }, { id: 'elmas', min: 1500 }, { id: 'usta', min: 1700 }];
const leagueOf = elo => LEAGUES.filter(l => elo >= l.min).pop().id;
const PUB = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
let db;

// ---------------- yardımcılar ----------------
const now = () => Date.now();
const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 64).toString('hex');
const safeEq = (a, b) => { const x = Buffer.from(a, 'hex'), y = Buffer.from(b, 'hex'); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const userRe = /^[a-zA-Z0-9_]{3,16}$/;
const emailRe = /^[^\s@<>]{1,64}@[^\s@<>]{1,190}\.[a-z]{2,}$/i;
const code6 = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');
const isBanned = u => u && u.banned && (u.banned.until === 0 || u.banned.until > now());
const publicUser = u => ({ name: u.name, role: u.role, email: u.email || '', emailVerified: !!u.emailVerified, elo: u.elo, league: leagueOf(u.elo),
  ranked: u.ranked, created: u.created });
const maskEmail = e => e.replace(/^(.{2}).*(@.*)$/, '$1***$2');
function newUser(name, pw, email) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { key: name.toLowerCase(), name, salt, hash: hashPw(pw, salt), email: email || '', emailVerified: false, role: 'user', banned: null,
    elo: START_ELO, ranked: { w: 0, l: 0, d: 0 }, created: now(), lastLogin: now(), save: null, rev: 0 };
}
async function newSession(u) {
  const token = crypto.randomBytes(24).toString('hex');
  await db.setSession(token, { key: u.key, exp: now() + SESSION_DAYS * 864e5 });
  return token;
}
// basit istek sınırlayıcı (IP başına)
const hits = new Map();
function limited(ip, bucket, max, windowMs) {
  const k = bucket + ':' + ip, t = now(); let h = hits.get(k);
  if (!h || h.reset < t) { h = { n: 0, reset: t + windowMs }; hits.set(k, h); }
  return ++h.n > max;
}
setInterval(() => { const t = now(); for (const [k, h] of hits) if (h.reset < t) hits.delete(k); }, 60000);

const codes = new Map(); // key -> {code, exp, tries, kind, email}
function makeCode(key, kind, email) { const c = { code: code6(), exp: now() + 15 * 60000, tries: 0, kind, email }; codes.set(kind + ':' + key, c); return c; }
function checkCode(key, kind, code) {
  const c = codes.get(kind + ':' + key);
  if (!c || c.exp < now()) return 'Kodun süresi dolmuş, yeni kod iste.';
  if (++c.tries > 5) { codes.delete(kind + ':' + key); return 'Çok fazla hatalı deneme, yeni kod iste.'; }
  if (String(code).trim() !== c.code) return 'Kod yanlış.';
  codes.delete(kind + ':' + key); return null;
}
async function sendCode(u, kind, email, lang) {
  const c = makeCode(u.key, kind, email);
  const m = mail.codeMail(c.code, kind, lang);
  try { if (await mail.send(email, m.subject, m.html)) return 'mail'; }
  catch (e) { console.error('E-posta gönderilemedi:', e.message); }
  console.log(`[KOD] ${kind} kodu — kullanıcı: ${u.name}, e-posta: ${email}, kod: ${c.code}`);
  return 'admin';
}

// ---------------- kullanıcı soketleri / kayıt değişikliği ----------------
const userSockets = new Map(); // key -> Set(ws)
const sendWs = (ws, o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };
const pushUser = (key, o) => { for (const ws of userSockets.get(key) || []) sendWs(ws, o); };
async function modifySave(key, fn) {
  const u = await db.getUser(key); if (!u) return null;
  u.save = u.save || {}; fn(u.save, u); u.rev = (u.rev || 0) + 1;
  await db.saveUser(u);
  pushUser(key, { t: 'saveUpdate', save: u.save, rev: u.rev });
  return u;
}
function kickUser(key, msg) { for (const ws of userSockets.get(key) || []) { sendWs(ws, { t: 'kicked', msg }); ws.close(); } }

// ---------------- HTTP ----------------
function readBody(req, limit = 400000) {
  return new Promise((res, rej) => {
    let size = 0, chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { rej(new Error('too big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { res(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { res({}); } });
    req.on('error', rej);
  });
}
const json = (res, code, o) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(o)); };
async function authUser(req) {
  const h = req.headers.authorization || ''; const tok = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!tok || tok.length > 100) return null;
  const s = await db.getSession(tok); if (!s) return null;
  const u = await db.getUser(s.key); if (!u) return null;
  u._token = tok; return u;
}

const api = {
  'GET /api/config': async () => [200, { mail: mail.configured(), db: db.kind }],

  'POST /api/register': async (req, b, ip) => {
    if (limited(ip, 'reg', 10, 3600000)) return [429, { error: 'Çok fazla deneme. Biraz sonra tekrar dene.' }];
    const name = String(b.username || '').trim(), pw = String(b.password || ''), email = String(b.email || '').trim().toLowerCase();
    if (!userRe.test(name)) return [400, { error: 'Kullanıcı adı 3-16 karakter olmalı (harf, rakam, _).' }];
    if (pw.length < 6 || pw.length > 100) return [400, { error: 'Şifre en az 6 karakter olmalı.' }];
    if (email && !emailRe.test(email)) return [400, { error: 'E-posta adresi geçersiz.' }];
    if (await db.getUser(name.toLowerCase())) return [409, { error: 'Bu kullanıcı adı alınmış.' }];
    const u = newUser(name, pw, email);
    if (b.save && typeof b.save === 'object') u.save = b.save;   // misafir ilerlemesini aktar
    await db.saveUser(u);
    const token = await newSession(u);
    let mailStatus = null;
    if (email) mailStatus = await sendCode(u, 'verify', email, b.lang);
    return [200, { token, user: publicUser(u), save: u.save, rev: u.rev, mailStatus }];
  },

  'POST /api/login': async (req, b, ip) => {
    if (limited(ip, 'login', 20, 600000)) return [429, { error: 'Çok fazla deneme. 10 dakika sonra tekrar dene.' }];
    const key = String(b.username || '').trim().toLowerCase();
    const u = await db.getUser(key);
    if (!u || !safeEq(hashPw(b.password || '', u.salt), u.hash)) return [401, { error: 'Kullanıcı adı veya şifre yanlış.' }];
    if (isBanned(u)) return [403, { error: 'Hesabın yasaklandı.', banned: u.banned }];
    u.lastLogin = now(); await db.saveUser(u);
    const token = await newSession(u);
    return [200, { token, user: publicUser(u), save: u.save, rev: u.rev || 0 }];
  },

  'POST /api/logout': async req => { const u = await authUser(req); if (u) await db.delSession(u._token); return [200, { ok: true }]; },

  'GET /api/me': async req => {
    const u = await authUser(req); if (!u) return [401, { error: 'Oturum bulunamadı.' }];
    if (isBanned(u)) return [403, { error: 'Hesabın yasaklandı.', banned: u.banned }];
    return [200, { user: publicUser(u), save: u.save, rev: u.rev || 0 }];
  },

  'POST /api/save': async (req, b) => {
    const u = await authUser(req); if (!u) return [401, { error: 'Oturum bulunamadı.' }];
    if (isBanned(u)) return [403, { error: 'Hesabın yasaklandı.', banned: u.banned }];
    if (!b.save || typeof b.save !== 'object') return [400, { error: 'Geçersiz kayıt.' }];
    if ((b.rev | 0) !== (u.rev || 0)) return [409, { save: u.save, rev: u.rev || 0 }];
    u.save = b.save; u.rev = (u.rev || 0) + 1;
    await db.saveUser(u);
    return [200, { rev: u.rev }];
  },

  'POST /api/password': async (req, b) => {
    const u = await authUser(req); if (!u) return [401, { error: 'Oturum bulunamadı.' }];
    if (!safeEq(hashPw(b.old || '', u.salt), u.hash)) return [400, { error: 'Mevcut şifre yanlış.' }];
    if (String(b.password || '').length < 6) return [400, { error: 'Yeni şifre en az 6 karakter olmalı.' }];
    u.salt = crypto.randomBytes(16).toString('hex'); u.hash = hashPw(b.password, u.salt);
    await db.saveUser(u); await db.delSessionsOf(u.key);
    const token = await newSession(u);
    return [200, { ok: true, token }];
  },

  'POST /api/email': async (req, b, ip) => {
    const u = await authUser(req); if (!u) return [401, { error: 'Oturum bulunamadı.' }];
    if (limited(ip, 'mail', 8, 3600000)) return [429, { error: 'Çok fazla istek. Biraz sonra tekrar dene.' }];
    const email = String(b.email || '').trim().toLowerCase();
    if (!emailRe.test(email)) return [400, { error: 'E-posta adresi geçersiz.' }];
    const other = await db.findUserByEmail(email);
    if (other && other.key !== u.key) return [409, { error: 'Bu e-posta başka bir hesapta kayıtlı.' }];
    u.email = email; u.emailVerified = false; await db.saveUser(u);
    const st = await sendCode(u, 'verify', email, b.lang);
    return [200, { ok: true, mailStatus: st }];
  },

  'POST /api/email/verify': async (req, b) => {
    const u = await authUser(req); if (!u) return [401, { error: 'Oturum bulunamadı.' }];
    const err = checkCode(u.key, 'verify', b.code); if (err) return [400, { error: err }];
    u.emailVerified = true; await db.saveUser(u);
    return [200, { ok: true, user: publicUser(u) }];
  },

  'POST /api/forgot': async (req, b, ip) => {
    if (limited(ip, 'forgot', 6, 3600000)) return [429, { error: 'Çok fazla istek. Biraz sonra tekrar dene.' }];
    const login = String(b.login || '').trim().toLowerCase();
    const u = login.includes('@') ? await db.findUserByEmail(login) : await db.getUser(login);
    if (!u) return [404, { error: 'Böyle bir hesap bulunamadı.' }];
    if (!u.email) return [400, { error: 'Bu hesapta kayıtlı e-posta yok. Şifre sıfırlamak için admin ile iletişime geç.' }];
    const st = await sendCode(u, 'reset', u.email, b.lang);
    return [200, { ok: true, username: u.name, email: maskEmail(u.email), mailStatus: st }];
  },

  'POST /api/reset': async (req, b, ip) => {
    if (limited(ip, 'reset', 20, 3600000)) return [429, { error: 'Çok fazla deneme.' }];
    const u = await db.getUser(String(b.username || '').trim().toLowerCase());
    if (!u) return [404, { error: 'Hesap bulunamadı.' }];
    const err = checkCode(u.key, 'reset', b.code); if (err) return [400, { error: err }];
    if (String(b.password || '').length < 6) return [400, { error: 'Yeni şifre en az 6 karakter olmalı.' }];
    u.salt = crypto.randomBytes(16).toString('hex'); u.hash = hashPw(b.password, u.salt);
    if (u.email) u.emailVerified = true;
    await db.saveUser(u); await db.delSessionsOf(u.key);
    if (isBanned(u)) return [403, { error: 'Hesabın yasaklandı.', banned: u.banned }];
    const token = await newSession(u);
    return [200, { token, user: publicUser(u), save: u.save, rev: u.rev || 0 }];
  },

  'GET /api/leaderboard': async () => {
    const top = await db.topElo(50);
    return [200, { list: top.map(u => ({ name: u.name, elo: u.elo, league: leagueOf(u.elo), ...u.ranked, avatar: u.save && u.save.eq ? u.save.eq.avatar : 'gulen' })) }];
  },

  // ---------------- ADMIN ----------------
  'GET /api/admin/stats': async (req, b, ip, admin) => {
    const pend = [...codes.entries()].filter(([, c]) => c.exp > now()).map(([k, c]) => ({ user: k.split(':')[1], kind: c.kind, email: c.email, code: c.code, left: Math.round((c.exp - now()) / 60000) }));
    return [200, { users: await db.countUsers(), online: onlineCount(), rooms: [...rooms.values()].filter(r => r.players[1] && !r.over).length,
      tours: [...tours.values()].filter(t => t.status === 'running').length, queues: Object.fromEntries(Object.entries(queues).map(([k, v]) => [k, v.length])),
      mail: mail.configured(), db: db.kind, codes: mail.configured() ? [] : pend }];
  },
  'GET /api/admin/users': async (req, b, ip, admin, q) => {
    const page = Math.max(0, parseInt(q.get('page') || '0', 10)); const s = (q.get('q') || '').toLowerCase().slice(0, 40);
    const { total, users } = await db.listUsers(s, page * 25, 25);
    return [200, { total, users: users.map(u => ({ name: u.name, email: u.email, emailVerified: u.emailVerified, role: u.role, banned: isBanned(u) ? u.banned : null,
      elo: u.elo, coins: u.save ? u.save.coins || 0 : 0, level: u.save ? u.save.xp || 0 : 0, created: u.created, lastLogin: u.lastLogin, online: userSockets.has(u.key) })) }];
  },
  'POST /api/admin/ban': async (req, b, ip, admin) => {
    const u = await db.getUser(String(b.username || '').toLowerCase()); if (!u) return [404, { error: 'Kullanıcı yok.' }];
    if (u.role === 'admin') return [400, { error: 'Admin yasaklanamaz.' }];
    const mins = Math.max(0, parseInt(b.minutes, 10) || 0);
    u.banned = { until: mins ? now() + mins * 60000 : 0, reason: String(b.reason || '').slice(0, 120), by: admin.name, at: now() };
    await db.saveUser(u); await db.delSessionsOf(u.key);
    kickUser(u.key, 'Hesabın yasaklandı' + (u.banned.reason ? ': ' + u.banned.reason : '.'));
    return [200, { ok: true }];
  },
  'POST /api/admin/unban': async (req, b) => { const u = await db.getUser(String(b.username || '').toLowerCase()); if (!u) return [404, { error: 'Kullanıcı yok.' }]; u.banned = null; await db.saveUser(u); return [200, { ok: true }]; },
  'POST /api/admin/coins': async (req, b) => {
    const amt = parseInt(b.amount, 10); if (!Number.isFinite(amt) || Math.abs(amt) > 1e7) return [400, { error: 'Geçersiz miktar.' }];
    const u = await modifySave(String(b.username || '').toLowerCase(), s => { s.coins = Math.max(0, (s.coins || 0) + amt); });
    if (!u) return [404, { error: 'Kullanıcı yok.' }];
    pushUser(u.key, { t: 'announce', msg: (amt >= 0 ? '🎁 Admin sana ' + amt + ' 🪙 gönderdi!' : '⚠️ Admin hesabından ' + (-amt) + ' 🪙 aldı.') });
    return [200, { ok: true, coins: u.save.coins }];
  },
  'POST /api/admin/setpw': async (req, b) => {
    const u = await db.getUser(String(b.username || '').toLowerCase()); if (!u) return [404, { error: 'Kullanıcı yok.' }];
    if (String(b.password || '').length < 6) return [400, { error: 'Şifre en az 6 karakter.' }];
    u.salt = crypto.randomBytes(16).toString('hex'); u.hash = hashPw(b.password, u.salt); await db.saveUser(u); await db.delSessionsOf(u.key);
    return [200, { ok: true }];
  },
  'POST /api/admin/resetprogress': async (req, b) => {
    const u = await modifySave(String(b.username || '').toLowerCase(), (s, user) => { for (const k of Object.keys(s)) delete s[k]; s.reset = true; });
    if (!u) return [404, { error: 'Kullanıcı yok.' }];
    u.elo = START_ELO; u.ranked = { w: 0, l: 0, d: 0 }; await db.saveUser(u);
    return [200, { ok: true }];
  },
  'POST /api/admin/role': async (req, b, ip, admin) => {
    const u = await db.getUser(String(b.username || '').toLowerCase()); if (!u) return [404, { error: 'Kullanıcı yok.' }];
    if (u.key === ADMIN_USER) return [400, { error: 'Ana admin değiştirilemez.' }];
    u.role = b.role === 'admin' ? 'admin' : 'user'; await db.saveUser(u); return [200, { ok: true }];
  },
  'POST /api/admin/delete': async (req, b) => {
    const key = String(b.username || '').toLowerCase(); if (key === ADMIN_USER) return [400, { error: 'Ana admin silinemez.' }];
    kickUser(key, 'Hesabın silindi.'); await db.deleteUser(key); return [200, { ok: true }];
  },
  'POST /api/admin/kick': async (req, b) => { kickUser(String(b.username || '').toLowerCase(), 'Admin seni sunucudan çıkardı.'); return [200, { ok: true }]; },
  'POST /api/admin/announce': async (req, b) => {
    const msg = String(b.msg || '').replace(/[<>]/g, '').slice(0, 200); if (!msg) return [400, { error: 'Mesaj boş.' }];
    wss.clients.forEach(c => sendWs(c, { t: 'announce', msg: '📢 ' + msg })); return [200, { ok: true }];
  },
  'GET /api/admin/rooms': async () => [200, { rooms: liveRooms(true) }],
  'POST /api/admin/closeroom': async (req, b) => { const r = rooms.get(String(b.code || '')); if (!r) return [404, { error: 'Oda yok.' }]; finish(r, -1, 'admin'); return [200, { ok: true }]; }
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (url.pathname === '/health') { res.writeHead(200); return res.end('ok'); }
  if (url.pathname.startsWith('/api/')) {
    const h = api[req.method + ' ' + url.pathname];
    if (!h) return json(res, 404, { error: 'Bulunamadı' });
    try {
      const body = req.method === 'POST' ? await readBody(req) : {};
      let admin = null;
      if (url.pathname.startsWith('/api/admin/')) {
        admin = await authUser(req);
        if (!admin || admin.role !== 'admin') return json(res, 403, { error: 'Yetkin yok.' });
      }
      const [code, out] = await h(req, body, ip, admin, url.searchParams);
      return json(res, code, out);
    } catch (e) { console.error(e); return json(res, 500, { error: 'Sunucu hatası' }); }
  }
  let p = decodeURIComponent(url.pathname); if (p === '/') p = '/index.html';
  const f = path.normalize(path.join(PUB, p));
  if (!f.startsWith(PUB + path.sep)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Bulunamadı'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

// =====================================================
//  ÇEVRİMİÇİ OYUN
// =====================================================
const wss = new WebSocketServer({ server, maxPayload: 8192 });
const rooms = new Map();
const tours = new Map();
const queues = { casual: [], ranked: [], blitz: [], party: [] };
const tourQueues = { 4: [], 8: [] };
const CODE_CHARS = 'ABCDEFGHJKLMNPRSTUVYZ23456789';
const idRe = /^[a-z0-9_]{1,20}$/;
const MODES = ['classic', 'blitz', 'reverse', 'mystery', 'cards'];
const onlineCount = () => { let n = 0; wss.clients.forEach(c => { if (c.readyState === 1) n++; }); return n; };
const makeCodeStr = (m = rooms) => { let c; do { c = Array.from({ length: 4 }, () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join(''); } while (m.has(c)); return c; };
const fp = i => (i + 7) % 14;
const pitTo = (seat, i) => (seat === 0 || i < 0) ? i : fp(i);   // sunucu koordinatı <-> oyuncu koordinatı
const view = (st, seat) => seat === 0 ? st : E.flip(st);

function cleanProfile(p, ws) {
  p = p || {};
  const pick = (v, d) => (typeof v === 'string' && idRe.test(v)) ? v : d;
  const prof = { name: String(p.name || 'Misafir').replace(/[<>&"'`]/g, '').trim().slice(0, 16) || 'Misafir',
    avatar: pick(p.avatar, 'gulen'), frame: pick(p.frame, 'yok'), hand: pick(p.hand, 'klasik'), title: pick(p.title, ''),
    level: Math.max(1, Math.min(999, parseInt(p.level, 10) || 1)), guest: !ws.user };
  if (ws.user) { prof.name = ws.user.name; prof.elo = ws.user.elo; prof.league = leagueOf(ws.user.elo); prof.admin = ws.user.role === 'admin'; }
  return prof;
}
function removeFromQueues(ws) {
  for (const k in queues) queues[k] = queues[k].filter(q => q !== ws);
  for (const s in tourQueues) {
    const before = tourQueues[s].length;
    tourQueues[s] = tourQueues[s].filter(q => q !== ws);
    if (before !== tourQueues[s].length && ws.user) modifySave(ws.user.key, sv => { sv.coins = (sv.coins || 0) + TOUR_FEE[s]; }); // iade
  }
}
function liveRooms(all) {
  return [...rooms.values()].filter(r => r.players[1] && !r.over && (all || !r.private)).map(r => ({ code: r.code, mode: r.mode, qmode: r.qmode,
    names: r.players.map(p => p.profile.name), scores: [E.score(r.st, 0), E.score(r.st, 1)], specs: r.specs.size, tour: !!r.tour,
    elo: r.players.map(p => p.profile.elo || null) }));
}

function startRoom(room, keepFirst) {
  const seed = crypto.randomInt(1, 2 ** 31);
  room.first = keepFirst != null ? keepFirst : room.first == null ? crypto.randomInt(2) : 1 - room.first;
  room.st = E.newState(room.mode, seed, room.first);
  room.over = false; room.rematch = new Set(); room.actions = []; room.startAt = now();
  room.turnMs = room.mode === 'blitz' ? BLITZ_MS : TURN_MS;
  room.players.forEach((ws, i) => {
    ws.room = room.code; ws.seat = i;
    sendWs(ws, { t: 'start', you: i, mode: room.mode, qmode: room.qmode, st: view(room.st, i), opp: room.players[1 - i].profile, turnMs: room.turnMs,
      room: room.code, ranked: !!room.ranked, tour: room.tour ? { id: room.tour.id } : null });
  });
  for (const s of room.specs) sendSpecStart(s, room);
  armTimer(room);
}
function sendSpecStart(ws, room) {
  sendWs(ws, { t: 'specStart', code: room.code, mode: room.mode, qmode: room.qmode, st: room.st, players: room.players.map(p => p.profile), turnMs: room.turnMs, actions: room.actions });
}
function armTimer(room) {
  clearTimeout(room.timer);
  if (room.over) return;
  room.timer = setTimeout(() => {
    const ms = E.legalMoves(room.st, room.st.turn);
    if (ms.length) applyAct(room, room.st.turn, { type: 'move', pit: ms[crypto.randomInt(ms.length)] }, true);
  }, room.turnMs + 900);
}
function applyAct(room, seat, act, auto = false) {
  if (room.over || room.st.turn !== seat) return false;
  let nst;
  if (act.type === 'move') { const r = E.play(room.st, seat, act.pit); if (!r) return false; nst = r.st; }
  else if (act.type === 'card') { nst = E.useCard(room.st, seat, act.card, act.arg); if (!nst) return false; }
  else return false;
  room.st = nst; room.actions.push({ by: seat, ...act });
  room.players.forEach((ws, i) => {
    const a = act.type === 'move' ? { type: 'move', pit: pitTo(i, act.pit) } : { type: 'card', card: act.card, arg: pitTo(i, act.arg) };
    sendWs(ws, { t: 'act', by: seat === i ? 0 : 1, act: a, st: view(room.st, i), auto, turnMs: room.turnMs });
  });
  for (const s of room.specs) sendWs(s, { t: 'act', by: seat, act, st: room.st, auto, turnMs: room.turnMs });
  if (room.st.over) finish(room, room.st.winner, 'normal');
  else if (act.type === 'move') armTimer(room);
  return true;
}
async function finish(room, winnerSeat, reason) {
  if (room.over) return;
  room.over = true; clearTimeout(room.timer);
  let elo = [null, null];
  if (room.ranked && reason !== 'admin') elo = await rankedResult(room, winnerSeat);
  room.players.forEach((ws, i) => sendWs(ws, { t: 'over', res: winnerSeat === -1 ? 'draw' : winnerSeat === i ? 'win' : 'loss', reason, st: view(room.st, i), elo: elo[i] }));
  for (const s of room.specs) sendWs(s, { t: 'over', winner: winnerSeat, reason, st: room.st });
  if (room.tour) tourMatchDone(room, winnerSeat, reason);
}
async function rankedResult(room, w) {
  const [a, b] = room.players.map(p => p.user);
  if (!a || !b) return [null, null];
  const ua = await db.getUser(a.key), ub = await db.getUser(b.key); if (!ua || !ub) return [null, null];
  const ea = 1 / (1 + 10 ** ((ub.elo - ua.elo) / 400));
  const sa = w === -1 ? 0.5 : w === 0 ? 1 : 0;
  let d = Math.round(ELO_K * (sa - ea)); if (sa === 1 && d < 1) d = 1; if (sa === 0 && d > -1) d = -1;
  ua.elo = Math.max(100, ua.elo + d); ub.elo = Math.max(100, ub.elo - d);
  const tag = (u, s) => { u.ranked = u.ranked || { w: 0, l: 0, d: 0 }; u.ranked[s === 1 ? 'w' : s === 0 ? 'l' : 'd']++; };
  tag(ua, sa); tag(ub, 1 - sa);
  await db.saveUser(ua); await db.saveUser(ub);
  room.players[0].user.elo = ua.elo; room.players[1].user.elo = ub.elo;
  return [{ elo: ua.elo, delta: d, league: leagueOf(ua.elo) }, { elo: ub.elo, delta: -d, league: leagueOf(ub.elo) }];
}
function leaveRoom(ws, reason = 'left') {
  const room = rooms.get(ws.room);
  ws.room = null;
  if (!room) return;
  const seat = room.players.indexOf(ws);
  if (seat === -1) return;
  const other = room.players[1 - seat];
  if (other) {
    if (!room.over) finish(room, other.seat, reason);
    sendWs(other, { t: 'oppLeft' });
    if (!room.tour) other.room = null;
  }
  if (!room.tour || room.over) {
    clearTimeout(room.timer);
    for (const s of room.specs) { sendWs(s, { t: 'specEnd' }); s.spectating = null; }
    rooms.delete(room.code);
  }
}
function inLiveTour(ws) { const t = ws.tour && tours.get(ws.tour); return !!(t && t.status === 'running' && t.players.some(p => p.ws === ws && p.alive)); }
function unspec(ws) { const r = rooms.get(ws.spectating); if (r) r.specs.delete(ws); ws.spectating = null; }

// ---------------- TURNUVA ----------------
function tourSummary(t) {
  return { id: t.id, size: t.size, fee: t.fee, pot: t.fee * t.size, status: t.status, round: t.round, champion: t.champion != null ? t.players[t.champion].name : null,
    players: t.players.map(p => ({ name: p.name, avatar: p.profile.avatar, frame: p.profile.frame, alive: p.alive, online: !!(p.ws && p.ws.readyState === 1) })),
    rounds: t.rounds.map(r => r.map(m => ({ a: m.a, b: m.b, winner: m.winner, room: m.room && rooms.has(m.room) && !rooms.get(m.room).over ? m.room : null,
      score: m.score || null }))) };
}
const tourBroadcast = t => t.players.forEach(p => sendWs(p.ws, { t: 'tour', tour: tourSummary(t) }));
function createTour(size, list) {
  const id = makeCodeStr(tours);
  const t = { id, size, fee: TOUR_FEE[size], status: 'running', round: 0, rounds: [],
    players: list.sort(() => Math.random() - 0.5).map(ws => ({ ws, key: ws.user.key, name: ws.profile.name, profile: ws.profile, alive: true })) };
  tours.set(id, t);
  t.players.forEach(p => { p.ws.tour = id; });
  const first = []; for (let i = 0; i < size; i += 2) first.push({ a: i, b: i + 1, winner: null });
  t.rounds.push(first);
  tourBroadcast(t);
  setTimeout(() => startTourRound(t), 4000);
}
function startTourRound(t) {
  for (const m of t.rounds[t.round]) {
    const pa = t.players[m.a], pb = t.players[m.b];
    const oka = pa.ws && pa.ws.readyState === 1, okb = pb.ws && pb.ws.readyState === 1;
    if (!oka || !okb) { m.winner = oka ? m.a : okb ? m.b : m.a; t.players[m.winner === m.a ? m.b : m.a].alive = false; continue; }
    for (const ws of [pa.ws, pb.ws]) { if (ws.room) leaveRoom(ws); unspec(ws); }
    const code = makeCodeStr();
    const room = { code, mode: 'classic', qmode: 'tour', players: [pa.ws, pb.ws], private: false, specs: new Set(), tour: { id: t.id, m } };
    m.room = code; rooms.set(code, room); startRoom(room);
  }
  tourBroadcast(t); tourAdvance(t);
}
function tourMatchDone(room, w, reason) {
  const t = tours.get(room.tour.id); if (!t) return;
  const m = room.tour.m;
  if (w === -1 && reason === 'normal') {        // beraberlik: tekrar oynanır
    room.players.forEach(ws => sendWs(ws, { t: 'announce', msg: '🤝 Berabere! Turnuvada eşitlik bozulana kadar maç tekrar oynanır.' }));
    setTimeout(() => { if (rooms.has(room.code) && room.players.every(p => p.readyState === 1)) startRoom(room); else tourMatchDone(room, room.players[0].readyState === 1 ? 0 : 1, 'left'); }, 3500);
    return;
  }
  if (w === -1) w = 0;
  m.winner = w === 0 ? m.a : m.b; m.score = [E.score(room.st, 0), E.score(room.st, 1)];
  t.players[w === 0 ? m.b : m.a].alive = false;
  setTimeout(() => { rooms.delete(room.code); room.players.forEach(ws => { if (ws.room === room.code) ws.room = null; }); for (const s of room.specs) sendWs(s, { t: 'specEnd' }); tourBroadcast(t); }, 1500);
  tourAdvance(t);
}
function tourAdvance(t) {
  const r = t.rounds[t.round];
  if (r.some(m => m.winner == null)) { tourBroadcast(t); return; }
  if (r.length === 1) {                            // final bitti
    t.status = 'done'; t.champion = r[0].winner;
    const champ = t.players[t.champion];
    modifySave(champ.key, sv => { sv.coins = (sv.coins || 0) + t.fee * t.size; sv.tourWins = (sv.tourWins || 0) + 1; });
    t.players.forEach(p => sendWs(p.ws, { t: 'tourEnd', champion: champ.name, you: p === champ, pot: t.fee * t.size, tour: tourSummary(t) }));
    setTimeout(() => tours.delete(t.id), 10 * 60000);
    return;
  }
  const next = []; for (let i = 0; i < r.length; i += 2) next.push({ a: r[i].winner, b: r[i + 1].winner, winner: null });
  t.rounds.push(next); t.round++;
  tourBroadcast(t);
  setTimeout(() => startTourRound(t), 6000);
}

// ---------------- bağlantılar ----------------
wss.on('connection', ws => {
  ws.alive = true; ws.user = null; ws.profile = cleanProfile({}, ws); ws.room = null; ws.msgCount = 0; ws.lastEmote = 0;
  ws.on('pong', () => { ws.alive = true; });
  sendWs(ws, { t: 'welcome', n: onlineCount() });

  ws.on('message', async raw => {
    if (++ws.msgCount > MAX_MSG_PER_SEC) return ws.terminate();
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== 'string') return;
    const room = ws.room ? rooms.get(ws.room) : null;
    try {
      switch (m.t) {
        case 'auth': {
          const s = typeof m.token === 'string' && m.token.length < 100 ? await db.getSession(m.token) : null;
          const u = s ? await db.getUser(s.key) : null;
          if (u && isBanned(u)) { sendWs(ws, { t: 'kicked', msg: 'Hesabın yasaklandı.' }); return ws.close(); }
          if (u) { ws.user = { key: u.key, name: u.name, elo: u.elo, role: u.role }; if (!userSockets.has(u.key)) userSockets.set(u.key, new Set()); userSockets.get(u.key).add(ws); }
          ws.profile = cleanProfile(m.profile, ws);
          sendWs(ws, { t: 'authed', user: !!u, elo: u ? u.elo : null, league: u ? leagueOf(u.elo) : null });
          break;
        }
        case 'hello': ws.profile = cleanProfile(m.profile, ws); break;

        case 'queue': {
          const q = m.mode in queues ? m.mode : 'casual';
          if (ws.room || inLiveTour(ws)) return;
          if (q === 'ranked' && !ws.user) return sendWs(ws, { t: 'err', msg: 'Dereceli maç için giriş yapmalısın.' });
          removeFromQueues(ws); unspec(ws);
          queues[q] = queues[q].filter(o => o.readyState === 1 && !o.room);
          const idx = queues[q].findIndex(o => !(ws.user && o.user && o.user.key === ws.user.key));
          if (idx >= 0) {
            const other = queues[q].splice(idx, 1)[0];
            const mode = q === 'blitz' ? 'blitz' : q === 'party' ? ['reverse', 'mystery', 'cards'][crypto.randomInt(3)] : 'classic';
            const code = makeCodeStr();
            const r = { code, mode, qmode: q, players: [other, ws], private: false, specs: new Set(), ranked: q === 'ranked' };
            rooms.set(code, r); startRoom(r);
          } else { queues[q].push(ws); sendWs(ws, { t: 'queued', mode: q }); }
          break;
        }
        case 'cancel':
          removeFromQueues(ws);
          if (room && !room.players[1]) { rooms.delete(room.code); ws.room = null; }
          sendWs(ws, { t: 'cancelled' });
          break;

        case 'create': {
          if (ws.room) return; removeFromQueues(ws); unspec(ws);
          const mode = MODES.includes(m.mode) ? m.mode : 'classic';
          const code = makeCodeStr();
          rooms.set(code, { code, mode, qmode: 'private', players: [ws, null], private: true, specs: new Set() });
          ws.room = code; sendWs(ws, { t: 'room', code, mode });
          break;
        }
        case 'join': {
          const code = String(m.code || '').toUpperCase().slice(0, 4);
          const r = rooms.get(code);
          if (!r || !r.private || r.players[0] === ws) return sendWs(ws, { t: 'err', msg: 'Oda bulunamadı.' });
          if (r.players[1]) return sendWs(ws, { t: 'err', msg: 'Oda dolu. İstersen izleyici olarak girebilirsin.', full: code });
          if (ws.room) return; removeFromQueues(ws); unspec(ws);
          r.players[1] = ws; startRoom(r);
          break;
        }
        case 'move': case 'card': {
          if (!room || !room.players[1] || room.players.indexOf(ws) === -1) return;
          const seat = room.players.indexOf(ws);
          const act = m.t === 'move' ? { type: 'move', pit: pitTo(seat, parseInt(m.pit, 10)) }
            : { type: 'card', card: String(m.card), arg: pitTo(seat, parseInt(m.arg, 10)) };
          if (!applyAct(room, seat, act)) sendWs(ws, { t: 'sync', st: view(room.st, seat) });
          break;
        }
        case 'emote': {
          const r = room || (ws.spectating && rooms.get(ws.spectating));
          if (!r || !room) return;
          if (now() - ws.lastEmote < EMOTE_COOLDOWN_MS) return;
          if (!(m.kind === 'e' || m.kind === 'm') || typeof m.id !== 'string' || !/^[a-z0-9_]{1,20}:\d{1,2}$/.test(m.id)) return;
          ws.lastEmote = now();
          const seat = room.players.indexOf(ws);
          sendWs(room.players[1 - seat], { t: 'emote', kind: m.kind, id: m.id });
          for (const s of room.specs) sendWs(s, { t: 'emote', seat, kind: m.kind, id: m.id });
          break;
        }
        case 'resign':
          if (room && room.players[1] && !room.over) finish(room, 1 - room.players.indexOf(ws), 'resign');
          break;
        case 'rematch':
          if (!room || !room.over || !room.players[1] || room.tour) return;
          room.rematch.add(room.players.indexOf(ws));
          if (room.rematch.size === 2) startRoom(room);
          else sendWs(room.players[1 - room.players.indexOf(ws)], { t: 'oppRematch' });
          break;
        case 'leave':
          removeFromQueues(ws); leaveRoom(ws); unspec(ws);
          break;

        // izleyici
        case 'lives': sendWs(ws, { t: 'lives', rooms: liveRooms(false) }); break;
        case 'spec': {
          const r = rooms.get(String(m.code || '').toUpperCase());
          if (!r || !r.players[1] || r.over) return sendWs(ws, { t: 'err', msg: 'Bu maç şu an oynanmıyor.' });
          if (ws.room) return;
          unspec(ws); r.specs.add(ws); ws.spectating = r.code; sendSpecStart(ws, r);
          break;
        }
        case 'unspec': unspec(ws); break;

        // turnuva
        case 'tourJoin': {
          const size = m.size === 8 ? 8 : 4;
          if (!ws.user) return sendWs(ws, { t: 'err', msg: 'Turnuvaya katılmak için giriş yapmalısın.' });
          if (ws.room || inLiveTour(ws) || tourQueues[4].includes(ws) || tourQueues[8].includes(ws)) return;
          if ([...tourQueues[4], ...tourQueues[8]].some(o => o.user && o.user.key === ws.user.key)) return sendWs(ws, { t: 'err', msg: 'Zaten bir turnuva sırasındasın.' });
          const fee = TOUR_FEE[size];
          const u = await db.getUser(ws.user.key);
          const unlimited = u.role === 'admin';
          if (!unlimited && (!u.save || (u.save.coins || 0) < fee)) return sendWs(ws, { t: 'err', msg: `Turnuva için ${fee} 🪙 gerekli.` });
          if (!unlimited) await modifySave(u.key, sv => { sv.coins -= fee; });
          tourQueues[size] = tourQueues[size].filter(o => o.readyState === 1);
          tourQueues[size].push(ws);
          if (tourQueues[size].length >= size) createTour(size, tourQueues[size].splice(0, size));
          else tourQueues[size].forEach(o => sendWs(o, { t: 'tourQueue', size, n: tourQueues[size].length }));
          break;
        }
        case 'tourLeave': removeFromQueues(ws); sendWs(ws, { t: 'tourLeft' }); break;
        case 'tourState': { const t = tours.get(ws.tour); if (t) sendWs(ws, { t: 'tour', tour: tourSummary(t) }); break; }
      }
    } catch (e) { console.error('ws hata', e); }
  });

  ws.on('close', () => {
    removeFromQueues(ws); leaveRoom(ws, 'left'); unspec(ws);
    if (ws.user) { const s = userSockets.get(ws.user.key); if (s) { s.delete(ws); if (!s.size) userSockets.delete(ws.user.key); } }
  });
});
setInterval(() => wss.clients.forEach(ws => { ws.msgCount = 0; }), 1000);
setInterval(() => wss.clients.forEach(ws => { if (!ws.alive) return ws.terminate(); ws.alive = false; ws.ping(); }), 25000);
setInterval(() => { const n = onlineCount(); wss.clients.forEach(c => sendWs(c, { t: 'count', n })); }, 15000);

// ---------------- başlat ----------------
(async () => {
  db = await DB.open();
  let admin = await db.getUser(ADMIN_USER);
  if (!admin) {
    admin = newUser('admin', ADMIN_PASSWORD, ''); admin.role = 'admin';
    admin.save = { tutorialDone: true, coins: 999999999 };
    await db.saveUser(admin);
    console.log(`Admin hesabı oluşturuldu (kullanıcı: admin, şifre: ${process.env.ADMIN_PASSWORD ? 'ADMIN_PASSWORD' : 'admin'})`);
  } else if (admin.role !== 'admin') { admin.role = 'admin'; await db.saveUser(admin); }
  if (!mail.configured()) console.log('E-posta servisi ayarlı değil: doğrulama kodları kayıtlara ve admin paneline yazılacak.');
  server.listen(PORT, () => console.log(`Mangala sunucusu çalışıyor: http://localhost:${PORT}`));
})();
