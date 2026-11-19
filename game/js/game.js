// game.js — STARSLING state machine. Pure logic (no DOM): the browser UI
// (main.js) calls these functions and renders the returned state; the tests
// drive the same functions headlessly.
//
// Screens: menu | playing (aiming or flying) | levelComplete | gameOver |
// victory. `paused` is an orthogonal flag handled by the UI layer.

import { LEVELS } from './levels.js';
import {
  FIXED_DT, createFlight, launchVelocityFromAim, simulateLaunch, stepFlight,
} from './physics.js';
import {
  COMBO_WINDOW, ORBIT_BONUS, comboAfter, levelCompleteBonus, shardPoints, starsFor,
} from './scoring.js';

export function createGame() {
  return {
    screen: 'menu',
    levelIndex: 0,
    // Per-level run state (reset by startLevel):
    score: 0, // score earned on the current level
    launchesLeft: 0,
    collected: new Set(),
    flight: null, // active flight sim, or null while aiming
    combo: 0,
    lastCollectT: null, // flight time of the last collect in this flight
    levelTime: 0, // total flight seconds on this level
    aiming: false,
    // Campaign state (persisted by the UI layer in localStorage):
    unlocked: 1, // number of levels unlocked (1-based count)
    best: {}, // levelIndex -> { score, stars }
    totalStars: 0,
    // Last level result, for the level-complete screen:
    lastResult: null,
  };
}

export function currentLevel(game) {
  return LEVELS[game.levelIndex];
}

export function startLevel(game, index) {
  game.levelIndex = index;
  game.screen = 'playing';
  game.score = 0;
  game.launchesLeft = LEVELS[index].launches;
  game.collected = new Set();
  game.flight = null;
  game.combo = 0;
  game.lastCollectT = null;
  game.levelTime = 0;
  game.aiming = false;
  game.lastResult = null;
  return game;
}

// Begin a launch. Returns false if a launch is not possible right now
// (already flying, or out of launches).
export function launch(game, angle, power) {
  if (game.screen !== 'playing' || game.flight || game.launchesLeft <= 0) return false;
  const level = currentLevel(game);
  const { vx, vy } = launchVelocityFromAim(angle, power);
  game.flight = createFlight(level, game.collected, vx, vy);
  game.launchesLeft -= 1;
  game.combo = 0;
  game.lastCollectT = null;
  game.aiming = false;
  return true;
}

// Aim preview: dotted path for the given aim, using the real physics.
// Returns up to `maxPoints` sampled points plus the predicted outcome.
export function aimPreview(game, angle, power, maxPoints = 90) {
  const level = currentLevel(game);
  const r = simulateLaunch(level, game.collected, angle, power, {
    dt: 1 / 60, recordPath: true, maxTime: 12,
  });
  const raw = r.path || [];
  const step = Math.max(1, Math.floor(raw.length / maxPoints));
  const points = [];
  for (let i = 0; i < raw.length; i += step) points.push(raw[i]);
  return { points, status: r.status, wouldCollect: r.collected.length };
}

// Advance the game by dt seconds (called every animation frame by the UI).
// Returns a list of events for sound effects / floating text:
//   { type: 'collect', shard, combo, points }
//   { type: 'orbit', planet, points }
//   { type: 'crash' } | { type: 'lost' } | { type: 'timeout' }
//   { type: 'levelComplete', result } | { type: 'gameOver' }
export function update(game, dt) {
  const events = [];
  if (game.screen !== 'playing' || !game.flight) return events;
  const level = currentLevel(game);

  // Fixed-timestep substeps for stable physics at any frame rate.
  let remaining = dt;
  while (remaining > 0) {
    const step = Math.min(FIXED_DT, remaining);
    remaining -= step;
    const ev = stepFlight(game.flight, step);
    game.levelTime += step;
    if (ev) {
      if (ev.collected) {
        for (const idx of ev.collected) {
          const dtSince = game.lastCollectT === null ? null : game.flight.t - game.lastCollectT;
          game.combo = comboAfter(dtSince, game.combo);
          game.lastCollectT = game.flight.t;
          const points = shardPoints(game.combo);
          game.score += points;
          // Merge immediately (not only at flight end) so the HUD, the
          // renderer and the gate-open indicator update live mid-flight.
          game.collected.add(idx);
          events.push({ type: 'collect', shard: idx, combo: game.combo, points });
        }
      }
      if (ev.orbit !== undefined) {
        game.score += ORBIT_BONUS;
        events.push({ type: 'orbit', planet: ev.orbit, points: ORBIT_BONUS });
      }
    }
    if (game.flight.status !== 'flying') break;
  }

  const flight = game.flight;
  if (flight.status === 'flying') return events;

  // Flight ended: merge collected shards, then resolve the outcome.
  for (const idx of flight.collectedThisFlight) game.collected.add(idx);
  game.flight = null;

  if (flight.status === 'gate') {
    const bonus = levelCompleteBonus(game.launchesLeft, game.levelTime);
    game.score += bonus;
    const stars = starsFor(game.score, level);
    const prev = game.best[game.levelIndex];
    const isRecord = !prev || game.score > prev.score;
    if (isRecord) game.best[game.levelIndex] = { score: game.score, stars };
    game.totalStars = Object.values(game.best).reduce((s, b) => s + b.stars, 0);
    if (game.levelIndex + 1 >= game.unlocked && game.levelIndex + 1 < LEVELS.length) {
      game.unlocked = game.levelIndex + 2;
    }
    const isFinalLevel = game.levelIndex === LEVELS.length - 1;
    game.lastResult = {
      score: game.score, bonus, stars, isRecord,
      launchesLeft: game.launchesLeft, levelTime: game.levelTime,
    };
    game.screen = isFinalLevel ? 'victory' : 'levelComplete';
    events.push({ type: 'levelComplete', result: game.lastResult });
    return events;
  }

  events.push({ type: flight.status }); // crash | lost | timeout
  if (game.launchesLeft <= 0) {
    game.screen = 'gameOver';
    events.push({ type: 'gameOver' });
  }
  return events;
}

// Convenience for the UI: total best score across all levels.
export function campaignScore(game) {
  return Object.values(game.best).reduce((s, b) => s + b.score, 0);
}

export { COMBO_WINDOW, LEVELS };
