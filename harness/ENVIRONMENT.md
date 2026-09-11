# Florida Security Concepts — Environment and access inventory

Tier 3 · Harness v1.0 draft · 2026-09-11

Names and metadata only; no secret values. Do not open secret files or echo the process environment. Existing variable presence in production is UNVERIFIED, not assumed missing. No credentials are needed for S-001/S-002. Local helpers use synthetic fixtures and deliberately exclude live delivery.

## Existing application variables

| Name | Purpose | Environment/source | Secret | Cost/status | Safe validation | Owner stage / rotation |
|---|---|---|---|---|---|---|
| NEXT_PUBLIC_SITE_URL | Canonical site host | Build/runtime; Vercel config or existing default | No | Existing; production override unverified | Inspect rendered canonical/sitemap, no env dump | S-006; ordinary config change reviewed |
| NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL | Analytics script | Build; Plausible/Vercel owner config | Public | Script observed live; account cost and receipt unverified | Public DOM confirmed; dashboard/event test later; empty in local build/runtime | S-006; owner updates public script config |
| LEAD_DELIVERY_MODE | Choose delivery adapter | Runtime; Vercel owner config | No, but private configuration | Active production choice unknown | Names-only/private mode confirmation; local test forces safe adapter | S-005; no silent switching |
| RESEND_API_KEY | Email send credential | Server runtime; Resend owner | Yes | Existing integration; plan/cost unknown | Presence-only validation and explicitly authorized safe delivery test; never echo | S-005; rotation only Brian-approved |
| LEAD_NOTIFICATION_TO | Approved company recipients | Server runtime; Brian/Vercel | Private contact routing | Unknown recipients/accountability | Owner privately confirms approved recipient(s), independent receipt when separately authorized | S-005; routing changes need owner approval |
| LEAD_NOTIFICATION_FROM | Verified sender identity | Server runtime; Resend/Vercel | Private configuration | Existing account unknown | Sender/domain verification status, never publish environment dump | S-005; owner controls |
| LEAD_CONFIRMATION_ENABLED | Customer-copy policy | Server runtime; Vercel | No | Defaults in code; configured status unknown | Inspect behavior in isolated adapter tests; no live customer sends | S-005; policy approved by Brian |
| LEAD_CONFIRMATION_FROM | Customer-copy sender override | Server runtime; Vercel | Private configuration | Optional, unverified | Private identity validation, no message send without permission | S-005; owner controls |
| LEAD_CONFIRMATION_REPLY_TO | Replies to appropriate company inbox | Server runtime; Vercel | Private contact routing | Optional, unverified | Confirm actual owner/backup privately | S-005; owner controls |
| PRIME_SUPABASE_URL | Existing Prime API endpoint | Server runtime; existing Prime owner config | Treat as private configuration | Existing integration; cost unknown | Project identity metadata only, no customer rows | S-005; endpoint changes are architecture decisions |
| PRIME_SUPABASE_SERVICE_ROLE_KEY | Privileged server-only Prime access | Server runtime; Prime owner | Yes; bypasses RLS | Unverified | Presence and approved isolated metadata checks, never value; no production SQL | S-005; rotation only explicit Brian approval |
| PRIME_ACCOUNT_SLUG | FSC tenant selection | Server runtime; existing config | Private routing | Unverified | Authoritative account mapping without customer records; never take from user payload | S-005; owner/account boundary |
| LEADS_WEBHOOK_URL | Optional delivery destination | Server runtime; owner config | Treat whole URL as secret; may contain tokens | Optional integration unknown | Presence/scheme and allowed destination privately; no raw URL logs | S-005; endpoint change owner-reviewed |
| LEADS_WEBHOOK_SECRET | Optional webhook authentication | Server runtime; owner config | Yes | Unverified | Presence only, isolated test verifies header contract with fake value | S-005; explicit owner-approved rotation |

No secret is needed in browser code. Public-prefixed variables are compiled into bundles; do not repurpose them for credentials. Email recipients, referrer/UTM content and source location may be personal/private even if not credential secrets.

## Proposed local and verification configuration

