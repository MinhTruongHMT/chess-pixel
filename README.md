# Pixel Chess Adventure

Đồ án game cờ vua trình duyệt với giao diện Bright Fantasy Pixel Art, viết bằng **React + TypeScript + Vite + Phaser 3 + chess.js**. AI là **Stockfish 18 WASM** chạy trong Web Worker. Toàn bộ quân cờ, cảnh nền, font và engine được phục vụ cục bộ.

## Chạy dự án

Yêu cầu Node.js **22.12 trở lên trong nhánh 22**, hoặc Node 24/26 được Vitest hỗ trợ. Môi trường phát triển đã dùng Node 22.23.

```bash
npm install
npm run dev
```

Mở địa chỉ Vite in ra, mặc định **http://127.0.0.1:5173/**. Cần mạng cho lần cài thư viện đầu tiên. `postinstall` tự sao chép Stockfish và WASM vào `public/assets/engine/`.

Nếu PowerShell chặn `npm.ps1` do execution policy, dùng **`npm.cmd install`**, **`npm.cmd run dev`** và tương tự cho các lệnh còn lại. Không cần thay đổi execution policy.

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

`npm run build` tạo thư mục `dist/`. Preview production mặc định tại http://127.0.0.1:4173/. Phải chạy qua HTTP server, không mở `index.html` trực tiếp bằng `file://`, vì game dùng module và Web Worker.

## Tính năng

- Menu, chọn chế độ, cài đặt, hướng dẫn và kết thúc ván bằng tiếng Việt.
- Hai người cùng thiết bị hoặc người cầm quân trắng đấu Stockfish.
- AI Dễ/Vừa/Khó với `Skill Level` 0/8/18, thời gian tìm kiếm 250/750/1600 ms. Các mức này không phải cam kết Elo.
- Bàn cờ Phaser 8×8; click, kéo thả, hoặc dùng Tab/Enter. Đánh dấu ô chọn, nước hợp lệ, nước vừa đi và vua bị chiếu.
- Nhập thành, bắt tốt qua đường, chọn một trong bốn quân phong cấp, chiếu hết, stalemate, lặp vị trí ba lần, luật 50 nước và thiếu quân.
- Đồng hồ 3/5/10/15/30 phút mỗi bên hoặc không giới hạn. Thời gian mới trong cài đặt chỉ áp dụng từ ván tiếp theo.
- Lịch sử SAN, quân đã bắt, lật bàn cờ, đi lại, chơi lại, lưu và mở ván.
- Lưu cả PGN, FEN, đồng hồ và lịch sử đồng hồ; PGN giữ được lịch sử lặp vị trí. Undo trong AI đưa ván về lượt người.
- Khi về menu, đồng hồ tạm dừng và AI bị hủy. Khi mở cài đặt/hướng dẫn trong ván, đồng hồ tiếp tục chạy; tab nền vẫn tính thời gian thực.
- Ván kết thúc có thể xem lại từng nước bằng thanh trượt, rồi chơi lại.
- Âm thanh vuông 8-bit tổng hợp bằng Web Audio; hiệu ứng di chuyển, bắt quân, phong cấp và chiến thắng. Có tùy chọn tắt và hỗ trợ reduced motion cho CSS.
- Ba màu bàn cờ; layout một cột trên mobile, lịch sử nằm dưới bàn cờ.

## Kiến trúc

```text
src/
  ai/StockfishEngine.ts      # UCI, handshake, timeout, hủy Worker
  chess/ChessSession.ts      # chess.js, đồng hồ, undo, lưu/mở, snapshot
  components/               # Bàn cờ, modal, icon, quân cờ SVG
  game/pieces.ts            # Sprite pixel gốc 16×20, hai bảng màu
  game/scenes/BoardScene.ts  # Render Canvas Phaser, input, tween, hạt pixel
  hooks/useAI.ts            # Điều phối lượt AI và kiểm tra revision/FEN
  screens/                  # Menu, chọn chế độ, ván cờ, cài đặt, hướng dẫn, kết quả
  styles/index.css          # Tailwind + giao diện pixel responsive
  types/                    # Kiểu dữ liệu và cài đặt mặc định
  utils/                    # Âm thanh và localStorage
  tests/                    # Vitest: luật cờ, session, UCI, WASM thật
e2e/game.spec.ts             # Kiểm thử giao diện Chromium
public/assets/landscape.svg  # Cảnh fantasy pixel tự tạo
scripts/prepare-engine.mjs   # Chuẩn bị asset từ package Stockfish
```

