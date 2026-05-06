import { useEffect, useState } from 'react'
import { Polyline, Tooltip } from 'react-leaflet'

const LINE_COLORS: Record<string, string> = {
  N: '#2563EB',
  J: '#D97706',
  K: '#16A34A',
  L: '#84CC16',
  M: '#059669',
  T: '#DC2626',
}

const LINE_NAMES: Record<string, string> = {
  N: 'N Judah',
  J: 'J Church',
  K: 'K Ingleside',
  L: 'L Taraval',
  M: 'M Ocean View',
  T: 'T Third',
}

const OVERPASS_QUERY = `[out:json][timeout:30];rel[type=route][route~"tram|light_rail"][ref~"^[NJKLMT]$"](37.69,-122.56,37.84,-122.35);out geom;`

interface LineData {
  ref: string
  name: string
  color: string
  segments: [number, number][][]
}

let cache: LineData[] | null = null

export default function MuniMetroLayer() {
  const [lines, setLines] = useState<LineData[]>(cache ?? [])

  useEffect(() => {
    if (cache) return

    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: new URLSearchParams({ data: OVERPASS_QUERY }),
    })
      .then((r) => r.json())
      .then((data: { elements: any[] }) => {
        const byRef = new Map<string, LineData>()

        for (const el of data.elements) {
          if (el.type !== 'relation') continue
          const ref: string = el.tags?.ref ?? ''
          if (!LINE_COLORS[ref]) continue

          const segments: [number, number][][] = (el.members ?? [])
            .filter((m: any) => m.type === 'way' && Array.isArray(m.geometry))
            .map((m: any) =>
              (m.geometry as { lat: number; lon: number }[]).map(
                (n) => [n.lat, n.lon] as [number, number]
              )
            )
            .filter((s: [number, number][]) => s.length > 1)

          if (!byRef.has(ref)) {
            byRef.set(ref, {
              ref,
              name: el.tags?.name ?? LINE_NAMES[ref] ?? ref,
              color: LINE_COLORS[ref],
              segments: [],
            })
          }
          byRef.get(ref)!.segments.push(...segments)
        }

        cache = Array.from(byRef.values())
        setLines(cache)
      })
      .catch(() => {})
  }, [])

  return (
    <>
      {lines.map((line) => (
        <Polyline
          key={line.ref}
          positions={line.segments as any}
          pathOptions={{ color: line.color, weight: 3, opacity: 0.85 }}
        >
          <Tooltip sticky direction="top" opacity={0.95}>
            <span className="text-xs font-semibold">{line.name}</span>
          </Tooltip>
        </Polyline>
      ))}
    </>
  )
}
