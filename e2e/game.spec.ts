import { test, expect, type Page } from '@playwright/test';
import { Chess } from 'chess.js';

async function startLocal(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /2 người chơi/ }).click();
  await page.getByRole('button', { name: 'Bắt đầu cuộc phiêu lưu' }).click();
  await expect(page.locator('.phaser-host')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'e2 Trắng Tốt' })).toBeEnabled();
}

async function point(page: Page, square: string) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('Canvas is missing');
  const col = square.charCodeAt(0) - 97;
  const row = 8 - Number(square[1]);
  return { x: box.x + (28 + col * 64 + 32) * box.width / 568, y: box.y + (28 + row * 64 + 32) * box.height / 568 };
}
async function move(page: Page, from: string, to: string, drag = false) {
  const a = await point(page, from), b = await point(page, to);
  await page.mouse.move(a.x, a.y);
  if (drag) {
    await page.mouse.down(); await page.mouse.move(b.x, b.y, { steps: 10 }); await page.mouse.up();
  } else {
    await page.mouse.click(a.x, a.y); await page.mouse.click(b.x, b.y);
  }
}

test('menu pixel và bàn cờ desktop render không có lỗi runtime', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'PIXEL CHESS ADVENTURE' })).toBeVisible();
  await page.screenshot({ path: '.qa/menu-desktop.png', fullPage: true });
  await startLocal(page);
  await page.screenshot({ path: '.qa/game-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('click, nước bất hợp lệ, kéo thả, undo và lưu/mở ván', async ({ page }) => {
  await startLocal(page);
  await move(page, 'e2', 'e5');
  await expect(page.locator('.small-badge')).toHaveText('0 nước');
  await move(page, 'e2', 'e4');
  await expect(page.locator('.small-badge')).toHaveText('1 nước');
  await expect(page.getByRole('button', { name: 'e4 Trắng Tốt' })).toBeEnabled();
  await move(page, 'e7', 'e5', true);
  await expect(page.locator('.small-badge')).toHaveText('2 nước');
  await page.getByRole('button', { name: 'Đi lại', exact: true }).click();
  await expect(page.locator('.small-badge')).toHaveText('1 nước');
  await page.getByRole('button', { name: 'Lưu ván', exact: true }).click();
  await expect(page.locator('.toast')).toContainText('Đã lưu');
  await page.reload();
  await page.getByRole('button', { name: 'Mở ván cờ đã lưu' }).click();
  await expect(page.locator('.small-badge')).toHaveText('1 nước');
  await expect(page.getByRole('button', { name: 'e4 Trắng Tốt' })).toBeEnabled();
});

test('hoàn thành ván chiếu hết, xem lại và chơi lại', async ({ page }) => {
  await startLocal(page);
  await move(page, 'f2', 'f3'); await expect(page.locator('.small-badge')).toHaveText('1 nước');
  await move(page, 'e7', 'e5'); await expect(page.locator('.small-badge')).toHaveText('2 nước');
  await move(page, 'g2', 'g4'); await expect(page.locator('.small-badge')).toHaveText('3 nước');
  await move(page, 'd8', 'h4');
  await expect(page.getByRole('dialog')).toContainText('Quân đen giành chiến thắng');
  await page.getByRole('button', { name: 'Xem lại ván cờ' }).click();
  await page.getByRole('button', { name: 'Nước trước' }).click();
  await expect(page.getByRole('button', { name: 'd8 Đen Hậu' })).toBeAttached();
  await page.getByRole('button', { name: 'Chơi lại', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Chơi lại', exact: true }).click();
  await expect(page.locator('.small-badge')).toHaveText('0 nước');
});

test('AI WASM thật đi đúng lượt và bị hủy khi restart', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: /Chơi với máy/ }).click();
  await page.getByRole('button', { name: /Dễ/ }).click();
  await page.getByRole('button', { name: 'Bắt đầu cuộc phiêu lưu' }).click();
  await expect(page.locator('.phaser-host')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('canvas')).toBeVisible();
  await move(page, 'e2', 'e4');
  await expect(page.locator('.small-badge')).toHaveText('2 nước', { timeout: 20000 });
  await expect(page.getByRole('button', { name: 'd2 Trắng Tốt' })).toBeEnabled();
  await move(page, 'd2', 'd4');
  await page.getByRole('button', { name: 'Chơi lại', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Chơi lại', exact: true }).click();
  await expect(page.locator('.small-badge')).toHaveText('0 nước');
  // Wait for an observable new game to remain idle beyond Easy's search window.
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).last().click();
  await page.getByRole('button', { name: 'Hoàn tất' }).click();
  await expect(page.locator('.small-badge')).toHaveText('0 nước');
  expect(errors).toEqual([]);
});

test('phong cấp mở lựa chọn quân và không tự động thành hậu', async ({ page }) => {
  const chess = new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');
  const raw = JSON.stringify({ version: 1, pgn: chess.pgn(), fen: chess.fen(), mode: 'local', minutes: 0, clocks: { w: 0, b: 0 }, clockHistory: [], result: null });
  await page.addInitScript((save) => localStorage.setItem('pixel-chess.save.v1', save), raw);
  await page.goto('/');
  await page.getByRole('button', { name: 'Mở ván cờ đã lưu' }).click();
  await expect(page.locator('.phaser-host')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('canvas')).toBeVisible();
  await move(page, 'a7', 'a8');
  await expect(page.getByRole('dialog')).toContainText('Phong cấp tốt');
  await page.getByRole('button', { name: 'Phong cấp Xe', exact: true }).click();
  await expect(page.getByRole('button', { name: 'a8 Trắng Xe' })).toBeEnabled();
});

test('mobile 375px và 320px không tràn ngang; bàn cờ vuông và chơi được', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.qa/menu-mobile.png', fullPage: true });
  await startLocal(page);
  await move(page, 'e2', 'e4');
  await expect(page.locator('.small-badge')).toHaveText('1 nước');
  const box = await page.locator('canvas').boundingBox();
  expect(Math.abs(box!.width - box!.height)).toBeLessThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: '.qa/game-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 740 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('cài đặt lưu theme/âm thanh và bàn phím di chuyển quân', async ({ page }) => {
  await startLocal(page);
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).last().click();
  await page.getByLabel('Màu bàn cờ').selectOption('forest');
  await page.getByLabel('Âm thanh 8-bit').uncheck();
  await page.getByRole('button', { name: 'Hoàn tất' }).click();
  const from = page.getByRole('button', { name: 'e2 Trắng Tốt' });
  await from.focus(); await page.keyboard.press('Enter');
  await expect(from).toHaveAttribute('aria-pressed', 'true');
  const to = page.getByRole('button', { name: /e4 trống, nước đi hợp lệ/ });
  await to.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('.small-badge')).toHaveText('1 nước');
  await page.reload();
  await page.getByRole('button', { name: 'Cài đặt', exact: true }).last().click();
  await expect(page.getByLabel('Màu bàn cờ')).toHaveValue('forest');
  await expect(page.getByLabel('Âm thanh 8-bit')).not.toBeChecked();
});
