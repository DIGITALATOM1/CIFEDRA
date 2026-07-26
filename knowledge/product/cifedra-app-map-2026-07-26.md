# CIFEDRA: карта клиентского приложения

Дата: 2026-07-26  
Версия: designed baseline v0.2  
Статус: ready for MVP decomposition  
Каналы: WEB, iOS, Android  

## 1. Назначение

Карта фиксирует информационную архитектуру и последовательность экранов
CIFEDRA Connect для ролей `Клиент`, `Ally`, автоматизированного операционного
контура и администратора.

Главный UX-принцип:

```text
Канбан = домашний экран и обзор процессов
Карточка канбана = вход в текущий шаг
Каждый сложный шаг = отдельный экран
```

Пользователь не выполняет matching, переписку, договоренность, работу и
приемку результата одновременно на одной странице.

## 2. Зафиксированные продуктовые решения

| ID | Решение | Следствие для приложения |
| --- | --- | --- |
| DEC-001 | После авторизации пользователь попадает в приложение с профилем и основной доской. | Если профиль не заполнен до минимального уровня, доска показывает блокирующий onboarding; в остальных случаях открывается роль-зависимый канбан. |
| DEC-002 | Клиент и Ally имеют собственные доски с разными процессами. | В UI есть переключатель контекста `Ищу помощь / Помогаю`, если у пользователя доступны обе роли. |
| DEC-003 | CIFEDRA использует встроенный messenger. | Chatwoot остается внутренним adapter/операционным инструментом и не показывается клиенту как отдельное приложение. |
| DEC-004 | До взаимного согласия показываются только имя и разрешенное описание работы. | Телефон, email, точный адрес и другие чувствительные данные скрыты. |
| DEC-005 | Контакты могут быть раскрыты после принятия запроса Ally, договоренности в чате и подтверждения условий обеими сторонами. | Раскрытие не происходит автоматически: обе стороны дают отдельное согласие на конкретные поля. |
| DEC-006 | Если запрос затрагивает разные направления или не существует одного Ally для всего объема, CIFEDRA предлагает декомпозицию. | Создается `Request Bundle` и несколько дочерних `Ally Request`; клиент подтверждает разбиение до matching. |
| DEC-007 | Операторский контур CIFEDRA состоит прежде всего из автоматизированных помощников. | AI может анализировать, предлагать и эскалировать, но не принимает за клиента или Ally условия, результат и раскрытие данных. |
| DEC-008 | Администрирование выполняется владельцем продукта и разрешенными автоматизированными агентами. | Все административные действия требуют RBAC, audit log и явного набора разрешений. |
| DEC-009 | Интерфейс поддерживает русский и английский, а текстовый перевод доступен в коммуникации. | Оригинал и перевод хранятся отдельно; пользователь может показать оригинал и исправить перевод. |
| DEC-010 | Локальный MVP бесплатный и не выполняет реальные платежи. | В модели сохраняются будущие payment contracts, но в UI локального MVP нет реальной оплаты. |

## 3. Роли и границы прав

| Роль | Основная цель | Может | Не может |
| --- | --- | --- | --- |
| Клиент | Найти подходящую помощь и получить подтвержденный результат. | Создавать и декомпозировать запрос; отвечать на уточнения; выбирать Ally; запрашивать контакт; общаться; подтверждать условия; отслеживать работу; принимать результат, запрашивать доработку или сообщать о проблеме; повторять запрос. | Видеть скрытые контакты и точный адрес Ally до согласия; менять профиль, доступность или результат Ally; самостоятельно переводить запрос в `completed` без Result flow. |
| Ally | Получать релевантные запросы и выполнять согласованную работу. | Настраивать профиль, услуги, географию, языки и доступность; просматривать безопасный preview; принимать, отклонять или уточнять запрос; подтверждать условия; обновлять статус; передавать результат; отвечать на feedback. | Видеть чувствительные данные клиента до разрешенного шага; менять исходную потребность клиента; принимать результат за клиента; самостоятельно менять согласованные условия. |
| AI / Операционный помощник | Снизить неопределенность, время ожидания и операционные риски. | Структурировать запрос; выявлять пробелы; предлагать декомпозицию; объяснять matching; готовить brief и draft agreement; переводить сообщения; отслеживать зависания; создавать эскалации. | Автоматически соглашаться на цену/scope; раскрывать контакты; принимать Result; отменять активный Alliance без правила и аудита; скрывать риски matching. |
| Администратор | Поддерживать работоспособность и управляемость платформы. | Управлять каталогом, схемами intake, matching rules, пользователями, модерацией, интеграциями, feature flags и аудитом в рамках выданных разрешений. | Читать переписку и чувствительные данные без служебного основания; выполнять неаудируемые изменения; использовать пользовательские данные вне согласованной цели. |

