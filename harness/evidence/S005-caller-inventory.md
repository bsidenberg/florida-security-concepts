# S-005 first-party caller inventory

Read-only source inspection, 2026-09-14. The only application fetch to /api/leads is components/LeadCaptureForm.tsx. It sends the current UUIDv4 logical request identifier and retains that identifier for unchanged explicit retries. Contact, service, industry and location pages reuse this shared component. No second in-repository lead submission client was found in app/, components/, lib/ or scripts/.

This inventories repository callers only. It does not prove absence of external scripts or third-party API clients, and no customer traffic/log contents were inspected. AM-003 approves rejecting missing IDs for the covered production contract; do not claim deduplication for unknown legacy clients.

README and historical deployment notes describe earlier console/provider behavior and are not current acceptance evidence. DEPLOYMENT.md now has an explicit current-release section; runtime behavior is governed by approved harness and independently verified source.
