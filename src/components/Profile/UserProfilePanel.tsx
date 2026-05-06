import { useEffect, useState } from 'react'
import { X, MapPin, MessageCircle, Star, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { CATEGORIES } from '../../types'
import type { Profile, Pin } from '../../types'

interface Props {
  userId: string
  onClose: () => void
}

interface Stats {
  pinCount: number
  commentCount: number
  ratingCount: number
  ratingAvg: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function UserProfilePanel({ userId, onClose }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [profileRes, pinsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase
          .from('pins')
          .select('*, category:categories(*)')
          .eq('added_by', userId)
          .order('created_at', { ascending: false }),
      ])

      const userPins = pinsRes.data ?? []
      const pinIds = userPins.map((p) => p.id)

      const [commentsRes, votesRes] = await Promise.all([
        supabase
          .from('pin_comments')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId),
        pinIds.length > 0
          ? supabase.from('pin_votes').select('rating').in('pin_id', pinIds)
          : Promise.resolve({ data: [] }),
      ])

      const votes = (votesRes as any).data ?? []
      const ratingCount = votes.length
      const ratingAvg = ratingCount > 0
        ? votes.reduce((sum: number, v: any) => sum + (v.rating ?? 3), 0) / ratingCount
        : 0

      setProfile(profileRes.data)
      setPins(userPins.map((p) => ({ ...p, rating_avg: 0, rating_count: 0, user_rating: null })))
      setStats({
        pinCount: userPins.length,
        commentCount: commentsRes.count ?? 0,
        ratingCount,
        ratingAvg,
      })
      setLoading(false)
    }

    load()
  }, [userId])

  return (
    <div className="fixed inset-0 z-[1600] flex items-end sm:items-center sm:justify-end pointer-events-none">
      <div className="pointer-events-auto bg-white w-full sm:w-80 sm:h-full sm:max-h-screen overflow-y-auto rounded-t-2xl sm:rounded-none shadow-2xl slide-up">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-sm">Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
        ) : !profile ? (
          <div className="p-8 text-center text-sm text-gray-400">User not found</div>
        ) : (
          <div className="p-4 space-y-5">
            {/* Identity */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-3xl bg-gray-100 flex-shrink-0 select-none">
                {profile.avatar_emoji ?? '🦊'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{profile.display_name}</p>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                  <Calendar size={11} />
                  Joined {formatDate(profile.created_at)}
                </p>
              </div>
            </div>

            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: MapPin, label: 'Places added', value: stats.pinCount, color: 'text-blue-500' },
                  { icon: MessageCircle, label: 'Comments', value: stats.commentCount, color: 'text-gray-500' },
                  { icon: Star, label: 'Ratings received', value: stats.ratingCount, color: 'text-amber-400' },
                  { icon: Star, label: 'Avg rating', value: stats.ratingCount > 0 ? stats.ratingAvg.toFixed(1) : '—', color: 'text-amber-400' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5">
                    <Icon size={14} className={`${color} mb-1`} />
                    <p className="text-lg font-semibold text-gray-900 leading-none">{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Pins list */}
            {pins.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Places</p>
                <div className="space-y-1">
                  {pins.map((pin) => {
                    const cat = CATEGORIES.find((c) => c.id === pin.category_id)
                    return (
                      <div key={pin.id} className="flex items-center gap-2.5 py-1.5">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: cat?.color ?? '#6b7280' }}
                        />
                        <span className="text-sm text-gray-800 truncate flex-1">{pin.name}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(pin.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
