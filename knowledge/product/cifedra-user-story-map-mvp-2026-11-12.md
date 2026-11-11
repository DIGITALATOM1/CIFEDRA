# CIFEDRA: User Story Map клиентского MVP

Дата: 2026-11-12
Версия: 0.1
Статус: baseline для декомпозиции SRS и реализации
Каналы: WEB first, затем iOS/Android через тот же API

## 1. Назначение

Карта переводит CJM и карту экранов CIFEDRA в последовательность пользовательских
активностей, историй и вертикальных релизных срезов. Она является связующим
артефактом между продуктовым сценарием, SRS, доменной моделью, API и тестами.

Карта не заменяет:

- CJM — источник контекста, ожиданий и проблем пользователя;
- Use Case — детальный основной и альтернативные потоки;
- SRS — проверяемые требования и ограничения;
- OpenAPI — внешний контракт приложений с backend;
- backlog — оцененные задачи реализации.

Связанные baseline:

- [карта приложения](./cifedra-app-map-2026-07-26.md);
- [CJM WORK / LIFE / SKILLS](./cifedra-connect-cjm-work-life-skills-2026-07-26.md);
- [HLD](../system/cifedra-hld.md);
- [Core P0 SRS](../srs/core-p0-identity-profile-intake-clarification.md);
- [ContactRequest SRS](../srs/core-p1-contact-request-consent.md).

## 2. Продуктовый результат

Пользователь проходит один управляемый процесс:

```text
Получить доступ
  -> описать потребность
  -> подготовить запрос
  -> выбрать Ally
  -> договориться
  -> выполнить работу
  -> принять результат
  -> оценить и повторить
```

Ценность MVP считается доказанной на уровне продукта только тогда, когда клиент
и Ally завершают сквозной сценарий подтвержденным `Result`, а не только получают
shortlist или открывают чат.

## 3. Роли

| Роль | Цель в Story Map | Ключевое решение человека |
| --- | --- | --- |
| Клиент | Получить подходящую помощь и проверяемый результат. | Подтверждает запрос, Ally, Agreement, disclosure и Result. |
| Ally | Получить релевантную работу и выполнить согласованные условия. | Принимает запрос, Agreement, scope changes и передает Result. |
| AI/Ops | Снизить неопределенность и обработать исключения. | Предлагает и объясняет, но не подтверждает решения за участников. |
| Администратор | Управлять конфигурацией и безопасностью платформы. | Публикует версии каталогов, схем и правил с аудитом. |

Один пользователь может иметь роли `Клиент` и `Ally`; смена роли меняет рабочий
контекст, но не создает второй аккаунт.

## 4. Backbone Story Map

| Activity | Получить доступ | Описать потребность | Подготовить запрос | Выбрать Ally | Договориться | Выполнить работу | Принять результат | Вернуться |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Клиентский outcome | Вижу свою доску. | Система понимает задачу. | Запрос готов к подбору. | Выбран подходящий человек. | Условия взаимно подтверждены. | Вижу ход работы. | Решение по результату зафиксировано. | Могу повторить или продолжить. |
| Ally outcome | Готов принимать запросы. | — | Вижу безопасный brief. | Принимаю или отклоняю запрос. | Понимаю scope и ограничения. | Фиксирую прогресс. | Получаю решение клиента. | Улучшаю профиль и беру следующую работу. |
| Домены | Identity, Profile | Catalog, Need | Request Bundle, Clarification | Matching, ContactRequest | Conversation, Agreement, Disclosure | Alliance, Work Card | Result, Dispute | Feedback, Reference, Notification |

## 5. Релизные срезы

