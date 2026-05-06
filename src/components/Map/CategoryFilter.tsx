import {
  Utensils, ShoppingBag, Footprints, TreePine, Landmark,
  Sparkles, Wine, Coffee, ShoppingBasket, type LucideIcon,
} from 'lucide-react'
import { CATEGORIES } from '../../types'

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils, ShoppingBag, Footprints, TreePine, Landmark,
  Sparkles, Wine, Coffee, ShoppingBasket,
}

interface Props {
  activeCategories: number[]
  onToggle: (id: number) => void
}

export default function CategoryFilter({ activeCategories, onToggle }: Props) {
  return (
    <div className="absolute top-16 left-4 z-[1000] flex flex-col gap-1.5">
      {CATEGORIES.map((cat) => {
        const active = activeCategories.length === 0 || activeCategories.includes(cat.id)
        const Icon = ICON_MAP[cat.icon]
        return (
          <button
            key={cat.id}
            onClick={() => onToggle(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shadow-md transition-all ${
              active ? 'text-white shadow-lg' : 'bg-white text-gray-400 opacity-60'
            }`}
            style={active ? { backgroundColor: cat.color } : {}}
          >
            {Icon && <Icon size={13} />}
            <span>{cat.label}</span>
          </button>
        )
      })}
    </div>
  )
}
