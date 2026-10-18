/* =========================================================
   Oyun akışı: bot, bulmaca, çevrimiçi, izleyici, turnuva, tekrar
   Yerel bakış: alttaki oyuncu (sen) = 0, üstteki = 1
   ========================================================= */
let G = null;
const PARTY = ['reverse', 'mystery', 'cards'];
const BLITZ_MS = 8000;
const coinMult = () => curEvent().coinMult || 1;
const xpFor = (res, bot, online) => { let x = { win: 120, draw: 70, loss: 40 }[res]; if (bot && res === 'win') x += bot.stars * 15; if (online) x = Math.round(x * 1.5); return x; };

/* ---------- Oyun ekranı ---------- */
function gBase() {
  if (G.kind === 'spectate') return { oppName: G.players[1].name, meName: G.players[0].name, hands: [G.players[0].hand || 'klasik', G.players[1].hand || 'klasik'] };
  return { oppName: G.opp.name, hands: [S.eq.hand, G.opp.hand || 'klasik'] };
}
function setupGameUI() {
  const fxl = document.querySelector('#scr-game .fxlayer'); if (fxl) fxl.innerHTML = '';
  const o = G.kind === 'spectate' ? G.players[1] : G.opp, me = G.kind === 'spectate' ? G.players[0] : null;
  const line = (p, lbl) => `${esc(p.name)} ${p.rank ? rankBadge(p.rank) : ''} <span class="muted" style="font-weight:600;font-size:12px">${lbl || ''}</span>${p.title ? `<div class="ttl">${esc(titleTxt(p.title))}</div>` : ''}`;
  $('g-av1').innerHTML = avatarHTML(o.avatar, o.frame, 42);
  $('g-av1').onclick = (G.kind === 'online' || G.kind === 'spectate') && !o.guest && o.name ? () => viewProfile(o.name) : null;
  $('g-av1').style.cursor = $('g-av1').onclick ? 'pointer' : '';
  $('g-nm1').innerHTML = line(o, o.label || (o.elo ? leagueBadge(o.elo) + ' ' + o.elo : (o.level ? t('Sv') + ' ' + o.level : '')));
  if (me) { $('g-av0').innerHTML = avatarHTML(me.avatar, me.frame, 42); $('g-nm0').innerHTML = line(me, me.elo ? leagueBadge(me.elo) + ' ' + me.elo : ''); }
  else { $('g-av0').innerHTML = avatarHTML(S.eq.avatar, S.eq.frame, 42); $('g-nm0').innerHTML = line({ name: myName(), title: S.title, rank: AUTH.user && AUTH.user.rank }, AUTH.user && G.ranked ? leagueBadge(AUTH.user.elo) + ' ' + AUTH.user.elo : t('Sv') + ' ' + levelInfo(S.xp).L); }
  $('g-think').textContent = ''; ['bub0', 'bub1'].forEach(b => $(b).className = 'bubble');
  const bn = $('g-banner');
  if (G.mode !== 'classic' && G.kind !== 'puzzle') { bn.style.display = ''; bn.innerHTML = `${MODES[G.mode].icon} <b>${nm(MODES[G.mode])}</b> — ${dsc(MODES[G.mode])}`; } else bn.style.display = 'none';
  $('g-puzzle').style.display = G.kind === 'puzzle' ? '' : 'none';
  renderActions();
}
function renderActions() {
  const a = $('g-actions');
  if (G.kind === 'puzzle') a.innerHTML = `<button class="btn sec sm" onclick="startPuzzle(G.puzzle.idx)">🔄 ${t('Sıfırla')}</button><button class="btn sec sm" onclick="puzzleHint()">💡 ${t('İpucu')}</button><button class="btn sec sm" onclick="showRulesModal()">📜</button><button class="btn red sm" onclick="G=null;go('puzzles')">✖ ${t('Çık')}</button>`;
  else if (G.kind === 'spectate') a.innerHTML = `<button class="btn sec sm" onclick="showRulesModal()">📜 ${t('Kurallar')}</button><button class="btn red sm" onclick="stopSpectate()">👁️ ${t('İzlemeyi Bırak')}</button>`;
  else if (G.kind === 'chat') a.innerHTML = `<span class="muted small">🧪 ${t('Test oyu')}:</span>${[1, 2, 3, 4, 5, 6].map(n => `<button class="btn sec xs" onclick="Chat.testVote(${n})">!kuyu ${n}</button>`).join('')}<button class="btn sec sm" onclick="showRulesModal()">📜</button><button class="btn red sm" onclick="resign()">🏳️ ${t('Pes Et')}</button><div id="chatfeed" class="chatfeed"></div>`;
  else a.innerHTML = `<button class="btn sec sm" onclick="togglePanel('e')">😀 ${t('Emoji')}</button><button class="btn sec sm" onclick="togglePanel('m')">💬 ${t('Mesaj')}</button><button class="btn sec sm" onclick="showRulesModal()">📜</button><button class="btn red sm" onclick="resign()">🏳️ ${t('Pes Et')}</button>`;
}
function setStatus(m, c = '') { const s = $('gstatus'); s.innerHTML = m; s.className = c; }
const myTurn = () => G && !G.over && !G.busy && G.st.turn === 0 && G.kind !== 'spectate';
function gRender() {
  if (!G) return;
  const o = { ...gBase(), st: G.st, onClick: gClick };
  if (myTurn()) {
    if (G.cardSel) o.tgt = new Set(G.cardSel === 'swap' ? Engine.cardOptions(G.st, 0, 'swap') : Engine.cardOptions(G.st, 0, G.cardSel));
    else o.click = new Set(Engine.legalMoves(G.st, 0));
    if (G.hint != null) o.target = G.hint;
  }
  renderBoard($('gboard'), G.st.b, o);
  $('g-s0').textContent = Engine.score(G.st, 0); $('g-s1').textContent = Engine.score(G.st, 1);
  $('pb0').classList.toggle('turn', G.st.turn === 0 && !G.over); $('pb1').classList.toggle('turn', G.st.turn === 1 && !G.over);
  $('g-me').textContent = myTurn() ? (G.cardSel ? t('Kart için hedef seç') : t('Senin sıran')) : '';
  renderCards();
}
function renderCards() {
  for (const p of [0, 1]) {
    const el = $('g-cards' + p);
    if (!G.st.cards) { el.innerHTML = ''; continue; }
    const c = G.st.cards[p];
    if (p === 0 && G.kind !== 'spectate') el.innerHTML = Object.keys(CARDS).map(k => `<button class="cardbtn ${c[k] ? '' : 'used'} ${G.cardSel === k ? 'sel' : ''}" title="${esc(nm(CARDS[k]) + ': ' + dsc(CARDS[k]))}" onclick="cardClick('${k}')">${CARDS[k].icon}</button>`).join('');
    else el.innerHTML = Object.keys(CARDS).map(k => `<span class="cardbtn mini ${c[k] ? '' : 'used'}" title="${esc(nm(CARDS[k]))}">${CARDS[k].icon}</span>`).join('');
  }
}
function cardClick(k) {
  if (!myTurn() || !G.st.cards || !G.st.cards[0][k]) return;
  if (G.cardSel === k) { G.cardSel = null; gRender(); return; }
  const opts = Engine.cardOptions(G.st, 0, k);
  if (!opts.length) { toast(t('Bu kartı şu an kullanamazsın.')); return; }
  if (k === 'shield') { sendAct({ type: 'card', card: 'shield', arg: -1 }); return; }
  G.cardSel = k; Sound.sfx.click();
  setStatus(k === 'freeze' ? '❄️ ' + t('Dondurmak için rakibin bir kuyusunu seç.') : '🔀 ' + t('Takas için kendi kuyunu seç (sağındaki/altındaki komşusuyla yer değişir).'), 'info');
  gRender();
}
function gClick(i, el) {
  if (!myTurn()) return;
  if (G.cardSel) {
    const opts = Engine.cardOptions(G.st, 0, G.cardSel);
    if (!opts.includes(i)) { el.classList.add('shake'); Sound.sfx.error(); return; }
    const c = G.cardSel; G.cardSel = null; sendAct({ type: 'card', card: c, arg: i }); return;
  }
  if (!isPit(0, i)) { toast(i === 6 || i === 13 ? t('Hazineden oynanmaz.') : t('Sadece kendi kuyularından oynayabilirsin.')); Sound.sfx.error(); return; }
  if (!Engine.legalMoves(G.st, 0).includes(i)) { el.classList.add('shake'); Sound.sfx.error(); vib(40); toast(G.st.frozen && G.st.frozen.pit === i ? '❄️ ' + t('Bu kuyu donduruldu!') : t('Boş kuyu oynanamaz.')); return; }
  sendAct({ type: 'move', pit: i });
}
function sendAct(act) {
  G.hint = null; clearBlitz();
  if (G.kind === 'online') { G.busy = true; gRender(); netSend(act.type === 'move' ? { t: 'move', pit: act.pit } : { t: 'card', card: act.card, arg: act.arg }); return; }
  doAct(0, act);
}
/* Bir hamleyi görsel olarak uygula; stNext verilirse (sunucu) son durum odur */
async function playAct(p, act, stNext) {
  const st0 = G.st, wrap = $('gboard').parentElement;
  let r = null, st1;
  if (act.type === 'move') {
    const res = Engine.play(st0, p, act.pit, true);
    if (!res) { if (stNext) { G.st = stNext; gRender(); } return null; }
    r = res.r; st1 = stNext || res.st;
    const oppBefore = Engine.sideSum(st0.b, 1 - p);
    await animate($('gboard'), st0, p, act.pit, r, st1, { ...gBase(), ko: !!st1.over && G.kind !== 'puzzle' });
    comboFx(p, r);
    if (p === 0 && G.kind !== 'spectate') afterMyMove(st0, st1, r, oppBefore);
  } else {
    st1 = stNext || Engine.useCard(st0, p, act.card, act.arg);
    if (!st1) return null;
    await animateCard($('gboard'), st0, p, act.card, act.arg, st1, gBase());
  }
  if (G.acts) G.acts.push({ by: p, ...act });
  G.st = st1;
  return { r, st1, act };
}
function comboFx(p, r) {
  if (!G || !r) return; const el = document.querySelector(`#gboard [data-i="${STORE[p]}"]`);
  if (r.extra) { G.combo = (G.combo || 0) + 1; if (G.combo >= 2) { FX.combo(G.combo, el); if (p === 0 && G.combo >= 3 && G.kind !== 'spectate' && G.kind !== 'puzzle') unlockAch('kombo3'); } }
  else G.combo = 0;
  if (r.cap && r.cap.amount >= 6) FX.megaCapture(r.cap.amount, el);
}
function afterMyMove(st0, st1, r, oppBefore) {
  if (G.kind === 'puzzle') return;
  G.turnGain = (G.turnGain || 0) + (st1.b[6] - st0.b[6]);
  if (G.turnGain >= 10) unlockAch('hazine_canavari');
  if (oppBefore > 0 && r.afterCap && Engine.sideSum(r.afterCap, 1) === 0 && r.cap) unlockAch('tertemiz');
  if (r.cap && r.cap.type === 'even') { track('even'); S.totals.even++; if (S.totals.even >= 50) unlockAch('cift50'); if (curEvent().id === 'ciftfest') addCoins(5); }
  if (r.cap && r.cap.type === 'empty') { track('empty'); S.totals.empty++; }
  if (r.extra) { track('extra'); S.totals.extra++; }
  persist();
}
function statusFor(p, out) {
  if (!out) return ['', ''];
  const { r, act } = out, who = p === 0 ? (G.kind === 'spectate' ? G.players[0].name : t('Sen')) : (G.kind === 'spectate' ? G.players[1].name : G.opp.name), me = p === 0 && G.kind !== 'spectate';
  if (act.type === 'card') return [`${CARDS[act.card].icon} ${me ? t('{0} kartını kullandın!', nm(CARDS[act.card])) : t('{0} {1} kartını kullandı!', esc(who), nm(CARDS[act.card]))}`, 'info'];
  if (r.blocked) return [`🛡️ ${t('Kalkan taşları korudu!')}`, 'info'];
  if (r.cap && r.cap.type === 'even') return [me ? '💰 ' + t('Çift sayı kuralı! {0} taş kazandın.', r.cap.amount) : '⚠️ ' + t('{0} çift sayı kuralıyla {1} taş aldı.', esc(who), r.cap.amount), me ? 'good' : 'bad'];
  if (r.cap && r.cap.type === 'empty') return [me ? '🎯 ' + t('Boş kuyu kuralı! {0} taş kazandın.', r.cap.amount) : '⚠️ ' + t('{0} boş kuyu kuralıyla {1} taş aldı.', esc(who), r.cap.amount), me ? 'good' : 'bad'];
  if (r.mysteryHit) return ['❓ ' + t('{0} gizemli kuyuya son taşı düşürdü: +2 puan!', esc(who)), 'info'];
  if (r.extra) return [me ? '⭐ ' + t('Son taş hazinene düştü — tekrar oyna!') : '⭐ ' + t('{0} tekrar oynuyor.', esc(who)), 'info'];
  return ['', ''];
}
async function doAct(p, act) {
  if (!G || G.over) return;
  G.busy = true; gRender();
  const g = G;
  if (p === 0 && act.type === 'move') G.scoreHist.push(Engine.score(G.st, 0) - Engine.score(G.st, 1));
  const out = await playAct(p, act);
  if (G !== g || !out) { if (G === g) { G.busy = false; gRender(); } return; }
  if (G.kind === 'puzzle') return puzzleAfter(out);
  if (G.st.over) { G.busy = false; return endGame(out.r, {}); }
  const [msg, cls] = statusFor(p, out);
  if (G.st.turn === 0 && p === 1) G.turnGain = 0;
  setStatus(msg || (G.st.turn === 0 ? t('Senin sıran. Bir kuyu seç.') : `${esc(G.opp.name)} ${t('düşünüyor...')}`), cls);
  G.busy = false; gRender();
  if (G.kind === 'chat') { if (G.st.turn === 1) setTimeout(() => G && G.kind === 'chat' && !G.over && Chat.startVote(), 700); else Chat.drawVotes(); }
  if (G.kind === 'bot' || G.kind === 'btour') {
    botReact(p, out);
    if (G.st.turn === 1) setTimeout(botTurn, out.r && (out.r.cap || out.r.extra) ? 800 : act.type === 'card' ? 500 : 380);
    else startBlitz();
  }
}
function botTurn() {
  if (!G || (G.kind !== 'bot' && G.kind !== 'btour') || G.over || G.st.turn !== 1) return;
  G.busy = true; gRender();
  $('g-think').innerHTML = `<span class="dots">${t('düşünüyor')}</span>`;
  const g = G;
  if (G.mode === 'blitz') setTimer(1, BLITZ_MS);
  setTimeout(() => {
    if (G !== g) return;
    const t0 = performance.now(), a = Engine.botAction(G.st, G.bot.ai), dt = performance.now() - t0;
    setTimeout(() => { if (G !== g) return; $('g-think').textContent = ''; doAct(1, a); }, Math.max(0, (G.mode === 'blitz' ? 250 : 450) - dt));
  }, 60);
}
function botReact(p, out) {
  if (!out.r || !out.r.cap || Math.random() > 0.4) return;
  setTimeout(() => { if (!G || G.over || G.kind === 'online') return;
    if (p === 1) showEmote(1, Math.random() < .5 ? 'e' : 'm', Math.random() < .5 ? 'temel:1' : 'temel:2');
    else showEmote(1, Math.random() < .5 ? 'e' : 'm', out.r.cap.amount >= 5 ? 'temel:2' : 'temel:4'); }, 500);
}
/* ---------- zamanlayıcı (yıldırım / çevrimiçi) ---------- */
function setTimer(p, ms) {
  for (const q of [0, 1]) { const tb = $('tb' + q), i = tb.firstElementChild;
    if (ms == null || q !== p || !G || G.over) { tb.classList.remove('on'); continue; }
    tb.classList.add('on'); i.classList.remove('low'); i.style.transition = 'none'; i.style.width = '100%'; void i.offsetWidth;
    i.style.transition = `width ${ms}ms linear`; i.style.width = '0%';
    clearTimeout(tb._low); tb._low = setTimeout(() => i.classList.add('low'), ms * 0.65); }
}
let blitzT = null, blitzTick = null;
function clearBlitz() { clearTimeout(blitzT); clearInterval(blitzTick); }
function startBlitz() {
  clearBlitz();
  if (!G || G.mode !== 'blitz' || G.kind === 'online' || G.over || G.st.turn !== 0) { if (G && G.kind !== 'online') setTimer(0, null); return; }
  setTimer(0, BLITZ_MS);
  let left = BLITZ_MS; blitzTick = setInterval(() => { left -= 1000; if (left <= 3000 && left > 0) Sound.sfx.tick(); }, 1000);
  blitzT = setTimeout(() => { if (!myTurn()) return; const ms = Engine.legalMoves(G.st, 0); toast('⏰ ' + t('Süre doldu! Rastgele hamle yapıldı.')); G.cardSel = null; sendAct({ type: 'move', pit: ms[Math.floor(Math.random() * ms.length)] }); }, BLITZ_MS);
}

