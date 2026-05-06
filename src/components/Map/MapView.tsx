import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { Pin, Category } from '../../types'
import { CATEGORIES } from '../../types'
import LayerControl, { type LayerState } from './LayerControl'
import LayerErrorBoundary from './LayerErrorBoundary'
import NeighborhoodLayer from './layers/NeighborhoodLayer'
import HeatmapLayer from './layers/HeatmapLayer'
import CommercialLayer from './layers/CommercialLayer'
import TransitLayer from './layers/TransitLayer'
import MuniMetroLayer from './layers/MuniMetroLayer'
import BusLayer from './layers/BusLayer'
import BusFilter from './BusFilter'
import MapTrailHandler from './MapTrailHandler'

interface Props {
  pins: Pin[]
  isAddingMode: boolean
  isDropPinMode: boolean
  isDrawingTrail: boolean
  trailMode: 'click' | 'freehand'
  trailSnap: boolean
  lastTrailWaypoint?: [number, number]
  selectedPinId: string | null
  onDropPin: (lat: number, lng: number) => void
  onAddTrailPoint: (lat: number, lng: number) => void
  onAddRoutedSegment: (points: [number, number][]) => void
  onPinSelect: (pin: Pin) => void
  trailInProgress?: [number, number][]
}

const SF_CENTER: [number, number] = [37.7749, -122.4194]
const DEFAULT_ZOOM = 14
const MIN_ZOOM = 13

function createMarkerIcon(category: Category, isSelected: boolean) {
  const size = isSelected ? 28 : 20
  const border = isSelected ? 3 : 2
  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${category.color};
      border-radius: 50%;
      border: ${border}px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.25);
      cursor: pointer;
    "></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function DropPinHandler({ active, onDropPin }: { active: boolean; onDropPin: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (active) onDropPin(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function MapView({
  pins, isAddingMode, isDropPinMode, isDrawingTrail,
  trailMode, trailSnap, lastTrailWaypoint,
  selectedPinId, onDropPin, onAddTrailPoint, onAddRoutedSegment,
  onPinSelect, trailInProgress,
}: Props) {
  const [layers, setLayers] = useState<LayerState>({
    neighborhoods: true,
    commercial: true,
    muniMetro: true,
    transit: true,
    busRoutes: false,
    heatmap: false,
  })
  const [activeBusNeighborhoods, setActiveBusNeighborhoods] = useState<string[]>([])
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null)

  function toggleLayer(key: keyof LayerState) {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleBusNeighborhood(name: string) {
    setActiveBusNeighborhoods((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  return (
    <div className={`w-full h-full relative ${isAddingMode ? 'adding-mode' : ''}`}>
      <LayerControl layers={layers} onToggle={toggleLayer} />

      {layers.busRoutes && (
        <BusFilter
          activeNeighborhoods={activeBusNeighborhoods}
          onToggle={toggleBusNeighborhood}
          onClear={() => setActiveBusNeighborhoods([])}
        />
      )}

      <MapContainer
        center={SF_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        <DropPinHandler active={isDropPinMode} onDropPin={onDropPin} />
        {isDrawingTrail && (
          <MapTrailHandler
            mode={trailMode}
            snap={trailSnap}
            lastWaypoint={lastTrailWaypoint}
            onAddPoint={onAddTrailPoint}
            onAddRoutedSegment={onAddRoutedSegment}
          />
        )}

        {layers.neighborhoods && (
          <LayerErrorBoundary>
            <NeighborhoodLayer />
          </LayerErrorBoundary>
        )}
        {layers.commercial && (
          <LayerErrorBoundary>
            <CommercialLayer />
          </LayerErrorBoundary>
        )}
        {layers.muniMetro && (
          <LayerErrorBoundary>
            <MuniMetroLayer />
          </LayerErrorBoundary>
        )}
        {layers.transit && (
          <LayerErrorBoundary>
            <TransitLayer />
          </LayerErrorBoundary>
        )}
        <LayerErrorBoundary>
          <BusLayer active={layers.busRoutes} activeNeighborhoods={activeBusNeighborhoods} />
        </LayerErrorBoundary>
        {layers.heatmap && (
          <LayerErrorBoundary>
            <HeatmapLayer pins={pins} />
          </LayerErrorBoundary>
        )}

        {/* Saved trail polylines */}
        {pins
          .filter((p) => p.trail_coordinates && p.trail_coordinates.length >= 2)
          .map((pin) => {
            const category = CATEGORIES.find((c) => c.id === pin.category_id) ?? CATEGORIES[5]
            const highlighted = pin.id === selectedPinId || pin.id === hoveredPinId
            return (
              <Polyline
                key={`trail-${pin.id}`}
                positions={pin.trail_coordinates!}
                pathOptions={{
                  color: category.color,
                  weight: highlighted ? 5 : 3,
                  opacity: highlighted ? 0.9 : 0.35,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
                eventHandlers={{
                  click: () => onPinSelect(pin),
                  mouseover: () => setHoveredPinId(pin.id),
                  mouseout: () => setHoveredPinId(null),
                }}
              />
            )
          })}

        {/* In-progress trail preview while drawing */}
        {trailInProgress && trailInProgress.length >= 2 && (
          <Polyline
            positions={trailInProgress}
            pathOptions={{ color: '#f97316', weight: 4, opacity: 0.75, dashArray: '10 6', lineCap: 'round' }}
          />
        )}

        {pins.map((pin) => {
          const category = CATEGORIES.find((c) => c.id === pin.category_id) ?? CATEGORIES[5]
          const isSelected = pin.id === selectedPinId
          return (
            <Marker
              key={pin.id}
              position={[pin.lat, pin.lng]}
              icon={createMarkerIcon(category, isSelected)}
              eventHandlers={{
                click: () => onPinSelect(pin),
                mouseover: () => setHoveredPinId(pin.id),
                mouseout: () => setHoveredPinId(null),
              }}
              zIndexOffset={isSelected ? 1000 : 0}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}
