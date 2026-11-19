// main.js — STARSLING browser wiring: input, game loop, screens, HUD and
// localStorage saves. All game rules live in game.js / physics.js / scoring.js.

import { LEVELS } from './levels.js';
import { WORLD_H, WORLD_W, launchVelocity } from './physics.js';
import {
  aimPreview, campaignScore, createGame, currentLevel, launch, startLevel, update,
} from './game.js';
import { Renderer } from './render.js';
import { ensureAudio, isMuted, setMuted, sfx } from './audio.js';

const SAVE_KEY = 'starsling-save-v1';
const $ = (id) => document.getElementById(id);

const game = createGame();
const canvas = $('game-canvas');
const renderer = new Renderer(canvas);

let paused = false;
let time = 0;
let lastTs = 0;
let aiming = false;
let aimPointer = { x: 0, y: 0 };
let aimCache = null; // { key, points, power, angle }
let lastFlightPos = null;

// ---- Save / load -------------------------------------------------------
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Number.isInteger(data.unlocked)) game.unlocked = Math.min(data.unlocked, LEVELS.length);
    if (data.best && typeof data.best === 'object') {
      game.best = data.best;
      game.totalStars = Object.values(game.best).reduce((s, b) => s + (b.stars || 0), 0);
    }
  } catch { /* corrupted save — start fresh */ }
}

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ unlocked: game.unlocked, best: game.best }));
  } catch { /* storage unavailable — progress just won't persist */ }
}

// ---- Screens -----------------------------------------------------------
const SCREENS = ['menu', 'levels', 'howto', 'pause', 'complete', 'gameover', 'victory'];

function showScreen(name) {
  for (const s of SCREENS) $(`screen-${s}`).classList.toggle('hidden', s !== name);
  $('hud').classList.toggle('hidden', name === 'menu' || name === 'levels' || name === 'howto');
}

function showTip(text) {
  const tip = $('level-tip');
  tip.textContent = text;
  tip.classList.remove('hidden');
  tip.classList.add('show');
  clearTimeout(showTip.timer);
  showTip.timer = setTimeout(() => tip.classList.remove('show'), 4200);
}

function updateHUD() {
  const level = currentLevel(game);
  $('hud-level').textContent = `${game.levelIndex + 1} · ${level.name}`;
  $('hud-score').textContent = `Score ${game.score.toLocaleString('en-US')}`;
  $('hud-launches').textContent = `●`.repeat(Math.max(game.launchesLeft, 0)) || '—';
  $('hud-launches').title = `${game.launchesLeft} launches left`;
  $('hud-shards').textContent = `✦ ${game.collected.size}/${level.shards.length}`;
  const comboEl = $('hud-combo');
  if (game.combo >= 2 && game.flight) {
    comboEl.textContent = `COMBO x${game.combo}`;
    comboEl.classList.remove('hidden');
  } else {
    comboEl.classList.add('hidden');
  }
}

function updateMuteButton() {
  $('btn-mute').textContent = isMuted() ? '🔇' : '🔊';
  $('btn-mute').title = isMuted() ? 'Unmute (M)' : 'Mute (M)';
}

function buildLevelGrid() {
  const grid = $('levels-grid');
  grid.innerHTML = '';
  LEVELS.forEach((level, i) => {
    const locked = i >= game.unlocked;
    const best = game.best[i];
    const btn = document.createElement('button');
    btn.className = `level-card${locked ? ' locked' : ''}`;
    btn.disabled = locked;
    btn.innerHTML =
      `<span class="level-num">${i + 1}</span>` +
      `<span class="level-name">${level.name}</span>` +
      `<span class="level-stars">${'★'.repeat(best?.stars || 0)}${'☆'.repeat(3 - (best?.stars || 0))}</span>` +
      `<span class="level-best">${best ? best.score.toLocaleString('en-US') + ' pts' : locked ? 'Locked' : 'Not cleared'}</span>`;
    btn.addEventListener('click', () => {
      sfx.click();
      startLevelUI(i);
    });
    grid.appendChild(btn);
  });
}

function startLevelUI(index) {
  paused = false;
  aiming = false;
  aimCache = null;
  renderer.resetTrail();
  startLevel(game, index);
  showScreen(null);
  updateHUD();
  showTip(currentLevel(game).tip);
}

function continueIndex() {
  for (let i = 0; i < game.unlocked; i++) {
    if (!game.best[i]) return i;
  }
  return game.unlocked - 1;
}

