import type { Square } from 'chess.js';
import type { AiMove } from './ai';

/** Served from Vite `public/` (stable URL; companion .wasm resolves beside the .js). */
const STOCKFISH_WORKER_URL = `${import.meta.env.BASE_URL}stockfish/stockfish-19-lite-single.js`;

/** High strength: max Skill Level + ~1s think time. */
const MASTER_SKILL = 20;
const MASTER_MOVETIME_MS = 1000;

/**
 * Browser Stockfish via Web Worker + WASM (nmrugg stockfish.js lite-single).
 * One shared worker; searches cancelled with UCI `stop` + generation bump.
 */
export class StockfishEngine {
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;
  /** Bumped to invalidate in-flight searches (mirrors main.ts aiGeneration). */
  private searchGeneration = 0;

  /** Start / reuse the worker and finish UCI handshake. */
  private ensureReady(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<void>((resolve, reject) => {
      let settled = false;
      const fail = (err: unknown) => {
        if (settled) return;
        settled = true;
        this.disposeWorker();
        this.initPromise = null;
        reject(err instanceof Error ? err : new Error(String(err)));
      };

      try {
        const worker = new Worker(STOCKFISH_WORKER_URL);
        this.worker = worker;

        const onMessage = (ev: MessageEvent) => {
          const line = String(ev.data);
          if (line === 'uciok') {
            worker.postMessage(
              `setoption name Skill Level value ${MASTER_SKILL}`,
            );
            worker.postMessage('isready');
          } else if (line === 'readyok') {
            if (settled) return;
            settled = true;
            worker.removeEventListener('message', onMessage);
            worker.removeEventListener('error', onError);
            resolve();
          }
        };

        const onError = (ev: ErrorEvent) => {
          fail(ev.message || 'Stockfish worker failed to load');
        };

        worker.addEventListener('message', onMessage);
        worker.addEventListener('error', onError);
        worker.postMessage('uci');
      } catch (err) {
        fail(err);
      }
    });

    return this.initPromise;
  }

  /**
   * Stop any search and wait until the engine acknowledges `readyok`,
   * so a stale `bestmove` cannot be mistaken for a new search result.
   */
  private syncAfterStop(gen: number): Promise<boolean> {
    const worker = this.worker;
    if (!worker) return Promise.resolve(false);

    return new Promise((resolve) => {
      const onMessage = (ev: MessageEvent) => {
        if (String(ev.data) !== 'readyok') return;
        worker.removeEventListener('message', onMessage);
        resolve(gen === this.searchGeneration);
      };
      worker.addEventListener('message', onMessage);
      worker.postMessage('stop');
      worker.postMessage('isready');
    });
  }

  /**
   * Ask Stockfish for the best move from `fen`.
   * Returns null if cancelled, engine failed, or no legal move.
   */
  async getBestMove(fen: string): Promise<AiMove | null> {
    const gen = ++this.searchGeneration;

    try {
      await this.ensureReady();
    } catch {
      return null;
    }

    if (gen !== this.searchGeneration || !this.worker) return null;

    const synced = await this.syncAfterStop(gen);
    if (!synced || !this.worker) return null;

    const worker = this.worker;

    return new Promise<AiMove | null>((resolve) => {
      const finish = (move: AiMove | null) => {
        worker.removeEventListener('message', onMessage);
        resolve(move);
      };

      const onMessage = (ev: MessageEvent) => {
        const line = String(ev.data);
        if (!line.startsWith('bestmove')) return;
        if (gen !== this.searchGeneration) {
          finish(null);
          return;
        }
        finish(parseBestMove(line));
      };

      worker.addEventListener('message', onMessage);
      worker.postMessage('ucinewgame');
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go movetime ${MASTER_MOVETIME_MS}`);
    });
  }

  /** Cancel in-flight search (New Game / Undo / mode / color / difficulty). */
  cancel(): void {
    this.searchGeneration += 1;
    try {
      this.worker?.postMessage('stop');
    } catch {
      // Worker may already be dead.
    }
  }

  /** Tear down the worker entirely. */
  dispose(): void {
    this.cancel();
    this.disposeWorker();
    this.initPromise = null;
  }

  private disposeWorker(): void {
    if (!this.worker) return;
    try {
      this.worker.postMessage('quit');
    } catch {
      // ignore
    }
    try {
      this.worker.terminate();
    } catch {
      // ignore
    }
    this.worker = null;
  }
}

/** Parse `bestmove e2e4`, `bestmove e7e8q`, or `bestmove (none)`. */
export function parseBestMove(line: string): AiMove | null {
  const parts = line.trim().split(/\s+/);
  const token = parts[1];
  if (!token || token === '(none)') return null;

  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(token)) return null;

  const from = token.slice(0, 2) as Square;
  const to = token.slice(2, 4) as Square;
  const promo = token[4]?.toLowerCase();

  if (promo === 'q' || promo === 'r' || promo === 'b' || promo === 'n') {
    return { from, to, promotion: promo };
  }
  return { from, to };
}
