# CIFEDRA CONNECT: product, design and go-to-market plan

Дата: 2026-06-20
Статус: product launch baseline v0.1

## 1. Цель

План связывает:

- discovery and segmentation;
- product offer;
- UX/UI and design system;
- brand, naming and domain;
- analytics;
- legal/privacy;
- pilot and operations;
- marketing and store launch.

Marketing не начинается с масштабной рекламы. Сначала подтверждаются problem,
useful outcome, supply and operational capacity.

## 2. Рекомендуемый первый продукт

Рабочий baseline:

```text
CIFEDRA Work / Expert Help
Structured SRS and requirements review
```

Причины:

- сценарий уже представлен в Core fixtures and CJM;
- результат можно оформить как проверяемый artifact;
- ниже physical safety risk, чем в Life;
- target audience и экспертов можно находить через профессиональные каналы;
- concierge pilot возможен до полной автоматизации.

Gate discovery может изменить первый scenario, но не должен расширять запуск
сразу на все направления.

## 3. Discovery

### 3.1 Спрос

Провести 15-20 интервью:

- lead/system analysts;
- product/delivery managers;
- founders and engineering leads;
- organizations with recurring requirements review.

Проверить:

- frequency and urgency;
- current alternatives;
- confidentiality/NDA;
- expected artifact;
- acceptable turnaround;
- trust criteria;
- willingness to pay;
- repeat pattern.

### 3.2 Supply

Провести 8-10 interviews/verification:

- senior system/business analysts;
- solution architects;
- domain experts;
- mentors/reviewers.

Проверить:

- capability taxonomy;
- availability and response time;
- evidence/portfolio;
- confidentiality;
- acceptance criteria;
- compensation model;
- dispute and quality process.

### 3.3 Discovery gate

- completed demand/provider interviews;
- достаточный prospective verified supply;
- problem повторяется;
- useful result имеет понятную форму;
- есть willingness-to-pay evidence;
- выбран один primary segment and channel.

Интервью и synthetic prototype не принимают реальные confidential SRS до
`D0 - Real Data Pilot Readiness`.

## 4. Offer and service design

Baseline value proposition:

> Получить структурированное экспертное ревью требований с замечаниями,
> рисками и следующими действиями в согласованный срок.

Service blueprint:

```text
Landing / Referral
  -> Need Intake
  -> Clarification
  -> Match / Manual Review
  -> Contact Request
  -> Expert Acceptance
  -> Secure Context Transfer
  -> Review Engagement
  -> Artifact / Result
  -> Feedback / Repeat
```

Для pilot разрешен concierge/manual matching, но:

- state фиксируется в CIFEDRA;
- manual override имеет reason and audit;
- Result обязателен;
- support effort per case измеряется.

Real cases начинаются только после `D0` из master plan.

## 5. UX and UI design

### 5.1 Design process

1. Information architecture.
2. Role and direction flows.
3. Low-fidelity prototype.
4. Moderated usability tests.
5. Design system foundations.
6. High-fidelity WEB reference screens.
7. Mobile adaptation.
8. Accessibility review.
9. Implementation QA.

### 5.2 Design system

Figma library:

- colors, typography, spacing and icons;
- form fields and validation;
- direction selection;
- Need/Clarification;
- candidate/list/card;
- trust, status and risk;
- decision/shortlist;
- consent/disclosure;
- engagement/result/artifact;
- loading, empty, error, offline and permission states;
- responsive and mobile variants.

Targets:

- WCAG 2.2 AA for WEB critical flows;
- Apple HIG and Android platform conventions;
- keyboard/screen reader/reduced motion;
- no color-only status meaning.

### 5.3 Design gate

- critical screens and states covered;
- usability issues categorized;
- design maps to stable DTO/statuses;
- no UI dependency on Plane/Chatwoot/Baserow;
- implementation acceptance checklist available.

Minimum usability evidence:

- 5-7 participants for each primary role in the tested flow;
- task success target at least 80% for critical tasks;
- zero unresolved critical blocking usability errors;
- SEQ/SUS or equivalent score and qualitative findings recorded;
- client, provider and operator flows have explicit design sign-off owner.

## 6. Brand, naming and domain

### 6.1 Naming

Before public spend:

- search existing products and marks;
- legal/trademark preliminary clearance in target jurisdictions/classes;
- test pronunciation, spelling and meaning in pilot languages;
- decide master brand vs vertical offer naming.

`CIFEDRA CONNECT` may remain master brand while landing communicates one narrow
offer.

Deadline:

- week 1: shortlist of at least three names/domains;
- week 2: preliminary clearance and registrant/legal-owner model;
- reserve primary plus defensive/fallback domains;
- if clearance/availability fails, use the pre-approved fallback instead of
  blocking store and organization verification.

