export const meta = {
  name: 'shift-patrol',
  description: 'Light bug-and-inconsistency patrol for an autonomous shift — diff hotspots, one rotating dimension per wing, cross-wing contract drift, adversarial verify. Returns a verified corpus; writes nothing.',
  whenToUse: 'The hunt phase of an /enter shift. Roughly 10x cheaper than warden-cross-wing-sweep; hunts defects, not convention freshness (the full sweep owns that, every Nth shift).',
  phases: [
    { title: 'Patrol', detail: 'four bug finders fan out' },
    { title: 'Verify', detail: 'adversarial skeptic per medium+ finding' },
  ],
}

// ---------------------------------------------------------------------------
// Args (passed by the /enter skill):
//   args.date     : 'YYYY-MM-DD' — for log context only (script cannot read the clock).
//   args.rotation : integer — the ledger's rotation counter; picks this shift's
//                   Gallery + Foundry dimension from the rotation pools.
// Returns a JSON corpus of verified findings. The Steward files board issues
// from it in the main loop — this workflow NEVER writes files or board state.
// ---------------------------------------------------------------------------
const ROOT = '/home/goosterhof/Code/brick-inventory-orchestrator'
const TODAY = (args && args.date) ? String(args.date) : '0000-00-00'
const ROTATION = (args && Number.isInteger(args.rotation)) ? args.rotation : 0

const CONVENTIONS = `You are a bug finder on shift patrol inside The Brickworks monorepo at ${ROOT}.
Ground yourself before judging — read what you need:
- Root charter: ${ROOT}/CLAUDE.md
- Foundry (backend) manual: ${ROOT}/backend/CLAUDE.md
- Gallery (frontend) manual: ${ROOT}/frontend/CLAUDE.md
Your job is DEFECTS and INCONSISTENCIES — things that are wrong or contradictory, not merely unconventional.
A convention-drift observation is only worth filing if it will cause a real failure; the periodic warden sweep owns pure convention freshness.
Prefer few, real, evidenced findings over many speculative ones. Cite exact file:line evidence for every finding.
CRITICAL: You are a FINDER in a fan-out. Do NOT write any files. Do NOT run heavy test suites. Return ONLY structured findings.`

