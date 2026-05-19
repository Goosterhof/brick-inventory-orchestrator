# Shift Log: Invite Code by Email — Mail Layer + Queue Worker Foundations

**Log #:** 2026-05-03-invite-code-by-email
**Filed:** 2026-05-03
**Shipping Order:** [`.claude/records/permits/2026-05-03-invite-code-by-email.md`](../permits/2026-05-03-invite-code-by-email.md)
**Sorter:** Head Sorter

---

## Work Summary

The warehouse's first email use case and first queued mailable. The invite-code generation/storage/revoke/consume cycle already existed; this shift adds delivery — `POST /family/invite-code/email` — and lands the **Mail layer** (deptrac fence, architecture test, CLAUDE.md regulations) and **queue worker provisioning** (orchestrator `make queue`, Brick CLAUDE.md docs, Railway recommendation) that every future email feature will inherit.

| Action | File | Notes |
|---|---|---|
| Created | `app/Mail/InviteCodeMail.php` | First Mailable. Final, ShouldQueue, primitive-only constructor (string code, string familyName, ?string recipientName, ?CarbonImmutable expiresAt, string registerUrl). Markdown view `mail.invite-code`. No SerializesModels — there's nothing to rehydrate; primitives serialize natively. |
| Created | `resources/views/mail/invite-code.blade.php` | Markdown body. Greeting (`recipientName ?? 'there'`), one-sentence pitch, code in a panel, button to register URL + plain-text fallback URL beneath, expiration line if set. Stock theme — branding pass earns its own permit. |
| Created | `app/DataTransferObjects/Input/Family/EmailInviteCodeData.php` | Input DTO carrying `recipientEmail: string`, `recipientName: ?string`. |
| Created | `app/Http/Requests/Family/EmailInviteCodeRequest.php` | FormRequest with `email:rfc max:254` for email, `nullable string max:100` for name. `toDto()` trims the name and collapses empty strings to null. |
| Created | `app/Actions/Family/EmailInviteCodeAction.php` | Final readonly. `execute(Family, User, EmailInviteCodeData): InviteCode`. Delegates to `GenerateInviteCodeAction` (preserves the revoke→issue invariant), then dispatches the Mailable via `Illuminate\Contracts\Mail\Mailer`. `frontend_url` injected via `#[Config('app.frontend_url')]` per ADR-0007. Recipient is built as an `Illuminate\Mail\Mailables\Address` when a name is provided, bare email otherwise — keeps the contract-level `Mailer::to($users)` signature honest (the `($users, $name)` overload is on the concrete `Mailer`, not the contract). |
| Modified | `app/Http/Controllers/InviteCodeController.php` | Added `email()` method. Method-injected. Delegates to the action and returns 202 with the `InviteCodeResourceData` envelope. |
| Modified | `routes/api.php` | Added `POST /family/invite-code/email` under `auth:sanctum + family.ownership + can:generateInviteCode + throttle:invite-email`. Placed after `POST /family/invite-code` (no wildcard collision risk — siblings under the same `/family/invite-code/...` prefix). |
| Modified | `app/Providers/AppServiceProvider.php` | Registered the `invite-email` rate limiter mirroring the `auth`/`rebrickable` pattern: `Limit::perHour(10)->by((string) ($request->user()->id ?? $request->ip()))`, disabled in `testing`. |
| Modified | `config/app.php` | Added `frontend_url` reading `FRONTEND_URL_PRODUCTION` with `FRONTEND_URL` fallback (and `http://localhost:5173` as the local default). |
| Modified | `deptrac.yaml` | New `Mail` layer (collector `App\Mail\.*`), no allowed dependencies. `Action` ruleset extended with `Mail` so Actions may construct Mailables. No other layer may depend on Mail. |
| Created | `tests/Architecture/MailArchitectureTest.php` | New 7-it suite: final, extends Mailable, ShouldQueue, primitive-only constructor (with allowlist + counter-assertion guarding silent green), no facades, no Eloquent, only Mailable contract methods public. |
| Modified | `tests/Architecture/RoutingArchitectureTest.php` | Drift-guard route count 35 → 36. |
| Created | `tests/Unit/Actions/Family/EmailInviteCodeActionTest.php` | 5 cases: happy path with full assertion of dispatched mailable payload + Address shape; null-recipientName path (bare email passed to mailer); trailing-slash-trim on frontend URL; URL-encoding of the invite code; exception propagation from `GenerateInviteCodeAction` without dispatching mail. |
| Created | `tests/Unit/Mail/InviteCodeMailTest.php` | 4 cases: subject envelope, markdown view + payload, null expiresAt passthrough, `ShouldQueue` interface. |
| Modified | `tests/Feature/Controllers/InviteCodeControllerTest.php` | Added 9-case `email` describe block: 202 happy + InviteCodeMail queued with payload, null-name, revokes existing code, 422×3 (missing/invalid email, name>100), 401, 403, 429 throttle. |
| Modified | `phpunit.coverage.xml` | Added `app/Mail` to unit-coverage `<source>` so the Mailable joins the 100% gate. (Without this, `covers(InviteCodeMail::class)` annotations produce Pest covers warnings → fatal in `--min` mode — same trap the 2026-04-29 graduation training warned about.) |
| Modified | `CLAUDE.md` (Brick) | Added `Mail/` to the floor plan; new "Mail (Outbound Notifications)" subsection under Coding Conventions; new "Queue Worker" subsection covering production/local/test wiring; updated Coverage Policy + Boundary Fences diagram for the new Mail leaf. |
| Modified | `../brick-inventory-orchestrator/Makefile` | New `queue` target running `php artisan queue:work --queue=default --tries=3 --backoff=10 --timeout=60 --max-time=3600` inside the backend container. |
| Modified | `../brick-inventory-orchestrator/CLAUDE.md` | Added `make queue` to Build Instructions; added "Queue Worker (`make queue`)" subsection under Local Development covering local/e2e/production roles. |

## Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| `POST /family/invite-code/email` returns 202 with InviteCodeResourceData envelope | Yes | Feature test asserts status + structure. |
| `InviteCodeMail` queued to the recipient with code, family name, recipient name, expiration, register URL | Yes | `Mail::assertQueued` with closure verifying every field, including `str_contains($mail->registerUrl, '?invite=' . $code)`. |
| 422 on missing/invalid email + name>100 | Yes | Three feature tests, one per shape. |
| 401 unauth, 403 non-head | Yes | Standard auth/policy paths. |
| 10/hour rate limit, 429 on 11th | Yes | Feature test bumps env to `production`, re-registers the provider so the closure re-binds, clears the limiter, fires 11 requests. |
| Existing POST/GET/DELETE /family/invite-code unchanged | Yes | All 15 prior feature tests still pass. |
| MailArchitectureTest passes | Yes | 7 tests, 1715 assertions across the full arch suite. |
| Deptrac green — Mail layer, Action depends on it, nothing else | Yes | 0 violations, 662 allowed. |
| `composer lint:test` | Yes | Clean after one round of Rector auto-renames (mb_* mutators, parameter naming). |
| `composer phpstan` | **Pre-existing 4 errors** | Same 4 Laravel 13.7 deprecation cascade errors as the pulse documents (`bootstrap/app.php:33`, `config/database.php:64,84`, `config/sanctum.php:85`). Resolved by separately-permitted shift `2026-04-30-laravel-137-deprecation-cleanup`. **My changes added zero new PHPStan errors** — verified by running `composer phpstan` immediately after each edit cycle. |
| `composer deptrac` | Yes | 0 violations. |
| `composer test:arch` | Yes | 97 passed. |
| `composer test` | Yes | 587 passed (was 569 baseline; +18 = 5 Action unit + 4 Mailable unit + 9 Controller feature). |
| `composer mutation` ≥ 76% on EmailInviteCodeAction | **Yes — 100% (11/11 mutations killed)** | Scoped via `--path=app/Actions/Family/EmailInviteCodeAction.php`. Non-negotiable issuer requirement met with full margin. |
| Manual smoke test (MAIL_MAILER=log) | Yes | See "Manual Smoke Test" below. |
| Railway worker service provisioned + green | **Documented, deferred to CEO** | See "Decisions Made" §3. Brick CLAUDE.md spells out the exact command + verification procedure. Provisioning is gated on Railway dashboard access. |
| `make queue` works locally + referenced in orchestrator CLAUDE.md | Yes | `Makefile` target plus a "Queue Worker" subsection in `brick-inventory-orchestrator/CLAUDE.md`. |

