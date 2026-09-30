// voice.test.js — the spoken-command parser. Pure function, no browser needed.

import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCommand } from '../js/voice.js';

test('digits 1-4 are recognised', () => {
  assert.deepEqual(parseCommand('2'), { type: 'move', number: 2 });
  assert.deepEqual(parseCommand('move 3'), { type: 'move', number: 3 });
  assert.deepEqual(parseCommand('move number 1 please'), { type: 'move', number: 1 });
  assert.deepEqual(parseCommand('piece 4'), { type: 'move', number: 4 });
});

test('number words are recognised', () => {
  assert.deepEqual(parseCommand('two'), { type: 'move', number: 2 });
  assert.deepEqual(parseCommand('move number three'), { type: 'move', number: 3 });
  assert.deepEqual(parseCommand('one'), { type: 'move', number: 1 });
  assert.deepEqual(parseCommand('four'), { type: 'move', number: 4 });
});

test('common homophones map to the right number', () => {
  assert.deepEqual(parseCommand('to'), { type: 'move', number: 2 });
  assert.deepEqual(parseCommand('for'), { type: 'move', number: 4 });
  assert.deepEqual(parseCommand('tree'), { type: 'move', number: 3 });
});

test('"roll" is recognised as a roll command', () => {
  assert.deepEqual(parseCommand('roll'), { type: 'roll' });
  assert.deepEqual(parseCommand('please roll the dice'), { type: 'roll' });
});

test('bare "1" and its variants all resolve to piece 1 (regression)', () => {
  assert.deepEqual(parseCommand('1'), { type: 'move', number: 1 });
  assert.deepEqual(parseCommand('one'), { type: 'move', number: 1 });
  assert.deepEqual(parseCommand('piece 1'), { type: 'move', number: 1 });
  assert.deepEqual(parseCommand('won'), { type: 'move', number: 1 });
  assert.deepEqual(parseCommand('juan'), { type: 'move', number: 1 });
});

test('unrecognised speech returns null', () => {
  assert.equal(parseCommand('hello there'), null);
  assert.equal(parseCommand('move it'), null);
  assert.equal(parseCommand('five'), null); // only 1-4 are valid pieces
});