/* ---------- Bot maçı ---------- */
function startBot(id, opts = {}) {
  const bot = BOTS.find(b => b.id === id), mode = opts.mode || S.botMode || 'classic';
  const st = Engine.newState(mode, Math.floor(Math.random() * 2 ** 31), Math.random() < .5 ? 0 : 1);
  G = { kind: opts.btour ? 'btour' : 'bot', bot, mode, st, init: Engine.clone(st), acts: [], scoreHist: [], over: false, busy: false, turnGain: 0,
    opp: { name: opts.name || nm(bot), avatar: { e: bot.emoji, bg: bot.bg }, frame: 'yok', hand: bot.hand, label: LANG === 'en' ? bot.len : bot.lvl } };
  go('game'); setupGameUI(); gRender();
  setStatus(st.turn === 0 ? '🎲 ' + t('Kura: Sen başlıyorsun!') : '🎲 ' + t('Kura: {0} başlıyor.', esc(G.opp.name)), 'info');
  setTimer(0, null);
  if (st.turn === 1) setTimeout(botTurn, 1100); else startBlitz();
  if (Math.random() < .5) setTimeout(() => G && G.kind !== 'online' && showEmote(1, 'm', 'temel:0'), 700);
}
async function resign() {
  if (!G || G.over) return;
  if (G.kind === 'puzzle') { G = null; return go('puzzles'); }
  const ok = await modal(`<div class="big">🏳️</div><h3>${t('Pes etmek istiyor musun?')}</h3><p>${t('Bu oyun mağlubiyet sayılır ve para kazanamazsın.')}</p>`, [{ label: t('Devam Et'), cls: 'sec', value: false }, { label: t('Pes Et'), cls: 'red', value: true }]);
  if (ok) resignNow();
}
async function resignNow() {
  if (!G || G.over) return;
  if (G.kind === 'online') { netSend({ t: 'resign' }); return; }
  if (G.kind === 'puzzle') { G = null; return go('puzzles'); }
  endGame(null, { reason: 'resign', resignedMe: true });
}
async function endGame(r, opt = {}) {
  if (!G || G.over) return;
  G.over = true; G.busy = false; clearBlitz(); setTimer(0, null); closePanel(); gRender();
  const online = G.kind === 'online', bot = G.bot, mode = G.mode;
  const me = Engine.score(G.st, 0), op = Engine.score(G.st, 1);
  let outcome;
  if (opt.res) outcome = opt.res;
  else if (opt.reason === 'resign') outcome = opt.resignedMe ? 'loss' : 'win';
  else { const w = Engine.winnerOf(G.st); outcome = w === -1 ? 'draw' : w === 0 ? 'win' : 'loss'; }
  const title = { win: t('KAZANDIN!'), loss: t('Kaybettin'), draw: t('Berabere!') }[outcome], big = { win: '🏆', loss: '😔', draw: '🤝' }[outcome];
  // ödüller
  const baseR = bot ? bot.reward : 150;
  let coins = online ? ONLINE_REWARD[outcome] : outcome === 'win' ? baseR : outcome === 'draw' ? Math.round(baseR / 2) : 10;
  if (G.kind === 'btour') coins = 0;
  if (opt.resignedMe) coins = 0;
  coins *= coinMult();
  const xp = opt.resignedMe ? 10 : Math.round(xpFor(outcome, bot, online) * (curEvent().xpMult || 1));
  const T = S.totals; T.games++; if (outcome === 'win') T.wins++; if (outcome === 'draw') T.draws++;
  if (online) { T.online++; if (outcome === 'win') T.onlineWins++; }
  if (!opt.reason) T.best = Math.max(T.best, me);
  if (bot) { const st = stat(bot.id); st[outcome === 'win' ? 'w' : outcome === 'draw' ? 'd' : 'l']++; }
  track('play'); if (online) track('onlineplay'); if (mode === 'blitz') track('blitz'); if (PARTY.includes(mode)) track('party');
  if (outcome === 'win') { track('win'); if (online || (bot && bot.stars >= 3)) track('hardwin'); }
  if (!opt.reason && me >= 25 && mode !== 'reverse') track('big');
  // başarımlar
  if (outcome === 'win') {
    S.streak++; unlockAch('ilk_zafer'); if (S.streak >= 5) unlockAch('seri5');
    if (bot) { if (bot.id === 'efsane') unlockAch('efsane_avcisi'); if (!S.botsBeaten.includes(bot.id)) S.botsBeaten.push(bot.id); if (S.botsBeaten.length >= BOTS.length) unlockAch('tum_botlar'); }
    if (mode === 'blitz') unlockAch('yildirim'); if (PARTY.includes(mode)) unlockAch('kaos'); if (mode === 'reverse') unlockAch('ters_dahi');
    if (G.kind === 'chat') unlockAch('chat_yendi'); if (Cam.on) unlockAch('kamera_zafer');
    if (online) unlockAch('online_zafer'); if (me >= 36 && mode !== 'reverse') unlockAch('ezici');
    if (!opt.reason && G.scoreHist.slice(-3).some(d => mode === 'reverse' ? d > 0 : d < 0)) unlockAch('clutch');
  } else if (outcome === 'loss') S.streak = 0;
  if (T.games >= 100) unlockAch('maraton');
  if (coins) S.coins += coins;
  if (opt.elo && AUTH.user) { AUTH.user.elo = opt.elo.elo; checkLeague(opt.elo.elo); }
  saveReplay(outcome, me, op);
  persist();
  const xr = addXP(xp);
  if (outcome === 'win') { Sound.sfx.win(); Sound.sfx.cheer(); confetti(); vib([40, 60, 40, 60, 80]); } else if (outcome === 'loss') Sound.sfx.defeat();
  if (!opt.reason || opt.reason === 'timeout') FX.bigText(outcome === 'win' ? t('ZAFER!') : outcome === 'loss' ? t('K.O.') : t('BERABERE!'), 'ko-' + outcome, 1700);
  if (online) lsDel('mangala_resume');
  let endTxt = '';
  if (r && r.end) endTxt = `<p class="muted small">${r.end.collector === 0 ? t('Taşlarını ilk sen bitirdin') : t('{0} taşlarını ilk bitirdi', esc(G.opp.name))} · +${r.end.amount}</p>`;
  if (opt.reason === 'left') endTxt = `<p class="muted">${t('Rakibin oyundan ayrıldı.')}</p>`;
  if (opt.reason === 'resign') endTxt = `<p class="muted">${opt.resignedMe ? t('Pes ettin.') : t('Rakibin pes etti.')}</p>`;
  if (opt.reason === 'admin') endTxt = `<p class="muted">${t('Maç admin tarafından kapatıldı.')}</p>`;
  setStatus(`${big} ${title} — ${me} : ${op}`, outcome === 'win' ? 'good' : outcome === 'loss' ? 'bad' : 'info');
  updTop(true);
  const rw = [coins ? `+${coins} 🪙${coinMult() > 1 ? ' (2x)' : ''}` : '', `+${xp} XP`, xr.levelUp ? `⬆ ${t('Seviye')} ${xr.levelUp}! +${xr.lvCoins} 🪙` : '', xr.tierUp ? `🎫 ${t('Kademe')} ${xr.tierUp}!` : '',
    opt.elo ? `${leagueBadge(opt.elo.elo)} ${opt.elo.elo} (${opt.elo.delta > 0 ? '+' : ''}${opt.elo.delta})` : ''].filter(Boolean);
  const html = `<div class="big">${big}</div><h3>${title}</h3>${mode === 'reverse' ? `<p class="small" style="color:#d9c6ff">🔄 ${t('Ters modda az taş kazanır')}</p>` : ''}<p style="font-size:21px;font-weight:900">${esc(myName())} ${me} — ${op} ${esc(G.opp.name)}</p>${endTxt}<div class="rewards">${rw.map(x => `<span>${x}</span>`).join('')}</div>`;
  if (!online && Math.random() < .6) setTimeout(() => G && showEmote(1, 'm', outcome === 'win' ? 'temel:2' : 'temel:1'), 400);
  const hasReplay = G.acts && G.acts.length > 0;
  await wait(opt.reason ? 300 : 1200);
  const rageBtn = outcome === 'loss' ? [{ label: '🤬 ' + t('Masayı Devir'), cls: 'red', value: 'rage' }] : [];
  const ask = async (h, btns) => { let v; while ((v = await modal(h, btns)) === 'rage') await rageQuit(); return v; };
  if (G.kind === 'btour') { btourAfterMatch(outcome); return; }
  if (online) {
    if (G.tour) {
      const v = await modal(html, [...(hasReplay ? [{ label: '🎬 ' + t('Tekrar İzle'), cls: 'sec', value: 'rep' }] : []), { label: '🏆 ' + t('Turnuvaya Dön'), value: 'tour' }]);
      if (v === 'rep') { G = null; viewReplay(0, 'tour'); } else { G = null; tourView = 'online'; go('tour'); }
      return;
    }
    const v = await ask(html + `<p class="muted small" id="remtxt"></p>`, [...rageBtn, { label: t('Menü'), cls: 'sec', value: 'menu' }, ...(hasReplay ? [{ label: '🎬', cls: 'sec', value: 'rep' }] : []), ...(G.oppLeft ? [] : [{ label: '🔁 ' + t('Rövanş'), value: 'rematch' }])]);
    if (v === 'rematch' && G && !G.oppLeft) {
      netSend({ t: 'rematch' }); G.waitingRematch = true; setStatus('🔁 ' + t('Rövanş isteği gönderildi, rakip bekleniyor...'), 'info');
      const v2 = await modal(`<div class="spinner"></div><h3>${t('Rakip bekleniyor')}</h3>`, [{ label: t('Vazgeç'), cls: 'sec', value: 'menu' }]);
      if (v2 === 'menu') { netSend({ t: 'leave' }); G = null; go('menu'); }
    } else { netSend({ t: 'leave' }); G = null; if (v === 'rep') viewReplay(0); else go('menu'); }
    return;
  }
  const v = await ask(html, [...rageBtn, { label: t('Menü'), cls: 'sec', value: 'menu' }, ...(hasReplay ? [{ label: '🎬 ' + t('Tekrar İzle'), cls: 'sec', value: 'rep' }] : []), { label: t('Tekrar Oyna'), value: 'again' }]);
  const kind = G.kind, bid = bot && bot.id; G = null;
  if (v === 'again') { if (kind === 'chat') Chat.start(); else startBot(bid, { mode }); } else if (v === 'rep') viewReplay(0); else go(v);
}
async function rageQuit() {
  if (G && G.kind === 'online') netSend({ t: 'emote', kind: 'e', id: 'temel:4' });
  await FX.rageQuit($('gboard'));
  S.rages = (S.rages || 0) + 1; unlockAch('masa_devir'); persist();
  FX.bigText(t('MASA DEVRİLDİ!'), 'mega', 1300);
}
function saveReplay(res, me, op) {
  if (!G.acts || !G.acts.length || !G.init) return;
  S.replays.unshift({ id: Date.now(), date: Date.now(), kind: G.kind, mode: G.mode, opp: G.opp.name, oppAv: G.opp.avatar, init: G.init, acts: G.acts, me, op, res, hands: [S.eq.hand, G.opp.hand || 'klasik'] });
  S.replays = S.replays.slice(0, 15);
}

