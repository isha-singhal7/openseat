import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'

export const respondFriendRequest: ActionHandler<Env> = async ({ userId, params, tools }) => {
  const requestId = params.requestId as string | undefined
  const response = params.response as 'accepted' | 'declined' | undefined

  if (!requestId || !['accepted', 'declined'].includes(response ?? '')) {
    return { success: false, error: 'Invalid parameters.' }
  }

  const record = await tools.get('friend_requests', requestId)
  if (!record.success || !record.data) return { success: false, error: 'Request not found.' }

  const req = record.data as { id: string; data: { fromId: string; toId: string; status: string } }

  // Only the recipient may respond
  if (req.data.toId !== userId) return { success: false, error: 'Not authorized.' }
  if (req.data.status !== 'pending') return { success: false, error: 'Request already resolved.' }

  const update = await tools.update('friend_requests', requestId, { status: response })
  if (!update.success) return { success: false, error: 'Failed to update request.' }

  if (response === 'accepted') {
    const [a, b] = [req.data.fromId, userId].sort()
    await tools.create('friendships', {
      userAId: a,
      userBId: b,
      participants: JSON.stringify([a, b]),
    })
  }

  return { success: true }
}
