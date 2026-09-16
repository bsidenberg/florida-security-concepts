# Florida Security Concepts — Verification evidence

Tier 3. Evidence is tied to a specific session, source revision and dirty-file state. Documentation review is not application verification.

## Naming and contents

- Raw gate logs: S-XXX-verify-<timestamp-with-milliseconds>-<run-id>.log. The verifier's process output creates these; never author or edit a passing result by hand. Preserve failed logs.
- Unit/browser reports: session/run-specific subdirectories, with actual test counts, skipped/failure counts and environment/tool version.
- Independent code/safety reviews: identify reviewer role, scope, actionable findings, disposition and re-review where needed. A builder never supplies its own independent acceptance.
- Screenshots/recordings: source/URL/viewport/run identified; synthetic data only. Desktop and phone evidence accompany human-visible acceptance; no fabricated monitoring/proof content.
- Handoffs: objective, exact files, contract changes, actual commands/exit/log paths, limitations, approvals and next role in SESSIONS.

The gate rejects absent required reports, zero-test suites and missing raw output. A report saying that tests passed without the corresponding machine log cannot accept a session.

## Data boundaries

Never store secrets, real leads, resident information, access credentials, live provider response bodies or environment dumps here. Do not copy the owner's monitoring PDF or unrelated documents into release evidence. Local synthetic receipts and browser traces may contain test-only values; selectively include only what proves the criterion. Full receipt datasets, build output and scratch files stay ignored outside this directory.

No automatic broad cleanup. Preserve session failure evidence through review. Future deletion/retention actions follow owner policy and verified-path safeguards; this evidence convention does not define customer-data retention.

## Current records

- website-discovery.md: inspected source/live behavior and limitations. It is not a session verification log.
- harness-review.md: adversarial planning review. It is not application code review or final safety certification.
- No implementation session has a passing raw verify log yet. The first such evidence must be created by S-001's actual gate.
