export interface DayBooking { id: string; masterId: string; date: string; seat: number; guarantee: number }
export interface Appointment { id: string; dayId: string; clientName: string; serviceId: string; start: string; end: string; price: number; status: 'reserved' | 'completed'; paymentStatus: 'held' | 'captured' }
export interface Settlement { dayId: string; revenue: number; guarantee: number; pvuTotal: number; masterNet: number; pvuFromRevenue: number; masterPayout: number }
export interface SunleoState {
  mode: 'test'; facility: { name: string; location: string; opensAt: string; closesAt: string; seats: number[] };
  services: { id: string; name: string; price: number; duration: number }[];
  masters: { id: string; name: string; specialty: string }[];
  days: DayBooking[]; appointments: Appointment[]; settlements: Settlement[];
}
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function requestState(path = '/state', body?: Record<string, unknown>): Promise<SunleoState> {
  const response = await fetch(`/sunleo-api${path}`, body ? {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
  } : { cache: 'no-store' });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(data?.error || 'Сервис временно недоступен. Повторите попытку.', response.status);
  if (!data || data.mode !== 'test' || !Array.isArray(data.days)) throw new Error('Не удалось получить данные SUNLEO. Проверьте запуск сервера.');
  return data as SunleoState;
}
export const money = (value: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value);
export const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
export const timeLabel = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
export function moscowToday() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
export function availableSlots(state: SunleoState, dayId: string, duration: number) {
  const visits = state.appointments.filter(a => a.dayId === dayId);
  return Array.from({ length: 24 }, (_, i) => 540 + i * 30).filter(start => start + duration <= 1260 &&
    !visits.some(a => start < minutes(a.end) && start + duration > minutes(a.start))).map(timeLabel);
}