/* ---------- Emoji & hazır mesajlar (maçtan çıkmadan) ---------- */
let panelKind = null, lastEmote = 0;
function togglePanel(k) {
  const p = $('emopanel');
  if (panelKind === k) { closePanel(); return; }
  panelKind = k; p.classList.add('on');
  if (k === 'e') p.innerHTML = S.own.emojis.map(id => { const it = item('emojis', id); return `<div class="packlbl">${nm(it)}</div><div class="emogrid">${it.list.map((e, i) => `<button onclick="sendEmote('e','${id}:${i}')">${e}</button>`).join('')}</div>`; }).join('') + `<p class="muted small" style="margin:4px 0 0">💡 ${t('Yeni paketler menüdeki Mağaza\'da.')}</p>`;
  else p.innerHTML = S.own.msgs.map(id => { const it = item('msgs', id); return `<div class="packlbl">${nm(it)}</div><div class="msggrid" style="margin-bottom:8px">${msgList(it).map((m, i) => `<button onclick="sendEmote('m','${id}:${i}')">${esc(m)}</button>`).join('')}</div>`; }).join('') + `<p class="muted small" style="margin:4px 0 0">💡 ${t('Yeni paketler menüdeki Mağaza\'da.')}</p>`;
}
function closePanel() { panelKind = null; const p = $('emopanel'); if (p) p.classList.remove('on'); }
function sendEmote(kind, id) {
  if (!G || G.kind === 'spectate') return;
  if (Date.now() - lastEmote < 1600) { toast(t('Biraz bekle...')); return; }
  lastEmote = Date.now(); closePanel(); showEmote(0, kind, id); track('emote');
  if (G.kind === 'online') netSend({ t: 'emote', kind, id });
  else if (Math.random() < .45) setTimeout(() => G && showEmote(1, Math.random() < .5 ? 'e' : 'm', 'temel:' + [0, 1, 3, 2][Math.floor(Math.random() * 4)]), 900);
}
function showEmote(p, kind, id) {
  const [pack, i] = id.split(':'), it = (kind === 'e' ? CAT.emojis : CAT.msgs)[pack]; if (!it) return;
  const v = kind === 'e' ? it.list[+i] : msgList(it)[+i]; if (v == null) return;
  const b = $('bub' + p); if (!b) return;
  b.className = 'bubble ' + (kind === 'e' ? 'emo a-' + it.anim : ''); b.innerHTML = kind === 'e' ? `<span class="em">${v}</span>` : esc(v);
  void b.offsetWidth; b.classList.add('on'); Sound.sfx.pop();
  if (kind === 'e') { const [x, y] = FX.at(b); FX.burst(x, y, v, 9, 0.7); }
  clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('on'), 2600);
}
function showRulesModal() { modal(`<div class="panel" style="text-align:left;max-height:60vh;overflow:auto;padding:4px 6px;background:none;border:0">${RULES[LANG === 'en' ? 'en' : 'tr']}</div>`, [{ label: t('Tamam'), value: 1 }]); }

/* =========================================================
   MOD SEÇİMİ / BOTLAR / BULMACALAR
   ========================================================= */
