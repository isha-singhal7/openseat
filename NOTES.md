# OpenSeat – Build Log

## Phase 1 – Profiles & Friends ✅

### What was built
- **3 new schemas**: `profiles`, `friend_requests`, `friendships`
- **3 server actions**: `setProfile`, `sendFriendRequest`, `respondFriendRequest`
- **2 new pages**: `/profile` (edit own profile), `/friends` (search, requests, list)

### Schema decisions
- `profiles`: `read: true` for members (search by username), all writes through server action so `userId` is always set from the verified caller. `ownerField: 'userId'` so RBAC 'own' checks work if needed. `uniqueOn: ['username']` enforces no duplicate usernames.
- `friend_requests` / `friendships`: `collaboratorsField: 'participants'` (a JSON array `[userA, userB]`) + `read: 'collaborator'`. This is the correct DeepSpace primitive for two-party visibility — both sides see the record without exposing it to everyone.
- All sensitive mutations (create request, accept/decline, create friendship) run through server actions only; direct client write is disabled (`create: false, update: false` for members).

### Security enforcement
- `sendFriendRequest` server action: checks not-self, no duplicate (both directions), not already friends.
- `respondFriendRequest` server action: checks `toId === userId` (recipient-only), checks status is still `pending`.
- Profile search: `profiles` collection is `read: true` (usernames are intentionally public for discovery); no PII exposed.

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
