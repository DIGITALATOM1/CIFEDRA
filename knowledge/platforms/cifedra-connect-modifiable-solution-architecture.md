# CIFEDRA CONNECT: модифицируемая архитектура решения Life / Work / Skills

Дата: 2026-06-11
Статус: архитектурная гипотеза v0.1
Связанный документ: [cifedra-connect-platform-selection.md](./cifedra-connect-platform-selection.md)

Актуальная целевая схема и решения по Keycloak, Whisper, scheduling, n8n и
payments: [../system/cifedra-target-architecture.md](../system/cifedra-target-architecture.md).

## Цель

Определить, какие готовые технические решения можно взять, модифицировать и встроить в `CIFEDRA CONNECT`, чтобы закрыть направления `Life`, `Work`, `Skills`, не потеряв собственное продуктовое ядро.

Основной вывод: готовые решения должны ускорять инфраструктуру, backoffice, коммуникации, поиск, автоматизации и контент. Но ядро `Need -> Match -> Prepare -> Connect -> Result` нужно делать собственным, потому что именно там находится продуктовая логика `CIFEDRA CONNECT`.

## Критерии выбора решений

| Критерий | Что означает для проекта |
| --- | --- |
| Модифицируемость | Доступен исходный код или расширяемая архитектура, можно менять UI, модели данных, правила и интеграции. |
| Self-host / переносимость | Можно стартовать в managed-режиме, но архитектура не должна запирать данные в одном SaaS. |
| API-first | Мобильное приложение, backoffice, агенты и автоматизации работают через API. |
| Postgres-first | Общая модель данных должна быть реляционной, расширяемой и пригодной для аналитики. |
| Заменяемость | Каждый компонент можно заменить без переписывания пользовательского продукта. |
| Лицензионная чистота | Open-source предпочтительнее source-available; source-available решения требуют отдельного review перед production. |

## Принцип архитектуры

`CIFEDRA CONNECT` строится как модульный монолит Core с отдельным worker, а
готовые продукты подключаются как изолированные системы. Это не один большой
неструктурированный монолит и не набор микросервисов по направлениям.

```text
Mobile App
  -> CIFEDRA API / Core Backend
    -> Postgres Core Data
    -> Matching / Search / Trust / Result
    -> Integrations
      -> Baserow / Backoffice
      -> Chatwoot / Concierge & Support
      -> Search / Vector / Geo / Scheduling / Video
```

## Собственное ядро CIFEDRA Core

Этот слой нельзя отдавать готовому маркетплейс-движку, Baserow или Chatwoot. Его нужно проектировать как доменную систему.

| Модуль | Назначение |
| --- | --- |
| `Need` | Задача пользователя, контекст, ограничения, ожидаемый результат. |
| `Direction` | `Life`, `Work`, `Skills`, их словари, категории и правила. |
| `Profile` | Человек, роль, навыки, география, опыт, доступность, доверие. |
| `Match` | Подбор кандидатов под задачу, объяснение релевантности, ограничения. |
| `Swipe / Decision` | Быстрый выбор, отклонение, shortlist, запрос контакта. |
| `Prepare` | Цель разговора, вопросы, тезисы, риски, следующий шаг. |
| `Connect` | Канал контакта: concierge, внешний канал, будущий direct chat. |
| `Result` | Итог контакта, следующий шаг, причина отказа, follow-up, качество матча. |
| `Trust` | Проверки, рейтинги, жалобы, блокировки, источники доверия. |
| `Agent Ops` | Ручные действия операторов, аналитиков, модераторов и агентов направлений. |

## Рекомендуемый базовый стек

