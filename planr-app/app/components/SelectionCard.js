'use client';

// accentColor: the background color of the current step screen.
// When selected, the card goes pitch-black with text in the accent color.
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
      <p className="font-headline text-xl tracking-tighter uppercase font-black leading-none">
        {label}
      </p>
      {sublabel && (
        <p
          className="font-body text-xs mt-2 font-medium tracking-wide"
          style={{ color: selected ? `${accentColor}99` : 'rgba(0,0,0,0.45)' }}
        >
          {sublabel}
        </p>
      )}
    </button>
  );
}
