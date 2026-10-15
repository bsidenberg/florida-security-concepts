'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/leads/attribution-client';

/** Records first and last touch as soon as a visit starts. */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
