import { Link } from 'react-router-dom'
import { useAuthProfileReady } from 'deepspace'

export default function HomePage() {
  const { isSignedIn, user } = useAuthProfileReady({ requireUser: false })

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <h1 className="text-3xl font-bold">OpenSeat</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Share meals with friends. Post where you&apos;re eating, let friends join, and never eat alone.
      </p>
      {isSignedIn && user ? (
        <div className="flex gap-3">
          <Link
            to="/friends"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Friends
          </Link>
          <Link
            to="/profile"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            My Profile
          </Link>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sign in to get started.</p>
      )}
    </div>
  )
}
