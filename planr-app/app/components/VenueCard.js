'use client';
import { useState } from 'react';

const DISPLAY = {
  fontFamily: '"Barlow Condensed", "Arial Black", Impact, sans-serif',
  fontWeight: 900,
  letterSpacing: '-0.04em',
  lineHeight: 0.9,
  textTransform: 'uppercase',
};

const META_SMALL = {
  fontFamily: 'Barlow, system-ui, sans-serif',
  fontWeight: 400,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  fontSize: '9px',
};

function IndexCardFallback({ venue }) {
  const headline = venue.specialty || venue.cuisine_type || venue.activity_type || venue.name;
  const footer = venue.pro_tip
    ? venue.pro_tip.split(' ').slice(0, 8).join(' ') + (venue.pro_tip.split(' ').length > 8 ? '…' : '')
    : venue.neighborhood || '';

  return (
    <div style={{
      height: '280px',
      backgroundColor: '#1A1A1A',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative ruled lines */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: '#F8E98A' }} />

      {/* Top metadata tag */}
      <p style={{
        ...META_SMALL,
        color: 'rgba(255,255,255,0.5)',
        margin: 0,
        letterSpacing: '0.2em',
      }}>
        [ IMAGERY UNRELEASED - TRUST THE INDEX. ]
      </p>

      {/* Hero text */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0' }}>
        <p style={{
          ...DISPLAY,
          fontSize: 'clamp(1.6rem, 6vw, 2.4rem)',
          color: '#FFFFFF',
          textAlign: 'center',
          margin: 0,
          lineHeight: 0.88,
        }}>
          {headline}
        </p>
      </div>

      {/* Bottom atmosphere line */}
      <p style={{
        fontFamily: 'Barlow, system-ui, sans-serif',
        fontWeight: 400,
        fontSize: '11px',
        color: 'rgba(255,255,255,0.45)',
        textAlign: 'center',
        margin: 0,
        fontStyle: 'italic',
        letterSpacing: '0.02em',
      }}>
        {footer}
      </p>

      {/* Decorative bottom rule */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}

export default function VenueCard({ venue, isSelected, onToggle }) {
  const [imgFailed, setImgFailed] = useState(!venue.hero_image);

  return (
    <div
      onClick={onToggle}
      style={{
        position: 'relative',
        overflow: 'hidden',
        border: isSelected ? '5px solid #0A0A0A' : '2px solid #0A0A0A',
        cursor: 'pointer',
        boxShadow: isSelected ? 'none' : '5px 5px 0px 0px rgba(0,0,0,1)',
        transform: isSelected ? 'translate(5px,5px)' : 'none',
        transition: 'none',
        backgroundColor: '#1A1A1A',
      }}
    >
      {/* Image or index card fallback */}
      <div style={{ position: 'relative', height: '280px' }}>
        {!imgFailed ? (
          <>
            <img
              src={venue.hero_image}
              onError={() => setImgFailed(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              alt=""
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }} />
          </>
        ) : (
          <IndexCardFallback venue={venue} />
        )}
      </div>

      {/* Info overlay (same for both image and fallback) */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        right: '72px',
        color: '#FFF',
      }}>
        <h3 style={{ ...DISPLAY, fontSize: '1.6rem', margin: 0 }}>{venue.name}</h3>
        <p style={{
          fontFamily: 'Barlow, system-ui, sans-serif',
          fontSize: '0.7rem',
          opacity: 0.7,
          marginTop: '4px',
          marginBottom: 0,
        }}>
          {venue.neighborhood}{venue.logistics_badge ? ` · ${venue.logistics_badge}` : ''}
        </p>
      </div>

      {/* Select button */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        width: '44px',
        height: '44px',
        backgroundColor: isSelected ? '#0A0A0A' : 'rgba(255,255,255,0.9)',
        border: '2px solid #0A0A0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 900,
        fontSize: '1.2rem',
        color: isSelected ? '#FFF' : '#0A0A0A',
      }}>
        {isSelected ? '✓' : '+'}
      </div>
    </div>
  );
}
