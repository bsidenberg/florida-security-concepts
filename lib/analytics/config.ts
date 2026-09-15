// Server-safe decision whether the analytics loader renders at all.
export const PLAUSIBLE_SCRIPT_URL_PATTERN = /^https:\/\/plausible\.io\/js\/pa-[A-Za-z0-9_-]+\.js$/;

export type AnalyticsGate = { scriptUrl: unknown; localPreview: boolean; hostedPreview: boolean; production: boolean };

/**
 * The configured script URL only when it is an official `https://plausible.io/js/pa-*.js`
 * URL, the build is production and neither local nor hosted preview; otherwise ''.
 */
export function analyticsScriptSrc(gate: AnalyticsGate): string {
  if (!gate.production || gate.localPreview || gate.hostedPreview) return '';
  return typeof gate.scriptUrl === 'string' && PLAUSIBLE_SCRIPT_URL_PATTERN.test(gate.scriptUrl) ? gate.scriptUrl : '';
}
