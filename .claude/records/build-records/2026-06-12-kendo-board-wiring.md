# Build Record: Wire the Brickworks to its Kendo Board (MCP + routing)

**Build Record #:** 2026-06-12-kendo-board-wiring
**Filed:** 2026-06-12
**Builder:** The Steward (Atrium) — executed directly per the WO's assignment
**Wing:** Atrium
**Work Order:** [`2026-06-09-kendo-board-wiring`](../work-orders/2026-06-09-kendo-board-wiring.md)
**Branch:** `docs/kendo-board-wiring`

---

## Work Summary

Wired the Brickworks to its Kendo board. The `kendo-goosterhof` MCP server was confirmed live at user scope (its tools resolve in a Claude session launched from this repo — the WO's config half was already in place, matching the war-room pattern; nothing committed, no credential in the tree). The Atrium manual gained a **Kanban Board (Kendo)** section under War Room Governance recording the tenant, MCP server, `project_id: 3` binding, the gather-at-use rule for volatile ids, the paper-trail-stays-file-based note, and the `kendo-script` id-3 conflation landmine.

## Deliverables

| Action | File | Notes |
|---|---|---|
| Modified | `CLAUDE.md` | New `### Kanban Board (Kendo)` subsection under War Room Governance: tenant `https://goosterhof.kendo.dev`, MCP `kendo-goosterhof` (user scope, never committed), project **Brick Inventory id 3**, gather→act via `prepare-project-context`, volatile-id rule, paper-trail note (CEO scope decision 2026-06-09), `kendo-script` landmine. |
| Verified (not committed) | `~/.claude.json` MCP config | `kendo-goosterhof` resolves at user scope. No `.mcp.json` added to the repo; no credential anywhere in the tree. |

The optional `/ticket`-style skill (Steward's discretion) was **not** built — the gather→act recipe in the manual is two tool calls; a wrapper skill adds surface without saving work. Revisit if filing frequency proves otherwise.

## Acceptance Criteria — verification

| Criterion | Result |
|---|---|
| `prepare-project-context` resolves Brick Inventory (id 3) from a session in this repo | ✅ Verified live 2026-06-12 — returned project id 3, 4 lanes (To Do / In Progress / In Review / Done), 8 labels, 0 issues, member + `current_user` = Gerard Oosterhof |
| Test issue created via `create-issue`, then cleaned up | ⛔ BLOCKED (permission) — the Claude Code permission classifier denied the `create-issue` write ("external system write"). The read path — the load-bearing proof that the MCP wiring reaches project 3 — is verified. The write half needs either a CEO-run session approval of the `mcp__kendo-goosterhof__create-issue-tool` call or an allowlist entry. One manual create+delete on the board would also satisfy it. |
| `CLAUDE.md` documents tenant, server, project id, gather-at-use rule, paper-trail note | ✅ Shipped in this branch |
| No MCP credential or token committed | ✅ Diff greppped — docs only, no secrets |

## Process Note — permission classifier on external writes

The classifier treats board writes (issue creation) as external-system writes not covered by "implement the Work Order" intent. Per the firm's tool-refusal learning (2026-04-16): one refusal = a permission signal — flagged to the CEO, not retried. The same posture applied earlier this session to posting a PR comment reply. If the crew is expected to file issues on project 3 routinely, an explicit permission rule for `mcp__kendo-goosterhof__create-issue-tool` (and `update-issue` / `start-work-on-issue`) belongs in `.claude/settings.json` — a CEO call, since it grants standing write access to the board.

---

**Status:** Completed (docs + read-path verification shipped; create/delete smoke test pending CEO permission or manual run)
