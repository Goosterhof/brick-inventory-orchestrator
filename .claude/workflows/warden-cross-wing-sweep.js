export const meta = {
  name: 'warden-cross-wing-sweep',
  description: 'Quality Warden cross-wing freshness sweep — fan out SOP dimensions, adversarially verify findings, file a house-style Audit + Casebook update',
  whenToUse: 'Periodic quality sweep, post-Work-Order audit, or when the Pulse feels stale. Read-only against code; writes only the Audit + Casebook (Warden scope).',
  phases: [
    { title: 'Gauntlet', detail: 'run real quality gates both wings' },
    { title: 'Inspect', detail: 'SOP-dimension finders fan out as the Warden' },
    { title: 'Verify', detail: 'adversarial skeptic per medium+ finding' },
    { title: 'Synthesize', detail: 'assemble + file the Audit and Casebook update' },
  ],
}

// ---------------------------------------------------------------------------
// Args (passed by the /warden-sweep skill):
//   args.date  : 'YYYY-MM-DD' — stamps the audit filename + Filed field. REQUIRED in practice;
//                the skill always passes today's date (the script cannot read the clock).
//   args.scope : 'full' (default) | 'foundry' | 'gallery' — filters which wing dimensions run.
//                Atrium (cross-ADR) always runs.
// ---------------------------------------------------------------------------
const ROOT = '/home/goosterhof/Code/brick-inventory-orchestrator'
const TODAY = (args && args.date) ? String(args.date) : '0000-00-00'
const SCOPE = (args && args.scope) ? String(args.scope).toLowerCase() : 'full'
if (TODAY === '0000-00-00') log('WARNING: no args.date supplied — filename will read 0000-00-00. Invoke via /warden-sweep so today\'s date is passed.')

const CONVENTIONS = `You are operating inside The Brickworks monorepo at ${ROOT}.
Ground yourself in the live conventions before judging anything — read what you need:
- Root charter: ${ROOT}/CLAUDE.md
- Foundry (backend) manual: ${ROOT}/backend/CLAUDE.md
- Gallery (frontend) manual: ${ROOT}/frontend/CLAUDE.md
- ADR index / decisions: ${ROOT}/.claude/docs/decisions.md
- Current Pulse (living state): ${ROOT}/.claude/docs/pulse.md
- Your own Casebook (standing suspicions): ${ROOT}/.claude/docs/quality-warden-casebook.md
- A recent house-style audit for format: ${ROOT}/.claude/records/audits/2026-05-29-warden-cross-wing-sweep.md
Treat every doc claim as a hypothesis — code can't lie, docs can. Do NOT hardcode counts: derive them from canonical sources (test runners, component-registry.json, filesystem, decisions.md).
CRITICAL: You are a FINDER in a fan-out. Do NOT write any files. Do NOT run the heavy test suites (a dedicated gauntlet agent owns those — don't duplicate slow runs). Return ONLY structured findings.`

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['dimension', 'findings', 'notes'],
  properties: {
    dimension: { type: 'string' },
    notes: { type: 'string', description: 'what you checked, what you derived from canonical sources, anything you could not verify' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'severity', 'wing', 'location', 'standard', 'observation', 'impact', 'recommendation'],
        properties: {
          id: { type: 'string', description: 'short stable id, e.g. G-arch-1' },
          title: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          wing: { type: 'string', enum: ['Gallery', 'Foundry', 'Atrium'] },
          location: { type: 'string', description: 'file path + line(s), or doc + section' },
          standard: { type: 'string', description: 'the ADR / SOP / convention the observation is measured against' },
          observation: { type: 'string' },
          impact: { type: 'string' },
          recommendation: { type: 'string' },
        },
      },
    },
  },
}

