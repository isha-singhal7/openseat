import type { ActionHandler } from 'deepspace/worker'
import type { Env } from '../../worker'
import { setProfile } from './set-profile'
import { sendFriendRequest } from './send-friend-request'
import { respondFriendRequest } from './respond-friend-request'
import { postMeal } from './post-meal'
import { cancelMeal } from './cancel-meal'
import { requestJoin } from './request-join'
import { respondJoin } from './respond-join'

export const actions: Record<string, ActionHandler<Env>> = {
  setProfile,
  sendFriendRequest,
  respondFriendRequest,
  postMeal,
  cancelMeal,
  requestJoin,
  respondJoin,
}
