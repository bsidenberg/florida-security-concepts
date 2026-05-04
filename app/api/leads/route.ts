import { NextResponse } from 'next/server';
import { validateLead } from '@/lib/leads/validateLead';
import { deliverLead } from '@/lib/leads/leadDelivery';
import type { ApiResponse } from '@/lib/leads/types';

// Lead intake endpoint. Validates server-side, delivers via configured provider.
// Honors the user's note: do not silently discard leads in production.

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BODY_BYTES = 32 * 1024; // 32KB — generous for a contact form, hostile to abuse.

export async function POST(req: Request): Promise<NextResponse<ApiResponse>> {
  // Content-Type guard.
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return NextResponse.json(
      { ok: false, error: 'Expected application/json request body.' },
      { status: 415 }
    );
  }

  // Body size guard.
  const text = await req.text();
  if (text.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: 'Request body too large.' },
      { status: 413 }
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  const result = validateLead(parsed);
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          result.errors._form ||
          'Some fields need attention. Please review and try again.',
        fields: result.errors,
      },
      { status: 400 }
    );
  }

  const delivery = await deliverLead(result.lead);
  if (!delivery.ok) {
    // Configuration / provider error — surface as 503 so the client knows the
    // request was well-formed but the server cannot fulfill it right now.
    return NextResponse.json(
      {
        ok: false,
        error:
          'Lead delivery is temporarily unavailable. Please try again or contact us directly.',
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      message:
        'Request received. A member of the Florida Security Concepts team will be in touch shortly.',
    },
    { status: 200 }
  );
}

// Reject other methods explicitly with 405 so probes/cache don't misbehave.
export async function GET() {
  return NextResponse.json(
    { ok: false, error: 'Method Not Allowed.' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
