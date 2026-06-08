'use client';

export default function SelectionCard({ label, sublabel, selected, onClick, accentColor = '#0A0A0A' }) {
  return (
    <button
      onClick={onClick}
      style={selected
        ? {
            backgroundColor: '#0A0A0A',
            color: accentColor,
            borderColor: '#0A0A0A',
            boxShadow: 'none',
            transform: 'translate(6px, 6px)',
          }
        : {
            backgroundColor: '#FFFFFF',
            color: '#0A0A0A',
            borderColor: '#0A0A0A',
            boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
          }
      }
      className="relative w-full text-left border-2 rounded-none p-5 transition-none"
    >
      {/* Primary label — maximum weight, condensed, zero line-height */}
      <p
        className="uppercase leading-none"
        style={{
          fontFamily: '"Barlow Condensed", "Arial Black", Impact, sans-serif',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          fontSize: '1.5rem',
        }}
      >
        {label}
      </p>

      {/* Sublabel — normal weight, normal tracking, small uppercase */}
      {sublabel && (
        <p
          className="text-xs font-normal tracking-normal uppercase mt-2"
          style={{
            fontFamily: 'Barlow, system-ui, sans-serif',
            color: selected ? `${accentColor}99` : 'rgba(0,0,0,0.4)',
          }}
        >
          {sublabel}
        </p>
      )}
    </button>
  );
}
