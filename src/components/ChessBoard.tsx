import { memo, useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Chess, type Square } from 'chess.js';
import { BoardScene, SIZE } from '../game/scenes/BoardScene';
import type { BoardModel } from '../game/scenes/BoardScene';
import type { ChessSession, GameSnapshot } from '../chess/ChessSession';
import type { Promotion, Settings } from '../types';

interface Props {
  session: ChessSession; snapshot: GameSnapshot; settings: Settings;
  flipped: boolean; enabled: boolean;
  onMove: (from: Square, to: Square, promotion?: Promotion) => void;
  onPromotion: (from: Square, to: Square) => void;
}

const PIECE_NAMES = { p: 'Tốt', r: 'Xe', n: 'Mã', b: 'Tượng', q: 'Hậu', k: 'Vua' };

function ChessBoard({ session, snapshot, settings, flipped, enabled, onMove, onPromotion }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BoardScene | null>(null);
  const [selected, setSelected] = useState<Square | null>(null);
  const [ready, setReady] = useState(false);
  const selectedInput = useRef<{ fen: string; square: Square | null }>({ fen: snapshot.fen, square: null });
  const selectedFen = useRef(snapshot.fen);
  // A changed position invalidates selection without changing the engine.
  const currentSelected = selectedFen.current === snapshot.fen ? selected : null;
  const legal = currentSelected ? session.legalMoves(currentSelected).map((move) => move.to) : [];
  const action = useRef<(from: Square | null, to: Square) => void>(() => {});
  action.current = (dragFrom, to) => {
    if (!enabled) return;
    const current = session.getSnapshot();
    if (!current.running || current.result || (current.mode === 'ai' && current.turn === 'b')) return;
    const from = dragFrom ?? (selectedInput.current.fen === current.fen ? selectedInput.current.square : null);
    if (from && from !== to) {
      const moves = session.legalMoves(from).filter((move) => move.to === to);
      if (moves.length) {
        selectedInput.current = { fen: current.fen, square: null };
        setSelected(null);
        if (moves.some((move) => move.promotion)) onPromotion(from, to);
        else onMove(from, to);
        return;
      }
    }
    const piece = session.chess.get(to);
    selectedFen.current = current.fen;
    selectedInput.current = { fen: current.fen, square: piece?.color === current.turn ? to : null };
    setSelected(selectedInput.current.square);
  };
  const model = useRef<BoardModel>({ game: snapshot, selected: currentSelected, legal, settings, flipped, enabled });
  model.current = { game: snapshot, selected: currentSelected, legal, settings, flipped, enabled };

  useEffect(() => {
    if (!host.current) return;
    const board = new BoardScene();
    let disposed = false;
    scene.current = board;
    board.onSquare = (from, to) => action.current(from, to);
    board.onReady = () => { if (!disposed) setReady(true); };
    const game = new Phaser.Game({
      type: Phaser.CANVAS, parent: host.current, width: SIZE, height: SIZE,
      backgroundColor: '#8c624a', pixelArt: true, antialias: false,
      scene: board, audio: { noAudio: true },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: SIZE, height: SIZE },
      callbacks: { postBoot: (instance) => {
        if (disposed) { instance.destroy(true); instance.canvas.remove(); return; }
        board.render(model.current);
      } },
    });
    return () => {
      disposed = true;
      scene.current = null;
      game.destroy(true);
      // Phaser defers destruction to a frame. Detach immediately for StrictMode remounts.
      game.canvas?.remove();
    };
  }, []);

  const lastMove = snapshot.lastMove;
  useEffect(() => {
    scene.current?.render({ game: { ...model.current.game, fen: snapshot.fen, lastMove }, selected: currentSelected, legal: currentSelected ? session.legalMoves(currentSelected).map((move) => move.to) : [], settings, flipped, enabled });
  }, [snapshot.fen, lastMove, currentSelected, settings, flipped, enabled, session]);

  const board = new Chess(snapshot.fen);
  const squares: Square[] = Array.from({ length: 64 }, (_, index) => {
    const col = flipped ? 7 - index % 8 : index % 8;
    const row = flipped ? Math.floor(index / 8) + 1 : 8 - Math.floor(index / 8);
    return `${String.fromCharCode(97 + col)}${row}` as Square;
  });
  return <div className="board-shell" aria-busy={!ready}>
    <div ref={host} className="phaser-host" data-ready={ready} aria-hidden="true" />
    <div className="board-accessibility" role="group" aria-label="Bàn cờ. Dùng Tab và Enter để chọn quân và ô đích.">
      {squares.map((square) => {
        const piece = board.get(square);
        return <button key={square} type="button" disabled={!enabled} onClick={() => action.current(null, square)}
          aria-label={`${square}${piece ? ` ${piece.color === 'w' ? 'Trắng' : 'Đen'} ${PIECE_NAMES[piece.type]}` : ' trống'}${legal.includes(square) ? ', nước đi hợp lệ' : ''}`}
          aria-pressed={currentSelected === square} className="square-key" />;
      })}
    </div>
  </div>;
}

export default memo(ChessBoard, (prev, next) => {
  // Clock-only updates do not redraw or recreate the Phaser board.
  return prev.session === next.session && prev.snapshot.fen === next.snapshot.fen &&
    prev.snapshot.lastMove === next.snapshot.lastMove && prev.settings === next.settings &&
    prev.flipped === next.flipped && prev.enabled === next.enabled;
});
