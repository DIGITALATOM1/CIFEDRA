# CIFEDRA CONNECT: план мобильной сборки

Дата: 2026-06-13
Статус: mobile build strategy v0.1

## Ответ

Да, `CIFEDRA CONNECT` можно собрать в мобильные приложения для iOS и Android.

Правильный путь: делать не обертку вокруг Plane, Chatwoot или тестовой web-консоли, а собственное мобильное приложение `CIFEDRA`, которое работает через `CIFEDRA API`.

Mobile является одним из клиентских каналов. Полноценный browser-канал
проектируется отдельно: [web-client-build-plan.md](./web-client-build-plan.md).

```text
Mobile App
  -> CIFEDRA API
    -> CIFEDRA Core
    -> Core Data
    -> Integration Adapters
      -> Plane CE
      -> Chatwoot CE
      -> Baserow
```

## Решение по стеку

| Вопрос | Решение |
| --- | --- |
| Основной mobile stack | `React Native + Expo`. |
| Client WEB | Отдельное React WEB-приложение, не wrapper мобильного UI. |
| Общая бизнес-логика | Держать в `packages/core`, чтобы переиспользовать правила между API, тестами и будущим mobile. |
| API | Все мобильные действия идут через `apps/api`; мобильное приложение не знает токены Plane/Chatwoot/Baserow. |
| Интеграции | Plane/Chatwoot подключаются на backend-стороне через adapters. |
| Локальное тестирование | До публикации в App Store / Google Play тестируем сценарии локально. |

## Почему текущая архитектура подходит

Уже сделано:

- доменное ядро вынесено в `packages/core`;
- API-прототип вынесен в `apps/api`;
- test console не является продуктовым UI, а только локальным инструментом проверки;
- Plane/Chatwoot подключены через handoff-adapter, а не встроены в основной экран;
- landing уже содержит место под QR-коды iOS/Android;
- локальный контур позволяет проверять сценарии до внешнего сервера.

Это значит, что `apps/mobile` можно добавить позже без переписывания ядра.

## Что будет в мобильном приложении

Минимальный mobile MVP должен закрыть общий сценарий:

```text
Need -> Match -> Prepare -> Connect -> Result
```

| Экран | Назначение |
| --- | --- |
| Direction select | Выбор `Life`, `Work`, `Skills`. |
| Need form | Описание задачи, ожидаемый результат, ограничения. |
| Match cards | Карточки людей, score, причины релевантности, риски. |
| Swipe / shortlist | Быстрый выбор, отклонение, shortlist, запрос контакта. |
| Prepare | Brief: цель, контекст, вопросы, следующий шаг. |
| Connect | Concierge/support через Chatwoot на MVP или будущий product chat. |
| Result | Итог контакта, качество матча, follow-up. |

## Что не должно быть в мобильном приложении

| Не включаем в app | Почему |
| --- | --- |
| Docker / локальные контейнеры | Это runtime backend-инфраструктуры, не часть мобильного клиента. |
| API-ключи Plane/Chatwoot/Baserow | Секреты должны жить только на backend. |
| Admin UI Plane/Chatwoot/Baserow | Это операционные инструменты, а не пользовательский продукт. |
| Логику matching только на клиенте | Matching должен быть воспроизводимым, тестируемым и доступным для аналитики на backend. |

## Роль Plane и Chatwoot в mobile MVP

| Решение | Как показываем в мобильном продукте |
| --- | --- |
| Plane CE | Внутренний task/execution слой. Пользователь не обязан видеть Plane UI; mobile может показывать только статус из CIFEDRA API. |
| Chatwoot CE | Support/concierge канал. В mobile можно открыть concierge-диалог, но границы direct product chat нужно проектировать отдельно. |

## Этапы сборки

### Этап 0. Сейчас

Цель: не начинать mobile-код раньше доменной стабилизации.

- Продолжить локальное тестирование `Life`, `Work`, `Skills`.
- Зафиксировать API-контракты для mobile.
- Подготовить SRS `Mobile MVP`.
- Не хардкодить `localhost` в будущей mobile-логике; API base URL должен быть конфигурируемым.

### Этап 1. Mobile shell

Цель: создать `apps/mobile` и проверить запуск на iOS/Android.

- Создать Expo-приложение.
- Подключить env для API base URL.
- Добавить первые экраны: direction, need form, match result.
- Подключить smoke-сценарии через локальный API.

### Этап 2. Product flow

Цель: собрать реальный пользовательский сценарий.

- Карточки кандидатов.
- Swipe/shortlist.
- Prepare brief.
- Connect через concierge.
- Result/outcome.

### Этап 3. Предпубликационная сборка

Цель: подготовить бинарники для тестирования.

- iOS build через TestFlight.
- Android build через Google Play Internal testing.
- Настроить bundle id/package name.
- Добавить privacy policy, terms, data deletion policy.
- Проверить deep links и push notifications, если они нужны в MVP.

### Этап 4. Публикация

Цель: выпуск после локального и staging-тестирования.

- Внешний backend/staging.
- Production API.
- Store assets: иконка, screenshots, описание, support URL.
- Review App Store / Google Play.
- QR-коды на landing заменить на реальные ссылки магазинов.

## Условия готовности к старту `apps/mobile`

Начинать mobile scaffold стоит, когда готовы:

1. Утвержденный SRS `Mobile MVP`.
2. Минимальная модель данных: `Need`, `Profile`, `Match`, `Shortlist`, `Conversation`, `Result`.
3. API-контракты для mobile flow.
4. Решение по auth v0.2: local auth для dev, Keycloak/OIDC для staging and production.
5. Решение по concierge/direct chat.
6. Минимальный UX flow по `Life`, `Work`, `Skills`.

## Источники

- Expo: [официальная документация](https://docs.expo.dev/).
- Expo EAS Build: [create your first build](https://docs.expo.dev/build/setup/).
- Capacitor: [official docs](https://capacitorjs.com/docs/).
- Chatwoot mobile app setup: [developer docs](https://developers.chatwoot.com/contributing-guide/mobile-app/setup-guide).
- Chatwoot custom mobile app build: [developer docs](https://developers.chatwoot.com/self-hosted/custom-mobile-app).
