# CIFEDRA CONNECT: quality, security and release plan

Дата: 2026-06-20
Статус: quality/release baseline v0.1

## 1. Цель

План определяет, какие доказательства нужны для перехода:

```text
Local prototype
  -> CI
  -> Local full stack
  -> Staging
  -> Closed beta
  -> Production canary
  -> General availability
```

Архитектура может изменяться, но качество перехода между environments не
снижается. Изменение architecture boundary добавляет новые проверки и не
обходит gate.

## 2. Immediate blockers before shared testing

До первого shared environment необходимо:

1. Запретить self-registration ролей `operator/admin`.
2. Защитить demo/product endpoints authentication and authorization.
3. Перестать доверять client-supplied domain state.
4. Добавить request schema, body limit, timeout, rate limit and safe errors.
5. Bind local services to `127.0.0.1`; убрать wildcard production CORS.
6. Хранить handoff/test artifacts с ограниченными permissions и retention.
7. Не хранить bearer token test console в persistent browser storage.
8. Выключить live integrations по умолчанию.
9. Не использовать `.local` data как shared test environment.

## 3. Test levels

| Level | Scope |
| --- | --- |
| Unit | Aggregate invariants, policies, scoring, state transitions. |
| Component | Application services, validation, authorization and repositories. |
| API | HTTP contracts, errors, pagination, concurrency and idempotency. |
| Integration | PostgreSQL, Keycloak, object storage, outbox/inbox and adapters. |
| Contract | OpenAPI compatibility, event JSON Schema and provider mapping. |
| E2E | Role and direction CJM across WEB/mobile/API/operations. |
| Security | SAST, SCA, secret scan, container/IaC scan, DAST, threat tests. |
| NFR | Load, soak, failover, backpressure, restore and accessibility. |
| UAT | Design partners and operators confirm useful outcome and workflow. |

Coverage guidance:

- 100% critical invariants have explicit tests;
- overall target: at least 80% line and 75% branch;
- authorization, consent, lifecycle and payment contracts: at least 90% branch;
- numeric coverage never replaces scenario and risk coverage.

## 4. Environments

| Environment | Data | Integrations | Access |
| --- | --- | --- | --- |
| Developer | Synthetic/local. | Mocks or selected local provider. | Developer only, loopback. |
| CI ephemeral | Generated per pipeline. | Containers/mocks. | Pipeline only, destroyed after run. |
| Local full | Synthetic repeatable seeds. | Keycloak/Chatwoot/Plane profiles. | Local team. |
| Staging | Synthetic or formally anonymized. | Sandbox/test providers. | Team and UAT users. |
| Closed beta | Separate beta DB, Keycloak realm, buckets and accounts. | Separate monitored provider accounts. | Allowlist. |
| Production | Real data. | Production providers. | Release pipeline and controlled ops. |

Rules:

- production dump is not copied to lower environments;
- synthetic seed factories are versioned;
- test accounts and deletion fixtures are reproducible;
- environment reset is automated;
- secrets and signing keys differ by environment.

## 5. CI gate

Each pull request:

1. formatting/lint;
2. typecheck;
3. unit/component tests;
4. coverage policy;
5. OpenAPI/event compatibility;
6. migration validation;
7. SAST/SCA/secret scan;
8. build;
9. Markdown/link and architecture conformance checks.

Protected branch requires successful checks and review.

Governance:

- separate code reviewer and production approver where team size permits;
- approver matrix by environment;
- signed artifact/SBOM verification before deploy;
- environment deployment locks;
- break-glass process with audit and post-review;
- temporary waiver requires owner, reason, compensating control and expiry.

Release pipeline additionally:

1. integration tests;
2. WEB/mobile E2E;
3. image and IaC scan;
4. SBOM/provenance;
5. immutable artifacts;
6. deploy staging;
7. staging smoke and migration rehearsal;
8. manual production approval;
9. progressive rollout;
10. automated stop/rollback conditions.

## 6. Acceptance suites

### 6.1 Domain

- valid and invalid transitions;
- ownership and organization scope;
- contact request acceptance/expiry;
- consent grant/revoke;
- disclosure masking;
- report/block/moderation;
- result and audit immutability.

### 6.2 Data and reliability

- restart persistence;
- optimistic concurrency conflicts;
- command idempotency;
- webhook replay/deduplication;
- worker crash and lease recovery;
- provider timeout/retry/dead-letter;
- reconciliation after ambiguous provider result;
- migration forward/backward compatibility;
- backup and restore.

### 6.3 Client applications

- auth/session/logout;
- deep links and reload;
- loading/empty/error/offline states;
- WEB desktop/tablet/mobile browser;
- iOS/Android supported device matrix;
- accessibility;
- account deletion;
- state consistency between WEB and mobile.

### 6.4 Operations

- manual match with reason;
- SLA and queue assignment;
- Chatwoot/Plane drift;
- incident escalation;
- user complaint/report/block;
- provider unavailable;
- deletion and retention execution.

### 6.5 Release evidence and defects

| Severity | Example | Release effect |
| --- | --- | --- |
| Sev-1 | Data loss/leak, account takeover, broad outage. | Stop test/release immediately. |
| Sev-2 | Critical CJM unavailable, privilege bypass, unrecoverable inconsistency. | Blocks beta/production. |
| Sev-3 | Degraded noncritical function with workaround. | Requires explicit triage/acceptance. |
| Sev-4 | Cosmetic/minor issue. | May be scheduled later. |

Each gate evidence pack contains:

- build/artifact version;
- passed suites and coverage;
- open defect list and accepted risks;
- migration/rollback result;
- security/privacy result;
- observability and support readiness;
- sign-off owners.

