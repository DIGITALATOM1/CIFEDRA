# CIFEDRA CONNECT: план работ на 2 недели

Дата подготовки: 2026-06-20
Дата обновления: 2026-06-21
Период: 2026-06-22 - 2026-07-03
Команда: владелец продукта + Codex
Статус: sprint baseline v0.1

Рабочие артефакты:

- [Product brief](../product/work-srs-review-product-brief.md);
- [Sprint backlog](../delivery/sprint-2026-06-22-backlog.md);
- [Decision log](../delivery/decision-log.md);
- [Risk register](../delivery/risk-register.md);
- [Interview kit](../research/work-srs-review-interview-kit.md).

## 1. Цель спринта

За две недели нужно превратить текущий локальный прототип в безопасную и
проверяемую основу трех synthetic scenarios:

```text
Life / Outdoor maintenance
Work / Expert Help / SRS Review
Skills / Interview preparation
```

Итог спринта:

1. утвержден provisional scope трех локальных pilot scenarios;
2. подготовлен SRS для первого Core P0 increment;
3. закрыты критичные security gaps локального прототипа;
4. реализованы и протестированы `IdentityRef`, Profile, Need Intake и
   Clarification;
5. GitHub CI проверяет typecheck, tests and build;
6. подготовлен PostgreSQL/migration spike без преждевременного переноса всего
   приложения;
7. проведен local UAT трех synthetic scenarios без реальных услуг и документов;
8. на evidence review утвержден backlog следующего двухнедельного спринта.

## 2. Рабочая модель

### Владелец продукта

Отвечает за решения, которые нельзя делегировать:

- ценность и границы pilot scenarios;
- local product walkthrough and owner expert workshop;
- принятие продуктовых и UX-решений;
- выбор названия, доменной стратегии и юридической географии;
- приемка ежедневных результатов и изменение приоритетов.

Ожидаемая загрузка:

- 30-60 минут на решение и приемку в рабочий день;
- один owner expert workshop на 45-60 минут;
- один итоговый review длительностью 60-90 минут.

### Codex

Отвечает за исполнение внутри репозитория:

- анализ, SRS, схемы, ADR/HLD updates и backlog;
- реализацию Core/API/security/CI/spike;
- unit, integration and smoke tests;
- подготовку interview scripts, протоколов и UX flow drafts;
- ежедневные коммиты после законченных increments;
- демонстрацию результата и фиксацию открытых решений.

Codex работает в активных сессиях с владельцем продукта. План не предполагает
автономную работу между сессиями или наличие скрытой команды.

## 3. Приоритеты

### Must complete

1. Scope and exclusions трех local pilot scenarios.
2. SRS `Core P0: Identity, Profile, Intake, Clarification`.
3. Prototype security baseline.
4. Core increment с unit tests.
5. GitHub CI baseline.
6. PostgreSQL compose/migration/repository spike.
7. Three synthetic end-to-end walkthroughs.
8. Architecture evidence review и следующий backlog.

### Should complete

1. Low-fidelity client/provider flow.
2. Metric dictionary для local pilot.
3. Shortlist названия и доменов без заявления о доступности.
4. Подготовленный recruitment kit для будущих external interviews.

### Не делаем в эти две недели

- production Keycloak rollout;
- `apps/web` и `apps/mobile`;
- расширение Plane/Chatwoot beyond current adapter verification;
- Baserow, n8n, Whisper, translation or Calendly integration;
- production hosting and staging;
- реальные платежи;
- публикацию в App Store/Google Play;
- прием реальных SRS, персональных или конфиденциальных документов;
- покупку домена до утверждения имени и проверки у регистратора.

## 4. Планируемые артефакты базы знаний

В ходе спринта создаются и поддерживаются:

| Зона | Планируемый артефакт |
| --- | --- |
| Product | Scope and local UAT evidence по Life / Work / Skills. |
| Research | Prepared interview kit; external synthesis deferred. |
| Requirements | SRS `Core P0: Identity, Profile, Intake, Clarification`. |
| Traceability | Связи `CJM -> requirement -> module -> test`. |
| Architecture | Impact notes and ADR updates only for changed decisions. |
| Quality | Security test matrix and sprint evidence pack. |
| Delivery | Decision log, risk register and next sprint backlog. |

При создании новых каталогов они добавляются в
[knowledge/README.md](../README.md). Interview notes не должны содержать
необязательные персональные или конфиденциальные данные.

## 5. План по рабочим дням

### День 1 - понедельник, 22 июня

Фокус: границы продукта и sprint setup.

Владелец продукта:

- подтверждает Life/Work/Skills local pilot scenarios;
- подтверждает Work Quick Review как первый expert service;
- утверждает exclusions и допустимый manual workflow;
- определяет доступное время на интервью.

Codex:

- создает one-page product brief;
- формирует sprint backlog and decision log;
- описывает actor, trigger, expected result and success signal;
- связывает scope с CJM и master plan.