Один пользователь может одновременно иметь роли `Клиент` и `Ally`. Роль не
создает второй аккаунт: меняется только рабочий контекст и состав навигации.

## 4. Информационная архитектура

### 4.1. Публичный контур

```text
Landing
  -> О продукте
  -> Life / Work / Skills
  -> WEB application
  -> QR iOS
  -> QR Android
  -> Sign in / Register
```

### 4.2. Контур после входа

```text
Application Shell
  -> Role switch: Ищу помощь / Помогаю
  -> Board
  -> Requests
  -> Chats
  -> Notifications
  -> Profile
  -> Settings
```

### 4.3. WEB navigation

| Контекст | Основная навигация | Primary action |
| --- | --- | --- |
| Клиент | Доска, Мои запросы, Чаты, Уведомления, Профиль | `Создать запрос` |
| Ally | Доска, Входящие запросы, Чаты, Доступность, Профиль | `Обновить доступность` |
| Администратор | Очередь, Каталог, Matching, Пользователи, Интеграции, Аудит | Зависит от раздела |

На desktop навигация размещается в левой панели. В верхней панели находятся
переключатель роли, язык, уведомления и меню профиля.

### 4.4. Mobile navigation

Bottom navigation:

```text
Доска | Запросы | Чаты | Уведомления | Профиль
```

В клиентском контексте над navigation находится заметная кнопка `+ Запрос`.
На мобильном канбан отображается не горизонтальной таблицей, а вертикальными
группами по этапам с фильтром статуса. Swipe применяется только к карточкам
кандидатов и всегда дублируется явными кнопками.

## 5. Карта экранов

### 5.1. Public, Auth и общий shell

| ID | Экран | Route | Роли | Цель | MVP |
| --- | --- | --- | --- | --- | --- |
| PUB-001 | Landing | `/` | Гость | Понять продукт и перейти в WEB/iOS/Android. | Да |
| SCR-001 | Вход / регистрация | `/auth` | Гость | Создать аккаунт или войти. | Да |
| SCR-002 | Восстановление доступа | `/auth/recovery` | Гость | Восстановить пароль и сессию. | Да |
| SCR-003 | Первичный onboarding | `/onboarding` | Все | Выбрать язык, роли и заполнить минимальный профиль. | Да |
| SCR-004 | Профиль | `/app/profile` | Все | Управлять личными данными, ролями, языками и приватностью. | Да |
| SCR-005 | Центр уведомлений | `/app/notifications` | Все | Видеть ответы, изменения статуса и требуемые действия. | Да |
| SCR-006 | Список чатов | `/app/chats` | Клиент, Ally | Найти активную или завершенную переписку. | Да |
| SCR-007 | Чат | `/app/chats/:conversationId` | Клиент, Ally | Обсудить запрос, перевод и договоренность внутри CIFEDRA. | Да |
| SCR-008 | Настройки | `/app/settings` | Все | Язык, timezone, уведомления, безопасность и сессии. | Да |

### 5.2. Клиент

