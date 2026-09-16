import { initialState, playMove } from './engine.mjs';
import { ShellMotion } from './motion.mjs?v=13';
import { patchPile } from './shells.mjs?v=13';

export function normalizePreferences(value = {}) {
  return {
    mode: value.mode === 'friend' ? 'friend' : 'solo',
    sowing: value.sowing === 'manual' ? 'manual' : 'auto',
    speed: ['220', '80', '0'].includes(String(value.speed)) ? String(value.speed) : '220',
    difficulty: ['easy', 'medium', 'hard'].includes(value.difficulty) ? value.difficulty : 'medium',
    pauseRelay: value.pauseRelay !== false && value.pauseRelay !== 'false',
  };
}
export const animationDuration = (speed, reduced = false) =>
  reduced ? 0 : ({ '220': 360, '80': 170, '0': 0 }[String(speed)] ?? 360);
const xs = [21.8, 31.3, 40.7, 50.1, 59.5, 69, 78.5];
const position = (i) => ({ x: xs[i < 7 ? i : 13 - i], y: i < 7 ? 68.7 : 27.8 });
const choices = (name, items) =>
  items
    .map(
      ([value, label]) =>
        `<label class="setup-choice"><input type="radio" name="setup-${name}" value="${value}"><span>${label}</span></label>`,
    )
    .join('');
export const setupHTML = `<div class="setup-heading"><h2 id="dialog-title">Set up your game</h2><p>Make yourself at home. Try the choices below.</p></div>
<div class="setup-options">
 <fieldset><legend>Who’s playing?</legend><div class="setup-choices">${choices('mode', [
   ['solo', 'Solo'],
   ['friend', 'With a friend'],
 ])}</div><p id="setup-mode-help">You against the Bot.</p></fieldset>
 <fieldset id="setup-difficulty"><legend>Bot difficulty</legend><div class="setup-choices">${choices(
   'difficulty',
   [
     ['easy', 'Easy'],
     ['medium', 'Medium'],
     ['hard', 'Hard'],
   ],
 )}</div><p id="setup-difficulty-help">A balanced challenge. The Bot looks for captures.</p></fieldset>
 <fieldset><legend>How would you like to sow?</legend><div class="setup-choices">${choices(
   'sowing',
   [
     ['auto', 'Automatic'],
     ['manual', 'Hands-on'],
   ],
 )}</div><p id="setup-sowing-help">Shells are placed for you. You pick up each next handful.</p><label id="setup-relay-option" class="setup-relay-option"><input id="setup-pause-relay" type="checkbox" checked><span>Tap next pickup<small>Pause when your hand is empty. Tap the glowing pit to keep sowing.</small></span></label></fieldset>
 <fieldset><legend>How fast should shells move?</legend><div class="setup-choices">${choices(
   'speed',
   [
     ['220', 'Relaxed'],
     ['80', 'Quick'],
     ['0', 'Instant'],
   ],
 )}</div><p id="setup-speed-help">Unhurried shell movements.</p></fieldset>
</div>
<section class="setup-preview" id="setup-preview" aria-label="Try your settings on a practice board">
 <div class="setup-preview-heading"><span id="setup-preview-label">AUTOMATIC · TAP PICKUPS</span><span id="setup-player-label">You · Bot</span></div>
 <div id="setup-board" class="board"><img class="board-art" src="/assets/antique-board.webp" alt="Small wooden board for trying sowing and the next pickup" draggable="false">${Array.from(
   { length: 14 },
   (_, i) => {
     const p = position(i);
     return `<button id="setup-pit-${i}" class="pit ${i > 6 ? 'pit-upper' : ''}" data-setup-pit="${i}" style="left:${p.x}%;top:${p.y}%" disabled><span class="shells"></span><span class="pit-count"></span></button>`;
   },
 ).join('')}</div>
 <div class="setup-feedback" role="status" aria-live="polite" aria-atomic="true"><strong id="setup-message">Watch the first handful.</strong><span id="setup-progress">A short example with two pickups.</span></div>
 <div class="setup-demo-actions"><button id="setup-action" class="setup-action" aria-describedby="setup-message">Pick up &amp; sow</button><button id="setup-replay" class="text-button">Replay example</button></div>
</section>
<p id="setup-notice" class="setup-notice"></p>
<div class="setup-footer"><button class="primary-button" id="setup-save">Start playing</button><span>Remembered on this device.<br>Change anytime in Settings.</span></div>`;

