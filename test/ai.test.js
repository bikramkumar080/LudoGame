// ai.test.js — computer-opponent move selection. Pure, no browser.

import test from 'node:test';
import assert from 'node:assert/strict';

import { START_INDEX, FINISH } from '../js/board.js';
import { createGame } from '../js/game.js';
import { chooseMove, isCpuTurn } from '../js/ai.js';

const tok = (g, id) => g.tokens.find((t) => t.id === id);
const posForMainIndex = (color, idx) => ((idx - START_INDEX[color]) % 52 + 52) % 52;

test('capture beats a plain advance', () => {
  const g = createGame(4, true); g.dice = 3;
  // red-0 pos 2 -> dest 5 (main idx 5, non-safe) captures a lone green there.
  tok(g, 'red-0').pos = 2;
  tok(g, 'green-0').pos = posForMainIndex('green', 5);
  // red-1 pos 20 -> dest 23, just an advance.
  tok(g, 'red-1').pos = 20;
  assert.equal(chooseMove(g).id, 'red-0');
});

test('capture beats finishing a token', () => {
  const g = createGame(4, true); g.dice = 6;
  tok(g, 'red-0').pos = 50; // -> FINISH
  tok(g, 'red-1').pos = 5;  // -> dest 11 captures a lone green
  tok(g, 'green-0').pos = posForMainIndex('green', 11);
  assert.equal(chooseMove(g).id, 'red-1');
});

test('with a 6 and nothing better, a bot leaves base', () => {
  const g = createGame(4, true); g.dice = 6;
  tok(g, 'red-0').pos = 10; // -> dest 16, a plain advance
  // red-1..3 still in base; leaving base should be preferred.
  const pick = chooseMove(g);
  assert.equal(pick.pos, -1, 'should bring a base token out');
});

test('fallback advances the furthest-along token', () => {
  const g = createGame(4, true); g.dice = 2; // no base exits possible
  tok(g, 'red-0').pos = 10; // -> 12
  tok(g, 'red-1').pos = 20; // -> 22 (furthest)
  assert.equal(chooseMove(g).id, 'red-1');
});

test('chooseMove returns null when no move is possible', () => {
  const g = createGame(4, true); g.dice = 3; // all in base, needs a 6
  assert.equal(chooseMove(g), null);
});

test('isCpuTurn reflects the players map', () => {
  const g = createGame(2, true);
  g.players = { red: 'human', yellow: 'cpu' };
  assert.equal(isCpuTurn(g), false); // red's turn, human
  g.turnIdx = 1;
  assert.equal(isCpuTurn(g), true);  // yellow's turn, cpu
});