const FINDINGS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['dimension', 'findings', 'notes'],
  properties: {
    dimension: { type: 'string' },
    notes: { type: 'string', description: 'what you checked, what you ruled out, anything you could not verify' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'title', 'severity', 'wing', 'location', 'observation', 'impact', 'recommendation'],
        properties: {
          id: { type: 'string', description: 'short stable id, e.g. P-hot-1' },
          title: { type: 'string', description: 'issue-ready one-liner: what is broken, where' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          wing: { type: 'string', enum: ['Gallery', 'Foundry', 'Atrium'] },
          kind: { type: 'string', enum: ['bug', 'inconsistency'], description: 'bug = incorrect behavior; inconsistency = two sources of truth disagree' },
          location: { type: 'string', description: 'file path + line(s)' },
          observation: { type: 'string', description: 'the evidence — what the code actually does' },
          impact: { type: 'string', description: 'concrete failure scenario: inputs/state → wrong outcome' },
          recommendation: { type: 'string' },
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
    reasoning: { type: 'string', description: 'cite the exact file/line you actually read' },
    adjustedSeverity: { type: 'string', enum: ['high', 'medium', 'low'] },
  },
}

// Rotation pools — one Gallery + one Foundry dimension per shift, indexed by the ledger counter.
const GALLERY_POOL = [
  { key: 'gallery-forms', prompt: `Gallery forms & validation flows. Inspect form submission paths in ${ROOT}/frontend/src (useForm usage, 422 error mapping to fields, double-submit guards, error clearing). Hunt for: fields whose backend validation key can never match the frontend field name (snake/camel drift past the ADR-0029 middleware), submissions that ignore errors, stale error state after navigation.` },
  { key: 'gallery-auth', prompt: `Gallery auth/session flows. Inspect the auth service, route metadata (authOnly, canSeeWhenLoggedIn), and 401 middleware handling in ${ROOT}/frontend/src. Hunt for: routes reachable without the badge that shouldn't be, redirect loops, session-expiry paths that strand the user, auth state that desyncs from the backend session.` },
  { key: 'gallery-inventory', prompt: `Gallery inventory/storage domain logic. Inspect the families app domains (sets, parts, storage) in ${ROOT}/frontend/src/apps/families/domains. Hunt for: quantity math errors, optimistic-update drift from server state, pagination/filter state bugs, hierarchical storage display inconsistencies.` },
  { key: 'gallery-contract-types', prompt: `Gallery API contract types. Compare TypeScript response/request types in ${ROOT}/frontend/src against what the Foundry actually returns (read the corresponding ResourceData classes in ${ROOT}/backend/app/Http/Resources). Hunt for: fields typed but never sent, nullable-vs-required mismatches, enum value drift.` },
]

const FOUNDRY_POOL = [
  { key: 'foundry-transactions', prompt: `Foundry transactional integrity & cascades. Inspect Actions in ${ROOT}/backend/app/Actions that write multiple rows or delete aggregates (ADR-0002 explicit cascades, ADR-0004 import atomicity). Hunt for: multi-write paths missing a transaction, cascade deletes that miss a child table, partial-failure states that leave orphans.` },
  { key: 'foundry-authz', prompt: `Foundry authorization. Inspect policies, EnsureFamilyOwnership, and ->can() declarations across ${ROOT}/backend/routes/api.php and ${ROOT}/backend/app. Hunt for: routes missing ownership checks, policies that check the wrong relation, family_id models where a query forgets the tenant scope — concrete cross-tenant leak scenarios only.` },
  { key: 'foundry-receiving', prompt: `Foundry receiving dock (sync/imports/external suppliers). Inspect ${ROOT}/backend/app/Actions/Sync, ImportJob handling, RebrickableService and BrickognizeService. Hunt for: unhandled upstream response shapes, retry/backoff gaps that double-import, status transitions that can strand an ImportJob, rate-limit (429) mishandling.` },
  { key: 'foundry-exceptions-queue', prompt: `Foundry exception mapping & queued jobs. Cross-check the 12 rendered exception mappings in ${ROOT}/backend/bootstrap/app.php against the exceptions Actions actually throw; inspect Jobs/Mailables for serialization traps (non-primitive constructor args) and failed() leak discipline. Hunt for: throwable-but-unmapped exceptions surfacing as 500s, jobs that dead-end without status updates.` },
]

const galleryDim = GALLERY_POOL[ROTATION % GALLERY_POOL.length]
const foundryDim = FOUNDRY_POOL[ROTATION % FOUNDRY_POOL.length]

const PATROL = [
  {
    key: 'diff-hotspots',
    prompt: `Recent-change hotspots. Run \`git -C ${ROOT} log --oneline -25\` and \`git -C ${ROOT} log --stat -10\` to see what moved recently, then inspect the touched files (skip pure dependency bumps). Hunt for: regressions introduced by recent commits, half-applied renames, changes in one wing whose counterpart in the other wing was not updated.`,
  },
  { key: galleryDim.key, prompt: galleryDim.prompt },
  { key: foundryDim.key, prompt: foundryDim.prompt },
  {
    key: 'stud-connections',
    prompt: `Cross-wing contract drift (stud connections). Compare ${ROOT}/backend/routes/api.php + FormRequests/ResourceData against the frontend's HTTP calls in ${ROOT}/frontend/src. Hunt for: endpoints called with wrong paths/methods/params, request payload keys the backend never validates (silently dropped), response fields the frontend reads that the backend stopped sending, and env/config drift between docker-compose.yml, .env.example, and the root Dockerfile.`,
  },
]

log(`Patrol shift stamped ${TODAY} — rotation ${ROTATION}: ${galleryDim.key} + ${foundryDim.key} (+ hotspots, stud-connections).`)

phase('Patrol')
const results = await pipeline(
  PATROL,
  (d) => agent(`${CONVENTIONS}\n\nDIMENSION: ${d.key}\n${d.prompt}`, {
    label: `patrol:${d.key}`,
    phase: 'Patrol',
    schema: FINDINGS_SCHEMA,
    agentType: 'quality-warden',
  }),
  (res, d) => {
    const toVerify = (res.findings || []).filter((f) => f.severity !== 'low')
    return parallel(
      toVerify.map((f) => () =>
        agent(
          `You are an adversarial verifier in The Brickworks monorepo at ${ROOT}.\nYour DEFAULT is skepticism — try to REFUTE this patrol finding by reading the actual code. Only confirm if the defect is unambiguous in the source, with the failure scenario actually reachable.\n\nFinding ${f.id} [${f.severity}, ${f.wing}, ${f.kind || 'bug'}]: ${f.title}\nLocation: ${f.location}\nObservation: ${f.observation}\nClaimed impact: ${f.impact}\n\nReturn: confirmed (defect is real and reachable), refuted (code doesn't say that / scenario unreachable / already handled elsewhere), or adjusted (real but wrong severity — set adjustedSeverity). Cite the exact file/line you read in reasoning. Do NOT write any files.`,
          { label: `verify:${f.id}`, phase: 'Verify', schema: VERDICT_SCHEMA },
        ).then((v) => ({ ...f, verdict: v })),
      ),
    ).then((verified) => ({
      key: d.key,
      notes: res.notes,
      lowFindings: (res.findings || []).filter((f) => f.severity === 'low'),
      verified: verified.filter(Boolean),
    }))
  },
)

const corpus = results.filter(Boolean).map((d) => ({
  dimension: d.key,
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

const confirmedCount = corpus.reduce((n, d) => n + d.confirmed.length, 0)
const refutedCount = corpus.reduce((n, d) => n + d.refuted.length, 0)
log(`Patrol done: ${confirmedCount} findings survived verification, ${refutedCount} refuted and dropped.`)

return { date: TODAY, rotation: ROTATION, dimensions: PATROL.map((d) => d.key), confirmedCount, refutedCount, corpus }
