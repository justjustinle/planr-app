'use client';

export default function SelectionCard({ label, sublabel, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={selected
        ? {
            backgroundColor: '#0A0A0A',
            color: '#FFFFFF',
            borderColor: '#0A0A0A',
            boxShadow: 'none',
            transform: 'translate(5px, 5px)',
          }
        : {
            backgroundColor: '#FFFFFF',
            color: '#0A0A0A',
            borderColor: '#0A0A0A',
            boxShadow: '5px 5px 0px 0px rgba(0,0,0,1)',
          }
      }
      className="relative w-full text-left border-2 rounded-none p-5 transition-none cursor-pointer"
    >
      <p
        style={{
          fontFamily: '"Barlow Condensed", "Arial Black", Impact, sans-serif',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 0.85,
          textTransform: 'uppercase',
          fontSize: '2rem',
          margin: 0,
        }}
      >
        {label}
      </p>
      {sublabel && (
        <p
          style={{
            fontFamily: 'Barlow, system-ui, sans-serif',
            fontWeight: 400,
            letterSpacing: '0em',
            fontSize: '0.75rem',
            marginTop: '6px',
            marginBottom: 0,
            color: selected ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.55)',
            textTransform: 'none',
            fontStyle: 'italic',
          }}
        >
          {sublabel}
        </p>
      )}
    </button>
  );
}
