// sound.js — tiny synthesized sound effects via the Web Audio API.
// No audio files needed, so nothing extra to host. The AudioContext is
// created lazily on first user gesture (browser autoplay policy).

let ctx = null;
let muted = false;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// A single enveloped oscillator note.
function note(freq, dur, { type = 'sine', gain = 0.2, at = 0 } = {}) {
  const c = ensure();
  if (!c || muted) return;
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// A pitch sweep (used for captures — a satisfying "whoosh down").
function sweep(from, to, dur, { type = 'sawtooth', gain = 0.18 } = {}) {
  const c = ensure();
  if (!c || muted) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sound = {
  init() { ensure(); },
  get muted() { return muted; },
  toggleMute() { muted = !muted; return muted; },
  click() { note(620, 0.08, { type: 'square', gain: 0.12 }); },
  rollTick() { note(240 + Math.random() * 240, 0.05, { type: 'square', gain: 0.06 }); },
  rollEnd() { note(180, 0.14, { type: 'triangle', gain: 0.22 }); },
  step(i = 0) { note(440 + i * 40, 0.06, { type: 'sine', gain: 0.12 }); },
  capture() { sweep(700, 110, 0.35); },
  finish() { [523, 659, 784].forEach((f, i) => note(f, 0.18, { at: i * 0.09, gain: 0.2 })); },
  win() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
      note(f, 0.26, { at: i * 0.12, type: 'triangle', gain: 0.22 }));
  },
};
