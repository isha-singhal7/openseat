import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'
import { setProfile } from './set-profile'
import { sendFriendRequest } from './send-friend-request'
import { respondFriendRequest } from './respond-friend-request'

export const actions: Record<string, ActionHandler<Env>> = {
  setProfile,
  sendFriendRequest,
  respondFriendRequest,
}
