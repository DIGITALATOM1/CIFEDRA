# CIFEDRA Connect: synthesis of product-owner answers

Дата: 2026-07-26
Статус: working decision baseline v0.1
Источник: заполненная анкета
`CIFEDRA_CONNECT_open_questions_2026-07-26.docx`

## 1. Назначение

Документ переводит ответы владельца продукта из анкеты в управляемые
категории:

- `Accepted direction` - направление решения можно использовать в дальнейшем
  анализе;
- `Provisional` - рабочая гипотеза, требующая проверки;
- `Conflict` - ответ противоречит другому ответу или уже принятому решению;
- `Research required` - решение принимается после исследования;
- `Guardrail` - ограничение, которое нельзя ослаблять без отдельного
  safety/legal review.

Ответ в анкете сам по себе не становится SRS-требованием. Сначала он проходит
классификацию, проверку противоречий и фиксацию в decision log.

## 2. Product direction

### 2.1. Что подтверждено

| ID | Направление решения | Статус | Следствие |
| --- | --- | --- | --- |
| QD-001 | CIFEDRA остается human-to-human продуктом: AI помогает сформировать запрос, найти человека, вести процесс и анализировать результат. | Accepted direction | AI не подменяет согласие, исполнение, приемку и референс людей. |
| QD-002 | Минимальное обещание продукта - не только релевантное знакомство, а начало союза и управление выполнением работы. | Accepted direction | MVP должен доходить минимум до взаимного согласия и запуска работы. |
| QD-003 | Канбан-доска является основным инструментом управления работами и союзами. | Accepted direction | Board state model становится частью Core/SRS, а не только UI. |
| QD-004 | У клиента и Ally разные представления и действия на доске. | Accepted direction | Один доменный процесс получает role-specific labels, permissions и next actions. |
| QD-005 | Большой запрос может быть декомпозирован в несколько связанных карточек с разными Ally. | Accepted direction | Нужны `Request Bundle`, дочерние work cards и агрегированный прогресс. |
| QD-006 | Карточки фильтруются по `WORK`, `LIFE`, `SKILLS` и гибким автоматически назначаемым тегам работ. | Accepted direction | Нужны управляемая taxonomy, tag provenance и пользовательская корректировка. |
| QD-007 | Постоянные работы повторяют процесс по расписанию. | Accepted direction | Recurrence не реализуется копированием истории; нужен шаблон и отдельные occurrences. |
| QD-008 | Первые языки - русский и английский; следующие кандидаты - немецкий и хорватский. | Accepted direction | Locale/language остаются данными Core; запуск языков выполняется по readiness gate. |
| QD-009 | Целевой платежный сценарий проходит через платформу и внешний PSP. | Provisional | Реальные платежи начинаются только после payment/legal SRS и country gate. |
| QD-010 | В MVP не нужны отдельные family- и organization-аккаунты. | Accepted direction | Первый релиз использует личный аккаунт с ролями Client/Ally. B2B tenant остается later scope. |
| QD-011 | Бесплатная работа и обмен навыками допустимы. | Accepted direction | Agreement поддерживает monetary и non-monetary compensation types. |
| QD-012 | История и референсы кандидата участвуют в выборе. | Accepted direction | Reference disclosure требует согласия и проверки источника. |

### 2.2. Предварительный пользовательский Board

Владелец продукта предложил следующие видимые этапы:

```text
К выполнению
  -> Обсуждение исполнения
  -> В работе
  -> Выполнено
  -> Оценка
```

Для SRS эта цепочка пока является UX vocabulary, а не окончательной state
machine. Рекомендуемое разделение:

| Пользовательская колонка | Доменный смысл | Комментарий |
| --- | --- | --- |
| `Обсуждение исполнения` | `Contact accepted / Agreement drafting` | Условия еще не подтверждены обеими сторонами. |
| `К выполнению` | `Agreement confirmed / Planned` | Работа согласована, но еще не началась. |
| `В работе` | `Alliance in progress` | Допускает blocker, pause и approved change. |
| `Выполнено` | `Result submitted` | Исполнитель заявил завершение; клиент еще не принял результат. |
| `Оценка` | `Result review / Feedback` | Accept, rework, dispute, reference. |

Отдельно необходимы исключения `Cancelled`, `Expired`, `Problem`, `Disputed`
и `Archived`. Они могут быть скрыты из основного канбана, но не могут
отсутствовать в доменной модели.

## 3. Research required

Основной незакрытый выбор:

```text
Какие конкретные работы и сценарии должны войти в первый каталог
и какой один vertical slice должен стать первым реальным пилотом?
```

Владелец продукта выбрал исследовательский подход:

- изучить категории и сигналы спроса на `Профи`, `Авито`, `YouDo`,
  `LinkedIn Services` и сопоставимых площадках;
- сформировать перечни работ по `WORK`, `LIFE`, `SKILLS`;
- описать типовых клиентов и Ally;
- учитывать крупные запросы, которые декомпозируются на несколько карточек;
- скорректировать CJM после выбора наборов работ.

Исследование описано отдельно:
[marketplace taxonomy research plan](../research/cifedra-marketplace-taxonomy-research-plan-2026-07-26.md).

## 4. Противоречия и решения до SRS

| ID | Противоречие | Текущее правило |
| --- | --- | --- |
| QC-001 | В одном ответе платят обе стороны, в итоговом блоке - только клиент. | Pricing side остается открытой гипотезой. Не реализовывать billing до эксперимента. |
| QC-002 | `Result` одновременно назван сделкой, оплатой, выполнением работы и покупкой дополнительных карточек. | Разделить `Transaction Result`, `Work Result` и `Platform Business Outcome`. |
| QC-003 | `Active Alliance` назван платным «до agreement», хотя союз до agreement еще не активен. | Лимит потребляется не раньше взаимного подтверждения Agreement; правило проверяется pricing experiment. |
| QC-004 | В анкете предлагается сразу показывать адрес, а `DEC-028` скрывает точный адрес до взаимного согласия. | Действует `DEC-028`. Раннее раскрытие адреса запрещено до отдельного safety/legal решения. |
| QC-005 | LIFE предлагается не ограничивать, но проект не имеет verification, moderation, incident и insurance baseline. | Каталог гипотез может быть широким; реальный pilot enablement - только по safety tiers. |
| QC-006 | Предлагаются две версии системы для `.ru` и `.com`. | Рекомендуется один codebase и одна доменная модель с country configuration, feature flags и deployment isolation при необходимости. |
| QC-007 | Verified Help подтверждается только исполнителем. | Self-attestation недостаточно; нужен минимум client confirmation или evidence/dispute rule. |
| QC-008 | Ответственность за LIFE-ущерб полностью возложена на исполнителя. | Это коммерческая гипотеза, а не юридическое заключение. Требуется jurisdiction-specific review. |
| QC-009 | Хранить все артефакты активных пользователей бессрочно. | Нужны purpose limitation, retention classes, user deletion и legal hold; единый срок для всех данных не принимается. |
| QC-010 | Organization account не нужен, но описана корпоративная доска с множеством исполнителей. | Organization/B2B фиксируется как post-MVP capability, не как функция первого личного аккаунта. |

## 5. Guardrails

Следующие ограничения действуют до появления подтвержденного решения:

1. Не показывать точный адрес, прямые контакты и чувствительные материалы до
   разрешенного шага mutual consent.
2. Не запускать реальные LIFE-категории без risk tier, verification,
   moderation, incident и refund rules.
3. Не проводить реальные платежи и резервирование средств до legal role
   analysis, PSP selection, refund/dispute flow и fiscal/tax review.
4. Не создавать отдельные продуктовые codebase для `.ru` и `.com`.
5. Не считать число исполнителей на площадке доказательством спроса.
6. Не превращать каждую карточку доски в отдельный платный союз без защиты от
   искусственной декомпозиции.
7. Не считать односторонний отзыв подтвержденной помощью.
8. Не смешивать результат работы, статус платежа и выручку CIFEDRA.

## 6. Decision gates

### Gate P0 - scenario selection

Для закрытия:

- собрана taxonomy работ по трем направлениям;
- есть минимум два независимых сигнала спроса на shortlisted scenario;
- описаны client/Ally profiles;
- оценены human value, AI substitutability, safety, payment и pilot effort;
- выбраны 3 prototype scenarios и 1 primary vertical slice.

### Gate P1 - process baseline

Для закрытия:

- утверждены user-facing board columns и domain state machine;
- определены `Request Bundle`, work card, Agreement, Alliance и Result;
- описаны recurrence, decomposition и tags;
- негативные сценарии имеют явные переходы, а не только «возврат на шаг назад».

### Gate P2 - commercial baseline

Для закрытия:

- устранено противоречие payer side;
- проверена ценность трех бесплатных карточек и платного расширения;
- определено, что именно занимает лимит;
- сформированы unit economics и anti-gaming rules;
- payment/legal gate разрешает выбранную страну.

## 7. Следующие изменения документации

После Gate P0:

1. обновить продуктовый CJM и scenario families;
2. закрыть или перевести в experiments открытые вопросы;
3. обновить decision log;
4. подготовить общий Core SRS и direction-specific deltas;
5. синхронизировать HLD, OpenAPI, backlog и UX map.
