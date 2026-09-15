# AM-004 proposal — inquiry abuse control and brief disclosure

Status: **AUTHORIZED FOR IMPLEMENTATION — 2026-09-14, D-021.** Brian renewed “approved, lets get this published” after the bounded no-raw-IP/no-paid-service spam-control update. The following technical plan implements that direction; do not claim Brian separately read this document. Not yet implemented, verified or published. Production key entry and SQL remain owner-controlled. AM-003 receipt storage is already approved.

## Recommended decision

Use the existing Prime database to enforce **20 new logical submissions per network source in a rolling ten-minute period**. Unchanged request-ID retries do not count again. Store a keyed digest of the source address and up to 20 admission timestamps in one small private counter row. Never store the address itself in the receipt, database, application logs or analytics. Introduce one dedicated server secret, `FSC_ADMISSION_HMAC_KEY`, with no new service or paid feature.

This preserves the proposed threshold and retry exemption without purchasing Vercel WAF rate limiting, inventing a site-wide traffic ceiling or changing “source” to an email address. Shared community networks count together; rate-limited visitors retain their entered details and can call FSC. This limits repetitive source traffic, not a claim to stop every distributed bot attack.

## Trusted source provenance

Use `x-vercel-forwarded-for` **only in a verified Vercel Production deployment**, after the hosted-environment guard. Vercel documents it as the platform source-address header and explains that forwarded addresses are overwritten to prevent spoofing; customer-configured trusted-proxy behavior is a separate feature ([official request-header documentation](https://vercel.com/docs/headers/request-headers)). This trust comes from the actual deployment ingress, not from the mere presence of a header in arbitrary Node hosting.

Before release, confirm the FSC custom domain reaches Vercel directly and does not use a proxy configuration that changes the intended source grouping. Do not use arbitrary user-supplied x-forwarded-for, a query parameter or a client-computed digest as fallback. Require exactly one valid IP address, canonicalize IPv4/IPv6 to address bytes including consistent IPv4-mapped handling, and reject malformed/multiple/zone-qualified values. Missing trusted source configuration fails closed for **new** submissions with a safe unavailable message. Existing unchanged receipt retries may still reconcile without new quota admission. Local tests use explicitly injected synthetic source identities; Preview refuses provider delivery.

No raw address is echoed by a diagnostic endpoint. Hosted verification checks only the presence/validity/provenance category and behavior when a caller supplies a conflicting forwarded header, using non-delivering probes. Do not publish the observed address in evidence.

## Key and identifier lifetime

- Generate a dedicated cryptographically random 32-byte HMAC key and keep it in Vercel **Production server environment only**. It is never NEXT_PUBLIC, committed, displayed in chat/evidence or configured in Preview. Owner-managed configuration and presence/format checks suffice for handoff; do not ask Brian to paste it into chat.
- Do not reuse Resend API keys or Prime service-role credentials. Reusing a privileged provider key couples abuse-data privacy to provider credential rotation and unnecessarily expands its use. There is no need for a new account or billing item; a separate environment secret is the recommended minimum.
- HMAC-SHA-256 input is a versioned FSC admission namespace plus canonical address bytes. The database sees the digest only. It remains private/linkable data, not anonymous data. It is not attached to the long-lived receipt tombstone or sent to Resend/Prime lead payloads.
- A counter's active history covers ten minutes. Mark the row eligible for deletion ten minutes after its last admitted new submission; rejected attempts do not extend its retention. The existing proposed minute cleanup job removes expired counter rows on its next run. Normal retention is therefore ten minutes plus the next scheduled tick, explicitly subject to monitored cleanup. Alert/degrade health if expired counter rows remain over five minutes overdue; never claim a hard TTL from an unmonitored schedule.
- Key rotation is an explicit operational action, not an automatic reset of quotas. Before rotating, preserve the ten-minute protection across deployment instances through a reviewed transition or a coordinated pause of new admissions. Unchanged receipt retries remain available. No privileged provider key is rotated as part of this proposal.

## Atomic database contract

Add one table in fsc_private containing account ID, source digest, a bounded array of at most 20 admitted-at timestamps and expiry. Its unique key is account/source digest. Enable RLS on creation; revoke PUBLIC/anon/authenticated access; server-only invoker RPC/grants mirror AM-003. No source digest is returned to browser code. No contact fields, raw address, user agent, URL, arbitrary header, logical request UUID or fingerprint belong in this table.

Extend receipt creation in a single transaction: resolve/validate active FSC account; first check an existing logical receipt and return unchanged/conflict/expired state without charging quota. For a genuinely new ID, lock/create the source counter, recheck logical identity after contention, discard admission timestamps outside the rolling window using fresh DB time, and accept only if fewer than 20 remain. Append the admission timestamp and create the immutable receipt atomically. Unique constraints and consistent locking must prevent concurrent duplicate requests from charging twice or exceeding the threshold. Rollback leaves neither admission nor receipt.

At capacity return 429 and Retry-After derived from the earliest retained admission expiry; do not persist the rejected payload or extend the counter expiry. Malformed input/honeypot failures never create a receipt. This proposed table is operational transient state, not an append-only ledger. Its specific expired-row deletion and monitored cleanup must be expressly included in the approved migration contract; SQL remains drafted for Brian's manual application.

Required isolated tests: 20 accepted/21st rejected, same-ID concurrency charges once, unchanged retry exempt at capacity, changed-payload conflict, rolling-boundary expiry, multiple processes, rollback, missing/malformed source, equivalent IP canonicalization, absent key, Preview refusal, no raw IP in DB/logs/analytics and cleanup that never touches receipt tombstones or existing Prime leads. Hosted provenance/scheduler checks remain separate from synthetic tests.

## Proposed visible form disclosure

The following is a draft for Brian's approval and for publication only after implementation matches it:

> We use your contact and property details to respond to your request, with email delivery through Resend and inquiry records in our private business system. Please do not include gate codes, passwords or other sensitive security information.
>
> To prevent duplicate messages, we keep an additional request copy for seven days before scheduled cleanup. We retain minimal request identifiers and status records afterward. To limit repeated submissions, we temporarily use a protected identifier derived from your network address; this check does not store the address itself. For questions about your information, email info@floridasecurityconcepts.com.

Publication must describe the implemented cleanup cadence accurately. The disclosure does **not** say all FSC inquiry data is deleted after seven days, that the digest is anonymous, or that Vercel/Resend never process network addresses. Seven days applies only to the additional receipt copy. Existing business inquiry records, provider email records and infrastructure logs have separate retention that has not been established here; no retention duration or blanket deletion guarantee is invented for them.

If AM-004 source control is not approved, omit its network-identifier sentence and leave the launch abuse requirement unresolved rather than publish an unimplemented claim. No marketing consent, tracking technology, customer account or new privacy rights workflow is added.

## Exact approval scope

Brian's acceptance would authorize this transient keyed-source counter, its dedicated Production secret and cleanup, the existing rolling threshold/retry exemption, and the displayed disclosure as written once technically accurate. It would not authorize a paid WAF service, changes to existing provider retention, raw-IP storage, production SQL execution by agents or automatic customer communications beyond the already approved inquiry flow.
