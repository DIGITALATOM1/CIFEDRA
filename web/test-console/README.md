# CIFEDRA Local Test Console

Локальная веб-консоль для ручного тестирования сценариев `Life`, `Work`, `Skills`.

## URL

```text
http://localhost:4177/web/test-console/
```

Техническая диагностика интеграций вынесена отдельно:

```text
http://localhost:4177/web/test-console/diagnostics.html
```

По умолчанию консоль подключается к API:

```text
http://localhost:3030
```

Для другого API можно передать query-параметр:

```text
http://localhost:4177/web/test-console/?api=http://localhost:3031
```

## Как использовать

1. Запустить локальный контур: `npm run local:start`.
2. Открыть консоль.
3. Выбрать сценарий `Life`, `Work` или `Skills`.
4. При необходимости изменить поля задачи.
5. Нажать `Запустить matching`.
6. Проверить профиль, score, причины, риски, brief для контакта и внутренние handoff-шаги.
7. Нажать `Передать данные` на шагах задачи/диалога, чтобы сохранить transfer package в `.local/handoffs/`.
