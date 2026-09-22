# Chess

A playable browser chess game built with vanilla HTML, CSS, and TypeScript (Vite).

## Features

- Full legal chess via [chess.js](https://github.com/jhlywa/chess.js) (castling, en passant, promotion, check / mate / stalemate)
- Click-to-move with legal-move highlights
- Blocking promotion overlay (queen / rook / bishop / knight)
- Status line, New Game, Undo, and SAN move history

## Run locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Architecture

- `src/chess/game.ts` — thin wrapper around chess.js (single source of truth for position)
- `src/ui/boardView.ts` — custom board render + click interaction (no chessground)
- Piece artwork lives in `public/pieces/`

## Credits & licenses

### Rules engine

- [chess.js](https://github.com/jhlywa/chess.js) — BSD-2-Clause

### Piece artwork

Chess piece SVGs by **Colin M. L. Burnett** (Cburnett), from the Wikimedia Commons set
(e.g. [Chess_plt45.svg](https://commons.wikimedia.org/wiki/File:Chess_plt45.svg)).
Used under the **BSD-3-Clause** license offered by the author (the set is multi-licensed;
this project chooses BSD only).

Copyright (c) 2006, Colin M. L. Burnett  
All rights reserved.
