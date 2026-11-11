# WORK Quick Review: сценарный SRS первого E2E

Дата: 2026-11-12. Версия: 0.1. Статус: draft / proposed; не утвержден и не реализован.
Owner: System Analyst. Review: Product, Architecture, QA.

Upstream: [сценарии и приоритеты](../product/cifedra-scenarios-functional-priorities-2026-11-12.md),
[Story Map](../product/cifedra-user-story-map-mvp-2026-11-12.md),
[общие Use Case](./cifedra-mvp-critical-use-cases-2026-11-12.md).

## 1. Граница и результат

Клиент — взрослый специалист, которому нужен независимый разбор одного раздела
требований. Союзник — практик, способный проверить этот тип требований.
В первом локальном E2E используются synthetic profiles и synthetic Markdown.
Результат — список замечаний с обоснованием и приоритетом, сверенный с условиями.
Ревью не гарантирует отсутствие всех дефектов или успех проекта.

Одна работа, один клиент и один союзник; Request Bundle, группы, recurrence,
реальные платежи, публичный рейтинг и загрузка бинарных файлов вне этого среза.
Содержание Markdown хранится внутри платформы с контролем доступа; внешняя
ссылка не считается автоматически доступным или принятым артефактом.

## 2. Входные данные и схемы

Численные пределы ниже — проектные defaults для тестируемости, а не результаты исследования.

| Объект | Обязательные данные | Проверка |
| --- | --- | --- |
| Request | title, goal, subjectArea, reviewFocus, expectedDeliverable, language, deadlineAt, artifactMetadata | Непустой текст; future deadline в UTC; language поддерживается; subjectArea из versioned taxonomy |
| Request preview | title, обезличенные goal/subjectArea/focus, язык, срок, объем | Клиент видит точный preview; закрытое содержание исключено |
| Artifact | owner, Markdown body, version, content hash, synthetic marker | 1–20000 символов; immutable version; preview не содержит body |
| Ally capability | subjectAreas, reviewCapabilities, languages, availability, eligibility | Eligibility задана отдельным правилом, не выведена из AI-score |
| Agreement | requestRevision, inputArtifactVersion, scope, exclusions, criteria[], deadlineAt, deliverableFormat, compensationMode, reworkTerms | Все критерии имеют ID; due > now; synthetic_test compensation; нет платежного intent |
| Finding | id, criterionId, priority, location, observation, rationale, recommendation | priority = critical/major/minor; location ссылается на раздел/пункт входа |
| Result | agreementRevision, inputArtifactVersion, summary, findings[], coverage[], limitations | На каждый criterion есть coverage; findings может быть пустым при явном «замечаний нет» |
| Rework request | resultVersion, criterionIds[], comment | Непустой комментарий, существующие criteria; отсутствие findings само по себе не основание отказа |

Дедлайн — hard constraint. Бюджет, если собирается для интервью, не является
платежным распоряжением. При нехватке обязательных данных AI задает уточнения;
при недоступности AI клиент заполняет те же поля вручную.

## 3. Основной поток UC-WQR-01

1. Клиент создает W01 draft, добавляет synthetic-раздел и цель ревью.
2. Система валидирует вход, показывает недостающие поля и разрешенный preview.
3. Клиент подтверждает revision; система разрешает matching этой revision.
4. Matching отбирает eligible союзников по области, типу ревью, языку и сроку.
5. Клиент видит объяснение fit/gaps и отправляет одному союзнику ContactRequest.
6. Союзник видит только preview и принимает контакт; открывается чат.
7. Клиент явно разрешает выбранному союзнику читать конкретную версию артефакта.
8. Стороны согласуют и подтверждают одну версию Agreement.
9. Союзник начинает работу, видит зафиксированный input и критерии.
10. Союзник передает Result с coverage каждого критерия.
11. Клиент принимает результат либо запрашивает доработку по критерию.
12. После приемки обе стороны видят завершение; клиент может оставить приватный
    feedback и создать новый draft для повторного ревью.

