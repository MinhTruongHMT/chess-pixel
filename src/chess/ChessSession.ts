import { Chess, type Color, type Move, type Square } from 'chess.js';
import type { GameMode, Promotion, Result } from '../types';

export interface GameSnapshot {
  fen: string;
  turn: Color;
  history: Move[];
  lastMove: Move | null;
  result: Result | null;
  mode: GameMode;
  clocks: Record<Color, number>;
  running: boolean;
  minutes: number;
  revision: number;
}

export function chessResult(chess: Chess): Result | null {
  if (chess.isCheckmate()) return { winner: chess.turn() === 'w' ? 'b' : 'w', reason: 'Chiếu hết' };
  if (chess.isStalemate()) return { winner: null, reason: 'Hết nước đi hợp lệ' };
  if (chess.isThreefoldRepetition()) return { winner: null, reason: 'Lặp lại vị trí ba lần' };
  if (chess.isDrawByFiftyMoves()) return { winner: null, reason: 'Luật 50 nước đi' };
  if (chess.isInsufficientMaterial()) return { winner: null, reason: 'Không đủ quân để chiếu hết' };
  return null;
}

/** chess.js is the sole source of board state. Snapshots are read-only UI projections. */
export class ChessSession {
  private engine = new Chess();
  private listeners = new Set<() => void>();
  private mode: GameMode = 'local';
  private clocks: Record<Color, number> = { w: 600000, b: 600000 };
  private clockHistory: Record<Color, number>[] = [];
  private running = false;
  private result: Result | null = null;
  private revision = 0;
  private previousTime = 0;
  private initialMinutes = 10;
  private snapshot: GameSnapshot = this.makeSnapshot();

  get chess() { return this.engine; }
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  private makeSnapshot(force = false): GameSnapshot {
    const fen = this.engine.fen();
    const history = !force && this.snapshot?.fen === fen ? this.snapshot.history : this.engine.history({ verbose: true });
    return {
      fen, turn: this.engine.turn(), history,
      lastMove: history.at(-1) ?? null, result: this.result, mode: this.mode,
      clocks: { ...this.clocks }, running: this.running, minutes: this.initialMinutes, revision: this.revision,
    };
  }

  private publish(positionChanged = false) {
    if (positionChanged) this.revision++;
    this.snapshot = this.makeSnapshot(positionChanged);
    this.listeners.forEach((listener) => listener());
  }

  start(mode: GameMode, minutes: number, now = Date.now()) {
    this.engine = new Chess();
    this.mode = mode;
    this.initialMinutes = minutes;
    this.clocks = { w: minutes * 60000, b: minutes * 60000 };
    this.clockHistory = [];
    this.result = null;
    this.running = true;
    this.previousTime = now;
    this.publish(true);
  }

  legalMoves(square: Square) { return this.engine.moves({ square, verbose: true }); }

  move(from: Square, to: Square, promotion: Promotion = 'q', now = Date.now()): Move | null {
    this.tick(now);
    if (this.result || !this.running) return null;
    const before = { ...this.clocks };
    let move: Move;
    try { move = this.engine.move({ from, to, promotion }); }
    catch { return null; }
    this.clockHistory.push(before);
    this.result = chessResult(this.engine);
    if (this.result) this.running = false;
    this.previousTime = now;
    this.publish(true);
    return move;
  }

  undo(now = Date.now()) {
    this.tick(now);
    if (!this.engine.history().length) return;
    const count = this.mode === 'ai' && this.engine.turn() === 'w' ? 2 : 1;
    for (let i = 0; i < count; i++) {
      if (!this.engine.undo()) break;
      this.clocks = this.clockHistory.pop() ?? this.clocks;
    }
    this.result = chessResult(this.engine);
    this.running = !this.result;
    this.previousTime = now;
    this.publish(true);
  }

  tick(now = Date.now()) {
    if (!this.running || this.result || this.initialMinutes === 0) return;
    const elapsed = Math.max(0, now - this.previousTime);
    this.previousTime = now;
    const turn = this.engine.turn();
    this.clocks[turn] = Math.max(0, this.clocks[turn] - elapsed);
    if (this.clocks[turn] === 0) {
      this.result = { winner: turn === 'w' ? 'b' : 'w', reason: 'Hết thời gian' };
      this.running = false;
      this.publish(true);
    } else this.publish();
  }

  pause(now = Date.now()) {
    this.tick(now);
    this.running = false;
    this.publish(true);
  }

  resume(now = Date.now()) {
    if (this.result) return;
    this.previousTime = now;
    this.running = true;
    this.publish(true);
  }

  serialize(now = Date.now()): string {
    this.tick(now);
    return JSON.stringify({
      version: 1, pgn: this.engine.pgn(), fen: this.engine.fen(), mode: this.mode,
      minutes: this.initialMinutes, clocks: this.clocks,
      clockHistory: this.clockHistory, result: this.result,
    });
  }

  /** Validate everything before mutating the live game; PGN preserves repetition history. */
  restore(raw: string, now = Date.now()) {
    const data: unknown = JSON.parse(raw);
    if (!isSavedGame(data)) throw new Error('File lưu ván cờ không hợp lệ.');
    const candidate = new Chess();
    candidate.loadPgn(data.pgn);
    if (candidate.fen() !== data.fen || candidate.history().length !== data.clockHistory.length)
      throw new Error('Dữ liệu ván cờ không khớp.');
    const boardResult = chessResult(candidate);
    if (data.result && data.result.reason !== 'Hết thời gian' &&
      JSON.stringify(boardResult) !== JSON.stringify(data.result)) throw new Error('Kết quả ván cờ không hợp lệ.');
    if (data.result?.reason === 'Hết thời gian' &&
      (data.minutes === 0 || data.clocks[candidate.turn()] !== 0 || data.result.winner !== (candidate.turn() === 'w' ? 'b' : 'w')))
      throw new Error('Đồng hồ của ván cờ không hợp lệ.');
    this.engine = candidate;
    this.mode = data.mode;
    this.initialMinutes = data.minutes;
    this.clocks = { ...data.clocks };
    this.clockHistory = data.clockHistory.map((clock) => ({ ...clock }));
    this.result = boardResult ?? data.result;
    this.running = !this.result;
    this.previousTime = now;
    this.publish(true);
  }
}

interface SavedGame {
  version: 1; pgn: string; fen: string; mode: GameMode; minutes: number;
  clocks: Record<Color, number>; clockHistory: Record<Color, number>[]; result: Result | null;
}

function isClock(value: unknown): value is Record<Color, number> {
  if (!value || typeof value !== 'object') return false;
  const clock = value as Record<string, unknown>;
  return typeof clock.w === 'number' && Number.isFinite(clock.w) && clock.w >= 0 &&
    typeof clock.b === 'number' && Number.isFinite(clock.b) && clock.b >= 0;
}

function isSavedGame(value: unknown): value is SavedGame {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  const result = data.result;
  const validResult = result === null || (typeof result === 'object' && result !== null &&
    'winner' in result && (result.winner === 'w' || result.winner === 'b' || result.winner === null) &&
    'reason' in result && typeof result.reason === 'string');
  return data.version === 1 && typeof data.pgn === 'string' && typeof data.fen === 'string' &&
    (data.mode === 'local' || data.mode === 'ai') && typeof data.minutes === 'number' &&
    [0, 3, 5, 10, 15, 30].includes(data.minutes) && isClock(data.clocks) &&
    Array.isArray(data.clockHistory) && data.clockHistory.every(isClock) && validResult;
}
