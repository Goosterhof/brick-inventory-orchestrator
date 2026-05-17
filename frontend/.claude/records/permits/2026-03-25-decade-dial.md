# Building Permit: The Decade Dial

**Permit #:** 2026-03-25-decade-dial
**Filed:** 2026-03-25
**Issued By:** Brick Master (Baseplate)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Add a release-year distribution visualization to the dashboard — a bar chart or heat map computed from `Set.year`. Zero backend work. The nostalgia factor: see your LEGO history mapped to your life timeline.

## Scope

### In the Box

- Year distribution visualization on the dashboard (bar chart, heat map, or similar — architect proposes, CFO approves)
- Computed client-side from existing family sets data
- Should handle edge cases: sets without year data, single-year collections, large year ranges
- Responsive — looks good on mobile and desktop
- Fits the neo-brutalist LEGO design language

### Not in This Set

- Backend changes or new endpoints
- Interactive features (clicking a year to filter sets, etc.)
- Other dashboard stats or visualizations (those belong to Brick DNA Lab)
- Third-party charting libraries unless the CFO approves the bundle size impact

## Acceptance Criteria

- [ ] Dashboard shows a year distribution visualization for the family's sets
- [ ] Visualization is computed from existing set data (no new API calls)
- [ ] Handles empty state (no sets) gracefully
- [ ] Handles edge cases (no year data, single year, wide range)
- [ ] Responsive across breakpoints
- [ ] Follows the neo-brutalist design system
- [ ] No third-party chart libraries (pure CSS/SVG) unless CFO approves the size-limit impact
- [ ] 100% test coverage on new code
- [ ] All quality gates pass

## References

- Feature Brief: Muse's Ideas Ledger `docs/muse-ledger.md` — Idea #04
- Gauntlet note: "Closer to Vanity than Workhorse, but cheap enough that one-time delight earns its keep."

## Notes from the Issuer

Tier 1 / Spark. This is a delight feature, not a workhorse — keep the implementation lean. A pure CSS bar chart in the LEGO style would be perfect. Watch the bundle size: no Chart.js or D3 for something this simple. The gift is the nostalgia — "my collection peaks in 2015, when the kids were little."

---

**Status:** Complete
**Journal:** _link to construction journal when filed_
