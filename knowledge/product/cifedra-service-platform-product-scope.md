# CIFEDRA CONNECT: Product Scope

Дата: 2026-06-21
Статус: strategic product baseline v0.2

## 1. Product vision

CIFEDRA помогает любому пользователю найти подходящего исполнителя или
эксперта для потребности в одном из направлений:

```text
Life
Work
Skills
```

Целевой lifecycle включает все важные шаги:

```text
Register / Login
  -> Profile
  -> Need Intake
  -> Clarification
  -> Match / Shortlist
  -> Client Decision
  -> Provider Acceptance
  -> Consent / Context Transfer
  -> Communication
  -> Engagement / Execution
  -> Result / Artifact
  -> Feedback / Repeat
```

Все шаги учитываются в архитектуре и CJM. Они реализуются последовательными
vertical increments, а не одновременно в одном спринте.

## 2. Target audience

Клиентом может быть любой пользователь с потребностью в услуге по направлениям
`Life`, `Work` or `Skills`.

Платформа не ограничивает аудиторию профессиональной ролью или отраслью.
Ограничения применяются на уровне:

- категории услуги;
- online/offline format;
- geography and service area;
- language;
- trust and verification policy;
- legal/safety availability;
- capability and availability исполнителя.

## 3. Initial local pilot scenarios

Локально проверяются три scenario families:

| Direction | Scenario | Service variants / focus | Delivery assumption |
| --- | --- | --- | --- |
| Life | Outdoor home maintenance | Pool cleaning, lawn mowing. | Future in-person service; local pilot is synthetic only. |
| Work | Expert Help / SRS Review | Quick Review only in local pilot; broader system-analysis consulting is later. | Online. |
| Skills | Interview preparation | Mock interview, feedback and preparation plan. | Online. |

Владелец продукта выступает первым Work-экспертом. Life and Skills provider
profiles остаются synthetic fixtures до отдельной supply verification.

Локальный pilot проверяет один общий lifecycle и три versioned Need schemas.
Он не является market pilot и не использует реальные услуги, документы,
клиентов, адреса или платежи.

## 4. Languages and geography

Baseline:

- интерфейс: русский and English;
- geography: стратегически без глобального ограничения;
- timezone and locale хранятся в Profile;
- Need содержит original language and preferred communication language;
- Profile содержит spoken languages;
- matching сначала учитывает возможность прямой коммуникации;
- text translation помогает коммуникации, но не заменяет language/trust rules.

Для production rollout география все равно включается поэтапно после legal,
payment, support and safety readiness. Формулировка "без ограничений" означает
целевую архитектуру, а не одновременный публичный launch во всех странах.

## 5. Translation scope

### Required for client MVP

1. Resource-based Russian/English UI localization.
2. `LanguageCode`, locale, timezone and spoken/preferred languages.
3. Provider-neutral `TextTranslationProvider`.
4. Перевод текстовых Need/Profile/Clarification/communication fields.
5. Хранение original and translated content separately.
6. Явная маркировка machine translation.
7. Возможность показать оригинал и исправить перевод.
8. Confidence/error state and manual fallback.

Runtime online text translation is required for client MVP, but the current
Core P0 increment implements only language metadata and provider-neutral
contracts. Translation provider integration follows after the Core schemas.

### Later

- full document translation;
- terminology glossaries by service category;
- voice input and Whisper transcription;
- live speech translation;
- speech-to-speech.

Whisper не является text translator. Для локального text translation spike
используется отдельный adapter; Argos Translate остается первым offline
candidate.

## 6. First supply model

На первом локальном pilot:

- владелец продукта выступает Work-экспертом;
- Life and Skills providers are synthetic fixtures;
- matching с несколькими реальными экспертами не проверяется;
- текущие expert fixtures используются только для simulation;
- recruitment независимых экспертов переносится после проверки intake and
  service result;
- self-review владельца продукта не считается независимым подтверждением
  supply economics or quality.

## 7. Selection and communication

Accepted baseline:

- Core returns an explainable shortlist;
- client explicitly selects a provider;
- swipe may be used in mobile as a presentation/navigation pattern;
- swipe never changes the underlying decision semantics;
- provider contacts remain hidden until mutual match: client selects and
  provider accepts the request;
- first communication uses concierge flow through CIFEDRA with Chatwoot
  adapter;
- direct chat is a later product increment.

## 8. Commercial model

Local pilot is free and uses no real payments.

Future platform monetization hypothesis requested by the product owner:

- users/companies offering services pay CIFEDRA;
- demand-side users do not pay CIFEDRA for access;
- payment for the underlying service and the exact provider charging model
  remain separate open decisions;
- subscription, lead fee, commission and promoted placement require later
  pricing/legal experiments.

This direction is not product-evidence or legal approval and shall not freeze
payment architecture.

## 9. Scope governance

Стратегический scope широкий, но каждый increment обязан иметь:

- один primary scenario;
- явный entry and exit state;
- acceptance criteria;
- supported languages/formats;
- safety and privacy boundary;
- synthetic test before real data;
- решение о том, какие следующие lifecycle steps разблокированы.

В одном increment можно проверить несколько category schemas, только если они
используют один lifecycle and generic schema engine. Direction-specific
business flows after `ready_for_match` остаются отдельными increments.

## 10. Current implementation boundary

Текущий двухнедельный increment:

```text
Identity
  -> Profile
  -> Need Intake
  -> Clarification
  -> Ready for Match
```

В него входят language metadata for Russian/English and three schema
configurations. Runtime translation, provider acceptance, execution and result
остаются следующими increments.

## 11. Open product questions

1. Life — это одна category `Outdoor maintenance` с двумя service variants или
   две независимые categories после pilot?
2. Подтверждаем ли правило: один Life Need содержит только одну service variant?
3. Как клиент подтверждает полезный Result для каждого из трех направлений?
4. За что именно provider платит платформе: subscription, lead, commission or
   promoted placement?
5. Платит ли клиент исполнителю через CIFEDRA в будущем или напрямую?
6. Какие provider verification rules обязательны для Life?

## 12. Related documents

- [SRS Review validation brief](./work-srs-review-product-brief.md);
- [CJM scenarios](./cjm-scenarios-gap-analysis.md);
- [Languages, translation and voice](../system/multilingual-voice-plan.md);
- [Two-week execution plan](../system/cifedra-two-week-execution-plan-2026-06-22.md).
