import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

interface Props {
  pins: { lat: number; lng: number }[]
}

export default function HeatmapLayer({ pins }: Props) {
  const map = useMap()
  const heatRef = useRef<any>(null)

  useEffect(() => {
    if (pins.length === 0) return

    let cancelled = false
    ;(window as any).L = L

    import('leaflet.heat')
      .then(() => {
        if (cancelled) return
        heatRef.current = (L as any).heatLayer(
          pins.map((p) => [p.lat, p.lng, 1.0]),
          { radius: 35, blur: 25, maxZoom: 17, minOpacity: 0.3 }
        )
        heatRef.current.addTo(map)
      })
      .catch(() => {})

    return () => {
      cancelled = true
      if (heatRef.current) {
        map.removeLayer(heatRef.current)
        heatRef.current = null
      }
    }
  }, [map, pins])

  return null
}
