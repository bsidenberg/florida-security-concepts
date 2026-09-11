# Florida Security Concepts — Specialist roles and handoffs

Tier 3. Harness v1.0 draft. Only explicit session scope grants implementation authority. No agent may expand it silently. Agents share one checkout: preserve others' edits and stage only owned changes.

## Active role roster

| Role | Authority | Permitted work | Prohibited | Escalation |
|---|---|---|---|---|
| Orchestrator | Enforce approved SPEC/harness, choose dependency-valid session, maintain decisions and ledger | Harness docs, coordination, scoped Git checkpoints, evidence collection | Writing application code or substituting own claims for verifier | Missing contract, owner decision, approval gate |
| Scout | Establish read-only ground truth before a session | Inspect nonsecret source/config/status; report paths and facts | Writes, secret reads, live inquiries | Mismatch or access denial |
| Staff architect | Define contracts and formal amendments | Harness design and schema drafts only after required authorization | Production schema application, silent architecture substitution | Material data/storage/security/cost change |
| Builder | Implement approved session contract | Only application/config/helper paths assigned in SESSIONS | Test weakening, production deploy, self-review acceptance | Insufficient contract or owner boundary |
| Test-guard | Write and run meaningful tests, enforce honest floor | tests/, test configs, fixture/report helpers; coordinate package scripts with builder | Changing product behavior to satisfy tests, ignoring required failures, fabricated output | Untestable requirement or unsafe test isolation |
| Verifier | Execute scripts/verify.ps1 for exact session and report raw evidence | Execute gate; collect source revision/log paths/exit; no repairs | Application/test edits or declaring pass without exit-zero raw log | Gate failure or evidence mismatch |
| Independent code reviewer | Review changes against contracts/spec | Read diffs/source/tests and write review report | Reviewing own implementation; accepting unverified behavior | Scope drift, regressions, inadequate test evidence |
| Independent safety reviewer | Review data, logging, credentials, tenant boundaries and irreversible design | Read-only technical inspection and safety-review evidence | Running production SQL, approving own implementation, weakening controls | Security/privacy violation or owner-only action |

Deployment preparation is an orchestrator responsibility; no autonomous production-deployer role. No unused specialist roster entries. Builder may implement frontend and backend within assigned files; independent test and review roles remain separate.

## Model routing and availability

Brian's standing convention requests Opus/Fable for safety-critical design and Sonnet for implementation. Those named models are not available through the current session's model list. Do not claim to use them or silently reinterpret the names.

OD-01 proposes the current Codex model with separate specialist agents and independent safety review for this project. Brian's explicit harness approval must resolve that alternative, or work must move to an environment that supplies the requested models before affected implementation/safety work. General reconnaissance and planning critique performed here are not represented as that safety certification.

## Review and repair sequence

1. Scout reports current state; orchestrator checks dependencies and permitted files.
2. Builder implements; test-guard develops behavioral tests independently and checks network/data isolation.
3. Independent reviewer reviews code, tests, claims and contract coverage; safety reviewer reviews relevant sensitive paths.
4. Builder repairs reported defects without weakening tests or scope. Test-guard validates repairs.
5. Verifier runs the session gate and returns raw log/exit, not a narrative-only assertion.
6. Orchestrator records actual handoff/limitations. UI preview is presented to Brian where required; broad build-out stays blocked until his approval.

Reviewers never become the sole implementer of their own findings. A new independent pass is required if roles change. A failing gate after review requires repair and re-verification; material repairs also require renewed independent review.

## Required handoff format

Every completed unit records: session and role; assigned objective; work actually completed; exact files changed; contracts affected; tests added/run with exit and counts; raw log/report/screenshot paths; assumptions; unresolved issues; risks; architecture deviations; approval status; recommended next role. Never include secret values or actual lead details.

Planning H-000 is reported as documentation prepared/reviewed, not as an accepted implementation session. S-001 onward requires the actual machine gate. Agent assertion alone is not evidence.
