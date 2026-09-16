# FSC local website review

This is the first working preview: the redesigned homepage, shared navigation/footer, and free-assessment journey. Existing service, audience, area and resource URLs remain available; their broad content rewrite follows approval of this preview.

## Open and try

The compiled local preview is running at http://127.0.0.1:3100. A separate Chromium smoke check confirmed homepage HTTP 200, noindex, no analytics, zero external browser requests, and a real assessment saved to a local receipt. Evidence: `evidence/S-002-compiled-smoke.json`.

1. On the homepage, find maintenance, repairs, retrofits and new installations. Check the separate 24/7 emergency phone action without placing a call.
2. Choose **Request a Free Property Assessment**.
3. Enter synthetic details: name `FSC Review Manager`, email `review@example.invalid`, phone `2025550100`, property type `HOA / gated community`, city `Orlando`, service `Preventive maintenance`.
4. Submit. The expected result is **Request received**, a request reference, and a note that it was saved locally. No email or customer database write occurs.
5. Reload the form and submit it empty to inspect field errors. Enter a name, follow the emergency-form link, then use Back/Forward: the name should remain while emergency context changes.

Optional timing/company/message details are under **Add details**. The form requests a conversation; it does not book an appointment or dispatch a technician.

Local JSON receipts are stored under `.fsc-local/receipts/`, named by the displayed request reference. The retained `.claim` file protects a request during interrupted writes. These files are ignored by Git and have no public listing endpoint.

## Restart locally

From this repository in PowerShell, run `node scripts/local-server.mjs --compiled`. It rebuilds the isolated preview and binds to 127.0.0.1:3100. Stop the owned terminal process with Ctrl+C before restarting. Use synthetic details only; email addresses must end in `@example.invalid`.

Production email/database delivery, production retry protection and release approval remain separate work. Sentinel monitoring is not advertised as an available service. This preview does not establish production deliverability or full release acceptance.
