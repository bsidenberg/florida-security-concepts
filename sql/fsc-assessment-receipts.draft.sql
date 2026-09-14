-- DRAFT AM-003. OWNER REVIEW REQUIRED. Never run against production automatically.
-- Additive only. Existing public.accounts/public.leads schema and rows are untouched.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

DO $preflight$
BEGIN
  IF to_regclass('public.accounts') IS NULL OR to_regclass('public.leads') IS NULL THEN
    RAISE EXCEPTION 'FSC_EXPECTED_PRIME_SCHEMA_MISSING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.accounts'::regclass AND attname='id' AND atttypid='uuid'::regtype AND NOT attisdropped)
    OR NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.leads'::regclass AND attname='id' AND atttypid='uuid'::regtype AND NOT attisdropped)
    OR NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.leads'::regclass AND attname='raw_payload' AND atttypid='jsonb'::regtype AND NOT attisdropped) THEN
    RAISE EXCEPTION 'FSC_EXPECTED_COLUMN_CONTRACT_MISMATCH';
  END IF;
  IF (SELECT count(*) FROM public.accounts WHERE slug='fsc' AND status::text='active'
      AND rtrim(regexp_replace(lower(website_domain),'^https?://(www\.)?|^www\.','','g'),'/')='floridasecurityconcepts.com') <> 1 THEN
    RAISE EXCEPTION 'FSC_ACTIVE_ACCOUNT_DOMAIN_NOT_UNIQUE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role')
    OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon')
    OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    RAISE EXCEPTION 'FSC_EXPECTED_ROLES_MISSING';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role' AND rolbypassrls)
    OR NOT has_table_privilege('service_role','public.accounts','SELECT')
    OR NOT has_table_privilege('service_role','public.accounts','UPDATE')
    OR NOT has_table_privilege('service_role','public.leads','SELECT')
    OR NOT has_table_privilege('service_role','public.leads','INSERT') THEN
    RAISE EXCEPTION 'FSC_EXISTING_SERVER_PRIVILEGES_MISSING';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname='fsc_private') THEN
    RAISE EXCEPTION 'FSC_SCHEMA_ALREADY_EXISTS_REVIEW_DO_NOT_OVERWRITE';
  END IF;
END
$preflight$;

CREATE SCHEMA fsc_private;
REVOKE ALL ON SCHEMA fsc_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA fsc_private TO service_role;

