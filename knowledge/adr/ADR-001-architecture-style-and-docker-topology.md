# ADR-001: Architecture Style and Docker Topology

Дата: 2026-06-20
Статус: accepted

## Контекст

CIFEDRA объединяет направления `Life`, `Work`, `Skills`, собственное доменное
ядро и готовые системы Keycloak, Chatwoot, Plane, Baserow и другие providers.
Нужно определить:

- является ли решение монолитом или набором микросервисов;
- являются ли направления отдельными сервисами;
- как собирать локальный Docker-контур;
- где проходят границы независимого deployment и владения данными.

На этапе MVP команда, нагрузка и независимые SLO доменов еще не подтверждены.
Большая часть product lifecycle требует согласованных транзакций:

```text
Need -> Match -> Decision -> Contact Request -> Engagement -> Result
```

Преждевременное разделение этого lifecycle на сетевые сервисы добавит
распределенные транзакции, versioning контрактов, observability и эксплуатацию,
но не даст подтвержденной продуктовой выгоды.

## Решение

### 1. Архитектурный стиль

CIFEDRA Core строится как **модульный монолит с отдельным worker process**.

```text
Один репозиторий
  -> один набор доменных модулей
  -> одна транзакционная Core DB
  -> два deployable processes из одной кодовой базы:
       cifedra-api
       cifedra-worker
```

`cifedra-api` и `cifedra-worker` являются отдельными контейнерами и могут
масштабироваться независимо, но вместе образуют одну application boundary.
Это не два независимых микросервиса: они используют общие доменные контракты и
одну Core DB.

Клиентские приложения являются отдельными deployable frontends:

- `apps/mobile` для iOS/Android;
- `apps/web` для клиентского WEB;
- `apps/ops` позже для операторов/администраторов;
- `web/landing` остается отдельным публичным статическим сайтом.

### 2. Доменные границы

Внутри Core выделяются модули:

| Модуль | Ответственность |
| --- | --- |
| Identity Boundary | `IdentityRef`, principal normalization, policies. |
| People | Profiles, organizations, memberships, availability. |
| Need | Intake, clarification, lifecycle. |
| Matching | Match run, candidates, explanation and rule versions. |
| Decision | Swipe actions, shortlist, contact request. |
| Trust | Consent, disclosure, verification, report and moderation. |
| Engagement | Acceptance, assignment, booking, execution and result. |
| Communication | Product conversation state and channel references. |
| Platform | Events, outbox/inbox, audit and notification intents. |
| Commerce | Provider-neutral price and payment references. |

`Life`, `Work`, `Skills` не являются отдельными сервисами. Они являются
конфигурациями и policy sets поверх общих модулей:

- direction-specific intake schemas;
- matching rules and weights;
- trust/risk policies;
- engagement types;
- result and quality metrics.

### 3. Готовые продукты

Keycloak, Chatwoot, Plane, Baserow и другие готовые продукты остаются
самостоятельными системами:

- отдельный контейнер или официальный compose project;
- собственная схема/БД и собственные migrations;
- взаимодействие только через API, events или webhooks;
- отсутствие прямого доступа к таблицам CIFEDRA Core;
- отсутствие прямого доступа CIFEDRA к их внутренним таблицам.

### 4. Docker topology

Локально CIFEDRA является одним решением для разработчика, но не одним
контейнером.

```text
CIFEDRA local environment
  cifedra-core compose project
    cifedra-api
    cifedra-worker
    cifedra-postgres
    cifedra-web
  cifedra-identity compose project/profile
    keycloak
    keycloak-postgres
  vendor compose projects/profiles
    chatwoot + its dependencies
    plane + its dependencies
    baserow + its dependencies
  optional profiles
    argos
    whisper
    jitsi
    observability
```

Управление выполняется едиными project scripts, но vendor compose-файлы не
копируются в один большой файл. Все проекты подключаются к общей внутренней
Docker network `cifedra-integration` только API-facing контейнерами. Vendor
databases, caches, brokers и object stores остаются в private networks своих
compose projects. На host публикуются только необходимые локальные UI/API
ports, привязанные к `127.0.0.1`.

### 5. Profiles

| Profile | Состав | Назначение |
| --- | --- | --- |
| `core` | API, worker, Core PostgreSQL. | Ежедневная разработка и unit/integration tests. |
| `web` | Клиентское WEB-приложение. | Responsive browser flow и E2E tests. |
| `identity` | Keycloak и его DB. | OIDC, registration and authorization tests. |
| `support` | Chatwoot stack. | Concierge/support scenario. |
| `tasks` | Plane stack. | Operator execution/task scenario. |
| `backoffice` | Baserow stack. | Manual pilot and operational projection. |
| `language` | Argos/Whisper candidates. | Translation and transcription spikes. |
| `full` | Все необходимые profiles. | Сквозной E2E, не ежедневный режим. |

### 6. Production topology

В production:

- API и worker собираются из одного versioned application image;
- запускаются разными commands и масштабируются независимо;
- клиентский WEB собирается отдельно и публикуется как static assets;
- Core PostgreSQL является отдельным stateful component;
- Keycloak использует отдельный PostgreSQL instance/database, backup и service role;
- Chatwoot/Plane/Baserow развертываются изолированно или заменяются SaaS;
- публичный ingress не дает прямого доступа к БД и внутренним admin ports.

## Критерии выделения микросервиса

Модуль можно выделить только при наличии хотя бы одного сильного основания и
готовности поддерживать контракт:

1. отдельная команда-владелец и независимый release cycle;
2. существенно отличный scaling profile;
3. отдельный security/compliance boundary;
4. отдельный availability/SLO;
5. технологическая необходимость другого runtime/storage;
6. модуль созрел и имеет стабильный API/event contract;
7. стоимость связанности монолита измеримо выше стоимости распределения.

Первые кандидаты при реальной необходимости: media processing, language jobs,
notifications и search indexing. `Need`, `Matching`, `Decision`, `Trust`,
`Engagement` не разделяются до подтвержденной необходимости.

## Отклоненные альтернативы

| Альтернатива | Причина отказа сейчас |
| --- | --- |
| Один контейнер со всем ПО | Невозможны независимые upgrades, health checks, resource limits and isolation. |
| Микросервис на каждый домен | Высокая распределенная сложность без подтвержденной нагрузки и команд. |
| Отдельный backend для Life/Work/Skills | Дублирование lifecycle, identity, trust and result model. |
| Общая БД для Core и vendor systems | Нарушение ownership, upgrades и replaceability. |
| Один гигантский compose со всеми vendor internals | Трудно обновлять официальные stacks и запускать только нужный сценарий. |

## Последствия

Положительные:

- быстрые изменения Core в одной транзакционной границе;
- четкие модульные границы без network overhead;
- отдельное масштабирование API и workers;
- готовые продукты можно обновлять и заменять независимо;
- локальный стек запускается по сценариям, а не целиком.

Ограничения:

- архитектурные тесты должны запрещать недопустимые зависимости модулей;
- один Core release содержит изменения нескольких доменных модулей;
- shared DB требует дисциплины ownership;
- extraction to service потребует отдельного ADR и migration plan.
