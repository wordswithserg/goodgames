import { useAuth } from '../contexts/AuthContext'

export function useCurrentUser() {
  const { user, profile, isLoggedIn, loading } = useAuth()
  return {
    userId: user?.id ?? null,
    username: profile?.username ?? null,
    email: user?.email ?? null,
    isLoggedIn,
    loading,
  }
}
