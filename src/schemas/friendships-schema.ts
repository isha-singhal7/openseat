import type { CollectionSchema } from 'deepspace/schema'

// participants stores [userAId, userBId] so both can read via 'collaborator'
export const friendshipsSchema: CollectionSchema = {
  name: 'friendships',
  columns: [
    { name: 'userAId', storage: 'text', interpretation: 'plain', immutable: true, required: true },
    { name: 'userBId', storage: 'text', interpretation: 'plain', immutable: true, required: true },
    { name: 'participants', storage: 'text', interpretation: { kind: 'json' } },
  ],
  collaboratorsField: 'participants',
  uniqueOn: ['userAId', 'userBId'],
  permissions: {
    viewer: { read: false, create: false, update: false, delete: false },
    member: { read: 'collaborator', create: false, update: false, delete: false },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
