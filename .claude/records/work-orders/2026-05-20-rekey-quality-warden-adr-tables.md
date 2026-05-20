# Work Order: Rekey ADR Quick Reference Tables in quality-warden.md

**Work Order #:** 2026-05-20-rekey-quality-warden-adr-tables
**Filed:** 2026-05-20
**Issued By:** The Steward
**Assigned To:** Brickwright
**Wing:** Atrium (governance doc)
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `rekey-quality-warden-adr-tables`

---

## The Job

Update both ADR Quick Reference tables in `.claude/agents/quality-warden.md` from the pre-merger sovereign numbering sequences (Foundry `0001`–`0009`, Gallery `000`–`016`) to the consolidated `0001`–`0029` sequence created by Phase 5 of the merger. The Warden's own preamble already says the sequence is consolidated; the tables immediately below contradict it, sending readers to the wrong ADR files.

## Scope

### In the Box

- Rekey the **Foundry Quick Reference** table at `.claude/agents/quality-warden.md` lines ~58–80 (9 rows) using the BE-sovereign → new map below.
- Rekey the **Gallery Quick Reference** table at `.claude/agents/quality-warden.md` lines ~91–111 (17 rows) using the FE-sovereign → new map below.
- Verify each new ADR number resolves to the title shown in the row (cross-check against `.claude/docs/decisions.md` and the file at `.claude/docs/adr/<new-id>-<slug>.md`).
- If a row's title no longer matches the consolidated ADR's title, update the title text to match the consolidated ADR file's `# Decision:` header.

### Not in This Set

- No changes to ADR file contents themselves.
- No changes to SOPs, pre/post-audit guidance, casebook paths, or the agent's preamble (already correct).
- No changes to brickwright.md or pattern-master.md (not in scope; separate audit if drift is suspected there).
- No changes outside `.claude/agents/quality-warden.md`.

## Rewrite Maps (from Phase 5 Work Order)

**BE-sovereign → consolidated** (use for the Foundry Quick Reference table):

| Old BE | New | Title |
|---|---|---|
| ADR-0001 | ADR-0013 | Session-based SPA auth |
| ADR-0002 | ADR-0014 | Single-tier authorization |
| ADR-0003 | ADR-0015 | Actions vs Services separation |
| ADR-0004 | ADR-0016 | Explicit cascade deletion |
| ADR-0005 | ADR-0017 | No mass assignment |
| ADR-0006 | ADR-0018 | DTOFormRequest + ResourceData |
| ADR-0007 | ADR-0019 | `#[Config]` attributes |
| ADR-0008 | ADR-0020 | Explicit routes (no apiResource) |
| ADR-0009 | ADR-0021 | Thin controllers with method injection |
| ADR-0010 | ADR-0025 | ComputedResourceData |
| ADR-0011 | ADR-0001 | Save-What-You-Can Import Atomicity |
| ADR-0012 | ADR-0027 | Tighten PHP runtime to 8.5+ |
| ADR-0013 | ADR-0028 | Pre-push permit verification gate |

**FE-sovereign → consolidated** (use for the Gallery Quick Reference table):

| Old FE | New | Title |
|---|---|---|
| ADR-001 | ADR-0003 | RouterService wrapper over Vue Router |
| ADR-002 | ADR-0004 | Factory functions for services |
| ADR-003 | ADR-0005 | UnoCSS attributify |
| ADR-004 | ADR-0006 | Snake/camel case conversion at boundary (superseded by 0029) |
| ADR-005 | ADR-0007 | Istanbul coverage no ignores |
| ADR-006 | ADR-0008 | Resource adapter frozen-mutable |
| ADR-007 | ADR-0009 | Adapter store no Pinia |
| ADR-008 | ADR-0010 | Domain isolation |
| ADR-009 | ADR-0011 | Component health registry |
| ADR-010 | ADR-0012 | Test isolation collect-guard |
| ADR-011 | ADR-0022 | Domain-based Vitest projects |
| ADR-012 | ADR-0023 | Typed mock helpers |
| ADR-013 | ADR-0024 | Page integration tests |
| ADR-014 | ADR-0002 | Domain-driven vertical slices |
| ADR-015 | ADR-0026 | Creative Engine agent (Pattern Master) |
| ADR-016 | ADR-0029 | Case conversion via HTTP middleware (supersedes 0006) |

(Canonical source: [`2026-05-19-phase-5-adr-renumbering.md`](2026-05-19-phase-5-adr-renumbering.md) §B and §C.)

## Acceptance Criteria

- [ ] Foundry Quick Reference table in `.claude/agents/quality-warden.md` uses consolidated 4-digit ADR numbers; every cited ID resolves to an existing file at `.claude/docs/adr/<id>-*.md`
- [ ] Gallery Quick Reference table in `.claude/agents/quality-warden.md` uses consolidated 4-digit ADR numbers; every cited ID resolves to an existing file at `.claude/docs/adr/<id>-*.md`
- [ ] `rg 'ADR-?00?[0-9]{1,3}\b' .claude/agents/quality-warden.md` shows no orphan 3-digit FE-style references and no Foundry references in the `0001`–`0012` range that map to a different consolidated number
- [ ] Each row title matches the corresponding consolidated ADR's `# Decision:` header
- [ ] No edits outside `.claude/agents/quality-warden.md`

## References

- Triggering Audit: [`2026-05-20-post-merger-baseline.md`](../audits/2026-05-20-post-merger-baseline.md) — Finding 1 (high)
- Canonical mapping: [`2026-05-19-phase-5-adr-renumbering.md`](2026-05-19-phase-5-adr-renumbering.md) §B (BE), §C (FE)
- Consolidated ADR index: `.claude/docs/decisions.md`
- ADR files: `.claude/docs/adr/0001-…` through `…-0029`

## Notes from the Issuer

This is the most operationally impactful finding from the first post-merger audit: the Quality Warden's own cross-reference system points to the wrong ADRs (e.g. citing "ADR-0003 (Actions/Services separation)" sends a reader to `0003-custom-routerservice.md`). The Warden cannot reliably audit until its reference tables are correct.

Pure find-and-replace job using the two maps. Verify the title column against the consolidated ADR files — Phase 5 may have lightly normalized a title or two during the rewrite; the consolidated file is the source of truth.

A casebook entry should be filed after this lands: "governance agent files are a distinct doc category that must be checked after renumbering events" (per the Audit's training proposal). That casebook update is **not** part of this Work Order — separate housekeeping by the Warden.

---

**Status:** Closed
**Build Record:** [`2026-05-20-rekey-quality-warden-adr-tables`](../build-records/2026-05-20-rekey-quality-warden-adr-tables.md)
