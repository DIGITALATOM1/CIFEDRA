# CIFEDRA Client WEB MVP

Дата создания: 2026-07-26
Статус: local MVP

## Назначение

`apps/web` - рабочий клиентский MVP для локального тестирования CIFEDRA
Connect. Он не заменяет старые статические прототипы `web/landing` и
`web/app`, а начинает production-oriented WEB-клиент на React/Vite.

## Что уже проверяем

1. Локальная регистрация/логин клиента через `apps/api`.
2. Выбор одного из трех пилотных сценариев: Life, Work, Skills.
3. Запуск `/demo/match`.
4. Kanban-представление workflow:
   `Ally Request -> AI Matching -> Proposed Allies -> Contact Request -> Messenger -> Result`.
5. Preview встроенного CIFEDRA messenger:
   имя клиента + описание запроса/работы без прямых контактов и точного адреса.

## Запуск

Из корня проекта:

```bash
npm install
npm run local:start
```

URL:

```text
http://localhost:5173
```

Отдельный dev-запуск:

```bash
npm run dev:web
```

API base URL можно переопределить:

```bash
VITE_CIFEDRA_API_URL=http://localhost:3030 npm run dev:web
```

## Ограничения MVP

1. Экран использует local `/demo/*` API namespace.
2. Состояние сессии хранится только в памяти браузера.
3. ContactRequest transitions через PostgreSQL UI пока не подключены.
4. Engagement lifecycle и настоящий message persistence идут следующим increment.