| Slice | Цель | Входит | Не входит | Gate |
| --- | --- | --- | --- | --- |
| M0 — Shell | Пользователь входит и видит корректный роль-зависимый контекст. | Local auth boundary, профиль, роли, язык, пустые доски, navigation, session states. | Production Keycloak, organization accounts. | WEB E2E: login -> profile -> client/Ally board. |
| M1 — Request to mutual contact | Клиент создает запрос и получает взаимно принятое знакомство. | Intake, decomposition, clarification, review, matching, shortlist, candidate decision, ContactRequest, Ally response. | Чат, Agreement, раскрытие контактов. | Две роли доходят до `ContactRequest.accepted` без раскрытия закрытых полей. |
| M2 — Safe agreement | Стороны договариваются внутри CIFEDRA. | Product chat, original/translation state, Agreement versions, mutual confirmation, field-level disclosure consent. | Внешний messenger как основной UI, реальные контакты в synthetic test. | Подтвержденный Agreement; disclosure доступен только после двух consent. |
| M3 — Alliance and Result | Стороны управляют выполнением до принятого результата. | Planned/in progress/blocked, timeline, Result versions, accept/rework/dispute, feedback, repeat. | Реальные платежи, public ratings. | Work Quick Review synthetic E2E завершается `completed`; Life/Skills проходят тем же lifecycle на fixtures. |
| M4 — Quality and Operations | Основные отрицательные ветки управляемы. | No match, timeout, cancellation, stale update, notification, Ops Case, audit, accessibility, responsive/offline states. | Полноценная support organization и production SLA. | Негативные E2E и security tests проходят локально. |

Slice считается завершенным только при одновременной готовности домена, API,
WEB-интерфейса, persistence, тестов и evidence. Наличие отдельного экрана или
метода Core не закрывает slice.

## 6. Истории по активностям

### A1. Получить доступ и рабочий контекст

| ID | Роль | История | Экран | Slice | Домен / контракт |
| --- | --- | --- | --- | --- | --- |
| US-A1-01 | Гость | Как гость, я хочу зарегистрироваться или войти, чтобы получить личный контекст. | SCR-001 | M0 | Identity, Session |
| US-A1-02 | Пользователь | Как пользователь, я хочу восстановить доступ без потери черновиков. | SCR-002 | M0 | Identity adapter |
| US-A1-03 | Пользователь | Как пользователь, я хочу выбрать язык и роли, чтобы получить подходящую навигацию. | SCR-003 | M0 | User Profile |
| US-A1-04 | Пользователь | Как пользователь, я хочу видеть, какие данные профиля еще обязательны. | SCR-003/004 | M0 | Profile readiness |
| US-A1-05 | Пользователь | Как пользователь с двумя ролями, я хочу переключаться между клиентом и Ally без повторного входа. | Shell | M0 | Role context |
| US-A1-06 | Пользователь | Как пользователь, я хочу после входа вернуться на последнюю доступную доску. | CLI-001/ALY-001 | M0 | Navigation preference |

### A2. Описать потребность

| ID | Роль | История | Экран | Slice | Домен / контракт |
| --- | --- | --- | --- | --- | --- |
| US-A2-01 | Клиент | Как клиент, я хочу выбрать Life, Work, Skills или описать ситуацию свободно. | CLI-003 | M1 | Catalog, routing |
| US-A2-02 | Клиент | Как клиент, я хочу выбрать услугу или `Другое`, чтобы получить нужную intake schema. | CLI-004 | M1 | Catalog version |
| US-A2-03 | Клиент | Как клиент, я хочу заполнять запрос по одному логическому блоку и сохранять draft. | CLI-005 | M1 | Need draft |
| US-A2-04 | Клиент | Как клиент, я хочу понимать, зачем запрашивается каждое обязательное поле. | CLI-005 | M1 | Schema explanation |
| US-A2-05 | Клиент | Как клиент, я хочу указать ожидаемый результат и ограничения до matching. | CLI-005 | M1 | Need, acceptance intent |
| US-A2-06 | Клиент | Как клиент, я хочу сохранять original language отдельно от перевода. | CLI-005 | M1 | Localized content |

Direction-specific поля задаются versioned schemas. Общий lifecycle не
ветвится на три разных приложения.

### A3. Подготовить запрос к подбору

