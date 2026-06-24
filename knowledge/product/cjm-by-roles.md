# CIFEDRA CONNECT: CJM по ролям

Дата: 2026-06-20
Статус: role CJM v0.2

## Назначение

Документ восстанавливает и переносит в репозиторий ролевую CJM, которая ранее
хранилась отдельным файлом на рабочем столе. Он дополняет
[CJM по направлениям](./cjm-scenarios-gap-analysis.md) и используется как вход
в проектирование `CIFEDRA Core`.

## Роли

| Роль | Цель | Основные функции |
| --- | --- | --- |
| Гость | Понять продукт и начать сценарий без лишних действий. | Landing, выбор языка, preview сценария, регистрация. |
| Клиент | Описать потребность, выбрать человека и получить результат. | Profile, Need, Clarify, Match, Shortlist, Connect, Result. |
| Помощник / эксперт / ментор | Получать релевантные запросы и выполнять их. | Provider Profile, Availability, Offer, Accept/Decline, Execute, Result. |
| Оператор / консьерж | Обрабатывать сложные и ручные сценарии. | Queue, Triage, Manual Match, Chatwoot, Plane, Escalation, SLA. |
| Координатор / исполнитель | Вести контролируемое исполнение задачи. | Assignment, Checklist, Deadline, Artifact, Completion. |
| Администратор / модератор | Управлять доступом, безопасностью и каталогом. | RBAC, Verification, Moderation, Audit, Catalog, Integration Health. |
| Владелец организации | Управлять сотрудниками и корпоративным контекстом. | Organization, Membership, Invitations, Permissions, Company Knowledge. |

## Сквозной сценарий

```text
Discover
  -> Authenticate
  -> Complete Profile
  -> Create Need
  -> Clarify
  -> Match
  -> Decide
  -> Request Contact
  -> Accept / Decline
  -> Prepare
  -> Connect
  -> Execute
  -> Result
  -> Review / Repeat
```

Главное отличие от ранней цепочки: после клиентского выбора нужен отдельный
двухсторонний шаг `Request Contact -> Accept / Decline`. Клиентский свайп еще
не означает согласие помощника.

## CJM клиента

| Шаг | Действие | Функции ядра | Текущее покрытие |
| --- | --- | --- | --- |
| Discover | Выбирает направление, язык и сценарий. | Catalog, Locale Preference. | Catalog есть; locale отсутствует. |
| Authenticate | Регистрируется или входит. | Identity Reference, Principal, Session Claims. | Есть локальный auth-прототип. |
| Profile | Заполняет контакты, настройки, язык, timezone. | User Profile, Preferences, Consent. | Отсутствует. |
| Need | Создает потребность. | Need, category schema, draft. | Generic Need есть. |
| Clarify | Отвечает на уточняющие вопросы. | Need Completeness, Clarification Request. | Отсутствует. |
| Match | Смотрит подходящих людей и объяснение. | Match Run, Candidate, Score Breakdown. | Первая версия есть. |
| Decide | Сохраняет, отклоняет, сравнивает. | Decision, Shortlist, Undo, History. | Модель есть без persistence. |
| Request Contact | Запрашивает контакт выбранного кандидата. | Contact Request / Offer. | Отсутствует как отдельная сущность. |
| Prepare | Проверяет brief и согласие на передачу данных. | Brief, Consent, Disclosure Policy. | Brief есть; consent отсутствует. |
| Connect | Начинает чат или звонок. | Conversation, Participants, Notification. | Draft/state есть; сообщений и уведомлений нет. |
| Execute | Следит за задачей, встречей или поручением. | Engagement, Assignment, Booking, Status. | Отсутствует; есть только integration workflow. |
| Result | Подтверждает результат и следующий шаг. | Result, Outcome, Artifact, Proof. | Базовая модель есть. |
| Review / Repeat | Оценивает, сохраняет помощника, повторяет сценарий. | Review, Reputation, Favorite, Template. | Отсутствует. |

## CJM помощника / эксперта / ментора

