// Generated Open Graph / Twitter card preview — 1200×630 PNG produced at
// build time by next/og. Next.js automatically wires this asset into the
// global metadata.openGraph.images and metadata.twitter.images, so no
// additional configuration is needed in app/layout.tsx.
//
// Design notes:
//   - Same dark blue gradient family as the favicon and apple icon.
//   - Layout: eyebrow row (brand + region), spacer, headline, subline,
//     URL footer row. Tested in Slack, iMessage, Twitter, LinkedIn, and
//     Facebook preview formats — all crop within the safe area.
//   - Satori (the renderer behind ImageResponse) requires display: 'flex'
//     on every element with multiple children; the JSX below conforms.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt =
  'Florida Security Concepts — Advanced Gates, Access Control, and Video Surveillance for Central Florida and Tampa Bay.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg, #1d4ed8 0%, #0f1422 50%, #070a13 100%)',
          color: '#e2e8f0',
          fontFamily: 'sans-serif',
          padding: '72px 88px',
        }}
      >
        {/* eyebrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 20,
            fontFamily: 'monospace',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#60a5fa',
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              background: '#60a5fa',
              boxShadow: '0 0 16px rgba(96,165,250,0.7)',
            }}
          />
          <div>Florida Security Concepts · Central FL · Tampa Bay</div>
        </div>

        {/* spacer to push content down */}
        <div style={{ display: 'flex', flex: 1 }} />

        {/* headline */}
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            color: '#f8fafc',
            maxWidth: 980,
          }}
        >
          Advanced Gates · Access Control · Video Surveillance
        </div>

        {/* subline */}
        <div
          style={{
            marginTop: 32,
            fontSize: 30,
            color: '#94a3b8',
            maxWidth: 950,
            lineHeight: 1.4,
          }}
        >
          Security systems for communities, commercial properties, storage
          facilities, and estates.
        </div>

        {/* URL footer row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginTop: 48,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: '#60a5fa',
            }}
          />
          <div
            style={{
              fontSize: 22,
              color: '#cbd5e1',
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
            }}
          >
            floridasecurityconcepts.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
