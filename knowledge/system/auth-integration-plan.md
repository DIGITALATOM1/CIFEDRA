# CIFEDRA CONNECT: единая регистрация и авторизация

Дата: 2026-06-20
Статус: auth integration plan v0.2

## Решение

На локальном этапе встроенный auth-слой API остается test adapter.

Для staging/production выбираем `Keycloak` как источник authentication:
credentials, OIDC tokens, sessions, MFA, email verification, password reset и
identity federation.

`CIFEDRA Core` остается владельцем product identity: Profile, Organization,
Membership, permissions, preferences, consent и trust.

## Граница локального прототипа

| Зона | Решение сейчас | Следующий этап |
| --- | --- | --- |
| Регистрация | `POST /auth/register` в CIFEDRA API. | Persistent storage и подтверждение email/телефона. |
| Авторизация | `POST /auth/login`, bearer token, `GET /auth/me`. | Refresh tokens, session/device management. |
| Хранение | `.local/auth/store.json`, не коммитится. | Keycloak DB для identity; CIFEDRA DB для product profile. |
| Интеграции | Adapter добавляет `cifedra_actor_*` в Plane/Chatwoot payload. | SSO для UI интеграций через OIDC/SAML/reverse proxy. |
| Mobile | Использует локальные `/auth/*` endpoints. | OIDC Authorization Code через browser + PKCE, secure storage and refresh. |

## Почему Keycloak

- open protocols: OIDC/OAuth 2.0/SAML;
- registration, reset password, verification, MFA/passkeys and sessions;
- roles/groups and token claims;
- external identity providers and LDAP/AD federation;
- service accounts for backend integrations;
- self-hosting and Apache-2.0 license.

Keycloak добавляет отдельный runtime, DB, backups and upgrades. Поэтому его не
подключаем вместо текущего auth до завершения identity boundary в Core.

## Граница ответственности

| Keycloak | CIFEDRA Core |
| --- | --- |
| Credentials and authentication. | Product profile and preferences. |
| Login/registration flows. | Client/helper/operator business roles and permissions. |
| MFA, password reset, email verification. | Consent, trust, moderation and disclosure. |
| IdP sessions and tokens. | Organization membership and resource ownership. |
| External IdP federation. | Domain audit and product lifecycle. |

Stable identity key:

```text
issuer + subject
```

Email используется как изменяемый атрибут, а не primary identity key.

## Локальные endpoints

| Метод | URL | Назначение |
| --- | --- | --- |
| `GET` | `/auth/status` | Статус локального auth-хранилища. |
| `POST` | `/auth/register` | Создать CIFEDRA user и сессию. |
| `POST` | `/auth/login` | Войти по email/password. |
| `GET` | `/auth/me` | Получить текущего пользователя и integration identity. |
| `POST` | `/auth/logout` | Отозвать текущую bearer-session. |

## Integration identity

Все внешние модули должны получать не пароль пользователя, а нормализованные
claims. В local adapter provider пока называется `cifedra`; после миграции
source claims приходят из Keycloak:

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

Пользователь входит через настроенный CIFEDRA identity flow. В production
authentication выполняет Keycloak, а CIFEDRA нормализует principal.
Интегрируемые приложения не становятся источником identity и возвращают
статусы, события и результаты обратно в Core.

## План миграции

1. Добавить provider-neutral `IdentityRef`.
2. Отделить `UserProfile` от `AuthUser`.
3. Добавить JWT validation adapter в API.
4. Поднять Keycloak локально с realm `cifedra`.
5. Создать clients `cifedra-mobile`, `cifedra-web`, `cifedra-api`,
   `cifedra-ops`.
6. Перевести test console на OIDC.
7. Оставить local auth только для unit/dev tests.
8. Проверить отдельное SSO операторов в Plane/Chatwoot; не делать это
   обязательным для end-user flow.

## Источники

- [Keycloak Server Administration](https://www.keycloak.org/docs/latest/server_admin/).
- [Keycloak OIDC](https://www.keycloak.org/securing-apps/oidc-layers).
- [OAuth 2.0 for Native Apps](https://www.rfc-editor.org/rfc/rfc8252).