| ID | Экран | Route | Цель | Следующий основной шаг | MVP |
| --- | --- | --- | --- | --- | --- |
| CLI-001 | Клиентская доска | `/app/client/board` | Видеть все запросы по этапам и продолжать текущий шаг. | Зависит от карточки. | Да |
| CLI-002 | Мои запросы | `/app/client/requests` | Искать, фильтровать и открывать активные/архивные запросы. | Детали запроса. | Да |
| CLI-003 | Выбор направления | `/app/client/requests/new` | Выбрать Life, Work, Skills или описать ситуацию свободно. | Категория / AI routing. | Да |
| CLI-004 | Выбор услуги | `/app/client/requests/new/category` | Выбрать готовую услугу либо `Другое`. | Intake wizard. | Да |
| CLI-005 | Intake wizard | `/app/client/requests/new/details` | Собрать direction-specific данные и ожидаемый результат. | Декомпозиция или уточнение. | Да |
| CLI-006 | Предложение декомпозиции | `/app/client/requests/:id/split` | Подтвердить несколько дочерних запросов. | Summary каждого запроса. | Да |
| CLI-007 | Уточнение | `/app/client/requests/:id/clarify` | Ответить только на вопросы, влияющие на matching. | Summary. | Да |
| CLI-008 | Подтверждение запроса | `/app/client/requests/:id/review` | Проверить brief, приватность и разрешенные данные. | Matching. | Да |
| CLI-009 | Matching progress / No match | `/app/client/requests/:id/matching` | Понять статус поиска и варианты при отсутствии точного матча. | Matches / ожидание / корректировка. | Да |
| CLI-010 | Предложенные Ally | `/app/client/requests/:id/matches` | Сравнить shortlist и выбрать действие. | Candidate detail / contact request. | Да |
| CLI-011 | Карточка Ally | `/app/client/requests/:id/matches/:profileId` | Понять fit, риски, trust, язык, доступность и ограничения. | Сохранить / отклонить / связаться. | Да |
| CLI-012 | Запрос контакта | `/app/client/requests/:id/contact` | Подтвердить публичный brief и отправить запрос Ally. | Ожидание ответа / чат. | Да |
| CLI-013 | Карточка процесса | `/app/client/alliances/:id` | Видеть договоренность, статус, следующий шаг и историю. | Agreement / Engagement / Result. | Да |
| CLI-014 | Приемка результата | `/app/client/alliances/:id/result` | Принять, запросить доработку или открыть проблему. | Feedback / закрытие. | Да |
| CLI-015 | Feedback и повтор | `/app/client/alliances/:id/follow-up` | Дать quality signal и повторить/продолжить Alliance. | Доска. | Да |

### 5.3. Ally

| ID | Экран | Route | Цель | Следующий основной шаг | MVP |
| --- | --- | --- | --- | --- | --- |
| ALY-001 | Доска Ally | `/app/ally/board` | Видеть входящие и активные работы по этапам. | Зависит от карточки. | Да |
| ALY-002 | Профиль Ally | `/app/ally/profile` | Описать capabilities, услуги, доверие, языки и географию. | Проверка готовности. | Да |
| ALY-003 | Услуги и варианты | `/app/ally/services` | Управлять перечнем выполняемых работ и ограничениями. | Доступность. | Да |
| ALY-004 | Доступность | `/app/ally/availability` | Указать слоты, загрузку, формат и service area. | Доска. | Да |
| ALY-005 | Входящие запросы | `/app/ally/requests` | Просмотреть новые безопасные preview. | Request preview. | Да |
| ALY-006 | Preview запроса | `/app/ally/requests/:contactRequestId` | Оценить fit до раскрытия контактов. | Принять / уточнить / отклонить. | Да |
| ALY-007 | Подтверждение участия | `/app/ally/requests/:id/respond` | Зафиксировать ответ и ограничения. | Чат / закрытие. | Да |
| ALY-008 | Карточка процесса Ally | `/app/ally/alliances/:id` | Вести договоренность, выполнение и следующий шаг. | Update / Result. | Да |
| ALY-009 | Передача результата | `/app/ally/alliances/:id/result` | Передать структурированный результат и evidence. | Ожидание review. | Да |

### 5.4. Operations и Admin

| ID | Экран | Route | Цель | MVP |
| --- | --- | --- | --- | --- |
| OPS-001 | Очередь исключений | `/ops/queue` | No match, low confidence, timeout, safety, dispute. | Локальный минимум |
| OPS-002 | Карточка кейса | `/ops/cases/:id` | Видеть основание, предложения AI и audit trail. | Локальный минимум |
| ADM-001 | Каталог и intake schemas | `/admin/catalog` | Настраивать направления, категории и обязательные поля. | Локальный минимум |
| ADM-002 | Matching rules | `/admin/matching` | Управлять весами, thresholds и версиями правил. | Локальный минимум |
| ADM-003 | Пользователи и модерация | `/admin/users` | Роли, блокировки, verification и обращения. | Later |
| ADM-004 | Интеграции и аудит | `/admin/integrations` | Keycloak, Chatwoot, Plane, Baserow, translator, health и audit. | Локальный минимум |

