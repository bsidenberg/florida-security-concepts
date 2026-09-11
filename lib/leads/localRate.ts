// Local-only abuse state. Never used as a claim of distributed production protection.
const sources = new Map<string, { started: number; ids: Set<string> }>();
export function allowLocalRequest(source: string, requestId: string, now = Date.now()): boolean {
  for (const [key, bucket] of sources) if (now - bucket.started >= 600000) sources.delete(key);
  let bucket = sources.get(source);
  if (!bucket) { bucket = { started: now, ids: new Set() }; sources.set(source, bucket); }
  if (bucket.ids.has(requestId)) return true;
  if (bucket.ids.size >= 20) return false;
  bucket.ids.add(requestId);
  return true;
}
