# Shipping Order: Align Dev and Prod to PHP 8.5

**Order #:** 2026-04-29-php-85-alignment
**Filed:** 2026-04-29
**Issued By:** CEO (via Logistics Director draft)
**Assigned To:** Head Sorter
**Priority:** Standard

---

## The Shipment

The host has silently been running the gauntlet on PHP 8.5 for ~10 days while the Dockerfile pins production to PHP 8.4 — a dev/prod drift that materially contributed to two days of "no coverage driver" misdiagnosis on 2026-04-29 (the host's 8.5 had no pcov build; the project's 8.4 image did, but the gauntlet ran on 8.5). Resolve the drift by moving the entire stack to PHP 8.5: bump the Dockerfile base image, install `php8.5-pcov` on the host, retarget `composer.json platform.php`, regenerate `composer.lock`, and verify the full quality gauntlet still meets ADR-0003 thresholds on 8.5.

This is **not** a new architectural direction — `composer.json require: php` has always allowed `^8.4` (semver permits 8.5). PHP 8.5 has been GA for ~5 months and the codebase + Laravel 13 + all dependencies have been silently running on 8.5 for ~10 days with the full unit/feature/architecture suite passing. This shift converts unintentional production-quality 8.5 testing into an intentional, documented, durable alignment.

## Scope

### In the Crate

