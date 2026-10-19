// =====================================================
//  Veritabanı katmanı
//  MySQL bilgileri (GoDaddy) varsa MySQL, yoksa MONGODB_URI tanımlıysa MongoDB Atlas (kalıcı) kullanılır.
//  Tanımlı değilse data/db.json dosyası kullanılır (sadece yerel deneme için:
//  Render'ın ücretsiz planında bu dosya yeniden başlatmada SİLİNİR).
// =====================================================
const fs = require('fs');
const path = require('path');

const FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'db.json');

function fileDB() {
  let data = { users: {}, sessions: {}, meta: {} };
  try { data = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { }
  data.users = data.users || {}; data.sessions = data.sessions || {}; data.meta = data.meta || {};
  let timer = null;
  const flush = () => { clearTimeout(timer); timer = setTimeout(() => {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE + '.tmp', JSON.stringify(data)); fs.renameSync(FILE + '.tmp', FILE);
  }, 300); };
  const copy = o => o ? JSON.parse(JSON.stringify(o)) : null;
  return {
    kind: 'file',
    async getUser(key) { return copy(data.users[key]); },
    async findUserByEmail(email) { return copy(Object.values(data.users).find(u => u.email && u.email === email)); },
    async saveUser(u) { data.users[u.key] = copy(u); flush(); },
    async deleteUser(key) { delete data.users[key]; for (const [t, s] of Object.entries(data.sessions)) if (s.key === key) delete data.sessions[t]; flush(); },
    async listUsers(q, skip, limit) {
      let arr = Object.values(data.users);
      if (q) arr = arr.filter(u => u.key.includes(q) || (u.email || '').includes(q));
      arr.sort((a, b) => (b.lastLogin || 0) - (a.lastLogin || 0));
      return { total: arr.length, users: arr.slice(skip, skip + limit).map(copy) };
    },
    async topElo(n) { return Object.values(data.users).filter(u => (u.ranked && (u.ranked.w + u.ranked.l + u.ranked.d) > 0) && !u.banned).sort((a, b) => b.elo - a.elo).slice(0, n).map(copy); },
    async countUsers() { return Object.keys(data.users).length; },
    async renameUser(oldKey, newName) {
      const u = data.users[oldKey]; if (!u) return null; const nk = newName.toLowerCase();
      delete data.users[oldKey]; u.key = nk; u.name = newName; data.users[nk] = u;
      for (const s of Object.values(data.sessions)) if (s.key === oldKey) s.key = nk;
      flush(); return copy(u);
    },
    async getMeta(k) { return copy(data.meta[k] === undefined ? null : data.meta[k]); },
    async setMeta(k, v) { data.meta[k] = copy(v); flush(); },
    async getSession(t) { const s = data.sessions[t]; if (!s) return null; if (s.exp < Date.now()) { delete data.sessions[t]; flush(); return null; } return copy(s); },
    async setSession(t, s) { data.sessions[t] = s; flush(); },
    async delSession(t) { delete data.sessions[t]; flush(); },
    async delSessionsOf(key) { for (const [t, s] of Object.entries(data.sessions)) if (s.key === key) delete data.sessions[t]; flush(); }
  };
}

async function mongoDB(uri) {
  const { MongoClient } = require('mongodb');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'mangala');
  const users = db.collection('users'), sessions = db.collection('sessions'), meta = db.collection('meta');
  await users.createIndex({ key: 1 }, { unique: true });
  await users.createIndex({ email: 1 });
  await users.createIndex({ elo: -1 });
  await sessions.createIndex({ token: 1 }, { unique: true });
  await sessions.createIndex({ expAt: 1 }, { expireAfterSeconds: 0 });
  const strip = u => { if (u) delete u._id; return u; };
  return {
    kind: 'mongo',
    async getUser(key) { return strip(await users.findOne({ key })); },
    async findUserByEmail(email) { return strip(await users.findOne({ email })); },
    async saveUser(u) { const { _id, ...rest } = u; await users.replaceOne({ key: u.key }, rest, { upsert: true }); },
    async deleteUser(key) { await users.deleteOne({ key }); await sessions.deleteMany({ key }); },
    async listUsers(q, skip, limit) {
      const f = q ? { $or: [{ key: { $regex: q.replace(/[^a-z0-9_@.]/g, '') } }, { email: { $regex: q.replace(/[^a-z0-9_@.]/g, '') } }] } : {};
      const total = await users.countDocuments(f);
      const list = await users.find(f).sort({ lastLogin: -1 }).skip(skip).limit(limit).toArray();
      return { total, users: list.map(strip) };
    },
    async topElo(n) {
      return (await users.find({ banned: null, $expr: { $gt: [{ $add: ['$ranked.w', '$ranked.l', '$ranked.d'] }, 0] } }).sort({ elo: -1 }).limit(n).toArray()).map(strip);
    },
    async countUsers() { return users.countDocuments({}); },
    async renameUser(oldKey, newName) {
      const nk = newName.toLowerCase();
      await users.updateOne({ key: oldKey }, { $set: { key: nk, name: newName } });
      await sessions.updateMany({ key: oldKey }, { $set: { key: nk } });
      return strip(await users.findOne({ key: nk }));
    },
    async getMeta(k) { const d = await meta.findOne({ _id: k }); return d ? d.v : null; },
    async setMeta(k, v) { await meta.replaceOne({ _id: k }, { _id: k, v }, { upsert: true }); },
    async getSession(t) { const s = await sessions.findOne({ token: t }); if (!s || s.exp < Date.now()) return null; return { key: s.key, exp: s.exp }; },
    async setSession(t, s) { await sessions.replaceOne({ token: t }, { token: t, ...s, expAt: new Date(s.exp) }, { upsert: true }); },
    async delSession(t) { await sessions.deleteOne({ token: t }); },
    async delSessionsOf(key) { await sessions.deleteMany({ key }); }
  };
}

