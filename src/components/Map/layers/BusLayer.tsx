import { useEffect, useState } from 'react'
import { Polyline, Tooltip } from 'react-leaflet'

const ROUTE_NEIGHBORHOODS: Record<string, string[]> = {
  '1':  ['Outer Richmond', 'Inner Richmond', 'Nob Hill', 'Chinatown'],
  '5':  ['Outer Richmond', 'Inner Richmond', 'Western Addition', 'Tenderloin'],
  '14': ['Excelsior', 'Outer Mission', 'Mission', 'Tenderloin', 'SOMA'],
  '22': ['Dogpatch', 'Potrero Hill', 'Mission', 'Castro', 'Western Addition', 'Pacific Heights', 'Marina'],
  '24': ['Noe Valley', 'Castro', 'Haight Ashbury', 'Western Addition', 'Pacific Heights'],
  '28': ['Outer Sunset', 'Inner Sunset', 'Outer Richmond', 'Inner Richmond'],
  '30': ['Mission Bay', 'SOMA', 'Chinatown', 'North Beach', 'Marina'],
  '33': ['SOMA', 'Castro', 'Haight Ashbury', 'Western Addition'],
  '38': ['Outer Richmond', 'Inner Richmond', 'Western Addition', 'Tenderloin'],
  '43': ['Inner Sunset', 'Forest Hill', 'Western Addition', 'Marina'],
  '47': ['Mission Bay', 'SOMA', 'Tenderloin', 'North Beach'],
  '49': ['Bayview', 'Mission', 'SOMA', 'North Beach'],
}

const REFS = Object.keys(ROUTE_NEIGHBORHOODS).join('|')
const OVERPASS_QUERY = `[out:json][timeout:30];rel[type=route][route=bus][ref~"^(${REFS})$"](37.69,-122.56,37.84,-122.35);out geom;`

interface RouteData {
  ref: string
  name: string
  segments: [number, number][][]
}

interface Props {
  active: boolean
  activeNeighborhoods: string[]
}

export default function BusLayer({ active, activeNeighborhoods }: Props) {
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [fetched, setFetched] = useState(false)

  useEffect(() => {
    if (!active || fetched) return
    setFetched(true)

    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: new URLSearchParams({ data: OVERPASS_QUERY }),
    })
      .then((r) => r.json())
      .then((data: { elements: any[] }) => {
        const byRef = new Map<string, RouteData>()

        for (const el of data.elements) {
          if (el.type !== 'relation') continue
          const ref: string = el.tags?.ref ?? ''
          if (!ROUTE_NEIGHBORHOODS[ref]) continue

          const segments: [number, number][][] = (el.members ?? [])
            .filter((m: any) => m.type === 'way' && Array.isArray(m.geometry))
            .map((m: any) =>
              (m.geometry as { lat: number; lon: number }[]).map(
                (n) => [n.lat, n.lon] as [number, number]
              )
            )
            .filter((s: [number, number][]) => s.length > 1)

          if (!byRef.has(ref)) {
            byRef.set(ref, { ref, name: el.tags?.name ?? ref, segments: [] })
          }
          byRef.get(ref)!.segments.push(...segments)
        }

        setRoutes(Array.from(byRef.values()))
      })
      .catch(() => {})
  }, [active, fetched])

  if (!active || activeNeighborhoods.length === 0) return null

  const activeSet = new Set(activeNeighborhoods)
  const visible = routes.filter((r) =>
    (ROUTE_NEIGHBORHOODS[r.ref] ?? []).some((n) => activeSet.has(n))
  )

  return (
    <>
      {visible.map((route) => (
        <Polyline
          key={route.ref}
          positions={route.segments as any}
          pathOptions={{ color: '#6b7280', weight: 2, opacity: 0.7 }}
        >
          <Tooltip sticky direction="top" opacity={0.95}>
            <span className="text-xs font-semibold">{route.ref} {route.name}</span>
          </Tooltip>
        </Polyline>
      ))}
    </>
  )
}
