// scoring.js — pure scoring rules for STARSLING (shared by the live game,
// the solver and the tests, so all three always agree).

export const SHARD_BASE = 100; // points per shard, times the combo multiplier
export const COMBO_WINDOW = 2.5; // seconds between collects to keep chaining
export const COMBO_MAX = 5; // multiplier cap
export const ORBIT_BONUS = 250; // points per completed orbit of a planet
export const COMPLETE_BASE = 500; // points for finishing a level
export const LAUNCH_BONUS = 150; // points per unused launch on completion
export const TIME_BONUS_MAX = 300; // fastest completions earn the full bonus
export const TIME_BONUS_SPAN = 90; // seconds over which the time bonus decays

// Combo multiplier for a collect that happens `dtSinceLast` seconds after the
// previous collect in the same flight (Infinity = first collect of a flight).
export function comboAfter(dtSinceLast, prevCombo) {
  if (dtSinceLast === null || dtSinceLast === undefined || dtSinceLast > COMBO_WINDOW) return 1;
  return Math.min(prevCombo + 1, COMBO_MAX);
}

export function shardPoints(combo) {
  return SHARD_BASE * combo;
}

// Completion bonus: base + per unused launch + decaying time bonus.
// `levelTime` is total flight seconds spent on the level.
export function levelCompleteBonus(launchesLeft, levelTime) {
  const timeBonus = Math.round(TIME_BONUS_MAX * Math.max(0, 1 - levelTime / TIME_BONUS_SPAN));
  return COMPLETE_BASE + LAUNCH_BONUS * launchesLeft + timeBonus;
}

// Stars: 1 for finishing, 2 at level.star2, 3 at level.star3.
export function starsFor(score, level) {
  if (score >= level.star3) return 3;
  if (score >= level.star2) return 2;
  return 1;
}
