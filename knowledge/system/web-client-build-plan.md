# CIFEDRA CONNECT: план клиентского WEB-приложения

Дата: 2026-07-26
Статус: web client strategy v0.2 + local MVP started

## Решение

Кроме мобильных приложений iOS/Android, CIFEDRA получает полноценное
адаптивное WEB-приложение для клиентов и исполнителей.

```text
Client WEB
  -> CIFEDRA API
    -> CIFEDRA Core
    -> PostgreSQL
    -> Integration Adapters
```

WEB является равноправным клиентским каналом и поддерживает тот же lifecycle:

```text
Need -> Clarify -> Match -> Decide -> Connect -> Execute -> Result
```

## Границы WEB-приложений

| Приложение | Назначение |
| --- | --- |
| `web/landing` | Публичная информация о продукте, ссылки на WEB, iOS и Android. |
| `apps/web` | Клиентское приложение для заказчиков, помощников, экспертов и менторов. Local MVP started: React/Vite screen for auth, pilot scenarios, matching kanban and messenger preview. |
| `apps/ops` | Будущий отдельный интерфейс операторов, модераторов и администраторов. |
| `web/test-console` | Только локальная инженерная диагностика, не production UI. |

Клиент не должен работать в UI Plane, Chatwoot или Baserow. Эти системы
остаются внутренними интеграциями.

## Стек

| Зона | Решение |
| --- | --- |
| UI | React + TypeScript. |
| Build/dev server | Vite. |
| Routing | React Router. |
| API | Generated typed client из CIFEDRA OpenAPI. |
| Authentication | Keycloak OIDC Authorization Code + PKCE; tokens in memory. |
| Styling | Общие CIFEDRA design tokens; web-native responsive components. |
| Localization | Те же message keys и locale policy, что в mobile. |
| Hosting | Static assets через CDN/object storage; API размещается отдельно. |
| Accessibility | WCAG 2.2 AA как целевой baseline. |

Клиентский WEB не реализует бизнес-правила matching, trust или lifecycle.
Он вызывает CIFEDRA API и отображает полученное состояние.

## Общие и платформенные части

Переиспользуем между iOS, Android и WEB:

- OpenAPI schemas и generated DTO/client;
- validation contracts;
- domain terminology and status mappings;
- localization keys;
- analytics event names;
- design tokens;
- test fixtures and CJM acceptance scenarios.

Не пытаемся искусственно переиспользовать весь UI:

- mobile использует React Native components и platform navigation;
- WEB использует semantic HTML, keyboard navigation, responsive tables/forms;
- swipe на WEB имеет явные кнопки `Сохранить`, `Отклонить`, `Связаться`;
- desktop layout может показывать список и карточку кандидата одновременно.

## WEB MVP

| Раздел | Функции |
| --- | --- |
| Authentication | Регистрация, вход, выход, восстановление доступа. |
| Profile | Профиль клиента/исполнителя, языки, география, availability. |
| Need | Создание, редактирование, уточнения и отмена потребности. |
| Match | Список и карточки кандидатов, score explanation, trust and availability. |
| Decision | Save/reject/request contact, shortlist и история решений. |
| Prepare | Brief, вопросы, риски, разрешенный контекст. |
| Connect | Concierge/support и статус contact request. |
| Execution | Engagement/booking/task status без показа внутреннего Plane UI. |
| Result | Outcome, proof/artifact, feedback и follow-up. |
| Notifications | In-app notification center; email/push providers подключаются backend. |

## Local MVP increment 2026-07-26

Создан `apps/web` как первый рабочий WEB MVP поверх локального API.

| Screen area | Current behavior |
| --- | --- |
| Auth | Local register/login через `/auth/register` and `/auth/login`; token хранится in memory. |
| Scenario | Выбор пилотных сценариев `Life / Work / Skills`. |
| Matching | Запуск `/demo/match` и отображение `Need`, `MatchCandidate`, `Shortlist`, `ContactRequest`, `ConversationBrief`. |
| Kanban | Клиентский pipeline `Ally Request -> AI Matching -> Proposed Allies -> Contact Request -> Messenger -> Result`. |
| Messenger | Target preview для `direct_product_chat`: имя клиента и описание запроса/работы без прямых контактов и точного адреса. |

Следующий increment: вынести `/demo/match` в стабильные `/api/v1` endpoints,
добавить persisted Need/Profile/Engagement и заменить preview чата на
message persistence.

## Responsive UX

Поддерживаем:

- desktop от 1280 px;
- tablet от 768 px;
- mobile browser от 320 px;
- keyboard-only navigation;
- screen reader landmarks and labels;
- reduced motion;
- browser file upload;
- deep links на Need, candidate, engagement и result.

WEB на телефоне не заменяет нативное приложение, но позволяет пройти основной
сценарий без установки.

## Security

- tokens не хранятся в `localStorage` или persistent browser storage;
- WEB MVP использует SPA OIDC Authorization Code + PKCE и tokens in memory;
- BFF/cookie session рассматривается отдельным ADR, если потребуется более
  строгая browser session boundary;
- API применяет те же authorization policies, что для mobile;
- CSP, CSRF protection, secure cookies and dependency scanning обязательны;
- Plane/Chatwoot/Baserow credentials не попадают в browser;
- sensitive data не кэшируется service worker без отдельной policy.

## Этапы реализации

### Этап 0. Контракты

1. Утвердить SRS `Client Applications MVP`.
2. Зафиксировать OpenAPI `/api/v1`.
3. Определить route map и responsive wireframes.
4. Подготовить общий generated API package.

### Этап 1. WEB shell

1. Создать `apps/web`.
2. Подключить React, TypeScript, Vite и routing.
3. Добавить design tokens, localization и error boundary.
4. Подключить local API base URL.
5. Реализовать mock/local auth до подключения Keycloak.

### Этап 2. Product flow

1. Direction and Need.
2. Clarification.
3. Match list/cards.
4. Decision/shortlist.
5. Prepare/Connect.
6. Execution/Result.

### Этап 3. Identity and quality

1. Keycloak OIDC.
2. Accessibility audit.
3. Responsive E2E tests.
4. Error/loading/empty/offline states.
5. Security headers and session policy.

### Этап 4. Staging and production

1. Deploy WEB static assets and routing fallback.
2. Configure `app.cifedra.*` domain and TLS.
3. Configure CSP and observability.
4. Run cross-browser acceptance.
5. Link WEB application from landing.

## Acceptance criteria

WEB MVP готов, когда:

1. клиент проходит основной CJM без мобильного приложения;
2. state синхронизируется между WEB и mobile через один API;
3. reload/deep link не теряет route и состояние;
4. keyboard и screen reader покрывают critical flow;
5. в browser отсутствуют provider credentials;
6. responsive E2E проходит на desktop, tablet и mobile browser;
7. WEB не зависит от UI Plane, Chatwoot и Baserow.

## Источники

- [React](https://react.dev/).
- [Vite](https://vite.dev/guide/).
- [Keycloak JavaScript adapter](https://www.keycloak.org/securing-apps/javascript-adapter).
- [WCAG overview](https://www.w3.org/WAI/standards-guidelines/wcag/).