### 6.2 Domain

Purchase only after naming clearance.

Required namespace:

| Host/path | Purpose |
| --- | --- |
| apex / `www` | Landing. |
| `app` | Client WEB. |
| `api` | API. |
| `help` | Help center/support/legal guides. |
| `status` | Service status. |
| `/ios`, `/android` | Store redirects. |
| `/privacy`, `/terms`, `/delete-account` | Public compliance pages. |

Controls:

- company/product ownership;
- accredited registrar;
- 2FA and registrar lock;
- auto-renew and backup payment/contact;
- access register;
- SPF/DKIM/DMARC;
- DNS/TLS monitoring.

`cifedra.app` is currently used in landing as a placeholder, but DNS records
were not found on 2026-06-20. Availability and ownership must be confirmed
before publication.

## 7. Content

Required before closed beta:

- vertical landing;
- how it works;
- sample result/artifact;
- expert criteria;
- confidentiality and trust;
- pricing/pilot terms;
- FAQ;
- support/help center;
- privacy, terms and deletion;
- onboarding and lifecycle emails;
- operator scripts.

Landing rule:

- unavailable WEB/store links are hidden or marked as waitlist/beta;
- QR redirects are published only after DNS and destination verification;
- product claims match actual beta capabilities.

## 8. Product analytics

North Star candidate:

```text
Weekly confirmed useful outcomes
```

Before real pilot create a metric dictionary:

| Metric | Required definition |
| --- | --- |
| Case | Inclusion/exclusion and unique identifier. |
| Completed case | Required terminal state/artifact. |
| Useful outcome | Survey/status rule and respondent. |
| Fill rate | Eligible requests with qualified provider / eligible requests. |
| Acceptance | Accepted valid offers / delivered valid offers. |
| Repeat | User cohort and observation window. |
| Support SLA | Start/end timestamps and exclusions. |

For every metric specify formula, denominator, cohort window, event/source,
owner, target and data-quality check.

Funnel:

```text
Qualified visit
  -> Started Need
  -> Completed Intake
  -> Match shown
  -> Contact requested
  -> Accepted
  -> Engagement completed
  -> Useful Result confirmed
  -> Repeat / Referral
```

Marketplace/operations:

- supply coverage/fill rate;
- provider response and acceptance;
- time to qualified match;
- operator minutes per case;
- cancellation/no-response;
- complaints and deletion SLA.

Economics:

- revenue per completed case;
- provider compensation;
- support and infrastructure cost;
- gross margin;
- acquisition cost per activated Need;
- repeat contribution.

Privacy rule:

- analytics does not contain Need free text, documents, exact address, message
  body or other sensitive payload;
- event taxonomy reviewed before API/client instrumentation.

## 9. Legal and privacy

Before real pilot data:

- launch countries/regions and applicable law;
- legal entity/interim operator;
- controller/processor and marketplace/agency/service roles;
- data residency and cross-border transfer model;
- consumer protection, invoicing/tax and governing law;
- Terms of Use;
- Privacy Policy;
- provider/expert terms;
- consent and disclosure;
- confidentiality/NDA process;
- retention and deletion;
- prohibited use and age policy;
- moderation/report/dispute;
- incident communication;
- data processor/provider inventory.

### 9.1 Confidential document lifecycle

For SRS and other artifacts define:

- allowed types, size and content restrictions;
- classification and redaction;
- malware scanning and quarantine;
- checksum, encryption and storage location;
- owner, participants and ACL;
- preview/download policy and watermark if needed;
- expert confidentiality/use obligations;
- subprocessor/translation/AI transfer rules;
- retention, backup retention and verified deletion;
- incident and unauthorized access response.

Before stores:

- public privacy URL;
- in-app account deletion;
- external deletion URL;
- App Store privacy details;
- Google Data Safety;
- support contact and website;
- third-party SDK data inventory;
- Apple privacy manifests, required-reason APIs and SDK signatures/report;
- Apple export compliance and EU DSA trader status where applicable;
- Google target API requirement, ads/app access/target audience/content rating
  declarations and restricted permission review;
- UGC/profile moderation: report, block, filtering and moderation SLA.

Real payment, payouts and marketplace commissions require separate legal and
financial SRS.

## 10. Pricing and commercial validation

Do not freeze pricing before interviews.

Test:

- one-off quick review;
- full review with artifact;
- organization/team package;
- paid pilot or invoiced concierge service;
- provider compensation;
- refund/rework conditions.

Decision evidence:

- at least several real paid cases;
- measurable operator effort;
- provider payout accepted;
- gross margin direction positive;
- repeat intent.

In-app PSP is not required for commercial validation if payment can legally and
operationally occur outside the product pilot.

