# ADR-002: PostgreSQL Core Data Platform

Дата: 2026-06-20
Статус: accepted

## Контекст

CIFEDRA хранит связанные транзакционные данные: профили, потребности, результаты
подбора, согласия, contact requests, engagements, результаты, audit trail,
географию и semantic embeddings. Нужны:

- ACID transactions и ограничения целостности;
- сложные связи и аналитические запросы;
- geospatial queries;
- full-text и vector search на раннем этапе;
- надежные outbox/inbox tables;
- self-hosting и переносимость;
- отсутствие зависимости от BaaS-specific API.

## Решение

### 1. Основная СУБД

Утверждается **PostgreSQL 18**. На 2026-06-20 текущий minor release:
`18.4`. В environments фиксируется major version и конкретный container digest;
minor updates устанавливаются регулярно после backup/restore и regression
tests.

Локальный образ:

```text
PostgreSQL 18
  + PostGIS 3.6.4
  + pgvector 0.8.3
```

Базой custom image служит `postgis/postgis:18-3.6`, который на дату решения
содержит PostGIS 3.6.4; image фиксируется digest. pgvector добавляется отдельным
pinned package/build layer. Floating tags не используются в release
configuration.

### 2. Источники истины

| Данные | Source of truth |
| --- | --- |
| Product lifecycle, profiles, matching, trust, engagement, result | `cifedra_core` PostgreSQL database. |
| Credentials, sessions, MFA, federation | Keycloak database. |
| Files, audio, video, large artifacts | S3-compatible object storage; локально filesystem adapter. |
| Media ownership, consent and metadata | `cifedra_core`. |
| Chatwoot messages | Chatwoot; Core хранит product conversation state and external refs. |
| Plane work items | Plane; Core хранит engagement projection and external refs. |
| Baserow records | Временная operational projection, не source of truth. |
| Payment processing record | PSP; Core хранит idempotent payment projection. |

Ни одна внешняя система не пишет напрямую в `cifedra_core`.

### 3. Физические и логические границы

На старте используется один primary PostgreSQL для Core без sharding.

```text
PostgreSQL server/cluster
  database: cifedra_core
    role: cifedra_migrator
    role: cifedra_api
    role: cifedra_worker
    role: cifedra_readonly
```

Runtime roles не владеют таблицами и не имеют DDL grants. `cifedra_api`
получает права только для interactive application use cases и webhook inbox
insert. `cifedra_worker` получает права для outbox/inbox claim, integration
state и тех же domain commands, которые разрешены worker application services.
Grants уточняются в LLD и проверяются integration tests.

Keycloak использует отдельный PostgreSQL instance/container, database, volume
и role. Это разделяет versions, backup/restore и failure domains. Консолидация
на одном managed cluster допустима только как отдельное инфраструктурное
решение после оценки SLO и восстановления; logical databases и roles при этом
не объединяются.

Chatwoot, Plane и Baserow используют свои databases и migrations. Их таблицы
не размещаются в `cifedra_core`.

### 4. Core schemas и ownership

| Schema | Владелец данных |
| --- | --- |
| `identity` | Identity references and organization membership links. |
| `people` | User/provider profiles, availability and preferences. |
| `need` | Intake schema, Need and Clarification. |
| `matching` | Match runs, candidates, scores, explanations and decisions. |
| `engagement` | Contact request, acceptance, booking, execution and result. |
| `communication` | Conversation state, participants and channel refs. |
| `trust` | Consent, disclosure, verification, reports and moderation. |
| `catalog` | Directions, categories, schemas and rule versions. |
| `commerce` | Price terms and provider-neutral payment references. |
| `integration` | External refs, outbox, inbox, retries and reconciliation state. |
| `audit` | Append-oriented audit trail. |

Каждый module пишет только через свой repository/application service.
Cross-schema reads выполняются через application/query layer. Cascading delete
между module ownership boundaries запрещен; lifecycle и retention выполняются
явными commands.

### 5. Модель данных

- нормализованные relational tables являются стандартом;
- `jsonb` используется для versioned intake answers, provider payload snapshots,
  extension metadata и event payloads;
