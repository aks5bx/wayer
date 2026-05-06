import { useEffect, useState } from 'react'
import { GeoJSON } from 'react-leaflet'
import type { FeatureCollection } from 'geojson'
import type { PathOptions } from 'leaflet'

const SF_NEIGHBORHOODS_URL =
  'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/san-francisco.geojson'

const style: PathOptions = {
  color: '#7c3aed',
  weight: 1.2,
  opacity: 0.45,
  fill: false,
  dashArray: '6 5',
}

function isValidFeatureCollection(data: unknown): data is FeatureCollection {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as any).type === 'FeatureCollection' &&
    Array.isArray((data as any).features) &&
    (data as any).features.length > 0 &&
    (data as any).features[0]?.geometry !== null
  )
}

export default function NeighborhoodLayer() {
  const [data, setData] = useState<FeatureCollection | null>(null)

  useEffect(() => {
    fetch(SF_NEIGHBORHOODS_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((json) => {
        if (isValidFeatureCollection(json)) setData(json)
      })
      .catch(() => {})
  }, [])

  if (!data) return null

  return (
    <GeoJSON
      key="neighborhoods"
      data={data}
      style={() => style}
    />
  )
}