// ---- Events from the game loop -----------------------------------------
function handleEvents(events) {
  const level = currentLevel(game);
  for (const ev of events) {
    if (ev.type === 'collect') {
      const s = level.shards[ev.shard];
      sfx.collect(ev.combo);
      renderer.burst(s.x, s.y, '#ffe66d', 18, 180);
      renderer.floatText(s.x, s.y - 18, `+${ev.points}${ev.combo > 1 ? `  x${ev.combo}` : ''}`);
    } else if (ev.type === 'orbit') {
      const p = level.planets[ev.planet];
      sfx.orbit();
      renderer.burst(p.x, p.y - p.r, '#4dffc3', 20, 160);
      renderer.floatText(p.x, p.y - p.r - 24, `PERFECT ORBIT +${ev.points}`, '#4dffc3');
    } else if (ev.type === 'crashed') {
      sfx.crash();
      const pos = lastFlightPos || { x: level.pad.x, y: level.pad.y };
      renderer.burst(pos.x, pos.y, '#ff6b6b', 34, 260);
      renderer.burst(pos.x, pos.y, '#ffb347', 20, 180);
      renderer.floatText(pos.x, pos.y - 20, 'CRASH!', '#ff6b6b');
      renderer.resetTrail();
    } else if (ev.type === 'lost') {
      sfx.lost();
      renderer.floatText(WORLD_W / 2, WORLD_H / 2 - 40, 'LOST IN SPACE', '#9fb3d8');
      renderer.resetTrail();
    } else if (ev.type === 'timeout') {
      sfx.lost();
      renderer.floatText(WORLD_W / 2, WORLD_H / 2 - 40, 'OUT OF TIME', '#9fb3d8');
      renderer.resetTrail();
    } else if (ev.type === 'levelComplete') {
      sfx.win();
      saveGame();
      const g = level.gate;
      renderer.burst(g.x, g.y, '#4dffc3', 40, 280);
      renderer.burst(g.x, g.y, '#ffe66d', 30, 220);
      renderer.burst(g.x, g.y, '#7dd3fc', 30, 200);
      setTimeout(() => {
        if (game.screen === 'victory') {
          $('victory-score').textContent = campaignScore(game).toLocaleString('en-US');
          $('victory-stars').textContent = `★ ${game.totalStars} / ${LEVELS.length * 3}`;
          showScreen('victory');
        } else {
          const r = ev.result;
          $('complete-stars').textContent = '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars);
          $('complete-score').textContent = r.score.toLocaleString('en-US');
          $('complete-breakdown').textContent =
            `Shards & orbits ${r.score - r.bonus}  ·  Completion bonus ${r.bonus}` +
            `  ·  Launches left ${r.launchesLeft}` +
            (r.isRecord ? '  ·  New record!' : '');
          $('btn-next').classList.toggle(
            'hidden', game.levelIndex + 1 >= LEVELS.length,
          );
          showScreen('complete');
        }
        updateHUD();
      }, 700);
    } else if (ev.type === 'gameOver') {
      sfx.gameOver();
      setTimeout(() => showScreen('gameover'), 700);
    }
  }
  updateHUD();
}

// ---- Input -------------------------------------------------------------
function toWorld(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * WORLD_W,
    y: ((clientY - rect.top) / rect.height) * WORLD_H,
  };
}

function currentAim() {
  if (!aiming || game.screen !== 'playing' || game.flight) return null;
  const level = currentLevel(game);
  const dx = aimPointer.x - level.pad.x;
  const dy = aimPointer.y - level.pad.y;
  const v = launchVelocity(dx, dy);
  if (!v) return { active: true, pointer: aimPointer, points: [], power: 0 };
  const angle = Math.atan2(v.vy, v.vx);
  const key = `${Math.round(angle * 100)}:${Math.round(v.power * 100)}`;
  if (!aimCache || aimCache.key !== key) {
    const preview = aimPreview(game, angle, v.power);
    aimCache = { key, points: preview.points, power: v.power, angle };
  }
  return { active: true, pointer: aimPointer, points: aimCache.points, power: aimCache.power };
}

canvas.addEventListener('pointerdown', (e) => {
  ensureAudio();
  if (game.screen !== 'playing' || game.flight || paused) return;
  e.preventDefault();
  aiming = true;
  aimCache = null;
  aimPointer = toWorld(e.clientX, e.clientY);
});

window.addEventListener('pointermove', (e) => {
  if (!aiming) return;
  aimPointer = toWorld(e.clientX, e.clientY);
});

