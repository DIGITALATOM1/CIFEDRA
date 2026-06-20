# ADR-003: Interservice Communication Standard

Дата: 2026-06-20
Статус: accepted

## Контекст

CIFEDRA должна связывать mobile/web clients, API, worker, Keycloak, Chatwoot,
Plane, Baserow, calendar, language, notification и payment providers. Нужно
определить единые правила:

- что выполняется синхронно;
- что выполняется асинхронно;
- как принимать webhooks;
- как версионировать API и events;
- как обеспечивать idempotency, retries и observability;
- когда потребуется message broker.

## Решение

### 1. Матрица взаимодействий

| Откуда -> куда | Механизм | Семантика |
| --- | --- | --- |
| Mobile/Web/Ops -> CIFEDRA API | HTTPS REST/JSON | Синхронные commands и queries. |
| API -> Core module | In-process application call | Не сетевой вызов. |
| API/Core -> PostgreSQL | Transaction/repository | Strong consistency. |
| Core -> PostgreSQL -> Worker | Transactional outbox | At-least-once asynchronous delivery. |
| Worker -> external provider | HTTPS API через adapter | Timeout, idempotency and bounded retry. |
| External provider -> CIFEDRA | Signed HTTPS webhook -> inbox | Durable accept, deduplicate, process async. |
| Worker -> Core | Application command/repository transaction | Idempotent state transition. |
| n8n/Baserow/operator tools -> CIFEDRA | Approved API/webhook only | Нет прямого DB access. |

### 2. Синхронный API

- REST/JSON over HTTPS;
- contract described with OpenAPI 3.1;
- public prefix `/api/v1`;
- additive compatible changes внутри version;
- breaking changes требуют нового API version;
- errors use RFC 9457 `application/problem+json`;
- authentication: OIDC access token;
- authorization: Core policy on every protected resource;
- pagination, filtering and sorting are explicitly specified per endpoint;
- request limits and rate limits are part of API policy.
- mutable aggregate update uses `ETag/If-Match` or explicit `expectedVersion`;
- list endpoints use cursor pagination unless a bounded reference list is
  explicitly documented.

`Idempotency-Key` обязателен для повторяемых commands, которые создают resource
или могут запустить внешний side effect. Server сохраняет key, request hash и
result reference:

- scope: authenticated principal/client + HTTP method + route + key;
- тот же key и тот же request hash возвращает исходный status/result reference;
- тот же key с другим request hash возвращает `409 Conflict`;
- retention не меньше 24 часов для обычных commands и не меньше provider retry
  window для payment/external-side-effect commands;
- после expiration бизнес-ограничения и external reference продолжают защищать
  от повторного создания критичного ресурса.

Interactive request не ожидает Chatwoot, Plane, notification, translation или
payment provider. API фиксирует Core state и возвращает `202 Accepted` с
operation/resource reference, если side effect выполняется worker.

### 3. Domain events

Событие является фактом в прошедшем времени и не адресует конкретного
consumer. Формат основан на CloudEvents 1.0 structured JSON.

```json
{
  "specversion": "1.0",
  "id": "018f...",
  "source": "/cifedra/core/need",
  "type": "app.cifedra.need.created.v1",
  "subject": "need/018f...",
  "time": "2026-06-20T12:00:00Z",
  "datacontenttype": "application/json",
  "correlationid": "018f...",
  "causationid": "018f...",
  "tenantid": "018f...",
  "data": {}
}
```

Правила:

- `source + id` уникальны;
- event type содержит semantic version suffix;
- incompatible payload change создает новый event version;
- consumers игнорируют неизвестные additive fields;
- PII в event payload минимизируется;
- large binary и secrets не включаются;
- payload schema хранится рядом с event catalog и contract tests.

HTTP contracts are published as OpenAPI. Event payloads use versioned JSON
Schema; AsyncAPI is added when events become a contract for independently
deployed consumers or a message broker.

### 4. Outbox processing

Минимальные поля outbox:

```text
event_id
event_type
event_version
aggregate_type
aggregate_id
aggregate_version
payload
occurred_at
available_at
status
attempt_count
locked_by
locked_at
lock_until
last_error
correlation_id
causation_id
```

Worker:

1. в короткой transaction выбирает batch через `FOR UPDATE SKIP LOCKED`,
   записывает `locked_by`, `lock_until`, attempt и коммитит lease;
2. вызывает adapter вне database transaction;
3. в новой короткой transaction фиксирует delivery result или retry state;
4. повторяет transient failures с exponential backoff and jitter;
5. переводит terminal/exhausted failure в `dead_letter`;
6. создает operator action/alert.

