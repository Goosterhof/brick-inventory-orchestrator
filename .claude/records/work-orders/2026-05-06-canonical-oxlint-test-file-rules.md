# Building Permit: Canonical oxlint test-file vitest expansion

**Permit #:** 2026-05-06-canonical-oxlint-test-file-rules
**Filed:** 2026-05-06
**Issued By:** General
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Adopt the war-room canonical's 9-rule test-file vitest expansion (deferred in PR #214) into BIO's `.oxlintrc.json` test override and sweep the call sites surfaced by `prefer-strict-equal` (`toEqual` → `toStrictEqual`).

## Scope

### In the Box

- Add the canonical's 9 test-file rules to the `src/tests/**` override in `.oxlintrc.json`: `no-disabled-tests`, `no-focused-tests`, `no-identical-title`, `prefer-strict-equal`, `prefer-to-be`, `prefer-to-contain`, `no-conditional-expect`, `valid-describe-callback`, `no-commented-out-tests`.
- Sweep all 89 `.toEqual(` → `.toStrictEqual(` call sites in `src/tests/**` (mechanical — survey-verified safe; no class instances, no explicit `: undefined` properties).
- Update `frontend/CLAUDE.md` § Linting Standards to retire the deferred-decision note and record adoption.
- Branch: `chore/canonical-oxlint-test-file-rules`. Slug strict-equal to permit slug.

### Not in This Set

- Reclassifying the two correctness-category disagreements (`valid-expect`, `expect-expect`) — both stay disabled with original rationale from PR #214.
- Any test-quality refactors beyond the mechanical equality-strictness swap.
- War-room `templates/README.md` update (will land separately on the war-room main).

## Acceptance Criteria

- [ ] `.oxlintrc.json` `src/tests/**` override carries all 9 canonical test-file vitest rules at `error`.
- [ ] `npm run lint` returns 0 warnings, 0 errors.
- [ ] `npm run type-check` clean.
- [ ] `npm run test:unit` — 1310/1310 pass.
- [ ] `npm run knip` clean.
- [ ] `frontend/CLAUDE.md` § Linting Standards reflects adoption (no remaining deferred-decision callout for the 9-rule expansion).

## References

- Sister permit: PR #214 (`chore/canonical-oxlint-correctness-category`) — adopted `categories.correctness: error` and the two documented overrides; deferred this 9-rule expansion.
- Sister permit: PR #213 (`chore/canonical-tsconfig-strict-flags`) — adopted canonical strict toggles onto `tsconfig.app.json`.
- War Room Context: General-led canonical frontend config rollout for BIO. Track record: `war-room/templates/README.md` § oxlint adoption notes.

## Notes from the Issuer

Threshold-triggering work — 24 files modified (88 line-edit `.toEqual` swaps + config + CLAUDE.md). 21 of those 24 files are pure mechanical replacements; the only decision-bearing changes are in `.oxlintrc.json` (9 rule additions) and `CLAUDE.md` (1 paragraph rewrite).

Survey of `toEqual` call shapes performed before sweep — no class instances, no explicit `: undefined` properties, no sparse arrays. The behavioral difference between `toEqual` and `toStrictEqual` does not surface in any flagged callsite.

The 8 non-`prefer-strict-equal` rules in the expansion came in clean — BIO already followed good test hygiene (no `.skip`/`.only`, no commented-out tests, no identical titles, no conditional expects, valid describe callbacks). Free wins from rules that confirm existing practice.

---

## Steward Note — 2026-05-27 Supersession Close

Closed without an original-author Build Record because all six Acceptance Criteria are already met on `main`:

- The 9 canonical vitest rules are present at `error` level in `frontend/.oxlintrc.json` lines 236–244 (plus two bonus 1.57/1.61 rules: `valid-expect-in-promise` error, `prefer-strict-boolean-matchers` warn).
- The `.toEqual` → `.toStrictEqual` sweep is complete: 0 `toEqual` callsites in `src/tests/**`, 110 `toStrictEqual` callsites; sweep state enforced going forward by the `prefer-strict-equal` rule.
- `frontend/CLAUDE.md` § Linting Standards carries no deferred-decision callout.
- `npm run lint` / `type-check` / `test:unit` / `knip` clean per PR #113's mission report.

The 9-rule expansion landed as a strict subset of the broader 31-rule canonical adoption in [PR #113](https://github.com/script-development/brick-inventory-orchestrator/pull/113) (`chore(lint): adopt oxlint 1.67 canonical rule additions`, merged 2026-05-26). The rules themselves arrived in the pre-merger `brick-inventory-frontend` repo before the 2026-05-17 subtree absorption — `git log -S "prefer-strict-equal" -- frontend/.oxlintrc.json` returns only the absorption commit (`83c2f28`, PR #28). Pre-merger SHAs are unreachable per the documented subtree history collapse.

This WO was filed pre-merger in BIO orchestrator vocabulary ("Building Permit / Lead Brick Architect / General"). The body is preserved verbatim above as the filing-time record. The close uses current Brickworks vocabulary.

Full close rationale and recurring-pattern memo in the Build Record below.

---

**Status:** Closed (superseded — see Steward Note 2026-05-27)
**Build Record:** [`2026-05-27-close-canonical-oxlint-test-file-rules`](../build-records/2026-05-27-close-canonical-oxlint-test-file-rules.md)
