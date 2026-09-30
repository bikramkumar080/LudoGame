// main.js — controller: setup screen, animated turn loop, sound, and UI wiring.

import { buildBoard, drawTokens } from './render.js';
import {
  createGame, currentColor, roll, legalTokens, targetPos,
  applyCapture, hasWon, nextTurn,
} from './game.js';
import { sound } from './sound.js';

const $ = (sel) => document.querySelector(sel);

const els = {
  setup: $('#setup'),
  game: $('#game'),
  board: $('#board'),
  startBtn: $('#startBtn'),
  autoRoll: $('#autoRoll'),
  turnInfo: $('#turnInfo'),
  die: $('#die'),
  rollBtn: $('#rollBtn'),
  message: $('#message'),
  newGameBtn: $('#newGameBtn'),
  muteBtn: $('#muteBtn'),
  winScreen: $('#winScreen'),
  winText: $('#winText'),
  playAgainBtn: $('#playAgainBtn'),
};

let g = null;
let layer = null;
let busy = false; // true while a timer/animation is running

const PIPS = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

function renderDie(value) {
  els.die.innerHTML = '';
  const on = new Set(value ? PIPS[value] : []);
  for (let i = 0; i < 9; i++) {
    const pip = document.createElement('span');
    pip.className = 'pip' + (on.has(i) ? ' on' : '');
    els.die.appendChild(pip);
  }
  els.die.dataset.value = value || '';
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);

function render() {
  const color = currentColor(g);
  els.turnInfo.textContent = g.phase === 'over' ? '' : `${cap(color)}'s turn`;
  els.turnInfo.className = `turn-info ${color}`;
  els.message.textContent = g.message;

  // Only offer tokens when it's genuinely the player's moment to pick one.
  const canPick = g.phase === 'moving' && !busy;
  const movable = new Set(canPick ? legalTokens(g).map((t) => t.id) : []);
  drawTokens(layer, g, movable, onTokenClick);

  const manualRoll = !g.autoRoll && g.phase === 'rolling';
  els.rollBtn.disabled = !manualRoll || busy;
  els.rollBtn.style.display = g.autoRoll ? 'none' : '';
}

function beginTurn() {
  g.phase = 'rolling';
  g.dice = null;
  renderDie(null);
  g.message = g.autoRoll ? 'Rolling…' : 'Tap Roll to throw the dice.';
  render();
  if (g.autoRoll) {
    busy = true;
    setTimeout(() => { busy = false; doRoll(); }, 550);
  }
}

// Tumble the die for a moment, then settle on `final` and continue.
function doRoll() {
  if (busy || g.phase !== 'rolling') return;
  busy = true;
  const final = roll();
  els.die.classList.add('rolling');

  let ticks = 0;
  const iv = setInterval(() => {
    renderDie(1 + Math.floor(Math.random() * 6));
    sound.rollTick();
    if (++ticks >= 7) {
      clearInterval(iv);
      els.die.classList.remove('rolling');
      renderDie(final);
      sound.rollEnd();
      g.dice = final;
      busy = false;
      resolveRoll();
    }
  }, 70);
}

function resolveRoll() {
  if (g.dice === 6) g.sixStreak += 1;

  if (g.sixStreak === 3) {
    g.message = `Three 6s in a row — ${cap(currentColor(g))} forfeits the turn!`;
    render();
    scheduleNext();
    return;
  }

  const movers = legalTokens(g);
  if (movers.length === 0) {
    const color = currentColor(g);
    const stuckInBase = g.tokens
      .filter((t) => t.color === color)
      .every((t) => t.pos === -1);
    g.message = stuckInBase && g.dice !== 6
      ? `${cap(color)} rolled ${g.dice} — need a 6 to leave base. Passing…`
      : `${cap(color)} rolled ${g.dice} — no legal move. Passing…`;
    render();
    scheduleNext(); // auto-pass (a 6 with no move loses its bonus too)
    return;
  }

  g.phase = 'moving';
  g.message = `${cap(currentColor(g))} rolled ${g.dice} — tap a glowing piece.`;
  render();
}

// Slide a token one cell at a time to `dest`, then run `done`.
function animateMove(token, dest, done) {
  const stepOnce = () => {
    if (token.pos === dest) { done(); return; }
    token.pos += 1;
    sound.step(token.pos % 6);
    render();
    setTimeout(stepOnce, 150);
  };
  stepOnce();
}

function onTokenClick(token) {
  if (busy || g.phase !== 'moving') return;
  if (token.color !== currentColor(g)) return;
  const dest = targetPos(g, token, g.dice);
  if (dest === null) return;

  busy = true;
  animateMove(token, dest, () => {
    const { captured, finished } = applyCapture(g, token);
    const parts = [];
    if (captured.length) {
      sound.capture();
      parts.push(`Captured ${captured.map((t) => cap(t.color)).join(', ')}!`);
    }
    if (finished) { sound.finish(); parts.push('A token reached home!'); }
    g.message = parts.join(' ');
    busy = false;
    render(); // slides any captured tokens back to their base

    if (hasWon(g, token.color)) {
      g.phase = 'over';
      g.winner = token.color;
      sound.win();
      render();
      showWin(token.color);
      return;
    }

    if (g.dice === 6) {
      g.phase = 'rolling';
      g.dice = null;
      g.message += ' Rolled a 6 — go again!';
      renderDie(null);
      render();
      if (g.autoRoll) {
        busy = true;
        setTimeout(() => { busy = false; doRoll(); }, 650);
      }
      return;
    }
    scheduleNext();
  });
}

function scheduleNext() {
  busy = true;
  setTimeout(() => {
    busy = false;
    nextTurn(g);
    beginTurn();
  }, 750);
}

function showWin(color) {
  els.winText.textContent = `${cap(color)} wins! 🎉`;
  els.winText.className = `win-text ${color}`;
  els.winScreen.classList.remove('hidden');
}

function startGame() {
  sound.init();
  sound.click();
  const count = Number(document.querySelector('input[name="players"]:checked').value);
  g = createGame(count, els.autoRoll.checked);
  layer = buildBoard(els.board);
  els.setup.classList.add('hidden');
  els.game.classList.remove('hidden');
  els.winScreen.classList.add('hidden');
  beginTurn();
}

function resetToSetup() {
  sound.click();
  els.game.classList.add('hidden');
  els.winScreen.classList.add('hidden');
  els.setup.classList.remove('hidden');
}

els.startBtn.addEventListener('click', startGame);
els.rollBtn.addEventListener('click', () => { sound.init(); doRoll(); });
els.newGameBtn.addEventListener('click', () => {
  // Confirm mid-game so an accidental tap can't wipe a game in progress.
  if (g && g.phase !== 'over' &&
      !confirm('Start a new game? Your current game will be lost.')) return;
  resetToSetup();
});
els.playAgainBtn.addEventListener('click', resetToSetup);
els.muteBtn.addEventListener('click', () => {
  const m = sound.toggleMute();
  els.muteBtn.textContent = m ? '🔇' : '🔊';
  els.muteBtn.setAttribute('aria-label', m ? 'Unmute' : 'Mute');
});
