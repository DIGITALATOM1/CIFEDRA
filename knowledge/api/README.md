# CIFEDRA API contracts

Дата обновления: 2026-07-26
Статус: draft contracts

## Контракты

| Artifact | Назначение |
| --- | --- |
| [../../apps/api/openapi/cifedra-v1-draft.json](../../apps/api/openapi/cifedra-v1-draft.json) | Draft OpenAPI 3.1 contract для локального Core/API MVP, WEB и будущих mobile clients. |

## Текущий baseline

Контракт пока описывает фактически реализованный local API namespace:

```text
/auth/*
/directions
/demo/*
/integrations/status
```

Переименование в публичный `/api/v1` делаем отдельным increment после
стабилизации persisted Need/Profile/ContactRequest/Engagement endpoints.

## Local MVP endpoints

| Area | Endpoint |
| --- | --- |
| Matching board | `POST /demo/match` |
| ContactRequest transitions | `POST /demo/contact-requests/{id}/{action}` |
| Engagement simulation | `POST /demo/engagements/simulate` |
| Engagement lifecycle | `POST /demo/engagements/transition` |

## Product defaults

1. `ContactRequest.expiresAt` по продукту рассчитывается как `requestedAt + 48h`.
2. First-contact target channel: встроенный CIFEDRA messenger.
3. Chatwoot остается support/ops и concierge-adapter слоем, но не primary client UI.
4. До mutual acceptance прямые контакты и точный адрес скрыты.
5. Первый Work result artifact: structured Markdown.
