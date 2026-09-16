# H-000 — Harness adversarial planning review

Date: 2026-09-11. Scope: documentation/plan only. Reviewer separation: read-only scout reviewed HARNESS while the orchestrator drafted other planning files, followed by a separate orchestrator consistency pass. This is not application verification or a safety certification using the unavailable requested models.

## Independent reconnaissance findings

No test scripts or project test suites found. Existing runner internally uses cmd, skips absent tests and can collide log names. No durable production idempotency: API always dispatches, Resend sends lack keys, Prime adapter explicitly lacks uniqueness enforcement. Current local mode selection can use live configured providers; console logs contact data. Shared validation and uncontrolled defaults differ from approved spec. Existing primary/secondary delivery behavior must be preserved. Git branch and prior untracked work were inspected read-only.

## Adversarial findings and dispositions

| Finding | Risk | Disposition |
|---|---|---|
| Local receipt cannot prove production duplicate requirement originally placed before slice | False global AC-06 acceptance and silent scope change | AM-001 explicitly changes acceptance sequencing, cites affected SPEC clauses and requires Brian's harness approval; global AC-06 stays open at S-005 |
| Removing inherited credentials does not prevent Next reloading environment files | Live delivery possible from supposedly safe local tests | C-03 mandates exclusive local dispatch with no live fallback regardless of loaded credentials; mode mismatch fails before provider construction; synthetic env-file/inheritance/stale-build tests required |
| Digest/UUID/expiry details too vague | Divergent retry behavior and accidental duplicate/conflict | C-03 now fixes normalized fields/order, empty/default values, lowercase UUIDv4, SHA-256, excluded attribution and server acceptedAt clock; partial/corrupt files remain pending/unknown, no takeover |
| Shared C-01/C-02 changes could silently alter production semantics in slice | New timeout/retry states before real idempotency | C-04 limits early shared changes to validation/envelope/redaction/config safety; local pending/rate/unknown states are scoped to local mode; production timeout/duplicate behavior remains S-005 |
| ID-less callers weaken duplicate promises | Legacy retries outside guarantees | Explicitly disclose limitation; S-005 must inventory callers and migrate/reject uncovered callers or obtain a compatibility amendment before global AC-06 |
| Test gate could be made green through missing/empty suites | Machine log exists without meaningful verification | Required manifest, nonzero counts, unknown-session/missing-suite/failing-child/zero-test self-tests and independent verifier |
| Future maintenance nav could link to unbuilt page before preview | Broken core navigation at first gate | Temporary homepage anchor; real maintenance destination created in S-003 |
| Requested named models absent | Misrepresented routing or silent policy substitution | OD-01 explicit current-Codex independent-role proposal; implementation and safety routing not started |

## Orchestrator consistency pass

- SPEC approval metadata matches Brian's explicit approval; substantive SPEC requirements retained.
- Harness is DRAFT, not marked approved by inference.
- S-001 is test foundation; S-002 is real local journey; S-003/S-004 wait for preview acceptance.
- S-005 cannot silently add a production datastore or perform SQL; owner amendment and safe actual-technology tests required.
- Provider/analytics names are inventoried without values. Receipt route/listing is explicitly excluded.
- No new paid accounts, framework replacement, live communications, production changes or global hook changes are authorized.
- H-000 documentation completion does not claim Rule 5 implementation acceptance. No raw verify log is fabricated.
- All required owners, file boundaries, acceptance criteria, commands and evidence types are specified by session; unknown production choices remain explicit gates.

## Review outcome

Final independent consistency review found no blocker to presenting the harness. Its two follow-up findings were resolved: S-001 now explicitly requires independent safety review of launcher/network/credential isolation, and S-005 dependencies consistently require implementation-relevant production contract/privacy decisions to be resolved before code. Publication approval and real receipt checks remain release gates.

Ready to present for **harness approval**, subject to explicit acceptance of AM-000/AM-001, proposed local/test infrastructure and OD-01 model routing. No implementation started and no application pass claimed. Affected production decisions remain blocked until real configuration and schema are known. Required independent code/safety reviews and machine verification occur during implementation, not this planning review.
