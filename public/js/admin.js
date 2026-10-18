/* =========================================================
   YÖNETİM PANELİ — her sekme ve işlem kişinin rank yetkilerine göre görünür
   Kurucu: ranklar, etkinlik planlayıcı, arayüz tasarımcısı + her şey
   ========================================================= */
const ADM = { tab: 'overview', q: '', page: 0, ranks: null, events: null, ui: null, dirty: {} };
const ADM_TABS = [['overview', '📊', 'Genel', 'panel'], ['users', '👥', 'Oyuncular', 'panel'], ['rooms', '🎮', 'Maçlar', 'rooms'], ['ranks', '🏅', 'Ranklar', 'ranksEdit'],
  ['events', '🎊', 'Etkinlik Planlayıcı', 'events'], ['ui', '🎨', 'Arayüz Tasarımcısı', 'ui'], ['audit', '📜', 'Kayıtlar', 'audit']];
const PERM_INFO = { panel: 'Yönetim paneline giriş', kick: 'Sunucudan atma', warn: 'Uyarı gönderme', mute: 'Susturma (emoji/mesaj)', ban: 'Banlama',
  announce: 'Herkese duyuru', rooms: 'Maçları görme/kapatma', audit: 'Yönetim kayıtlarını görme', coins: 'Para verme/alma', xp: 'XP verme', items: 'Eşya verme / botları açma',
  elo: 'Elo ayarlama', setpw: 'Şifre belirleme, e-posta ve kodları görme', rename: 'Kullanıcı adı değiştirme', resetprogress: 'İlerleme sıfırlama', delete: 'Hesap silme',
  ranks: 'Rank verme (kendinden düşük)', unlimited: 'Sınırsız para & tüm içerik açık', events: 'Etkinlik planlama', ui: 'Arayüz tasarımı', ranksEdit: 'Rank oluşturma/düzenleme' };
const METRIC_INFO = { win: 'Galibiyet', play: 'Oynanan oyun', even: 'Çift kuralı alımı', empty: 'Boş kuyu alımı', extra: 'Ekstra tur', hardwin: 'Zor rakip / çevrimiçi galibiyet',
  puzzle: 'Çözülen bulmaca', blitz: 'Yıldırım oyunu', party: 'Parti modu oyunu', emote: 'Gönderilen emoji/mesaj', big: '25+ taşla bitirme', onlineplay: 'Çevrimiçi oyun' };
const SCREEN_INFO = { '': '— (buton yok)', mode: '⚔️ Oyna', bots: '🤖 Botlar', online: '🌍 Çevrimiçi', puzzles: '🧩 Bulmacalar', shop: '🛒 Mağaza', pass: '🎫 Sezon Kartı',
  events: '🎊 Etkinlikler', profile: '👤 Profil', replay: '🎬 Tekrarlar', rules: '📜 Kurallar', settings: '⚙️ Ayarlar', tour: '🏆 Bot Turnuvası' };
const TILE_INFO = { pass: '🎫 Sezon Kartı', event: '🎊 Etkinlik', quests: '📋 Görevler', puzzles: '🧩 Bulmacalar', shop: '🛒 Mağaza', profile: '👤 Profil', replay: '🎬 Tekrarlar', rules: '📜 Kurallar', settings: '⚙️ Ayarlar' };
const COLOR_INFO = { gold: 'Altın', purple: 'Mor', red: 'Kırmızı', blue: 'Mavi', green: 'Yeşil', dark: 'Koyu' };
const ACCENT_INFO = { gold: ['Altın', '#f2c14e'], ruby: ['Yakut', '#ff6b6b'], emerald: ['Zümrüt', '#4cd38a'], sapphire: ['Safir', '#6fb5ff'], amethyst: ['Ametist', '#b98cff'] };
const BLOCK_INFO = { banner: ['🖼️', 'Büyük Afiş', 'Başlık, yazı ve bir butonla dikkat çekici kart'], news: ['📰', 'Haber Kartı', 'Kısa duyuru / güncelleme notu'],
  countdown: ['⏳', 'Geri Sayım', 'Bir tarihe kadar canlı sayaç'], event: ['🎊', 'Etkinlik Kartı', 'Aktif etkinliği ilerlemesiyle gösterir'], buttons: ['🔘', 'Hızlı Butonlar', '4 taneye kadar kısayol butonu'] };
