# S-DELIV-001 draft contract — customer confirmation deliverability and DMARC alignment, 2026-09-15

**Status: DRAFT — NOT AUTHORIZED TO RUN. LOW PRIORITY (downgraded 2026-09-15).** Drafted at Brian's request after the 2026-09-15 live form test, then downgraded the same day: a second owner-run test submission from an external email address was received normally, confirming the quarantine is limited to same-tenant recipients. Ordinary customers are not affected, so this is a documentation and hygiene item, not a launch defect. Running it still needs Brian's go-ahead. Most of the likely remedies are DNS and mail-policy changes, which are owner-only under Rule 7.

## Observation (ground truth)

During the authorized live test, the customer confirmation to brian@floridapolebarn.com was **sent successfully**: Resend reported Delivered, exactly once, with no duplicate from the same-ID replay. The company notification to info@floridasecurityconcepts.com arrived normally at 8:48 PM. The confirmation was then **held tenant-side by the recipient's anti-spoof filtering**.

Owner-confirmed sender authentication in Resend for floridasecurityconcepts.com: domain Verified, DKIM TXT `resend._domainkey` Verified, SPF MX and TXT on the send subdomain Verified, sending enabled.

So: not a send failure, not a Resend configuration gap, and not caused by any code in the S-005/S-006 release. It is inbox placement at the receiving mail tenant. It matters because it affects every customer who receives a confirmation, and a silently quarantined confirmation looks to the customer like the business never replied.

**Scope now established (2026-09-15).** The caveat about the sample proved correct. The held message went to floridapolebarn.com, a domain Brian also controls, whose tenant applies stricter rules to outside mail referencing a familiar display name. A second owner-run test submission using an **external** email address was received normally. The quarantine is therefore confined to same-tenant recipients, and customer confirmations reach ordinary recipients as intended. Investigation step 3 (blast-radius) is largely answered; what remains is optional hardening and documenting the known-good behavior.

## Objective

Determine whether customer confirmations are reliably delivered to ordinary recipients, identify the exact authentication or content reason for any quarantine, and produce an owner-ready remediation plan. Do not change sending behavior or DNS as part of the investigation.

## Authority and boundaries

- Investigation is read-only: public DNS lookups, Resend dashboard and log reading, message-header analysis of messages Brian forwards or pastes, and reading our own email-composition code.
- **No agent action on:** DNS records, Resend domain settings, DMARC policy, mail-tenant rules or quarantine release, sending domain or From address changes, or any test send to a third party. All of those are owner decisions; several are irreversible or affect all mail for the domain.
- Any code change to the confirmation message is a separate, scoped amendment, and must not weaken D-024 (the confirmation does not echo visitor-controlled free text).
- No new paid service, no new vendor account.

## Owners

- **Scout (read-only):** gather ground truth — current published SPF, DKIM and DMARC records for the sending domain and subdomain; the exact From, Return-Path/envelope sender, DKIM `d=` domain and any `Sender`/`Reply-To` used by `lib/leads/providers/resend.ts`; Resend's send logs for both messages in the live test.
- **Staff architect:** analyze alignment and produce the remediation options with trade-offs.
- **Independent safety reviewer:** confirm no proposal weakens authentication, leaks recipient data, or reintroduces visitor-controlled text into the confirmation.
- **Orchestrator:** owner-facing plan and DECISIONS entry.

## Permitted files

`harness/evidence/S-DELIV-001-*`, `harness/DECISIONS.md`, `harness/SESSIONS.md`, and — only if a message-content change is separately approved — `lib/leads/providers/resend.ts` with matching tests. Nothing else.

## Investigation plan

1. **Alignment check.** For the visible From domain, confirm DMARC exists and record its policy (`p=`, `sp=`, `adkim`, `aspf`, `rua`). Confirm the DKIM `d=` domain and the envelope-sender domain each align with the From domain under the relaxed or strict setting in force. Resend "Verified" proves DKIM and SPF for the send subdomain; it does **not** by itself prove DMARC alignment with the From address the app actually uses, which is the single most likely cause here.
2. **Header evidence.** Ask Brian to forward the held confirmation with full headers (or paste `Authentication-Results` and `Received-SPF`). Record the verdicts: `dmarc=`, `dkim=`, `spf=`, plus any filter-specific reason such as a spoof or impersonation verdict. This distinguishes an authentication failure from a pure content or display-name heuristic.
3. **Blast-radius check.** Establish whether ordinary recipients are affected: review Resend logs for bounces, complaints and deferrals since launch; look for any pattern by recipient domain. Report actual numbers, not an assumption.
4. **Content factors.** Review the confirmation's From display name, subject and body for patterns that impersonation filters penalize, especially a display name resembling a person at the recipient's own organization. Note that D-024 already removed visitor-controlled text.
5. **Options for Brian**, each with effect and risk, e.g.: publish or tighten DMARC with a reporting address; align the From domain with the DKIM signing domain; adjust the display name; or accept and document the behavior when it is confined to one tenant's local rules. If `rua` reporting is proposed, state where reports would go and that it reveals mail-flow metadata.

## Acceptance

- Written findings in `harness/evidence/S-DELIV-001-findings.md` stating, with evidence: the published records, the actual alignment result, the recipient-side verdict from real headers, and the measured scope of the problem.
- A remediation plan listing exact DNS changes as text for Brian to apply himself, with the expected effect and the rollback for each.
- Independent safety review signed off.
- No configuration, DNS or code change made by any agent. If the session recommends a code change, it becomes its own session with its own gate.
- The ledger and DECISIONS updated; anything Brian must decide is labeled explicitly.

## Out of scope

Changing mail providers, bulk or marketing sending, warm-up schemes, third-party deliverability services (all would be new cost), releasing the quarantined message on the recipient tenant, and any test send to someone who has not consented.
