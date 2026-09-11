# S-001 independent code and isolation review

Date: 2026-09-11. Reviewer: foundation_builder, assigned an independent review of code authored by foundation_gate and foundation_tests. The reviewer did not author or repair the scripts, tests, manifest or CI reviewed here. Package/lockfile/ignore changes authored by this reviewer are explicitly excluded and separately reviewed by the parent.

## Scope and disposition

Reviewed scripts/verify.ps1, scripts/local-server.mjs, scripts/network-guard.cjs, harness/verification.json, .github/workflows/verify.yml, Vitest/Playwright configurations and tests under tests/. No unresolved code or isolation blocker remains for the S-001 baseline. This is a source review, not a passing machine-verification claim. The independent verifier must still run the complete gate and preserve its raw exit-zero log before session acceptance.

## Findings and repairs checked

- Missing network guard initially allowed unguarded children. The runner now requires the guard before executing checks.
- Forbidden server requests initially only threw an exception that application code could catch. The guard now records a categorical violation marker; the runner rejects that marker even if the child exits zero. It records no destination, payload or credential.
- Browser external requests initially aborted silently. The browser tests now also fail if an external request is attempted and verify analytics scripts are absent.
- The runner now logs and requires Node 24, requires report contracts for test suites, rejects zero/failed/pending/todo/skipped reports and requires a fresh build artifact.
- The launcher rejects hosted markers before inherited environment sanitation, forces console-only baseline delivery, blanks provider values and analytics, and binds 127.0.0.1. Next starts inside the owned launcher process; Playwright setup uses direct Node spawn without a shell and rejects an occupied test port.
- Added tests cover missing reports, skipped suites, timeout cleanup preserving an unrelated process, categorical network blocking and inherited plus environment-file isolation. The environment-file test creates its own synthetic directory and invokes the real Next environment loader through a fake startup module; it does not read real secret files.

## Evidence and limits

The tests include real current-site validation/endpoint behavior, an independent 38-route inventory, browser navigation and synthetic console receipt checks. Gate fixture projects test failure honesty and do not replace the real-site suites. Final execution results belong to the verifier's raw log, not this report.

The S-001 next-dev compiler retains an exact-host exception for fonts.googleapis.com and fonts.gstatic.com because the current application uses next/font/google. Provider and analytics destinations remain blocked. This is documented baseline behavior, not permission for arbitrary external requests.

Current application console logging is accepted only for synthetic baseline data under the approved S-001 contract. This review does not certify production lead delivery, production retry protection, a durable local receipt adapter, or S-002 website behavior. No production configuration, customer data, credentials, deployment or live communication was used in this review. Existing application safety changes remain assigned to later sessions.

Recommended next role: independent verifier, after implementers finish their current test/debug run. Material subsequent script or isolation changes require renewed review.
