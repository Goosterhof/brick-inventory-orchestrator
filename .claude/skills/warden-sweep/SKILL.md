---
name: warden-sweep
description: Dispatch a machine-fanned-out Quality Warden cross-wing sweep. Fans out one finder per SOP dimension (Gallery + Foundry + cross-ADR), runs the real quality gauntlet, adversarially verifies every medium+ finding before filing, then the Warden files a house-style Audit and updates its Casebook. Use for a periodic quality sweep, a post-Work-Order audit, or when the Pulse feels stale and the CEO wants depth a single-context audit can't reach. Billing-real (~1.4M tokens / ~30 min for a full run) — CEO-triggered only.
argument-hint: '[scope — "full" (default) | "foundry" | "gallery"]'
allowed-tools: Workflow, Bash, Read
---

# Warden Sweep — The Brickworks

A depth upgrade to the Quality Warden's periodic inspection. Where a hand-run audit is one context inspecting serially, this fans out **one finder per SOP dimension** across both wings at once, runs the real gauntlet in parallel, and — critically — **adversarially verifies every medium+ candidate finding** (a skeptic agent reads the actual source and tries to refute it) before anything is filed. The Warden then synthesizes one house-style Audit and updates its Casebook.

It is the same crew and the same paper trail as a manual Warden audit — just orchestrated. The output is a normal Audit at `.claude/records/audits/YYYY-MM-DD-warden-cross-wing-sweep.md` plus a Casebook update. Nothing else is written.

---

## When to Use

- **CEO trigger.** The CEO types `/warden-sweep` (optionally `/warden-sweep foundry` or `/warden-sweep gallery`).
- **Post-delivery / post-Work-Order.** A batch of work just landed and you want an independent, broad re-inspection before the next dispatch.
- **Pulse staleness.** Multiple Pulse sections are weeks past their `Assessed:` date and the CEO wants real evidence, not a refresh-by-memory.

**Don't run it:**

- For a narrow, single-claim question — that's a hand-run check or a targeted `/standup`, not a 20-agent fan-out.
- Unprompted. It is billing-real (a full run is ~1.4M tokens / ~30 min / ~20 agents). The CEO opts in each time.
- As a substitute for a focused freshness audit when the scope is genuinely one wing's Pulse sections — use a targeted Work Order to the Warden instead.

---

## Governance Boundary (load-bearing)

The workflow encodes the Warden's write scope mechanically:

- **Finder agents may NOT write.** They return structured findings only.
- **Only the synthesis agent writes**, and only to `.claude/records/audits/*.md` and `.claude/docs/quality-warden-casebook.md` — the Warden's locked territory (ADR-0030).
- It does **not** touch `pulse.md`, `decisions.md`, agent files, wing manuals, or any code. Pulse updates and manual corrections remain the Steward's follow-up, exactly as with a hand-run audit.

After the sweep lands, **The Steward reviews the filed Audit fresh** — confirm findings against source, correct any self-counting slips, append the `## Steward Evaluation`, and dispatch the actionable findings as Work Orders. The machine produces the evidence; the Steward rules on it.

---

## How to Run

1. **Get today's date** — run `date +%F` (the workflow script cannot read the clock; you must pass the date in).
2. **Read `$ARGUMENTS` for scope** — `foundry`, `gallery`, or empty/`full`. Cross-ADR pressure always runs regardless of scope.
3. **Invoke the saved workflow**, passing the date and scope as args:

   ```
   Workflow({
     name: 'warden-cross-wing-sweep',
     args: { date: '<YYYY-MM-DD from step 1>', scope: '<full|foundry|gallery>' },
   })
   ```

4. The workflow runs in the background and notifies on completion. When it lands:
   - **Verify before trusting.** Spot-check the headline findings against source — a 0% adversarial-refutation rate means tight candidates *or* an unexercised skeptic layer; do not assume.
   - **Reconcile the counts** in the filed Audit's Summary against the enumerated finding IDs (a known failure mode of the synthesis step).
   - **Append the `## Steward Evaluation`** with dispositions, then dispatch the actionable findings via Work Orders.

The reusable script lives at `.claude/workflows/warden-cross-wing-sweep.js`; edit it there to evolve the dimensions or schemas.
