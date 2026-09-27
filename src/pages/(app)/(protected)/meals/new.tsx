import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { callAction } from '@/lib/call-action'
import { Button, Input, Label } from '@/components/ui'

const MealMap = lazy(() => import('@/components/MealMap').then((m) => ({ default: m.MealMap })))

// Minimum datetime string for the input (now + 5 min)
function minDatetime() {
  const d = new Date(Date.now() + 5 * 60_000)
  return d.toISOString().slice(0, 16)
}

export default function NewMealPage() {
  const navigate = useNavigate()
  const [place, setPlace] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [time, setTime] = useState('')
  const [seats, setSeats] = useState(1)
  const [type, setType] = useState('casual')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (lat == null || lng == null) {
      setError('Click the map to set a location.')
      return
    }
    setSaving(true)
    setError(null)
    const result = await callAction('postMeal', { place, address, lat, lng, time, seats, type, notes })
    setSaving(false)
    if (!result.success) { setError(result.error ?? 'Error.'); return }
    navigate('/meals')
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-xl font-semibold text-foreground">Post a meal</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="place">Place name</Label>
          <Input id="place" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="e.g. Free Speech Movement Café" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Moffitt Library, Berkeley, CA" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Location — click the map to drop a pin</Label>
          <Suspense fallback={<div className="h-[300px] rounded-lg bg-muted animate-pulse" />}>
            <MealMap
              mode="pick"
              lat={lat}
              lng={lng}
              onPick={(la, lo) => { setLat(la); setLng(lo) }}
            />
          </Suspense>
          {lat != null && (
            <p className="text-xs text-muted-foreground">
              Pin: {lat.toFixed(5)}, {lng!.toFixed(5)}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="time">Date & time</Label>
            <Input
              id="time"
              type="datetime-local"
              value={time}
              min={minDatetime()}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
          <div className="flex w-24 flex-col gap-1.5">
            <Label htmlFor="seats">Open seats</Label>
            <Input
              id="seats"
              type="number"
              min={1}
              max={20}
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="casual">Casual</option>
            <option value="picnic">Picnic</option>
            <option value="potluck">Potluck</option>
            <option value="game night">Game Night</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notes (optional)</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything guests should know…"
            rows={3}
            maxLength={300}
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Posting…' : 'Post meal'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/meals')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
