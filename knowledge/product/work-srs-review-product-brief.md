# CIFEDRA Work: SRS Review Product Brief

Дата: 2026-06-20
Статус: provisional scope v0.1
Период проверки: 2026-06-22 - 2026-07-03

## 1. Product hypothesis

Первый проверяемый сценарий CIFEDRA:

```text
Work / Expert Help / SRS Review
```

Рабочая гипотеза:

> Системному аналитику или руководителю разработки нужно быстро проверить SRS
> перед передачей в разработку, чтобы найти критичные пробелы, риски и
> неоднозначности раньше, чем они превратятся в переделки.

Первичный оффер для discovery:

```text
Quick SRS Review
```

`Full Review` остается альтернативой для проверки на интервью и не входит в
обязательный scope первого Core increment.

### Проверяемые параметры Quick Review

Это hypotheses, а не публичные обязательства:

- один SRS ориентировочно до 20-25 страниц;
- один рабочий день после получения достаточного контекста;
- проверка полноты, однозначности, непротиворечивости, тестируемости,
  acceptance criteria, data, integrations, NFR and open decisions;
- прямое редактирование или переписывание документа является отдельной
  услугой.

## 2. Primary segment

Provisional ICP:

- lead/system analyst;
- product or delivery manager;
- engineering lead or founder небольшой software-команды;
- имеет SRS/requirements artifact перед оценкой или началом разработки;
- не имеет доступного независимого senior reviewer либо хочет second opinion.

Первый discovery не разделяется по отрасли. Отраслевой фокус выбирается только
при наличии повторяющегося evidence.

## 3. Trigger and job

Основной trigger:

- требования собираются перед передачей в разработку;
- есть риск неполноты, противоречий или неверной трактовки;
- внутренняя команда не может провести независимое review в нужный срок.

Job to be done:

> Когда SRS готовится к передаче в разработку, я хочу получить независимое
> структурированное review, чтобы устранить самые дорогие неопределенности до
> оценки и реализации.

## 4. Provisional offer

### Вход

- роль заказчика и контекст проекта;
- стадия документа;
- цель review;
- ожидаемый срок;
- тип системы и аудитория;
- synthetic/redacted фрагмент или описание структуры на discovery;
- критерии, которые заказчик считает важными.

До `D0 - Real Data Pilot Readiness` реальные confidential SRS не принимаются.

### Результат

Структурированный review artifact:

1. verdict `ready / ready with changes / not ready`;
2. executive summary;
3. findings по severity;
4. место, проблема, влияние and recommendation;
5. отсутствующие или неоднозначные требования;
6. пять главных рисков для разработки, тестирования и эксплуатации;
7. вопросы, требующие business decision;
8. рекомендуемый порядок исправлений.

### Severity baseline

| Уровень | Значение |
| --- | --- |
| Critical | Требование может привести к неверной реализации, существенному риску или невозможности приемки. |
| Major | Существенный пробел или неоднозначность, требующие решения до разработки. |
| Minor | Улучшение точности, структуры или проверяемости без немедленного блокирования. |
| Note | Рекомендация или вопрос для последующего развития документа. |

Severity model проверяется на интервью и не считается финальной методикой.

## 5. Product workflow hypothesis

Будущий product flow, который проверяется вопросами и synthetic examples:

```text
Client request
  -> structured intake
  -> clarification
  -> manual expert shortlist
  -> expert acceptance
  -> synthetic/redacted review
  -> structured result
  -> feedback
```

Этот flow не является техническим scope текущего спринта.

### Sprint implementation boundary

Обязательный технический increment заканчивается здесь:

```text
Identity
  -> Profile
  -> Work Intake
  -> Clarification
  -> Ready for Match
```

После этого можно только продемонстрировать существующий fixture match.
`ContactRequest`, expert acceptance, Engagement and Result implementation
планируются следующими increments.

### Manual research boundary

Разрешенный процесс текущих двух недель:

```text
Interview
  -> anonymized problem description
  -> synthetic/redacted Need
  -> Intake
  -> Clarification
  -> Ready for Match
  -> existing fixture match simulation
  -> feedback
```

Правила:

- CIFEDRA Core остается владельцем product state;
- simulated/manual choice не отправляет реальный offer or contact request;
- Chatwoot/Plane не являются обязательным UI пользователя;
- реальные документы и контакты не передаются до legal/privacy gate;
- попытка передать реальный документ останавливает walkthrough;
- interview feedback фиксируется как research evidence, а не Result услуги.

## 6. In scope

- один сценарий `Work / SRS Review`;
- client and expert roles;
- profile data, необходимые для review;
- structured intake and clarification;
- readiness before matching;
- existing fixture match simulation after readiness;
- structured result definition;
- synthetic/redacted walkthrough;
- product and operational metrics draft.

## 7. Out of scope

- полное переписывание SRS экспертом;
- юридическая, финансовая или сертификационная экспертиза;
- security audit or penetration test;
- code review, architecture implementation or development estimate;
- гарантии отсутствия дефектов или успешной реализации;
- production file storage and confidential document exchange;
- ContactRequest, expert acceptance, Engagement and Result implementation;
- payment, payout, refund and dispute automation;
- direct product chat, video or calendar booking;
- `Life`, `Skills` and organization-wide knowledge scenarios.

## 8. Success signals

Discovery signals:

- минимум 3 client interviews and 2 expert interviews;
- участники описывают недавний реальный случай, а не только мнение;
- повторяются причины и последствия плохого SRS;
- понятен ожидаемый review artifact;
- минимум 2 эксперта считают workflow исполнимым;
- есть конкретный willingness-to-pilot or willingness-to-pay signal.

Outcome signals:

- клиент исправил или принял решение минимум по одному существенному finding;
- artifact понятен без обязательной устной расшифровки;
- клиент считает, что review снизил риск rework or uncertainty;
- эксперт укладывается в предсказуемый effort;
- клиент готов повторить, рекомендовать или обсуждать оплату.

Technical signals:

- synthetic flow проходит от Identity/Profile до ready-for-match;
- incomplete Need блокируется до Clarification;
- privileged actions защищены;
- Core contract and tests соответствуют SRS;
- CI and PostgreSQL spike воспроизводимы.

## 9. Non-goals for the sprint

Текущий спринт не подтверждает:

- product-market fit;
- финальную цену;
- публичный launch scope;
- production security;
- готовность принимать реальные документы;
- готовность mobile/WEB applications.

## 10. Open decisions

| Решение | Baseline | Кто подтверждает | Срок |
| --- | --- | --- | --- |
| Primary offer | Quick Review. | Владелец продукта после первых интервью. | 2026-06-26 |
| Primary client segment | System/lead analysts and delivery/engineering leads. | Владелец продукта. | 2026-06-23 |
| Geography and language | Russian-speaking discovery, geography open. | Владелец продукта. | 2026-06-23 |
| Turnaround promise | Не обещать до интервью. | Владелец продукта. | 2026-07-02 |
| Artifact format | Structured Markdown/PDF concept. | Владелец продукта. | 2026-07-02 |
| Pricing | Не фиксировать до evidence. | Владелец продукта. | После sprint R0 |

## 11. Traceability

- [CJM scenarios](./cjm-scenarios-gap-analysis.md);
- [Product and go-to-market plan](./cifedra-product-design-go-to-market-plan.md);
- [Two-week execution plan](../system/cifedra-two-week-execution-plan-2026-06-22.md);
- [Sprint backlog](../delivery/sprint-2026-06-22-backlog.md);
- [Interview kit](../research/work-srs-review-interview-kit.md).
