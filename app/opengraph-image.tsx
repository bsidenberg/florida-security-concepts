// Typographic share card. No photograph.
// Satori requires display:flex on every element that has more than one child.

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt =
  'Florida Security Concepts. Gates, access control, and cameras. Based in Clermont, Lake County.';
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
          background: '#001A4A',
          color: '#F4F6FA',
          padding: '72px 88px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              background: '#BF0A30',
            }}
          />
          <div
            style={{
              fontSize: 22,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#D6DEEE',
            }}
          >
            Florida Security Concepts
          </div>
        </div>
        <div style={{ display: 'flex', flex: 1 }} />
        <div
          style={{
            fontSize: 74,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            maxWidth: 980,
          }}
        >
          Gates, access control, and cameras.
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 30,
            lineHeight: 1.4,
            color: '#C7D0E4',
            maxWidth: 860,
          }}
        >
          Repair, maintenance, and new installations. Based in Clermont, Lake County.
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginTop: 48,
          }}
        >
          <div style={{ width: 42, height: 3, background: '#BF0A30' }} />
          <div style={{ fontSize: 22, letterSpacing: '0.04em', color: '#F4F6FA' }}>
            floridasecurityconcepts.com
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
