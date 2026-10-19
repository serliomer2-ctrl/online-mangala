/* =========================================================
   v3.5 Ekstralar: Yan Yana (aynı cihazda 2 kişi), Günün Bulmacası,
   Geri Al / İpucu (botlara karşı), hamle önizleme, maç geçmişi grafiği
   ========================================================= */

/* ---------- Yan Yana ---------- */
const LOCAL_MODES = ['classic', 'reverse', 'mystery', 'mini', 'dev'];   // kart ve süre gerektirmeyen modlar
let locMode = 'classic';
(function () { const s = document.createElement('section'); s.className = 'screen'; s.id = 'scr-local'; $('scr-mode').after(s); })();
const cleanNm = (v, d) => String(v || '').replace(/[<>&"'`]/g, '').trim().slice(0, 16) || d;
function locNames() { const a = $('lp0'), b = $('lp1'); if (a && b) S.locNames = [cleanNm(a.value, t('Oyuncu 1')), cleanNm(b.value, t('Oyuncu 2'))]; return S.locNames || [myName(), t('Misafir')]; }
function setLocMode(k) { locNames(); locMode = k; RENDER.local(); }
RENDER.local = () => {
  const n = S.locNames || [myName(), t('Misafir')];
  $('scr-local').innerHTML = `<button class="btn sec sm back" onclick="go('mode')">← ${t('Geri')}</button><h2>👫 ${t('Yan Yana')}</h2>
    <p class="muted" style="margin-top:-6px">${t('Aynı cihazda iki kişi sırayla oynar: alttaki sıra 1. oyuncunun, üstteki 2. oyuncunun. Telefonu ya da tableti masaya koyun!')}</p>
    <div class="card">
      <div class="locnames"><label class="mini-f">⬇️ ${t('Alttaki oyuncu')}<input class="inp" id="lp0" maxlength="16" value="${esc(n[0])}"></label>
        <span class="vs">VS</span><label class="mini-f">⬆️ ${t('Üstteki oyuncu')}<input class="inp" id="lp1" maxlength="16" value="${esc(n[1])}"></label></div>
      <div style="margin-top:12px"><b>🎮 ${t('Oyun modu')}</b><div style="margin-top:8px">${modeChips(locMode, 'setLocMode', LOCAL_MODES)}</div></div>
      <button class="btn" style="margin-top:14px;width:100%" onclick="startLocal()">⚔️ ${t('Başla')}</button></div>
    <p class="muted small">💡 ${t('Bu modda para ve XP kazanılmaz; sadece eğlence! Kazanan bir sonraki maçta ikinci başlar.')}</p>`;
};
function startLocal(again) {
  const names = again ? again.names : locNames(); persist();
  const mode = again ? again.mode : locMode, first = again ? again.first : (Math.random() < .5 ? 0 : 1);
  const st = Engine.newState(mode, Math.floor(Math.random() * 2 ** 31), first);
  G = { kind: 'local', mode, st, init: Engine.clone(st), acts: [], scoreHist: [], over: false, busy: false, names,
    opp: { name: names[1], avatar: { e: '🧑', bg: '#ffc9c9,#c92a2a' }, frame: 'yok', hand: S.eq.hand, label: t('Oyuncu 2') } };
  go('game'); setupGameUI(); gRender(); setTimer(0, null);
  setStatus('🎲 ' + t('Kura: {0} başlıyor.', esc(names[first])), 'info');
}
async function localEnd(r, opt) {
  const g = G, a = Engine.score(g.st, 0), b = Engine.score(g.st, 1);
  const w = opt.reason === 'resign' ? 1 - g.st.turn : Engine.winnerOf(g.st);
  const title = w === -1 ? t('Berabere!') : t('{0} KAZANDI!', esc(g.names[w]));
  S.locPlayed = (S.locPlayed || 0) + 1; unlockAch('yanyana'); persist();
  setStatus(`${w === -1 ? '🤝' : '🏆'} ${title} — ${a} : ${b}`, 'good');
  if (w !== -1) { Sound.sfx.win(); Sound.sfx.cheer(); confetti(); } else Sound.sfx.click();
  if (!opt.reason) FX.bigText(w === -1 ? t('BERABERE!') : t('ZAFER!'), 'ko-' + (w === -1 ? 'draw' : 'win'), 1500);
  await wait(opt.reason ? 300 : 1100);
  const v = await modal(`<div class="big">${w === -1 ? '🤝' : '🏆'}</div><h3>${title}</h3><p style="font-size:21px;font-weight:900">${esc(g.names[0])} ${a} — ${b} ${esc(g.names[1])}</p>${opt.reason === 'resign' ? `<p class="muted">${t('{0} pes etti.', esc(g.names[g.st.turn]))}</p>` : ''}`,
    [{ label: t('Menü'), cls: 'sec', value: 'menu' }, { label: '🔁 ' + t('Rövanş'), value: 'again' }]);
  G = null;
  if (v === 'again') startLocal({ names: g.names, mode: g.mode, first: w === -1 ? 1 - g.init.turn : 1 - w }); else go('menu');
}

/* ---------- Geri Al & İpucu (sadece botlara karşı) ---------- */
const ASSIST_MAX = 3;
function assistBtns() {
  const u = ASSIST_MAX - (G.undoUsed || 0), h = ASSIST_MAX - (G.hintUsed || 0);
  return `<button class="btn sec sm" ${u > 0 ? '' : 'disabled'} onclick="undoMove()" title="${esc(t('Son hamleni geri al'))}">↩️ ${t('Geri Al')} <span class="cnt">${u}</span></button><button class="btn sec sm" ${h > 0 ? '' : 'disabled'} onclick="botHint()" title="${esc(t('En iyi hamleyi göster'))}">💡 <span class="cnt">${h}</span></button>`;
}
function pushUndo() {
  if (!G.undo) G.undo = [];
  G.undo.push({ st: Engine.clone(G.st), acts: G.acts ? G.acts.length : 0, sh: G.scoreHist.length, combo: G.combo || 0, tg: G.turnGain || 0 });
  if (G.undo.length > 40) G.undo.shift();
}
async function assistOk() {
  if (G.assisted || S.assistOk) return true;
  const ok = await modal(`<div class="big">🤝</div><h3>${t('Yardım kullanılsın mı?')}</h3><p>${t('Geri Al veya İpucu kullanırsan bu maçtaki para ve XP ödülün yarıya düşer.')}</p>`, [{ label: t('Vazgeç'), cls: 'sec', value: false }, { label: t('Tamam'), value: true }]);
  if (ok) { S.assistOk = true; persist(); }
  return ok;
}
async function undoMove() {
  if (!G || G.kind !== 'bot' || !myTurn() || (G.undoUsed || 0) >= ASSIST_MAX) return;
  if (!G.undo || !G.undo.length) { toast(t('Geri alınacak hamle yok.')); return; }
  if (!await assistOk() || !myTurn()) return;
  const s = G.undo.pop();
  G.st = s.st; if (G.acts) G.acts.length = s.acts; G.scoreHist.length = s.sh; G.combo = s.combo; G.turnGain = s.tg;
  G.undoUsed = (G.undoUsed || 0) + 1; G.assisted = true; G.cardSel = null; G.hint = null;
  Sound.sfx.swap ? Sound.sfx.swap() : Sound.sfx.click();
  renderActions(); gRender(); setStatus('↩️ ' + t('Hamle geri alındı. Tekrar düşün!'), 'info'); startBlitz();
}
async function botHint() {
  if (!G || G.kind !== 'bot' || !myTurn() || (G.hintUsed || 0) >= ASSIST_MAX) return;
  if (!await assistOk() || !myTurn()) return;
  const a = Engine.botAction(Engine.clone(G.st), { depth: 9, time: 700 });
  G.hintUsed = (G.hintUsed || 0) + 1; G.assisted = true; renderActions();
  if (a.type === 'card') { toast(`💡 ${CARDS[a.card].icon} ${t('{0} kartını kullanmayı dene!', nm(CARDS[a.card]))}`); return; }
  G.hint = a.pit; gRender(); toast('💡 ' + t('Parlayan kuyuyu dene!'));
}

/* ---------- Hamle önizleme (fare ile) ---------- */
(function () {
  const b = $('gboard'); if (!b) return;
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  b.addEventListener('mouseover', e => { if (!hover.matches) return; const el = e.target.closest('[data-i]'); pvShow(el && b.contains(el) ? +el.dataset.i : null); });
  b.addEventListener('mouseleave', () => pvShow(null));
})();
function pvShow(i) {
  document.querySelectorAll('#gboard .pv-land').forEach(x => x.classList.remove('pv-land'));
  const old = $('pvtag'); if (old) old.remove();
  if (i == null || !S.preview || !G || G.cardSel || G.kind === 'puzzle' || G.kind === 'replay' || !myTurn()) return;
  const p = hp(); if (!Engine.legalMoves(G.st, p).includes(i)) return;
  const res = Engine.play(G.st, p, i, true); if (!res) return;
  const r = res.r, land = document.querySelector(`#gboard [data-i="${r.last}"]`); if (!land) return;
  land.classList.add('pv-land');
  const parts = [];
  if (r.extra) parts.push('⭐ ' + t('Tekrar'));
  if (r.cap) parts.push(`💰 +${r.cap.amount}`);
  if (r.blocked) parts.push('🛡️');
  if (r.end) parts.push('🏁');
  if (!parts.length) parts.push('📍');
  land.insertAdjacentHTML('beforeend', `<span id="pvtag" class="pvtag ${r.cap ? 'cap' : r.extra ? 'ext' : ''}">${parts.join(' ')}</span>`);
}

/* ---------- Günün Bulmacası ---------- */
let dpzCache = null;
function dailyPuzzle(day = dayKey()) {
  if (dpzCache && dpzCache.day === day) return dpzCache.p;
  const R = rng(hashStr('gunun-bulmacasi:' + day)), TYPES = ['gain', 'even', 'empty', 'chain'], TH = { gain: 6, even: 4, empty: 4, chain: 2 };
  let p = null;
  for (let tries = 0; tries < 400 && !p; tries++) {
    let st = Engine.newState('classic', 1, 0);
    const plies = 6 + Math.floor(R() * 24);
    for (let k = 0; k < plies && !st.over; k++) { const ms = Engine.legalMoves(st, st.turn); st = Engine.play(st, st.turn, ms[Math.floor(R() * ms.length)]).st; }
    if (st.over || st.turn !== 0) continue;
    const ty = TYPES[Math.floor(R() * 4)], key = ty === 'chain' ? 'extra' : ty;
    const seqs = Engine.turnSequences(st, 0, 6); if (!seqs.length) continue;
    const best = seqs.reduce((x, y) => y[key] > x[key] ? y : x);
    if (best[key] < TH[ty] || seqs.filter(s => s[key] >= best[key]).length > 2) continue;   // tek ya da iki çözüm: gerçekten düşündürsün
    p = { type: ty, target: best[key], board: st.b.slice(), sol: best.seq };
  }
  if (!p) p = PUZZLES[hashStr(day) % PUZZLES.length];
  dpzCache = { day, p };
  return p;
}
const dailyDone = () => S.dpz && S.dpz.last === dayKey();
function dailyStreak() { const d = S.dpz || {}; if (!d.last) return 0; const y = dayKey(new Date(Date.now() - 864e5)); return d.last === dayKey() || d.last === y ? d.streak || 0 : 0; }
const dailyReward = st => (60 + 10 * Math.min(st, 7)) * (((CONTENT.config || {}).dpzMult) || 1);
function startDaily() { startPuzzle(-1, dailyPuzzle()); }
function restartPuzzle() { if (G && G.kind === 'puzzle') startPuzzle(G.puzzle.idx, G.puzzle.daily ? G.puzzle.p : null); }
async function dailySolved() {
  G.over = true; G.busy = false; gRender();
  const d = S.dpz, today = dayKey(), first = d.last !== today;
  let coins = 0;
  if (first) {
    const y = dayKey(new Date(Date.now() - 864e5));
    d.streak = d.last === y ? (d.streak || 0) + 1 : 1; d.last = today; d.count = (d.count || 0) + 1;
    coins = dailyReward(d.streak) * coinMult(); S.coins += coins; track('puzzle'); persist(); addXP(60);
    if (d.streak >= 7) unlockAch('gunluk7');
  }
  persist(); updTop(true); Sound.sfx.win(); confetti();
  const v = await modal(`<div class="big">📅</div><h3>${t('Günün Bulmacası çözüldü!')}</h3><p>🔥 ${t('Seri: {0} gün', d.streak)}</p>${first ? `<div class="rewards"><span>+${coins} 🪙</span><span>+60 XP</span></div>` : `<p class="muted">${t('Bugünün ödülünü zaten aldın. Yarın yeni bulmaca!')}</p>`}`,
    [{ label: t('Bulmacalar'), cls: 'sec', value: 'puzzles' }, { label: t('Menü'), value: 'menu' }]);
  G = null; go(v);
}
function dailyCardHTML() {
  const p = dailyPuzzle(), done = dailyDone(), st = dailyStreak();
  return `<div class="card dailypz ${done ? 'done' : ''}"><div class="dpz-ic">📅</div>
    <div style="flex:1;min-width:180px"><h3 style="margin:0">${t('Günün Bulmacası')} ${done ? '✅' : ''}</h3><div class="small">${ptype[p.type]} ${puzzleGoal(p)}</div>
      <div class="muted small" style="margin-top:4px">🔥 ${t('Seri: {0} gün', st)} · ${done ? t('Yarın yeni bulmaca!') : t('Ödül: +{0} 🪙 · +60 XP', dailyReward(st + 1))} · ${until(tomorrow())}</div></div>
    <button class="btn ${done ? 'sec' : ''}" onclick="startDaily()">${done ? '🔄 ' + t('Tekrar Çöz') : '🧩 ' + t('Çöz')}</button></div>`;
}
const _rpz = RENDER.puzzles;
RENDER.puzzles = () => { _rpz(); const box = document.querySelector('#scr-puzzles .items'); if (box) box.insertAdjacentHTML('beforebegin', dailyCardHTML()); };
const _rmode = RENDER.mode;
RENDER.mode = () => {
  _rmode();
  const inv = document.querySelector('#scr-mode .invitecard');
  if (inv) inv.insertAdjacentHTML('afterend', `<button class="card mcard mode" onclick="go('local')"><div class="ic">👫</div><h3>${t('Yan Yana')}</h3><p>${t('Aynı cihazda arkadaşınla sırayla oyna')}</p></button>
    <button class="card mcard mode" onclick="startDaily()">${dailyDone() ? '<span class="note">✅</span>' : '<span class="note new">NEW</span>'}<div class="ic">📅</div><h3>${t('Günün Bulmacası')}</h3><p>${t('Herkese aynı bulmaca, her gün yenisi')} · 🔥 ${dailyStreak()}</p></button>`);
};

/* ---------- Maç geçmişi ---------- */
function pushHist(res, me, op) {
  if (!G || G.kind === 'local' || G.kind === 'puzzle') return;
  if (!Array.isArray(S.hist)) S.hist = [];
  S.hist.push({ r: res[0], m: G.mode, k: G.kind, s: me - op, d: Date.now() });
  if (S.hist.length > 50) S.hist = S.hist.slice(-50);
}
function histHTML() {
  const all = S.hist || [], H = all.slice(-30);
  const head = `<div class="sec-title"><h3>📈 ${t('Maç Geçmişi')}</h3><span class="muted small">${H.length ? t('Son {0} maç', H.length) : ''}</span></div>`;
  if (!H.length) return head + `<div class="card muted small">${t('Grafik ilk maçından sonra burada görünecek.')}</div>`;
  const W = 600, Hh = 120, bw = W / 30, mx = Math.max(6, ...H.map(h => Math.abs(h.s)));
  const col = { w: '#4cc38a', l: '#e5534b', d: '#9aa0a6' };
  const bars = H.map((h, k) => { const v = Math.max(3, Math.abs(h.s) / mx * (Hh / 2 - 6)), y = h.s >= 0 ? Hh / 2 - v : Hh / 2;
    return `<rect x="${k * bw + 2}" y="${y}" width="${bw - 4}" height="${v}" rx="3" fill="${col[h.r]}"><title>${esc(MODES[h.m] ? nm(MODES[h.m]) : h.m)} · ${h.s > 0 ? '+' : ''}${h.s}</title></rect>`; }).join('');
  const L = { w: t('G'), l: t('M'), d: t('B') };
  const form = H.slice(-10).map(h => `<span class="formb ${h.r}">${L[h.r]}</span>`).join('');
  const by = {}; for (const h of all) { const b = by[h.m] || (by[h.m] = { n: 0, w: 0 }); b.n++; if (h.r === 'w') b.w++; }
  const rows = Object.entries(by).sort((a, b) => b[1].n - a[1].n).map(([m, b]) => `<div class="mrow"><span>${MODES[m] ? MODES[m].icon + ' ' + nm(MODES[m]) : esc(m)}</span><div class="pbar-g"><i style="width:${b.w / b.n * 100}%;background:linear-gradient(90deg,#4cc38a,#2b8a3e)"></i></div><b>%${Math.round(b.w / b.n * 100)}</b><span class="muted small">${b.n} ${t('maç')}</span></div>`).join('');
  let run = 0, best = 0; for (const h of all) { run = h.r === 'w' ? run + 1 : 0; best = Math.max(best, run); }
  const avg = Math.round(all.reduce((a, h) => a + h.s, 0) / all.length * 10) / 10;
  return head + `<div class="card"><div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="muted small">${t('Son 10')}:</span>${form}
      <span class="badge" style="margin-left:auto">🔥 ${t('En uzun seri')}: ${best}</span><span class="badge">± ${t('Ort. fark')}: ${avg > 0 ? '+' : ''}${avg}</span></div>
    <svg viewBox="0 0 ${W} ${Hh}" class="histsvg" preserveAspectRatio="none"><line x1="0" y1="${Hh / 2}" x2="${W}" y2="${Hh / 2}" stroke="rgba(255,255,255,.25)" stroke-dasharray="4 4"/>${bars}</svg>
    <p class="muted small" style="margin:4px 0 10px">${t('Çubuk boyu skor farkını gösterir: yeşil galibiyet, kırmızı mağlubiyet, gri beraberlik.')}</p>${rows}</div>`;
}
const _renderProfile = renderProfile;
renderProfile = function () { _renderProfile(); const g = document.querySelector('#scr-profile .stat-grid'); if (g) g.insertAdjacentHTML('afterend', histHTML()); };
RENDER.profile = renderProfile;