## 6. Главные доски

### 6.1. Клиентская доска

| Колонка | Внутренние состояния | Что показывает карточка | Основной CTA |
| --- | --- | --- | --- |
| Запрос | `draft`, `clarifying`, `ready_for_match` | Направление, услуга, полнота, следующий вопрос. | `Продолжить` |
| Подбор | `matching`, `proposed`, `no_match`, `waiting` | Число кандидатов, причины задержки, обновление поиска. | `Смотреть Ally` |
| Согласование | `contact_requested`, `intro_open`, `agreement_pending` | Кто отвечает, срок ответа, неподтвержденные условия. | `Открыть чат` |
| В работе | `planned`, `in_progress`, `blocked` | Ally, следующий шаг, срок/слот, blocker. | `Открыть работу` |
| Результат | `result_submitted`, `rework_requested`, `disputed` | Что передано, срок приемки, требуемое действие. | `Проверить` |
| Завершено | `completed`, `cancelled`, `expired` | Итог, quality signal, возможность повтора. | `Повторить` |

Карточка не содержит всю форму этапа. Она показывает не более пяти данных:
название, направление, текущий статус, контрагент/поиск, следующий шаг и
deadline. Подробности открываются в отдельном экране.

### 6.2. Доска Ally

| Колонка | Внутренние состояния | Что показывает карточка | Основной CTA |
| --- | --- | --- | --- |
| Новые | `requested` | Разрешенный brief, fit, срок ответа. | `Рассмотреть` |
| Обсуждение | `accepted`, `intro_open`, `agreement_pending` | Клиент, вопросы, непринятые условия. | `Открыть чат` |
| Запланировано | `agreement_confirmed`, `planned` | Scope, слот/срок, следующий шаг. | `Начать` |
| В работе | `in_progress`, `blocked` | Прогресс, milestones, blocker. | `Обновить` |
| На приемке | `result_submitted`, `rework_requested` | Версия результата и feedback клиента. | `Открыть результат` |
| Завершено | `completed`, `declined`, `cancelled`, `expired` | Итог и причина закрытия. | `Открыть историю` |

## 7. Сквозной сценарий клиента

| Step | Экран | Действие клиента | Действие CIFEDRA | Результат |
| --- | --- | --- | --- | --- |
| 1 | SCR-001 | Регистрируется или входит. | Создает session/principal. | Авторизованный пользователь. |
| 2 | SCR-003 / SCR-004 | Подтверждает язык, роли и минимальный профиль. | Проверяет profile readiness. | Доступна роль-зависимая доска. |
| 3 | CLI-003 / CLI-004 | Выбирает направление и услугу либо описывает ситуацию. | Определяет category и confidence. | Выбрана intake schema. |
| 4 | CLI-005 | Указывает контекст, ограничения и ожидаемый результат. | Сохраняет draft и проверяет полноту. | `Ally Request draft`. |
| 5 | CLI-006 | Подтверждает или отклоняет предложенное разбиение. | Создает bundle и child requests только после подтверждения. | Один или несколько запросов. |
| 6 | CLI-007 | Отвечает на минимальные уточнения. | Формирует gaps и обновляет readiness. | `ready_for_match`. |
| 7 | CLI-008 | Проверяет summary и разрешенный preview. | Фиксирует consent snapshot. | Matching разрешен. |
| 8 | CLI-009 / CLI-010 | Ждет поиск и просматривает shortlist. | Ранжирует, объясняет fit/risks или предлагает no-match варианты. | Shortlist. |
| 9 | CLI-011 | Сохраняет, отклоняет или выбирает Ally. | Сохраняет decision. | Выбран кандидат. |
| 10 | CLI-012 | Отправляет запрос на знакомство. | Создает `Contact Request` с безопасным brief. | Ожидание Ally. |
| 11 | SCR-007 | После acceptance обсуждает детали во встроенном чате. | Переводит при необходимости; предлагает draft agreement. | Условия согласованы текстом. |
| 12 | CLI-013 | Подтверждает структурированные scope, сроки и критерии результата. | Создает `Agreement`; проверяет mutual confirmation. | `Alliance planned`. |
| 13 | CLI-013 | При необходимости отдельно разрешает раскрытие контактов. | Раскрывает только выбранные поля после двух consent. | Разрешенный обмен контактами. |
| 14 | CLI-013 | Отслеживает выполнение и изменения. | Хранит события, reminders и blockers. | `Alliance in_progress`. |
| 15 | CLI-014 | Проверяет Result. | Показывает expected vs delivered и доступные решения. | Accepted / rework / dispute. |
| 16 | CLI-015 | Оставляет feedback и выбирает повтор/продолжение. | Формирует quality signal без раскрытия закрытого контекста. | Закрытый или повторный Alliance. |