window.addEventListener('pointerup', () => {
  if (!aiming) return;
  aiming = false;
  if (game.screen !== 'playing' || game.flight || paused) return;
  const level = currentLevel(game);
  const v = launchVelocity(aimPointer.x - level.pad.x, aimPointer.y - level.pad.y);
  if (!v) return; // drag too short — treat as a cancelled aim
  const angle = Math.atan2(v.vy, v.vx);
  if (launch(game, angle, v.power)) {
    sfx.shoot(v.power);
    renderer.resetTrail();
  }
  aimCache = null;
});

window.addEventListener('pointercancel', () => {
  aiming = false;
  aimCache = null;
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'm' || e.key === 'M') {
    setMuted(!isMuted());
    updateMuteButton();
    return;
  }
  if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && game.screen === 'playing') {
    paused = !paused;
    showScreen(paused ? 'pause' : null);
    return;
  }
  if ((e.key === 'r' || e.key === 'R') && game.screen === 'playing' && !paused) {
    startLevelUI(game.levelIndex);
  }
});

// ---- Buttons -----------------------------------------------------------
$('btn-play').addEventListener('click', () => { sfx.click(); startLevelUI(continueIndex()); });
$('btn-levels').addEventListener('click', () => { sfx.click(); buildLevelGrid(); showScreen('levels'); });
$('btn-howto').addEventListener('click', () => { sfx.click(); showScreen('howto'); });
$('btn-levels-back').addEventListener('click', () => { sfx.click(); showScreen('menu'); });
$('btn-howto-back').addEventListener('click', () => { sfx.click(); showScreen('menu'); });
$('btn-menu').addEventListener('click', () => {
  sfx.click();
  paused = false;
  game.screen = 'menu';
  $('menu-best').textContent = menuBestText();
  showScreen('menu');
});
$('btn-restart').addEventListener('click', () => { sfx.click(); startLevelUI(game.levelIndex); });
$('btn-pause').addEventListener('click', () => {
  if (game.screen !== 'playing') return;
  sfx.click();
  paused = true;
  showScreen('pause');
});
$('btn-mute').addEventListener('click', () => {
  ensureAudio();
  setMuted(!isMuted());
  updateMuteButton();
  if (!isMuted()) sfx.click();
});
$('btn-resume').addEventListener('click', () => { sfx.click(); paused = false; showScreen(null); });
$('btn-pause-restart').addEventListener('click', () => { sfx.click(); startLevelUI(game.levelIndex); });
$('btn-pause-menu').addEventListener('click', () => {
  sfx.click();
  paused = false;
  game.screen = 'menu';
  $('menu-best').textContent = menuBestText();
  showScreen('menu');
});
$('btn-next').addEventListener('click', () => { sfx.click(); startLevelUI(game.levelIndex + 1); });
$('btn-replay').addEventListener('click', () => { sfx.click(); startLevelUI(game.levelIndex); });
$('btn-complete-levels').addEventListener('click', () => { sfx.click(); buildLevelGrid(); showScreen('levels'); });
$('btn-retry').addEventListener('click', () => { sfx.click(); startLevelUI(game.levelIndex); });
$('btn-gameover-levels').addEventListener('click', () => { sfx.click(); buildLevelGrid(); showScreen('levels'); });
$('btn-victory-levels').addEventListener('click', () => { sfx.click(); buildLevelGrid(); showScreen('levels'); });
$('btn-victory-replay').addEventListener('click', () => { sfx.click(); startLevelUI(0); });

function menuBestText() {
  const cleared = Object.keys(game.best).length;
  if (cleared === 0) return '12 levels · no login · free forever';
  return `${cleared}/12 levels cleared · ★ ${game.totalStars}/${LEVELS.length * 3} · ${campaignScore(game).toLocaleString('en-US')} pts`;
}

// ---- Main loop ---------------------------------------------------------
function frame(ts) {
  const dt = Math.min((ts - lastTs) / 1000 || 0, 1 / 30);
  lastTs = ts;
  time += dt;
  if (!paused && game.screen === 'playing') {
    if (game.flight) lastFlightPos = { x: game.flight.x, y: game.flight.y };
    const events = update(game, dt);
    if (events.length) handleEvents(events);
  }
  renderer.render({
    game,
    level: currentLevel(game),
    aim: currentAim(),
    time,
    dt,
  });
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => renderer.resize());

// ---- Boot --------------------------------------------------------------
loadSave();
updateMuteButton();
$('menu-best').textContent = menuBestText();
showScreen('menu');
requestAnimationFrame(frame);
