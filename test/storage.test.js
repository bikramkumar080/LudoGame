// storage.test.js — save/load/clear round-trip with a localStorage stub.

import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../js/game.js';
import { save, load, clear } from '../js/storage.js';

class MemStore {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}

function withStore(store, fn) {
  const prev = globalThis.localStorage;
  globalThis.localStorage = store;
  try { fn(); } finally { globalThis.localStorage = prev; }
}

test('save then load round-trips the game state', () => {
  withStore(new MemStore(), () => {
    const g = createGame(4, true);
    g.turnIdx = 2; g.dice = 5; g.tokens[0].pos = 10; g.ranking = ['green'];
    save(g);
    const back = load();
    assert.equal(back.turnIdx, 2);
    assert.equal(back.dice, 5);
    assert.equal(back.tokens[0].pos, 10);
    assert.deepEqual(back.ranking, ['green']);
    assert.deepEqual(back.order, g.order);
  });
});

test('clear removes the saved game', () => {
  withStore(new MemStore(), () => {
    save(createGame(2, false));
    assert.ok(load(), 'present after save');
    clear();
    assert.equal(load(), null, 'gone after clear');
  });
});

test('load returns null for corrupt data', () => {
  const store = new MemStore();
  store.setItem('ludo:save', '{not valid json');
  withStore(store, () => {
    assert.equal(load(), null);
  });
});

test('load returns null when nothing is saved', () => {
  withStore(new MemStore(), () => {
    assert.equal(load(), null);
  });
});

test('save/load are no-ops when localStorage is unavailable', () => {
  withStore(null, () => {
    assert.doesNotThrow(() => save(createGame(2, true)));
    assert.equal(load(), null);
  });
});
