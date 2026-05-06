import { CircleMarker, Polyline, Tooltip } from 'react-leaflet'

const BART_COLOR = '#60a5fa'

const BART_STATIONS = [
  { name: 'Embarcadero', lat: 37.7930, lng: -122.3970 },
  { name: 'Montgomery St', lat: 37.7893, lng: -122.4016 },
  { name: 'Powell St', lat: 37.7845, lng: -122.4079 },
  { name: 'Civic Center', lat: 37.7796, lng: -122.4139 },
  { name: '16th St Mission', lat: 37.7650, lng: -122.4194 },
  { name: '24th St Mission', lat: 37.7525, lng: -122.4183 },
  { name: 'Glen Park', lat: 37.7330, lng: -122.4340 },
  { name: 'Balboa Park', lat: 37.7228, lng: -122.4475 },
]

const BART_LINE: [number, number][] = BART_STATIONS.map((s) => [s.lat, s.lng])

export default function TransitLayer() {
  return (
    <>
      <Polyline
        positions={BART_LINE}
        pathOptions={{ color: BART_COLOR, weight: 4, opacity: 0.7 }}
      />
      {BART_STATIONS.map((station) => (
        <CircleMarker
          key={station.name}
          center={[station.lat, station.lng]}
          radius={6}
          pathOptions={{ color: BART_COLOR, fillColor: 'white', fillOpacity: 1, weight: 2.5 }}
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={0.9}>
            <span className="text-xs font-medium">🚇 {station.name}</span>
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  )
}
