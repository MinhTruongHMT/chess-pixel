import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';

describe('Stockfish WASM thật', () => {
  it('khởi động UCI và trả nước hợp lệ từ asset được đóng gói', async () => {
    const chess = new Chess();
    chess.move('e4');
    const lines: string[] = [];
    const bestmove = await new Promise<string>((resolveMove, reject) => {
      const engine = spawn(process.execPath, [resolve('public/assets/engine/stockfish.js')], { stdio: ['pipe', 'pipe', 'pipe'] });
      const timeout = setTimeout(() => { engine.kill(); reject(new Error('Stockfish timeout')); }, 20000);
      let buffer = '';
      let stderr = '';
      let settled = false;
      const fail = (error: Error) => { if (settled) return; settled = true; clearTimeout(timeout); engine.kill(); reject(error); };
      engine.on('error', fail);
      engine.stderr.on('data', (chunk) => { stderr += String(chunk); });
      engine.on('exit', (code) => { if (!settled) fail(new Error(`Stockfish exited ${code}: ${stderr}`)); });
      engine.stdout.on('data', (chunk) => {
        buffer += String(chunk);
        const complete = buffer.split(/\r?\n/);
        buffer = complete.pop() ?? '';
        for (const line of complete) {
          lines.push(line);
          if (line === 'uciok') engine.stdin.write('setoption name Skill Level value 8\nisready\n');
          if (line === 'readyok') engine.stdin.write(`position fen ${chess.fen()}\ngo movetime 200\n`);
          if (line.startsWith('bestmove ')) {
            settled = true; clearTimeout(timeout); engine.kill(); resolveMove(line.split(/\s+/)[1]);
          }
        }
      });
      engine.stdin.write('uci\n');
    });
    expect(lines.some((line) => line.includes('name Skill Level'))).toBe(true);
    expect(bestmove).toMatch(/^[a-h][1-8][a-h][1-8][qrbn]?$/);
    expect(() => chess.move({ from: bestmove.slice(0, 2), to: bestmove.slice(2, 4), promotion: bestmove[4] })).not.toThrow();
  }, 25000);
});
