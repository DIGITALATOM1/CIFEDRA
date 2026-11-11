# CIFEDRA: Critical Use Cases клиентского MVP

Дата: 2026-11-12
Версия: 0.1
Статус: baseline для SRS/OpenAPI decomposition

## 1. Назначение

Документ описывает сквозные Use Cases локального MVP от создания запроса до
принятия результата. Все примеры используют synthetic data.

Upstream:

- [User Story Map](../product/cifedra-user-story-map-mvp-2026-11-12.md);
- [карта приложения](../product/cifedra-app-map-2026-07-26.md);
- [MVP Architecture Delta](../system/cifedra-mvp-architecture-delta-2026-11-12.md).

Общие правила для всех Use Cases:

1. actor определяется trusted principal и server-side membership;
2. команды не принимают owner/privileged role из public payload;
3. изменение aggregate требует `expectedVersion`/`If-Match`;
4. create/side-effect command поддерживает `Idempotency-Key`;
5. успешная команда сохраняет state, audit fact и outbox event атомарно;
6. ошибки возвращаются как RFC 9457 с безопасным `code` и `correlationId`;
7. AI предлагает, но не выполняет human confirmation;
8. закрытые поля не попадают в log, event payload или integration adapter.

## 2. UC-REQ-01 — Создать и подтвердить запрос

| Поле | Значение |
| --- | --- |
| Primary actor | Клиент |
| Goal | Создать полный подтвержденный Ally Request, готовый к matching. |
| Trigger | Клиент нажимает `Создать запрос`. |
| Screens | CLI-003, CLI-004, CLI-005, CLI-007, CLI-008 |
| Stories | US-A2-01…06, US-A3-03…05 |
| Aggregate | Ally Request / Need |

### Preconditions

- пользователь аутентифицирован;
- client profile существует;
- выбранная catalog/schema version опубликована;
- профиль содержит данные, обязательные для этой категории.

### Main success flow

1. Клиент выбирает direction и category либо вводит свободное описание.
2. Система выбирает или предлагает подходящую versioned intake schema.
3. Клиент заполняет поля; каждое изменение auto-saves draft.
4. Система рассчитывает completeness и показывает только relevant gaps.
5. При необходимости система создает Clarification questions.
6. Клиент отвечает; система повторно рассчитывает readiness.
7. Клиент открывает review, видит summary и disclosure preview.
8. Клиент подтверждает текущую revision.
9. Система переводит Request в `ready_for_match` и публикует событие.

### Alternate/error flows

- A1: свободное описание имеет низкую confidence — клиент выбирает category
  вручную; draft не теряется;
- A2: schema обновилась — существующий draft остается на зафиксированной
  версии; миграция выполняется только отдельной командой с preview;
- A3: обязательное поле отсутствует/невалидно — confirmation запрещен;
- A4: профиль не готов — блокируется только команда, которой нужны данные;
- A5: stale version — возвращается conflict и server snapshot без перезаписи;
- A6: offline — draft сохраняется локально и отправляется после восстановления,
  если версия не конфликтует.

### Postconditions

- Request имеет owner, schema/revision, original language, confirmation snapshot;
- статус `ready_for_match` достижим только для complete revision;
- создан audit fact `RequestConfirmed` и outbox event.

## 3. UC-REQ-02 — Подтвердить декомпозицию запроса

| Поле | Значение |
| --- | --- |
| Primary actor | Клиент |
| Goal | Разделить сложную потребность на независимые child requests осознанно. |
| Trigger | Система определила разные directions/capabilities/сроки или отсутствие одного Ally. |
| Screens | CLI-006, CLI-001 |
| Stories | US-A3-01, US-A3-02, US-A3-06 |
| Aggregates | Split Proposal, Request Bundle, Ally Request |

### Main success flow

