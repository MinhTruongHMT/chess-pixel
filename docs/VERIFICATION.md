# Kết quả kiểm tra — 11/10/2026

Môi trường: Windows, PowerShell, Node.js 22.23.0, npm 10.9.8. Các lệnh được thực thi bằng `npm.cmd` vì máy đang chặn script `npm.ps1` chưa ký.

## Lệnh đã thực thi

| Kiểm tra | Kết quả |
| --- | --- |
| `npm.cmd install` | Thành công; postinstall chuẩn bị asset Stockfish |
| `npm.cmd run dev` | Vite phục vụ http://127.0.0.1:5173/; kiểm tra HTTP trả 200 |
| `npm.cmd run typecheck` | Thành công, không có lỗi TypeScript |
| `npm.cmd run lint` | Thành công, không có lỗi ESLint |
| `npm.cmd run test` | 28 kiểm thử qua trong 3 file |
| `npm.cmd run test:e2e` | 7 kiểm thử Chromium qua; lần cuối 25,7 giây |
| `npm.cmd run build` | Thành công; có chunk Phaser lớn được Vite cảnh báo |
| Npm audit ở lần cài cuối | 0 lỗ hổng được báo |

## Phạm vi Vitest

Luật đi quân và từ chối sai lượt/nước sai, ghim quân bảo vệ vua, nhập thành hợp lệ và qua ô bị tấn công, bắt tốt qua đường, bốn loại phong cấp, chiếu hết, stalemate, thiếu quân, 50 nước, lặp ba lần sau save/load; undo và đồng hồ; file lưu hỏng không làm mất ván hiện tại; hết giờ; pause/resume; reset revision.

UCI adapter được kiểm tra handshake, Skill Level và movetime, phản hồi bất hợp lệ, hủy Worker và callback cũ, timeout, không tạo yêu cầu sau kết thúc, không áp dụng kết quả trước restart. Một kiểm thử riêng thực thi chính asset Stockfish WASM trong Node, xác nhận engine trả nước hợp lệ và có tùy chọn Skill Level.

## Phạm vi Playwright Chromium

1. Menu và bàn cờ render; không có page error trong luồng được theo dõi.
2. Click, nước sai, kéo thả, undo, lưu và khôi phục sau reload.
3. Hoàn thành Fool's Mate, màn hình kết quả, xem lại và chơi lại.
4. Stockfish Worker/WASM thật trả nước đúng lượt; restart hủy yêu cầu cũ.
5. Modal phong cấp cho phép chọn Xe, không tự chọn Hậu.
6. Layout 375×812, 320×740 và 768×1024 không tràn ngang; bàn cờ vuông và nhận input.
7. Theme/âm thanh giữ sau reload; Tab/Enter có thể thực hiện nước đi.

Ảnh `.qa/menu-desktop.png`, `.qa/game-desktop.png`, `.qa/menu-mobile.png` và `.qa/game-mobile.png` đã được tạo. Ảnh desktop và mobile đã được xem để xác nhận bố cục, độ rõ của sprite và văn bản.

## Tiến độ theo roadmap

| Phase | Kết quả và source chính |
| --- | --- |
| 1 | Setup React/TS/Vite/Tailwind/Vitest/ESLint; `package.json`, các file config |
| 2 | Menu fantasy, lựa chọn chế độ, layout; `MainMenu.tsx`, `landscape.svg`, `index.css` |
| 3 | Phaser + sprite + nước hợp lệ + luật đặc biệt; `BoardScene.ts`, `ChessBoard.tsx`, `ChessSession.ts` |
| 4 | Local PvP, SAN, undo/restart; `GameScreen.tsx`, `ChessSession.ts` |
| 5 | Tween, hạt pixel, âm thanh, pixel font; `BoardScene.ts`, `sound.ts`, `main.tsx` |
| 6 | Stockfish WASM/UCI Worker; `StockfishEngine.ts`, `useAI.ts`, `prepare-engine.mjs` |
| 7 | Cài đặt, timer, save/load và responsive; `Settings.tsx`, `storage.ts`, `ChessSession.ts`, CSS |
| 8 | Kiểm thử, sửa lifecycle StrictMode/input nhanh/resize; tests, E2E, README và docs |

## Giới hạn xác minh

Kiểm thử UI dùng Chromium tự động với viewport mô phỏng; chưa xác minh Safari, Firefox hoặc thao tác cảm ứng trên thiết bị thật. Không có kiểm thử kết nối multiplayer vì phiên bản này chỉ chơi cục bộ. Kết quả audit là trạng thái registry tại lúc cài, không phải bảo đảm cho mọi thời điểm.

Phaser có một chunk khoảng 1,48 MB trước gzip (339,84 kB gzip). Chunk được tải khi vào ván thay vì trên menu. Cảnh báo kích thước này còn tồn tại; TypeScript và build không có lỗi.