Outbox entries не удаляются сразу после delivery: retention и archive policy
утверждаются после pilot volume.

Global ordering не гарантируется. Если consumer зависит от порядка, события
одного aggregate обрабатываются по `aggregate_version`; gap переводится в
retry/reconciliation. Просроченный `lock_until` позволяет другому worker
восстановить обработку после crash.

### 5. Incoming webhooks

Public webhook endpoint convention:

```text
POST /api/v1/webhooks/{provider}
```

Порядок обработки:

1. проверить content type, size и provider-specific signature;
2. сохранить payload/hash и только allowlisted headers, нужные для audit;
3. определить `provider_event_id`;
4. вставить inbox record с unique key `(provider, provider_event_id)`;
5. вернуть provider корректный `2xx` после durable acceptance;
6. асинхронно преобразовать provider event в Core command;
7. domain update и `inbox.processed_at` сохранить одной transaction;
8. неизвестное mapping отправить в manual review, не теряя payload.

Повторный webhook считается нормальным. Inbox обеспечивает deduplication.

Privacy and retention:

- authorization/cookie headers, provider secrets и неограниченный набор headers
  не сохраняются;
- signature сохраняется только как verification result/key ID/hash, если
  полный value не требуется provider dispute procedure;
- sensitive payload шифруется at rest и доступен только integration/audit
  roles;
- payload удаляется/минимизируется по provider-specific retention policy;
- dedup tombstone `(provider, provider_event_id)` хранится не меньше provider
  replay/retry window; payment keys сохраняются по financial/legal policy;
- replay timestamp/nonce проверяется, если provider protocol это поддерживает.

### 6. Timeout, retry and circuit policy

- каждый provider adapter имеет explicit connect/request timeout;
- retry разрешен для idempotent request или request с provider idempotency key;
- validation/auth/permission errors не повторяются автоматически;
- `429` и transient `5xx/network` используют bounded exponential backoff;
- circuit state не является product source of truth;
- reconciliation job периодически сверяет зависшие external refs и statuses.

Конкретные timeout/retry values задаются adapter policy и проверяются
integration tests; глобальный бесконечный retry запрещен.

### 7. Observability

- W3C `traceparent` передается, если provider его поддерживает;
- `correlation_id` связывает client request, transaction, outbox, provider call
  и webhook;
- structured logs не содержат credentials и не маскированные sensitive data;
- metrics: queue lag, attempts, dead letters, provider latency/error rate,
  webhook duplicates and reconciliation drift;
- audit event отделен от technical log.

### 8. Security

- service credentials хранятся в secrets storage;
- external systems получают minimum scope service accounts;
- webhooks доступны через TLS и signature verification;
- allowlist используется как дополнительная, но не единственная защита;
- n8n, Baserow и operator tools не получают DB credentials;
- mobile app не содержит tokens Plane/Chatwoot/Baserow.

### 9. Broker adoption

Kafka, RabbitMQ или NATS не добавляются на MVP. Отдельный broker рассматривается,
когда измеримо выполняется одно или несколько условий:

- PostgreSQL outbox polling создает неприемлемую нагрузку/latency;
- нужны независимые consumer groups с высоким throughput;
- требуется длительный replay большого event stream;
- число independently deployed services существенно выросло;
- нужна broker-specific routing/ordering beyond current DB queue.

Переход не меняет domain event contracts: outbox dispatcher публикует тот же
CloudEvents envelope в выбранный broker.

## Отклоненные альтернативы

| Альтернатива | Причина отказа сейчас |
| --- | --- |
| Синхронная цепочка API -> Chatwoot -> Plane -> provider | Внешний сбой ломает user transaction и увеличивает latency. |
| Общая БД между приложениями | Нарушает service ownership и replaceability. |
| Exactly-once delivery | Нереалистичная гарантия across HTTP/providers; используется at-least-once + idempotency. |
| n8n как event bus/Core workflow | Недостаточная ownership/testability для product lifecycle. |
| Broker с первого дня | Нет подтвержденной нагрузки, но появляется отдельный stateful runtime. |

## Последствия

Положительные:

- Core transaction не зависит от доступности provider;
- единые event/webhook contracts работают и с PostgreSQL outbox, и с будущим
  broker;
- provider adapters можно заменять;
- повторная доставка не разрушает state.

Ограничения:

- external state является eventually consistent;
- каждый adapter обязан реализовать mapping, idempotency и reconciliation;
- нужны operator tools для dead letters и drift;
- contract tests являются обязательной частью integration implementation.

## Источники

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.1.1.html).
- [CloudEvents specification](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md).
- [RFC 9457: Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457).
- [PostgreSQL SELECT locking](https://www.postgresql.org/docs/18/sql-select.html).
