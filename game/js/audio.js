// audio.js — synthesized sound effects for STARSLING (WebAudio, no audio
// files, no copyrighted material). The AudioContext is created lazily on the
// first user gesture, as browsers require.

let ctx = null;
let muted = false;
try {
  muted = localStorage.getItem('starsling-muted') === '1';
} catch { /* storage unavailable (sandboxed iframe) — just stay unmuted */ }

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = !!value;
  try {
    localStorage.setItem('starsling-muted', muted ? '1' : '0');
  } catch { /* ignore */ }
}

export function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone({ freq, freqEnd, dur, type = 'sine', gain = 0.2, when = 0 }) {
  if (muted) return;
  const c = ensureAudio();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise({ dur, gain = 0.2, filterFreq = 800, when = 0 }) {
  if (muted) return;
  const c = ensureAudio();
  if (!c) return;
  const t0 = c.currentTime + when;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(g).connect(c.destination);
  src.start(t0);
}

export const sfx = {
  click() {
    tone({ freq: 660, freqEnd: 520, dur: 0.07, type: 'triangle', gain: 0.12 });
  },
  shoot(power = 0.5) {
    tone({ freq: 300 + power * 300, freqEnd: 90, dur: 0.28, type: 'sawtooth', gain: 0.1 });
    noise({ dur: 0.25, gain: 0.12, filterFreq: 1200 });
  },
  // Pitch climbs with the combo multiplier — chaining sounds rewarding.
  collect(combo = 1) {
    const base = 520 * Math.pow(1.122, combo - 1);
    tone({ freq: base, dur: 0.12, type: 'sine', gain: 0.22 });
    tone({ freq: base * 1.5, dur: 0.16, type: 'sine', gain: 0.16, when: 0.06 });
  },
  orbit() {
    [523, 659, 784].forEach((f, i) => tone({ freq: f, dur: 0.18, type: 'triangle', gain: 0.15, when: i * 0.07 }));
  },
  crash() {
    tone({ freq: 120, freqEnd: 35, dur: 0.4, type: 'sine', gain: 0.35 });
    noise({ dur: 0.35, gain: 0.25, filterFreq: 500 });
  },
  lost() {
    tone({ freq: 400, freqEnd: 120, dur: 0.5, type: 'sine', gain: 0.12 });
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.22, type: 'triangle', gain: 0.18, when: i * 0.11 }));
  },
  gameOver() {
    [392, 330, 262].forEach((f, i) => tone({ freq: f, dur: 0.25, type: 'triangle', gain: 0.15, when: i * 0.14 }));
  },
};
