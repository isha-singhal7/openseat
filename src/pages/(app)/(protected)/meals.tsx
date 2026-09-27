import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthProfileReady, useQuery } from 'deepspace'
import { callAction } from '@/lib/call-action'

// Leaflet must be loaded client-side only (no SSR)
const MealMap = lazy(() => import('@/components/MealMap').then((m) => ({ default: m.MealMap })))

type MealData = {
  place: string; address: string; lat: number; lng: number
  time: string; seats: number; type: string; hostId: string; notes?: string
}
type MealRecord = { id: string; data: MealData }

const TYPE_LABELS: Record<string, string> = {
  casual: 'Casual', picnic: 'Picnic', potluck: 'Potluck', 'game night': 'Game Night',
}

export default function MealsPage() {
  const { user } = useAuthProfileReady({ requireUser: true })
  const myId = user?.userId ?? ''
  const [view, setView] = useState<'list' | 'map'>('list')
  const [cancelling, setCancelling] = useState<string | null>(null)

  const { records } = useQuery('meals')
  const now = new Date()

  // Client-side time filter: hide past meals (scheduled job is a next step)
  const meals = ((records ?? []) as MealRecord[])
    .filter((r) => new Date(r.data.time) > now)
    .sort((a, b) => new Date(a.data.time).getTime() - new Date(b.data.time).getTime())

  async function cancel(mealId: string) {
    setCancelling(mealId)
    await callAction('cancelMeal', { mealId })
    setCancelling(null)
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
          <Link to="/meals/new" className="inline-flex h-9 items-center justify-center rounded-md px-3 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90">
            + Post meal
          </Link>
        </div>
      </div>

      {view === 'map' ? (
        <Suspense fallback={<div className="h-[350px] rounded-lg bg-muted animate-pulse" />}>
          <MealMap mode="view" meals={meals} />
        </Suspense>
      ) : null}

      {meals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming meals from friends. Post one!</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {meals.map((m) => {
            const isHost = m.data.hostId === myId
            const dt = new Date(m.data.time)
            return (
              <li key={m.id} className="rounded-lg border border-border bg-card px-4 py-4 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{m.data.place}</p>
                    <p className="text-xs text-muted-foreground">{m.data.address}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                    {TYPE_LABELS[m.data.type] ?? m.data.type}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                  at {dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {m.data.seats} open seat{m.data.seats !== 1 ? 's' : ''}
                  {isHost && <span className="ml-2 text-xs">(you&apos;re hosting)</span>}
                </p>
                {m.data.notes && <p className="text-sm text-muted-foreground italic">{m.data.notes}</p>}
                {isHost && (
                  <div className="mt-2 flex gap-2">
                    <Link
                      to={`/meals/${m.id}/edit`}
                      className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => cancel(m.id)}
                      disabled={cancelling === m.id}
                      className="text-xs text-destructive underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
                    >
                      {cancelling === m.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
