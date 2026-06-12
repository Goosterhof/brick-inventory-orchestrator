# Minutes — 2026-06-12 — Kendo Work Orders: review, merge, and full implementation

_Board meeting note between the CEO and The Steward._
_Captured by the Meeting Minutes Secretary (1x1 translucent-clear brick, with clipboard)._

---

## 2026-06-12 — Kendo Work Orders: review, merge, and full implementation

### Decisions

- **PR #192 ADR citations namespace-tagged before merge**: the report-filing WO's References line mixed war-room ids (0011/0012/0020/0009) with one BIO-sovereign id (0029) untagged. Steward tagged each namespace explicitly rather than following the inline nit's suggestion (tag all as BIO), which would have made 4 of 5 citations point at the wrong documents.
- **pcov built from pinned GitHub source, not PECL**: pecl.php.net 504s broke every e2e image build. Fix (#197, merged): compile `krakjoe/pcov` v1.0.12 from the GitHub tag in `docker/backend.Dockerfile` — identical source PECL would have served. Rationale recorded in a Dockerfile comment; PECL sunset makes this a recurring breakage class. Production root Dockerfile never installed pcov — unaffected.
- **Error-reporting scope split (review-agent option A)**: `dontReport` the 8 rendered domain control-flow exceptions (404/403/409/422 signals); keep the 3 external-fault exceptions reported (`RebrickableApiException` incl. its 404 render path, `BrickognizeApiException`, `InvalidApiResponseException`). Rule stated in bootstrap comment: rendered control-flow signals are not telemetry; external faults are. `Queue::assertNothingPushed()` restored as the regression lock.
- **FeedbackModal e2e regression fixed in the app, not the selector**: modal now mounts with `v-if` + `:open` per the house domain-modal pattern; the original build took the `:open` half and missed `v-if` (native `<dialog>` content is hidden, not absent). Accepted side effect: drafts don't survive close/reopen (matches `PlacePartModal`).
- **Steward took the board-wiring WO leg directly** (WO assigned it to The Steward); optional `/ticket` skill skipped — two tool calls don't need a wrapper.
- **Implementation PRs left for CEO merge**: Steward merged only #192 (explicit instruction) and #197 (infra unblock proven by its own e2e); #194/#195/#196 stay in the house review flow.

### False Starts

- **`install-php-extensions` as the PECL workaround**: rejected after reading the installer source — it shells out to `pecl install` internally, so it would not have dodged the outage.
- **Prior agent review's #192 verification**: certified the ADR citations as "BIO's sovereign sequence" after checking only 0029; the other four were war-room ids. Independent re-verification caught it; both the review's claim and the nit's proposed fix were wrong.

### Friction Signals

- **Permission classifier denied three external writes**: posting a PR comment reply (#192 thread), creating the Kendo smoke-test issue (board-wiring acceptance criterion), and resolving the #195 review thread. It had allowed resolving the #192 thread earlier. Each denial taken as a signal, not retried; saved to memory.
- **e2e went red twice for different causes**: first the PECL outage (environment), then — after the image fix — a real regression from the feedback feature (`getByLabel('Description')` strict-mode collision). The first red initially masked the second.
- **Shared-working-tree vendor drift**: mid-follow-up on #194, `backend/vendor/` lost the kendo-error-tracker package (a `composer install` against another branch's lock had run in the shared copy). Restored from the branch lock; failure signature usefully confirmed the dontReport routing. Documented in the Build Record.
- **WO status-flip inconsistency across the three legs**: error-tracking and board-wiring flipped footers to `Built`; report-filing kept `Open` because PrePushPermitGate matches strict `Open`/`In Progress` and ADR-0028 closes WOs post-merge. Paper trail needs a post-merge reconciliation pass.

### Dynamics

- CEO operated in terse-approval mode throughout ("merge it, and after that, let's implement it") — strategy from the CEO, execution sequencing left to the Steward.
- Steward adopted the review agent's option A without escalating — judged inside deputy authority; scoped it tighter than proposed (external faults kept reported).
- Report-filing Brickwright pushed back on the Steward's own brief (WO status flip instruction collided with the permit gate) and was upheld — doctrine beat the brief.

### Process Meta

- Skills fired: `/review` (PR #192), `/minutes` (this note).
- Brickwright dispatched twice (error-tracking; report-filing cross-wing), each later resumed via SendMessage for review follow-ups. Steward executed board-wiring directly. Agents ran sequentially — shared working tree forbids parallel branch checkouts.
- Background CI watchers used throughout (poll loops on `gh pr checks`); PR branches refreshed via the update-branch API after #197 merged.
- Hooks fired for real on every commit/push (lint-staged rejected one Gallery commit; fixed and re-committed). No `--no-verify` anywhere.
- Kendo MCP read path verified live (`prepare-project-context` → project 3, 4 lanes, 0 issues); write smoke test classifier-blocked.

### Notes

- Final state: #194, #195, #196 all CI-green, each merge-BLOCKED solely on unresolved review-thread conversations (required approvals = 0). #194/#196 review findings addressed by commit; #195's nit already satisfied by the committed text.
- #194 and #196 both touch `composer.json`/`composer.lock`/`.env.example`/`bootstrap/app.php` — whichever merges second needs a branch refresh.
- Pre-existing Gallery integration flake observed (1 of 3 runs): `LoginPage.spec.ts` lazy route-import chain racing teardown — none of this session's files in the chain.

### Action Items

_Recorded as owned follow-ups, not live checklist state — minutes are an immutable record; track completion on the board or in the PRs themselves._

- CEO: resolve the one open review thread on each of #194 / #195 / #196 and merge (any order).
- Steward: refresh the second of #194/#196 after the first merges; reconcile WO footer statuses post-merge.
- CEO: mint `error-events:write` token, set `ERROR_TRACKER_TOKEN` on Railway web **and** worker (then run the #194 smoke test).
- CEO: activate `report-tool` feature on Kendo project 3, mint `report:create` token, set `REPORT_TOOL_TOKEN` on Railway web (then run the #196 end-to-end smoke test).
- CEO: decide on allowlisting `mcp__kendo-goosterhof__*` write tools in `.claude/settings.json` (board-wiring write-path smoke test still pending).
- Quality Warden: pick up the `LoginPage.spec.ts` teardown-race flake.

### Open Questions

- Committed `.mcp.json` for the crew vs user-scope-only Kendo MCP (WO deferred to a later CEO decision).
- `ERROR_TRACKER_RELEASE` wiring — no release/version primitive exists in the Railway env today; commented out until one does.

---
