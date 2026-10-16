import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const APEX_HOST = 'floridasecurityconcepts.com';
export const WWW_HOST = 'www.floridasecurityconcepts.com';

/**
 * Vercel’s domain setting 308s every apex URL to www before the app runs.
 * This is the app rule for when that request reaches Next: serve /llms.txt
 * on the apex with 200, and keep every other apex path on the www canonical.
 */
export function apexLlmsDecision(host: string, pathname: string): 'serve' | 'redirect-www' | 'pass' {
  const bare = host.split(',')[0]?.trim().toLowerCase().replace(/:\d+$/, '') ?? '';
  if (bare !== APEX_HOST) return 'pass';
  if (pathname === '/llms.txt') return 'serve';
  return 'redirect-www';
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('x-forwarded-host') || request.nextUrl.hostname || '';
  const decision = apexLlmsDecision(host, request.nextUrl.pathname);
  if (decision !== 'redirect-www') return NextResponse.next();
  const url = request.nextUrl.clone();
  url.protocol = 'https:';
  url.hostname = WWW_HOST;
  url.port = '';
  return NextResponse.redirect(url, 308);
}
