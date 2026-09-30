// game.test.js — rules engine. Covers setup, dice, legal moves (incl. the
// "why don't pieces glow" scenario), blocks, captures, safe cells, finishing,
// winning, and turn advancement.

import test from 'node:test';
import assert from 'node:assert/strict';

import { START_INDEX, SAFE_INDICES, FINISH } from '../js/board.js';
import {
  createGame, currentColor, roll, targetPos, legalTokens,
  applyCapture, moveToken, hasWon, nextTurn,
} from '../js/game.js';

const tok = (g, id) => g.tokens.find((t) => t.id === id);
// Put a token onto a specific main-track cell by choosing the right pos.
const posForMainIndex = (color, idx) => ((idx - START_INDEX[color]) % 52 + 52) % 52;

// ---------- setup ----------
test('createGame builds the right players and tokens', () => {
  const g4 = createGame(4, true);
  assert.equal(g4.tokens.length, 16);
  assert.deepEqual(g4.order, ['red', 'green', 'yellow', 'blue']);
  assert.ok(g4.tokens.every((t) => t.pos === -1));
  assert.equal(g4.phase, 'rolling');
  assert.equal(g4.autoRoll, true);

  assert.deepEqual(createGame(2, false).order, ['red', 'yellow']);
  assert.deepEqual(createGame(3, false).order, ['red', 'green', 'yellow']);
  assert.equal(createGame(2, false).tokens.length, 8);
});

// ---------- dice ----------
test('roll only ever returns 1..6', () => {
  for (let i = 0; i < 2000; i++) {
    const v = roll();
    assert.ok(Number.isInteger(v) && v >= 1 && v <= 6);
  }
});

// ---------- leaving base ----------
test('a base token needs a 6 to move (and can with a 6)', () => {
  const g = createGame(4, true);
  const t = tok(g, 'red-0');
  for (let d = 1; d <= 5; d++) assert.equal(targetPos(g, t, d), null);
  assert.equal(targetPos(g, t, 6), 0);
});

test('THE GLOW SCENARIO: at game start, dice 6 makes all 4 base tokens movable, other rolls make none', () => {
  const g = createGame(4, true);
  g.dice = 6;
  assert.equal(legalTokens(g).length, 4, 'all four should be movable on a 6');
  g.dice = 3;
  assert.equal(legalTokens(g).length, 0, 'none movable without a 6 when stuck in base');
});

// ---------- normal movement & exact finish ----------
test('normal track movement adds the dice value', () => {
  const g = createGame(4, true);
  const t = tok(g, 'red-0');
  t.pos = 0;
  assert.equal(targetPos(g, t, 3), 3);
});

test('finishing requires an exact roll; overshoot is illegal', () => {
  const g = createGame(4, true);
  const t = tok(g, 'red-0');
  t.pos = 50;
  assert.equal(targetPos(g, t, 6), FINISH);   // lands exactly on finish
  t.pos = 55;
  assert.equal(targetPos(g, t, 1), FINISH);   // exact
  assert.equal(targetPos(g, t, 2), null);     // overshoot
  t.pos = FINISH;
  assert.equal(targetPos(g, t, 1), null);     // already home, cannot move
});

// ---------- blocks ----------
test('an opponent block cannot be passed or landed on', () => {
  const g = createGame(4, true);
  const red = tok(g, 'red-0');
  red.pos = 0; // red main index 0
  // Two green tokens form a block on red-relative index 2.
  tok(g, 'green-0').pos = posForMainIndex('green', 2);
  tok(g, 'green-1').pos = posForMainIndex('green', 2);

  assert.equal(targetPos(g, red, 1), 1, 'can move up to just before the block');
  assert.equal(targetPos(g, red, 2), null, 'cannot land on the block');
  assert.equal(targetPos(g, red, 3), null, 'cannot pass through the block');
});

test('a block of your OWN colour does not stop you', () => {
  const g = createGame(4, true);
  const red = tok(g, 'red-0');
  red.pos = 0;
  tok(g, 'red-1').pos = 2; // two reds ahead form own block at index 2
  tok(g, 'red-2').pos = 2;
  assert.equal(targetPos(g, red, 3), 3, 'own block is passable');
});

// ---------- captures & safe cells ----------
test('landing on a lone opponent on a normal cell sends it home', () => {
  const g = createGame(4, true);
  const red = tok(g, 'red-0');
  const idx = 5; // MAIN_PATH[5] = [5,6], not a safe cell
  assert.ok(!SAFE_INDICES.has(idx));
  red.pos = posForMainIndex('red', idx);
  const green = tok(g, 'green-0');
  green.pos = posForMainIndex('green', idx);

  const { captured } = applyCapture(g, red);
  assert.equal(captured.length, 1);
  assert.equal(green.pos, -1, 'captured token returns to base');
});

test('no capture happens on a safe cell', () => {
  const g = createGame(4, true);
  const red = tok(g, 'red-0');
  const idx = 8; // a safe star cell
  assert.ok(SAFE_INDICES.has(idx));
  red.pos = posForMainIndex('red', idx);
  const green = tok(g, 'green-0');
  green.pos = posForMainIndex('green', idx);

  const { captured } = applyCapture(g, red);
  assert.equal(captured.length, 0);
  assert.notEqual(green.pos, -1, 'token on a safe cell is untouched');
});

test('you never capture your own token', () => {
  const g = createGame(4, true);
  const red0 = tok(g, 'red-0');
  const red1 = tok(g, 'red-1');
  const idx = 5;
  red0.pos = posForMainIndex('red', idx);
  red1.pos = posForMainIndex('red', idx);
  const { captured } = applyCapture(g, red0);
  assert.equal(captured.length, 0);
  assert.notEqual(red1.pos, -1);
});

test('moveToken applies the move and reports finishing', () => {
  const g = createGame(4, true);
  g.dice = 6;
  const t = tok(g, 'red-0');
  const res = moveToken(g, t);
  assert.equal(t.pos, 0);
  assert.equal(res.finished, false);

  t.pos = 50;
  g.dice = 6;
  const res2 = moveToken(g, t);
  assert.equal(t.pos, FINISH);
  assert.equal(res2.finished, true);
});

// ---------- winning ----------
test('hasWon is true only when all four tokens are home', () => {
  const g = createGame(4, true);
  const reds = g.tokens.filter((t) => t.color === 'red');
  reds.forEach((t) => { t.pos = FINISH; });
  assert.ok(hasWon(g, 'red'));
  reds[0].pos = 40;
  assert.ok(!hasWon(g, 'red'));
});

// ---------- turn advancement ----------
test('nextTurn cycles players and resets per-turn state', () => {
  const g = createGame(3, true); // red, green, yellow
  assert.equal(currentColor(g), 'red');
  g.dice = 6; g.sixStreak = 2; g.phase = 'moving';
  nextTurn(g);
  assert.equal(currentColor(g), 'green');
  assert.equal(g.dice, null);
  assert.equal(g.sixStreak, 0);
  assert.equal(g.phase, 'rolling');
  nextTurn(g); assert.equal(currentColor(g), 'yellow');
  nextTurn(g); assert.equal(currentColor(g), 'red'); // wraps around
});