## Decisions Made

1. **Mailable: primitives only — no `SerializesModels` trait.** The permit locks the leaf rule. I followed it cleanly: the constructor takes `string`, `?string`, `?CarbonImmutable`, `string`. I deliberately did **not** include the `SerializesModels` trait, even though it's the Laravel default for new Mailables. That trait exists to convert public `Model` properties into IDs at serialize-time and rehydrate them at unserialize-time — useless when there are no models to convert. Including it just exposed three additional public methods (`__serialize`, `__unserialize`, `restoreModel`) that the architecture test had to either allowlist or ban. Banning was cleaner: the trait's absence is a structural assertion that the leaf rule is honored. Documented this rationale in the Mailable's class docblock.

2. **Recipient construction: `Address` value object when a name is provided, raw email string otherwise.** The `Illuminate\Contracts\Mail\Mailer::to()` contract takes one argument (`$users`). The concrete `Illuminate\Mail\Mailer::to($users, $name = null)` has the second-arg overload, but that's not on the contract — and the permit + ADR-0003 say Actions depend on Contracts, not concrete Services. So passing `($email, $name)` to the contract method would have been a PHPStan violation (and was — first attempt). The fix: build an `Illuminate\Mail\Mailables\Address` (Laravel-namespaced value object, not Symfony's `Mime\Address`) when a name is present, and pass the bare string when it isn't. The unit test asserts both shapes by capturing the argument the mock receives.

3. **Railway worker provisioning: documented, not deployed.** This dev shell has no Railway CLI access and no project credentials. The permit's Notes-from-the-Issuer §2 anticipated this exact branch: "If Railway's worker config turns out to be more involved than expected, pause and raise it in the shift log before continuing — don't paper over it by regressing to `->sendNow()`." I did not regress; the Mailable remains `ShouldQueue`, the local `make queue` worker drains it correctly, and the Brick CLAUDE.md spells out the exact command for the Railway worker service:

    ```
    php artisan queue:work --queue=default --tries=3 --backoff=10 --timeout=60 --max-time=3600
    ```

    plus the same image/env as web, restart-on-exit, and the verification procedure (`queue:monitor` + `failed_jobs`). The CEO/Director needs to either (a) run this from a shell with Railway access, or (b) pair on it interactively. **Calling out as the deployment blocker for go-live.** The local dev loop and the Brick CI is unblocked.

4. **Rate limiter pattern: matched `rebrickable`, not `auth`.** The `auth` limiter has no `->by()` clause (5/min global). The `rebrickable` limiter scopes by user-or-IP with a string cast. The permit asks for "10/hour per authenticated user" — but if the limiter ever fires before auth (e.g., on a misconfigured route), `$request->user()->id` blows up at the null-deref. I followed the `rebrickable` pattern: `(string) ($request->user()->id ?? $request->ip())` — same null-safety, same testing-disabled gating, same shape. PHPStan approved on the second attempt (the first used `?->id ?? ip()`, which the war-room rules warned was unnecessary).

5. **Unit-coverage scope extended to `app/Mail`, not the test excluded.** Two ways to handle the new Mailable's `covers(InviteCodeMail::class)` annotation: (a) add `app/Mail` to the `<source>` block of `phpunit.coverage.xml` so the Mailable enters the 100% gate, or (b) move the Mailable test out of the unit testsuite / exclude it. (a) is structurally aligned with the leaf-rule philosophy — the Mailable is unit-test territory and deserves the same gate as Actions/Services. Picked (a). Caught the issue immediately because of the 2026-04-29-graduated training: "When coverage tests produce warnings instead of reports, check covers() against the `<source>` block." Saved a debugging cycle.

