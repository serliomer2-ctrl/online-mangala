// =====================================================
//  Yönetim: ranklar & yetkiler, kayıtlar (audit),
//  kurucunun planladığı etkinlikler ve arayüz tasarımı
// =====================================================
const PERMS = ['panel', 'kick', 'warn', 'mute', 'ban', 'announce', 'rooms', 'audit', 'coins', 'xp', 'items', 'elo', 'setpw', 'rename',
  'resetprogress', 'delete', 'ranks', 'unlimited', 'events', 'ui', 'ranksEdit', 'config'];
const FOUNDER = 'kurucu';
const USER_RANK = { id: 'user', name: 'Oyuncu', en: 'Player', icon: '', color: '#c9b39a', level: 0, perms: [] };
const DEFAULT_RANKS = [
  { id: FOUNDER, name: 'Kurucu', en: 'Founder', icon: '👑', color: '#ff4d6d', level: 1000, perms: PERMS.slice(), locked: true },
  { id: 'admin', name: 'Admin', en: 'Admin', icon: '🛡️', color: '#e5534b', level: 100,
    perms: ['panel', 'kick', 'warn', 'mute', 'ban', 'announce', 'rooms', 'audit', 'coins', 'xp', 'items', 'elo', 'setpw', 'rename', 'resetprogress', 'delete', 'ranks', 'events'] },
  { id: 'moderator', name: 'Moderatör', en: 'Moderator', icon: '🔨', color: '#5aa9e6', level: 50, perms: ['panel', 'kick', 'warn', 'mute', 'ban', 'announce', 'rooms', 'audit'] },
  { id: 'destek', name: 'Destek', en: 'Support', icon: '💬', color: '#4cc38a', level: 30, perms: ['panel', 'warn', 'mute', 'rooms'] },
  { id: 'youtuber', name: 'YouTuber', en: 'YouTuber', icon: '▶️', color: '#ff3b3b', level: 10, perms: [] },
  { id: 'medya', name: 'Medya', en: 'Media', icon: '🎥', color: '#a77bf3', level: 10, perms: [] },
  { id: 'vip', name: 'VIP', en: 'VIP', icon: '💎', color: '#7bd3ff', level: 5, perms: [] }
];
const METRICS = ['win', 'play', 'even', 'empty', 'extra', 'hardwin', 'puzzle', 'blitz', 'party', 'emote', 'big', 'onlineplay'];
const CATS = ['boards', 'stones', 'hands', 'avatars', 'frames', 'emojis', 'msgs', 'bgs', 'wins'];
const SCREENS = ['', 'mode', 'bots', 'online', 'puzzles', 'shop', 'pass', 'events', 'profile', 'replay', 'rules', 'settings', 'tour'];
const COLORS = ['gold', 'purple', 'red', 'blue', 'green', 'dark'];
const ACCENTS = ['gold', 'ruby', 'emerald', 'sapphire', 'amethyst'];
const TILES = ['pass', 'event', 'quests', 'puzzles', 'shop', 'profile', 'replay', 'rules', 'settings'];

const str = (v, n) => String(v == null ? '' : v).replace(/[<>]/g, '').trim().slice(0, n);
const int = (v, a, b, d = a) => { const x = parseInt(v, 10); return Number.isFinite(x) ? Math.max(a, Math.min(b, x)) : d; };
const idOk = v => typeof v === 'string' && /^[a-z0-9_]{1,20}$/.test(v);

let ranks = DEFAULT_RANKS.map(r => ({ ...r }));
let events = [];
let ui = { hero: { title: '', sub: '' }, accent: 'gold', blocks: [], hidden: [] };
let config = {};   // kurucunun oyun ayarları: şans çarkı, mağaza indirimi, bulmaca çarpanı, duyuru şeridi
let audit = [];
let db, auditTimer;

async function load(_db) {
  db = _db;
  const r = await db.getMeta('ranks'); if (Array.isArray(r) && r.length) ranks = mergeFounder(r);
  const e = await db.getMeta('events'); if (Array.isArray(e)) events = e;
  const u = await db.getMeta('ui'); if (u && typeof u === 'object') ui = u;
  const a = await db.getMeta('audit'); if (Array.isArray(a)) audit = a;
  const c = await db.getMeta('config'); if (c && typeof c === 'object') config = c;
}
function mergeFounder(list) {
  const f = DEFAULT_RANKS[0];
  return [{ ...f }, ...list.filter(r => r.id !== FOUNDER && r.id !== 'user')];
}
const rankOf = u => (u && ranks.find(r => r.id === u.role)) || USER_RANK;
const level = u => rankOf(u).level;
const can = (u, p) => !!u && (u.role === FOUNDER || rankOf(u).perms.includes(p));
const unlimited = u => !!u && (!!u.unlimited || can(u, 'unlimited'));
const badge = u => { const r = rankOf(u); return r.level > 0 ? { id: r.id, name: r.name, en: r.en, icon: r.icon, color: r.color } : null; };
const publicRanks = () => ranks.map(r => ({ id: r.id, name: r.name, en: r.en, icon: r.icon, color: r.color, level: r.level, perms: r.perms, locked: !!r.locked }));
const content = () => ({ ranks: publicRanks(), events, ui, config });

function log(actor, action, target, detail) {
  audit.unshift({ at: Date.now(), by: actor ? actor.name : 'sistem', role: actor ? actor.role : '', action, target: target || '', detail: str(detail, 160) });
  audit = audit.slice(0, 500);
  clearTimeout(auditTimer); auditTimer = setTimeout(() => db.setMeta('audit', audit), 1500);
}