## 11. Pilot recruitment

Target baseline:

- 10 design partners;
- 8 verified experts;
- first controlled cohort: 5-10 completed cases;
- expansion cohort: cumulative 20-30 completed cases after review.

Each cohort defines paid/unpaid status, inclusion/exclusion, completion and
stop criteria.

Channels:

- founder-led outreach;
- professional contacts;
- Telegram and analyst/architect communities;
- Habr/VC.ru expert content;
- webinars and live reviews;
- SRS checklists/templates;
- partnerships with integrators and education providers.

Paid acquisition starts only after:

- supply coverage;
- stable funnel;
- support capacity;
- privacy/safety readiness;
- useful outcome evidence.

Marketing experiment system:

- ICP/message matrix;
- hypothesis backlog and owner;
- channel budget cap;
- UTM/attribution standard;
- CRM/waitlist consent and lifecycle;
- acquisition -> activated Need -> useful outcome reporting;
- CAC/quality stop threshold approved before each paid test.

## 12. Developer and store accounts

Create early because verification can delay release.

Apple:

- organization account where possible;
- annual membership 99 USD, regional price may vary;
- App Store Connect team roles;
- TestFlight beta information and feedback contact;
- privacy and accessibility information;
- review demo account/instructions.
- Xcode 26 or later with iOS 26 SDK for submissions as required since
  2026-04-28;
- privacy manifest/required-reason API and SDK signature validation;
- DSA trader status if distributed in the EU.

Google:

- organization account where possible;
- one-time 25 USD registration fee;
- identity/organization verification;
- website and public developer contacts;
- Data Safety and deletion URL;
- internal/closed testing tracks.
- target Android 15/API 35 or higher under the current official requirement;
- app content, ads, target audience, content rating, access and permission
  declarations.

For a new personal Google Play account, plan at least 12 opted-in closed testers
for 14 continuous days before production access.

## 13. Store and launch assets

- final app name/subtitle;
- icon;
- screenshots by supported device;
- short/full descriptions;
- keywords/category;
- localized assets;
- privacy/support/deletion URLs;
- reviewer notes and demo account;
- age rating and permissions explanation;
- release notes;
- support and incident contacts.

Mobile public release follows stable WEB beta and production API.

## 14. Launch sequence

### Phase A. Offer test

- interviews;
- waitlist/vertical landing;
- synthetic/redacted walkthroughs;
- no broad advertising.

### Phase B. Concierge pilot

- starts only after `D0`;
- controlled users and experts;
- manual operations;
- artifact/result evidence;
- pricing tests.

### Phase C. WEB closed beta

- starts only after `G6 - External Beta Entry`;
- end-to-end product flow;
- operator support;
- analytics and deletion;
- weekly architecture/product review.

### Phase D. Mobile beta

- TestFlight;
- Google internal/closed test;
- device and notification feedback.

### Phase E. Public Work launch

- production WEB;
- progressive mobile release;
- limited channel activation;
- daily launch operations.

### Phase F. Expansion

1. Improve Work.
2. Add Skills after booking/reminder readiness.
3. Add Life after safety/geo/moderation/dispute readiness.

## 15. Go/no-go metrics

Targets are approved after discovery; examples of evidence:

- intake completion;
- provider acceptance;
- useful outcome;
- repeat/referral;
- supply fill;
- support SLA;
- complaint rate;
- deletion SLA;
- gross margin direction.

Public scaling is prohibited when:

- supply cannot cover demand;
- useful outcome is weak;
- support effort is unbounded;
- privacy/safety issues unresolved;
- paid traffic produces registrations but not completed useful outcomes.

## 16. Architecture feedback from product tests

Each pilot/beta review asks:

1. Which step failed and why?
2. Is the problem product, UX, operations, data or architecture?
3. Can it be solved by configuration/policy?
4. Does it change lifecycle or source of truth?
5. Does it add PII, provider or deployment boundary?
6. Which SRS/HLD/ADR/test must change?

Product evidence updates architecture only through the governed change loop in
the [master plan](../system/cifedra-development-implementation-master-plan.md).

## 17. Sources

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines).
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).
- [Apple App Privacy](https://developer.apple.com/app-store/app-privacy-details/).
- [Apple upcoming submission requirements](https://developer.apple.com/news/upcoming-requirements/).
- [Apple third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/).
- [Google Play Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469).
- [Google Play account deletion](https://support.google.com/googleplay/android-developer/answer/13327111).
- [Google Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878).
- [Google Play app review preparation](https://support.google.com/googleplay/android-developer/answer/9859455).
- [Google Play preview assets](https://support.google.com/googleplay/android-developer/answer/9866151).
- [ICANN accredited registrars](https://www.icann.org/en/contracted-parties/accredited-registrars).
