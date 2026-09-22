import { Chess, type Move, type Square } from 'chess.js';

export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type Color = 'w' | 'b';

export type BoardSquare = {
  square: Square;
  type: PieceSymbol;
  color: Color;
} | null;

export type GameStatus =
  | { kind: 'playing'; turn: Color; inCheck: boolean }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'stalemate' }
  | { kind: 'draw'; reason: string };

/** Thin wrapper — chess.js is the single source of truth for position. */
export class ChessGame {
  private chess = new Chess();

  reset(): void {
    this.chess.reset();
  }

  undo(): Move | null {
    return this.chess.undo();
  }

  turn(): Color {
    return this.chess.turn();
  }

  fen(): string {
    return this.chess.fen();
  }

  board(): BoardSquare[][] {
    return this.chess.board() as BoardSquare[][];
  }

  historySan(): string[] {
    return this.chess.history();
  }

  movesFrom(from: Square): Move[] {
    return this.chess.moves({ square: from, verbose: true });
  }

  isPromotionMove(from: Square, to: Square): boolean {
    const moves = this.movesFrom(from).filter((m) => m.to === to);
    return moves.some((m) => m.promotion != null);
  }

  tryMove(
    from: Square,
    to: Square,
    promotion?: PieceSymbol,
  ): Move | null {
    try {
      const move = this.chess.move({
        from,
        to,
        promotion: promotion ?? undefined,
      });
      return move ?? null;
    } catch {
      return null;
    }
  }

  status(): GameStatus {
    if (this.chess.isCheckmate()) {
      // Side to move is mated; winner is the other side.
      const winner: Color = this.chess.turn() === 'w' ? 'b' : 'w';
      return { kind: 'checkmate', winner };
    }
    if (this.chess.isStalemate()) {
      return { kind: 'stalemate' };
    }
    if (this.chess.isDraw()) {
      let reason = 'draw';
      if (this.chess.isThreefoldRepetition()) reason = 'threefold repetition';
      else if (this.chess.isInsufficientMaterial()) reason = 'insufficient material';
      else if (this.chess.isDrawByFiftyMoves()) reason = 'fifty-move rule';
      return { kind: 'draw', reason };
    }
    return {
      kind: 'playing',
      turn: this.chess.turn(),
      inCheck: this.chess.isCheck(),
    };
  }

  /** Algebraic square of the king in check, if any. */
  checkedKingSquare(): Square | null {
    if (!this.chess.isCheck()) return null;
    const color = this.chess.turn();
    for (const row of this.chess.board()) {
      for (const cell of row) {
        if (cell && cell.type === 'k' && cell.color === color) {
          return cell.square;
        }
      }
    }
    return null;
  }

  lastMove(): Move | null {
    const verbose = this.chess.history({ verbose: true });
    return verbose.length ? verbose[verbose.length - 1]! : null;
  }
}
