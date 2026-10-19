/* =========================================================
   KARŞILAMA ("Kuralları biliyor musun?") + OYUN REHBERİ
   ARKADAŞLAR + PAYLAŞILABİLİR SONUÇ KARTI
   ========================================================= */
const GUIDE = [
  { ic: '👋', t: 'Oyun Rehberine Hoş Geldin!', te: 'Welcome to the Game Guide!', x: 'Bu oyunda Mangala\'dan çok daha fazlası var. 1 dakikada hepsini gezelim. İstediğin an <b>Atla</b>\'ya basabilirsin; rehberi daha sonra <b>Kurallar</b> ekranından tekrar açabilirsin.', xe: 'There is much more here than plain Mangala. Let\'s tour everything in a minute. Press <b>Skip</b> any time; you can reopen this guide from the <b>Rules</b> screen.' },
  { ic: '🤖', t: 'Botlara Karşı', te: 'Vs Bots', x: 'Çırak\'tan Efsane\'ye <b>5 seviye</b> bot var. Kazandıkça 🪙 kazanırsın, parayla daha zor botların kilidini açarsın. Zor botlar daha çok ödül verir!', xe: '<b>5 bot levels</b> from Apprentice to Legend. Win 🪙 and unlock tougher bots. Harder bots pay more!', chips: ['🐣 Çırak', '🦊 Kalfa', '🦉 Usta', '🐺 Üstat', '🐉 Efsane'] },
  { ic: '🎮', t: 'Oyun Modları', te: 'Game Modes', x: 'Klasik kuralların yanında eğlenceli modlar var. Botlara karşı da çevrimiçi de oynanabilir:', xe: 'Besides the classic rules there are fun modes, playable against bots and online:', modes: true },
  { ic: '🃏', t: 'Süper Güç Kartları', te: 'Power Cards', x: 'Süper Güçler modunda her oyuncunun 3 kartı var, her biri maçta bir kez:<br>❄️ <b>Dondur</b>: rakibin bir kuyusunu bir tur kilitler.<br>🔀 <b>Takas</b>: iki komşu kuyunun taşlarını değiştirir.<br>🛡️ <b>Kalkan</b>: rakibin sonraki turunda taş kaptırmazsın.<br>Kart kullanmak sıranı bitirmez!', xe: 'In Power Cards each player has 3 one-time cards:<br>❄️ <b>Freeze</b> an opponent pit for a turn.<br>🔀 <b>Swap</b> two neighbouring pits.<br>🛡️ <b>Shield</b> your pits during the opponent\'s next turn.<br>Using a card doesn\'t end your turn!' },
  { ic: '🌍', t: 'Çevrimiçi', te: 'Online', x: '<b>Hızlı Eşleşme</b>, <b>Dereceli</b> (Elo puanı ve ligler: Bronz → Mangala Ustası), <b>Yıldırım</b> ve <b>Parti</b> modu. Her hamlenin süresi var; bağlantın koparsa 30 saniye içinde maça geri dönersin.', xe: '<b>Quick Match</b>, <b>Ranked</b> (Elo & leagues: Bronze → Mangala Master), <b>Blitz</b> and <b>Party</b>. Moves are timed; if you disconnect you can rejoin within 30 seconds.', chips: ['🥉 Bronz', '🥈 Gümüş', '🥇 Altın', '💎 Elmas', '👑 Usta'] },
  { ic: '👥', t: 'Arkadaşlar', te: 'Friends', x: '<b>Arkadaşla Oyna</b> linkini WhatsApp\'tan gönder, arkadaşın tek tıkla maça girsin. Çevrimiçi → <b>Arkadaşlar</b> sekmesinden arkadaş ekle, kimin çevrimiçi olduğunu gör ve maça davet et. Maçları <b>izleyebilirsin</b> de.', xe: 'Send the <b>Play with a Friend</b> link on WhatsApp and your friend joins with one tap. Add friends under Online → <b>Friends</b>, see who is online and invite them. You can also <b>spectate</b> matches.' },
  { ic: '🏆', t: 'Turnuvalar', te: 'Tournaments', x: '4 veya 8 kişilik eleme turnuvaları: botlara karşı ya da gerçek oyuncularla. Katılım <b>ücretsiz</b>, şampiyon büyük ödülü alır.', xe: '4 or 8 player knockouts, against bots or real players. Entry is <b>free</b>, the champion wins the prize.' },
  { ic: '🧩', t: 'Bulmacalar', te: 'Puzzles', x: '<b>20 taktik bulmaca</b>: "Tek turda çift kuralıyla 8 taş kap" gibi. Takılırsan 💡 İpucu var. İlk çözüm 🪙 ve XP kazandırır.', xe: '<b>20 tactical puzzles</b> like "capture 8 stones with the even rule in one turn". Stuck? Use 💡 Hint. First solves give 🪙 and XP.' },
  { ic: '🎫', t: 'Sezon Kartı & Etkinlikler', te: 'Season Pass & Events', x: 'Her oyun <b>XP</b> kazandırır: seviye atlarsın ve Sezon Kartında 30 kademede ödül toplarsın. Ayrıca süreli <b>etkinlikler</b>, <b>günlük görevler</b> ve <b>günlük giriş ödülü</b> var.', xe: 'Every game gives <b>XP</b>: level up and collect rewards across 30 Season Pass tiers. There are timed <b>events</b>, <b>daily quests</b> and a <b>daily login reward</b>.' },
  { ic: '🛒', t: 'Mağaza', te: 'Shop', x: 'Kazandığın 🪙 ile tahta, taş, <b>el</b> (taşları dağıtan el!), avatar, çerçeve, emoji ve mesaj paketleri al. Her gün yeni indirimler var.', xe: 'Spend 🪙 on boards, stones, <b>hands</b> (the hand that sows!), avatars, frames, emoji and message packs. New deals every day.', chips: ['🟫', '🔴', '✋', '🙂', '⭕', '😀', '💬'] },
  { ic: '😀', t: 'Emojiler & Masayı Devir', te: 'Emojis & Table Flip', x: 'Maçta 😀 emoji ve 💬 hazır mesaj gönder. Kaybedersen öfkeni çıkar: <b>🤬 Masayı Devir</b> butonuyla taşları ekrana saç! Maçı bitiren son taş <b>yavaş çekimde</b> düşer.', xe: 'Send 😀 emojis and 💬 quick messages. Lost? Hit <b>🤬 Flip the Table</b> and scatter the stones! The final stone falls in <b>slow motion</b>.' },
  { ic: '🎬', t: 'Tekrar & Yapay Zekâ Koçu', te: 'Replays & AI Coach', x: 'Son 15 maçını adım adım tekrar izle. <b>Koç Analizi</b> her hamleni değerlendirir: "4. kuyu yerine 2. kuyudan oynasaydın ekstra tur kazanırdın" gibi.', xe: 'Rewatch your last 15 games step by step. The <b>AI Coach</b> grades every move: "playing pit 2 instead of pit 4 would have earned an extra turn".' },
  { ic: '🏅', t: 'Başarımlar & Profil', te: 'Achievements & Profile', x: 'Başarımları aç, <b>unvanlar</b> kazan (Kuyu Efendisi, Taktik Dehası...). Profilinde avatar, çerçeve, durum mesajı ve istatistiklerin var. Sonuç kartını 📸 paylaş!', xe: 'Unlock achievements and earn <b>titles</b>. Your profile shows avatar, frame, status and stats. Share your 📸 result card!' },
  { ic: '⚙️', t: 'Ayarlar & Süper Özellikler', te: 'Settings & Extras', x: 'Dil, müzik, ses, titreşim ve hız ayarları. Ayrıca:<br>📷 <b>Kamera ile el kontrolü</b>: yumruk yap = al, elini aç = bırak!<br>📺 <b>Twitch Chat Plays</b>: yayın sohbetine karşı oyna.<br>📲 Oyunu telefonuna <b>uygulama olarak yükle</b>.', xe: 'Language, music, sound, vibration and speed. Plus:<br>📷 <b>Camera hand control</b>: fist = grab, open = drop!<br>📺 <b>Twitch Chat Plays</b>: play against your stream chat.<br>📲 <b>Install</b> the game as an app.' },
  { ic: '🆕', t: 'Yeni: Yan Yana, Günlük Bulmaca ve Daha Fazlası', te: 'New: Side by Side, Daily Puzzle & More', x: '👫 <b>Yan Yana</b>: aynı telefonda arkadaşınla sırayla oyna.<br>📅 <b>Günün Bulmacası</b>: herkese aynı bulmaca, her gün yenisi; seriyi bozma!<br>↩️ <b>Geri Al</b> ve 💡 <b>İpucu</b>: botlara karşı maçta 3\'er hak (ödül yarıya düşer).<br>👀 <b>Hamle önizleme</b>: fareyle kuyunun üstüne gel, son taşın nereye düşeceğini gör.<br>🌌 <b>Arka Planlar</b> ve 🎆 <b>Zafer Efektleri</b> mağazada!<br>📈 Profilinde <b>maç geçmişi grafiği</b>.', xe: '👫 <b>Side by Side</b>: take turns with a friend on one phone.<br>📅 <b>Daily Puzzle</b>: the same puzzle for everyone, a new one every day; keep your streak!<br>↩️ <b>Undo</b> and 💡 <b>Hint</b>: 3 each in bot matches (rewards are halved).<br>👀 <b>Move preview</b>: hover a pit to see where the last stone lands.<br>🌌 <b>Backgrounds</b> and 🎆 <b>Victory FX</b> in the shop!<br>📈 A <b>match history chart</b> on your profile.' },
  { ic: '🚀', t: 'Hazırsın!', te: 'You\'re Ready!', x: 'Hepsi bu kadar. Şimdi ilk rakibini seç ve göster kendini!', xe: 'That\'s it. Pick your first opponent and show them what you\'ve got!', last: true }
];
const gtx = (s, a, b) => LANG === 'en' && s[b] ? s[b] : s[a];
let guideI = 0;
/* ---------- karşılama ---------- */
RENDER.welcome = () => {
  $('scr-welcome').innerHTML = `<div class="welcome">
    <div class="w-ic">🪨</div><h1>${t('Mangala\'ya Hoş Geldin!')}</h1>
    <p class="muted">${t('Başlamadan önce bir soru:')}</p>
    <h2>${t('Mangala\'nın kurallarını biliyor musun?')}</h2>
    <div class="w-btns">
      <button class="card mcard w-opt" onclick="knowRules(true)"><div class="ic">😎</div><h3>${t('Evet, biliyorum')}</h3><p>${t('Kural eğitimini atla, oyunun özelliklerine geç')}</p></button>
      <button class="card mcard w-opt" onclick="knowRules(false)"><div class="ic">🎓</div><h3>${t('Hayır, öğret')}</h3><p>${t('Kuralları adım adım, oynayarak öğren')}</p></button>
    </div>
    <p class="muted small">${t('İki durumda da {0} 🪙 hoş geldin hediyen var!', TUT_BONUS)}</p></div>`;
};
function knowRules(yes) {
  Sound.sfx.click(); S.rulesAsked = true;
  if (yes) { S.tutorialDone = true; S.tutStep = 0; persist(); addCoins(TUT_BONUS); toast('🎁 +' + TUT_BONUS + ' 🪙'); guideI = 0; go('guide'); }
  else { persist(); go('tutorial'); }
}
/* ---------- oyun rehberi ---------- */
RENDER.guide = () => {
  const s = GUIDE[guideI], n = GUIDE.length;
  const chips = s.modes ? Object.entries(MODES).map(([k, m]) => `<div class="g-mode"><span>${m.icon}</span><b>${nm(m)}</b><small>${dsc(m)}</small></div>`).join('')
    : (s.chips || []).map(c => `<span class="g-chip">${esc(c)}</span>`).join('');
  $('scr-guide').innerHTML = `<div class="guide">
    <div class="row between"><b>📖 ${t('Oyun Rehberi')}</b>${s.last ? '' : `<button class="btn sec sm" onclick="finishGuide()">${t('Atla')} ⏭</button>`}</div>
    <div class="g-dots">${GUIDE.map((_, i) => `<i class="${i === guideI ? 'on' : i < guideI ? 'done' : ''}" onclick="guideI=${i};RENDER.guide()"></i>`).join('')}</div>
    <div class="card g-card" key="${guideI}"><div class="g-ic">${s.ic}</div><h2>${gtx(s, 't', 'te')}</h2><p>${gtx(s, 'x', 'xe')}</p>${chips ? `<div class="${s.modes ? 'g-modes' : 'g-chips'}">${chips}</div>` : ''}</div>
    <div class="row between g-nav"><button class="btn sec" ${guideI ? '' : 'disabled'} onclick="guideI--;Sound.sfx.click();RENDER.guide()">← ${t('Geri')}</button>
      <span class="muted">${guideI + 1} / ${n}</span>
      ${s.last ? `<button class="btn" onclick="finishGuide(true)">⚔️ ${t('Hadi Oynayalım!')}</button>` : `<button class="btn" onclick="guideI++;Sound.sfx.click();RENDER.guide()">${t('İleri')} →</button>`}</div></div>`;
};
function openGuide() { guideI = 0; go('guide'); }
function finishGuide(play) { S.guideDone = true; persist(); if (play) { confetti(); Sound.sfx.win(); go('mode'); } else go('menu'); }
async function maybeOfferGuide() {
  if (S.guideDone || S.guideOffered || curScreen !== 'menu' || $('modal').classList.contains('on')) return;
  S.guideOffered = true; persist();
  const ok = await modal(`<div class="big">📖</div><h3>${t('Yeni: Oyun Rehberi')}</h3><p class="muted">${t('Özel modları, çevrimiçi özellikleri ve sürprizleri 1 dakikada gezmek ister misin?')}</p>`, [{ label: t('Sonra'), cls: 'sec', value: 0 }, { label: t('Göster'), value: 1 }]);
  if (ok) openGuide();
}

