# Third-party notices

| Thành phần | Giấy phép | Nguồn |
| --- | --- | --- |
| React, React DOM | MIT | https://github.com/facebook/react |
| Phaser 3 | MIT | https://github.com/phaserjs/phaser |
| chess.js | BSD-2-Clause | https://github.com/jhlywa/chess.js |
| Stockfish.js 18.0.8 / Stockfish 18 | GPL-3.0 | https://github.com/nmrugg/stockfish.js/releases/tag/v18.0.8 |
| Stockfish upstream | GPL-3.0 | https://github.com/official-stockfish/Stockfish |
| VT323 | SIL Open Font License 1.1 | https://github.com/google/fonts/tree/main/ofl/vt323 |
| Fontsource | MIT (package tooling; font retains OFL) | https://github.com/fontsource/fontsource |
| Vite, TypeScript, Tailwind CSS, Vitest, ESLint, Playwright | Xem LICENSE của từng package | Các package trong package-lock.json |

Stockfish WASM được sao chép nguyên bản từ package npm `stockfish@18.0.8`. JS và WASM chỉ đổi tên thành `stockfish.js` và `stockfish.wasm` để đường dẫn Worker và WASM cùng basename. Không sửa mã engine.

Bản GPL-3.0 được sao chép tại `public/assets/engine/COPYING.txt` lúc `npm install`. Mã nguồn và công cụ build tương ứng của bản 18.0.8 nằm trong repository/release của Stockfish.js: https://github.com/nmrugg/stockfish.js/releases/tag/v18.0.8 . Không loại bỏ notices/giấy phép của engine khi đóng gói.

Quân cờ trong `src/game/pieces.ts`, icon và cảnh nền trong `public/assets/landscape.svg` là asset tự tạo cho đồ án.
