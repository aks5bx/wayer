import { useState } from 'react'
import { X, LogOut, Pencil, Check } from 'lucide-react'
import type { Profile } from '../../types'

interface Props {
  profile: Profile
  pinCount: number
  onUpdate: (updates: Partial<Pick<Profile, 'display_name' | 'profile_color' | 'bio' | 'avatar_emoji'>>) => Promise<{ error: unknown }>
  onClose: () => void
  onSignOut: () => void
}

const ANIMALS = [
  '🦊', '🐻', '🐼', '🦁', '🐯', '🦝',
  '🐨', '🐸', '🐙', '🦜', '🦦', '🦔',
  '🐢', '🦋', '🦈', '🐳', '🦒', '🐘',
]

export default function ProfilePanel({ profile, pinCount, onUpdate, onClose, onSignOut }: Props) {
  const [emoji, setEmoji] = useState(profile.avatar_emoji ?? '🦊')
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [saving, setSaving] = useState(false)

  async function handleEmojiSelect(a: string) {
    setEmoji(a)
    await onUpdate({ avatar_emoji: a })
  }

  async function handleSaveName() {
    if (!displayName.trim()) return
    setSaving(true)
    await onUpdate({ display_name: displayName.trim() })
    setSaving(false)
    setEditing(false)
  }

  function handleCancelEdit() {
    setDisplayName(profile.display_name)
    setEditing(false)
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center sm:justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:w-80 sm:h-full overflow-y-auto rounded-t-2xl sm:rounded-none shadow-2xl slide-up">

        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-4xl bg-gray-100 flex-shrink-0 select-none">
              {emoji}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={saving}
                    className="text-green-500 hover:text-green-700 disabled:opacity-40 flex-shrink-0"
                  >
                    <Check size={16} />
                  </button>
                  <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-gray-900 truncate">{displayName}</p>
                  <button
                    onClick={() => setEditing(true)}
                    className="text-gray-300 hover:text-gray-500 flex-shrink-0 transition-colors"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              )}
              <p className="text-sm text-gray-400 mt-0.5">
                {pinCount} place{pinCount !== 1 ? 's' : ''} added
              </p>
            </div>
          </div>

          {/* Animal picker */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your animal</p>
            <div className="grid grid-cols-6 gap-2">
              {ANIMALS.map((a) => (
                <button
                  key={a}
                  onClick={() => handleEmojiSelect(a)}
                  className={`aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all ${
                    emoji === a
                      ? 'bg-gray-900 shadow-md scale-105'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Sign out */}
          <div className="border-t border-gray-100 pt-2">
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 text-sm text-red-400 hover:text-red-600 transition-colors"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