/* =========================================================
   ARKADAŞLAR
   ========================================================= */
const FR = { list: null, req: [], loading: false };
async function loadFriends() {
  if (!AUTH.user || FR.loading) return; FR.loading = true;
  try { const { s, j } = await api('GET', '/api/friends'); if (s === 200) { FR.list = j.friends; FR.req = j.requests; } } catch { }
  FR.loading = false; if (curScreen === 'online' && onlineTab === 'friends') RENDER.online();
}
function friendsHTML() {
  if (!AUTH.user) return `<div class="card"><p class="muted">🔒 ${t('Arkadaş eklemek için giriş yapmalısın.')}</p></div>`;
  if (!FR.list) { loadFriends(); return '<div class="spinner"></div>'; }
  const inRoom = NET.lobby === 'room';
  const row = f => `<div class="lrow">${avatarHTML(CAT.avatars[f.avatar] ? f.avatar : 'gulen', CAT.frames[f.frame] ? f.frame : 'yok', 38)}
    <div class="grow"><b>${f.online ? '<span class="on-dot"></span>' : ''}${esc(f.name)} ${rankBadge(f.rank)}</b><span class="muted small">${f.inGame ? '🎮 ' + t('Maçta') : f.online ? '🟢 ' + t('Çevrimiçi') : '⚪ ' + t('Çevrimdışı')} · ${f.elo} Elo</span></div>
    ${f.online && !f.inGame ? `<button class="btn xs" onclick="inviteToMatch('${esc(f.name)}')">⚔️ ${t('Davet Et')}</button>` : ''}${f.inGame && f.room ? `<button class="btn xs sec" onclick="spectate('${f.room}')">👁️</button>` : ''}
    <button class="btn xs sec" onclick="viewProfile('${esc(f.name)}')">👤</button><button class="btn xs sec" onclick="friendAct('remove','${esc(f.name)}')">✖</button></div>`;
  return `<div class="card row" style="margin-bottom:10px"><input class="inp" id="fr-add" maxlength="16" placeholder="${t('Kullanıcı adı')}" style="max-width:240px" onkeydown="if(event.key==='Enter')friendAdd()"><button class="btn sm" onclick="friendAdd()">➕ ${t('Arkadaş Ekle')}</button><button class="btn sm sec" onclick="FR.list=null;RENDER.online()">🔄</button></div>
    ${FR.req.length ? `<div class="sec-title"><h3>📨 ${t('Arkadaşlık istekleri')} (${FR.req.length})</h3></div><div class="list">${FR.req.map(r => `<div class="lrow">${avatarHTML(CAT.avatars[r.avatar] ? r.avatar : 'gulen', 'yok', 34)}<div class="grow"><b>${esc(r.name)}</b></div><button class="btn xs green" onclick="friendAct('accept','${esc(r.name)}')">✓ ${t('Kabul')}</button><button class="btn xs sec" onclick="friendAct('decline','${esc(r.name)}')">✖</button></div>`).join('')}</div>` : ''}
    <div class="sec-title"><h3>👥 ${t('Arkadaşların')} (${FR.list.length})</h3>${inRoom ? `<span class="badge">🏠 ${t('Oda')}: ${esc(NET.code)}</span>` : ''}</div>
    <div class="list">${FR.list.sort((a, b) => (b.online - a.online) || a.name.localeCompare(b.name)).map(row).join('') || `<p class="muted">${t('Henüz arkadaşın yok. Kullanıcı adıyla ekle!')}</p>`}</div>`;
}
async function friendAdd() {
  const n = ($('fr-add').value || '').trim(); if (!n) return;
  const { s, j } = await api('POST', '/api/friends/add', { name: n });
  toast(s === 200 ? (j.accepted ? '🤝 ' + t('Artık arkadaşsınız!') : '📨 ' + t('Arkadaşlık isteği gönderildi.')) : '❌ ' + (j.error || ''));
  if (s === 200) { Sound.sfx.coin(); FR.list = null; RENDER.online(); }
}
async function friendAct(kind, name) {
  const path = kind === 'remove' ? '/api/friends/remove' : '/api/friends/respond';
  const { s, j } = await api('POST', path, { name, accept: kind === 'accept' });
  if (s !== 200) return toast('❌ ' + (j.error || ''));
  if (kind === 'accept') { toast('🤝 ' + t('Artık arkadaşsınız!')); Sound.sfx.extra(); }
  FR.list = null; RENDER.online(); updTop();
}
function inviteToMatch(name) {
  const send = () => { netSend({ t: 'invite', to: name }); toast('📨 ' + t('{0} maça davet edildi!', esc(name))); };
  if (NET.lobby === 'room') return send();
  NET.inviteTo = name; netSend({ t: 'create', mode: privMode });
}
async function onInvited(m) {
  Sound.sfx.extra(); vib([40, 40, 40]);
  if (G && !G.over) return toast('📨 ' + t('{0} seni maça davet ediyor (maç bitince tekrar dene).', esc(m.from)), 5000);
  const ok = await modal(`<div class="big">📨</div><h3>${t('{0} seni maça davet ediyor!', esc(m.from))}</h3><p class="muted">${MODES[m.mode] ? MODES[m.mode].icon + ' ' + nm(MODES[m.mode]) : ''}</p>`, [{ label: t('Reddet'), cls: 'sec', value: 0 }, { label: '⚔️ ' + t('Katıl'), value: 1 }]);
  if (ok) netSend({ t: 'join', code: m.code });
}

