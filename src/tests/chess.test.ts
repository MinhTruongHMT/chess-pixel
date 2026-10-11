import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { ChessSession, chessResult } from '../chess/ChessSession';

describe('Luật cờ của chess.js', () => {
  it('bàn đầu có 20 nước hợp lệ, tốt không được đi ba ô', () => {
    const chess = new Chess();
    expect(chess.moves()).toHaveLength(20);
    expect(() => chess.move({ from: 'e2', to: 'e5' })).toThrow();
    expect(chess.fen()).toBe(new Chess().fen());
  });
  it('không được di chuyển quân đang ghim để lộ vua', () => {
    const chess = new Chess('4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1');
    expect(() => chess.move({ from: 'e2', to: 'd2' })).toThrow();
  });
  it('nhập thành và di chuyển xe cùng vua', () => {
    const chess = new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    chess.move('O-O');
    expect(chess.get('g1')?.type).toBe('k');
    expect(chess.get('f1')?.type).toBe('r');
  });
  it('không nhập thành qua ô đang bị tấn công', () => {
    const chess = new Chess('4k3/8/8/8/2b5/8/8/4K2R w K - 0 1');
    expect(() => chess.move('O-O')).toThrow();
  });
  it('bắt tốt qua đường ngay sau nước tốt đi hai ô', () => {
    const chess = new Chess();
    ['e4', 'a6', 'e5', 'd5'].forEach((move) => chess.move(move));
    const move = chess.move('exd6');
    expect(move.flags).toContain('e');
    expect(chess.get('d5')).toBeUndefined();
    expect(chess.get('d6')?.color).toBe('w');
  });
  it.each(['q', 'r', 'b', 'n'])('phong cấp thành %s', (promotion) => {
    const chess = new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');
    chess.move({ from: 'a7', to: 'a8', promotion });
    expect(chess.get('a8')?.type).toBe(promotion);
  });
  it('phát hiện chiếu hết', () => {
    const chess = new Chess();
    ['f3', 'e5', 'g4', 'Qh4#'].forEach((move) => chess.move(move));
    expect(chessResult(chess)).toEqual({ winner: 'b', reason: 'Chiếu hết' });
  });
  it('phát hiện stalemate', () => {
    expect(chessResult(new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'))?.winner).toBeNull();
  });
  it('phát hiện không đủ quân', () => {
    expect(chessResult(new Chess('7k/8/8/8/8/8/8/K7 w - - 0 1'))?.reason).toContain('Không đủ quân');
  });
  it('phát hiện luật 50 nước', () => {
    expect(chessResult(new Chess('7k/8/8/8/8/8/R7/K7 w - - 100 80'))?.reason).toBe('Luật 50 nước đi');
  });
});

describe('ChessSession', () => {
  it('không chấp nhận sai lượt hay nước bất hợp lệ', () => {
    const session = new ChessSession();
    session.start('local', 0, 0);
    expect(session.move('e7', 'e5', 'q', 0)).toBeNull();
    expect(session.move('e2', 'e4', 'q', 0)?.san).toBe('e4');
    expect(session.move('d2', 'd4', 'q', 0)).toBeNull();
  });
  it('undo khôi phục bàn và đồng hồ trước nước đi', () => {
    const session = new ChessSession();
    session.start('local', 10, 0);
    session.move('e2', 'e4', 'q', 1000);
    session.move('e7', 'e5', 'q', 4000);
    session.undo(5000);
    expect(session.getSnapshot().history).toHaveLength(1);
    expect(session.getSnapshot().clocks.b).toBe(597000);
    expect(session.getSnapshot().turn).toBe('b');
  });
  it('undo trong AI trả về lượt người, kể cả đang suy nghĩ', () => {
    const session = new ChessSession();
    session.start('ai', 0, 0);
    session.move('e2', 'e4', 'q', 0);
    session.move('e7', 'e5', 'q', 0);
    session.undo(0);
    expect(session.getSnapshot().history).toHaveLength(0);
    session.move('d2', 'd4', 'q', 0);
    session.undo(0);
    expect(session.getSnapshot().history).toHaveLength(0);
  });
  it('save/load giữ lịch sử và hòa lặp ba lần', () => {
    const session = new ChessSession();
    session.start('local', 0, 0);
    for (let i = 0; i < 2; i++) {
      session.move('g1', 'f3', 'q', 0); session.move('g8', 'f6', 'q', 0);
      session.move('f3', 'g1', 'q', 0); session.move('f6', 'g8', 'q', 0);
    }
    const copy = new ChessSession();
    copy.restore(session.serialize(0), 0);
    expect(copy.chess.isThreefoldRepetition()).toBe(true);
    expect(copy.getSnapshot().history).toHaveLength(8);
    expect(copy.move('e2', 'e4', 'q', 0)).toBeNull();
  });
  it('không thay ván hiện tại khi file lưu hỏng', () => {
    const session = new ChessSession();
    session.start('local', 0, 0);
    session.move('e2', 'e4', 'q', 0);
    const before = session.chess.fen();
    expect(() => session.restore('{"version":1}', 0)).toThrow();
    expect(session.chess.fen()).toBe(before);
    const tampered = JSON.parse(session.serialize(0));
    tampered.fen = new Chess().fen();
    expect(() => session.restore(JSON.stringify(tampered), 0)).toThrow();
    expect(session.chess.fen()).toBe(before);
  });
  it('hết giờ kết thúc ván và từ chối nước mới', () => {
    const session = new ChessSession();
    session.start('local', 3, 0);
    session.tick(180001);
    expect(session.getSnapshot().result).toEqual({ winner: 'b', reason: 'Hết thời gian' });
    expect(session.move('e2', 'e4', 'q', 180001)).toBeNull();
  });
  it('tạm dừng không tính thời gian ngoài ván', () => {
    const session = new ChessSession();
    session.start('local', 3, 0);
    session.pause(1000);
    session.tick(100000);
    session.resume(101000);
    session.tick(102000);
    expect(session.getSnapshot().clocks.w).toBe(178000);
  });
  it('restart xóa lịch sử và tăng revision để vô hiệu kết quả AI cũ', () => {
    const session = new ChessSession();
    session.start('ai', 10, 0);
    session.move('e2', 'e4', 'q', 1000);
    const revision = session.getSnapshot().revision;
    session.start('ai', 5, 2000);
    expect(session.getSnapshot().history).toHaveLength(0);
    expect(session.getSnapshot().revision).toBeGreaterThan(revision);
    expect(session.getSnapshot().clocks.w).toBe(300000);
  });
});
