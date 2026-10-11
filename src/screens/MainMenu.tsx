import Icon from '../components/Icon';
import PixelPiece from '../components/PixelPiece';
import type { GameMode } from '../types';

const DISPLAY = [
  ['r', '', '', '', 'k', '', '', 'r'],
  ['', 'p', 'p', '', '', 'p', 'p', ''],
  ['', '', 'n', '', 'b', '', '', ''],
  ['', '', '', 'p', '', '', '', ''],
  ['', '', '', '', 'p', '', '', ''],
  ['', '', 'N', '', '', 'N', '', ''],
  ['P', 'P', '', 'P', '', 'P', 'P', 'P'],
  ['R', '', 'B', 'Q', 'K', 'B', '', 'R'],
];

interface Props {
  onPlay: (mode: GameMode) => void; onSettings: () => void;
  onHelp: () => void; onLoad: () => void; onResume: () => void;
  canResume: boolean; hasSave: boolean;
}

export default function MainMenu({ onPlay, onSettings, onHelp, onLoad, onResume, canResume, hasSave }: Props) {
  return <main className="menu-screen">
    <section className="menu-intro">
      <div className="eyebrow"><span className="sparkle">✦</span> CHÀO MỪNG ĐẾN VƯƠNG QUỐC CỜ VUA</div>
      <h1 className="game-logo"><span>PIXEL CHESS</span><span className="adventure">ADVENTURE</span></h1>
      <p>Mỗi nước đi, một cuộc phiêu lưu.<br />Bước vào thế giới pixel và viết nên chiến thắng của bạn.</p>
    </section>
    <div className="menu-content">
      <section className="menu-panel paper-panel">
        <div className="panel-kicker">CHỌN CUỘC PHIÊU LƯU</div>
        <button className="mode-button coral" onClick={() => onPlay('ai')}>
          <span className="mode-icon"><Icon name="sword" size={28} /></span>
          <span><strong>Chơi với máy</strong><small>Thử sức cùng Stockfish AI</small></span><span className="button-chevron">›</span>
        </button>
        <button className="mode-button green" onClick={() => onPlay('local')}>
          <span className="mode-icon"><Icon name="people" size={28} /></span>
          <span><strong>2 người chơi</strong><small>Cùng bạn bè trên một thiết bị</small></span><span className="button-chevron">›</span>
        </button>
        {canResume && <button className="pixel-button resume-button" onClick={onResume}><Icon name="arrow" /> Tiếp tục ván đang chơi</button>}
        <div className="menu-secondary">
          <button onClick={onSettings}><Icon name="gear" />Cài đặt</button>
          <button onClick={onHelp}><Icon name="book" />Hướng dẫn</button>
        </div>
        <button className="load-link" onClick={onLoad} disabled={!hasSave}><Icon name="load" size={16} /> {hasSave ? 'Mở ván cờ đã lưu' : 'Chưa có ván cờ đã lưu'}</button>
      </section>
      <section className="hero-board-wrap" aria-label="Minh họa bàn cờ pixel">
        <div className="floating-label top-label"><span className="status-dot" /> MỘT THẾ GIỚI. VÔ VÀN NƯỚC ĐI.</div>
        <div className="hero-board">
          <div className="hero-grid">{DISPLAY.flatMap((row, y) => row.map((piece, x) => <div key={`${x}-${y}`} className={`hero-square ${(x + y) % 2 ? 'dark' : ''}`}>
            {piece && <PixelPiece type={piece.toLowerCase() as 'p' | 'r' | 'n' | 'b' | 'q' | 'k'} color={piece === piece.toUpperCase() ? 'w' : 'b'} size={42} />}
            {y === 4 && x === 4 && <span className="hero-highlight" />}
          </div>))}</div>
          <div className="hero-files">a&nbsp;&nbsp;&nbsp; b&nbsp;&nbsp;&nbsp; c&nbsp;&nbsp;&nbsp; d&nbsp;&nbsp;&nbsp; e&nbsp;&nbsp;&nbsp; f&nbsp;&nbsp;&nbsp; g&nbsp;&nbsp;&nbsp; h</div>
        </div>
        <div className="floating-label bottom-label"><PixelPiece type="k" color="w" size={28} /><span>Chiến thuật cổ điển.<br /><strong>Một diện mạo mới.</strong></span><span className="label-star">✦</span></div>
      </section>
    </div>
    <div className="menu-features"><span><i />Luật cờ chuẩn</span><span><i />Đồ họa pixel thủ công</span><span><i />Chơi ngay trên trình duyệt</span></div>
  </main>;
}
