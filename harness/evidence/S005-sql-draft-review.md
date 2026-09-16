# Independent AM-003 SQL draft safety review — 2026-09-14

Scope: `sql/fsc-assessment-receipts.draft.sql`, its draft runbook, isolated check source and raw log. Reviewer authored the architecture proposal but did not author SQL or tests. No production SQL, provider sends, credentials or customer rows were accessed. This is a SQL-draft review, **not S-005 acceptance or permission to apply production SQL**.

## Review result

Initial source defects were reported to the builder and repaired: stale timestamps captured before row-lock waits; cleanup blocked by inactive-account status; receipt erasure unavailable before normal retention deadline; nullable JSON check ambiguity; incomplete atomic Prime runtime function. The final mapping-preservation correction is tracked below. Production release remains gated by AM-003 acceptance, application implementation and full isolated verification.

## Controls inspected

- Migration is one transaction, additive private schema/tables/functions only. Preflight refuses missing schema/required existing privileges, an existing fsc_private schema and absent/mismatched active FSC account/domain. It does not guess an account UUID or modify existing accounts/leads rows. The INSERT into leads is a runtime function body, not executed by the migration.
- Both private tables enable RLS in the same migration. PUBLIC/anon/authenticated schema/table/function privileges are revoked; no client write path or RLS policy is added. Accordingly no INSERT/UPDATE client policy lacking WITH CHECK exists. Public RPC functions are SECURITY INVOKER with fixed pg_catalog search_path and qualified table references. Only service_role receives runtime grants.
- service_role is explicitly trusted and has direct SELECT/INSERT/UPDATE access to the new private tables because RPCs are invoker functions. This does not protect against a compromised service-role credential. The runbook states this limitation; no key enters browser code in this draft.
- Admission, claim, completion and Prime insertion verify exact slug fsc, expected website domain and active status on each call. Account row locking prevents concurrent status change within that RPC transaction. Missing/archived/inactive account fails closed for delivery; cleanup may resolve the same exact account while inactive. A clone with identical metadata cannot be distinguished by these guards; target project identity still requires owner confirmation.
- Receipt identity, creation/expiry, stable Prime UUID and already-recorded acceptance are immutable. Payload/envelope changes are prohibited except irreversible private-copy erasure. Erased or expired IDs cannot be recreated. Email effect keys/first-attempt/cutoff cannot change after establishment, except removal during erasure. Succeeded/skipped state cannot be reopened.
- Claim refreshes DB time after locks, enforces remaining budget, respects live leases and cutoff, and returns the same effect key. Completion requires matching live lease token. The application must recheck before actual send; SQL does not authorize a delayed process indefinitely. Full multi-session lock/expiry behavior remains a required future test.
- Only company success updates receipt accepted_at. Secondary work requires primary acceptance. Prime insert and effect completion occur in one transaction; replay of a succeeded effect returns the original lead UUID. Unrelated UUID collision raises rather than overwrites. No ALTER or data rewrite on existing leads/accounts is introduced.
- Purge/owner erasure clears receipt payload/fingerprint/envelopes/template and effect provider IDs/keys/leases/errors. Retained metadata is explicitly listed in the runbook and remains private/linkable. Cleanup does not erase existing Prime lead records or Resend messages; existing authorized deletion procedures remain separate. No monitored purge schedule or privacy publication was created.
- The runbook labels SQL as draft and requires Brian's manual application. Manual containment/rollback preserves records, stops new execution before reverting code, warns that old app lacks the new safeguard and forbids automatic drop/replay. No rollback is executed by agents.

## Evidence and unresolved production work

Inspected `harness/evidence/S005-sql-draft-local.log` recording 23 successful isolated checks against exact SQL hash `8b64c617884a52e61300103a4e2fb7c80e91f0e651921573fa44226a57ab4eca`. This is PGlite 0.5.8 synthetic PostgreSQL-engine evidence with one exclusive connection, not inter-session concurrency, server restart, deployed PostgREST ACL or live email proof. The script does not connect to production. No full verify.ps1 S-005 exit-zero claim is made.

Outstanding correction at this review point: the new SQL source-platform CASE omitted legacy cpc/ppc/adwords and meta substring mapping and trim normalization. Builder was asked to preserve existing adapter mapping and add targeted cases. This is a concrete contract regression, not a request for new attribution features. Final hash/evidence and disposition will be appended after repair.

Other remaining work is already required by the proposal: accepted architecture/retention, provider envelope/idempotency integration, independent real PostgreSQL concurrency/crash tests, production config/ACL checks, actual purge ownership and release gates. These are not waived by approval of the visual website.

Documentation reference used for access-control review: [Supabase database function security and execution permissions](https://supabase.com/docs/guides/database/functions). No skill instruction was used to authorize production execution.

## Final disposition

Builder restored trim, cpc/ppc/adwords and meta substring mapping and added seven actual Prime-RPC mapping cases. Reviewer inspected the correction and refreshed raw log: **30 isolated checks**, final SHA-256 `69da6fb0566f2101da68de3ac27bc65243a09f3525c94a82e78c11cfe949588e`. All concrete findings within this SQL-draft review are resolved. The draft and manual runbook are ready for AM-003 owner review; they are not production-applied or a completed S-005 implementation. The stated concurrency, integration, retention-operation and release prerequisites remain.

Checkpoint follow-up: builder removed trailing blank lines only from the SQL/checker and reran all 30 isolated checks. Current SQL SHA-256 verified by reviewer: `f46a88bf623e3b8ba6ac9b93e78a45937f08d84fd686eaff70e3548441279ba1`. This supersedes the preceding artifact hash; review disposition is unchanged.
