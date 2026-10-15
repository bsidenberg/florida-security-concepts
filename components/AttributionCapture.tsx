'use client';

import { useEffect } from 'react';
import { captureFirstTouch } from '@/lib/leads/attribution-client';

/** Records first-touch campaign fields as soon as a visit starts. */
export function AttributionCapture() {
  useEffect(() => {
    captureFirstTouch();
  }, []);
  return null;
}
