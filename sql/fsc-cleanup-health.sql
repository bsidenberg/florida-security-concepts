-- READ-ONLY. AM-003/AM-004 operational health check. Never mutates any row,
-- never called by application code. Output is counts/timestamps/status
-- only — never payload, envelope, recipient, provider ID or contact data.
WITH job AS (
  SELECT
    jobid,
    active,
    (schedule = '* * * * *') AS schedule_matches,
    (command = $cmd$SELECT public.fsc_receipt_purge_draft('fsc'); SELECT public.fsc_admission_cleanup_draft('fsc');$cmd$) AS command_matches
  FROM cron.job
  WHERE jobname = 'fsc-assessment-private-cleanup'
),
last_run AS (
  SELECT max(d.end_time) AS last_success
  FROM cron.job_run_details d
  JOIN job j ON d.jobid = j.jobid
  WHERE d.status = 'succeeded'
),
purge_backlog AS (
  SELECT
    count(*) AS due_count,
    EXTRACT(EPOCH FROM (clock_timestamp() - min(purge_after)))::bigint AS oldest_overdue_seconds
  FROM fsc_private.assessment_receipts
  WHERE purge_after <= clock_timestamp() AND purged_at IS NULL
),
counter_backlog AS (
  SELECT
    count(*) AS expired_count,
    EXTRACT(EPOCH FROM (clock_timestamp() - min(expires_at)))::bigint AS oldest_overdue_seconds
  FROM fsc_private.admission_counters
  WHERE expires_at <= clock_timestamp()
),
unresolved_effects AS (
  -- N-5: exclude purged tombstones — their key/envelope/provider detail is
  -- already gone, so they are not actionable backlog.
  SELECT e.effect, e.state, count(*) AS effect_count
  FROM fsc_private.assessment_effects e
  JOIN fsc_private.assessment_receipts r ON r.account_id = e.account_id AND r.request_id = e.request_id
  WHERE e.state NOT IN ('succeeded', 'skipped') AND r.purged_at IS NULL
  GROUP BY e.effect, e.state
),
status AS (
  SELECT
    coalesce((SELECT jobid IS NOT NULL FROM job), false) AS job_exists,
    coalesce((SELECT active FROM job), false) AS job_active,
    coalesce((SELECT schedule_matches FROM job), false) AS job_schedule_matches,
    coalesce((SELECT command_matches FROM job), false) AS job_command_matches,
    (SELECT last_success FROM last_run) AS last_successful_run_at,
    coalesce((SELECT due_count FROM purge_backlog), 0) AS receipts_due_for_purge,
    (SELECT oldest_overdue_seconds FROM purge_backlog) AS receipts_oldest_overdue_seconds,
    coalesce((SELECT expired_count FROM counter_backlog), 0) AS expired_admission_counters,
    (SELECT oldest_overdue_seconds FROM counter_backlog) AS counters_oldest_overdue_seconds,
    (SELECT coalesce(jsonb_object_agg(effect || ':' || state, effect_count), '{}'::jsonb) FROM unresolved_effects) AS unresolved_effects_by_effect_state
)
SELECT
  *,
  (
    job_exists
    AND job_active
    AND job_schedule_matches
    AND job_command_matches
    AND last_successful_run_at IS NOT NULL
    AND last_successful_run_at >= clock_timestamp() - interval '5 minutes'
    AND coalesce(receipts_oldest_overdue_seconds, 0) <= 300
    AND coalesce(counters_oldest_overdue_seconds, 0) <= 300
  ) AS healthy
FROM status;
