# Shipping Order: Install PCOV Coverage Driver

**Order #:** 2026-04-29-pcov-coverage-driver-install
**Filed:** 2026-04-29
**Issued By:** CEO (via Logistics Director draft)
**Assigned To:** Head Sorter
**Priority:** **Urgent**

---

## The Shipment

`composer test:coverage`, `composer test:feature-coverage`, and `composer mutation` all currently bail with `No code coverage driver is available.` because no PHP coverage extension (PCOV or Xdebug) is loaded in the environment where the gauntlet runs. This blocks ADR-0003 enforcement of the regulation thresholds — 100% unit coverage on Actions/Services, 90% feature coverage on Controllers, 76% mutation testing minimum on Actions/Services. The gap compounds with every shift: as of 2026-04-29 it has blocked full enforcement on at least two consecutive shifts in a single day (storage-map ResourceData and L13 attribute cleanup), with both Sorters honestly substituting filtered runs and sandbox mutation checks. Honest substitution makes the gap visible, but does not satisfy the regulation. Install PCOV, restore measurability, close the gap.

The project has already committed to **PCOV** as the driver — `composer.json` line declaring `"mutation": "php -d pcov.enabled=1 ./vendor/bin/pest --mutate ..."` references the PCOV-specific `pcov.enabled` directive. This is not a "pick a driver" order; it is a "make the chosen driver actually present" order.

## Scope

### In the Crate

- Install PCOV in the environment where `composer test:coverage`, `composer test:feature-coverage`, and `composer mutation` run. The Sorter must first determine **where** the gauntlet runs in this codebase — host PHP (`php -m` on the host currently shows zero coverage extensions) and/or the `backend` Docker container (`docker/backend.Dockerfile` does not currently install any coverage extension). Document the determination in the shift log before editing.
- Update the appropriate environment artifact:
  - **If the gauntlet runs in the Docker container:** add a `docker-php-ext-install` (or `pecl install pcov && docker-php-ext-enable pcov`) step to `docker/backend.Dockerfile`. Rebuild the container; verify `php -m | grep pcov` shows `pcov`.
  - **If the gauntlet runs on host PHP:** install PCOV on the host (e.g., `pecl install pcov` and enable in `php.ini`, or via `apt install php8.4-pcov` if Debian/Ubuntu provides it). Document the install command for reproducibility — but **do not commit a host-specific setup script as if it were the canonical install path**; if the host is the canonical environment, that fact should be reflected in a developer-setup doc or `CLAUDE.md`, not a runbook hidden in this shift log.
  - **If both:** install in both. The Dockerfile change is the durable, reproducible artifact; the host install is a one-time developer step.
- Verify all three blocked commands now run end-to-end:
  - `composer test:coverage` — must complete and report coverage percentage. Acceptance is "the command runs without the driver error" — this order does NOT also commit to the 100% threshold being met today, see "Not on This Pallet."
  - `composer test:feature-coverage` — same: must complete and report a percentage, not bail with the driver error.
  - `composer mutation` — must complete and report a Mutation Score Indicator (MSI). Same acceptance: command runs, not "MSI ≥ 76%."
- Capture the **measured-today values** of all three metrics in the shift log. These become the new baseline against which subsequent shifts are evaluated. If any of the three falls below the regulation threshold (100% / 90% / 76%), document the gap honestly — it is not this Sorter's job to remediate, but it IS this Sorter's job to surface what the install reveals.

### Not on This Pallet

- **Remediating any threshold misses revealed by the install.** If the unit coverage measures at 99.4% (instead of the regulation 100%), or feature coverage at 87% (instead of 90%), or MSI at 73% (instead of 76%) — capture the gap, do not fix it. The fix is the next shift. Filing one shipping order ("install the driver") and another ("close the gap that became visible") is cleaner than bundling the two and creating a single shift log that has to defend both decisions.
- **Changing the regulation thresholds.** ADR-0003 thresholds stand. If a metric measures below the regulation today, the answer is to remediate the metric, not lower the threshold.
- **Restructuring the test suite.** Don't refactor tests, don't move files, don't change `phpunit.xml` / `phpunit.coverage.xml` / `phpunit.feature-coverage.xml` configurations beyond what's strictly necessary to make the driver visible (and even then, document any config touch in the shift log).
- **Switching from PCOV to Xdebug.** PCOV is what the project committed to via the existing `mutation` script. A driver-swap is a separate ADR-level decision, not a shipment.
- **The deferred mutation drill from the 2026-04-19 L13 upgrade.** That follow-up was already parked. Once this driver install lands, it becomes executable — but executing it is a separate shift.
- **CI pipeline configuration.** If CI runs the gauntlet in a separate environment (GitHub Actions, Railway), and that environment has its own PCOV install handling, the Sorter does not need to touch CI config beyond verifying the existing CI gauntlet still passes after the change. If CI is broken by this change, that's a problem to surface, not silently work around.

