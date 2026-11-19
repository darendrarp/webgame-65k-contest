// physics.js — pure game physics for STARSLING. No DOM, no Node-only APIs:
// the same code runs in the browser game and in the Node test suite
// (including the automated solvability solver).

export const WORLD_W = 960;
export const WORLD_H = 540;
export const SHIP_R = 8;
export const SHARD_R = 13; // collect when dist < SHARD_R + SHIP_R
export const GATE_R = 28; // enter when dist < GATE_R + SHIP_R
export const MAX_FLIGHT_TIME = 25; // seconds per launch, then "lost in space"
export const OOB_MARGIN = 80; // how far past the world edge counts as lost
export const MAX_DRAG = 200; // px of slingshot pull for full power
export const MIN_SPEED = 200; // px/s at minimum pull
export const MAX_SPEED = 720; // px/s at full pull
export const SPEED_CAP = 1400; // px/s hard cap (prevents tunnelling)
export const ORBIT_RANGE = 4; // orbit tracking only within planet.r * this
export const FIXED_DT = 1 / 120; // physics substep used by the live game

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

export function wrapAngle(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

// Convert a slingshot drag (pointer minus pad, in world px) into a launch
// velocity. Pull back, release, fly the opposite way — classic slingshot.
export function launchVelocity(dragX, dragY) {
  const len = Math.hypot(dragX, dragY);
  if (len < 8) return null; // too short to be a deliberate launch
  const power = clamp(len / MAX_DRAG, 0, 1);
  const speed = MIN_SPEED + power * (MAX_SPEED - MIN_SPEED);
  return { vx: (-dragX / len) * speed, vy: (-dragY / len) * speed, power, speed };
}

// Launch velocity from an aim angle (radians, 0 = right) and power 0..1.
// Used by the solver and the trajectory preview.
export function launchVelocityFromAim(angle, power) {
  const p = clamp(power, 0, 1);
  const speed = MIN_SPEED + p * (MAX_SPEED - MIN_SPEED);
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, power: p, speed };
}

// Gravitational acceleration at (x, y) from all planets.
// Each planet carries its own mu (gravitational parameter); softening keeps
// the singularity at the centre from exploding the numbers.
export function gravityAccel(x, y, planets) {
  let ax = 0;
  let ay = 0;
  for (const p of planets) {
    const dx = p.x - x;
    const dy = p.y - y;
    const soft = 0.6 * p.r;
    const d2 = dx * dx + dy * dy + soft * soft;
    const d = Math.sqrt(d2);
    const a = p.mu / d2;
    ax += (a * dx) / d;
    ay += (a * dy) / d;
  }
  return { ax, ay };
}

// ---- Flight simulation -------------------------------------------------
// A flight is one launch: from the pad until crash / lost / gate / timeout.
// `collected` is a Set of shard indices already collected on earlier launches
// of this level; shards collected during this flight are added to
// sim.collectedThisFlight (the caller merges them into the level state).

export function createFlight(level, collected, vx, vy) {
  const n = level.planets.length;
  return {
    level,
    x: level.pad.x,
    y: level.pad.y,
    vx,
    vy,
    t: 0,
    status: 'flying', // flying | crashed | lost | gate | timeout
    // Snapshot copy: the caller (game.js) adds newly collected shards to its
    // own set live for HUD/rendering, without disturbing flight accounting.
    collected: new Set(collected),
    collectedThisFlight: [],
    orbitsThisFlight: [],
    anglePrev: level.planets.map((p) => Math.atan2(level.pad.y - p.y, level.pad.x - p.x)),
    angleAccum: new Array(n).fill(0),
    orbited: new Array(n).fill(false),
    asteroids: (level.asteroids || []).map((a) => ({ ...a })),
    minDist: Infinity, // closest approach to the current target (solver tiebreak)
    path: null, // filled only when recordPath is set
  };
}

function allCollected(sim) {
  return sim.collected.size + sim.collectedThisFlight.length >= sim.level.shards.length;
}

function nearestTargetDist(sim) {
  const lv = sim.level;
  let best = Infinity;
  for (let i = 0; i < lv.shards.length; i++) {
    if (sim.collected.has(i) || sim.collectedThisFlight.includes(i)) continue;
    best = Math.min(best, Math.hypot(lv.shards[i].x - sim.x, lv.shards[i].y - sim.y));
  }
  if (best === Infinity) best = Math.hypot(lv.gate.x - sim.x, lv.gate.y - sim.y);
  return best;
}

