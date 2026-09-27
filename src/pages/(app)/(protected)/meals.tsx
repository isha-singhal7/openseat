import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthProfileReady, useQuery } from 'deepspace'
import { callAction } from '@/lib/call-action'
import { Button } from '@/components/ui'

const MealMap = lazy(() => import('@/components/MealMap').then((m) => ({ default: m.MealMap })))

type MealData = {
  place: string; address: string; lat: number; lng: number
  time: string; seats: number; type: string; hostId: string
  notes?: string; attendees?: string
}
type MealRecord = { id: string; data: MealData }
type JoinRecord = { id: string; data: { mealId: string; userId: string; hostId: string; status: string } }
type ProfileRecord = { id: string; data: { userId: string; username: string; displayName: string } }

const TYPE_LABELS: Record<string, string> = {
  casual: 'Casual', picnic: 'Picnic', potluck: 'Potluck', 'game night': 'Game Night',
}

function MealCard({
  meal, myId, joinRequests, profileMap,
}: {
  meal: MealRecord
  myId: string
  joinRequests: JoinRecord[]
  profileMap: Record<string, string>
}) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const isHost = meal.data.hostId === myId
  const attendees: string[] = JSON.parse(meal.data.attendees || '[]')
  const dt = new Date(meal.data.time)

  // Requests for this meal
  const mealRequests = joinRequests.filter((r) => r.data.mealId === meal.id)
  const myRequest = mealRequests.find((r) => r.data.userId === myId)
  const pendingRequests = mealRequests.filter((r) => r.data.status === 'pending')
  const seatsLeft = meal.data.seats - attendees.length

  async function join() {
    setBusy(true); setMsg(null)
    const r = await callAction('requestJoin', { mealId: meal.id })
    if (!r.success) setMsg(r.error ?? 'Error.')
    setBusy(false)
  }

  async function respond(requestId: string, response: 'approved' | 'declined') {
    setBusy(true); setMsg(null)
    const r = await callAction('respondJoin', { requestId, response })
    if (!r.success) setMsg(r.error ?? 'Error.')
    setBusy(false)
  }

  async function cancel() {
    setBusy(true)
    await callAction('cancelMeal', { mealId: meal.id })
    setBusy(false)
  }

  return (
    <li className="rounded-lg border border-border bg-card px-4 py-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">{meal.data.place}</p>
          <p className="text-xs text-muted-foreground">{meal.data.address}</p>
        </div>
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {TYPE_LABELS[meal.data.type] ?? meal.data.type}
        </span>
      </div>

      <p className="text-sm text-foreground">
        {dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
        at {dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
      </p>

      <p className="text-sm text-muted-foreground">
        {seatsLeft} of {meal.data.seats} seat{meal.data.seats !== 1 ? 's' : ''} open
        {isHost && <span className="ml-2 text-xs">(you&apos;re hosting)</span>}
      </p>

      {meal.data.notes && <p className="text-sm text-muted-foreground italic">{meal.data.notes}</p>}

      {/* Approved attendees (visible to all who can see the meal) */}
      {attendees.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Attending: {attendees.map((id) => profileMap[id] ?? id).join(', ')}
        </p>
      )}

      {/* Host: pending join requests */}
      {isHost && pendingRequests.length > 0 && (
        <div className="mt-1 flex flex-col gap-1.5 border-t border-border pt-2">
          <p className="text-xs font-medium text-muted-foreground">Join requests</p>
          {pendingRequests.map((r) => (
            <div key={r.id} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{profileMap[r.data.userId] ?? r.data.userId}</span>
              <div className="flex gap-2">
                <Button size="sm" disabled={busy} onClick={() => respond(r.id, 'approved')}>
                  Approve
                </Button>
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => respond(r.id, 'declined')}>
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Non-host: join button or status */}
      {!isHost && (
        <div className="mt-1">
          {attendees.includes(myId) ? (
            <span className="text-xs text-green-600 font-medium">You&apos;re attending</span>
          ) : myRequest?.data.status === 'pending' ? (
            <span className="text-xs text-muted-foreground">Request pending…</span>
          ) : myRequest?.data.status === 'declined' ? (
            <span className="text-xs text-muted-foreground">Request declined</span>
          ) : seatsLeft <= 0 ? (
            <span className="text-xs text-muted-foreground">Full</span>
          ) : (
            <Button size="sm" disabled={busy} onClick={join}>
              {busy ? 'Sending…' : 'Request to join'}
            </Button>
          )}
        </div>
      )}

      {msg && <p className="text-xs text-destructive">{msg}</p>}

      {/* Host controls */}
      {isHost && (
        <div className="flex gap-3 border-t border-border pt-2 mt-1">
          <button
            disabled={busy}
            onClick={cancel}
            className="text-xs text-destructive underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
          >
            {busy ? 'Cancelling…' : 'Cancel meal'}
          </button>
        </div>
      )}
    </li>
  )
}

export default function MealsPage() {
  const { user } = useAuthProfileReady({ requireUser: true })
  const myId = user?.userId ?? ''
  const [view, setView] = useState<'list' | 'map'>('list')

  const { records: mealRecords } = useQuery('meals')
  const { records: joinRecords } = useQuery('join_requests')
  const { records: profileRecords } = useQuery('profiles')

  const now = new Date()
  const meals = ((mealRecords ?? []) as MealRecord[])
    .filter((r) => new Date(r.data.time) > now)
    .sort((a, b) => new Date(a.data.time).getTime() - new Date(b.data.time).getTime())

  const joinRequests = (joinRecords ?? []) as JoinRecord[]

  // Map userId → displayName for attendee/request display
  const profileMap: Record<string, string> = {}
  for (const p of (profileRecords ?? []) as ProfileRecord[]) {
    profileMap[p.data.userId] = p.data.displayName
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Meals</h1>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden text-sm">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 ${view === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-3 py-1.5 ${view === 'map' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'}`}
            >
              Map
            </button>
          </div>
          <Link
            to="/meals/new"
            className="inline-flex h-9 items-center justify-center rounded-md px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          >
            + Post meal
          </Link>
        </div>
      </div>

      {view === 'map' && (
        <Suspense fallback={<div className="h-[350px] rounded-lg bg-muted animate-pulse" />}>
          <MealMap mode="view" meals={meals} />
        </Suspense>
      )}

      {meals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming meals from friends. Post one!</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {meals.map((m) => (
            <MealCard
              key={m.id}
              meal={m}
              myId={myId}
              joinRequests={joinRequests}
              profileMap={profileMap}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