RENDER.mode = () => {
  $('scr-mode').innerHTML = `<button class="btn sec sm back" onclick="go('menu')">← ${t('Menü')}</button><h2>${t('Nasıl oynamak istersin?')}</h2>
    <div class="modes">
      <button class="card mcard mode" onclick="go('bots')"><div class="ic">🤖</div><h3>${t('Botlara Karşı')}</h3><p>${t('5 seviye + Yıldırım ve Parti modları')}</p></button>
      <button class="card mcard mode" onclick="onlineTab='play';go('online')"><div class="ic">🌍</div><h3>${t('Çevrimiçi')}</h3><p>${t('Hızlı, dereceli, yıldırım, parti, özel oda')}</p><p style="margin-top:6px"><span class="badge">+%50 XP</span></p></button>
      <button class="card mcard mode invitecard" onclick="inviteFriend()"><div class="ic">🔗</div><h3>${t('Arkadaşla Oyna')}</h3><p>${t('Linki kopyala, WhatsApp\'tan gönder; arkadaşın tek tıkla maça girsin')}</p></button>
      ${S.chatMode ? `<button class="card mcard mode" onclick="Chat.start()"><div class="ic">📺</div><h3>${t('Chat\'e Karşı')}</h3><p>${t('Yayın sohbeti !kuyu 1-6 ile oy verip sana karşı oynar')}</p></button>` : ''}
      <button class="card mcard mode" onclick="go('puzzles')"><div class="ic">🧩</div><h3>${t('Bulmacalar')}</h3><p>${t('{0} taktik görev', PUZZLES.length)}</p></button>
      <button class="card mcard mode" onclick="tourView='bot';go('tour')"><div class="ic">🏆</div><h3>${t('Bot Turnuvası')}</h3><p>${t('4 veya 8 kişilik eleme, ücretsiz katılım')}</p></button>
      <button class="card mcard mode" onclick="onlineTab='tour';go('online')"><div class="ic">🌐🏆</div><h3>${t('Çevrimiçi Turnuva')}</h3><p>${t('Gerçek oyuncularla braket turnuvası')}</p></button>
      <button class="card mcard mode" onclick="openReplays()"><div class="ic">🎬</div><h3>${t('Maç Tekrarları')}</h3><p>${t('Tekrar izle + Yapay Zekâ Koçu')}</p></button>
    </div>`;
};
const modeChips = (cur, fn, list = Object.keys(MODES)) => `<div class="chips">${list.map(k => `<button class="chip ${cur === k ? 'on' : ''}" onclick="${fn}('${k}')">${MODES[k].icon} ${nm(MODES[k])}<small>${dsc(MODES[k])}</small></button>`).join('')}</div>`;
function setBotMode(k) { S.botMode = k; persist(); RENDER.bots(); }
RENDER.bots = () => {
  $('scr-bots').innerHTML = `<button class="btn sec sm back" onclick="go('mode')">← ${t('Geri')}</button><h2>${t('Rakibini Seç')}</h2>
    <div class="card" style="margin-bottom:12px"><b>🎮 ${t('Oyun modu')}</b><div style="margin-top:8px">${modeChips(S.botMode, 'setBotMode')}</div></div>
    <div class="bots">${BOTS.map(b => { const own = S.bots.includes(b.id) || isAdmin(), st = stat(b.id);
      return `<div class="card botc ${own ? '' : 'locked'}">${own ? '' : '<span class="lockbadge">🔒</span>'}
        <div>${avatarHTML({ e: b.emoji, bg: b.bg }, 'yok', 62)}</div><h3>${nm(b)}</h3>
        <span class="lv" style="background:${b.color}22;color:${b.color};border:1px solid ${b.color}">${LANG === 'en' ? b.len : b.lvl}</span>
        <div class="stars">${'★'.repeat(b.stars)}<span style="opacity:.25">${'★'.repeat(5 - b.stars)}</span></div>
        <div class="muted small">${dsc(b)}</div>
        <div class="rec">${t('Galibiyet')}: <b style="color:var(--gold)">+${b.reward * coinMult()} 🪙</b> · <b style="color:#7bd3ff">+${xpFor('win', b)} XP</b>${own ? `<br>${st.w}G ${st.d}B ${st.l}M` : ''}</div>
        ${own ? `<button class="btn" onclick="startBot('${b.id}')">⚔️ ${t('Oyna')}</button>` : `<button class="btn ${S.coins >= b.price ? '' : 'sec'}" onclick="buyBot('${b.id}')">🔓 ${t('Kilidi Aç')} · ${b.price} 🪙</button>`}</div>`; }).join('')}</div>`;
};
async function buyBot(id) {
  const b = BOTS.find(x => x.id === id);
  if (!isAdmin() && S.coins < b.price) { Sound.sfx.error(); toast(t('Yetersiz para! {0} 🪙 daha lazım.', b.price - S.coins)); return; }
  const ok = await modal(`${avatarHTML({ e: b.emoji, bg: b.bg }, 'yok', 80)}<h3>${nm(b)}</h3><p>${t('Bu rakibin kilidini {0} 🪙 karşılığında aç?', b.price)}</p>`, [{ label: t('Vazgeç'), cls: 'sec', value: false }, { label: t('Kilidi Aç'), value: true }]);
  if (!ok || !spend(b.price)) return;
  S.bots.push(id); persist(); updTop(true); Sound.sfx.coin(); toast(`${b.emoji} ${t('{0} artık seninle oynamaya hazır!', nm(b))}`); RENDER.bots();
}
/* ---------- bulmacalar ---------- */
const puzzleOpen = i => isAdmin() || i === 0 || S.puzzles[i - 1] || S.puzzles[i];
const ptype = { even: '✌️', empty: '🎯', gain: '💰', chain: '⭐' };
RENDER.puzzles = () => {
  $('scr-puzzles').innerHTML = `<button class="btn sec sm back" onclick="go('mode')">← ${t('Geri')}</button><h2>🧩 ${t('Bulmacalar')} (${Object.keys(S.puzzles).length}/${PUZZLES.length})</h2>
    <p class="muted" style="margin-top:-6px">${t('Rakip hamle yapmaz; sadece senin turun. Hedefe ulaşan hamle dizisini bul! İlk çözüm: +40 🪙 ve 50 XP.')}</p>
    <div class="items">${PUZZLES.map((p, i) => { const open = puzzleOpen(i), done = S.puzzles[i];
      return `<button class="card item" style="text-align:left;${done ? 'border-color:var(--green)' : ''}" ${open ? `onclick="startPuzzle(${i})"` : 'disabled'}>
        <div class="row between"><b style="font-size:20px">#${i + 1}</b><span style="font-size:24px">${done ? '✅' : open ? ptype[p.type] : '🔒'}</span></div>
        <div class="small">${puzzleGoal(p)}</div><div class="stars small">${'★'.repeat(Math.min(5, p.sol.length))}</div></button>`; }).join('')}</div>`;
};
const puzzleGoal = p => (PUZZLE_TEXT[p.type][LANG === 'en' ? 'en' : 'tr']).replace('{0}', p.target);
function startPuzzle(i) {
  const p = PUZZLES[i];
  G = { kind: 'puzzle', mode: 'classic', st: Engine.newState('classic', 1, 0, p.board), puzzle: { idx: i, acc: { gain: 0, even: 0, empty: 0, extra: 0 }, seq: [] }, over: false, busy: false, scoreHist: [],
    opp: { name: '🧩 ' + t('Bulmaca'), avatar: { e: '🧩', bg: '#a5d8ff,#1864ab' }, frame: 'yok', hand: 'klasik', label: '' } };
  go('game'); setupGameUI();
  $('g-puzzle').innerHTML = `<div><b>🧩 #${i + 1}</b> — ${puzzleGoal(p)}</div><span class="badge" id="pz-prog"></span>`;
  updPuzzleProg(); setStatus(t('Rakip oynamaz. Hedefe tek turda ulaş!'), 'info'); gRender();
}
function updPuzzleProg() {
  const p = PUZZLES[G.puzzle.idx], a = G.puzzle.acc, v = { even: a.even, empty: a.empty, gain: a.gain, chain: a.extra }[p.type];
  $('pz-prog').textContent = `${Math.min(v, p.target)} / ${p.target}`;
  return v >= p.target;
}
async function puzzleAfter(out) {
  const a = G.puzzle.acc, r = out.r, st0b = null;
  G.puzzle.seq.push(out.act.pit);
  a.gain = G.st.b[6] - PUZZLES[G.puzzle.idx].board[6];
  if (r.cap && r.cap.type === 'even') a.even += r.cap.amount;
  if (r.cap && r.cap.type === 'empty') a.empty += r.cap.amount;
  if (r.extra) a.extra++;
  const ok = updPuzzleProg();
  if (ok) return puzzleSolved();
  if (G.st.over || G.st.turn !== 0) {
    G.busy = false; G.over = true; gRender(); Sound.sfx.defeat();
    const v = await modal(`<div class="big">🤔</div><h3>${t('Olmadı!')}</h3><p class="muted">${t('Turun bitti ama hedefe ulaşamadın. Tekrar dene!')}</p>`, [{ label: t('Çık'), cls: 'sec', value: 0 }, { label: '💡 ' + t('İpucu'), cls: 'sec', value: 2 }, { label: '🔄 ' + t('Tekrar'), value: 1 }]);
    const idx = G.puzzle.idx; if (v === 0) { G = null; go('puzzles'); } else { startPuzzle(idx); if (v === 2) puzzleHint(); }
    return;
  }
  setStatus('⭐ ' + t('Tekrar senin sıran! Devam et.'), 'info'); G.busy = false; gRender();
}
async function puzzleSolved() {
  const i = G.puzzle.idx, first = !S.puzzles[i];
  G.over = true; G.busy = false; gRender();
  S.puzzles[i] = 1; track('puzzle');
  if (first) { S.coins += 40; persist(); addXP(50); }
  const n = Object.keys(S.puzzles).length; if (n >= 5) unlockAch('bulmaca5'); if (n >= PUZZLES.length) unlockAch('bulmaca_hepsi');
  persist(); updTop(true); Sound.sfx.win(); confetti();
  const hasNext = i + 1 < PUZZLES.length;
  const v = await modal(`<div class="big">🧠</div><h3>${t('Çözdün!')}</h3><p>${t('Bulmaca #{0} tamamlandı.', i + 1)}</p>${first ? `<div class="rewards"><span>+40 🪙</span><span>+50 XP</span></div>` : ''}`,
    [{ label: t('Liste'), cls: 'sec', value: 'list' }, ...(hasNext ? [{ label: t('Sonraki →'), value: 'next' }] : [])]);
  G = null; if (v === 'next') startPuzzle(i + 1); else go('puzzles');
}
function puzzleHint() {
  if (!G || G.kind !== 'puzzle') return;
  const p = PUZZLES[G.puzzle.idx], seq = G.puzzle.seq;
  const onTrack = seq.every((m, k) => p.sol[k] === m);
  if (!onTrack) { toast('💡 ' + t('Bu yol çözüme gitmiyor. Sıfırla ve tekrar dene.')); return; }
  G.hint = p.sol[seq.length]; gRender(); toast('💡 ' + t('Parlayan kuyuyu dene!'));
}

/* =========================================================
   BOT TURNUVASI (çevrimdışı)
   ========================================================= */
