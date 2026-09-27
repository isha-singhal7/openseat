import type { CollectionSchema } from 'deepspace/schema'

export const profilesSchema: CollectionSchema = {
  name: 'profiles',
  columns: [
    { name: 'userId', storage: 'text', interpretation: 'plain', immutable: true },
    { name: 'username', storage: 'text', interpretation: 'plain', required: true },
    { name: 'displayName', storage: 'text', interpretation: 'plain', required: true },
  ],
  ownerField: 'userId',
  uniqueOn: ['username'],
  permissions: {
    viewer: { read: true, create: false, update: false, delete: false },
    member: { read: true, create: false, update: false, delete: false },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
