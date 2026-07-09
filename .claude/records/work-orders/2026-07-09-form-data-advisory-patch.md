# Work Order: Patch the form-data high-severity npm advisory

**Work Order #:** 2026-07-09-form-data-advisory-patch
**Filed:** 2026-07-09
**Issued By:** The Steward (supplement to audit [`2026-07-09-warden-cross-wing-sweep`](../audits/2026-07-09-warden-cross-wing-sweep.md) — surfaced by `npm audit` during the 2026-07-09 environment sync; npm-audit was outside the sweep's gauntlet set)
**Assigned To:** Brickwright (Gallery Wing)
**Wing:** Gallery
**Priority:** Elevated — high-severity advisory
**Status:** Open
**Branch slug (for PrePushPermitGate):** `form-data-advisory-patch`

---

## The Job

`npm audit` reports one high-severity advisory: **form-data 4.0.0–4.0.5 — CRLF injection via unescaped multipart field names/filenames (GHSA-hmw2-7cc7-3qxx)**. `form-data` is a transitive dependency (single instance at `node_modules/form-data`).

## Scope

### In the Box

- Resolve the advisory — prefer `npm audit fix` if it lands a clean semver-compatible bump; fall back to a `package.json` `overrides` entry (the house pattern from the `qs` advisory closure, PR #135) if the dependency chain pins it.
- Re-run `npm audit` after the fix and iterate until "found 0 vulnerabilities" — per the Casebook methodology note, one clean pass after the first fix is not sufficient evidence; audit tools can mask sibling advisories.

### Not in This Set

- No other dependency bumps — Dependabot owns routine currency.

## Acceptance Criteria

- [ ] `npm audit` reports 0 vulnerabilities (output quoted in the Build Record).
- [ ] Full Gallery pre-push gauntlet green: `type-check → knip → test:coverage → build`.
- [ ] Lockfile diff reviewed — only form-data-chain movement.
