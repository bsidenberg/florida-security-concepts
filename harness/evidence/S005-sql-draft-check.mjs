import { PGlite } from '../../.fsc-test/sql-draft-check/node_modules/@electric-sql/pglite/dist/index.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const draft=readFileSync('sql/fsc-assessment-receipts.draft.sql','utf8');
const metadata=JSON.parse(readFileSync('harness/evidence/prime-schema-metadata-20260914.json','utf8'));
const db=new PGlite(); let count=0;
const log=[];
function record(s){ log.push(s); console.log(s); }
async function check(name,fn){await fn();count++;record(`PASS ${name}`);}
async function rejects(fn,pattern){await assert.rejects(fn,pattern);}
const account='11111111-1111-4111-8111-111111111111';
const payload={fullName:'Synthetic FSC Manager',phone:'2025550100',email:'sql-check@example.invalid',propertyType:'HOA / gated community',service:'Maintenance / service',city:'Orlando',urgency:'Not specified'};
const envelope={company_email:{to:'info@floridasecurityconcepts.com',from:'synthetic@example.invalid',subject:'Synthetic test',text:'Never sent'}};
const fp='a'.repeat(64);
async function one(sql,args=[]){return (await db.query(sql,args)).rows[0];}
async function create(id=randomUUID(),fingerprint=fp,body=payload){return (await one('select public.fsc_receipt_create_draft($1,$2,$3,$4,$5,$6) as result',['fsc',id,fingerprint,body,envelope,'draft-v1'])).result;}
async function claim(id,effect='company_email'){return (await one('select public.fsc_effect_claim_draft($1,$2,$3) as result',['fsc',id,effect])).result;}
async function finish(id,token,state='succeeded'){return (await one('select public.fsc_effect_finish_draft($1,$2,$3,$4,$5,$6,$7) as result',['fsc',id,'company_email',token,state,'synthetic-provider-id',state==='uncertain'?'ambiguous':null])).result;}
try{
 record(`SQL draft SHA256 ${createHash('sha256').update(draft).digest('hex')}`);
 record('Runtime Node '+process.version+' PGlite 0.5.8; in-memory only; no network/database credentials');
 await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS; CREATE TABLE public.accounts(id uuid primary key,slug text unique not null,status text not null,website_domain text); ");
 const columns=metadata.find(x=>x.name==='public.leads').columns.map(c=>`"${c.name}" ${c.data_type}${c.options.includes('nullable')?'':' NOT NULL'}${c.default_value?' DEFAULT '+c.default_value:''}${c.check?' CHECK('+c.check+')':''}`).join(',');
 await db.exec(`CREATE TABLE public.leads(${columns},PRIMARY KEY(id),FOREIGN KEY(account_id) REFERENCES public.accounts(id)); GRANT SELECT,UPDATE ON public.accounts TO service_role; GRANT SELECT,INSERT ON public.leads TO service_role;`);
 await db.query('insert into public.accounts values($1,$2,$3,$4)',[account,'fsc','active','https://www.floridasecurityconcepts.com/']);
 await check('exact draft applies as one transaction',()=>db.exec(draft));
 await check('both tables RLS enabled',async()=>assert.equal((await db.query("select count(*)::int as n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='fsc_private' and c.relkind='r' and c.relrowsecurity")).rows[0].n,2));
 await check('all public RPCs invoker with fixed search path',async()=>{const r=await db.query("select prosecdef,proconfig from pg_proc where proname like 'fsc_%_draft'");assert.equal(r.rows.length,6);for(const f of r.rows){assert.equal(f.prosecdef,false);assert.deepEqual(f.proconfig,['search_path=pg_catalog']);}});
 for(const role of ['anon','authenticated']) await check(`${role} cannot read table or call RPC`,async()=>{await db.exec(`SET ROLE ${role}`);await rejects(()=>db.query('select * from fsc_private.assessment_receipts'),/permission denied/);await rejects(()=>create(),/permission denied/);await db.exec('RESET ROLE');});
 await db.exec('SET ROLE service_role');
 const id=randomUUID(); let receipt;
 await check('create receipt and three effect rows',async()=>{receipt=await create(id);assert.equal(receipt.code,'READY');assert.equal((await one('select count(*)::int n from fsc_private.assessment_effects')).n,3);});
 await check('unchanged retry stable receipt and envelope',async()=>{assert.deepEqual(await create(id),receipt);assert.equal((await one('select count(*)::int n from fsc_private.assessment_receipts')).n,1);});
 await check('changed fingerprint conflicts without overwrite',async()=>{assert.equal((await create(id,'b'.repeat(64))).code,'CONFLICT');assert.deepEqual((await one('select payload from fsc_private.assessment_receipts')).payload,payload);});
 await check('wrong account refused',async()=>rejects(()=>db.query('select public.fsc_effect_claim_draft($1,$2,$3)',['other',id,'company_email']),/FSC_ACCOUNT_REFUSED/));
 await check('immutable payload cannot update',async()=>rejects(()=>db.query("update fsc_private.assessment_receipts set payload='{}'"),/FSC_IMMUTABLE_PAYLOAD/));
 await check('secondary requires primary',async()=>assert.equal((await claim(id,'prime_lead')).code,'PRIMARY_PENDING'));
 let leased;
 await check('claim and second caller busy',async()=>{leased=await claim(id);assert.equal(leased.code,'CLAIMED');assert.equal((await claim(id)).code,'BUSY');});
 await check('wrong lease token cannot finish',async()=>assert.equal((await finish(id,randomUUID())).code,'STALE_LEASE'));
 await check('uncertain outcome reacquires same key',async()=>{assert.equal((await finish(id,leased.lease_token,'uncertain')).code,'UNCERTAIN');const again=await claim(id);assert.equal(again.idempotency_key,leased.idempotency_key);leased=again;});
 await check('primary success durable and replayable',async()=>{assert.equal((await finish(id,leased.lease_token)).code,'SUCCEEDED');assert.equal((await create(id)).code,'RECEIVED');assert.equal((await claim(id)).code,'SUCCEEDED');});
 await check('Prime transaction inserts once and replays',async()=>{const c=await claim(id,'prime_lead');const q='select public.fsc_prime_record_draft($1,$2,$3) as result';assert.equal((await one(q,['fsc',id,c.lease_token])).result.code,'SUCCEEDED');assert.equal((await one(q,['fsc',id,c.lease_token])).result.code,'SUCCEEDED');assert.equal((await one('select count(*)::int n from public.leads')).n,1);});
 await check('disabled confirmation skipped',async()=>assert.equal((await claim(id,'customer_email')).code,'SKIPPED'));
 await db.exec('RESET ROLE');
 await db.query("update public.accounts set status='inactive' where id=$1",[account]);
 await db.exec('SET ROLE service_role');
 await check('inactive account cannot claim',async()=>rejects(()=>claim(id),/FSC_ACCOUNT_REFUSED/));
 await check('inactive account can erase receipt for deletion request',async()=>assert.equal((await one('select public.fsc_receipt_erase_draft($1,$2) result',['fsc',id])).result,true));
 await db.exec('RESET ROLE');await db.query("update public.accounts set status='active' where id=$1",[account]);await db.exec('SET ROLE service_role');
 await check('erased tombstone cannot recreate or send',async()=>{assert.equal((await create(id)).code,'EXPIRED');assert.equal((await claim(id)).code,'EXPIRED');const r=await one('select payload,fingerprint,envelopes from fsc_private.assessment_receipts');assert.deepEqual(r,{payload:null,fingerprint:null,envelopes:null});});
 await check('cleanup never touches existing Prime lead',async()=>assert.equal((await one('select count(*)::int n from public.leads')).n,1));
 // Synthetic old tombstones inserted with original timestamps: no clock override in production RPC.
 const expired=randomUUID();
 await db.query("insert into fsc_private.assessment_receipts(account_id,request_id,fingerprint,payload,envelopes,template_version,created_at,expires_at,purge_after) values($1,$2,$3,$4,$5,'old',clock_timestamp()-interval '8 days',clock_timestamp()-interval '7 days',clock_timestamp()-interval '1 day')",[account,expired,fp,payload,envelope]).catch(async()=>{
  await db.query("with t as(select clock_timestamp()-interval '8 days' v) insert into fsc_private.assessment_receipts(account_id,request_id,fingerprint,payload,envelopes,template_version,created_at,expires_at,purge_after) select $1,$2,$3,$4,$5,'old',v,v+interval '24 hours',v+interval '7 days' from t",[account,expired,fp,payload,envelope]);
 });
 await check('expired ID refused',async()=>assert.equal((await create(expired)).code,'EXPIRED'));
 await check('seven-day purge clears payload preserving tombstone',async()=>{assert.equal((await one('select public.fsc_receipt_purge_draft($1) n',['fsc'])).n,1);assert.equal((await create(expired)).code,'EXPIRED');});
 for (const [source,expected] of [[' cpc ','google'],['ppc','google'],['adwords','google'],[' Meta ads ','meta'],['fb','meta'],['newsletter','referral'],['','organic']]) await check(`existing source mapping ${source || 'empty'}`,async()=>{
   const request=randomUUID(); await create(request,fp,{...payload,utmSource:source});
   const company=await claim(request);await finish(request,company.lease_token);
   const prime=await claim(request,'prime_lead');await one('select public.fsc_prime_record_draft($1,$2,$3) result',['fsc',request,prime.lease_token]);
   assert.equal((await one('select source_platform from public.leads where id=$1',[prime.prime_lead_id])).source_platform,expected);
 });
 record(`RESULT ${count} checks passed`);
 record('LIMITATION PGlite has one exclusive connection. This does not prove inter-session lock contention, server restart recovery, network/PostgREST ACL exposure, deployed Supabase grants or live provider delivery. Full PostgreSQL concurrency tests and independent review remain required.');
}catch(error){record('FAILED '+error.message);process.exitCode=1;}finally{await db.close();writeFileSync('harness/evidence/S005-sql-draft-local.log',log.join('\n')+'\n');}
