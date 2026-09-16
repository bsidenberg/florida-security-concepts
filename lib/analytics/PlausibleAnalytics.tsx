'use client';
import { useContext, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { installPlausible } from './plausible';
import { sendPageview, trackClick } from './events';
import { LocalPreviewContext } from '@/components/LocalPreviewContext';

/**
 * Rendered by the root layout only when analytics is allowed (see config.ts).
 * Renders no markup. Installs privacy options before loading the pa- script,
 * sends one sanitized manual pageview per pathname, and tracks allowlisted
 * `data-fsc-event` links through a single delegated listener.
 */
export function PlausibleAnalytics({ src }: { src: string }) {
  const pathname = usePathname();
  const localPreview = useContext(LocalPreviewContext);
  const lastPathname = useRef<string | null>(null);
  useEffect(() => {
    // Defense in depth: the layout already omits this component in local preview.
    if (localPreview || !installPlausible(src)) return;
    const onClick = (event: MouseEvent) => {
      try {
        if (event.type === 'auxclick' && event.button !== 1) return;
        const link = event.target instanceof Element ? event.target.closest('[data-fsc-event]') : null;
        if (link) trackClick(link.getAttribute('data-fsc-event'), link.getAttribute('data-fsc-placement'), link.getAttribute('href'));
      } catch { /* swallowed */ }
    };
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) sendPageview(window.location.href); };
    document.addEventListener('click', onClick, true);
    document.addEventListener('auxclick', onClick, true);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('auxclick', onClick, true);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [src, localPreview]);
  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    sendPageview(window.location.href);
  }, [pathname]);
  return null;
}
