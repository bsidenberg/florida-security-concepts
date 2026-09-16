# S-SEC-001 independent source/security review

Date: 2026-09-14. Scope: package.json/package-lock.json, Next configuration and five route parameter compatibility changes. Reviewer authored no application, dependency or test changes. No production deployment, provider call or secret read was performed.

## Result

No outstanding source-review findings in the scoped dependency repair. This is not a full machine-gate or production-release passing claim. Parent verifier owns scripts/verify.ps1 evidence; compiled preview and browser regression evidence must accompany acceptance.

## Inspected changes

- Next and eslint-config-next are pinned to 15.5.25; matching React/ReactDOM and types to 19.3.0; Resend to 6.12.3; direct PostCSS to 8.5.28. The override targets Next's PostCSS dependency only. The resolved dependency report shows the intended versions and Resend's svix 1.92.2. No forced peer override or unrelated framework replacement is introduced.
- Compared lockfile versions to HEAD: changes are the framework/runtime/lint dependency chain and Resend's dependency chain, including expected SWC/platform packages. Inspected resolved locations remain npm registry URLs; no new external package source was found.
- Four dynamic route pages and their metadata functions await promised params; contact awaits promised searchParams before the unchanged queryDefaults call. Existing static parameter generation, dynamicParams=false, notFound behavior, metadata builders, page content, routes and form props remain intact.
- Explicit outputFileTracingRoot resolves to the repository directory through import.meta.url. This removes ambiguous parent-workspace tracing without broadening to unrelated filesystem roots. Local distDir flag, security header choice and other configuration remain unchanged.
- No diff changes lead API, validation, form retry behavior, provider adapters, CSS/theme, analytics configuration or local launcher/network guard. Existing credential clearing, hosted-marker rejection, local-only mode and loopback binding remain. Those protections still need runtime verification against the upgraded Next internal launcher API; unchanged source alone is not proof of execution compatibility.
- Production audit evidence `S-SEC-001-production-audit.json` reports zero advisories at every severity. `S-SEC-001-resolved-dependencies.json` records the installed graph. This is the registry audit's current finding, not a guarantee that every dependency is vulnerability-free, nor an audit of development-only packages.

## Acceptance limits

The builder reports lint/typecheck exit zero; those reports do not replace the independent complete gate. Retain Node 24, all existing functional tests and route coverage; verify compiled local receipt/isolation and visual output after framework/PostCSS changes. No suppression, deleted test, weakened security setting or application-contract substitution was introduced by the reviewed diff.

This repair does not resolve the separately documented production retry/storage requirement, pending AM-003 architecture acceptance, production recipient configuration or S-005/S-006 release gates. No claim is made that dependency repair alone makes the website ready to publish.

## Compiled browser-test server follow-up

Reviewed the one-line `tests/e2e/server-setup.ts` change adding `--compiled` to the existing isolated launcher. The first gate correctly rejected a Next 15 development hot-reloader network request despite completed test cases. This repair uses the already supported compiled local mode; it does not allowlist that request, remove the network marker or suppress the gate failure.

The launcher still clears provider credentials, binds loopback, forces local receipt mode and rejects hosted environments. It builds the isolated output before starting, then disables the existing exact-host font allowance. Browser tests therefore exercise compiled pages with the same synthetic receipt path. Port-ownership checks, readiness timeout and owned-child teardown are unchanged. No review finding in this adjustment; independent full-gate rerun is required and pending, with the failed run retained as evidence.