Если до согласования для оценки требуется входной материал, разрешение шага 7
дает доступ только к артефакту, без контактов. Это proposed delta к общему
UC-CON-01/UC-DSC-01: текущий baseline не содержит отдельного artifact grant.

## 4. Функциональные требования

| ID | Проверяемое требование | UC / Story |
| --- | --- | --- |
| WQR-FR-01 | Система сохраняет draft и подтвержденную revision раздельно; измененный draft не запускает matching до подтверждения. | UC-REQ-01 / A2,A3 |
| WQR-FR-02 | Matching исключает кандидата при нарушении любого hard constraint; объяснение не содержит выдуманных фактов о его опыте. | UC-MAT-01 / A4 |
| WQR-FR-03 | No-match дает явный исход; клиент отдельно сохраняет поиск и включает уведомления, по умолчанию выключенные. | UC-OPS-01 / A4 |
| WQR-FR-04 | Saved search фиксирует requestRevision, expiresAt и consent; edit request приостанавливает старый поиск до повторного подтверждения. | UC-MAT-01 delta |
| WQR-FR-05 | Перед уведомлением повторно проверяются актуальность запроса, consent и eligibility; повтор события не создает второе уведомление. | UC-OPS-01 delta |
| WQR-FR-06 | Один pending контакт одному кандидату имеет срок 48 часов; accepted/cancelled/expired не принимается повторно как новый контакт. | UC-CON-01 / A4 |
| WQR-FR-07 | До accepted ContactRequest чат недоступен; после accepted он работает без раскрытия телефона/email. | UC-MSG-01 / A5 |
| WQR-FR-08 | Клиент может дать и отозвать version-specific artifact grant только выбранному участнику; новые версии не наследуют доступ автоматически. | Artifact delta |
| WQR-FR-09 | Agreement подтверждается сторонами для одного input snapshot и набора критериев; AI и Ops не подтверждают за людей. | UC-AGR-01 / A5 |
| WQR-FR-10 | Изменение draft Agreement до старта сбрасывает подтверждения; start разрешен только по взаимно подтвержденной текущей версии. | UC-AGR-01,UC-ALL-01 |
| WQR-FR-11 | Во время работы change proposal не переписывает действующие условия; submit заблокирован до принятия, отклонения или отзыва proposal. После решения Result сверяется с действующей подтвержденной версией. | UC-ALL-01 / A6 |
| WQR-FR-12 | Новый input после старта требует change proposal и нового grant; продолжение на старом input явно видно обеим сторонам. | UC-ALL-01 delta |
| WQR-FR-13 | Result содержит coverage и ссылки на Agreement/input версии; отправленная версия immutable. | UC-RES-01 / A7 |
| WQR-FR-14 | Клиент может принять только текущий submitted Result; rework требует причины и создает новый цикл без удаления истории. | UC-RES-01 / A7 |
| WQR-FR-15 | Завершение completed возможно только после client acceptance; молчание, AI и закрытие Ops Case не означают приемку. | UC-RES-01 delta |
| WQR-FR-16 | Система поддерживает cancel/issue с actor и reason, без удаления Agreement/Result; спор блокирует обычное завершение до явного решения. | UC-OPS-01 / A6,A7 |
| WQR-FR-17 | Повтор создает draft без старых grants, контактов и устаревшего дедлайна; артефакт выбирается заново. | A8 |
| WQR-FR-18 | Доска показывает domain state, due и nextAction по роли; перемещение UI вызывает проверяемую команду, не произвольную запись статуса. | A6 |

Saved search имеет обязательный expiresAt, предлагаемый default 30 дней,
продлевается клиентом; отзыв уведомлений не удаляет запрос. Это configurable
продуктовая гипотеза до интервью, требуется отдельное решение о сроках.

## 5. Статусы, команды и роли

Это проекция одной работы; Request, Contact, Agreement, Result сохраняют собственные states.

