import { chooseBotMove } from './bot.mjs?v=13';
import { mountFullscreen } from './fullscreen.mjs?v=13';
import { setupHTML, mountSetup, normalizePreferences, animationDuration } from './setup.mjs?v=13';
import { FEATURES } from './features.mjs';
import { tutorialHTML, mountTutorial } from './tutorial.mjs?v=13';
import { ShellMotion } from './motion.mjs?v=13';
import { shellHTML, patchPile } from './shells.mjs?v=13';
import { ShellSound, setupMusic } from './audio.mjs';
const $ = (s) => document.querySelector(s);
const icon = (name) => {
  const paths = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
    moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
    expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
    music:
      '<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>',
    book: '<path d="M12 7c-3-3-7-3-9-2v14c3-1 6-1 9 2 3-3 6-3 9-2V5c-2-1-6-1-9 2Zm0 0v14"/>',
    reset: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
    sound: '<path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    mute: '<path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6"/>',
    bulb: '<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    undo: '<path d="M8 4 3 9l5 5M3 9h11a6 6 0 0 1 0 12"/>',
    person: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    leaf: '<path d="M20 3C8 2 2 8 5 15c4 7 14 3 15-12ZM4 21 15 9"/>',
  };
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
};
const boardXs = [21.8, 31.3, 40.7, 50.1, 59.5, 69, 78.5];
const pitXY = (id) => ({ x: boardXs[id < 7 ? id : 13 - id], y: id < 7 ? 68.7 : 27.8 });
$('#app').innerHTML = `
<header class="header"><a class="brand" href="/" aria-label="Chenne Mane home"><img src="/favicon.svg" alt=""><span>CHENNE MANE</span></a><nav aria-label="Main navigation"><button class="nav-button active" id="play-nav">Play</button><button class="nav-button" id="rules-nav">How to play</button><button class="nav-button" id="story-nav">The tradition</button></nav><div class="header-tools"><span class="header-note">COASTAL KARNATAKA, INDIA</span><button id="theme-toggle" class="icon-button" aria-label="Switch to light mode">${icon('sun')}</button></div></header>
<main>
 <section class="intro"><div><p class="eyebrow"><span class="tiny-mark">✳</span> FROM THE COURTYARDS OF TULUNADU</p><h1>Chenne Mane<span>.</span></h1><p class="intro-copy">An old board. A handful of shells. One more game.</p></div><button class="text-button" id="guide-button">${icon('book')} Try a guided round ${icon('arrow')}</button></section>
 <section class="game" id="game-surface" aria-label="Chenne Mane game">
  <div class="fullscreen-bar"><span class="fullscreen-title">Chenne Mane</span><div><button id="fullscreen-help" class="text-button">How to play</button><button id="exit-fullscreen" class="exit-fullscreen" hidden>Exit full screen ${icon('close')}</button></div></div>
  <div class="game-toolbar"><div class="mode-switch" aria-label="Game mode"><button id="solo-mode" aria-pressed="true">Play solo</button><button id="friend-mode" aria-pressed="false">With a friend</button></div><div class="toolbar-right"><span class="ruleset-label">Coastal family rules <span>·</span> 4 shells / pit</span><button class="icon-button" id="fullscreen-button" aria-label="Full screen board">${icon('expand')}</button><button class="reset-button" id="new-game" aria-label="Start a new game">${icon('reset')}<span>New game</span></button></div></div>
  <div class="table-surface">
   <div class="scoreboard"><div class="player-card current" id="player-0"><span class="avatar">${icon('person')}</span><div class="player-meta"><span class="player-name" id="name-0">You</span><span class="player-side">Bottom row</span></div><strong id="score-0">0</strong><span class="score-unit">shells</span></div><div class="round-info"><span class="eyebrow">ONE ROUND · 56 SHELLS</span><span class="turn-pill" id="turn-pill">Your turn</span></div><div class="player-card" id="player-1"><span class="avatar bot-avatar">✳</span><div class="player-meta"><span class="player-name" id="name-1">Bot</span><span class="player-side">Top row</span></div><strong id="score-1">0</strong><span class="score-unit">shells</span></div></div>
   <div class="sowing-bar" aria-label="Board sowing controls"><div class="sowing-switch" role="group" aria-label="Sowing style"><button id="sowing-auto" aria-pressed="true">Automatic</button><button id="sowing-manual" aria-pressed="false">Hands-on</button></div><label class="relay-setting" id="relay-setting"><input id="pause-relay" type="checkbox" checked>Tap next pickup</label></div>
   <div class="board-scroll"><div class="board-wrap"><div class="row-caption top-caption"><span id="top-label">BOT’S ROW</span><span id="top-direction">← SOW THIS WAY</span></div><div class="board" id="board"><img class="board-art" src="/assets/antique-board.webp" alt="Antique dark wooden Chenne Mane board with fourteen carved pits and two storage bowls" draggable="false"><div class="store store-left" id="store-1" aria-label="Bot captured shells"><span class="store-caption">CAPTURED</span></div><div class="store store-right" id="store-0" aria-label="Your captured shells"><span class="store-caption">CAPTURED</span></div>${Array.from(
     { length: 14 },
     (_, id) => {
       const p = pitXY(id);
       return `<button class="pit ${id < 7 ? 'legal' : 'pit-upper'}" id="pit-${id}" data-pit="${id}" style="left:${p.x}%;top:${p.y}%" aria-label="${id < 7 ? 'Your' : 'Bot'} pit ${id < 7 ? id + 1 : 14 - id}, 4 shells" ${id > 6 ? 'disabled' : ''}><span class="shells">${shellHTML(4, id)}</span><span class="pit-count">4</span></button>`;
     },
   ).join(
     '',
   )}</div><div class="row-caption bottom-caption"><span id="bottom-label">YOUR ROW</span><span id="bottom-direction">SOW THIS WAY →</span></div></div></div>
   <div class="turn-message"><span class="turn-indicator" aria-hidden="true"></span><div><p id="status" role="status" aria-live="polite">Pick any pit on your side to begin.</p><span id="status-detail">Shells sow automatically. Tap the next pickup when your hand empties.</span></div><div class="in-hand" id="in-hand" hidden></div><button id="relay-sow-button" class="relay-sow-button" hidden>Pick up &amp; sow</button></div>
  </div>
  <div class="play-controls"><button id="sow-button" class="sow-button" hidden>Place a shell</button><span class="gesture-help" id="gesture-help">Tap a pit to pick up its shells.</span></div>
  <div class="game-footer"><div class="game-actions"><button id="hint-button" class="text-button">${icon('bulb')} Hint</button><button id="undo-button" class="text-button" disabled>${icon('undo')} Undo</button></div><button class="text-button" id="skip-animation" hidden>Finish sowing →</button><span class="move-count" id="move-count">Move 1</span><details class="game-settings" id="game-settings"><summary>Settings</summary><div class="settings-panel"><button id="preferences-button" class="preferences-button">Playing preferences <span id="preferences-summary"></span></button><div hidden><label class="play-style">Sowing <select id="interaction" aria-label="Sowing style"><option value="auto">Automatic</option><option value="manual">Hands-on</option></select></label><label class="speed-control">Animation <select id="speed" aria-label="Animation speed"><option value="220">Relaxed</option><option value="80">Quick</option><option value="0">Instant</option></select></label></div><div class="sound-setting"><span>Shell sounds</span><button class="icon-button" id="sound-button" aria-label="Turn shell sounds off" aria-pressed="true">${icon('sound')}</button></div></div></details></div>
  ${FEATURES.music ? `<div class="music-strip" id="music-strip">${icon('music')}<select id="music-track" aria-label="Coastal music"><option value="">Music off</option></select><button id="music-play" class="music-play" aria-label="Play music" disabled>▶</button><span class="music-status" role="status" aria-live="polite">Choose a coastal recording.</span><label class="volume">Volume <input id="music-volume" aria-label="Music volume" type="range" min="0" max="100" value="25"></label><button id="music-credit" class="music-credit" aria-expanded="false" aria-controls="music-notes">About this music</button></div><div id="music-notes" class="music-notes" hidden></div>` : ''}
 </section>
 <section class="learn-strip" aria-label="Learn and discover"><button class="text-button" id="full-rules">${icon('book')} Learn by playing</button><button class="text-button" id="heritage-invitation">Our tradition</button></section>
</main><footer class="site-footer"><span>A little piece of Tulunadu, kept in play.</span><button id="sources-button">About this game</button></footer>
<dialog id="info-dialog" aria-labelledby="dialog-title"><div class="dialog-top"><span class="eyebrow">CHENNE MANE</span><button class="icon-button" id="close-dialog" aria-label="Close">${icon('close')}</button></div><div id="dialog-content"></div></dialog>
`;

