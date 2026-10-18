// =====================================================
//  Veritabanı katmanı
//  MONGODB_URI tanımlıysa MongoDB Atlas (kalıcı) kullanılır.
//  Tanımlı değilse data/db.json dosyası kullanılır (sadece yerel deneme için:
//  Render'ın ücretsiz planında bu dosya yeniden başlatmada SİLİNİR).
// =====================================================
const fs = require('fs');
const path = require('path');

const FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'db.json');

function fileDB() {
  let data = { users: {}, sessions: {} };
  try { data = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { }
  data.users = data.users || {}; data.sessions = data.sessions || {};
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
  const users = db.collection('users'), sessions = db.collection('sessions');
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
    async getSession(t) { const s = await sessions.findOne({ token: t }); if (!s || s.exp < Date.now()) return null; return { key: s.key, exp: s.exp }; },
    async setSession(t, s) { await sessions.replaceOne({ token: t }, { token: t, ...s, expAt: new Date(s.exp) }, { upsert: true }); },
    async delSession(t) { await sessions.deleteOne({ token: t }); },
    async delSessionsOf(key) { await sessions.deleteMany({ key }); }
  };
}

async function open() {
  if (process.env.MONGODB_URI) {
    try { const d = await mongoDB(process.env.MONGODB_URI); console.log('Veritabanı: MongoDB bağlandı ✓'); return d; }
    catch (e) { console.error('MongoDB bağlantısı başarısız, dosya veritabanına geçiliyor:', e.message); }
  } else console.log('Veritabanı: data/db.json (MONGODB_URI tanımlı değil — kalıcı değil!)');
  return fileDB();
}
module.exports = { open };
