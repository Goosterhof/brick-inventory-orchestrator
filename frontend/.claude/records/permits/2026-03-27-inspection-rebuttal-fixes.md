# Building Permit: Inspection Rebuttal & Fixes — Families App Audit

**Permit #:** 2026-03-27-inspection-rebuttal-fixes
**Filed:** 2026-03-27
**Issued By:** CFO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Formally rebut or accept the 6 findings from the 2026-03-26 families app audit (2 medium, 4 low), then fix all accepted findings in a single cleanup sweep. This is a rebuttal + remediation permit — no new features.

## Scope

### In the Box

- Formal rebuttal response (ACCEPT / REBUT / PARTIAL) for both medium findings
- Code fixes for all 6 findings:
    1. **Finding 1 (medium):** Replace `deepCamelKeys(data) as T` with `toCamelCaseTyped<T>(data)` in `HomePage.vue`, `SettingsPage.vue`, `SetDetailPage.vue`, `PartsPage.vue`. Remove direct `string-ts` imports.
    2. **Finding 2 (low):** Replace manual `set_num` in `ScanSetPage.vue` with `deepSnakeKeys()`.
    3. **Finding 3 (low):** Replace raw type cast in `SettingsPage.vue` with `isAxiosError()`.
    4. **Finding 4 (low):** Convert eager import in `home/index.ts` to lazy import.
    5. **Finding 5 (low):** Replace hardcoded English strings in `ScanSetPage.vue` and `IdentifyBrickPage.vue` scanner props with translation service calls. Add required translation keys to EN and NL schemas.
    6. **Finding 6 (medium):** Fix CLAUDE.md — correct ADR-0009 mislabeling and resolve the ADR-0014 dead reference.
- Updated tests for any behavioral changes (translation keys, error handling)
- Full quality gauntlet pass

### Not in This Set

- New features or UI changes beyond what findings require
- Pulse or domain map updates (those are doc debt — separate concern)
- Inspector SOP changes (those go through the inspector's graduation log)
- Any refactoring not directly tied to a finding

## Acceptance Criteria

- [ ] All 6 findings formally responded to (ACCEPT / REBUT / PARTIAL) in the construction journal
- [ ] No `deepCamelKeys` imports remain in families app production files (only `toCamelCaseTyped` and `deepSnakeKeys` from `@shared/helpers/string`)
- [ ] `ScanSetPage.vue` uses `deepSnakeKeys()` for outgoing payload
- [ ] `SettingsPage.vue` uses `isAxiosError()` for error handling
- [ ] All 7 domain `index.ts` files use lazy imports consistently
- [ ] Scanner component props receive translated strings, with keys in both EN and NL schemas
- [ ] CLAUDE.md ADR references are accurate — no dead references, no mislabeled ADRs
- [ ] Quality gauntlet passes (format:check, lint, lint:vue, type-check, test:coverage, knip, size)
- [ ] 100% test coverage maintained

## References

- Inspection Report: [2026-03-26-families-app-audit](../inspections/2026-03-26-families-app-audit.md)
- ADR-004: `.claude/docs/decisions/004-case-conversion-discipline.md`
- Rebuttal Protocol: `.claude/agents/lead-brick-architect.md` (§ The Rebuttal Protocol)

## Notes from the Issuer

CFO assessment: none of these 6 findings are viably rebuttable. The inspector cited the ADR's own text against the code for Finding 1, and Finding 6 is objectively verifiable (the ADR doesn't exist). Expect ACCEPT across the board — but the protocol is the protocol, so file the formal responses.

Finding 5 (translation keys) has the most surface area — you'll need to add keys to both language schemas and update the scanner page templates. Don't over-engineer it; just add the keys and pass `t()` calls through the props.

Finding 6 (CLAUDE.md) requires a judgment call: the war-room ADR references are external. The cleanest fix is to clarify they're external references not tracked locally, and correct the ADR-0009 label. Do NOT create local placeholder ADRs just to make the numbers resolve.

---

**Status:** Complete
**Journal:** [2026-03-27-inspection-rebuttal-fixes](../journals/2026-03-27-inspection-rebuttal-fixes.md)