## 8. Сквозной сценарий Ally

| Step | Экран | Действие Ally | Действие CIFEDRA | Результат |
| --- | --- | --- | --- | --- |
| 1 | SCR-003 / ALY-002 | Активирует роль Ally и заполняет профиль. | Извлекает capabilities и просит подтверждение. | Profile draft/ready. |
| 2 | ALY-003 / ALY-004 | Выбирает услуги, ограничения, язык, географию и доступность. | Проверяет полноту и eligibility. | Ally доступен для matching. |
| 3 | ALY-001 / ALY-005 | Получает релевантный запрос. | Показывает только разрешенный preview и срок ответа. | `Contact Request requested`. |
| 4 | ALY-006 / ALY-007 | Принимает, уточняет или отклоняет. | Фиксирует причину и уведомляет клиента. | Accepted / declined. |
| 5 | SCR-007 | Обсуждает задачу во встроенном чате. | Передает brief, переводит и готовит agreement draft. | Общий контекст. |
| 6 | ALY-008 | Подтверждает scope, срок, результат и ограничения. | Проверяет взаимное подтверждение. | `Agreement confirmed`. |
| 7 | ALY-008 | Начинает и обновляет работу. | Хранит status events и уведомляет клиента. | `in_progress`. |
| 8 | ALY-009 | Передает Result и evidence. | Версионирует артефакт и запускает клиентскую приемку. | `result_submitted`. |
| 9 | ALY-009 | При доработке передает новую версию либо отвечает на dispute. | Сохраняет историю без перезаписи. | Accepted / rework / dispute. |
| 10 | ALY-008 | Видит feedback и завершает процесс. | Обновляет quality signals. | `completed`. |

## 9. Декомпозиция и отсутствие точного матча

### 9.1. Декомпозиция

CIFEDRA предлагает разбиение, если:

- запрос содержит несколько направлений `Life / Work / Skills`;
- услуги требуют разных обязательных capabilities;
- части имеют разные сроки, географию или формат;
- один Ally не покрывает обязательные требования.

Flow:

```text
Исходное описание
  -> AI предлагает части и объясняет причину
  -> клиент редактирует / объединяет / отклоняет
  -> клиент подтверждает
  -> Request Bundle + child Ally Requests
  -> отдельный matching и Alliance для каждой части
  -> общий прогресс виден в одной группе на доске
```

MVP не создает командный Alliance автоматически. Каждая подтвержденная часть
имеет одного выбранного Ally и собственные статусы.

### 9.2. No Exact Match

При отсутствии точного матча экран предлагает:

1. изменить один необязательный критерий с объяснением влияния;
2. посмотреть близкие варианты с явно показанными gaps;
3. разделить запрос;
4. сохранить запрос и продолжить поиск;
5. передать кейс в операционный контур.

Бюджет, обязательная компетенция, точная география и disclosure policy не
ослабляются автоматически.

## 10. Особенности направлений

| Этап | Life: уход за территорией | Work: Quick Review | Skills: подготовка к интервью |
| --- | --- | --- | --- |
| Intake | Тип участка/объекта, приблизительная зона, объем, фото, материалы, окно времени, доступ, регулярность. | Тип материала, цель review, контекст, глубина, формат результата, срок, confidentiality. | Роль/вакансия, дата интервью, текущий уровень, язык, формат, слабые зоны, CV/описание вакансии. |
| Matching | География, trust, availability, capability, материалы/транспорт. | Предметная экспертиза, тип review, домен, confidentiality, срок. | Роль, уровень, teaching/interview skill, язык, timezone, формат. |
| Agreement | Объем, цена/диапазон как mock, материалы, слот, дополнительные работы, критерий готовности. | Scope, артефакт, глубина, срок, acceptance criteria, ограничения раскрытия. | Формат сессии, длительность, темы, подготовка, язык, следующий шаг. |
| Execution | Check-in, статус прибытия, фото с consent, изменения объема, safety stop. | Передача материалов, вопросы, review, версия результата. | Слот, mock interview, заметки, feedback, practice tasks. |
| Result | Чек-лист выполнения, фото/evidence, accept/rework/incident. | Summary, critical gaps, risks, recommendations, вопросы и итоговый Markdown/PDF позже. | Feedback по компетенциям, strengths/gaps, план подготовки, следующий mock. |