let tourView = 'bot';
const BT_PRIZE = { 4: { coins: 200, xp: 150 }, 8: { coins: 400, xp: 300 } };   // ücretsiz katılım, sabit ödül
async function startBotTour(size) {
  const pr = BT_PRIZE[size];
  const ok = await modal(`<div class="big">🏆</div><h3>${t('{0} kişilik Bot Turnuvası', size)}</h3><p>${t('Katılım ücretsiz · Şampiyon ödülü: {0} 🪙 + {1} XP', pr.coins, pr.xp)}</p><p class="muted small">${t('Elenene kadar oynarsın. Şampiyon ödülü kazanır!')}</p>`, [{ label: t('Vazgeç'), cls: 'sec', value: 0 }, { label: t('Katıl'), value: 1 }]);
  if (!ok) return;
  let pool = size === 4 ? shuffled(BOTS.map(b => b.id), 'bt' + Date.now()).slice(0, 3) : [...BOTS.map(b => b.id), ...shuffled(BOTS.map(b => b.id), 'bt2' + Date.now()).slice(0, 2)];
  const used = {};
  const ents = [{ me: true, name: myName() }, ...pool.map(id => { used[id] = (used[id] || 0) + 1; const b = BOTS.find(x => x.id === id); return { bot: id, name: nm(b) + (used[id] > 1 ? ' II' : '') }; })];
  const order = shuffled(ents.map((_, i) => i), 'o' + Date.now());
  const E2 = order.map(i => ents[i]);
  const r0 = []; for (let i = 0; i < size; i += 2) r0.push({ a: i, b: i + 1, winner: null });
  S.btour = { size, prize: pr, ents: E2, rounds: [r0], round: 0, status: 'running' };
  persist(); updTop(true); tourView = 'bot'; go('tour');
}
function simBotMatch(aId, bId) {
  const A = BOTS.find(b => b.id === aId), B = BOTS.find(b => b.id === bId);
  const ai = b => b.ai.easy ? { easy: true } : { depth: Math.min(b.ai.depth, 3) };
  let st = Engine.newState('classic', Math.floor(Math.random() * 1e9), Math.random() < .5 ? 0 : 1), n = 0;
  while (!st.over && n++ < 300) { const a = Engine.botAction(st, ai(st.turn === 0 ? A : B)); st = Engine.play(st, st.turn, a.pit).st; }
  let w = st.winner; if (w === -1 || w == null) w = Math.random() < .5 ? 0 : 1;
  return { w, score: [Engine.score(st, 0), Engine.score(st, 1)] };
}
function btourMyMatch() { const T = S.btour; if (!T || T.status !== 'running') return null; return T.rounds[T.round].find(m => m.winner == null && (T.ents[m.a].me || T.ents[m.b].me)); }
function btourPlay() {
  const m = btourMyMatch(); if (!m) return;
  const T = S.btour, opp = T.ents[T.ents[m.a].me ? m.b : m.a];
  startBot(opp.bot, { btour: true, name: opp.name, mode: 'classic' });
}
async function btourAfterMatch(outcome) {
  const T = S.btour, m = btourMyMatch(); const meA = T.ents[m.a].me;
  const html = `<div class="big">${outcome === 'win' ? '🏆' : outcome === 'loss' ? '😔' : '🤝'}</div><h3>${outcome === 'win' ? t('Turu geçtin!') : outcome === 'loss' ? t('Elendin') : t('Berabere! Maç tekrar oynanacak.')}</h3><p style="font-size:20px;font-weight:900">${Engine.score(G.st, 0)} — ${Engine.score(G.st, 1)}</p>`;
  if (outcome !== 'draw') { m.winner = (outcome === 'win') === meA ? m.a : m.b; m.score = meA ? [Engine.score(G.st, 0), Engine.score(G.st, 1)] : [Engine.score(G.st, 1), Engine.score(G.st, 0)]; }
  persist();
  await modal(html, [{ label: '🏆 ' + t('Turnuvaya Dön'), value: 1 }]);
  G = null; tourView = 'bot'; btourAdvance(); go('tour');
}
function btourAdvance() {
  const T = S.btour; if (!T || T.status !== 'running') return;
  while (true) {
    const R = T.rounds[T.round];
    for (const m of R) if (m.winner == null && !T.ents[m.a].me && !T.ents[m.b].me) { const s = simBotMatch(T.ents[m.a].bot, T.ents[m.b].bot); m.winner = s.w === 0 ? m.a : m.b; m.score = s.score; }
    if (R.some(m => m.winner == null)) break;   // senin maçın bekliyor
    if (R.length === 1) {
      T.status = 'done'; T.champion = R[0].winner;
      if (T.ents[T.champion].me) { const pz = T.prize || BT_PRIZE[T.size]; S.coins += pz.coins; addXP(pz.xp); S.tourWins = (S.tourWins || 0) + 1; unlockAch('turnuva'); confetti(); Sound.sfx.win(); setTimeout(() => modal(`<div class="big">👑</div><h3>${t('TURNUVA ŞAMPİYONU!')}</h3><div class="rewards"><span>+${(T.prize || BT_PRIZE[T.size]).coins} 🪙</span><span>+${(T.prize || BT_PRIZE[T.size]).xp} XP</span></div>`, [{ label: t('Harika!'), value: 1 }]), 300); }
      break;
    }
    const next = []; for (let i = 0; i < R.length; i += 2) next.push({ a: R[i].winner, b: R[i + 1].winner, winner: null });
    T.rounds.push(next); T.round++;
  }
  persist(); updTop(true);
}
function roundName(n, total) { const left = total - n; return left === 1 ? t('Final') : left === 2 ? t('Yarı Final') : left === 3 ? t('Çeyrek Final') : t('Tur {0}', n + 1); }
function bracketHTML(T, isMe, liveBtn) {
  const total = Math.log2(T.size);
  let h = '<div class="bracket">';
  for (let r = 0; r < total; r++) {
    const R = T.rounds[r] || Array.from({ length: T.size / 2 ** (r + 1) }, () => ({ a: null, b: null, winner: null }));
    h += `<div class="bround"><h4>${roundName(r, total)}</h4>${R.map(m => { const pl = k => { const i = m[k]; if (i == null) return `<div class="bp muted">—</div>`;
        const e = T.ents ? T.ents[i] : T.players[i]; const w = m.winner != null;
        return `<div class="bp ${w ? (m.winner === i ? 'win' : 'lose') : ''} ${isMe(i) ? 'me' : ''}"><span>${esc(e.name)}</span><span>${m.score ? m.score[k === 'a' ? 0 : 1] : ''}</span></div>`; };
      return `<div class="bmatch">${pl('a')}${pl('b')}${liveBtn ? liveBtn(m) : ''}</div>`; }).join('')}</div>`;
  }
  return h + '</div>';
}
RENDER.tour = () => {
  const el = $('scr-tour');
  if (tourView === 'online') return renderOnlineTour(el);
  const T = S.btour;
  let h = `<button class="btn sec sm back" onclick="go('mode')">← ${t('Geri')}</button><h2>🏆 ${t('Bot Turnuvası')}</h2>`;
  if (!T || T.status === 'done') {
    if (T && T.status === 'done') h += `<div class="card" style="text-align:center;margin-bottom:12px"><div style="font-size:46px">${T.ents[T.champion].me ? '👑' : '🏆'}</div><h3>${t('Şampiyon')}: ${esc(T.ents[T.champion].name)}</h3>${bracketHTML(T, i => T.ents[i].me)}</div>`;
    h += `<div class="modes">${[4, 8].map(n => `<div class="card mode"><div class="ic">${n === 4 ? '🥉' : '🏆'}</div><h3>${t('{0} Kişilik', n)}</h3><p class="muted">${t('Ücretsiz · Şampiyon: {0} 🪙 + {1} XP', BT_PRIZE[n].coins, BT_PRIZE[n].xp)}</p><button class="btn" onclick="startBotTour(${n})">${t('Katıl')}</button></div>`).join('')}</div>`;
  } else {
    const my = btourMyMatch(), elim = !my && T.status === 'running';
    h += `<div class="card"><div class="row between"><b>${t('Şampiyon ödülü')}: ${(T.prize || BT_PRIZE[T.size]).coins} 🪙 + ${(T.prize || BT_PRIZE[T.size]).xp} XP</b><span class="badge">${roundName(T.round, Math.log2(T.size))}</span></div>${bracketHTML(T, i => T.ents[i].me)}
      <div class="row center">${my ? `<button class="btn" onclick="btourPlay()">⚔️ ${t('Maçını Oyna')}</button>` : ''}${elim ? `<span class="muted">${t('Elendin. Turnuva sonuçlanıyor...')}</span>` : ''}</div></div>`;
    if (elim) setTimeout(() => { btourAdvance(); if (curScreen === 'tour') RENDER.tour(); }, 600);
  }
  el.innerHTML = h;
};

/* =========================================================
   MAÇ TEKRARI + YAPAY ZEKÂ KOÇU
   ========================================================= */
let REP = null, repTimer = null;
function openReplays() {
  REP = null; go('replay');
}
RENDER.replay = () => {
  if (REP) return repRender();
  const L = S.replays;
  $('scr-replay').innerHTML = `<button class="btn sec sm back" onclick="go('menu')">← ${t('Menü')}</button><h2>🎬 ${t('Maç Tekrarları')}</h2>
    ${L.length ? `<div class="list">${L.map((r, i) => `<button class="lrow" style="text-align:left" onclick="viewReplay(${i})">${avatarHTML(r.oppAv || 'gulen', 'yok', 38)}<div class="grow"><b>${{ win: '🏆', loss: '😔', draw: '🤝' }[r.res]} ${esc(myName())} ${r.me} – ${r.op} ${esc(r.opp)}</b><span class="muted small">${MODES[r.mode].icon} ${nm(MODES[r.mode])} · ${new Date(r.date).toLocaleString(LANG === 'en' ? 'en-GB' : 'tr-TR', { dateStyle: 'short', timeStyle: 'short' })} · ${r.acts.length} ${t('hamle')}</span></div><span>▶</span></button>`).join('')}</div>`
      : `<div class="card"><p class="muted">${t('Henüz kayıtlı maç yok. Bir maç oyna, son 15 maçın burada saklanır.')}</p></div>`}`;
};
function viewReplay(i, back) {
  const rep = S.replays[i]; if (!rep) return go('menu');
  const states = [Engine.clone(rep.init)], res = [];
  let st = Engine.clone(rep.init);
  for (const a of rep.acts) {
    if (a.type === 'move') { const o = Engine.play(st, a.by, a.pit, true); if (!o) break; res.push(o.r); st = o.st; }
    else { const s = Engine.useCard(st, a.by, a.card, a.arg); if (!s) break; res.push(null); st = s; }
    states.push(st);
  }
  REP = { rep, states, res, idx: 0, notes: null, back: back || 'replay' };
  go('replay');
}
function repRender() {
  const R = REP, rep = R.rep, st = R.states[R.idx], last = R.idx > 0 ? rep.acts[R.idx - 1] : null;
  const canAnalyze = rep.mode === 'classic' || rep.mode === 'blitz';
  const tag = n => !n ? '' : n.best ? `<span class="tag" style="color:var(--gold)">👑 ${t('En iyi')}</span>` : n.loss <= 1 ? `<span class="tag" style="color:var(--green)">✅ ${t('İyi')}</span>` : n.loss <= 4 ? `<span class="tag" style="color:#f0a040">⚠️ ${t('Hata')}</span>` : `<span class="tag" style="color:var(--red)">❌ ${t('Büyük hata')}</span>`;
  const mv = rep.acts.map((a, k) => { const n = R.notes && R.notes[k];
    const who = a.by === 0 ? esc(myName()) : esc(rep.opp);
    const what = a.type === 'move' ? t('{0}. kuyu', (a.by === 0 ? a.pit : a.pit - 7) + 1) : CARDS[a.card].icon + ' ' + nm(CARDS[a.card]);
    const r = R.res[k], fx = r ? (r.cap ? ` · +${r.cap.amount}` : '') + (r.extra ? ' · ⭐' : '') : '';
    return `<button class="mv ${R.idx === k + 1 ? 'cur' : ''}" onclick="repGo(${k + 1})"><span class="n">${k + 1}</span><span style="flex:1"><b>${who}</b>: ${what}${fx} ${tag(n)}${n && n.why ? `<span class="why">${n.why}</span>` : ''}</span></button>`; }).join('');
  let summary = '';
  if (R.notes) { const mine = R.notes.filter(Boolean); const good = mine.filter(n => n.loss <= 1).length, bad = mine.filter(n => n.loss > 4).length, mist = mine.filter(n => n.loss > 1 && n.loss <= 4).length;
    summary = `<div class="card row" style="margin-bottom:10px"><div class="acc">%${mine.length ? Math.round(good / mine.length * 100) : 0}</div><div><b>${t('Doğruluk')}</b><div class="muted small">👑/✅ ${good} · ⚠️ ${mist} · ❌ ${bad}</div><div class="small">${bad ? t('Büyük hatalarına tıkla ve koçun önerisini oku.') : t('Harika oynadın!')}</div></div></div>`; }
  $('scr-replay').innerHTML = `<button class="btn sec sm back" onclick="clearInterval(repTimer);REP=null;${R.back === 'tour' ? "tourView='online';go('tour')" : "go('replay')"}">← ${t('Geri')}</button>
    <h2>🎬 ${esc(myName())} ${rep.me} – ${rep.op} ${esc(rep.opp)} <span class="muted small">${MODES[rep.mode].icon} ${nm(MODES[rep.mode])}</span></h2>
    <div class="side-lbl"><span>${esc(rep.opp)}: ${Engine.score(st, 1)}</span><span>${R.idx}/${rep.acts.length}</span></div>
    <div class="bwrap"><div id="rboard" class="board"></div><div class="handlayer"></div><div class="fxlayer"></div></div>
    <div class="side-lbl"><span>${esc(myName())}: ${Engine.score(st, 0)}</span><span>${last ? (last.by === 0 ? '⬇' : '⬆') : ''}</span></div>
    <div class="rcontrols"><button class="btn sec" onclick="repGo(0)">⏮</button><button class="btn sec" onclick="repGo(REP.idx-1)">◀</button><button class="btn" id="rplay" onclick="repPlay()">${repTimer ? '⏸' : '▶'}</button><button class="btn sec" onclick="repStep()">▶|</button><button class="btn sec" onclick="repGo(REP.rep.acts.length)">⏭</button></div>
    ${canAnalyze ? (R.notes ? summary : `<div class="row center" style="margin-bottom:10px"><button class="btn purple" id="coachbtn" onclick="runCoach()">🤖 ${t('Yapay Zekâ Koçu: Maçı Analiz Et')}</button></div>`) : `<p class="muted small" style="text-align:center">${t('Koç analizi klasik ve yıldırım maçlarında kullanılabilir.')}</p>`}
    <div class="card"><div class="movelist" id="mvlist">${mv}</div></div>`;
  const hl = last && last.type === 'move' ? new Set([last.pit]) : null;
  renderBoard($('rboard'), st.b, { st, hl, oppName: rep.opp, meName: myName() });
  const cur = document.querySelector('.mv.cur'); if (cur) cur.scrollIntoView({ block: 'nearest' });
}
function repGo(i) { clearInterval(repTimer); repTimer = null; REP.idx = Math.max(0, Math.min(REP.rep.acts.length, i)); repRender(); }
async function repStep() {
  const R = REP; if (R.idx >= R.rep.acts.length || R.anim) return false;
  const a = R.rep.acts[R.idx], st0 = R.states[R.idx], st1 = R.states[R.idx + 1];
  R.anim = true;
  const base = { hands: R.rep.hands || ['klasik', 'klasik'], oppName: R.rep.opp, meName: myName(), speedMul: 0.7 };
  try { if (a.type === 'move') await animate($('rboard'), st0, a.by, a.pit, R.res[R.idx], st1, base); else await animateCard($('rboard'), st0, a.by, a.card, a.arg, st1, base); } catch (e) { }
  R.anim = false; if (REP !== R) return false;
  R.idx++; repRender(); return true;
}
async function repPlay() {
  if (repTimer) { clearInterval(repTimer); repTimer = null; repRender(); return; }
  repTimer = 1; $('rplay').textContent = '⏸';
  while (repTimer && REP && curScreen === 'replay') { const ok = await repStep(); if (!ok) break; await wait(250); }
  repTimer = null; if (REP && curScreen === 'replay') repRender();
}
async function runCoach() {
  const R = REP, rep = R.rep, notes = new Array(rep.acts.length).fill(null);
  const btn = $('coachbtn');
  for (let k = 0; k < rep.acts.length; k++) {
    const a = rep.acts[k]; if (a.by !== 0 || a.type !== 'move') continue;
    if (btn) btn.textContent = `🤖 ${t('Analiz ediliyor...')} ${Math.round(k / rep.acts.length * 100)}%`;
    await wait(0);
    const st = R.states[k], an = Engine.analyzeMove(st, 0, a.pit, 6); if (!an) continue;
    const n = { loss: Math.min(an.loss, 999), best: an.best === a.pit || an.loss <= 0 };
    if (an.loss > 1 && an.best !== a.pit) {
      const bo = Engine.play(st, 0, an.best, true).r, po = Engine.play(st, 0, a.pit, true).r;
      let why;
      if (bo.extra && !po.extra) why = t('ekstra tur kazanırdın');
      else if (bo.cap && (!po.cap || bo.cap.amount > po.cap.amount)) why = t('{0} taş kapardın ({1})', bo.cap.amount, bo.cap.type === 'even' ? t('çift sayı kuralı') : t('boş kuyu kuralı'));
      else if (an.loss >= 900) why = t('oyunu kazanma şansını kaçırdın');
      else why = t('rakibine daha az fırsat bırakırdın (yaklaşık {0} taş fark)', Math.min(an.loss, 48));
      n.why = '🤖 ' + t('{0}. kuyu yerine {1}. kuyudan oynasaydın {2}.', a.pit + 1, an.best + 1, why);
    }
    notes[k] = n;
  }
  R.notes = notes; repRender();
}