CREATE TABLE fsc_private.assessment_receipts (
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  request_id uuid NOT NULL CHECK (request_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'),
  receipt_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  fingerprint text CHECK (fingerprint ~ '^[0-9a-f]{64}$'),
  payload jsonb,
  envelopes jsonb,
  template_version text,
  prime_lead_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL,
  purge_after timestamptz NOT NULL,
  purged_at timestamptz,
  accepted_at timestamptz,
  PRIMARY KEY(account_id,request_id),
  CHECK (expires_at=created_at+interval '24 hours'),
  CHECK (purge_after=created_at+interval '7 days'),
  CHECK ((purged_at IS NULL AND fingerprint IS NOT NULL AND payload IS NOT NULL AND envelopes IS NOT NULL AND jsonb_typeof(payload)='object' AND jsonb_typeof(envelopes)='object' AND template_version IS NOT NULL)
     OR (purged_at IS NOT NULL AND fingerprint IS NULL AND payload IS NULL AND envelopes IS NULL AND template_version IS NULL))
);
CREATE TABLE fsc_private.assessment_effects (
  account_id uuid NOT NULL,
  request_id uuid NOT NULL,
  effect text NOT NULL CHECK(effect IN ('company_email','customer_email','prime_lead')),
  state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','inflight','succeeded','uncertain','failed','skipped')),
  idempotency_key text,
  first_attempt_at timestamptz,
  retry_cutoff timestamptz,
  lease_token uuid,
  lease_until timestamptz,
  provider_id text CHECK(length(provider_id)<=200),
  error_category text CHECK(error_category IN ('provider_unavailable','ambiguous','database_unavailable','cutoff','configuration')),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(account_id,request_id,effect),
  FOREIGN KEY(account_id,request_id) REFERENCES fsc_private.assessment_receipts(account_id,request_id) ON DELETE RESTRICT,
  CHECK ((state='inflight')=(lease_token IS NOT NULL AND lease_until IS NOT NULL)),
  CHECK ((first_attempt_at IS NULL)=(retry_cutoff IS NULL)),
  CHECK (retry_cutoff IS NULL OR retry_cutoff<=first_attempt_at+interval '23 hours 55 minutes')
);
ALTER TABLE fsc_private.assessment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fsc_private.assessment_effects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA fsc_private FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA fsc_private TO service_role;
-- No DELETE/TRUNCATE grants, public policies, definer functions or client access.
-- Supabase service_role bypasses RLS; preflight role metadata must be independently checked.

CREATE FUNCTION fsc_private.account_for_fsc(p_slug text,p_require_active boolean DEFAULT true) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $fn$
DECLARE result uuid;
BEGIN
  SELECT a.id INTO STRICT result FROM public.accounts a WHERE p_slug='fsc' AND a.slug=p_slug AND (NOT p_require_active OR a.status::text='active')
    AND rtrim(regexp_replace(lower(a.website_domain),'^https?://(www\.)?|^www\.','','g'),'/')='floridasecurityconcepts.com' FOR SHARE;
  RETURN result;
EXCEPTION WHEN no_data_found OR too_many_rows THEN RAISE EXCEPTION 'FSC_ACCOUNT_REFUSED';
END $fn$;

CREATE FUNCTION fsc_private.immutable_receipt() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $fn$
BEGIN
  IF (NEW.account_id,NEW.request_id,NEW.receipt_id,NEW.prime_lead_id,NEW.created_at,NEW.expires_at,NEW.purge_after)
    IS DISTINCT FROM (OLD.account_id,OLD.request_id,OLD.receipt_id,OLD.prime_lead_id,OLD.created_at,OLD.expires_at,OLD.purge_after) THEN RAISE EXCEPTION 'FSC_IMMUTABLE_IDENTITY'; END IF;
  IF OLD.accepted_at IS NOT NULL AND NEW.accepted_at IS DISTINCT FROM OLD.accepted_at THEN RAISE EXCEPTION 'FSC_IMMUTABLE_ACCEPTANCE'; END IF;
  IF (NEW.payload,NEW.envelopes,NEW.fingerprint,NEW.template_version,NEW.purged_at)
    IS DISTINCT FROM (OLD.payload,OLD.envelopes,OLD.fingerprint,OLD.template_version,OLD.purged_at) THEN
    IF NOT (OLD.purged_at IS NULL AND NEW.purged_at IS NOT NULL AND NEW.payload IS NULL AND NEW.envelopes IS NULL AND NEW.fingerprint IS NULL AND NEW.template_version IS NULL) THEN RAISE EXCEPTION 'FSC_IMMUTABLE_PAYLOAD'; END IF;
  END IF;
  RETURN NEW;
END $fn$;
CREATE TRIGGER immutable_receipt BEFORE UPDATE ON fsc_private.assessment_receipts FOR EACH ROW EXECUTE FUNCTION fsc_private.immutable_receipt();

CREATE FUNCTION fsc_private.immutable_effect() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $fn$
BEGIN
  IF (NEW.account_id,NEW.request_id,NEW.effect) IS NOT DISTINCT FROM (OLD.account_id,OLD.request_id,OLD.effect)
    AND EXISTS (SELECT 1 FROM fsc_private.assessment_receipts r WHERE r.account_id=OLD.account_id AND r.request_id=OLD.request_id AND r.purged_at IS NOT NULL)
    AND NEW.idempotency_key IS NULL AND NEW.first_attempt_at IS NULL AND NEW.retry_cutoff IS NULL AND NEW.lease_token IS NULL AND NEW.lease_until IS NULL AND NEW.provider_id IS NULL AND NEW.error_category IS NULL
    AND (NEW.state=OLD.state OR (OLD.state='inflight' AND NEW.state='uncertain')) THEN RETURN NEW; END IF;
  IF (NEW.account_id,NEW.request_id,NEW.effect,NEW.idempotency_key) IS DISTINCT FROM (OLD.account_id,OLD.request_id,OLD.effect,OLD.idempotency_key)
    OR (OLD.first_attempt_at IS NOT NULL AND (NEW.first_attempt_at,NEW.retry_cutoff) IS DISTINCT FROM (OLD.first_attempt_at,OLD.retry_cutoff))
    OR (OLD.state IN ('succeeded','skipped') AND NEW.state<>OLD.state) THEN RAISE EXCEPTION 'FSC_IMMUTABLE_EFFECT'; END IF;
  RETURN NEW;
END $fn$;
CREATE TRIGGER immutable_effect BEFORE UPDATE ON fsc_private.assessment_effects FOR EACH ROW EXECUTE FUNCTION fsc_private.immutable_effect();

CREATE FUNCTION public.fsc_receipt_create_draft(p_slug text,p_request uuid,p_fingerprint text,p_payload jsonb,p_envelopes jsonb,p_template text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $fn$
DECLARE account uuid:=fsc_private.account_for_fsc(p_slug); r fsc_private.assessment_receipts; stamp timestamptz:=clock_timestamp();
BEGIN
  IF p_fingerprint IS NULL OR p_fingerprint !~ '^[0-9a-f]{64}$' OR jsonb_typeof(p_payload) IS DISTINCT FROM 'object'
    OR jsonb_typeof(p_envelopes) IS DISTINCT FROM 'object' OR p_template IS NULL OR length(p_template) NOT BETWEEN 1 AND 100
    OR octet_length(p_payload::text)>32768 OR octet_length(p_envelopes::text)>131072
    OR jsonb_typeof(p_envelopes->'company_email') IS DISTINCT FROM 'object'
    OR p_envelopes->'company_email'->>'to' IS DISTINCT FROM 'info@floridasecurityconcepts.com' THEN RAISE EXCEPTION 'FSC_INVALID_RECEIPT'; END IF;
  INSERT INTO fsc_private.assessment_receipts(account_id,request_id,fingerprint,payload,envelopes,template_version,created_at,expires_at,purge_after)
    VALUES(account,p_request,p_fingerprint,p_payload,p_envelopes,p_template,stamp,stamp+interval '24 hours',stamp+interval '7 days') ON CONFLICT(account_id,request_id) DO NOTHING;
  SELECT * INTO STRICT r FROM fsc_private.assessment_receipts WHERE account_id=account AND request_id=p_request FOR UPDATE;
  stamp:=clock_timestamp();
  IF stamp>=r.expires_at OR r.purged_at IS NOT NULL THEN RETURN jsonb_build_object('code','EXPIRED','receipt_id',r.receipt_id); END IF;
  IF r.fingerprint<>p_fingerprint THEN RETURN jsonb_build_object('code','CONFLICT'); END IF;
  INSERT INTO fsc_private.assessment_effects(account_id,request_id,effect,idempotency_key,state)
    SELECT account,p_request,e,CASE WHEN e='prime_lead' THEN NULL ELSE 'fsc/'||r.receipt_id::text||'/'||e END,
      CASE WHEN e='customer_email' AND NOT (r.envelopes ? 'customer_email') THEN 'skipped' ELSE 'pending' END
    FROM unnest(ARRAY['company_email','customer_email','prime_lead']) e ON CONFLICT DO NOTHING;
  RETURN jsonb_build_object('code',CASE WHEN r.accepted_at IS NULL THEN 'READY' ELSE 'RECEIVED' END,'receipt_id',r.receipt_id);
END $fn$;

CREATE FUNCTION public.fsc_effect_claim_draft(p_slug text,p_request uuid,p_effect text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $fn$
DECLARE account uuid:=fsc_private.account_for_fsc(p_slug); r fsc_private.assessment_receipts; e fsc_private.assessment_effects; stamp timestamptz:=clock_timestamp(); token uuid:=gen_random_uuid();
BEGIN
  SELECT * INTO STRICT r FROM fsc_private.assessment_receipts WHERE account_id=account AND request_id=p_request FOR UPDATE;
  SELECT * INTO STRICT e FROM fsc_private.assessment_effects WHERE account_id=account AND request_id=p_request AND effect=p_effect FOR UPDATE;
  stamp:=clock_timestamp();
  IF stamp>=r.expires_at OR r.purged_at IS NOT NULL THEN RETURN jsonb_build_object('code','EXPIRED'); END IF;
  IF e.state IN ('succeeded','skipped') THEN RETURN jsonb_build_object('code',upper(e.state)); END IF;
  IF p_effect<>'company_email' AND r.accepted_at IS NULL THEN RETURN jsonb_build_object('code','PRIMARY_PENDING'); END IF;
  IF e.state='inflight' AND e.lease_until>stamp THEN RETURN jsonb_build_object('code','BUSY'); END IF;
  IF stamp+interval '15 seconds'>=coalesce(e.retry_cutoff,r.expires_at) THEN RETURN jsonb_build_object('code','CUTOFF'); END IF;
  UPDATE fsc_private.assessment_effects SET state='inflight',lease_token=token,lease_until=least(stamp+interval '30 seconds',r.expires_at,coalesce(e.retry_cutoff,r.expires_at)),
    first_attempt_at=coalesce(first_attempt_at,stamp), retry_cutoff=coalesce(retry_cutoff,least(r.expires_at,stamp+interval '23 hours 55 minutes')),updated_at=stamp,error_category=NULL
    WHERE account_id=account AND request_id=p_request AND effect=p_effect RETURNING * INTO e;
  RETURN jsonb_build_object('code','CLAIMED','lease_token',token,'lease_until',e.lease_until,'retry_cutoff',e.retry_cutoff,'idempotency_key',e.idempotency_key,'envelope',r.envelopes->p_effect,'payload',CASE WHEN p_effect='prime_lead' THEN r.payload ELSE NULL END,'prime_lead_id',r.prime_lead_id);
END $fn$;

CREATE FUNCTION public.fsc_effect_finish_draft(p_slug text,p_request uuid,p_effect text,p_token uuid,p_state text,p_provider_id text DEFAULT NULL,p_error text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $fn$
DECLARE account uuid:=fsc_private.account_for_fsc(p_slug); r fsc_private.assessment_receipts; e fsc_private.assessment_effects; stamp timestamptz:=clock_timestamp();
BEGIN
  IF p_effect='prime_lead' OR p_state NOT IN ('succeeded','uncertain','failed') OR p_state IS NULL THEN RAISE EXCEPTION 'FSC_INVALID_EFFECT_FINISH'; END IF;
  SELECT * INTO STRICT r FROM fsc_private.assessment_receipts WHERE account_id=account AND request_id=p_request FOR UPDATE;
  SELECT * INTO STRICT e FROM fsc_private.assessment_effects WHERE account_id=account AND request_id=p_request AND effect=p_effect FOR UPDATE;
  stamp:=clock_timestamp();
  IF r.purged_at IS NOT NULL THEN RETURN jsonb_build_object('code','EXPIRED'); END IF;
  IF e.state<>'inflight' OR e.lease_token IS DISTINCT FROM p_token OR e.lease_until<=stamp THEN RETURN jsonb_build_object('code','STALE_LEASE'); END IF;
  UPDATE fsc_private.assessment_effects SET state=p_state,provider_id=p_provider_id,error_category=p_error,lease_token=NULL,lease_until=NULL,updated_at=stamp
    WHERE account_id=account AND request_id=p_request AND effect=p_effect;
  IF p_effect='company_email' AND p_state='succeeded' THEN UPDATE fsc_private.assessment_receipts SET accepted_at=coalesce(accepted_at,stamp) WHERE account_id=account AND request_id=p_request; END IF;
  RETURN jsonb_build_object('code',upper(p_state),'receipt_id',r.receipt_id);
END $fn$;

-- Matches existing provider mapping, using metadata captured 2026-09-14.
CREATE FUNCTION public.fsc_prime_record_draft(p_slug text,p_request uuid,p_token uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $fn$
DECLARE account uuid:=fsc_private.account_for_fsc(p_slug); r fsc_private.assessment_receipts; e fsc_private.assessment_effects; stamp timestamptz; src text; platform text;
BEGIN
  SELECT * INTO STRICT r FROM fsc_private.assessment_receipts WHERE account_id=account AND request_id=p_request FOR UPDATE;
  SELECT * INTO STRICT e FROM fsc_private.assessment_effects WHERE account_id=account AND request_id=p_request AND effect='prime_lead' FOR UPDATE;
  stamp:=clock_timestamp();
  IF e.state='succeeded' THEN RETURN jsonb_build_object('code','SUCCEEDED','lead_id',r.prime_lead_id); END IF;
  IF stamp>=r.expires_at OR r.purged_at IS NOT NULL THEN RETURN jsonb_build_object('code','EXPIRED'); END IF;
  IF r.accepted_at IS NULL THEN RETURN jsonb_build_object('code','PRIMARY_PENDING'); END IF;
  IF e.state<>'inflight' OR e.lease_token IS DISTINCT FROM p_token OR e.lease_until<=stamp THEN RETURN jsonb_build_object('code','STALE_LEASE'); END IF;
  src:=trim(lower(coalesce(r.payload->>'utmSource','')));
  platform:=CASE WHEN src='' THEN 'organic' WHEN src LIKE '%google%' OR src IN ('cpc','ppc','adwords') THEN 'google' WHEN src LIKE '%facebook%' OR src LIKE '%meta%' OR src LIKE '%instagram%' OR src IN ('fb','ig') THEN 'meta' ELSE 'referral' END;
  -- Plain INSERT deliberately fails on any unrelated UUID collision; never UPSERT.
  INSERT INTO public.leads(id,account_id,client_key,source_platform,lead_type,contact_name,contact_email,contact_phone,contact_location,
    utm_source,utm_medium,utm_campaign,notes,qualification_status,attribution_confidence,dedup_key,ingest_source,raw_payload)
  VALUES(r.prime_lead_id,account,p_slug,platform,'form',r.payload->>'fullName',r.payload->>'email',r.payload->>'phone',r.payload->>'city',
    r.payload->>'utmSource',r.payload->>'utmMedium',r.payload->>'utmCampaign',r.payload->>'message','new',CASE WHEN nullif(r.payload->>'utmSource','') IS NULL THEN 'low' ELSE 'medium' END,
    p_slug||'::email::'||lower(r.payload->>'email')||'::'||to_char(r.created_at AT TIME ZONE 'UTC','YYYY-MM-DD'),'fsc-website',
    jsonb_build_object('fsc',jsonb_build_object('propertyType',r.payload->>'propertyType','service',r.payload->>'service','urgency',r.payload->>'urgency','contactMethod',r.payload->>'contactMethod','company',r.payload->>'company','sourcePage',r.payload->>'sourcePage','serviceSlug',r.payload->>'serviceSlug','industrySlug',r.payload->>'industrySlug','locationSlug',r.payload->>'locationSlug','referrer',r.payload->>'referrer','submittedAt',r.created_at)));
  UPDATE fsc_private.assessment_effects SET state='succeeded',lease_token=NULL,lease_until=NULL,error_category=NULL,updated_at=stamp WHERE account_id=account AND request_id=p_request AND effect='prime_lead';
  RETURN jsonb_build_object('code','SUCCEEDED','lead_id',r.prime_lead_id);
END $fn$;

CREATE FUNCTION public.fsc_receipt_purge_draft(p_slug text) RETURNS integer
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $fn$
DECLARE account uuid:=fsc_private.account_for_fsc(p_slug,false); r record; total integer:=0; stamp timestamptz:=clock_timestamp();
BEGIN
  FOR r IN SELECT request_id FROM fsc_private.assessment_receipts WHERE account_id=account AND purge_after<=stamp AND purged_at IS NULL FOR UPDATE LOOP
    UPDATE fsc_private.assessment_receipts SET payload=NULL,envelopes=NULL,fingerprint=NULL,template_version=NULL,purged_at=stamp WHERE account_id=account AND request_id=r.request_id;
    UPDATE fsc_private.assessment_effects SET provider_id=NULL,error_category=NULL,idempotency_key=NULL,first_attempt_at=NULL,retry_cutoff=NULL,lease_token=NULL,lease_until=NULL,state=CASE WHEN state='inflight' THEN 'uncertain' ELSE state END,updated_at=stamp WHERE account_id=account AND request_id=r.request_id;
    total:=total+1;
  END LOOP;
  RETURN total;
END $fn$;

-- Explicit owner-run deletion-request propagation, never called by an anonymous visitor.
CREATE FUNCTION public.fsc_receipt_erase_draft(p_slug text,p_request uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $fn$
DECLARE account uuid:=fsc_private.account_for_fsc(p_slug,false); found_request uuid;
BEGIN
  SELECT request_id INTO found_request FROM fsc_private.assessment_receipts WHERE account_id=account AND request_id=p_request FOR UPDATE;
  IF found_request IS NULL THEN RETURN false; END IF;
  UPDATE fsc_private.assessment_receipts SET payload=NULL,envelopes=NULL,fingerprint=NULL,template_version=NULL,purged_at=coalesce(purged_at,clock_timestamp()) WHERE account_id=account AND request_id=p_request;
  UPDATE fsc_private.assessment_effects SET provider_id=NULL,error_category=NULL,idempotency_key=NULL,first_attempt_at=NULL,retry_cutoff=NULL,lease_token=NULL,lease_until=NULL,state=CASE WHEN state='inflight' THEN 'uncertain' ELSE state END,updated_at=clock_timestamp() WHERE account_id=account AND request_id=p_request;
  RETURN true;
END $fn$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA fsc_private FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA fsc_private TO service_role;
REVOKE ALL ON FUNCTION public.fsc_receipt_create_draft(text,uuid,text,jsonb,jsonb,text), public.fsc_effect_claim_draft(text,uuid,text), public.fsc_effect_finish_draft(text,uuid,text,uuid,text,text,text), public.fsc_receipt_purge_draft(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.fsc_receipt_create_draft(text,uuid,text,jsonb,jsonb,text), public.fsc_effect_claim_draft(text,uuid,text), public.fsc_effect_finish_draft(text,uuid,text,uuid,text,text,text), public.fsc_receipt_purge_draft(text) TO service_role;
REVOKE ALL ON FUNCTION public.fsc_prime_record_draft(text,uuid,uuid), public.fsc_receipt_erase_draft(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.fsc_prime_record_draft(text,uuid,uuid), public.fsc_receipt_erase_draft(text,uuid) TO service_role;
COMMIT;