const { initialState, playMove, legalMoves, chooseMove, clone, owner } =
  await import('./engine.mjs');
let state = initialState(),
  mode = 'solo',
  busy = false,
  epoch = 0,
  history = [],
  botTimer = null,
  skipAnimation = false;
let difficulty = 'medium',
  pauseRelay = true,
  interactiveTurn = false;
let visualFrame = null,
  awaitingPit = null,
  pendingStep = null,
  holdSow = false,
  manualTurn = false,
  tutorial = null,
  setup = null,
  heritageRequest = 0;
let boardGesture = null,
  suppressBoardClick = false,
  keyboardBoardPlay = false;
const portraitQuery = matchMedia('(max-width: 650px) and (orientation: portrait)');
const isPortrait = () =>
  $('#game-surface').classList.contains('immersive')
    ? window.innerHeight > window.innerWidth
    : portraitQuery.matches;
const effects = new ShellSound();
const motion = new ShellMotion($('#board'), pitXY);
let music = { duck() {}, tracks: [], choose: async () => false, pause() {} };
if (FEATURES.music)
  void setupMusic($('#music-strip')).then((player) => {
    music = player;
    if (dialog.dataset.view === 'tradition' && dialog.open) renderHeritageMusic();
  });
let firstVisit = true;
try {
  const saved = normalizePreferences({
    mode: localStorage.getItem('chenne-mode'),
    sowing: localStorage.getItem('chenne-sowing'),
    speed: localStorage.getItem('chenne-speed'),
    difficulty: localStorage.getItem('chenne-difficulty'),
    pauseRelay: localStorage.getItem('chenne-pause-relay'),
  });
  mode = saved.mode;
  difficulty = saved.difficulty;
  pauseRelay = saved.pauseRelay;
  $('#interaction').value = saved.sowing;
  $('#speed').value = saved.speed;
  firstVisit = localStorage.getItem('chenne-setup-complete') !== 'true';
} catch {}
const dialog = $('#info-dialog');
const names = () => (mode === 'solo' ? ['You', 'Bot'] : ['Player 1', 'Player 2']);
const pitName = (i) =>
  `${isPortrait() ? (owner(i) === 0 ? 'left' : 'right') : owner(i) === 0 ? 'bottom' : 'top'} pit ${owner(i) === 0 ? i + 1 : 14 - i}`;
