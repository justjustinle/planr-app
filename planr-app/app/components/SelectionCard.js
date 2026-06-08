'use client';

export default function SelectionCard({ label, sublabel, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={selected
        ? { backgroundColor: '#0A0A0A', color: '#FFFFFF', boxShadow: 'none', transform: 'translate(4px, 4px)' }
        : { backgroundColor: '#FFFFFF', color: '#0A0A0A', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }
      }
      className="relative w-full text-left border-2 border-black p-5 rounded-none"
    >
      <p className="font-headline text-xl tracking-tighter uppercase font-black leading-none">
        {label}
      </p>
      {sublabel && (
        <p className={`font-body text-xs mt-2 font-medium tracking-wide ${selected ? 'text-gray-400' : 'text-gray-500'}`}>
          {sublabel}
        </p>
      )}
    </button>
  );
}
