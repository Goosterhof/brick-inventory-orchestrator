# Building Permit: The Set Completion Gauge (Plate Side)

**Permit #:** 2026-03-26-set-completion-gauge
**Filed:** 2026-03-26
**Issued By:** CEO
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Show build completion percentages on each set card in the sets overview — a visual badge or progress indicator showing "78% parts in storage" so collectors can see buildability at a glance without clicking into each set's detail page.

## Scope

### In the Box

- Fetch completion data from new bulk endpoint (`GET /family-sets/completion`)
- Visual completion indicator on each set card in `SetsOverviewPage.vue` (badge, bar, or percentage)
- Handle null/unknown completion (set parts never fetched from Rebrickable)
- Handle 0% and 100% states with distinct visual treatment
- Wishlist sets should not show completion (excluded from backend response)
- Types for the completion response
- Translations (EN/NL)

### Not in This Set

- The backend endpoint — separate shipping order to the Brick
- Changes to the set detail page build planner (already has full per-part breakdown)
- Completion-based sorting or filtering on the overview (future enhancement)

## Acceptance Criteria

- [ ] Sets overview shows completion percentage on each non-wishlist set card
- [ ] 0% (red/neutral), partial (yellow), and 100% (green) have distinct visual treatment
- [ ] Sets with unknown completion (parts never fetched) show a neutral/unknown state, not 0%
- [ ] Wishlist sets do not show completion indicators
- [ ] Loading state while completion data is fetched
- [ ] Coexists with existing search, status filter, theme grouping, and sort
- [ ] Responsive across breakpoints
- [ ] Follows neo-brutalist design system
- [ ] 100% test coverage on new code
- [ ] All quality gates pass

## References

- Feature Brief: `docs/idea-vault.md` — The Set Completion Gauge
- Related Permit: `backend/.claude/records/permits/2026-03-26-set-completion-gauge.md` (Brick side)
- Related: Set detail build planner (existing per-set completion, `SetDetailPage.vue`)

## Notes from the Issuer

The visual treatment matters here — this is the most visible new element on the most-visited page. Keep it subtle enough not to clutter the cards but informative enough to be useful at a glance. A small progress bar or percentage badge in the card corner would work. Don't overshadow the status badges that are already there.

**Dependency:** Blocked on the Brick's shipping order being completed first.

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-03-26-set-completion-gauge.md`
