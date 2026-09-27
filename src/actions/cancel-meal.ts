import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'

export const cancelMeal: ActionHandler<Env> = async ({ userId, params, tools }) => {
  const mealId = params.mealId as string | undefined
  if (!mealId) return { success: false, error: 'Meal ID required.' }

  const record = await tools.get('meals', mealId)
  if (!record.success || !record.data) return { success: false, error: 'Meal not found.' }

  const meal = record.data as { data: { hostId: string } }
  if (meal.data.hostId !== userId) return { success: false, error: 'Only the host can cancel.' }

  await tools.remove('meals', mealId)
  return { success: true }
}
