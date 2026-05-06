import { useEffect, useState } from 'react'
import { GeoJSON } from 'react-leaflet'
import type { FeatureCollection, Feature, MultiLineString } from 'geojson'
import type { PathOptions } from 'leaflet'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// Exclude one-way ways to avoid dual-carriageway duplicates on tram streets.
// Also exclude ways with a railway tag (tram tracks that are also tagged as highway).
const ROAD_FILTER = '["highway"~"^(primary|secondary|tertiary|residential|unclassified)$"][!"railway"]["oneway"!~"^(yes|-1)$"]'

const OVERPASS_QUERY = `[out:json][timeout:25];
(
  way["name"="Clement Street"]${ROAD_FILTER}(37.779,-122.470,37.785,-122.453);
  way["name"="Irving Street"]${ROAD_FILTER}(37.761,-122.472,37.768,-122.457);
  way["name"="Valencia Street"]${ROAD_FILTER}(37.746,-122.424,37.768,-122.418);
  way["name"="Mission Street"]${ROAD_FILTER}(37.739,-122.423,37.768,-122.416);
  way["name"="Castro Street"]${ROAD_FILTER}(37.751,-122.437,37.765,-122.431);
  way["name"="Haight Street"]${ROAD_FILTER}(37.767,-122.456,37.773,-122.429);
  way["name"="Hayes Street"]${ROAD_FILTER}(37.772,-122.429,37.777,-122.419);
  way["name"="Fillmore Street"]${ROAD_FILTER}(37.776,-122.435,37.800,-122.429);
  way["name"="Union Street"]${ROAD_FILTER}(37.795,-122.439,37.802,-122.421);
  way["name"="Chestnut Street"]${ROAD_FILTER}(37.800,-122.439,37.806,-122.417);
  way["name"="Polk Street"]${ROAD_FILTER}(37.780,-122.426,37.800,-122.419);
  way["name"="Columbus Avenue"]${ROAD_FILTER}(37.795,-122.415,37.811,-122.404);
  way["name"="Grant Avenue"]${ROAD_FILTER}(37.788,-122.411,37.803,-122.404);
  way["name"="24th Street"]${ROAD_FILTER}(37.749,-122.437,37.755,-122.416);
  way["name"="Ocean Avenue"]${ROAD_FILTER}(37.719,-122.471,37.726,-122.452);
);
out tags geom;`

interface OsmWay {
  type: string
  geometry?: Array<{ lat: number; lon: number }>
  tags?: Record<string, string>
}

// Stitch way segments end-to-end wherever they share an endpoint, eliminating
// the round-cap dots that Leaflet draws at every internal segment boundary.
function stitchSegments(segs: [number, number][][]): [number, number][][] {
  const EPSILON = 1e-5
  const eq = (a: [number, number], b: [number, number]) =>
    Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON

  const pool = segs.map((s) => s.slice()) as [number, number][][]
  const chains: [number, number][][] = []

  while (pool.length > 0) {
    let chain = pool.splice(0, 1)[0]
    let grew = true
    while (grew) {
      grew = false
      for (let i = pool.length - 1; i >= 0; i--) {
        const seg = pool[i]
        if (eq(chain[chain.length - 1], seg[0])) {
          chain = [...chain, ...seg.slice(1)]; pool.splice(i, 1); grew = true
        } else if (eq(chain[chain.length - 1], seg[seg.length - 1])) {
          chain = [...chain, ...[...seg].reverse().slice(1)]; pool.splice(i, 1); grew = true
        } else if (eq(chain[0], seg[seg.length - 1])) {
          chain = [...seg, ...chain.slice(1)]; pool.splice(i, 1); grew = true
        } else if (eq(chain[0], seg[0])) {
          chain = [...[...seg].reverse(), ...chain.slice(1)]; pool.splice(i, 1); grew = true
        }
      }
    }
    chains.push(chain)
  }
  return chains
}

function osmToGeoJson(elements: OsmWay[]): FeatureCollection {
  const byName = new Map<string, [number, number][][]>()
  for (const el of elements) {
    if (el.type !== 'way' || !el.geometry || el.geometry.length < 2) continue
    const name = el.tags?.name ?? ''
    if (!byName.has(name)) byName.set(name, [])
    byName.get(name)!.push(el.geometry.map(({ lat, lon }) => [lon, lat] as [number, number]))
  }
  const features: Feature<MultiLineString>[] = []
  for (const [name, rawSegs] of byName) {
    const stitched = stitchSegments(rawSegs)
    features.push({
      type: 'Feature',
      properties: { name },
      geometry: { type: 'MultiLineString', coordinates: stitched },
    })
  }
  return { type: 'FeatureCollection', features }
}

const style: PathOptions = {
  color: '#f97316',
  weight: 4,
  opacity: 0.5,
  lineCap: 'round',
  lineJoin: 'round',
}

export default function CommercialLayer() {
  const [data, setData] = useState<FeatureCollection | null>(null)

  useEffect(() => {
    fetch(OVERPASS_URL, {
      method: 'POST',
      body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((json) => {
        const geoJson = osmToGeoJson(json.elements ?? [])
        if (geoJson.features.length > 0) setData(geoJson)
      })
      .catch(() => {})
  }, [])

  if (!data) return null

  return (
    <GeoJSON
      key="commercial"
      data={data}
      style={() => style}
      onEachFeature={(feature, layer) => {
        const name = feature.properties?.name as string | undefined
        if (name) layer.bindTooltip(name, { sticky: true, direction: 'top' })
      }}
    />
  )
}
