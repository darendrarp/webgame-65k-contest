import assert from 'node:assert/strict';
import test from 'node:test';
import { LEVELS, validateLevel } from '../game/js/levels.js';

test('there are exactly 12 levels with unique names', () => {
  assert.equal(LEVELS.length, 12);
  const names = LEVELS.map((l) => l.name);
  assert.equal(new Set(names).size, names.length);
  for (const l of LEVELS) assert.ok(l.tip && l.tip.length > 10, `${l.name} needs a tip`);
});

test('every level passes structural validation', () => {
  for (let i = 0; i < LEVELS.length; i++) {
    const problems = validateLevel(LEVELS[i], i);
    assert.deepEqual(problems, [], `level ${i + 1} (${LEVELS[i].name})`);
  }
});

test('launch budgets are sane (3-7) and shard counts grow overall', () => {
  for (const l of LEVELS) {
    assert.ok(l.launches >= 3 && l.launches <= 7, `${l.name}: launches=${l.launches}`);
    assert.ok(l.shards.length >= 2 && l.shards.length <= 6, `${l.name}: shards`);
    assert.ok(
      l.launches >= l.shards.length + 1,
      `${l.name}: needs at least one spare launch for the gate run`,
    );
  }
  assert.ok(
    LEVELS[11].shards.length >= LEVELS[0].shards.length,
    'the finale should have at least as many shards as level 1',
  );
});

test('validateLevel catches bad data', () => {
  const bad = {
    name: 'Bad', tip: 'x', launches: 0, pad: { x: -5, y: 0 }, gate: { x: 1, y: 1 },
    planets: [], shards: [], asteroids: [], star2: 10, star3: 5,
  };
  const problems = validateLevel(bad, 0);
  assert.ok(problems.length >= 3, `expected several problems, got: ${problems.join('; ')}`);
});