1. Система формирует proposal из частей с причиной разделения.
2. Клиент видит scope, direction и ожидаемый результат каждой части.
3. Клиент редактирует, объединяет, удаляет или добавляет часть.
4. Система валидирует, что исходная потребность не потеряна без подтверждения.
5. Клиент подтверждает состав частей.
6. Система атомарно создает Request Bundle и child request drafts.
7. Каждый child request продолжает собственный readiness/matching lifecycle.
8. Доска показывает Bundle group и независимые next actions.

### Alternate/error flows

- A1: клиент отклоняет split — исходный Request сохраняется без child requests;
- A2: одна часть невалидна — Bundle не создается частично;
- A3: AI недоступен — клиент может создать части вручную;
- A4: повтор confirmation с тем же idempotency key возвращает тот же Bundle;
- A5: часть уже перешла в matching — merge/delete запрещен, предлагается cancel
  или новый revision flow.

### Postconditions

- подтвержденное разбиение имеет actor, source revision и immutable mapping;
- decomposition сама по себе не создает платную единицу или Alliance.

## 4. UC-MAT-01 — Запустить matching и выбрать кандидата

| Поле | Значение |
| --- | --- |
| Primary actor | Клиент |
| Supporting actor | Matching engine / AI explanation adapter |
| Goal | Получить объяснимый shortlist и зафиксировать решение. |
| Screens | CLI-009, CLI-010, CLI-011 |
| Stories | US-A4-01…04 |
| Aggregates | Match Run, Candidate, Candidate Decision |

### Preconditions

- Request `ready_for_match` и подтвержден клиентом;
- matching rule/catalog versions опубликованы;
- provider profiles прошли eligibility для synthetic pilot.

### Main success flow

1. Клиент или policy запускает Match Run для текущей Request revision.
2. Система применяет hard constraints, затем ranking rules.
3. Система сохраняет rule version, candidates, score components и explanation.
4. Клиент видит progress, затем shortlist.
5. Клиент открывает candidate detail и видит fit, gaps, risks, trust,
   language и availability.
6. Клиент сохраняет, отклоняет или выбирает `Связаться`.
7. Система сохраняет Candidate Decision с actor и timestamp.

### Alternate/error flows

- A1: exact match отсутствует — система предлагает близкие варианты, изменить
  только optional criterion, split, wait или Ops escalation;
- A2: hard constraint не ослабляется автоматически;
- A3: candidate стал unavailable — решение отклоняется с stale candidate code;
- A4: AI explanation недоступно — deterministic factors остаются видимыми;
- A5: клиент корректирует Request — создается новый Match Run для новой revision,
  старые решения сохраняются как history.

### Postconditions

- выбор кандидата не раскрывает контакты и не создает Alliance;
- score не трактуется как гарантия качества.

## 5. UC-CON-01 — Запросить и принять контакт

| Поле | Значение |
| --- | --- |
| Primary actors | Клиент, Ally |
| Goal | Получить взаимное согласие на начало обсуждения без раскрытия закрытых данных. |
| Screens | CLI-012, ALY-005, ALY-006, ALY-007 |
| Stories | US-A4-05…08 |
| Aggregate | ContactRequest |

### Main success flow

1. Клиент открывает выбранного candidate и безопасный brief preview.
2. Клиент подтверждает preview и отправляет ContactRequest.
3. Система фиксирует request, policy version и `expiresAt = createdAt + 48h`.
4. Ally получает notification и видит разрешенный brief.
5. Ally принимает ContactRequest.
6. Система переводит request в `accepted`, публикует event и запускает
   idempotent открытие Conversation.
7. Обе стороны получают route в product chat.

### Alternate/error flows

- A1: Ally отклоняет с reason category — клиент получает безопасное уведомление;
- A2: 48 часов истекли — worker переводит request в `expired` один раз;
- A3: клиент отменяет pending request — дальнейшее acceptance запрещено;
- A4: repeated accept с тем же key возвращает accepted state;
- A5: Conversation creation временно упало — request остается accepted, UI
  показывает retryable operational state, worker повторяет команду;
