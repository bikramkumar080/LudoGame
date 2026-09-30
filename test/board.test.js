// board.test.js — geometry & constants. These lock down the board layout
// so movement math can't silently drift.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAIN_PATH, START_INDEX, HOME_PATH, SAFE_INDICES, BASE_SLOTS,
  FINISH, cellFor, mainIndexFor, PLAYER_SETS, TURN_ORDER,
} from '../js/board.js';

const adjacent = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

test('main track has exactly 52 cells, all unique', () => {
  assert.equal(MAIN_PATH.length, 52);
  const seen = new Set(MAIN_PATH.map(([r, c]) => `${r},${c}`));
  assert.equal(seen.size, 52);
});

test('start cells sit at the expected coordinates', () => {
  assert.ok(same(MAIN_PATH[START_INDEX.red], [6, 1]));
  assert.ok(same(MAIN_PATH[START_INDEX.green], [1, 8]));
  assert.ok(same(MAIN_PATH[START_INDEX.yellow], [8, 13]));
  assert.ok(same(MAIN_PATH[START_INDEX.blue], [13, 6]));
});

test('there are 8 safe cells and every start cell is safe', () => {
  assert.equal(SAFE_INDICES.size, 8);
  for (const color of Object.keys(START_INDEX)) {
    assert.ok(SAFE_INDICES.has(START_INDEX[color]), `${color} start should be safe`);
  }
});

test('each home column has 6 cells and joins the track cleanly', () => {
  for (const color of ['red', 'green', 'yellow', 'blue']) {
    assert.equal(HOME_PATH[color].length, 6);
    // The main-track cell a token leaves from must touch the first home cell.
    const turnOff = MAIN_PATH[(START_INDEX[color] + 50) % 52];
    assert.ok(adjacent(turnOff, HOME_PATH[color][0]),
      `${color} turn-off ${turnOff} not adjacent to home entry ${HOME_PATH[color][0]}`);
    // Home cells themselves form a connected line.
    for (let i = 1; i < 6; i++) {
      assert.ok(adjacent(HOME_PATH[color][i - 1], HOME_PATH[color][i]),
        `${color} home cells ${i - 1}->${i} not adjacent`);
    }
  }
});

test('FINISH is the last home cell (pos 56)', () => {
  assert.equal(FINISH, 56);
  for (const color of ['red', 'green', 'yellow', 'blue']) {
    assert.ok(same(cellFor(color, FINISH, 0), HOME_PATH[color][5]));
  }
});

test('cellFor resolves base / track / home correctly', () => {
  assert.ok(same(cellFor('red', -1, 2), BASE_SLOTS.red[2]));       // base slot
  assert.ok(same(cellFor('red', 0, 0), MAIN_PATH[START_INDEX.red])); // start cell
  assert.ok(same(cellFor('red', 51, 0), HOME_PATH.red[0]));        // first home cell
});

test('mainIndexFor is null off the track, correct on it', () => {
  assert.equal(mainIndexFor('red', -1), null);   // base
  assert.equal(mainIndexFor('red', 51), null);   // home column
  assert.equal(mainIndexFor('red', 0), START_INDEX.red);
  assert.equal(mainIndexFor('green', 0), START_INDEX.green);
  assert.equal(mainIndexFor('red', 50), (START_INDEX.red + 50) % 52);
});

test('player sets and turn order are consistent & clockwise', () => {
  assert.deepEqual(PLAYER_SETS[2], ['red', 'yellow']);
  assert.deepEqual(PLAYER_SETS[3], ['red', 'green', 'yellow']);
  assert.deepEqual(PLAYER_SETS[4], ['red', 'green', 'yellow', 'blue']);
  assert.deepEqual(TURN_ORDER, ['red', 'green', 'yellow', 'blue']);
});