/* ---------- MySQL (GoDaddy Node.js Hosting'in yönetilen veritabanı) ----------
   GoDaddy konteynerden sadece 80/443 ve kendi MySQL'ine çıkışa izin verir (MongoDB Atlas'a ulaşılamaz).
   Bağlantı bilgileri ortam değişkenlerinden okunur; farklı adlandırmalar da tanınır. */
function mysqlConfig() {
  const e = process.env, keys = Object.keys(e);
  const url = [e.MYSQL_URL, e.MYSQL_URI, e.DATABASE_URL].find(v => v && /^mysql:\/\//i.test(v));
  if (url) return { uri: url, from: 'URL' };
  const pick = (names, re, not) => { for (const n of names) if (e[n]) return [n, e[n]];
    const k = re && keys.find(k => re.test(k) && !(not && not.test(k)) && e[k]); return k ? [k, e[k]] : [null, undefined]; };
  const [hk, host] = pick(['MYSQL_HOST', 'MYSQLHOST', 'DB_HOST', 'DATABASE_HOST'], /(MYSQL|DB|DATABASE).*HOST/i);
  if (!host) return null;
  const [pk, port] = pick(['MYSQL_PORT', 'MYSQLPORT', 'DB_PORT', 'DATABASE_PORT'], /(MYSQL|DB|DATABASE).*PORT/i);
  const [uk, user] = pick(['MYSQL_USER', 'MYSQL_USERNAME', 'MYSQLUSER', 'DB_USER', 'DB_USERNAME', 'DATABASE_USER', 'DATABASE_USERNAME'], /(MYSQL|DB|DATABASE).*USER/i);
  const [wk, password] = pick(['MYSQL_PASSWORD', 'MYSQLPASSWORD', 'MYSQL_PASS', 'DB_PASSWORD', 'DB_PASS', 'DATABASE_PASSWORD'], /(MYSQL|DB|DATABASE).*(PASS|PWD)/i);
  const [dk, database] = pick(['MYSQL_DATABASE', 'MYSQL_DB', 'MYSQLDATABASE', 'MYSQL_DB_NAME', 'DB_NAME', 'DB_DATABASE', 'DATABASE_NAME'], /(MYSQL|DB|DATABASE).*(NAME|DATABASE|_DB$)/i, /USER|HOST|PASS|PORT|URL/i);
  return { host, port: +port || 3306, user, password, database, from: [hk, pk, uk, wk, dk].filter(Boolean).join(', ') };
}

async function mysqlDB(cfg) {
  const mysql = require('mysql2/promise');
  const opts = cfg.uri ? { uri: cfg.uri } : { host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password, database: cfg.database };
  const pool = mysql.createPool({ ...opts, connectionLimit: 8, waitForConnections: true, charset: 'utf8mb4', enableKeepAlive: true,
    ...(process.env.MYSQL_SSL === '1' ? { ssl: { rejectUnauthorized: false } } : {}) });
  const q = async (sql, args = []) => (await pool.query(sql, args))[0];
  await q(`CREATE TABLE IF NOT EXISTS mg_users (k VARCHAR(40) NOT NULL PRIMARY KEY, email VARCHAR(190) NULL, elo INT NOT NULL DEFAULT 1000,
    rgames INT NOT NULL DEFAULT 0, banned TINYINT NOT NULL DEFAULT 0, last_login BIGINT NOT NULL DEFAULT 0, data MEDIUMTEXT NOT NULL,
    INDEX (email), INDEX (elo), INDEX (last_login)) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`);
  await q(`CREATE TABLE IF NOT EXISTS mg_sessions (token VARCHAR(100) NOT NULL PRIMARY KEY, k VARCHAR(40) NOT NULL, exp BIGINT NOT NULL, INDEX (k), INDEX (exp)) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`);
  await q(`CREATE TABLE IF NOT EXISTS mg_meta (k VARCHAR(40) NOT NULL PRIMARY KEY, v MEDIUMTEXT NOT NULL) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin`);
  setInterval(() => q('DELETE FROM mg_sessions WHERE exp < ?', [Date.now()]).catch(() => { }), 3600e3).unref();
  const row = r => r ? JSON.parse(r.data) : null;
  const games = u => u.ranked ? (u.ranked.w || 0) + (u.ranked.l || 0) + (u.ranked.d || 0) : 0;
  const save = async (u, conn = pool) => conn.query(`INSERT INTO mg_users (k, email, elo, rgames, banned, last_login, data) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE email = VALUES(email), elo = VALUES(elo), rgames = VALUES(rgames), banned = VALUES(banned), last_login = VALUES(last_login), data = VALUES(data)`,
    [u.key, u.email || null, u.elo || 1000, games(u), u.banned ? 1 : 0, u.lastLogin || 0, JSON.stringify(u)]);
  return {
    kind: 'mysql',
    async getUser(key) { return row((await q('SELECT data FROM mg_users WHERE k = ?', [key]))[0]); },
    async findUserByEmail(email) { return row((await q('SELECT data FROM mg_users WHERE email = ? LIMIT 1', [email]))[0]); },
    async saveUser(u) { await save(u); },
    async deleteUser(key) { await q('DELETE FROM mg_users WHERE k = ?', [key]); await q('DELETE FROM mg_sessions WHERE k = ?', [key]); },
    async listUsers(qs, skip, limit) {
      const s = String(qs || '').replace(/[^a-z0-9_@.]/g, ''), w = s ? 'WHERE k LIKE ? OR email LIKE ?' : '', a = s ? ['%' + s + '%', '%' + s + '%'] : [];
      const total = (await q(`SELECT COUNT(*) AS n FROM mg_users ${w}`, a))[0].n;
      const list = await q(`SELECT data FROM mg_users ${w} ORDER BY last_login DESC LIMIT ? OFFSET ?`, [...a, limit | 0, skip | 0]);
      return { total: Number(total), users: list.map(row) };
    },
    async topElo(n) { return (await q('SELECT data FROM mg_users WHERE rgames > 0 AND banned = 0 ORDER BY elo DESC LIMIT ?', [n | 0])).map(row); },
    async countUsers() { return Number((await q('SELECT COUNT(*) AS n FROM mg_users'))[0].n); },
    async renameUser(oldKey, newName) {
      const nk = newName.toLowerCase(), conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [[r]] = await conn.query('SELECT data FROM mg_users WHERE k = ? FOR UPDATE', [oldKey]);
        if (!r) { await conn.rollback(); return null; }
        const u = JSON.parse(r.data); u.key = nk; u.name = newName;
        await conn.query('DELETE FROM mg_users WHERE k = ?', [oldKey]); await save(u, conn);
        await conn.query('UPDATE mg_sessions SET k = ? WHERE k = ?', [nk, oldKey]);
        await conn.commit(); return u;
      } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    },
    async getMeta(k) { const r = (await q('SELECT v FROM mg_meta WHERE k = ?', [k]))[0]; return r ? JSON.parse(r.v) : null; },
    async setMeta(k, v) { await q('INSERT INTO mg_meta (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)', [k, JSON.stringify(v)]); },
    async getSession(t) { const r = (await q('SELECT k, exp FROM mg_sessions WHERE token = ?', [t]))[0]; if (!r || Number(r.exp) < Date.now()) return null; return { key: r.k, exp: Number(r.exp) }; },
    async setSession(t, s) { await q('INSERT INTO mg_sessions (token, k, exp) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE k = VALUES(k), exp = VALUES(exp)', [t, s.key, s.exp]); },
    async delSession(t) { await q('DELETE FROM mg_sessions WHERE token = ?', [t]); },
    async delSessionsOf(key) { await q('DELETE FROM mg_sessions WHERE k = ?', [key]); }
  };
}

async function open() {
  const my = mysqlConfig();
  if (my) {
    try { const d = await mysqlDB(my); console.log('Veritabanı: MySQL bağlandı ✓ (' + my.from + ')'); return d; }
    catch (e) { console.error('MySQL bağlantısı başarısız (' + my.from + '):', e.message); }
  }
  if (process.env.MONGODB_URI) {
    try { const d = await mongoDB(process.env.MONGODB_URI); console.log('Veritabanı: MongoDB bağlandı ✓'); return d; }
    catch (e) { console.error('MongoDB bağlantısı başarısız, dosya veritabanına geçiliyor:', e.message); }
  } else console.log('Veritabanı: data/db.json (MONGODB_URI tanımlı değil — kalıcı değil!)');
  return fileDB();
}
module.exports = { open };