| Шаг | Действие | Функции ядра | Текущее покрытие |
| --- | --- | --- | --- |
| Onboarding | Выбирает роль и категории помощи. | Provider Profile, Capabilities. | Только fixture Profile. |
| Verification | Подтверждает личность, опыт, портфолио. | Verification, Trust Status. | Только статические TrustSignal. |
| Availability | Задает слоты, географию, timezone и формат. | Availability, Schedule, Service Area. | Только одно поле availability. |
| Offer | Получает подходящий запрос с безопасным preview. | Contact Offer, Data Masking. | Отсутствует. |
| Decision | Принимает, отклоняет или просит уточнение. | Accept, Decline, Expire, Counterproposal. | Отсутствует. |
| Connect | Общается с клиентом или оператором. | Conversation Participant, Message, Translation. | Participant/message отсутствуют. |
| Execute | Выполняет задачу или проводит сессию. | Engagement, Checklist, Booking, Artifact. | Отсутствует. |
| Complete | Передает результат и доказательство. | Completion, Result Artifact. | Частично через Result. |
| Reputation | Получает оценку и улучшает профиль. | Review, Reputation, Quality Aggregation. | Отсутствует. |

## CJM оператора / консьержа

| Шаг | Действие | Функции ядра | Текущее покрытие |
| --- | --- | --- | --- |
| Queue | Видит новые, зависшие и рискованные обращения. | Case Queue, SLA, Assignment. | Отсутствует. |
| Triage | Проверяет полноту и риски. | Completeness, Risk Flag, Triage Decision. | Отсутствует. |
| Clarify | Запрашивает данные у клиента. | Clarification Thread, Structured Answer. | Отсутствует. |
| Manual Match | Корректирует подбор с причиной override. | Manual Candidate, Override Audit. | Отсутствует. |
| Connect | Создает Chatwoot conversation. | Integration Link, Handoff, Idempotency. | Создание есть; event sync отсутствует. |
| Execute | Создает или контролирует Plane task. | Assignment, External Task Link. | Draft adapter есть. |
| Escalate | Передает жалобу или риск модератору. | Escalation, Moderation Case. | Отсутствует. |
| Close | Фиксирует outcome и причину. | Result, Operator Note, Audit. | Базовый Result есть. |

## CJM администратора / модератора

| Шаг | Действие | Функции ядра | Текущее покрытие |
| --- | --- | --- | --- |
| Access | Назначает роли и разрешения. | Role, Permission, Policy, Membership. | Только четыре auth role. |
| Verify | Проверяет профили и документы. | Verification Case, Evidence, Decision. | Отсутствует. |
| Moderate | Обрабатывает report/block/dispute. | Report, Block, Moderation Case. | Отсутствует. |
| Catalog | Управляет направлениями и схемами. | Versioned Catalog, Need Schema. | Каталог статичен. |
| Integrations | Контролирует Plane/Chatwoot/Baserow/IdP. | Integration Registry, Health, External Ref. | Частично в diagnostics. |
| Audit | Проверяет действия и раскрытие данных. | Audit Event, Consent Trail. | Отсутствует. |

## CJM владельца организации

| Шаг | Действие | Функции ядра | Текущее покрытие |
| --- | --- | --- | --- |
| Create Organization | Создает компанию или команду. | Organization, Tenant. | Отсутствует. |
| Invite Members | Приглашает сотрудников. | Invitation, Membership. | Отсутствует. |
| Assign Roles | Разделяет права заказчика, эксперта, оператора. | Organization Role, Permission. | Отсутствует. |
| Share Knowledge | Подключает внутренние документы и экспертов. | Knowledge Source, Access Scope. | Отсутствует. |
| Review Activity | Смотрит задачи, результаты и аудит. | Organization Analytics, Audit. | Отсутствует. |

## Общие негативные ветки

Во всех CJM должны быть явно описаны:

- пользователь отменил потребность;
- помощник отклонил или не ответил;
- contact request истек;
- кандидат заблокирован или потерял verification;
- интеграция недоступна или вернула duplicate;
- задача просрочена или заблокирована;
- встреча перенесена или отменена;
- пользователь отозвал consent;
- персональные данные нельзя раскрывать;
- результат оспорен;
- язык сторон не совпадает;
- транскрипция или перевод имеют низкую уверенность;
- аккаунт, организация или сессия отключены.

## Вывод для ядра

Текущий `CIFEDRA Core` покрывает центральную часть клиентского happy path, но
пока не покрывает полноценный двухсторонний marketplace/concierge lifecycle.
Главные отсутствующие звенья:

1. `Profile`.
2. `Clarification`.
3. `ContactRequest / Offer / Acceptance`.
4. `Engagement / Assignment / Booking`.
5. `Consent / Trust / Moderation`.
6. `Notification`.
7. `Organization / Membership`.
8. `Language / Translation / Transcript`.
9. Persistence, domain events и audit.