Whisper и live speech translation не входят в локальный MVP. Текстовый
перевод сообщений и полей входит в client MVP через provider-neutral contract.
Календарная интеграция и Calendly не требуются для первого локального теста:
достаточно согласованного временного окна/слота в Agreement.

## 11. Данные и состояния

| Сущность | Назначение | Ключевые состояния | Владелец изменения |
| --- | --- | --- | --- |
| User Profile | Язык, timezone, роли, privacy и базовые данные. | `draft`, `ready`, `restricted`, `blocked` | Пользователь, администратор по policy |
| Ally Profile | Capabilities, услуги, trust, geography, availability. | `draft`, `pending_verification`, `active`, `paused`, `restricted` | Ally, verification/admin |
| Request Bundle | Группа декомпозированных запросов. | `draft`, `active`, `completed`, `cancelled` | Клиент, система после подтверждения |
| Ally Request / Need | Структурированная потребность. | `draft`, `clarifying`, `ready_for_match`, `matching`, `proposed`, `no_match`, `contact_requested`, `cancelled` | Клиент и Core по правилам |
| Match Run | Версия запуска matching и объяснение. | `queued`, `running`, `completed`, `failed` | Matching service |
| Candidate Decision | Решение клиента по кандидату. | `viewed`, `saved`, `rejected`, `requested_contact` | Клиент |
| Contact Request | Запрос взаимного знакомства. | `requested`, `accepted`, `declined`, `expired`, `cancelled` | Клиент/Ally по переходам |
| Conversation | Внутренняя переписка. | `draft`, `open`, `paused`, `resolved`, `failed` | Участники, система |
| Agreement | Подтвержденные условия. | `draft`, `client_confirmed`, `ally_confirmed`, `confirmed`, `revision_requested`, `cancelled` | Клиент и Ally |
| Disclosure Consent | Разрешение на раскрытие полей. | `requested`, `granted`, `declined`, `revoked` | Каждый субъект своих данных |
| Engagement / Alliance | Выполнение согласованной помощи. | `planned`, `in_progress`, `blocked`, `result_submitted`, `rework_requested`, `completed`, `cancelled`, `disputed` | Клиент/Ally по переходам |
| Result | Результат и evidence. | `draft`, `submitted`, `accepted`, `rework_requested`, `disputed` | Ally создает; клиент принимает |
| Notification | Требуемое действие или информация. | `unread`, `read`, `acted`, `expired` | Система/пользователь |
| Ops Case | Исключение или риск. | `open`, `suggested`, `in_review`, `resolved`, `dismissed` | AI/Ops/Admin по permission |

Все переходы выполняются через CIFEDRA API. UI Plane, Chatwoot и Baserow не
является источником доменных статусов.

## 12. Контракт ключевых экранов

### 12.1. Auth

- один экран с переключателем `Войти / Регистрация`;
- после регистрации обязательны подтверждение locale и минимальный профиль;
- password recovery, session expiry и ошибки не смешиваются с доской;
- успешный вход ведет на последнюю роль-зависимую доску.

### 12.2. Профиль

- верхний блок: имя, роли и profile readiness;
- вкладки: `Основное`, `Языки`, `Приватность`; для Ally дополнительно `Услуги`, `Доступность`, `Проверки`;
- неполный обязательный профиль блокирует только действия, которым нужны отсутствующие данные, а не весь просмотр приложения;
- переключение роли не требует повторного входа.

### 12.3. Board

- роль-зависимые колонки;
- фильтры: направление, status, active/archive, required action;
- карточка всегда показывает один `next action`;
- drag-and-drop не меняет доменный статус;
- изменение статуса выполняется только целевой командой внутри detail screen.

