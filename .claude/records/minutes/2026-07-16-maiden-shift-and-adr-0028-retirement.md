# Minutes — 2026-07-16 — Maiden Shift 001 & ADR-0028 Retirement

_Board meeting note between the CEO and The Steward._
_Captured by the Meeting Minutes Secretary (1x1 translucent-clear brick, with clipboard)._

---

## 2026-07-16 — Maiden Shift 001 & ADR-0028 Retirement

### Decisions

- **ADR-0028 retired, Cracked at root**: the Devil's Court re-interrogation (long overdue from the 2026-05-29 fired trigger, forced by the frozen permit directory) ended in clean retirement of the PrePushPermitGate. CEO on the record: *"nobody, anymore — the gate is a relic of the file era."* Evidence ledger: 1 true positive in 72 days vs 1 false refusal, 4 amendments, 2 open maintenance issues.
- **CI-layer replacement declined**: the interrogator offered a CI check (over-threshold `backend/**` PR must reference a `BIO-xxxx`) as the retire-and-replace option; CEO chose clean retirement with a **named accepted risk** — large hand-run work has no mechanical permit check; audit cycle is the backstop; "risk is low." Concrete incident = the trigger to revisit.
- **Kendo-querying gate rejected on mechanics**: MCP credential unreachable from a PHP CaptainHook action; would need a REST token in every pushing environment plus a network dependency in offline git ops. Branch-name pattern check rejected as enforcement theater.
- **Shift 001 build selection**: BIO-0014 (new high bug) + BIO-0009 chosen over BIO-0008 specifically because BIO-0008 also touches SetsOverviewPage — file-disjointness between concurrent worktree builds was the tiebreaker.
- **BIO-0011 closed by dissolution**, not by fix — the retired gate cannot be worktree-blind; the issue's own scope note anticipated this path.

### False Starts

- **Records branch mis-based**: `docs/shift-001-records` was branched off the BIO-0012 branch instead of `main`, stacking the shift report on the retirement PR. Rebase + force-push was classifier-denied; resolved non-destructively via fresh branch `docs/shift-001-paper-trail` + cherry-pick. Stray remote branch left for CEO deletion.
- **First clock-in attempt halted**: `/enter once` failed the Phase 0 clean-tree gate on an uncommitted minutes addendum; resolved via PR #278 before the shift could claim.

### Friction Signals

- Patrol observation P-hot-1 accused commit f32e8e2 of shipping the ledger in `status: running` — refuted by the Steward's direct observation (the finder had read this shift's own live clock-in edit in the working tree). Filed in the Shift Report as a patrol artifact, not on the board.
- Two permission denials in one session shaped the git workflow: classifier blocked `git push --force-with-lease`; the repo's own `guard-destructive-git.sh` hook blocked `git branch -D`. Both honored without retry; branch pruning handed to the CEO.
- `start-work-on-issue` failed twice ("Project has no primary GitHub repository linked") — degraded to `update-issue` + comment; CEO linked the repo mid-session and the Steward back-linked both shift branches, after which BIO-0012's `start-work-on-issue` worked first try.

### Dynamics

- The interrogation inverted the brief: dispatched as "move the permit source to Kendo" (BIO-0012's original scope), the Interrogator's first question put retirement on the table; the CEO answered "nobody, anymore" in one round and the amendment became a retirement. No pushback on the accepted-risk clause — CEO named it without hedging.
- CEO drove with single-line directives throughout ("let's first commit and pr that file", "yeah let's do the maiden enter", "i linked the github repo, and let's do the interrogation", "all merged"); Steward executed each without decision menus.
- War-room review of PR #281 caught three sweep leftovers the Steward's own grep missed (live workflow script, hook comment, Pest.php) — reviewer's suggested `git grep -l Tools` methodology adopted on the spot for the fix pass.

### Process Meta

- Skills fired: `/enter once` (maiden run, both attempts), `/adr-interrogator` (nine-step re-interrogation, full session), `/minutes` (this entry).
- Workflows/agents: `shift-patrol` rotation 0 (5 agents, 438k tokens, 1 confirmed high / 5 low observations / 1 refuted artifact); 2 concurrent worktree Brickwrights (BIO-0014, BIO-0009) — both green first attempt, both needed `npm ci` in fresh worktrees.
- Environment discoveries, both memorized: non-interactive shells resolve `npx`/`npm` to the Windows install (`/mnt/c/Program Files/nodejs/`), breaking the commitlint hook — fix is prepending `~/.nvm/versions/node/v24.15.0/bin`; host `vendor/` had drifted (kendo-report-tool in lockfile, absent on disk) producing 7 phantom PHPStan `class.notFound` errors — `composer install` resolved.
- PRs shipped and merged same-session: #278 (minutes addendum), #279 (BIO-0014 theme fix), #280 (BIO-0009 assertions), #281 (gate retirement + review-fix commit 7c6f933), #282 (shift-001 records). All carried `Agent Review Requested` via the workflow; all four crew PRs reviewed would-APPROVE.
- No ceremony bypasses — notably, the retirement PR itself passed the full pre-commit and pre-push gauntlets, and the push ran from the already-gate-less captainhook config.

### Notes

- Shift patrol's SC-theme-1 proved the layered-verification design: found by a stud-connections finder, adversarially confirmed, filed as BIO-0014, fixed, war-room re-verified independently against the backend ResourceData chain — three independent derivations of the same wire shape.
- The theme bug survived 100% coverage because fixtures encoded the wrong type — the BIO-0014 fix converts fixtures to the real wire shape (integration snake_case pre-middleware, unit camelCase post-transform), making the drift class detectable going forward.
- ADR-0028's retirement closes a full enforcement lifecycle on file: structural fix → convention disputes → bypass-log retirement → dual-mode revision → retirement when the problem moved upstream. The board-era permit guarantee: issue before dispatch, `link-branch`, review label before merge.
- Backend suite baseline shifted 728 → 687 tests (the deleted 330-line gate test) — future comparisons against Pulse's "728 passed" figure should expect 687.

### Action Items

- CEO: delete stray remote branch `docs/shift-001-records` and prune ~30 stale local branches (deletions are permission-gated).
- CEO: BIO-0007 decision (a) qualify coverage claim / (b) widen gate — still blocked on the board.
- CEO: BIO-0013 provisioning (Railway tokens + report-tool feature + smoke tests) — still open, 34+ days.
- Steward: fold the Pulse refresh into the next records PR — clear the resolved "ADR-0028 re-interrogation overdue" Active Concern, the stale `form-data` advisory row (lockfile has 4.0.6), and the 728→687 test-count note.
- Steward: five low-severity patrol observations ride the Shift Report (P-form-1, F-txn-1, F-txn-2, SC-setnum-1, SC-expires-1) — three recurrences earns an issue.

### Open Questions

- Should the two Brickwright worktrees under `.claude/worktrees/` (with full `node_modules`) be cleaned after merge, and by whom — the dispatching Steward or a shift's clock-out step?
- shift-patrol.js couples gallery/foundry dimension pools in lockstep (`rotation % 4` on both) — fine for coverage, reduces combination diversity; worth a tweak or leave as designed?

---
