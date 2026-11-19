// levels.js — the 12 hand-designed levels of STARSLING.
// Coordinates live in the 960 x 540 world (see physics.js).
// Planet `mu` is the gravitational parameter: bigger = stronger pull.
// `star2`/`star3` are score thresholds; they were set from the automated
// greedy solver's scores (see tests/solvability.test.js) so that 2 stars is
// a solid run and 3 stars rewards skillful play (combos + orbit bonuses).
// `launches` is the per-level launch budget.

export const LEVELS = [
  {
    name: 'First Light',
    tip: 'Drag back from the pad and release to launch. Collect every shard, then fly into the gate.',
    launches: 3,
    pad: { x: 90, y: 270 },
    gate: { x: 870, y: 270 },
    planets: [{ x: 480, y: 330, r: 34, mu: 1400000, hue: 210 }],
    shards: [{ x: 300, y: 180 }, { x: 660, y: 360 }],
    asteroids: [],
    star2: 750, star3: 1050,
  },
  {
    name: 'Curveball',
    tip: 'Gravity bends your flight. Aim wide and let the planet curve you onto the shards.',
    launches: 4,
    pad: { x: 90, y: 450 },
    gate: { x: 870, y: 90 },
    planets: [{ x: 480, y: 270, r: 40, mu: 2600000, hue: 280 }],
    shards: [{ x: 350, y: 150 }, { x: 620, y: 380 }, { x: 480, y: 90 }],
    asteroids: [],
    star2: 1000, star3: 1400,
  },
  {
    name: 'Twin Suns',
    tip: 'Two gravity wells. Thread the gap between them.',
    launches: 4,
    pad: { x: 90, y: 270 },
    gate: { x: 870, y: 270 },
    planets: [
      { x: 330, y: 180, r: 32, mu: 2000000, hue: 30 },
      { x: 630, y: 360, r: 32, mu: 2000000, hue: 160 },
    ],
    shards: [{ x: 330, y: 360 }, { x: 630, y: 180 }, { x: 480, y: 270 }],
    asteroids: [],
    star2: 800, star3: 1150,
  },
  {
    name: 'The Slingshot',
    tip: 'Skim the big planet to slingshot across the map — speed is free if you dare.',
    launches: 4,
    pad: { x: 90, y: 90 },
    gate: { x: 870, y: 450 },
    planets: [{ x: 480, y: 270, r: 48, mu: 3500000, hue: 0 }],
    shards: [{ x: 250, y: 400 }, { x: 700, y: 140 }, { x: 800, y: 270 }],
    asteroids: [],
    star2: 800, star3: 1150,
  },
  {
    name: 'Asteroid Belt',
    tip: 'Asteroids drift and bounce. Time your launch between them.',
    launches: 4,
    pad: { x: 90, y: 270 },
    gate: { x: 870, y: 270 },
    planets: [{ x: 480, y: 150, r: 30, mu: 1800000, hue: 210 }],
    shards: [{ x: 300, y: 400 }, { x: 480, y: 400 }, { x: 660, y: 400 }],
    asteroids: [
      { x: 350, y: 270, r: 13, vx: 0, vy: 55 },
      { x: 620, y: 270, r: 13, vx: 0, vy: -55 },
    ],
    star2: 800, star3: 1150,
  },
  {
    name: 'Orbit Master',
    tip: 'Loop a full circle around a planet for a +250 PERFECT ORBIT bonus.',
    launches: 5,
    pad: { x: 90, y: 270 },
    gate: { x: 870, y: 270 },
    planets: [{ x: 480, y: 270, r: 38, mu: 2600000, hue: 280 }],
    shards: [
      { x: 480, y: 150 }, { x: 580, y: 270 }, { x: 480, y: 390 }, { x: 380, y: 270 },
    ],
    asteroids: [],
    star2: 900, star3: 1250,
  },
  {
    name: 'Gauntlet',
    tip: 'Three wells, four shards. Chain quick collects to build your combo multiplier.',
    launches: 5,
    pad: { x: 90, y: 90 },
    gate: { x: 870, y: 450 },
    planets: [
      { x: 300, y: 200, r: 30, mu: 1900000, hue: 210 },
      { x: 480, y: 360, r: 30, mu: 1900000, hue: 160 },
      { x: 660, y: 180, r: 30, mu: 1900000, hue: 30 },
    ],
    shards: [{ x: 250, y: 380 }, { x: 480, y: 120 }, { x: 700, y: 380 }, { x: 850, y: 150 }],
    asteroids: [],
    star2: 1200, star3: 1650,
  },
  {
    name: 'Crossfire',
    tip: 'Drifting rocks between twin wells. Patience beats power.',
    launches: 5,
    pad: { x: 90, y: 450 },
    gate: { x: 870, y: 90 },
    planets: [
      { x: 350, y: 270, r: 34, mu: 2200000, hue: 0 },
      { x: 650, y: 270, r: 34, mu: 2200000, hue: 210 },
    ],
    shards: [{ x: 200, y: 150 }, { x: 480, y: 90 }, { x: 480, y: 450 }, { x: 760, y: 380 }],
    asteroids: [
      { x: 480, y: 200, r: 12, vx: 60, vy: 0 },
      { x: 480, y: 340, r: 12, vx: -60, vy: 0 },
    ],
    star2: 1050, star3: 1500,
  },
  {
    name: 'The Long Way',
    tip: 'A long flight across three wells. Conserve launches — you only get four.',
    launches: 5,
    pad: { x: 60, y: 270 },
    gate: { x: 900, y: 270 },
    planets: [
      { x: 300, y: 120, r: 28, mu: 1700000, hue: 280 },
      { x: 480, y: 420, r: 28, mu: 1700000, hue: 160 },
      { x: 660, y: 120, r: 28, mu: 1700000, hue: 30 },
    ],
    shards: [{ x: 300, y: 420 }, { x: 480, y: 270 }, { x: 660, y: 420 }, { x: 850, y: 400 }],
    asteroids: [],
    star2: 900, star3: 1250,
  },
  {
    name: 'Nebula Maze',
    tip: 'Four wells bend every line. Use the aim preview — the dotted path never lies.',
    launches: 6,
    pad: { x: 90, y: 90 },
    gate: { x: 870, y: 450 },
    planets: [
      { x: 280, y: 180, r: 28, mu: 1700000, hue: 210 },
      { x: 500, y: 90, r: 26, mu: 1500000, hue: 0 },
      { x: 480, y: 360, r: 30, mu: 1900000, hue: 280 },
      { x: 700, y: 240, r: 28, mu: 1700000, hue: 160 },
    ],
    shards: [
      { x: 200, y: 400 }, { x: 350, y: 300 }, { x: 600, y: 120 }, { x: 750, y: 400 }, { x: 850, y: 200 },
    ],
    asteroids: [],
    star2: 1050, star3: 1500,
  },
  {
    name: 'Event Horizon',
    tip: 'One giant well. Its pull is huge — orbit it, don’t fight it.',
    launches: 6,
    pad: { x: 90, y: 270 },
    gate: { x: 870, y: 270 },
    planets: [{ x: 480, y: 270, r: 58, mu: 5000000, hue: 0 }],
    shards: [
      { x: 480, y: 120 }, { x: 620, y: 200 }, { x: 620, y: 340 }, { x: 480, y: 420 }, { x: 340, y: 270 },
    ],
    asteroids: [],
    star2: 950, star3: 1350,
  },
  {
    name: 'Grand Tour',
    tip: 'Everything at once. Five launches, six shards, one last gate. Good luck, pilot.',
    launches: 7,
    pad: { x: 90, y: 450 },
    gate: { x: 870, y: 90 },
    planets: [
      { x: 280, y: 180, r: 32, mu: 2000000, hue: 210 },
      { x: 480, y: 300, r: 36, mu: 2400000, hue: 280 },
      { x: 680, y: 160, r: 30, mu: 1900000, hue: 30 },
    ],
    shards: [
      { x: 200, y: 120 }, { x: 380, y: 420 }, { x: 480, y: 90 },
      { x: 620, y: 400 }, { x: 780, y: 300 }, { x: 850, y: 250 },
    ],
    asteroids: [
      { x: 400, y: 270, r: 13, vx: 0, vy: 50 },
      { x: 580, y: 270, r: 13, vx: 0, vy: -50 },
    ],
    star2: 1600, star3: 2250,
  },
];

