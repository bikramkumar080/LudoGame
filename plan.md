# Enhancement Plan

Branch: `feature/game-enhancements`. Each feature lands as its own commit with
tests passing (`npm test` + `npm run test:ui`) before merge. No new runtime
dependencies — the site stays static and GitHub-Pages-deployable from repo root.

## Guiding constraints

- Pure logic (`game.js`, `board.js`) stays DOM-free and Node-testable.
- Every rules change gets a logic test in `test/`.
- Layout-affecting changes get a UI check in `ui-test.mjs`.
- The `busy` flag in `main.js` still funnels all timer choreography.

---

## Feature 1 — Computer opponents (AI)

**Why:** Hot-seat only today; you always need 2+ humans. Bots enable solo play.

**Design:**
- New `js/ai.js`, pure: `chooseMove(g)` returns the token an AI should move
  given the current dice, using `legalTokens`/`targetPos` from the engine.
- Priority heuristic (first that applies):
  1. Capture an opponent (lands on a lone enemy on a non-safe cell).
  2. Finish a token (exact land on FINISH).
  3. Leave base on a 6 (get more pieces in play).
  4. Move to a safe cell.
  5. Advance the token furthest along (closest to home).
- Setup screen: per-color Human/Computer choice (default all human).
- `gameState` gains `players: { red:'human'|'cpu', ... }`.
- `main.js`: when the current color is CPU, auto-roll (ignoring the manual
  toggle for bots) and auto-move via `chooseMove` on the same `busy` timers.

**Tests:** `test/ai.test.js` — capture beats advance, finish beats capture,
exits on a 6 when nothing better, picks furthest token as fallback.

---

## Feature 2 — Finish placements (keep playing for 2nd/3rd/4th)

**Why:** Real Ludo ranks everyone; today the game halts at the first winner.

**Design:**
- `gameState.ranking: []` — colors in finish order.
- On a color finishing all four, push to `ranking`, mark it done, but continue
  until only one player remains (they take last place).
- `nextTurn` skips already-finished colors.
- Win screen becomes a placements board (🥇🥈🥉).

**Tests:** finished colors are skipped by `nextTurn`; game ends when
`order.length - ranking.length === 1`; ranking order is preserved.

---

## Feature 3 — Resume-on-refresh (localStorage)

**Why:** An accidental reload wipes a game in progress.

**Design:**
- `js/storage.js`: `save(g)`, `load()`, `clear()` — JSON round-trip of
  `gameState` (plain data, no functions). Feature-detected; no-op if
  `localStorage` unavailable.
- `main.js` saves after each settled turn; clears on New Game / win.
- On load, if a saved game exists, offer "Resume" on the setup screen.

**Tests:** `test/storage.test.js` with a `localStorage` stub — round-trip
preserves tokens/turn/phase; `clear` removes it; corrupt JSON → `load` returns
null (no throw).

---

## Feature 4 — Move hints

**Why:** New players don't always see the strongest move.

**Design:**
- Reuse `ai.chooseMove(g)` to compute a suggested token.
- A "Hints" toggle on the setup screen (off by default).
- When on and it's a human's move, add a `.hint` class to the suggested
  token (distinct from `.movable` glow — a subtle ring, no bob).

**Tests:** covered by `ai.test.js` (the suggestion is `chooseMove`); a UI
check that exactly one `.hint` appears when the toggle is on.

---

## Feature 5 — Colorblind support

**Why:** Pieces are distinguished by color alone (~8% of players struggle).

**Design:**
- Piece discs already show 1–4; add a per-color shape/glyph so color isn't the
  only channel (e.g. red=●, green=▲, yellow=■, blue=◆) behind the number, or a
  distinct border pattern per color.
- A "High-contrast / colorblind" toggle on setup that swaps the palette to a
  colorblind-safe set and shows the glyphs.

**Tests:** UI check that each color's disc carries its glyph/attribute when the
mode is on.

---

## Merge / deploy

- Each feature: implement → `npm test` → `npm run test:ui` → commit.
- Push the branch so it can be deployed/tested in isolation before merging to
  `main`.
- Final: open a PR (or fast-forward merge) into `main` once you've tried it.
