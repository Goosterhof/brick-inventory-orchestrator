# Work Order: User Feedback → Kendo Reports (full path)

**Work Order #:** 2026-06-09-kendo-report-filing
**Filed:** 2026-06-09
**Issued By:** General
**Assigned To:** Brickwright (Foundry + Gallery)
**Wing:** Atrium (cross-wing)
**Priority:** Standard
**Branch slug (for PrePushPermitGate):** `kendo-report-filing`

---

## The Job

Let a family submit feedback from the Gallery — a title, a description, and up to 5 optional screenshots — and relay it server-side into the Kendo board (project **Brick Inventory**, id **3**, tenant `goosterhof.kendo.dev`) as a report, using the `script-development/kendo-report-tool` package. The full path: a Gallery feedback form → a Foundry relay endpoint → `KendoReports::submit()`. The Kendo project token is held server-side and **must never reach the browser**.

Companion WOs: `2026-06-09-kendo-error-tracking` (auto exception telemetry) and `2026-06-09-kendo-board-wiring` (the board + MCP). Independent — one branch each.

## Background — what the package does

`kendo-report-tool` is a published Laravel client library (auto-discovered ServiceProvider). Public surface:

```php
public function submit(string $title, string $description, ?string $authorName = null, array $files = []): ?array
```

It POSTs a multipart request to `{kendo_url}/api/projects/{project}/reports` with a Bearer `report:create` token and:
- **`201 Created`** → returns the decoded report body (`id` + fields).
- **any failure** (non-201, `422` validation/mismatch, timeout, unreachable) → **throws** `ScriptDevelopment\KendoReportTool\Exceptions\ReportSubmissionException` by default (`swallow=false`). A human is waiting on confirmation, so failure is surfaced, not swallowed — the opposite of error-tracker.

`$files` accepts `Illuminate\Http\UploadedFile[]` (straight from the request) or local paths. Server accepts ≤5 images (jpg/jpeg/png/bmp/gif/tiff/webp, ≤3 MB each). A `null` author is omitted from the request.

## Scope

### In the Box — Foundry (`backend/`)

- `composer require script-development/kendo-report-tool`.
- Env keys in `backend/.env.example` (placeholders, no real token):
  ```dotenv
  REPORT_TOOL_KENDO_URL=https://goosterhof.kendo.dev
  REPORT_TOOL_PROJECT=3
  REPORT_TOOL_TOKEN=                    # report:create project token — CEO-provisioned, never committed
  ```
