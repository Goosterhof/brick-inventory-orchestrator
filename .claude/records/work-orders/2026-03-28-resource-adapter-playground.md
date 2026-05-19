# Building Permit: Resource Adapter Playground

**Permit #:** 2026-03-28-resource-adapter-playground
**Filed:** 2026-03-28
**Issued By:** CEO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Build an interactive showcase page that demonstrates the Resource Adapter and Adapter Store patterns end-to-end. Visitors should be able to create, mutate, persist, and reset resources in real-time — making our most sophisticated data-layer pattern visible and tangible.

## Scope

### In the Box

- New showcase section/page: Resource Adapter Playground
- Live demo of `resourceAdapter` — create a resource, edit fields, see adapted state
- Live demo of `AdapterStoreModule` — add to store, retrieve by ID, observe reactive updates
- Demonstrate full lifecycle: generateNew -> create -> update/patch -> reset -> delete
- Show camelCase/snake_case conversion in action (display both representations)
- Show localStorage persistence (persist, refresh indicator, clear)
- Integrate into existing showcase navigation and component gallery
- 100% test coverage on all new code

### Not in This Set

- No real API calls — all operations use mock/in-memory data
- No modifications to existing shared services or adapters
- No new shared components (use existing ones)
- No changes to the Families app

## Acceptance Criteria

- [ ] Showcase includes a Resource Adapter Playground section
- [ ] Users can create a new resource, edit its fields, and see the adapter state update reactively
- [ ] Users can add resources to a store, retrieve by ID, and see the store contents
- [ ] camelCase <-> snake_case conversion is visually demonstrated
- [ ] Reset functionality is demonstrated (revert resource to original state)
- [ ] All quality gates pass: type-check, knip, lint, test:coverage, build
- [ ] 100% test coverage on new code

## References

- Service: `src/shared/services/resource-adapter.ts`
- Service: `src/shared/services/adapter-store.ts`
- Existing showcase: `src/apps/showcase/`

## Notes from the Issuer

This is a portfolio piece — the adapter pattern is our strongest architectural differentiator and currently invisible in the showcase. The demo should make a senior engineer understand the pattern within 30 seconds of looking at it. Clarity over cleverness.

---

**Status:** Complete
**Journal:** _link to construction journal when filed_