| ID | Роль | История | Экран | Slice | Домен / контракт |
| --- | --- | --- | --- | --- | --- |
| US-A3-01 | Клиент | Как клиент, я хочу увидеть объяснимое предложение разделить сложный запрос. | CLI-006 | M1 | Split Proposal |
| US-A3-02 | Клиент | Как клиент, я хочу изменить, объединить или отклонить предложенные части до создания child requests. | CLI-006 | M1 | Request Bundle |
| US-A3-03 | Клиент | Как клиент, я хочу ответить только на уточнения, которые влияют на готовность или matching. | CLI-007 | M1 | Clarification |
| US-A3-04 | Клиент | Как клиент, я хочу проверить summary и разрешенный preview до запуска matching. | CLI-008 | M1 | Consent snapshot |
| US-A3-05 | Система | Как система, я должна запретить matching для неполного или неподтвержденного запроса. | CLI-008 | M1 | Readiness guard |
| US-A3-06 | Клиент | Как клиент, я хочу видеть child requests одной группой, но с независимыми статусами. | CLI-001/002 | M1 | Bundle projection |

### A4. Найти и выбрать Ally

| ID | Роль | История | Экран | Slice | Домен / контракт |
| --- | --- | --- | --- | --- | --- |
| US-A4-01 | Клиент | Как клиент, я хочу видеть прогресс поиска и причину задержки. | CLI-009 | M1 | Match Run |
| US-A4-02 | Клиент | Как клиент, я хочу получить варианты при отсутствии точного матча без скрытого ослабления hard constraints. | CLI-009 | M4 | No Exact Match |
| US-A4-03 | Клиент | Как клиент, я хочу сравнить shortlist по fit, gaps, trust, языку и доступности. | CLI-010/011 | M1 | Match explanation |
| US-A4-04 | Клиент | Как клиент, я хочу сохранить, отклонить или запросить контакт с кандидатом. | CLI-010/011 | M1 | Candidate Decision |
| US-A4-05 | Клиент | Как клиент, я хочу проверить безопасный brief перед отправкой ContactRequest. | CLI-012 | M1 | Disclosure preview |
| US-A4-06 | Ally | Как Ally, я хочу видеть только разрешенный preview и срок ответа. | ALY-005/006 | M1 | ContactRequest |
| US-A4-07 | Ally | Как Ally, я хочу принять, отклонить или запросить уточнение с причиной. | ALY-007 | M1 | Response transition |
| US-A4-08 | Клиент | Как клиент, я хочу получить понятный исход при decline или timeout. | CLI-001/009 | M4 | Rematch, Notification |

Swipe допускается только как mobile-жест поверх тех же команд и не создает
отдельной бизнес-семантики.

### A5. Договориться безопасно

| ID | Роль | История | Экран | Slice | Домен / контракт |
| --- | --- | --- | --- | --- | --- |
| US-A5-01 | Участник | Как участник, я хочу открыть встроенный чат только после mutual contact. | SCR-006/007 | M2 | Conversation |
| US-A5-02 | Участник | Как участник, я хочу видеть имя, описание работы и статус в заголовке чата. | SCR-007 | M2 | Conversation projection |
| US-A5-03 | Участник | Как участник, я хочу переключать original/translated message и видеть признак машинного перевода. | SCR-007 | M2 | Translation adapter |
| US-A5-04 | Участник | Как участник, я хочу получить draft Agreement из обсуждения и отредактировать его отдельно. | CLI-013/ALY-008 | M2 | Agreement version |
| US-A5-05 | Клиент/Ally | Как сторона, я хочу отдельно подтвердить текущую версию scope, срока и критериев Result. | CLI-013/ALY-008 | M2 | Party confirmation |
| US-A5-06 | Субъект данных | Как субъект данных, я хочу разрешить только конкретные контактные поля. | CLI-013/ALY-008 | M2 | Disclosure Consent |
| US-A5-07 | Система | Как система, я должна отозвать подтверждение Agreement после изменения его версии. | CLI-013/ALY-008 | M2 | Optimistic version guard |

