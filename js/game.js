// game.js — Ludo rules engine. Holds game state and exposes pure-ish
// operations. No DOM here; render.js reads state and main.js drives events.

import {
  PLAYER_SETS, TURN_ORDER, START_INDEX, HOME_PATH, SAFE_INDICES,
  FINISH, mainIndexFor,
} from './board.js';

export function createGame(playerCount, autoRoll, players = null) {
  const colors = PLAYER_SETS[playerCount];
  // Preserve clockwise turn order but keep only active colors.
  const order = TURN_ORDER.filter((c) => colors.includes(c));

  const tokens = [];
  for (const color of colors) {
    for (let i = 0; i < 4; i++) {
      tokens.push({ id: `${color}-${i}`, color, slot: i, pos: -1 });
    }
  }

  // Who controls each color: 'human' (default) or 'cpu'.
  const modes = {};
  for (const c of order) modes[c] = players?.[c] === 'cpu' ? 'cpu' : 'human';

  return {
    order,
    autoRoll,
    players: modes,
    tokens,
    turnIdx: 0,            // index into `order`
    dice: null,           // last rolled value, or null
    phase: 'rolling',     // 'rolling' | 'moving' | 'over'
    sixStreak: 0,         // consecutive 6s this turn
    ranking: [],          // colors in the order they finished (1st, 2nd, …)
    winner: null,
    message: '',
  };
}

export function currentColor(g) {
  return g.order[g.turnIdx];
}

export function tokensOf(g, color) {
  return g.tokens.filter((t) => t.color === color);
}

// Tokens sitting on a given main-track index (excludes base/home).
function tokensOnMainIndex(g, idx) {
  return g.tokens.filter((t) => mainIndexFor(t.color, t.pos) === idx);
}

// A "block" is 2+ tokens of the same color on one main-track cell.
function blockColorAt(g, idx) {
  const here = tokensOnMainIndex(g, idx);
  if (here.length < 2) return null;
  const first = here[0].color;
  return here.every((t) => t.color === first) ? first : null;
}

export function roll() {
  return 1 + Math.floor(Math.random() * 6);
}

// Can `token` legally move `dice` steps? Returns the resulting pos, or null.
export function targetPos(g, token, dice) {
  const { color, pos } = token;

  if (pos === -1) {
    // Must roll a 6 to leave base.
    if (dice !== 6) return null;
    const dest = 0;
    const idx = mainIndexFor(color, dest);
    const block = blockColorAt(g, idx);
    if (block && block !== color) return null; // blocked start cell
    return dest;
  }

  const dest = pos + dice;
  if (dest > FINISH) return null; // exact roll required to finish

  // Walk the intermediate + destination main-track cells for opponent blocks.
  for (let p = pos + 1; p <= Math.min(dest, 50); p++) {
    const idx = mainIndexFor(color, p);
    const block = blockColorAt(g, idx);
    if (block && block !== color) return null; // cannot pass/land on a block
  }
  return dest;
}

// All tokens of the current player that can move with the current dice.
export function legalTokens(g) {
  const color = currentColor(g);
  return tokensOf(g, color).filter((t) => targetPos(g, t, g.dice) !== null);
}

// If every legal move is equivalent — all movable tokens share one position,
// so it makes no difference which you pick — return the token to move
// automatically; otherwise null (the player has a real choice to make).
// Covers: only one piece out, all four in base (a 6), the last piece left,
// and two-or-more pieces stacked on the same cell.
export function soleMoveToken(g) {
  const movers = legalTokens(g);
  if (movers.length === 0) return null;
  const positions = new Set(movers.map((t) => t.pos));
  return positions.size === 1 ? movers[0] : null;
}

// Apply a move. Assumes the move is legal. Handles capture. Returns info
// about what happened so the caller can message/animate.
export function moveToken(g, token) {
  const dest = targetPos(g, token, g.dice);
  token.pos = dest;

  let captured = [];
  const idx = mainIndexFor(token.color, dest);
  if (idx !== null && !SAFE_INDICES.has(idx)) {
    // Send any single opponent token(s) on this cell back to base.
    const others = tokensOnMainIndex(g, idx).filter((t) => t.color !== token.color);
    for (const opp of others) {
      opp.pos = -1;
      captured.push(opp);
    }
  }
  const finished = dest === FINISH;
  return { captured, finished };
}

// Resolve what happens at a token's CURRENT cell (used after animating the
// slide). Sends any single opponent token(s) on a non-safe cell home.
export function applyCapture(g, token) {
  const captured = [];
  const idx = mainIndexFor(token.color, token.pos);
  if (idx !== null && !SAFE_INDICES.has(idx)) {
    const others = g.tokens.filter(
      (t) => t.color !== token.color && mainIndexFor(t.color, t.pos) === idx
    );
    for (const opp of others) { opp.pos = -1; captured.push(opp); }
  }
  return { captured, finished: token.pos === FINISH };
}

// Has the current player won (all four tokens finished)?
export function hasWon(g, color) {
  return tokensOf(g, color).every((t) => t.pos === FINISH);
}

// A player takes another turn after rolling a 6 or sending a token home.
export function grantsBonus(finished, dice) {
  return finished === true || dice === 6;
}

// Colors still in the game (not yet finished). When only one remains, the
// game is over and that color takes the last placement.
export function remainingPlayers(g) {
  return g.order.filter((c) => !g.ranking.includes(c));
}

// Advance to the next active player and reset per-turn state. Skips colors
// that have already finished (they no longer take turns).
export function nextTurn(g) {
  do {
    g.turnIdx = (g.turnIdx + 1) % g.order.length;
  } while (
    g.ranking.includes(g.order[g.turnIdx]) &&
    g.ranking.length < g.order.length
  );
  g.dice = null;
  g.sixStreak = 0;
  g.phase = 'rolling';
}
