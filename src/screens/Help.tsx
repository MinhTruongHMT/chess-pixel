import Modal from '../components/Modal';
import PixelPiece from '../components/PixelPiece';

export default function Help({ onClose }: { onClose: () => void }) {
  return <Modal title="Sổ tay nhà thám hiểm" onClose={onClose} className="help-modal">
    <p>Trắng đi trước. Mục tiêu: chiếu hết vua đối phương — vua bị tấn công và không còn cách thoát.</p>
    <div className="piece-guide">{([
      ['k', 'Vua', 'Một ô mỗi hướng. Không được đi vào ô bị tấn công.'],
      ['q', 'Hậu', 'Đi ngang, dọc, chéo bao nhiêu ô cũng được.'],
      ['r', 'Xe', 'Đi ngang hoặc dọc.'],
      ['b', 'Tượng', 'Đi chéo, luôn ở ô cùng màu.'],
      ['n', 'Mã', 'Đi hình chữ L: hai ô rồi một ô. Có thể nhảy qua quân.'],
      ['p', 'Tốt', 'Đi thẳng một ô, bắt chéo một ô. Lần đầu có thể đi hai ô.'],
    ] as const).map(([type, name, description]) => <div className="guide-row" key={type}><PixelPiece type={type} color="w" size={38} /><div><strong>{name}</strong><p>{description}</p></div></div>)}</div>
    <h3>Ba nước đi đặc biệt</h3>
    <p><strong>Nhập thành:</strong> chọn vua, rồi chọn ô cách hai cột về phía xe. Vua và xe chưa di chuyển, đường trống, vua không bị chiếu hay đi qua ô bị tấn công.</p>
    <p><strong>Bắt tốt qua đường:</strong> bắt tốt đối phương vừa đi hai ô sát tốt của bạn, ngay lượt tiếp theo.</p>
    <p><strong>Phong cấp:</strong> tốt đến hàng cuối được đổi thành hậu, xe, tượng hoặc mã.</p>
    <h3>Cách thao tác</h3><p>Nhấp quân rồi ô được đánh dấu, hoặc kéo thả. Dùng Tab và Enter để chọn ô bằng bàn phím. Nút lật bàn cờ giúp đổi góc nhìn.</p>
    <p>Game tự kết thúc khi chiếu hết, hết giờ, stalemate, không đủ quân, lặp vị trí ba lần hoặc đủ 50 nước không đi tốt và không bắt quân.</p>
  </Modal>;
}
