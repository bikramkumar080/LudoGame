// voice.js — hands-free voice control + spoken replies.
// Uses the Web Speech API (SpeechRecognition for listening, speechSynthesis
// for talking back). Feature-detected; degrades gracefully if unsupported.

const NUMBER_WORDS = {
  one: 1, won: 1, want: 1, wan: 1, juan: 1, ones: 1, wun: 1,
  two: 2, to: 2, too: 2, tu: 2, dew: 2,
  three: 3, tree: 3, free: 3, thee: 3, tri: 3,
  four: 4, for: 4, fore: 4, far: 4, ford: 4, foe: 4,
};

// Parse a spoken phrase into a command, or null.
export function parseCommand(transcript) {
  const t = transcript.toLowerCase();
  if (/\broll\b/.test(t)) return { type: 'roll' };
  const digit = t.match(/[1-4]/); // any 1-4 digit anywhere (e.g. "1", "piece 1")
  if (digit) return { type: 'move', number: Number(digit[0]) };
  for (const [word, n] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(t)) return { type: 'move', number: n };
  }
  return null;
}

export function createVoice({ onCommand, onStatus } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;
  const supported = !!SR;

  let recog = null;
  let enabled = false;
  let wantListen = false;

  function speak(text, { interrupt = false } = {}) {
    if (!synth) return;
    try {
      if (interrupt) synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.05;
      u.pitch = 1.15;
      synth.speak(u);
    } catch { /* ignore synthesis errors */ }
  }

  function makeRecog() {
    const r = new SR();
    r.continuous = true;
    r.interimResults = false;
    r.lang = 'en-US';
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (!e.results[i].isFinal) continue;
        const transcript = e.results[i][0].transcript.trim();
        onStatus?.({ state: 'heard', detail: transcript });
        const cmd = parseCommand(transcript);
        if (cmd) onCommand?.(cmd);
      }
    };
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        enabled = false; wantListen = false;
        onStatus?.({ state: 'denied' });
      } else {
        onStatus?.({ state: 'error', detail: e.error });
      }
    };
    // Chrome stops after a pause; restart to stay hands-free.
    r.onend = () => { if (wantListen) { try { r.start(); } catch { /* already starting */ } } };
    return r;
  }

  return {
    supported,
    speak,
    get enabled() { return enabled; },
    enable() {
      if (!supported) return false;
      enabled = true;
      wantListen = true;
      recog = recog || makeRecog();
      try { recog.start(); } catch { /* start may throw if already running */ }
      onStatus?.({ state: 'listening' });
      return true;
    },
    disable() {
      enabled = false;
      wantListen = false;
      if (recog) { try { recog.stop(); } catch { /* ignore */ } }
      if (synth) { try { synth.cancel(); } catch { /* ignore */ } }
      onStatus?.({ state: 'off' });
    },
  };
}
