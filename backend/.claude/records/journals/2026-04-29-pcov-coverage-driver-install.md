# Shift Log: Install PCOV Coverage Driver

**Log #:** 2026-04-29-pcov-coverage-driver-install
**Filed:** 2026-04-29
**Shipping Order:** [2026-04-29-pcov-coverage-driver-install.md](../permits/2026-04-29-pcov-coverage-driver-install.md)
**Sorter:** Head Sorter

---

## Investigation: Where Does the Gauntlet Run?

The permit's first criterion was to determine the canonical environment **before editing**. Findings:

- **Past shift logs** (`2026-04-29-storage-map-resource-data.md`, `2026-04-29-laravel-13-attribute-cleanup.md`, and the L13 upgrade journals) all reference `composer phpstan` / `composer test` / `composer test:arch` directly — never wrapped in `docker compose exec backend ...`. The preserved verbatim outputs (test counts, PHPStan deltas) match host execution timing.
- **CaptainHook** runs `composer lint:test`, `composer phpstan`, `composer phpstan:types`, `composer deptrac`, `composer test:arch` on every PHP commit (and `composer test` on push) — directly, no docker wrapper. CaptainHook hooks fire from the host shell during `git commit`.
- **Makefile** offers `make test-backend` which DOES wrap composer in `docker compose exec backend composer test`, but the routine sorter workflow (and the one referenced by past shift logs) is direct host invocation.
- **Docker container** runs Octane / FrankenPHP — the live application, not the gauntlet. `docker/backend.Dockerfile` builds the runtime image; the test/lint suite is host-driven.

**Determination:** The canonical gauntlet-running environment for this codebase is **host PHP**. The Docker container is the runtime image for the running app, not the gauntlet runner. Per the permit's "Dockerfile vs host install" guidance, the **Dockerfile change is still the durable, reproducible artifact** (so any future Docker-based gauntlet run, CI image, or developer who runs `make test-backend` has PCOV available), and the **host install** is the developer-setup path that this shift's verification rides on.

## Root Cause: Dual PHP Installs, Wrong One Aliased

The host has two PHP installations side by side:

```
$ which php php8.4 && update-alternatives --display php | grep "currently"
/usr/bin/php
/usr/bin/php8.4
  link currently points to /usr/bin/php8.5
```

```
$ php -v        # the system 'php' alias
PHP 8.5.4 (cli) ...
$ php -m | grep -iE "pcov|xdebug"
(empty)

$ php8.4 -v
PHP 8.4.18 (cli) ...
$ php8.4 -m | grep -iE "pcov|xdebug"
pcov
```

```
$ apt list --installed 2>/dev/null | grep php8.4-pcov
php8.4-pcov/noble,now 1.0.12-2+ubuntu24.04.1+deb.sury.org+1 amd64 [installed]
```

`php8.4-pcov` was already installed; the `pcov.so` binary lives at `/usr/lib/php/20240924/pcov.so` (PHP 8.4 ABI). The `php` alternative pointed to PHP 8.5 (API `20250925`), which has no compatible pcov build (`apt install php8.5-pcov` would be a separate install requiring sudo).

This also explains why the project's documented PHP version (8.4 — see `composer.json` `"platform": {"php": "8.4"}`) drifted from what the host actually executes. Past shifts ran their gauntlets on PHP 8.5 by accident; non-coverage commands worked because the test suite uses SQLite in-memory (per `phpunit.coverage.xml`), avoiding the missing `pdo_pgsql` on 8.4.

## Work Summary

| Action | File | Notes |
|---|---|---|
| Modified | `docker/backend.Dockerfile` (orchestrator repo) | Added `pecl install pcov && docker-php-ext-enable pcov` to the existing `RUN apt-get` block. Canonical durable artifact for the Docker image. |
| Created | `.claude/records/journals/2026-04-29-pcov-coverage-driver-install.md` | This log. |
| Modified | `.claude/records/permits/2026-04-29-pcov-coverage-driver-install.md` | Status `Open` → `Completed`; linked this shift log. |
| Created (session-only, NOT committed) | `/tmp/php84-shim/php` → `/usr/bin/php8.4` | Verification shim used to run the three blocked commands today without sudo. **Session-local; the durable host fix requires `sudo update-alternatives --set php /usr/bin/php8.4` — flagged below for follow-up.** |

