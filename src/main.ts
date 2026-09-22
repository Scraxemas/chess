import { ChessGame, type Color } from './chess/game';
import { AI_THINK_MS, chooseWeakMove } from './chess/ai';
import { BoardView } from './ui/boardView';
import './ui/styles.css';

type PlayMode = 'local' | 'ai';

const game = new ChessGame();

const statusEl = document.getElementById('status')!;
const historyEl = document.getElementById('history')!;
const boardWrap = document.getElementById('board-wrap')!;
const btnNew = document.getElementById('btn-new') as HTMLButtonElement;
const btnUndo = document.getElementById('btn-undo') as HTMLButtonElement;
const modeSelect = document.getElementById('mode-select') as HTMLSelectElement;
const colorSelect = document.getElementById('color-select') as HTMLSelectElement;
const colorLabel = document.getElementById('color-label') as HTMLLabelElement;

let playMode: PlayMode = 'local';
let humanColor: Color = 'w';
let aiThinking = false;
let aiTimer: ReturnType<typeof setTimeout> | null = null;
/** Generation counter so cancelled timers ignore stale callbacks. */
let aiGeneration = 0;

function aiColor(): Color {
  return humanColor === 'w' ? 'b' : 'w';
}

function isAiTurn(): boolean {
  if (playMode !== 'ai') return false;
  const s = game.status();
  if (s.kind !== 'playing') return false;
  return s.turn === aiColor();
}

function cancelAiTimer(): void {
  if (aiTimer != null) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }
  aiGeneration += 1;
  aiThinking = false;
}

function formatStatus(): string {
  if (aiThinking) return 'AI thinking…';

  const s = game.status();
  switch (s.kind) {
    case 'playing': {
      const side = s.turn === 'w' ? 'White' : 'Black';
      const vsAi =
        playMode === 'ai'
          ? s.turn === humanColor
            ? ' (you)'
            : ' (AI)'
          : '';
      return s.inCheck
        ? `${side} to move — Check!${vsAi}`
        : `${side} to move${vsAi}`;
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

function syncHumanInput(): void {
  // Human may click only in local mode, or on their turn in AI mode (not while thinking).
  const allow =
    !aiThinking &&
    (playMode === 'local' ||
      (game.status().kind === 'playing' && game.turn() === humanColor));
  board.setHumanInputEnabled(allow);
}

function refreshChrome(): void {
  statusEl.textContent = formatStatus();
  renderHistory();
  btnUndo.disabled = game.historySan().length === 0 || aiThinking;
  syncHumanInput();
}

function scheduleAiMove(): void {
  if (playMode !== 'ai' || !isAiTurn() || aiThinking) return;

  aiThinking = true;
  const gen = ++aiGeneration;
  refreshChrome();
  board.render();

  aiTimer = setTimeout(() => {
    aiTimer = null;
    if (gen !== aiGeneration) return;
    if (playMode !== 'ai' || !isAiTurn()) {
      aiThinking = false;
      refreshChrome();
      board.render();
      return;
    }

    const choice = chooseWeakMove(game);
    if (choice) {
      game.tryMove(
        choice.from,
        choice.to,
        choice.promotion ? 'q' : undefined,
      );
    }

    aiThinking = false;
    board.clearSelection();
    board.render();
    refreshChrome();
  }, AI_THINK_MS);
}

function afterHumanMove(): void {
  refreshChrome();
  board.render();
  scheduleAiMove();
}

function updateModeUi(): void {
  const vsAi = playMode === 'ai';
  colorLabel.hidden = !vsAi;
  colorSelect.disabled = !vsAi;
}

const board = new BoardView(boardWrap, game, {
  onMoveCommitted: () => {
    afterHumanMove();
  },
});

btnNew.addEventListener('click', () => {
  cancelAiTimer();
  game.reset();
  board.clearSelection();
  board.render();
  refreshChrome();
  scheduleAiMove(); // AI moves first if human chose Black
});

btnUndo.addEventListener('click', () => {
  if (game.historySan().length === 0) return;

  cancelAiTimer();

  if (playMode === 'ai') {
    // Preferred: undo a full ply pair (human + AI).
    // If it is the AI's turn, the human just moved and AI has not replied — undo once.
    // Otherwise (human to move, or game over after AI), undo AI then human when possible.
    if (isAiTurn()) {
      game.undo();
    } else {
      const before = game.historySan().length;
      if (before >= 1) game.undo(); // AI (or last) move
      if (game.historySan().length >= 1 && before >= 2) game.undo(); // human move
    }
  } else {
    game.undo();
  }

  board.clearSelection();
  board.render();
  refreshChrome();
  // Do not auto-trigger AI after undo; human is to move (or local).
});

modeSelect.addEventListener('change', () => {
  cancelAiTimer();
  playMode = modeSelect.value === 'ai' ? 'ai' : 'local';
  updateModeUi();
  game.reset();
  board.clearSelection();
  board.render();
  refreshChrome();
  scheduleAiMove();
});

colorSelect.addEventListener('change', () => {
  cancelAiTimer();
  humanColor = colorSelect.value === 'b' ? 'b' : 'w';
  game.reset();
  board.clearSelection();
  board.render();
  refreshChrome();
  scheduleAiMove();
});

updateModeUi();
board.render();
refreshChrome();
