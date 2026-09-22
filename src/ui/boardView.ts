import type { Move, Square } from 'chess.js';
import type { ChessGame, Color, PieceSymbol } from '../chess/game';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

const PROMO_PIECES: PieceSymbol[] = ['q', 'r', 'b', 'n'];

function pieceSrc(color: Color, type: PieceSymbol): string {
  const prefix = color === 'w' ? 'w' : 'b';
  const map: Record<PieceSymbol, string> = {
    p: 'P',
    n: 'N',
    b: 'B',
    r: 'R',
    q: 'Q',
    k: 'K',
  };
  return `/pieces/${prefix}${map[type]}.svg`;
}

export type BoardViewCallbacks = {
  onMoveCommitted: () => void;
};

export class BoardView {
  private readonly root: HTMLElement;
  private readonly game: ChessGame;
  private readonly callbacks: BoardViewCallbacks;
  private boardEl: HTMLElement;
  private promoOverlay: HTMLElement;
  private promoChoices: HTMLElement;

  private selected: Square | null = null;
  private legalTargets = new Map<Square, Move>();
  private pendingPromo: { from: Square; to: Square } | null = null;
  private interactionLocked = false;

  constructor(
    root: HTMLElement,
    game: ChessGame,
    callbacks: BoardViewCallbacks,
  ) {
    this.root = root;
    this.game = game;
    this.callbacks = callbacks;

    this.boardEl = document.createElement('div');
    this.boardEl.className = 'board';
    this.boardEl.setAttribute('role', 'grid');
    this.boardEl.setAttribute('aria-label', 'Chess board');

    this.promoOverlay = document.createElement('div');
    this.promoOverlay.className = 'promotion-overlay';
    this.promoOverlay.hidden = true;
    this.promoOverlay.setAttribute('role', 'dialog');
    this.promoOverlay.setAttribute('aria-label', 'Choose promotion piece');

    this.promoChoices = document.createElement('div');
    this.promoChoices.className = 'promotion-choices';
    this.promoOverlay.appendChild(this.promoChoices);

    this.root.appendChild(this.boardEl);
    this.root.appendChild(this.promoOverlay);

    this.boardEl.addEventListener('click', (e) => this.onBoardClick(e));
  }

  render(): void {
    const board = this.game.board();
    const last = this.game.lastMove();
    const checkSq = this.game.checkedKingSquare();

    this.boardEl.replaceChildren();

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const file = FILES[f]!;
        const rank = RANKS[r]!;
        const square = `${file}${rank}` as Square;
        const isLight = (f + r) % 2 === 0;
        const cell = board[r]![f]!;

        const sqEl = document.createElement('div');
        sqEl.className = `square ${isLight ? 'light' : 'dark'}`;
        sqEl.dataset.square = square;
        sqEl.setAttribute('role', 'gridcell');

        if (this.selected === square) sqEl.classList.add('selected');
        if (last && (last.from === square || last.to === square)) {
          sqEl.classList.add('last-move');
        }
        if (checkSq === square) sqEl.classList.add('in-check');

        const legal = this.legalTargets.get(square);
        if (legal) {
          if (legal.captured) sqEl.classList.add('legal-capture');
          else sqEl.classList.add('legal-dot');
        }

        if (cell) {
          const img = document.createElement('img');
          img.className = 'piece';
          img.src = pieceSrc(cell.color, cell.type);
          img.alt = `${cell.color === 'w' ? 'White' : 'Black'} ${cell.type}`;
          img.draggable = false;
          sqEl.appendChild(img);
        }

        // Coordinates on a-file and rank 1
        if (f === 0) {
          const coord = document.createElement('span');
          coord.className = 'coord coord-rank';
          coord.textContent = rank;
          sqEl.appendChild(coord);
        }
        if (r === 7) {
          const coord = document.createElement('span');
          coord.className = 'coord coord-file';
          coord.textContent = file;
          sqEl.appendChild(coord);
        }

        this.boardEl.appendChild(sqEl);
      }
    }
  }

  clearSelection(): void {
    this.selected = null;
    this.legalTargets.clear();
  }

  private onBoardClick(e: MouseEvent): void {
    if (this.interactionLocked || this.pendingPromo) return;

    const target = (e.target as HTMLElement).closest('.square') as
      | HTMLElement
      | null;
    if (!target?.dataset.square) return;

    const square = target.dataset.square as Square;
    this.handleSquareClick(square);
  }

  private handleSquareClick(square: Square): void {
    // Second click: attempt move / deselect
    if (this.selected) {
      if (square === this.selected) {
        this.clearSelection();
        this.render();
        return;
      }

      if (this.legalTargets.has(square)) {
        if (this.game.isPromotionMove(this.selected, square)) {
          this.openPromotion(this.selected, square);
          return;
        }
        const move = this.game.tryMove(this.selected, square);
        this.clearSelection();
        this.render();
        if (move) this.callbacks.onMoveCommitted();
        return;
      }
    }

    // Select own piece
    const board = this.game.board();
    const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = 8 - Number(square[1]);
    const piece = board[rank]?.[file] ?? null;

    if (piece && piece.color === this.game.turn()) {
      this.selected = square;
      this.legalTargets.clear();
      for (const m of this.game.movesFrom(square)) {
        this.legalTargets.set(m.to, m);
      }
      this.render();
      return;
    }

    this.clearSelection();
    this.render();
  }

  private openPromotion(from: Square, to: Square): void {
    this.pendingPromo = { from, to };
    this.interactionLocked = true;
    this.promoChoices.replaceChildren();

    const turn = this.game.turn();
    for (const type of PROMO_PIECES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.title = type.toUpperCase();
      const img = document.createElement('img');
      img.src = pieceSrc(turn, type);
      img.alt = type;
      btn.appendChild(img);
      btn.addEventListener('click', () => this.commitPromotion(type));
      this.promoChoices.appendChild(btn);
    }

    this.promoOverlay.hidden = false;
  }

  private commitPromotion(piece: PieceSymbol): void {
    if (!this.pendingPromo) return;
    const { from, to } = this.pendingPromo;
    const move = this.game.tryMove(from, to, piece);
    this.pendingPromo = null;
    this.interactionLocked = false;
    this.promoOverlay.hidden = true;
    this.promoChoices.replaceChildren();
    this.clearSelection();
    this.render();
    if (move) this.callbacks.onMoveCommitted();
  }
}
