# Shipping Order: Invite Code by Email

**Order #:** 2026-05-03-invite-code-by-email
**Filed:** 2026-05-03
**Issued By:** CEO
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

Add an endpoint that emails an invite code to a recipient. The invite-code feature already generates, stores, revokes, and consumes codes end-to-end; the only missing piece is delivery — until now, family heads copy-pasted the code out of band. This is also the first email the warehouse has ever sent: the Resend transport was wired in `c041477` (`chore(arch): wire Resend as production mail transport`) and currently has no payload. The patterns established here become the template for every subsequent email use case (password reset, verification, future notifications), so the Mail layer needs to land in a defensibly excellent shape — not bolted on.

## Scope

### In the Crate

- New Endpoint: `POST /family/invite-code/email` — `auth:sanctum` + `family.ownership` + `can:generateInviteCode, Family` (matches the existing `POST /family/invite-code`) + new `throttle:invite-email` limiter. Accepts `{recipient_email, recipient_name?}`. Returns `202 Accepted` with the `InviteCodeResourceData` envelope (the freshly-generated code is included in the response so the family head still has a copy if they also want to share it manually).
- New FormRequest: `app/Http/Requests/Family/EmailInviteCodeRequest.php` — `final`, extends `FormRequest`, `toDto(): EmailInviteCodeData`.
  - Rules: `recipient_email` required, valid email, max 254 (RFC 5321). `recipient_name` optional, string, max 100, trimmed.
- New Input DTO: `app/DataTransferObjects/Input/Family/EmailInviteCodeData.php` — pure leaf carrying `recipientEmail: string` and `recipientName: ?string`.
- New Action: `app/Actions/Family/EmailInviteCodeAction.php` — `final readonly`, single `execute(Family $family, User $issuer, EmailInviteCodeData $data): InviteCode`. Behavior: delegates code generation to the existing `GenerateInviteCodeAction` (preserves the "revoke active code → issue fresh code" invariant), then hands the resulting `InviteCode` to the `Mailer` contract for delivery. Returns the `InviteCode` model so the controller can shape the response with the existing `InviteCodeResourceData`.
  - Inject `Illuminate\Contracts\Mail\Mailer` (no facades, per regs). The Action constructs an `InviteCodeMail`, then calls `$this->mailer->to($data->recipientEmail, $data->recipientName)->send($mailable)` — `send()` automatically queues if the Mailable implements `ShouldQueue`.
