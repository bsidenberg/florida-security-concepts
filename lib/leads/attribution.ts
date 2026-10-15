// First-touch campaign fields. The CRM intake allowlist (WEBSITE_FIELD_LIMITS)
// accepts the existing ValidatedLead keys, including utmSource, utmMedium,
// utmCampaign, and referrer. It does not have columns for utm_term,
// utm_content, gclid, fbclid, or the landing page. Those are removed from the
// CRM body and appended to `message`, which the intake stores as notes.

export const ATTRIBUTION_NOTE_FIELDS = [
  ['utmTerm', 'utm_term'],
  ['utmContent', 'utm_content'],
  ['gclid', 'gclid'],
  ['fbclid', 'fbclid'],
  ['landingPage', 'landing_page'],
] as const;

const NOTE_LIMIT = 2000;

export function attributionNotesBlock(payload: Record<string, unknown>): string {
  const lines: string[] = [];
  for (const [key, label] of ATTRIBUTION_NOTE_FIELDS) {
    const value = payload[key];
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (trimmed) lines.push(`${label}: ${trimmed}`);
  }
  return lines.length ? ['[Attribution]', ...lines].join('\n') : '';
}

/**
 * CRM wire lead. Returns the stored payload unchanged when none of the
 * missing columns are present, so key order and bytes stay identical.
 * Otherwise copies the payload, drops those keys, and appends a structured
 * notes block to `message`.
 */
export function crmIntakeLead(payload: Record<string, unknown>): Record<string, unknown> {
  const block = attributionNotesBlock(payload);
  if (!block) return payload;
  const lead: Record<string, unknown> = { ...payload };
  for (const [key] of ATTRIBUTION_NOTE_FIELDS) delete lead[key];
  const message = typeof lead.message === 'string' ? lead.message.trim() : '';
  const combined = message ? `${message}\n\n${block}` : block;
  if (combined.length <= NOTE_LIMIT) {
    lead.message = combined;
  } else if (block.length >= NOTE_LIMIT) {
    lead.message = block.slice(0, NOTE_LIMIT);
  } else {
    const room = NOTE_LIMIT - block.length - 2;
    lead.message = `${message.slice(0, room)}\n\n${block}`;
  }
  return lead;
}