- A6: участник/Request заблокирован safety policy — переход запрещен.

### Postconditions

- ContactRequest accepted;
- Conversation создана/создается идемпотентно;
- телефон, email, exact address и artifact не раскрыты;
- Alliance не создан.

## 6. UC-MSG-01 — Открыть conversation и отправить сообщение

| Поле | Значение |
| --- | --- |
| Primary actors | Клиент, Ally |
| Goal | Обсудить запрос внутри CIFEDRA с сохранением original/translation. |
| Screens | SCR-006, SCR-007 |
| Stories | US-A5-01…03 |
| Aggregates | Conversation, Message |

### Preconditions

- существует accepted ContactRequest;
- actor является участником Conversation;
- Conversation не закрыта policy/safety rule.

### Main success flow

1. Участник открывает список чатов и Conversation.
2. API возвращает разрешенный header/context и paginated messages.
3. Участник отправляет text message.
4. Система валидирует membership, content limits и disclosure policy.
5. Original message сохраняется с language metadata.
6. Outbox создает translation/notification intents.
7. При готовности translation UI позволяет переключить original/translated.

### Alternate/error flows

- A1: message содержит закрытый direct contact до consent — команда блокируется
  или требует явного disclosure flow; закрытые данные не уходят adapter;
- A2: translation failed/low confidence — original остается доступен и
  показывается machine translation state;
- A3: duplicate idempotency key — второе сообщение не создается;
- A4: actor больше не participant — query/command возвращает forbidden;
- A5: Chatwoot недоступен — product chat продолжает работать.

### Postconditions

- original immutable message сохранено;
- translation не заменяет original;
- notifications создаются без message body в external payload.

## 7. UC-AGR-01 — Создать, изменить и подтвердить Agreement

| Поле | Значение |
| --- | --- |
| Primary actors | Клиент, Ally |
| Supporting actor | AI draft assistant |
| Goal | Зафиксировать взаимно подтвержденные условия одной версии. |
| Screens | CLI-013, ALY-008 |
| Stories | US-A5-04, US-A5-05, US-A5-07 |
| Aggregate | Agreement |

### Main success flow

1. Участник или AI предлагает draft на основе Request и Conversation.
2. Стороны видят structured terms: scope, result criteria, timeframe/slot,
   price/price note, constraints, cancellation note.
3. Участник создает новую Agreement revision.
4. Система инвалидирует confirmations предыдущей активной revision.
5. Клиент подтверждает текущую revision.
6. Ally подтверждает ту же revision.
7. Система переводит Agreement в `confirmed` и создает `Alliance planned`.

### Alternate/error flows

- A1: одна сторона запрашивает revision — Agreement остается pending;
- A2: confirmation относится к stale version — conflict;
- A3: обязательное term отсутствует — confirmation запрещен;
- A4: AI draft недоступен — стороны создают Agreement вручную;
- A5: ContactRequest/Conversation закрыты safety rule — новый Agreement запрещен;
- A6: цена в local MVP помечается mock/non-binding; payment не запускается.

### Postconditions

- обе confirmations относятся к одной immutable revision;
- AI не является confirming party;
- один confirmed Agreement создает один planned Alliance идемпотентно.

## 8. UC-DSC-01 — Разрешить раскрытие контактных полей

| Поле | Значение |
| --- | --- |
| Primary actor | Субъект собственных данных |
| Goal | Разрешить конкретному участнику конкретные поля для согласованной цели. |
| Screens | CLI-013, ALY-008 |
| Stories | US-A5-06 |
| Aggregate | Disclosure Consent |

### Preconditions

- Agreement confirmed;
- actor — субъект раскрываемых полей;
- recipient является участником Alliance;
- fields разрешены policy для текущей category/risk tier.

### Main success flow