| Из | Команда / actor | В | Условие |
| --- | --- | --- | --- |
| draft | confirm / клиент | ready_for_match | Валидная revision |
| ready_for_match | run / система | matching | Confirmed revision |
| matching | finish / система | candidates_ready или no_match | Завершенный Match Run |
| no_match | save / клиент | waiting_match | Срок актуальности задан |
| waiting_match | candidate signal / система | matching | Search не expired/paused, revision подтверждена; слот и дедлайн еще актуальны |
| waiting_match | expire / система | no_match | expiresAt достигнут; подписка не продлевается автоматически |
| candidates_ready | contact / клиент | contact_pending | Eligible и актуальный кандидат |
| contact_pending | accept / союзник | discussing | До expiresAt, не cancelled |
| contact_pending | decline/expire | candidates_ready или no_match | После нового eligibility check |
| discussing | обе confirmations | planned | Одна версия, grant доступен |
| planned | start / союзник | in_progress | Confirmed Agreement, input доступен |
| in_progress | block / союзник | blocked | Reason и ожидаемое действие |
| blocked | resume / союзник | in_progress | Причина устранена, права доступа действуют |
| in_progress | submit / союзник | result_submitted | Coverage полон, нет pending change proposal |
| result_submitted | rework / клиент | rework_requested | Current version и причина |
| rework_requested | start rework / союзник | in_progress | Действующая версия условий |
| result_submitted | accept / клиент | completed | Current version, нет открытого спора |
| discussing/planned/in_progress/blocked/result_submitted/rework_requested | report issue / сторона | disputed | Создан Ops Case, previous state сохранен |
| disputed | resolve / Ops | previous state или closed_unresolved | Reason и отдельная policy; не completed |
| Любой нетерминальный, кроме disputed | cancel / сторона | cancelled | Применимая policy и reason |

Cancelled, completed, closed_unresolved терминальны. Отмена draft/поиска
не оставляет активный saved search или pending контакт. В disputed используется
resolve, а не обход через cancel. Точная resolution policy остается blocker
готовности реального пилота; synthetic E2E может проверять запрет completed.

При edit confirmed Request старый Match Run не обновляется: UI показывает draft,
активный saved search paused до нового confirmation. Если контакт уже accepted,
изменения scope идут через Agreement, а не переписывание brief принятого контакта.
Истекший deadline до контакта требует исправления Request и нового confirmation;
после Agreement — blocker/просрочка с явным решением сторон, без автоприемки.

Союзник не изменяет клиентский brief; клиент не создает Result за союзника.
Ops видит только данные, разрешенные purpose/permission; третье лицо не читает
чат, input или Result. Собственная двойная роль не позволяет принять свой запрос:
clientId != allyId для работы.

## 6. Предложения по спорным правилам

| Вопрос | Proposed правило для W01 | Следствие для baseline |
| --- | --- | --- |
| Два consent или consent владельца? | Mutual contact и confirmed Agreement являются prerequisites для прямых контактов; конкретные поля раскрываются по consent их владельца. Обмен телефонами необязателен. | Уточнить формулировку Story Map о двух consent; не выдавать ее за согласованное решение |
| Материалы до Agreement? | Отдельный grant после mutual contact на конкретный artifact/input version для оценки scope. | Добавить artifact consent UC, отделить от контактных полей |
| Administrative resolution | Ops может закрыть спор как closed_unresolved, но не принять Result. | Удалить неоднозначное исключение completed из UC-RES-01 после согласования |
| Изменение условий в работе | Подтвержденные условия immutable; proposal имеет свои confirmations. Submit блокируется до принятия/отклонения/отзыва proposal. | Уточнить active Agreement и pending revision в Core SRS |

Отзыв grant запрещает дальнейшее чтение артефакта, включая API и downloads;
сделанное ранее раскрытие отозвать фактически нельзя. Если input недоступен,
работа блокируется, Result не отправляется до восстановления разрешенного доступа.
Приемка уже переданного Result не восстанавливает отозванный input grant.

## 7. Acceptance examples и трассировка

