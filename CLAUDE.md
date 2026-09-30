# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repository.

## What this is

A hot-seat **Ludo** game for 2–4 players. **Vanilla HTML/CSS/JS, no build step, no
runtime dependencies.** It must stay deployable to GitHub Pages as static files
served from the repo root. Do not introduce a bundler, framework, or runtime
dependency without being asked.

The only dependency is **dev-only**: `playwright` (for headless UI tests). Keep it in
`devDependencies` and out of the shipped site.

## Architecture

The code separates **pure logic** from **DOM/rendering** so the rules are testable
in Node without a browser.

- `js/board.js` — geometry constants and the position model. Pure data + two helpers
  (`cellFor`, `mainIndexFor`). No state, no DOM.
- `js/game.js` — the rules engine. Operates on a `gameState` object; no DOM. Exports
  `createGame`, `currentColor`, `roll`, `targetPos`, `legalTokens`, `moveToken`,
  `applyCapture`, `hasWon`, `nextTurn`, `tokensOf`.
- `js/render.js` — `buildBoard(boardEl)` builds the 15×15 grid once and returns the
  token layer; `drawTokens(...)` positions tokens (elements are **reused** so CSS
  transitions animate movement).
- `js/sound.js` — Web-Audio synthesized effects. No audio files.
- `js/main.js` — the controller: setup screen, the turn loop, timers, and UI wiring.
  This is the only file that owns the `busy` flag and the `setTimeout`/`setInterval`
  choreography.

Rendering is a function of state: `main.js` mutates `gameState` via `game.js`, then
calls `render()`, which calls `drawTokens`.

## Position model (important)

Each token has a single integer `pos`:

- `-1` → in base
- `0..50` → on the shared main track; main-track index = `(START_INDEX[color] + pos) % 52`
- `51..56` → in the colour's home column (`HOME_PATH` index = `pos - 51`)
- `56` (`FINISH`) → final home cell

The main track has **52 cells**. A token turns into its home column at
`(START_INDEX + 50) % 52`. All four colours are symmetric (offset by 13).

Turn order is clockwise: `['red','green','yellow','blue']`, filtered to the active
players. Player sets: 2 = red/yellow (diagonal), 3 = red/green/yellow, 4 = all.

## Testing — run after every change

```bash
npm test              # logic tests (node --test), fast, no browser
npm run serve         # static server on :8000 (needed for UI tests)
npm run test:ui       # headless Chrome layout/regression checks (Playwright)
```

- Add/adjust logic tests in `test/` for any rules change.
- `ui-test.mjs` guards against layout regressions (e.g. the CSS specificity bug that
  once pushed all tokens off-board). It requires the server running and Chrome
  (`channel: 'chrome'`).
- Debug helpers when something looks wrong in the browser:
  - `node ui-check.mjs` — prints a timeline of dice/message/movable state.
  - `node ui-shot.mjs` — saves `shot-*.png` screenshots (gitignored).

## Conventions & gotchas

- **CSS specificity:** a `.board > div` rule (0-1-1) will override a single-class rule
  like `.token-layer` (0-1-0). This previously broke absolute positioning of the token
  layer and hub. Prefer scoped/class selectors; verify with `npm run test:ui`.
- Tokens are `<button>`s inside `.token-layer`; only `.movable` ones are clickable
  (`pointer-events`). The glow is the `.movable` class (halo + bob).
- Timers funnel through one module-level `busy` flag in `main.js`. When changing the
  turn flow, make sure every path resets `busy` or the loop can deadlock.
- Sound needs a user gesture; it's unlocked on the Start click. Don't call audio at
  module load.
- Keep everything served from the repo root; `.nojekyll` disables Jekyll on Pages.

## Deployment

Static, from `main` at repo root → https://bikramkumar080.github.io/LudoGame/.
Pushing to `main` redeploys automatically. Note: the local `gh` CLI is authenticated
to an SAP enterprise host, not github.com, so use plain `git push` for this repo (its
`origin` is on github.com).
