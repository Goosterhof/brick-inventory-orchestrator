# Minutes — 2026-07-09 — Standup, Warden Sweep, Eight-PR Batch, ADR-0028 Cracked

_Board meeting note between the CEO and The Steward._
_Captured by the Meeting Minutes Secretary (1x1 translucent-clear brick, with clipboard)._

---

## 2026-07-09 — Standup, Warden Sweep, Eight-PR Batch, ADR-0028 Cracked

### Decisions

- **Warden cross-wing sweep authorized**: CEO pulled the standup's top lever. 22 agents, ~1.6M tokens, ~13 min; 0 high / 9 medium / 20 low, 0 refuted. Audit + Casebook filed; Steward Evaluation appended after source spot-checks held on every headline finding.
- **Node stays on the 24 LTS line (24.18.0), not 26**: v26 is Current, not LTS until ~October; production Dockerfile pins `node:24-alpine`. Jump to 26 deferred to a proper WO when it goes LTS.
- **form-data GHSA-hmw2-7cc7-3qxx resolved via lockfile sync inside PR #250** rather than a dispatched WO — the session-start `npm install` had already landed 4.0.6; WO closed as satisfied.
- **F-test-1 coverage/mutation gates deferred to CI mid-flight** (Steward-directed, 2026-06-01 precedent) when the dispatch claim "host PHP 8.5 with pcov" failed agent verification; CEO later installed `php8.5-pcov` and both gates re-verified locally at 100.0%.
- **ADR-0028 uniform-rule amendment ruled Cracked at its Devil's Court re-run; replaced by documented-dual-mode as settled doctrine** (PR #256). CEO, shown the 43-day ledger (~20% WO-close drift, branch protection killing the direct-commit close path), withdrew the taste preference on the record: "I am paying the rule's cost while the audits absorb its failures." Option A (dual-mode) chosen over Option B (mechanize the uniform rule).
- **Hygiene WO judgment calls**: oxfmt `--no-error-on-unmatched-pattern` over extglob glob surgery; commit-msg stage repo-wide (backend-only PRs had no commitlint anywhere) with graceful skip on missing node_modules; `test:integration:run` (~13.5s) into the frontend pre-push chain.
- **All eight PRs merged (#250–#257)** after review triage: seven approve-worthy General verdicts, zero unresolved threads, #254's "pending CI" condition already satisfied — nothing actionable, so the CEO's "act if needed, else merge" resolved to merge.
- **Kendo WO closes do not waive their smoke tests** — the deferral survives as a standup action item; closing the WO ends the "Built" status drift, not the obligation.

### False Starts

- **Warden's "likely a suite-wide PHP 8.5 deprecation" hypothesis for the 728 composer-test warnings**: actual cause was a missing `backend/.env` whose suppressed dotenv probe surfaced through the BypassFinals stream wrapper (PHP's `@` does not extend into userland stream-wrapper internals). Casebook-worthy signature: all-tests-warn + green exit = per-test bootstrap, not code under test.
- **Records commit died on lint-staged's lockfile clash**: `*.{json}` glob fed `package-lock.json` to oxfmt, which errors on an all-ignored target set — forced one sanctioned `--no-verify`; became fix #1 of the hygiene WO.
- **The hygiene slice's own first commit header (107 chars) was blocked by the commit-msg hook it introduced** — the fix caught its author at write time before deliberate testing did.
- **Workflow `args.date` never reached the sweep script**: audit filed as `0000-00-00-…`, renamed by the Steward; skill-maintenance note recorded.
- **The morning standup mis-reported ADR-0028's triggers as untripped**: the 2026-05-29 audit had ruled trigger 2 fired; correction appended to the standup after the sweep surfaced it (X-adr-0028-1).

### Friction Signals

