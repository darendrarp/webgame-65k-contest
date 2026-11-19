# STARSLING — Game Design Document

**Entry for:** The $65K Web Game Contest (Base44 x Nitro by Overwolf)
**Deadline:** 3 Dec 2026, 23:59 UTC (4 Dec 2026, 06:59 WIB)
**Contest page:** https://nitropay.com/base44webgame/
**Terms:** https://nitropay.com/base44webgame/terms-and-conditions/

> This document specifies the game that must be built **inside Base44** (see
> `BASE44_PROMPTS.md` for the exact prompt sequence). The code in `game/` is a
> **reference implementation** proving the design is fun, complete and
> winnable — it is not the submission itself. The submission is the Base44
> app, hosted on a Base44 URL, per contest T&C §5.1 and §6.1(b).

## 1. Concept (one sentence)

Slingshot a probe around gravity wells: drag back, release, bend your flight
around planets, collect every star shard, and dive through the gate.

## 2. Why this concept wins on all three judging criteria

Judging (T&C §8.2, equal weight): Gameplay Quality, Creativity, Technical
Execution. Tie-break order: Gameplay → Technical → Creativity.

| Criterion | How STARSLING scores |
|---|---|
| **Gameplay Quality** | One mechanic, instantly learnable (drag → release), deep via real physics. A live dotted trajectory preview makes every shot a skill decision, not luck. 12 levels, 3-star ratings, combos and orbit bonuses make it replayable. |
| **Creativity** | Gravity-well slingshot with a twist: the **Perfect Orbit** bonus (+250 for looping a full circle around a planet) turns gravity from an obstacle into a scoring tool. Original name, original levels, all art/audio procedural. |
| **Technical Execution** | Fixed-timestep physics (120 Hz substeps), deterministic simulation, live trajectory prediction using the *same* physics as the flight, responsive + touch input, synthesized WebAudio (zero audio files), localStorage progress, and an automated solver that proves all 12 levels winnable. |

## 3. Core loop

1. **Aim** — press and drag anywhere on the canvas. A slingshot line shows
   the pull; a dotted path previews the exact trajectory (same physics).
   A ring around the pad fills green → red with power.
2. **Launch** — release. The probe flies under gravity from every planet.
3. **Collect** — fly through star shards ✦. Quick consecutive collects chain
   a combo multiplier (x1 → x5, 2.5 s window).
4. **Orbit (optional, skilled)** — loop a full 360° around a planet:
   +250 PERFECT ORBIT.
5. **Gate** — once all shards are collected, the gate opens; fly into it to
   finish the level.
6. **Fail states** — crash into a planet/asteroid, fly off-screen, or run out
   the 25 s flight timer: lose one launch. Lose all launches: level failed,
   retry instantly.

## 4. Rules & numbers (exact)

| Item | Value |
|---|---|
| World | 960 × 540 logical units, scales to any screen |
| Launch speed | 200 px/s (min pull) → 720 px/s (full pull, 200 px drag) |
| Flight time limit | 25 s per launch |
| Ship radius | 8 px (crash if centre within planet r + 6) |
| Shard collect radius | 21 px (shard r 13 + ship r 8) |
| Gate enter radius | 36 px (gate r 28 + ship r 8) |
| Gravity | a = mu / (d² + (0.6r)²) toward planet centre; mu 1.4M–5M per planet |
| Physics step | 1/120 s fixed substeps |
| Shard points | 100 × combo (combo x1–x5) |
| Combo window | 2.5 s between collects in the same flight |
| Orbit bonus | +250 per planet per launch (first full loop only) |
| Level completion | +500 base + 150 per unused launch + time bonus up to +300 (decays linearly over 90 s of flight time) |
| Stars | 1 for finishing; 2/3 at per-level score thresholds (see §6) |
| Asteroids | drift linearly, bounce off world bounds, crash on contact |

## 5. Screens & UX

- **Menu** — title, Play (continues at first uncleared unlocked level),
  Levels, How to play, progress summary.
- **Level select** — 12 cards with number, name, stars earned, best score,
  locked state. Clearing a level unlocks the next.
- **HUD** — level name, score, launches (●), shards (✦ n/m), combo badge
  (appears at x2+), menu / restart / pause / mute buttons.
- **How to play** — one screen, plain language, all mechanics + keys.
- **Pause** — resume / restart / menu. Keys: P or Esc.
- **Level complete** — stars, total score, breakdown (shards & orbits vs
  completion bonus), launches left, "New record!" flag, Next / Replay /
  Levels.
- **Game over** — "Out of launches", Try again / Levels.
- **Victory** — after level 12: total stars (x/36) and campaign score.
- **Level intro tip** — one-line tip toast at the bottom for ~4 s.
- **Persistence** — unlocked levels, best score + stars per level, mute
  setting in localStorage. No account, no server.
