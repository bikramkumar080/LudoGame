// storage.js — persist an in-progress game to localStorage so a refresh
// doesn't lose it. gameState is plain JSON-serialisable data. Feature-detected
// and fully defensive: any failure degrades to "no saved game".

const KEY = 'ludo:save';

// Read the storage object lazily via globalThis so it can be stubbed in tests
// and so a missing localStorage (private mode, Node) is handled gracefully.
function ls() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

function available() {
  const s = ls();
  if (!s) return false;
  try {
    s.setItem('__ludo_probe__', '1');
    s.removeItem('__ludo_probe__');
    return true;
  } catch {
    return false;
  }
}

export function save(g) {
  if (!available() || !g) return;
  try { ls().setItem(KEY, JSON.stringify(g)); } catch { /* quota / serialise */ }
}

export function load() {
  if (!available()) return null;
  try {
    const raw = ls().getItem(KEY);
    if (!raw) return null;
    const g = JSON.parse(raw);
    // Sanity-check the shape before trusting it.
    return g && Array.isArray(g.tokens) && Array.isArray(g.order) ? g : null;
  } catch {
    return null; // corrupt JSON etc.
  }
}

export function clear() {
  if (!available()) return;
  try { ls().removeItem(KEY); } catch { /* ignore */ }
}
