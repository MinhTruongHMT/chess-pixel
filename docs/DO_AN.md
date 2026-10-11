# Đồ án: Pixel Chess Adventure

## 1. Giới thiệu

Pixel Chess Adventure là game cờ vua 2D chạy trong trình duyệt, sử dụng đồ họa pixel fantasy sáng màu. Người chơi có thể đấu trên cùng thiết bị hoặc đấu AI. Mục tiêu của đồ án là kết hợp một bộ luật chuẩn với UI dễ sử dụng, render có animation và kiến trúc có thể bảo trì.

## 2. Phạm vi và công nghệ

- Frontend: React, TypeScript strict mode, Vite và Tailwind CSS.
- Render/input: Phaser 3 với Canvas, texture pixel và tween.
- Luật cờ: chess.js.
- AI: Stockfish 18 lite single-threaded WASM, giao thức UCI qua Web Worker.
- Persistence: localStorage.
- Kiểm thử: Vitest và Playwright Chromium.
- Phiên bản này không có server và multiplayer online.

## 3. Phân rã chức năng

| Module | Trách nhiệm |
| --- | --- |
| ChessSession | Trạng thái chuẩn, xác thực nước, kết quả, timer, undo, serialize/restore |
| BoardScene | Bàn 8×8, sprite, highlight, input click/drag và animation |
| ChessBoard | Lifecycle Phaser trong React và thao tác bàn phím |
| StockfishEngine | Khởi động Worker, UCI handshake, cấu hình sức mạnh, timeout/cancel |
| useAI | Chỉ chạy AI đúng lượt, kiểm tra kết quả cũ bằng revision/FEN |
| App và screens | Menu, chọn mode, điều khiển ván, modal, settings và thông báo |
| sound/storage | Âm thanh retro, đọc/ghi và kiểm tra cài đặt |

## 4. Luồng xử lý nước đi

1. Người chơi chọn quân và ô đích bằng click, kéo thả hoặc bàn phím.
2. ChessBoard lấy danh sách nước hợp lệ từ ChessSession. Nếu cần phong cấp, mở modal chọn quân.
3. ChessSession cập nhật thời gian trước khi xác thực; ván hết giờ không chấp nhận nước đi.
4. `chess.js.move()` xác thực và cập nhật engine. Nước bất hợp lệ không làm đổi vị trí.
5. Session ghi lịch sử đồng hồ, tính kết quả, tăng revision và phát snapshot.
6. React cập nhật SAN/status; Phaser render vị trí mới, tween quân và hạt pixel nếu bật animation.
7. Nếu đến lượt đen trong mode AI, useAI tạo yêu cầu UCI. AI trả về nước đi phải tiếp tục qua bước xác thực engine.

## 5. Luồng AI và chống race condition

Worker nhận `uci`, đợi `uciok`, đặt Hash/Skill Level, gửi `ucinewgame` và `isready`. Sau `readyok`, gửi FEN và `go movetime`. `bestmove` được kiểm tra định dạng và tính hợp lệ trước khi trả cho UI.

Restart, undo, menu và cleanup effect hủy Worker. Callback kiểm tra danh tính Worker; useAI kiểm tra revision, FEN, trạng thái running và result trước khi thực hiện nước. Nhờ đó một kết quả từ ván cũ không thể thay đổi ván mới.

## 6. Lưu và khôi phục

File JSON nội bộ có phiên bản schema, PGN, FEN, mode, thời gian, đồng hồ và lịch sử đồng hồ. Khôi phục dựng một engine ứng viên từ PGN, kiểm tra FEN/số nước/kết quả trước khi thay ván hiện tại. Không chỉ lưu FEN vì FEN không chứa lịch sử cần thiết để phát hiện lặp ba lần.

## 7. Thiết kế giao diện

Màu chủ đạo gồm trời xanh, cỏ xanh, kem, vàng nắng, hồng coral và lavender. Cảnh nền SVG dùng hình khối theo lưới pixel; quân được định nghĩa bằng ma trận 16×20. Bên trắng dùng màu kem/vàng, bên đen dùng xanh xám/tím. Font pixel VT323 được đóng gói cục bộ và có bộ ký tự tiếng Việt; phần văn bản hướng dẫn dùng font hệ thống dễ đọc.

Desktop đặt lịch sử bên cạnh bàn cờ; mobile/tablet hẹp chuyển xuống dưới. Canvas giữ hình vuông. Modal dùng HTML dialog để quản lý focus và Escape; bàn cờ có 64 nút semantic cho Tab/Enter.

## 8. Kịch bản demo bảo vệ

1. Mở menu và giới thiệu phong cách pixel cùng các lựa chọn.
2. Vào hai người chơi, đi `e2-e4`, kéo quân `e7-e5`, thử một nước sai.
3. Dùng Đi lại; đổi theme; lưu ván, tải lại trang và mở ván đã lưu.
4. Vào một ván mới, đi `f2-f3`, `e7-e5`, `g2-g4`, `d8-h4` để demo chiếu hết và xem lại.
5. Chọn mode AI mức Dễ, đi tốt trung tâm, quan sát trạng thái suy nghĩ và nước AI.
6. Chơi lại trong lúc AI hoạt động để minh họa hủy yêu cầu cũ.
7. Thu nhỏ cửa sổ xuống mobile để minh họa layout và bàn cờ vuông.
8. Chạy `npm test`, `npm run test:e2e`, `npm run lint` và `npm run build`.

## 9. Đánh giá và hướng phát triển

Sản phẩm có các luồng chơi/lưu/cài đặt và bộ kiểm thử luật cờ, AI và giao diện. Kết quả thực thi cụ thể được ghi trong [VERIFICATION.md](VERIFICATION.md).

Hướng phát triển tiếp: nhiều slot lưu, xuất/nhập PGN qua file, chọn màu người chơi với AI, premove, phân tích vị trí, kiểm thử Safari/Firefox/cảm ứng thật, sau đó mới thiết kế multiplayer với server làm trọng tài. Các phần này chưa được triển khai trong phiên bản hiện tại.