Результат дня:

- scope v0.1;
- exclusions;
- список открытых решений;
- список трех local UAT scenarios.

### День 2 - вторник, 23 июня

Фокус: SRS and domain contract.

Владелец продукта:

- подтверждает поля трех category schemas;
- подтверждает минимальные данные профиля клиента и эксперта;
- выбирает правила готовности Need к matching.

Codex:

- готовит SRS `Core P0` with Life/Work/Skills schemas;
- описывает `IdentityRef`, `UserProfile`, `ProviderProfile`, `NeedSchema`,
  completeness and Clarification;
- фиксирует invariants, permissions, errors and acceptance scenarios;
- готовит traceability `CJM -> requirement -> module -> test`.

Результат дня:

- SRS v0.1;
- domain diagram;
- acceptance checklist;
- product approval questions зафиксированы.

### День 3 - среда, 24 июня

Фокус: prototype security baseline, часть 1.

Владелец продукта:

- принимает решение, что self-registration создает только роль `client`;
- подтверждает, что helper/operator/admin выдаются только доверенным
  административным процессом.

Codex:

- запрещает назначение `helper/operator/admin` через self-registration;
- добавляет authorization checks для изменяющих state demo endpoints;
- ограничивает API loopback interface по умолчанию;
- заменяет wildcard CORS на allowlist configuration;
- оставляет live integrations выключенными без двух явных opt-in flags;
- добавляет negative authorization tests.

Результат дня:

- пользователь не может самостоятельно стать helper/operator/admin;
- unauthorized requests получают `401/403`;
- API по умолчанию не доступен во внешней сети;
- security tests проходят.

### День 4 - четверг, 25 июня

Фокус: prototype security baseline, часть 2, и CI.

Владелец продукта:

- принимает допустимый local session UX для test console;
- подтверждает перечень обязательных checks для каждого push.

Codex:

- убирает persistent bearer token из `localStorage`;
- проверяет file permissions for local secrets/handoff artifacts;
- добавляет request size limits, timeouts, safe errors and input validation;
- создает GitHub Actions workflow;
- включает clean install, typecheck, tests, build, Markdown, dependency and
  secret checks.

Результат дня:

- Gate `S0 - Safe Local Prototype`;
- CI работает на push;
- security evidence зафиксирован.

### День 5 - пятница, 26 июня

Фокус: Identity and Profile increment.

Владелец продукта:

- принимает поля и visibility профиля;
- определяет различие клиента, эксперта и системной роли.

Codex:

- реализует provider-neutral `IdentityRef`;
- реализует `UserProfile` and `ProviderProfile`;
- добавляет ownership and basic authorization policies;
- добавляет unit tests and exports;
- обновляет SRS по фактической реализации.

Результат дня:

- identity не зависит от email;
- профиль имеет owner and lifecycle;
- client/helper product roles не смешаны с admin/operator permissions;
- owner expert workshop prepared.

### День 6 - понедельник, 29 июня

Фокус: Life/Work/Skills Need Intake.

Владелец продукта:

- утверждает обязательные/условные поля трех schemas;
- подтверждает, что local pilot использует только repository-owned synthetic data.

Codex:

- реализует versioned `NeedSchema`;
- добавляет Life/Work/Skills schemas and completeness calculation;
- запрещает matching для incomplete Need;
- добавляет validation and edge-case tests;
- готовит текстовый low-fidelity intake flow.

Результат дня:

- три Need schemas имеют явную версию;
- readiness вычисляется одинаково в Core и tests;
- synthetic inputs prepared for all three.

### День 7 - вторник, 30 июня

Фокус: Clarification lifecycle.

Владелец продукта:

- принимает список уточняющих вопросов и критерий достаточности;
- определяет, когда нужен оператор, а когда автоматическое уточнение.

Codex:

- реализует Clarification question/answer lifecycle;
- добавляет states, actor, timestamps and resolution;
- связывает clarification readiness с Need;
- добавляет invalid transition and authorization tests;
- обновляет CJM traceability.

Результат дня:

- incomplete Need переходит в clarification;
- после достаточных ответов Need становится ready for matching;
- clarification scenarios cover all three directions.

### День 8 - среда, 1 июля

Фокус: PostgreSQL technical spike.

Владелец продукта:

- принимает, какие сущности входят в первый persistence slice;
- подтверждает локальную работу только с synthetic test data.

Codex:

- добавляет tracked PostgreSQL compose configuration;
- создает первую migration and role model;
- реализует repository contract spike для одной aggregate boundary;
- проверяет migrate, write, read, restart and reset;
- документирует результат и ограничения spike.

Результат дня:

- воспроизводимый PostgreSQL environment;
- migration запускается с нуля;
- одна сущность переживает restart;
- решение о следующем persistence increment подтверждено фактами.

### День 9 - четверг, 2 июля

