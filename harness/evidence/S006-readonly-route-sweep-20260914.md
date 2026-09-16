# Read-only compiled-preview route sweep

Observed 2026-09-14, 18:28:33–18:28:38 UTC, Chromium 153.0.8010.12. Target: existing compiled preview `http://127.0.0.1:3100`. Current checkout HEAD at inspection: `4d481d2f6d0635a2cec0602fc2fa8076c555a3a7`; running artifact was supplied by the parent, not rebuilt by this check.

Command: `node --experimental-strip-types .fsc-test/release-route-sweep.mjs`, exit 0. Helper is ignored scratch, not application or test-suite implementation. Raw results: [S006-readonly-route-sweep-20260914.json](S006-readonly-route-sweep-20260914.json).

## Results

- 38/38 expected current routes returned HTTP 200 with one nonempty H1, title and description.
- Titles and descriptions were unique across the route inventory.
- Every page had one expected www canonical; three synthetic query cases retained query-free canonicals.
- All 140 JSON-LD blocks parsed successfully; inspected FSC URL/@id values used the canonical origin and existing page paths.
- 107 distinct internal link targets had no failing status or missing named anchor. Query variants share their known page status; this does not revalidate every prefill combination.
- Sitemap contained all 38 expected current routes with no extras. Parent explicitly stated S-003/S-004 content additions are deferred for this launch scope.
- Zero blocked external browser request attempts; no form submissions, telephone actions or external navigation.
- No actionable route/canonical/schema-syntax/link/anchor defects found by this sweep.

## Limits

This is supporting read-only runtime evidence, not the S-006 gate or full SEO/schema certification. JSON-LD syntax and FSC URL consistency do not prove the truth of business claims or Google eligibility. Current preview is intentionally noindex and analytics-disabled; production indexing, analytics privacy and delivery remain separate checks. No performance, physical-device, screen-reader or cross-browser claim is made. Existing server was left running and no application/configuration files were changed.
