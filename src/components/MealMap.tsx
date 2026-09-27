import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

// Fix default marker icons broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

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

export function MealMap(props: Props) {
  if (props.mode === 'pick') {
    return (
      <MapContainer
        center={[37.8716, -122.2727]}
        zoom={13}
        style={{ height: '300px', width: '100%', borderRadius: '0.5rem' }}
      >
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

  const center: [number, number] =
    props.meals.length > 0
      ? [props.meals[0].data.lat, props.meals[0].data.lng]
      : [37.8716, -122.2727]

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '350px', width: '100%', borderRadius: '0.5rem' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
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
