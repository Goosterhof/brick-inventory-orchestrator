# Building Permit: Fix Vue Proxy Invariant Violation in Resource Adapter

**Permit #:** 2026-04-01-proxy-invariant-configurable-fix
**Filed:** 2026-04-01
**Issued By:** General (war room)
**Assigned To:** Lead Brick Architect
**Priority:** Urgent

---

## The Job

Change `configurable: false` to `configurable: true` on all 6 `Object.defineProperty` calls in `resource-adapter.ts` (lines 151-188). The current `configurable: false` combined with a `Ref` value triggers an ECMAScript Proxy invariant violation when an `Adapted<T>` is stored inside a Vue `ref()`.

## Why It Breaks

Vue's reactive system wraps objects in a `Proxy`. When a property holds a `Ref`, Vue's `get` trap auto-unwraps it (returns `ref.value` instead of the `Ref` wrapper). But the ECMAScript spec requires: for non-configurable, non-writable data properties, the proxy's `get` trap **must** return the exact same value as the target's property. Vue returns the unwrapped `.value`; the engine returns a `TypeError`.

Two production pages are confirmed bombs:

| Page                | Pattern                                                       | Verdict      |
| ------------------- | ------------------------------------------------------------- | ------------ |
| **EditSetPage**     | Stores `Adapted<T>` in `ref()`, template reads `.mutable`     | BOMB         |
| **EditStoragePage** | Stores `Adapted<T>` in `ref()`, template reads `.mutable`     | BOMB         |
| SetDetailPage       | Stores in `ref()` but template only reads accessor properties | Fragile-safe |
| StorageDetailPage   | Same as above                                                 | Fragile-safe |

The `NewAdapted<T>` path (spread + `Object.freeze`) is unaffected because frozen properties are `configurable: false` but hold plain values, not `Ref`s.

## Why `configurable: true` Is Safe

- `writable: false` already prevents `adapted.mutable = newValue` (throws `TypeError` at runtime)
- `Readonly<T>` prevents it at compile time
- `configurable: true` only allows `Object.defineProperty(adapted, 'mutable', ...)` — no production code does this
- The defense `configurable: false` was providing is already covered by `writable: false`

## Scope

### In the Box

- Change `configurable: false` to `configurable: true` on all 6 `Object.defineProperty` calls in `src/shared/services/resource-adapter.ts` (lines 152, 159, 165, 171, 177, 183)
- Update existing unit tests in `src/tests/unit/shared/services/resource-adapter.spec.ts` to verify that storing an `Adapted<T>` in a `ref()` does not throw
- Amend ADR-006 (`006-resource-adapter-frozen-mutable.md`) with a new section documenting the Proxy invariant constraint and why `configurable: true` is required

### Not in This Set

- Changes to page components (they already work once the adapter is fixed)
- Changes to `NewAdapted<T>` path (unaffected)
- Changes to `adapter-store.ts` (not involved)
- Integration test changes (the mock workaround can be cleaned up in a separate permit)

## Acceptance Criteria

- [ ] All 6 `Object.defineProperty` calls use `configurable: true`
- [ ] New unit test: create an `Adapted<T>`, store it in `ref()`, access `.mutable` — no `TypeError`
- [ ] New unit test: verify `adapted.mutable = newValue` still throws (writable: false protects)
- [ ] ADR-006 amended with Proxy invariant section explaining the constraint
- [ ] Full gauntlet passes (format, lint, type-check, knip, size, test:coverage)

## References

- Decision: ADR-006 (Resource Adapter with Frozen Base and Mutable Ref)
- War Room Context: Surveyor field report `reports/brick-inventory-orchestrator/field/2026-03-31-surveyor-proxy-invariant-deep-dive.md`
- War Room Context: ADR-0017 integration test campaign (where the violation was first discovered)

## Notes from the Issuer

**The Surveyor confirmed the crash in Node.js with Vue 3.5.30.** The `reactive()` proxy throws immediately on property access. The two edit pages store `Adapted<T>` in `ref()` and bind `v-model` to `.mutable` — they hit the trap.

**One discrepancy remains unresolved:** E2E tests navigate to edit pages and interact with forms. If they pass on current code, something at the browser/runtime level may defer or avoid the trap. The architect should run the E2E suite before and after the fix to validate. If E2E passes before the fix, document why (Vue's template compiler, lazy property access, etc.). If E2E fails before the fix, this is a live production bug.

**The ADR-006 amendment should document the constraint as a consequence:** "Properties defined with `Object.defineProperty` on adapted objects must use `configurable: true` when the value is a `Ref`, because Vue's reactive Proxy auto-unwraps `Ref` values, violating the ECMAScript invariant for non-configurable properties."

---

**Status:** Closed
**Journal:** [2026-04-01-proxy-invariant-configurable-fix](../journals/2026-04-01-proxy-invariant-configurable-fix.md)
