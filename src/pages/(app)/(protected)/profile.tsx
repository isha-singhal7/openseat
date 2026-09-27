import { useState, useEffect } from 'react'
import { useAuthProfileReady, useQuery } from 'deepspace'
import { callAction } from '@/lib/call-action'
import { Button, Input, Label } from '@/components/ui'

export default function ProfilePage() {
  const { user } = useAuthProfileReady({ requireUser: true })
  const userId = user?.userId ?? ''

  const { records } = useQuery('profiles', { where: { userId }, limit: 1 })
  const profile = records?.[0]?.data as { username?: string; displayName?: string } | undefined

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username ?? '')
      setDisplayName(profile.displayName ?? '')
    }
  }, [profile?.username, profile?.displayName])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const result = await callAction('setProfile', { username, displayName })
    setMessage(result.success ? { ok: true, text: 'Profile saved.' } : { ok: false, text: result.error ?? 'Error.' })
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-foreground">Your Profile</h1>
      <form onSubmit={save} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            required
            maxLength={50}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            placeholder="e.g. isha_eats"
            required
            pattern="[a-z0-9_]{3,30}"
            title="3–30 lowercase letters, numbers, or underscores"
          />
          <p className="text-xs text-muted-foreground">3–30 chars: lowercase letters, numbers, underscores</p>
        </div>
        {message && (
          <p className={message.ok ? 'text-sm text-green-600' : 'text-sm text-destructive'}>
            {message.text}
          </p>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </form>
    </div>
  )
}
