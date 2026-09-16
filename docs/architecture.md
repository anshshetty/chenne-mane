# Architecture and engineering decisions

Chenne Mane uses native JavaScript modules, HTML, CSS, and static images. It has no
build step, bundler, backend, or runtime npm packages. Editable files live in
`dist/` and are committed to Git. A static server serves that directory directly.
The directory name preserves compatibility with the existing hosting setup; the
files inside it are authored source. Documentation, tests, and development tools
stay outside the served directory.

## One move, two representations

```text
UI or browser tool → app.js → engine.playMove(state, pit)
                               ├── next state
                               └── pickup / drop / relay / capture events
                                      ↓
                              motion + sound + DOM
```

`engine.mjs` clones the input and calculates the entire turn before animation. It
returns the next state and optional event snapshots. Each snapshot includes shells
held in the hand, so the total on the board, in stores, and in hand stays constant.

`app.js` presents those events automatically or waits for player input. A move
generation counter (`epoch`) invalidates interrupted animation work. The final
state is committed only when the active move finishes. This keeps manual sowing,
skipping animation, undo, and cancellation consistent with the same calculation.
On a back/forward-cache transition, an unfinished move returns to the last completed
turn instead of leaving a partially sown board.

## Main modules

| Module                      | Responsibility                                                        |
| --------------------------- | --------------------------------------------------------------------- |
| `engine.mjs`                | Legal moves, relay sowing, capture, settlement, immutable transitions |
| `bot.mjs`                   | Random, immediate-score, and opponent-reply move selection            |
| `app.js`                    | Live game state, input, dialogs, undo, scheduling, browser tools      |
| `motion.mjs`, `shells.mjs`  | Shell trajectories and deterministic resting positions                |
| `setup.mjs`                 | Preference normalization and an isolated practice board               |
| `tutorial.mjs`              | Six teaching checkpoints and a complete end-of-round example          |
| `fullscreen.mjs`            | Native/fallback fullscreen, focus, viewport, and exit lifecycle       |
| `audio.mjs`, `features.mjs` | Synthesized shell effects and optional music support                  |
| `guide.mjs`, `heritage.mjs` | Concise rules, context, and optional cultural material                |

## Bot tradeoffs

Easy chooses a legal move randomly. Medium chooses the best immediate score
difference. Hard considers every legal reply from the opponent and prefers the move
with the best worst-case reply, with a small immediate-score tie-break term. This is
a shallow game-tree search, not a learned model or a solved optimal strategy.

Search calls `playMove` with `frames: false` to avoid allocating animation snapshots.
At most seven initial choices and seven immediate replies keep the search small.

## Traditional rules and digital conventions

The selected variant starts with four shells in each of fourteen pits. Stores do
not participate in sowing. Relay pickup and capture follow the documented next-pit
rules in [game rules and sources](rules.md).

The digital version must also terminate when a player has no move, the position
occurs three times, or a relay repeats/reaches its safety limit. Remaining shells
then go to each row's owner. These are explicit digital conventions, not a claim
that every family plays this way. Traditional redistribution rounds are not yet
implemented.

## Verification and limits

`npm test` runs all test files using Node's built-in test runner. The engine tests
compare against an independently written arithmetic sowing oracle across 3,000
generated positions and 100 complete games. They also check illegal input, input
immutability, repetitions, and shell conservation during animation.

Other tests cover bot decisions, normalized preferences, all 0–56 shell pile sizes,
tutorial continuity, and fullscreen lifecycle with simulated browser objects.
These tests do not replace real browser interaction or physical-device testing.
Source-export tests check that only reviewed files are copied and reject private
paths and symlinks.

The game deliberately has no saved matches, online multiplayer, or analytics.
Preferences survive refresh; the current game does not. Keep new services separate
from the deterministic engine if those capabilities are added later.

Music support is disabled in `dist/features.mjs`; recordings are not bundled.
Enabling it requires supplying licensed recordings, a manifest, and their credits.
