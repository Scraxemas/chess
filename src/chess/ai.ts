import type { Move, Square } from 'chess.js';
import type { ChessGame, PieceSymbol } from './game';

/** Material values for a shallow 1-ply heuristic (weak AI). */
const MATERIAL: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

const CHECK_BONUS = 40;
const PROMO_BONUS = 800;

export type AiDifficulty = 'weak' | 'master';

export const AI_DIFFICULTY_STORAGE_KEY = 'chess-ai-difficulty';

export type AiMove = {
  from: Square;
  to: Square;
  /** Weak AI always queens; Master uses Stockfish’s choice. */
  promotion?: 'q' | 'r' | 'b' | 'n';
};

export function loadAiDifficulty(): AiDifficulty {
  try {
    const v = localStorage.getItem(AI_DIFFICULTY_STORAGE_KEY);
    if (v === 'master' || v === 'weak') return v;
  } catch {
    // private mode / unavailable
  }
  return 'weak';
}

export function saveAiDifficulty(d: AiDifficulty): void {
  try {
    localStorage.setItem(AI_DIFFICULTY_STORAGE_KEY, d);
  } catch {
    // ignore
  }
}

/**
 * Pick a weak move: score each legal move with capture/check/promo bonuses,
 * then choose uniformly among the top-scoring candidates (ties broken randomly).
 * Promotions always use queen.
 */
export function chooseWeakMove(game: ChessGame): AiMove | null {
  const moves = game.allMoves();
  if (moves.length === 0) return null;

  let bestScore = -Infinity;
  const best: Move[] = [];

  for (const move of moves) {
    const score = scoreMove(game, move);
    if (score > bestScore) {
      bestScore = score;
      best.length = 0;
      best.push(move);
    } else if (score === bestScore) {
      best.push(move);
    }
  }

  const pick = best[Math.floor(Math.random() * best.length)]!;
  if (pick.promotion) {
    return { from: pick.from, to: pick.to, promotion: 'q' };
  }
  return { from: pick.from, to: pick.to };
}

function scoreMove(game: ChessGame, move: Move): number {
  let score = Math.random() * 5; // tiny jitter so quiet moves vary

  if (move.captured) {
    score += MATERIAL[move.captured as PieceSymbol];
  }
  if (move.promotion) {
    // Prefer queen promo in scoring; AI applies queen anyway.
    score += PROMO_BONUS;
  }

  const applied = game.tryMove(
    move.from,
    move.to,
    move.promotion ? 'q' : undefined,
  );
  if (!applied) return score;

  const status = game.status();
  if (status.kind === 'checkmate') {
    score += 100_000;
  } else if (status.kind === 'playing' && status.inCheck) {
    score += CHECK_BONUS;
  } else if (status.kind === 'stalemate' || status.kind === 'draw') {
    // Mildly avoid accidental draws when ahead on captures.
    score -= 30;
  }

  game.undo();
  return score;
}

/** Delay before the weak AI commits a move (ms). */
export const AI_THINK_MS = 400;
