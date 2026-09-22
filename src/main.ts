import { ChessGame, type Color } from './chess/game';
import { AI_THINK_MS, chooseWeakMove } from './chess/ai';
import { BoardView } from './ui/boardView';
import {
  applyThemeChrome,
  loadTheme,
  saveTheme,
  sideLabel,
  type ThemeId,
} from './ui/themes';
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
const themeSelect = document.getElementById('theme-select') as HTMLSelectElement;

let board!: BoardView;

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

function currentTheme(): ThemeId {
  return themeSelect.value === 'pokemon' ? 'pokemon' : 'classic';
}

function syncColorOptionLabels(): void {
  const theme = currentTheme();
  for (const opt of Array.from(colorSelect.options)) {
    if (opt.value === 'w') opt.textContent = sideLabel(theme, 'w');
    if (opt.value === 'b') opt.textContent = sideLabel(theme, 'b');
  }
  colorSelect.setAttribute(
    'aria-label',
    theme === 'pokemon' ? 'Your team' : 'Your color',
  );
}

function formatStatus(): string {
  if (aiThinking) return 'AI thinking…';

  const theme = currentTheme();
  const s = game.status();
  switch (s.kind) {
    case 'playing': {
      const side = sideLabel(theme, s.turn);
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
      const winner = sideLabel(theme, s.winner);
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
  const promoPending = board.isPromotionPending();
  btnNew.disabled = promoPending;
  btnUndo.disabled =
    promoPending || game.historySan().length === 0 || aiThinking;
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
    board.cancelPromotion();
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

board = new BoardView(boardWrap, game, {
  onMoveCommitted: () => {
    afterHumanMove();
  },
  onUiStateChanged: () => {
    refreshChrome();
  },
});

btnNew.addEventListener('click', () => {
  cancelAiTimer();
  board.cancelPromotion();
  game.reset();
  board.clearSelection();
  board.render();
  refreshChrome();
  scheduleAiMove(); // AI moves first if human chose Black
});

btnUndo.addEventListener('click', () => {
  // Pending promo is not in chess.js yet — cancel UI only, do not undo.
  if (board.isPromotionPending()) {
    cancelAiTimer();
    board.cancelPromotion();
    board.render();
    refreshChrome();
    return;
  }

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

  board.cancelPromotion();
  board.clearSelection();
  board.render();
  refreshChrome();
  // If undo left AI to move (e.g. human-as-Black undid the opening AI ply), reschedule.
  scheduleAiMove();
});

modeSelect.addEventListener('change', () => {
  cancelAiTimer();
  board.cancelPromotion();
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
  board.cancelPromotion();
  humanColor = colorSelect.value === 'b' ? 'b' : 'w';
  game.reset();
  board.clearSelection();
  board.render();
  refreshChrome();
  scheduleAiMove();
});

themeSelect.addEventListener('change', () => {
  const theme: ThemeId =
    themeSelect.value === 'pokemon' ? 'pokemon' : 'classic';
  saveTheme(theme);
  applyThemeChrome(theme);
  board.setTheme(theme);
  syncColorOptionLabels();
  refreshChrome();
});

const initialTheme = loadTheme();
themeSelect.value = initialTheme;
applyThemeChrome(initialTheme);
board.setTheme(initialTheme);
syncColorOptionLabels();

updateModeUi();
board.render();
refreshChrome();