import { Chess, type Square } from 'chess.js';
import type { Difficulty, Promotion } from '../types';

export interface EngineMove { from: Square; to: Square; promotion?: Promotion }
export interface EngineWorker {
  postMessage(message: string): void;
  terminate(): void;
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
}
const LEVELS = {
  easy: { skill: 0, time: 250 }, medium: { skill: 8, time: 750 }, hard: { skill: 18, time: 1600 },
};
interface Pending {
  fen: string; difficulty: Difficulty;
  resolve: (move: EngineMove) => void; reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

/** One UCI search at a time. Cancellation terminates the worker, eliminating stale output. */
export class StockfishEngine {
  private worker: EngineWorker | null = null;
  private pending: Pending | null = null;
  private ready = false;
  constructor(private createWorker: () => EngineWorker = () => new Worker(`${import.meta.env.BASE_URL}assets/engine/stockfish.js`)) {}

  search(fen: string, difficulty: Difficulty): Promise<EngineMove> {
    this.cancel();
    const chess = new Chess(fen);
    if (chess.isGameOver()) return Promise.reject(new Error('Ván cờ đã kết thúc.'));
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => this.fail(new Error('AI không phản hồi. Hãy thử lại hoặc giảm mức độ.')), 30000);
      this.pending = { fen, difficulty, resolve, reject, timeout };
      try {
        const worker = this.createWorker();
        this.worker = worker;
        worker.onmessage = (event) => { if (this.worker === worker) this.receive(String(event.data)); };
        worker.onerror = () => { if (this.worker === worker) this.fail(new Error('Không tải được Stockfish. Kiểm tra asset WASM và chạy npm run prepare:engine.')); };
        worker.postMessage('uci');
      } catch {
        this.fail(new Error('Trình duyệt không khởi tạo được Web Worker cho Stockfish.'));
      }
    });
  }

  private receive(line: string) {
    const pending = this.pending;
    if (!pending || !this.worker) return;
    if (line.trim() === 'uciok') {
      const level = LEVELS[pending.difficulty];
      this.worker.postMessage('setoption name Hash value 16');
      this.worker.postMessage(`setoption name Skill Level value ${level.skill}`);
      this.worker.postMessage('ucinewgame');
      this.worker.postMessage('isready');
    }
    if (line.trim() === 'readyok' && !this.ready) {
      this.ready = true;
      this.worker.postMessage(`position fen ${pending.fen}`);
      this.worker.postMessage(`go movetime ${LEVELS[pending.difficulty].time}`);
    }
    if (line.startsWith('bestmove ')) {
      const uci = line.split(/\s+/)[1];
      if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) {
        this.fail(new Error('AI không trả về một nước đi hợp lệ.')); return;
      }
      const move: EngineMove = { from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, promotion: uci[4] as Promotion | undefined };
      const chess = new Chess(pending.fen);
      try { chess.move(move); }
      catch { this.fail(new Error('Nước đi của AI không hợp lệ trong vị trí hiện tại.')); return; }
      clearTimeout(pending.timeout);
      this.pending = null;
      pending.resolve(move);
      this.disposeWorker();
    }
  }

  private disposeWorker() {
    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      this.worker.terminate();
      this.worker = null;
    }
    this.ready = false;
  }

  private fail(error: Error) {
    if (this.pending) {
      clearTimeout(this.pending.timeout);
      this.pending.reject(error);
      this.pending = null;
    }
    this.disposeWorker();
  }

  cancel() { this.fail(new DOMException('Đã hủy tìm kiếm AI.', 'AbortError')); }
}
