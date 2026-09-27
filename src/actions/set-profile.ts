import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'

export const setProfile: ActionHandler<Env> = async ({ userId, params, tools }) => {
  const username = (params.username as string | undefined)?.trim().toLowerCase()
  const displayName = (params.displayName as string | undefined)?.trim()

  if (!username || !/^[a-z0-9_]{3,30}$/.test(username)) {
    return { success: false, error: 'Username must be 3–30 lowercase letters, numbers, or underscores.' }
  }
  if (!displayName || displayName.length < 1 || displayName.length > 50) {
    return { success: false, error: 'Display name must be 1–50 characters.' }
  }

  // Check username uniqueness (excluding own profile)
  const existing = await tools.query('profiles', { where: { username } })
  if (existing.success && existing.data?.records?.length) {
    const taken = existing.data.records.find((r: { id: string }) => r.id !== userId)
    if (taken) return { success: false, error: 'Username is already taken.' }
  }

  // Upsert: use userId as the record id so this is idempotent
  const result = await tools.create('profiles', { userId, username, displayName }, userId)
  if (!result.success) {
    // Record already exists — update instead
    const update = await tools.update('profiles', userId, { username, displayName })
    if (!update.success) return { success: false, error: 'Failed to save profile.' }
  }

  return { success: true }
}
