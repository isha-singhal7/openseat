# OpenSeat – Build Log

## Phase 1 – Profiles & Friends ✅

### What was built
- **3 new schemas**: `profiles`, `friend_requests`, `friendships`
- **3 server actions**: `setProfile`, `sendFriendRequest`, `respondFriendRequest`
- **2 new pages**: `/profile` (edit own profile), `/friends` (search, requests, list)

### Schema decisions
- `profiles`: `read: true` for members, `read: false` for viewers (anonymous), so only signed-in users can search. All writes through server action so `userId` is always set from the verified caller. `ownerField: 'userId'`. `uniqueOn: ['username']` enforces no duplicate usernames.
- `friend_requests` / `friendships`: `collaboratorsField: 'participants'` (a JSON array `[userA, userB]`) + `read: 'collaborator'`. This is the correct DeepSpace primitive for two-party visibility — both sides see the record without exposing it to everyone.
- All sensitive mutations (create request, accept/decline, create friendship) run through server actions only; direct client write is disabled (`create: false, update: false` for members).

### Security enforcement
- All actions derive `userId` from the verified JWT (destructured from the action context set by `resolveAuth`), never from the request body.
- `sendFriendRequest`: checks not-self, no **pending** request in either direction, not already friends. (Filtering by `status: 'pending'` lets users re-request after a prior decline.)
- `respondFriendRequest`: checks `toId === userId` (recipient-only); checks `status === 'pending'` before updating.
- Profile search: profiles are readable by signed-in members only (`viewer: read: false`).

### No built-in SDK action helper
The DeepSpace client SDK (`deepspace`) exposes no `callAction` or `useAction` helper. `src/lib/call-action.ts` exists because the action route (`POST /api/actions/:name`) requires a bearer token that must be fetched via `getAuthToken()` and attached manually. If the SDK adds this in future, that file can be replaced.

### Deferred / skipped
- Avatars skipped per user instruction.
- Profile search works client-side (all profiles loaded once over WebSocket); fine for demo scale.

---

## Phase 2 – Meal Posts ✅

### What was built
- `meals` schema with `collaboratorsField: 'participants'` for friends-only server-enforced reads
- `postMeal` server action: queries host's current friends, builds participant snapshot, creates meal
- `cancelMeal` server action: verifies `hostId === userId` before deleting
- `/meals` page: list + map toggle (Leaflet + OpenStreetMap tiles), future-meals filter, cancel/edit links for host
- `/meals/new` page: form with click-to-pin Leaflet map, manual place name + address entry

### Friends-only enforcement
`read: 'collaborator'` on the meals schema. The `postMeal` action queries all of the host's friendships and writes `participants = [hostId, ...friendIds]`. The RecordRoom enforces the collaborator check server-side — no UI-only filtering.
Trade-off: friends added *after* a meal is posted won't see it. Noted; acceptable for demo scale.

### Scheduled job — next step
Past meals are hidden with a client-side time filter (`new Date(m.data.time) > now`). A DeepSpace scheduled job to auto-delete expired meals is the correct long-term fix — add a `cron.ts` task that queries meals older than their time and calls `tools.deleteWhere('meals', ...)`. Deferred due to time.

## Phase 3 – Join Requests ✅

### What was built
- `join_requests` schema with `collaboratorsField: 'participants'` (`[hostId, requesterId]`)
- `requestJoin` action: verifies caller is in `meal.participants` (friends-only, server-enforced), not host, not duplicate
- `respondJoin` action: verifies `hostId === userId` from join_request (immutable, server-written); checks `status === 'pending'`; on approve, reads current attendees and rejects if `attendees.length >= seats`
- `attendees` JSON column on meals updated on approval; visible to all meal collaborators
- Inline join/approve/decline UI on meal cards; real-time via `useQuery`

### Next steps
- **Edit meal**: no edit page exists; host can only cancel. Add `/meals/:id/edit` with a pre-filled form calling a `updateMeal` server action (check `hostId === userId`, reject if attendees already booked).
- **Scheduled job**: auto-delete expired meals via a `cron.ts` task using `tools.deleteWhere('meals', ...)` on records whose `time` is in the past.
- **Bring list**: for picnic/potluck meals, let host list items and approved attendees claim them (needs a `bring_items` schema with `collaboratorsField` matching the meal's participants).
