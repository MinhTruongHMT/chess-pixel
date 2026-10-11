import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const install = process.argv.includes('--install');
const child = spawn(process.execPath, [resolve(root, 'node_modules/@playwright/test/cli.js'), ...(install ? ['install', 'chromium'] : ['test'])], {
  cwd: root,
  env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: resolve(root, '.browser-cache') },
  stdio: 'inherit',
});
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code) => { process.exitCode = code ?? 1; });
