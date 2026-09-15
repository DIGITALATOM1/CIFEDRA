import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, availableSlots, money, moscowToday, requestState, type Appointment, type SunleoState } from './api';
import './sunleo.css';

type Role = 'master' | 'client' | 'owner';
const roleLabels: Record<Role, string> = { master: 'Парикмахер', client: 'Клиент', owner: 'Владелец ПВУ' };
export function SunleoApp() {
  const [state, setState] = useState<SunleoState | null>(null);
  const [role, setRole] = useState<Role>('client');
  const [date, setDate] = useState(moscowToday);
  const [masterId, setMasterId] = useState('m1');
  const [clientDayId, setClientDayId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [start, setStart] = useState('');
  const [clientName, setClientName] = useState('');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const keys = useRef(new Map<string, string>());
  const pending = useRef(false);
  const refresh = useCallback(async () => {
    try { const next = await requestState(); if (!pending.current) setState(next); }
    catch (e) { setError(e instanceof Error ? e.message : 'Нет связи с сервером'); }
  }, []);
  useEffect(() => {
    document.title = 'SUNLEO — пилот ПВУ';
    document.querySelector('meta[name="description"]')?.setAttribute('content', 'Локальный тестовый MVP SUNLEO: место мастера, запись клиента и расчёт ПВУ.');
    void refresh();
  }, [refresh]);
  async function command(path: string, payload: Record<string, unknown>, success: string) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(''); setNotice('');
    const fingerprint = JSON.stringify([path, payload]);
    const idempotencyKey = keys.current.get(fingerprint) ?? crypto.randomUUID();
    keys.current.set(fingerprint, idempotencyKey);
    try {
      const next = await requestState(path, { ...payload, idempotencyKey });
      setState(next); keys.current.delete(fingerprint); setNotice(success);
    } catch (e) {
      if (e instanceof ApiError && e.status < 500) keys.current.delete(fingerprint);
      setError(e instanceof Error ? e.message : 'Операция не подтверждена. Повторите с теми же данными.');
    } finally { pending.current = false; setBusy(false); }
  }
  const days = state?.days.filter(d => d.date === date) ?? [];
  const myDay = days.find(d => d.masterId === masterId);
  const selectedClientDay = days.find(d => d.id === clientDayId) ?? days[0];
  const service = state?.services.find(s => s.id === serviceId) ?? state?.services[0];
  const slots = state && selectedClientDay && service ? availableSlots(state, selectedClientDay.id, service.duration) : [];
  const selectedStart = slots.includes(start) ? start : slots[0] ?? '';
  const myVisits = state?.appointments.filter(a => a.dayId === myDay?.id).sort((a, b) => a.start.localeCompare(b.start)) ?? [];
  const dayIds = new Set(days.map(d => d.id));
  const visits = state?.appointments.filter(a => dayIds.has(a.dayId)).sort((a, b) => a.start.localeCompare(b.start)) ?? [];
  const settlements = state?.settlements.filter(s => dayIds.has(s.dayId)) ?? [];
  const mySettlement = settlements.find(s => s.dayId === myDay?.id);
  const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');
  const visibleClientDays = normalizedQuery && state
    ? days.filter(day => {
        const master = state.masters.find(candidate => candidate.id === day.masterId);
        return `${master?.name ?? ''} ${master?.specialty ?? ''}`.toLocaleLowerCase('ru-RU').includes(normalizedQuery)
          || state.services.some(candidate => candidate.name.toLocaleLowerCase('ru-RU').includes(normalizedQuery));
      })
    : days;
  const changeRole = (next: Role) => { setRole(next); setNotice(''); setError(''); };
  function visitCard(a: Appointment, canComplete = false) {
    const day = state?.days.find(d => d.id === a.dayId);
    return <article className="sl-visit" key={a.id}>
      <div className="sl-time">{a.start}<small>до {a.end}</small></div>
      <div className="sl-visit-main"><strong>{state?.services.find(s => s.id === a.serviceId)?.name}</strong><span>{a.clientName} · кресло {day?.seat}</span><span className={`sl-status ${a.status === 'completed' ? 'done' : ''}`}>{a.status === 'completed' ? 'Услуга завершена · списано' : 'Запись подтверждена · деньги в резерве'}</span></div>
      <div className="sl-visit-action"><strong>{money(a.price)}</strong>{canComplete && a.status === 'reserved' && <button className="sl-secondary" disabled={busy} onClick={() => void command(`/appointments/${a.id}/complete`, { masterId }, 'Мастер подтвердил услугу. Тестовый резерв списан, расчёт обновлён.')}>Подтвердить оказание</button>}</div>
    </article>;
  }
  return <div className="sunleo-app">
    <header className="sl-header"><a className="sl-logo" href="/sunleo">sunleo<span>сообщество парикмахеров</span></a><button className="sl-catalog-button" type="button" onClick={() => changeRole('client')}>Каталог</button><label className="sl-search"><span className="sl-search-icon" aria-hidden="true">⌕</span><span className="sl-search-label">Поиск мастера или услуги</span><input value={query} onChange={event => setQuery(event.target.value)} onFocus={() => changeRole('client')} placeholder="Найти стрижку, окрашивание или мастера"/><button type="button" aria-label="Найти" onClick={() => changeRole('client')}>Найти</button></label><button className="sl-place" type="button" onClick={() => changeRole('client')}><span aria-hidden="true">⌖</span><span>ПВУ SUNLEO<small>Москва · юг</small></span></button><span className="sl-pilot">MVP / 01</span></header>
    <div className="sl-test"><b>Тестовый режим</b><span>Деньги не списываются. Все профили, цены услуг и операции демонстрационные; роли переключаются без входа.</span></div>
    <nav className="sl-market-nav" aria-label="Разделы SUNLEO"><button type="button" onClick={() => changeRole('client')}>Мастера</button><button type="button" onClick={() => { setServiceId('haircut'); changeRole('client'); }}>Стрижки</button><button type="button" onClick={() => { setServiceId('color'); changeRole('client'); }}>Окрашивание</button><button type="button" onClick={() => { setServiceId('styling'); changeRole('client'); }}>Укладки</button><button type="button" onClick={() => changeRole('master')}>Забронировать место</button><button type="button" onClick={() => changeRole('owner')}>Управление ПВУ</button></nav>
    <main className="sl-main">
      <div className="sl-top"><div><p className="sl-eyebrow">SUNLEO · ПУНКТ ВЫДАЧИ УСЛУГ</p><h1>{role === 'master' ? 'Ваше место. Ваши клиенты.' : role === 'client' ? 'Красота рядом — мастер уже выбрал ПВУ.' : 'Один день площадки.'}</h1><p className="sl-subtitle">{role === 'master' ? 'Закрепите кресло на день — клиенты запишутся автоматически.' : role === 'client' ? 'Сравните мастеров, выберите услугу и забронируйте свободное время.' : 'Три кресла, все визиты и прозрачный расчёт с мастерами.'}</p></div>{role === 'client' && <div className="sl-hero-offer"><span>Пилот SUNLEO</span><strong>3 кресла · 09:00–21:00</strong><small>Стандартный комплект включён</small></div>}</div>
      <div className="sl-toolbar"><nav aria-label="Роль в тестовом сценарии">{(['master', 'client', 'owner'] as Role[]).map(r => <button key={r} aria-pressed={role === r} onClick={() => changeRole(r)}>{roleLabels[r]}</button>)}</nav><label className="sl-date">День в ПВУ<input aria-label="День в ПВУ" type="date" value={date} onChange={e => { if (e.target.value) { setDate(e.target.value); setNotice(''); } }} /></label><button className="sl-refresh" onClick={() => { setError(''); void refresh(); }} disabled={busy} aria-label="Обновить данные">Обновить ↻</button></div>
      {error && <div role="alert" className="sl-alert error">{error}</div>}{notice && <div role="status" className="sl-alert success">{notice}</div>}
      {!state ? <div className="sl-panel sl-empty" role="status">{error ? 'Для работы нужен сервер SUNLEO. Запустите npm run sunleo:dev и нажмите «Обновить».' : 'Загружаем площадку…'}</div> : <>
        {role === 'master' && <div className="sl-layout"><section className="sl-panel"><div className="sl-panel-head"><div><p className="sl-eyebrow">01 / БРОНИРОВАНИЕ ДНЯ</p><h2>Выберите рабочее место</h2></div><span className="sl-tag">09:00 — 21:00 · МСК</span></div><label className="sl-field">Тестовый профиль мастера<select value={masterId} disabled={busy} onChange={e => { setMasterId(e.target.value); setNotice(''); }}>{state.masters.map(m => <option value={m.id} key={m.id}>{m.name} · {m.specialty}</option>)}</select></label>
          <div className="sl-seats">{state.facility.seats.map(seat => { const booking = days.find(d => d.seat === seat); const mine = booking?.masterId === masterId; return <article key={seat} className={`sl-seat ${mine ? 'mine' : ''}`}><div className="sl-seat-num">0{seat}<span>КРЕСЛО</span></div><div className="sl-seat-info"><strong>{mine ? 'Ваше место на день' : booking ? 'Забронировано' : 'Свободно на весь день'}</strong><span>{booking ? state.masters.find(m => m.id === booking.masterId)?.name : 'Стандартный комплект ПВУ'}</span></div><button className={mine ? 'sl-secondary' : 'sl-primary'} disabled={busy || !!booking || !!myDay || date < moscowToday()} onClick={() => void command('/days', { masterId, date, seat }, 'Место закреплено на день. Тестовый взнос 5 000 ₽ учтён; клиентам открыта запись.')}>{mine ? 'Закреплено за вами' : booking ? 'Место занято' : 'Внести 5 000 ₽ · тест'}</button></article>; })}</div>
          <p className="sl-footnote">Бронь действует весь рабочий день, включая часы без клиентов. Для нескольких дней забронируйте каждый день отдельно. Перечень стандартного комплекта уточняется.</p>
          <div className="sl-section-break"><div className="sl-panel-head"><div><p className="sl-eyebrow">02 / ЗАПИСИ К ВАМ</p><h2>Расписание визитов</h2></div><span className="sl-tag">{myVisits.length} записей</span></div>{myVisits.length ? myVisits.map(a => visitCard(a, true)) : <div className="sl-empty"><strong>{myDay ? 'День открыт для клиентов' : 'Сначала забронируйте место'}</strong><p>{myDay ? 'Переключитесь на роль клиента и создайте первую запись.' : 'После бронирования ваши услуги появятся у клиентов на эту дату.'}</p>{myDay && <button className="sl-secondary" onClick={() => changeRole('client')}>Перейти к записи клиента →</button>}</div>}<p className="sl-footnote">В тесте визит можно завершить сразу. В реальном пилоте мастер подтверждает только фактически оказанную услугу.</p></div>
        </section><aside><section className="sl-terms"><p className="sl-eyebrow">УСЛОВИЯ ПИЛОТА</p><h2>5 000 ₽<small>минимум за день</small></h2><p>Взнос входит в долю ПВУ. Доход от услуг делится 50/50, комиссия SUNLEO — 0%.</p><hr/><p>Если услуг мало, день пустует или мастер не пришёл, взнос не возвращается.</p></section>{mySettlement && <section className="sl-panel sl-ledger"><h3>Ваш расчёт за день</h3><dl><div><dt>Оказано услуг</dt><dd>{money(mySettlement.revenue)}</dd></div><div><dt>Взнос уже внесён</dt><dd>{money(mySettlement.guarantee)}</dd></div><div><dt>Из выручки в ПВУ</dt><dd>{money(mySettlement.pvuFromRevenue)}</dd></div><div><dt>К выплате мастеру</dt><dd>{money(mySettlement.masterPayout)}</dd></div><div className="sl-total"><dt>Ваш итог с учётом взноса</dt><dd>{money(mySettlement.masterNet)}</dd></div></dl><p className="sl-footnote">Это тестовый расчёт, не банковская выплата. Незавершённые услуги в выручку не включены.</p></section>}</aside></div>}
        {role === 'client' && <div className="sl-layout sl-client-layout"><section className="sl-panel"><div className="sl-panel-head"><div><p className="sl-eyebrow">01 / МАСТЕРА В ЭТОМ ПВУ</p><h2>SUNLEO · Москва, юг</h2></div><span className="sl-tag">{visibleClientDays.length} мастеров на дату</span></div>{!days.length ? <div className="sl-empty"><strong>На эту дату мастера ещё не открыли запись</strong><p>Выберите другой день или забронируйте место в роли парикмахера.</p><button className="sl-secondary" onClick={() => changeRole('master')}>Открыть день мастера →</button></div> : !visibleClientDays.length ? <div className="sl-empty"><strong>По запросу «{query}» мастеров не найдено</strong><p>Измените запрос или очистите строку поиска.</p><button className="sl-secondary" onClick={() => setQuery('')}>Показать всех мастеров</button></div> : <><div className="sl-masters">{visibleClientDays.map(d => { const m = state.masters.find(x => x.id === d.masterId); return <button key={d.id} className="sl-master-card" aria-pressed={selectedClientDay?.id === d.id} onClick={() => { setClientDayId(d.id); setStart(''); }}><span className="sl-master-cover"><span className="sl-avatar">{m?.name.slice(0, 1)}</span><span className="sl-fast">Запись сразу</span></span><span className="sl-master-copy"><strong>{m?.name}</strong><small>{m?.specialty}</small><span className="sl-rating">★ Новый мастер</span><small>SUNLEO · кресло {d.seat}</small></span><span className="sl-check">{selectedClientDay?.id === d.id ? '✓' : '→'}</span></button>; })}</div><div className="sl-section-break"><p className="sl-eyebrow">02 / УСЛУГА И ВРЕМЯ</p><h2>Выберите услугу</h2><div className="sl-services" aria-label="Услуги SUNLEO">{state.services.map((s, index) => <button key={s.id} className={`sl-service sl-service-${index + 1}`} aria-pressed={service?.id === s.id} onClick={() => { setServiceId(s.id); setStart(''); }}><span className="sl-service-art" aria-hidden="true">{s.id === 'haircut' ? '✂' : s.id === 'color' ? '◐' : '≈'}</span><span className="sl-service-copy"><strong>{s.name}</strong><small>{s.duration} мин</small><b>{money(s.price)}</b></span></button>)}</div><p className="sl-footnote">Цены и длительность устанавливает SUNLEO. Здесь используются тестовые значения.</p><h3>Свободное время · МСК</h3><div className="sl-slots">{slots.map(t => <button key={t} aria-pressed={selectedStart === t} onClick={() => setStart(t)}>{t}</button>)}</div>{!slots.length && <p className="sl-empty">Для этой услуги свободных интервалов нет. Выберите другого мастера, услугу или день.</p>}</div></>}</section><aside className="sl-panel sl-checkout"><p className="sl-eyebrow">03 / ВАША ЗАПИСЬ</p><h2>Подтверждение</h2><dl><div><dt>Мастер</dt><dd>{state.masters.find(m => m.id === selectedClientDay?.masterId)?.name ?? 'Ещё не выбран'}</dd></div><div><dt>ПВУ</dt><dd>SUNLEO · Москва, юг</dd></div><div><dt>Дата и время</dt><dd>{date} · {selectedStart || '—'}</dd></div><div><dt>Услуга</dt><dd>{service?.name ?? '—'}</dd></div><div className="sl-total"><dt>Зарезервируем</dt><dd>{money(service?.price ?? 0)}</dd></div></dl><form onSubmit={e => { e.preventDefault(); if (selectedClientDay && service && selectedStart) void command('/appointments', { dayId: selectedClientDay.id, serviceId: service.id, start: selectedStart, clientName: clientName.trim() }, `Запись на ${selectedStart} подтверждена. Тестовый резерв ${money(service.price)} создан.`); }}><label className="sl-field">Имя для тестовой записи<input required maxLength={60} value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Например, Тестовый клиент" autoComplete="off"/></label><p className="sl-footnote">Используйте вымышленное имя. Списание происходит после оказания услуги и подтверждения мастера. Сейчас платёж полностью имитируется.</p><button className="sl-primary sl-wide" disabled={busy || !selectedStart || !clientName.trim() || date < moscowToday()}>{busy ? 'Подтверждаем…' : 'Записаться · тестовый резерв'}</button></form><div className="sl-trust"><span>✓ Запись подтверждается сразу</span><span>✓ Деньги списываются после услуги</span></div><p className="sl-responsibility">За услугу отвечает парикмахер. ПВУ обеспечивает место и стандартный комплект.</p></aside></div>}
        {role === 'owner' && <><div className="sl-stats"><article><span>Места на день</span><strong>{days.length} / 3</strong><small>Закреплено за мастерами</small></article><article><span>Оказанные услуги</span><strong>{money(settlements.reduce((sum, s) => sum + s.revenue, 0))}</strong><small>{visits.filter(a => a.status === 'completed').length} завершённых визитов</small></article><article><span>Доля ПВУ, включая взносы</span><strong>{money(settlements.reduce((sum, s) => sum + s.pvuTotal, 0))}</strong><small>Тестовые начисления за выбранный день</small></article></div><section className="sl-panel"><div className="sl-panel-head"><div><p className="sl-eyebrow">МЕСТА И РАСЧЁТЫ</p><h2>Кто работает сегодня</h2></div><span className="sl-tag">09:00 — 21:00</span></div><div className="sl-owner-grid">{state.facility.seats.map(seat => { const d = days.find(x => x.seat === seat); const settlement = settlements.find(s => s.dayId === d?.id); return <article className="sl-owner-seat" key={seat}><div className="sl-panel-head"><h3>Кресло 0{seat}</h3><span className="sl-tag">{d ? 'Забронировано' : 'Свободно'}</span></div><strong>{d ? state.masters.find(m => m.id === d.masterId)?.name : 'Доступно для мастера'}</strong>{settlement ? <dl><div><dt>Выручка услуг</dt><dd>{money(settlement.revenue)}</dd></div><div><dt>Взнос получен</dt><dd>{money(settlement.guarantee)}</dd></div><div><dt>Дополнительно ПВУ</dt><dd>{money(settlement.pvuFromRevenue)}</dd></div><div className="sl-total"><dt>Итого ПВУ</dt><dd>{money(settlement.pvuTotal)}</dd></div></dl> : <p className="sl-footnote">До бронирования дня начислений нет.</p>}</article>; })}</div><details className="sl-formula"><summary>Как учитываются 5 000 ₽ и доля 50/50</summary><p>Доля ПВУ — максимум из 5 000 ₽ и половины выручки оказанных услуг. Взнос уже внесён мастером, поэтому повторно он не удерживается.</p><p>При выручке 20 000 ₽: ПВУ получает взнос 5 000 ₽ + ещё 5 000 ₽. Из выручки мастеру перечисляется 15 000 ₽, его итог после ранее внесённого взноса — 10 000 ₽.</p><p>При нулевой выручке: ПВУ оставляет 5 000 ₽, итог мастера — минус 5 000 ₽. SUNLEO получает 0 ₽.</p></details></section><section className="sl-panel sl-owner-visits"><div className="sl-panel-head"><h2>Все визиты на дату</h2><span className="sl-tag">{visits.length} записей</span></div>{visits.length ? visits.map(a => visitCard(a)) : <p className="sl-empty">Клиентских записей пока нет.</p>}</section></>}
      </>}
      <footer className="sl-footer"><b>sunleo</b><span>Локальный MVP · Данные сохраняются на этом сервере</span><span>Правила отмен, реальный эквайринг и вход по ролям — следующий этап</span></footer>
    </main>
  </div>;
}
