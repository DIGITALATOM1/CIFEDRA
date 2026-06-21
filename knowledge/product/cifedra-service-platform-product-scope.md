# CIFEDRA CONNECT: Product Scope

Дата: 2026-06-21
Статус: strategic product baseline v0.1

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

## 3. Initial validation scenario

Первый сценарий:

```text
Work / Expert Help / SRS Review
```

Причина выбора: владелец продукта может выступить первым экспертом и проверить
операционный flow без преждевременного набора supply.

Это не ограничивает целевой продукт только системным анализом. Сценарий нужен
для проверки общего lifecycle и подготовки платформенных contracts.

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

На первом проверочном сценарии:

- владелец продукта выступает экспертом;
- matching с несколькими реальными экспертами не проверяется;
- текущие expert fixtures используются только для simulation;
- recruitment независимых экспертов переносится после проверки intake and
  service result;
- self-review владельца продукта не считается независимым подтверждением
  supply economics or quality.

## 7. Scope governance

Стратегический scope широкий, но каждый increment обязан иметь:

- один primary scenario;
- явный entry and exit state;
- acceptance criteria;
- supported languages/formats;
- safety and privacy boundary;
- synthetic test before real data;
- решение о том, какие следующие lifecycle steps разблокированы.

Новый сценарий `Life` or `Skills` не добавляется в реализацию, пока текущий
increment не прошел свой gate.

## 8. Current implementation boundary

Текущий двухнедельный increment:

```text
Identity
  -> Profile
  -> Need Intake
  -> Clarification
  -> Ready for Match
```

В него входят language metadata for Russian/English. Runtime translation,
provider acceptance, execution and result остаются следующими increments.

## 9. Open product questions

1. Какие категории услуг лично может оказывать первый эксперт?
2. Нужны ли в первом pilot только online services или также local/offline?
3. Какие текстовые зоны переводим первыми?
4. Как пользователь выбирает исполнителя: shortlist, swipe, automatic
   assignment or combination?
5. Где проходит первая коммуникация: concierge chat, direct chat or external
   call?
6. Первый pilot бесплатный или платный?
7. Как клиент подтверждает полезный Result для разных направлений?

## 10. Related documents

- [SRS Review validation brief](./work-srs-review-product-brief.md);
- [CJM scenarios](./cjm-scenarios-gap-analysis.md);
- [Languages, translation and voice](../system/multilingual-voice-plan.md);
- [Two-week execution plan](../system/cifedra-two-week-execution-plan-2026-06-22.md).