Фокус: vertical integration and product evidence.

Владелец продукта:

- оценивает interview findings;
- подтверждает или корректирует offer and intake;
- выбирает shortlist названий и доменную стратегию.

Codex:

- собирает three synthetic flows
  `Identity -> Profile -> Intake -> Clarification -> Ready for Match`;
- обновляет test console or smoke scenario;
- формирует local UAT evidence and metric dictionary;
- готовит low-fidelity client/provider flow;
- выполняет regression, security and Markdown checks.

Результат дня:

- Gate `C0 - Core Intake Increment`;
- synthetic vertical flow демонстрируется локально;
- scope corrections основаны на local UAT evidence.

### День 10 - пятница, 3 июля

Фокус: evidence review and next sprint.

Владелец продукта:

- принимает или отклоняет результаты спринта;
- утверждает следующие priorities;
- решает, резервировать ли выбранный домен после проверки у регистратора.

Codex:

- проводит architecture impact review;
- обновляет SRS, HLD, ADR, risk register and backlog;
- фиксирует незакрытые defects and decisions;
- готовит demo and sprint report;
- формирует план следующего спринта.

Результат дня:

- Gate `R0 - Sprint Evidence Review`;
- GitHub `main` содержит проверенный increment;
- backlog следующего спринта согласован;
- domain action оформлен отдельным решением, без автоматической покупки.

## 6. Local UAT and deferred research

Local UAT:

| Scenario | What is tested |
| --- | --- |
| Life / Outdoor maintenance | Pool/lawn variants, conditional fields, local-service metadata and no exact address. |
| Work / SRS Review | Quick Review metadata, one focus, language and confidentiality guard. |
| Skills / Interview preparation | Role, level, interview format, goals and language. |

External client/provider interviews resume after the local functional pilot.
До `D0 - Real Data Pilot Readiness`:

- не загружаем реальные SRS;
- не записываем конфиденциальные детали проекта;
- используем только repository-owned synthetic examples;
- не создаем записи реальных услуг или engagement;
- не обещаем участникам готовый сервис или дату публичного запуска.

## 7. Sprint gates

### G0-S - Scope Ready

- первый scenario and exclusions утверждены;
- actor, trigger, result and success signal определены;
- open decisions имеют owner and deadline.

### S0 - Safe Local Prototype

- self-registration не назначает privileged roles;
- state-changing endpoints требуют authentication and authorization;
- CORS uses explicit allowlist;
- server binds loopback by default;
- bearer token не хранится в persistent browser storage;
- local secret/artifact files имеют restrictive permissions;
- live provider calls require explicit opt-in configuration;
- oversized/invalid requests and provider timeouts fail safely;
- negative security tests проходят.

### C0 - Core Intake Increment

- `IdentityRef`, Profile, NeedSchema and Clarification реализованы;
- ownership and invalid transitions покрыты tests;
- incomplete Need нельзя отправить в matching;
- synthetic flow проходит локально и в CI.

### R0 - Sprint Evidence Review

- все обязательные checks зеленые;
- нет открытого Sev-1/Sev-2 в измененном scope;
- SRS/HLD/code/tests согласованы;
- PostgreSQL spike воспроизводим;
- local UAT findings и решения зафиксированы;
- следующий sprint backlog отсортирован по critical path.

## 8. Definition of Done

Задача считается завершенной, когда:

1. изменение реализовано или документировано в Git;
2. acceptance criteria проверены;
3. tests добавлены для измененного поведения;
4. typecheck, tests and build проходят;
5. security/privacy impact рассмотрен;
6. SRS/HLD/ADR обновлены при изменении контракта;
7. commit отправлен в GitHub;
8. владелец продукта может увидеть или воспроизвести результат.

## 9. Условия изменения плана

План корректируется, если:

- local UAT показывает, что generic schema/lifecycle не покрывает одно из трех направлений;
- security fix требует изменения auth boundary;
- PostgreSQL spike выявляет ошибку data ownership;
- Core contract не покрывает CJM без нового aggregate;
- ежедневная доступность владельца продукта существенно ниже принятой модели.

При изменении не добавляем задачи поверх текущего объема. Сначала:

1. фиксируем evidence;
2. определяем затронутые SRS/HLD/ADR/tests;
3. снимаем менее приоритетную задачу;
4. обновляем sprint baseline;
5. повторно проходим затронутый gate.

## 10. Вероятный следующий спринт

Если `R0` пройден:

1. `ContactRequest` and provider accept/decline/expiry;
2. `Consent` and permitted disclosure;
3. `Engagement` baseline;
4. следующий PostgreSQL repository slice and transactions;
5. `/api/v1` application boundary and OpenAPI draft;
6. начало WEB information architecture без production UI build.

Keycloak, полноценный WEB/mobile и external beta остаются за пределами
следующего шага, пока не стабилизированы Core contract and persistence.
