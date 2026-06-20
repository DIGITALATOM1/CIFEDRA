# Architecture Decision Records

Каталог содержит утвержденные архитектурные решения CIFEDRA.

## Правила

- один ADR описывает одно значимое решение;
- статус меняется последовательно: `proposed -> accepted -> superseded`;
- изменение принятого решения оформляется новым ADR со ссылкой на замененный;
- HLD содержит краткий реестр, ADR содержит контекст, альтернативы и последствия;
- LLD, OpenAPI и схемы БД обязаны соответствовать принятым ADR.

## Реестр

| ADR | Решение | Статус |
| --- | --- | --- |
| [ADR-001](./ADR-001-architecture-style-and-docker-topology.md) | Модульный монолит CIFEDRA Core и многоконтейнерная Docker-топология. | Accepted |
| [ADR-002](./ADR-002-postgresql-core-data-platform.md) | PostgreSQL 18 как платформа хранения product state. | Accepted |
| [ADR-003](./ADR-003-interservice-communication-standard.md) | Стандарт синхронных, асинхронных и webhook-взаимодействий. | Accepted |
