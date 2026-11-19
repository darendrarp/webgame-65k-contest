import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COMBO_MAX, COMBO_WINDOW, comboAfter, levelCompleteBonus, shardPoints, starsFor,
} from '../game/js/scoring.js';

test('combo: first collect in a flight is x1', () => {
  assert.equal(comboAfter(null, 0), 1);
  assert.equal(comboAfter(undefined, 3), 1);
});

test('combo: quick consecutive collects chain up', () => {
  assert.equal(comboAfter(1.0, 1), 2);
  assert.equal(comboAfter(2.4, 2), 3);
  assert.equal(comboAfter(COMBO_WINDOW, 2), 3, 'exactly at the window still chains');
});

test('combo: slow collect resets to x1', () => {
  assert.equal(comboAfter(2.6, 4), 1);
  assert.equal(comboAfter(10, 5), 1);
});

test('combo: multiplier caps at COMBO_MAX', () => {
  assert.equal(comboAfter(0.5, COMBO_MAX), COMBO_MAX);
});

test('shardPoints: 100 base times the combo', () => {
  assert.equal(shardPoints(1), 100);
  assert.equal(shardPoints(3), 300);
  assert.equal(shardPoints(5), 500);
});

test('levelCompleteBonus: fast + unused launches pays best', () => {
  const fastFull = levelCompleteBonus(2, 0);
  assert.equal(fastFull, 500 + 2 * 150 + 300);
  const slowNone = levelCompleteBonus(0, 90);
  assert.equal(slowNone, 500);
  const mid = levelCompleteBonus(1, 45);
  assert.equal(mid, 500 + 150 + 150);
  const overTime = levelCompleteBonus(0, 500);
  assert.equal(overTime, 500, 'time bonus never goes negative');
});

test('starsFor: thresholds map to 1/2/3 stars', () => {
  const level = { star2: 1000, star3: 1500 };
  assert.equal(starsFor(0, level), 1);
  assert.equal(starsFor(999, level), 1);
  assert.equal(starsFor(1000, level), 2);
  assert.equal(starsFor(1499, level), 2);
  assert.equal(starsFor(1500, level), 3);
  assert.equal(starsFor(99999, level), 3);
});
