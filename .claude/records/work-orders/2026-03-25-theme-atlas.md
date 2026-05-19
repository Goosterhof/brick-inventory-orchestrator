# Building Permit: The Theme Atlas

**Permit #:** 2026-03-25-theme-atlas
**Filed:** 2026-03-25
**Issued By:** Brick Master (Baseplate)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Group the sets overview by LEGO theme — collapsible sections with filter chips at the top. The data already exists in `Set.theme`, it just needs to be surfaced in the UI.

## Scope

### In the Box

- Theme grouping on the sets overview page (collapsible sections)
- Theme filter chips at the top of the page for quick filtering
- Theme groups should show set count per theme
- Grouping works alongside existing search/filter/sort controls
- Sensible default state (all expanded, or all collapsed — architect's call, but justify it)

### Not in This Set

- Backend changes — theme data is already in set responses
- Theme management or editing
- Theme images or icons from Rebrickable
- Changes to the set detail page

## Acceptance Criteria

- [ ] Sets overview groups sets by theme in collapsible sections
- [ ] Filter chips at the top allow quick theme selection
- [ ] Each theme group shows the count of sets within it
- [ ] Grouping coexists with existing search, status filter, and sort
- [ ] When searching, grouping still applies (or gracefully degrades — justify the choice)
- [ ] 100% test coverage on new code
- [ ] All quality gates pass

## References

- Feature Brief: Muse's Ideas Ledger `docs/muse-ledger.md` — Idea #03
- Gauntlet note: "The filter is the utility, the grouping is the gift."

## Notes from the Issuer

Tier 1 / Spark. The data is already there — this is pure UI work. The Muse's gauntlet note is important: the filter chips are the functional value, the grouped view is the emotional payoff ("Oh, I'm a Technic collector with a Star Wars habit"). Don't sacrifice the filter UX for the grouping aesthetics.

---

**Status:** Complete
**Journal:** _link to construction journal when filed_
