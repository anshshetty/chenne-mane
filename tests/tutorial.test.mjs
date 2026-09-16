import assert from 'node:assert/strict';
import { practiceMove, winningMove, lessonSteps } from '../dist/tutorial.mjs';
import { legalMoves } from '../dist/engine.mjs';

const total = (frame) =>
  frame.pits.reduce((a, b) => a + b, 0) + frame.scores[0] + frame.scores[1] + (frame.hand || 0);
const steps = lessonSteps();
const practice = practiceMove();
const finish = winningMove();

// Checkpoint grouping must neither skip nor repeat any rule-engine event.
assert.equal(steps.length, 6);
assert.deepEqual(
  steps.slice(0, 5).flatMap((step) => step.events),
  practice.events,
);
for (let i = 1; i < 5; i++) {
  assert.deepEqual(steps[i].before, steps[i - 1].events.at(-1));
}
for (const step of steps) {
  const expectedTotal = step.finish ? 56 : 18;
  assert.equal(total(step.before), expectedTotal);
  for (const frame of step.events) assert.equal(total(frame), expectedTotal);
}

// The practice capture ends a turn; it must not teach that a capture wins.
assert.equal(practice.state.over, false);
assert.equal(practice.state.turn, 1);
assert.deepEqual(practice.state.scores, [5, 0]);
assert.ok(legalMoves(practice.state).length > 0);

// A full-round example distinguishes capture points from final settlement.
assert.deepEqual(finish.initial.scores, [24, 26]);
const capture = finish.events.find((frame) => frame.kind === 'capture');
assert.equal(capture.captured, 5);
assert.deepEqual(capture.scores, [29, 26]);
assert.equal(
  capture.pits.reduce((a, b) => a + b, 0),
  1,
);
assert.equal(finish.events.at(-1).kind, 'settle');
assert.equal(finish.state.reason, 'no-move');
assert.equal(finish.state.over, true);
assert.deepEqual(finish.state.scores, [30, 26]);
assert.deepEqual(finish.state.pits, Array(14).fill(0));
assert.deepEqual(steps[5].events, finish.events);
console.log('Lesson continuity, shell conservation, turn ending and 30–26 finish: passed');