- **Input** — mouse + touch (pointer events), keyboard: R restart, P pause,
  M mute.
- **Audio** — all synthesized with WebAudio (oscillator + filtered noise):
  launch whoosh, collect chime (pitch rises with combo), orbit arpeggio,
  crash thud, win arpeggio, UI clicks. Mutable, persisted.

## 6. Levels (12)

Design principle: launches = shards + 1, so there is always a spare launch
for the gate run; stars reward skill (combos, orbits, unused launches).
Star thresholds were set from the automated greedy solver's scores
(star2 ≈ 0.75× solver, star3 ≈ 1.05× solver) — a skilled human beats the
greedy solver via combos and orbit bonuses.

| # | Name | Planets | Shards | Asteroids | Launches | Star 2 | Star 3 | Teaching point |
|---|---|---|---|---|---|---|---|---|
| 1 | First Light | 1 | 2 | 0 | 3 | 750 | 1,050 | drag, launch, collect, gate |
| 2 | Curveball | 1 | 3 | 0 | 4 | 1,000 | 1,400 | gravity bends flight |
| 3 | Twin Suns | 2 | 3 | 0 | 4 | 800 | 1,150 | thread between wells |
| 4 | The Slingshot | 1 big | 3 | 0 | 4 | 800 | 1,150 | skim for free speed |
| 5 | Asteroid Belt | 1 | 3 | 2 | 4 | 800 | 1,150 | moving hazards, timing |
| 6 | Orbit Master | 1 | 4 | 0 | 5 | 900 | 1,250 | Perfect Orbit bonus |
| 7 | Gauntlet | 3 | 4 | 0 | 5 | 1,200 | 1,650 | combo chaining |
| 8 | Crossfire | 2 | 4 | 2 | 5 | 1,050 | 1,500 | hazards + wells |
| 9 | The Long Way | 3 | 4 | 0 | 5 | 900 | 1,250 | long flights, conserve launches |
| 10 | Nebula Maze | 4 | 5 | 0 | 6 | 1,050 | 1,500 | trust the preview |
| 11 | Event Horizon | 1 huge | 5 | 0 | 6 | 950 | 1,350 | orbit, don't fight |
| 12 | Grand Tour | 3 | 6 | 2 | 7 | 1,600 | 2,250 | everything at once |

Full coordinates (planets, shards, gate, pad, asteroids, mu values) are in
`game/js/levels.js` and condensed into the Base44 prompts
(`BASE44_PROMPTS.md`, Prompt 5).

## 7. Visual & audio direction

- **Look:** deep-space gradient (near-black indigo), procedural starfield
  with twinkle, soft nebula blobs, planets as gradient spheres with craters
  and a dashed "gravity ring", glowing gold 4-point star shards, a swirling
  ring gate (grey/locked → green/open), a sleek white-blue probe with an
  engine flame and fading trail.
- **Feel:** dotted white trajectory preview; particle bursts on collect
  (gold), crash (red/orange), win (green/gold/blue confetti); floating
  score text (+100, x3, PERFECT ORBIT +250).
- **Audio:** synthesized only — no samples, no copyrighted music. See §5.

## 8. Technical notes (for the Base44 build)

- Single-page app, one `<canvas>` + DOM overlays for menus/HUD. This is the
  natural shape for a Base44 (React) app: a canvas game component + React
  state for screens, HUD and level select.
- Physics must use a **fixed timestep** (substeps of 1/120 s) so flight is
  identical on 60 Hz and 120 Hz displays.
- The **trajectory preview must reuse the flight physics** (simulate the
  launch forward ~12 s at 1/60 s steps, draw every Nth point). If the preview
  and the flight disagree, the game feels broken.
- No backend, no database, no login, no ads, no in-app purchases — the game
  is fully client-side, which keeps it inside the Base44 free plan's
  integration credits (0 used) and satisfies T&C §6.1(d).
- Everything (art, sound) is generated in code: zero third-party IP,
  satisfying T&C §6.1(f).

## 9. Verification status (reference build)

- **41/41 Node tests pass** (`npm test`, ~30 s): physics, scoring, level
  data validation, state machine, full playthroughs, and a greedy
  automated solver that beats all 12 levels within budget
  (see `tests/solvability.test.js`).
- **Headless browser smoke test passes** (`scripts/smoke_test.py`): loads
  the game, opens How-to and Level Select, performs a real drag-launch,
  collects a shard (+100), 0 console/page errors. Screenshots in
  `screenshots/`.
- **Not yet verified:** the Base44 build itself (built by the user via
  prompts), real-device touch feel, and the exact contest submission form
  fields — see `README.md` caveats and `SUBMIT_STEPS.md`.
