import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'

export const sendFriendRequest: ActionHandler<Env> = async ({ userId, params, tools }) => {
  const toUsername = (params.toUsername as string | undefined)?.trim().toLowerCase()
  if (!toUsername) return { success: false, error: 'Username is required.' }

  // Look up the target user by username
  const profileResult = await tools.query('profiles', { where: { username: toUsername } })
  if (!profileResult.success || !profileResult.data?.records?.length) {
    return { success: false, error: 'User not found.' }
  }
  const toProfile = profileResult.data.records[0] as { id: string; data: { userId: string } }
  const toId = toProfile.data.userId

  if (toId === userId) return { success: false, error: 'You cannot friend yourself.' }

  // No pending request in either direction
  const dup = await tools.query('friend_requests', { where: { fromId: userId, toId, status: 'pending' } })
  if (dup.success && dup.data?.records?.length) {
    return { success: false, error: 'Friend request already sent.' }
  }

  const rev = await tools.query('friend_requests', { where: { fromId: toId, toId: userId, status: 'pending' } })
  if (rev.success && rev.data?.records?.length) {
    return { success: false, error: 'That user already sent you a request.' }
  }

  // Check not already friends
  const [a, b] = [userId, toId].sort()
  const friendship = await tools.query('friendships', { where: { userAId: a, userBId: b } })
  if (friendship.success && friendship.data?.records?.length) {
    return { success: false, error: 'You are already friends.' }
  }

  const result = await tools.create('friend_requests', {
    fromId: userId,
    toId,
    status: 'pending',
    participants: JSON.stringify([userId, toId]),
  })

  if (!result.success) return { success: false, error: 'Failed to send request.' }
  return { success: true }
}
