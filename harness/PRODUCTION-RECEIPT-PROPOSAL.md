# AM-003 — Production assessment receipt safeguard proposal

Status: **APPROVED by Brian, 2026-09-14: “approved, lets get this published”.** This approves the presented AM-003 architecture and retention plan: seven-day extra payload retention followed by indefinite minimal private retry tombstones. Application implementation and isolated verification may proceed. Publication authorization persists subject to verification; Brian alone executes production SQL and merges main under his standing workflow. Prepared by independent safety-reviewer; approval does not claim deployed schema or external delivery verification.

## Outcome and scope

One logical assessment produces at most one company notification, one optional customer confirmation and one Prime lead. An unchanged retry within 24 hours returns the original receipt once the company notification is accepted. A changed payload using the same ID conflicts; an expired ID is never silently sent again. A network timeout or process crash does not create a second notification. Company-email acceptance remains the user-facing success criterion; Prime and customer-copy failures remain secondary.

Use the existing Prime PostgreSQL database and existing Resend account. No new paid service, queue, customer portal, frontend database access or change to existing leads/accounts tables. Parent-supplied authoritative metadata confirms public.leads has UUID primary key, account_id foreign key, raw_payload JSONB and nonunique dedup_key; public.accounts has unique slug, status active/inactive/archived and website_domain. No existing receipt/idempotency table was found. Those interfaces cannot alone coordinate all effects safely.

Routing authority update: Brian explicitly directed all website submissions through Resend to **info@floridasecurityconcepts.com**. This is the approved company notification recipient and must not be re-asked. Preserve Prime as best-effort measurement and the current customer-copy setting; that instruction does not silently remove either. Sender verification remains a technical configuration check, not a new recipient decision.

## Additive database objects

Draft a dedicated private schema and two tables. Exact schema name: `fsc_private`. No exposed table REST endpoint, anon/authenticated grants, client policies or browser credentials. Enable RLS in the same migration that creates each table. Server-only RPC functions are granted only to service_role, with PUBLIC/anon/authenticated execution explicitly revoked, a fixed search_path, qualified object names and parameter validation. Any SECURITY DEFINER function receives independent review. No INSERT/UPDATE RLS policy is needed when there is no client policy; if any is added later it must have the appropriate WITH CHECK.

| Object | Required fields and constraints |
|---|---|
| fsc_private.assessment_receipts | account_id; request_id UUID; receipt_id UUID; fingerprint SHA-256; immutable normalized payload JSONB; immutable rendered email envelopes/template version; created_at; expires_at = created_at + 24h; primary accepted_at; stable Prime lead UUID; payload purge deadline. Primary key (account_id, request_id); unique receipt_id; referential account constraint without cascading deletion. |
| fsc_private.assessment_effects | account_id/request_id FK; effect enum company_email/customer_email/prime_lead; state pending/inflight/succeeded/uncertain/failed/skipped; immutable Resend idempotency key for email effects; first_attempt_at; provider retry cutoff; lease token and lease_until; provider delivery ID; enumerated error category; updated_at. Primary key (account_id, request_id, effect); state/check constraints. |

An effect failure category contains no provider body, recipient or contact data. First accepted receipt timestamp and email envelope never change on retry. Fingerprint and full payload are private data, not anonymized data.

The RPC family must provide atomic create-or-read receipt, acquire effect lease, complete effect with matching lease, mark ambiguous effect, record Prime lead and its effect in one transaction, and purge private payload. Use row locks/unique constraints rather than read-then-write application races. RPC calls verify the configured account slug resolves to an **active** row with the expected FSC website domain on every call; an absent, inactive, archived or mismatched account fails closed. Do not trust client-supplied account IDs. Do not reuse the old process-lifetime account cache for this decision.

SQL migration application creates objects/functions only. It must not execute business lead inserts, mutate existing leads/accounts rows or ALTER existing tables. The runtime Prime effect function may perform the existing approved lead insert, with the stored lead UUID, and update its new effect row in the same transaction. It must not overwrite an existing unrelated lead on UUID collision: collision without matching receipt/effect evidence fails closed. Existing leads field mapping and tenant routing remain intact.