/* =========================================================
   PAYLAŞILABİLİR SONUÇ KARTI (1080×1350 görsel)
   ========================================================= */
async function shareCard(info) {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#4a2c15'); g.addColorStop(1, '#140b05'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,210,140,${Math.random() * .15})`; x.beginPath(); x.arc(Math.random() * W, Math.random() * H, Math.random() * 4 + 1, 0, 7); x.fill(); }
  const center = (txt, y, size, color, weight = 900) => { x.font = `${weight} ${size}px "Segoe UI", system-ui, sans-serif`; x.fillStyle = color; x.textAlign = 'center'; x.fillText(txt, W / 2, y); };
  center('🪨 DİJİTAL MANGALA', 120, 54, '#f2c14e');
  const res = { win: t('ZAFER!'), loss: t('K.O.'), draw: t('BERABERE!') }[info.outcome];
  x.shadowColor = info.outcome === 'win' ? '#f2c14e' : info.outcome === 'loss' ? '#e5534b' : '#7bd3ff'; x.shadowBlur = 40;
  center(res, 290, 170, info.outcome === 'loss' ? '#ffb3ad' : '#fff3c4'); x.shadowBlur = 0;
  center(`${info.me}  —  ${info.op}`, 460, 120, '#ffffff');
  center(`${info.myName}   vs   ${info.oppName}`, 545, 46, '#e9d7bf', 700);
  center(`${MODES[info.mode] ? MODES[info.mode].icon + ' ' + nm(MODES[info.mode]) : ''}`, 610, 38, '#c9b39a', 600);
  // tahta
  const bx = 90, by = 680, bw = W - 180, bh = 340;
  const wood = x.createLinearGradient(0, by, 0, by + bh); wood.addColorStop(0, '#b06d33'); wood.addColorStop(1, '#6e3d16');
  x.fillStyle = wood; x.beginPath(); x.roundRect(bx, by, bw, bh, 60); x.fill(); x.lineWidth = 10; x.strokeStyle = '#d39458'; x.stroke();
  const cols = ['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#e9c46a', '#9b5de5'];
  const pitR = 52, sx = bx + 200, step = (bw - 400) / 5;
  const drawPit = (cx, cy, n, r, isStore) => {
    x.fillStyle = '#3a1f08'; x.beginPath(); isStore ? x.ellipse(cx, cy, r * 0.75, r * 1.9, 0, 0, 7) : x.arc(cx, cy, r, 0, 7); x.fill();
    for (let k = 0; k < Math.min(n, 30); k++) { const a = k * 2.4, rr = Math.sqrt((k + .5) / Math.max(n, 6)) * r * (isStore ? .6 : .7);
      x.fillStyle = cols[k % 6]; x.beginPath(); x.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * (isStore ? 2.2 : 1), r * .2, 0, 7); x.fill(); }
    x.font = '800 30px system-ui'; x.fillStyle = '#fff'; x.textAlign = 'center'; x.fillText(n, cx, cy + (isStore ? 12 : r + 36));
  };
  const b = info.board;
  for (let i = 0; i < 6; i++) { drawPit(sx + step * i, by + 110, b[12 - i], pitR); drawPit(sx + step * i, by + 235, b[i], pitR); }
  drawPit(bx + 95, by + bh / 2, b[13], 70, true); drawPit(bx + bw - 95, by + bh / 2, b[6], 70, true);
  center(new Date().toLocaleDateString(LANG === 'en' ? 'en-GB' : 'tr-TR', { dateStyle: 'long' }), 1120, 34, '#c9b39a', 600);
  center(t('Sen de oyna:') + ' ' + (CONTENT.inviteUrl ? CONTENT.inviteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') : location.host), 1230, 44, '#f2c14e', 800);
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const file = new File([blob], 'mangala-sonuc.png', { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Dijital Mangala', text: `${res} ${info.me}-${info.op}` }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  const url = URL.createObjectURL(blob);
  const v = await modal(`<h3>📸 ${t('Sonuç kartın')}</h3><img src="${url}" style="width:100%;border-radius:14px"><p class="muted small">${t('Resmi indirip istediğin yerde paylaşabilirsin.')}</p>`,
    [{ label: t('Kapat'), cls: 'sec', value: 0 }, { label: '⬇️ ' + t('İndir'), value: 1 }]);
  if (v) { const a = document.createElement('a'); a.href = url; a.download = 'mangala-sonuc.png'; document.body.appendChild(a); a.click(); a.remove(); }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