Каждый кейс ниже — план проверки, не свидетельство выполненного теста.

| AC | Given → When → Then | Requirements |
| --- | --- | --- |
| WQR-AC-01 | Полный synthetic brief → клиент confirms → ready_for_match с revision snapshot | FR-01 |
| WQR-AC-02 | Кандидат не владеет нужным языком → matching → кандидат исключен, даже при высоком score | FR-02 |
| WQR-AC-03 | Нет fit → клиент saves без notify consent, затем меняет Request → уведомлений нет, старый поиск paused до нового confirmation | FR-03…05 |
| WQR-AC-04 | Notify consent был отозван → пришло candidate event → уведомление не отправлено | FR-05 |
| WQR-AC-05 | Контакт expired → союзник accepts → INVALID_TRANSITION, чат не открыт | FR-06,07 |
| WQR-AC-06 | Контакт accepted, grant отсутствует → союзник читает input → доступ запрещен, preview остается | FR-08 |
| WQR-AC-07 | Grant для input v1 → клиент создал v2 → v2 не читается автоматически | FR-08,12 |
| WQR-AC-08 | Клиент confirmed v1 Agreement, союзник confirmed v2 → start → запрещен | FR-09,10 |
| WQR-AC-09 | Союзник начал v1, pending scope proposal → submit → запрещен до решения proposal | FR-11 |
| WQR-AC-10 | Coverage не содержит один criterion → submit → VALIDATION_FAILED | FR-13 |
| WQR-AC-11 | Result v1 отправлен → rework с причиной → v2 сохраняет доступную историю v1 | FR-14 |
| WQR-AC-12 | Submitted v2 → клиент принимает v1 → VERSION_CONFLICT, работа не completed | FR-14 |
| WQR-AC-13 | Submitted v2, нет спора → клиент accepts дважды с одним key → один completed и одно событие | FR-15 |
| WQR-AC-14 | Клиент молчит или Ops закрывает case → проверка работы → client acceptance не создан | FR-15,16 |
| WQR-AC-15 | Grant revoked во время работы → союзник читает/submit → чтение запрещено, работа blocked | FR-08,13 |
| WQR-AC-16 | Completed → repeat → новый draft без grant, контактов и старого срока | FR-17 |
| WQR-AC-17 | Вторая роль того же пользователя → contact self → VALIDATION_FAILED | FR-06 |
| WQR-AC-18 | Сторонний user/подделанный actor в payload → чтение/accept → доступ запрещен | FR-08,14 |
| WQR-AC-19 | UI перетаскивает карточку в completed без Result → команда → INVALID_TRANSITION | FR-18 |
| WQR-AC-20 | Один Idempotency-Key с другим payload → команда → IDEMPOTENCY_CONFLICT | Все команды |

Все state changes проверяют trusted principal, membership, expectedVersion и
idempotency; audit/outbox сохраняются атомарно с изменением состояния. Уведомления
содержат безопасный route/next action, без body артефакта. Markdown выводится
через безопасный renderer без выполнения raw HTML/скриптов.

## 8. Готовность к реализации и следующий шаг

Перед реализацией согласовать proposed правила раздела 6, deadline и saved-search
policy; определить FR/NFR в shared Core, DTO, API errors, migrations и event payloads.
Текущие UC-ID переиспользуются; этот сценарный SRS не создает второй общий lifecycle.

Порядок работ: Request/input → Matching/no-match → Contact/chat/grant →
Agreement → Work/Result/rework → Ops/повтор. Каждый шаг включает domain,
API authorization/version checks, persistence и WEB для двух ролей.

Definition of Ready: для каждого FR есть AC, shared owner, контракт и экран;
для изменения state — permission и invariant; proposed conflicts имеют решение.
Definition of Done: WQR-AC-01…20 проходят на synthetic dataset, две роли завершают
позитивный E2E и доработку; сохранено evidence с commit и ограничениями.
Market Gate P0 и разрешение реального пилота этим документом не закрываются.
