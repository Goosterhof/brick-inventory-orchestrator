# Quality Warden — Gallery Wing Graduation Log

Training proposals from Audits filed against the Gallery Wing (frontend / Vue). Inherited from the pre-merger Building Inspector at Brick & Mortar Associates. A proposal must prove itself across **at least 2 audits** before being promoted into the Quality Warden's SOP body. The Steward manages this log.

### Candidates

| Proposal | First Observed | Report Evidence | Context |
|---|---|---|---|
| Before SOP G-6 (test sampling), cross-reference source files against spec files — any source without a corresponding spec should be flagged even if coverage shows 100% | 2026-03-20 | _(pre-records)_ | Shared components audit: found `useFormSubmit` had 100% coverage via integration but no isolated spec documenting its contract |
| SOP G-6 (showcase readiness — note: now SOP Cross-Wing) should compare sibling components in the same category for pattern consistency — single-component reviews miss divergence | 2026-03-20 | _(pre-records)_ | Shared components audit: caught CameraCapture/BarcodeScanner slot inconsistency by reading both side-by-side |
| SOP G-2 ADR-004 check should grep for ALL direct imports from `string-ts` in production code, not just `deepCamelKeys` by name | 2026-04-11 | 2026-04-11-post-creative-engine-audit | `auth/index.ts` imports `deepSnakeKeys` from `string-ts`; the graduated narrow grep for `deepCamelKeys` would have missed it. Broader `from "string-ts"` pattern needed. |
| SOP G-4 should verify Pattern Master parameter tracking log accuracy against claimed delivery count | 2026-04-11 | 2026-04-11-post-creative-engine-audit | ADR-015 requires parameter records per delivery; inspector did not verify the parameter graduation log this cycle — acknowledged as a miss. |
| SOP G-1 (quality gauntlet) should include `npm run test:integration:run` when the audit scope includes page composition or cross-domain integration work | 2026-05-05 | 2026-05-05-integration-test-baseline-triage | Integration suite is decoupled from every merge gate; 5 failures sat silently red on `main` for 65+ merges. SOP-driven invocation gives the Warden a backup detection layer independent of CI gating. |
| SOP G-6 (test quality audit) should add an assertion-depth paragraph for integration tests: assertions that check only component existence (L0) without rendered content provide no detection advantage over unit tests with stubs | 2026-05-05 | 2026-05-05-integration-test-baseline-triage | The L0/L1/L2/L3 framework currently applies to unit tests only. Failures 1, 2, 3, 5 of the integration triage were detectable precisely because the mock-server refactor upgraded assertions from translation-key checks to user-visible-text checks. |

### Graduated

| Proposal | Graduated | Confirming Reports | Promoted To |
|---|---|---|---|
| SOP G-3 should add a "verify document exists" step before comparing — if a referenced doc is missing, flag its absence as a finding rather than silently skipping | 2026-03-25 | 2026-03-24-showcase-app, 2026-03-25-shared-directory-audit | SOP G-3 |
| SOP G-1 should add a failure classification step: for each gauntlet failure, note whether caused by audited scope or pre-existing/unrelated | 2026-03-25 | 2026-03-24-showcase-app, 2026-03-25-shared-directory-audit | SOP G-1 |
| SOP G-2: grep for `deepCamelKeys` in production code — any call outside `@shared/helpers/string.ts` is a potential ADR-004 violation | 2026-03-29 | 2026-03-26-families-app-audit, 2026-03-29-post-delivery-audit | SOP G-2 |
| SOP G-3: for numeric count claims in docs, verify against canonical source of truth (registry, directory listing, test runner output) | 2026-03-29 | 2026-03-26-families-app-audit, 2026-03-29-post-delivery-audit | SOP G-3 |
| SOP G-3: reverse-verify — list actual `src/apps/*/domains/` directories and confirm each appears in the domain map | 2026-04-11 | 2026-03-29-post-delivery-audit, 2026-04-11-post-creative-engine-audit | SOP G-3 |
| SOP G-1: capture full collect guard reporter output separately from pass/fail in gauntlet results table | 2026-04-11 | 2026-03-29-post-delivery-audit, 2026-04-11-post-creative-engine-audit | SOP G-1 |

### Dropped

| Proposal | Dropped | Report Evidence | Reason |
|---|---|---|---|
| SOP G-1 should verify all devDependencies are installed before running npm scripts | 2026-03-20 | _(pre-records)_ | The "missing dependency" was a false positive — `@vitest/coverage-istanbul` was in `package.json` all along. The real issue was non-executable husky hooks. This check would add noise without catching the actual problem class. |
