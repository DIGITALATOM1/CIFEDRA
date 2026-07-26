# CIFEDRA Connect: marketplace taxonomy research plan

Дата: 2026-07-26
Статус: executable research plan v0.1
Горизонт первого цикла: 5 рабочих дней

## 1. Цель

Сформировать evidence-based список работ по направлениям `WORK`, `LIFE`,
`SKILLS`, выбрать по одному prototype scenario на направление и один primary
vertical slice для реализации и контролируемого пилота.

Исследование отвечает не только на вопрос «что популярно», но и на вопросы:

- где человеку действительно нужен другой человек, а не только AI;
- какие запросы повторяются;
- есть ли доступный supply;
- можно ли проверить результат;
- какой уровень safety/legal/payment сложности;
- можно ли выполнить сценарий через общий CIFEDRA lifecycle.

## 2. Ограничение данных

Каталог площадки и количество профилей показывают breadth и supply, но не
доказывают реальный спрос. Метка `popular`, число созданных заданий, частота
новых запросов, поисковые подсказки и интервью являются разными сигналами и не
должны смешиваться в одну метрику без provenance.

## 3. Источники первого цикла

| Источник | Рынок | Что извлекаем | Ограничение |
| --- | --- | --- | --- |
| [Профи](https://profi.ru/) | RU | Категории, подкатегории, provider density, отзывы, варианты услуг. | Публичный каталог не дает точный спрос по каждой категории. |
| [Авито Услуги](https://www.avito.ru/rossiya/uslugi) | RU | Категории объявлений, география, цены, supply и формулировки. | Объявления являются supply proxy; часть данных персонализирована. |
| [YouDo](https://youdo.com/) | RU | Категории заданий, request language, отклики, payment/safety patterns. | Доступность счетчиков и запросов зависит от интерфейса и региона. |
| [LinkedIn Services](https://www.linkedin.com/services/browse) | International | WORK/SKILLS taxonomy, provider counts, proposals, trust through profile/network. | Provider count не равен demand; категории пересекаются. |
| [TaskRabbit Featured Tasks](https://www.taskrabbit.com/services/featured) | International | Featured LIFE tasks, booking, schedule, review и payment patterns. | Популярность зависит от города и локального supply. |

Дополнительные источники подключаются только с явным описанием provenance,
даты и допустимого способа сбора. Исследование не собирает персональные данные
исполнителей и не обходит технические ограничения площадок.

## 4. Единица анализа

Каждая наблюдаемая работа нормализуется в `Service Candidate`:

| Поле | Назначение |
| --- | --- |
| `source` | Площадка и URL. |
| `source_category` | Исходное название категории. |
| `normalized_job` | Нормализованная работа CIFEDRA. |
| `direction` | `WORK`, `LIFE`, `SKILLS`. |
| `request_examples` | Обезличенные паттерны формулировок. |
| `client_segment` | Кто обычно инициирует запрос. |
| `ally_profile` | Какой человек способен помочь. |
| `format` | Online, offline, hybrid. |
| `frequency` | One-off, recurring, continuous. |
| `result_type` | Проверяемый результат. |
| `demand_signals` | Наблюдаемые признаки спроса с provenance. |
| `supply_signals` | Наблюдаемые признаки supply. |
| `human_value` | Что требует действия, доверия, ответственности или живой обратной связи. |
| `ai_substitutability` | Low, medium, high с объяснением. |
| `safety_tier` | Low, medium, high, prohibited-for-pilot. |
| `payment_complexity` | None, simple, escrow/refund, regulated. |
| `decomposition_patterns` | Возможные дочерние work cards. |

## 5. Scoring

Для shortlist используется шкала 0-5:

| Критерий | Вес |
| --- | ---: |
| Demand evidence | 25% |
| Human value / устойчивость к AI-замещению | 20% |
| Supply availability | 15% |
| Result verifiability | 10% |
| Repeat potential | 10% |
| Payment willingness proxy | 10% |
| Pilot simplicity and safety | 10% |

`High AI substitutability`, критический safety-риск или регулируемая услуга
могут исключить сценарий из пилота независимо от итогового score.

## 6. Рабочие гипотезы для первичной taxonomy

Это seed list, а не вывод о популярности.

### LIFE

- уборка и помощь по хозяйству;
- сборка мебели;
- мелкий домашний ремонт;
- переезд, упаковка и перенос вещей;
- помощь с участком;
- поручения рядом;
- установка и настройка бытовой техники.

### WORK

- бизнес- и предметная консультация;
- project/task execution;
- дизайн и подготовка визуальных материалов;
- маркетинг и продвижение;
- virtual/administrative assistance;
- бухгалтерская и документальная помощь;
- разработка, тестирование и техническая поддержка.

### SKILLS

- подготовка к интервью;
- карьерная консультация;
- resume/profile review;
- предметное менторство;
- обучение прикладному навыку;
- публичные выступления и коммуникация;
- peer practice и feedback.

## 7. План на 5 дней

| День | Работа | Артефакт | Acceptance |
| --- | --- | --- | --- |
| 1 | Снять taxonomy и UX patterns с RU-площадок. | Source matrix RU. | Для каждой категории есть URL, дата и provenance. |
| 2 | Снять taxonomy и UX patterns с international-площадок. | Source matrix International. | Категории сопоставлены без ложного вывода о demand. |
| 3 | Нормализовать работы и разложить по направлениям. | Service Candidate dataset. | Дубликаты объединены, спорные направления размечены. |
| 4 | Оценить human value, AI substitutability, safety, result и pilot effort. | Scored shortlist. | Score имеет evidence note и reviewer. |
| 5 | Сформировать top candidates, personas и recommendation. | Research synthesis. | Выбраны 5 кандидатов на направление, 3 prototype scenarios и рекомендация primary vertical. |

## 8. Проверка спроса после desk research

Desk research формирует shortlist, но не закрывает demand gate. Для каждого из
трех prototype scenarios:

1. провести минимум 5 problem interviews со стороной спроса;
2. провести минимум 3 supply interviews;
3. получить минимум 3 реальных обезличенных формулировки недавних задач;
4. проверить готовность перейти к знакомству и обсуждению условий;
5. зафиксировать willingness-to-pay signal;
6. измерить, сколько ручной работы требует concierge match.

## 9. Выходные артефакты

Планируемые файлы:

- `knowledge/research/cifedra-service-candidate-dataset-2026-07.csv`;
- `knowledge/research/cifedra-marketplace-source-matrix-2026-07.md`;
- `knowledge/research/cifedra-scenario-shortlist-2026-08.md`;
- direction-specific interview scripts;
- research evidence summary для Gate P0.

## 10. Gate P0

Gate закрывается, если:

- taxonomy покрывает `WORK`, `LIFE`, `SKILLS`;
- top candidates имеют минимум два типа demand evidence;
- есть отдельная оценка human value и AI substitutability;
- high-risk LIFE не попадает в реальный pilot без safety readiness;
- выбран один primary vertical slice;
- остальные сценарии остаются catalog/research scope, а не одновременно
  реализуемым MVP.