// Advance one physics step. Returns an event object only when something
// noteworthy happened this step (null otherwise, to keep the hot loop cheap).
// Events: { collected: [shardIdx...], orbit: planetIdx } — terminal state is
// visible on sim.status.
export function stepFlight(sim, dt) {
  if (sim.status !== 'flying') return null;
  const lv = sim.level;
  sim.t += dt;
  if (sim.t >= MAX_FLIGHT_TIME) {
    sim.status = 'timeout';
    return null;
  }

  // Move asteroids (linear drift, bounce off the world bounds).
  for (const a of sim.asteroids) {
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    if (a.x < a.r || a.x > WORLD_W - a.r) a.vx = -a.vx;
    if (a.y < a.r || a.y > WORLD_H - a.r) a.vy = -a.vy;
    a.x = clamp(a.x, a.r, WORLD_W - a.r);
    a.y = clamp(a.y, a.r, WORLD_H - a.r);
  }

  // Integrate the ship (semi-implicit Euler).
  const { ax, ay } = gravityAccel(sim.x, sim.y, lv.planets);
  sim.vx += ax * dt;
  sim.vy += ay * dt;
  const sp = Math.hypot(sim.vx, sim.vy);
  if (sp > SPEED_CAP) {
    sim.vx = (sim.vx / sp) * SPEED_CAP;
    sim.vy = (sim.vy / sp) * SPEED_CAP;
  }
  sim.x += sim.vx * dt;
  sim.y += sim.vy * dt;

  // Orbit tracking: accumulate the swept angle around each nearby planet.
  let orbitEvent = -1;
  for (let i = 0; i < lv.planets.length; i++) {
    const p = lv.planets[i];
    const dx = sim.x - p.x;
    const dy = sim.y - p.y;
    const d = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    const delta = wrapAngle(ang - sim.anglePrev[i]);
    sim.anglePrev[i] = ang;
    if (d < p.r * ORBIT_RANGE) {
      sim.angleAccum[i] += delta;
      if (Math.abs(sim.angleAccum[i]) >= 2 * Math.PI && !sim.orbited[i]) {
        sim.orbited[i] = true;
        sim.orbitsThisFlight.push(i);
        orbitEvent = i;
        sim.angleAccum[i] -= Math.sign(sim.angleAccum[i]) * 2 * Math.PI;
      }
    }
  }

  // Planet crash.
  for (const p of lv.planets) {
    if (Math.hypot(sim.x - p.x, sim.y - p.y) < p.r + SHIP_R - 2) {
      sim.status = 'crashed';
      return orbitEvent >= 0 ? { orbit: orbitEvent } : null;
    }
  }
  // Asteroid crash.
  for (const a of sim.asteroids) {
    if (Math.hypot(sim.x - a.x, sim.y - a.y) < a.r + SHIP_R - 2) {
      sim.status = 'crashed';
      return orbitEvent >= 0 ? { orbit: orbitEvent } : null;
    }
  }

  // Shard collection.
  let collectedEvent = null;
  for (let i = 0; i < lv.shards.length; i++) {
    if (sim.collected.has(i) || sim.collectedThisFlight.includes(i)) continue;
    const s = lv.shards[i];
    if (Math.hypot(sim.x - s.x, sim.y - s.y) < SHARD_R + SHIP_R) {
      sim.collectedThisFlight.push(i);
      (collectedEvent ??= []).push(i);
    }
  }

  // Gate: only open once every shard is collected.
  if (allCollected(sim) && Math.hypot(sim.x - lv.gate.x, sim.y - lv.gate.y) < GATE_R + SHIP_R) {
    sim.status = 'gate';
  } else if (
    sim.x < -OOB_MARGIN || sim.x > WORLD_W + OOB_MARGIN ||
    sim.y < -OOB_MARGIN || sim.y > WORLD_H + OOB_MARGIN
  ) {
    sim.status = 'lost';
  }

  const d = nearestTargetDist(sim);
  if (d < sim.minDist) sim.minDist = d;
  if (sim.path) sim.path.push({ x: sim.x, y: sim.y });

  if (collectedEvent || orbitEvent >= 0) {
    return { collected: collectedEvent, orbit: orbitEvent >= 0 ? orbitEvent : undefined };
  }
  return null;
}