const EVENT_TEMPLATES = [
  { icon: '🎊', name: 'Çift Kuralı Festivali', en: 'Even Rule Festival', desc: 'Çift sayı kuralıyla taş al, büyük ödülü kap!', metric: 'even', goal: 15, reward: { coins: 300, xp: 200 }, days: 7 },
  { icon: '💰', name: '2x Para Hafta Sonu', en: 'Double Coin Weekend', desc: 'Tüm oyunlardan 2 kat para!', metric: 'play', goal: 5, reward: { coins: 200, xp: 0 }, coinMult: 2, days: 2 },
  { icon: '⭐', name: 'XP Yağmuru', en: 'XP Shower', desc: 'Tüm oyunlardan 2 kat XP!', metric: 'win', goal: 5, reward: { coins: 150, xp: 300 }, xpMult: 2, days: 3 },
  { icon: '🧩', name: 'Bulmaca Maratonu', en: 'Puzzle Marathon', desc: 'Bulmacaları çöz, zekânı göster!', metric: 'puzzle', goal: 5, reward: { coins: 400, xp: 200 }, days: 7 },
  { icon: '⚡', name: 'Yıldırım Kupası', en: 'Blitz Cup', desc: 'Yıldırım modunda oyna!', metric: 'blitz', goal: 5, reward: { coins: 300, xp: 200 }, days: 5 },
  { icon: '🌍', name: 'Çevrimiçi Savaşları', en: 'Online Wars', desc: 'Gerçek oyunculara karşı oyna!', metric: 'onlineplay', goal: 5, reward: { coins: 400, xp: 300 }, days: 7 },
  { icon: '🎉', name: 'Yeni Etkinlik', en: 'New Event', desc: '', metric: 'win', goal: 3, reward: { coins: 100, xp: 100 }, days: 3 }
];
const clone = o => JSON.parse(JSON.stringify(o));
const toLocalInput = ms => { const d = new Date(ms); return new Date(ms - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const fromLocalInput = v => new Date(v).getTime();
const fmtDT = ms => ms ? new Date(ms).toLocaleString(LANG === 'en' ? 'en-GB' : 'tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '-';
const opt = (o, cur) => Object.entries(o).map(([k, v]) => `<option value="${esc(k)}" ${k === cur ? 'selected' : ''}>${esc(Array.isArray(v) ? v[0] + ' ' + v[1] : v)}</option>`).join('');
const itemOpts = (cat, cur) => Object.entries(CAT[cat] || {}).map(([id, it]) => `<option value="${id}" ${id === cur ? 'selected' : ''}>${esc(nm(it))}${it.src ? ' (' + it.src + ')' : ''}</option>`).join('');
const catOpts = cur => opt({ boards: 'Tahta', stones: 'Taş', hands: 'El', avatars: 'Avatar', frames: 'Çerçeve', emojis: 'Emoji paketi', msgs: 'Mesaj paketi' }, cur);

RENDER.admin = async () => {
  if (!can('panel')) return go('menu');
  const me = AUTH.user, tabs = ADM_TABS.filter(x => can(x[3]));
  if (!tabs.some(x => x[0] === ADM.tab)) ADM.tab = 'overview';
  $('scr-admin').innerHTML = `<button class="btn sec sm back" onclick="go('menu')">← ${t('Menü')}</button>
    <h2>${me.rank ? me.rank.icon : '🛡️'} ${t('Yönetim Paneli')} <span style="font-size:15px">${rankBadge(me.rank)}</span></h2>
    <div class="tabs">${tabs.map(([k, ic, n]) => `<button class="tab ${ADM.tab === k ? 'on' : ''}" onclick="ADM.tab='${k}';RENDER.admin()">${ic} ${t(n)}</button>`).join('')}</div>
    <div id="admbody"><div class="spinner"></div></div>`;
  try { await ({ overview: admOverview, users: admUsers, rooms: admRooms, ranks: admRanks, events: admEvents, ui: admUI, audit: admAudit }[ADM.tab])($('admbody')); }
  catch (e) { console.error(e); $('admbody').innerHTML = `<p class="err">${t('Sunucuya ulaşılamadı.')}</p>`; }
};
async function admPost(action, body) {
  const { s, j } = await api('POST', '/api/admin/' + action, body);
  if (s === 200) { toast('✅ ' + t('Tamam')); Sound.sfx.click(); } else { toast('❌ ' + (j.error || ''), 4000); Sound.sfx.error(); }
  return s === 200 ? j : null;
}

/* ---------- Genel ---------- */
async function admOverview(el) {
  const { s, j } = await api('GET', '/api/admin/stats'); if (s !== 200) throw new Error();
  const me = AUTH.user;
  el.innerHTML = `<div class="stat-grid"><div class="stat"><b>${j.users}</b>${t('Kayıtlı oyuncu')}</div><div class="stat"><b>${j.online}</b>${t('Şu an bağlı')}</div><div class="stat"><b>${j.rooms}</b>${t('Canlı maç')}</div>
      <div class="stat"><b>${j.tours}</b>${t('Turnuva')}</div><div class="stat"><b>${j.db === 'mongo' ? '✅ MongoDB' : '⚠️ ' + t('Dosya')}</b>${t('Veritabanı')}</div><div class="stat"><b>${j.mail ? '✅' : '⚠️ ' + t('Kapalı')}</b>${t('E-posta servisi')}</div></div>
    ${j.db !== 'mongo' ? `<p class="small" style="color:var(--gold)">⚠️ ${t('Veritabanı dosyada: ücretsiz Render sunucusu yeniden başlarsa hesaplar silinir. KURULUM.md\'deki MongoDB adımını yap.')}</p>` : ''}
    <div class="sec-title"><h3>🔑 ${t('Yetkilerin')}</h3></div>
    <div class="card"><div class="row">${rankBadge(me.rank)} ${me.unlimited ? `<span class="badge">∞ ${t('Sınırsız para')}</span>` : ''}</div>
      <div class="perms" style="margin-top:10px">${(me.perms || []).map(p => `<span class="perm on">✓ ${esc(t(PERM_INFO[p] || p))}</span>`).join('')}</div></div>
    ${j.codes && j.codes.length ? `<div class="sec-title"><h3>📧 ${t('Bekleyen e-posta kodları')}</h3></div><div class="card"><p class="muted small" style="margin-top:0">${t('E-posta servisi kurulu olmadığı için kodlar burada görünür. Oyuncuya kodu sen ilet.')}</p>${j.codes.map(c => `<div class="lrow"><div class="grow"><b>${esc(c.user)} · ${{ reset: t('Şifre sıfırlama'), verify: t('E-posta doğrulama'), rename: t('Kullanıcı adı değişikliği') }[c.kind] || c.kind}</b><span class="muted small">${esc(c.email)} · ${t('{0} dk kaldı', c.left)}</span></div><b style="font-size:22px;letter-spacing:4px;color:var(--gold)">${c.code}</b></div>`).join('')}</div>` : ''}
    ${can('announce') ? `<div class="sec-title"><h3>📢 ${t('Duyuru gönder')}</h3></div><div class="card row"><input class="inp" id="adm-ann" maxlength="200" placeholder="${t('Tüm bağlı oyunculara mesaj...')}" style="flex:1;min-width:200px"><button class="btn sm" onclick="admPost('announce',{msg:$('adm-ann').value}).then(r=>r&&($('adm-ann').value=''))">${t('Gönder')}</button></div>` : ''}`;
}

/* ---------- Oyuncular ---------- */
async function admUsers(el) {
  const { s, j } = await api('GET', `/api/admin/users?q=${encodeURIComponent(ADM.q)}&page=${ADM.page}`); if (s !== 200) throw new Error();
  el.innerHTML = `<div class="row" style="margin-bottom:10px"><input class="inp" id="adm-q" placeholder="${t('Kullanıcı adı veya e-posta ara...')}" value="${esc(ADM.q)}" style="max-width:280px" onkeydown="if(event.key==='Enter'){ADM.q=this.value.trim().toLowerCase();ADM.page=0;RENDER.admin()}"><button class="btn sm sec" onclick="ADM.q=$('adm-q').value.trim().toLowerCase();ADM.page=0;RENDER.admin()">🔍</button><span class="muted">${j.total} ${t('oyuncu')}</span></div>
    <div class="card tscroll"><table class="atable"><tr><th>${t('Oyuncu')}</th><th>${t('Rank')}</th><th>🪙</th><th>XP</th><th>Elo</th><th>${t('Son giriş')}</th><th>${t('Durum')}</th></tr>
    ${j.users.map(u => `<tr class="arow" onclick="admUser('${esc(u.name)}')"><td>${u.online ? '<span class="on-dot"></span>' : ''}<b>${esc(u.name)}</b><br><span class="muted small">${esc(u.email || '')}${u.emailVerified ? ' ✓' : ''}</span></td>
      <td>${rankBadge(u.rank) || '<span class="muted small">' + t('Oyuncu') + '</span>'}</td><td>${u.unlimited ? '∞' : u.coins}</td><td>${u.xp}</td><td>${u.elo}</td><td class="small">${fmtDT(u.lastLogin)}</td>
      <td>${u.banned ? `<span class="ban">⛔ ${u.banned.until ? fmtDT(u.banned.until) : t('süresiz')}</span>` : u.muted ? '🔇' : '<span class="okmsg">✓</span>'}${u.warns ? ` <span class="badge">⚠️${u.warns}</span>` : ''}</td></tr>`).join('')}</table>
    <div class="row center" style="margin-top:10px"><button class="btn xs sec" ${ADM.page ? '' : 'disabled'} onclick="ADM.page--;RENDER.admin()">◀</button><span class="muted">${ADM.page + 1}</span><button class="btn xs sec" ${(ADM.page + 1) * 25 < j.total ? '' : 'disabled'} onclick="ADM.page++;RENDER.admin()">▶</button></div></div>
    <p class="muted small">💡 ${t('Bir oyuncuya tıkla: yetkine göre para/XP/eşya verme, uyarı, susturma, ban, rank verme ve daha fazlası.')}</p>`;
}
async function admUser(name) {
  const { s, j: u } = await api('GET', '/api/admin/user?name=' + encodeURIComponent(name));
  if (s !== 200) return toast('❌ ' + (u.error || ''));
  const ok = p => can(p) && u.canAct, T = u.totals || {};
  const myLevel = AUTH.user.level, founder = AUTH.user.role === 'kurucu';
  const assignable = (CONTENT.ranks || []).filter(r => r.id !== 'kurucu' && (founder || r.level < myLevel));
  const sec = (title, body) => `<div class="admsec"><b>${title}</b>${body}</div>`;
  const row = (...x) => `<div class="row" style="margin-top:6px;flex-wrap:wrap">${x.join('')}</div>`;
  const N = esc(u.name).replace(/'/g, '');
  const parts = [];
  if (ok('coins')) parts.push(sec('🪙 ' + t('Para'), row(`<input class="inp" id="ad-c" type="number" value="500" style="width:120px">`, `<button class="btn xs" onclick="admDo('coins',{amount:+$('ad-c').value})">${t('Ver')}</button>`, `<button class="btn xs sec" onclick="admDo('coins',{amount:-Math.abs(+$('ad-c').value)})">${t('Al')}</button>`)));
  if (ok('xp')) parts.push(sec('⭐ XP', row(`<input class="inp" id="ad-x" type="number" value="500" style="width:120px">`, `<button class="btn xs" onclick="admDo('xp',{amount:+$('ad-x').value})">${t('Ver')}</button>`)));
  if (ok('items')) parts.push(sec('🎁 ' + t('Eşya'), row(`<select class="inp" id="ad-ic" style="width:150px" onchange="$('ad-ii').innerHTML=itemOpts(this.value)">${catOpts('boards')}</select>`, `<select class="inp" id="ad-ii" style="width:190px">${itemOpts('boards')}</select>`,
    `<button class="btn xs" onclick="admDo('item',{cat:$('ad-ic').value,id:$('ad-ii').value})">${t('Ver')}</button>`, `<button class="btn xs sec" onclick="admDo('item',{bots:true})">🤖 ${t('Tüm botları aç')}</button>`)));
  if (ok('elo')) parts.push(sec('🏅 Elo', row(`<input class="inp" id="ad-e" type="number" value="${u.elo}" style="width:120px">`, `<button class="btn xs" onclick="admDo('elo',{elo:+$('ad-e').value})">${t('Ayarla')}</button>`)));
  if (ok('ranks') && !u.self) parts.push(sec('🎖️ ' + t('Rank'), row(`<select class="inp" id="ad-r" style="width:200px"><option value="user">${t('Oyuncu')} (${t('rank yok')})</option>${assignable.map(r => `<option value="${r.id}" ${r.id === u.role ? 'selected' : ''}>${esc(r.icon + ' ' + nm(r))} (${r.level})</option>`).join('')}</select>`, `<button class="btn xs" onclick="admDo('role',{role:$('ad-r').value})">${t('Ver')}</button>`)));
  if (can('ranksEdit') && u.canAct) parts.push(sec('∞ ' + t('Sınırsız para (test hesabı gibi)'), row(`<button class="switch ${u.ownUnlimited ? 'on' : ''}" onclick="admDo('unlimited',{on:${!u.ownUnlimited}})"></button>`, `<span class="muted small">${t('Sadece bu oyuncuya özel. Ranka sınırsız vermek için Ranklar sekmesini kullan.')}</span>`)));
  if (ok('warn')) parts.push(sec('⚠️ ' + t('Uyarı gönder'), row(`<input class="inp" id="ad-w" maxlength="200" placeholder="${t('Uyarı mesajı')}" style="flex:1;min-width:200px">`, `<button class="btn xs" onclick="admDo('warn',{msg:$('ad-w').value})">${t('Gönder')}</button>`)
    + (u.warns.length ? `<div class="small muted" style="margin-top:6px">${u.warns.slice(-5).reverse().map(w => `• ${fmtDT(w.at)} — ${esc(w.by)}: ${esc(w.msg)}`).join('<br>')}</div>` : '')));
  if (ok('mute') && !u.self) parts.push(sec('🔇 ' + t('Susturma'), u.muted ? row(`<span>${t('Susturulmuş')}: ${u.muted === -1 ? t('süresiz') : fmtDT(u.muted)}</span>`, `<button class="btn xs green" onclick="admDo('unmute',{})">${t('Kaldır')}</button>`)
    : row(`<input class="inp" id="ad-m" type="number" value="60" style="width:100px"> <span class="muted small">${t('dk (0=süresiz)')}</span>`, `<button class="btn xs" onclick="admDo('mute',{minutes:+$('ad-m').value})">${t('Sustur')}</button>`)));
  if (ok('ban') && !u.self) parts.push(sec('⛔ Ban', u.banned ? row(`<span class="ban">${u.banned.until ? fmtDT(u.banned.until) : t('süresiz')} · ${esc(u.banned.reason || '')} (${esc(u.banned.by || '')})</span>`, `<button class="btn xs green" onclick="admDo('unban',{})">${t('Banı kaldır')}</button>`)
    : row(`<input class="inp" id="ad-bm" type="number" value="1440" style="width:100px"> <span class="muted small">${t('dk (0=süresiz)')}</span>`, `<input class="inp" id="ad-br" placeholder="${t('Sebep (isteğe bağlı)')}" style="width:180px">`, `<button class="btn xs red" onclick="admDo('ban',{minutes:+$('ad-bm').value,reason:$('ad-br').value})">${t('Banla')}</button>`)));
  const misc = [];
  if (ok('kick') && !u.self) misc.push(`<button class="btn xs sec" onclick="admDo('kick',{})">👢 ${t('Sunucudan at')}</button>`);
  if (ok('setpw')) misc.push(`<button class="btn xs sec" onclick="admPrompt('setpw','password','${t('Yeni şifre (en az 6)')}')">🔑 ${t('Şifre belirle')}</button>`);
  if (ok('rename')) misc.push(`<button class="btn xs sec" onclick="admPrompt('rename','newName','${t('Yeni kullanıcı adı')}')">✏️ ${t('Adını değiştir')}</button>`);
  if (ok('resetprogress')) misc.push(`<button class="btn xs sec" onclick="admConfirm2('resetprogress','${t('Tüm ilerlemesi sıfırlanacak.')}')">♻️ ${t('İlerlemeyi sıfırla')}</button>`);
  if (ok('delete') && !u.self) misc.push(`<button class="btn xs red" onclick="admConfirm2('delete','${t('Hesap kalıcı olarak silinecek.')}')">🗑️ ${t('Hesabı sil')}</button>`);
  if (misc.length) parts.push(sec('🧰 ' + t('Diğer'), row(...misc)));
  window._admName = u.name;
  modal(`<div style="text-align:left"><h3 style="text-align:center">${u.online ? '<span class="on-dot"></span>' : ''}${esc(u.name)} ${rankBadge(u.rank)}</h3>
    <p class="muted small" style="text-align:center">${esc(u.email || t('e-posta yok'))}${u.emailVerified ? ' ✓' : ''} · ${t('Kayıt')}: ${fmtDT(u.created)} · ${t('Son giriş')}: ${fmtDT(u.lastLogin)}</p>
    <div class="stat-grid"><div class="stat"><b>${u.unlimited ? '∞' : u.coins}</b>🪙</div><div class="stat"><b>${t('Sv')} ${levelInfo(u.xp).L}</b>${u.xp} XP</div><div class="stat"><b>${u.elo}</b>Elo</div>
      <div class="stat"><b>${T.games || 0}</b>${t('Toplam oyun')}</div><div class="stat"><b>${u.achs}</b>${t('Başarımlar')}</div><div class="stat"><b>${u.items}</b>${t('Eşya')}</div></div>
    ${!u.canAct ? `<p class="err">🔒 ${t('Bu oyuncu seninle aynı veya daha yüksek rankta; işlem yapamazsın.')}</p>` : parts.length ? parts.join('') : `<p class="muted">${t('Bu oyuncu için kullanabileceğin bir işlem yok.')}</p>`}</div>`,
    [{ label: t('Kapat'), cls: 'sec', value: 1 }]).then(() => { if (curScreen === 'admin' && ADM.tab === 'users') RENDER.admin(); });
}
async function admDo(action, body) { const r = await admPost(action, { username: window._admName, ...body }); if (r) { if (action === 'delete') { closeModal(); RENDER.admin(); } else admUser(window._admName); } }
async function admPrompt(action, field, ph) { const v = await promptModal(`<h3>${esc(window._admName)}</h3>`, [{ id: 'ap', ph }], t('Kaydet')); if (v && v.ap) { const r = await admPost(action, { username: window._admName, [field]: v.ap }); if (r && action === 'rename') window._admName = v.ap; } admUser(window._admName); }
async function admConfirm2(action, msg) { const ok = await modal(`<div class="big">⚠️</div><h3>${esc(window._admName)}</h3><p>${msg}</p>`, [{ label: t('Vazgeç'), cls: 'sec', value: false }, { label: t('Onayla'), cls: 'red', value: true }]); if (ok) admDo(action, {}); else admUser(window._admName); }

/* ---------- Maçlar ---------- */
async function admRooms(el) {
  const { j } = await api('GET', '/api/admin/rooms');
  el.innerHTML = `<div class="row" style="margin-bottom:10px"><button class="btn xs sec" onclick="RENDER.admin()">🔄 ${t('Yenile')}</button></div><div class="list">${(j.rooms || []).map(r => `<div class="lrow"><div class="grow"><b>${esc(r.names[0])} ${r.scores[0]} – ${r.scores[1]} ${esc(r.names[1])}</b><span class="muted small">${nm(MODES[r.mode])} · ${r.qmode} · ${r.code}${r.specs ? ' · 👁️ ' + r.specs : ''}</span></div>
    <button class="btn xs sec" onclick="spectate('${r.code}')">👁️</button><button class="btn xs red" onclick="admPost('closeroom',{code:'${r.code}'}).then(()=>RENDER.admin())">✖</button></div>`).join('') || `<p class="muted">${t('Şu an maç yok.')}</p>`}</div>`;
}

/* ---------- Ranklar (kurucu) ---------- */
async function admRanks(el) {
  if (!ADM.ranks) { await loadContent(); ADM.ranks = clone(CONTENT.ranks || []); }
  const R = ADM.ranks;
  el.innerHTML = `<p class="muted">${t('Rankların adını, simgesini, rengini, seviyesini ve yetkilerini düzenle. Yüksek seviye düşük seviyeyi yönetir. Kurucu rankı kilitlidir ve her yetkiye sahiptir.')}</p>
    <div class="row" style="margin-bottom:10px"><button class="btn sm" onclick="admRankAdd()">➕ ${t('Yeni Rank')}</button><button class="btn sm green" onclick="admRankSave()">💾 ${t('Kaydet')}</button><button class="btn sm sec" onclick="ADM.ranks=null;RENDER.admin()">↩️ ${t('Değişiklikleri at')}</button></div>
    ${R.map((r, i) => r.locked ? `<div class="card admrank"><div class="row between"><span style="font-size:18px">${rankBadge(r)}</span><span class="muted small">🔒 ${t('Seviye')} ${r.level} · ${t('tüm yetkiler')}</span></div></div>` : `
    <div class="card admrank"><div class="row between"><span style="font-size:18px">${rankBadge(r)}</span><button class="btn xs red" onclick="ADM.ranks.splice(${i},1);RENDER.admin()">🗑️</button></div>
      <div class="row" style="margin-top:8px">
        <label class="mini-f">ID<input class="inp" value="${esc(r.id)}" maxlength="16" onchange="ADM.ranks[${i}].id=this.value.toLowerCase().replace(/[^a-z0-9_]/g,'')"></label>
        <label class="mini-f">${t('Ad')}<input class="inp" value="${esc(r.name)}" maxlength="20" onchange="ADM.ranks[${i}].name=this.value;RENDER.admin()"></label>
        <label class="mini-f">${t('İngilizce ad')}<input class="inp" value="${esc(r.en || '')}" maxlength="20" onchange="ADM.ranks[${i}].en=this.value"></label>
        <label class="mini-f" style="width:70px">${t('Simge')}<input class="inp" value="${esc(r.icon || '')}" maxlength="4" onchange="ADM.ranks[${i}].icon=this.value;RENDER.admin()"></label>
        <label class="mini-f" style="width:70px">${t('Renk')}<input type="color" class="inp" style="padding:2px;height:42px" value="${r.color}" onchange="ADM.ranks[${i}].color=this.value;RENDER.admin()"></label>
        <label class="mini-f" style="width:90px">${t('Seviye')}<input class="inp" type="number" min="1" max="999" value="${r.level}" onchange="ADM.ranks[${i}].level=+this.value"></label></div>
      <div class="perms" style="margin-top:8px">${Object.keys(PERM_INFO).filter(p => p !== 'ranksEdit').map(p => `<button class="perm ${r.perms.includes(p) ? 'on' : ''}" onclick="admPerm(${i},'${p}')">${r.perms.includes(p) ? '✓' : '＋'} ${esc(t(PERM_INFO[p]))}</button>`).join('')}</div></div>`).join('')}`;
}
function admPerm(i, p) { const r = ADM.ranks[i]; r.perms = r.perms.includes(p) ? r.perms.filter(x => x !== p) : [...r.perms, p]; if (p !== 'panel' && r.perms.length && !r.perms.includes('panel') && !['unlimited'].includes(p)) r.perms.push('panel'); RENDER.admin(); }
function admRankAdd() { ADM.ranks.push({ id: 'rank' + Math.floor(Math.random() * 1000), name: 'Yeni Rank', en: 'New Rank', icon: '⭐', color: '#f2c14e', level: 20, perms: [] }); RENDER.admin(); }
async function admRankSave() { const r = await admPost('ranks', { ranks: ADM.ranks.filter(x => !x.locked) }); if (r) { CONTENT.ranks = r.ranks; lsSet('mangala_content', CONTENT); ADM.ranks = clone(r.ranks); RENDER.admin(); } }

/* ---------- Etkinlik planlayıcı ---------- */
async function admEvents(el) {
  if (!ADM.events) { await loadContent(); ADM.events = clone(CONTENT.events || []); }
  const E = ADM.events, n = Date.now();
  const status = e => e.end <= n ? `<span class="badge" style="opacity:.6">⏹ ${t('Bitti')}</span>` : e.start > n ? `<span class="badge">📅 ${t('Planlandı')} · ${fmtLeft(e.start - n)}</span>` : `<span class="badge" style="color:var(--green);border-color:var(--green)">🟢 ${t('Aktif')} · ${t('kalan')} ${fmtLeft(e.end - n)}</span>`;
  const f = (i, k, v, extra = '') => `onchange="admEv(${i},'${k}',${v})" ${extra}`;
  el.innerHTML = `<p class="muted">${t('Hazır şablonlardan etkinlik ekle, tarihleri ayarla, süreyi kısalt/uzat. Aktif etkinlik oyunculara anında gösterilir (aynı anda birden fazla aktifse en erken biten öne çıkar). Planlanmış etkinlik yoksa haftalık otomatik etkinlik çalışır.')}</p>
    <div class="sec-title"><h3>🧩 ${t('Hazır şablonlar')}</h3></div>
    <div class="row">${EVENT_TEMPLATES.map((tp, k) => `<button class="chip" onclick="admEvAdd(${k})">${tp.icon} ${esc(tp.name)}<small>${esc(METRIC_INFO[tp.metric])} × ${tp.goal} · ${tp.days} ${t('gün')}${tp.coinMult ? ' · 🪙x' + tp.coinMult : ''}${tp.xpMult ? ' · XPx' + tp.xpMult : ''}</small></button>`).join('')}</div>
    <div class="row" style="margin:14px 0"><button class="btn green" onclick="admEvSave()">💾 ${t('Etkinlikleri Kaydet')}</button><button class="btn sm sec" onclick="ADM.events=null;RENDER.admin()">↩️ ${t('Değişiklikleri at')}</button></div>
    ${E.length ? '' : `<p class="muted">${t('Henüz planlanmış etkinlik yok.')}</p>`}
    ${E.map((e, i) => `<div class="card admev"><div class="row between"><span style="font-size:20px"><b>${esc(e.icon)} ${esc(e.name)}</b></span>${status(e)}</div>
      <div class="row" style="margin-top:8px">
        <label class="mini-f" style="width:70px">${t('Simge')}<input class="inp" value="${esc(e.icon)}" maxlength="4" ${f(i, 'icon', 'this.value')}></label>
        <label class="mini-f">${t('Ad')}<input class="inp" value="${esc(e.name)}" maxlength="40" ${f(i, 'name', 'this.value')}></label>
        <label class="mini-f">${t('İngilizce ad')}<input class="inp" value="${esc(e.en || '')}" maxlength="40" ${f(i, 'en', 'this.value')}></label></div>
      <label class="mini-f" style="width:100%">${t('Açıklama')}<input class="inp" value="${esc(e.desc || '')}" maxlength="220" ${f(i, 'desc', 'this.value')}></label>
      <div class="row">
        <label class="mini-f">${t('Hedef türü')}<select class="inp" ${f(i, 'metric', 'this.value')}>${opt(METRIC_INFO, e.metric)}</select></label>
        <label class="mini-f" style="width:90px">${t('Hedef')}<input class="inp" type="number" min="1" value="${e.goal}" ${f(i, 'goal', '+this.value')}></label>
        <label class="mini-f" style="width:110px">${t('Ödül')} 🪙<input class="inp" type="number" min="0" value="${e.reward.coins || 0}" ${f(i, 'reward.coins', '+this.value')}></label>
        <label class="mini-f" style="width:110px">${t('Ödül')} XP<input class="inp" type="number" min="0" value="${e.reward.xp || 0}" ${f(i, 'reward.xp', '+this.value')}></label>
        <label class="mini-f" style="width:100px">🪙 ${t('çarpanı')}<select class="inp" ${f(i, 'coinMult', '+this.value')}>${[1, 2, 3, 4, 5].map(x => `<option ${x === e.coinMult ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <label class="mini-f" style="width:100px">XP ${t('çarpanı')}<select class="inp" ${f(i, 'xpMult', '+this.value')}>${[1, 2, 3, 4, 5].map(x => `<option ${x === e.xpMult ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div>
      <div class="row">
        <label class="mini-f">${t('Ödül eşyası')}<select class="inp" onchange="admEvItem(${i},this.value,null)"><option value="">— ${t('yok')} —</option>${catOpts(e.reward.item ? e.reward.item[0] : '')}</select></label>
        ${e.reward.item ? `<label class="mini-f">&nbsp;<select class="inp" onchange="admEvItem(${i},null,this.value)">${itemOpts(e.reward.item[0], e.reward.item[1])}</select></label>` : ''}
        <label class="mini-f">${t('Başlangıç')}<input class="inp" type="datetime-local" value="${toLocalInput(e.start)}" ${f(i, 'start', 'fromLocalInput(this.value)')}></label>
        <label class="mini-f">${t('Bitiş')}<input class="inp" type="datetime-local" value="${toLocalInput(e.end)}" ${f(i, 'end', 'fromLocalInput(this.value)')}></label></div>
      <div class="small muted" style="margin-top:8px">🛒 ${t('Etkinlik mağazası (en fazla 4 ürün, özel fiyat)')}</div>
      ${(e.shop || []).map((sh, k) => `<div class="row" style="margin-top:4px"><select class="inp" style="width:140px" onchange="ADM.events[${i}].shop[${k}]=[this.value,Object.keys(CAT[this.value])[0],${sh[2]}];RENDER.admin()">${catOpts(sh[0])}</select>
        <select class="inp" style="width:190px" onchange="ADM.events[${i}].shop[${k}][1]=this.value">${itemOpts(sh[0], sh[1])}</select><input class="inp" type="number" min="0" style="width:100px" value="${sh[2]}" onchange="ADM.events[${i}].shop[${k}][2]=+this.value"> 🪙
        <button class="btn xs red" onclick="ADM.events[${i}].shop.splice(${k},1);RENDER.admin()">✖</button></div>`).join('')}
      ${(e.shop || []).length < 4 ? `<button class="btn xs sec" style="margin-top:6px" onclick="(ADM.events[${i}].shop=ADM.events[${i}].shop||[]).push(['avatars','kartal',800]);RENDER.admin()">➕ ${t('Ürün ekle')}</button>` : ''}
      <div class="row" style="margin-top:10px">
        <button class="btn xs" onclick="admEvTime(${i},'now')">▶ ${t('Şimdi başlat')}</button>
        <button class="btn xs sec" onclick="admEvTime(${i},-864e5)">⏪ ${t('Süreyi 1 gün kısalt')}</button>
        <button class="btn xs sec" onclick="admEvTime(${i},-36e5)">−1 ${t('saat')}</button>
        <button class="btn xs sec" onclick="admEvTime(${i},36e5)">+1 ${t('saat')}</button>
        <button class="btn xs sec" onclick="admEvTime(${i},864e5)">⏩ ${t('1 gün uzat')}</button>
        <button class="btn xs sec" onclick="admEvTime(${i},'end')">⏹ ${t('Şimdi bitir')}</button>
        <button class="btn xs sec" onclick="ADM.events.splice(${i+1},0,{...clone(ADM.events[${i}]),id:''});RENDER.admin()">📄 ${t('Kopyala')}</button>
        <button class="btn xs red" onclick="ADM.events.splice(${i},1);RENDER.admin()">🗑️ ${t('Sil')}</button></div></div>`).join('')}`;
}
function admEv(i, k, v) { const e = ADM.events[i]; if (k.includes('.')) { const [a, b] = k.split('.'); e[a][b] = v; } else e[k] = v; if (['icon', 'name', 'start', 'end'].includes(k)) RENDER.admin(); }
function admEvItem(i, cat, id) { const r = ADM.events[i].reward; if (cat !== null) r.item = cat ? [cat, Object.keys(CAT[cat])[0]] : null; if (id !== null) r.item[1] = id; RENDER.admin(); }
function admEvAdd(k) { const tp = EVENT_TEMPLATES[k], n = Date.now();
  ADM.events.unshift({ id: '', icon: tp.icon, name: tp.name, en: tp.en, desc: tp.desc, den: '', metric: tp.metric, goal: tp.goal, reward: { coins: tp.reward.coins, xp: tp.reward.xp, item: null },
    coinMult: tp.coinMult || 1, xpMult: tp.xpMult || 1, start: n, end: n + tp.days * 864e5, shop: [] }); RENDER.admin(); }
function admEvTime(i, d) { const e = ADM.events[i], n = Date.now(); const len = e.end - e.start;
  if (d === 'now') { e.start = n; e.end = n + Math.max(36e5, len); } else if (d === 'end') { e.end = n; if (e.start > n) e.start = n - 1000; }
  else { e.end = Math.max(e.start + 60000, e.end + d); } RENDER.admin(); }
async function admEvSave() { const r = await admPost('events', { events: ADM.events }); if (r) { setContent(r.content); ADM.events = clone(r.content.events); RENDER.admin(); } }

/* ---------- Arayüz tasarımcısı ---------- */
async function admUI(el) {
  if (!ADM.ui) { await loadContent(); ADM.ui = clone(CONTENT.ui || { hero: { title: '', sub: '' }, accent: 'gold', blocks: [], hidden: [] }); }
  const U = ADM.ui, B = U.blocks;
  const fb = (i, k, val, type = 'text', extra = '') => `<input class="inp" type="${type}" value="${esc(val == null ? '' : val)}" ${extra} onchange="ADM.ui.blocks[${i}].${k}=${type === 'number' ? '+this.value' : 'this.value'};admUIPrev()">`;
  const blockEd = (b, i) => {
    const head = `<div class="row between"><b>${BLOCK_INFO[b.type][0]} ${BLOCK_INFO[b.type][1]}</b><span class="row" style="gap:4px"><button class="btn xs sec" ${i ? '' : 'disabled'} onclick="admUIMove(${i},-1)">↑</button><button class="btn xs sec" ${i < B.length - 1 ? '' : 'disabled'} onclick="admUIMove(${i},1)">↓</button><button class="btn xs red" onclick="ADM.ui.blocks.splice(${i},1);RENDER.admin()">🗑️</button></span></div>`;
    const color = `<label class="mini-f" style="width:120px">${t('Renk')}<select class="inp" onchange="ADM.ui.blocks[${i}].color=this.value;admUIPrev()">${opt(COLOR_INFO, b.color)}</select></label>`;
    const target = `<label class="mini-f">${t('Buton hedefi')}<select class="inp" onchange="ADM.ui.blocks[${i}].target=this.value;admUIPrev()">${opt(SCREEN_INFO, b.target)}</select></label>`;
    let body = `<div class="row"><label class="mini-f" style="width:70px">${t('Simge')}${fb(i, 'icon', b.icon, 'text', 'maxlength="4"')}</label><label class="mini-f">${t('Başlık')}${fb(i, 'title', b.title, 'text', 'maxlength="60"')}</label>${color}</div>`;
    if (b.type !== 'buttons') body += `<label class="mini-f" style="width:100%">${t('Yazı')}${fb(i, 'text', b.text, 'text', 'maxlength="300"')}</label>`;
    if (b.type === 'banner' || b.type === 'news' || b.type === 'event') body += `<div class="row">${b.type !== 'event' ? target : ''}<label class="mini-f">${t('Buton yazısı')}${fb(i, 'btn', b.btn, 'text', 'maxlength="24"')}</label></div>`;
    if (b.type === 'countdown') body += `<label class="mini-f">${t('Hedef tarih')}<input class="inp" type="datetime-local" value="${toLocalInput(b.date || Date.now() + 864e5)}" onchange="ADM.ui.blocks[${i}].date=fromLocalInput(this.value);admUIPrev()"></label>`;
    if (b.type === 'buttons') body += (b.buttons || []).map((x, k) => `<div class="row" style="margin-top:4px"><input class="inp" style="width:60px" maxlength="4" value="${esc(x.icon || '')}" onchange="ADM.ui.blocks[${i}].buttons[${k}].icon=this.value;admUIPrev()"><input class="inp" style="width:170px" maxlength="24" value="${esc(x.label)}" onchange="ADM.ui.blocks[${i}].buttons[${k}].label=this.value;admUIPrev()">
      <select class="inp" style="width:170px" onchange="ADM.ui.blocks[${i}].buttons[${k}].target=this.value;admUIPrev()">${opt(Object.fromEntries(Object.entries(SCREEN_INFO).filter(([k2]) => k2)), x.target)}</select><button class="btn xs red" onclick="ADM.ui.blocks[${i}].buttons.splice(${k},1);RENDER.admin()">✖</button></div>`).join('')
      + ((b.buttons || []).length < 4 ? `<button class="btn xs sec" style="margin-top:6px" onclick="ADM.ui.blocks[${i}].buttons.push({icon:'⚔️',label:'Oyna',target:'mode'});RENDER.admin()">➕ ${t('Buton ekle')}</button>` : '');
    return `<div class="card admblock">${head}${body}</div>`;
  };
  el.innerHTML = `<p class="muted">${t('Ana menüyü hazır bileşenlerle tasarla. Kaydettiğinde tüm oyuncuların ekranı anında güncellenir.')}</p>
    <div class="admui">
      <div>
        <div class="card"><b>🏷️ ${t('Başlık alanı')}</b><div class="row" style="margin-top:6px"><label class="mini-f">${t('Büyük başlık')}<input class="inp" maxlength="30" placeholder="MANGALA" value="${esc(U.hero.title)}" onchange="ADM.ui.hero.title=this.value;admUIPrev()"></label>
          <label class="mini-f" style="flex:1">${t('Alt yazı')}<input class="inp" maxlength="80" placeholder="${t('Binlerce yıllık Türk zekâ ve strateji oyunu')}" value="${esc(U.hero.sub)}" onchange="ADM.ui.hero.sub=this.value;admUIPrev()"></label></div></div>
        <div class="card" style="margin-top:10px"><b>🎨 ${t('Tema rengi')}</b><div class="row" style="margin-top:6px">${Object.entries(ACCENT_INFO).map(([k, [n2, c]]) => `<button class="chip ${U.accent === k ? 'on' : ''}" onclick="ADM.ui.accent='${k}';RENDER.admin()"><span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${c};vertical-align:middle"></span> ${n2}</button>`).join('')}</div></div>
        <div class="card" style="margin-top:10px"><b>🧱 ${t('Menü kartları (göster/gizle)')}</b><div class="perms" style="margin-top:6px">${Object.entries(TILE_INFO).map(([k, n2]) => `<button class="perm ${U.hidden.includes(k) ? '' : 'on'}" onclick="ADM.ui.hidden=ADM.ui.hidden.includes('${k}')?ADM.ui.hidden.filter(x=>x!=='${k}'):[...ADM.ui.hidden,'${k}'];RENDER.admin()">${U.hidden.includes(k) ? '🚫' : '✓'} ${n2}</button>`).join('')}</div></div>
        <div class="sec-title"><h3>➕ ${t('Bileşen ekle')}</h3></div>
        <div class="row">${Object.entries(BLOCK_INFO).map(([k, [ic, n2, d]]) => `<button class="chip" ${B.length >= 12 ? 'disabled' : ''} onclick="admUIAdd('${k}')">${ic} ${n2}<small>${d}</small></button>`).join('')}</div>
        <div class="sec-title"><h3>📋 ${t('Bileşenler')} (${B.length}/12)</h3></div>
        ${B.map(blockEd).join('') || `<p class="muted">${t('Henüz bileşen yok. Yukarıdan ekle.')}</p>`}
        <div class="row" style="margin-top:12px"><button class="btn green" onclick="admUISave()">💾 ${t('Yayınla')}</button><button class="btn sm sec" onclick="ADM.ui=null;RENDER.admin()">↩️ ${t('Değişiklikleri at')}</button><button class="btn sm red" onclick="ADM.ui={hero:{title:'',sub:''},accent:'gold',blocks:[],hidden:[]};RENDER.admin()">🧹 ${t('Varsayılan tasarım')}</button></div>
      </div>
      <div><div class="sec-title" style="margin-top:0"><h3>👁️ ${t('Canlı önizleme')}</h3></div><div class="card uiprev" id="uiprev"></div></div>
    </div>`;
  admUIPrev();
}
function admUIPrev() {
  const U = ADM.ui, el = $('uiprev'); if (!el) return;
  el.dataset.acc = U.accent;
  el.innerHTML = `<div class="hero"><h1 style="font-size:34px">${esc(U.hero.title || 'MANGALA')}</h1><p>${esc(U.hero.sub || t('Binlerce yıllık Türk zekâ ve strateji oyunu'))}</p></div>${uiBlocksHTML(U.blocks)}
    <div class="menu-grid" style="grid-template-columns:1fr 1fr"><div class="mcard main" style="grid-column:1/-1"><h3>${t('OYNA')}</h3></div>${Object.entries(TILE_INFO).filter(([k]) => !U.hidden.includes(k)).map(([, n2]) => `<div class="mcard" style="padding:10px"><b>${n2}</b></div>`).join('')}</div>`;
  el.querySelectorAll('button').forEach(b => b.onclick = e => { e.preventDefault(); toast(t('Önizleme')); });
}
function admUIMove(i, d) { const B = ADM.ui.blocks; [B[i], B[i + d]] = [B[i + d], B[i]]; RENDER.admin(); }
function admUIAdd(type) {
  const base = { type, icon: BLOCK_INFO[type][0], title: '', text: '', color: 'gold', target: '', btn: '', date: 0, eventId: '', buttons: [] };
  if (type === 'banner') Object.assign(base, { icon: '🔥', title: 'Yeni Güncelleme!', text: 'Yeni modlar ve ödüller seni bekliyor.', target: 'mode', btn: 'Hemen Oyna', color: 'purple' });
  if (type === 'news') Object.assign(base, { icon: '📰', title: 'Duyuru', text: 'Buraya duyuru metnini yaz.', color: 'blue' });
  if (type === 'countdown') Object.assign(base, { icon: '⏳', title: 'Büyük Turnuvaya kalan', date: Date.now() + 3 * 864e5, color: 'red' });
  if (type === 'event') Object.assign(base, { title: '', color: 'green', btn: 'Etkinliğe Git' });
  if (type === 'buttons') Object.assign(base, { title: 'Hızlı Erişim', icon: '', buttons: [{ icon: '🧩', label: 'Bulmacalar', target: 'puzzles' }, { icon: '🌍', label: 'Çevrimiçi', target: 'online' }] });
  ADM.ui.blocks.push(base); RENDER.admin();
}
async function admUISave() { const r = await admPost('ui', { ui: ADM.ui }); if (r) { setContent(r.content); ADM.ui = clone(r.content.ui); RENDER.admin(); } }

/* ---------- Kayıtlar ---------- */
async function admAudit(el) {
  const { j } = await api('GET', '/api/admin/audit');
  el.innerHTML = `<div class="list">${(j.list || []).map(a => `<div class="lrow"><div class="grow"><b>${esc(a.by)} → ${esc(a.action)}${a.target ? ' · ' + esc(a.target) : ''}</b><span class="muted small">${fmtDT(a.at)}${a.detail ? ' · ' + esc(a.detail) : ''}</span></div></div>`).join('') || `<p class="muted">${t('Henüz kayıt yok.')}</p>`}</div>`;
}
