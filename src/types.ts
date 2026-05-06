export interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
  avatar_emoji: string
  profile_color: string
  bio: string | null
  is_approved: boolean
  created_at: string
}

export interface Category {
  id: number
  name: string
  label: string
  icon: string  // Lucide icon name
  color: string
}

export interface Pin {
  id: string
  name: string
  description: string | null
  category_id: number
  lat: number
  lng: number
  link: string | null
  tips: string | null
  cost_range: string | null
  added_by: string
  created_at: string
  trail_coordinates?: [number, number][] | null
  category?: Category
  profile?: Pick<Profile, 'id' | 'display_name' | 'profile_color' | 'avatar_emoji'>
  rating_avg: number
  rating_count: number
  user_rating: 1 | 2 | 3 | null
}

export interface PinComment {
  id: string
  pin_id: string
  user_id: string
  content: string
  created_at: string
  profile?: Pick<Profile, 'id' | 'display_name' | 'profile_color' | 'avatar_emoji'>
}

export interface NewPinData {
  name: string
  category_id: number
  description: string
  link: string
  tips: string
  cost_range: string
  trail_coordinates?: [number, number][]
}

export const CATEGORIES: Category[] = [
  { id: 1, name: 'restaurant', label: 'Restaurant', icon: 'Utensils', color: '#ef4444' },
  { id: 2, name: 'shop', label: 'Shop', icon: 'ShoppingBag', color: '#8b5cf6' },
  { id: 3, name: 'walk', label: 'Walk / Area', icon: 'Footprints', color: '#22c55e' },
  { id: 4, name: 'hike', label: 'Outdoorsy', icon: 'TreePine', color: '#f97316' },
  { id: 5, name: 'poi', label: 'Point of Interest', icon: 'Landmark', color: '#3b82f6' },
  { id: 6, name: 'other', label: 'Other', icon: 'Sparkles', color: '#6b7280' },
  { id: 7, name: 'bar', label: 'Bar', icon: 'Wine', color: '#f59e0b' },
  { id: 8, name: 'coffee', label: 'Coffee Shop', icon: 'Coffee', color: '#92400e' },
  { id: 9, name: 'market', label: 'Market', icon: 'ShoppingBasket', color: '#16a34a' },
]
