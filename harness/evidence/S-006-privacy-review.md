# S-006 independent safety/privacy and code review — 2026-09-14 (round 1)

Reviewer: independent safety-reviewer subagent (Opus); no authorship. Report returned in-message and saved by the orchestrator. Disposition: **CLEAR WITH MINOR** for code; one MAJOR release condition (M-1) must remain an explicit PR limitation until closed.

Scope: uncommitted diff vs 7ffea10 — lib/analytics/{events,sanitize,routes,region,config,plausible}.ts, lib/analytics/PlausibleAnalytics.tsx, app/layout.tsx, app/page.tsx, components/{LeadCaptureForm,Header,Footer,Hero,CTASection}.tsx, scripts/local-server.mjs, scripts/verify.ps1, next.config.mjs, .gitignore, tsconfig.json (context: tests/release/support/tracker-adapter.ts, runner.test.ts diff, lib/leads/*, app/robots.ts, network-guard).

Method: full read against S-006 contract/addendum, SPEC §7–§8/§10, HARNESS C-05/C-06/§5, DECISIONS through OD-07; verified @plausible-analytics/tracker@0.4.6 lockfile sha512 = scratch tarball = node_modules copy and read plausible.js; read @next/env and next/dist/server/config.js and exercised `processEnv` with in-memory synthetic file contents (a hook denied writing synthetic .env fixtures; stopped, no workaround); adversarial scratch probes of sanitizers/props/scripts; inspected .next-measure client chunks. Tests not used as evidence.

## Findings

- **M-1 MAJOR (release condition)** plausible.ts:1-6,47-66; tests/release/support/tracker-adapter.ts:9-16,44-56 — npm core 0.4.6 behavior is proven (payload {n,v,u,d,r,p,i,$,h}; transformRequest last, falsy drops; engagement skips transform but reuses sanitized u, no r, undefined p). NOT proven: that the hosted plausible.io/js/pa-*.js loader reads plausible.o incl. function transformRequest, honors autoCapturePageviews:false, applies init before replaying plausible.q, and is not overridden by dashboard settings. The release fixture emulates the loader. Failure: automatic pageviews with full location.href/document.referrer. Close-out: verify the hosted script's loader (read-only GET of the public script and run/diff against the adapter), or capture /api/event bodies on www after launch; rollback = remove NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL. PR must state "hosted script pending" until closed.
- **m-1 MINOR** sanitize.ts:9-16 — identifier-shaped UTM values (UUID, 10-digit phone, email-like dotted) pass the contract regex; HARNESS C-06 says no arbitrary UTMs. Map identifier-shaped values to `other` (or allowlist source/medium).
- **m-2 MINOR** region.ts:3,10-12 — importing @/data/locations ships ~30 KB of location page copy in a client chunk on /contact and detail routes; hardcode the 14 city→region pairs with a unit test against data/locations.
- **m-3 MINOR (OD-07 visibility)** LeadCaptureForm.tsx:103-104 — disclosure does not mention analytics (Plausible receives categorical form-step events, page visits, UTMs, referrer origin; Plausible also receives IP/user agent in transit). Not literally false; Brian should see the omission and may add a sentence such as: "We use Plausible, a cookie-free analytics service, to count page visits and form steps using general categories only — never your contact details or message."
- **m-4 MINOR** events.ts:92, LeadCaptureForm.tsx:230 — Lead Submitted props renamed (service/urgency → service_category/urgency_category) breaks existing Plausible breakdown continuity/28-day baseline; new events need goals configured (owner step); assessment_submit_attempt counts retries. Include in launch handoff.
- **N-1** analytics argument computation outside track's try/catch in LeadCaptureForm (cannot throw today); move inside guard. **N-2** referrer origins can still identify (e.g., HOA portal subdomain); SPEC permits origins. **N-3** next-plausible dependency now unused; remove. **N-4** NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL still scoped to Preview in Vercel; recommend Production-only scoping. **N-5** measure mode: blanked keys beat .env files, but unblanked keys (e.g., VERCEL_ENV from a pulled .env.local) apply → server would silently behave as hosted preview; release suite should assert robots allow + expected analytics state at runtime. **N-6** next-env.d.ts is rewritten per distDir; stale types fail typecheck (not a weakening). **N-7** stray untracked %SystemDrive%/, tmp/fsc-crm (nested repo), harness/fsc-crm/ must not be staged. **N-8** several general tel: links untagged (reporting undercount only). **N-9** pa- script without SRI; no CSP (unchanged).

## Controls verified correct

Data minimization: sanitizePayload rebuilds from allowlist, drops $, unknown keys and non-allowlisted events (engagement, __proto__, Form: Submission, Outbound Link); throwing props getter drops event; u always production origin + canonical path (unknown/encoded/`//`/javascript: → /404) + ≤3 normalized UTMs; r origin-only, null for own hosts; enumerated props; region 4 values, city text never leaves function; pre-load queue sanitized; bfcache path identical; no searchParams/storage/cookies/fingerprinting; allowlist matches SPEC. Counting: Lead Submitted only on ok responses, module-level per-request-ID set (survives remount, retry counts once); form start once per instance excluding honeypot; submit attempt after lock and validation; enumerated delivery classes; track swallows errors. Loading gates: strict pa- regex; NODE_ENV=production; not local/hosted preview (build-time and runtime); no SSR script; referrerPolicy no-referrer; robots/meta unchanged. Launcher measure mode: flag dependencies; hosted markers refused; loopback; network guard; blank LEAD_DELIVERY_MODE → 503 before provider import; @next/env precedence confirmed (existing empty strings win; empty values survive spawnSync on Windows); FSC_DIST_DIR two relative names only; default/--compiled unchanged; fixture pa- URL fails closed; separate dist dirs. verify.ps1: only line 34 changed; rejection logic untouched; self-tests cover rule. Components: data-fsc-* attributes and delegated capture listener only; no preventDefault; keyboard/middle-click tracked; accessibility not degraded.

## Residual hosted-only risks

Hosted pa- loader behavior (M-1) and dashboard overrides; hosted preview builds/functions actually see VERCEL_ENV=preview (no script tag, noindex) — must be checked on the real preview; production /api/event bodies on www and Plausible goal setup.

## M-1 orchestrator follow-up — hosted loader inspection, 2026-09-14

Read-only public GETs: the live homepage (https://www.floridasecurityconcepts.com/) references `https://plausible.io/js/pa-z8wpGBQzz21OWo7apGbdN.js`; that script (6,040 bytes, SHA-256 699a37594f53cf5fd1026e3e442d29119c6901cfd3a696dd5cec20d7cc52a8a4, `window.plausible.v=36`) was saved to ignored `.fsc-test/plausible/pa-live-699a3759.js`. No events were sent and no other Plausible endpoint was contacted.

Static inspection of that exact script:
- Bootstrap tail: `window.plausible=window.plausible||{},plausible.o&&S(plausible.o),plausible.init=S` — init options stored in `plausible.o` before load are applied.
- `S(e)`: `Object.assign(o={endpoint:"https://plausible.io/api/event",domain:"floridasecurityconcepts.com",formSubmissions:!0,fileDownloads:!0,outboundLinks:!0},t,{domain:o.domain})` — dashboard-baked defaults are overridden by caller options (the project's explicit `false` values win); only `domain` is forced.
- Pageview autocapture is installed only when `o.autoCapturePageviews` is truthy.
- Queue replay (`window.plausible.q`) happens at the end of `S`, after options are applied.
- The track path applies `customProperties`, then `if("function"==typeof o.transformRequest&&!(L=o.transformRequest(L)))return g(f,m,"transformRequest")` — transform runs last and a falsy result drops the event. Outbound-link, file-download, form-submission and CSS-tagged events all call the same track path, so they pass through the project's allowlist even if enabled.

Conclusion: the loader assumptions behind M-1 hold for the currently published site script. Residual: Plausible may change the hosted script at any time (no SRI), so the post-launch capture of real /api/event bodies on www remains a recommended owner verification. Test-guard is asked to run the payload suite against this exact saved script as well as the npm core.

---

# Round 2 targeted re-review — 2026-09-15

Disposition: **CLEAR WITH MINOR**. M-1 closed for the currently published site script (reviewer independently re-read `.fsc-test/plausible/pa-live-699a3759.js`, SHA-256 699a3759…, 6,040 bytes, domain floridasecurityconcepts.com; provenance versus plausible.io today not re-fetched by the reviewer).

Dispositions: M-1 CLOSED (residual R2-m1). m-1 MOSTLY RESOLVED → NOTE (identifier-shaped values still possible with underscores or short separated digits, e.g. `407_555_1234`, `acct-123456`; the link author controls UTMs; the no-dots rule drops `m.facebook.com` detail — reporting only). m-2 RESOLVED (CITY_REGIONS matches data/locations.ts; unit-enforced; no import). m-3 RECORDED for Brian (OD-07, OWNER-LAUNCH-STEPS). m-4 RESOLVED (documented). N-1 RESOLVED. N-2 accepted. N-3 RESOLVED (next-plausible removed). N-4 recorded as owner recommendation. N-5 RESOLVED (runtime production-equivalence assertions). N-6 open, fails safe. N-7 open (stray untracked folders must not be staged). N-8 open (reporting only). N-9 open (no SRI).

htmlLimitedBots /.*/ (verified in Next 15.5.25 source): affects only metadata streaming via shouldServeStreamingMetadata; bot detection, caching and static generation unaffected; an empty user agent still streams; static prerendered HTML has metadata in head; preview noindex now in head for non-empty user agents on dynamic /contact (improvement); negligible TTFB impact; no privacy effect.

Release payload tests: the guard serves the exact hash/size-checked live script in all three engines; init options passed through (adds only captureOnLocalhost, a loopback collector and a window hook); the exactly-one-pageview-per-navigation assertion catches autocapture; the referrer test confirms a hostile document.referrer and then requires an origin-only r; dashboard-default events (outbound, download, form submit) asserted absent. Limits: live mode uses the test snippet rather than the app's installPlausible (the app snippet is exercised in the Chromium npm suite); identifier-shape UTM rules are covered by unit tests only.

New findings:
- **R2-m1 MINOR** no mandatory post-launch check of real /api/event payloads; the hosted script can change (no SRI). Add a read-only devtools check on www with a hostile query and external referrer, and re-hash the live script before relying on reports. → Orchestrator added a required check to OWNER-LAUNCH-STEPS §5.
- **R2-m2 MINOR** rolling back to the previous deployment restores the old analytics setup that sends full URLs/referrers. → Added to OWNER-LAUNCH-STEPS §6.
- **R2-N1 NOTE** the preview-privacy contract test checks noindex presence, not head placement, and has no empty-user-agent case.

Hosted-only: a real Vercel preview shows no analytics script and noindex; production /api/event bodies are sanitized.
