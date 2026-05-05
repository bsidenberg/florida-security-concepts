// Generated Apple touch icon — 180×180 PNG produced at build time.
// iOS adds its own rounded-corner mask, so this asset is full-bleed and dark.
// Mirrors app/icon.tsx visually so the brand is consistent across surfaces.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
            fontSize: 78,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}
        >
          FSC
        </div>
        <div
          style={{
            marginTop: 10,
            width: 36,
            height: 4,
            borderRadius: 2,
            background: '#60a5fa',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
