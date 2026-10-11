import type { Color, PieceSymbol } from 'chess.js';
import { pieceSvg } from '../game/pieces';

export default function PixelPiece({ type, color, size = 40 }: { type: PieceSymbol; color: Color; size?: number }) {
  return <img className="pixel-piece" src={pieceSvg(type, color)} width={size * 0.8} height={size} alt="" draggable={false} />;
}