`ChessSession` sở hữu một `Chess`. React quan sát snapshot qua `useSyncExternalStore`; Phaser chỉ đọc vị trí để render và phát ý định di chuyển. Tất cả nước đi phải qua `chess.js` trước khi cập nhật UI. Snapshot không phải một engine bàn cờ thứ hai.

Mỗi thay đổi vị trí/lifecycle tăng `revision`. Kết quả AI chỉ áp dụng khi revision và FEN vẫn khớp, ván còn chạy và chưa kết thúc. Hủy tìm kiếm sẽ terminate Worker; callback từ Worker cũ cũng được kiểm tra danh tính. GameScreen được lazy-load để menu không tải Phaser ngay. Clock-only update không dựng lại sprite.

## Kiểm thử tự động trình duyệt

Chromium dành riêng cho kiểm thử được lưu trong `.browser-cache/` của workspace, không dùng profile trình duyệt cá nhân.

```bash
npm run test:e2e:install
npm run test:e2e
```

Playwright tự khởi động Vite nếu chưa có server. Bộ E2E kiểm tra menu/render, click và kéo thả, nước sai, undo/lưu/mở, một ván chiếu hết, replay/restart, AI WASM thật, phong cấp, thao tác bàn phím, lưu cài đặt và kích thước desktop/mobile/tablet. Ảnh kiểm tra nằm trong `.qa/`; trace lỗi nằm trong `test-results/`. Các thư mục này được gitignore.

## Lưu trữ và giới hạn

- Một slot lưu ván trong `localStorage` của trình duyệt hiện tại. Lưu ván mới sẽ thay slot cũ; không tự lưu mỗi nước. Xóa dữ liệu website sẽ xóa ván và cài đặt.
- Chưa có backend, đăng nhập hay multiplayer qua mạng. Hai người phải dùng cùng thiết bị.
- AI dùng engine lite một luồng, không yêu cầu SharedArrayBuffer hay header COOP/COEP. Cần trình duyệt hiện đại hỗ trợ WebAssembly và Worker.
- Worker được tạo mới mỗi lượt để đảm bảo hủy sạch; đổi lại engine có thời gian khởi tạo mỗi lượt.
- Hòa theo lặp ba lần/50 nước được game tự kết thúc thay vì quy trình yêu cầu hòa trong thi đấu chính thức. Không có phân xử giải đấu hay chế độ tournament.
- Bundle Phaser lớn (~1.48 MB trước gzip); Vite có cảnh báo kích thước, nhưng đã tách chunk và chỉ tải khi vào ván. Đây không phải lỗi build.
- Kiểm thử giao diện tự động dùng Chromium. Safari/Firefox và thiết bị cảm ứng thật cần kiểm tra bổ sung khi phát hành.

## Asset và giấy phép

Sprite và cảnh nền được tạo trong source dự án, không dùng emoji cho quân cờ hoặc hotlink ảnh. Font VT323 có bộ ký tự tiếng Việt, được đóng gói qua `@fontsource/vt323`. Thông tin thư viện/giấy phép tại [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Stockfish và các bản sửa đổi engine phải tuân thủ GPL-3.0. Script giữ bản giấy phép cùng engine trong `public/assets/engine/COPYING.txt`. Khi phân phối, cần giữ thông báo và đáp ứng nghĩa vụ source của engine theo GPL; source của bản dùng được liên kết trong notices.

Tài liệu trình bày đồ án và kịch bản demo: [docs/DO_AN.md](docs/DO_AN.md).
