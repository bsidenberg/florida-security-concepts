-- READ-ONLY, D-030/AM-005 manual `crm_lead` reconciliation report. Never
-- mutates any row, never called by application code — an owner/operator
-- inspects this directly, exactly like sql/fsc-receipt-reconciliation-report.sql
-- (which this file deliberately does not modify: Brian's existing/unmodified
-- test condition pins that report's exact byte-for-byte output). Columns are
-- identifiers/states/categories/timestamps only: no payload, envelope,
-- recipient, provider ID or contact field.
--
-- Same 9-column shape as the existing report (receipt_id, request_id,
-- effect, state, error_category, first_attempt_at, retry_cutoff, updated_at,
-- purged_at), scoped to the `crm_lead` effect only:
--   (a) `crm_lead` effect rows not in ('succeeded','skipped') on unpurged
--       receipts (a claimed-but-unresolved or already-'failed' crm_lead
--       effect — same semantics as the existing report's rows).
--   (b) accepted, unpurged receipts with no `crm_lead` effect row at all —
--       the kill switch (missing/invalid FSC_CRM_* config), a budget skip
--       under 6s remaining, or an RPC failure before the row was ever
--       inserted (`fsc_crm_claim_draft` seeds the row on its first
--       successful call only). Shown as effect 'crm_lead', state 'missing',
--       with NULL first_attempt_at/retry_cutoff/updated_at. A pre-migration
--       receipt surfaces here too, for at most its remaining 7-day payload
--       window (OD-CRM-6) — no history is backfilled into the CRM; this is a
--       manual reconciliation opportunity, not a bug.
-- (b) is only produced when `public.fsc_crm_claim_draft(text,uuid)` exists
-- (the AM-005 migration has been applied), so that running this report
-- before the migration returns an empty/meaningful result instead of
-- flagging every single accepted receipt as "missing" a row that could not
-- possibly exist yet.
--
-- M-7: resolves the account with a plain SELECT (no FOR SHARE row lock, no
-- function call) so this can run in a read-only transaction. Excludes
-- purged tombstones (their key/envelope/provider detail is already gone, so
-- nothing is actionable) and shows purged_at so an operator can confirm no
-- tombstone rows are present.
--
-- R2-3: a misconfigured/renamed/duplicated account row would otherwise make
-- the account subquery silently match zero rows, which is indistinguishable
-- from "nothing to reconcile" — a false-clean report. This guard only
-- SELECTs and RAISEs (no writes), so it runs inside a READ ONLY transaction;
-- it aborts the whole script rather than returning a misleadingly empty
-- result when the identity isn't exactly one row.
DO $crm_lead_account_identity_guard$
BEGIN
  IF (SELECT count(*) FROM public.accounts a
      WHERE a.slug = 'fsc'
        AND rtrim(regexp_replace(lower(a.website_domain), '^https?://(www\.)?|^www\.', '', 'g'), '/') = 'floridasecurityconcepts.com'
     ) <> 1 THEN
    RAISE EXCEPTION 'FSC_ACCOUNT_IDENTITY_MISMATCH';
  END IF;
END
$crm_lead_account_identity_guard$;

WITH account AS (
  SELECT a.id FROM public.accounts a
  WHERE a.slug = 'fsc'
    AND rtrim(regexp_replace(lower(a.website_domain), '^https?://(www\.)?|^www\.', '', 'g'), '/') = 'floridasecurityconcepts.com'
),
migration AS (
  SELECT to_regprocedure('public.fsc_crm_claim_draft(text,uuid)') IS NOT NULL AS applied
)
SELECT
  r.receipt_id,
  e.request_id,
  e.effect,
  e.state,
  e.error_category,
  e.first_attempt_at,
  e.retry_cutoff,
  e.updated_at,
  r.purged_at
FROM fsc_private.assessment_effects e
JOIN fsc_private.assessment_receipts r
  ON r.account_id = e.account_id AND r.request_id = e.request_id
WHERE r.account_id = (SELECT id FROM account)
  AND e.effect = 'crm_lead'
  AND e.state NOT IN ('succeeded', 'skipped')
  AND r.purged_at IS NULL

UNION ALL

SELECT
  r.receipt_id,
  r.request_id,
  'crm_lead' AS effect,
  'missing' AS state,
  NULL::text AS error_category,
  NULL::timestamptz AS first_attempt_at,
  NULL::timestamptz AS retry_cutoff,
  NULL::timestamptz AS updated_at,
  r.purged_at
FROM fsc_private.assessment_receipts r
CROSS JOIN migration m
WHERE m.applied
  AND r.account_id = (SELECT id FROM account)
  AND r.accepted_at IS NOT NULL
  AND r.purged_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM fsc_private.assessment_effects e2
    WHERE e2.account_id = r.account_id AND e2.request_id = r.request_id AND e2.effect = 'crm_lead'
  )

ORDER BY updated_at ASC NULLS LAST, request_id;
