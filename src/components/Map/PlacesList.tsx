import { useState } from 'react'
import { Search, X } from 'lucide-react'
import type { Pin } from '../../types'
import { CATEGORIES } from '../../types'

interface Props {
  pins: Pin[]
  selectedPinId: string | null
  onSelect: (pin: Pin) => void
}

export default function PlacesList({ pins, selectedPinId, onSelect }: Props) {
  const [search, setSearch] = useState('')

  const visible = search.trim()
    ? pins.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : pins

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search */}
      <div className="px-3 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search places…"
            className="w-full pl-8 pr-7 py-1.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <div className="px-4 py-2 flex-shrink-0">
        <p className="text-xs text-gray-400">{visible.length} place{visible.length !== 1 ? 's' : ''}</p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No places found</p>
        ) : (
          visible.map((pin) => {
            const category = CATEGORIES.find((c) => c.id === pin.category_id)
            const isSelected = pin.id === selectedPinId
            const roundedRating = Math.round(pin.rating_avg)

            return (
              <button
                key={pin.id}
                onClick={() => onSelect(pin)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Category dot */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-[5px]"
                    style={{ backgroundColor: category?.color ?? '#6b7280' }}
                  />

                  <div className="flex-1 min-w-0">
                    {/* Name + rating */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-gray-900 text-sm leading-snug truncate">
                        {pin.name}
                      </p>
                      {pin.rating_count > 0 && (
                        <span className="text-amber-400 text-xs flex-shrink-0 leading-snug">
                          {'★'.repeat(roundedRating)}{'☆'.repeat(3 - roundedRating)}
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {pin.profile?.avatar_emoji ?? '🦊'} {pin.profile?.display_name ?? 'Unknown'}
                      {pin.cost_range ? ` · ${pin.cost_range}` : ''}
                      {category ? ` · ${category.label}` : ''}
                    </p>

                    {/* Description */}
                    {pin.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {pin.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
