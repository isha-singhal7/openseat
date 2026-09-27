import { getAuthToken } from 'deepspace'

export async function callAction<T = unknown>(
  name: string,
  params: Record<string, unknown> = {},
): Promise<{ success: boolean; data?: T; error?: string }> {
  const token = getAuthToken()
  if (!token) return { success: false, error: 'Not signed in.' }

  const res = await fetch(`/api/actions/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  })

  const json = await res.json()
  return json as { success: boolean; data?: T; error?: string }
}
