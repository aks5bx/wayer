const NEIGHBORHOODS = [
  'Bayview',
  'Castro',
  'Chinatown',
  'Dogpatch',
  'Excelsior',
  'Forest Hill',
  'Haight Ashbury',
  'Inner Richmond',
  'Inner Sunset',
  'Marina',
  'Mission',
  'Mission Bay',
  'Nob Hill',
  'Noe Valley',
  'North Beach',
  'Outer Mission',
  'Outer Richmond',
  'Outer Sunset',
  'Pacific Heights',
  'Potrero Hill',
  'SOMA',
  'Tenderloin',
  'Western Addition',
]

interface Props {
  activeNeighborhoods: string[]
  onToggle: (name: string) => void
  onClear: () => void
}

export default function BusFilter({ activeNeighborhoods, onToggle, onClear }: Props) {
  const active = new Set(activeNeighborhoods)

  return (
    <div className="absolute top-4 right-4 z-[1000] bg-white rounded-xl shadow-lg border border-gray-100 p-3 w-52">
      <div className="flex items-center justify-between mb-1 px-0.5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Bus routes</p>
        {activeNeighborhoods.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      <p className="text-xs text-gray-400 px-0.5 mb-2.5">
        {activeNeighborhoods.length === 0
          ? 'Pick a neighborhood to show routes'
          : `${activeNeighborhoods.length} neighborhood${activeNeighborhoods.length > 1 ? 's' : ''} selected`}
      </p>
      <div className="flex flex-wrap gap-1">
        {NEIGHBORHOODS.map((n) => (
          <button
            key={n}
            onClick={() => onToggle(n)}
            className={`text-xs px-2 py-1 rounded-full transition-colors ${
              active.has(n)
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}
