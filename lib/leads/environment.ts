/** A hosted preview must never exercise live delivery, analytics, or indexing. */
export function isHostedPreview(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.VERCEL || env.VERCEL_ENV || env.VERCEL_TARGET_ENV) &&
    (env.VERCEL_ENV !== 'production' || Boolean(env.VERCEL_TARGET_ENV && env.VERCEL_TARGET_ENV !== 'production'));
}
