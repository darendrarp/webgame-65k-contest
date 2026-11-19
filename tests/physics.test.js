import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FIXED_DT, MAX_SPEED, MIN_SPEED, SHIP_R, SPEED_CAP,
  createFlight, gravityAccel, launchVelocity, launchVelocityFromAim,
  simulateLaunch, stepFlight,
} from '../game/js/physics.js';

const emptyLevel = {
  pad: { x: 100, y: 270 }, gate: { x: 860, y: 270 },
  planets: [], shards: [], asteroids: [],
};

test('launchVelocity: tiny drag is not a launch', () => {
  assert.equal(launchVelocity(3, 4), null);
});

test('launchVelocity: slingshot flies opposite the drag, speed clamped', () => {
  const v = launchVelocity(100, 0); // drag right -> fly left
  assert.ok(v.vx < 0 && Math.abs(v.vy) < 1e-9);
  assert.ok(v.speed >= MIN_SPEED && v.speed <= MAX_SPEED);
  const full = launchVelocity(0, 500); // drag down hard -> fly straight up
  assert.equal(full.speed, MAX_SPEED);
  assert.ok(full.vy < 0);
});

test('launchVelocityFromAim: angle 0 flies right, power clamps', () => {
  const v = launchVelocityFromAim(0, 1);
  assert.equal(v.vx, MAX_SPEED);
  assert.ok(Math.abs(v.vy) < 1e-9);
  const over = launchVelocityFromAim(Math.PI / 2, 5);
  assert.equal(over.speed, MAX_SPEED);
  const under = launchVelocityFromAim(0, -2);
  assert.equal(under.speed, MIN_SPEED);
});

test('gravityAccel: no planets means no gravity', () => {
  assert.deepEqual(gravityAccel(100, 100, []), { ax: 0, ay: 0 });
});

test('gravityAccel: pulls toward the planet, stronger when closer', () => {
  const planets = [{ x: 500, y: 270, r: 30, mu: 2000000 }];
  const far = gravityAccel(100, 270, planets);
  const near = gravityAccel(400, 270, planets);
  assert.ok(far.ax > 0 && Math.abs(far.ay) < 1e-9, 'pulls right toward planet');
  assert.ok(near.ax > far.ax, 'stronger up close');
});

test('stepFlight: no gravity means a straight line at constant speed', () => {
  const sim = createFlight(emptyLevel, new Set(), 300, 0);
  for (let i = 0; i < 120; i++) stepFlight(sim, FIXED_DT);
  assert.equal(sim.status, 'flying');
  assert.ok(Math.abs(sim.x - (100 + 300)) < 1, `x=${sim.x}`);
  assert.ok(Math.abs(sim.y - 270) < 1e-6);
  assert.ok(Math.abs(sim.vx - 300) < 1e-6);
});

test('stepFlight: speed is capped', () => {
  const sim = createFlight(emptyLevel, new Set(), 5000, 0);
  stepFlight(sim, FIXED_DT);
  assert.ok(Math.hypot(sim.vx, sim.vy) <= SPEED_CAP + 1e-6);
});

test('stepFlight: flying into a planet crashes', () => {
  const level = {
    pad: { x: 100, y: 270 }, gate: { x: 860, y: 270 },
    planets: [{ x: 480, y: 270, r: 34, mu: 2000000 }], shards: [], asteroids: [],
  };
  const r = simulateLaunch(level, new Set(), 0, 1);
  assert.equal(r.status, 'crashed');
});

test('stepFlight: flying off the edge is lost', () => {
  const r = simulateLaunch(emptyLevel, new Set(), Math.PI, 1);
  assert.equal(r.status, 'lost');
});

test('stepFlight: flight times out', () => {
  const sim = createFlight(emptyLevel, new Set(), 0, 0);
  sim.t = 24.9;
  stepFlight(sim, 0.2);
  assert.equal(sim.status, 'timeout');
});

test('stepFlight: shard collection and locked/unlocked gate', () => {
  const level = {
    pad: { x: 100, y: 270 }, gate: { x: 860, y: 270 },
    planets: [],
    shards: [{ x: 400, y: 270 }, { x: 600, y: 270 }],
    asteroids: [],
  };
  // Straight shot collects both shards and reaches the gate.
  const r = simulateLaunch(level, new Set(), 0, 1);
  assert.deepEqual(r.collected, [0, 1]);
  assert.equal(r.status, 'gate');

  // Gate alone (shards skipped) does not end the flight: aim above the
  // shards so the ship passes the gate while shards remain.
  const level2 = {
    pad: { x: 100, y: 270 }, gate: { x: 500, y: 270 },
    planets: [],
    shards: [{ x: 400, y: 100 }],
    asteroids: [],
  };
  const r2 = simulateLaunch(level2, new Set(), 0, 1);
  assert.notEqual(r2.status, 'gate', 'gate must stay locked until all shards are taken');
});

test('stepFlight: asteroid collision crashes', () => {
  const level = {
    pad: { x: 100, y: 270 }, gate: { x: 860, y: 270 },
    planets: [], shards: [],
    // Asteroid starts 26px above the flight line and drifts down at 40px/s,
    // so it meets the ship (460px/s, 0.65s to x=400) right on the line.
    asteroids: [{ x: 400, y: 244, r: 14, vx: 0, vy: 40 }],
  };
  const r = simulateLaunch(level, new Set(), 0, 0.5);
  assert.equal(r.status, 'crashed');
});

test('stepFlight: asteroids bounce off the world bounds', () => {
  const level = {
    pad: { x: 100, y: 270 }, gate: { x: 860, y: 270 },
    planets: [], shards: [],
    asteroids: [{ x: 950, y: 270, r: 10, vx: 100, vy: 0 }],
  };
  const sim = createFlight(level, new Set(), 0, 0);
  stepFlight(sim, 0.5);
  assert.ok(sim.asteroids[0].vx < 0, 'vx flips after hitting the right wall');
  assert.ok(sim.asteroids[0].x <= 950);
});

test('orbit bonus: a full loop around a planet is detected', () => {
  const mu = 2000000;
  const d = 100;
  const vOrbit = Math.sqrt(mu / d); // circular-orbit speed at distance d
  const level = {
    pad: { x: 480, y: 170 }, gate: { x: 860, y: 270 },
    planets: [{ x: 480, y: 270, r: 30, mu }], shards: [], asteroids: [],
  };
  const sim = createFlight(level, new Set(), vOrbit, 0);
  let orbitSeen = false;
  for (let i = 0; i < 120 * 6; i++) {
    const ev = stepFlight(sim, FIXED_DT);
    if (ev && ev.orbit !== undefined) orbitSeen = true;
    if (sim.status !== 'flying') break;
  }
  assert.ok(orbitSeen, 'a circular orbit should trigger the orbit bonus');
  assert.equal(sim.status, 'flying', 'the orbiting ship must not crash');
});

test('simulateLaunch is deterministic', () => {
  const level = {
    pad: { x: 100, y: 270 }, gate: { x: 860, y: 270 },
    planets: [{ x: 480, y: 270, r: 34, mu: 2000000 }],
    shards: [{ x: 300, y: 180 }], asteroids: [],
  };
  const a = simulateLaunch(level, new Set(), 0.3, 0.8);
  const b = simulateLaunch(level, new Set(), 0.3, 0.8);
  assert.deepEqual(a, b);
});

test('ship radius is smaller than the smallest planet (no tunnelling)', () => {
  assert.ok(SHIP_R < 26);
});