- Two of five build PRs came back red from CI on first pass: #253 (integration suite's wholesale fs-http mock lacked the new `guarded` export — a gap local gates structurally can't catch) and #252 (commitlint, 102-char header). Both agents resumed once, both fixed, both green.
- **PrePushPermitGate refused #254's first push from its worktree** — the gate scans the main checkout's records dir while diffing the worktree's branch. Escalated to WO `2026-07-09-permit-gate-worktree-blindness` (filed, open).
- `sudo` unavailable to the Steward twice (pcov install); the CEO's in-session `!` attempt also failed on the no-TTY password prompt — resolved in an external terminal.
- The finished doc-fixes agent kept resuming on orphaned wait-timers (a dozen stale notifications); stopped via TaskStop.
- The dispatch claim "host PHP 8.5 with pcov" was falsified by the receiving agent — the 2026-05-20 environmental closure had silently regressed (PHP moved to 8.5.4). Corollary recorded: re-verify environmental closures before citing them in dispatches.

### Dynamics

- CEO drove with short directives at each fork (authorize sweep → "start with 2" → "apply it" → PR + WO batch → hygiene WO → interrogation → "write the amendment" → review-and-merge); Steward executed autonomously between forks.
- At the Devil's Court, the interrogator led with the evidence ledger before the first question; the CEO conceded Step 1 immediately and chose dual-mode at the fork without defending the taste preference.

### Process Meta

- Skills fired: `/standup` (first in 42 days — 7 stale flags, 8 action items), `/warden-sweep` (Workflow orchestration, 22 agents), `/adr-interrogator` (Devil's Court re-run → Cracked), `/minutes` (this file).
- Four Brickwright subagents dispatched in parallel worktree isolation (guard-http, doc-fixes, tx-rigor, family-id archtest); two resumed once each for CI fixes; one steered mid-flight (pcov deferral). All four filed Build Records in-branch.
- One `--no-verify` (lockfile pre-commit clash, noted as texture per the retired bypass-log clause).
- Eight PRs merged: #250 records+fixes, #251 ADR-0014 arch test, #252 doc drift, #253 guarded transforms, #254 transaction rigor (20/21 → 0 permissive stubs + arch test), #255 gauntlet hygiene, #256 ADR-0028 revision, #257 the **final batched WO close-out** (11 flips). Zero open PRs at close; agent worktrees and session branches pruned.
- Environment maintenance: Node 24.13.0 → 24.18.0 (nvm), frontend `npm install`, backend `composer install` (vendor had drifted behind the 2026-07-08 lockfile bumps), `backend/.env` provisioned + `make init` fixed, `php8.5-pcov` installed by CEO.

### Notes

- **Dual-mode WO convention now in force**: Status flips in the work PR by default; over-threshold backend pushes close post-merge (the gate rejects violations at push time, teaching its own exception). #256's own WO was the first live exercise; #257 was the last batched close-out.
- **Trigger-tracking standing rule** (from the meta-finding): fired Devil's Court triggers must land in Pulse Active Concerns in the same session as the ruling — ADR prose alone proved non-binding for 41 days.
- ADR-0014's open question is closed mechanically (arch test, teeth proven by deliberate breakage both directions).
- The pre-push/CI asymmetry bit twice in one session and produced the same lesson from both directions: enforcement pushed down the ladder (commit-msg, integration-in-pre-push) catches at write time what CI catches twenty minutes late.

### Action Items

- CEO: Kendo smoke-test prerequisites — provision or explicitly waive (survives the WO closes).
- CEO: Agent Teams Seed keep-or-drop before 2026-07-20 (note: today's four-agent parallel dispatch arguably was the trial's substance without the feature flag).
- CEO + Steward: late-May backlog triage — ten stale WOs (six arch-cleanup + extract-parts-list-composables, integration-flow-test-assertions, warden-sweep-doc-reconciliation, coverage-gate-scope-honesty).
- Steward: file the WO for the amendment's recommended CI check (PR adds a Build Record whose parent WO still reads Open → red check).
- Steward: dispatch WO `2026-07-09-permit-gate-worktree-blindness` when build capacity is free.
- Pattern Master (next invocation): fold Proposal C + Brick Lab parameter observations into the graduation log (carried since 2026-05-27).

### Open Questions

- Does the G-test-1 routing decision (mock-server `calls` log vs dropping the assertion-free flow tests) get made at the backlog triage, or does `2026-05-29-integration-flow-test-assertions` carry it as-is?

---
