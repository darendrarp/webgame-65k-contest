# STARSLING — Base44 Prompt Pack

**The submission MUST be built inside Base44** (contest T&C §5.1, §6.1(b))
and hosted on a Base44 URL. This file is the exact, ordered prompt sequence
to paste into Base44's builder, plus the free-plan credit budget. The
reference code in `game/` is a design proof only — **do not paste code into
Base44**. Build via prompts: Overwolf may ask for the Base44 project's
creation/edit history as evidence it was built on Base44 during the
submission period (T&C §6.2), and prompt history is that evidence. (The
free plan has no code-edit feature anyway.)

Contest: The $65K Web Game Contest — https://nitropay.com/base44webgame/
Deadline: **3 Dec 2026, 23:59 UTC (4 Dec 2026, 06:59 WIB)** — submit by
**2 Dec** to leave a safety margin.

## 1. Free-plan credit budget (verified)

Base44 Free plan: **$0, 25 message credits/month, max 5/day, 100 integration
credits/month, up to 5 apps** (verified 19 Nov 2026 from base44.com pricing
guides + independent reviews checked Nov 2026; T&C §4.1(b) confirms a free
account is sufficient). Notes:

- One prompt ≈ 1–1.5 credits depending on size/model (a Sep 2026 hands-on
  tutorial built a working app in ~10 prompts / ~15 credits). Budget below
  assumes 1.5 credits per prompt — conservative.
- Credits reset on **1 Dec** (25 fresh credits). Credits do not roll over.
- STARSLING uses **0 integration credits**: no database, no backend, no
  login, no AI calls in the live app — everything is client-side.
- Never exceed 4 prompts/day in this plan (cap is 5/day).

## 2. Schedule

| Day (WIB) | Prompts | Credits (est.) | Goal |
|---|---|---|---|
| **19 Nov** (Day 1) | P1, P2, P3, P4 | ~6 | Full game built: physics, flow, 12 levels, screens, audio, juice |
| **20 Nov** (Day 2) | P5 only if needed | ~1.5 | Mobile polish + first fix round |
| **21 Nov** | Publish (no prompt) | 0 | Publish to base44.app, list on Launchpad, full playtest |
| **22–30 Nov** | Fix prompts as needed (≤4/day) | ~1.5 each | Fix only what the playtest checklist flags |
| **1 Dec** | Credits reset | — | 25 fresh credits for final fixes |
| **2 Dec** | — | — | Final playtest + **submit** (see SUBMIT_STEPS.md) |
| **3 Dec 23:59 UTC** | — | — | Hard deadline — do not leave submission to this day |

Total planned: **4–6 prompts ≈ 6–9 credits** — well inside the 25/month
budget, with the entire December allocation in reserve.

## 3. Rules for every prompt

1. Paste **one prompt per message**, in order, in the **same Base44 project
   chat**. Wait for each build to finish before sending the next.
2. After each prompt, run its **Verify** checklist (below the prompt). Only
   fix what is actually broken — do not spend credits on speculative polish.
3. If a build goes wrong, use the fix-prompt templates in §5 — describe the
   exact symptom, don't re-paste the whole game.
4. Never ask Base44 for: login/accounts, a backend/database, payments,
   ads, external images, audio files, or copyrighted characters/music.
   Everything must be generated in code.

## 4. The prompts (paste-ready)

### P1 — Day 1: scaffold + core physics + Level 1 (the big one)

