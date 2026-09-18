-- DRAFT AM-005 crm_lead effect. OWNER REVIEW REQUIRED. Never run against production automatically.
-- Applied AFTER sql/fsc-assessment-receipts.draft.sql (AM-003), in the Prime project's SQL editor.
-- Additive only:
--   1. Widens the two existing CHECK constraints on fsc_private.assessment_effects
--      (effect: + 'crm_lead'; error_category: + 'conflict','validation'). Every
--      existing value is preserved exactly; the constraints are located via
--      pg_constraint/pg_attribute by column, never by an assumed name.
--   2. Adds public.fsc_crm_claim_draft(text,uuid), a new SECURITY INVOKER function
--      granted to service_role only. No existing function body is replaced —
--      fsc_receipt_create_draft, fsc_effect_claim_draft, fsc_effect_finish_draft,
--      fsc_prime_record_draft, fsc_receipt_purge_draft and fsc_receipt_erase_draft
--      are untouched.
--
-- F-3/F-4 (session S-CRM-001): unlike company_email/customer_email/prime_lead,
-- the crm_lead effect row is not seeded by fsc_receipt_create_draft, so it may
-- not exist yet for a receipt (including one created before this migration).
-- fsc_crm_claim_draft inserts it if absent ('pending', idempotency_key NULL,
-- ON CONFLICT DO NOTHING) and then delegates to the existing
-- fsc_effect_claim_draft, which is otherwise unchanged. Only a successful
-- ('CLAIMED') crm_lead claim additionally returns the stored payload — a
-- narrow, recorded exception to N-2 (see fsc-assessment-receipts.draft.sql),
-- needed because the website must sign the exact DB-stored bytes (F-5), and
-- required only for this one effect.
--
-- fsc_private.assessment_effects.immutable_effect fires BEFORE UPDATE only,
-- so inserting a new 'pending' crm_lead row here is unaffected by it or by
-- the D-026 backstop clause inside that trigger.
--
-- Finish reuses the existing public.fsc_effect_finish_draft(text,uuid,text,uuid,text,text,text),
-- which already accepts any effect except 'prime_lead'.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $preflight$
BEGIN
  IF to_regclass('fsc_private.assessment_effects') IS NULL
    OR to_regprocedure('public.fsc_effect_claim_draft(text,uuid,text)') IS NULL THEN
    RAISE EXCEPTION 'FSC_CRM_EXPECTED_RECEIPTS_MIGRATION_MISSING_APPLY_AM003_FIRST';
  END IF;
  -- Fails closed: fsc_private.account_for_fsc('fsc') itself RAISEs
  -- 'FSC_ACCOUNT_REFUSED' when the configured account is missing/ambiguous/
  -- inactive, which aborts this whole transaction — changing nothing.
  PERFORM fsc_private.account_for_fsc('fsc');
  IF to_regprocedure('public.fsc_crm_claim_draft(text,uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'FSC_CRM_CLAIM_FUNCTION_ALREADY_EXISTS_REVIEW_DO_NOT_OVERWRITE';
  END IF;
END
$preflight$;

-- Widen the effect / error_category CHECK constraints in place, located by
-- column (not by an assumed constraint name) so this is resilient to
-- whatever name PostgreSQL/the AM-003 apply session actually gave them.
--
-- m-1 (safety review round 1): strict discovery. A plain first-match SELECT
-- could silently drop the wrong constraint (or a hand-added one) if
-- production has drifted from the AM-003 file. This requires EXACTLY one
-- single-column CHECK on the column AND that its normalized definition
-- (pg_get_constraintdef) is byte-identical to either the exact original
-- AM-003 text, or the exact already-widened text this same migration
-- produces (both independently verified against a scratch PostgreSQL 17
-- cluster) — otherwise it RAISEs and changes nothing.
--
-- TG-1 (test-guard round 3): the already-widened case makes this migration
-- re-runnable after rollback Part A (which drops fsc_crm_claim_draft but
-- deliberately leaves the widened CHECKs in place — see
-- fsc-crm-lead-effect.rollback.draft.sql). Without it, re-enabling after
-- Part A would be impossible: the CHECKs would already be widened, so the
-- original-only strict check would RAISE on every re-apply, and Part B
-- (which requires the function already gone) could never be reached once
-- any crm_lead/conflict/validation row exists. "Re-enable = re-apply this
-- migration" is now literally true.
DO $widen$
DECLARE
  effect_matches integer;
  effect_check text;
  effect_def text;
  category_matches integer;
  category_check text;
  category_def text;
  expected_effect_def constant text :=
    'CHECK ((effect = ANY (ARRAY[''company_email''::text, ''customer_email''::text, ''prime_lead''::text])))';
  expected_effect_def_widened constant text :=
    'CHECK ((effect = ANY (ARRAY[''company_email''::text, ''customer_email''::text, ''prime_lead''::text, ''crm_lead''::text])))';
  expected_category_def constant text :=
    'CHECK ((error_category = ANY (ARRAY[''provider_unavailable''::text, ''ambiguous''::text, ''database_unavailable''::text, ''cutoff''::text, ''configuration''::text])))';
  expected_category_def_widened constant text :=
    'CHECK ((error_category = ANY (ARRAY[''provider_unavailable''::text, ''ambiguous''::text, ''database_unavailable''::text, ''cutoff''::text, ''configuration''::text, ''conflict''::text, ''validation''::text])))';
BEGIN
  SELECT count(*), min(c.conname), min(pg_get_constraintdef(c.oid))
    INTO effect_matches, effect_check, effect_def
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.conrelid = 'fsc_private.assessment_effects'::regclass
    AND c.contype = 'c'
    AND cardinality(c.conkey) = 1
    AND a.attname = 'effect';
  IF effect_matches <> 1 THEN
    RAISE EXCEPTION 'FSC_CRM_UNEXPECTED_EFFECT_CHECK';
  ELSIF effect_def = expected_effect_def_widened THEN
    NULL; -- already widened (re-enable after Part A): leave it unchanged.
  ELSIF effect_def = expected_effect_def THEN
    EXECUTE format('ALTER TABLE fsc_private.assessment_effects DROP CONSTRAINT %I', effect_check);
    EXECUTE format(
      'ALTER TABLE fsc_private.assessment_effects ADD CONSTRAINT %I CHECK (effect IN (%L,%L,%L,%L))',
      effect_check, 'company_email', 'customer_email', 'prime_lead', 'crm_lead'
    );
  ELSE
    RAISE EXCEPTION 'FSC_CRM_UNEXPECTED_EFFECT_CHECK';
  END IF;

  SELECT count(*), min(c.conname), min(pg_get_constraintdef(c.oid))
    INTO category_matches, category_check, category_def
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.conrelid = 'fsc_private.assessment_effects'::regclass
    AND c.contype = 'c'
    AND cardinality(c.conkey) = 1
    AND a.attname = 'error_category';
  IF category_matches <> 1 THEN
    RAISE EXCEPTION 'FSC_CRM_UNEXPECTED_ERROR_CATEGORY_CHECK';
  ELSIF category_def = expected_category_def_widened THEN
    NULL; -- already widened (re-enable after Part A): leave it unchanged.
  ELSIF category_def = expected_category_def THEN
    EXECUTE format(
      'ALTER TABLE fsc_private.assessment_effects DROP CONSTRAINT %I', category_check
    );
    EXECUTE format(
      'ALTER TABLE fsc_private.assessment_effects ADD CONSTRAINT %I CHECK (error_category IN (%L,%L,%L,%L,%L,%L,%L))',
      category_check, 'provider_unavailable', 'ambiguous', 'database_unavailable', 'cutoff', 'configuration', 'conflict', 'validation'
    );
  ELSE
    RAISE EXCEPTION 'FSC_CRM_UNEXPECTED_ERROR_CATEGORY_CHECK';
  END IF;
END
$widen$;

CREATE FUNCTION public.fsc_crm_claim_draft(p_slug text, p_request uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $fn$
DECLARE
  account uuid := fsc_private.account_for_fsc(p_slug);
  r fsc_private.assessment_receipts;
  result jsonb;
  stamp timestamptz;
BEGIN
  SELECT * INTO r FROM fsc_private.assessment_receipts WHERE account_id = account AND request_id = p_request FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('code', 'NOT_FOUND'); END IF;
  stamp := clock_timestamp();
  IF r.purged_at IS NOT NULL OR stamp >= r.expires_at THEN RETURN jsonb_build_object('code', 'EXPIRED'); END IF;
  IF r.accepted_at IS NULL THEN RETURN jsonb_build_object('code', 'PRIMARY_PENDING'); END IF;
  -- F-3: seed the crm_lead effect row if it does not already exist (a
  -- pre-migration receipt, or the very first claim after this migration).
  -- Never touches an already-existing row.
  INSERT INTO fsc_private.assessment_effects(account_id, request_id, effect, idempotency_key, state)
    VALUES (account, p_request, 'crm_lead', NULL, 'pending')
    ON CONFLICT DO NOTHING;
  result := public.fsc_effect_claim_draft(p_slug, p_request, 'crm_lead');
  -- F-4/N-2 exception: only a successful claim additionally carries the
  -- stored payload, read from the same locked receipt row above, so the
  -- website can sign byte-identical bytes on every attempt (F-5). Every
  -- other outcome (BUSY/EXPIRED/CUTOFF/SUCCEEDED/SKIPPED/PRIMARY_PENDING)
  -- is returned unchanged.
  IF result ->> 'code' = 'CLAIMED' THEN
    RETURN result || jsonb_build_object('payload', r.payload);
  END IF;
  RETURN result;
END $fn$;

REVOKE ALL ON FUNCTION public.fsc_crm_claim_draft(text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fsc_crm_claim_draft(text, uuid) TO service_role;

COMMIT;