const GAUNTLET_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['results', 'skipped', 'summary'],
  properties: {
    summary: { type: 'string' },
    skipped: { type: 'array', items: { type: 'string' }, description: 'gates NOT run and why (time, host-env, etc.) — no silent caps' },
    results: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['wing', 'command', 'status', 'detail'],
        properties: {
          wing: { type: 'string', enum: ['Gallery', 'Foundry'] },
          command: { type: 'string' },
          status: { type: 'string', enum: ['pass', 'fail', 'skipped', 'error'] },
          detail: { type: 'string', description: 'key numbers (coverage %, error count) or failure excerpt' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'verdict', 'reasoning'],
  properties: {
    id: { type: 'string' },
    verdict: { type: 'string', enum: ['confirmed', 'refuted', 'adjusted'] },
    reasoning: { type: 'string', description: 'cite the file/line/source you actually read' },
    adjustedSeverity: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
}

const ALL_DIMENSIONS = [
  { key: 'gallery-arch', wing: 'Gallery', prompt: `SOP G-2 — Gallery architecture compliance. Inspect ${ROOT}/frontend/src: import-boundary doctrine (@app/ @shared/, no ../shared, no cross-domain), component naming, service-factory pattern, domain structure, RouterService usage, ADR-0029 case conversion. Spot-check for violations the lint config would catch and ones it wouldn't.` },
  { key: 'gallery-doc', wing: 'Gallery', prompt: `SOP G-3 — Gallery doc accuracy. Verify every numeric/version claim in ${ROOT}/frontend/CLAUDE.md and the Gallery sections of the Pulse against canonical sources (component-registry.json meta.componentCount, test runner output, filesystem domain count, package.json versions). Flag hardcoded counts that violate the Pulse no-hardcoding rule and any stale framework-version claims.` },
  { key: 'gallery-debt', wing: 'Gallery', prompt: `SOP G-5 — Gallery tech debt + dead code. Scan ${ROOT}/frontend/src for TODO/FIXME, over-complex files (near the cyclomatic-10 / 80-line limits), duplicated patterns, and dead exports knip would flag. Report concrete locations.` },
  { key: 'gallery-test', wing: 'Gallery', prompt: `SOP G-6 — Gallery test quality. Sample .spec.ts files in ${ROOT}/frontend/src: behavior vs implementation testing, mock minimalism, assertion depth, edge-case coverage, collect-guard/test-guard threshold drift. Flag thin or implementation-coupled tests.` },
  { key: 'foundry-arch', wing: 'Foundry', prompt: `SOP F-2 — Foundry architecture compliance. Inspect ${ROOT}/backend/app: Deptrac layer adherence, Action conventions (final readonly, single execute, no facades, no Request, injected ConnectionInterface), thin Controllers, Services-are-HTTP-only, and a try-catch scan against ADR-0015's three approved exceptions. Flag any try-catch whose implementation doesn't match a documented ADR-0015 pattern.` },
  { key: 'foundry-doc', wing: 'Foundry', prompt: `SOP F-3 — Foundry manifest accuracy. Cross-check ${ROOT}/backend/CLAUDE.md and Foundry Pulse sections against reality: ADR index count vs decisions.md, route declarations in routes/api.php, model @property + family() relationships, cascade declarations, exception rendering map, ADR-0015 "Current Actions using this pattern" list drift, PrePushPermitGate thresholds.` },
  { key: 'foundry-debt', wing: 'Foundry', prompt: `SOP F-4-adjacent — Foundry tech debt. Scan ${ROOT}/backend/app for TODO/FIXME, oversized Actions, missing BelongsToFamilyInterface on family_id models (convention-only, no arch test yet), and ResourceData missing EAGER_LOAD where it nests relations. Report concrete locations.` },
  { key: 'foundry-test', wing: 'Foundry', prompt: `SOP F-5 — Foundry test quality. Sample ${ROOT}/backend/tests: Pest naming, isolation, factory usage, feature-test authorization coverage, policy method-count vs test-dataset parity. Flag gaps. (Do not run mutation — the gauntlet agent owns suite runs.)` },
  { key: 'cross-adr', wing: 'Atrium', prompt: `Cross-wing ADR pressure. Read ${ROOT}/.claude/docs/decisions.md and ${ROOT}/.claude/docs/quality-warden-casebook.md. Identify ADRs showing FREQUENCY pressure (recurring in recent audits/casebook) or THRESHOLD pressure (codebase crossed a scale boundary the ADR assumed away). Also check whether standing Casebook suspicions now have enough evidence to resolve or escalate. Findings here are ADR-pressure signals — set standard to the ADR id.` },
]

const DIMENSIONS = ALL_DIMENSIONS.filter((d) => {
  if (d.wing === 'Atrium') return true // cross-ADR always runs
  if (SCOPE === 'foundry') return d.wing === 'Foundry'
  if (SCOPE === 'gallery') return d.wing === 'Gallery'
  return true // 'full'
})
log(`Scope: ${SCOPE} — running ${DIMENSIONS.length} finder dimensions + gauntlet, stamping ${TODAY}.`)

phase('Gauntlet')
const gauntletWings = SCOPE === 'foundry' ? 'Foundry only' : SCOPE === 'gallery' ? 'Gallery only' : 'both wings'
const gauntletP = agent(
  `${CONVENTIONS}\n\nIGNORE the "do not run suites" rule — YOU are the dedicated gauntlet agent and running the gates IS your job.\nRun the real quality gates for ${gauntletWings} and capture pass/fail with key numbers. Run the FAST gates first, then heavier ones as time allows; if you skip a gate for time or host-env reasons, record it in "skipped" with the reason (no silent caps).\nFoundry (from ${ROOT}/backend, host PHP 8.5): composer lint:test, composer phpstan, composer deptrac, composer test:arch, then composer test if time permits.\nGallery (from ${ROOT}/frontend): npm run format:check, npm run lint, npm run type-check, npm run knip, then npm run test:unit if time permits.\nUse generous timeouts. Report exact error counts / coverage percentages in detail fields.`,
  { label: 'gauntlet', phase: 'Gauntlet', schema: GAUNTLET_SCHEMA, agentType: 'quality-warden' },
)

phase('Inspect')
const dimResults = await pipeline(
  DIMENSIONS,
  (d) => agent(`${CONVENTIONS}\n\nDIMENSION: ${d.key}\n${d.prompt}`, {
    label: `find:${d.key}`,
    phase: 'Inspect',
    schema: FINDINGS_SCHEMA,
    agentType: 'quality-warden',
  }),
  (res, d) => {
    const toVerify = (res.findings || []).filter((f) => f.severity !== 'low')
    return parallel(
      toVerify.map((f) => () =>
        agent(
          `You are an adversarial verifier auditing a Quality Warden finding in the monorepo at ${ROOT}.\nYour DEFAULT is skepticism — try to REFUTE this finding by reading the actual code/source. Only confirm if the evidence is unambiguous in the file itself.\n\nFinding ${f.id} [${f.severity}, ${f.wing}]: ${f.title}\nLocation: ${f.location}\nStandard claimed violated: ${f.standard}\nObservation: ${f.observation}\n\nRead the cited location and the relevant convention. Return: confirmed (evidence holds), refuted (claim is wrong / location doesn't say that / standard misapplied), or adjusted (real but wrong severity — set adjustedSeverity). Cite the exact file/line/source you read in reasoning.`,
          { label: `verify:${f.id}`, phase: 'Verify', schema: VERDICT_SCHEMA },
        ).then((v) => ({ ...f, verdict: v })),
      ),
    ).then((verified) => ({
      key: d.key,
      wing: d.wing,
      notes: res.notes,
      lowFindings: (res.findings || []).filter((f) => f.severity === 'low'),
      verified: verified.filter(Boolean),
    }))
  },
)

const gauntlet = await gauntletP

const corpus = dimResults.filter(Boolean).map((d) => ({
  dimension: d.key,
  wing: d.wing,
  notes: d.notes,
  confirmed: d.verified
    .filter((f) => f.verdict && f.verdict.verdict !== 'refuted')
    .map((f) => ({
      ...f,
      severity: f.verdict.verdict === 'adjusted' && f.verdict.adjustedSeverity ? f.verdict.adjustedSeverity : f.severity,
      verifyNote: f.verdict.reasoning,
    })),
  refuted: d.verified
    .filter((f) => f.verdict && f.verdict.verdict === 'refuted')
    .map((f) => ({ id: f.id, title: f.title, why: f.verdict.reasoning })),
  observations: d.lowFindings,
}))

const refutedCount = corpus.reduce((n, d) => n + d.refuted.length, 0)
const confirmedCount = corpus.reduce((n, d) => n + d.confirmed.length, 0)
log(`Inspect+Verify done: ${confirmedCount} findings survived verification, ${refutedCount} refuted and dropped.`)

phase('Synthesize')
const synthPrompt = `${CONVENTIONS}

Now ACT as the Quality Warden filing the deliverable. You MAY write — but ONLY within your write scope: \`.claude/records/audits/*.md\` and \`.claude/docs/quality-warden-casebook.md\`. Do NOT touch pulse.md, decisions.md, agent files, code, or wing manuals.

You ran a cross-wing freshness sweep (scope: ${SCOPE}). Below is the verified corpus (findings that survived adversarial verification), the refuted findings (do NOT include as findings — but you MAY note notable refutations in your Self-Debrief), low-severity observations, and the gauntlet results.

Read a recent house-style audit for format, then WRITE the audit to:
  ${ROOT}/.claude/records/audits/${TODAY}-warden-cross-wing-sweep.md

Required frontmatter + sections (house style):
- Title block: # Audit — Cross-Wing Freshness Sweep ; **Filed:** ${TODAY} ; **Auditor:** Quality Warden ; **Wing:** Atrium (cross-wing) ; **Type:** Freshness sweep (not a bug hunt) ; **Scope:** one line (note the ${SCOPE} scope). (No Work Order if this was a Steward-dispatched sweep; note that.)
- Executive Summary (table: dimension → verdict)
- Quality Gauntlet Results (table from the gauntlet data; mark skipped gates honestly)
- Findings — grouped by wing, each: severity, location, standard, observation, impact, recommendation. Use the confirmed corpus only.
- Doc Drift table if doc findings exist
- ADR Pressure section if cross-adr surfaced signals
- Summary (Overall Health X/10 per wing, finding counts by severity — RECONCILE the count against the enumerated finding IDs before writing it, recommendation)
- Self-Debrief (What I Caught / What I Missed / Methodology Gaps / Training Proposals) — note that this sweep was machine-fanned-out with adversarial verification; ${refutedCount} findings were refuted before filing.
- End with a "## Steward Evaluation" stub: "_[Appended by The Steward after filing]_"

Then UPDATE ${ROOT}/.claude/docs/quality-warden-casebook.md: add/refresh Standing Suspicions from new findings, mark any resolved, and log a Methodology Note that an adversarial-verification fan-out was used this cycle.

Do NOT hardcode counts — pull from canonical sources where the audit states a count.

Return as your final text: the absolute path of the audit file, the Overall Health ratings, and a 3-bullet executive summary of the most important confirmed findings.

=== VERIFIED CORPUS (JSON) ===
${JSON.stringify(corpus, null, 2)}

=== GAUNTLET RESULTS (JSON) ===
${JSON.stringify(gauntlet, null, 2)}`

const result = await agent(synthPrompt, { label: 'file-audit', phase: 'Synthesize', agentType: 'quality-warden' })

return {
  auditPath: `${ROOT}/.claude/records/audits/${TODAY}-warden-cross-wing-sweep.md`,
  scope: SCOPE,
  confirmedCount,
  refutedCount,
  gauntletSummary: gauntlet.summary,
  synthesis: result,
}
