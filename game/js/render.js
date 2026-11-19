// render.js — canvas rendering for STARSLING. All visuals are procedural
// (gradients, seeded starfields, geometric shapes): no image assets, no
// copyrighted material. The renderer owns particles, floating texts and the
// ship trail; the game state itself lives in game.js.

import { GATE_R, SHARD_R, SHIP_R, WORLD_H, WORLD_W } from './physics.js';

// Deterministic PRNG so the starfield and craters look the same every load.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STARS = (() => {
  const rnd = mulberry32(1337);
  return Array.from({ length: 170 }, () => ({
    x: rnd() * WORLD_W,
    y: rnd() * WORLD_H,
    r: 0.4 + rnd() * 1.4,
    tw: rnd() * Math.PI * 2,
    sp: 0.5 + rnd() * 1.5,
  }));
})();

const NEBULAE = (() => {
  const rnd = mulberry32(4242);
  return Array.from({ length: 5 }, () => ({
    x: rnd() * WORLD_W,
    y: rnd() * WORLD_H,
    r: 120 + rnd() * 160,
    hue: [210, 280, 320, 190, 260][Math.floor(rnd() * 5)],
  }));
})();

function planetCraters(planet, index) {
  const rnd = mulberry32(9000 + index * 77);
  return Array.from({ length: 7 }, () => {
    const a = rnd() * Math.PI * 2;
    const d = rnd() * planet.r * 0.55;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d, r: 2 + rnd() * planet.r * 0.16 };
  });
}