- **`docker/backend.Dockerfile`** — bump base image from `FROM php:8.4-cli` to `FROM php:8.5-cli`. Single-line change. Combine with the `pecl install pcov && docker-php-ext-enable pcov` step landed in `2026-04-29-pcov-coverage-driver-install` if that file is in your working tree.
- **`composer.json`** — bump `platform.php` from `"8.4"` to `"8.5"`. The `require.php` constraint stays `^8.4` (semver permits 8.5; no need to tighten — keeping the lower bound preserves flexibility for any future pinning decision and makes this purely an "upgrade the floor under us" change).
- **`composer.lock`** — regenerate via `composer update` (full re-resolve, not `composer update <package>`). Commit the regenerated lockfile. The lock will likely shift package versions to whatever resolves cleanly under the new platform; that's expected.
- **Developer-setup documentation** — add a host-install note to the orchestrator-level `CLAUDE.md` (or the backend submodule's, whichever the Sorter judges canonical for dev-host requirements): "PHP 8.5 with the `php8.5-pcov` extension is required for the local gauntlet. Install via `sudo apt install php8.5 php8.5-pcov ...` and ensure `update-alternatives --display php` points to `/usr/bin/php8.5`." The Sorter picks the file based on whichever already documents host setup; if neither does, prefer the orchestrator `CLAUDE.md` because the dev-host scope is cross-territory.
- **Host install of `php8.5-pcov`** — `apt install php8.5-pcov` (sudo-gated). Available in the same `deb.sury.org` PPA as the existing 8.4 build, version 1.0.12. Document the install command in the shift log; if sudo is unavailable in this session, follow the same pattern as the prior shift — flag it for a follow-up developer step rather than working around it.
- **Verify the host alternative** — confirm `update-alternatives --display php` points to `/usr/bin/php8.5` (which is the current state, but verify rather than assume). After this shift, the host alternative pointing at 8.5 is no longer drift — it is the canonical configuration.
- **Run the full quality gauntlet on 8.5 and capture every metric:**
  - `composer lint:test` — must pass
  - `composer phpstan` — must report 0 errors at level max (308+ files)
  - `composer deptrac` — must report 0 violations
  - `composer test` — full suite must pass
  - `composer test:arch` — must pass
  - `composer test:coverage` — must report **≥ 100%** (regulation threshold)
  - `composer mutation` — must report **MSI ≥ 76%** (regulation threshold)
  - `composer test:feature-coverage` — currently blocked by a pre-existing `covers()` mismatch in `CorsConfigTest`; **do not remediate** (separate follow-up exists). Capture the same blocked-state diagnostic and confirm the install path didn't introduce additional failures.
- **Capture before/after metrics** — record the pre-bump baseline (today's PCOV-install measurements: unit 100.0%, MSI 76.97%) alongside the post-bump measurements in the shift log. Any regression (e.g., MSI drops from 76.97% to 75.4%) is a flag for the Logistics Director, not a fix-in-this-shift.

### Not on This Pallet

- **Production deploy verification on Railway.** Once the Dockerfile and lockfile changes merge to `main`, Railway will rebuild on the next deploy — that's a CEO/General-territory operation. The Sorter's verification ends at "local gauntlet green on 8.5"; production cutover is a separate authorized action.
- **Remediating the `covers()` mismatch in `CorsConfigTest`.** Already its own queued follow-up; out of scope here. Capture the same blocked feature-coverage state, do not fix.
- **The deferred 2026-04-19 mutation drill.** Becomes executable after this shift (mutation runs cleanly today on 8.5), but executing it is a separate shift.
- **Tightening `composer.json require: php` to `^8.5`.** Deliberately keeping the `^8.4` lower bound — this shift is "raise the floor under us," not "lock out 8.4." If a future decision warrants lifting the lower bound, that's a separate ADR-level call.
- **Refactoring application code to use 8.5-specific features.** This shift establishes the runtime; opportunistic adoption of 8.5 syntax is a separate decision and not in scope.
- **Cancelling the previously-queued "fix host alternative to 8.4" follow-up.** It is now superseded by this shift — the Sorter should note that the previous follow-up is obsolete in the shift log so the Director can mark it cancelled rather than orphaned.
- **A new ADR.** `composer.json require: ^8.4` has always allowed 8.5; this is an environmental alignment, not a new architectural direction. If the Sorter judges otherwise on inspection, surface it as a question — don't file ADRs unilaterally.

## Acceptance Criteria

- [ ] `docker/backend.Dockerfile` first line reads `FROM php:8.5-cli` (combined cleanly with the pcov install line from `2026-04-29-pcov-coverage-driver-install` if present).
- [ ] `composer.json` `platform.php` is `"8.5"`. The `require.php` constraint is unchanged (`^8.4`).
- [ ] `composer.lock` regenerated via `composer update` and committed. The Sorter has reviewed the lockfile diff and noted any package-version shifts in the shift log; surprising shifts (e.g., a major version bump on a Laravel sub-package) are flagged but not necessarily reverted.
- [ ] `php8.5-pcov` is installed on the host (or the install command is documented as a flagged follow-up if sudo is unavailable in this session).
- [ ] `update-alternatives --display php` confirms the active alternative is `/usr/bin/php8.5`.
- [ ] Developer-setup documentation in `CLAUDE.md` (orchestrator or backend, Sorter's judgment) names the PHP 8.5 + `php8.5-pcov` requirement and the `update-alternatives` expectation.
- [ ] Full gauntlet results captured in the shift log, with verbatim command-output excerpts. All measurable checks pass at regulation thresholds:
  - `composer phpstan` — 0 errors
  - `composer deptrac` — 0 violations
  - `composer test` — all pass
  - `composer test:arch` — all pass
  - `composer test:coverage` — ≥ 100%
  - `composer mutation` — MSI ≥ 76%
- [ ] `composer test:feature-coverage` blocked-state diagnostic captured (same `covers()`-mismatch failure as today's PCOV-install shift); confirmed the install path didn't introduce additional failures beyond the pre-existing block.
- [ ] Pre/post metrics table in the shift log: today's PCOV-install baseline (8.5-via-shim) versus post-bump (8.5 canonical). Any regression flagged for the Director.
- [ ] If `docker/backend.Dockerfile` was modified, the file builds cleanly when next a reviewer with Docker daemon access runs `docker compose build backend`. (Build verification is blocked-but-acceptable in this session if the daemon is unavailable, same pattern as the PCOV install permit.)

## References

- Strategic discussion: 2026-04-29 conversation between CEO and Logistics Director — three options (A: pin to 8.4, B: move to 8.5, C: hybrid drift). CEO chose B.
- Empirical foundation: the gauntlet has run on PHP 8.5 silently since the L13 upgrade landed on 2026-04-19. Test counts in the L13 journal (542/542) and every subsequent shift log confirm full functional pass on 8.5.
- Today's PCOV-install shift: `2026-04-29-pcov-coverage-driver-install.md` — landed the Dockerfile pcov line and confirmed coverage measurability via session-shimmed PHP 8.4. This shift converts that to canonical 8.5 alignment.
- L13 upgrade journal + Director's Amendment: `2026-04-19-laravel-13-upgrade.md` — the upgrade that the codebase has been running on. Contains the queue-attribute decision and CSRF rename context that no longer matters here, but for completeness.
- Files involved:
  - `docker/backend.Dockerfile` (orchestrator repo, not backend submodule)
  - `backend/composer.json`
  - `backend/composer.lock`
  - `CLAUDE.md` (orchestrator or backend — Sorter's judgment)

## Notes from the Issuer

This is a **closing-the-drift** shift, not a feature shift. The codebase has already been running on 8.5 for ten days with no functional failures — the only thing missing is making it intentional. The shift's success criterion is "the gauntlet still meets ADR-0003 thresholds on 8.5" because that's the regulation we care about; everything else is plumbing.

**On the diagnostic-vs-fix split:** apply it again here. If `composer update` pulls a dependency version bump that introduces a PHPStan error or a test failure, **capture the issue and stop**. Bundling "PHP 8.5 alignment" with "remediate whatever update --with-all-deps reveals" creates a shift log that has to defend two unrelated decisions. The right response to an unrelated regression revealed by the lockfile bump is a follow-up shipping order; this shift's scope ends at the alignment.

**On the host alternative:** today's host already runs 8.5 by default — that's the dev/prod drift this shift formalizes. After this shift, that's no longer drift; it's alignment. The previously-queued "fix host alternative to 8.4" follow-up is now obsolete and should be marked cancelled in the same shift log.

**On the empirical signal:** ten days of silent 8.5 runtime with the full test suite passing is stronger evidence of compatibility than most pre-upgrade investigations produce. If `composer update --no-interaction` resolves cleanly under `platform.php = "8.5"`, that's the second-strongest signal. If `composer phpstan` and `composer test` pass on 8.5, that's the third. We don't expect a hidden incompatibility — but if one appears, surface it.

**On the no-ADR call:** the original decision to allow `^8.4` was implicit in the L12 → L13 upgrade and has always permitted 8.5 by semver. This shift is environmental alignment, not architectural choice. If something during the work surfaces an architectural question (e.g., a Laravel package whose own `require.php` lower bound is `^8.5` and forces our hand differently), surface it for the Director to decide whether an ADR is warranted.

When the gauntlet is green on canonical 8.5, the warehouse closes today's most strategic open item: dev and prod runtime alignment. The follow-up shifts (mutation drill, `covers()` mismatch) can then run on a properly aligned environment.

---

**Status:** Completed
**Shift Log:** [2026-04-29-php-85-alignment.md](../journals/2026-04-29-php-85-alignment.md)