## Receipt and payload protocol

1. Validate input/body/method/honeypot before persistence. First-party requests require their current UUIDv4 requestId. Inventory ID-less external callers; do not silently claim dedupe for them. Proposed release behavior for missing IDs is a validation error; if legacy callers exist, Brian must approve their documented compatibility treatment.
2. Normalize and fingerprint the exact fixed business fields already specified in HARNESS C-03. Exclude generated timestamps and attribution. First request snapshots the normalized fields, initial attribution, server creation time, template version and fully rendered send parameters. Later attribution changes do not modify stored data or emails. Recipient/sender configuration is snapshotted privately for exact retries; if routing must be revoked during the 24h window, stop affected recovery and require owner resolution rather than silently sending to a new destination.
3. Atomic create/read returns the existing record on unique-key contention. Before an email can be sent, both immutable envelope and durable receipt/effect records must exist. Same ID/different fingerprint returns 409 with no effects. Same ID expired returns EXPIRED with no effects, even if previously successful; the UI offers an explicit new request. Within the window, confirmed primary returns the same receipt ID.
4. Keep expired receipt tombstones so an old UUID cannot be recreated after payload cleanup. The proposed tombstone contains only account/request/receipt IDs, creation/expiry timestamps and final state; purge payload, fingerprint, recipient details and provider IDs on schedule. These identifiers remain private and may be linkable; do not advertise them as anonymous.

## Email atomic claim and crash recovery

PostgreSQL and Resend do not share a transaction. Safety comes from a durable claim plus provider idempotency, not an exactly-once claim about the network.

