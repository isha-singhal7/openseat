import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'

export const requestJoin: ActionHandler<Env> = async ({ userId, params, tools }) => {
  const mealId = params.mealId as string | undefined
  if (!mealId) return { success: false, error: 'Meal ID required.' }

  const meal = await tools.get('meals', mealId)
  if (!meal.success || !meal.data) return { success: false, error: 'Meal not found.' }

  const mealData = (meal.data as { data: { hostId: string; seats: number; time: string } }).data
  if (mealData.hostId === userId) return { success: false, error: 'You are hosting this meal.' }
  if (new Date(mealData.time) <= new Date()) return { success: false, error: 'This meal has already passed.' }

  // No duplicate requests
  const dup = await tools.query('join_requests', { where: { mealId, userId } })
  if (dup.success && dup.data?.records?.length) {
    return { success: false, error: 'You already requested to join.' }
  }

  const result = await tools.create('join_requests', {
    mealId,
    userId,
    hostId: mealData.hostId,
    status: 'pending',
    participants: JSON.stringify([mealData.hostId, userId]),
  })

  if (!result.success) return { success: false, error: 'Failed to send request.' }
  return { success: true }
}
