# Building Permit: Integration-Test Baseline Triage

**Permit #:** 2026-05-05-integration-test-baseline-triage
**Filed:** 2026-05-05
**Issued By:** CFO (with CEO authorization)
**Assigned To:** Building Inspector
**Priority:** Standard

---

## The Job

`npm run test:integration:run` has been silently failing on `main` for at least one production cycle. Two construction journals (`2026-05-05-snake-case-payload-keys-cleanup`, `2026-05-03-invite-code-by-email`) flagged "5 pre-existing integration-test failures" without root-causing them, because closing the immediate permit was the priority. That deferral has now happened twice. The Inspector's job is to triage: identify when each failure was introduced, why the gauntlet didn't catch it, and what the fix scope looks like — without fixing them. This is an inspection, not a build.

## Scope

### In the Box

For each of the **5 failing integration tests** below, the Inspector must produce:

1. **Failure signature** — the literal `Expected:` / `Received:` strings and the test file path (already captured below; verify they match a fresh run).
2. **Root cause classification** — which of the following is it?
    - **Stale assertion** (production copy/options changed, test wasn't updated)
    - **Stale fixture** (mock data shape drifted from production)
    - **Broken composition** (real children no longer mount cleanly under the integration harness)
    - **Genuine regression** (production code is wrong; test was right)
3. **Introducing commit** — `git log -p` / `git blame` on both the production source and the test assertion to identify the commit that introduced the divergence. Flag whether the change landed via PR review or direct push.
4. **Time-to-detection cost** — how many merges happened between the introducing commit and today? (i.e., how long did this fail silently?)
5. **Fix scope estimate** — small (one-line assertion update), medium (test rewrite or new assertions), or large (test infrastructure change).

The Inspector must also answer **two systemic questions** that scope larger than any individual failure:

- **Q1: Why doesn't the pre-push gauntlet run integration tests?** Read `package.json`, `husky/pre-push`, and the relevant ADR(s) to determine whether this is intentional (cost/time budget) or accidental (oversight). If intentional, find the ADR that justifies it. If not, flag it as a pattern gap.
- **Q2: Is the integration suite actually run anywhere?** Grep CI config (if any), `Husky` hooks, and `package.json` scripts for `test:integration*` references. If the suite has no automated execution path, that's the systemic finding, not the 5 failures.

The deliverable is a single inspection report at `.claude/records/inspections/2026-05-05-integration-test-baseline-triage.md` (template at `.claude/records/inspections/.inspection-report-template.md`) with the per-failure breakdown, the systemic Q1/Q2 answers, and a prioritized recommendation — _which_ failure(s) the architect should fix first, and _whether_ a separate ADR/permit is needed for the gauntlet question.

### The 5 Known Failures (verified 2026-05-05 against `main` at e50c9bd)

```
1. src/tests/integration/apps/families/domains/brick-dna/pages/BrickDnaPage.spec.ts
   > "renders real EmptyState when API returns no data"
   Expected: "No collection data available yet"
   Received: "No DNA profile yet. Add some sets and we'll map your building fingerprint."

2. src/tests/integration/apps/families/domains/home/pages/HomePage.spec.ts
   > "renders dashboard with real PageHeader and StatCards when logged in"
   Expected: "Dashboard"
   Received: "Build Control"

3. src/tests/integration/apps/families/domains/home/pages/HomePage.spec.ts
   > "shows loading state before stats resolve"
   Expected: "Loading your collection..."
   Received: "Build ControlUnpacking your collection..."

4. src/tests/integration/apps/families/domains/sets/pages/AddSetPage.spec.ts
   > "renders real SelectInput with status options"
   Expected: 5 options
   Received: 6 options

5. src/tests/integration/apps/families/domains/storage/pages/StorageOverviewPage.spec.ts
   > "renders real EmptyState when no storage options"
   Expected: "No storage locations yet"
   Received: "No storage bins yet. Every brick needs a home."
```

### Not in This Set

- **No fixes.** The Inspector does not modify production code or test assertions. If the diagnosis is "trivial one-line update," the report says so and proposes a follow-up architect permit; it does not file the change.
- **No new tests.** Don't write coverage for things that aren't failing.
- **No bundle-size, coverage, or knip audit.** This permit is narrowly scoped to integration-test failure triage. Routine pulse refresh / cross-cutting audits are separate permits.
- **No re-run of the unit suite.** Unit tests pass; that's not the question. The question is the integration layer specifically.
- **No e2e suite investigation.** `e2e/**` is excluded from vitest config; out of scope here.

## Acceptance Criteria

- [ ] Inspection report filed at `.claude/records/inspections/2026-05-05-integration-test-baseline-triage.md`
- [ ] Each of the 5 failures has: failure signature, root cause classification, introducing commit (SHA + author + date + PR# if available), time-to-detection in merges, and fix-scope estimate
- [ ] Q1 (why pre-push doesn't run integration) answered with a concrete reference (ADR, code path, or "no documented reason — gap")
- [ ] Q2 (where the integration suite is actually run) answered with concrete grep evidence (CI config, hooks, scripts)
- [ ] Q3 (how integration tests should be wired into CI) answered with: target workflow file (or "create new"), trigger (push / PR / both), merge-gating posture, parallel-vs-serial with existing CI checks, fail-fast vs run-to-completion. Specific enough that an architect can implement without re-litigating the trade-offs.
- [ ] Prioritized recommendation: which failures to fix first, and explicit ADR / permit pointers for (a) the per-failure architect work and (b) the CI-wiring architect work — these are two separate follow-up permits, not one
- [ ] Severity rating per failure (Low / Medium / High) — and a single overall severity rating for the cluster
- [ ] No production code, test assertions, or CI configuration modified by the Inspector — diagnosis only

## References

- **Predecessor journals that flagged but deferred this:**
    - [`2026-05-03-invite-code-by-email`](../journals/2026-05-03-invite-code-by-email.md) — "Integration suite shows 5 pre-existing failures (BrickDnaPage, HomePage, AddSetPage, StorageOverviewPage), confirmed via `git stash` baseline, unrelated to this work"
    - [`2026-05-05-snake-case-payload-keys-cleanup`](../journals/2026-05-05-snake-case-payload-keys-cleanup.md) — Did not run the integration suite; the failures were not yet visible.
- **Test guard infrastructure:** `src/tests/unit/test-guard-reporter.ts`, `src/tests/unit/collect-guard-reporter.ts` (these enforce per-test execution-time budgets in unit suite; the integration suite has no equivalent — note this if it bears on Q1/Q2).
- **Integration config:** `vitest.integration.config.ts`
- **Pre-push hook:** `.husky/pre-push`
- **Recent suspicious commits** (worth a closer look during root-causing — these merged today):
    - `ce812f7` Merge PR #208 `feat/in-storage-status` — likely introduces failure #4 (AddSetPage option count 5 vs 6)
    - `7d8b020` Merge PR #206 (war-room template adoption / oxfmt — unlikely to drive copy changes but worth checking)

## CEO Directive (added 2026-05-05, post-PR #210 merge)

**Integration tests must run in CI.** This is no longer an open question for the Inspector to recommend on. The CEO has decided.

What this means for the inspection:

- **Q1 ("why doesn't pre-push run integration tests?")** is still in scope, but reframed: identify the historical reason (if any), then assess whether that reasoning still holds given the directive. If the reason was "they're slow," does the ~19 sec runtime actually justify that on CI? If the reason was "no documented decision," that's a documentation gap to flag.
- **Q2 ("where is the integration suite actually run?")** stays in scope unchanged. If the answer is "nowhere automated," that confirms the directive's necessity.
- **NEW Q3: How should integration tests be wired into CI?** The Inspector reads any existing CI config (GitHub Actions / `.github/workflows/`, etc.) and recommends the cleanest implementation path: which workflow file, which trigger (push / PR / both), whether it gates merges, whether it runs in parallel with the existing pre-push gauntlet equivalent on CI, and whether it should bail-fast or run-to-completion. The Inspector does NOT implement — that is a separate architect permit. But the Inspector's recommendation should be specific enough that an architect can build from it without re-discovering the trade-offs.

The 5-failure triage is unchanged. The diagnosis still happens per-failure as originally scoped. The CEO directive only sharpens the systemic recommendation.

## Notes from the Issuer

The pattern here is what the firm should care about more than the bug count.

Five integration tests failing silently is a pulse signal: the integration layer was **decoupled from the merge gate**. The CEO directive closes that loop. The Inspector's value here is in (a) explaining how it got decoupled — was it ever wired up? was it deliberately removed? — and (b) scoping the wiring work clearly enough that the architect's follow-up permit is short and unambiguous.

The Inspector should resist the urge to fold the systemic finding into the 5 individual diagnoses — they are different findings with different fixes. A one-line copy update for BrickDnaPage closes one bug; the CI wiring prevents the next 5. The inspection report should keep them visually separate.

The Inspector should also notice: 4 of the 5 failures are stale-copy assertions in pages whose copy was likely refactored under the **neo-brutalist LEGO design system** (Build Control, Unpacking, Storage Bins, DNA Profile, Building Fingerprint). That stylistic refactor was a deliberate firm decision; the cost of not catching the test fallout was probably ~5 minutes of dev time per failure × 5 failures = ~25 minutes, accumulated silently over weeks. That's small money but a meaningful consistency-of-portfolio signal — a senior reviewer cloning this repo and running the integration suite cold would see five red tests on a green branch and form an opinion. The CI wiring eliminates that future scenario.

Time budget: this is one Inspector shift. If the diagnosis blows past 90 minutes, pause and check in. If a single failure resists root-causing (e.g., the introducing commit was a squash that bundled too many changes), flag it as "diagnosis incomplete — recommend architect investigation" rather than spelunking indefinitely. The Q3 (CI wiring) recommendation should be the most polished part of the report — it's the part that turns into action.

---

**Status:** Open
**Inspection Report:** _link when filed_
