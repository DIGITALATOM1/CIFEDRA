# CIFEDRA CONNECT: единая регистрация и авторизация

Дата: 2026-06-13
Статус: auth integration plan v0.1

## Решение

`CIFEDRA Auth` становится источником пользователя для продукта и интегрируемых
приложений. На локальном этапе это встроенный auth-слой API-прототипа, который
создает пользователя, выдает bearer-session и передает stable principal в adapter
слой Plane/Chatwoot.

## Граница v0.1

| Зона | Решение сейчас | Следующий этап |
| --- | --- | --- |
| Регистрация | `POST /auth/register` в CIFEDRA API. | Persistent storage и подтверждение email/телефона. |
| Авторизация | `POST /auth/login`, bearer token, `GET /auth/me`. | Refresh tokens, session/device management. |
| Хранение | `.local/auth/store.json`, не коммитится. | PostgreSQL/Supabase или отдельный IdP. |
| Интеграции | Adapter добавляет `cifedra_actor_*` в Plane/Chatwoot payload. | SSO для UI интеграций через OIDC/SAML/reverse proxy. |
| Mobile | Использует те же `/auth/*` endpoints. | Secure storage, biometric unlock, token refresh. |

## Локальные endpoints

| Метод | URL | Назначение |
| --- | --- | --- |
| `GET` | `/auth/status` | Статус локального auth-хранилища. |
| `POST` | `/auth/register` | Создать CIFEDRA user и сессию. |
| `POST` | `/auth/login` | Войти по email/password. |
| `GET` | `/auth/me` | Получить текущего пользователя и integration identity. |
| `POST` | `/auth/logout` | Отозвать текущую bearer-session. |

## Integration identity

Все внешние модули должны получать не локальный пароль CIFEDRA, а claims:

```json
{
  "provider": "cifedra",
  "claims": {
    "subject": "usr_...",
    "email": "user@example.com",
    "name": "User Name",
    "roles": ["client"]
  }
}
```

Для Chatwoot эти claims передаются в `custom_attributes` conversation:

- `cifedra_actor_user_id`
- `cifedra_actor_email`
- `cifedra_actor_name`
- `cifedra_actor_roles`

Для Plane на текущем этапе actor добавляется в описание задачи. Когда будет
готов live Plane adapter, actor нужно вынести в поля/labels по поддерживаемому API.

## Правило

Пользователь регистрируется и входит в CIFEDRA. Интегрируемые приложения не
становятся источником идентичности: они получают пользователя от CIFEDRA и
возвращают статусы, события и результаты обратно в core.