```text
Build a single-page web game called STARSLING — a gravity-slingshot arcade
game. It must be a React app with one HTML canvas for the game and DOM
overlays for menus and HUD. No login, no backend, no database, no payments,
no external images or audio files — all art and sound must be generated in
code.

THE GAME (Level 1 only for now; more levels come in a later message):
- World: a 960x540 space scene that scales to fit the screen.
- A small probe ship sits on a launch pad at (90, 270).
- The player presses and drags anywhere on the canvas, then releases:
  this is a slingshot. Dragging down-left launches the ship up-right.
  Launch speed is 200 px/s at minimum pull and 720 px/s at full pull
  (200 px of drag). Show a dashed slingshot line from the pad to the
  pointer, a power ring around the pad (green to red), and a DOTTED
  TRAJECTORY PREVIEW of the exact flight path.
- Physics: fixed timestep, substeps of 1/120 second. One planet at
  (480, 330), radius 34, gravitational parameter mu = 1,400,000. Gravity
  acceleration on the ship is mu / (d^2 + (0.6*r)^2) toward the planet
  centre, where d is distance to the centre and r is planet radius. Cap
  ship speed at 1400 px/s. The trajectory preview MUST use this exact same
  physics (simulate forward 12 seconds at 1/60 s steps) so the preview
  never lies.
- The ship crashes if it touches the planet (distance < planet radius + 6),
  is lost if it flies more than 80 px past the world edge, and times out
  after 25 seconds of flight.
- Draw: deep indigo space background, a procedural twinkling starfield,
  soft nebula blobs, the planet as a gradient sphere with craters and a
  faint dashed ring showing its gravity range, the ship as a sleek white
  triangle with an engine flame and a fading trail, and the launch pad as
  a small glowing base.
- HUD at the top: level name "1 · First Light", score, launches left shown
  as dots, and buttons for menu, restart, pause and mute.
- Controls: mouse and touch drag to aim, release to launch. Keyboard:
  R restart, P pause, M mute.

Build exactly this now. Keep the code organised so later messages can add
shards, a gate, scoring, more levels, menus, sound and polish.
```

**Verify P1:** ☐ drag shows dotted preview that curves near the planet ·
☐ release launches the ship along the previewed path · ☐ ship crashes on
the planet, is lost off-screen · ☐ restart works · ☐ works on a phone
(touch drag) · ☐ no login wall anywhere.

### P2 — Day 1: shards, gate, scoring, launches, asteroids, end screens

```text
Add the full level objective and scoring to STARSLING (same project, same
game — do not rebuild from scratch):

- STAR SHARDS: Level 1 has 2 glowing gold 4-point star shards at (300,180)
  and (660,360). The ship collects a shard by flying within 21 px of it.
  Each shard is worth 100 points times a COMBO multiplier: collecting
  shards within 2.5 seconds of each other in the same flight chains the
  combo x1, x2, x3, x4, up to x5. Show a gold particle burst and floating
  "+100" / "+200 x2" text on collect. Collected shards disappear at once.
- THE GATE: a swirling ring at (870,270), radius 28. It stays grey and
  LOCKED (showing how many shards remain, e.g. "2✦") until all shards are
  collected, then turns green and opens. Flying within 36 px of the open
  gate completes the level.
- LAUNCHES: Level 1 gives 3 launches. Crash, flying off-screen, or the
  25-second timeout costs one launch and the ship returns to the pad.
  Losing all launches shows a GAME OVER screen ("Out of launches") with
  Try again and Levels buttons.
- LEVEL COMPLETE screen: stars earned (1 for finishing; thresholds come
  later), total score, a breakdown (shard/orbit points vs completion
  bonus), launches left, and Next / Replay / Levels buttons. Completion
  bonus = 500 + 150 per unused launch + a time bonus up to 300 that
  decays linearly over 90 seconds of flight time.
- ASTEROIDS (for later levels): grey irregular rocks that drift in a
  straight line and bounce off the world edges. Touching one crashes the
  ship exactly like a planet. Add the mechanic now; levels using it come
  in the next message.
- HUD: also show shards collected as "✦ n/m" and a yellow COMBO badge
  when the combo is x2 or higher.

Keep the trajectory preview, physics and Level 1 layout exactly as they
are. Do not add login, backend, database or payments.
```

**Verify P2:** ☐ shards collect with burst + floating text · ☐ gate locked
until all shards, then opens · ☐ completing shows score breakdown · ☐ 3
launches, game over after losing all 3 · ☐ combo badge appears on quick
double-collect.

### P3 — Day 1: menus, level select, all 12 levels, progress saving

