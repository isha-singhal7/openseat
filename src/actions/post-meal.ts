import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'

export const postMeal: ActionHandler<Env> = async ({ userId, params, tools }) => {
  const place = (params.place as string | undefined)?.trim()
  const address = (params.address as string | undefined)?.trim()
  const lat = params.lat as number | undefined
  const lng = params.lng as number | undefined
  const time = params.time as string | undefined
  const seats = params.seats as number | undefined
  const type = params.type as string | undefined
  const notes = (params.notes as string | undefined)?.trim() || null

  if (!place || !address || lat == null || lng == null || !time || !seats || !type) {
    return { success: false, error: 'All required fields must be filled.' }
  }
  if (!['casual', 'picnic', 'potluck', 'game night'].includes(type)) {
    return { success: false, error: 'Invalid meal type.' }
  }
  if (seats < 1 || seats > 20) {
    return { success: false, error: 'Seats must be between 1 and 20.' }
  }
  if (new Date(time) <= new Date()) {
    return { success: false, error: 'Meal time must be in the future.' }
  }

  // Collect current friend IDs so the meal is visible to friends (snapshot at post time)
  const fsA = await tools.query('friendships', { where: { userAId: userId } })
  const fsB = await tools.query('friendships', { where: { userBId: userId } })
  const friendIds: string[] = [
    ...((fsA.data?.records ?? []) as { data: { userBId: string } }[]).map((r) => r.data.userBId),
    ...((fsB.data?.records ?? []) as { data: { userAId: string } }[]).map((r) => r.data.userAId),
  ]
  // Host is included so they can read their own meal via collaborator permission
  const participants = JSON.stringify([userId, ...friendIds])

  const result = await tools.create('meals', {
    hostId: userId,
    place,
    address,
    lat,
    lng,
    time,
    seats,
    type,
    notes,
    participants,
  })

  if (!result.success) return { success: false, error: 'Failed to create meal.' }
  return { success: true, data: { id: (result.data as { id: string })?.id } }
}