### 12.4. Intake wizard

- один вопрос/логический блок на мобильном, компактные step sections на WEB;
- auto-save draft;
- progress и возможность вернуться;
- направление можно изменить до подтверждения summary;
- AI explanation показывает, зачем нужен вопрос;
- перед matching пользователь подтверждает summary и disclosure preview.

### 12.5. Matching

- WEB: список кандидатов и detail panel;
- mobile: карточка по одной с swipe и явными кнопками;
- действия: `Отклонить`, `Сохранить`, `Связаться`;
- обязательны причины fit, gaps/risks, trust, availability, язык и ограничения;
- score не показывается как абсолютная гарантия качества.

### 12.6. Messenger и Agreement

- chat header: имя, описание работы, status и перевод;
- до consent запрещены телефон, email и точный адрес;
- сообщения показывают original/translated toggle;
- agreement draft формируется из обсуждения, но подтверждается отдельным структурированным блоком;
- изменение подтвержденных условий создает новую версию и требует повторного согласия обеих сторон.

### 12.7. Engagement

- summary договоренности;
- участники и разрешенные контакты;
- текущий status, progress, next action и deadline/slot;
- timeline значимых событий;
- artifacts/evidence;
- действия зависят от роли и status.

### 12.8. Result Review

- ожидаемый результат и критерии;
- переданный результат и версия;
- evidence/artifact;
- решения клиента: `Принять`, `Нужна доработка`, `Сообщить о проблеме`;
- обязательный комментарий для доработки/проблемы;
- после принятия предлагаются feedback, repeat и follow-up.

## 13. Основные команды и события

| Команда UI | Кто | Условие | API / domain event | Результат |
| --- | --- | --- | --- | --- |
| Register / Login | Гость | Валидные credentials | `AuthUserRegistered`, `SessionIssued` | Session |
| Complete profile | Пользователь | Обязательные поля валидны | `ProfileReadinessChanged` | Profile ready |
| Save request draft | Клиент | Есть direction или свободное описание | `AllyRequestDraftSaved` | Draft persisted |
| Confirm split | Клиент | Есть proposal и выбраны части | `RequestBundleConfirmed` | Child requests |
| Submit clarification | Клиент | Ответы валидны | `AllyRequestReadinessChanged` | Ready / more gaps |
| Run matching | Клиент/система | `ready_for_match` | `MatchRunRequested` | Shortlist / no match |
| Save/reject candidate | Клиент | Candidate показан | `CandidateDecisionRecorded` | Decision stored |
| Request contact | Клиент | Candidate selected, preview confirmed | `ContactRequested` | Requested |
| Accept/decline contact | Ally | Request active | `ContactAccepted/Declined` | Chat opens / closed |
| Send message | Клиент/Ally | Conversation open | `MessageSent` | Message persisted |
| Confirm agreement | Клиент/Ally | Current version reviewed | `AgreementPartyConfirmed` | Confirmed after both |
| Grant disclosure | Клиент/Ally | Agreement confirmed | `DisclosureConsentGranted` | Selected fields visible |
| Start engagement | Ally | Agreement confirmed, planned | `EngagementStarted` | In progress |
| Update progress | Ally | In progress | `EngagementProgressUpdated` | Timeline updated |
| Submit result | Ally | In progress | `ResultSubmitted` | Client review required |
| Accept result | Клиент | Result submitted | `ResultAccepted` | Completed |
| Request rework | Клиент | Result submitted, comment present | `ResultReworkRequested` | Rework |
| Report issue | Клиент/Ally | Active process | `OpsCaseOpened` | Dispute/safety flow |
| Repeat alliance | Клиент | Completed request | `RepeatRequestCreated` | New draft from history |

## 14. Системные состояния интерфейса

Каждый экран обязан иметь:

- loading skeleton без layout shift;
- empty state с одним полезным следующим действием;
- retryable error с сохранением введенного draft;
- forbidden state с понятным основанием;
- offline/read-only state для mobile и WEB;
- stale data warning при конфликте версии;
- translated/original state для машинного перевода;
- confirmation для отмены, раскрытия данных и необратимого закрытия;
- audit-friendly correlation ID в технических деталях ошибки.

Уведомления создаются минимум для: ответа Ally, нового сообщения, agreement
confirmation, изменения статуса, приближения deadline/slot, передачи Result,
rework, dispute и no-match update.