/* =========================================================
   ÇEVRİMİÇİ
   ========================================================= */
const NET = { ws: null, state: 'off', you: 0, online: 0, lobby: 'idle', code: '', qmode: '', tour: null, tourQ: null, lives: [], queue: Promise.resolve(), retry: 0, manual: false, authed: false };
let onlineTab = 'play', privMode = 'classic';
function wsURL() { const h = serverHttp(); return h ? h.replace(/^http/, 'ws') : null; }
function netSend(o) { if (NET.ws && NET.ws.readyState === 1) NET.ws.send(JSON.stringify(o)); }
const myProfile = () => ({ name: myName(), avatar: S.eq.avatar, frame: S.eq.frame, hand: S.eq.hand, title: S.title, level: levelInfo(S.xp).L });
function netHello() { netSend({ t: 'hello', profile: myProfile() }); }
function netClose() { NET.manual = true; if (NET.ws) { NET.ws.onclose = null; NET.ws.close(); } NET.ws = null; NET.state = 'off'; NET.lobby = 'idle'; }
function netConnect() {
  const url = wsURL();
  if (!url) { NET.state = 'nourl'; if (curScreen === 'online') RENDER.online(); return; }
  if (NET.ws && (NET.ws.readyState === 0 || NET.ws.readyState === 1)) return;
  NET.manual = false; NET.state = 'connecting'; if (curScreen === 'online') RENDER.online();
  let ws; try { ws = new WebSocket(url); } catch { NET.state = 'error'; return; }
  NET.ws = ws;
  const slow = setTimeout(() => { if (NET.state === 'connecting') { NET.state = 'waking'; if (curScreen === 'online') RENDER.online(); } }, 4000);
  ws.onopen = () => { clearTimeout(slow); NET.state = 'ok'; NET.retry = 0; ws.send(JSON.stringify({ t: 'auth', token: AUTH.token || '', profile: myProfile() })); if (curScreen === 'online') RENDER.online(); };
  ws.onclose = () => { clearTimeout(slow);
    const wasOk = NET.state === 'ok'; NET.ws = null; NET.state = wasOk ? 'lost' : 'error'; NET.lobby = 'idle';
    if (G && G.kind === 'online' && !G.over) { G.dc = true; setTimer(null, null); setStatus('📡 ' + t('Bağlantı koptu, maça geri bağlanılıyor...'), 'bad'); toast('📡 ' + t('Bağlantı koptu, maça geri bağlanılıyor...'), 4000); NET.retry = 0; }
    else if (G && G.kind === 'spectate' && !G.over) { G.over = true; setTimer(0, null); closeModal();
      modal(`<div class="big">📡</div><h3>${t('Bağlantı koptu')}</h3><p class="muted">${t('Sunucu ile bağlantı kesildi. Bu oyun sayılmadı.')}</p>`, [{ label: t('Menü'), value: 1 }]).then(() => { G = null; go('menu'); }); }
    if (curScreen === 'online') RENDER.online();
    if (!NET.manual && (AUTH.token || AUTH.guest)) { NET.retry = Math.min(NET.retry + 1, 6); setTimeout(() => { if (!NET.ws && !NET.manual) netConnect(); }, 2000 * NET.retry); } };
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch { return; } NET.queue = NET.queue.then(() => netHandle(m)).catch(err => console.error(err)); };
}
async function netHandle(m) {
  switch (m.t) {
    case 'welcome': case 'count': NET.online = m.n; { const e = $('oncount'); if (e) e.textContent = m.n; } break;
    case 'authed': { NET.authed = m.user; if (m.user && AUTH.user && m.elo) AUTH.user.elo = m.elo;
      const rs = lsGet('mangala_resume');
      if (rs && Date.now() - rs.at < 45000) netSend({ t: 'resume', room: rs.room, rt: rs.rt }); else lsDel('mangala_resume');
      if (PENDING_ROOM) { const c = PENDING_ROOM; PENDING_ROOM = null; toast('🎮 ' + t('Arkadaşının odasına katılıyorsun: {0}', c)); netSend({ t: 'join', code: c }); }
      break; }
    case 'queued': NET.lobby = 'queue'; NET.qmode = m.mode; RENDER.online(); break;
    case 'cancelled': NET.lobby = 'idle'; if (curScreen === 'online') RENDER.online(); break;
    case 'room': NET.lobby = 'room'; NET.code = m.code; privMode = m.mode || privMode; if (NET.invite) { NET.invite = false; copyLink(); } RENDER.online(); break;
    case 'oppDc': toast('📡 ' + t('Rakibin bağlantısı koptu, {0} sn bekleniyor...', m.secs), 4000); setStatus('📡 ' + t('Rakibin bağlantısı koptu, {0} sn bekleniyor...', m.secs), 'info'); break;
    case 'oppBack': toast('✅ ' + t('Rakibin maça geri döndü!')); setStatus(G && G.st.turn === 0 ? t('Senin sıran. Bir kuyu seç.') : '', 'good'); break;
    case 'resumeFail': lsDel('mangala_resume'); if (G && G.kind === 'online' && G.dc) { G.over = true; setTimer(null, null); modal(`<div class="big">📡</div><h3>${t('Maça geri dönülemedi')}</h3><p class="muted">${t('Bağlantı çok uzun süre koptu.')}</p>`, [{ label: t('Menü'), value: 1 }]).then(() => { G = null; go('menu'); }); } break;
    case 'err': toast('❌ ' + esc(t(m.msg)), 3500); Sound.sfx.error();
      if (m.full) { const ok = await modal(`<div class="big">👁️</div><p>${t('Oda dolu. İzleyici olarak girmek ister misin?')}</p>`, [{ label: t('Hayır'), cls: 'sec', value: 0 }, { label: t('İzle'), value: 1 }]); if (ok) spectate(m.full); }
      if (NET.lobby === 'tourq') { NET.lobby = 'idle'; if (curScreen === 'online') RENDER.online(); } break;
    case 'start': netStart(m); break;
    case 'act': await netAct(m); break;
    case 'sync': if (G && G.kind === 'online') { G.st = m.st; G.busy = false; gRender(); } break;
    case 'emote': if (G && G.kind === 'online') showEmote(1, m.kind, m.id); else if (G && G.kind === 'spectate') showEmote(m.seat === 0 ? 0 : 1, m.kind, m.id); break;
    case 'over': lsDel('mangala_resume'); await netOver(m); break;
    case 'oppRematch': { const tt = $('remtxt'); if (tt) tt.innerHTML = '🔁 <b>' + t('Rakibin rövanş istiyor!') + '</b>'; toast('🔁 ' + t('Rakibin rövanş istiyor!')); break; }
    case 'oppLeft': if (G && G.kind === 'online') { G.oppLeft = true;
        if (G.waitingRematch) { closeModal(); modal(`<div class="big">👋</div><h3>${t('Rakibin ayrıldı')}</h3>`, [{ label: t('Menü'), value: 1 }]).then(() => { netSend({ t: 'leave' }); G = null; go('menu'); }); }
        else { document.querySelectorAll('#modal button').forEach(b => { if (b.textContent.includes(t('Rövanş'))) b.remove(); }); const tt = $('remtxt'); if (tt) tt.textContent = t('Rakibin odadan ayrıldı.'); } } break;
    case 'specStart': specStart(m); break;
    case 'specEnd': if (G && G.kind === 'spectate') { if (!G.over) toast(t('Maç sona erdi.')); } break;
    case 'lives': NET.lives = m.rooms; if (curScreen === 'online' && onlineTab === 'watch') RENDER.online(); break;
    case 'tourQueue': NET.lobby = 'tourq'; NET.tourQ = m; if (curScreen === 'online') RENDER.online(); break;
    case 'tourLeft': NET.lobby = 'idle'; NET.tourQ = null; if (curScreen === 'online') RENDER.online(); break;
    case 'tour': NET.tour = m.tour; if (NET.lobby === 'tourq') { NET.lobby = 'idle'; tourView = 'online'; if (!(G && !G.over)) go('tour'); }
      if (curScreen === 'tour' && tourView === 'online') RENDER.tour(); break;
    case 'tourEnd': NET.tour = m.tour; if (m.you) { S.tourWins = (S.tourWins || 0) + 1; unlockAch('turnuva'); persist(); confetti(); Sound.sfx.win(); }
      setTimeout(() => modal(`<div class="big">${m.you ? '👑' : '🏆'}</div><h3>${m.you ? t('TURNUVA ŞAMPİYONU!') : t('Şampiyon') + ': ' + esc(m.champion)}</h3>${m.you && m.prize ? `<div class="rewards"><span>+${m.prize.coins} 🪙</span><span>+${m.prize.xp} XP</span></div>` : ''}`, [{ label: t('Tamam'), value: 1 }]), 1500);
      if (curScreen === 'tour') RENDER.tour(); break;
    case 'saveUpdate': adoptServer(m.save, m.rev, null); break;
    case 'announce': toast(esc(m.msg), 6000); Sound.sfx.extra(); break;
    case 'me': if (AUTH.user) { const had = can('panel'); AUTH.user = m.user; fixCoins(); persist(); updTop(true);
        if (!had && can('panel')) toast('🛡️ ' + t('Yeni yetkiler aldın! Menüde Yönetim Paneli açıldı.'), 5000);
        if (curScreen === 'admin' && !can('panel')) go('menu'); else if (['menu', 'profile'].includes(curScreen)) go(curScreen); } break;
    case 'warn': Sound.sfx.error(); vib([80, 60, 80]);
      modal(`<div class="big">⚠️</div><h3>${t('Yönetimden uyarı')}</h3><p>${esc(m.msg)}</p><p class="muted small">— ${esc(m.by || '')}</p>`, [{ label: t('Anladım'), value: 1 }]); break;
    case 'content': setContent(m.content); break;
    case 'kicked': NET.manual = true; closeModal(); G = null;
      await modal(`<div class="big">⛔</div><h3>${esc(t(m.msg))}</h3>`, [{ label: t('Tamam'), value: 1 }]);
      if (/yasak|banned|silindi|deleted/i.test(m.msg)) logout(); else go('menu'); break;
  }
}
function netStart(m) {
  closeModal(); NET.you = m.you; NET.lobby = 'game';
  if (m.rt) lsSet('mangala_resume', { room: m.room, rt: m.rt, at: Date.now() });
  if (m.resumed) setTimeout(() => toast('🔄 ' + t('Maça geri döndün!')), 300);
  const o = m.opp || {};
  G = { kind: 'online', mode: m.mode, qmode: m.qmode, ranked: m.ranked, tour: m.tour, st: m.st, init: Engine.clone(m.st), acts: [], scoreHist: [], over: false, busy: false, turnMs: m.turnMs, turnGain: 0,
    opp: { name: o.name || t('Rakip'), avatar: CAT.avatars[o.avatar] ? o.avatar : 'gulen', frame: CAT.frames[o.frame] ? o.frame : 'yok', hand: CAT.hands[o.hand] ? o.hand : 'klasik', title: o.title, elo: m.ranked ? o.elo : null, level: o.level, rank: o.rank || null, guest: o.guest } };
  go('game'); setupGameUI(); gRender();
  setStatus((G.st.turn === 0 ? '🎲 ' + t('Kura: Sen başlıyorsun!') : '🎲 ' + t('Kura: {0} başlıyor.', esc(G.opp.name))) + ` <span class="muted small">(${t('{0} sn/hamle', Math.round(m.turnMs / 1000))})</span>`, 'info');
  setTimer(G.st.turn, m.turnMs); Sound.sfx.extra(); vib(40);
}
async function netAct(m) {
  if (!G || G.over) return;
  if (G.kind === 'spectate') { setTimer(null, null); G.busy = true; const out = await playAct(m.by, m.act, m.st); G.busy = false; const [msg, cls] = statusFor(m.by, out); setStatus(msg || `${esc(G.players[G.st.turn].name)} ${t('oynuyor...')}`, cls); gRender(); setTimer(G.st.turn, m.turnMs); return; }
  if (G.kind !== 'online') return;
  G.busy = true; setTimer(null, null); gRender();
  if (m.auto) toast(m.by === 0 ? '⏰ ' + t('Süren doldu, rastgele hamle yapıldı.') : '⏰ ' + t('Rakibin süresi doldu.'));
  if (m.by === 0 && m.act.type === 'move') G.scoreHist.push(Engine.score(G.st, 0) - Engine.score(G.st, 1));
  const out = await playAct(m.by, m.act, m.st);
  if (!G || G.kind !== 'online') return;
  const rs = lsGet('mangala_resume'); if (rs) { rs.at = Date.now(); lsSet('mangala_resume', rs); }
  G.st = m.st; G.busy = false;
  if (G.st.turn === 0 && m.by === 1) G.turnGain = 0;
  G.lastR = out && out.r;
  if (G.st.over) { gRender(); return; }
  const [msg, cls] = statusFor(m.by, out);
  setStatus(msg || (G.st.turn === 0 ? t('Senin sıran. Bir kuyu seç.') : `${esc(G.opp.name)} ${t('oynuyor...')}`), cls);
  gRender(); setTimer(G.st.turn, m.turnMs);
}
async function netOver(m) {
  if (G && G.kind === 'spectate') {
    G.over = true; setTimer(null, null); gRender();
    const w = m.winner; const txt = w === -1 ? t('Berabere!') : t('{0} kazandı!', esc(G.players[w].name));
    await modal(`<div class="big">🏁</div><h3>${txt}</h3><p style="font-size:20px;font-weight:900">${Engine.score(G.st, 0)} — ${Engine.score(G.st, 1)}</p>`, [{ label: t('Tamam'), value: 1 }]);
    stopSpectate(); return;
  }
  if (!G || G.kind !== 'online') return;
  if (m.st) G.st = m.st;
  endGame(G.lastR || null, { res: m.res, reason: m.reason === 'normal' ? null : m.reason, resignedMe: m.reason === 'resign' && m.res === 'loss', elo: m.elo });
}
function spectate(code) { netSend({ t: 'spec', code }); }
function specStart(m) {
  closeModal();
  G = { kind: 'spectate', mode: m.mode, st: m.st, players: m.players.map(p => ({ ...p, avatar: CAT.avatars[p.avatar] ? p.avatar : 'gulen', frame: CAT.frames[p.frame] ? p.frame : 'yok' })), over: false, busy: false, scoreHist: [], code: m.code };
  go('game'); setupGameUI(); gRender(); setStatus('👁️ ' + t('İzleyici modu'), 'info'); setTimer(G.st.turn, m.turnMs);
}
function stopSpectate() { netSend({ t: 'unspec' }); G = null; onlineTab = 'watch'; go('online'); }

