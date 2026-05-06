import { useEffect, useRef } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const MIN_FREEHAND_DIST = 0.00015 // ~16m

async function fetchOsrmRoute(from: [number, number], to: [number, number]): Promise<[number, number][]> {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/walking/${from[1]},${from[0]};${to[1]},${to[0]}?geometries=geojson&overview=full`
    )
    const data = await res.json()
    const coords = data.routes?.[0]?.geometry?.coordinates as [number, number][] | undefined
    if (coords) return coords.map(([lon, lat]) => [lat, lon] as [number, number])
  } catch {}
  return [to]
}

interface Props {
  mode: 'click' | 'freehand'
  snap: boolean
  lastWaypoint?: [number, number]
  onAddPoint: (lat: number, lng: number) => void
  onAddRoutedSegment: (points: [number, number][]) => void
}

export default function MapTrailHandler({ mode, snap, lastWaypoint, onAddPoint, onAddRoutedSegment }: Props) {
  const map = useMap()
  const isDragging = useRef(false)
  const lastFreehandPt = useRef<[number, number] | null>(null)

  // Keep refs stable so DOM event handlers don't go stale
  const lastWaypointRef = useRef(lastWaypoint)
  const onAddPointRef = useRef(onAddPoint)
  const onAddRoutedRef = useRef(onAddRoutedSegment)
  useEffect(() => { lastWaypointRef.current = lastWaypoint }, [lastWaypoint])
  useEffect(() => { onAddPointRef.current = onAddPoint }, [onAddPoint])
  useEffect(() => { onAddRoutedRef.current = onAddRoutedSegment }, [onAddRoutedSegment])

  // Click mode
  useMapEvents({
    click(e) {
      if (mode !== 'click') return
      const { lat, lng } = e.latlng
      if (snap && lastWaypointRef.current) {
        fetchOsrmRoute(lastWaypointRef.current, [lat, lng]).then((pts) =>
          onAddRoutedRef.current(pts)
        )
      } else {
        onAddPointRef.current(lat, lng)
      }
    },
  })

  // Freehand mode — native DOM events so we can preventDefault on touch
  useEffect(() => {
    if (mode !== 'freehand') return

    map.dragging.disable()
    const tap = (map as any).tap
    if (tap) tap.disable()

    const container = map.getContainer()

    function getLatLng(clientX: number, clientY: number): [number, number] {
      const rect = container.getBoundingClientRect()
      const latlng = map.containerPointToLatLng(L.point(clientX - rect.left, clientY - rect.top))
      return [latlng.lat, latlng.lng]
    }

    function tryAddSampledPoint(clientX: number, clientY: number) {
      const pt = getLatLng(clientX, clientY)
      const last = lastFreehandPt.current
      if (last) {
        const d = Math.sqrt((pt[0] - last[0]) ** 2 + (pt[1] - last[1]) ** 2)
        if (d < MIN_FREEHAND_DIST) return
      }
      lastFreehandPt.current = pt
      onAddPointRef.current(pt[0], pt[1])
    }

    function onMouseDown(e: MouseEvent) {
      isDragging.current = true
      const pt = getLatLng(e.clientX, e.clientY)
      lastFreehandPt.current = pt
      onAddPointRef.current(pt[0], pt[1])
    }
    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) return
      tryAddSampledPoint(e.clientX, e.clientY)
    }
    function onMouseUp() { isDragging.current = false }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault()
      isDragging.current = true
      const t = e.touches[0]
      const pt = getLatLng(t.clientX, t.clientY)
      lastFreehandPt.current = pt
      onAddPointRef.current(pt[0], pt[1])
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault()
      if (!isDragging.current) return
      tryAddSampledPoint(e.touches[0].clientX, e.touches[0].clientY)
    }
    function onTouchEnd() { isDragging.current = false }

    container.addEventListener('mousedown', onMouseDown)
    container.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    container.addEventListener('touchstart', onTouchStart, { passive: false })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd)

    return () => {
      container.removeEventListener('mousedown', onMouseDown)
      container.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
      map.dragging.enable()
      if (tap) tap.enable()
      isDragging.current = false
      lastFreehandPt.current = null
    }
  }, [mode, map])

  return null
}