- ключевые фильтруемые и бизнес-значимые поля не скрываются только в `jsonb`;
- IDs создаются приложением и не раскрывают business sequence;
- каждый изменяемый aggregate имеет `version` для optimistic locking;
- timestamps хранятся как UTC `timestamptz`;
- locale, timezone и original language сохраняются явно;
- blanket soft-delete не применяется: retention/deletion определяется типом
  данных и privacy policy.

### 6. Tenant isolation

На старте используется shared-table model:

- пользовательские записи имеют `owner_user_id`;
- организационные записи имеют `organization_id`;
- cross-tenant unique constraints включают scope key;
- schema-per-tenant и database-per-tenant не применяются;
- application policies обязательны для каждой command/query;
- PostgreSQL RLS включается как дополнительный барьер до Work organization
  pilot, после подготовки connection/session context и integration tests.

### 7. Расширения и поиск

| Capability | Решение |
| --- | --- |
| География | PostGIS `geography/geometry` + GiST indexes. |
| Полнотекстовый поиск | PostgreSQL FTS + GIN indexes. |
| Semantic retrieval | pgvector; HNSW/IVFFlat выбирается по измерениям. |
| Cache | Не добавляется до подтвержденной проблемы. |
| Search engine | Meilisearch/Qdrant только после измеримого ограничения PostgreSQL. |
| Analytics | Read-only views/projections сначала; warehouse позже. |

### 8. Transactions and events

Domain state и outbox event сохраняются в одной PostgreSQL transaction.
Worker получает события с блокировкой строк и `SKIP LOCKED`, поэтому несколько
worker instances могут обрабатывать очередь без двойного владения записью.

Delivery semantics: **at least once**. Exactly-once не обещается; idempotency
обеспечивается consumers и unique constraints inbox.

### 9. Backup and migrations

- schema changes выполняются только versioned migrations;
- application role не получает DDL privileges;
- production backup включает PITR/WAL archiving;
- restore test обязателен до staging acceptance и далее по расписанию;
- object storage включает versioning/backup policy, restore test и
  reconciliation `metadata <-> object key/checksum`;
- destructive migrations проходят expand/migrate/contract;
- extension versions фиксируются и обновляются отдельно от business migrations;
- RPO/RTO утверждаются в NFR до staging acceptance.

## Отклоненные альтернативы

| Альтернатива | Решение |
| --- | --- |
| Supabase как application platform | Не выбирается: Core использует PostgreSQL напрямую через repository contracts; managed PostgreSQL допустим без Supabase coupling. |
| MongoDB/document DB | Не соответствует основному relational/transactional access pattern. |
| Baserow как Core DB | Только operational projection/manual pilot. |
| Redis как primary state | Недопустимо; Redis возможен только как cache/ephemeral coordination later. |
| Kafka/RabbitMQ на MVP | Не требуется при текущей нагрузке; PostgreSQL outbox закрывает reliability. |
| Отдельная БД на каждый Core module | Усложняет транзакции и эксплуатацию до появления независимых services. |

## Последствия

Положительные:

- один технологический стек закрывает transactional, geo, FTS, vector и event
  storage;
- product lifecycle остается согласованным;
- deployment переносим между local, self-hosted и managed PostgreSQL;
- нет ранней зависимости от cache, broker или отдельного search cluster.

Ограничения:

- нужно контролировать индексы, connection pool и рост outbox/audit tables;
- тяжелые media jobs и binary не должны выполняться/храниться внутри DB;
- границы schemas сами по себе не заменяют application ownership;
- PostgreSQL major upgrade требует отдельного runbook и rehearsal.

## Источники

- [PostgreSQL versioning policy](https://www.postgresql.org/support/versioning/).
- [PostgreSQL 18 documentation](https://www.postgresql.org/docs/18/).
- [PostGIS 3.6 release](https://postgis.net/2025/09/PostGIS-3.6.0/).
- [PostGIS Docker images](https://github.com/postgis/docker-postgis).
- [pgvector](https://github.com/pgvector/pgvector).
