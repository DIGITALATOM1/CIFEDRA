# Work / SRS Review Interview Kit

Дата: 2026-06-21
Статус: ready for recruitment v0.2

## 1. Цель

Проверить:

- повторяется ли проблема independent SRS review;
- кто испытывает ее сильнее;
- как ее решают сейчас;
- какой результат считают полезным;
- какие confidentiality/trust barriers существуют;
- готовы ли клиенты и эксперты участвовать в pilot.

Интервью не являются продажей и не подтверждают спрос без recent behavior and
concrete commitment.

## 2. Target schedule

| Slot | Роль | Целевая дата | Participant | Статус |
| --- | --- | --- | --- | --- |
| INT-C01 | Client | 2026-06-23 | TBD by product owner | recruitment required |
| INT-C02 | Client | 2026-06-25 | TBD by product owner | recruitment required |
| INT-E01 | Owner expert workshop | 2026-06-26 | Product owner | confirmed |
| INT-C03 | Client | 2026-06-29 | TBD by product owner | recruitment required |
| INT-E02 | Independent expert | After sprint or if available | TBD | optional for current sprint |

Не хранить телефоны, email или полные имена в этом Git-репозитории. Контакты
остаются в личном календаре/контактном инструменте владельца продукта.

## 3. Client screener

Подходит participant, который за последние 6 месяцев:

- создавал, проверял или принимал SRS/requirements;
- передавал требования в разработку или оценку;
- сталкивался с пропусками, неоднозначностями or rework;
- может обсуждать процесс без раскрытия confidential content.

## 4. Client interview

Вступление:

> Мы исследуем процесс проверки требований перед разработкой. Нужен рассказ о
> вашем реальном опыте, а не оценка готового продукта. Не называйте
> конфиденциальные данные и не передавайте документы.

Основные вопросы:

1. Расскажите о последнем SRS, который вы передавали в разработку или
   проверяли. Что происходило перед передачей?
2. Какие проблемы в требованиях обнаружились поздно и к каким последствиям
   это привело?
3. Кто и как сейчас выполняет review, сколько это занимает и почему этот
   способ не всегда работает?
4. Как должен выглядеть результат review, чтобы вы использовали его в работе?
5. Что должно быть правдой, чтобы вы доверили review внешнему эксперту?

Уточнения:

- urgency and frequency;
- критерии critical/major finding;
- confidentiality and conflict of interest;
- preferred turnaround;
- кто принимает решение и оплачивает;
- готовность попробовать на synthetic/redacted example;
- price sensitivity без предложения фиксированной цены.

## 5. Expert screener

Подходит participant, который:

- имеет senior-level опыт системного/бизнес-анализа или архитектуры;
- регулярно проверял требования других специалистов;
- способен показать методику без раскрытия клиентских материалов;
- готов обсуждать acceptance, confidentiality and decline reasons.

В текущем sprint owner expert workshop используется для описания method,
inputs, effort and result. Он не считается независимым подтверждением качества
или доступности supply.

## 6. Expert interview

Основные вопросы:

1. Расскажите о последнем review требований, которое вы проводили. Как вы
   определяли scope?
2. Какие входные данные обязательны, чтобы начать, и когда нужно отказать или
   запросить уточнение?
3. Как вы классифицируете замечания и доказываете заказчику их важность?
4. Какой artifact вы отдаете и по каким признакам считаете review завершенным?
5. Какие confidentiality, conflict-of-interest, effort and compensation
   условия нужны для участия в pilot?

Уточнения:

- availability and turnaround;
- supported domains and languages;
- quick versus full review;
- rework policy;
- quality review of the reviewer;
- willingness to accept a synthetic pilot case.

## 7. Invitation templates

Client:

> Исследую сервис независимого ревью SRS перед передачей в разработку. Нужен
> 30-минутный разговор о вашем реальном процессе и проблемах. Документы и
> конфиденциальные данные не нужны. Удобно обсудить на следующей неделе?

Expert:

> Исследую формат экспертного ревью SRS. Нужен 30-минутный разговор о входных
> данных, методике, результате и условиях участия эксперта. Реальные документы
> передавать не будем. Удобно обсудить на следующей неделе?

## 8. Consent and notes

Перед началом:

1. объяснить цель;
2. подтвердить, что confidential details не нужны;
3. спросить разрешение на notes;
4. отдельно спросить разрешение на recording, если оно требуется;
5. сообщить, что participant может остановить разговор и запросить удаление.

Notes template:

```text
Participant code:
Role / context:
Date:
Consent: notes yes/no; recording yes/no

Recent case:
Trigger:
Current alternative:
Pain and consequence:
Expected useful result:
Trust/confidentiality:
Time and price signal:
Pilot commitment:

Direct evidence:
Interpretation:
Open questions:
```

## 9. Evidence rules

- мнение без recent case не считается подтверждением;
- "интересно" не равно willingness to pilot/pay;
- фиксировать verbatim meaning коротким paraphrase, не хранить лишние цитаты;
- не менять scope после одного интервью;
- synthesis выполняется после минимум трех client interviews;
- все решения переносятся в
  [decision log](../delivery/decision-log.md).