export function mountSetup(
  root,
  {
    preferences = {},
    newGame = false,
    hasRound = false,
    automaticTurn = false,
    firstVisit = false,
    onSave = () => {},
  } = {},
) {
  const $ = (s) => root.querySelector(s),
    draft = normalizePreferences(preferences),
    board = $('#setup-board'),
    motion = new ShellMotion(board, position, 'setup-pit-');
  const initial = initialState();
  initial.pits = Array(14).fill(0);
  initial.pits[0] = 4;
  initial.pits[5] = 2;
  const frames = playMove(initial, 0).events.slice(0, 8);
  let version = 0,
    destroyed = false,
    busy = false,
    target = null,
    display = initial,
    step = 0,
    speedDemo = false,
    keyboardPit = false;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pauses = (frame) =>
    !speedDemo && (draft.sowing === 'manual' || (draft.pauseRelay && frame?.kind === 'relay'));
  function draw(frame) {
    display = frame;
    for (let i = 0; i < 14; i++) {
      const button = $(`#setup-pit-${i}`);
      patchPile(button.querySelector('.shells'), frame.pits[i], i);
      button.querySelector('.pit-count').textContent = frame.pits[i] || '';
      button.setAttribute(
        'aria-label',
        `Example ${i < 7 ? 'bottom' : 'top'} pit ${i < 7 ? i + 1 : 14 - i}, ${frame.pits[i]} shells`,
      );
    }
  }
  function prompt() {
    if (destroyed) return;
    const finished = step === frames.length,
      frame = frames[step],
      manual = draft.sowing === 'manual',
      relay = frame?.kind === 'relay';
    target = !busy && !finished && pauses(frame) ? frame.pit : null;
    for (const button of root.querySelectorAll('[data-setup-pit]')) {
      const active = Number(button.dataset.setupPit) === target;
      button.disabled = !active;
      button.classList.toggle('awaiting', active);
    }
    $('#setup-preview-label').textContent = speedDemo
      ? 'SPEED PREVIEW'
      : manual
        ? 'TRY HANDS-ON'
        : draft.pauseRelay
          ? 'AUTOMATIC · TAP PICKUPS'
          : 'AUTOMATIC · CONTINUOUS';
    $('#setup-message').textContent = finished
      ? 'Both handfuls sown. The same turn continued.'
      : busy
        ? 'Watch each shell land in the next pit.'
        : relay
          ? 'Your hand is empty. Pick up the 2 shells in the glowing pit.'
          : step === 0
            ? 'Tap the glowing pit to pick up 4 shells.'
            : 'Tap the next glowing pit to place one shell.';
    $('#setup-progress').textContent = finished
      ? speedDemo
        ? 'Only the speed was shown. Replay to try your sowing style.'
        : 'In the game, an empty next pit leads to collecting and ends your turn.'
      : relay
        ? 'Tap the pit or Pick up & sow. This is still your turn.'
        : `${display.hand || 0} in hand · ${frames.slice(0, step).filter((f) => f.kind === 'drop').length} of 6 placed`;
    const action = $('#setup-action');
    action.textContent = busy
      ? 'Sowing…'
      : finished
        ? 'Try again'
        : relay
          ? 'Pick up & sow 2'
          : step === 0
            ? 'Pick up 4 shells'
            : 'Place one shell';
    action.setAttribute('aria-disabled', String(busy || (!finished && target === null)));
    action.hidden = false;
    if (keyboardPit && !busy)
      (target === null ? action : $(`#setup-pit-${target}`)).focus({ preventScroll: true });
  }
  function updateChoices() {
    for (const name of ['mode', 'difficulty', 'sowing', 'speed'])
      for (const input of root.querySelectorAll(`[name="setup-${name}"]`)) {
        input.checked = input.value === draft[name];
        input.closest('label').classList.toggle('selected', input.checked);
      }
    $('#setup-difficulty').hidden = draft.mode !== 'solo';
    $('#setup-difficulty-help').textContent = {
      easy: 'A gentle start. The Bot chooses a pit without planning ahead.',
      medium: 'A balanced challenge. The Bot looks for captures.',
      hard: 'A tougher game. The Bot considers your best reply.',
    }[draft.difficulty];
    $('#setup-mode-help').textContent =
      draft.mode === 'solo' ? 'You against the Bot.' : 'Two people taking turns on this device.';
    $('#setup-player-label').textContent =
      draft.mode === 'solo' ? 'You · Bot' : 'Player 1 · Player 2';
    $('#setup-relay-option').hidden = draft.sowing !== 'auto';
    $('#setup-pause-relay').checked = draft.pauseRelay;
    $('#setup-sowing-help').textContent =
      draft.sowing === 'manual'
        ? 'Pick up a pit, then tap each glowing pit to place a shell.'
        : draft.pauseRelay
          ? 'Shells are placed for you. You pick up each next handful.'
          : 'Choose a starting pit. Watch the whole turn, including every pickup.';
    $('#setup-speed-help').textContent = reduced()
      ? 'Your device’s reduced-motion setting keeps shell movements instant.'
      : {
          '220': 'Unhurried shell movements.',
          '80': 'The same movements, at a quicker pace.',
          '0': 'Shells appear in place, without flying.',
        }[draft.speed];
    const replaces = hasRound && (newGame || draft.mode !== preferences.mode);
    $('#setup-notice').textContent = replaces
      ? 'Starting this game will replace your current round.'
      : automaticTurn
        ? 'The current turn finishes automatically. Your choices apply on your next turn.'
        : hasRound
          ? 'Your current round will be kept.'
          : 'Same traditional board. Your way to play.';
    $('#setup-save').textContent = replaces
      ? 'Start new game'
      : firstVisit || newGame
        ? 'Start playing'
        : 'Save settings';
  }
  function restart({ timing = false, autoplay = false } = {}) {
    version++;
    motion.clear();
    busy = false;
    step = 0;
    speedDemo = timing;
    draw(initial);
    prompt();
    if (draft.sowing === 'auto' || timing || autoplay) void perform();
  }
  async function perform(pit = null) {
    if (destroyed || busy || (pit !== null && pit !== target)) return;
    if (step === frames.length) {
      restart();
      return;
    }
    const token = version,
      valid = () => !destroyed && version === token;
    do {
      const frame = frames[step],
        duration = animationDuration(draft.speed, reduced());
      busy = true;
      prompt();
      const safeDraw = (f) => {
        if (valid()) draw(f);
      };
      if (!duration) {
        draw(frame);
        motion.held(frame.hand, motion.hover(frame.pit));
      } else if (frame.kind === 'pickup' || frame.kind === 'relay')
        await motion.pickup(frame, duration * 1.25, safeDraw);
      else await motion.drop(frame, duration, safeDraw, () => {});
      if (!valid()) return;
      draw(frame);
      motion.held(frame.hand || 0, motion.hover(frame.pit));
      step++;
      busy = false;
      prompt();
    } while (step < frames.length && !pauses(frames[step]));
  }
  for (const input of root.querySelectorAll('input[type="radio"]'))
    input.addEventListener('change', () => {
      if (!input.checked) return;
      keyboardPit = false;
      const name = input.name.replace('setup-', '');
      draft[name] = input.value;
      updateChoices();
      if (name === 'mode' || name === 'difficulty') return;
      restart({ timing: name === 'speed', autoplay: name === 'sowing' });
      $('#setup-preview').scrollIntoView({
        block: 'nearest',
        behavior: reduced() ? 'instant' : 'smooth',
      });
    });
  $('#setup-pause-relay').addEventListener('change', () => {
    draft.pauseRelay = $('#setup-pause-relay').checked;
    keyboardPit = false;
    updateChoices();
    restart();
  });
  for (const button of root.querySelectorAll('[data-setup-pit]'))
    button.addEventListener('click', (event) => {
      keyboardPit = event.detail === 0;
      void perform(Number(button.dataset.setupPit));
    });
  $('#setup-action').addEventListener('click', () => {
    keyboardPit = false;
    void perform();
  });
  $('#setup-replay').addEventListener('click', () => {
    keyboardPit = false;
    restart({ autoplay: true });
  });
  $('#setup-save').addEventListener('click', () => onSave({ ...draft }));
  const resize = () => {
    if (!destroyed) restart();
  };
  window.addEventListener('resize', resize);
  updateChoices();
  restart();
  return {
    destroy() {
      destroyed = true;
      version++;
      motion.clear();
      window.removeEventListener('resize', resize);
    },
    getState() {
      return {
        preferences: { ...draft },
        busy,
        target,
        step,
        speedDemo,
        pits: [...display.pits],
        hand: display.hand || 0,
      };
    },
  };
}
