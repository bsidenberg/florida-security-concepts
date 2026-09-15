-- DRAFT AM-003/AM-004 operational scheduling. OWNER-RUN ONLY.
-- Never applied automatically; Brian alone runs this after the receipts
-- migration (sql/fsc-assessment-receipts.draft.sql) has been applied.
--
-- Enables pg_cron only when absent (never disables it — that could remove
-- unrelated projects' jobs) and creates exactly one uniquely named FSC
-- cleanup job. If a job with that name already exists with a different
-- command or schedule, this refuses and changes nothing rather than
-- silently overwriting it. Never unschedules, alters or inspects any other
-- job.
--
-- Cadence: every minute, invoking only the approved purge/cleanup functions
-- scoped to the 'fsc' account. This is scheduling granularity, not a
-- millisecond-precise deletion guarantee: seven-day receipt-payload
-- eligibility plus the next minute tick; admission-counter retention is ten
-- minutes after the last admission plus the next minute tick.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $preflight$
BEGIN
  IF to_regclass('fsc_private.assessment_receipts') IS NULL
    OR to_regclass('fsc_private.assessment_effects') IS NULL
    OR to_regclass('fsc_private.admission_counters') IS NULL
    OR to_regprocedure('fsc_private.account_for_fsc(text, boolean)') IS NULL
    OR to_regproc('public.fsc_receipt_purge_draft') IS NULL
    OR to_regproc('public.fsc_admission_cleanup_draft') IS NULL THEN
    RAISE EXCEPTION 'FSC_CLEANUP_FUNCTIONS_MISSING_APPLY_RECEIPTS_MIGRATION_FIRST';
  END IF;
  -- Identity guard (M-8): exact slug/domain, active-agnostic (cleanup must
  -- keep working even for a since-deactivated account), plain SELECT only.
  IF (SELECT count(*) FROM public.accounts WHERE slug='fsc'
      AND rtrim(regexp_replace(lower(website_domain),'^https?://(www\.)?|^www\.','','g'),'/')='floridasecurityconcepts.com') <> 1 THEN
    RAISE EXCEPTION 'FSC_ACCOUNT_DOMAIN_NOT_UNIQUE';
  END IF;
END
$preflight$;

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $schedule$
DECLARE
  job_name constant text := 'fsc-assessment-private-cleanup';
  job_schedule constant text := '* * * * *';
  job_command constant text := $cmd$SELECT public.fsc_receipt_purge_draft('fsc'); SELECT public.fsc_admission_cleanup_draft('fsc');$cmd$;
  existing record;
BEGIN
  SELECT schedule, command INTO existing FROM cron.job WHERE jobname = job_name;
  IF FOUND THEN
    IF existing.schedule IS DISTINCT FROM job_schedule OR existing.command IS DISTINCT FROM job_command THEN
      RAISE EXCEPTION 'FSC_CLEANUP_JOB_NAME_CONFLICT: an existing job named % already has a different schedule/command; refusing to overwrite it', job_name;
    END IF;
    -- Already exactly the expected job: idempotent re-run, nothing to change.
  ELSE
    PERFORM cron.schedule(job_name, job_schedule, job_command);
  END IF;
END
$schedule$;

COMMIT;