6. **Architecture test: counter-assertion to guard silent-green.** The "primitives only" assertion lives inside a `foreach (constructor parameters)` loop. With one Mailable having all-primitive params, every `expect()` inside the loop is skipped — Pest reports a risky test (no assertions). Added a `$parametersInspected` counter outside the loop and an `expect($parametersInspected)->toBeGreaterThan(0)` outside, mirroring the warroom pattern that the existing arch tests use. Risky-test warning gone; assertion count up by 2.

## Quality Gauntlet

| Check | Result | Notes |
|---|---|---|
| `composer lint:test` | Pass | Clean after one Rector cycle. |
| `composer phpstan` | **4 pre-existing errors** | Pulse-documented Laravel 13.7 deprecation cascade. **Zero new errors from this shift.** Verified via incremental run-and-fix loop after every edit. |
| `composer deptrac` | Pass | 0 violations / 662 allowed. The new Mail layer adds 11 allowed edges, all from `Action`. |
| `composer test:arch` | Pass | 97 passed (1715 assertions). |
| `composer test` | Pass | 587 passed, 2411 assertions. |
| `composer test:coverage` (via php8.4 PATH shim, pcov enabled) | **Pass — 100.0%** | `app/Mail` now in the source scope; `InviteCodeMail` reports 100.0%. `EmailInviteCodeAction` 100.0%. Run via session-only `PATH=/tmp/php-shim:$PATH` (per the 2026-04-29 PCOV-install graduated training, not via project-config edits). |
| `composer test:feature-coverage` | **2 pre-existing warnings** | Same `CorsConfigTest::covers(HandleCors)` mismatch the pulse flags as Open. **Not introduced by this shift** — confirmed unchanged warning count. Once that's resolved separately, this gauntlet step goes green. |
| `composer mutation` (scoped) | **Pass — 100.00% on EmailInviteCodeAction** | `--path=app/Actions/Family/EmailInviteCodeAction.php`. 11 mutations, 11 killed. Issuer requirement: ≥ 76%. Margin of comfort: 24 percentage points. |

### Manual Smoke Test (`MAIL_MAILER=log`)

Local SQLite + `QUEUE_CONNECTION=database` + `MAIL_MAILER=log`. Procedure:

```
php artisan migrate --force
# Trigger via tinker (representative; the feature test exercises the HTTP path):
echo "<...action invocation with FQNs...>" | php artisan tinker --no-interaction
#   → Issued code: BRICK-VNN3 ; Pending jobs count: 1
php artisan queue:work --once --queue=default
#   → 2026-05-03 18:55:09 App\Mail\InviteCodeMail ........... 59.76ms DONE
grep -A3 "Subject\|To:\|BRICK-VNN3" storage/logs/laravel.log
```

Log content (excerpted):

```
To: Smoke Test <smoke@example.com>
Subject: You're invited to join The Smoke Bricksons on Brick Inventory
...
You've been invited to join **The Smoke Bricksons** on Brick Inventory ...
Use the invite code below when you register:
BRICK-VNN3
Accept invitation: http://localhost:5173/register?invite=BRICK-VNN3
This invitation expires on Sun, May 10, 2026 6:54 PM.
```

All five expected payload elements present: code, family name, recipient name, register URL, expiration line. Worker drained the job (`Pending jobs count: 0` after).

## Showcase Readiness

A senior architect auditing this delivery would see:

- A clean **App\ leaf** (`app/Mail/`) with deptrac, architecture-test, and CLAUDE.md regulation enforcement — the same triad the Action/Service/Job layers use. The leaf rule isn't a comment in a class docblock; it's machine-checked from three angles.
- An Action that **delegates** the existing invariant (revoke active → issue fresh) instead of duplicating it. The "single source of truth for code lifecycle" property of `GenerateInviteCodeAction` is preserved by composition.
- A Mailable that **survives the queue serializer** by construction — primitives all the way down, `CarbonImmutable` for the date (it serializes/unserializes losslessly via PHP's default, no rehydration needed).
- A **mutation score of 100%** on the new Action, which means the test is provably surfacing every behavior change the action might suffer.
- **Worker provisioning treated as part of the ship** — orchestrator-side Makefile target, Brick-side production command + verification procedure, e2e fakes-by-default justified in the docs. Future email features (password reset, verification, etc.) inherit all of this for free.

What a senior auditor might still flag:
- The `failed_jobs` table will collect failures by default but there's no alerting on top of it. Permit explicitly defers this. Acceptable for v1; revisit when a second email type or queue volume justifies it.
- No bounce/suppression/webhook handling. Permit explicitly defers this.
- The Markdown view uses Laravel's stock theme. Permit explicitly defers branding.

## Proposed Knowledge Updates

- **Pulse** (Active Concerns): drop "PHP coverage driver missing" framing — this shift demonstrates the canonical-on-8.5 + shim-to-8.4 pattern works end-to-end (coverage 100%, mutation 100%); the only sudo-gated step is installing `php8.5-pcov` for native canonical-PHP coverage. Keep that line as-is.
- **Pulse** (Pattern Maturity): add new row — `Mail layer (1 class)` | `Established` | `MailArchitectureTest, deptrac Mail leaf, CLAUDE.md regulations. Primitive-only Mailable constructor; ShouldQueue mandatory.`
- **Pulse** (In-Progress Work): add row — `Outbound mail / queue worker foundations` | `Complete (Brick + orchestrator) ; Railway worker pending CEO action` | `First email use case shipped; 100% MSI.`
- **Pulse** (Quality Metrics): bump full test suite count 569 → 587, architecture tests 90 → 97.
- **Decisions**: not warranted on its own — the Mail-leaf rule is a sub-decision under ADR-0003 (Actions for business logic, Services for HTTP only) extended to Mailables-as-renderers. The "Mail (Outbound Notifications)" subsection of CLAUDE.md plus the new architecture test are sufficient artefacts. If a second email feature lands and patterns diverge, an ADR-0012 might be justified — not yet.
- **Learnings:** _propose two additions, both rooted in this shift_ — see Self-Debrief.

## Self-Debrief

### What Went Well

- **Permit-discipline.** Read end-to-end before any edit. The three judgment calls the issuer flagged (Mailable-as-leaf, worker provisioning, register URL contract) shaped the implementation order: layer first (deptrac + arch test before any code), then the Mailable, then the Action, then the controller. No backtracking once code started flowing.
- **Baseline first.** Captured PHPStan's 4 pre-existing errors *before* writing a line — exactly per the 2026-04-29 graduated training. Every PHPStan re-run after that pinpointed the deltas instantly without confusion about who-broke-what.
- **Mutation score on the choke-point Action: 100%.** The five-case unit test design (happy + null-name + URL-trim + URL-encode + exception-propagates-without-dispatch) covered every mutation Pest could generate. The "exception path doesn't dispatch mail" case in particular killed mutations on the order-of-operations between `generate.execute()` and `mailer->to()->send()`.
- **Caught the `covers()` mismatch immediately.** Pest's "4 warnings, N passed" pattern — exact signature of the 2026-04-29-graduated training — surfaced the moment I ran `composer test:coverage`. One-line fix to `phpunit.coverage.xml`. The training paid for itself this shift.
- **Saved the dev-host workaround in session-only scope.** Used a `/tmp/php-shim/php → /usr/bin/php8.4` symlink + `PATH=...` per-command, never edited `composer.json` to flip the platform pin or the script-level `php` invocations. Per the 2026-04-29-graduated training. Workaround stayed isolated; the durable host fix (install `php8.5-pcov` via sudo) remains the durable fix once the CEO has shell access.

### What Went Poorly

- **First Mailable used `SerializesModels`.** Default-Laravel scaffolding habit. Architecture test caught it on the first run (3 unexpected public methods). Decision was clean — drop the trait, document why in the docblock — but it cost ~5 minutes I could have saved by reading my own MailArchitectureTest before adding the trait.
- **First `to($email, $name)` call hit the contract-vs-concrete-Mailer signature mismatch.** PHPStan caught it. Fixed by switching to `Address`. ~10 minutes round-trip. Could have been avoided by reading the `Mailer` contract source up-front.
- **Risky-test from the architecture test.** The "primitives-only" check produced no `expect()` calls when all params were already-primitive — silent green. Counter-assertion fixed it, but I should have written the counter-assertion proactively (the warroom-style pattern is in every other arch test in this repo). Not catastrophic; cost ~3 minutes.

### Blind Spots

- **Did not re-verify the Plate frontend's `RegisterPage.vue` handles the `?invite=...` query param.** The permit's Notes §3 said this was confirmed already, so I trusted it without opening the Plate file. If that confirmation turns out to be stale, the email button doesn't pre-fill the field. **Suggest the Logistics Director sanity-check the Plate file before the Plate companion permit ships.**
- **Did not exercise the `--max-time=3600` recycle in dev.** The orchestrator `make queue` target uses it; I ran a single `--once` drain in the smoke test. The recycle behavior is well-tested upstream by Laravel; I'm trusting that. If ever a Mailable starts leaking memory, this is the first thing I'd revisit.
- **Did not test what happens if `MAIL_MAILER=resend` is set but no API key is provided.** Out of scope per permit (no bounce/suppression handling in v1), and `MissingRebrickableTokenException`-style handling for mail isn't in the exception ledger. If Resend itself returns a 4xx/5xx, the queue's `--tries=3 --backoff=10` plus the `failed_jobs` table will catch it — but there's no typed exception, no global handler, no surface-level signal beyond a row in `failed_jobs`. **Permit defers `failed_jobs` alerting**; flagging here so it lands on the radar for the second-email permit.

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| Before adding `SerializesModels` to a new Mailable, check whether the constructor takes any non-primitive types — if all primitives, omit the trait | First Mailable draft included the trait reflexively; arch test flagged the 3 unexpected public methods. The trait only earns its keep when there are Models to convert; with primitives, it adds noise. | This log |
| When writing an Action that calls a Service/Mailer through a Contract, read the Contract's method signature before reading the concrete class — the Contract's narrower signature is the binding one for PHPStan in Action code | Initial `$this->mailer->to($email, $name)` worked at runtime (concrete Mailer accepts `($users, $name = null)`) but failed PHPStan because the contract is `to($users)` only. The Action layer depends on Contract, not Service, so the contract is what binds. | This log |
| When writing an architecture test that loops over reflection inspections, always pair the inner `expect()` checks with an outer counter-assertion (`expect($itemsInspected)->toBeGreaterThan(0)`) so a single-item or zero-item layer doesn't silently green | Risky-test warning on the new MailArchitectureTest's primitives-only check until I added a counter-assertion. The pattern exists elsewhere in the arch suite (DataTransferObjectPlacementTest); should be applied uniformly. | This log |
| When the permit asserts "the frontend already handles X" (e.g., "RegisterPage.vue has an inviteCode ref"), verify by opening the file — even if the confirmation is recent. Permit text is design intent; the file is ground truth (per the 2026-04-29-laravel-13-attribute-cleanup graduated training, generalized) | Trusted Notes §3 without opening RegisterPage.vue. Cheap to verify, expensive if stale. | This log |

---

## Logistics Director Evaluation

_Appended by the Logistics Director after reviewing the log. The sorter's sections above are not edited — they stand as written._

**Overall Assessment:** **Excellent**

### Order Fulfillment Review

Every acceptance criterion met within scope; no over-delivery. The Mail layer landed as a defensibly excellent leaf — `final`, `ShouldQueue`, primitive-only, and machine-enforced from three angles (architecture test, deptrac, CLAUDE.md). The new layer is the kind of foundational artifact a senior architect would expect to find — built once, then inherited by every email feature that follows.

The single criterion not green ("Railway worker provisioned + visibly green") was correctly escalated rather than papered over. Per the permit's Notes §2 — "If Railway's worker config turns out to be more involved than expected, pause and raise it in the shift log" — the Sorter did exactly that. The Mailable stays `ShouldQueue`; the local `make queue` worker drains it; the Brick CLAUDE.md spells out the exact command the CEO needs to run when they have dashboard access. This is the right kind of incomplete.

Mutation score is the headline: **100% (11/11)** on `EmailInviteCodeAction` against a 76% issuer-non-negotiable threshold. 24-percentage-point margin on the choke-point Action that every future email use case will pass through.

### Decision Review

All six decisions are well-reasoned and the rationale would survive a senior review:

- **§1 (no `SerializesModels`)** — Correct. The trait's purpose is Model→ID conversion at serialize time; with primitives there is nothing to convert and the trait only adds three public methods that pollute the leaf surface. The absence-as-assertion choice is well-defended in the class docblock.
- **§2 (`Address` value object over `to($email, $name)` overload)** — Correct. The Contract is `to($users)` only; the `($users, $name)` overload is on the concrete `Mailer`, and ADR-0003 binds Actions to Contracts. PHPStan caught the first attempt; the fix is structurally correct.
- **§3 (Railway deferred)** — Correct escalation. Listed in Concerns below as the deployment blocker requiring CEO action.
- **§4 (rate limiter mirroring `rebrickable`, not `auth`)** — Correct. The null-safety from `?? $request->ip()` outweighs the strictness of `auth`'s shape, and the permit's "10/hour per authenticated user" requirement is satisfied either way. Defensive choice that costs nothing.
- **§5 (`app/Mail` joins the unit-coverage scope)** — Right call. Excluding the test would have been a structural exception for the Mail leaf; including it aligns coverage with the leaf-rule philosophy applied to Actions and Services. Future Mailables enter the same gate automatically.
- **§6 (counter-assertion in MailArchitectureTest)** — Correct technique, applied late. Should have been first-pass per the war-room convention used elsewhere in `tests/Architecture/`. ~3 minutes of cost. Worth tracking as training, see dispositions.

No decisions should have been escalated upstream that weren't.

### Showcase Assessment

This delivery strengthens the portfolio in three measurable ways:

1. **First email = templated foundation.** The next four email use cases (password reset, email verification, family-removed notification, future Resend webhooks) inherit the layer rules, the architecture test, the deptrac fence, and the worker. None of them will need to re-litigate "where does the Mailable live" or "what does the architecture test enforce."
2. **100% MSI on the new Action.** The five-case unit test (happy + null-name + URL-trim + URL-encode + exception-no-dispatch) is an artifact-quality reference for how to design tests against a `final readonly` Action. The "exception path doesn't dispatch mail" case in particular kills a class of mutation that survived-as-noise in earlier Action tests.
3. **Worker provisioning treated as part of the ship.** Orchestrator-side `make queue` target, Brick-side production command + verification procedure, e2e fakes-by-default rationale documented. A reviewer auditing this delivery would not find "queue worker — TBD" anywhere in the artifact.

The auditor-bait residual: the Railway worker is not visibly green in production yet. Flagged loudly in Concerns; CEO-actionable.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| Before adding `SerializesModels` to a new Mailable, check whether the constructor takes any non-primitive types — if all primitives, omit the trait | Candidate | First observation. Cost ~5 minutes on this shift. The Mail layer is brand-new and there is exactly one Mailable today; the rule will see its second test the first time a future email use case lands. Worth tracking; will not graduate until then. |
| When writing an Action that calls a Service/Mailer through a Contract, read the Contract's method signature before reading the concrete class — the Contract's narrower signature is the binding one for PHPStan | Candidate | First observation in this exact shape. Adjacent to several existing Action-discipline candidates (clone-vs-newQuery, no-try-catch, etc.) but covers a different axis: the Contract-vs-Service signature gap. Cost ~10 minutes. Worth tracking. |
| When writing an architecture test that loops over reflection inspections, pair the inner `expect()` checks with an outer counter-assertion (`expect($itemsInspected)->toBeGreaterThan(0)`) — guards against silent green on single-item or zero-item layers | Candidate | First observation. The pattern exists elsewhere in the arch suite (the Sorter cited DataTransferObjectPlacementTest); this proposal is "apply uniformly," which is a reasonable rule-form. Cost ~3 minutes. Worth tracking. |
| When the permit asserts "the frontend already handles X" / "the vendor class already exists" / any external-to-the-edit-surface state, verify by opening or listing the cited artifact before relying on it. Permit text is design intent; the file is ground truth | **Promote — graduation evaluation below** | Second confirming observation of the 2026-04-29 candidate ("Before assuming a vendor class exists, run `ls vendor/<package-path>/` and verify"). Same underlying principle, generalized: 2026-04-29 was the *save* (vendor class verified before edit), 2026-05-03 is the *miss* (RegisterPage.vue trusted without verification, recognized in Blind Spots). Both observations confirm the rule's scope. Drafting graduation scenarios. |

#### Graduation Evaluation — "Verify external-state claims in permits"

**Candidate text (generalized):** *Before relying on a permit's claim about state outside the immediate edit surface — a vendor class, a sibling-repo file, an upstream config, a dashboard setting — verify by opening the file, listing the directory, or running the relevant probe. Permit text is design intent; the file/dashboard is ground truth. If verification is not possible (no access, no credentials), explicitly flag the unverified assumption in the shift log.*

| Scenario | Without Training | With Training | Assertion |
|---|---|---|---|
| Permit says "use existing vendor class `Foo\Bar\Baz`" | Sorter adds `use Foo\Bar\Baz;` and writes against the import. If the class was renamed or removed in the current framework version, fails at PHPStan or runtime mid-shift. | Sorter runs `ls vendor/foo/bar/<expected-path>/` (or `composer show foo/bar`) before adding the import. | Shift log's "Decisions Made" or "Quality Gauntlet" section records the verification command + observed result. |
| Permit says "Plate's `RegisterPage.vue` has an `inviteCode` ref wired through" | Sorter ships the URL pattern (`?invite={code}`) without checking; if the ref isn't there, the frontend silently fails to pre-fill — discovered in production. | Sorter opens `frontend/src/pages/RegisterPage.vue` (or the cross-repo equivalent) and confirms the ref by reading it. | Shift log explicitly states the file was opened and the ref was found (with line number or excerpt) — OR flags the unverified assumption as a Plate-companion-permit prereq. |
| Permit says "Railway already has `MAIL_FROM_ADDRESS` set" / "CI has `BREW_TOKEN`" — and the Sorter has no dashboard access | Sorter ships without override, assuming the env var is set. In production, Mailables without a `from` use the framework default — silent misconfiguration. | Sorter cannot verify directly (no access). Records "no Railway access — env var assumed; verify before merge" as a CEO-actionable line in the shift log. | Shift log either confirms the value (with command + output) OR explicitly flags it as an unverified assumption requiring CEO action before deploy. |

**Verdict: Pass.** Two observations across two shifts (one save, one miss) confirm the rule applies to *any* external-to-the-edit-surface claim in a permit, not just vendor classes. The miss on this shift is itself evidence — the rule's absence has measurable cost (now: a follow-up sanity-check before the Plate companion permit). The 2026-04-29 candidate graduates merged into the broader form. Promoting into "Before You Touch Code" training (step 7, new) and archiving the 2026-04-29 entry as merged-into-graduated.

### Notes for the Sorter

- Strong shift. 100% MSI on a fresh Action is the kind of result that survives a due-diligence review — keep that bar.
- The `SerializesModels` reflex and the `to($email, $name)` reach for the concrete signature are both "reading the contract first" rules in different costumes. Both got caught early (~5 + ~10 minutes), neither shipped. Acceptable cost; the candidates above will track them.
- The "trusted Notes §3 about RegisterPage.vue" miss is the most useful lesson from this shift. You flagged it yourself in Blind Spots, which is exactly the self-debrief discipline the graduation log rewards. The rule generalized and graduated into your training because of it — costing one open the next time you encounter a cross-repo permit claim.
- Do **not** chip away at the Railway worker solo. That's CEO action territory. The Brick-side artifact is complete; hold the line until Railway access exists.
- The way you sequenced the work — deptrac/arch-test scaffolding *before* the Mailable, before the Action, before the controller — is exactly the right showcase order for a new layer. Future log readers will see it as the template for "how to add a new App\ leaf cleanly." Repeat that.