## Order Fulfillment

| Acceptance Criterion | Met | Notes |
|---|---|---|
| Document the canonical gauntlet environment in the shift log | Yes | "Investigation" section above — host PHP, not Docker container, with rationale from past logs and CaptainHook config. |
| PCOV installed and visible in canonical environment(s) | Partial | **Host:** `php8.4-pcov` was already apt-installed; verified via `php8.4 -m \| grep pcov` returning `pcov`. The composer scripts pick this up when `php` resolves to `php8.4`. **Docker:** Dockerfile patched with `pecl install pcov && docker-php-ext-enable pcov`. **Verification of the Docker build is BLOCKED — no Docker daemon access in this WSL distro** (`docker` command not found; Docker Desktop WSL integration disabled). |
| `composer test:coverage` runs to completion, percentage reported | Yes | Exit 0 under `PATH=/tmp/php84-shim:$PATH`. **Total: 100.0 %** — meets the ADR-0003 100% threshold. Full per-file table at end of `/tmp/unit-cov.log` shows every Action and Service at 100.0%. |
| `composer test:feature-coverage` runs to completion, percentage reported | **No — pre-existing test issue revealed** | Exit 1, but **not from the driver and not from a coverage threshold miss**. Pest aborts on 2 warnings emitted by `tests/Feature/Configuration/CorsConfigTest.php` (`covers(HandleCors::class)` targets a class outside the `<source>` directory of `phpunit.feature-coverage.xml`, which only includes `app/Http/Controllers`). Coverage table is never reached because Pest's `--min` gate fires after warning conversion to fatal. **This is a pre-existing covers()-mismatch issue — same pattern documented in the existing graduation candidate "When coverage tests produce warnings instead of reports, check for `covers()` annotations targeting classes outside the `<source>` directories." Per scope discipline ("Don't fix threshold misses; don't refactor application code"), I did NOT touch the test.** Flagged for the Director below. |
| `composer mutation` runs to completion, MSI reported | Yes | Exit 0. **MSI: 76.97%** (regulation: 76% min — met). 557 tested / 136 untested / 31 uncovered / 1 timeout. |
| If `docker/backend.Dockerfile` modified, builds cleanly and container has PCOV | **Blocked — environmental** | Dockerfile change applied (clean diff: 2 lines added inside the existing apt RUN block). **Cannot run `docker compose build backend` — Docker daemon not accessible in this WSL distro.** Per the permit's instruction ("If you don't have rebuild permissions or the build fails for environmental reasons, **stop and surface the issue**"), I did not work around this. Surfaced for the Director. |
| `composer lint:test`, `composer phpstan`, `composer deptrac`, `composer test`, `composer test:arch` all still pass | Yes | All 5 exit 0 under `PATH=/tmp/php84-shim:$PATH`. Outputs captured. PHPStan: `[OK] No errors` across 308 files. Deptrac: 651 allowed / 0 violations / 0 errors. Test: 569 passed (2330 assertions). test:arch: 90 passed (1678 assertions). lint:test: clean. |
| Capture three measured-today values as new baseline | Yes (with one caveat) | Unit: **100.0%** (100% required). Feature: **un-measurable today** — Pest aborts on `covers()`-mismatch warnings before coverage computes. MSI: **76.97%** (76% required). |
| Flag any threshold miss with the specific gap | N/A | No threshold misses to flag. The feature-coverage non-measurement is a pre-existing test-config issue, not a coverage gap. The covered files in `app/Http/Controllers` would almost certainly hit the 90% threshold once the warnings are silenced — but proving that requires either fixing the `covers()` line or excluding the test, both of which exceed this shift's scope. |

## Decisions Made

1. **Canonical environment = host, not Docker.** Determined by reading past shift logs and CaptainHook config. The Dockerfile change is still made (durable artifact for any Docker-based gauntlet path: `make test-backend`, future CI image, contributor running tests inside the container) but the load-bearing verification path was the host. Rejected: routing all dev gauntlet runs through `docker compose exec` — that's a workflow change beyond this permit's scope.

