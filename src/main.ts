import { ChessGame } from './chess/game';
import { BoardView } from './ui/boardView';
import './ui/styles.css';

const game = new ChessGame();

const statusEl = document.getElementById('status')!;
const historyEl = document.getElementById('history')!;
const boardWrap = document.getElementById('board-wrap')!;
const btnNew = document.getElementById('btn-new') as HTMLButtonElement;
const btnUndo = document.getElementById('btn-undo') as HTMLButtonElement;

function formatStatus(): string {
  const s = game.status();
  switch (s.kind) {
    case 'playing': {
      const side = s.turn === 'w' ? 'White' : 'Black';
      return s.inCheck ? `${side} to move — Check!` : `${side} to move`;
    }
    case 'checkmate': {
      const winner = s.winner === 'w' ? 'White' : 'Black';
      return `Checkmate — ${winner} wins`;
    }
    case 'stalemate':
      return 'Stalemate — draw';
    case 'draw':
      return `Draw — ${s.reason}`;
  }
}

function renderHistory(): void {
  const sans = game.historySan();
  historyEl.replaceChildren();
  for (let i = 0; i < sans.length; i += 2) {
    const li = document.createElement('li');
    const white = sans[i]!;
    const black = sans[i + 1];
    li.textContent = black ? `${white} ${black}` : white;
    historyEl.appendChild(li);
  }
}

function refreshChrome(): void {
  statusEl.textContent = formatStatus();
  renderHistory();
  btnUndo.disabled = game.historySan().length === 0;
}

const board = new BoardView(boardWrap, game, {
  onMoveCommitted: () => {
    refreshChrome();
  },
});

btnNew.addEventListener('click', () => {
  game.reset();
  board.clearSelection();
  board.render();
  refreshChrome();
});

btnUndo.addEventListener('click', () => {
  if (!game.undo()) return;
  board.clearSelection();
  board.render();
  refreshChrome();
});

board.render();
refreshChrome();