| Слой | Основное решение | Почему подходит | Граница применения |
| --- | --- | --- | --- |
| Mobile app | `React Native + Expo` | Нативные iOS/Android приложения, быстрые итерации, совместимость с React Native widget для Chatwoot. | Весь пользовательский UX: карточки, свайпы, shortlist, подготовка, результат. |
| Core backend | `PostgreSQL + собственный API` | PostgreSQL остается источником истины; PostGIS/pgvector подключаются как extensions. | Бизнес-логику держать в CIFEDRA Core. |
| Identity | `Keycloak` в staging/production; local auth adapter в dev | OIDC/SSO, sessions, MFA, reset and federation. | Product profile/permissions остаются в Core. |
| Геоданные | `PostGIS` | Расширяет PostgreSQL хранением, индексированием и запросами геоданных. | Нужно прежде всего для `Life`: расстояния, районы, локальная доступность. |
| Семантический матчинг | `pgvector` на старте, `Qdrant` при росте | pgvector хранит векторы рядом с данными в Postgres; Qdrant можно вынести отдельно для масштабного vector search. | Не заменяет правила матчинга, а дополняет их similarity-поиском. |
| Фасетный поиск | `Meilisearch` опционально | Быстрый open-source поиск, фильтры, self-host/fork. | Подключать после появления объема профилей и поисковых фильтров. |
| Backoffice / операционные таблицы | `Baserow` | MIT/open-source, API-first, удобно для ручного матчинга, справочников и SRS-операционки. | Не использовать как production core мобильного продукта. |
| Support / concierge | `Chatwoot` | Self-hosted/open-source support desk, mobile apps, API, React Native widget. | Использовать для поддержки и concierge, не как основной marketplace messenger. |
| Автоматизации | Собственные workers; `n8n` опционально | Workers надежно исполняют domain events; n8n удобен для внутренних интеграций. | Не отдавать n8n lifecycle, auth, trust, payments and audit. |
| Контент / инструкции / Help Center | `Chatwoot Help Center`, позже `Strapi` или `Payload` | Strapi MIT/open-source, Payload TypeScript/open-source; можно строить управляемый контент. | Не смешивать продуктовые данные людей с публичным контентом. |
| Scheduling | Собственные slots/Booking; позже Calendly/calendar adapter | Core владеет booking state; Calendly является SaaS integration. Cal.diy допустим только как local spike. | Для `Skills`, `Work`, Care после SRS по встречам и отменам. |
| Languages / voice | UI i18n + translation adapter + Whisper transcription adapter | Разделяет перевод интерфейса, текста и речи. | Whisper не использовать как универсальный переводчик. |
| Video sessions | `Jitsi Meet` опционально | Open-source video, можно self-host. | Для `Skills`: наставничество, занятия, консультации. |
| Commerce / payments | Provider-neutral payment adapter | Локально mock provider; реальный PSP выбирается перед production. | Не хранить card data; нужен отдельный юридический и финансовый SRS. |

## Покрытие направлений

### CIFEDRA Life

`Life` - самый локальный и операционный сценарий. Здесь важны география, доступность, безопасность и быстрый результат.

| Потребность | Техническое решение |
| --- | --- |
| Локальный поиск помощников | Postgres + PostGIS, позже Meilisearch для фильтров. |
| Карточки исполнителей рядом | Собственный mobile UX + CIFEDRA Core profiles. |
| Свайпы и shortlist | Собственный модуль `Swipe / Decision`. |
| Ручной подбор на пилоте | Baserow как очередь заявок и каталог кандидатов. |
| Коммуникация в раннем MVP | Chatwoot concierge, оператор помогает довести до контакта. |
| Доверие и безопасность | Собственный модуль `Trust`: проверки, жалобы, блокировки, источники доверия. |

Не стоит брать готовый marketplace как основу `Life`: локальные поручения, забота, ремонт, перевозки и локальные сделки имеют разные риски, словари, проверки и результаты.

### CIFEDRA Work

`Work` - сценарии экспертов, подрядчиков, проектных команд, бизнес-сделок и корпоративного знания.

| Потребность | Техническое решение |
| --- | --- |
| Поиск эксперта или исполнителя | Postgres + pgvector/Qdrant для semantic fit, Meilisearch для фильтров. |
| Объяснение релевантности | Собственный `Match explanation`: роль, опыт, контекст, ограничения. |
| Команда под проект | Core-модели `Need`, `Role`, `Profile`, `Team shortlist`. |
| Company Knowledge | Knowledge base + vector search, связка человек-документ-система-решение. |
| Операционная работа аналитика | Baserow для реестров, SRS, вопросов, статусов, ручного подбора. |
| Коммуникация и эскалации | Chatwoot для support/concierge; direct product chat проектировать отдельно. |
| Интеграции | Собственные workers; n8n только для внутренних некритичных automation. |

В `Work` особенно важно не просто найти человека, а подготовить качественный контакт: цель, контекст, вопросы, ожидаемый результат, риски и следующий шаг.

### CIFEDRA Skills

`Skills` - наставники, обучение, карьерная помощь, практика, skill exchange.

| Потребность | Техническое решение |
| --- | --- |
| Подбор наставника/партнера | Core matching + pgvector по целям, навыкам, уровню, формату. |
| Занятия и консультации | Собственные слоты на старте; позже Calendly/calendar adapter. Cal.diy только для local spike. |
| Видео-встречи | Jitsi Meet как open-source вариант после отдельного SRS. |
| Учебные материалы | Strapi/Payload или простой content layer в core. |
| Прогресс и результат | Собственный `Result`: цель, session outcome, домашнее действие, follow-up. |
| Практика и обмен навыками | Core-модель взаимного интереса и правил обмена без оплаты. |

В `Skills` нельзя ограничиться каталогом преподавателей. Нужны цель развития, уровень пользователя, формат взаимодействия и фиксация результата после контакта.

## Что можно модифицировать, но не брать как ядро