2. **Edit Dockerfile even though I cannot verify the build.** The permit explicitly designates the Dockerfile as "the load-bearing artifact." Filing the change with a clean, minimal diff and surfacing the rebuild-blocked status is more defensible than skipping the file entirely. A reviewer with Docker access can verify the build runs in seconds; the diff is a 2-line addition inside an existing `RUN` block (idiomatic `pecl install pcov && docker-php-ext-enable pcov`, the standard pattern for php-cli base images).

3. **Use a session-local PATH shim instead of patching `composer.json` to invoke `php8.4` directly.** Considered: editing the `mutation` script's `php -d pcov.enabled=1 ...` to `php8.4 -d pcov.enabled=1 ...`, and similarly prepending `php8.4` to the coverage scripts. Rejected because it papers over the real issue (the host has the wrong `php` alternative) and only fixes 3 of N composer scripts — anything else that calls `php` directly would still hit 8.5. The shim is session-only and verifies the install today; the durable host fix is `sudo update-alternatives --set php /usr/bin/php8.4` (flagged for a follow-up). The committed artifact (Dockerfile) is the canonical durable answer for the Docker path.

4. **Do NOT remediate the feature-coverage `covers()` warnings.** Permit's "Not on This Pallet" explicitly bars fixing threshold misses or restructuring tests in this shift. The CorsConfigTest issue is pre-existing — same pattern as the candidate already in the graduation log from the 2026-03-26 enforce-code-quality shift. Flagged for the Director to queue as a separate follow-up shift.

5. **Do NOT switch the `php` alternative myself, even via `sudo` interactively.** The permit's auto-mode guidance and the warehouse's destructive-action protocol both flag `update-alternatives` as a system-wide change requiring CEO/Director awareness. Surfacing it as a follow-up is correct routing.

## Quality Gauntlet

All gauntlet runs below executed with `PATH=/tmp/php84-shim:$PATH` so that `php` resolved to `/usr/bin/php8.4` (where pcov is loaded).

| Check | Result | Notes |
|---|---|---|
| lint:test | Pass | Exit 0. Rector dry-run + Pint --test both clean. |
| phpstan | Pass | `[OK] No errors` across 308 files at level max. |
| deptrac | Pass | 651 allowed / 0 violations / 0 errors / 0 warnings. |
| test | Pass | 569 passed (2330 assertions), 12.35s. |
| test:coverage | Pass | **Total: 100.0%**. Exit 0. Per-file: every Action and Service at 100.0%. |
| test:feature-coverage | Fail (pre-existing, NOT a driver issue) | Exit 1. Pest aborts on 2 warnings from `tests/Feature/Configuration/CorsConfigTest.php` (`covers(HandleCors::class)` targets a class outside the `<source>` of `phpunit.feature-coverage.xml`). The coverage report is never printed. **This is a pre-existing test-config issue, not a regression caused by the install.** Flagged for the Director. |
| mutation | Pass | **MSI: 76.97%** (76% required). 557 tested / 136 untested / 31 uncovered / 1 timeout. Exit 0. 16.51s with 24 parallel processes. |
| test:arch | Pass | 90 tests passed (1678 assertions). |

### Verbatim excerpt — `composer test:coverage` summary

```
  Tests:    201 passed (1284 assertions)
  Duration: 5.65s

  Actions/Auth/CreateUserWithFamilyAction ............................. 100.0%
  ... [all rows 100.0% — abridged for log] ...
  Services/RebrickableService ......................................... 100.0%
  ────────────────────────────────────────────────────────────────────────────
                                                                Total: 100.0 %
```
Full output: `/tmp/unit-cov.log` (in this session).

### Verbatim excerpt — `composer mutation` summary

```
  Mutations: 136 untested, 31 uncovered, 1 timeout, 557 tested
  Score:     76.97%
  Duration:  16.51s
  Parallel:  24 processes
```
Full output: `/tmp/mutation.log` (in this session).

### Verbatim excerpt — `composer test:feature-coverage` failure mode

