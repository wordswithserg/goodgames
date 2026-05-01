import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const styles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' },
  modal: { backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' },
  logo: { textAlign: 'center', marginBottom: '24px', fontSize: '24px', fontWeight: 700, color: '#7c3aed', letterSpacing: '-0.5px' },
  tabs: { display: 'flex', borderRadius: '8px', overflow: 'hidden', marginBottom: '28px', border: '1px solid #2a2a4a' },
  tab: (active) => ({ flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s', backgroundColor: active ? '#7c3aed' : 'transparent', color: active ? '#fff' : '#888' }),
  field: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '10px 12px', backgroundColor: '#0f0f1a', border: '1px solid #2a2a4a', borderRadius: '6px', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  submitBtn: (loading) => ({ width: '100%', padding: '12px', marginTop: '8px', backgroundColor: loading ? '#4a1fa0' : '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '15px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }),
  error: { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', padding: '10px 12px', marginBottom: '16px', color: '#fca5a5', fontSize: '13px' },
  success: { backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', padding: '10px 12px', marginBottom: '16px', color: '#86efac', fontSize: '13px' },
  closeBtn: { position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#666', fontSize: '20px', cursor: 'pointer', padding: '4px 8px', lineHeight: 1 },
  hint: { fontSize: '11px', color: '#666', marginTop: '4px' },
}

export default function AuthModal({ onClose, defaultTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [formState, setFormState] = useState({ email: '', password: '', username: '' })
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const { signIn, signUp } = useAuth()

  function handleChange(e) {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  function switchTab(tab) { setActiveTab(tab); setError(null); setSuccessMsg(null) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null); setSuccessMsg(null); setSubmitting(true)
    const { email, password, username } = formState
    try {
      if (activeTab === 'login') {
        const { error } = await signIn({ email, password })
        if (error) setError(error.message)
        else onClose?.()
      } else {
        if (!username.trim()) { setError('Username is required.'); return }
        if (username.trim().length < 3) { setError('Username must be at least 3 characters.'); return }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError('Username can only contain letters, numbers, and underscores.'); return }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
        const { error } = await signUp({ email, password, username })
        if (error) setError(error.message)
        else setSuccessMsg('Account created! Check your email to confirm, then log in.')
      }
    } finally { setSubmitting(false) }
  }

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose?.() }}>
      <div style={{ ...styles.modal, position: 'relative' }}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
        <div style={styles.logo}>goodgames</div>
        <div style={styles.tabs}>
          <button style={styles.tab(activeTab === 'login')} onClick={() => switchTab('login')} type="button">Log In</button>
          <button style={styles.tab(activeTab === 'signup')} onClick={() => switchTab('signup')} type="button">Sign Up</button>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        {successMsg && <div style={styles.success}>{successMsg}</div>}
        <form onSubmit={handleSubmit}>
          {activeTab === 'signup' && (
            <div style={styles.field}>
              <label style={styles.label} htmlFor="username">Username</label>
              <input id="username" name="username" type="text" value={formState.username} onChange={handleChange} placeholder="your_gamer_tag" style={styles.input} required />
              <div style={styles.hint}>Letters, numbers, underscores. Min 3 chars.</div>
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label} htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={formState.email} onChange={handleChange} placeholder="you@example.com" style={styles.input} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label} htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={formState.password} onChange={handleChange} style={styles.input} required />
          </div>
          <button type="submit" style={styles.submitBtn(submitting)} disabled={submitting}>
            {submitting ? 'Please wait...' : activeTab === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
