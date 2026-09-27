/**
 * Navigation Config
 *
 * Add one entry per nav item. Routes are handled by generouted
 * (file-based routing in src/pages/), this just controls what
 * appears in the navigation bar.
 */

import type { Role } from './constants'

export interface NavItem {
  path: string
  label: string
  roles?: Role[]
  devOnly?: boolean
}

export const nav: NavItem[] = [
  { path: '/home', label: 'Home' },
  { path: '/meals', label: 'Meals', roles: ['member', 'admin'] },
  { path: '/friends', label: 'Friends', roles: ['member', 'admin'] },
  { path: '/profile', label: 'Profile', roles: ['member', 'admin'] },
  { path: '/settings', label: 'Settings' },
]