// Structural validation of a level definition (used by the tests).
// Returns an array of problem strings; empty means valid.
export function validateLevel(level, index) {
  const problems = [];
  const { WORLD_W, WORLD_H } = { WORLD_W: 960, WORLD_H: 540 };
  const inWorld = (o, label) => {
    if (o.x < 0 || o.x > WORLD_W || o.y < 0 || o.y > WORLD_H) {
      problems.push(`L${index + 1} ${label} out of world bounds`);
    }
  };
  if (!level.name) problems.push(`L${index + 1} missing name`);
  if (!Number.isInteger(level.launches) || level.launches < 1) {
    problems.push(`L${index + 1} launches must be a positive integer`);
  }
  if (!(level.star2 > 0 && level.star3 > level.star2)) {
    problems.push(`L${index + 1} star thresholds must satisfy 0 < star2 < star3`);
  }
  inWorld(level.pad, 'pad');
  inWorld(level.gate, 'gate');
  for (const p of level.planets) {
    inWorld(p, 'planet');
    if (p.r < 10 || p.mu <= 0) problems.push(`L${index + 1} planet has bad r/mu`);
    // Pad / gate must not sit inside a planet.
    if (Math.hypot(p.x - level.pad.x, p.y - level.pad.y) < p.r + 30) {
      problems.push(`L${index + 1} pad too close to a planet`);
    }
    if (Math.hypot(p.x - level.gate.x, p.y - level.gate.y) < p.r + 30) {
      problems.push(`L${index + 1} gate too close to a planet`);
    }
  }
  // Planets must not overlap each other.
  for (let i = 0; i < level.planets.length; i++) {
    for (let j = i + 1; j < level.planets.length; j++) {
      const a = level.planets[i];
      const b = level.planets[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + 20) {
        problems.push(`L${index + 1} planets ${i} and ${j} overlap`);
      }
    }
  }
  if (!level.shards.length) problems.push(`L${index + 1} needs at least one shard`);
  for (const s of level.shards) {
    inWorld(s, 'shard');
    for (const p of level.planets) {
      if (Math.hypot(p.x - s.x, p.y - s.y) < p.r + 25) {
        problems.push(`L${index + 1} shard inside/near a planet`);
      }
    }
  }
  for (const a of level.asteroids || []) {
    inWorld(a, 'asteroid');
    if (a.vx === 0 && a.vy === 0) problems.push(`L${index + 1} asteroid has no velocity`);
  }
  return problems;
}
