import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Square } from 'chess.js';
import ChessBoard from '../components/ChessBoard';
import PixelPiece from '../components/PixelPiece';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import type { ChessSession } from '../chess/ChessSession';
import type { Promotion, Settings } from '../types';

interface Props {
  session: ChessSession; settings: Settings; onMenu: () => void; onSettings: () => void;
  onSave: () => void; thinking?: boolean; aiError?: string;
  onRetry?: () => void; onUndo: () => void; onRestart: () => void;
  onMove: (from: Square, to: Square, promotion?: Promotion) => void;
}

export function formatTime(ms: number) {
  const seconds = Math.ceil(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function GameScreen({ session, settings, onMenu, onSettings, onSave, thinking = false, aiError, onRetry, onUndo, onRestart, onMove }: Props) {
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot);
  const [flipped, setFlipped] = useState(false);
  const [promotion, setPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [reviewPly, setReviewPly] = useState<number | null>(null);
  const historyElement = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (historyElement.current) historyElement.current.scrollTop = historyElement.current.scrollHeight;
  }, [snapshot.history.length]);
  const ply = Math.min(reviewPly ?? snapshot.history.length, snapshot.history.length);
  const reviewed = snapshot.result && ply < snapshot.history.length;
  const displaySnapshot = reviewed ? {
    ...snapshot,
    fen: ply === 0 ? snapshot.history[0].before : snapshot.history[ply - 1].after,
    lastMove: ply === 0 ? null : snapshot.history[ply - 1],
  } : snapshot;
  const white = flipped ? 'b' : 'w';
  const black = flipped ? 'w' : 'b';
  const enabled = snapshot.running && !snapshot.result && !(snapshot.mode === 'ai' && snapshot.turn === 'b') && !promotion;
  const status = snapshot.result ? snapshot.result.reason : thinking ? 'Máy đang suy nghĩ…' : session.chess.isCheck() ? 'Chiếu vua! Hãy bảo vệ vua của bạn.' : `Lượt ${snapshot.turn === 'w' ? 'quân trắng' : 'quân đen'}`;
  const player = (color: 'w' | 'b') => {
    const active = snapshot.turn === color && !snapshot.result;
    const captured = snapshot.history.filter((move) => move.color === color && move.captured).map((move) => move.captured!);
    return <div className={`player-bar ${active ? 'active-player' : ''}`}>
      <div className={`player-avatar ${color === 'b' ? 'dark-avatar' : ''}`}><PixelPiece type="k" color={color} size={38} /></div>
      <div className="player-info"><strong>{snapshot.mode === 'ai' ? color === 'w' ? 'Nhà thám hiểm' : 'Stockfish' : color === 'w' ? 'Hiệp sĩ Ánh Sáng' : 'Hiệp sĩ Hoàng Hôn'}</strong>
        <span>{color === 'w' ? 'Quân trắng' : 'Quân đen'}{snapshot.mode === 'ai' && color === 'b' ? ` · ${settings.difficulty === 'easy' ? 'Dễ' : settings.difficulty === 'medium' ? 'Vừa' : 'Khó'}` : ''}</span>
      </div>
      <div className="captured-pieces">{captured.map((type, i) => <PixelPiece key={i} type={type} color={color === 'w' ? 'b' : 'w'} size={20} />)}</div>
      <div className={`chess-clock ${snapshot.clocks[color] < 30000 && snapshot.minutes > 0 ? 'low-time' : ''}`} aria-label={`Thời gian ${color === 'w' ? 'trắng' : 'đen'}`}>{snapshot.minutes === 0 ? '∞' : formatTime(snapshot.clocks[color])}<span className="clock-dot" /></div>
    </div>;
  };
  return <main className="game-screen">
    <div className="game-heading"><div><div className="eyebrow">CUỘC PHIÊU LƯU CỦA BẠN</div><h1>{snapshot.mode === 'ai' ? 'Thử thách vương quốc' : 'Đấu trường hiệp sĩ'}</h1></div>
      <button className="pixel-button compact" onClick={onMenu}><Icon name="arrow" /> Menu</button></div>
    <div className="game-layout">
      <section className="board-column">
        {player(black)}
        <ChessBoard session={session} snapshot={displaySnapshot} settings={settings} flipped={flipped} enabled={enabled}
          onMove={onMove} onPromotion={(from, to) => setPromotion({ from, to })} />
        {player(white)}
        {snapshot.result && <div className="review-controls"><button className="pixel-button compact" disabled={ply === 0} onClick={() => setReviewPly(ply - 1)} aria-label="Nước trước">‹</button><label>Xem lại · {ply}/{snapshot.history.length}<input type="range" min="0" max={snapshot.history.length} value={ply} onChange={(event) => setReviewPly(Number(event.target.value))} aria-label="Nước đi xem lại" /></label><button className="pixel-button compact" disabled={ply === snapshot.history.length} onClick={() => setReviewPly(ply + 1)} aria-label="Nước tiếp">›</button></div>}
        <div className={`game-status ${session.chess.isCheck() ? 'in-check' : ''}`} role="status"><span className={`status-dot ${thinking ? 'thinking-dot' : ''}`} />{status}<button className="flip-button" onClick={() => setFlipped(!flipped)} title="Lật bàn cờ" aria-label="Lật bàn cờ"><Icon name="flip" size={18} /></button></div>
      </section>
      <aside className="game-sidebar">
        <section className="paper-panel history-panel"><div className="panel-heading"><h2><Icon name="book" />Nhật ký nước đi</h2><span className="small-badge">{snapshot.history.length} nước</span></div>
          <div className="history-columns"><span>#</span><span>TRẮNG</span><span>ĐEN</span></div>
          <div ref={historyElement} className="move-history" aria-label="Lịch sử nước đi">
            {snapshot.history.length === 0 ? <div className="empty-history"><PixelPiece type="p" color="w" size={58} /><strong>Một hành trình mới</strong><p>Chọn quân cờ để xem nước đi hợp lệ.<br />Trắng sẽ đi trước!</p></div> : Array.from({ length: Math.ceil(snapshot.history.length / 2) }, (_, index) => <div className={`history-row ${index === Math.ceil(snapshot.history.length / 2) - 1 ? 'latest-row' : ''}`} key={index}><span>{index + 1}.</span><strong>{snapshot.history[index * 2]?.san}</strong><strong>{snapshot.history[index * 2 + 1]?.san ?? '—'}</strong></div>)}
          </div>
          <div className="history-footer"><span className="status-dot" /> {snapshot.mode === 'ai' ? 'Đấu với Stockfish · WebAssembly' : 'Hai người · Cùng thiết bị'}</div>
        </section>
        <section className="paper-panel controls-panel"><h2>Điều khiển ván cờ</h2><div className="controls-grid">
          <button className="pixel-button" disabled={!snapshot.history.length} onClick={() => { setPromotion(null); onUndo(); }}><Icon name="undo" /> Đi lại</button>
          <button className="pixel-button" onClick={() => setConfirmRestart(true)}><Icon name="restart" /> Chơi lại</button>
          <button className="pixel-button sunny" onClick={onSave}><Icon name="save" /> Lưu ván</button>
          <button className="pixel-button" onClick={onSettings}><Icon name="gear" /> Cài đặt</button>
        </div></section>
        {aiError && <div className="error-panel" role="alert"><strong>Chưa kết nối được AI</strong><p>{aiError}</p><button className="pixel-button" onClick={onRetry}>Thử lại</button></div>}
        <div className="tip-panel"><span className="tip-star">✦</span><div><strong>Mẹo nhỏ cho hiệp sĩ</strong><p>Kiểm soát trung tâm, phát triển quân và giữ vua an toàn.</p></div></div>
      </aside>
    </div>
    {promotion && <Modal title="Phong cấp tốt" onClose={() => setPromotion(null)}><p>Tốt đã đến cuối hành trình. Chọn một quân mới:</p><div className="promotion-options">{(['q', 'r', 'b', 'n'] as const).map((type) => <button className="pixel-button" key={type} aria-label={`Phong cấp ${type === 'q' ? 'Hậu' : type === 'r' ? 'Xe' : type === 'b' ? 'Tượng' : 'Mã'}`} onClick={() => { onMove(promotion.from, promotion.to, type); setPromotion(null); }}><PixelPiece type={type} color={snapshot.turn} size={60} /><span>{type === 'q' ? 'Hậu' : type === 'r' ? 'Xe' : type === 'b' ? 'Tượng' : 'Mã'}</span></button>)}</div></Modal>}
    {confirmRestart && <Modal title="Bắt đầu hành trình mới?" onClose={() => setConfirmRestart(false)}><p>Ván đang chơi sẽ được thay bằng một ván mới. Bạn có thể lưu ván trước khi chơi lại.</p><div className="modal-actions"><button className="pixel-button" onClick={() => setConfirmRestart(false)}>Tiếp tục ván</button><button className="pixel-button coral" onClick={() => { setPromotion(null); setConfirmRestart(false); onRestart(); }}>Chơi lại</button></div></Modal>}
  </main>;
}
