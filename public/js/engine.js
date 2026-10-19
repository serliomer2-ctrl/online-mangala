/* =========================================================
   Mangala oyun motoru — hem tarayıcıda hem sunucuda çalışır.
   Dizinler: 0-5 oyuncu 0'ın kuyuları, 6 hazinesi,
             7-12 oyuncu 1'in kuyuları, 13 hazinesi.
   Modlar: classic, blitz (klasik kurallar), reverse, mystery, cards
   ========================================================= */
(function (root) {
  const STORE = [6, 13];
  const INIT = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0];
  const BOARDS = { mini: [3, 3, 3, 3, 3, 3, 0, 3, 3, 3, 3, 3, 3, 0], dev: [6, 6, 6, 6, 6, 6, 0, 6, 6, 6, 6, 6, 6, 0] };
  const PITS = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12];
  const isPit = (p, i) => p === 0 ? (i >= 0 && i <= 5) : (i >= 7 && i <= 12);
  const ownerOf = i => i <= 6 ? 0 : 1;
  const sideSum = (b, p) => { let s = 0, o = p === 0 ? 0 : 7; for (let i = o; i < o + 6; i++) s += b[i]; return s; };
  function legal(b, p) { const r = [], o = p === 0 ? 0 : 7; for (let i = o; i < o + 6; i++) if (b[i] > 0) r.push(i); return r; }

  /* ---------- tek hamle (taş dağıtma) ----------
     o.rec      -> animasyon için yol kaydı
     o.shield   -> bu oyuncunun kuyuları bu hamlede alınamaz
     o.mystery  -> gizemli kuyu dizini (-1 yok)                       */
  function sow(b0, p, pit, o = {}) {
    const rec = !!o.rec;
    const b = b0.slice(); let n = b[pit]; const path = rec ? [] : null; let idx = pit;
    const skip = p === 0 ? 13 : 6;
    b[pit] = 0;
    const step = () => { idx = (idx + 1) % 14; if (idx === skip) idx = (idx + 1) % 14; b[idx]++; if (rec) path.push(idx); };
    if (n === 1) step();
    else { b[pit] = 1; if (rec) path.push(pit); n--; while (n-- > 0) step(); }
    const afterSow = rec ? b.slice() : null;
    const my = STORE[p]; let extra = false, cap = null, mysteryCap = 0;
    const protectedOpp = o.shield === 1 - p;
    if (idx === my) extra = true;
    else if (isPit(1 - p, idx) && b[idx] % 2 === 0) {
      if (!protectedOpp) {
        const a = b[idx]; if (o.mystery === idx) mysteryCap = a;
        b[my] += a; b[idx] = 0; cap = { type: 'even', pits: [idx], amount: a };
      } else cap = { type: 'blocked', pits: [idx], amount: 0 };
    } else if (isPit(p, idx) && b[idx] === 1) {
      const op = 12 - idx;
      if (b[op] > 0) {
        if (!protectedOpp) {
          const a = b[op] + 1;
          if (o.mystery === op) mysteryCap = b[op]; else if (o.mystery === idx) mysteryCap = 1;
          b[my] += a; b[idx] = 0; b[op] = 0; cap = { type: 'empty', pits: [idx, op], amount: a };
        } else cap = { type: 'blocked', pits: [op], amount: 0 };
      }
    }
    const afterCap = rec ? b.slice() : null;
    let over = false, end = null;
    const s0 = sideSum(b, 0), s1 = sideSum(b, 1);
    if (s0 === 0 || s1 === 0) {
      over = true; const col = s0 === 0 ? 0 : 1; const from = col === 0 ? [7, 8, 9, 10, 11, 12] : [0, 1, 2, 3, 4, 5];
      let a = 0; for (const i of from) { a += b[i]; b[i] = 0; } b[STORE[col]] += a; end = { collector: col, amount: a, pits: from };
    }
    return { board: b, extra: extra && !over, cap: cap && cap.type !== 'blocked' ? cap : null, blocked: cap && cap.type === 'blocked' ? cap : null,
      over, end, path, afterSow, afterCap, last: idx, mysteryCap };
  }

  /* ---------- oyun durumu ---------- */
  function rnd(st) { // mulberry32 (deterministik: sunucu ve istemci aynı sonucu bulur)
    let a = st.seed = (st.seed + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
  function newState(mode = 'classic', seed = 1, first = 0, board) {
    const st = { b: (board || BOARDS[mode] || INIT).slice(), turn: first, mode, seed: seed >>> 0, bonus: [0, 0], mystery: -1,
      cards: null, frozen: null, shield: null, over: false, winner: null, moves: 0 };
    if (mode === 'mystery') st.mystery = PITS[Math.floor(rnd(st) * 12)];
    if (mode === 'cards') st.cards = [{ freeze: 1, swap: 1, shield: 1 }, { freeze: 1, swap: 1, shield: 1 }];
    return st;
  }
  const clone = st => ({ ...st, b: st.b.slice(), bonus: st.bonus.slice(), cards: st.cards ? [{ ...st.cards[0] }, { ...st.cards[1] }] : null,
    frozen: st.frozen ? { ...st.frozen } : null });
  const score = (st, p) => st.b[STORE[p]] + st.bonus[p];
  function winnerOf(st) {
    const a = score(st, 0), c = score(st, 1);
    if (a === c) return -1;
    if (st.mode === 'reverse') return a < c ? 0 : 1;
    return a > c ? 0 : 1;
  }
  function legalMoves(st, p) {
    const l = legal(st.b, p);
    if (st.frozen && st.frozen.p === p) { const f = l.filter(i => i !== st.frozen.pit); if (f.length) return f; }
    return l;
  }
  function play(st0, p, pit, rec) {
    if (st0.over || st0.turn !== p || !legalMoves(st0, p).includes(pit)) return null;
    const st = clone(st0);
    const r = sow(st.b, p, pit, { rec, shield: st.shield, mystery: st.mystery });
    st.b = r.board;
    if (st.mystery >= 0) {
      if (r.mysteryCap) st.bonus[p] += r.mysteryCap;           // gizemli kuyudaki taşlar 2 kat
      if (r.last === st.mystery && !r.over) {                    // son taş gizemli kuyuya: +2 ve kuyu yer değiştirir
        st.bonus[p] += 2; r.mysteryHit = true;
        const options = PITS.filter(i => i !== st.mystery);
        st.mystery = options[Math.floor(rnd(st) * options.length)]; r.newMystery = st.mystery;
      }
    }
    st.moves++;
    if (r.over) { st.over = true; st.winner = winnerOf(st); }
    else if (!r.extra) {
      st.turn = 1 - p;
      if (st.frozen && st.frozen.p === p) st.frozen = null;
      if (st.shield != null && st.turn === st.shield) st.shield = null;
    }
    return { st, r };
  }
  /* Kartlar: hamle sırası bitmez, kartı kullanıp yine oynarsın */
  function cardOptions(st, p, card) {
    if (!st.cards || !st.cards[p][card] || st.over || st.turn !== p) return [];
    if (card === 'freeze') return legal(st.b, 1 - p);
    if (card === 'swap') { const o = p === 0 ? 0 : 7, r = []; for (let i = o; i < o + 5; i++) if (st.b[i] !== st.b[i + 1]) r.push(i); return r; }
    if (card === 'shield') return st.shield === p ? [] : [-1];
    return [];
  }
  function useCard(st0, p, card, arg) {
    if (!cardOptions(st0, p, card).includes(arg)) return null;
    const st = clone(st0);
    st.cards[p][card] = 0;
    if (card === 'freeze') st.frozen = { p: 1 - p, pit: arg };
    if (card === 'swap') { const t = st.b[arg]; st.b[arg] = st.b[arg + 1]; st.b[arg + 1] = t; }
    if (card === 'shield') st.shield = p;
    return st;
  }
  /* Bakış açısını çevir (çevrimiçide herkes kendini altta görür) */
  const fp = i => (i + 7) % 14;
  function flip(st) {
    const s = clone(st);
    s.b = st.b.map((_, i) => st.b[fp(i)]);
    s.bonus = [st.bonus[1], st.bonus[0]];
    s.turn = 1 - st.turn;
    s.mystery = st.mystery >= 0 ? fp(st.mystery) : -1;
    s.cards = st.cards ? [{ ...st.cards[1] }, { ...st.cards[0] }] : null;
    s.frozen = st.frozen ? { p: 1 - st.frozen.p, pit: fp(st.frozen.pit) } : null;
    s.shield = st.shield == null ? null : 1 - st.shield;
    s.winner = st.winner == null || st.winner === -1 ? st.winner : 1 - st.winner;
    return s;
  }

  /* =========================================================
     YAPAY ZEKÂ
     ========================================================= */
  let deadline = Infinity; class Timeout { }
  let nodes = 0;
  const tick = () => { if ((++nodes & 1023) === 0 && Date.now() > deadline) throw new Timeout(); };
  // Klasik kurallar için hızlı arama (sadece dizi)
  function ordered(b, p) {
    const ms = legal(b, p), my = STORE[p];
    return ms.sort((x, y) => { const ex = (x + b[x] - (b[x] > 1 ? 1 : 0)) % 14 === my ? 1 : 0, ey = (y + b[y] - (b[y] > 1 ? 1 : 0)) % 14 === my ? 1 : 0; return ey - ex; });
  }
  function mmFast(b, p, depth, a, be, me, sgn) {
    tick();
    const moves = ordered(b, p);
    if (depth === 0 || moves.length === 0) return sgn * (b[STORE[me]] - b[STORE[1 - me]]);
    let best = p === me ? -Infinity : Infinity;
    for (const m of moves) {
      const r = sow(b, p, m); let v;
      if (r.over) { const d = sgn * (r.board[STORE[me]] - r.board[STORE[1 - me]]); v = d > 0 ? 1000 + d + depth : d < 0 ? -1000 + d - depth : 0; }
      else v = mmFast(r.board, r.extra ? p : 1 - p, depth - 1, a, be, me, sgn);
      if (p === me) { if (v > best) best = v; if (best > a) a = best; } else { if (v < best) best = v; if (best < be) be = best; }
      if (a >= be) break;
    }
    return best;
  }
  // Genel arama (gizemli kuyu / kartlar)
  function evalSt(st, me) { const d = score(st, me) - score(st, 1 - me); return st.mode === 'reverse' ? -d : d; }
  function mmState(st, depth, a, be, me) {
    tick();
    const p = st.turn, moves = legalMoves(st, p);
    if (depth === 0 || st.over || !moves.length) return evalSt(st, me);
    let best = p === me ? -Infinity : Infinity;
    for (const m of moves) {
      const { st: s } = play(st, p, m); let v;
      if (s.over) { const d = evalSt(s, me); v = d > 0 ? 1000 + d + depth : d < 0 ? -1000 + d - depth : 0; }
      else v = mmState(s, depth - 1, a, be, me);
      if (p === me) { if (v > best) best = v; if (best > a) a = best; } else { if (v < best) best = v; if (best < be) be = best; }
      if (a >= be) break;
    }
    return best;
  }
  const fastOK = st => ['classic', 'blitz', 'reverse', 'mini', 'dev'].includes(st.mode);
  function scoreMoves(st, p, depth) {
    const out = [];
    if (fastOK(st)) {
      const sgn = st.mode === 'reverse' ? -1 : 1;
      for (const m of ordered(st.b, p)) {
        const r = sow(st.b, p, m); let v;
        if (r.over) { const d = sgn * (r.board[STORE[p]] - r.board[STORE[1 - p]]); v = d > 0 ? 1000 + d + depth : d < 0 ? -1000 + d - depth : 0; }
        else v = mmFast(r.board, r.extra ? p : 1 - p, depth - 1, -Infinity, Infinity, p, sgn);
        out.push([m, v]);
      }
    } else {
      for (const m of legalMoves(st, p)) {
        const { st: s } = play(st, p, m); let v;
        if (s.over) { const d = evalSt(s, p); v = d > 0 ? 1000 + d + depth : d < 0 ? -1000 + d - depth : 0; }
        else v = mmState(s, depth - 1, -Infinity, Infinity, p);
        out.push([m, v]);
      }
    }
    return out;
  }
  const pickBest = (sc, rand = Math.random) => { const mx = Math.max(...sc.map(s => s[1])); const c = sc.filter(s => s[1] === mx); return c[Math.floor(rand() * c.length)]; };
  /* ai: {easy:true} | {depth:n, time:ms} — {type:'move',pit} veya {type:'card',card,arg} döner */
  function botAction(st, ai, rand = Math.random) {
    const p = st.turn, ms = legalMoves(st, p);
    if (ai.easy) {
      if (st.cards && rand() < 0.15) { for (const c of ['shield', 'swap', 'freeze']) { const o = cardOptions(st, p, c); if (o.length) return { type: 'card', card: c, arg: o[Math.floor(rand() * o.length)] }; } }
      if (rand() < 0.7) return { type: 'move', pit: ms[Math.floor(rand() * ms.length)] };
      deadline = Infinity; return { type: 'move', pit: pickBest(scoreMoves(st, p, 1), rand)[0] };
    }
    let depth = ai.depth;
    if (!fastOK(st)) depth = Math.min(depth, ai.depth >= 9 ? 6 : ai.depth >= 4 ? 4 : ai.depth);
    deadline = ai.time ? Date.now() + ai.time : Infinity;
    let best = [ms[0], -Infinity];
    try { for (let d = ai.time ? 1 : depth; d <= depth; d++) best = pickBest(scoreMoves(st, p, d), rand); }
    catch (e) { if (!(e instanceof Timeout)) throw e; }
    // Kart kullanımı: değeri belirgin artırıyorsa
    if (st.cards && best[1] < 900) {
      deadline = Date.now() + 600;
      const cd = Math.max(1, Math.min(3, depth - 1));
      try {
        let bestCard = null;
        for (const c of ['freeze', 'swap', 'shield']) for (const arg of cardOptions(st, p, c)) {
          const s = useCard(st, p, c, arg); const v = pickBest(scoreMoves(s, p, cd), rand)[1];
          if (!bestCard || v > bestCard.v) bestCard = { card: c, arg, v };
        }
        const base = pickBest(scoreMoves(st, p, cd), rand)[1];
        if (bestCard && bestCard.v >= base + 3) { deadline = Infinity; return { type: 'card', card: bestCard.card, arg: bestCard.arg }; }
      } catch (e) { if (!(e instanceof Timeout)) throw e; }
    }
    deadline = Infinity;
    return { type: 'move', pit: best[0] };
  }

  /* ---------- Maç analizi (Koç) — klasik kurallar ---------- */
  function analyzeMove(st, p, played, depth = 6) {
    if (!fastOK(st) || st.mode === 'reverse') return null;
    deadline = Infinity;
    const sc = scoreMoves(st, p, depth);
    const best = sc.reduce((x, y) => y[1] > x[1] ? y : x);
    const mine = sc.find(s => s[0] === played);
    return { best: best[0], bestV: best[1], playedV: mine ? mine[1] : best[1], loss: mine ? best[1] - mine[1] : 0, all: sc };
  }
  /* Turu (ekstra hamleler dahil) bütün olası dizileriyle gez — bulmacalar için */
  function turnSequences(st, p, maxLen = 6) {
    const out = [];
    (function dfs(s, seq, acc) {
      const ms = legalMoves(s, p);
      for (const m of ms) {
        const { st: n, r } = play(s, p, m);
        const a = { gain: acc.gain + (n.b[STORE[p]] - s.b[STORE[p]]), even: acc.even + (r.cap && r.cap.type === 'even' ? r.cap.amount : 0),
          empty: acc.empty + (r.cap && r.cap.type === 'empty' ? r.cap.amount : 0), extra: acc.extra + (r.extra ? 1 : 0) };
        const sq = seq.concat(m);
        if (n.over || !r.extra || sq.length >= maxLen) out.push({ seq: sq, ...a, over: n.over, win: n.over && n.winner === p, final: n });
        else dfs(n, sq, a);
      }
    })(st, [], { gain: 0, even: 0, empty: 0, extra: 0 });
    return out;
  }

  const Engine = { STORE, INIT, PITS, isPit, ownerOf, sideSum, legal, sow, newState, clone, score, winnerOf, legalMoves, play,
    cardOptions, useCard, flip, botAction, scoreMoves, analyzeMove, turnSequences, rnd };
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine; else root.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
