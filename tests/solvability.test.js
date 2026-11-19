import assert from 'node:assert/strict';
import test from 'node:test';
import { LEVELS } from '../game/js/levels.js';
import { solveLevel } from '../game/js/physics.js';
import * as scoring from '../game/js/scoring.js';

// Automated playtest: a greedy solver (fixed grid of aim angles x powers,
// best-first per launch) must be able to beat every level within its launch
// budget. If the greedy solver can do it, a human with the aim preview and
// retries certainly can. This is the test that proves the game is winnable.

test('every level is beatable by the greedy solver', { timeout: 300000 }, () => {
  const rows = [];
  for (let i = 0; i < LEVELS.length; i++) {
    const level = LEVELS[i];
    const r = solveLevel(level, scoring);
    rows.push(
      `L${String(i + 1).padStart(2)} ${level.name.padEnd(16)} ` +
      `won=${r.won} launches=${r.launchesUsed}/${level.launches} ` +
      `solverScore=${r.score} star2=${level.star2} star3=${level.star3}`,
    );
    assert.ok(r.won, `level ${i + 1} (${level.name}) must be beatable — solver log: ${JSON.stringify(r.log)}`);
    assert.ok(r.launchesUsed <= level.launches, 'solver must stay in budget');
    // Star thresholds must be reachable in principle: 3 stars no more than
    // 30% above the greedy solver's score (combos + orbit bonuses make up
    // the difference for a skilled human).
    assert.ok(
      level.star3 <= r.score * 1.3,
      `level ${i + 1}: star3=${level.star3} unreachable vs solver score ${r.score}`,
    );
    assert.ok(level.star2 <= r.score, `level ${i + 1}: star2=${level.star2} above solver score ${r.score}`);
  }
  // Print the table so a human can eyeball the difficulty curve.
  console.log('\n' + rows.join('\n'));
});
