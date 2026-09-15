-- READ-ONLY, D-022 manual reconciliation report. Never mutates any row,
-- never called by application code — an owner/operator inspects this
-- directly. Columns are identifiers/states/categories/timestamps only: no
-- payload, envelope, recipient, provider ID or contact field.
--
-- M-7: resolves the account with a plain SELECT (no FOR SHARE row lock, no
-- function call) so this can run in a read-only transaction. Excludes
-- purged tombstones (their key/envelope/provider detail is already gone, so
-- nothing is actionable) and shows purged_at so an operator can confirm no
-- tombstone rows are present.
--
-- R2-3: a misconfigured/renamed/duplicated account row would otherwise make
-- the WHERE clause's account subquery silently match zero rows, which is
-- indistinguishable from "nothing to reconcile" — a false-clean report.
-- This guard only SELECTs and RAISEs (no writes), so it runs inside a
-- READ ONLY transaction; it aborts the whole script rather than returning
-- a misleadingly empty result when the identity isn't exactly one row.
DO $account_identity_guard$
BEGIN
  IF (SELECT count(*) FROM public.accounts a
      WHERE a.slug = 'fsc'
        AND rtrim(regexp_replace(lower(a.website_domain), '^https?://(www\.)?|^www\.', '', 'g'), '/') = 'floridasecurityconcepts.com'
     ) <> 1 THEN
    RAISE EXCEPTION 'FSC_ACCOUNT_IDENTITY_MISMATCH';
  END IF;
END
$account_identity_guard$;

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
WHERE r.account_id = (
    SELECT a.id FROM public.accounts a
    WHERE a.slug = 'fsc'
      AND rtrim(regexp_replace(lower(a.website_domain), '^https?://(www\.)?|^www\.', '', 'g'), '/') = 'floridasecurityconcepts.com'
  )
  AND e.state NOT IN ('succeeded', 'skipped')
  AND r.purged_at IS NULL
ORDER BY e.updated_at ASC;