/* ---------- çevrimiçi lobi ---------- */
async function loadLeaderboard() { try { const { j } = await api('GET', '/api/leaderboard'); NET.lb = j.list || []; } catch { NET.lb = []; } if (curScreen === 'online' && onlineTab === 'top') RENDER.online(); }
RENDER.online = () => {
  if (curScreen !== 'online') return;
  if (NET.state === 'off') netConnect();
  const el = $('scr-online');
  const st = { connecting: ['wait', t('Sunucuya bağlanılıyor...')], waking: ['wait', t('Sunucu uyanıyor... (ücretsiz sunucu ilk açılışta ~1 dakika sürebilir)')], ok: ['ok', t('Bağlı')],
    error: ['bad', t('Sunucuya bağlanılamadı')], lost: ['bad', t('Bağlantı koptu')], nourl: ['bad', t('Sunucu adresi yok')], off: ['wait', '...'] }[NET.state] || ['bad', ''];
  const tabs = [['play', '⚔️ ' + t('Oyna')], ['tour', '🏆 ' + t('Turnuva')], ['watch', '👁️ ' + t('İzle')], ['top', '📊 ' + t('Liderlik')]];
  let h = `<button class="btn sec sm back" onclick="netLeaveLobby()">← ${t('Geri')}</button><h2>🌍 ${t('Çevrimiçi')}</h2>
    <div class="card row between" style="margin-bottom:12px"><div class="net-status ${st[0]}"><span class="led"></span>${st[1]}</div>${NET.state === 'ok' ? `<span class="muted">🟢 <b id="oncount">${NET.online}</b> ${t('oyuncu çevrimiçi')}</span>` : ''}
      ${AUTH.user ? `<span>${leagueBadge(AUTH.user.elo)} <b>${AUTH.user.elo}</b> Elo</span>` : `<span class="muted small">${t('Misafir: dereceli ve turnuva kapalı')}</span>`}</div>
    <div class="tabs">${tabs.map(([k, v]) => `<button class="tab ${onlineTab === k ? 'on' : ''}" onclick="onlineTab='${k}';${k === 'watch' ? "netSend({t:'lives'});" : ''}${k === 'top' ? 'loadLeaderboard();' : ''}RENDER.online()">${v}</button>`).join('')}</div>`;
  if (NET.state === 'nourl' || NET.state === 'error' || NET.state === 'lost') {
    h += `<div class="card"><p class="muted" style="line-height:1.6">${t('Çevrimiçi oynamak için oyunu sunucunun internet adresinden aç ya da Ayarlar\'dan sunucu adresini gir.')}</p>
      <div class="row center"><button class="btn" onclick="netConnect()">🔄 ${t('Tekrar Dene')}</button><button class="btn sec" onclick="go('settings')">⚙️ ${t('Ayarlar')}</button><button class="btn sec" onclick="go('bots')">🤖 ${t('Botlarla Oyna')}</button></div></div>`;
  } else if (NET.state !== 'ok') h += `<div class="spinner"></div>`;
  else if (NET.lobby === 'queue') h += `<div class="card" style="text-align:center"><div class="spinner"></div><h3>${t('Rakip aranıyor...')}</h3><p class="muted">${{ casual: t('Hızlı Eşleşme'), ranked: t('Dereceli'), blitz: t('Yıldırım'), party: t('Parti Modu') }[NET.qmode] || ''}</p><button class="btn sec" onclick="netSend({t:'cancel'})">${t('İptal')}</button></div>`;
  else if (NET.lobby === 'room') h += `<div class="card" style="text-align:center"><p>${t('Bu linki arkadaşına gönder, tek tıkla maça girsin:')}</p><div class="linkbox"><input class="inp" readonly value="${esc(roomLink())}" onclick="this.select()"></div><div class="row center" style="margin:10px 0"><button class="btn sm" onclick="copyLink()">📋 ${t('Kopyala')}</button><a class="btn sm green" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(t('Mangala oynayalım mı? 🪨 Tıkla ve maça gir:') + ' ' + roomLink())}">💬 WhatsApp</a>${navigator.share ? `<button class="btn sm sec" onclick="shareLink()">📤 ${t('Paylaş')}</button>` : ''}</div><p class="muted small">${t('veya kodu yazsın')}:</p><div class="code">${esc(NET.code)}</div><p class="muted">${MODES[privMode].icon} ${nm(MODES[privMode])}</p><div class="spinner"></div><button class="btn sec" onclick="netSend({t:'cancel'})">${t('Odayı Kapat')}</button></div>`;
  else if (NET.lobby === 'tourq') h += `<div class="card" style="text-align:center"><div class="spinner"></div><h3>${t('Turnuva oyuncuları bekleniyor')}: ${NET.tourQ ? NET.tourQ.n + '/' + NET.tourQ.size : ''}</h3><p class="muted">${t('Dolunca turnuva otomatik başlar.')}</p><button class="btn sec" onclick="netSend({t:'tourLeave'})">${t('Sıradan Ayrıl')}</button></div>`;
  else if (onlineTab === 'play') {
    const q = (mode, ic, name, desc, need) => `<div class="card mode"><div class="ic">${ic}</div><h3>${name}</h3><p class="muted small">${desc}</p><button class="btn ${need && !AUTH.user ? 'sec' : ''}" ${need && !AUTH.user ? 'disabled' : ''} onclick="netSend({t:'queue',mode:'${mode}'})">${need && !AUTH.user ? '🔒 ' + t('Giriş gerekli') : t('Rakip Bul')}</button></div>`;
    h += `<div class="modes">${q('casual', '⚡', t('Hızlı Eşleşme'), t('Klasik kurallar, rastgele rakip.'))}${q('ranked', '🏅', t('Dereceli'), t('Elo puanı kazan, liglerde yüksel: Bronz → Mangala Ustası.'), true)}
      ${q('blitz', '⏱️', t('Yıldırım'), t('Her hamle 8 saniye!'))}${q('party', '🎉', t('Parti Modu'), t('Rastgele: Ters, Gizemli Kuyu veya Süper Güçler.'))}</div>
      <div class="sec-title"><h3>🏠 ${t('Özel Oda')}</h3></div>
      <div class="card"><div class="small muted" style="margin-bottom:6px">${t('Mod seç')}:</div>${modeChips(privMode, 'setPrivMode')}
        <div class="row" style="margin-top:12px"><button class="btn" onclick="netSend({t:'create',mode:privMode})">${t('Oda Oluştur')}</button><span class="muted">${t('veya')}</span><input class="codein" id="codein" maxlength="4" placeholder="${t('KOD')}"><button class="btn sec" onclick="netJoin()">${t('Katıl')}</button><button class="btn sec" onclick="spectateCode()">👁️ ${t('İzle')}</button></div></div>
      <p class="muted small" style="text-align:center">${t('Ödüller: Galibiyet {0} 🪙 · Beraberlik {1} 🪙 · Mağlubiyet {2} 🪙 · +%50 XP', ONLINE_REWARD.win * coinMult(), ONLINE_REWARD.draw * coinMult(), ONLINE_REWARD.loss * coinMult())}</p>`;
  } else if (onlineTab === 'tour') {
    const inTour = NET.tour && NET.tour.status === 'running';
    h += inTour ? `<div class="card"><p>${t('Devam eden bir turnuvadasın.')}</p><button class="btn" onclick="tourView='online';go('tour')">🏆 ${t('Turnuva Tablosu')}</button></div>`
      : `<div class="modes">${[[4, 300, 200], [8, 600, 400]].map(([n, pc, px]) => `<div class="card mode"><div class="ic">${n === 4 ? '🥉' : '🏆'}</div><h3>${t('{0} Kişilik', n)}</h3><p class="muted">${t('Ücretsiz · Şampiyon: {0} 🪙 + {1} XP', pc, px)}</p><button class="btn" ${AUTH.user ? '' : 'disabled'} onclick="netSend({t:'tourJoin',size:${n}})">${AUTH.user ? t('Katıl') : '🔒 ' + t('Giriş gerekli')}</button></div>`).join('')}</div>
         <p class="muted small">${t('Oyuncular dolunca eleme usulü turnuva başlar. Katılım ücretsiz; elenenler diğer maçları izleyebilir, şampiyon ödülü kazanır.')}</p>`;
  } else if (onlineTab === 'watch') {
    h += `<div class="row" style="margin-bottom:10px"><button class="btn sec sm" onclick="netSend({t:'lives'})">🔄 ${t('Yenile')}</button><input class="codein" id="codein" maxlength="4" placeholder="${t('KOD')}"><button class="btn sm" onclick="spectateCode()">👁️ ${t('Kodla izle')}</button></div>
      <div class="list">${(NET.lives || []).map(r => `<div class="lrow"><div class="grow"><b>${esc(r.names[0])} ${r.scores[0]} – ${r.scores[1]} ${esc(r.names[1])}</b><span class="muted small">${MODES[r.mode].icon} ${nm(MODES[r.mode])}${r.qmode === 'ranked' ? ' · 🏅' : ''}${r.tour ? ' · 🏆' : ''}${r.specs ? ' · 👁️ ' + r.specs : ''}</span></div><button class="btn xs" onclick="spectate('${r.code}')">${t('İzle')}</button></div>`).join('') || `<p class="muted">${t('Şu an canlı maç yok.')}</p>`}</div>`;
  } else if (onlineTab === 'top') {
    h += `<div class="list">${(NET.lb || []).map((u, i) => `<button class="lrow" style="width:100%;text-align:left" onclick="viewProfile('${esc(u.name)}')"><span class="rk">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>${avatarHTML(u.avatar || 'gulen', 'yok', 34)}<div class="grow"><b>${esc(u.name)} ${u.rank ? rankBadge(u.rank) : ''}</b><span class="muted small">${u.w}G ${u.d}B ${u.l}M</span></div>${leagueBadge(u.elo)}<b>${u.elo}</b></button>`).join('') || `<p class="muted">${NET.lb ? t('Henüz dereceli maç oynanmadı.') : '...'}</p>`}</div>
      <div class="card" style="margin-top:12px"><b>${t('Ligler')}</b><div class="row" style="margin-top:8px">${LEAGUES.map(l => `<span class="lg" style="color:${l.color}">${l.icon} ${nm(l)} ${l.min}+</span>`).join('')}</div></div>`;
  }
  el.innerHTML = h;
};
function setPrivMode(k) { privMode = k; RENDER.online(); }
let PENDING_ROOM = (() => { try { const c = new URLSearchParams(location.search).get('room'); if (c && /^[A-Za-z0-9]{4}$/.test(c)) { history.replaceState(null, '', location.pathname); return c.toUpperCase(); } } catch { } return null; })();
const roomLink = () => `${location.origin}${location.pathname}?room=${NET.code}`;
async function copyLink() {
  const l = roomLink();
  try { await navigator.clipboard.writeText(l); toast('📋 ' + t('Link kopyalandı! WhatsApp\'a yapıştır ve gönder.'), 3500); Sound.sfx.coin(); }
  catch { await promptModal(`<h3>🔗 ${t('Davet linki')}</h3>`, [{ id: 'lnk', val: l }], t('Tamam')); }
}
function shareLink() { navigator.share({ title: 'Dijital Mangala', text: t('Mangala oynayalım mı? 🪨 Tıkla ve maça gir:'), url: roomLink() }).catch(() => { }); }
function inviteFriend() {
  onlineTab = 'play'; NET.invite = true;
  const send = () => netSend({ t: 'create', mode: privMode });
  if (NET.ws && NET.ws.readyState === 1) { if (NET.lobby === 'room') { NET.invite = false; copyLink(); } else send(); }
  else { netConnect(); const iv = setInterval(() => { if (NET.ws && NET.ws.readyState === 1) { clearInterval(iv); setTimeout(send, 300); } }, 300); setTimeout(() => clearInterval(iv), 70000); }
  go('online');
}
function netJoin() { const c = ($('codein').value || '').trim().toUpperCase(); if (c.length !== 4) return toast(t('Kod 4 karakter olmalı')); netSend({ t: 'join', code: c }); }
function spectateCode() { const c = ($('codein').value || '').trim().toUpperCase(); if (c.length !== 4) return toast(t('Kod 4 karakter olmalı')); spectate(c); }
function netLeaveLobby() { if (NET.lobby === 'queue' || NET.lobby === 'room') netSend({ t: 'cancel' }); if (NET.lobby !== 'tourq') NET.lobby = 'idle'; go('mode'); }
function renderOnlineTour(el) {
  const T = NET.tour;
  let h = `<button class="btn sec sm back" onclick="onlineTab='tour';go('online')">← ${t('Geri')}</button><h2>🌐🏆 ${t('Çevrimiçi Turnuva')}</h2>`;
  if (!T) { el.innerHTML = h + `<p class="muted">${t('Aktif turnuva yok.')}</p>`; return; }
  const meIdx = T.players.findIndex(p => p.name === myName());
  h += `<div class="card"><div class="row between"><b>${t('Şampiyon ödülü')}: ${T.prize ? T.prize.coins + ' 🪙 + ' + T.prize.xp + ' XP' : ''}</b><span class="badge">${T.status === 'done' ? t('Bitti') + ' · 👑 ' + esc(T.champion) : roundName(T.round, Math.log2(T.size))}</span></div>
    ${bracketHTML(T, i => i === meIdx, m => m.room && m.winner == null ? `<button class="live" onclick="spectate('${m.room}')">🔴 ${t('CANLI · İzle')}</button>` : '')}
    <p class="muted small" style="text-align:center">${T.status === 'running' ? (T.players[meIdx] && T.players[meIdx].alive ? t('Sıradaki maçın hazır olunca otomatik başlar.') : t('Elendin. Diğer maçları izleyebilirsin.')) : ''}</p></div>`;
  el.innerHTML = h;
}