1. Субъект выбирает разрешенные поля и видит recipient/purpose.
2. Система показывает последствия и срок/условия отзыва.
3. Субъект подтверждает consent.
4. Система сохраняет field set, recipient, purpose, policy version и timestamps.
5. Query layer начинает возвращать разрешенные поля recipient.

### Alternate/error flows

- A1: другая сторона не дала consent — ее поля остаются закрыты;
- A2: exact address запрещен policy — field нельзя выбрать;
- A3: consent revoked — последующие query скрывают поле, audit сохраняется;
- A4: Agreement revision changed — policy определяет необходимость нового
  consent; старый consent не расширяется автоматически.

### Postconditions

- раскрыт только подтвержденный field set;
- работа внутри CIFEDRA возможна и без direct contact disclosure.

## 9. UC-ALL-01 — Начать и обновлять Alliance

| Поле | Значение |
| --- | --- |
| Primary actor | Ally |
| Supporting actor | Клиент |
| Goal | Выполнить согласованную работу с прозрачным статусом и timeline. |
| Screens | CLI-013, ALY-008 |
| Stories | US-A6-01…06 |
| Aggregate | Alliance / Work Card |

### Main success flow

1. Ally открывает planned Alliance и подтвержденный Agreement snapshot.
2. Ally выполняет `Start`.
3. Система переводит Alliance в `in_progress`.
4. Ally обновляет progress, next step, due/slot или blocker.
5. Клиент видит role-specific projection и required action.
6. Каждое значимое изменение создает timeline event и notification intent.

### Alternate/error flows

- A1: Agreement не confirmed/stale — start запрещен;
- A2: scope меняется — создается Agreement revision; старый scope не
  перезаписывается;
- A3: blocker требует действия клиента — client nextAction обновляется;
- A4: cancellation требует actor/reason и применимую policy;
- A5: issue/safety report создает Ops Case и может ограничить дальнейшие команды;
- A6: Plane недоступен — Alliance lifecycle продолжает работать.

### Postconditions

- Alliance state изменен только целевой командой;
- Board projection обновляется из domain event, не drag-and-drop.

## 10. UC-RES-01 — Передать и проверить Result

| Поле | Значение |
| --- | --- |
| Primary actors | Ally, Клиент |
| Goal | Передать versioned результат и зафиксировать решение клиента. |
| Screens | ALY-009, CLI-014, CLI-015 |
| Stories | US-A7-01…06, US-A8-01…03 |
| Aggregates | Result, Alliance |

### Main success flow

1. Ally создает Result draft для active Alliance.
2. Ally добавляет structured content/evidence metadata и сверяет criteria.
3. Ally отправляет Result.
4. Система фиксирует Result version, Agreement criteria snapshot и переводит
   Alliance в `result_submitted`.
5. Клиент сравнивает expected/delivered.
6. Клиент принимает Result.
7. Система переводит Result в `accepted`, Alliance в `completed` и предлагает
   feedback/repeat.

### Alternate/error flows

- A1: клиент запрашивает rework с обязательным комментарием;
- A2: Ally создает новую Result version; предыдущая остается доступной;
- A3: клиент сообщает о проблеме — создается dispute/Ops Case;
- A4: artifact storage недоступно — structured Markdown может быть отправлен,
  binary evidence остается retryable draft;
- A5: клиент пытается принять stale Result version — conflict;
- A6: Ally не может принять Result за клиента.

### Postconditions

- `completed` достижим только через accepted Result или отдельный явно
  определенный administrative resolution;
- feedback не раскрывает закрытые данные и не становится public rating в MVP.

## 11. UC-OPS-01 — Обработать исключение

| Поле | Значение |
| --- | --- |
| Primary actor | Ops/Admin с permission |
| Goal | Разрешить no-match, timeout, safety или dispute без скрытой подмены решения. |
| Screens | OPS-001, OPS-002 |
| Stories | US-A4-02, US-A6-05, US-A7-05, US-A8-05 |
| Aggregate | Ops Case |

