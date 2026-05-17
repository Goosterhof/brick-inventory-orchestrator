# Warehouse Pulse — _Where Things Stand_

A consolidated, current-state assessment of the backend codebase. Updated by the Logistics Director at end-of-session. Not chronological — this is the **living snapshot** the Head Sorter reads before touching code.

**Rules:**

- Each section carries an `Assessed:` date — update it when you re-evaluate that section
- Sections not revisited keep their old date, making staleness visible
- Overwrite sections with current state — don't append history
- Keep entries factual and concise — one line per item

---

## Overall Health

**Rating:** 8.5/10
**Assessed:** 2026-05-05

Architecture is sound — PHPStan at max with zero errors (Laravel 13.7 deprecation cascade closed via ADR-0012's PHP 8.5 tightening), Deptrac with zero violations, full architecture tests passing (21 suites), 13 coherent ADRs. Recent deliveries since 2026-04-16: Laravel 13.7 deprecation cleanup + ADR-0012 (PHP 8.5+ runtime tightening), storage-map ResourceData, reverse-lookup-lens endpoint with `DB::listen` query-budget proof, PHPStan war-room rules adoption (four custom rules: `forbidDatabaseManager.inAction`, `requireListReturnAnnotation`, `forbidStaticCallToFacade.inAction`, `requireExplicitTransactionContract`), ADR-0013 pre-push permit verification gate (CaptainHook structural enforcement of Operations Protocol), full-sweep audit 2026-05-05 + remediation round 5 (Findings 5 & 6 closed via retroactive Director Evaluations on the reverse-lookup-lens and phpstan-warroom journals).

## Active Concerns

**Assessed:** 2026-05-05

| Concern | Severity | Status | Notes |
|---|---|---|---|
| `php8.5-pcov` not installed on dev host | Medium | Open — sudo-gated | One-line `sudo apt install php8.5-pcov` (deb.sury.org PPA). Dockerfile already commits the install for the Docker path. Until installed, `composer test:coverage` / `mutation` / `test:feature-coverage` bail on canonical PHP 8.5. |
| `covers()` mismatch in `CorsConfigTest` blocking feature-coverage | Low | Open — depends on `php8.5-pcov` for upstream visibility | `covers(HandleCors::class)` targets a vendor/ class outside `phpunit.feature-coverage.xml`'s `<source>`. Driver bail fires first today; surfaces as next blocker once driver lands. |
| Deferred mutation drill from 2026-04-19 L13 upgrade | Low | Open — depends on `php8.5-pcov` install | The L13 upgrade journal deferred mutation across three timed-out shifts. PHPStan-green precondition is now satisfied (ADR-0012); only the driver install remains. |
| Dockerfile build verification (`docker compose build backend`) | Low | Open — environmental | The 2026-04-29 PCOV install + PHP 8.5 alignment shifts both modified `docker/backend.Dockerfile`. Diff committed-ready; verification blocked in dev shell (no Docker daemon). |
| ~~Laravel 13.7 deprecation cascade — 4 PHPStan errors at level max~~ | ~~High~~ | Resolved 2026-04-30 | ADR-0012 tightened runtime to PHP 8.5+; four errors closed via `bootstrap/app.php`, `config/sanctum.php`, `config/database.php`. Journal: `2026-04-30-laravel-137-deprecation-cleanup`. |
| ~~Operations Protocol drift — large deliveries shipping without permit/shift log (third-cycle recurrence)~~ | ~~Medium~~ | Resolved 2026-05-05 | ADR-0013 introduced a CaptainHook pre-push verification gate (threshold-gated permit lookup, fail not prompt). Replaces human-memory remediation that did not hold across three audit cycles. |
| ~~Two unfilled Director Evaluations (Findings 5 & 6, 2026-05-05 audit)~~ | ~~Medium~~ | Resolved 2026-05-05 | Retroactive evaluations appended to `2026-04-29-reverse-lookup-lens` and `2026-04-29-phpstan-warroom-rules-adoption`; commit `a64edf4`. Both clearly marked filed-retroactively. |
| ~~`InvalidApiResponseException` not globally handled~~ | ~~High~~ | Resolved | 502 renderer registered in bootstrap/app.php; feature test confirms |
| ~~`ImportOwnedSetsAction` try-catch violates ADR-0003~~ | ~~High~~ | Resolved | ADR-0003 amended with approved exception documentation |
| ~~4 architecture tests produce no assertions (risky)~~ | ~~Medium~~ | Resolved | Counter assertions added; 83 tests, 1007 assertions, 0 risky |
| ~~UniqueConstraintViolationException try-catch undocumented~~ | ~~Medium~~ | Resolved | ADR-0003 amended with second approved exception (5 Actions) |
| ~~RoutingArchitectureTest missing 5 new routes~~ | ~~Medium~~ | Resolved | All 29 routes now in hardcoded enforcement list |
| ~~PHP coverage driver missing from environment (single-driver framing)~~ | ~~Medium~~ | Superseded 2026-04-29 | Investigation revealed the real cause was host `php` aliased to 8.5 with no pcov build (while `php8.4-pcov` was already installed). Resolved by Path B (canonical PHP 8.5 across dev/prod); replaced by the more granular Open Items above. |

## In-Progress Work

**Assessed:** 2026-05-05

| Work Item | Status | Next Step |
|---|---|---|
| Stud & Sort Logistics setup | Complete | CLAUDE.md, agents, docs, records all in place |
| Baseline audit | Complete | Report filed; evaluation appended; pulse updated |
| Audit remediation (round 1) | Complete | 2 high, 1 medium, 3 low findings resolved |
| Routine sweep audit | Complete | 5 findings (0 high, 2 medium, 3 low) — all remediated |
| Audit remediation (round 2) | Complete | ADR-0003 try-catch docs, test gaps, code quality |
| Queue-based imports | Complete | ImportJob model, async Rebrickable imports with race condition hardening |
| Response caching | Complete | ETag + application-level caching for read endpoints |
| Cursor pagination | Complete (partial) | Only `/family/parts` retains cursor pagination; three other list endpoints reverted to unbounded |
| Test gap sweep | Complete | Policy, factory, and resource test gaps closed |
| Job layer hardening | Complete | JobArchitectureTest added; conventions documented |
| Audit remediation (round 3) | Complete | 2026-03-30 full sweep — 6 findings resolved |
| Audit remediation (round 4) | Complete | 2026-04-11 post-delivery sweep — ADR-0003, CLAUDE.md, CI, pulse |
| Action contract hygiene | Complete | 2026-04-16 — 5 Actions normalized (family-scoped signatures, authorization-before-transaction) |
| Master shopping list endpoint | Complete | 2026-04-16 — `GET /family-sets/missing-parts` bulk shortfall aggregation with `unknownFamilySetIds` honesty contract |
| Storage-map ResourceData | Complete | 2026-04-29 — storage-aisle hierarchy ResourceData established |
| Reverse-lookup-lens endpoint | Complete | 2026-04-29 — three-query bulk part-usage aggregation with `DB::listen` "at most N queries" runtime proof |
| Laravel 13.7 deprecation cleanup + ADR-0012 | Complete | 2026-04-30 — runtime tightened to PHP 8.5+; PHPStan green at level max |
| PHPStan war-room rules adoption | Complete | 2026-05-01 — four custom rules adopted (`forbidDatabaseManager.inAction`, `requireListReturnAnnotation`, `forbidStaticCallToFacade.inAction`, `requireExplicitTransactionContract`); 0 findings on discovery pass |
| Full-sweep audit 2026-05-05 | Complete | 7 findings filed; remediation round 5 in progress |
| ADR-0013 pre-push permit verification gate | Complete | 2026-05-05 — CaptainHook structural enforcement supersedes human-memory remediation for Operations Protocol drift |
| Audit remediation (round 5) | In progress | Findings 5 & 6 closed (retroactive Director Evaluations); ADR-0013 closes Finding 7; remaining findings tracked per shipping orders in `.claude/records/permits/` |

## Pattern Maturity

**Assessed:** 2026-05-05

| Pattern | Maturity | Evidence |
|---|---|---|
| Action layer | Battle-tested | Architecture tests guard it; all pass. Three approved try-catch exceptions documented in ADR-0003: partial-failure (ImportOwnedSetsAction), UniqueConstraintViolationException upsert (5 Actions), and race-condition guard (StartImportAction). Custom PHPStan rules (`forbidDatabaseManager.inAction`, `forbidStaticCallToFacade.inAction`, `requireExplicitTransactionContract`) adopted 2026-05-01 with 0 findings — confirming the pattern is structurally clean. |
| Service layer (2 classes) | Battle-tested | Contract interfaces, Deptrac boundaries hold, no facade or model leakage |
| ResourceData pattern | Battle-tested | All have `from()` factories, EAGER_LOAD where needed. ComputedResourceData (ADR-0010) handles DTO-sourced responses; storage-map and reverse-lookup-lens (2026-04-29) are recent envelope applications |
| Explicit cascade deletion | Battle-tested | MigrationArchitectureTest + CascadeRelationArchitectureTest confirm compliance |
| Thin controllers | Battle-tested | No constructors, no try-catch, method injection only. ControllerArchitectureTest confirms |
| Job layer (1 class) | Established | JobArchitectureTest guards conventions; thin wrapper pattern documented in CLAUDE.md |
| Bulk aggregation endpoints (3 endpoints) | Battle-tested | `/family-sets/completion`, `/family-sets/missing-parts`, and the reverse-lookup-lens part-usage endpoint share the SQL-side aggregation discipline — no PHP summation, query budgets proven via `DB::listen` runtime tests (reverse-lookup-lens established this proof technique 2026-04-29) |
| Operations Protocol enforcement | Established | ADR-0013 (2026-05-05) added a CaptainHook pre-push verification gate — threshold-gated permit lookup, fail not prompt. Structural fix superseding three cycles of human-memory remediation for missing paper trail. |

## Tech Debt

**Assessed:** 2026-03-31

| Item | Severity | Notes |
|---|---|---|
| ~~`InvalidApiResponseException` handler gap~~ | ~~High~~ | Resolved — 502 renderer registered, feature test confirms |
| ~~ADR-0003 try-catch exception undocumented~~ | ~~High~~ | Resolved — ADR-0003 amended with approved exception |
| ~~`FamilyPolicyTest` missing policy method tests~~ | ~~Low~~ | Resolved — all 9 policy methods now have unit tests |
| ~~`decisions.md` broken ADR-000 link~~ | ~~Low~~ | Resolved — link fixed |
| `GetFamilyPartsAction` returns raw array (no ResourceData) | Low | Only endpoint bypassing the pattern without documentation |
| `RegisterUserData::familyName` empty-string on invite-code path | Low | Now nullable — passes null when family_name absent |

## Seeds

**Assessed:** 2026-03-25

| Seed | Trigger | What It Means |
|---|---|---|
| ~~Formal pulse baseline~~ | ~~First Inventory Auditor run~~ | ~~Done — 2026-03-25 audit established baseline~~ |
| Learnings bootstrap | First Head Sorter shift | Document gotchas discovered during first session under new regime |
| Coverage infrastructure | Install pcov or xdebug | Unblocks coverage measurement, mutation testing, and full quality metrics |

## Quality Metrics

**Assessed:** 2026-05-05

| Metric | Value | Threshold |
|---|---|---|
| Unit coverage | 100.0% (last measured 2026-04-29 PCOV-install shift, 8.5-via-shim) — currently unable to re-measure on canonical 8.5 (sudo-gated `php8.5-pcov` install) | 100% |
| Feature coverage | Unable to measure (`covers()` mismatch in `CorsConfigTest` + `php8.5-pcov` not installed on canonical 8.5) | 90% |
| Mutation score | 76.97% (last measured 2026-04-29 PCOV-install shift, 8.5-via-shim) — currently unable to re-measure on canonical 8.5 | 76% |
| Architecture tests | 21 suites passing (CLAUDE.md count) — last full run on 2026-05-01 phpstan-warroom shift | All passing |
| PHPStan | Level max, **0 errors** (Laravel 13.7 deprecation cascade closed via ADR-0012) | Level max, zero errors |
| Deptrac | 0 violations | Zero violations |
| Full test suite | Last green run on 2026-05-01 phpstan-warroom shift; counts not re-measured this session | All passing |
