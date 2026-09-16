import { initialState, playMove, key, owner } from './engine.mjs';
import { ShellMotion } from './motion.mjs?v=13';
import { patchPile as pile } from './shells.mjs?v=13';
const columns = [21.8, 31.3, 40.7, 50.1, 59.5, 69, 78.5];
const position = (i) => ({ x: columns[i < 7 ? i : 13 - i], y: i < 7 ? 68.7 : 27.8 });
const pitLabel = (i) => `${i < 7 ? 'bottom' : 'top'} pit ${i < 7 ? i + 1 : 14 - i}`;
const shells = (n) => `${n} shell${n === 1 ? '' : 's'}`;
export function practiceMove() {
  const state = initialState();
  state.pits = [4, 1, 0, 2, 0, 2, 1, 0, 0, 5, 0, 3, 0, 0];
  state.scores = [0, 0];
  state.seen = { [key(state)]: 1 };
  return { initial: state, ...playMove(state, 0) };
}
export function winningMove() {
  const state = initialState();
  state.pits = [1, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  state.scores = [24, 26];
  state.seen = { [key(state)]: 1 };
  return { initial: state, ...playMove(state, 0) };
}
export function lessonSteps() {
  const practice = practiceMove(),
    e = practice.events,
    winning = winningMove();
  return [
    {
      name: 'Pick up',
      before: practice.initial,
      events: e.slice(0, 1),
      target: 0,
      title: 'Choose a pit on your side.',
      description:
        'Tap the glowing pit, or the button below. All four shells will move into your hand.',
      action: 'Pick up 4 shells',
      resultTitle: 'Four shells are now in your hand.',
      result:
        'That pit is empty. Your score stays at 0: only collected shells in your end bowl count.',
    },
    {
      name: 'Sow',
      before: e[0],
      events: e.slice(1, 5),
      target: 1,
      title: 'Place one shell in each next pit.',
      description:
        'Watch four shells go one by one to the right along your row. These drops do not score points.',
      action: 'Sow the 4 shells',
      resultTitle: 'Your hand is empty. Keep looking.',
      result:
        'You placed one shell in each of the next four pits. Now check the pit AFTER your last drop.',
    },
    {
      name: 'Continue',
      before: e[4],
      events: e.slice(5, 6),
      target: 5,
      title: 'The next pit has shells.',
      description: 'Pick up its two shells and keep sowing. This continues the same turn.',
      action: 'Pick up the next 2 shells',
      resultTitle: 'Two more shells, still your turn.',
      result:
        'When your hand is empty and the next pit is occupied, you pick up that whole pile and continue.',
    },
    {
      name: 'Cross rows',
      before: e[5],
      events: e.slice(6, 8),
      target: 6,
      title: 'Go around the end of the board.',
      description:
        'Place these two shells in the next two small pits, crossing onto the top row. Skip the large end bowl.',
      action: 'Sow the 2 shells',
      resultTitle: 'You can sow into both rows.',
      result:
        'Your last shell landed in the top-right pit. Your hand is empty again, so check the next pit to its left.',
    },
    {
      name: 'Collect',
      before: e[7],
      events: e.slice(8, 10),
      target: 9,
      gap: 8,
      title: 'An empty pit lets you collect.',
      description:
        'The next pit is empty. Take the five shells from the pit just beyond that gap. Then your turn ends.',
      action: 'Collect the 5 shells',
      resultTitle: 'Five scored. Your turn is complete.',
      result:
        'Those five shells moved into your end bowl. The other player goes next. Keep taking turns to collect more.',
    },
    {
      name: 'Win',
      before: winning.initial,
      events: winning.events,
      target: 0,
      finish: true,
      title: 'Now try an example finish.',
      description:
        'Later in a round: you have 24, the other player has 26, and six shells remain. Watch this final turn.',
      action: 'Play the final turn',
      resultTitle: '30–26. You win!',
      result:
        'You captured five to reach 29. They have no pit to play, so your last shell is collected too. Your 30 beats their 26. Equal final scores draw.',
    },
  ];
}
export const tutorialHTML = `<div class="lesson-heading"><h2 id="dialog-title">Learn by playing</h2></div><p class="lesson-goal"><strong>Your goal</strong> Collect more shells than the other player.</p><div class="lesson-table"><p id="lesson-context" class="lesson-context">Practice turn · fewer shells to learn with</p><div class="lesson-row-label">OTHER PLAYER’S ROW <span>←</span></div><div id="lesson-board" class="board"><img class="board-art" src="/assets/antique-board.webp" alt="Practice Chenne Mane board with seven pits on each side" draggable="false"><div class="store store-left" id="lesson-store-1"></div><div class="store store-right" id="lesson-store-0"></div>${Array.from(
  { length: 14 },
  (_, i) => {
    const p = position(i);
    return `<button id="lesson-pit-${i}" class="pit ${i > 6 ? 'pit-upper' : ''}" data-lesson-pit="${i}" style="left:${p.x}%;top:${p.y}%"><span class="shells"></span><span class="pit-count"></span></button>`;
  },
).join(
  '',
)}</div><div class="lesson-row-label">YOUR ROW <span>→</span></div><div class="lesson-score"><span id="lesson-held">0 in hand</span><span>You <strong id="lesson-score">0</strong></span><span>Other player <strong id="lesson-opponent-score">0</strong></span></div></div><section class="lesson-coach" data-phase="before" aria-label="Current lesson instruction"><div class="lesson-step-line"><span id="lesson-phase">YOUR ACTION</span><span id="lesson-step">Step 1 of 6 · Pick up</span></div><progress id="lesson-progress" max="6" value="0" aria-label="Completed lesson steps"></progress><div id="lesson-message" role="status" aria-live="polite" aria-atomic="true"><h3 id="lesson-title"></h3><p id="lesson-description"></p></div><div class="lesson-actions"><button class="primary-button" id="lesson-next" aria-describedby="lesson-title lesson-description">Pick up 4 shells</button><button class="text-button" id="lesson-replay" hidden>Try this step again</button></div><p id="lesson-pacing" class="lesson-pacing">The lesson waits for you after every action.</p></section><div class="lesson-links"><button class="text-button" id="lesson-restart">Start over</button><button class="text-button" data-guide="rules">Quick rules</button><button class="text-button" id="lesson-return">Back to game</button></div>`;
export function mountTutorial(root, { onReturn = () => {}, impact = () => {} } = {}) {
  const $ = (s) => root.querySelector(s),
    board = $('#lesson-board'),
    motion = new ShellMotion(board, position, 'lesson-pit-'),
    steps = lessonSteps();
  let stage = 0,
    phase = 'before',
    busy = false,
    version = 0,
    destroyed = false,
    display = steps[0].before,
    notice = null;
  const nextButton = $('#lesson-next'),
    replay = $('#lesson-replay'),
    coach = $('.lesson-coach');
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function draw(frame) {
    if (destroyed) return;
    display = frame;
    for (let i = 0; i < 14; i++) {
      const button = $(`#lesson-pit-${i}`);
      pile(button.querySelector('.shells'), frame.pits[i], i);
      button.querySelector('.pit-count').textContent = String(frame.pits[i]);
      button.setAttribute('aria-label', `${pitLabel(i)}, ${shells(frame.pits[i])}`);
    }
    for (let p = 0; p < 2; p++)
      pile(
        $(`#lesson-store-${p}`),
        frame.scores[p],
        p + 18,
        frame.storeCapacities?.[p] ?? frame.scores[p],
      );
    $('#lesson-held').textContent = `${frame.hand || 0} in hand`;
    $('#lesson-score').textContent = frame.scores[0];
    $('#lesson-opponent-score').textContent = frame.scores[1];
  }
  function prompt() {
    if (destroyed) return;
    const step = steps[stage],
      after = phase === 'after',
      upcoming = after ? steps[stage + 1] : null;
    coach.dataset.phase = phase;
    $('#lesson-phase').textContent = busy
      ? 'WATCH THE SHELLS'
      : after
        ? 'WHAT HAPPENED'
        : 'YOUR ACTION';
    $('#lesson-step').textContent = `Step ${stage + 1} of ${steps.length} · ${step.name}`;
    $('#lesson-progress').value = stage + (after ? 1 : 0);
    $('#lesson-progress').setAttribute(
      'aria-valuetext',
      `${stage + (after ? 1 : 0)} of ${steps.length} steps completed`,
    );
    $('#lesson-title').textContent = after ? step.resultTitle : step.title;
    $('#lesson-description').textContent = after ? step.result : step.description;
    $('#lesson-message').scrollTop = 0;
    $('#lesson-context').textContent = step.finish
      ? 'Example near the end of a full round'
      : 'Practice turn · fewer shells to learn with';
    nextButton.textContent = busy
      ? 'Moving shells…'
      : after
        ? stage === steps.length - 1
          ? 'Back to my game'
          : upcoming.action
        : step.action;
    nextButton.setAttribute('aria-disabled', String(busy));
    replay.hidden = !after;
    $('#lesson-pacing').textContent = after
      ? upcoming
        ? 'Tap the next action when you’re ready.'
        : 'Lesson complete. Return to your game when you’re ready.'
      : busy
        ? 'Watch the board. Your result will appear here.'
        : 'The lesson waits for you after every action.';
    for (const button of root.querySelectorAll('[data-lesson-pit]')) {
      const pit = Number(button.dataset.lessonPit),
        actionStep = upcoming || step,
        target = pit === actionStep.target,
        available = !busy && (!after || Boolean(upcoming && !upcoming.finish));
      button.disabled = !available || !target;
      button.classList.toggle('awaiting', available && target);
      button.classList.toggle('lesson-gap', available && pit === actionStep.gap);
      button.classList.remove('sowing');
    }
    coach.classList.toggle('lesson-won', after && step.finish);
  }
  function showStage(index) {
    version++;
    notice?.cancel();
    notice = null;
    motion.clear();
    stage = index;
    phase = 'before';
    busy = false;
    draw(steps[stage].before);
    if (display.hand) motion.held(display.hand, motion.hover(display.pit));
    prompt();
    nextButton.focus({ preventScroll: true });
  }
  async function step(pit = null) {
    if (destroyed || busy) return;
    if (phase === 'after') {
      if (stage === steps.length - 1) {
        if (pit === null) onReturn();
        return;
      }
      const next = steps[stage + 1];
      if (pit !== null && (next.finish || pit !== next.target)) return;
      showStage(stage + 1);
    }
    const selected = steps[stage];
    if (pit !== null && pit !== selected.target) return;
    const token = version;
    busy = true;
    phase = 'animating';
    if (document.activeElement?.matches?.('[data-lesson-pit]'))
      nextButton.focus({ preventScroll: true });
    prompt();
    const valid = () => token === version && !destroyed,
      safeDraw = (f) => {
        if (valid()) draw(f);
      },
      safeImpact = (flag) => {
        if (valid()) impact(flag);
      };
    for (const frame of selected.events) {
      if (!valid()) return;
      const duration = reduced() ? 0 : 440;
      for (const button of root.querySelectorAll('[data-lesson-pit]'))
        button.classList.toggle('sowing', Number(button.dataset.lessonPit) === frame.pit);
      if (!duration) {
        draw(frame);
        motion.held(frame.hand || 0, motion.hover(frame.pit));
      } else if (frame.kind === 'pickup' || frame.kind === 'relay')
        await motion.pickup(frame, duration, safeDraw);
      else if (frame.kind === 'drop') await motion.drop(frame, duration, safeDraw, safeImpact);
      else if (frame.kind === 'capture')
        await motion.capture(frame, 0, duration, safeDraw, safeImpact);
      else if (frame.kind === 'empty') {
        draw(frame);
        await new Promise((resolve) => setTimeout(resolve, 850));
      } else if (frame.kind === 'settle') {
        const remaining = [...display.pits];
        for (let i = 0; i < 14; i++) {
          if (!valid()) return;
          if (!remaining[i]) continue;
          const pits = [...display.pits],
            scores = [...display.scores];
          pits[i] = 0;
          scores[owner(i)] += remaining[i];
          await motion.capture(
            { ...frame, kind: 'capture', pit: i, pits, scores, captured: remaining[i] },
            owner(i),
            duration,
            safeDraw,
            safeImpact,
          );
        }
        safeDraw(frame);
      }
    }
    if (!valid()) return;
    busy = false;
    phase = 'after';
    prompt();
    if (!reduced()) {
      notice = coach.animate(
        [
          { boxShadow: '0 0 0 0 #dfbb7900' },
          { boxShadow: '0 0 0 5px #dfbb7955' },
          { boxShadow: '0 0 0 0 #dfbb7900' },
        ],
        { duration: 700 },
      );
      void notice.finished.catch(() => {});
    }
  }
  nextButton.addEventListener('click', () => void step());
  replay.addEventListener('click', () => showStage(stage));
  $('#lesson-restart').addEventListener('click', () => showStage(0));
  $('#lesson-return').addEventListener('click', onReturn);
  for (const button of root.querySelectorAll('[data-lesson-pit]'))
    button.addEventListener('click', () => void step(Number(button.dataset.lessonPit)));
  draw(display);
  prompt();
  return {
    destroy() {
      destroyed = true;
      version++;
      notice?.cancel();
      motion.clear();
    },
    getState() {
      return {
        stage,
        phase,
        busy,
        pits: [...display.pits],
        scores: [...display.scores],
        hand: display.hand || 0,
        complete: stage === steps.length - 1 && phase === 'after',
      };
    },
  };
}
