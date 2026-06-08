'use client';

export default function SelectionCard({ emoji, label, sublabel, selected, onClick, size = 'md', fullWidth = false }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative w-full text-left rounded-3xl border-2 transition-all duration-200 active:scale-95
        ${size === 'lg' ? 'p-5' : 'p-4'}
        ${selected
          ? 'border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-200'
          : 'border-gray-100 bg-white text-gray-800 hover:border-indigo-200 hover:bg-indigo-50'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <span className={`leading-none ${size === 'lg' ? 'text-3xl' : 'text-2xl'}`}>{emoji}</span>
        <div>
          <p className={`font-black tracking-tight leading-none ${size === 'lg' ? 'text-lg' : 'text-base'}`}>
            {label}
          </p>
          {sublabel && (
            <p className={`text-xs mt-1 font-medium ${selected ? 'text-indigo-200' : 'text-gray-400'}`}>
              {sublabel}
            </p>
          )}
        </div>
      </div>

      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 bg-white rounded-full flex items-center justify-center">
          <span className="text-indigo-500 text-xs font-black">✓</span>
        </div>
      )}
    </button>
  );
}
