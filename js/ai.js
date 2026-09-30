// ai.js — computer-opponent move selection. Pure: no DOM, no state mutation.
// Given the current game + dice, pick which token a bot (or a hint) should move.

import { SAFE_INDICES, FINISH, mainIndexFor } from './board.js';
import { legalTokens, targetPos, currentColor } from './game.js';

// Would moving `token` to `dest` land on a capturable opponent? A legal dest
// already rules out opponent blocks, so any opponent sharing the destination
// cell on a non-safe main-track square is a capture.
function wouldCapture(g, token, dest) {
  if (dest > 50) return false; // home column / finish: no captures
  const idx = mainIndexFor(token.color, dest);
  if (idx === null || SAFE_INDICES.has(idx)) return false;
  return g.tokens.some(
    (t) => t.color !== token.color && mainIndexFor(t.color, t.pos) === idx
  );
}

function isSafeDest(color, dest) {
  if (dest >= 51) return true; // home column is always safe
  const idx = mainIndexFor(color, dest);
  return idx !== null && SAFE_INDICES.has(idx);
}

// Score a candidate move. Higher wins. Category dominates; `pos` (progress
// toward home) breaks ties so the bot pushes its furthest token.
// Priority: capture > finish > leave base > reach safety > advance furthest.
function scoreMove(g, token) {
  const dest = targetPos(g, token, g.dice);
  if (dest === null) return -1;

  let category;
  if (wouldCapture(g, token, dest)) category = 5;
  else if (dest === FINISH) category = 4;
  else if (token.pos === -1) category = 3; // leaving base
  else if (isSafeDest(token.color, dest)) category = 2;
  else category = 1;

  return category * 100 + dest;
}

// The token the current player's bot should move, or null if none can move.
export function chooseMove(g) {
  const movers = legalTokens(g);
  if (movers.length === 0) return null;
  let best = null;
  let bestScore = -Infinity;
  for (const t of movers) {
    const s = scoreMove(g, t);
    if (s > bestScore) { bestScore = s; best = t; }
  }
  return best;
}

// Is the color whose turn it is controlled by the computer?
export function isCpuTurn(g) {
  return g.players?.[currentColor(g)] === 'cpu';
}