/* ---------- doğrulama ---------- */
function cleanRanks(list) {
  if (!Array.isArray(list)) return null;
  const seen = new Set(), out = [];
  for (const r of list.slice(0, 30)) {
    if (!r || !/^[a-z0-9_]{2,16}$/.test(r.id) || r.id === FOUNDER || r.id === 'user' || seen.has(r.id)) continue;
    seen.add(r.id);
    out.push({ id: r.id, name: str(r.name, 20) || r.id, en: str(r.en, 20) || str(r.name, 20) || r.id, icon: str(r.icon, 4),
      color: /^#[0-9a-f]{6}$/i.test(r.color) ? r.color : '#c9b39a', level: int(r.level, 1, 999, 10),
      perms: Array.isArray(r.perms) ? r.perms.filter(p => PERMS.includes(p) && p !== 'ranksEdit') : [] });
  }
  return mergeFounder(out);
}
function cleanEvents(list) {
  if (!Array.isArray(list)) return null;
  return list.slice(0, 40).map(e => {
    const start = int(e.start, 0, 4e12, Date.now()), end = Math.max(start + 60000, int(e.end, 0, 4e12, start + 7 * 864e5));
    const item = Array.isArray(e.reward && e.reward.item) && CATS.includes(e.reward.item[0]) && idOk(e.reward.item[1]) ? [e.reward.item[0], e.reward.item[1]] : null;
    return { id: typeof e.id === 'string' && /^[a-z0-9]{4,20}$/.test(e.id) ? e.id : Math.random().toString(36).slice(2, 10), name: str(e.name, 40) || 'Etkinlik', en: str(e.en, 40),
      icon: str(e.icon, 4) || '🎉', desc: str(e.desc, 220), den: str(e.den, 220), metric: METRICS.includes(e.metric) ? e.metric : 'win',
      goal: int(e.goal, 1, 1000, 5), start, end: Math.min(end, start + 120 * 864e5),
      reward: { coins: int(e.reward && e.reward.coins, 0, 100000, 0), xp: int(e.reward && e.reward.xp, 0, 100000, 0), item },
      coinMult: int(e.coinMult, 1, 5, 1), xpMult: int(e.xpMult, 1, 5, 1),
      shop: (Array.isArray(e.shop) ? e.shop : []).slice(0, 4).filter(s => Array.isArray(s) && CATS.includes(s[0]) && idOk(s[1])).map(s => [s[0], s[1], int(s[2], 0, 100000, 500)]) };
  });
}
function cleanUI(u) {
  if (!u || typeof u !== 'object') return null;
  return { hero: { title: str(u.hero && u.hero.title, 30), sub: str(u.hero && u.hero.sub, 80) }, accent: ACCENTS.includes(u.accent) ? u.accent : 'gold',
    hidden: (Array.isArray(u.hidden) ? u.hidden : []).filter(x => TILES.includes(x)),
    blocks: (Array.isArray(u.blocks) ? u.blocks : []).slice(0, 12).map(b => ({ type: ['banner', 'news', 'countdown', 'event', 'buttons'].includes(b.type) ? b.type : 'news',
      title: str(b.title, 60), text: str(b.text, 300), icon: str(b.icon, 4), color: COLORS.includes(b.color) ? b.color : 'gold',
      target: SCREENS.includes(b.target) ? b.target : '', btn: str(b.btn, 24), date: int(b.date, 0, 4e12, 0), eventId: str(b.eventId, 20),
      buttons: (Array.isArray(b.buttons) ? b.buttons : []).slice(0, 4).map(x => ({ label: str(x.label, 24), target: SCREENS.includes(x.target) ? x.target : 'mode', icon: str(x.icon, 4) })) })) };
}
function cleanConfig(c) {
  if (!c || typeof c !== 'object') return null;
  const wheel = (Array.isArray(c.wheel) ? c.wheel : []).slice(0, 12).map(p => !p || typeof p !== 'object' ? null
    : p.t === 'item' ? (CATS.includes(p.c) && idOk(p.id) ? { t: 'item', c: p.c, id: p.id, w: int(p.w, 1, 1000, 10) } : null)
    : p.t === 'coins' || p.t === 'xp' ? { t: p.t, n: int(p.n, 1, 100000, 100), w: int(p.w, 1, 1000, 10) } : null).filter(Boolean);
  if (wheel.length < 4) return null;
  const s = c.sale && typeof c.sale === 'object' ? c.sale : {};
  return { wheel, wheelCost: int(c.wheelCost, 0, 100000, 150), sale: { off: int(s.off, 0, 90, 0), end: int(s.end, 0, 4e12, 0) }, dpzMult: int(c.dpzMult, 1, 5, 1), ticker: str(c.ticker, 200) };
}
async function setConfig(c) { const x = cleanConfig(c); if (!x) return false; config = x; await db.setMeta('config', config); return true; }
async function setRanks(list) { const r = cleanRanks(list); if (!r) return false; ranks = r; await db.setMeta('ranks', ranks); return true; }
async function setEvents(list) { const e = cleanEvents(list); if (!e) return false; events = e; await db.setMeta('events', events); return true; }
async function setUI(u) { const c = cleanUI(u); if (!c) return false; ui = c; await db.setMeta('ui', ui); return true; }

module.exports = { PERMS, FOUNDER, METRICS, load, rankOf, level, can, unlimited, badge, publicRanks, content, log, setRanks, setEvents, setUI, setConfig,
  get audit() { return audit; }, get ranks() { return ranks; } };
