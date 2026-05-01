import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // onAuthStateChange fires INITIAL_SESSION on subscribe — the canonical Supabase v2
  // way to restore a session. We keep loading=true if a user exists until the profile
  // fetch below completes, so consumers never see a half-initialized auth state.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        // No user → nothing more to fetch, done loading immediately.
        if (event === 'INITIAL_SESSION' && !session?.user) setLoading(false)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // Fetch profile whenever the authenticated user changes.
  // Calls getSession() first to ensure the client has the JWT committed before
  // issuing the query — avoids a race where the fetch runs before the token is set.
  useEffect(() => {
    if (!user) { setProfile(null); return }
    let cancelled = false

    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      if (!session) {
        console.warn('[AuthContext] fetchProfile: no session found, skipping')
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (cancelled) return
      if (error) {
        console.error('[AuthContext] fetchProfile error:', {
          message: error.message,
          status: error.status,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
      }
      setProfile(error ? null : data)
      setLoading(false)
    }

    fetchProfile()
    return () => { cancelled = true }
  }, [user?.id])

  async function signUp({ email, password, username }) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.trim().toLowerCase())
      .single()
    if (existing) return { error: { message: 'That username is already taken.' } }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username.trim().toLowerCase() } },
    })
    if (error) return { error }
    return { data }
  }

  async function signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = { user, profile, loading, signUp, signIn, signOut, isLoggedIn: !!user }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an <AuthProvider>')
  return context
}