```
   WARN  Tests\Feature\Configuration\CorsConfigTest
  ! CORS configuration → it should not contain empty strings in cors al… 0.04s
  ! CORS configuration → it should contain at least one well-formed ori… 0.02s
...
  Tests:    2 warnings, 199 passed (633 assertions)
  Duration: 6.56s

Script ./vendor/bin/pest --coverage --configuration=phpunit.feature-coverage.xml --min=90 handling the test:feature-coverage event returned with error code 1
```

The test file's `covers(HandleCors::class)` declares coverage on `Illuminate\Http\Middleware\HandleCors`, which is in `vendor/`, not `app/Http/Controllers`. PHPUnit emits a warning per test method (2 methods × 1 warning = 2 warnings). Pest's `--min=90` runs the strict mode that converts warnings to fatal exit before the coverage table is even generated. **No coverage percentage was produced — the install IS working (no driver error), the test config is the blocker.**

## Showcase Readiness

This shift restores the regulation enforcement everyone after this shift depends on. Two of three thresholds (unit 100%, mutation 76%) are now measurable and meet regulation. The third (feature 90%) is blocked by a pre-existing `covers()` mismatch — surfaced honestly, not papered over.

The Dockerfile change is the canonical commit-ready artifact. A senior architect auditing this would: see the 2-line addition is the standard `pecl install pcov && docker-php-ext-enable pcov` recipe (no novel patterns, no hand-rolled scripts), see the shift log honestly notes the verification was blocked by environmental access, and see that the test-config issue blocking feature-coverage was identified, traced to its exact line, and routed for follow-up rather than swept up into this shift's scope. That is the diagnostic-vs-fix discipline the permit asked for.

What's NOT showcase-grade and needs follow-up:
- The host's `php` alternative still points to 8.5 — every future shift on this host needs the same `PATH=/tmp/php84-shim:$PATH` workaround, OR the alternative needs to be flipped via sudo. This is a developer-environment hygiene item, not an artifact change.
- The feature-coverage `covers()` mismatch is a paper cut: small, well-scoped, easy to fix in a follow-up shift, but it sits between the regulation and an actual measurement.
- The Dockerfile change is unverified. Once a reviewer with Docker access runs `docker compose build backend` and confirms `php -m | grep pcov` inside the container, the canonical path is fully validated.

## Proposed Knowledge Updates

- **Learnings:** Two candidates worth filing.
  1. *Host alternative-php drift can silently break extension-dependent commands.* When a project pins a PHP version (`composer.json platform.php`) and the host has multiple parallel PHPs (`update-alternatives`), confirm `php -v` matches the pinned version before debugging extension issues. Two shifts wasted Director cycles on "no driver" before anyone noticed `update-alternatives` pointed at a non-pinned PHP.
  2. *Pest converts coverage-time warnings to fatal exits.* When `composer test:coverage` or `composer test:feature-coverage` exits non-zero with "N warnings, M passed," check `covers()` annotations against the `<source>` block of the corresponding phpunit XML. The coverage table is never produced because Pest aborts on the warning before the report writes.
- **Pulse:** "PHP coverage driver missing from environment" can be marked **Closed** for this Sorter's session (verified install via shim) but should be promoted to a hybrid item: **"Host `php` alternative points to 8.5 — needs `sudo update-alternatives --set php /usr/bin/php8.4` for durable host fix"**, AND **"Dockerfile PCOV install awaiting build verification (Docker daemon access not available in current dev shell)"**. Both close out the original blocker but add two narrower follow-ups.
- **Decision Record:** No ADR-level decision was made. The committed PCOV choice was settled before this shift; the Dockerfile is the standard pecl recipe; the host alternative switch is a developer-setup detail, not an architecture decision.

## Self-Debrief

### What Went Well

