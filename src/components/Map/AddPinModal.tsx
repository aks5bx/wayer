import { useEffect, useRef, useState } from 'react'
import {
  X, MapPin, Search, Navigation, Route,
  Utensils, ShoppingBag, Footprints, TreePine, Landmark,
  Sparkles, Wine, Coffee, ShoppingBasket, type LucideIcon,
} from 'lucide-react'
import { CATEGORIES } from '../../types'
import type { NewPinData } from '../../types'

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils, ShoppingBag, Footprints, TreePine, Landmark,
  Sparkles, Wine, Coffee, ShoppingBasket,
}

interface NominatimResult {
  place_id: number
  display_name: string
  name: string
  lat: string
  lon: string
}

interface Props {
  initialLocation?: { lat: number; lng: number }
  initialTrail?: [number, number][]
  onDropPin: () => void
  onDrawTrail: () => void
  onSubmit: (data: NewPinData & { lat: number; lng: number }) => Promise<void>
  onClose: () => void
}

const COST_OPTIONS = ['Free', '$', '$$', '$$$']

function parseResult(r: NominatimResult): { primary: string; secondary: string } {
  const parts = r.display_name.split(',').map((s) => s.trim())
  const primary = r.name?.trim() || parts[0]
  const secondary = parts[0] === primary ? parts.slice(1, 4).join(', ') : parts.slice(0, 3).join(', ')
  return { primary, secondary }
}

export default function AddPinModal({ initialLocation, initialTrail, onDropPin, onDrawTrail, onSubmit, onClose }: Props) {
  const [confirmedLocation, setConfirmedLocation] = useState<{ lat: number; lng: number } | null>(
    initialLocation ?? null
  )

  // locate step
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // form step
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState(1)
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [tips, setTips] = useState('')
  const [costRange, setCostRange] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!confirmedLocation) searchInputRef.current?.focus()
  }, [confirmedLocation])

  // Debounced Nominatim search
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); setSearching(false); return }
    setSearching(true)
    const timer = setTimeout(() => {
      fetch(
        `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
          q: query,
          format: 'json',
          limit: '6',
          viewbox: '-122.56,37.84,-122.35,37.69',
          bounded: '1',
          'accept-language': 'en',
        })}`,
        { headers: { 'User-Agent': 'Wayer/1.0' } }
      )
        .then((r) => r.json())
        .then((data) => { setResults(data); setSearching(false) })
        .catch(() => { setResults([]); setSearching(false) })
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  function handleSelect(r: NominatimResult) {
    const { primary } = parseResult(r)
    setConfirmedLocation({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) })
    setName(primary)
  }

  function handleChangeLocation() {
    setConfirmedLocation(null)
    setName('')
    setQuery('')
    setResults([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !confirmedLocation) return
    setSaving(true)
    await onSubmit({
      name: name.trim(),
      category_id: categoryId,
      description: description.trim(),
      link: link.trim(),
      tips: tips.trim(),
      cost_range: costRange,
      lat: confirmedLocation.lat,
      lng: confirmedLocation.lng,
      trail_coordinates: initialTrail && initialTrail.length >= 2 ? initialTrail : undefined,
    })
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto slide-up">

        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-semibold text-gray-900">Add a place</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {!confirmedLocation ? (
          /* ── LOCATE STEP ── */
          <div className="p-4 space-y-4">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or address…"
                className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              )}
            </div>

            {results.length > 0 && (
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 shadow-sm">
                {results.map((r) => {
                  const { primary, secondary } = parseResult(r)
                  return (
                    <button
                      key={r.place_id}
                      onClick={() => handleSelect(r)}
                      className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{primary}</p>
                        <p className="text-xs text-gray-400 truncate">{secondary}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {query.trim().length >= 2 && !searching && results.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-2">No results in SF — try a different search</p>
            )}

            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <button
              onClick={onDropPin}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-colors"
            >
              <Navigation size={15} />
              Drop a pin on the map
            </button>

            <button
              onClick={onDrawTrail}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-orange-200 rounded-xl text-sm text-orange-500 hover:border-orange-300 hover:text-orange-700 transition-colors"
            >
              <Route size={15} />
              Draw a trail on the map
            </button>
          </div>
        ) : (
          /* ── FORM STEP ── */
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleChangeLocation}
                className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors w-full text-left"
              >
                <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                <span className="truncate flex-1">
                  {confirmedLocation.lat.toFixed(5)}, {confirmedLocation.lng.toFixed(5)}
                </span>
                <span className="text-blue-500 font-medium flex-shrink-0">Change</span>
              </button>
              {initialTrail && initialTrail.length >= 2 && (
                <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                  <Route size={12} className="flex-shrink-0" />
                  <span>Trail: {initialTrail.length} points drawn</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tartine Bakery"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = ICON_MAP[cat.icon]
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                        categoryId === cat.id
                          ? 'border-current text-white'
                          : 'border-gray-100 text-gray-500 bg-gray-50'
                      }`}
                      style={categoryId === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                    >
                      {Icon && <Icon size={18} />}
                      {cat.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's great about this place?"
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tips</label>
              <input
                type="text"
                value={tips}
                onChange={(e) => setTips(e.target.value)}
                placeholder="Insider knowledge…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost</label>
              <div className="flex gap-2">
                {COST_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setCostRange(costRange === opt ? '' : opt)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                      costRange === opt
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 pb-2">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="w-full bg-gray-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save place'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
