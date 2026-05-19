# Building Permit: The Brick DNA Lab (Plate Side)

**Permit #:** 2026-03-25-brick-dna-lab
**Filed:** 2026-03-25
**Issued By:** Brick Master (Baseplate)
**Assigned To:** Lead Brick Architect
**Priority:** Standard

---

## The Job

Build a collection analytics page — the "Brick DNA" dashboard showing top colors, top part types, rarest parts, and a collection diversity score. Consumes a new backend endpoint (shipping order issued separately to Stud & Sort Logistics). This is the most screenshot-worthy feature in BIO.

## Scope

### In the Box

- New analytics/DNA page (new domain or section within an existing domain — architect proposes)
- Top 10 most-owned colors (with color swatches)
- Top 10 most-owned part types
- Rarest parts in the collection
- Collection diversity score (visual representation)
- Navigation entry point
- Route and translations

### Not in This Set

- The backend endpoint — that's a separate shipping order to the Brick
- Other analytics (year distribution is The Decade Dial, a separate permit)
- Comparison features (comparing with other families)
- Export or sharing of the DNA profile

## Acceptance Criteria

- [ ] New page accessible from navigation showing collection analytics
- [ ] Top 10 colors displayed with visual color swatches and counts
- [ ] Top 10 part types displayed with counts
- [ ] Rarest parts section showing least-common parts
- [ ] Diversity score computed and displayed visually
- [ ] Loading state while data is fetched
- [ ] Empty state when no data available
- [ ] Responsive and follows neo-brutalist design system
- [ ] 100% test coverage on new code
- [ ] All quality gates pass

## References

- Feature Brief: Muse's Ideas Ledger `docs/muse-ledger.md` — Idea #06
- Related Permit: `backend/.claude/records/permits/2026-03-25-brick-dna-lab.md` (Brick side)
- Gauntlet note: "Survived the identity crisis attack clean."

## Notes from the Issuer

Tier 2 / Burn. This is the portfolio differentiator — it turns BIO from "I track what I have" to "I understand what I have." The page should feel like opening a report about your collection, not just another data table. The backend endpoint contract needs to be agreed with the Brick before implementation starts — coordinate on the response shape.

**Dependency:** ~~Blocked on the Brick's shipping order being completed first (or at minimum, the API contract being agreed).~~ **CLEARED** — Backend shipped 2026-03-25. Endpoint: `GET /family/brick-dna`. Response: `BrickDnaResourceData` with `topColors` (name, hex, count), `topPartTypes` (name, category, count), `rarestParts` (part+color, quantity), `diversityScore` (Shannon index, 0-1). See `backend/.claude/records/journals/2026-03-25-brick-dna-lab.md`.

---

**Status:** Complete
**Journal:** `.claude/records/journals/2026-03-25-brick-dna-lab.md`