- **Front-loaded the investigation** — read the permit, listed the past two shifts' shift logs and the L13 amendment, ran `which php`, `php -m`, `apt list --installed | grep pcov`, and saw the dual-install / wrong-alternative situation in under five minutes. The permit's "where does the gauntlet run" question turned into the answer to the install question.
- **Applied the three-candidate training from today's earlier shifts:**
  1. *Sandbox mutation checks:* did them implicitly by running each gauntlet command after the shim was active and confirming exit codes individually before drawing conclusions.
  2. *`ls vendor/...` verification before assuming a class exists:* applied as `find / -name "pcov.so"` before assuming PCOV needed installing — found it already on disk, which reframed the entire approach (no install needed, just alternative routing).
  3. *Capture baseline metrics with the actual command:* every metric in the Order Fulfillment table is sourced from a captured `/tmp/*.log` file, with verbatim excerpts in the Quality Gauntlet section. No memo-text claims.
- **Held scope discipline on the feature-coverage warning.** The temptation to "just fix that one line" was real — the test is two `covers()` lines that could be retargeted to a Controller class in 30 seconds. But the permit explicitly bars threshold remediation and test refactoring in this shift. Held the line; flagged for follow-up.

### What Went Poorly

- **Did not check `update-alternatives --display php` until after I had already explored Docker access and pecl availability.** If I had run it as the second command (right after `php -v`), I would have seen the dual-install and wrong-alias picture immediately and saved ~5 minutes of wandering.
- **The session-local PATH shim is a slight aesthetic compromise.** Cleaner would have been a project-level `.env` / dev tooling commitment — but neither is in scope for this permit. Documented honestly that the durable fix is sudo-gated and that the shim is session-only.

### Blind Spots

- **Did not initially anticipate that PHP 8.5 was already on the host.** Read "the host has no coverage extension" in the permit and assumed PHP was 8.4 (per the project pin). The host's `php` alias is 8.5; without `update-alternatives --display`, that fact is invisible from `php -v` alone (which just shows the version, not which alternative is selected). Lesson: when an environment behaves contrary to project pins, check `update-alternatives --display` early, not late.
- **Almost edited `composer.json` instead of using the shim.** Considered prepending `php8.4` to each script's command line. That would have papered over the host alternative issue and committed environmental-coupling logic into a project-level config file. The shim isolates the workaround to this session and keeps the project clean.

### Training Proposals

| Proposal | Context | Shift Evidence |
|---|---|---|
| When debugging "extension X is not loaded" on a host with the project's PHP version pinned in `composer.json platform.php`, run `update-alternatives --display php` (or equivalent) as the second diagnostic command, right after `php -v`. The first reveals the version; the second reveals which of multiple installed PHPs is the active alternative — and dual-install drift is a common silent root cause. | Cost ~5 min wandering through Docker access and pecl availability before checking which `php` was actually selected. The dual-install was visible in `apt list --installed` from the first probe but the relevance only landed after `update-alternatives --display`. | This log |
| Before workarounding an environmental constraint by editing project-level config (composer.json scripts, phpunit XML, etc.), ask: "is the workaround scoped to my session, or am I committing developer-machine state into a tracked artifact?" Prefer session-only scopes (PATH shim, env var, alias) for environmental fixes; reserve project-level edits for fixes that should ship to all developers. | Almost edited `composer.json` to invoke `php8.4` explicitly when a session PATH shim was equivalent and didn't entangle the project file with the developer-host alternative-php situation. | This log |
| When a gauntlet command exits non-zero with "N warnings, M passed" in Pest output, look for `covers()` annotations that target classes outside the `<source>` block of the relevant phpunit XML — Pest converts these warnings to fatal exits in `--min` mode, which suppresses the coverage report entirely. The fix is to align `covers()` with `<source>` (or move the test out of coverage scope). | Spent two minutes reading the feature-coverage failure as a possible coverage-driver issue before grepping for the test that warned and tracing it to `covers(HandleCors::class)` targeting a `vendor/` class that the source directory doesn't include. The same pattern is already a graduation candidate from the 2026-03-26 enforce-code-quality shift; this is a second confirming observation. | This log |

---

## Logistics Director Evaluation

_Appended by the Logistics Director after reviewing the log. The sorter's sections above are not edited — they stand as written._

**Overall Assessment:** Excellent

### Order Fulfillment Review

