# Work Order: Enforce SUT-only top-level `.vue` imports in unit specs

**Work Order #:** 2026-05-27-enforce-sut-only-vue-imports-in-unit-specs
**Filed:** 2026-05-27
**Issued By:** The Steward (per CEO direction 2026-05-27 — see PR #119 review comments)
**Assigned To:** Brickwright
**Wing:** Gallery
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `enforce-sut-only-vue-imports-in-unit-specs`

---

## The Job

Add an architecture test that prevents the test-perf regression class surfaced by PR #119 (PartsPage). The root cause was: a unit spec imported 7 components at the top of the file purely to use them as `findComponent(X)` arguments — each import dragged a transitive chain (the worst offender pulled `ModalDialog → @phosphor-icons/vue`) into the Vite collect phase, blowing collect-delta from ~480ms baseline to 3316ms over time.

The fix in PR #119 replaced those top-level imports with `findComponent({ name: 'X' })` calls. This Work Order makes that pattern enforceable: in unit specs, only the **system-under-test** (the `.vue` file matching the spec name, e.g. `PartsPage.spec.ts` ↔ `PartsPage.vue`) may be imported as `.vue` at top level. All other component references must go through `findComponent({ name: 'X' })`.

## Scope

### In the Box

- File: `frontend/src/tests/unit/architecture.spec.ts` — add a new test in the same neighborhood as the existing `mount boundary enforcement` test (lines 694-755).
- Rule shape:
  1. List all `src/tests/unit/**/*.spec.ts` files.
  2. For each spec, derive the SUT name from the filename (strip `.spec.ts` → expected `.vue` file name, e.g. `PartsPage.spec.ts` → `PartsPage.vue`).
  3. Parse the spec's import statements.
  4. For every `import X from '...X.vue'` whose `.vue` file name ≠ the SUT name, the test fails with a message pointing the author at `findComponent({ name: 'X' })`.
- Opt-out mechanism: a small allowlist (either an inline comment marker like `// arch-allow: cross-component-import` or a JSON exception list in the arch-test file itself — Brickwright's call, but document the choice and reasoning in the Build Record). Aim for narrow opt-outs; the rule should bite unless the spec has a defended exception.
- Verify the rule against current `main` post-merge of PRs #119/#120/#121 — every existing spec should pass, OR the documented opt-out should cover any legacy violations with a one-line per-case justification.

### Not in This Set

- No changes to existing spec files (the rule should pass on current state; if a violation surfaces, route it to a follow-up WO).
- No changes to the `mount boundary enforcement` test (sibling check, different concern).
- No changes to `collect-guard-reporter.ts` thresholds or its informational-vs-failing semantic — see Seed `Promote collect-guard from informational to failing` in the Pulse for the deferred follow-on.
- No bulk renames of spec files to align with SUT names — if a spec is misnamed against its SUT, that's a separate concern.
- No changes to integration specs at `src/tests/integration/**` — they intentionally use full `mount` and broader import surfaces; the rule is unit-spec-only.

## Acceptance Criteria

- [ ] New architecture test in `frontend/src/tests/unit/architecture.spec.ts` enforces the SUT-only top-level `.vue` import rule.
- [ ] Test passes on current `main` (after PRs #119/#120/#121 merge).
- [ ] A deliberately-violating temp spec (added in a scratch commit, reverted before push) triggers the test failure with a clear error message naming the offending import and suggesting `findComponent({ name: 'X' })`.
- [ ] Opt-out mechanism works: one documented case where it's required, or a clear note in the Build Record that no opt-outs were needed.
- [ ] Build Record records: implementation approach (filename-based SUT derivation, AST parsing or regex-based import detection, opt-out mechanism choice), any legacy violations and their disposition, and one example of the test's failure message.
- [ ] Frontend pre-push gauntlet green.

## References

- Source finding: PR [#119](https://github.com/Goosterhof/brick-inventory-orchestrator/pull/119) (PartsPage collect-guard fix), Build Record `2026-05-27-partspage-spec-collect-guard-fix.md`.
- CEO direction 2026-05-27: "can we somehow enforce this behaviour through an architecture test or something? Cause it's a useful finding to enforce."
- Sibling arch test: `architecture.spec.ts` lines 694-755 (`mount boundary enforcement`) — same file, same pattern, different rule.
- ADR-0012 (test isolation collect guard) — the regression class this WO targets, statically rather than dynamically.
- Future-deferred: Seed in Pulse `Promote collect-guard from informational to failing` — the heavier-beast complementary enforcement.

## Notes from the Issuer

This is **infrastructure for the test-perf class of bug**, not just a single fix. The arch test, once landed, prevents the next PartsPage-style degradation by failing at code-review time rather than by reporting after-the-fact in a coverage run.

The CEO explicitly named this as "useful to enforce." The framing: arch tests are how the Gallery wing institutionalizes lessons learned. Each one is a small, permanent guardrail. Three guardrails in this neighborhood already exist (mount boundary enforcement and others); this WO adds the fourth.

Forward-looking: the heavier complementary enforcement — promoting `collect-guard-reporter.ts` from informational to failing — is captured as a Seed in `.claude/docs/pulse.md` per CEO direction 2026-05-27 ("heavier beast, would be nice to eventually get to"). That Seed has its own trigger conditions; this WO doesn't preempt it.

Sub-threshold push (one arch-test file change). ADR-0028 uniform-rule applies; close in post-merge follow-up commit on `main`.

---

**Status:** Open
**Build Record:** _to be filled when filed_