function boardWords(text) {
  return isPortrait()
    ? text
        .replace(/bottom row/g, 'left column')
        .replace(/top row/g, 'right column')
        .replace(/bottom pit/g, 'left pit')
        .replace(/top pit/g, 'right pit')
    : text
        .replace(/left column/g, 'bottom row')
        .replace(/right column/g, 'top row')
        .replace(/left pit/g, 'bottom pit')
        .replace(/right pit/g, 'top pit');
}
function setStatus(message, detail = '') {
  $('#status').textContent = boardWords(message);
  $('#status-detail').textContent = boardWords(detail);
}
function render(frame = null) {
  visualFrame = frame;
  $('#game-surface').classList.toggle('is-sowing', busy && manualTurn);
  const pits = frame?.pits || state.pits,
    scores = frame?.scores || state.scores,
    n = names();
  for (let i = 0; i < 14; i++) {
    const button = $(`#pit-${i}`),
      allowed = busy
        ? interactiveTurn && awaitingPit === i
        : !state.over &&
          owner(i) === state.turn &&
          pits[i] > 0 &&
          !(mode === 'solo' && state.turn === 1);
    button.disabled = !allowed;
    button.classList.toggle('awaiting', busy && awaitingPit === i);
    button.classList.toggle('legal', allowed);
    button.classList.toggle(
      'sowing',
      awaitingPit === null && frame?.pit === i && frame.kind !== 'capture',
    );
    button.classList.toggle(
      'capturing',
      frame?.pit === i && frame.kind === 'capture' && frame.captured > 0,
    );
    button.classList.remove('suggested');
    patchPile(button.querySelector('.shells'), pits[i], i);
    button.querySelector('.pit-count').textContent = pits[i];
    button.setAttribute(
      'aria-label',
      `${n[owner(i)]}, ${pitName(i)}, ${pits[i]} shells${allowed ? (busy ? (pendingStep?.kind === 'relay' ? ', pick up these shells' : ', place a shell here') : ', pick up these shells') : ''}`,
    );
  }
  for (let p = 0; p < 2; p++) {
    $(`#name-${p}`).textContent =
      n[p] +
      (mode === 'solo' && p === 1 ? ' · ' + difficulty[0].toUpperCase() + difficulty.slice(1) : '');
    $(`#player-${p} .player-side`).textContent = isPortrait()
      ? p === 0
        ? 'Left column'
        : 'Right column'
      : p === 0
        ? 'Bottom row'
        : 'Top row';
    $(`#score-${p}`).textContent = scores[p];
    $(`#player-${p}`).classList.toggle('current', !state.over && state.turn === p);
    patchPile($(`#store-${p}`), scores[p], p + 18, frame?.storeCapacities?.[p] ?? scores[p]);
    $(`#store-${p}`).setAttribute('aria-label', `${n[p]}: ${scores[p]} captured shells`);
  }
  $('#turn-pill').textContent = state.over
    ? 'Round complete'
    : busy
      ? state.turn === 1 && mode === 'solo'
        ? 'Bot’s turn'
        : 'Sowing…'
      : state.turn === 0
        ? mode === 'solo'
          ? 'Your turn'
          : 'Player 1’s turn'
        : mode === 'solo'
          ? 'Bot’s turn'
          : 'Player 2’s turn';
  const relayWait = interactiveTurn && !manualTurn && pendingStep?.kind === 'relay';
  $('#relay-sow-button').hidden = !relayWait;
  $('#relay-sow-button').textContent = `Pick up & sow ${relayWait ? pits[awaitingPit] : ''}`;
  $('#game-surface').classList.toggle('awaiting-relay', !!relayWait);
  $('#sowing-auto').setAttribute('aria-pressed', String($('#interaction').value === 'auto'));
  $('#sowing-manual').setAttribute('aria-pressed', String($('#interaction').value === 'manual'));
  $('#pause-relay').checked = pauseRelay;
  $('#relay-setting').hidden = $('#interaction').value !== 'auto';
  $('#sow-button').hidden = !busy || !manualTurn;
  $('#sow-button').disabled = !busy || !manualTurn;
  $('#sow-button').textContent =
    awaitingPit === null
      ? 'Sowing…'
      : pendingStep?.kind === 'relay'
        ? 'Pick up & continue'
        : 'Place a shell';
  $('#gesture-help').textContent =
    busy && manualTurn
      ? 'Tap the glowing pit, or hold Place a shell.'
      : $('#interaction').value === 'manual'
        ? 'Tap a pit to pick up its shells.'
        : sowingHelp();
  $('#move-count').textContent = `Move ${state.moves + 1}`;
  $('#skip-animation').hidden = !busy;
  $('#hint-button').disabled = busy || state.over || (mode === 'solo' && state.turn === 1);
  $('#undo-button').disabled = !history.length || busy;
  $('#in-hand').hidden = !frame || !frame.hand;
  $('#in-hand').textContent = frame?.hand ? `${frame.hand} in hand` : '';
  $('#top-label').textContent = isPortrait()
    ? n[1]
    : mode === 'solo'
      ? 'BOT’S ROW'
      : 'PLAYER 2’S ROW';
  $('#bottom-label').textContent = isPortrait()
    ? n[0]
    : mode === 'solo'
      ? 'YOUR ROW'
      : 'PLAYER 1’S ROW';
  $('#top-direction').textContent = isPortrait() ? '↑' : '← SOW THIS WAY';
  $('#bottom-direction').textContent = isPortrait() ? '↓' : 'SOW THIS WAY →';
}
function tick(capture = false) {
  effects.impact(capture);
}
function animateDelay() {
  return animationDuration(
    $('#speed').value,
    matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
}
function advance(pit = awaitingPit) {
  if (!pendingStep || pit !== awaitingPit) return;
  const step = pendingStep;
  pendingStep = null;
  awaitingPit = null;
  render(visualFrame);
  step.resolve();
}
function needsPlacement(kind) {
  return (
    interactiveTurn &&
    !skipAnimation &&
    ((manualTurn && !holdSow) || (!manualTurn && pauseRelay && kind === 'relay'))
  );
}
function sowingHelp() {
  return $('#interaction').value === 'manual'
    ? 'Tap each glowing pit to place a shell.'
    : pauseRelay
      ? 'Shells sow automatically. Tap the next pickup when your hand empties.'
      : 'Choose a pit. The full turn is sown for you.';
}
function placementPrompt() {
  if (!pendingStep) return;
  const relay = pendingStep.kind === 'relay',
    count = visualFrame?.pits[awaitingPit] || 0;
  setStatus(
    relay
      ? `Hand empty. Pick up ${count} shells from the glowing pit.`
      : `Place one shell in ${pitName(awaitingPit)}.`,
    relay
      ? 'Your same turn continues from this pit.'
      : 'Tap the glowing pit, or slide your finger to it.',
  );
}
async function waitForPlacement(frame, token) {
  if (!needsPlacement(frame.kind)) return;
  awaitingPit = frame.pit;
  await new Promise((resolve) => {
    pendingStep = { resolve, kind: frame.kind };
    render(visualFrame);
    placementPrompt();
    if (keyboardBoardPlay) $(`#pit-${frame.pit}`).focus({ preventScroll: true });
    advanceTouchedPit();
  });
  if (token !== epoch) return;
}
async function move(pit, fromBot = false, { automatic = false } = {}) {
  if (busy || state.over || (!fromBot && mode === 'solo' && state.turn === 1))
    throw new Error('Please finish the current turn first.');
  if (!legalMoves(state).includes(pit)) throw new Error('Choose a non-empty pit in your own row.');
  effects.unlock();
  if (!fromBot) history.push(clone(state));
  const token = epoch,
    result = playMove(state, pit);
  busy = true;
  interactiveTurn = !fromBot && !automatic;
  manualTurn = interactiveTurn && $('#interaction').value === 'manual';
  skipAnimation = false;
  render();
  music.duck(true);
  const playerName = names()[state.turn],
    safeDraw = (frame) => {
      if (token === epoch) render(frame);
    },
    impact = (capture) => {
      if (token === epoch) tick(capture);
    };
  // Rare cyclic positions are settled by the engine, not played out as thousands of gestures.
  const events = result.events.length > 400 ? result.events.slice(0, 1) : result.events;
  for (const frame of events) {
    if (token !== epoch) return;
    if (dialog.open)
      await new Promise((resolve) => dialog.addEventListener('close', resolve, { once: true }));
    if (token !== epoch) return;
    if (skipAnimation) break;
    if (frame.kind === 'drop' || frame.kind === 'relay') await waitForPlacement(frame, token);
    if (token !== epoch) return;
    if (skipAnimation) break;
    const duration = animateDelay();
    if (!duration) {
      safeDraw(frame);
      motion.held(frame.hand, motion.hover(frame.pit));
      if (frame.kind === 'drop' && manualTurn && !holdSow) impact();
      if (frame.kind === 'capture' && frame.captured) impact(true);
    } else if (frame.kind === 'pickup' || frame.kind === 'relay') {
      setStatus(
        frame.kind === 'pickup'
          ? `${playerName === 'You' ? 'You pick' : playerName + ' picks'} up ${frame.hand} shells.`
          : `Pick up ${frame.hand} shells and keep going.`,
        'Keep following the glowing pit.',
      );
      await motion.pickup(frame, duration * 1.25, safeDraw);
    } else if (frame.kind === 'drop') {
      await motion.drop(frame, duration, safeDraw, impact);
    } else if (frame.kind === 'empty') {
      safeDraw(frame);
      setStatus(
        'An empty pit. Look one pit beyond it.',
        'The shells beyond the gap are yours to collect.',
      );
      await new Promise((resolve) => setTimeout(resolve, duration * 0.65));
    } else if (frame.kind === 'capture') {
      setStatus(
        frame.captured
          ? `${playerName === 'You' ? 'You collect' : playerName + ' collects'} ${frame.captured} shells.`
          : 'No shells beyond the empty pit.',
        'The turn ends.',
      );
      await motion.capture(frame, result.player, duration, safeDraw, impact);
    }
    // A resize may cancel pixel-based flights; always commit this engine frame.
    if (token === epoch) {
      safeDraw(frame);
      motion.held(frame.hand || 0, motion.hover(frame.pit));
    }
  }
  if (dialog.open)
    await new Promise((resolve) => dialog.addEventListener('close', resolve, { once: true }));
  if (token !== epoch) return;
  motion.clear();
  state = result.state;
  busy = false;
  awaitingPit = null;
  pendingStep = null;
  manualTurn = false;
  interactiveTurn = false;
  music.duck(false);
  render();
  if (state.over) showResult();
  else {
    if (keyboardBoardPlay && !(mode === 'solo' && state.turn === 1))
      $(`#pit-${legalMoves(state)[0]}`)?.focus({ preventScroll: true });
    setStatus(
      state.turn === 0 && mode === 'solo'
        ? 'Your turn. Choose a pit in the bottom row.'
        : `${names()[state.turn]}’s turn.`,
      `${playerName} captured ${result.captured} shell${result.captured === 1 ? '' : 's'}.`,
    );
    scheduleBot();
  }
  return getPublicState();
}
function scheduleBot() {
  clearTimeout(botTimer);
  if (mode !== 'solo' || state.turn !== 1 || state.over || busy || dialog.open) return;
  botTimer = setTimeout(() => {
    if (mode !== 'solo' || state.turn !== 1 || state.over || busy || dialog.open) return;
    const choice = chooseBotMove(state, difficulty);
    if (choice !== null) void move(choice, true);
  }, 550);
}
function reset(nextMode = mode) {
  boardGesture = null;
  keyboardBoardPlay = false;
  epoch++;
  if (pendingStep) pendingStep.resolve();
  pendingStep = null;
  awaitingPit = null;
  holdSow = false;
  manualTurn = false;
  interactiveTurn = false;
  motion.clear();
  music.duck(false);
  clearTimeout(botTimer);
  mode = nextMode;
  state = initialState();
  history = [];
  busy = false;
  $('#solo-mode').setAttribute('aria-pressed', String(mode === 'solo'));
  $('#friend-mode').setAttribute('aria-pressed', String(mode === 'friend'));
  render();
  setStatus(
    mode === 'solo'
      ? 'Pick any pit on your side to begin.'
      : 'Player 1, choose a pit in the bottom row.',
    sowingHelp(),
  );
}
function showDialog(content, view = 'reference') {
  releaseBoardGesture();
  $('#game-settings').open = false;
  tutorial?.destroy();
  tutorial = null;
  setup?.destroy();
  setup = null;
  dialog.dataset.view = view;
  clearTimeout(botTimer);
  $('#dialog-content').innerHTML = content;
  dialog.scrollTop = 0;
  if (!dialog.open) dialog.showModal();
  else $('#close-dialog').focus({ preventScroll: true });
}
function closeDialog() {
  tutorial?.destroy();
  tutorial = null;
  setup?.destroy();
  setup = null;
  dialog.close();
}
function openTutorial() {
  showDialog(tutorialHTML, 'tutorial');
  effects.unlock();
  tutorial = mountTutorial($('#dialog-content'), { onReturn: closeDialog, impact: tick });
}
function currentPreferences() {
  return {
    mode,
    difficulty,
    pauseRelay,
    sowing: $('#interaction').value,
    speed: $('#speed').value,
  };
}
function updatePreferencesSummary() {
  const prefs = currentPreferences();
  $('#preferences-summary').textContent =
    `${prefs.mode === 'solo' ? 'Solo · ' + prefs.difficulty[0].toUpperCase() + prefs.difficulty.slice(1) : 'With a friend'} · ${prefs.sowing === 'manual' ? 'Hands-on' : prefs.pauseRelay ? 'Automatic · tap pickups' : 'Automatic · continuous'} · ${{ '220': 'Relaxed', '80': 'Quick', '0': 'Instant' }[prefs.speed]}`;
  $('#solo-mode').setAttribute('aria-pressed', String(mode === 'solo'));
  $('#friend-mode').setAttribute('aria-pressed', String(mode === 'friend'));
}
function openSetup({ newGame = false, nextMode = mode } = {}) {
  const before = currentPreferences();
  showDialog(setupHTML, 'setup');
  setup = mountSetup($('#dialog-content'), {
    preferences: { ...before, mode: nextMode },
    newGame,
    hasRound: state.moves > 0 || busy,
    automaticTurn: busy && !interactiveTurn,
    firstVisit,
    onSave: (values) => {
      const prefs = normalizePreferences(values),
        replace = newGame || prefs.mode !== mode;
      $('#interaction').value = prefs.sowing;
      $('#speed').value = prefs.speed;
      difficulty = prefs.difficulty;
      pauseRelay = prefs.pauseRelay;
      try {
        localStorage.setItem('chenne-sowing', prefs.sowing);
        localStorage.setItem('chenne-speed', prefs.speed);
        localStorage.setItem('chenne-mode', prefs.mode);
        localStorage.setItem('chenne-difficulty', prefs.difficulty);
        localStorage.setItem('chenne-pause-relay', String(prefs.pauseRelay));
        localStorage.setItem('chenne-setup-complete', 'true');
      } catch {}
      firstVisit = false;
      if (replace) reset(prefs.mode);
      else applySowingPreference();
      updatePreferencesSummary();
      closeDialog();
    },
  });
}
function requestReset(nextMode = mode) {
  openSetup({ newGame: true, nextMode });
}
function showResult() {
  const n = names(),
    winner = state.scores[0] === state.scores[1] ? -1 : state.scores[0] > state.scores[1] ? 0 : 1;
  const reason = {
    captured: 'Every shell has been collected.',
    'no-move':
      'The next player has no occupied starting pit. Remaining shells have been awarded to the owner of each row.',
    'threefold':
      'The same position occurred three times. Remaining shells have been awarded to the owner of each row.',
    'relay-repeat':
      'This relay repeated or reached the digital move limit. Remaining shells have been awarded to the owner of each row.',
  }[state.reason];
  setStatus(
    winner === -1
      ? 'An evenly matched game.'
      : winner === 0 && mode === 'solo'
        ? 'You won this round.'
        : `${n[winner]} wins this round.`,
    reason,
  );
  showDialog(
    `<h2 id="dialog-title">${winner === -1 ? 'A well-played draw.' : winner === 0 && mode === 'solo' ? 'This round is yours.' : `${n[winner]} wins.`}</h2><div class="result-score">${state.scores[0]} <span style="font-size:.5em;color:#88927d">—</span> ${state.scores[1]}</div><p>${n[0]} · ${n[1]}</p><p>${reason}</p><div class="dialog-actions"><button class="primary-button" id="rematch-button">Play another round ${icon('arrow')}</button><button class="text-button" id="view-board">View board</button></div>`,
  );
  $('#rematch-button').onclick = () => requestReset();
  $('#view-board').onclick = closeDialog;
}
function selectPit(pit) {
  $('#game-settings').open = false;
  if (busy) {
    advance(pit);
    return;
  }
  void move(pit);
}
for (const button of document.querySelectorAll('[data-pit]'))
  button.addEventListener('click', (event) => {
    if (suppressBoardClick) {
      suppressBoardClick = false;
      return;
    }
    keyboardBoardPlay = event.detail === 0;
    selectPit(Number(button.dataset.pit));
  });
// A drag begins only after movement, so a normal tap and keyboard click still work.
function advanceTouchedPit() {
  if (!manualTurn || !boardGesture?.active || awaitingPit === null) return;
  const target = document
    .elementFromPoint?.(boardGesture.x, boardGesture.y)
    ?.closest?.('[data-pit]');
  if (target && Number(target.dataset.pit) === awaitingPit) advance(awaitingPit);
}
const touchBoard = $('#board');
touchBoard.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || event.isPrimary === false || $('#interaction').value !== 'manual')
    return;
  const pit = event.target.closest?.('[data-pit]');
  if (!pit || pit.disabled) return;
  boardGesture = {
    pointerId: event.pointerId,
    pit: Number(pit.dataset.pit),
    startX: event.clientX,
    startY: event.clientY,
    x: event.clientX,
    y: event.clientY,
    active: false,
  };
});
touchBoard.addEventListener('pointermove', (event) => {
  const gesture = boardGesture;
  if (!gesture || event.pointerId !== gesture.pointerId) return;
  gesture.x = event.clientX;
  gesture.y = event.clientY;
  if (!gesture.active && Math.hypot(gesture.x - gesture.startX, gesture.y - gesture.startY) >= 8) {
    gesture.active = true;
    keyboardBoardPlay = false;
    suppressBoardClick = true;
    try {
      touchBoard.setPointerCapture(event.pointerId);
    } catch {}
    selectPit(gesture.pit);
  }
  if (gesture.active) {
    event.preventDefault();
    advanceTouchedPit();
  }
});
function releaseBoardGesture(event) {
  if (
    !boardGesture ||
    (event?.pointerId !== undefined && event.pointerId !== boardGesture.pointerId)
  )
    return;
  if (boardGesture.active) {
    event?.preventDefault?.();
    suppressBoardClick = true;
    setTimeout(() => {
      suppressBoardClick = false;
    }, 0);
  }
  boardGesture = null;
}
touchBoard.addEventListener('lostpointercapture', releaseBoardGesture);
window.addEventListener('pointerup', releaseBoardGesture);
window.addEventListener('pointercancel', releaseBoardGesture);
window.addEventListener('blur', () => releaseBoardGesture());

