# CIFEDRA

`CIFEDRA CONNECT` - навигатор полезных людей для направлений `Life`, `Work`, `Skills`.

## Структура

| Путь | Назначение |
| --- | --- |
| `brand/cifedra/` | Бренд, логотипы, токены и продуктовая архитектура. |
| `knowledge/` | Архитектурные решения, SRS, системная аналитика и база знаний. |
| `web/landing/` | Статический лендинг продукта с QR-кодами приложений. |
| `packages/core/` | Самописное доменное ядро `Need -> Match -> Prepare -> Connect -> Result`. |
| `apps/api/` | Минимальный API-прототип поверх `@cifedra/core`. |
| `scripts/integrations/` | Подготовка и проверка локальных open source интеграций. |

## Команды

```bash
npm install
npm run typecheck
npm test
npm run build
npm run dev:api
```

API-прототип по умолчанию запускается на `http://localhost:3030`.

## Локальный контур тестирования

До внешнего размещения и публикации приложений тестируем продукт локально.

```bash
npm run local:start
npm run local:smoke
npm run local:stop
```

Локальные open source интеграции:

```bash
npm run docker:install
npm run integrations:check
npm run integrations:install
npm run integrations:chatwoot:start
npm run integrations:plane:install
npm run integrations:plane:start
```

Локальные URL:

- API: `http://localhost:3030`
- Landing: `http://localhost:4177/web/landing/`
- Test Console: `http://localhost:4177/web/test-console/`
- Integration Diagnostics: `http://localhost:4177/web/test-console/diagnostics.html`
- Plane CE: `http://localhost:8082`
- Chatwoot CE: `http://localhost:8083`
