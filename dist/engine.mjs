// Coastal four-shell family rules. Digital settlement conventions are explicit
// in the in-game guide and research notes. The end stores are not sowing pits.
export const owner = (pit) => (pit < 7 ? 0 : 1);
export const next = (pit) => (pit + 1) % 14;
export const key = (state) => `${state.turn}|${state.pits.join(',')}|${state.scores.join(',')}`;
export const clone = (state) => structuredClone(state);
export function initialState() {
  const state = {
    pits: Array(14).fill(4),
    scores: [0, 0],
    turn: 0,
    moves: 0,
    over: false,
    reason: '',
    seen: {},
  };
  state.seen[key(state)] = 1;
  return state;
}
export function legalMoves(state) {
  return state.over
    ? []
    : state.pits.flatMap((n, i) => (n > 0 && owner(i) === state.turn ? [i] : []));
}
function settle(state, reason) {
  state.pits.forEach((n, i) => {
    state.scores[owner(i)] += n;
    state.pits[i] = 0;
  });
  state.over = true;
  state.reason = reason;
}
export function playMove(input, start, { frames = true } = {}) {
  if (!Number.isInteger(start) || !legalMoves(input).includes(start))
    throw new Error('Choose an occupied pit in the current player’s row.');
  const state = clone(input),
    events = [],
    player = state.turn;
  let cursor = start,
    hand = 0,
    captured = 0,
    lap = 0,
    dropCount = 0;
  const total = state.pits.reduce((a, b) => a + b, 0) + state.scores[0] + state.scores[1];
  const emit = (kind, pit, extra = {}) => {
    if (frames)
      events.push({
        kind,
        pit,
        pits: [...state.pits],
        scores: [...state.scores],
        hand,
        lap,
        ...extra,
      });
  };
  const seenRelay = new Set();
  while (true) {
    const relayKey = `${cursor}|${state.pits.join(',')}`;
    // Check only at empty-hand boundaries, before lifting a pit.
    if (seenRelay.has(relayKey) || dropCount >= 20000) {
      settle(state, 'relay-repeat');
      emit('settle', -1);
      break;
    }
    seenRelay.add(relayKey);
    hand = state.pits[cursor];
    state.pits[cursor] = 0;
    lap++;
    emit(lap === 1 ? 'pickup' : 'relay', cursor);
    while (hand > 0) {
      cursor = next(cursor);
      state.pits[cursor]++;
      hand--;
      dropCount++;
      emit('drop', cursor);
    }
    const candidate = next(cursor);
    if (state.pits[candidate] === 0) {
      emit('empty', candidate);
      const target = next(candidate);
      captured = state.pits[target];
      state.pits[target] = 0;
      state.scores[player] += captured;
      emit('capture', target, { captured });
      break;
    }
    cursor = candidate;
  }
  state.moves++;
  if (!state.over) {
    state.turn = 1 - player;
    if (state.pits.every((n) => n === 0)) {
      state.over = true;
      state.reason = 'captured';
    } else if (legalMoves(state).length === 0) {
      settle(state, 'no-move');
      emit('settle', -1);
    } else {
      const position = key(state);
      state.seen[position] = (state.seen[position] || 0) + 1;
      if (state.seen[position] >= 3) {
        settle(state, 'threefold');
        emit('settle', -1);
      }
    }
  }
  if (state.pits.reduce((a, b) => a + b, 0) + state.scores[0] + state.scores[1] !== total)
    throw new Error('Shell conservation failure.');
  return { state, events, captured, laps: lap, player };
}
export function chooseMove(state) {
  const player = state.turn,
    moves = legalMoves(state);
  if (!moves.length) return null;
  const value = (s) => s.scores[player] - s.scores[1 - player];
  let best = moves[0],
    bestValue = -Infinity;
  for (const move of moves) {
    const result = playMove(state, move, { frames: false }).state;
    let score = value(result);
    if (result.over) score += Math.sign(score) * 1000;
    else {
      let replyWorst = Infinity;
      for (const reply of legalMoves(result)) {
        const replyState = playMove(result, reply, { frames: false }).state;
        let replyValue = value(replyState);
        if (replyState.over) replyValue += Math.sign(replyValue) * 1000;
        replyWorst = Math.min(replyWorst, replyValue);
      }
      score = replyWorst + score * 0.05;
    }
    if (score > bestValue) {
      bestValue = score;
      best = move;
    }
  }
  return best;
}
