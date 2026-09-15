import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
}
for (const args of [
  ['node_modules/tsx/dist/cli.mjs', 'apps/api/src/sunleo/server.ts'],
  ['node_modules/vite/bin/vite.js', 'apps/web', '--host', '127.0.0.1', '--port', '5188', '--strictPort']
]) {
  const child = spawn(process.execPath, args, { cwd: root, stdio: 'inherit', env: { ...process.env, SUNLEO_PORT: '3038' } });
  children.push(child);
  child.on('error', error => { console.error(error.message); stop(1); });
  child.on('exit', code => { if (!stopping) stop(code ?? 1); });
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
console.log('SUNLEO local test MVP: http://127.0.0.1:5188/sunleo');
console.log('Synthetic profiles and payments only. Stop both services with Ctrl+C.');