## Acceptance Criteria

- [ ] The Sorter has documented (in the shift log) which environment is the canonical gauntlet-running environment for this codebase: host PHP, Docker container, both, or other.
- [ ] PCOV is installed and visible in the canonical environment(s). Verify with `php -m | grep pcov` returning `pcov` (or equivalent diagnostic).
- [ ] `composer test:coverage` runs to completion (no `No code coverage driver is available.` error). Output reported in the shift log including the measured coverage percentage.
- [ ] `composer test:feature-coverage` runs to completion. Output reported in the shift log including the measured coverage percentage.
- [ ] `composer mutation` runs to completion. Output reported in the shift log including the measured MSI.
- [ ] If `docker/backend.Dockerfile` was modified, the file builds cleanly (`docker compose build backend` from the orchestrator root, or equivalent) and the running container has PCOV enabled.
- [ ] `composer lint:test`, `composer phpstan`, `composer deptrac`, `composer test`, `composer test:arch` all still pass — the install must not regress the rest of the gauntlet.
- [ ] Shift log captures the three measured-today values of unit coverage / feature coverage / MSI as the new baseline. **Do not "fix" any threshold misses in this shift** — document them and let the Director queue the remediation.
- [ ] Any threshold miss revealed by the install is flagged for the Logistics Director with the specific gap (e.g., "unit coverage measured at 99.4% — 0.6% below ADR-0003 threshold").

## References

- ADR-0003: 100% / 90% / 76% thresholds on unit, feature, and mutation respectively.
- Project commitment to PCOV: `composer.json` `mutation` script line — `php -d pcov.enabled=1 ./vendor/bin/pest --mutate ...`.
- Files involved:
  - `docker/backend.Dockerfile` (probably modified)
  - Possibly `composer.json` if a coverage-related Composer script needs adjustment (do NOT add a `require-dev` for PCOV — it is a PHP extension, not a Composer package)
  - Shift logs that flagged this gap: `2026-04-29-storage-map-resource-data.md`, `2026-04-29-laravel-13-attribute-cleanup.md`
- Pulse entry: "PHP coverage driver missing from environment" — the Open Item being closed by this order.

## Notes from the Issuer

This is infrastructure plumbing, not application work. The job is to make a chosen driver actually present in the environment where the gauntlet runs.

**Why Urgent:** every shift in this environment is currently shipping with the regulation thresholds *unmeasured*. Two shifts have already substituted with filtered runs + sandbox mutation, both Sorters were honest about the substitution, and both Director evaluations recorded the gap as Open. That gap compounds with each new code-touching shift. Closing it is the highest-leverage open item — once measurable, the regulation enforces itself again.

**Watch for the diagnostic-vs-fix split.** This order installs the driver. If the install reveals that one or more thresholds is currently below regulation, **do not fix the threshold miss in this shift** — that is a separate concern. Bundling the install with a remediation would make the shift log have to defend two decisions, and would couple the install's success criteria to the test suite's current state. They should be independent.

**On the Dockerfile vs host install question:** in a Docker-first development workflow, the Dockerfile is the canonical artifact. A host install is convenient for the developer running locally but cannot be reproduced. If the gauntlet runs in both places, install in both, but treat the Dockerfile change as the load-bearing artifact and the host install as a one-time setup note. If the host is the canonical gauntlet-running environment for this codebase (which would be unusual for a Docker-based project), document that fact — but flag it; it suggests the Docker setup has drifted from being authoritative.

When this order ships clean, the next shift can run the deferred 2026-04-19 mutation drill and any future code-touching shift will once again be inspected by the regulation it was always supposed to be inspected by.

---

**Status:** Completed
**Shift Log:** [2026-04-29-pcov-coverage-driver-install.md](../journals/2026-04-29-pcov-coverage-driver-install.md)
