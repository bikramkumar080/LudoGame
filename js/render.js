// render.js — everything that touches the board DOM.

import {
  MAIN_PATH, HOME_PATH, SAFE_INDICES, BASE_SLOTS, cellFor,
} from './board.js';

const COLORS = ['red', 'green', 'yellow', 'blue'];
const key = (r, c) => `${r},${c}`;

// Precompute what each of the 225 grid cells is.
function classifyCells() {
  const map = new Map();
  const corners = { red: [0, 0], green: [0, 9], yellow: [9, 9], blue: [9, 0] };

  for (const color of COLORS) {
    const [r0, c0] = corners[color];
    for (let r = r0; r < r0 + 6; r++) {
      for (let c = c0; c < c0 + 6; c++) map.set(key(r, c), `base base-${color}`);
    }
    // Mark the four resting slots so the white yard rings render.
    for (const [r, c] of BASE_SLOTS[color]) map.set(key(r, c), `base base-${color} yard`);
  }
  for (let r = 6; r <= 8; r++) {
    for (let c = 6; c <= 8; c++) map.set(key(r, c), 'center');
  }
  for (const color of COLORS) {
    for (const [r, c] of HOME_PATH[color]) map.set(key(r, c), `cell home-${color}`);
  }
  const startOf = { 0: 'red', 13: 'green', 26: 'yellow', 39: 'blue' };
  MAIN_PATH.forEach(([r, c], idx) => {
    let cls = 'cell path';
    if (SAFE_INDICES.has(idx)) cls += ' safe';
    if (startOf[idx]) cls += ` start-${startOf[idx]}`;
    map.set(key(r, c), cls);
  });
  return map;
}

export function buildBoard(boardEl) {
  boardEl.innerHTML = '';
  const cells = classifyCells();
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const div = document.createElement('div');
      div.className = cells.get(key(r, c)) || 'blank';
      div.style.gridRow = r + 1;
      div.style.gridColumn = c + 1;
      // Star glyph on safe cells for a bit of flair.
      if (div.className.includes('safe')) div.textContent = '★';
      boardEl.appendChild(div);
    }
  }

  // Decorative base panels (classic Ludo look): a raised white inner panel
  // with four colour sockets where the pieces rest. Absolute overlays so they
  // stay out of the grid flow.
  const baseOrigins = { red: [0, 0], green: [0, 9], yellow: [9, 9], blue: [9, 0] };
  const slotPct = [[27, 27], [73, 27], [27, 73], [73, 73]];
  for (const color of COLORS) {
    const [r0, c0] = baseOrigins[color];
    const deco = document.createElement('div');
    deco.className = `base-deco base-deco-${color}`;
    deco.style.left = `calc(6px + (${c0} / 15) * (100% - 12px))`;
    deco.style.top = `calc(6px + (${r0} / 15) * (100% - 12px))`;
    deco.style.setProperty('--c', `var(--${color})`);
    const panel = document.createElement('div');
    panel.className = 'base-panel';
    deco.appendChild(panel);
    for (const [x, y] of slotPct) {
      const s = document.createElement('div');
      s.className = 'base-socket';
      s.style.left = `${x}%`;
      s.style.top = `${y}%`;
      deco.appendChild(s);
    }
    boardEl.appendChild(deco);
  }

  // Center home decoration (four triangles meeting in the middle).
  const hub = document.createElement('div');
  hub.className = 'home-center';
  for (const dir of ['top', 'right', 'bottom', 'left']) {
    const tri = document.createElement('div');
    tri.className = `tri tri-${dir}`;
    hub.appendChild(tri);
  }
  const trophy = document.createElement('div');
  trophy.className = 'trophy';
  trophy.textContent = '🏆';
  hub.appendChild(trophy);
  boardEl.appendChild(hub);

  const layer = document.createElement('div');
  layer.className = 'token-layer';
  boardEl.appendChild(layer);
  layer._els = new Map(); // reused token elements, keyed by token id
  return layer;
}

// Draw/refresh tokens. Elements are reused across calls so CSS transitions
// animate position changes (the sliding movement).
export function drawTokens(layer, g, movableIds, onTokenClick) {
  // Group by cell so stacked tokens can be fanned out.
  const byCell = new Map();
  for (const t of g.tokens) {
    const [r, c] = cellFor(t.color, t.pos, t.slot);
    const k = key(r, c);
    if (!byCell.has(k)) byCell.set(k, []);
    byCell.get(k).push(t);
  }

  for (const [k, group] of byCell) {
    const [r, c] = k.split(',').map(Number);
    group.forEach((t, i) => {
      let el = layer._els.get(t.id);
      if (!el) {
        el = document.createElement('button');
        el.type = 'button';
        el.dataset.id = t.id;
        el.appendChild(document.createElement('span')); // inner disc
        layer.appendChild(el);
        layer._els.set(t.id, el);
      }
      const movable = movableIds.has(t.id);
      el.className = `token token-${t.color}${movable ? ' movable' : ''}`;

      const spread = group.length > 1 ? 20 : 0;
      const angle = (i / group.length) * Math.PI * 2 - Math.PI / 2;
      const dx = spread ? Math.cos(angle) * spread : 0;
      const dy = spread ? Math.sin(angle) * spread : 0;
      el.style.left = `${((c + 0.5) / 15) * 100}%`;
      el.style.top = `${((r + 0.5) / 15) * 100}%`;
      el.style.setProperty('--dx', `${dx}%`);
      el.style.setProperty('--dy', `${dy}%`);
      el.style.zIndex = 10 + i;
      el.onclick = movable ? () => onTokenClick(t) : null;
    });
  }
}
