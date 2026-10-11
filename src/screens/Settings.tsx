import Modal from '../components/Modal';
import type { Settings as GameSettings } from '../types';
import Icon from '../components/Icon';

export default function Settings({ settings, onChange, onClose }: { settings: GameSettings; onChange: (settings: GameSettings) => void; onClose: () => void }) {
  const update = (changes: Partial<GameSettings>) => onChange({ ...settings, ...changes });
  return <Modal title="Tùy chỉnh cuộc phiêu lưu" onClose={onClose}>
    <div className="settings-form">
      <label className="toggle-row"><span><strong>Âm thanh 8-bit</strong><small>Những giai điệu nhỏ cho từng nước đi</small></span><input type="checkbox" checked={settings.sound} onChange={(event) => update({ sound: event.target.checked })} /></label>
      <label className="range-row"><span>Âm lượng <strong>{Math.round(settings.volume * 100)}%</strong></span><input type="range" min="0" max="1" step="0.05" value={settings.volume} onChange={(event) => update({ volume: Number(event.target.value) })} /></label>
      <label className="toggle-row"><span><strong>Hiệu ứng chuyển động</strong><small>Di chuyển quân và hạt pixel</small></span><input type="checkbox" checked={settings.animation} onChange={(event) => update({ animation: event.target.checked })} /></label>
      <label className="select-row"><span>Màu bàn cờ</span><select value={settings.theme} onChange={(event) => update({ theme: event.target.value as GameSettings['theme'] })}><option value="caramel">Caramel & kem</option><option value="forest">Khu rừng xanh</option><option value="lavender">Vườn oải hương</option></select></label>
      <label className="select-row"><span>Mức độ AI</span><select value={settings.difficulty} onChange={(event) => update({ difficulty: event.target.value as GameSettings['difficulty'] })}><option value="easy">Dễ · Nhà thám hiểm mới</option><option value="medium">Vừa · Hiệp sĩ</option><option value="hard">Khó · Bậc thầy</option></select></label>
      <label className="select-row"><span>Thời gian mỗi bên</span><select value={settings.minutes} onChange={(event) => update({ minutes: Number(event.target.value) })}><option value="0">Không giới hạn</option>{[3, 5, 10, 15, 30].map((minutes) => <option value={minutes} key={minutes}>{minutes} phút</option>)}</select></label>
    </div>
    <p className="settings-note">Thời gian mới áp dụng từ ván tiếp theo. Các thay đổi khác có hiệu lực ngay. Đồng hồ tiếp tục chạy khi mở cài đặt trong ván.</p>
    <button className="pixel-button sunny full-width" onClick={onClose}><Icon name="save" /> Hoàn tất</button>
  </Modal>;
}