## 15. Что удаляется с текущего единого MVP-экрана

| Текущий блок | Новое место |
| --- | --- |
| Auth form рядом со сценарием | SCR-001 |
| Выбор pilot scenario | CLI-003 / CLI-004 |
| Полный intake и matching controls | CLI-005...CLI-010 |
| Candidate details внутри колонки | CLI-011 |
| Contact Request simulation | CLI-012 и ALY-006/007 |
| Messenger preview под доской | SCR-006 / SCR-007 |
| Start / Complete Engagement в канбане | CLI-013 / ALY-008 |
| Markdown Result прямо на доске | CLI-014 / ALY-009 |
| API/runtime diagnostics | Только `web/test-console` и Admin/Ops |

## 16. Граница локального MVP

### Входит

- local auth с подготовленной границей для Keycloak;
- профиль, роли и переключение контекста;
- отдельные клиентская и Ally-доски;
- три versioned intake schemas;
- декомпозиция с подтверждением клиента;
- clarification;
- explainable shortlist и candidate decisions;
- Contact Request и acceptance/decline;
- persistent direct product chat;
- draft/confirmation Agreement;
- consent на disclosure;
- Engagement lifecycle;
- structured Markdown Result и клиентская приемка;
- in-app notifications;
- RU/EN interface resources и contract текстового перевода;
- synthetic E2E для Life, Work, Skills;
- минимальные Ops/Admin страницы для локальной диагностики.

### Не входит

- реальные пользователи, адреса, услуги и платежи;
- production Keycloak rollout;
- marketplace billing, payouts и refunds;
- live speech translation и Whisper;
- video calls и запись;
- полноценная Calendly/calendar integration;
- автоматический multi-Ally team matching;
- публичные ratings/reviews;
- production verification, insurance и legal country rollout.

## 17. Очередность реализации

| Increment | Состав | Выход |
| --- | --- | --- |
| 1. Shell and navigation | React Router, app shell, Auth, Profile, role switch, responsive navigation. | Пользователь входит и попадает на свою пустую доску. |
| 2. Persisted request | Client Board, request list, intake, clarification, summary, decomposition. | Запрос сохраняется и готов к matching. |
| 3. Matching and mutual contact | Matches, candidate detail, decisions, Contact Request, Ally inbox/board. | Обе стороны доходят до принятого знакомства. |
| 4. Messenger and Agreement | Chat list/chat, translation state, agreement versions, mutual confirmation, disclosure consent. | Стороны договорились внутри CIFEDRA. |
| 5. Engagement and Result | Role-dependent process cards, progress, Result submission/review/rework. | Сквозной E2E завершается подтвержденным результатом. |
| 6. Quality and operations | Notifications, no-match, timeouts, Ops queue, audit, responsive/a11y E2E. | Локальный MVP устойчив к основным негативным веткам. |

## 18. Acceptance criteria карты

1. После входа пользователь видит одну роль-зависимую доску, а не инженерную
   консоль.
2. Каждый сложный этап открывается отдельным route и восстанавливается по deep
   link/reload.
3. Клиент и Ally видят разные доски, но один и тот же доменный процесс.
4. Контакты и точный адрес недоступны до acceptance, Agreement и двух consent.
5. AI не принимает человеческие решения по scope, Result и disclosure.
6. Request может быть подтвержденно декомпозирован в несколько child requests.
7. Основной lifecycle проходит в WEB и затем воспроизводится в iOS/Android
   через тот же API.
8. Plane, Chatwoot и Baserow не показываются пользователю и не владеют
   доменными статусами.
9. Все три pilot scenarios завершаются Result flow.
10. Desktop, tablet и mobile проходят E2E без единого перегруженного экрана.

## 19. Следующие аналитические артефакты

1. User Story Map по `Клиент`, `Ally`, `Ops/Admin`.
2. Use Cases для happy path, no match, decomposition, decline, timeout,
   cancellation, rework, dispute и disclosure.
3. SRS `Client Applications MVP`.
4. OpenAPI `/api/v1` и event/state transition catalog.
5. Трассировка `CJM -> Screen -> Use Case -> Functional Requirement -> API ->
   Test Case`.
6. GAP-анализ текущего Core/API/WEB относительно этой карты.