```text
Add the full game shell and all 12 levels to STARSLING (same project):

SCREENS (DOM overlays over the canvas):
- Main menu: big STARSLING title, tagline "a gravity-slingshot arcade",
  Play button (starts the first uncleared unlocked level), Levels button,
  How to play button, and a progress line (levels cleared, total stars,
  total score).
- Level select: a grid of 12 cards showing number, name, stars earned
  (0-3), best score, and a locked state. Clearing a level unlocks the
  next. Locked levels cannot be started.
- How to play: one screen explaining aim/launch, gravity, shards, gate,
  combo, Perfect Orbit bonus, launches, and the keys (R restart, P pause,
  M mute).
- Pause overlay (P or Esc, or the pause button): Resume, Restart level,
  Main menu.
- Save progress in the browser's localStorage: unlocked levels, best
  score and stars per level, mute setting. No account, no server.

LEVELS — same 960x540 world, same physics. Format: name | pad | gate |
planets (x,y,radius,mu) | shards | asteroids (x,y,radius,vx,vy) |
launches | 2-star score | 3-star score | tip shown at level start.
1 First Light | (90,270) | (870,270) | (480,330,34,1400000) | (300,180),(660,360) | none | 3 | 750 | 1050 | "Drag back from the pad and release to launch. Collect every shard, then fly into the gate."
2 Curveball | (90,450) | (870,90) | (480,270,40,2600000) | (350,150),(620,380),(480,90) | none | 4 | 1000 | 1400 | "Gravity bends your flight. Aim wide and let the planet curve you onto the shards."
3 Twin Suns | (90,270) | (870,270) | (330,180,32,2000000),(630,360,32,2000000) | (330,360),(630,180),(480,270) | none | 4 | 800 | 1150 | "Two gravity wells. Thread the gap between them."
4 The Slingshot | (90,90) | (870,450) | (480,270,48,3500000) | (250,400),(700,140),(800,270) | none | 4 | 800 | 1150 | "Skim the big planet to slingshot across the map — speed is free if you dare."
5 Asteroid Belt | (90,270) | (870,270) | (480,150,30,1800000) | (300,400),(480,400),(660,400) | (350,270,13,0,55),(620,270,13,0,-55) | 4 | 800 | 1150 | "Asteroids drift and bounce. Time your launch between them."
6 Orbit Master | (90,270) | (870,270) | (480,270,38,2600000) | (480,150),(580,270),(480,390),(380,270) | none | 5 | 900 | 1250 | "Loop a full circle around a planet for a +250 PERFECT ORBIT bonus."
7 Gauntlet | (90,90) | (870,450) | (300,200,30,1900000),(480,360,30,1900000),(660,180,30,1900000) | (250,380),(480,120),(700,380),(850,150) | none | 5 | 1200 | 1650 | "Three wells, four shards. Chain quick collects to build your combo multiplier."
8 Crossfire | (90,450) | (870,90) | (350,270,34,2200000),(650,270,34,2200000) | (200,150),(480,90),(480,450),(760,380) | (480,200,12,60,0),(480,340,12,-60,0) | 5 | 1050 | 1500 | "Drifting rocks between twin wells. Patience beats power."
9 The Long Way | (60,270) | (900,270) | (300,120,28,1700000),(480,420,28,1700000),(660,120,28,1700000) | (300,420),(480,270),(660,420),(850,400) | none | 5 | 900 | 1250 | "A long flight across three wells. Conserve launches — you only get five."
10 Nebula Maze | (90,90) | (870,450) | (280,180,28,1700000),(500,90,26,1500000),(480,360,30,1900000),(700,240,28,1700000) | (200,400),(350,300),(600,120),(750,400),(850,200) | none | 6 | 1050 | 1500 | "Four wells bend every line. Use the aim preview — the dotted path never lies."
11 Event Horizon | (90,270) | (870,270) | (480,270,58,5000000) | (480,120),(620,200),(620,340),(480,420),(340,270) | none | 6 | 950 | 1350 | "One giant well. Its pull is huge — orbit it, don't fight it."
12 Grand Tour | (90,450) | (870,90) | (280,180,32,2000000),(480,300,36,2400000),(680,160,30,1900000) | (200,120),(380,420),(480,90),(620,400),(780,300),(850,250) | (400,270,13,0,50),(580,270,13,0,-50) | 7 | 1600 | 2250 | "Everything at once. Seven launches, six shards, one last gate. Good luck, pilot."

Show each level's tip as a small toast at the bottom of the screen for
about 4 seconds when the level starts. Stars: 1 for finishing, 2 at the
2-star score, 3 at the 3-star score. Keep everything from P1 and P2
unchanged. No login, backend, database or payments.
```

**Verify P3:** ☐ menu → levels grid shows 12 cards, only L1 unlocked ·
☐ beating L1 unlocks L2 · ☐ stars + best score save after refresh ·
☐ every level loads with the right planets/shards · ☐ tips show.

### P4 — Day 1: sound, orbit bonus, victory, juice

