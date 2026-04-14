import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Ninauu — Ultralight Gear Manager'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PILLS = ['900+ Gear Database', 'Pack Analysis', 'Trip History']

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0b',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 80px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle radial accent top-right */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-80px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(91,155,213,0.09) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Left content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '660px',
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '100px',
              padding: '7px 18px',
              marginBottom: '44px',
            }}
          >
            <span
              style={{
                color: '#8b8b8e',
                fontSize: '13px',
                letterSpacing: '0.12em',
                fontWeight: 500,
              }}
            >
              ULTRALIGHT GEAR MANAGER
            </span>
          </div>

          {/* App name */}
          <div
            style={{
              fontSize: '104px',
              fontWeight: 700,
              color: '#ededef',
              lineHeight: 1,
              letterSpacing: '-5px',
              marginBottom: '20px',
            }}
          >
            Ninauu
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: '20px',
              color: '#555558',
              letterSpacing: '12px',
              fontWeight: 500,
              marginBottom: '44px',
            }}
          >
            ESSENTIALS, ONLY.
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '20px',
              color: '#8b8b8e',
              lineHeight: 1.6,
              marginBottom: '48px',
            }}
          >
            Track gear weight · Build packing lists · Optimize base weight
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {PILLS.map((label) => (
              <div
                key={label}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  color: '#555558',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: decorative weight display */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          <div
            style={{
              fontSize: '196px',
              fontWeight: 700,
              color: 'rgba(237,237,239,0.07)',
              lineHeight: 1,
              letterSpacing: '-10px',
            }}
          >
            9.8
          </div>
          <div
            style={{
              fontSize: '26px',
              color: 'rgba(237,237,239,0.07)',
              letterSpacing: '4px',
              fontWeight: 500,
              marginTop: '4px',
            }}
          >
            KG BASE
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            left: '80px',
            right: '80px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '24px',
          }}
        >
          <span style={{ color: '#555558', fontSize: '13px' }}>
            ninauu.vercel.app
          </span>
          <span style={{ color: '#555558', fontSize: '13px' }}>
            Free · No ads · Privacy first
          </span>
        </div>
      </div>
    ),
    { ...size },
  )
}
