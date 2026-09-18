-- ============================================================================
-- DESTRUCTIVE. OWNER-ONLY. NOT RECOMMENDED.
-- ============================================================================
-- This is PART B of the AM-005 rollback, and it is NOT part of the normal
-- rollback path. Do not run this unless Brian has explicitly authorized it.
--
-- This file narrows the `effect` and `error_category` CHECK constraints on
-- fsc_private.assessment_effects back to their pre-AM-005 value lists
-- ('company_email','customer_email','prime_lead' / the original five
-- categories, without 'crm_lead'/'conflict'/'validation').
--
-- It requires Brian's explicit, separate authorization to FIRST delete any
-- existing 'crm_lead' effect rows and any row with error_category IN
-- ('conflict','validation') from fsc_private.assessment_effects — those are
-- production ledger rows, and nothing else in this codebase can ever delete
-- them (purge/erase only null columns; service_role has no DELETE grant on
-- this table). This file deliberately contains NO DELETE statement: the
-- deletion, if authorized, is Brian's own separate, explicit, manual
-- statement, run and reviewed on its own — never bundled into an
-- unattended/automated script. Until that deletion has happened, the guard
-- below RAISEs and changes nothing.
--
-- Narrowing these CHECKs back is not required for safety: sql/fsc-crm-lead-effect.rollback.draft.sql
-- (PART A — revoke + drop the function) is sufficient containment on its
-- own, because once fsc_crm_claim_draft is gone, nothing can insert a new
-- 'crm_lead' row or 'conflict'/'validation' category again. The widened
-- CHECKs left in place by Part A are harmless supersets. Only run this file
-- if there is a specific owner reason to also remove the now-unused values
-- from the constraint definitions themselves.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $preflight$
BEGIN
  -- Part A must have already run: narrowing the CHECKs while
  -- fsc_crm_claim_draft still exists would leave that function unable to
  -- ever insert a 'crm_lead' row again (every future claim would 23514 and
  -- silently degrade to crm_pending) without actually removing it.
  IF to_regprocedure('public.fsc_crm_claim_draft(text,uuid)') IS NOT NULL THEN
    RAISE EXCEPTION 'FSC_CRM_NARROW_BLOCKED_FUNCTION_STILL_EXISTS_RUN_PART_A_FIRST';
  END IF;
END
$preflight$;

-- Never deletes data. RAISEs and changes nothing if any 'crm_lead' effect
-- row, or any row with error_category IN ('conflict','validation'), still
-- exists. See the file header: disposing of those rows first is Brian's own
-- separate, explicitly authorized, manual action outside this file.
DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM fsc_private.assessment_effects
    WHERE effect = 'crm_lead' OR error_category IN ('conflict', 'validation')
  ) THEN
    RAISE EXCEPTION 'FSC_CRM_ROLLBACK_BLOCKED_EXISTING_CRM_LEAD_OR_NEW_CATEGORY_ROWS';
  END IF;
END
$guard$;

-- m-1 (safety review round 1): strict discovery, symmetric with the
-- migration. Requires EXACTLY one single-column CHECK on the column AND
-- that its current definition is byte-identical to the exact WIDENED text
-- the migration produces (independently verified against a scratch
-- PostgreSQL 17 cluster) — otherwise it RAISEs the same codes the migration
-- uses, and changes nothing.
DO $narrow$
DECLARE
  effect_matches integer;
  effect_check text;
  effect_def text;
  category_matches integer;
  category_check text;
  category_def text;
  expected_effect_def constant text :=
    'CHECK ((effect = ANY (ARRAY[''company_email''::text, ''customer_email''::text, ''prime_lead''::text, ''crm_lead''::text])))';
  expected_category_def constant text :=
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
  IF effect_matches <> 1 OR effect_def IS DISTINCT FROM expected_effect_def THEN
    RAISE EXCEPTION 'FSC_CRM_UNEXPECTED_EFFECT_CHECK';
  END IF;
  EXECUTE format('ALTER TABLE fsc_private.assessment_effects DROP CONSTRAINT %I', effect_check);
  EXECUTE format(
    'ALTER TABLE fsc_private.assessment_effects ADD CONSTRAINT %I CHECK (effect IN (%L,%L,%L))',
    effect_check, 'company_email', 'customer_email', 'prime_lead'
  );

  SELECT count(*), min(c.conname), min(pg_get_constraintdef(c.oid))
    INTO category_matches, category_check, category_def
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.conrelid = 'fsc_private.assessment_effects'::regclass
    AND c.contype = 'c'
    AND cardinality(c.conkey) = 1
    AND a.attname = 'error_category';
  IF category_matches <> 1 OR category_def IS DISTINCT FROM expected_category_def THEN
    RAISE EXCEPTION 'FSC_CRM_UNEXPECTED_ERROR_CATEGORY_CHECK';
  END IF;
  EXECUTE format('ALTER TABLE fsc_private.assessment_effects DROP CONSTRAINT %I', category_check);
  EXECUTE format(
    'ALTER TABLE fsc_private.assessment_effects ADD CONSTRAINT %I CHECK (error_category IN (%L,%L,%L,%L,%L))',
    category_check, 'provider_unavailable', 'ambiguous', 'database_unavailable', 'cutoff', 'configuration'
  );
END
$narrow$;

COMMIT;