// Batch-simulate one launch. Used by the solver and the aim preview.
// opts: { dt, recordPath, maxTime }
export function simulateLaunch(level, collected, angle, power, opts = {}) {
  const dt = opts.dt || 1 / 60;
  const { vx, vy } = launchVelocityFromAim(angle, power);
  const sim = createFlight(level, collected, vx, vy);
  if (opts.recordPath) sim.path = [{ x: sim.x, y: sim.y }];
  const maxTime = opts.maxTime || MAX_FLIGHT_TIME;
  let steps = 0;
  while (sim.status === 'flying' && sim.t < maxTime) {
    stepFlight(sim, dt);
    steps++;
  }
  return {
    status: sim.status,
    collected: [...sim.collectedThisFlight],
    orbits: [...sim.orbitsThisFlight],
    time: sim.t,
    steps,
    minDist: sim.minDist,
    path: sim.path,
    endX: sim.x,
    endY: sim.y,
  };
}

// Greedy automated playtest: try to beat a level by picking, for each launch,
// the aim that collects the most remaining shards (gate when all are taken).
// Returns { won, launchesUsed, score, log } — score uses the same rules as
// scoring.js so the thresholds in levels.js can be sanity-checked against it.
export function solveLevel(level, scoring, opts = {}) {
  const angleStep = opts.angleStep || 6; // degrees
  const powers = opts.powers || [0.35, 0.55, 0.75, 0.95];
  const dt = opts.dt || 1 / 60;
  const collected = new Set();
  let score = 0;
  let launchesUsed = 0;
  let levelTime = 0;
  const log = [];
  while (launchesUsed < level.launches) {
    const valueOf = (r) => {
      const gateBonus = r.status === 'gate' ? 100000 : 0;
      return r.collected.length * 1000 + r.orbits.length * 250 + gateBonus - r.minDist / 10;
    };
    // Coarse grid, keeping the top few distinct candidates (a single best
    // can be a local optimum — e.g. a 1-shard launch next to a 2-shard arc).
    const candidates = [];
    for (let deg = 0; deg < 360; deg += angleStep) {
      for (const power of powers) {
        const r = simulateLaunch(level, collected, (deg * Math.PI) / 180, power, { dt });
        candidates.push({ deg, power, value: valueOf(r), ...r });
      }
    }
    candidates.sort((a, b) => b.value - a.value);
    const seeds = [];
    for (const c of candidates) {
      const dup = seeds.some(
        (s) => Math.abs(((c.deg - s.deg + 540) % 360) - 180) < 12 && Math.abs(c.power - s.power) < 0.15,
      );
      if (!dup) seeds.push(c);
      if (seeds.length >= 5) break;
    }
    // Refine each seed the way a human would nudge their aim with the
    // trajectory preview. Two rounds, shrinking steps.
    let best = candidates[0];
    let bestValue = best.value;
    const consider = (deg, power) => {
      const r = simulateLaunch(level, collected, (deg * Math.PI) / 180, power, { dt });
      const value = valueOf(r);
      if (value > bestValue) {
        bestValue = value;
        best = { deg, power, value, ...r };
      }
    };
    for (const seed of seeds) {
      for (let round = 0; round < 2; round++) {
        const degStep = round === 0 ? 1.5 : 0.5;
        const degSpan = round === 0 ? 6 : 1.5;
        const powStep = round === 0 ? 0.04 : 0.015;
        const powSpan = round === 0 ? 0.12 : 0.04;
        const baseDeg = seed.deg;
        const basePow = seed.power;
        for (let d = -degSpan; d <= degSpan + 1e-9; d += degStep) {
          for (let p = -powSpan; p <= powSpan + 1e-9; p += powStep) {
            const power = clamp(basePow + p, 0.05, 1);
            const deg = ((baseDeg + d) % 360 + 360) % 360;
            consider(deg, power);
          }
        }
      }
    }
    launchesUsed++;
    levelTime += best.time;
    // Score this launch the same way the live game does (combo within a
    // flight: shards collected close together chain; the solver does not
    // know exact collect times, so it credits a flat x2 for multi-collects).
    const n = best.collected.length;
    const comboScore = n === 0 ? 0 : n === 1 ? 100 : 100 * (1 + 2 * (n - 1));
    score += comboScore + best.orbits.length * scoring.ORBIT_BONUS;
    for (const i of best.collected) collected.add(i);
    log.push({
      launch: launchesUsed,
      deg: best.deg,
      power: best.power,
      status: best.status,
      collected: best.collected,
      orbits: best.orbits,
      score,
    });
    if (best.status === 'gate') {
      const launchesLeft = level.launches - launchesUsed;
      score += scoring.levelCompleteBonus(launchesLeft, levelTime);
      return { won: true, launchesUsed, launchesLeft, score, levelTime, log };
    }
    if (best.collected.length === 0 && best.status !== 'gate') {
      // No progress on this launch; keep trying (later launches may still
      // work from the same pad), but note it in the log.
    }
  }
  return { won: false, launchesUsed, launchesLeft: 0, score, levelTime, log };
}
