// Generated favicon — 512×512 PNG produced at build time by next/og's
// ImageResponse (Satori). No external image tooling required. Source of truth
// is this JSX file, so the icon is fully reproducible and diffable in git.
//
// Designed to remain legible after browsers downsample to 16×16 / 32×32:
// the "FSC" wordmark is heavy and large, and the accent bar adds a single
// distinguishing color cue when the text becomes too small to read.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #1d4ed8 0%, #0f1422 55%, #070a13 100%)',
          color: '#f8fafc',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 220,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          FSC
        </div>
        <div
          style={{
            marginTop: 28,
            width: 96,
            height: 8,
            borderRadius: 4,
            background: '#60a5fa',
            boxShadow: '0 0 24px rgba(96,165,250,0.7)',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
