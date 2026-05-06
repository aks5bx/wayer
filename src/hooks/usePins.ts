import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Pin, PinComment, NewPinData } from '../types'

export function usePins(userId: string | undefined) {
  const [pins, setPins] = useState<Pin[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPins = useCallback(async () => {
    if (!userId) return

    const [pinsRes, votesRes] = await Promise.all([
      supabase
        .from('pins')
        .select('*, category:categories(*), profile:profiles(id, display_name, profile_color, avatar_emoji)')
        .order('created_at', { ascending: false }),
      supabase
        .from('pin_votes')
        .select('pin_id, user_id, rating'),
    ])

    const allVotes = votesRes.data ?? []
    const ratingSumMap = new Map<string, number>()
    const ratingCountMap = new Map<string, number>()
    const userRatingMap = new Map<string, 1 | 2 | 3>()

    for (const vote of allVotes) {
      const r = (vote.rating ?? 3) as 1 | 2 | 3
      ratingSumMap.set(vote.pin_id, (ratingSumMap.get(vote.pin_id) ?? 0) + r)
      ratingCountMap.set(vote.pin_id, (ratingCountMap.get(vote.pin_id) ?? 0) + 1)
      if (vote.user_id === userId) {
        userRatingMap.set(vote.pin_id, r)
      }
    }

    setPins(
      (pinsRes.data ?? []).map((pin) => {
        const count = ratingCountMap.get(pin.id) ?? 0
        const sum = ratingSumMap.get(pin.id) ?? 0
        return {
          ...pin,
          rating_avg: count > 0 ? sum / count : 0,
          rating_count: count,
          user_rating: userRatingMap.get(pin.id) ?? null,
        }
      })
    )
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchPins()
  }, [fetchPins])

  async function addPin(data: NewPinData & { lat: number; lng: number }) {
    if (!userId) return { error: new Error('Not logged in') }
    const { data: inserted, error } = await supabase
      .from('pins')
      .insert({ ...data, added_by: userId })
      .select('id')
      .single()
    if (!error && inserted) {
      await supabase.from('pin_votes').insert({ pin_id: inserted.id, user_id: userId, rating: 3 })
    }
    if (!error) await fetchPins()
    return { error }
  }

  async function deletePin(pinId: string) {
    const { error } = await supabase.from('pins').delete().eq('id', pinId)
    if (!error) setPins((prev) => prev.filter((p) => p.id !== pinId))
    return { error }
  }

  async function setRating(pinId: string, rating: 1 | 2 | 3) {
    if (!userId) return

    const pin = pins.find((p) => p.id === pinId)
    if (!pin) return

    if (pin.user_rating === rating) {
      await supabase.from('pin_votes').delete().eq('pin_id', pinId).eq('user_id', userId)
    } else if (pin.user_rating) {
      await supabase.from('pin_votes').update({ rating }).eq('pin_id', pinId).eq('user_id', userId)
    } else {
      await supabase.from('pin_votes').insert({ pin_id: pinId, user_id: userId, rating })
    }
    await fetchPins()
  }

  async function fetchComments(pinId: string): Promise<PinComment[]> {
    const { data } = await supabase
      .from('pin_comments')
      .select('*, profile:profiles(id, display_name, profile_color, avatar_emoji)')
      .eq('pin_id', pinId)
      .order('created_at', { ascending: true })
    return data ?? []
  }

  async function addComment(pinId: string, content: string) {
    if (!userId) return { error: new Error('Not logged in') }
    const { error } = await supabase.from('pin_comments').insert({
      pin_id: pinId,
      user_id: userId,
      content,
    })
    return { error }
  }

  return { pins, loading, addPin, deletePin, setRating, fetchComments, addComment, refetch: fetchPins }
}
