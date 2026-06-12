# Work Order: Wire the Brickworks to its Kendo Board (MCP + routing)

**Work Order #:** 2026-06-09-kendo-board-wiring
**Filed:** 2026-06-09
**Issued By:** General
**Assigned To:** The Steward
**Wing:** Atrium
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `kendo-board-wiring`

---

## The Job

Make the Brickworks' Kendo board usable from inside this repo: configure the `kendo-goosterhof` MCP server so a Claude session running from BIO can file and track issues against project **Brick Inventory (id 3)** on the `goosterhof.kendo.dev` tenant, and document the routing in the Atrium manual so any session knows where the board lives. This is the lightest of the three Kendo WOs — config + documentation, not application code.

The board project **already exists** (project id 3, `goosterhof.kendo.dev`, currently 0 issues) — you are *wiring to it*, not creating it.

Companion WOs: `2026-06-09-kendo-error-tracking`, `2026-06-09-kendo-report-filing`.

## Scope

### In the Box

- **MCP configuration (user scope, not committed).** Register the `kendo-goosterhof` MCP server for sessions launched from this repo, mirroring how the war room configures it — in `~/.claude.json` (user scope), **not** a committed `.mcp.json`. Rationale: the connection carries a personal credential; the war room deliberately keeps it out of any repo. Once configured, the `mcp__kendo-goosterhof__*` tools resolve against the same instance the board lives on.
  - If the CEO later wants a *committed* `.mcp.json` for the crew, that's a follow-up decision — default is user scope, no secret in the tree.
- **Routing documentation in the Atrium (`CLAUDE.md`).** Add a short section (suggest under "War Room Governance" or a new "## Kanban Board (Kendo)" heading) recording:
  - Tenant: `https://goosterhof.kendo.dev` · MCP server: `kendo-goosterhof` · Project: **Brick Inventory**, `project_id` **3**.
  - The gather→act pattern: call `prepare-project-context` with `project_id: 3` to pull lanes / active sprint / members / current_user (volatile — resolve at use, never hardcode), then `create-issue` / `update-issue` / `start-work-on-issue` against project 3.
  - A one-line note that the file-based paper trail (Work Orders / Build Records / Audits) **stays as-is** — the board is additive for issue tracking, not a replacement (per CEO scope decision 2026-06-09).
- **(Optional, Steward's discretion)** a thin `/ticket`-style skill or CLAUDE.md snippet that wraps the file-an-issue flow against project 3, if the crew will file often. Not required for acceptance.

### Not in This Set

- **No migration of the existing paper trail into Kendo.** Work Orders, Build Records, Audits, Standups, Retrospectives, and Minutes stay file-based in `.claude/records/`. The CEO scoped this WO to "wire MCP + enable issue filing/tracking" only (2026-06-09); migrating governance into Kendo issues is a separate, larger decision not authorized here.
- No committing of any MCP credential or token to the repo.
- Error tracking and report filing — separate WOs.
- The war-room routing-registry update (`/registry/kendo-routing.md`) is **war-room-side**, owned by the General/Adjutant — handled outside this repo, not a BIO deliverable.

## Prerequisites (CEO-provisioned)

- [ ] Confirm the CEO's Kendo account has access to project **Brick Inventory (id 3)** on `goosterhof.kendo.dev` (it should — the project was created under this account 2026-06-09).
- [ ] Provide / confirm the `kendo-goosterhof` MCP connection credential for the user-scope config (same instance the war room already reaches).

## Acceptance Criteria

- [ ] From a Claude session launched in this repo, `prepare-project-context` (or `kendo://projects`) resolves and shows **Brick Inventory (id 3)**.
- [ ] A test issue can be created on project 3 via `create-issue` and is visible on the board, then closed/deleted (leave the board clean after the smoke test).
- [ ] `CLAUDE.md` documents the tenant, MCP server name, `project_id: 3`, the gather-at-use rule for volatile IDs, and the "paper trail stays file-based" note.
- [ ] No MCP credential or token is committed anywhere in the repo (grep the diff before pushing).

## References

- War Room Context: General-issued. Companion WOs `2026-06-09-kendo-error-tracking`, `2026-06-09-kendo-report-filing`.
- Routing model: war-room `/registry/kendo-routing.md` — the durable territory→instance→`project_id` table. **Note the historical landmine:** that registry warns `kendo-script` id 3 ("HardwareInsight") is **not** BIO. That remains true — BIO binds `kendo-goosterhof` id 3 ("Brick Inventory"), a *different instance* that happens to share the number. Don't conflate them.

## Notes from the Issuer

`project_id 3` is the only durable fact worth writing down — it changes only if the project is recreated. Everything else on the board (lane ids, sprint ids, member ids, `current_user`) churns; resolve it at use via `prepare-project-context`, never cache it in `CLAUDE.md`. If a `create-issue` call ever 404s on the project, the id drifted — re-confirm via `kendo://projects` and correct the doc.

Keep the credential out of the tree. The war room runs this exact MCP at user scope for a reason; match it.

---

**Status:** Built — read-path verified; create/delete smoke test pending CEO permission (see Build Record)
**Build Record:** [`2026-06-12-kendo-board-wiring`](../build-records/2026-06-12-kendo-board-wiring.md)
