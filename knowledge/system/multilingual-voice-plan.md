# CIFEDRA CONNECT: языки, перевод и голос

Дата: 2026-06-20
Статус: architecture decision v0.1

## Короткий ответ

Мультиязычность нужна как сквозная функция. Whisper можно использовать для
распознавания речи, но нельзя считать его единым переводчиком CIFEDRA.

## Четыре разные задачи

| Задача | Решение |
| --- | --- |
| Перевод интерфейса | Resource-based i18n в web/mobile. |
| Перевод текстов пользователя | Отдельный `TextTranslationProvider`; Argos Translate как local candidate. |
| Распознавание голоса | `SpeechTranscriptionProvider`; Whisper является одним из вариантов. |
| Live-перевод разговора | Отдельный будущий speech translation/realtime слой. |

## Где нужен Whisper

Подходящие сценарии:

- надиктовать Need вместо ввода;
- прикрепить voice note;
- получить transcript встречи или mentoring session;
- подготовить summary и action items после разговора;
- облегчить работу пользователям с ограничениями ввода;
- определить язык аудио.

Open-source Whisper выпущен под MIT и поддерживает multilingual speech
recognition, language identification и speech translation. При этом перевод
Whisper направлен в английский, а не в произвольную пару языков.

## Что добавить в Core

| Сущность | Назначение |
| --- | --- |
| `LanguageCode` | BCP 47/ISO language identifier. |
| `LocalePreference` | Язык UI, timezone, форматы даты/чисел. |
| `LanguageProficiency` | Языки и уровни пользователя/помощника. |
| `LanguageRequirement` | Обязательный или предпочтительный язык Need. |
| `LocalizedContentRef` | Ссылка на оригинал и локализованные варианты. |
| `TranslationRecord` | Source/target language, provider, status, confidence, timestamps. |
| `MediaAsset` | Audio/video file metadata, owner, access and retention policy. |
| `Transcript` | Original language, segments, speaker labels, confidence. |
| `ProcessingJob` | queued/processing/completed/failed/cancelled. |

## Правила

1. Оригинал текста или аудио всегда сохраняется отдельно от машинной версии.
2. Перевод и transcript должны показывать, что они созданы автоматически.
3. Пользователь может исправить transcript; исправление не затирает исходник.
4. Audio processing требует consent и retention policy.
5. Private/regulated content нельзя отправлять внешнему provider без policy.
6. Matching должен учитывать required/spoken languages до автоперевода.
7. Низкая confidence переводит результат в ручную проверку.
8. Provider выбирается adapter-слоем; core не импортирует Whisper SDK.

## Приоритет

### P0

- хранить `locale`, `timezone`, preferred content language;
- добавить language requirement в Need и spoken languages в Profile;
- подготовить UI к resource-based i18n.

### P1

- text translation provider abstraction;
- voice input и voice note transcription;
- MediaAsset/Transcript/ProcessingJob;
- glossary для CIFEDRA/SRS/профессиональной терминологии.

### P2

- live transcription;
- diarization и автоматические meeting notes;
- speech translation;
- speech-to-speech между участниками;
- автоматический дубляж материалов.

## Решение по реализации

На первом этапе:

```text
Mobile/Web
  -> upload audio
  -> CIFEDRA API
  -> Media Storage
  -> SpeechTranscriptionProvider
  -> Transcript
  -> optional TextTranslationProvider
```

Для локального/self-hosted прототипа можно проверить open-source Whisper.
Для production необходимо сравнить локальный runtime и API providers по
качеству, задержке, стоимости, privacy и поддерживаемым языкам.

Для text translation:

- `Argos Translate` можно проверить локально: offline library, MIT;
- `LibreTranslate` дает self-hosted HTTP API поверх Argos, но использует
  AGPL-3.0;
- production provider выбирается после quality evaluation на целевых языках.

## Источники

- [OpenAI Whisper repository](https://github.com/openai/whisper).
- [OpenAI Speech to text guide](https://developers.openai.com/api/docs/guides/speech-to-text).
- [Argos Translate](https://github.com/argosopentech/argos-translate).
- [LibreTranslate](https://github.com/LibreTranslate/LibreTranslate).