| Name / resource | Purpose | Status | Validation / boundary |
|---|---|---|---|
| FSC_LOCAL_PREVIEW | Explicit local-only build/runtime mode | Proposed S-002 | Must agree with local adapter; reject hosted flags; no fallthrough even if Next reloads credentials |
| NODE_ENV | Framework execution mode | Existing framework-owned | Production value also occurs for compiled local preview; not sole environment discriminator |
| NEXT_TELEMETRY_DISABLED | Disable tool telemetry during verification | Used in discovery | Set only for child process; no global change |
| CI | Deterministic noninteractive tests | Existing runner convention | Set only for child process; never interpreted as permission to use live providers |
| FORCE_COLOR / NO_COLOR | Readable raw logs | Existing runner convention | Set locally by gate; do not dump environment |
| VERCEL / VERCEL_ENV / VERCEL_TARGET_ENV | Detect hosted Vercel context | Host-owned | Their presence prevents local receipt mode; actual project settings unknown |
| NETLIFY / RENDER / AWS_LAMBDA_FUNCTION_NAME | Detect unsupported hosted execution | Host-owned | Their presence prevents local receipt mode; no deployment to these hosts authorized |
| .fsc-local/receipts/ | Durable synthetic development receipt files | Proposed S-002 | Ignored, no HTTP listing, safe UUID paths; no live-person data |
| Isolated local build directory | Prevent reusing public build config | Proposed S-002 | Derive fixed repo-contained output from local flag; test stale-build mismatch |
| Per-run test receipt/build directories | Parallel-test and evidence isolation | Proposed S-001/S-002 | Fixed workspace/temp roots, no broad cleanup, stop only owned processes |

No opaque test-control query parameters exposed in the application. Fault injection and fake clocks exist only in test adapters/helpers. Never publish local receipt files. Synthetic test artifacts are retained through review; removal later must stay within verified owned paths and comply with deletion permissions. No production retention policy is inferred from test artifact lifetime.

## Accounts and tooling

| System | Owner/access | Cost | Established fact / unresolved |
|---|---|---|---|
| GitHub | Existing bsidenberg repo access | Existing plan unknown; no new cost | Read-only ADMIN access confirmed; protected main and merge remain Brian's |
| Vercel | Owner account not visible through current connector | Existing plan unknown; no new cost | Connector returned no teams; GitHub shows Vercel preview/production deployments; exact triggers unverified |
| Resend | Existing account owner to confirm | Existing recurring cost unknown | Code installed; no production receipt verified |
| Prime / Supabase | Existing Prime account owner to confirm | Existing recurring cost unknown | Adapter exists; schema/account/production credentials not inspected |
| Plausible | Existing account owner to confirm | Existing recurring cost unknown | Public script loads; dashboard access/baseline not verified |
| Optional webhook receiver | Owner/destination unknown | Unknown; no new service authorized | Inactive/active state unverified |
| Node/npm and proposed test libraries | Local/CI tooling | No new paid service | Node 24/npm 11 available; compatible package versions pinned in S-001 |
| Named implementation/safety models | Current session lacks requested Opus/Fable/Sonnet routes | No new subscription authorized | OD-01 requests explicit alternative routing or supplied environment |

## Environment topology and deployment triggers

| Environment | Intended use | Trigger/access | Gate |
|---|---|---|---|
| Local loopback | Synthetic preview and tests | Agent-owned launch scripts, no external hosting | Harness approval; isolated flags and network safety |
| CI | Same machine gate and artifact collection | Feature branch/PR workflow after safe push | Verify Git/Vercel triggers first; synthetic data only |
| Vercel Preview | Optional later external preview | Exact branch/environment behavior unknown | OD-03; no use of production recipients/credentials by default |
| Production | Public website and real leads | Existing Vercel automation unknown | Brian-approved release only; verify actual configuration first |

## Single later owner-input batch

At S-005/S-006, collect privately: Vercel project/branch-trigger visibility; active delivery mode; lead owner and backup; approved recipient/sender identities; sender verification status; existing Prime schema/account metadata if enabled; safe isolated credentials only if needed; approved retention/privacy wording; analytics dashboard access and aggregate baseline; supportable numerical cost guidance. Do not ask Brian to paste secrets into chat. Use owner-managed vendor configuration and presence-only verification. Launch remains blocked if required operational responsibility or production semantics are unresolved.
