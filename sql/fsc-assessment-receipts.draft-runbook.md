# FSC production receipt draft — owner runbook

Status: proposal and additive draft only, not applied. AM-003 acceptance, complete S-005 application implementation/verification and production authorization are separate prerequisites. No root application dependency was added for this draft.

## Review before execution

1. Read harness/PRODUCTION-RECEIPT-PROPOSAL.md and obtain Brian's architecture/retention acceptance. Company recipient is already approved as info@floridasecurityconcepts.com; sender and customer-copy settings are not changed by SQL.
2. Independently review fsc-assessment-receipts.draft.sql and its exact SHA-256 in harness/evidence/S005-sql-draft-local.log. Reconcile any reviewer findings first. Confirm target project identity in the Supabase dashboard. Schema/domain guards reduce mistakes but cannot distinguish a cloned database with identical metadata.
3. Confirm existing configured account slug `fsc`, active status and FSC domain. The draft normalizes scheme/www/trailing slash. It never guesses an account UUID and verifies configured account/domain for every RPC. Identity is an expected guard based on DEPLOYMENT.md, not a claim that production account rows were inspected.
4. Confirm schema metadata has not drifted from harness/evidence/prime-schema-metadata-20260914.json. Confirm the server role already bypasses RLS and has SELECT/UPDATE on accounts (UPDATE is needed by PostgreSQL row-lock privilege checks), SELECT/INSERT on leads. This draft does not grant new access to either existing table. Stop on missing privileges; do not add a definer workaround or widen existing permissions silently.
5. Confirm private schema is not in exposed Data API schemas. New public RPC entrypoints explicitly revoke PUBLIC/anon/authenticated execution. RLS is enabled on both private tables in the same transaction. Existing service_role credentials remain powerful and must never reach the browser. Invoker RPCs mean that trusted service_role also has direct private-table DML; this is not isolation from a compromised server credential.
6. After all gates, Brian alone may run the entire reviewed SQL file in the correct project's SQL editor. Do not execute isolated excerpts. Objects already existing cause a fail-closed refusal rather than being replaced. No business lead rows are inserted by migration application.

## Runtime integration contract, still to implement

- Require validated UUIDv4 requests and normalized fields. Compute the approved canonical SHA-256 in server code and snapshot rendered envelopes/template version before create. SQL validates digest shape and structural envelope constraints; application tests must prove semantic canonicalization and exact Resend envelope reuse.
- Create-or-read returns READY/RECEIVED/CONFLICT/EXPIRED. Claim returns a lease token and immutable provider key. The server must recheck returned lease/cutoff against its current clock before each send, with a bounded request budget. No delayed task may treat an old returned lease as indefinite authorization.
- Email claim cutoff is the earlier receipt expiry and first attempt plus 23h55m, leaving margin before the provider window. Leases last at most 30 seconds and are bounded by cutoff. Claim requires at least 15 seconds remaining; stale workers cannot finish after lease expiry. Reclaim uses the same immutable envelope/key. After cutoff, reconcile manually; never generate a new provider key for the same effect.
- Record primary provider acceptance durably before returning 200. Preserve known primary success on secondary failure. Prime RPC inserts the stable UUID and marks its effect in one transaction; it fails on an unrelated UUID collision and does not overwrite a lead. Existing field mapping is preserved from the current adapter and authoritative metadata.
- Seven-day purge and explicit deletion-request erase clear payload, fingerprint, envelopes, template, provider IDs, error categories, keys and leases. Expired and erased request IDs remain unrecreatable tombstones. Retained fields are account/request/receipt/stable-lead UUIDs, creation/expiry/purge/acceptance timestamps, effect labels/final states and update time. These are private, potentially linkable identifiers.
- Purge/erase can resolve the configured account even if inactive or archived, so disabling admission does not prevent deletion. Ordinary admission/claim/finish remains active-only. Deletion propagation to existing Prime leads and Resend is outside this additive receipt-copy function and must follow approved existing procedures.
- A monitored owner-run purge schedule and reconciliation workflow are release prerequisites. No schedule, hosted job, live email, live database write or retention-policy publication was created here.

## Isolated evidence and limits

PGlite 0.5.8 was pinned under ignored .fsc-test/sql-draft-check. Reproduce with Node 24 using harness/evidence/S005-sql-draft-check.mjs after installing that dependency in the ignored folder. The checker reads the exact draft and instantiates synthetic in-memory accounts/leads; it never connects to Supabase. Source metadata supplies leads column types/defaults/checks, not customer rows.

PGlite uses one exclusive connection. Sequential claim/replay checks are real PostgreSQL-engine SQL tests but are not inter-session lock contention tests. Dedicated PostgreSQL concurrency, rollback under lost responses, independent ACL verification on Supabase/PostgREST, deployed grants, provider delivery and application integration remain S-005 requirements. This is disposable design verification, not S-005 acceptance.

Sources reviewed: [PGlite getting started and exclusive-connection limit](https://pglite.dev/docs/), [Supabase function permissions](https://supabase.com/docs/guides/database/functions), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase changelog](https://supabase.com/changelog.md). No relevant breaking change to the SQL constructs used was identified in the reviewed changelog.

## Manual containment and rollback

Stop new receipt admission and effect execution before reverting application code. Preserve the new tables and all unresolved effect evidence for reconciliation. Reverting to the old application also removes the new duplicate safeguard; do not describe it as an equivalent-safe rollback. Do not drop the schema, delete existing leads/accounts, reset states or replay uncertain effects automatically. Any future object removal or production data transformation requires separate explicit owner authorization.