$('#skip-animation').onclick = () => {
  skipAnimation = true;
  motion.clear();
  if (pendingStep) advance();
};
$('#sow-button').addEventListener('pointerdown', (event) => {
  event.preventDefault();
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch {}
  effects.unlock();
  holdSow = true;
  $('#sow-button').classList.add('held');
  advance();
});
const releaseSow = () => {
  holdSow = false;
  $('#sow-button').classList.remove('held');
};
window.addEventListener('pointerup', releaseSow);
window.addEventListener('pointercancel', releaseSow);
window.addEventListener('blur', releaseSow);
$('#sow-button').addEventListener('lostpointercapture', releaseSow);
$('#sow-button').addEventListener('click', (event) => {
  if (event.detail === 0) advance();
});
function applySowingPreference() {
  releaseBoardGesture();
  releaseSow();
  manualTurn = interactiveTurn && $('#interaction').value === 'manual';
  if (pendingStep && !needsPlacement(pendingStep.kind)) advance();
  render(visualFrame);
  if (pendingStep) placementPrompt();
  else if (!busy && !state.over) setStatus('Choose a pit on your side.', sowingHelp());
  updatePreferencesSummary();
}
function changeSowing(value) {
  $('#interaction').value = value;
  try {
    localStorage.setItem('chenne-sowing', value);
  } catch {}
  applySowingPreference();
}
$('#interaction').addEventListener('change', () => changeSowing($('#interaction').value));
$('#sowing-auto').onclick = () => changeSowing('auto');
$('#sowing-manual').onclick = () => changeSowing('manual');
$('#pause-relay').addEventListener('change', () => {
  pauseRelay = $('#pause-relay').checked;
  try {
    localStorage.setItem('chenne-pause-relay', String(pauseRelay));
  } catch {}
  applySowingPreference();
});
$('#relay-sow-button').onclick = (event) => {
  keyboardBoardPlay = event?.detail === 0;
  if (pendingStep?.kind === 'relay') advance();
};
$('#preferences-button').onclick = () => openSetup();
$('#new-game').onclick = () => requestReset();
$('#solo-mode').onclick = () => {
  if (mode !== 'solo') requestReset('solo');
};
$('#friend-mode').onclick = () => {
  if (mode !== 'friend') requestReset('friend');
};
function updateSoundButton() {
  $('#sound-button').setAttribute('aria-pressed', String(effects.enabled));
  $('#sound-button').setAttribute(
    'aria-label',
    effects.enabled ? 'Turn shell sounds off' : 'Turn shell sounds on',
  );
  $('#sound-button').innerHTML = icon(effects.enabled ? 'sound' : 'mute');
}
$('#sound-button').onclick = () => {
  effects.setEnabled(!effects.enabled);
  updateSoundButton();
  tick();
};
updateSoundButton();
$('#undo-button').onclick = () => {
  if (!history.length || busy) return;
  epoch++;
  clearTimeout(botTimer);
  state = history.pop();
  render();
  setStatus(
    'Move undone. Choose another pit.',
    'In solo mode, your turn and the bot’s reply are undone together.',
  );
};
$('#hint-button').onclick = () => {
  const choice = chooseMove(state);
  if (choice === null) return;
  document.querySelectorAll('.suggested').forEach((b) => b.classList.remove('suggested'));
  const btn = $(`#pit-${choice}`);
  btn.classList.add('suggested');
  btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  const result = playMove(state, choice, { frames: false });
  setStatus(
    `Try ${pitName(choice)}.`,
    result.captured
      ? `It captures ${result.captured} shells. The hint also considers the opponent’s reply.`
      : 'This move considers the opponent’s possible reply.',
  );
};
$('#close-dialog').onclick = closeDialog;
dialog.addEventListener('close', () => {
  tutorial?.destroy();
  tutorial = null;
  setup?.destroy();
  setup = null;
  scheduleBot();
});
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      closeDialog();
  }
});
$('#play-nav').onclick = () => {
  $('#board').scrollIntoView({ behavior: 'smooth', block: 'center' });
};
function getPublicState() {
  return {
    pits: [...(visualFrame?.pits || state.pits)],
    scores: [...(visualFrame?.scores || state.scores)],
    inHand: visualFrame?.hand || 0,
    playerToMove: state.turn,
    mode,
    move: state.moves + 1,
    over: state.over,
    busy,
    awaitingPit,
    sowingStyle: $('#interaction').value,
    pauseBeforePickup: pauseRelay,
    botDifficulty: mode === 'solo' ? difficulty : null,
    boardOrientation: isPortrait() ? 'vertical' : 'horizontal',
    legalPits: busy || (mode === 'solo' && state.turn === 1) ? [] : legalMoves(state),
    reason: state.reason,
  };
}
const { rulesHTML, traditionHTML, aboutHTML } = await import('./guide.mjs?v=13');
for (const id of ['rules-nav', 'guide-button', 'full-rules']) $('#' + id).onclick = openTutorial;
function renderHeritageMusic() {
  if (!FEATURES.music) return;
  const list = $('#heritage-track-list');
  if (!list) return;
  list.replaceChildren();
  for (const track of music.tracks) {
    const button = document.createElement('button');
    button.className = 'heritage-track';
    button.dataset.music = track.id;
    const meta = document.createElement('span');
    meta.className = 'heritage-track-meta';
    meta.textContent = track.recommended ? 'START HERE · ' + track.regionLabel : track.regionLabel;
    const title = document.createElement('strong');
    title.textContent = track.displayTitle || track.label;
    const subtitle = document.createElement('span');
    subtitle.textContent = track.displaySubtitle || track.description;
    const action = document.createElement('span');
    action.className = 'heritage-track-action';
    const duration = Math.round(track.durationSeconds);
    action.textContent = `▶ Listen · ${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`;
    button.append(meta, title, subtitle, action);
    list.append(button);
  }
}
function showTradition() {
  showDialog(traditionHTML, 'tradition');
  renderHeritageMusic();
}
$('#story-nav').onclick = showTradition;
$('#heritage-invitation').onclick = showTradition;
$('#sources-button').onclick = () => showDialog(aboutHTML);
$('#dialog-content').addEventListener('click', async (event) => {
  const target = event.target;
  const button = target.closest('[data-guide]');
  if (button) {
    if (button.dataset.guide === 'tutorial') openTutorial();
    else if (button.dataset.guide === 'tradition') showTradition();
    else showDialog(rulesHTML);
    return;
  }
  if (!FEATURES.music) return;
  const recording = target.closest('[data-music]');
  if (recording) {
    const request = ++heritageRequest;
    const status = $('#heritage-music-status');
    status.textContent = 'Starting the recording…';
    const playing = await music.choose(recording.dataset.music);
    if (status.isConnected && request === heritageRequest)
      status.textContent = playing
        ? 'Music is playing. Return to your board whenever you’re ready.'
        : 'Could not start the recording. Tap Listen to try again.';
  }
  if (target.closest('#heritage-music-pause')) {
    heritageRequest++;
    music.pause();
    $('#heritage-music-status').textContent = 'Music paused. Choose any recording to listen again.';
  }
});
const modelContext = document.modelContext;
if (modelContext?.registerTool) {
  const lifecycle = new AbortController();
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) lifecycle.abort();
  });
  const register = (tool) => {
    try {
      Promise.resolve(modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(
        () => {},
      );
    } catch {}
  };
  register({
    name: 'read_chenne_mane_game',
    title: 'Read the board',
    description:
      'Read current pits, scores, legal pit indices, game mode, turn and animation state. Indices 0–6 are Player 1’s pits, left to right on a horizontal board or top to bottom in the left column on an upright board. Indices 7–13 run in the opposite direction on the other side.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute: () => getPublicState(),
  });
  register({
    name: 'sow_chenne_mane_pit',
    title: 'Play a pit',
    description:
      'Play an occupied pit for the current human player using the same sowing, capture and visible animation as the game board. Returns after this move completes; in solo mode a bot reply may follow.',
    inputSchema: {
      type: 'object',
      properties: { pit: { type: 'integer', minimum: 0, maximum: 13 } },
      required: ['pit'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute: async (input) => {
      if (!input || Object.keys(input).some((k) => k !== 'pit') || !Number.isInteger(input.pit))
        throw new Error('A numeric integer pit index is required.');
      return move(input.pit, false, { automatic: true });
    },
  });
}
render();

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  const isDark = theme === 'dark';
  $('#theme-toggle').innerHTML = icon(isDark ? 'sun' : 'moon');
  $('#theme-toggle').setAttribute(
    'aria-label',
    isDark ? 'Switch to light mode' : 'Switch to dark mode',
  );
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#0d1512' : '#f8f6ef';
  try {
    localStorage.setItem('chenne-theme', theme);
  } catch {}
};
$('#theme-toggle').onclick = () =>
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
applyTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

const gameSurface = $('#game-surface');
gameSurface.append(dialog);
$('#fullscreen-help').onclick = openTutorial;
window.addEventListener('pagehide', () => {
  releaseBoardGesture();
  epoch++;
  if (pendingStep) pendingStep.resolve();
  pendingStep = null;
  awaitingPit = null;
  manualTurn = false;
  interactiveTurn = false;
  holdSow = false;
  motion.clear();
  clearTimeout(botTimer);
  if (busy) {
    busy = false;
    if (history.length && (mode === 'friend' || state.turn === 0)) history.pop();
    render();
  }
  music.duck(false);
});
window.addEventListener('pageshow', () => {
  render();
  scheduleBot();
});

const gameToolbar = $('.game-toolbar'),
  settingsPanel = $('.settings-panel'),
  finishControl = $('#skip-animation');
function updateBoardLayout() {
  releaseBoardGesture();
  motion.clear();
  const immersive = gameSurface.classList.contains('immersive'),
    portrait = isPortrait();
  gameSurface.classList.toggle('portrait-board', portrait);
  if ((portrait || immersive) && gameToolbar.parentNode !== settingsPanel) {
    settingsPanel.prepend(gameToolbar);
    gameToolbar.after(finishControl);
  } else if (!portrait && !immersive && gameToolbar.parentNode !== gameSurface) {
    gameSurface.prepend(gameToolbar);
    $('.game-footer').insertBefore(finishControl, $('#move-count'));
  }
  const launcher = $('#fullscreen-button');
  if (portrait && !immersive) $('.game-footer').insertBefore(launcher, $('#game-settings'));
  else if (launcher.parentNode !== $('.toolbar-right')) $('.toolbar-right').prepend(launcher);
  render(visualFrame);
  setStatus($('#status').textContent, $('#status-detail').textContent);
  if (visualFrame?.hand) motion.held(visualFrame.hand, motion.hover(visualFrame.pit));
}
window.addEventListener('resize', updateBoardLayout);
portraitQuery.addEventListener?.('change', updateBoardLayout);
updateBoardLayout();

const fullscreen = mountFullscreen({
  surface: gameSurface,
  dialog,
  trigger: $('#fullscreen-button'),
  exitButton: $('#exit-fullscreen'),
  background: Array.from(document.querySelectorAll('.header,.intro,.learn-strip,.site-footer')),
  onLayout: updateBoardLayout,
});
updatePreferencesSummary();
// Reveal only after controls, local styles and the two shared game textures are ready.
try {
  await Promise.all([
    window.chenneStylesReady,
    ...['/assets/antique-board.webp', '/assets/cowrie-shell.webp'].map((src) => {
      const image = new Image();
      image.src = src;
      return image.decode();
    }),
  ]);
  clearTimeout(window.chenneLoadTimer);
  document.documentElement.classList.remove('game-loading');
  document.getElementById('initial-loader')?.remove();
  if (firstVisit) openSetup();
  else setStatus('Pick any pit on your side to begin.', sowingHelp());
} catch (error) {
  window.chenneLoadFailed?.();
}