- A **FormRequest → DTO → Action** pipeline matching house architecture:
  - `SubmitFeedbackRequest` (FormRequest) validating: `title` required ≤255; `description` required ≤65535; `screenshots` nullable array max:5; `screenshots.*` image, mimes:jpg,jpeg,png,bmp,gif,tiff,webp, max:3072 (KB). `toDto()` → `App\DataTransferObjects\Input\Feedback\SubmitFeedbackInput`.
  - `SubmitFeedbackAction` (`final readonly`, single `execute()`, no try-catch): **injects `KendoReports` directly** (do not wrap it — see Not-in-Set), calls `submit(title, description, authorName, files)`. Lets `ReportSubmissionException` bubble.
  - A thin controller method on a new `FeedbackController`: resolve the author via `#[\Illuminate\Container\Attributes\CurrentUser] User $user` (BIO's standard, already used across controllers), pass `$user->name` as `authorName`. Return `JsonResponse`/`array`.
  - Route: `POST /api/feedback` in `routes/api.php`, behind the existing auth middleware (Sanctum session, like the other family routes).
  - A `render()` mapping in `bootstrap/app.php` for `ReportSubmissionException` → a clean JSON error (suggest `502`) so the Gallery can tell the user it didn't send.

### In the Box — Gallery (`frontend/`)

- A feedback entry point in the **Families** app (a `FeedbackModal` reachable from a header/footer affordance — Pattern Master owns final placement). Neo-brutalist styling (`brick-border`, `brick-shadow`, etc.).
- Form fields: title (Text input), description (Textarea), optional screenshots (reuse the `shared/components/scanner/` file-input pattern or a standard file input; cap at 5, image types).
- Submit via the app's `HttpService` as **`multipart/form-data`** to `/api/feedback`. Use `useValidationErrors()` + `useFormSubmit()` for 422 field parsing. On `201` → success toast ("Thanks — sent to the board"); on the mapped error → failure toast ("Couldn't send, try again").

### Not in This Set

- **No single-use wrapper around `KendoReports`.** Inject the package class directly into the Action. A `FeedbackReporterInterface` + adapter Service for one call site violates the "no single-use abstractions" doctrine. (The Action *is* the seam.)
- No async/queue mode — `submit()` is synchronous by design (the caller needs the 201 + id back). Do not push it onto the queue.
- No PII scrubbing — report content is intentional user-authored input, sent verbatim (contrast error-tracker).
- No anonymous/unauthenticated feedback in v1 — author comes from the logged-in user.
- Error tracking and board/MCP — separate WOs.

### ⚠ Gotchas (read before you build)

- **`multipart/form-data` vs the snake_case middleware (BIO ADR-0029).** BIO's request middleware converts camelCase→snake_case for JSON bodies. With `FormData` (file upload) that conversion may not apply — send field names exactly as `SubmitFeedbackRequest` expects (`title`, `description`, `screenshots[]`). Verify the request middleware path for multipart before assuming auto-conversion.
- **Synchronous blocking call.** `submit()` blocks the web request up to the configured timeout (default 2 s connect / 5 s total). Acceptable for a feedback form; don't lower the timeouts below the package defaults.

## Prerequisites (CEO-provisioned)

- [ ] **Activate the `report-tool` feature** on Kendo project **Brick Inventory (id 3)**. **Hard precondition** — without it the reports endpoint rejects every submission (`EnsureFeatureActive:report-tool`).
- [ ] **Mint a project token** under project 3 carrying the **`report:create`** ability.
- [ ] **Set `REPORT_TOOL_TOKEN`** in the Railway **web** service env (synchronous send — the worker is not involved). Confirm tenant URL `https://goosterhof.kendo.dev`.

## Acceptance Criteria

- [ ] `composer require` succeeds; ServiceProvider auto-discovered.
- [ ] End-to-end smoke test (token + feature active on staging): submitting the Gallery form with a title, description, and a screenshot creates a report on Kendo project 3 with the correct `author_name`, body, and attached image; `source = Api`.
- [ ] A forced failure (e.g. wrong token) surfaces a user-visible "couldn't send" toast — not a silent success, not an unhandled 500.
- [ ] The Kendo token never appears in any frontend bundle or network response to the browser (relayed only through the backend).
- [ ] Foundry: 100% unit coverage on `SubmitFeedbackAction`, ≥90% feature coverage on the endpoint; backend tests use `Http::fake()` — never a live Kendo call. Full gauntlet green (lint/phpstan/deptrac/test:arch/test).
- [ ] Gallery: 100% coverage (lines/functions/branches/statements); transport mocked in tests. `type-check → knip → test:coverage → build` all green.

## References

- War Room Context: General-issued. Companion WOs `2026-06-09-kendo-error-tracking`, `2026-06-09-kendo-board-wiring`.
- Package: `script-development/kendo-report-tool` (packagist; public, MIT). README is the integration contract.
- Architecture: war-room ADR-0011 (Actions), war-room ADR-0012 (FormRequest→DTO), war-room ADR-0020 (Input/Result DTO split), war-room ADR-0009 (ResourceData); BIO ADR-0029 (case conversion via HTTP middleware — these are different sequences; BIO 0011/0012/0020/0009 mean other decisions, see `.claude/docs/decisions.md`). War-room principle #9 (`#[CurrentUser]`).

## Notes from the Issuer

This is the inverse of the error tracker: a report is a synchronous, outcome-surfaced human submission, so the UX must reflect whether it sent. The "no single-use abstraction" rule is the trap here — the instinct will be to hide `KendoReports` behind a BIO-flavored interface; don't. The Action injecting the vendor class directly is the whole seam, and it keeps the external HTTP boundary honest (the package already carries explicit timeouts, satisfying the explicit-timeout principle).

Agree the API contract (`POST /api/feedback`, field names, error shape) between the two wings before building the Gallery form — same discipline as the historical Invite Code split.

---

**Status:** Open
**Build Record:** _link when filed_
