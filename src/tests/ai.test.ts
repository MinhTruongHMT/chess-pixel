import { describe, expect, it, vi, afterEach } from 'vitest';
import { Chess } from 'chess.js';
import { StockfishEngine, type EngineWorker } from '../ai/StockfishEngine';
import { ChessSession } from '../chess/ChessSession';

class FakeWorker implements EngineWorker {
  commands: string[] = [];
  terminated = false;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postMessage(message: string) { this.commands.push(message); }
  terminate() { this.terminated = true; }
  emit(message: string) { this.onmessage?.({ data: message } as MessageEvent<string>); }
}

afterEach(() => vi.useRealTimers());

describe('Stockfish UCI adapter', () => {
  it('đợi handshake rồi gửi vị trí, mức độ và thời gian tìm kiếm', async () => {
    const worker = new FakeWorker();
    const engine = new StockfishEngine(() => worker);
    const answer = engine.search(new Chess().fen(), 'hard');
    expect(worker.commands).toEqual(['uci']);
    worker.emit('uciok');
    expect(worker.commands).toContain('setoption name Skill Level value 18');
    expect(worker.commands.some((line) => line.startsWith('go '))).toBe(false);
    worker.emit('readyok');
    expect(worker.commands).toContain('go movetime 1600');
    worker.emit('bestmove e2e4 ponder e7e5');
    expect(await answer).toEqual({ from: 'e2', to: 'e4', promotion: undefined });
    expect(worker.terminated).toBe(true);
  });
  it('từ chối kết quả bất hợp lệ', async () => {
    const worker = new FakeWorker();
    const engine = new StockfishEngine(() => worker);
    const answer = engine.search(new Chess().fen(), 'easy');
    const rejected = expect(answer).rejects.toThrow('không hợp lệ');
    worker.emit('bestmove e2e5');
    await rejected;
    expect(worker.terminated).toBe(true);
  });
  it('hủy worker cũ, bỏ mọi phản hồi cũ khi restart', async () => {
    const workers: FakeWorker[] = [];
    const engine = new StockfishEngine(() => { const worker = new FakeWorker(); workers.push(worker); return worker; });
    const old = engine.search(new Chess().fen(), 'easy');
    const rejectOld = expect(old).rejects.toHaveProperty('name', 'AbortError');
    const staleListener = workers[0].onmessage;
    engine.cancel();
    await rejectOld;
    expect(workers[0].terminated).toBe(true);
    // A queued callback after cancellation is ignored while no request is pending.
    staleListener?.({ data: 'bestmove e2e4' } as MessageEvent<string>);
    const fresh = engine.search(new Chess().fen(), 'medium');
    staleListener?.({ data: 'bestmove e2e4' } as MessageEvent<string>);
    workers[0].emit('bestmove e2e4');
    workers[1].emit('uciok'); workers[1].emit('readyok'); workers[1].emit('bestmove d2d4');
    expect((await fresh).from).toBe('d2');
  });
  it('không khởi tạo AI sau khi ván đã kết thúc', async () => {
    const createWorker = vi.fn(() => new FakeWorker());
    const engine = new StockfishEngine(createWorker);
    await expect(engine.search('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', 'hard')).rejects.toThrow('kết thúc');
    expect(createWorker).not.toHaveBeenCalled();
  });
  it('timeout hủy tìm kiếm và thông báo lỗi', async () => {
    vi.useFakeTimers();
    const worker = new FakeWorker();
    const engine = new StockfishEngine(() => worker);
    const answer = engine.search(new Chess().fen(), 'hard');
    const rejected = expect(answer).rejects.toThrow('không phản hồi');
    vi.advanceTimersByTime(30001);
    await rejected;
    expect(worker.terminated).toBe(true);
  });
  it('không áp dụng đáp án AI đã lấy trước khi session restart', async () => {
    const session = new ChessSession();
    session.start('ai', 0, 0);
    session.move('e2', 'e4', 'q', 0);
    const request = session.getSnapshot();
    const worker = new FakeWorker();
    const engine = new StockfishEngine(() => worker);
    const answer = engine.search(request.fen, 'easy');
    worker.emit('uciok'); worker.emit('readyok'); worker.emit('bestmove e7e5');
    session.start('ai', 0, 0);
    const move = await answer;
    if (session.getSnapshot().revision === request.revision) session.move(move.from, move.to, move.promotion, 0);
    expect(session.getSnapshot().history).toHaveLength(0);
  });
});
