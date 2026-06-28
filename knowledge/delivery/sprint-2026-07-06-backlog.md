# CIFEDRA Sprint Backlog: 2026-07-06 - 2026-07-17

Дата: 2026-06-26
Статус: proposed after R0
Команда: владелец продукта + Codex

## Sprint goal

Перевести Core P0 из `Ready for Match` к первому проверяемому post-match
workflow:

```text
Client Decision
  -> ContactRequest
  -> Consent / permitted disclosure
  -> Provider acceptance or decline
  -> Engagement baseline
  -> persisted transaction boundary
```

## Backlog

| ID | День | Задача | Owner | Зависит от | Acceptance | Статус |
| --- | --- | --- | --- | --- | --- | --- |
| N1-01 | 1 | Уточнить ContactRequest SRS. | Codex | R0 | requested/accepted/declined/expired/cancelled states, actors and permissions described. | done: [SRS](../srs/core-p1-contact-request-consent.md), [evidence](./contact-request-srs-evidence-2026-06-26.md) |
| N1-02 | 1 | Подтвердить combined Life splitting rule. | Владелец продукта | R0 | One Need vs linked Needs rule accepted for ContactRequest. | planned; provisional ask-before-split rule documented |
| N2-01 | 2 | Реализовать `ContactRequest` aggregate in Core. | Codex | N1-01 | Unit tests cover client request, provider accept/decline, expiry and invalid actors. | done: [evidence](./contact-request-core-evidence-2026-06-26.md) |
| N2-02 | 2 | Связать `requested_contact` decision with ContactRequest. | Codex | N2-01 | Client decision no longer implies provider acceptance. | done: [evidence](./contact-request-vertical-flow-evidence-2026-06-28.md) |
| N3-01 | 3 | Добавить consent/disclosure baseline. | Codex | N1-01 | Contacts/exact address remain hidden without explicit consent state. | done: domain disclosure snapshot baseline |
| N3-02 | 3 | Обновить local vertical flows with ContactRequest. | Codex | N2-01, N3-01 | Life/Work/Skills create ContactRequest after match and remain synthetic-only. | done: [evidence](./contact-request-vertical-flow-evidence-2026-06-28.md) |
| N4-01 | 4 | Создать PostgreSQL migration/repository slice for ContactRequest. | Codex | N2-01 | ContactRequest persists with optimistic version and runtime role has no DDL. | planned |
| N4-02 | 4 | Добавить API application service boundary for ContactRequest. | Codex | N4-01 | Versioned endpoint uses repository transaction, safe errors and auth context. | planned |
| N5-01 | 5 | Подготовить OpenAPI/DTO draft for Core P0+ContactRequest. | Codex | N4-02 | API contract documented for future WEB/mobile clients. | planned |
| N6-01 | 6 | Реализовать Engagement baseline. | Codex | N2-01 | planned/in_progress/completed/cancelled lifecycle tested. | planned |
| N7-01 | 7 | Добавить event/outbox spike. | Codex | N4-01 | Domain state and outbox event saved in one transaction. | planned |
| N8-01 | 8 | Обновить Plane/Chatwoot sync plan around ContactRequest/Engagement. | Codex | N7-01 | External adapters consume product events, not direct Core mutations. | planned |
| N9-01 | 9 | Local UAT evidence review for post-match flow. | Оба | N3-02, N6-01 | Metrics and residual gaps separated from product/market evidence. | planned |
| N10-01 | 10 | Update SRS/HLD/ADR/backlog and commit sprint report. | Codex | N9-01 | Next gate and backlog approved. | planned |

## Product questions

1. For Life combined service, when one provider cannot do both pool and lawn,
   should CIFEDRA split automatically into linked Needs or ask the client first?
   Current provisional baseline: ask the client first; no automatic split.
2. For ContactRequest, should provider have a timeout window in local pilot
   simulation, or only manual accept/decline? Current provisional baseline:
   explicit `expiresAt`; proposed product default 48 hours.
3. Before provider acceptance / mutual match, what exact data can be disclosed
   to provider: category, region, expected result, budget, language,
   preferred time?
4. Which Work result artifact should be first: Markdown findings only, or
   Markdown plus later DOCX/PDF export?

## Exit criteria

1. ContactRequest separates client intent from provider acceptance.
2. Consent/disclosure prevents accidental contact/address reveal.
3. At least one post-match aggregate is persisted through PostgreSQL.
4. Local UAT still uses only repository-owned synthetic fixtures.
5. API contract is stable enough to start WEB/mobile shell design.