/* =========================================================
   BAŞLAT
   ========================================================= */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => { });
(async () => {
  document.documentElement.lang = LANG; loadContent();
  const a = lsGet('mangala_auth');
  if (a && a.token) {
    AUTH.token = a.token;
    const cached = lsGet('mangala_cache_' + a.name.toLowerCase());
    $('scr-auth').innerHTML = `<div class="auth" style="text-align:center;margin-top:20vh"><div style="font-size:54px">🪨</div><div class="spinner"></div><p class="muted">${t('Hesabın yükleniyor... (ücretsiz sunucu uyanıyorsa ~1 dk sürebilir)')}</p>
      ${cached ? `<button class="btn sec sm" id="offbtn">${t('Çevrimdışı devam et')}</button>` : ''}</div>`;
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === 'scr-auth'));
    let done = false;
    const offline = () => { if (done) return; done = true; AUTH.user = cached.user || { name: a.name, role: 'user', elo: 1000 }; S = normalize(cached.save); AUTH.rev = cached.rev || 0; AUTH.offline = true; enterGame(); toast(t('Çevrimdışı moddasın. Bağlantı gelince kaydın senkronlanır.')); };
    if (cached) $('offbtn').onclick = offline;
    try {
      const { s, j } = await api('GET', '/api/me', null, 75000);
      if (done) { if (s === 200) { AUTH.user = j.user; if ((j.rev || 0) > AUTH.rev) adoptServer(j.save, j.rev); else syncNow(); } return; }
      done = true;
      if (s === 200) { AUTH.user = j.user; AUTH.rev = j.rev || 0; S = normalize(j.save || (cached && cached.save) || {}); enterGame(); }
      else if (s === 403) bannedScreen(j.banned);
      else { AUTH.token = null; lsDel('mangala_auth'); go('auth'); checkServer(); }
    } catch { if (cached) offline(); else { AUTH.token = null; go('auth'); checkServer(); } }
  } else if (lsGet('mangala_guestmode')) playGuest();
  else { go('auth'); checkServer(); }
})();
// kayıt önbelleğinde kullanıcı bilgisini de sakla (çevrimdışı açılış için)
const _persist = persist;
persist = function () { _persist(); if (AUTH.user && !AUTH.guest) { const c = lsGet(cacheKey()) || {}; c.user = AUTH.user; lsSet(cacheKey(), c); } };
