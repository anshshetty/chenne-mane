import assert from 'node:assert/strict';
import { initialState, playMove, legalMoves } from '../dist/engine.mjs';
import { chooseBotMove } from '../dist/bot.mjs';
import { normalizePreferences } from '../dist/setup.mjs';
const position = playMove(initialState(), 0, { frames: false }).state;
assert.deepEqual(legalMoves(position), [9, 10, 11, 12]);
assert.equal(
  chooseBotMove(position, 'easy', () => 0),
  9,
);
assert.equal(
  chooseBotMove(position, 'easy', () => 0.99999),
  12,
);
assert.equal(chooseBotMove(position, 'medium'), 11);
assert.equal(chooseBotMove(position, 'hard'), 10);
let state = initialState();
for (let n = 0; n < 100; n++) {
  if (state.over) state = initialState();
  const before = structuredClone(state),
    moves = legalMoves(state);
  for (const level of ['easy', 'medium', 'hard'])
    assert.ok(moves.includes(chooseBotMove(state, level, () => 0.5)));
  assert.deepEqual(state, before);
  state = playMove(state, moves[n % moves.length], { frames: false }).state;
}
for (const level of ['easy', 'medium', 'hard']) {
  assert.equal(chooseBotMove({ ...initialState(), over: true }, level), null);
  assert.equal(chooseBotMove({ ...initialState(), pits: Array(14).fill(0) }, level), null);
}
assert.deepEqual(normalizePreferences(), {
  mode: 'solo',
  sowing: 'auto',
  speed: '220',
  difficulty: 'medium',
  pauseRelay: true,
});
assert.equal(normalizePreferences({ sowing: 'manual' }).sowing, 'manual');
assert.equal(normalizePreferences({ pauseRelay: 'false' }).pauseRelay, false);
assert.equal(normalizePreferences({ difficulty: 'unknown' }).difficulty, 'medium');
console.log(
  'Distinct bot choices, legal moves, immutable inputs, terminal states, automatic defaults and saved preferences: pass',
);
