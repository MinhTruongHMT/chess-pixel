import Modal from '../components/Modal';
import Icon from '../components/Icon';
import type { Difficulty, GameMode, Settings } from '../types';

export default function ModeSelection({ mode, settings, onChange, onStart, onClose }: { mode: GameMode; settings: Settings; onChange: (value: Settings) => void; onStart: () => void; onClose: () => void }) {
  return <Modal title={mode === 'ai' ? 'Chọn thử thách của bạn' : 'Sẵn sàng đấu cùng bạn bè?'} onClose={onClose}>
    <p>{mode === 'ai' ? 'Bạn cầm quân trắng. Stockfish sẽ dẫn quân Hoàng Hôn.' : 'Hai người luân phiên trên cùng thiết bị. Quân trắng đi trước.'}</p>
    {mode === 'ai' && <div className="difficulty-options">{([
      ['easy', 'Dễ', 'Khởi đầu nhẹ nhàng'], ['medium', 'Vừa', 'Thử thách cân bằng'], ['hard', 'Khó', 'Đối thủ đáng gờm'],
    ] as [Difficulty, string, string][]).map(([value, label, description]) => <button className={`difficulty-card ${settings.difficulty === value ? 'chosen' : ''}`} key={value} onClick={() => onChange({ ...settings, difficulty: value })} aria-pressed={settings.difficulty === value}><span>{value === 'easy' ? 'I' : value === 'medium' ? 'II' : 'III'}</span><strong>{label}</strong><small>{description}</small></button>)}</div>}
    <label className="select-row"><span>Thời gian mỗi bên</span><select value={settings.minutes} onChange={(event) => onChange({ ...settings, minutes: Number(event.target.value) })}><option value="0">Không giới hạn</option>{[3, 5, 10, 15, 30].map((minutes) => <option value={minutes} key={minutes}>{minutes} phút</option>)}</select></label>
    <button className="pixel-button coral full-width start-game" onClick={onStart}><Icon name="sword" /> Bắt đầu cuộc phiêu lưu</button>
  </Modal>;
}
