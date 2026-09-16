# Release safety review — 2026-09-14

Reviewer: independent safety-reviewer. Read-only source/configuration review, with this evidence file as the only write. Candidate HEAD: `4d481d2`; supplied production baseline exists locally: `2182d1e3fc101fc81ca220ed5c2c081d5af57e1b`. No secrets opened, live lead sent, production data queried, deployment performed or application/test source changed.

## Verdict: BLOCKED for the current full candidate

Brian's latest request authorizes publication of the reviewed website. It resolves the visual preview and production-action approval; it does not prove unresolved delivery contracts or silently remove explicit acceptance requirements. The difference from production includes the redesigned form, validator, API and delivery dispatcher, not only the latest presentation commit.

### B1 — Production retry can duplicate notifications and records

`components/LeadCaptureForm.tsx` creates and reuses a logical UUID, aborts the browser request after 20 seconds and invites retry after uncertain receipt. `app/api/leads/route.ts` passes that ID to `deliverLead`, but `lib/leads/leadDelivery.ts` uses it for durable receipt only in local mode. Production adapters receive the lead without any claim/replay enforcement. Both Resend send calls lack an idempotency option. Supabase performs an unconditional insert; its source comments explicitly state its dedup key has no unique constraint. The reference returned by the API is not a production receipt lookup or claim.

Concrete trigger: the company email succeeds, but the browser loses the response or aborts while confirmation/database work continues. Retrying sends the company email again and can insert another database record. A stable client UUID alone does not prevent that. The old pipeline also lacked deduplication, but the current approved release explicitly requires it, and the new UI adds an explicit timed unknown-receipt retry path.

This violates SPEC AC-06 and HARNESS C-04 / AM-001. S-002 was explicitly declared not releasable by itself. Repair requires the approved persistent production claim/per-effect replay contract and isolated evidence across concurrency/restart/ambiguous outcomes, or an explicit owner-approved scope/contract amendment. An in-memory limiter or removing a test assertion cannot clear this finding.

### B2 — Production configuration and receipt evidence remain unverified

The source correctly rejects hosted local/console mode and absent provider mode. Therefore deployment with local preview flags would disable real lead delivery and can emit noindex/local review UI. Before publication, establish the actual production provider mode and required variable presence, local flags absent at build/runtime, canonical host, deployed Node version, approved recipients/sender ownership and any Prime account mapping. Do not dump values or customer rows. The parent's separate Vercel investigation may close configuration unknowns; this review does not label them missing.

S-005 also requires external receipt evidence and operational ownership. Existing provider adapters are largely unchanged except safer logging and HTTPS enforcement, which reduces regression scope but does not establish delivery. Do not send a live customer confirmation or write a synthetic production lead without the separately required authorization.

### B3 — Required release evidence and privacy/abuse decisions are unfinished

S-006 remains not started. `harness/verification.json` requires `test:release` for S-006 but has no check definition, and package.json has no such script. The 190-test S-UI-001 log is valid local functional/visual evidence, not S-005/S-006 release certification. Required production analytics masking, cross-browser/performance evidence and requirements traceability are absent from the release package reviewed here.

HARNESS OD-05/06 and SPEC privacy prerequisites are explicitly unresolved: recipient/backup/recovery responsibilities, retention/disclosure and production abuse policy. Current rate limiting executes only in local mode; production has honeypot and input/body limits, not distributed throttling. Do not invent a new storage/retention mechanism or privacy policy. Resolve applicable requirements with existing configuration/evidence or a formal owner amendment before claiming release acceptance.

## Safe findings and boundaries

- No migration, RLS change, payment flow, new authentication system or public receipt endpoint is introduced in the reviewed diff. Migration rollback documentation is therefore not applicable to this candidate.
- Provider credentials remain server-side environment references. The reviewed provider changes redact previous detailed error/context logs. No secret value was needed or read for this review.
- Supabase tenant slug is server configuration, not taken from user input; absent/failed account resolution returns failure. This is not evidence of remote RLS, account revocation or retention behavior, which were not inspected.
- The dispatcher preserves primary-email success with best-effort database/customer confirmation. Webhook delivery now requires HTTPS. Local delivery rejects hosted markers and cannot fall through to providers.
- The latest theme commit itself does not alter lead contracts or content. Its independent visual review and local verification can remain valid while production gaps are resolved.

## Deferred enhancements versus launch blockers

The S-003 maintenance page and S-004 broad content rewrite, new photos/testimonials, Sentinel monitoring, new SOPs and extra marketing sections are not intrinsic safety blockers to publishing the currently accepted visual scope. Their original sequencing should be formally reconciled in the ledger rather than built unsolicited. Existing numerical content has not been newly validated; keep its status explicit instead of inventing substantiation. Missing analytics baselines cannot justify a conversion-uplift claim but need not force invention of baseline data.

The genuine blockers are the current production retry behavior and the explicit remaining production/release prerequisites above. A scoped visual-only release preserving the old production form/API would be a different artifact requiring its own review and verification; it is not equivalent to deploying current HEAD and must not be silently substituted.

## Evidence limits

Inspected committed source, candidate/baseline diff, HARNESS, SPEC, DECISIONS, ENVIRONMENT, SESSIONS, package scripts and verification manifest. No new machine verification was run by this reviewer; existing S-UI-001 exit-zero evidence is referenced, not re-certified. Parent owns live hosting metadata inspection. This review does not authorize deployment or waive findings.

## Narrow production amendment recommendation

Parent reports read-only Vercel evidence: current production is main at the supplied baseline; nine provider-related variable names are configured for both Production and Preview, with no values revealed. Thus a branch preview must not be assumed isolated. Close preview credential scoping before any automatic preview deployment or provider-enabled tests.

[Resend's official documentation](https://resend.com/docs/dashboard/emails/idempotency-keys) confirms per-request idempotency keys are retained for 24 hours, with different-payload and concurrent-request conflict responses. Separate stable keys for company and customer emails are useful within that window. They do not deduplicate Prime inserts or establish application-level expiration/recovery. Moreover, the current validator regenerates submittedAt on every attempt and the internal email includes it: adding a key without freezing the payload causes a different-payload conflict on retry.

The original AC-06 cannot presently be certified through the known interfaces alone. First inspect authoritative existing Prime schema metadata without records to determine whether an existing unique logical identity and durable state facility is suitable. If so, reusing it may avoid any new schema, but remains a reviewed data-contract amendment. Otherwise the narrow owner-only decision is approval of additive receipt/effect persistence in the existing Prime system: unique logical request and per-effect identities, payload conflict checks, expiry, ambiguous-state recovery, approved access and retention, and manual SQL application by Brian. A new paid datastore is not inherently needed. Draft a concrete design and rollback before asking for final architecture approval; never apply production SQL from the agent.

Short-term Resend keys alone are a partial repair, not completion of original AC-06. A visual-only release retaining the known legacy backend is a separately approved reduced scope and artifact, not an implicit shortcut for this candidate.
