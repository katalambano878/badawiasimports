import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "BADAWIA'S IMPORTS — Quality Imports Across Ghana";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #060E28 0%, #0D1B45 60%, #1a2d6e 100%)',
          fontFamily: 'serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Red accent bar */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: '#CC1414', display: 'flex' }} />

        {/* Cyan top stripe */}
        <div style={{ position: 'absolute', top: 0, left: 8, right: 0, height: 4, background: '#1ABCDF', display: 'flex' }} />

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 80px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#CC1414', marginRight: 12 }} />
            <span style={{ color: '#1ABCDF', fontSize: 15, letterSpacing: '0.25em', textTransform: 'uppercase', fontFamily: 'sans-serif', fontWeight: 700 }}>
              Quality Imports Across Ghana
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#FFFFFF', fontSize: 68, fontWeight: 900, lineHeight: 1.0, marginBottom: 4, letterSpacing: '-1px' }}>
              BADAWIA&apos;S
            </span>
            <span style={{ color: '#1ABCDF', fontSize: 52, fontWeight: 700, lineHeight: 1.0, letterSpacing: '4px' }}>
              IMPORTS
            </span>
          </div>

          <div style={{ width: 80, height: 3, background: '#CC1414', marginTop: 24, marginBottom: 24, display: 'flex' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 20, fontFamily: 'sans-serif', fontWeight: 500 }}>
              📍 Tamale &amp; Accra, Ghana
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 17, fontFamily: 'sans-serif', fontWeight: 400 }}>
              📞 0539 781 532 &nbsp;·&nbsp; @badawias_imports1
            </span>
          </div>
        </div>

        <div style={{
          width: 340,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(26,188,223,0.08)',
          borderLeft: '1px solid rgba(26,188,223,0.25)',
          padding: 40,
          gap: 16,
        }}>
          {[
            { emoji: '✈️', label: 'Air Freight' },
            { emoji: '🚢', label: 'Sea Freight' },
            { emoji: '🚚', label: 'Fast Delivery' },
          ].map((item) => (
            <div key={item.label} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              <span style={{ fontSize: 22 }}>{item.emoji}</span>
              <span style={{ color: '#FFFFFF', fontSize: 15, fontFamily: 'sans-serif', fontWeight: 600 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
