# CIFEDRA Risk Register

Дата создания: 2026-06-20
Статус: active

Шкала:

- probability: low, medium, high;
- impact: low, medium, high, critical.

| ID | Risk | Probability | Impact | Mitigation / evidence | Owner | Review |
| --- | --- | --- | --- | --- | --- | --- |
| R-001 | Пользователи считают review полезным в разговоре, но не готовы передавать задачу или платить. | high | high | Проверять recent cases, alternatives, pilot commitment and price signals. | Product | R0 |
| R-002 | Scope превращается в полное переписывание SRS или консалтинг без границ. | high | high | Quick Review scope, exclusions and structured artifact. | Product | 2026-06-26 |
| R-003 | В discovery попадают confidential SRS до legal/privacy readiness. | medium | critical | Только synthetic/redacted examples; явный запрет в scripts and brief. | Product/Security | D0 |
| R-004 | Невозможно найти экспертов с достаточным качеством и доступностью. | medium | high | Два supply interviews, capability criteria and explicit decline flow. | Product | R0 |
| R-005 | Качество result artifact субъективно и не имеет acceptance criteria. | high | high | Severity taxonomy, artifact outline and user usefulness questions. | Analysis/Product | 2026-07-02 |
| R-006 | Разработка Core фиксирует неверный intake до product evidence. | medium | high | Versioned schema, provisional fields, traceability and R0 review. | System | R0 |
| R-007 | Security gaps прототипа допускают privilege escalation or data exposure. | high | critical | S0 gate before shared testing; negative automated tests. | Engineering | 2026-06-25 |
| R-008 | PostgreSQL spike разрастается в полную persistence implementation. | medium | medium | Ограничить одной aggregate boundary and documented findings. | Architecture | 2026-07-01 |
| R-009 | Solo capacity не позволяет закончить must scope. | high | high | Daily WIP limit, remove should items first, no hidden carry-over. | Оба | Daily |
| R-010 | Plane/Chatwoot/Keycloak/mobile отвлекают от critical path. | medium | medium | Явно out of scope; новые работы только через decision log. | System | R0 |
| R-011 | Название или домен окажутся недоступны. | medium | medium | Не покупать до shortlist and registrar verification; держать alternatives. | Product | R0 |
| R-012 | Interview notes содержат лишние персональные данные. | medium | high | Consent, minimization, participant codes and restricted notes. | Research | Each interview |
| R-013 | Increment `Ready for Match` ошибочно объявят готовым SRS Review product. | medium | high | В brief и demo разделять sprint output, fixture simulation and future product flow. | Product/System | R0 |

## Escalation

Немедленная остановка соответствующей работы требуется, если:

- получен реальный confidential document до D0;
- обнаружен способ self-assign privileged role;
- тестовые данные могут быть доступны не только на local loopback;
- participant просит удалить notes;
- sprint change добавляет scope без снятия другой задачи.
