# 🎲 Ludo

A polished, dependency-free **Ludo** game for **2–4 players** (hot-seat, same device).
Plain HTML/CSS/JavaScript — no build step, no frameworks — so it runs anywhere and
deploys straight to GitHub Pages.

**▶ Play:** https://bikramkumar080.github.io/LudoGame/

## Features

- **2, 3, or 4 players** in the classic colours — Red, Green, Yellow, Blue.
- **Auto-roll / manual-roll toggle** on the setup screen:
  - *Auto-roll:* the dice throws itself each turn — you just tap a piece.
  - *Manual:* tap **Roll**, then tap a piece.
- **Voice control (hands-free):** turn on the 🎤 button and say a piece
  number — "move two", "number 3", or just "two" — and that piece moves. The
  pieces **talk back** ("Moving piece two!", "Piece 3 is home!"). Each piece is
  numbered 1–4. Needs a browser with the Web Speech API (Chrome/Edge); the button
  is disabled where unsupported.
- Animated tumbling dice and step-by-step token movement.
- Synthesized sound effects (Web Audio — no audio files to host); mute button.
- Fully responsive for phone and laptop.
- Respects `prefers-reduced-motion`.

## How to play

1. Pick the number of players and the dice mode, then **Start Game**.
2. On your turn, a piece can only leave its base (the four in your corner) when you
   roll a **6**. Until then, turns pass automatically.
3. When one of your pieces **glows**, tap it to move.
4. First player to get all **4 pieces home** wins.

### Voice control

Each piece is numbered **1–4**. Tap 🎤 to enable hands-free voice (grant mic
permission once). When it's your move, say the piece number — "move two",
"number 3", or just "two" — and it moves by the dice value if legal. The pieces
reply out loud. Works in Chrome/Edge (Web Speech API); tapping still works
everywhere.

### Rules implemented

| Rule | Behaviour |
|------|-----------|
| Leaving base | Requires a roll of **6** |
| Bonus turn | Rolling a **6** grants another roll |
| Three 6s | Rolling three 6s in a row **forfeits** the turn |
| Capture | Landing on a lone opponent sends it back to base |
| Safe cells | 8 starred cells — no captures there |
| Blocks | Two of your own pieces on a cell block opponents |
| Finishing | Requires an **exact** roll into the final home cell |
| No legal move | Turn passes automatically |
| Winning | First to bring all 4 pieces home |

## Run locally

Any static file server works. Using the bundled script:

```bash
npm run serve         # serves on http://localhost:8000
```

Then open http://localhost:8000/.

> ⚠️ Open it via a server, **not** by double-clicking `index.html` —
> ES modules won't load over `file://`.

## Tests

```bash
npm test              # 23 logic tests (node --test), no browser needed
npm run test:ui       # 7 headless UI checks (Playwright + Chrome) — needs the server running
```

- **Logic tests** (`test/`) cover the rules engine: setup, dice, legal moves,
  blocks, captures, safe cells, exact-finish, winning, turn order.
- **UI tests** (`ui-test.mjs`) load the real page in Chrome and assert the board
  layout is sane (all tokens inside the board, hub centred, no runtime errors).

For UI tests, start the server in one terminal (`npm run serve`) and run
`npm run test:ui` in another.

## Project structure

```
index.html          Setup screen, game screen, win overlay
styles.css          Responsive board, tokens, dice, animations
js/
  board.js          Board geometry + position model (pure data)
  game.js           Rules engine (pure logic, no DOM)
  render.js         Builds the 15×15 grid, draws tokens
  sound.js          Web-Audio sound effects
  main.js           Controller: setup, turn loop, UI wiring
test/               Node test-runner suites (logic)
ui-test.mjs         Headless UI regression test
ui-check.mjs        Debug helper: prints a state timeline
ui-shot.mjs         Debug helper: saves gameplay screenshots
```

## Deploy (GitHub Pages)

1. Push to `main`.
2. Repo **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Branch `main`, folder `/ (root)`, **Save**.
4. Live at `https://<user>.github.io/LudoGame/` after ~1–2 minutes.

Updates deploy automatically on every push to `main`.