```text
Add the final layer of polish to STARSLING (same project):

- SOUND — 100% synthesized with the WebAudio API (oscillators and
  filtered noise). No audio files. Sounds: a whoosh on launch; a bright
  chime on shard collect that rises in pitch as the combo grows; a
  3-note arpeggio for the Perfect Orbit bonus; a low thud plus noise
  burst on crash; a fading tone when lost; a 4-note arpeggio on level
  complete; a short descending phrase on game over; a tiny click on
  buttons. Mute button toggles all sound and the setting persists.
  Audio must start only after the first user interaction (browser rule).
- PERFECT ORBIT BONUS: while flying, track the angle the ship sweeps
  around each planet (only while within 4x the planet's radius). The
  first time the swept angle reaches a full 360 degrees around a planet
  in one flight, award +250, show "PERFECT ORBIT +250" floating text,
  play the arpeggio, and burst green particles near the planet.
- VICTORY screen after completing level 12: trophy heading, total stars
  out of 36, total campaign score, and buttons for Levels and Play again
  from level 1.
- JUICE: particle bursts on collect (gold), crash (red/orange) and level
  complete at the gate (green/gold/blue confetti). Floating score text
  that rises and fades. The combo badge should pop (scale animation)
  when it appears.
- The game must be fully playable on a phone: touch drag to aim, no
  horizontal scrolling, HUD and buttons usable at 360 px width.

Keep all levels, physics, scoring and screens exactly as they are. No
login, backend, database, payments or external assets.
```

**Verify P4:** ☐ sounds play (after first click), mute persists · ☐ a
full loop around a planet awards +250 · ☐ victory screen after L12 ·
☐ phone layout clean at 360 px wide.

### P5 — Day 2 (only if the playtest finds problems)

Do a full playtest first (every level, phone + desktop). Then send **one**
fix message per real problem, using the templates in §5. If nothing is
broken, **skip P5 and save the credits**.

## 5. Fix-prompt templates (use only for real bugs)

**F1 — Preview lies / flight feels wrong:**
```text
Bug in STARSLING: the dotted trajectory preview does not match the actual
flight (describe what you see: e.g. "the ship curves much more than the
preview shows"). Fix it so the preview simulates the flight with the
EXACT same physics, timestep and constants as the real flight. Do not
change the levels, scoring or screens.
```

**F2 — A level is impossible / too hard:**
```text
Bug in STARSLING: level N (name) feels impossible — (describe: e.g. "the
shard at (x,y) cannot be reached because ..."). Make it fair with the
smallest possible change (move one shard slightly, or add one launch).
Do not change other levels, physics or scoring.
```

**F3 — Mobile / layout problem:**
```text
Bug in STARSLING on phones: (describe: e.g. "the canvas overflows",
"touch drag scrolls the page", "HUD buttons overlap"). Fix the layout /
touch handling (touch-action none on the canvas, responsive HUD). Do not
change gameplay, levels or scoring.
```

**F4 — Sound problem:**
```text
Bug in STARSLING: (describe: e.g. "no sound at all", "sound plays before
any click and the browser blocks it"). Fix the WebAudio code so all
sounds are synthesized after the first user interaction and the mute
button works. Do not change gameplay.
```

**F5 — Progress not saving:**
```text
Bug in STARSLING: (describe: e.g. "unlocked levels reset after refresh").
Fix the localStorage save/load of unlocked levels, best scores, stars
and mute setting. Do not change gameplay.
```

## 6. Publish (no prompt needed)

1. In Base44, press **Publish** and make the app **Public** — it gets a
   `*.base44.app` URL. Copy it: this is the submission URL.
2. Play the published URL on desktop + phone, logged out (incognito):
   no login wall, playable immediately, all 12 levels reachable.
3. List the app on the **Base44 Launchpad** so it can collect community
   upvotes (Community Vote track: top 25 upvoted enter the shortlist).
   Do NOT buy votes or use bots/scripts — T&C §8.4 disqualifies
   manipulated votes.
4. Leave the app live and unchanged after submission (T&C §6.1(e):
   live, no material change until the end of judging + 90 days after the
   winner announcement).

## 7. Reference (do not paste into Base44)

- Full design spec: `DESIGN.md`
- Reference implementation (proof the design works): `game/` + tests
  (`npm test` — 41/41 pass, incl. a solver proving all 12 levels winnable)
- Live reference demo (for comparison while playtesting the Base44 build):
  see `README.md` for the demo URL.
