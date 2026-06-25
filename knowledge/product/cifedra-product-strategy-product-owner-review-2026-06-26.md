# CIFEDRA Product Strategy Draft: Product Owner Review

Дата: 2026-06-26
Статус: драфт передан продакту
Owner: продакт
Engineering owner: Codex

## Назначение

Документ передан продакту как рабочая русская версия на несколько дней. Его
цель - собрать верхнеуровневое продуктовое видение и решения, которые нужны
для выхода CIFEDRA на рынок, но не должны останавливать локальную разработку
Core/API.

Файл на рабочем столе:

```text
/Users/igor.f/Desktop/CIFEDRA_Product_Strategy_Draft_Product_Review_RU.docx
```

Копия в репозитории:

```text
knowledge/product/artifacts/cifedra-product-strategy-product-owner-review-ru-2026-06-26.docx
```

## Что находится в DOCX

1. Русская версия Vision Board на базе приложенного примера:
   `Target group / Needs / Product / Value`.
2. Верхнеуровневые бизнес-требования.
3. Вопросы к продакту, которые стопят рынок, пилот, legal/safety,
   монетизацию, операции или публичный запуск.
4. Мои предложенные базовые решения по каждому вопросу.
5. Поля для ответа, правки или решения продакта.
6. Все CJM по ролям и направлениям с колонкой для ревью продакта.
7. Источники из текущей базы знаний.

## Как продакт работает с документом

1. Заполняет ответы в правой колонке.
2. Для каждого базового решения выбирает:
   - принять;
   - поправить;
   - отклонить;
   - оставить открытым с owner and deadline.
3. Правит CJM прямо в документе или пишет комментарий рядом.
4. Отмечает, какие решения являются:
   - обязательными до локального UAT;
   - обязательными до controlled pilot;
   - обязательными до beta/production;
   - later / not now.
5. Возвращает документ в работу, после чего ответы декомпозируются в:
   `Business requirements -> User Story Map -> Use Cases -> SRS/FR -> Traceability -> GAP/backlog`.

## Основные блоки вопросов

| Блок | Почему нужен |
| --- | --- |
| Стратегия, рынок и scope | Не дать продукту расползтись на Life/Work/Skills одновременно без первого рыночного фокуса. |
| Discovery и pilot gates | Отделить synthetic/local evidence от реального market evidence. |
| Стратегия направлений | Утвердить порядок Work -> Skills -> Life и direction-specific restrictions. |
| Lifecycle | Уточнить Discover -> Result, включая ContactRequest, disclosure, Engagement and Result. |
| Trust, safety, privacy and legal | Не запускать real data, Life or files до D0 readiness. |
| Монетизация и платежи | Сохранить payment/PSP в mock/later scope до pricing/legal evidence. |
| Operations and integrations | Зафиксировать роль оператора, Chatwoot, Plane, Baserow and n8n. |
| Launch, marketing and analytics | Связать domain, landing, store readiness and metrics with actual product capability. |

## Влияние на разработку, пока идет product review

Разработка продолжается по уже зафиксированным решениям:

- `ContactRequest` отделяет намерение клиента от согласия исполнителя;
- pre-accept disclosure скрывает контакты, точный адрес и confidential artifacts;
- local pilot остается только synthetic;
- Work / Quick SRS Review остается первым external market baseline, пока продакт не изменит решение;
- WEB/iOS/Android используют один будущий API contract;
- payments, n8n, direct product chat and voice/Whisper сейчас не входят в critical path.

Если продакт меняет эти решения, изменения вносятся через:

1. decision log;
2. SRS / product scope;
3. HLD/ADR when architecture changes;
4. delivery backlog;
5. tests and evidence pack.

## Следующий product-analysis step после ответов

После заполнения DOCX нужно подготовить:

1. Обновление product decisions.
2. User Story Map для первой вертикали.
3. Use Case package для MVP lifecycle.
4. Traceability matrix:
   `CJM step -> business requirement -> use case -> functional requirement -> test -> backlog item`.
5. GAP register и reprioritized roadmap.
