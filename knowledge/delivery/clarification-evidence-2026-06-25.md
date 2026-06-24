# CIFEDRA Clarification Lifecycle Evidence

Дата: 2026-06-25
Статус: verified increment
Scope: sprint item `D7-01`

## Реализованные контроли

| Контроль | Реализация | Evidence |
| --- | --- | --- |
| Clarification aggregate | `Clarification` хранит Need link, target field/topic, requester, question, reason, blocking flag, status, timestamps and aggregate version. | `packages/core/src/clarification.ts` |
| Создание уточнения | System или operator с `need.assist.clarify` может создать field/topic clarification. | `clarification.test.ts` |
| Explicit target | Clarification target должен быть ровно одним из `fieldId` или `topic`. | `clarification.ts` |
| Blocking readiness | Open blocking clarification переводит Need в `needs_clarification`. | `clarification.test.ts` |
| Ответ владельца | Только владелец Need может отвечать на clarification. | `clarification.test.ts` |
| Field answer application | Field-bound answer записывается в `Need.answers[fieldId]`, пересчитывает completeness and resolves clarification. | `clarification.test.ts` |
| Topic answer | Topic clarification можно перевести в `answered` без изменения schema answers. | `clarification.ts` |
| Reopen | Terminal clarification можно открыть повторно; answer history сохраняется, readiness отзывается. | `clarification.test.ts` |
| Waiver | Waiver требует `clarification.waive`, reason and is blocked for required/field-bound clarification. | `clarification.test.ts` |
| Optimistic locking | Need and Clarification expected versions reject stale updates. | `clarification.test.ts` |
| Atomic reassessment | Actor, version and invalid-answer failures leave original Need and Clarification unchanged. | `clarification.test.ts` |
| Original language | Answer history stores original answer language. | `clarification.test.ts` |

## Проверка

```bash
npm -w @cifedra/core run test
npm -w @cifedra/core run typecheck
```

Полный локальный regression должен выполняться перед commit:

```bash
npm run docs:check
npm test
npm run typecheck
npm run build
npm run local:restart
npm run local:smoke
```

## Остаточный риск

Этот increment закрывает доменную логику clarification lifecycle, но еще не
закрывает persistence/API/UI слой:

1. нет repository transaction поверх PostgreSQL;
2. нет HTTP endpoints для создания, ответа, reopen and waiver;
3. нет UI flow для вопросов/ответов в WEB/mobile client;
4. нет operator assignment model, поэтому permission пока проверяется локально через actor permissions;
5. topic clarification не пишет структурированные preference answers, это нужно уточнить при проектировании сценариев чата;
6. cancellation lifecycle зарезервирован в статусах, но отдельная команда cancel пока не реализована.
