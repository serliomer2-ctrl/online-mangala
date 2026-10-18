/* =========================================================
   TWITCH "CHAT PLAYS" — yayıncı tek başına oynar, rakip yayın sohbetidir.
   Sohbet "!kuyu 1" … "!kuyu 6" yazarak oy verir (soldan sağa, üst sıra).
   Twitch'e anonim (salt okunur) bağlanır, şifre/anahtar gerekmez.
   ========================================================= */
const Chat = (() => {
  let ws = null, channel = '', state = 'off', retry = 0, manual = false;
  const votes = new Map();       // kullanıcı -> 1..6
  let open = false, feed = [], tickT = null, endAt = 0;
  const numToPit = n => 13 - n;  // ekranda soldan sağa 1..6 = dizin 12..7
  const pitToNum = i => 13 - i;
  function connect(ch) {
    channel = String(ch || '').trim().toLowerCase().replace(/^#/, '').replace(/[^a-z0-9_]/g, '');
    if (!channel) { state = 'nochan'; return; }
    disconnect(); manual = false; state = 'connecting';
    try { ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443'); } catch { state = 'error'; return; }
    ws.onopen = () => { ws.send('PASS SCHMOOPIIE'); ws.send('NICK justinfan' + Math.floor(10000 + Math.random() * 80000)); ws.send('JOIN #' + channel); };
    ws.onmessage = e => String(e.data).split('\r\n').forEach(line => {
      if (!line) return;
      if (line.startsWith('PING')) { ws.send('PONG :tmi.twitch.tv'); return; }
      if (/ 366 /.test(line) || / JOIN #/.test(line)) { if (state !== 'ok') { state = 'ok'; retry = 0; toast('📺 ' + t('Twitch sohbetine bağlandı: #{0}', esc(channel))); refresh(); } }
      const m = line.match(/^(?:@\S+ )?:([^!]+)!\S+ PRIVMSG #\S+ :(.*)$/);
      if (m) onChat(m[1], m[2]);
    });
    ws.onclose = () => { ws = null; if (state === 'ok') state = 'lost'; else if (state === 'connecting') state = 'error'; refresh();
      if (!manual && S.chatMode) { retry = Math.min(retry + 1, 5); setTimeout(() => { if (!ws && !manual && S.chatMode) connect(channel); }, 3000 * retry); } };
  }
  function disconnect() { manual = true; if (ws) { ws.onclose = null; ws.close(); } ws = null; state = 'off'; }
  function onChat(user, text) {
    const m = String(text).trim().match(/^!(?:kuyu|pit|k)\s*([1-6])\b/i);
    if (!m || !open) return;
    const n = +m[1], had = votes.has(user);
    votes.set(user, n);
    feed.unshift(`${user} → ${n}`); feed = feed.slice(0, 6);
    if (!had) Sound.sfx.vote();
    drawVotes();
  }
  /* ---------- oylama ---------- */
  function tally() {
    const c = [0, 0, 0, 0, 0, 0, 0]; for (const n of votes.values()) c[n]++; return c;
  }
  function drawVotes() {
    const wrap = document.querySelector('#gboard'); if (!wrap || !G || G.kind !== 'chat') return;
    const lay = wrap.parentElement.querySelector('.fxlayer'); if (!lay) return;
    lay.querySelectorAll('.vote-tag').forEach(e => e.remove());
    const c = tally(), total = votes.size || 1, legal = open ? Engine.legalMoves(G.st, 1) : [];
    for (let n = 1; n <= 6; n++) {
      const i = numToPit(n), el = wrap.querySelector(`[data-i="${i}"]`); if (!el) continue;
      const p = pitCenter(wrap.parentElement, i), tag = document.createElement('div');
      tag.className = 'vote-tag' + (legal.includes(i) ? '' : ' off');
      tag.style.left = p.x + 'px'; tag.style.top = (p.y - el.offsetHeight * 0.85) + 'px';
      tag.innerHTML = `<b>!kuyu ${n}</b>${open ? `<span>${c[n]}</span><i style="width:${Math.round(c[n] / total * 100)}%"></i>` : ''}`;
      lay.appendChild(tag);
    }
    const fe = $('chatfeed'); if (fe) fe.innerHTML = open ? `<b>📺 ${t('Oylama')}: <span id="chatleft">${Math.max(0, Math.ceil((endAt - Date.now()) / 1000))}</span>${t('sn')}</b> · ${votes.size} ${t('oy')}<br>${feed.map(esc).join(' · ')}` : '';
  }
  function startVote() {
    votes.clear(); feed = []; open = true;
    const sec = Math.max(5, Math.min(60, S.chatVoteSec || 15));
    endAt = Date.now() + sec * 1000; setTimer(1, sec * 1000);
    setStatus('📺 ' + t('Sohbet oy veriyor! "!kuyu 1-6" yaz.'), 'info');
    drawVotes(); clearInterval(tickT);
    tickT = setInterval(() => {
      if (!G || G.kind !== 'chat' || G.over) { clearInterval(tickT); open = false; return; }
      const left = Math.ceil((endAt - Date.now()) / 1000); const e = $('chatleft'); if (e) e.textContent = Math.max(0, left);
      if (left <= 3 && left > 0) Sound.sfx.tick();
      if (Date.now() >= endAt) { clearInterval(tickT); finishVote(); }
    }, 250);
  }
  function finishVote() {
    open = false;
    const c = tally(), legal = Engine.legalMoves(G.st, 1);
    let best = -1, top = []; for (let n = 1; n <= 6; n++) { const i = numToPit(n); if (!legal.includes(i)) continue; if (c[n] > best) { best = c[n]; top = [i]; } else if (c[n] === best) top.push(i); }
    let pit, why;
    if (best > 0) { pit = top[Math.floor(Math.random() * top.length)]; why = t('Sohbet seçti: !kuyu {0} ({1} oy)', pitToNum(pit), best); }
    else { pit = Engine.botAction(G.st, { depth: 2 }).pit; why = t('Kimse oy vermedi, yapay zekâ oynadı: !kuyu {0}', pitToNum(pit)); }
    toast('📺 ' + why, 3500); drawVotes(); setTimer(1, null);
    doAct(1, { type: 'move', pit });
  }
  function start() {
    G = { kind: 'chat', mode: 'classic', st: Engine.newState('classic', Math.floor(Math.random() * 2 ** 31), Math.random() < .5 ? 0 : 1), acts: [], scoreHist: [], over: false, busy: false, turnGain: 0,
      opp: { name: (channel ? '#' + channel : t('Sohbet')), avatar: { e: '📺', bg: '#b197fc,#5f3dc4' }, frame: 'yok', hand: 'robot', label: t('Twitch sohbeti') } };
    G.init = Engine.clone(G.st);
    go('game'); setupGameUI(); gRender();
    setStatus(G.st.turn === 0 ? '🎲 ' + t('Kura: Sen başlıyorsun!') : '🎲 ' + t('Kura: sohbet başlıyor!'), 'info');
    setTimeout(() => { if (G && G.kind === 'chat' && G.st.turn === 1) startVote(); drawVotes(); }, 900);
  }
  const testVote = n => { if (!open) return toast(t('Şu an oylama yok.')); onChat('test' + Math.floor(Math.random() * 999), '!kuyu ' + n); };
  function refresh() { if (curScreen === 'settings') RENDER.settings(); }
  return { connect, disconnect, start, startVote, drawVotes, testVote, get state() { return state; }, get channel() { return channel; }, get open() { return open; } };
})();
