# Building Permit: Adopt Wrapped Storage Map Response Shape

**Permit #:** 2026-04-29-storage-map-response-shape
**Filed:** 2026-04-29
**Issued By:** CEO (via CFO draft)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

The Brick is bringing `GET /sets/{setNum}/storage-map` under its `ResourceData` umbrella (paired Brick order: `2026-04-29-storage-map-resource-data`). Once that lands with **Option A** (wrapped object), the wire response flips from a top-level `StorageMapEntry[]` array to `{entries: StorageMapEntry[]}`. The Plate consumer in `SetDetailPage.vue` and the `StorageMapEntry`-related types need to match the new shape and stop double-handling the case conversion.

## Scope

### In the Box

- Add a new wrapper type next to `StorageMapEntry` in `src/apps/families/types/part.ts` — name it `StorageMapResponse` with `entries: StorageMapEntry[]`. Mirror the existing `MasterShoppingListResponse` (same file, lines 102–105) for naming and shape consistency.
- Update the consumer in `src/apps/families/domains/sets/pages/SetDetailPage.vue` (around line 106) to:
    - Request `StorageMapResponse` instead of `StorageMapEntry[]`.
    - Read `mapResponse.data.entries` as the array source.
    - Continue applying `toCamelCaseTyped<StorageMapEntry>(...)` per entry — the conversion pipeline stays. (The `httpService` middleware still snake↔camel-converts, so confirm with one quick ad-hoc test whether the explicit `toCamelCaseTyped` is still needed; if redundant, drop it. If kept, leave a one-line `// Why:` comment.)
    - Preserve the existing `try { ... } catch { storageMap.value = []; }` fallback unchanged.
- Update or add a unit test for the storage-map loading path in `SetDetailPage` covering: empty entries, one entry, multiple entries, request failure (existing fallback behavior).
- If existing tests mock the `/sets/{setNum}/storage-map` response, update those mocks to the wrapped shape.

### Not in This Set

- The Brick-side work — that lives in the paired shipping order. **Do not** touch backend code from this permit.
- Renaming or restructuring `StorageMapEntry` itself. The five fields (`partId`, `colorId`, `storageOptionId`, `storageOptionName`, `quantity`) stay exactly as they are.
- Other endpoints. The contract audit confirmed every other endpoint already follows the wrapped/Profile/ResourceData pattern — no sweep work.
- UnoCSS / styling changes in `SetDetailPage`. The visual rendering of the storage-map list does not change.
- New ADR. This change follows the existing case-conversion + ResourceData-mirror conventions; no new decision is required.

## Acceptance Criteria

- [ ] `StorageMapResponse` type exists in `src/apps/families/types/part.ts`, follows the `MasterShoppingListResponse` shape pattern (`{entries: StorageMapEntry[]}`).
- [ ] `SetDetailPage.vue` calls `familyHttpService.getRequest<StorageMapResponse>(...)` and reads `.entries`.
- [ ] The redundant-or-kept `toCamelCaseTyped` decision is documented in the construction journal with a one-line rationale; if kept, an inline `// Why:` comment explains it.
- [ ] `npm run type-check` passes — `vue-tsc` confirms the new type lines up.
- [ ] `npm run test:coverage` passes at 100% lines/functions/branches/statements.
- [ ] `npm run lint` and `npm run lint:vue` both pass.
- [ ] `npm run knip` reports no dead types (the old `StorageMapEntry[]` shape is fully replaced — no orphan exports left over).
- [ ] `npm run build` builds all three apps cleanly.
- [ ] Pre-push gauntlet passes end-to-end: type-check → knip → test:coverage → build.
- [ ] Construction journal records the deployment ordering note (this permit cannot ship before the paired Brick order ships, otherwise the Plate breaks against the live API).

## References

- Paired Brick Shipping Order: `backend/.claude/records/permits/2026-04-29-storage-map-resource-data.md` (Stud & Sort Logistics, filed 2026-04-29).
- Audit context: contract drift identified 2026-04-29 — `/sets/{setNum}/storage-map` is the sole endpoint in the system bypassing ResourceData on the Brick side. The Plate's `toCamelCaseTyped()` per-row call is the workaround that hid it.
- Reference implementation in this same file: `MasterShoppingListResponse` at `src/apps/families/types/part.ts:102-105` — same shape pattern (`{entries: ..., unknownFamilySetIds: ...}` minus the unknown-ids field, which storage-map doesn't need).
- Current consumer: `src/apps/families/domains/sets/pages/SetDetailPage.vue:106-107`.

## Notes from the Issuer

This is a paired follow-up. The Brick order is the structural fix — bringing storage-map into compliance with ADRs 0006 and 0010 over there. This permit is the cosmetic match-up on the Plate so the live API and the Plate consumer line up after the Brick ships.

**Deployment ordering matters.** The Brick must merge and deploy first; if the Plate ships first, the consumer will read `.entries` off a top-level array and silently render an empty storage map. Coordinate the merge sequence in the construction journal — flag explicitly that this permit's work cannot be released to production ahead of the paired Brick deployment.

If the Brick architect chooses **Option B** (preserve flat array shape on the wire) instead of Option A, this permit becomes a no-op — file a one-line construction journal saying so, mark Cancelled, and we save the ride. Don't speculatively start work; wait until the Brick's shift log confirms the chosen option.

This is not a refactor opportunity. Don't expand into "while I'm here, let me also..." territory. The audit confirmed every other endpoint is already clean. Touch only what the permit names.

---

**Status:** Completed
**Journal:** [`2026-04-29-storage-map-response-shape`](../journals/2026-04-29-storage-map-response-shape.md)
