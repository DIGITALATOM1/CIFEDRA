# CIFEDRA: backlog проектирования первого сценария

Дата: 2026-11-12. Статус: working. Сроки прежнего июльского roadmap исторические;
эта очередь задает зависимости, не обещание календарного запуска.

Основание: [сценарии](../product/cifedra-scenarios-functional-priorities-2026-11-12.md),
[WQR SRS](../srs/work-quick-review-scenario-spec-2026-11-12.md).

[Комплект интервью](../research/cifedra-three-scenarios-validation-kit-2026-11-12.md)
подготовлен; пустые evidence templates не являются результатами исследования.

| ID | Работа | Owner | Статус / выход | Зависит от |
| --- | --- | --- | --- | --- |
| SC-01a | Подготовить интервью трех сценариев | Research | Комплект подготовлен; реальные интервью не проведены | Desk research |
| SC-01b | Провести 5 client + 3 ally интервью на каждый сценарий | Product / Research | Не начато; обезличенные evidence и рекомендация | SC-01a, участники |
| SC-02a | Уточнить W01 до требований и AC | System | Draft готов; 18 FR, 20 AC | Сценарии |
| SC-02b | Review предложений disclosure, artifact grant, administrative closure, change proposal | Product + System + Trust | Открыто; отдельное решение по каждой строке SRS §6 | SC-02a |
| SC-02c | Обновить shared SRS и canonical Use Case / Story Map | System | Не начато; согласованные правила в одном baseline | SC-02b |
| SC-03 | Подготовить synthetic matching dataset | AI Matching + QA | Не начато; fit/no-fit по каждому hard constraint | SC-02c |
| SC-04 | Спроектировать DTO, events, API и persistence | Architecture + System | Не начато; версии, права и ошибки связаны с FR | SC-02c |
| SC-05 | Связать UX двух ролей с domain-командами | UX | Не начато; happy path/rework/no-match без подмены состояний | SC-02c |
| SC-06 | Реализовать и проверить vertical slice | Development + QA | Не начато в рамках этого пакета; evidence WQR-AC-01…20 | SC-03…05 |

Обнаруженный локальный UI-прототип и существующие Core-модули не считаются
доказательством завершения SC-06 без проверки контракта и сквозного результата.
Текущие функциональные изменения других работ оцениваются отдельным review.

Следующая техническая задача — SC-02b: review draft, затем синхронизация общих
правил перед контрактами. Исследование SC-01b может идти параллельно после набора
участников; технический synthetic E2E не требует заявлять рыночный спрос доказанным.

Точка решения о первом коммерческом сегменте остается открытой. Рекомендованный
W01 выбран по простоте проверки процесса; LIFE L01 и SKILLS S01 остаются
прототипами для проверки собственной ценности и AI-альтернатив.
