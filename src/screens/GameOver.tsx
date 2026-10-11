import Modal from '../components/Modal';
import PixelPiece from '../components/PixelPiece';
import type { GameMode, Result } from '../types';

export default function GameOver({ result, mode, animation, onReplay, onMenu, onReview }: { result: Result; mode: GameMode; animation: boolean; onReplay: () => void; onMenu: () => void; onReview: () => void }) {
  const title = result.winner === null ? 'Một trận hòa đẹp!' : mode === 'ai' && result.winner === 'b' ? 'Hành trình chưa kết thúc!' : 'Chiến thắng thuộc về bạn!';
  return <Modal title={title} onClose={onReview} className="result-modal">
    <div className={`victory-art ${animation ? 'celebrate' : ''}`}><span>✦</span><PixelPiece type="k" color={result.winner ?? 'w'} size={105} /><span>✦</span></div>
    <div className="result-label">{result.winner === null ? 'DRAW · HÒA CỜ' : mode === 'ai' && result.winner === 'b' ? 'DEFEAT · THẤT BẠI' : 'VICTORY · CHIẾN THẮNG'}</div>
    <p className="result-message">{result.winner === null ? 'Cả hai hiệp sĩ đã chiến đấu tuyệt vời.' : `${result.winner === 'w' ? 'Quân trắng' : 'Quân đen'} giành chiến thắng.`}<br /><strong>{result.reason}</strong></p>
    <button className="pixel-button sunny full-width" onClick={onReplay}>Bắt đầu ván mới</button>
    <div className="modal-actions"><button className="pixel-button" onClick={onMenu}>Về menu</button><button className="pixel-button" onClick={onReview}>Xem lại ván cờ</button></div>
  </Modal>;
}