### A6. Выполнить согласованную работу

| ID | Роль | История | Экран | Slice | Домен / контракт |
| --- | --- | --- | --- | --- | --- |
| US-A6-01 | Ally | Как Ally, я хочу начать только подтвержденный Alliance. | ALY-008 | M3 | Alliance |
| US-A6-02 | Ally | Как Ally, я хочу обновлять прогресс, следующий шаг и blocker. | ALY-008 | M3 | Work Card, Timeline |
| US-A6-03 | Клиент | Как клиент, я хочу видеть status, deadline/slot и требуемое от меня действие. | CLI-013 | M3 | Board projection |
| US-A6-04 | Участник | Как участник, я хочу предложить изменение scope без перезаписи подтвержденной версии. | CLI-013/ALY-008 | M3 | Agreement revision |
| US-A6-05 | Участник | Как участник, я хочу отменить или сообщить о проблеме с явной причиной. | CLI-013/ALY-008 | M4 | Cancellation, Ops Case |
| US-A6-06 | Система | Как система, я должна хранить значимые переходы и actor в audit timeline. | CLI-013/ALY-008 | M3 | Domain Event, Audit |

### A7. Передать и принять Result

| ID | Роль | История | Экран | Slice | Домен / контракт |
| --- | --- | --- | --- | --- | --- |
| US-A7-01 | Ally | Как Ally, я хочу передать versioned Result и evidence по согласованным критериям. | ALY-009 | M3 | Result |
| US-A7-02 | Клиент | Как клиент, я хочу сравнить expected и delivered перед решением. | CLI-014 | M3 | Result Review |
| US-A7-03 | Клиент | Как клиент, я хочу принять Result и завершить Alliance. | CLI-014 | M3 | ResultAccepted |
| US-A7-04 | Клиент | Как клиент, я хочу запросить доработку с обязательным комментарием. | CLI-014 | M3 | Rework cycle |
| US-A7-05 | Участник | Как участник, я хочу открыть dispute без удаления предыдущих версий и событий. | CLI-014/ALY-009 | M4 | Ops Case, legal hold flag |
| US-A7-06 | Ally | Как Ally, я хочу передать новую версию после rework и сохранить историю. | ALY-009 | M3 | Result version |

### A8. Оценить, повторить и управлять качеством

| ID | Роль | История | Экран | Slice | Домен / контракт |
| --- | --- | --- | --- | --- | --- |
| US-A8-01 | Клиент | Как клиент, я хочу оставить приватный quality signal после принятия Result. | CLI-015 | M3 | Feedback |
| US-A8-02 | Клиент | Как клиент, я хочу повторить запрос без копирования закрытых или устаревших данных. | CLI-015 | M3 | Repeat Request |
| US-A8-03 | Ally | Как Ally, я хочу видеть завершенную работу и разрешенный feedback. | ALY-001/008 | M3 | Alliance history |
| US-A8-04 | Пользователь | Как пользователь, я хочу получать уведомления только о требуемом действии и значимых изменениях. | SCR-005 | M4 | Notification |
| US-A8-05 | Ops | Как оператор, я хочу видеть очередь no-match, timeout, safety и dispute с audit trail. | OPS-001/002 | M4 | Ops Case |
| US-A8-06 | Администратор | Как администратор, я хочу публиковать versioned catalog, intake и matching rules. | ADM-001/002 | M4 | Configuration |

## 7. Канбан как проекция, а не workflow engine

Доска не владеет доменными статусами и не разрешает произвольный drag-and-drop.
Каждая карточка является read model над одним или несколькими агрегатами и
показывает один `nextAction`.

| Проекция | Источники | Пример nextAction |
| --- | --- | --- |
| Client Request Card | Need, Match Run, ContactRequest, Alliance, Result | `Продолжить intake`, `Смотреть Ally`, `Проверить Result` |
| Ally Work Card | ContactRequest, Agreement, Alliance, Result | `Ответить`, `Подтвердить условия`, `Передать Result` |
| Bundle Group | Request Bundle + child Needs | `Проверить разбиение`, `Открыть 1 из 3 частей` |
| Ops Card | Ops Case + ссылки на aggregate/events | `Проверить timeout`, `Рассмотреть dispute` |

