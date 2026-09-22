# Chess

A playable browser chess game built with vanilla HTML, CSS, and TypeScript (Vite).

## Features

- Full legal chess via [chess.js](https://github.com/jhlywa/chess.js) (castling, en passant, promotion, check / mate / stalemate)
- Click-to-move with legal-move highlights
- Blocking promotion overlay (queen / rook / bishop / knight)
- Status line, New Game, Undo, and SAN move history
- **Local 2-player** or **Play vs AI** with **Weak** and **Master** difficulty
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
3. Choose **Difficulty**: **Weak** or **Master** (shown only in AI mode).
4. Optionally choose **You play** White (default) or Black.
5. Make moves on your turn. While the AI thinks, the status shows **AI thinking…** and board clicks are disabled.

Difficulty is saved in `localStorage` (`chess-ai-difficulty`).

### Undo vs AI

Undo removes a **full ply pair** when possible: the AI’s last move and your preceding move, so it is your turn again. If you just moved and the AI has not replied yet, Undo takes back only your move.

### Weak

- Shallow **1-ply** material heuristic (prefers captures and checks lightly); otherwise roughly random among quiet moves.
- Always promotes to **queen**.
- Short artificial delay (`AI_THINK_MS`) so moves feel deliberate.

### Master (Stockfish)

- In-browser **Stockfish.js** (lite single-threaded WASM) via a Web Worker.
- Assets under `public/stockfish/` (`stockfish-19-lite-single.js` + `.wasm`).
- Strength: UCI **Skill Level 20** and **`go movetime 1000`** (~1 second per move).
- First visit downloads ~1.8 MB of WASM; later loads are cached by the browser.
- Does **not** need cross-origin isolation (no SharedArrayBuffer). The full multi-thread Stockfish build is intentionally not used.
- In-flight searches are cancelled on New Game, Undo, and Mode / You play / Difficulty changes (same generation pattern as Weak).

## Architecture

- `src/chess/game.ts` — thin wrapper around chess.js (single source of truth for position)
- `src/chess/ai.ts` — weak move chooser + difficulty helpers
- `src/chess/stockfishEngine.ts` — Master AI (Stockfish Worker / UCI)
- `src/ui/boardView.ts` — custom board render + click interaction (no chessground)
- `src/ui/themes.ts` — Classic / Pokémon piece URL resolvers + board chrome
- Piece artwork: `public/pieces/` (classic); `public/themes/pokemon/placeholders/` (Pokémon)
- Engine assets: `public/stockfish/`

## Credits & licenses

### Rules engine

- [chess.js](https://github.com/jhlywa/chess.js) — BSD-2-Clause

### Master AI

- [Stockfish.js](https://github.com/nmrugg/stockfish.js) (Chess.com / nmrugg) — **GPL-3.0** (see `public/stockfish/Copying.txt`)
- Based on [Stockfish](https://github.com/official-stockfish/Stockfish)

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
