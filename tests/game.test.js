import assert from 'node:assert/strict';
import test from 'node:test';
import { LEVELS } from '../game/js/levels.js';
import { solveLevel } from '../game/js/physics.js';
import * as scoring from '../game/js/scoring.js';
import {
  aimPreview, campaignScore, createGame, launch, startLevel, update,
} from '../game/js/game.js';

// Drive the game until the current flight ends (or a safety step cap).
function runFlight(game) {
  const events = [];
  for (let i = 0; i < 60 * 30 && game.flight; i++) {
    events.push(...update(game, 1 / 60));
  }
  return events;
}

// Play a level with solver-chosen launches. Returns the game afterwards.
function playWithSolver(game, index) {
  startLevel(game, index);
  const solution = solveLevel(LEVELS[index], scoring);
  assert.ok(solution.won, `solver must win level ${index + 1} for this test`);
  for (const step of solution.log) {
    assert.equal(game.screen, 'playing', `level ${index + 1}: still playing before launch`);
    assert.ok(launch(game, (step.deg * Math.PI) / 180, step.power), 'launch must succeed');
    runFlight(game);
    if (game.screen !== 'playing') break;
  }
  return { game, solution };
}

test('createGame: fresh game starts on the menu with level 1 unlocked', () => {
  const g = createGame();
  assert.equal(g.screen, 'menu');
  assert.equal(g.unlocked, 1);
  assert.deepEqual(g.best, {});
  assert.equal(campaignScore(g), 0);
});

test('startLevel resets run state', () => {
  const g = createGame();
  startLevel(g, 2);
  assert.equal(g.screen, 'playing');
  assert.equal(g.levelIndex, 2);
  assert.equal(g.launchesLeft, LEVELS[2].launches);
  assert.equal(g.score, 0);
  assert.equal(g.collected.size, 0);
  assert.equal(g.flight, null);
});

test('launch: consumes one launch and refuses while flying', () => {
  const g = createGame();
  startLevel(g, 0);
  assert.ok(launch(g, 0, 1));
  assert.equal(g.launchesLeft, LEVELS[0].launches - 1);
  assert.ok(g.flight);
  assert.equal(launch(g, 0, 1), false, 'cannot launch mid-flight');
});

test('launch: refused with no launches left', () => {
  const g = createGame();
  startLevel(g, 0);
  g.launchesLeft = 0;
  assert.equal(launch(g, 0, 1), false);
});

test('update with no flight is a no-op', () => {
  const g = createGame();
  startLevel(g, 0);
  assert.deepEqual(update(g, 1 / 60), []);
});

test('crash: flying into the level-1 planet ends the flight, not the level', () => {
  const g = createGame();
  startLevel(g, 0);
  // Aim straight at the planet centre: pad (90,270) -> planet (480,330).
  launch(g, Math.atan2(60, 390), 1);
  const events = runFlight(g);
  assert.ok(events.some((e) => e.type === 'crashed'), `expected crash, got ${JSON.stringify(events)}`);
  assert.equal(g.screen, 'playing');
  assert.equal(g.launchesLeft, LEVELS[0].launches - 1);
});

test('lost: flying backwards off the edge ends the flight', () => {
  const g = createGame();
  startLevel(g, 0);
  launch(g, Math.PI, 1); // straight left, away from everything
  const events = runFlight(g);
  assert.ok(events.some((e) => e.type === 'lost'), `expected lost, got ${JSON.stringify(events)}`);
  assert.equal(g.screen, 'playing');
});

test('game over: losing every launch ends the level', () => {
  const g = createGame();
  startLevel(g, 0);
  while (g.screen === 'playing') {
    launch(g, Math.PI, 1);
    runFlight(g);
  }
  assert.equal(g.screen, 'gameOver');
  assert.equal(g.launchesLeft, 0);
});

test('aimPreview: returns a path and a predicted outcome', () => {
  const g = createGame();
  startLevel(g, 0);
  const atPlanet = aimPreview(g, Math.atan2(60, 390), 1);
  assert.ok(atPlanet.points.length > 10, 'preview should have many points');
  assert.equal(atPlanet.status, 'crashed', 'straight at the planet must predict a crash');
  const up = aimPreview(g, -Math.PI / 2, 0.5);
  assert.ok(up.points.length > 0);
  assert.equal(up.status, 'lost', 'straight up must predict flying away');
});

test('full playthrough: level 1 is winnable through the real game loop', () => {
  const g = createGame();
  const { solution } = playWithSolver(g, 0);
  assert.equal(g.screen, 'levelComplete');
  assert.ok(g.score > 0);
  assert.ok(g.lastResult);
  assert.ok(g.lastResult.stars >= 1 && g.lastResult.stars <= 3);
  assert.equal(g.unlocked, 2, 'beating level 1 unlocks level 2');
  assert.ok(g.best[0], 'best score recorded');
  assert.equal(g.best[0].score, g.score);
  assert.equal(g.totalStars, g.lastResult.stars);
  assert.ok(
    Math.abs(g.score - solution.score) < solution.score * 0.35,
    `live score ${g.score} should be near solver score ${solution.score}`,
  );
});

test('full playthrough: level 6 (Orbit Master) is winnable', () => {
  const g = createGame();
  playWithSolver(g, 5);
  assert.equal(g.screen, 'levelComplete');
  assert.ok(g.score > 0);
});

test('restart: startLevel again resets score and launches', () => {
  const g = createGame();
  playWithSolver(g, 0);
  const bestScore = g.best[0].score;
  startLevel(g, 0);
  assert.equal(g.score, 0);
  assert.equal(g.launchesLeft, LEVELS[0].launches);
  assert.equal(g.best[0].score, bestScore, 'best score survives a restart');
});

test('campaignScore sums best scores across levels', () => {
  const g = createGame();
  playWithSolver(g, 0);
  playWithSolver(g, 1);
  assert.equal(campaignScore(g), g.best[0].score + g.best[1].score);
  assert.equal(g.unlocked, 3);
});
