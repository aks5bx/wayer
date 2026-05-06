import { useState } from 'react'
import { Layers } from 'lucide-react'

export interface LayerState {
  neighborhoods: boolean
  commercial: boolean
  muniMetro: boolean
  transit: boolean
  busRoutes: boolean
  heatmap: boolean
}

interface Props {
  layers: LayerState
  onToggle: (key: keyof LayerState) => void
}

type SwatchSpec =
  | { type: 'line'; color: string; weight: number; dashed?: boolean }
  | { type: 'line+dot'; color: string }
  | { type: 'metro' }
  | { type: 'bus' }
  | { type: 'heat' }

const LAYER_CONFIG: {
  key: keyof LayerState
  label: string
  description: string
  color: string
  swatch: SwatchSpec
}[] = [
  {
    key: 'neighborhoods',
    label: 'Neighborhood borders',
    description: 'SF neighborhood boundaries',
    color: '#7c3aed',
    swatch: { type: 'line', color: '#7c3aed', weight: 1.5, dashed: true },
  },
  {
    key: 'commercial',
    label: 'Commercial corridors',
    description: 'Major shopping streets',
    color: '#f97316',
    swatch: { type: 'line', color: '#f97316', weight: 4 },
  },
  {
    key: 'muniMetro',
    label: 'Muni Metro',
    description: 'N/J/K/L/M/T rail lines',
    color: '#2563EB',
    swatch: { type: 'metro' },
  },
  {
    key: 'transit',
    label: 'BART',
    description: 'BART stations & line',
    color: '#60a5fa',
    swatch: { type: 'line+dot', color: '#60a5fa' },
  },
  {
    key: 'busRoutes',
    label: 'Bus routes',
    description: 'Filter by neighborhood →',
    color: '#6b7280',
    swatch: { type: 'bus' },
  },
  {
    key: 'heatmap',
    label: 'Pin heatmap',
    description: 'Density of saved spots',
    color: '#ef4444',
    swatch: { type: 'heat' },
  },
]

function Swatch({ spec }: { spec: SwatchSpec }) {
  if (spec.type === 'line') {
    return (
      <svg width="28" height="16" className="flex-shrink-0">
        <line
          x1="1" y1="8" x2="27" y2="8"
          stroke={spec.color}
          strokeWidth={spec.weight}
          strokeLinecap="round"
          strokeDasharray={spec.dashed ? '5,4' : undefined}
        />
      </svg>
    )
  }
  if (spec.type === 'line+dot') {
    return (
      <svg width="28" height="16" className="flex-shrink-0">
        <line x1="1" y1="8" x2="20" y2="8" stroke={spec.color} strokeWidth="2" strokeLinecap="round" />
        <circle cx="24.5" cy="8" r="3" fill="white" stroke={spec.color} strokeWidth="1.5" />
      </svg>
    )
  }
  if (spec.type === 'metro') {
    return (
      <svg width="28" height="16" className="flex-shrink-0">
        <line x1="1" y1="4"  x2="27" y2="4"  stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
        <line x1="1" y1="8"  x2="27" y2="8"  stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
        <line x1="1" y1="12" x2="27" y2="12" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  if (spec.type === 'bus') {
    return (
      <svg width="28" height="16" className="flex-shrink-0">
        <line x1="1" y1="8" x2="27" y2="8" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }
  // heat
  return (
    <svg width="28" height="16" className="flex-shrink-0">
      <defs>
        <radialGradient id="heatG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#f97316" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="14" cy="8" rx="13" ry="7" fill="url(#heatG)" />
    </svg>
  )
}

export default function LayerControl({ layers, onToggle }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium shadow-md transition-colors ${
          open ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Layers size={15} />
        Layers
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-100 p-3 w-60">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">Map layers</p>
          <div className="space-y-1">
            {LAYER_CONFIG.map(({ key, label, color, description, swatch }) => (
              <button
                key={key}
                onClick={() => onToggle(key)}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    layers[key] ? 'border-transparent' : 'border-gray-300'
                  }`}
                  style={layers[key] ? { backgroundColor: color } : {}}
                >
                  {layers[key] && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400 truncate">{description}</p>
                </div>
                <div className={`transition-opacity ${layers[key] ? 'opacity-100' : 'opacity-25'}`}>
                  <Swatch spec={swatch} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
