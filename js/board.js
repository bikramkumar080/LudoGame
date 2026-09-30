// board.js — pure geometry & constants for a standard 15x15 Ludo board.
// No DOM, no game state. Everything here is data other modules read.

// The 52-cell shared main track, traced clockwise as [row, col] (0-indexed).
// Index 0 is Red's start cell; the loop returns toward it after index 51.
export const MAIN_PATH = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],           // 0-4   right along row 6
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],   // 5-10  up col 6
  [0, 7],                                            // 11    across top
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],   // 12-17 down col 8
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], // 18-23 right row 6
  [7, 14],                                           // 24    down
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], // 25-30 left row 8
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], // 31-36 down col 8
  [14, 7],                                           // 37    across bottom
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], // 38-43 up col 6
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],   // 44-49 left row 8
  [7, 0],                                            // 50    up
  [6, 0],                                            // 51    arrive back near start
];

// Turn order, clockwise from Red (TL -> TR -> BR -> BL).
export const TURN_ORDER = ['red', 'green', 'yellow', 'blue'];

// Which colors are active for each player count.
export const PLAYER_SETS = {
  2: ['red', 'yellow'],            // diagonal
  3: ['red', 'green', 'yellow'],
  4: ['red', 'green', 'yellow', 'blue'],
};

// Index on MAIN_PATH where each color's token first steps out of base.
export const START_INDEX = { red: 0, green: 13, yellow: 26, blue: 39 };

// The 6-cell colored home column for each color, from track edge to center.
// A token turns off the main track at (START_INDEX + 50) % 52 into HOME_PATH[0].
export const HOME_PATH = {
  red:    [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  green:  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  blue:   [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
};

// Safe cells (main-track indices): the 4 colored starts + 4 star cells.
// No captures happen here; tokens of different colors may coexist.
export const SAFE_INDICES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// The four token "yard" slots inside each corner base, as [row, col].
export const BASE_SLOTS = {
  red:    [[1, 1], [1, 4], [4, 1], [4, 4]],
  green:  [[1, 10], [1, 13], [4, 10], [4, 13]],
  yellow: [[10, 10], [10, 13], [13, 10], [13, 13]],
  blue:   [[10, 1], [10, 4], [13, 1], [13, 4]],
};

// Position model (per token): a single integer `pos`.
//   pos === -1        -> in base
//   pos 0..50         -> on main track; main index = (START_INDEX + pos) % 52
//   pos 51..56        -> in home column; HOME_PATH index = pos - 51
//   pos === FINISH    -> reached the final home cell
export const FINISH = 56;

// Resolve a token's [row, col] on the 15x15 grid from its color + pos.
export function cellFor(color, pos, baseSlot) {
  if (pos === -1) return BASE_SLOTS[color][baseSlot];
  if (pos <= 50) return MAIN_PATH[(START_INDEX[color] + pos) % 52];
  return HOME_PATH[color][pos - 51];
}

// Main-track index a token occupies, or null if in base/home.
export function mainIndexFor(color, pos) {
  if (pos < 0 || pos > 50) return null;
  return (START_INDEX[color] + pos) % 52;
}