function drawStarShape(ctx, x, y, r, rot) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = rot + (i * Math.PI) / 4;
    const rad = i % 2 === 0 ? r : r * 0.42;
    const px = x + Math.cos(ang) * rad;
    const py = y + Math.sin(ang) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.texts = [];
    this.trail = [];
    this.craters = new Map();
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = WORLD_W * dpr;
    this.canvas.height = WORLD_H * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  burst(x, y, color, n = 24, speed = 220) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.7);
      this.particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: 0.5 + Math.random() * 0.5, age: 0, r: 1.5 + Math.random() * 2.5, color,
      });
    }
  }

  floatText(x, y, text, color = '#ffe66d') {
    this.texts.push({ x, y, text, color, age: 0, life: 1.2 });
  }

  resetTrail() {
    this.trail = [];
  }

  render(view) {
    const { ctx } = this;
    const { game, level, aim, time, dt } = view;
    const W = WORLD_W;
    const H = WORLD_H;

    // Background.
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#070b1e');
    bg.addColorStop(0.55, '#0b1030');
    bg.addColorStop(1, '#120a26');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    for (const n of NEBULAE) {
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      g.addColorStop(0, `hsla(${n.hue}, 70%, 45%, 0.10)`);
      g.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(n.x - n.r, n.y - n.r, n.r * 2, n.r * 2);
    }

    for (const s of STARS) {
      const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * s.sp + s.tw));
      ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.9})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gravity wells: faint ring showing each planet's pull.
    level.planets.forEach((p, i) => {
      ctx.strokeStyle = `hsla(${p.hue}, 80%, 65%, 0.13)`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 2.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Planets.
    level.planets.forEach((p, i) => {
      const g = ctx.createRadialGradient(p.x - p.r * 0.35, p.y - p.r * 0.4, p.r * 0.1, p.x, p.y, p.r);
      g.addColorStop(0, `hsl(${p.hue}, 70%, 62%)`);
      g.addColorStop(0.6, `hsl(${p.hue}, 60%, 38%)`);
      g.addColorStop(1, `hsl(${p.hue}, 70%, 20%)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `hsla(${p.hue}, 80%, 70%, 0.5)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (!this.craters.has(i)) this.craters.set(i, planetCraters(p, i));
      ctx.fillStyle = `hsla(${p.hue}, 60%, 15%, 0.55)`;
      for (const c of this.craters.get(i)) {
        ctx.beginPath();
        ctx.arc(p.x + c.x, p.y + c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Asteroids.
    const asteroids = (game.flight ? game.flight.asteroids : level.asteroids) || [];
    for (const a of asteroids) {
      ctx.fillStyle = '#8a7f70';
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const ang = (k / 8) * Math.PI * 2 + a.x * 0.01;
        const rad = a.r * (0.85 + 0.15 * Math.sin(k * 2.7 + a.y));
        const px = a.x + Math.cos(ang) * rad;
        const py = a.y + Math.sin(ang) * rad;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 200, 150, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Shards.
    level.shards.forEach((s, i) => {
      if (game.collected.has(i)) return;
      const pulse = 1 + 0.15 * Math.sin(time * 3 + i);
      const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, SHARD_R * 2.4);
      glow.addColorStop(0, 'rgba(255, 230, 109, 0.5)');
      glow.addColorStop(1, 'rgba(255, 230, 109, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(s.x, s.y, SHARD_R * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe66d';
      drawStarShape(ctx, s.x, s.y, SHARD_R * pulse, time * 1.5 + i);
      ctx.fill();
      ctx.fillStyle = '#fff8d6';
      drawStarShape(ctx, s.x, s.y, SHARD_R * 0.45 * pulse, time * 1.5 + i);
      ctx.fill();
    });

    // Gate (locked until all shards are collected).
    const open = game.collected.size >= level.shards.length;
    const gx = level.gate.x;
    const gy = level.gate.y;
    ctx.save();
    ctx.translate(gx, gy);
    const gateColor = open ? '#4dffc3' : '#8892a8';
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, GATE_R * 2);
    glow.addColorStop(0, open ? 'rgba(77, 255, 195, 0.35)' : 'rgba(136, 146, 168, 0.18)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, GATE_R * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = gateColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, GATE_R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const a0 = time * (open ? 1.6 : 0.4) + (k * Math.PI * 2) / 3;
      ctx.beginPath();
      ctx.arc(0, 0, GATE_R * 0.62, a0, a0 + Math.PI * 0.7);
      ctx.stroke();
    }
    if (!open) {
      ctx.fillStyle = '#8892a8';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${level.shards.length - game.collected.size}✦`, 0, 1);
    }
    ctx.restore();

    // Launch pad.
    ctx.fillStyle = '#2a3355';
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(level.pad.x, level.pad.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.arc(level.pad.x, level.pad.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Aim: slingshot line + predicted dotted path + power ring.
    if (aim && aim.active) {
      const { pointer, points, power } = aim;
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(level.pad.x, level.pad.y);
      ctx.lineTo(pointer.x, pointer.y);
      ctx.stroke();
      ctx.setLineDash([]);
      const hue = 140 - power * 140; // green -> red as power grows
      ctx.strokeStyle = `hsl(${hue}, 90%, 60%)`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(level.pad.x, level.pad.y, 24, -Math.PI / 2, -Math.PI / 2 + power * Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < points.length; i += 2) {
        const p = points[i];
        const a = 0.85 * (1 - i / points.length);
        ctx.fillStyle = `rgba(255, 255, 255, ${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, i === 0 ? 3 : 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Ship (at the pad while aiming, in flight otherwise) + trail.
    const ship = game.flight
      ? { x: game.flight.x, y: game.flight.y, vx: game.flight.vx, vy: game.flight.vy }
      : { x: level.pad.x, y: level.pad.y, vx: 0, vy: -1 };
    if (game.flight) {
      this.trail.push({ x: ship.x, y: ship.y });
      if (this.trail.length > 26) this.trail.shift();
    }
    for (let i = 0; i < this.trail.length; i++) {
      const t = this.trail[i];
      const a = (i / this.trail.length) * 0.5;
      ctx.fillStyle = `rgba(125, 211, 252, ${a})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 1 + (i / this.trail.length) * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    const heading = Math.atan2(ship.vy, ship.vx);
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(heading);
    if (game.flight) {
      const flame = 10 + Math.random() * 8;
      const fg = ctx.createLinearGradient(-SHIP_R, 0, -SHIP_R - flame, 0);
      fg.addColorStop(0, 'rgba(255, 200, 80, 0.9)');
      fg.addColorStop(1, 'rgba(255, 80, 40, 0)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(-SHIP_R + 2, -4);
      ctx.lineTo(-SHIP_R - flame, 0);
      ctx.lineTo(-SHIP_R + 2, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#e8f6ff';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(SHIP_R + 5, 0);
    ctx.lineTo(-SHIP_R, -7);
    ctx.lineTo(-SHIP_R + 4, 0);
    ctx.lineTo(-SHIP_R, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(2, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Particles.
    for (const p of this.particles) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      const a = Math.max(0, 1 - p.age / p.life);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    this.particles = this.particles.filter((p) => p.age < p.life);

    // Floating texts.
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      t.age += dt;
      const a = Math.max(0, 1 - t.age / t.life);
      ctx.globalAlpha = a;
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y - t.age * 40);
    }
    ctx.globalAlpha = 1;
    this.texts = this.texts.filter((t) => t.age < t.life);
  }
}
