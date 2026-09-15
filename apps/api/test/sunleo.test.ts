import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { get } from 'node:http';
import { SunleoStore, settlement } from '../src/sunleo/store.js';
import { createSunleoServer } from '../src/sunleo/http.js';

test('SUNLEO settlement includes prepaid guarantee and preserves cash balance', () => {
  for (const [revenue, pvu, net] of [[0, 5000, -5000], [6000, 5000, 1000], [10000, 5000, 5000], [20000, 10000, 10000]]) {
    const result = settlement('day', revenue);
    assert.equal(result.pvuTotal, pvu); assert.equal(result.masterNet, net);
    assert.equal(result.masterPayout - 5000, net);
    assert.equal(result.pvuFromRevenue + 5000, pvu);
    assert.equal(result.masterNet + result.pvuTotal, revenue);
  }
});

test('SUNLEO persistent booking, serialized availability, server pricing and completion', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sunleo-'));
  try {
    const path = join(dir, 'store.json');
    const store = new SunleoStore(path, () => new Date('2026-09-12T12:00:00Z'));
    await store.initialize();
    const dayBody = { masterId: 'm1', date: '2026-09-12', seat: 1, idempotencyKey: 'd1' };
    const initial = await store.mutate('/sunleo-api/days', dayBody);
    const dayId = initial.days[0].id;
    assert.equal((await store.mutate('/sunleo-api/days', dayBody)).days.length, 1);
    await assert.rejects(store.mutate('/sunleo-api/days', { ...dayBody, seat: 2 }), /Ключ/);
    await assert.rejects(store.mutate('/sunleo-api/days', { ...dayBody, seat: 2, idempotencyKey: 'duplicate-master' }), /забронированы/);
    await assert.rejects(store.mutate('/sunleo-api/days', { ...dayBody, date: '2026-09-11', idempotencyKey: 'past' }), /Дата/);
    await assert.rejects(store.mutate('/sunleo-api/days', { ...dayBody, date: '2027-02-30', idempotencyKey: 'bad-date' }), /Дата/);
    await assert.rejects(store.mutate('/sunleo-api/days', { ...dayBody, date: '2028-01-01', idempotencyKey: 'far-date' }), /Дата/);
    const seatRace = await Promise.allSettled([
      store.mutate('/sunleo-api/days', { ...dayBody, date: '2026-09-13', idempotencyKey: 'seat-first' }),
      store.mutate('/sunleo-api/days', { ...dayBody, date: '2026-09-13', masterId: 'm2', idempotencyKey: 'seat-second' }),
    ]);
    assert.equal(seatRace.filter(result => result.status === 'fulfilled').length, 1);
    const booking = { dayId, serviceId: 'haircut', start: '09:00', clientName: 'Демо клиент', idempotencyKey: 'a1' };
    const race = await Promise.allSettled([store.mutate('/sunleo-api/appointments', booking), store.mutate('/sunleo-api/appointments', { ...booking, idempotencyKey: 'a2' })]);
    assert.equal(race.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(store.state().settlements[0].revenue, 0);
    await assert.rejects(store.mutate('/sunleo-api/appointments', { ...booking, start: '09:30', idempotencyKey: 'overlap' }), /занято/);
    await assert.rejects(store.mutate('/sunleo-api/appointments', { ...booking, start: '20:30', idempotencyKey: 'late' }), /интервал/);
    await assert.rejects(store.mutate('/sunleo-api/appointments', { ...booking, start: '12:15', idempotencyKey: 'step' }), /интервал/);
    await assert.rejects(store.mutate('/sunleo-api/appointments', { ...booking, price: 1, idempotencyKey: 'price' }), /полей/);
    await store.mutate('/sunleo-api/appointments', { ...booking, start: '10:00', idempotencyKey: 'adjacent' });
    await store.mutate('/sunleo-api/appointments', { ...booking, start: '20:00', idempotencyKey: 'closing-boundary' });
    const appointment = store.state().appointments[0];
    assert.equal(appointment.end, '10:00'); assert.equal(appointment.price, 3000);
    const complete = `/sunleo-api/appointments/${appointment.id}/complete`;
    await assert.rejects(store.mutate(complete, { masterId: 'm2', idempotencyKey: 'wrong' }), /только/);
    await store.mutate(complete, { masterId: 'm1', idempotencyKey: 'complete' });
    await store.mutate(complete, { masterId: 'm1', idempotencyKey: 'complete-again' });
    assert.equal(store.state().settlements[0].revenue, 3000);
    assert.equal(store.state().appointments[0].paymentStatus, 'captured');
    const restarted = new SunleoStore(path); await restarted.initialize();
    assert.deepEqual(restarted.state(), store.state());
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('SUNLEO HTTP restricts origins, host, JSON and size', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sunleo-http-'));
  const store = new SunleoStore(join(dir, 'store.json')); await store.initialize();
  const server = createSunleoServer(store);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/sunleo-api`;
  try {
    assert.equal((await fetch(`${url}/state`)).status, 200);
    const badHostStatus = await new Promise<number | undefined>((resolve, reject) => {
      get(`${url}/state`, { headers: { Host: 'evil.example' } }, response => { response.resume(); resolve(response.statusCode); }).on('error', reject);
    });
    assert.equal(badHostStatus, 403);
    assert.equal((await fetch(`${url}/days`, { method: 'POST', headers: { Origin: 'https://evil.example' } })).status, 403);
    assert.equal((await fetch(`${url}/days`, { method: 'POST', body: '{}' })).status, 415);
    assert.equal((await fetch(`${url}/days`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
    assert.equal((await fetch(`${url}/days`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ huge: 'x'.repeat(9000) }) })).status, 413);
    const allowed = await fetch(`${url}/state`, { headers: { Origin: 'http://localhost:5188' } });
    assert.equal(allowed.headers.get('Access-Control-Allow-Origin'), 'http://localhost:5188');
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await rm(dir, { recursive: true, force: true });
  }
});

test('SUNLEO rejects new appointments on persisted days before Moscow today', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sunleo-past-'));
  try {
    const path = join(dir, 'store.json');
    const store = new SunleoStore(path, () => new Date('2026-09-12T20:59:00Z'));
    await store.initialize();
    const state = await store.mutate('/sunleo-api/days', { masterId: 'm1', date: '2026-09-12', seat: 1, idempotencyKey: 'day' });
    const restarted = new SunleoStore(path, () => new Date('2026-09-12T21:00:00Z'));
    await restarted.initialize();
    await assert.rejects(restarted.mutate('/sunleo-api/appointments', { dayId: state.days[0].id, serviceId: 'haircut', start: '09:00', clientName: 'Демо', idempotencyKey: 'past-appointment' }), /прошедший день/);
    assert.equal(restarted.state().appointments.length, 0);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('SUNLEO failed simulated hold rolls back and permits retry with the same key', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sunleo-hold-'));
  try {
    const path = join(dir, 'store.json');
    let fail = true; let calls = 0;
    const store = new SunleoStore(path, () => new Date('2026-09-12T12:00:00Z'), {
      async reserve() { calls++; if (fail) throw new Error('Injected test failure'); }, async capture() {},
    });
    await store.initialize();
    const state = await store.mutate('/sunleo-api/days', { masterId: 'm1', date: '2026-09-12', seat: 1, idempotencyKey: 'day' });
    const body = { dayId: state.days[0].id, serviceId: 'haircut', start: '09:00', clientName: 'Демо', idempotencyKey: 'hold' };
    await assert.rejects(store.mutate('/sunleo-api/appointments', body), /резервирование денег/);
    assert.equal(store.state().appointments.length, 0);
    const restart = new SunleoStore(path); await restart.initialize();
    assert.equal(restart.state().appointments.length, 0);
    fail = false;
    await store.mutate('/sunleo-api/appointments', body);
    await store.mutate('/sunleo-api/appointments', body);
    assert.equal(store.state().appointments.length, 1);
    assert.equal(store.state().appointments[0].paymentStatus, 'held');
    assert.equal(calls, 2);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('SUNLEO failed simulated capture retains hold, rolls back and allows retry', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sunleo-capture-'));
  try {
    const path = join(dir, 'store.json');
    let fail = true; let calls = 0;
    const store = new SunleoStore(path, () => new Date('2026-09-12T12:00:00Z'), {
      async reserve() {}, async capture() { calls++; if (fail) throw new Error('Injected test failure'); },
    });
    await store.initialize();
    const state = await store.mutate('/sunleo-api/days', { masterId: 'm1', date: '2026-09-12', seat: 1, idempotencyKey: 'day' });
    await store.mutate('/sunleo-api/appointments', { dayId: state.days[0].id, serviceId: 'haircut', start: '09:00', clientName: 'Демо', idempotencyKey: 'hold' });
    const route = `/sunleo-api/appointments/${store.state().appointments[0].id}/complete`;
    const body = { masterId: 'm1', idempotencyKey: 'capture' };
    await assert.rejects(store.mutate(route, body), /списание денег/);
    assert.equal(store.state().appointments[0].status, 'reserved');
    assert.equal(store.state().appointments[0].paymentStatus, 'held');
    assert.equal(store.state().settlements[0].revenue, 0);
    const restart = new SunleoStore(path); await restart.initialize();
    assert.equal(restart.state().appointments[0].paymentStatus, 'held');
    fail = false;
    await store.mutate(route, body);
    await store.mutate(route, body);
    await store.mutate(route, { ...body, idempotencyKey: 'capture-again' });
    assert.equal(store.state().appointments[0].status, 'completed');
    assert.equal(store.state().settlements[0].revenue, 3000);
    assert.equal(calls, 2);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