- New Mailable: `app/Mail/InviteCodeMail.php` — `final` class extending `Illuminate\Mail\Mailable` and implementing `ShouldQueue`. Constructor takes the primitives needed to render: `code: string`, `familyName: string`, `recipientName: ?string`, `expiresAt: ?CarbonImmutable`, `registerUrl: string`. `envelope()` returns subject `"You're invited to join {familyName} on Brick Inventory"`. `content()` returns a Markdown view at `resources/views/mail/invite-code.blade.php`. No `attachments()`. From address comes from `config('mail.from')` (set on Railway via `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME`) — Mailable does not override.
- New View: `resources/views/mail/invite-code.blade.php` — Markdown mail. Greet (use `recipientName` if given, "there" otherwise), one-sentence pitch, the code rendered as a code block, a Markdown button linking to the register URL, plain-text copy of the URL beneath the button (for clients that strip buttons), expiration line if `expiresAt` is set. No imagery, no custom CSS — Laravel's stock Markdown mail theme. Branding pass earns its own permit.
- New Controller method: `InviteCodeController::email(EmailInviteCodeRequest, GenerateInviteCodeAction is replaced by EmailInviteCodeAction, #[CurrentUser] User $user): JsonResponse` — thin, method-injected, returns `InviteCodeResourceData::from($code)->toResponseWithStatus(202)`.
- New Rate Limiter: register `invite-email` in `app/Providers/AppServiceProvider::boot()` mirroring the `auth` limiter pattern — `Limit::perHour(10)->by((string) $request->user()->id)`. Disabled in `testing` to match siblings.
- New `#[Config]` injection: `config/app.php` gains a `frontend_url` key reading `FRONTEND_URL_PRODUCTION` (fallback to `FRONTEND_URL`). The `EmailInviteCodeAction` constructor injects this via the existing `#[Config]` attribute pattern (per ADR-0007) and builds the register URL by appending `?invite={code}` (or whatever the frontend's register page accepts — see Frontend Companion note below).
- New Deptrac layer: add `Mail` to `deptrac.yaml` with collector `App\\Mail\\.*`. Allowed dependencies: none (no App-layer deps — Mailable receives primitives in its constructor, so it doesn't import Models, DTOs, or anything else from `App\`). The `Action` layer gains `Mail` as an allowed dependency (Action instantiates the Mailable). No other layer may depend on Mail.
- **Queue worker on Railway.** This is the warehouse's first queued job — there is no existing worker process. Provisioning is in-scope for this permit:
  - Add a `worker` service in Railway (or whatever Railway's per-service mechanism requires) running `php artisan queue:work --queue=default --tries=3 --backoff=10 --timeout=60 --max-time=3600` against the same image and env as the web service. Restart-on-exit is required (use Railway's restart policy or `--max-time` to recycle the process hourly so memory leaks don't compound).
  - Document the worker in `CLAUDE.md` (Brick) under a new "Queue Worker" subsection: command, expected env vars (already present — `QUEUE_CONNECTION=database` is set), and how to verify it's alive (`php artisan queue:monitor default --max=100` or checking the `failed_jobs` table).
  - Document the orchestrator-side smoke procedure in `brick-inventory-orchestrator/CLAUDE.md` if relevant — but the worker itself is owned by the Brick.
  - **Local development** also needs a worker. Add a `make queue` target to the orchestrator's Makefile that runs `php artisan queue:work` inside the backend container, and document it under "Build Instructions". The dev loop becomes: `make up` (web) + `make queue` (worker, separate terminal). For the e2e suite, decide whether the test profile should run a worker or use `Bus::fake()` / `Mail::fake()` — recommendation: tests use fakes, e2e uses a real worker. Document the choice.
- Tests:
  - Unit: 100% coverage on `EmailInviteCodeAction` — happy path with `Mail::fake()` asserting one `InviteCodeMail` queued to the recipient with the correct payload (code, family name, recipient name, expiresAt, registerUrl), the active code was revoked + a fresh one issued (delegate behavior preserved). One scenario where `recipientName` is null. One scenario where the family had no prior active code.
  - Unit: 100% coverage on `InviteCodeMail` — render-only checks: envelope subject, view path, payload bound to view variables, `ShouldQueue` interface present.
  - Feature: 90%+ coverage on `POST /family/invite-code/email` — 202 happy, 422 invalid email + missing email + name too long, 401 unauth, 403 non-head, 429 over throttle. Use `Mail::fake()`.
  - Architecture: new `tests/Architecture/MailArchitectureTest.php` enforcing — every class in `App\Mail`: is `final`, extends `Mailable`, implements `ShouldQueue`, has no public methods beyond Mailable's contract + constructor, has no facade usage, has no DB/Eloquent calls. Update `tests/Architecture/RoutingArchitectureTest.php` if needed to recognize the new route.
- Documentation (lightweight): one paragraph in the Brick's CLAUDE.md under a new "Mail (Outbound Notifications)" subheading describing the layer rules — Mailable receives primitives, no App-layer deps, always `ShouldQueue`, queue worker required in production.

### Not on This Pallet

- **No frontend work.** A Plate-side companion permit needs to be filed at `frontend/.claude/records/permits/2026-05-03-invite-code-by-email.md` covering the Settings → Family page UI (an email field + "Send invite by email" button, plus a "Code emailed" toast). Sequence: Brick ships first, then Plate. The CFO/Logistics Director files the Plate permit after Brick lands.
- No reuse-active-code semantics. This endpoint always generates a fresh code (revoking the previous active one), matching `POST /family/invite-code`'s contract. Emailing an existing code without rotation earns a separate permit if the need arises.
- No multi-recipient support. One recipient per call. If the head wants to invite two people, they hit the endpoint twice — which intentionally rotates the code each time, ensuring each recipient sees a unique invite (older code becomes invalid the moment the second is issued).
- No bounce / suppression / unsubscribe handling. We trust Resend's defaults for v1. Webhook integration earns its own permit when we have more than one email type.
- No template branding pass. Laravel's stock Markdown theme is good enough for v1. A LEGO-aesthetic mail skin earns its own permit.
- No password reset, email verification, family-removed notifications, or any other email use case. Each earns its own permit.
- No `failed_jobs` alerting / dashboard / Sentry wiring. The `failed_jobs` table will collect failures by default — that's the correctness floor for this permit. Monitoring on top of it earns its own permit.
- No Horizon. The database queue + a single `queue:work` worker is the v1. Horizon (or another queue dashboard) earns its own permit if/when queue volume justifies it.

## Acceptance Criteria

- [ ] `POST /family/invite-code/email` returns 202 with the `InviteCodeResourceData` envelope on the happy path.
- [ ] An `InviteCodeMail` is queued (via `Mail::fake()->assertQueued`) to the requested recipient with: the new code, family name, recipient name (when provided), expiration (when configured), and a register URL containing the code.
- [ ] Validation: missing/invalid `recipient_email` → 422; `recipient_name` over 100 chars → 422.
- [ ] Authorization: same `generateInviteCode` policy on `Family` as the existing endpoint. 401 unauthenticated, 403 non-head.
- [ ] Rate limit: 10 calls/hour per authenticated user. 429 on the 11th call within an hour.
- [ ] Existing `POST /family/invite-code`, `GET /family/invite-code`, `DELETE /family/invite-code` behavior is unchanged (regression-tested).
- [ ] `MailArchitectureTest` passes — every Mailable is final, queueable, primitive-constructed, App-leaf-pure.
- [ ] Deptrac green — `Mail` layer added, `Action` may depend on it, nothing else may.
- [ ] All gauntlet stages green: `composer lint:test`, `composer phpstan`, `composer deptrac`, `composer test:arch`, `composer test`, `composer mutation` (≥76% on `EmailInviteCodeAction`).
- [ ] Manual smoke test (local, with `MAIL_MAILER=log`): start `make queue`, hit the endpoint, and confirm `storage/logs/laravel.log` contains the rendered email body with the code, the family name, and the register URL after the worker picks it up.
- [ ] Railway worker service is provisioned, deployed, and visibly green (logs show `queue:work` running and processing the smoke-test job). Document the verification procedure in the shift log.
- [ ] `make queue` Makefile target works locally and is referenced in the orchestrator CLAUDE.md.

## References

- Commit: `c041477` (backend) — wired Resend as the transport
- Related Order (shape reference): `.claude/records/permits/2026-04-29-reverse-lookup-lens.md`
- ADRs: 0003 (Actions for business logic), 0006 (DTOFormRequest with toDto bridge), 0007 (`#[Config]` attribute injection), 0008 (explicit routes), 0009 (thin controllers with method injection)
- Frontend Companion: TBD — `frontend/.claude/records/permits/2026-05-03-invite-code-by-email.md` to be filed once the Brick endpoint lands

## Notes from the Issuer

This is the first email any service in this warehouse has ever sent, so the patterns established here become the template for every future email use case. Three judgment calls deserve scrutiny in the shift log:

1. **Mailable = `App\` leaf, primitives only.** The Mailable must not import Models, DTOs, or any `App\` class. It receives primitives via its constructor and renders. This keeps the layer simple to test, free of cascading rebuild cost when models change shape, and friendly to the queue serializer (which has to survive marshalling across worker boundaries). The Action is responsible for unpacking the `InviteCode` model into primitives before passing them in. Reflect this in `MailArchitectureTest` and `deptrac.yaml`.

2. **Worker provisioning is part of the ship, not a follow-up.** This is the warehouse's first queued job, so the worker has to land alongside the Mailable. Do not ship the Mailable to production without a green worker on Railway and `make queue` in the local dev loop — a `ShouldQueue` Mailable hitting an absent worker is a silent failure mode the CEO will notice in production, not in code review. If Railway's worker config turns out to be more involved than expected (e.g., requires a separate Dockerfile, separate deploy lane, separate env wiring), pause and raise it in the shift log before continuing — don't paper over it by regressing to `->sendNow()`.

3. **Register URL contract with the Plate (locked).** Pattern: `{frontend_url}/register?invite={code}`. Confirmed via the existing `RegisterPage.vue` — it already has an `inviteCode` ref wired through the registration flow; the Plate companion permit just needs a `useRoute().query.invite` watcher to pre-fill that field on mount. The Sorter does not need to consult the Plate maintainer on the URL shape.

The mutation drill (76% threshold) on `EmailInviteCodeAction` is non-negotiable — this Action is the choke point for every email-triggered feature that follows it, and a survived mutation here means a real silent failure later.

---

**Status:** Completed
**Shift Log:** [`.claude/records/journals/2026-05-03-invite-code-by-email.md`](../journals/2026-05-03-invite-code-by-email.md)