| Решение | Решение по проекту |
| --- | --- |
| `Baserow` | Использовать для backoffice, справочников, ручного пилота, SRS и базы знаний. Не делать на нем конечный mobile UX. |
| `Chatwoot` | Использовать для поддержки и concierge. Не использовать как полноценный direct marketplace chat без отдельного SRS. |
| `Appwrite` | Рассматривать только как альтернативный BaaS. Для CIFEDRA не выбран из-за утвержденного PostgreSQL-first подхода, гео, аналитики и сложных связей. |
| `Directus` | Рассматривать осторожно: мощный backend/admin, но текущая лицензия source-available/MSCL требует review. |
| `n8n` | Полезен для внутренних автоматизаций, но лицензия source-available. Критичные workflow лучше переносить в собственный код. |
| `Sharetribe Go` | Не брать: старое source-available marketplace ПО, по GitHub-описанию больше не активно поддерживается. |
| `Cal.diy` | Не брать как production-ядро без review: документация предупреждает о self-hosting complexity и non-production фокусе community edition. |
| `PocketBase` | Хорош для маленьких прототипов, но SQLite-first; для CIFEDRA лучше Postgres-first из-за гео, аналитики, связей и масштабирования. |

## Предлагаемая дорожная карта архитектуры

### Этап 0. Управляемый пилот

Цель: проверить ценность сценария без тяжелой разработки.

Состав:

- GitHub как основной репозиторий проекта.
- Baserow: категории, профили людей, заявки, ручной матчинг, SRS-реестры.
- Chatwoot: поддержка и concierge-коммуникация.
- Документы SRS и архитектуры в `knowledge/`.

### Этап 1. Mobile MVP

Цель: дать пользователю основной сценарий в мобильном приложении.

Состав:

- React Native + Expo.
- PostgreSQL для пользователей, задач, профилей, матчей, свайпов, shortlist и result.
- PostGIS для `Life`.
- pgvector для начального semantic matching.
- Chatwoot widget только как support/concierge.

### Этап 2. Match Engine

Цель: сделать подбор объяснимым и управляемым.

Состав:

- Правила матчинга по направлению.
- Скоринг релевантности.
- Explainable match card.
- Анти-матчи и причины отказа.
- Аналитика качества результата.

### Этап 3. Вертикальные расширения

Цель: усилить каждое направление без разрыва общего ядра.

| Направление | Расширения |
| --- | --- |
| `Life` | Гео-радиусы, срочность, безопасность, локальные зоны, оперативный dispatch. |
| `Work` | Проектные команды, company knowledge, роли, интеграции с рабочими системами. |
| `Skills` | Слоты, встречи, материалы, прогресс, mentor/student journey. |

### Этап 4. Direct Product Chat и коммерция

Цель: перейти от concierge к масштабируемым прямым контактам.

Требует отдельных SRS:

- direct chat;
- модерация и жалобы;
- вложения;
- блокировки;
- приватность;
- платежи/комиссии;
- отмены и споры;
- юридическая модель.

## Источники для проверки

- Supabase: [основной сайт](https://supabase.com/), [self-hosting](https://supabase.com/docs/guides/self-hosting), [architecture](https://supabase.com/docs/guides/getting-started/architecture).
- React Native / Expo: [React Native](https://reactnative.dev/), [Expo](https://expo.dev/).
- Appwrite: [основной сайт](https://appwrite.io/), [self-hosting](https://appwrite.io/docs/advanced/self-hosting).
- Baserow: [GitHub/license](https://github.com/baserow/baserow), [API docs](https://baserow.io/user-docs/database-api).
- Chatwoot: [основной сайт](https://www.chatwoot.com/), [mobile apps](https://www.chatwoot.com/mobile-apps/), [React Native widget](https://github.com/chatwoot/chatwoot-react-native-widget).
- Strapi / Payload: [Strapi](https://strapi.io/), [Payload](https://payloadcms.com/).
- Directus: [основной сайт](https://directus.com/), [GitHub/license note](https://github.com/directus/directus).
- PostGIS: [официальный сайт](https://postgis.net/).
- pgvector: [GitHub](https://github.com/pgvector/pgvector).
- Meilisearch: [основной сайт](https://www.meilisearch.com/), [self-hosting](https://meilisearch.com/docs/resources/self_hosting/overview).
- Qdrant: [основной сайт](https://qdrant.tech/), [docs](https://qdrant.tech/documentation/).
- n8n: [docs](https://docs.n8n.io/), [GitHub/license note](https://github.com/n8n-io/n8n).
- Cal.com / Cal.diy: [Cal.com](https://cal.com/), [Cal.diy self-hosting](https://www.cal.diy/).
- Jitsi: [основной сайт](https://jitsi.org/), [self-hosting guide](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-quickstart/).
- Medusa: [основной сайт](https://medusajs.com/), [GitHub](https://github.com/medusajs/medusa).
- Sharetribe Go: [GitHub](https://github.com/sharetribe/sharetribe).

## Следующие задачи системного анализа

1. Подготовить SRS `CIFEDRA Core Domain Model`.
2. Подготовить SRS `Mobile MVP: Need -> Match -> Prepare -> Connect -> Result`.
3. Подготовить отдельные SRS-блоки для `Life`, `Work`, `Skills`.
4. Подготовить таблицу `Build / Modify / Integrate / Avoid` по каждому компоненту.
5. Описать MVP-модель данных: user, need, direction, category, profile, capability, match, swipe, shortlist, conversation, result, trust signal.
6. Описать границы Chatwoot concierge и будущего direct product chat.
