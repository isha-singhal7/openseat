import type { CollectionSchema } from 'deepspace/schema'

// participants = [hostId, requesterId] so both can read via 'collaborator'
export const joinRequestsSchema: CollectionSchema = {
  name: 'join_requests',
  columns: [
    { name: 'mealId', storage: 'text', interpretation: 'plain', immutable: true, required: true },
    { name: 'userId', storage: 'text', interpretation: 'plain', immutable: true, required: true },
    { name: 'hostId', storage: 'text', interpretation: 'plain', immutable: true, required: true },
    {
      name: 'status',
      storage: 'text',
      interpretation: { kind: 'select', options: ['pending', 'approved', 'declined'] },
      required: true,
      default: 'pending',
    },
    { name: 'participants', storage: 'text', interpretation: { kind: 'json' } },
  ],
  collaboratorsField: 'participants',
  uniqueOn: ['mealId', 'userId'],
  permissions: {
    viewer: { read: false, create: false, update: false, delete: false },
    member: { read: 'collaborator', create: false, update: false, delete: false },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
