import assert from 'node:assert/strict';
import { shellLayout, shellHTML, SHELL_BOARD_RATIO, handPreviewCount } from '../dist/shells.mjs';
import { flightFrames } from '../dist/motion.mjs';

// Adding or removing shells must leave the others at their original position
// and orientation. A full bowl has all its shells, naturally layered in place.
for (const [kind, diameter] of [
  ['pit', 0.0672],
  ['store', 0.13],
  ['hand', 0.055],
]) {
  for (let count = 0; count <= 56; count++)
    for (let seed = 0; seed < 21; seed++) {
      const layout = shellLayout(count, seed, kind);
      assert.equal(layout.length, count);
      if (count) assert.deepEqual(layout.slice(0, -1), shellLayout(count - 1, seed, kind));
      for (const p of layout) {
        assert.ok([p.x, p.y, p.rotation].every(Number.isFinite));
        if (kind !== 'hand' || count <= 4)
          assert.ok(
            (Math.hypot(p.x, p.y) / 100) * diameter + SHELL_BOARD_RATIO / 2 <= diameter / 2,
            'Shells stay within their bowl or hand footprint',
          );
      }
    }
}
for (let count = 0; count <= 56; count++) {
  const markup = shellHTML(count);
  assert.equal((markup.match(/class="shell"/g) || []).length, count);
  assert.equal((markup.match(/--shell-ratio:0\.027;/g) || []).length, count);
  assert.equal(handPreviewCount(count), Math.min(count, 4));
}
const flight = flightFrames({ x: 0, y: 0 }, { x: 100, y: 60 }, 24, 35, 70);
assert.ok(
  flight.every((f) => f.transform.includes('scale(1)')),
  'Shells do not inflate or shrink while moving',
);
console.log(
  'All 0–56 piles retain their counts and resting positions; shell size is fixed and the hand is capped at four.',
);