The headline result is two of three regulation thresholds now measurable and meeting regulation: unit coverage **100.0%** (regulation 100%), MSI **76.97%** (regulation 76% min). The third — feature coverage at 90% — is blocked by a pre-existing `covers()` mismatch in `CorsConfigTest`, not by the driver install. The Sorter correctly identified this as not-a-driver-issue and not-a-coverage-gap, and routed it for follow-up rather than expanding scope.

Two acceptance criteria landed Partial / Blocked rather than Met, both for the right reasons:

- **Dockerfile build verification blocked** — Docker daemon not accessible in the current dev shell. Per the permit's instruction ("If you don't have rebuild permissions or the build fails for environmental reasons, **stop and surface the issue**"), the Sorter did not work around it. The diff is committed-ready (2 lines, idiomatic `pecl install pcov && docker-php-ext-enable pcov`); a reviewer with Docker access can verify in seconds.
- **Feature-coverage measurement blocked by pre-existing test config** — the `covers(HandleCors::class)` annotation in `CorsConfigTest` targets a vendor/ class outside the `<source>` block of `phpunit.feature-coverage.xml`. Pest converts the resulting warnings to fatal exits in `--min` mode, which suppresses the coverage table. The diagnosis is exact (file, line, mechanism); the remediation is correctly held back per the diagnostic-vs-fix split.

Both blocks are surfaced with the right level of evidence — captured outputs, exact mechanisms, follow-up routing. This is what "honest substitution makes the gap visible" means in practice.

### Decision Review

Five decisions. All sound. Two stand out:

**Decision #3 (PATH shim over `composer.json` edit) is the most architecturally important call this shift.** The Sorter explicitly considered the alternative — patching the three composer scripts to invoke `php8.4` directly — and articulated why it was wrong: it papers over the real issue (host has the wrong `php` alternative), only fixes 3 of N composer scripts, and entangles project-level config with developer-host state. Choosing the session-local shim instead keeps the project clean, isolates the workaround to this session, and forces the durable host fix (`sudo update-alternatives --set php /usr/bin/php8.4`) to be visible as a follow-up rather than hidden inside `composer.json`. This is the right architectural instinct expressed cleanly. Approved.

**Decision #2 (edit Dockerfile despite no build verification) is the gutsy-but-right call.** Permit explicitly designated the Dockerfile as the load-bearing artifact. Skipping it would have left the canonical Docker path uninstalled. Filing the change with a clean minimal diff and surfacing the verification block is more defensible than declining the file edit entirely. Approved.

Decisions #1 (canonical environment = host), #4 (don't remediate the `covers()` warnings), and #5 (don't run `sudo update-alternatives` interactively) are all routine correct calls within the permit's frame. None warranted CEO escalation.

### Showcase Assessment

Strong. This shift restored regulation enforcement for everyone after it. But the real headline — and the part a portfolio reviewer would notice — is the **root-cause diagnosis**:

> The host has two PHP installations side by side. `php` aliases to 8.5 (which has no pcov build); `php8.4` has pcov already installed. The "no coverage driver" failure on every prior shift in this environment was actually a PHP-version-mismatch bug, not a missing extension.

Two consecutive shifts today honestly substituted for the missing driver and reported "coverage driver missing from environment" as the gap. They were operating off correct evidence (`php -m` returned no coverage extension, `composer mutation` bailed with the driver error) but the wrong inference about cause. The Sorter on this shift ran one extra command — `update-alternatives --display php` — and the entire two-day misdiagnosis collapsed.

That is portfolio-grade work. A senior reviewer reading the three shift logs from today plus the Director's Amendment to the L13 upgrade will see a team that:
- Surfaces gaps honestly when they appear,
- Substitutes responsibly when measurement isn't available,
- Re-investigates when "we know what's wrong" leads to repeated workarounds,
- Routes follow-ups correctly when scope discipline says "stop here."

The Dockerfile change is the canonical durable artifact even though its build is unverified. The shift log's verbatim excerpts (`composer test:coverage`, `composer mutation`, `composer test:feature-coverage` failure mode) make the entire chain of evidence reproducible without re-running.

### Training Proposal Dispositions

