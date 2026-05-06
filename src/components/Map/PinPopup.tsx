import { useState, useEffect } from 'react'
import {
  X, ExternalLink, Map, Trash2, MessageCircle, Send,
  Utensils, ShoppingBag, Footprints, TreePine, Landmark,
  Sparkles, Wine, Coffee, ShoppingBasket, type LucideIcon,
} from 'lucide-react'
import type { Pin, PinComment } from '../../types'
import { CATEGORIES } from '../../types'

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils, ShoppingBag, Footprints, TreePine, Landmark,
  Sparkles, Wine, Coffee, ShoppingBasket,
}

interface Props {
  pin: Pin
  currentUserId: string
  onClose: () => void
  onRate: (rating: 1 | 2 | 3) => void
  onDelete: () => void
  onUserClick: (userId: string) => void
  onFetchComments: () => Promise<PinComment[]>
  onAddComment: (content: string) => Promise<{ error: unknown }>
}

export default function PinPopup({ pin, currentUserId, onClose, onRate, onDelete, onUserClick, onFetchComments, onAddComment }: Props) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<PinComment[]>([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)

  const category = CATEGORIES.find((c) => c.id === pin.category_id)
  const CategoryIcon = category ? ICON_MAP[category.icon] : null
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`
  const isOwner = pin.added_by === currentUserId

  async function loadComments() {
    setLoadingComments(true)
    const data = await onFetchComments()
    setComments(data)
    setLoadingComments(false)
  }

  useEffect(() => {
    if (showComments) loadComments()
  }, [showComments])

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmittingComment(true)
    await onAddComment(commentText.trim())
    setCommentText('')
    await loadComments()
    setSubmittingComment(false)
  }

  return (
    <div className="fixed inset-0 z-[1500] flex items-end sm:items-center sm:justify-end pointer-events-none">
      <div className="pointer-events-auto bg-white w-full sm:w-96 sm:h-full sm:max-h-screen overflow-y-auto rounded-t-2xl sm:rounded-none shadow-2xl slide-up">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {category && (
                <span
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {CategoryIcon && <CategoryIcon size={11} />}
                  {category.label}
                </span>
              )}
              {pin.cost_range && (
                <span className="text-xs text-gray-400 font-medium">{pin.cost_range}</span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isOwner && (
                <button
                  onClick={onDelete}
                  className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-50"
                  title="Delete place"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
          </div>

          <h2 className="font-semibold text-gray-900 text-lg leading-tight mt-2">{pin.name}</h2>

          {pin.profile && (
            <p className="text-xs text-gray-400 mt-0.5">
              Added by{' '}
              <button
                onClick={() => onUserClick(pin.profile!.id)}
                className="font-medium hover:underline"
                style={{ color: pin.profile.profile_color }}
              >
                {pin.profile.display_name}
              </button>
            </p>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {pin.description && (
            <p className="text-sm text-gray-700 leading-relaxed">{pin.description}</p>
          )}

          {pin.tips && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <p className="text-xs font-semibold text-amber-600 mb-0.5">Tip</p>
              <p className="text-sm text-amber-800">{pin.tips}</p>
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              {([1, 2, 3] as const).map((star) => (
                <button
                  key={star}
                  onClick={() => onRate(star)}
                  className={`text-2xl leading-none transition-colors ${
                    pin.user_rating && star <= pin.user_rating
                      ? 'text-amber-400'
                      : 'text-gray-200 hover:text-amber-200'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-400">
              {pin.rating_count > 0
                ? `${pin.rating_avg.toFixed(1)} avg · ${pin.rating_count} ${pin.rating_count === 1 ? 'rating' : 'ratings'}`
                : 'No ratings yet'}
            </span>
          </div>

          {/* Navigation links */}
          <div className="flex gap-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
            >
              <Map size={14} />
              Directions
            </a>
            {pin.link && (
              <a
                href={pin.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
              >
                <ExternalLink size={14} />
                Website
              </a>
            )}
          </div>

          {/* Comments */}
          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <MessageCircle size={15} />
              {showComments
                ? 'Hide comments'
                : comments.length > 0
                ? `${comments.length} comment${comments.length === 1 ? '' : 's'}`
                : 'Add a comment'}
            </button>

            {showComments && (
              <div className="mt-3 space-y-3">
                {loadingComments ? (
                  <p className="text-sm text-gray-400">Loading...</p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-400">No comments yet.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm bg-gray-100 flex-shrink-0 mt-0.5 select-none">
                        {c.profile?.avatar_emoji ?? '🦊'}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                        <p className="text-xs font-medium text-gray-700 mb-0.5">{c.profile?.display_name}</p>
                        <p className="text-sm text-gray-600">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 border border-gray-200 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center disabled:opacity-40"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