Flaky tests are quarantined with owner and expiry; they cannot silently count as
passed critical evidence. Critical CJM, support SLA and product thresholds are
defined in the metric dictionary before pilot/beta.

## 7. Security and privacy

Artifacts:

- threat model;
- authorization matrix;
- data inventory/classification;
- consent/disclosure matrix;
- retention/deletion matrix;
- secrets register;
- third-party SDK/provider inventory;
- mobile permissions register;
- privacy labels/Data Safety mapping.

Baseline:

- OWASP ASVS L2 for WEB/API;
- OWASP MASVS-oriented review for mobile;
- TLS and secure headers;
- least-privilege DB/service roles;
- no sensitive data in logs/events/analytics;
- audit trail separate from technical logs;
- dependency and secret scanning;
- independent penetration test before broad public launch, or documented risk
  acceptance signed by Product, Security and Engineering owners.

Gate:

- no open critical/high security finding;
- privilege escalation, IDOR and disclosure tests pass;
- deletion and consent flows verified;
- security incident tabletop completed before beta.

## 8. Performance and SLO

Absolute targets are not invented before sizing.

Before staging approve:

- MAU/DAU and active providers;
- peak RPS and burst;
- match candidate cardinality;
- file/media volume;
- expected notification and integration volume;
- API SLO and error budget;
- RTO/RPO.

Load gate:

- representative data set;
- agreed peak plus safety margin;
- API, DB and worker tested together;
- queue lag/backpressure observed;
- no unbounded retry or resource growth;
- slow query/index report attached.

## 9. Observability

Required signals:

| Area | Metrics/signals |
| --- | --- |
| API | Rate, errors, latency, auth failures, rate limits. |
| PostgreSQL | Connections, pool wait, query latency, locks, storage growth. |
| Worker | Queue lag, attempts, lease recovery, dead letters. |
| Providers | Latency, errors, throttling, reconciliation drift. |
| Webhooks | Accepted, duplicates, signature failures and processing lag. |
| Clients | Crash/error, failed critical steps and version adoption. |
| Product | Funnel and useful outcome without sensitive payload. |
| Operations | Queue age, SLA breach and manual effort. |

Every request/event uses correlation/trace identifiers. Alerts are tested by
controlled failure injection, not only configured.

## 10. Backup and disaster recovery

Separate policies:

- Core PostgreSQL;
- Keycloak PostgreSQL;
- object storage;
- vendor systems where their state is required;
- configuration, secrets metadata and IaC.

Backup controls:

- encryption in transit and at rest;
- immutable/versioned copies where supported;
- offsite or separate failure-domain copy;
- documented retention;
- least-privilege access and access audit;
- KMS/signing-key escrow and recovery procedure;
- backup deletion aligned with legal retention.

Before staging:

- restore to isolated environment;
- PITR validation;
- checksum and media metadata reconciliation;
- login/auth restore validation;
- runbook with owner and measured duration.

After launch:

- automated backup health daily;
- restore rehearsal before major release and at least quarterly;
- documented partial restore and full environment recovery.

## 11. Beta sequence

Recommended:

1. Internal `Work / SRS review`.
2. Closed remote `Work`.
3. Closed `Skills`.
4. Limited `Life / Local Tasks`.

Excluded until separate gate:

- Life Care;
- access to a user's home;
- minors;
- real marketplace payments;
- sensitive audio/video recording.

Beta exit:

- no Sev-1/Sev-2;
- critical CJM success target met;
- support SLA met;
- deletion/complaint paths exercised;
- useful outcome and provider acceptance measured;
- architecture feedback incorporated.
- affected gates rerun after architecture/security/data changes.

## 12. Production rollout

Backend and WEB:

```text
Internal
  -> 5%
  -> 25%
  -> 50%
  -> 100%
```

First iOS/Android publication:

- use internal/closed testing and limited launch geography/audience;
- keep backward-compatible API window;
- define minimum supported version;
- use remote feature flags/kill switches;
- keep marketing controlled until crash/support metrics are stable;
- do not assume installed first-release clients can be rolled back instantly.

Mobile updates may use App Store phased release and Google staged rollout when
available.

Stop conditions:

- SLO/error budget violation;
- auth/security anomaly;
- data inconsistency;
- dead-letter backlog;
- provider drift above threshold;
- crash regression;
- severe support/safety escalation.

Rollback includes:

- application version;
- feature flags;
- DB compatibility strategy;
- provider integration disable;
- traffic routing;
- user/support communication.

## 13. Incident and support readiness

Required:

- Sev-1 to Sev-4 classification;
- on-call/escalation;
- Chatwoot support queues;
- status communication owner;
- runbooks for DB, Keycloak, outbox, provider outage, deletion and data leak;
- incident log and postmortem;
- support knowledge base and known limitations.

Before beta define and exercise:

- acknowledge/restore targets for Sev-1..Sev-4;
- on-call coverage and escalation contacts;
- breach notification/legal escalation path;
- availability game day;
- status-page communication drill.

## 14. Architecture feedback

Test evidence may change:

- module ownership;
- data model/indexes;
- provider choice;
- API/event contract;
- deployment topology;
- cache/search/broker decision.

Required action:

| Change | Artifact |
| --- | --- |
| Local implementation detail | Backlog/test update. |
| API/event behavior | SRS + OpenAPI/JSON Schema + compatibility test. |
| Data ownership/trust/deployment boundary | ADR + HLD + threat/recovery review. |
| Product/legal risk boundary | Product/legal/security gate. |

No gate is passed using outdated HLD, SRS or test evidence. Impact analysis
identifies affected gates and reruns their evidence suites.
