# Chess

A playable browser chess game built with vanilla HTML, CSS, and TypeScript (Vite).

## Features

- Full legal chess via [chess.js](https://github.com/jhlywa/chess.js) (castling, en passant, promotion, check / mate / stalemate)
- Click-to-move with legal-move highlights
- Blocking promotion overlay (queen / rook / bishop / knight)
- Status line, New Game, Undo, and SAN move history
- **Local 2-player** or **Play vs AI** (weak heuristic — not Stockfish)
- **Theme** switch: Classic pieces or **Pokémon** (Fire vs Water armies) with original placeholders; optional local Trozei-style PNG drop-in (gitignored)

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


## Themes

Use the **Theme** control (next to Mode):

| Theme | Pieces |
|-------|--------|
| **Classic** | Standard chess SVGs (`public/pieces/`) |
| **Pokémon** | Fire (White) vs Water (Black) — see roster below |

Preference is saved in `localStorage` (`chess-theme`).

### Pokémon roster

| Role | White (Fire) | Black (Water) |
|------|--------------|---------------|
| K | Charizard | Blastoise |
| Q | Delphox | Milotic |
| R | Magcargo | Carracosta |
| B | Chandelure | Samurott |
| N | Rapidash | Kingdra |
| P | Fennekin | Froakie |

Back ranks: **R N B Q K B N R** with those species.

### Optional Trozei-style assets

The app tries `/themes/pokemon/trozei/{wK|wQ|…|bP}.png` first, then falls back to original placeholders in `public/themes/pokemon/placeholders/`.

1. Drop PNGs into `public/themes/pokemon/trozei/` using the filenames listed in `public/themes/pokemon/README.md`.
2. Those PNGs are **gitignored** — do not commit Nintendo / TPC artwork.

## Play vs AI

1. Open the app (`npm run dev`).
2. Set **Mode** to **Play vs AI**.
3. Optionally choose **You play** White (default) or Black.
4. Make moves on your turn. While the AI thinks, the status shows **AI thinking…** and board clicks are disabled.

### Undo vs AI

Undo removes a **full ply pair** when possible: the AI’s last move and your preceding move, so it is your turn again. If you just moved and the AI has not replied yet, Undo takes back only your move.

### AI limitations

- Shallow **1-ply** material heuristic (prefers captures and checks lightly); otherwise roughly random among quiet moves.
- Always promotes to **queen**.
- Intentionally weak — no opening book, no depth search, no Stockfish.

## Architecture

- `src/chess/game.ts` — thin wrapper around chess.js (single source of truth for position)
- `src/chess/ai.ts` — weak move chooser
- `src/ui/boardView.ts` — custom board render + click interaction (no chessground)
- `src/ui/themes.ts` — Classic / Pokémon piece URL resolvers + board chrome
- Piece artwork: `public/pieces/` (classic); `public/themes/pokemon/placeholders/` (Pokémon)

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

### Pokémon theme placeholders

Original type-colored SVG tokens in this repository (not Nintendo / TPC sprites).
Optional Trozei-style PNGs are for **local use only** and must not be committed.

