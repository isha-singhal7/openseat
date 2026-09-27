import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'

export const respondJoin: ActionHandler<Env> = async ({ userId, params, tools }) => {
  const requestId = params.requestId as string | undefined
  const response = params.response as 'approved' | 'declined' | undefined

  if (!requestId || !['approved', 'declined'].includes(response ?? '')) {
    return { success: false, error: 'Invalid parameters.' }
  }

  const record = await tools.get('join_requests', requestId)
  if (!record.success || !record.data) return { success: false, error: 'Request not found.' }

  const req = (record.data as { data: { mealId: string; userId: string; hostId: string; status: string } }).data
  if (req.hostId !== userId) return { success: false, error: 'Only the host can respond.' }
  if (req.status !== 'pending') return { success: false, error: 'Request already resolved.' }

  if (response === 'approved') {
    // Check seats remain — DO serializes requests so this is effectively atomic per room
    const meal = await tools.get('meals', req.mealId)
    if (!meal.success || !meal.data) return { success: false, error: 'Meal not found.' }

    const mealData = (meal.data as { data: { seats: number; attendees?: string } }).data
    const attendees: string[] = JSON.parse(mealData.attendees || '[]')
    if (attendees.length >= mealData.seats) {
      return { success: false, error: 'No seats remaining.' }
    }

    // Add attendee to meal record
    const updated = [...attendees, req.userId]
    await tools.update('meals', req.mealId, { attendees: JSON.stringify(updated) })
  }

  await tools.update('join_requests', requestId, { status: response })
  return { success: true }
}
