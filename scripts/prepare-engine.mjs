import { mkdir, readdir, copyFile, writeFile, unlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const packageRoot = resolve(root, 'node_modules/stockfish');
const target = resolve(root, 'public/assets/engine');
await mkdir(target, { recursive: true });
let source = resolve(packageRoot, 'bin');
let files;
try { files = await readdir(source); }
catch { source = resolve(packageRoot, 'src'); files = await readdir(source); }
const js = files.find((name) => /lite-single.*\.js$/.test(name));
if (!js) throw new Error('Không tìm thấy Stockfish WASM lite single-threaded.');
const wasm = `${js.slice(0, -3)}.wasm`;
if (!files.includes(wasm)) throw new Error('Không tìm thấy WASM tương ứng với Stockfish.');
// This edition infers WASM from the Worker URL, so both basenames must match.
await copyFile(resolve(source, js), resolve(target, 'stockfish.js'));
await copyFile(resolve(source, wasm), resolve(target, 'stockfish.wasm'));
// Node smoke tests run the same files in CommonJS; browsers ignore this metadata.
await writeFile(resolve(target, 'package.json'), '{"type":"commonjs"}\n');
for (const name of [js, wasm]) {
  if (name === 'stockfish.js' || name === 'stockfish.wasm') continue;
  try { await unlink(resolve(target, name)); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
for (const license of ['Copying.txt', 'COPYING', 'LICENSE']) {
  try { await copyFile(resolve(packageRoot, license), resolve(target, 'COPYING.txt')); break; }
  catch { /* License is also documented in THIRD_PARTY_NOTICES.md. */ }
}
console.log(`Stockfish ready: ${js}`);
