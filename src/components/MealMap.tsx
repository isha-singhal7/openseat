import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix default marker icons broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const UC_BERKELEY: [number, number] = [37.8719, -122.2585]

type Meal = {
  id: string
  data: {
    place: string
    address: string
    lat: number
    lng: number
    time: string
    seats: number
    type: string
    hostId: string
    notes?: string
  }
}

type Props =
  | { mode: 'view'; meals: Meal[]; onSelect?: (id: string) => void }
  | { mode: 'pick'; lat: number | null; lng: number | null; onPick: (lat: number, lng: number) => void }

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) })
  return null
}

function FitBounds({ meals }: { meals: Meal[] }) {
  const map = useMap()
  useEffect(() => {
    if (meals.length === 0) return
    const bounds = L.latLngBounds(meals.map((m) => [m.data.lat, m.data.lng]))
    map.fitBounds(bounds, { maxZoom: 15, padding: [40, 40] })
  }, [map, meals.length])
  return null
}

const MAP_STYLE = { height: '360px', width: '100%', borderRadius: '0.5rem' }

export function MealMap(props: Props) {
  if (props.mode === 'pick') {
    return (
      <MapContainer center={UC_BERKELEY} zoom={15} style={MAP_STYLE}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <ClickHandler onPick={props.onPick} />
        {props.lat != null && props.lng != null && (
          <Marker position={[props.lat, props.lng]} />
        )}
      </MapContainer>
    )
  }

  return (
    <MapContainer center={UC_BERKELEY} zoom={15} style={MAP_STYLE}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <FitBounds meals={props.meals} />
      {props.meals.map((m) => (
        <Marker key={m.id} position={[m.data.lat, m.data.lng]}>
          <Popup>
            <strong>{m.data.place}</strong>
            <br />
            {new Date(m.data.time).toLocaleString()}
            <br />
            {m.data.seats} open seat{m.data.seats !== 1 ? 's' : ''}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