### Main success flow

1. Domain rule или participant command создает Ops Case.
2. Ops видит reason, linked resources, allowed fields и audit timeline.
3. AI может предложить классификацию/следующее действие с provenance.
4. Ops выбирает разрешенную command или запрашивает данные у участника.
5. Система проверяет permission и обязательный reason.
6. Domain command выполняется через application service.
7. Ops Case закрывается только после подтвержденного outcome.

### Alternate/error flows

- A1: Ops не имеет data-purpose permission — закрытые поля не возвращаются;
- A2: предлагаемая AI command запрещена policy — UI не позволяет выполнить ее;
- A3: кейс требует human participant decision — Ops только отправляет request;
- A4: повторная обработка event не создает duplicate case;
- A5: legal/safety hold запрещает deletion до отдельного разрешения.

### Postconditions

- каждое действие имеет actor, permission, reason и correlation;
- Ops не подтверждает Agreement, disclosure или Result за участника.

## 12. Общая error taxonomy

| Code | HTTP | Смысл |
| --- | --- | --- |
| `AUTHENTICATION_REQUIRED` | 401 | Нет/невалиден trusted principal. |
| `FORBIDDEN` | 403 | Actor не имеет доступа к resource/command. |
| `RESOURCE_NOT_FOUND` | 404 | Resource отсутствует или скрыт visibility policy. |
| `INVALID_TRANSITION` | 409 | Команда недопустима из текущего state. |
| `VERSION_CONFLICT` | 409 | `expectedVersion` устарел. |
| `IDEMPOTENCY_CONFLICT` | 409 | Key повторен с другим payload. |
| `VALIDATION_FAILED` | 422 | Поля/terms не проходят schema/business validation. |
| `READINESS_REQUIRED` | 422 | Не выполнены prerequisites. |
| `DISCLOSURE_REQUIRED` | 403 | Поле закрыто consent/policy. |
| `RATE_LIMITED` | 429 | Превышен допустимый command/message rate. |
| `DEPENDENCY_UNAVAILABLE` | 503 | Внешний adapter временно недоступен; Core state сохранен. |

## 13. Traceability matrix

| Use Case | Slice | Primary domain | Screen set | Следующий SRS/API пакет |
| --- | --- | --- | --- | --- |
| UC-REQ-01 | M1 | Request | CLI-003…008 | Request revision/review API |
| UC-REQ-02 | M1 | Request Bundle | CLI-006/001 | Bundle/decomposition SRS |
| UC-MAT-01 | M1/M4 | Matching | CLI-009…011 | Matching/no-match SRS |
| UC-CON-01 | M1 | Contact | CLI-012, ALY-005…007 | ContactRequest API update |
| UC-MSG-01 | M2 | Communication | SCR-006/007 | Messenger SRS/OpenAPI |
| UC-AGR-01 | M2 | Agreement | CLI-013, ALY-008 | Agreement SRS/OpenAPI |
| UC-DSC-01 | M2 | Trust | CLI-013, ALY-008 | Disclosure SRS/OpenAPI |
| UC-ALL-01 | M3/M4 | Alliance | CLI-013, ALY-008 | Alliance SRS/OpenAPI |
| UC-RES-01 | M3/M4 | Result | CLI-014/015, ALY-009 | Result/rework SRS/OpenAPI |
| UC-OPS-01 | M4 | Operations | OPS-001/002 | Ops/audit SRS/OpenAPI |

## 14. Review gates

Перед реализацией каждого Use Case должны быть готовы:

- domain state/transition table;
- authorization matrix;
- public DTO and error examples;
- persistence ownership/migration;
- event names and payload minimization;
- domain tests;
- API happy/negative/authorization/idempotency tests;
- WEB desktop/mobile E2E;
- traceability row и evidence path.
