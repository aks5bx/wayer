import { useState } from 'react'
import { Clock } from 'lucide-react'
import { useAuth } from './hooks/useAuth'
import { usePins } from './hooks/usePins'
import AuthScreen from './components/Auth/AuthScreen'
import Header from './components/Layout/Header'
import MapView from './components/Map/MapView'
import AddPinModal from './components/Map/AddPinModal'
import PinPopup from './components/Map/PinPopup'
import CategoryFilter from './components/Map/CategoryFilter'
import ProfilePanel from './components/Profile/ProfilePanel'
import UserProfilePanel from './components/Profile/UserProfilePanel'
import PlacesList from './components/Map/PlacesList'
import type { Pin, NewPinData } from './types'
// NewPinData is used via AddPinModal's onSubmit signature

export default function App() {
  const { user, profile, loading, signIn, signUp, signOut, updateProfile } = useAuth()
  const { pins, addPin, deletePin, setRating, fetchComments, addComment } = usePins(user?.id)

  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isDropPinMode, setIsDropPinMode] = useState(false)
  const [dropPinLocation, setDropPinLocation] = useState<{ lat: number; lng: number } | undefined>(undefined)
  const [showProfilePanel, setShowProfilePanel] = useState(false)
  const [showList, setShowList] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [activeCategories, setActiveCategories] = useState<number[]>([])
  const [isDrawingTrail, setIsDrawingTrail] = useState(false)
  const [trailMode, setTrailMode] = useState<'click' | 'freehand'>('click')
  const [trailSnap, setTrailSnap] = useState(false)
  const [trailPoints, setTrailPoints] = useState<[number, number][]>([])
  const [trailWaypoints, setTrailWaypoints] = useState<[number, number][]>([])
  const [trailSegmentSizes, setTrailSegmentSizes] = useState<number[]>([])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  if (!user || !profile) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} />
  }

  if (!profile.is_approved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full text-center">
          <div className="flex justify-center mb-4 text-gray-400"><Clock size={40} /></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pending approval</h2>
          <p className="text-gray-500 text-sm mb-6">
            Your account is awaiting approval. Ask Adi to approve you in the Supabase dashboard.
          </p>
          <button
            onClick={signOut}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  const filteredPins =
    activeCategories.length === 0
      ? pins
      : pins.filter((p) => activeCategories.includes(p.category_id))

  function handleCategoryToggle(id: number) {
    setActiveCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  function handleAddClick() {
    setShowAddModal(true)
    setDropPinLocation(undefined)
  }

  function handleDropPin() {
    setShowAddModal(false)
    setIsDropPinMode(true)
    setDropPinLocation(undefined)
  }

  function resetTrail() {
    setTrailPoints([])
    setTrailWaypoints([])
    setTrailSegmentSizes([])
  }

  function handleDrawTrail() {
    setShowAddModal(false)
    setIsDrawingTrail(true)
    resetTrail()
  }

  function handleFinishTrail() {
    if (trailPoints.length < 2) return
    const mid = trailPoints[Math.floor(trailPoints.length / 2)]
    setIsDrawingTrail(false)
    setDropPinLocation({ lat: mid[0], lng: mid[1] })
    setShowAddModal(true)
  }

  function handleMapDropPin(lat: number, lng: number) {
    setDropPinLocation({ lat, lng })
    setIsDropPinMode(false)
    setShowAddModal(true)
  }

  function handleAddTrailPoint(lat: number, lng: number) {
    const pt: [number, number] = [lat, lng]
    setTrailPoints((prev) => [...prev, pt])
    setTrailWaypoints((prev) => [...prev, pt])
    setTrailSegmentSizes((prev) => [...prev, 1])
  }

  function handleAddRoutedSegment(pts: [number, number][]) {
    setTrailPoints((prev) => [...prev, ...pts])
    setTrailWaypoints((prev) => [...prev, pts[pts.length - 1]])
    setTrailSegmentSizes((prev) => [...prev, pts.length])
  }

  function handleUndoTrailSegment() {
    if (trailSegmentSizes.length === 0) return
    const size = trailSegmentSizes[trailSegmentSizes.length - 1]
    setTrailPoints((prev) => prev.slice(0, -size))
    setTrailWaypoints((prev) => prev.slice(0, -1))
    setTrailSegmentSizes((prev) => prev.slice(0, -1))
  }

  function handleAddModalClose() {
    setShowAddModal(false)
    setIsDropPinMode(false)
    setIsDrawingTrail(false)
    setDropPinLocation(undefined)
    resetTrail()
  }

  async function handleAddPin(data: NewPinData & { lat: number; lng: number }) {
    await addPin(data)
    setShowAddModal(false)
    setDropPinLocation(undefined)
    resetTrail()
  }

  async function handleDeletePin() {
    if (!selectedPin) return
    await deletePin(selectedPin.id)
    setSelectedPin(null)
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      <Header
        profile={profile}
        isAddingMode={showAddModal || isDropPinMode || isDrawingTrail}
        showList={showList}
        onAddModeToggle={handleAddClick}
        onListToggle={() => setShowList((v) => !v)}
        onProfileClick={() => setShowProfilePanel(true)}
      />

      <div className="flex-1 overflow-hidden flex">
        {/* List panel */}
        {showList && (
          <div className="w-80 flex-shrink-0 border-r border-gray-100 overflow-y-auto z-10">
            <PlacesList
              pins={filteredPins}
              selectedPinId={selectedPin?.id ?? null}
              onSelect={setSelectedPin}
            />
          </div>
        )}

        {/* Map area */}
        <div className="flex-1 relative overflow-hidden">
        <MapView
          pins={filteredPins}
          isAddingMode={isDropPinMode || isDrawingTrail}
          isDropPinMode={isDropPinMode}
          isDrawingTrail={isDrawingTrail}
          trailMode={trailMode}
          trailSnap={trailSnap}
          lastTrailWaypoint={trailWaypoints[trailWaypoints.length - 1]}
          selectedPinId={selectedPin?.id ?? null}
          onDropPin={handleMapDropPin}
          onAddTrailPoint={handleAddTrailPoint}
          onAddRoutedSegment={handleAddRoutedSegment}
          onPinSelect={setSelectedPin}
          trailInProgress={isDrawingTrail ? trailPoints : undefined}
        />

        <CategoryFilter
          activeCategories={activeCategories}
          onToggle={handleCategoryToggle}
        />

        {isDropPinMode && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg pointer-events-none">
            Tap anywhere to drop a pin
          </div>
        )}

        {isDrawingTrail && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-2 pointer-events-none">
            <div className="bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg whitespace-nowrap">
              {trailPoints.length === 0
                ? trailMode === 'freehand'
                  ? 'Press and drag to draw'
                  : trailSnap
                  ? 'Click waypoints — will snap to roads'
                  : 'Click to add points'
                : `${trailPoints.length} point${trailPoints.length === 1 ? '' : 's'}`}
            </div>

            <div className="pointer-events-auto bg-white rounded-2xl shadow-lg flex items-center text-sm divide-x divide-gray-100">
              {/* Mode toggle */}
              <div className="flex gap-0.5 px-1.5 py-1.5">
                <button
                  onClick={() => setTrailMode('click')}
                  className={`px-3 py-1 rounded-xl font-medium transition-colors ${trailMode === 'click' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Click
                </button>
                <button
                  onClick={() => setTrailMode('freehand')}
                  className={`px-3 py-1 rounded-xl font-medium transition-colors ${trailMode === 'freehand' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Freehand
                </button>
              </div>

              {/* Snap toggle — click mode only */}
              {trailMode === 'click' && (
                <button
                  onClick={() => setTrailSnap((s) => !s)}
                  className={`px-3 py-2.5 font-medium transition-colors ${trailSnap ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  Snap to roads
                </button>
              )}

              {/* Undo — click mode; Clear — freehand */}
              {trailMode === 'click' && trailSegmentSizes.length > 0 && (
                <button onClick={handleUndoTrailSegment} className="px-3 py-2.5 text-gray-500 hover:text-gray-700">
                  Undo
                </button>
              )}
              {trailMode === 'freehand' && trailPoints.length > 0 && (
                <button onClick={resetTrail} className="px-3 py-2.5 text-gray-500 hover:text-gray-700">
                  Clear
                </button>
              )}

              {/* Done */}
              {trailPoints.length >= 2 && (
                <button onClick={handleFinishTrail} className="px-3 py-2.5 font-semibold text-orange-600">
                  Done
                </button>
              )}

              {/* Cancel */}
              <button onClick={handleAddModalClose} className="px-3 py-2.5 text-gray-400 hover:text-gray-600 rounded-r-2xl">
                Cancel
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {showAddModal && (
        <AddPinModal
          initialLocation={dropPinLocation}
          initialTrail={trailPoints.length >= 2 ? trailPoints : undefined}
          onDropPin={handleDropPin}
          onDrawTrail={handleDrawTrail}
          onSubmit={handleAddPin}
          onClose={handleAddModalClose}
        />
      )}

      {selectedPin && (
        <PinPopup
          pin={selectedPin}
          currentUserId={user.id}
          onClose={() => setSelectedPin(null)}
          onRate={(rating) => {
            setRating(selectedPin.id, rating)
            setSelectedPin((prev) => {
              if (!prev) return null
              const removing = prev.user_rating === rating
              const oldSum = prev.rating_avg * prev.rating_count
              const oldUserRating = prev.user_rating ?? 0
              let newCount: number
              let newSum: number
              if (removing) {
                newCount = prev.rating_count - 1
                newSum = oldSum - rating
              } else if (prev.user_rating) {
                newCount = prev.rating_count
                newSum = oldSum - oldUserRating + rating
              } else {
                newCount = prev.rating_count + 1
                newSum = oldSum + rating
              }
              return {
                ...prev,
                rating_count: newCount,
                rating_avg: newCount > 0 ? newSum / newCount : 0,
                user_rating: removing ? null : rating,
              }
            })
          }}
          onUserClick={setSelectedUserId}
          onDelete={handleDeletePin}
          onFetchComments={() => fetchComments(selectedPin.id)}
          onAddComment={(content) => addComment(selectedPin.id, content)}
        />
      )}

      {showProfilePanel && (
        <ProfilePanel
          profile={profile}
          pinCount={pins.filter((p) => p.added_by === user.id).length}
          onUpdate={updateProfile}
          onClose={() => setShowProfilePanel(false)}
          onSignOut={signOut}
        />
      )}

      {selectedUserId && (
        <UserProfilePanel
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  )
}
