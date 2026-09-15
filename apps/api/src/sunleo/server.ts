import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SunleoStore } from './store.js';
import { createSunleoServer } from './http.js';

const port = Number(process.env.SUNLEO_PORT ?? 3038);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Некорректный SUNLEO_PORT');
const store = new SunleoStore(process.env.SUNLEO_STORE_PATH ? resolve(process.env.SUNLEO_STORE_PATH) : fileURLToPath(new URL('../../../../.local/sunleo/store.json', import.meta.url)));
await store.initialize();
createSunleoServer(store).listen(port, '127.0.0.1', () => {
  console.log(`SUNLEO TEST API http://127.0.0.1:${port} — только синтетические данные; платежи имитируются; роли не являются авторизацией.`);
});
