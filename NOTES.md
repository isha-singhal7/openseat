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

## Phase 2 – Meal Posts (next)
- Schemas: `meals` (place, address, lat, lng, time, seats, type, notes, hostId)
- Scheduled job to expire meals past their time
- LeafletJS map with OpenStreetMap tiles

## Phase 3 – Join Requests & Bring List (next)
- Schemas: `join_requests`, `bring_items`
- Server action for seat-check on approval (prevent double-booking last seat)