- Each effect uses a stable key such as `fsc/<receipt-id>/company/v1` or `/customer/v1`. Resend keeps keys for 24 hours and rejects a changed payload under the same key ([official documentation](https://resend.com/docs/dashboard/emails/idempotency-keys)). Persist the complete send envelope before the first send; do not regenerate submittedAt, template text or recipients on retry.
- Lease acquisition is atomic, with a random lease token and 30-second lease. An unexpired lease returns pending; no second worker sends. All completions use the lease token so an obsolete worker cannot overwrite a newer state. A confirmed success may only be recorded against its exact effect identity; stale results are reconciled safely, not applied to an unrelated lease.
- Set first_attempt_at and a conservative cutoff **before** invoking Resend. Automated email attempts stop at the earlier of receipt expiry or first_attempt_at + 23h55m. Use DB clock for time decisions. Request timeout is at most eight seconds; server total budget remains fifteen seconds. Lease duration exceeds the network deadline. No automatic provider retry may extend past the cutoff.
- A crashed worker's expired lease can be reclaimed within that cutoff using the exact same key and envelope. Provider success/replay records the provider ID and succeeded state. Provider concurrent-request conflict remains pending. Different-payload conflict is a contract fault, never a reason to generate a new key. An ambiguous network failure remains uncertain, not a proven failed send.
- If a process died after Resend accepted but before PostgreSQL recorded success, retry with the same key recovers within the window. Beyond the cutoff, **do not send**, even if the provider key might still exist. Leave uncertain and provide a manual reconciliation report. An authorized operator may confirm the already-sent email from provider evidence; never interpret missing local success as permission to send again after the provider window.
- Provider receipt of the primary must be recorded durably before API success. If database recording fails after email acceptance, report receipt unknown and preserve the logical ID; same-key retry reconciles it. This is not a second independent email attempt.

This deliberately trades automatic late recovery for duplicate safety. It does not promise automatic recovery of an unknown send after the provider window. That exception is explicit operational work.

## Primary success and secondary effects

After durable primary acceptance, the API can return 200 with the receipt ID. Attempt secondary work only within the remaining server budget, without making customer copy or Prime failure change primary success. Persist unfinished secondary state before returning. Do not rely on an unawaited serverless background promise.

For Prime, an atomic SQL transaction checks primary success, inserts the mapped lead with its stable UUID, then marks prime_lead succeeded. On a lost RPC response, the next call reads the committed effect and does not reinsert. A rollback leaves neither write. This requires no unique-index change to existing leads and no destructive SQL.

Customer confirmation has its own key and state and may be skipped when the existing setting disables it. A successful client retry must not resend a succeeded company email; it may safely resume eligible secondary effects and still return primary success. No scheduler/queue is introduced. An authenticated operator-only command reports pending/uncertain effects and can resume selected eligible work when authorized. It must default to dry-run and output IDs/categories only. Customer/email recovery cannot bypass expiry/cutoff. The owner/backup accepts checking this report during business days; no instant recovery SLA is invented.

## Proposed privacy and operational choices for Brian

These are the minimal new business choices to accept with AM-003; they are proposals, not silently adopted policy:

1. **Additional private receipt payload retention:** seven days from creation for troubleshooting/reconciliation, then purge all receipt payload, fingerprint, rendered envelopes and provider IDs. Existing Prime lead records and Resend mail retention remain governed by their existing policy and require confirmation; this proposal does not change or reset that retention. Deletion requests must clear this additional receipt copy as well as the existing approved data paths.
2. **Minimal expiry tombstones:** retain the minimal private UUID/time/state tombstone indefinitely to reject replay of old IDs without retaining contact details. If indefinite identifier retention is not acceptable, choose a bounded retention plus a server-issued expiring request-token protocol as a separate alternative; simply deleting the tombstone would weaken the expired-ID guarantee.
3. **Recovery handling:** Brian's approved info inbox receives company submissions. Unknown sends past cutoff are manually reconciled, never automatically resent. Report unresolved effect IDs to Brian through the existing review workflow; do not block on drafting a new backup SOP. Configure the explicitly approved company recipient above and preserve sender/customer-copy settings unless Brian changes them.

A private cleanup procedure and documented owner-run schedule must exist before launch. It may use an already available approved scheduler, but no new cron/service is implied. To promise a seven-day deadline, execution must be monitored and deletion backlog must be visible; do not label a best-effort unmonitored command a TTL guarantee. Public privacy wording is drafted from these accepted facts and separately approved before publication.

Production abuse control also remains a release prerequisite. Prefer an existing no-extra-cost Vercel/WAF capability if it provides the agreed shared-network-safe threshold and retention controls. Proposed threshold is 20 new logical requests per source per ten minutes, unchanged-ID retries exempt. Verify actual feasibility; a simple all-POST WAF rule cannot claim retry exemption. If an atomic private admission counter is needed, amend this proposal with its exact identifier/retention before implementing it. Do not append retained raw IPs to the receipt payload.

## Verification and release steps

- Before application implementation: Brian accepts the concrete AM-003 architecture/retention choices; parent records accepted scope in HARNESS and SESSIONS. Additive SQL **drafting** and isolated PostgreSQL test preparation are already authorized and can proceed to make the design reviewable. Draft SQL requires independent safety review and a manual rollback document; agents never apply production SQL or rollback.
- Run real isolated PostgreSQL tests for unique contention, transaction rollback, cross-process leases/restart, account inactive/mismatch refusal, revoked function access, anon/authenticated rejection and cleanup/tombstone behavior. Mock only Resend network outcomes, not database atomicity. Use synthetic data exclusively.
- Test accepted retry, changed payload, exact expiry boundary, ambiguous send, expired lease, process death after provider success, no resend after cutoff, frozen timestamp/envelope, secondary failure and later recovery. Assert actual effect counts, not just HTTP responses.
- S-005 machine gate plus independent safety review must clear the production contract. S-006 must finish release evidence. Production/Preview variable scoping must be corrected before any preview can touch real providers; no preview shares live sends merely because secrets exist there.
- Brian applies the reviewed additive SQL manually. Perform names-only configuration checks and separately authorized controlled receipt verification. Publish only after these gates; the user's existing publication approval need not be requested again unless the final artifact or material business choices change.

## Rollback scope

Keep the previous application deployment available. A manual rollback document must disable new admission/effect execution before application rollback and explain that reverting to the old app removes the new dedupe guarantee. Retain receipt data for reconciliation; do not drop tables or replay uncertain effects as part of an automatic rollback. Any eventual removal of the new objects is a separately approved manual owner operation. No rollback alters existing leads/accounts schema or deletes their data.
