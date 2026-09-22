# Stockfish.js (browser assets)

Vendored **lite single-threaded** build of [Stockfish.js](https://github.com/nmrugg/stockfish.js) v19
(`stockfish-19-lite-single.js` + `.wasm`).

- Source: Chess.com / nmrugg Stockfish.js
- License: **GPL-3.0** — see `Copying.txt`
- Why lite-single: ~1.8 MB, no cross-origin isolation / SharedArrayBuffer required; still far stronger than human play at Skill Level 20

Do not replace with the full (~94 MB) multi-threaded engine unless you also configure COOP/COEP headers.
