import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
type Day = { id: string; masterId: string; date: string; seat: number; guarantee: number };
type Appointment = { id: string; dayId: string; clientName: string; serviceId: string; start: string; end: string; price: number; status: 'reserved' | 'completed'; paymentStatus: 'held' | 'captured' };
type Data = { version: 1; days: Day[]; appointments: Appointment[]; requests: Record<string, string> };
const masters = [{ id: 'm1', name: 'Анна · демо-мастер', specialty: 'Стрижки и укладки' }, { id: 'm2', name: 'Дмитрий · демо-мастер', specialty: 'Стрижки и окрашивание' }, { id: 'm3', name: 'Марина · демо-мастер', specialty: 'Укладки и окрашивание' }];
/** Failure-injection seam for local tests only; this is not a real payment integration. */
export interface PaymentSimulator { reserve(): Promise<void>; capture(): Promise<void> }
const successfulPayments: PaymentSimulator = { async reserve() {}, async capture() {} };
const services = [{ id: 'haircut', name: 'Стрижка', price: 3000, duration: 60 }, { id: 'color', name: 'Окрашивание', price: 7000, duration: 120 }, { id: 'styling', name: 'Укладка', price: 2000, duration: 60 }];
export function settlement(dayId: string, revenue: number) {
  const pvuTotal = Math.max(5000, revenue / 2);
  const pvuFromRevenue = Math.max(0, revenue / 2 - 5000);
  return { dayId, revenue, guarantee: 5000, pvuTotal, masterNet: revenue - pvuTotal, pvuFromRevenue, masterPayout: revenue - pvuFromRevenue };
}
function string(value: unknown, name: string, max = 100): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f]/.test(value)) throw new ApiError(400, `Некорректное поле ${name}`);
  return value.trim();
}
function object(value: unknown, fields: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, 'Ожидается JSON-объект');
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some(key => !fields.includes(key)) || fields.some(key => !(key in result))) throw new ApiError(400, 'Некорректный набор полей');
  return result;
}
const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
const time = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;

export class SunleoStore {
  private queue: Promise<unknown> = Promise.resolve();
  private data: Data = { version: 1, days: [], appointments: [], requests: {} };
  constructor(private path: string, private now: () => Date = () => new Date(), private payments: PaymentSimulator = successfulPayments) {}
  private today() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).format(this.now());
  }
  private async simulatePayment(operation: 'reserve' | 'capture') {
    try { await this.payments[operation](); }
    catch { throw new ApiError(409, operation === 'reserve' ? 'Тестовое резервирование денег не выполнено. Повторите попытку.' : 'Тестовое списание денег не выполнено. Повторите попытку.'); }
  }
  async initialize() {
    try {
      const data = JSON.parse(await readFile(this.path, 'utf8')) as Data;
      if (data.version !== 1 || !Array.isArray(data.days) || !Array.isArray(data.appointments) || !data.requests || typeof data.requests !== 'object') throw new Error('Неподдерживаемое хранилище SUNLEO');
      this.data = data;
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  }
  state() {
    return {
      mode: 'test' as const,
      facility: { name: 'SUNLEO', location: 'Москва · юг', opensAt: '09:00', closesAt: '21:00', seats: [1, 2, 3] },
      services, masters, days: this.data.days, appointments: this.data.appointments,
      settlements: this.data.days.map(day => settlement(day.id, this.data.appointments.filter(a => a.dayId === day.id && a.status === 'completed' && a.paymentStatus === 'captured').reduce((sum, a) => sum + a.price, 0))),
    };
  }
  mutate(route: string, input: unknown) {
    const operation = this.queue.then(async () => {
      const fields = route === '/sunleo-api/days' ? ['masterId', 'date', 'seat', 'idempotencyKey'] : route === '/sunleo-api/appointments' ? ['dayId', 'serviceId', 'start', 'clientName', 'idempotencyKey'] : ['masterId', 'idempotencyKey'];
      const body = object(input, fields);
      const key = string(body.idempotencyKey, 'idempotencyKey', 128);
      if (!/^[a-zA-Z0-9_-]+$/.test(key)) throw new ApiError(400, 'Некорректный idempotencyKey');
      const fingerprint = JSON.stringify([route, fields.map(field => body[field])]);
      if (Object.hasOwn(this.data.requests, key)) {
        if (this.data.requests[key] !== fingerprint) throw new ApiError(409, 'Ключ уже использован с другими данными');
        return this.state();
      }
      const draft = structuredClone(this.data);
      if (route === '/sunleo-api/days') {
        const masterId = string(body.masterId, 'masterId');
        const date = string(body.date, 'date');
        const today = this.today();
        const parsed = Date.parse(`${date}T00:00:00Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 10) !== date || date < today || parsed - Date.parse(`${today}T00:00:00Z`) > 365 * 86400000) throw new ApiError(400, 'Дата должна быть в ближайшие 365 дней');
        if (!masters.some(m => m.id === masterId) || ![1, 2, 3].includes(body.seat as number)) throw new ApiError(400, 'Неизвестный мастер или место');
        if (draft.days.some(d => d.date === date && (d.seat === body.seat || d.masterId === masterId))) throw new ApiError(409, 'Место или мастер уже забронированы на этот день');
        draft.days.push({ id: randomUUID(), masterId, date, seat: body.seat as number, guarantee: 5000 });
      } else if (route === '/sunleo-api/appointments') {
        const dayId = string(body.dayId, 'dayId');
        const day = draft.days.find(d => d.id === dayId);
        if (!day) throw new ApiError(404, 'Бронь дня не найдена');
        if (day.date < this.today()) throw new ApiError(409, 'Нельзя записаться на прошедший день');
        const service = services.find(s => s.id === body.serviceId);
        if (!service) throw new ApiError(400, 'Неизвестная услуга');
        const start = string(body.start, 'start');
        const begin = minutes(start), finish = begin + service.duration;
        if (!/^([01]\d|2[0-3]):(00|30)$/.test(start) || begin < 540 || finish > 1260) throw new ApiError(400, 'Услуга должна помещаться в интервал 09:00–21:00 с шагом 30 минут');
        if (draft.appointments.some(a => a.dayId === dayId && begin < minutes(a.end) && finish > minutes(a.start))) throw new ApiError(409, 'Это время уже занято');
        const clientName = string(body.clientName, 'clientName', 80);
        await this.simulatePayment('reserve');
        draft.appointments.push({ id: randomUUID(), dayId, serviceId: service.id, clientName, start, end: time(finish), price: service.price, status: 'reserved', paymentStatus: 'held' });
      } else {
        const match = route.match(/^\/sunleo-api\/appointments\/([a-f0-9-]{36})\/complete$/);
        if (!match) throw new ApiError(404, 'Маршрут не найден');
        const appointment = draft.appointments.find(a => a.id === match[1]);
        if (!appointment) throw new ApiError(404, 'Запись не найдена');
        if (draft.days.find(d => d.id === appointment.dayId)?.masterId !== body.masterId) throw new ApiError(403, 'Подтвердить услугу может только её мастер (демо-роль)');
        if (appointment.paymentStatus !== 'captured') await this.simulatePayment('capture');
        appointment.status = 'completed'; appointment.paymentStatus = 'captured';
      }
      Object.defineProperty(draft.requests, key, { value: fingerprint, enumerable: true, configurable: true, writable: true });
      await mkdir(dirname(this.path), { recursive: true });
      const temporary = `${this.path}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(draft), { mode: 0o600 });
      await rename(temporary, this.path);
      this.data = draft;
      return this.state();
    });
    this.queue = operation.catch(() => undefined);
    return operation;
  }
}
