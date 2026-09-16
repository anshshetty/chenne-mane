import { legalMoves, playMove, chooseMove } from './engine.mjs';

export function chooseBotMove(state, difficulty = 'medium', random = Math.random) {
  const moves = legalMoves(state);
  if (!moves.length) return null;
  if (difficulty === 'easy')
    return moves[Math.min(moves.length - 1, Math.max(0, Math.floor(random() * moves.length)))];
  if (difficulty === 'hard') return chooseMove(state);
  const player = state.turn;
  let best = moves[0],
    bestValue = -Infinity;
  for (const move of moves) {
    const next = playMove(state, move, { frames: false }).state;
    const difference = next.scores[player] - next.scores[1 - player];
    const value = difference + (next.over ? Math.sign(difference) * 1000 : 0);
    if (value > bestValue) {
      best = move;
      bestValue = value;
    }
  }
  return best;
}