| Proposal | Disposition | Rationale |
|---|---|---|
| When debugging "extension X is not loaded" on a host with the project's PHP version pinned in `composer.json platform.php`, run `update-alternatives --display php` (or equivalent) as the second diagnostic command, right after `php -v` | **Candidate** | Specific trigger (extension-loaded debugging on a pinned-PHP project), specific check (`update-alternatives --display`), evidence-backed (this shift's two-day misdiagnosis collapsed once the alternative was checked). Will graduate on a second confirming observation — likely whenever a future shift hits an environment where a host extension claim conflicts with project pinning. |
| Before workarounding an environmental constraint by editing project-level config (composer.json scripts, phpunit XML, etc.), ask: "is the workaround scoped to my session, or am I committing developer-machine state into a tracked artifact?" Prefer session-only scopes (PATH shim, env var, alias) for environmental fixes; reserve project-level edits for fixes that should ship to all developers | **Candidate** | Strong articulation. Specific trigger (workarounding an environmental constraint), specific decision criterion (session vs ship-to-all), strong real-world example (almost edited `composer.json` to invoke `php8.4` directly when a PATH shim was equivalent and cleaner). Will graduate on a second confirming observation. |
| When a gauntlet command exits non-zero with "N warnings, M passed" in Pest output, look for `covers()` annotations that target classes outside the `<source>` block of the relevant phpunit XML — Pest converts these warnings to fatal exits in `--min` mode, which suppresses the coverage report entirely | **Second confirming observation** of the existing candidate from `2026-03-26-enforce-code-quality` | This is the same pattern as the candidate already in the graduation log: "When coverage tests produce warnings instead of reports, check for `covers()` annotations targeting classes outside the `<source>` directories in the phpunit XML." First observation: 2026-03-26. Second observation: this shift. **This triggers the Graduation Protocol — see Dispatch Report for test scenarios and graduation verdict.** |

### Notes for the Sorter

Three things to keep doing:

1. **Decision #3 reasoning (PATH shim over `composer.json` edit) is the kind of architectural instinct that distinguishes a Sorter from a senior Sorter.** You explicitly considered the project-level edit, articulated why it was wrong, and chose the cleaner path. The articulation matters as much as the choice — it leaves a paper trail a future Sorter can learn from.

2. **The diagnostic-vs-fix discipline on the feature-coverage `covers()` mismatch.** "The temptation to 'just fix that one line' was real... Held the line; flagged for follow-up." That is the discipline the permit asked for, exercised under real temptation. Keep doing it.

3. **Capturing baseline metrics with verbatim command output.** Every metric in the Order Fulfillment table is sourced from a captured `/tmp/*.log` file with a verbatim excerpt in the Quality Gauntlet section. Anyone reading this log can reproduce the chain of evidence without re-running. That is the standard.

One thing to do differently next time: **`update-alternatives --display` belongs as your second probe after `php -v`, not your fifth or sixth.** Your own Self-Debrief and Training Proposal #1 already name this — once that proposal graduates, the lesson becomes muscle memory. Until then, the shift cost ~5 minutes wandering through Docker access and pecl availability before the alternative-php picture landed.

**Two follow-up shipping orders queued from this shift:**

1. **Standard priority:** fix the host `php` alternative — `sudo update-alternatives --set php /usr/bin/php8.4`. This is a developer-environment hygiene item rather than a code change; could be a one-line note in `CLAUDE.md` or developer-setup doc rather than a full shipping order if appropriate. Director will decide on artifact form.
2. **Standard priority:** remediate the `covers()` mismatch in `CorsConfigTest` so feature coverage becomes measurable. Cleanest path is probably retargeting `covers()` to a Controller class actually under test (or removing the `covers()` line entirely). Either way, that shift becomes a "second confirming feature coverage measurement" once the install is unblocked.
3. **(Already queued, now executable):** the deferred 2026-04-19 mutation drill — once #1 is sorted, this can run.

Permit `2026-04-29-pcov-coverage-driver-install` is closed. Three Open Items closed; three new follow-ups queued. The warehouse has its regulation enforcement back, conditionally on the host `php` alternative being aligned.
