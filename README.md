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

Локальные URL:

- API: `http://localhost:3030`
- Landing: `http://localhost:4177/web/landing/`