Команда выполняется в detail screen через API. После успешного перехода read
model обновляет карточку. Plane, Chatwoot и Baserow не являются источником
состояния карточки.

## 8. Системные зависимости

| Capability | Нужен с | Обязательное решение |
| --- | --- | --- |
| Identity adapter | M0 | Local issuer сейчас; OIDC/Keycloak adapter позже без смены Core identity key. |
| PostgreSQL | M1 | Отдельные schemas по bounded context, migrations, optimistic versioning. |
| Outbox/domain events | M1 | Событие сохраняется в одной транзакции с aggregate; публикация асинхронна. |
| Translation adapter | M2 | Original immutable; translation versioned и помечен как machine-generated. |
| Product messenger | M2 | CIFEDRA Conversation — источник истины; Chatwoot только support/ops adapter. |
| Object storage | M3 | До D0 — только synthetic artifacts; metadata, access policy и retention обязательны. |
| Notifications worker | M4 | Idempotency, retries, user preferences, audit correlation. |
| Ops/Admin | M4 | RBAC, reason, audit и запрет скрытой подмены решений участника. |

## 9. Сквозные acceptance gates

1. Любая команда проверяет actor, ownership, текущую версию и допустимый переход.
2. ContactRequest не раскрывает телефон, email, точный адрес или artifact.
3. Conversation не открывается до взаимного принятия ContactRequest.
4. Agreement считается подтвержденным только для одной неизменной версии.
5. Disclosure применяется отдельно к каждому субъекту и набору полей.
6. Alliance не стартует до подтвержденного Agreement.
7. Result не переводит Alliance в `completed` до решения клиента.
8. Rework создает новую версию Result и сохраняет историю.
9. AI не выполняет команды подтверждения от имени клиента или Ally.
10. Каждый экран имеет loading, empty, retryable error, forbidden и stale states.
11. WEB сохраняет route после reload; mobile использует те же API и переходы.
12. Все M0–M4 сценарии используют только synthetic data до отдельного D0 gate.

## 10. Трассировка и правила декомпозиции

Для каждой истории создается цепочка:

```text
US-* -> Use Case -> FR/NFR -> Aggregate transition -> API operation
     -> Screen state -> Automated test -> Evidence
```

Обязательные поля backlog item:

| Поле | Пример |
| --- | --- |
| Story | `US-A5-05` |
| Screen | `CLI-013`, `ALY-008` |
| Use Case | `UC-AGR-02 Confirm Agreement` |
| Requirement | `AGR-FR-014` |
| API | `POST /api/v1/agreements/{id}/confirmations` |
| Event | `AgreementPartyConfirmed` |
| Tests | domain, API authorization, WEB E2E |
| Evidence | delivery evidence file and commit |

История не готова к разработке, пока не определены actor, precondition, команда,
успешный outcome, ошибки, security boundary и acceptance examples.

## 11. Следующий пакет проектирования

Следующим создается пакет Use Cases для критического пути:

1. `UC-REQ-01` Create and confirm Need;
2. `UC-REQ-02` Confirm Request decomposition;
3. `UC-MAT-01` Run matching and decide candidate;
4. `UC-CON-01` Request and accept contact;
5. `UC-MSG-01` Open conversation and send message;
6. `UC-AGR-01` Create, revise and confirm Agreement;
7. `UC-DSC-01` Grant field-level disclosure;
8. `UC-ALL-01` Start and update Alliance;
9. `UC-RES-01` Submit, accept or request rework;
10. `UC-OPS-01` Handle no-match, timeout or dispute.

После Use Cases обновляются SRS `Agreement/Messenger/Alliance/Result`, OpenAPI
`/api/v1`, state transition catalog и полная traceability matrix.
