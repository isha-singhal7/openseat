import { useState } from 'react'
import { useAuthProfileReady, useQuery } from 'deepspace'
import { callAction } from '@/lib/call-action'
import { Button, Input } from '@/components/ui'

type RequestRecord = { id: string; data: { fromId: string; toId: string; status: string } }
type FriendshipRecord = { id: string; data: { userAId: string; userBId: string } }
type ProfileData = { userId: string; username: string; displayName: string }
type ProfileRecord = { id: string; data: ProfileData }

// Inner component so all hooks are always called unconditionally
function FriendsInner({ myId }: { myId: string }) {
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [actionMsg, setActionMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const { records: requestRecords } = useQuery('friend_requests')
  const { records: friendshipRecords } = useQuery('friendships')
  // Load all profiles for display names; also used for search
  const { records: allProfiles } = useQuery('profiles')

  const requests = (requestRecords ?? []) as RequestRecord[]
  const friendships = (friendshipRecords ?? []) as FriendshipRecord[]
  const profiles = (allProfiles ?? []) as ProfileRecord[]

  const byUserId: Record<string, ProfileData> = {}
  for (const p of profiles) byUserId[p.data.userId] = p.data

  const incoming = requests.filter((r) => r.data.toId === myId && r.data.status === 'pending')
  const outgoing = requests.filter((r) => r.data.fromId === myId && r.data.status === 'pending')
  const friendIds = friendships.map((r) => (r.data.userAId === myId ? r.data.userBId : r.data.userAId))

  // Client-side search result from already-loaded profiles
  const foundProfile =
    searchTerm.length >= 3
      ? profiles.find((p) => p.data.username === searchTerm)?.data ?? null
      : undefined // undefined = haven't searched yet

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setActionMsg(null)
    setSearchTerm(searchInput.trim().toLowerCase())
  }

  async function sendRequest(toUsername: string) {
    setActionMsg(null)
    const result = await callAction('sendFriendRequest', { toUsername })
    setActionMsg({ ok: result.success, text: result.success ? 'Friend request sent!' : (result.error ?? 'Error.') })
    if (result.success) { setSearchTerm(''); setSearchInput('') }
  }

  async function respond(requestId: string, response: 'accepted' | 'declined') {
    setActionMsg(null)
    const result = await callAction('respondFriendRequest', { requestId, response })
    if (!result.success) setActionMsg({ ok: false, text: result.error ?? 'Error.' })
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 flex flex-col gap-8">
      <h1 className="text-xl font-semibold text-foreground">Friends</h1>

      {/* Add a friend */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">Add a friend</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setSearchTerm('') }}
            placeholder="Search by username"
            className="flex-1"
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        {searchTerm && foundProfile === null && (
          <p className="mt-2 text-sm text-muted-foreground">No user found with that username.</p>
        )}
        {foundProfile && (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{foundProfile.displayName}</p>
              <p className="text-xs text-muted-foreground">@{foundProfile.username}</p>
            </div>
            {foundProfile.userId === myId ? (
              <span className="text-xs text-muted-foreground">That&apos;s you</span>
            ) : friendIds.includes(foundProfile.userId) ? (
              <span className="text-xs text-muted-foreground">Already friends</span>
            ) : outgoing.some((r) => r.data.toId === foundProfile.userId) ? (
              <span className="text-xs text-muted-foreground">Request pending</span>
            ) : incoming.some((r) => r.data.fromId === foundProfile.userId) ? (
              <span className="text-xs text-muted-foreground">They sent you a request below</span>
            ) : (
              <Button size="sm" onClick={() => sendRequest(foundProfile.username)}>Send request</Button>
            )}
          </div>
        )}
        {actionMsg && (
          <p className={`mt-2 text-sm ${actionMsg.ok ? 'text-green-600' : 'text-destructive'}`}>
            {actionMsg.text}
          </p>
        )}
      </section>

      {/* Incoming requests */}
      {incoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Incoming requests ({incoming.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {incoming.map((r) => {
              const p = byUserId[r.data.fromId]
              return (
                <li key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p?.displayName ?? r.data.fromId}</p>
                    {p && <p className="text-xs text-muted-foreground">@{p.username}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => respond(r.id, 'accepted')}>Accept</Button>
                    <Button size="sm" variant="secondary" onClick={() => respond(r.id, 'declined')}>Decline</Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Sent requests */}
      {outgoing.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">Sent requests</h2>
          <ul className="flex flex-col gap-2">
            {outgoing.map((r) => {
              const p = byUserId[r.data.toId]
              return (
                <li key={r.id} className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{p?.displayName ?? r.data.toId}</p>
                  {p && <p className="text-xs text-muted-foreground">@{p.username} · pending</p>}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Friends list */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Friends {friendIds.length > 0 && `(${friendIds.length})`}
        </h2>
        {friendIds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No friends yet. Search for someone above.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {friendIds.map((fId) => {
              const p = byUserId[fId]
              return (
                <li key={fId} className="rounded-lg border border-border bg-card px-4 py-3">
                  <p className="text-sm font-medium text-foreground">{p?.displayName ?? fId}</p>
                  {p && <p className="text-xs text-muted-foreground">@{p.username}</p>}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function FriendsPage() {
  const { user } = useAuthProfileReady({ requireUser: true })
  if (!user) return null
  return <FriendsInner myId={user.userId} />
}
