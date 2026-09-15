# S-CI-001 draft contract — real PostgreSQL in GitHub Actions, 2026-09-15

**Status: DRAFT — NOT AUTHORIZED TO RUN.** Brian chose to push `codex/website-spec` with an expected red CI and to have this follow-up drafted only (2026-09-15). Running it needs Brian's go-ahead. It changes CI provisioning, so it's recorded as a harness amendment (Rule 8) before any workflow edit.

## Problem (ground truth at drafting)

- `.github/workflows/verify.yml` runs on every `codex/**` push and on pull requests. It uses `windows-latest` and `pwsh`, runs `npm ci`, installs Chromium only, then runs `./scripts/verify.ps1 -SessionId S-001`.
- Since S-005, `test:gate` includes suites that start a real PostgreSQL 17 cluster through `tests/helpers/postgres.ts`: admission-rate-limit, coordinator-receipts, isolation-acl, postgres-reliability, receipt-lifecycle and schedule-health. `requireRuntime()` **throws, and never skips,** when `.fsc-test/pgsql/runtime/pgsql/bin/{postgres,initdb,pg_ctl}.exe` are absent. That runtime is a local, gitignored download (D-018), so on a CI runner `test:gate` fails and the gate exits non-zero.
- Branch protection on `main` currently requires no status checks (read-only `gh api …/branches/main/protection`, 2026-09-15). A red run is visible but doesn't block a merge. It still erodes trust in CI and needs to be fixed.
- The workflow still names `S-001`, which runs the same six stages as S-005, not the S-006 `test:release` stage.

## Objective

Make the CI gate honest and green on the same real-PostgreSQL semantics as the local gate. Don't skip, mock, or lower the test floor. The fix is to provision the runtime, never to make `requireRuntime()` lenient.

## Authority and boundaries

- Extends D-018 (pinned official portable PostgreSQL 17 test runtime) from the local machine to CI runners. It stays test-only and synthetic, bound to loopback. No production access, secrets, paid services or new vendor accounts. GitHub-hosted runner minutes on this repo's existing plan only; if that plan would incur new cost, stop and ask Brian.
- No change to application code, SQL drafts, tests' assertions, `scripts/verify.ps1` semantics, or `harness/verification.json` session floors.
- No recursive deletion. Cluster data directories stay under the runner's ephemeral workspace.

## Owners

- **Scout (read-only):** record the exact official EDB download URL for the same PostgreSQL 17.11 win-x64 portable ZIP used locally (archive SHA-256 `4b8db0930c38f6ef845db919551dedda3b6b845aeb0927b3d79a6e8e9e4537cf`, vendor file id 1260491 per the handoff). The URL is not currently written in the harness. Confirm the runner's image has no conflicting service on the chosen loopback ports.
- **Builder:** owns `.github/workflows/verify.yml` and an optional helper `scripts/ci-provision-postgres.ps1`.
- **Test-guard:** proves the gate fails loudly when provisioning is removed (negative check), and adds nothing that weakens existing suites.
- **Safety reviewer:** reviews supply-chain pinning (hash check before extraction), network use and artifact contents (no secrets, no synthetic data dumps beyond existing evidence).
- **Verifier:** CI run evidence plus a local gate run.

## Permitted files

`.github/workflows/verify.yml`, `scripts/ci-provision-postgres.ps1` (new), `harness/DECISIONS.md` (amendment entry), `harness/SESSIONS.md` (ledger), `harness/ENVIRONMENT.md` (download source, names only), `harness/evidence/S-CI-001-*`. Everything else is out of scope.

## Required design

1. Download the pinned ZIP from the official EDB URL. **Verify SHA-256 equals the D-018 hash before extraction**; on mismatch, fail the job. Extract to `.fsc-test/pgsql/runtime` so `RUNTIME_BIN` resolves unchanged.
2. Cache the verified ZIP with `actions/cache`, keyed by that hash. Re-verify the hash after a cache restore.
3. Install the browsers the chosen session needs. S-001 through S-005 need only Chromium. If CI moves to `-SessionId S-006`, also install Firefox and WebKit and raise the job timeout. Document the runtime cost first (the release suite takes about 10 min locally, and Lighthouse runs 3 × 6 routes).
4. Session ID: change CI to `-SessionId S-005`, the current six-stage floor with real persistence. Keep S-006/`test:release` as a separate manual `workflow_dispatch` job only if Brian wants it. Record the choice in DECISIONS.md.
5. Keep the existing `if: always()` evidence upload. Add `.fsc-test/*.json` reports only if they contain no synthetic cluster data beyond counts.
6. The network guard stays in force during the gate. The download step runs before the gate, outside the guarded process.

## Acceptance

- A GitHub Actions run on a `codex/**` branch: the gate step exits 0 with all six stages, and the `test:gate` count equals the local floor (≥166 at S-006).
- Negative proof: a scratch branch or run with the provisioning step disabled fails `test:gate` with the `PostgreSQL 17 test runtime missing` error. Never a skip.
- A tampered hash fails before extraction.
- A local `scripts/verify.ps1 -SessionId S-CI-001` exits 0 with a raw log in `harness/evidence/`. Register `S-CI-001` in `verification.json` with the standard six-stage floor.
- Safety review clears pinning and artifact contents. The ledger is updated. The PR includes the CI run URL and the local log path.

## Out of scope

Requiring the check in branch protection (Brian's setting), production Supabase, pg_cron in CI (the portable runtime lacks it, and the schedule tests already simulate it), and any change to test assertions.
