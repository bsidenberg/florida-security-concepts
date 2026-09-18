-- DRAFT rollback (PART A) for sql/fsc-crm-lead-effect.draft.sql (AM-005).
-- OWNER REVIEW REQUIRED. Never run against production automatically.
--
-- B-1 (safety review round 1): this is the ONLY rollback file that runs by
-- default. It revokes and drops public.fsc_crm_claim_draft(text,uuid) and
-- nothing else. It always succeeds, even after live crm_lead rows exist —
-- nothing ever deletes fsc_private.assessment_effects rows (purge/erase only
-- null columns; service_role has no DELETE grant on that table, per
-- fsc-assessment-receipts.draft.sql), so a rollback that first demanded
-- those rows be gone would never be able to run once a single lead had gone
-- through. The widened `effect`/`error_category` CHECK constraints are left
-- in place: they are harmless supersets of the pre-AM-005 lists, and once
-- this function is dropped nothing can ever insert a new 'crm_lead' row or
-- 'conflict'/'validation' category again.
--
-- Narrowing those CHECKs back is a SEPARATE, NOT-run-by-default, destructive
-- operation — see sql/fsc-crm-lead-effect.rollback-narrow.destructive.draft.sql.
-- It requires Brian to first authorize and perform a manual, explicit
-- deletion of any existing crm_lead/conflict/validation rows himself; this
-- file contains no DELETE and imposes no such precondition, because the
-- function removal alone is sufficient containment.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $revoke$
BEGIN
  -- Guarded with to_regprocedure so this is safe (a no-op) if the function
  -- was already dropped by an earlier run of this same file.
  IF to_regprocedure('public.fsc_crm_claim_draft(text,uuid)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.fsc_crm_claim_draft(text, uuid) FROM PUBLIC, anon, authenticated, service_role;
  END IF;
END
$revoke$;

DROP FUNCTION IF EXISTS public.fsc_crm_claim_draft(text, uuid);

COMMIT;
