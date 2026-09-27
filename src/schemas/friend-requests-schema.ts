import type { CollectionSchema } from 'deepspace/schema'

// participants stores [fromId, toId] so both parties can read via 'collaborator'
export const friendRequestsSchema: CollectionSchema = {
  name: 'friend_requests',
  columns: [
    { name: 'fromId', storage: 'text', interpretation: 'plain', immutable: true, required: true },
    { name: 'toId', storage: 'text', interpretation: 'plain', immutable: true, required: true },
    {
      name: 'status',
      storage: 'text',
      interpretation: { kind: 'select', options: ['pending', 'accepted', 'declined'] },
      required: true,
      default: 'pending',
    },
    { name: 'participants', storage: 'text', interpretation: { kind: 'json' } },
  ],
  collaboratorsField: 'participants',
  uniqueOn: ['fromId', 'toId'],
  permissions: {
    viewer: { read: false, create: false, update: false, delete: false },
    member: { read: 'collaborator', create: false, update: false, delete: false },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
