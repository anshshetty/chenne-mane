import assert from 'node:assert/strict';
import { initialState, playMove, legalMoves, chooseMove, key, clone } from '../dist/engine.mjs';
const sum = (s) => s.pits.reduce((a, b) => a + b, 0) + s.scores.reduce((a, b) => a + b, 0);
function custom(pits, turn = 0) {
  const s = initialState();
  s.pits = pits;
  s.scores = [0, 0];
  s.turn = turn;
  s.seen = { [key(s)]: 1 };
  return s;
}
const from = (o) => Array.from({ length: 14 }, (_, i) => o[i] || 0);
function reference(input, start) {
  let s = structuredClone(input),
    pickup = start,
    steps = 0,
    seen = new Set(),
    captured = 0,
    laps = 0;
  const own = (i) => Number(i >= 7);
  const settle = (reason) => {
    for (let i = 0; i < 14; i++) {
      s.scores[own(i)] += s.pits[i];
      s.pits[i] = 0;
    }
    s.over = true;
    s.reason = reason;
  };
  for (;;) {
    const marker = s.pits.join(':') + '@' + pickup;
    if (seen.has(marker) || steps >= 20000) {
      settle('relay-repeat');
      break;
    }
    seen.add(marker);
    const seeds = s.pits[pickup];
    s.pits[pickup] = 0;
    laps++;
    for (let offset = 1; offset <= 14; offset++)
      s.pits[(pickup + offset) % 14] += Math.floor((seeds + 14 - offset) / 14);
    steps += seeds;
    const following = (pickup + seeds + 1) % 14;
    if (s.pits[following]) {
      pickup = following;
      continue;
    }
    const taken = (following + 1) % 14;
    captured = s.pits[taken];
    s.pits[taken] = 0;
    s.scores[s.turn] += captured;
    break;
  }
  s.moves++;
  if (!s.over) {
    s.turn = 1 - s.turn;
    if (s.pits.every((x) => x === 0)) {
      s.over = true;
      s.reason = 'captured';
    } else if (!s.pits.some((v, i) => v > 0 && own(i) === s.turn)) settle('no-move');
    else {
      const marker = `${s.turn}|${s.pits.join(',')}|${s.scores.join(',')}`;
      s.seen[marker] = (s.seen[marker] || 0) + 1;
      if (s.seen[marker] >= 3) settle('threefold');
    }
  }
  return { state: s, captured, laps, player: input.turn };
}
function compare(s, p, withFrames = false) {
  const before = clone(s),
    actual = playMove(s, p, { frames: withFrames }),
    expected = reference(s, p);
  assert.deepEqual(s, before, 'must not mutate caller');
  assert.deepEqual(actual.state, expected.state);
  assert.equal(actual.captured, expected.captured);
  assert.equal(actual.laps, expected.laps);
  assert.equal(sum(actual.state), sum(before));
  if (withFrames) {
    for (const f of actual.events)
      assert.equal(
        sum(f) + f.hand,
        sum(before),
        'every animation frame conserves seeds including hand',
      );
  }
  return actual;
}
const fixture = (name, pits, start, expected, cap) => {
  const s = custom(pits),
    r = compare(s, start, true);
  assert.deepEqual(r.state.pits, expected, name);
  assert.equal(r.captured, cap);
  console.log(name + ': passed');
};
fixture(
  'opening from bottom left',
  Array(14).fill(4),
  0,
  [2, 1, 7, 7, 7, 0, 7, 0, 0, 6, 1, 6, 6, 0],
  6,
);
fixture('relay from next pit', from({ 0: 1, 2: 1, 5: 3, 7: 1 }), 0, from({ 1: 1, 3: 1, 7: 1 }), 3);
fixture('four seeds stay on board', from({ 0: 1, 1: 3, 3: 2, 7: 1 }), 0, from({ 1: 4, 7: 1 }), 2);
fixture('cross-row sow and capture', from({ 6: 1, 9: 2, 10: 1 }), 6, from({ 7: 1, 10: 1 }), 2);
const end = compare(custom(from({ 4: 1, 7: 3 })), 4, true);
assert.equal(end.state.over, true);
assert.equal(end.state.reason, 'no-move');
assert.deepEqual(end.state.scores, [4, 0]);
assert.deepEqual(end.state.pits, Array(14).fill(0));
console.log('no-move settlement: passed');
let repeated = custom(from({ 0: 1, 2: 1, 5: 3, 7: 1 }));
const first = playMove(repeated, 0, { frames: false }).state;
repeated.seen[key(first)] = 2;
const repeatResult = compare(repeated, 0, true);
assert.equal(repeatResult.state.reason, 'threefold');
assert.equal(repeatResult.state.over, true);
console.log('third occurrence settlement: passed');
const stress = custom([3, 2, 7, 6, 5, 6, 2, 4, 5, 4, 3, 4, 3, 2]);
const guarded = compare(stress, 5, true);
assert.equal(guarded.state.reason, 'relay-repeat');
assert.equal(guarded.state.over, true);
assert.equal(sum(guarded.state), 56);
assert.equal(guarded.events.at(-1).hand, 0);
console.log(
  JSON.stringify({
    guard: 'passed',
    frames: guarded.events.length,
    laps: guarded.laps,
    scores: guarded.state.scores,
  }),
);
const s = initialState();
for (const illegal of [-1, 7, 13, 14, 0.5, NaN, '0', null])
  assert.throws(() => playMove(s, illegal));
const blank = custom(from({ 1: 1, 7: 1 }));
assert.throws(() => playMove(blank, 0));
const over = { ...s, over: true };
assert.deepEqual(legalMoves(over), []);
assert.equal(chooseMove(over), null);
console.log('illegal moves: passed');
let seed = 3711511;
function rand(n) {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed % n;
}
let randomChecks = 0,
  guards = 0;
const startTime = Date.now();
for (let i = 0; i < 3000; i++) {
  const pits = Array(14).fill(0);
  for (let j = 0; j < 56; j++) pits[rand(14)]++;
  const turn = rand(2),
    state = custom(pits, turn);
  const choices = legalMoves(state);
  const start = choices[rand(choices.length)];
  const r = compare(state, start);
  randomChecks++;
  guards += Number(r.state.reason === 'relay-repeat');
}
console.log(JSON.stringify({ randomChecks, guards, ms: Date.now() - startTime }));
let gameMoves = 0,
  maxGameMoves = 0,
  reasons = {};
for (let game = 0; game < 100; game++) {
  let current = initialState(),
    moves = 0;
  while (!current.over && moves < 2000) {
    let choices = legalMoves(current);
    assert.ok(choices.length);
    current = compare(current, choices[rand(choices.length)]).state;
    moves++;
  }
  assert.ok(current.over, 'random game terminated');
  gameMoves += moves;
  maxGameMoves = Math.max(maxGameMoves, moves);
  assert.equal(sum(current), 56);
  reasons[current.reason] = (reasons[current.reason] || 0) + 1;
}
console.log(JSON.stringify({ games: 100, gameMoves, maxGameMoves, reasons }));
const aiStart = Date.now(),
  ai = chooseMove(initialState());
assert.ok(legalMoves(initialState()).includes(ai));
console.log(JSON.stringify({ ai, aiMs: Date.now() - aiStart }));
