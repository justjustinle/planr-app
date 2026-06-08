'use client';

export default function SelectionCard({ emoji, label, sublabel, selected, onClick, accent }) {
  // accent: optional bg color when selected (e.g. 'orange', 'cobalt', 'forest')
  const accentMap = {
    orange: { bg: '#FF5C00', text: '#0A0A0A', border: '#FF5C00' },
    cobalt: { bg: '#0038FF', text: '#FFFFFF',  border: '#0038FF' },
    forest: { bg: '#0A3D2A', text: '#FFFFFF',  border: '#0A3D2A' },
  };
  const ac = accent ? accentMap[accent] : null;

  return (
    <button
      onClick={onClick}
      style={selected && ac ? {
        backgroundColor: ac.bg,
        color: ac.text,
        borderColor: ac.border,
        boxShadow: 'none',
        transform: 'translate(4px, 4px)',
      } : selected ? {
        backgroundColor: '#0A0A0A',
        color: '#FFFFFF',
        borderColor: '#0A0A0A',
        boxShadow: 'none',
        transform: 'translate(4px, 4px)',
      } : {}}
      className={`
        relative w-full text-left border-2 border-ink transition-none
        p-5 group
        ${selected
          ? ''
          : 'bg-white brutal-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
        }
      `}
    >
      <div className="flex items-center gap-4">
        {emoji && (
          <span className="text-2xl leading-none flex-shrink-0">{emoji}</span>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-headline text-2xl leading-none tracking-tighter uppercase">
            {label}
          </p>
          {sublabel && (
            <p className={`font-body text-xs mt-1.5 font-medium leading-snug ${
              selected ? 'opacity-70' : 'text-gray-500'
            }`}>
              {sublabel}
            </p>
          )}
        </div>
        {selected && (
          <span className="font-headline text-lg leading-none flex-shrink-0">✕</span>
        )}
      </div>
    </button>
  );
}
