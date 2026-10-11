import { useEffect, useMemo, useState } from 'react';
import { StockfishEngine } from '../ai/StockfishEngine';
import type { ChessSession, GameSnapshot } from '../chess/ChessSession';
import type { Difficulty } from '../types';
import type { Move } from 'chess.js';

export function useAI(session: ChessSession, snapshot: GameSnapshot, active: boolean, difficulty: Difficulty, onMove: (move: Move) => void) {
  const engine = useMemo(() => new StockfishEngine(), []);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string>();
  const [retry, setRetry] = useState(0);
  const { revision, mode, turn, running, result, fen } = snapshot;
  useEffect(() => {
    let cancelled = false;
    if (!active || mode !== 'ai' || turn !== 'b' || !running || result) {
      engine.cancel(); setThinking(false); setError(undefined); return;
    }
    setThinking(true);
    setError(undefined);
    engine.search(fen, difficulty).then((answer) => {
      const current = session.getSnapshot();
      if (cancelled || current.revision !== revision || current.fen !== fen || current.result || !current.running) return;
      const move = session.move(answer.from, answer.to, answer.promotion);
      if (move) onMove(move);
    }).catch((reason: unknown) => {
      if (!cancelled && !(reason instanceof DOMException && reason.name === 'AbortError'))
        setError(reason instanceof Error ? reason.message : 'Có lỗi khi chạy Stockfish.');
    }).finally(() => { if (!cancelled) setThinking(false); });
    return () => { cancelled = true; engine.cancel(); };
  }, [engine, session, revision, mode, turn, running, result, fen, active, difficulty, retry, onMove]);
  return { thinking, error, retry: () => setRetry((value) => value + 1), cancel: () => engine.cancel() };
}
