import type { CollectionSchema } from 'deepspace/schema'

// participants = [hostId, ...friendIds] populated at post time by the server action.
// RecordRoom enforces read:'collaborator' server-side — no UI-only filtering.
export const mealsSchema: CollectionSchema = {
  name: 'meals',
  columns: [
    { name: 'hostId', storage: 'text', interpretation: 'plain', immutable: true, required: true },
    { name: 'place', storage: 'text', interpretation: 'plain', required: true },
    { name: 'address', storage: 'text', interpretation: 'plain', required: true },
    { name: 'lat', storage: 'number', interpretation: 'plain', required: true },
    { name: 'lng', storage: 'number', interpretation: 'plain', required: true },
    { name: 'time', storage: 'text', interpretation: { kind: 'datetime' }, required: true },
    { name: 'seats', storage: 'number', interpretation: 'plain', required: true },
    {
      name: 'type',
      storage: 'text',
      interpretation: { kind: 'select', options: ['casual', 'picnic', 'potluck', 'game night'] },
      required: true,
    },
    { name: 'notes', storage: 'text', interpretation: 'plain' },
    { name: 'participants', storage: 'text', interpretation: { kind: 'json' } },
    { name: 'attendees', storage: 'text', interpretation: { kind: 'json' } },
  ],
  ownerField: 'hostId',
  collaboratorsField: 'participants',
  permissions: {
    viewer: { read: false, create: false, update: false, delete: false },
    member: { read: 'collaborator', create: false, update: 'own', delete: 'own' },
    admin: { read: true, create: true, update: true, delete: true },
  },
}
