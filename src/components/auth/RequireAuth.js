import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthModal from './AuthModal'

export default function RequireAuth({ children, message = 'Log in to continue.' }) {
  const { isLoggedIn, loading } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState('login')

  if (loading) return null
  if (isLoggedIn) return children

  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
      <p style={{ marginBottom: '20px', fontSize: '15px' }}>{message}</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button onClick={() => { setTab('login'); setShowModal(true) }} style={{ padding: '9px 20px', backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Log In</button>
        <button onClick={() => { setTab('signup'); setShowModal(true) }} style={{ padding: '9px 20px', backgroundColor: 'transparent', color: '#7c3aed', border: '1px solid #7c3aed', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>Sign Up</button>
      </div>
      {showModal && <AuthModal defaultTab={tab} onClose={() => setShowModal(false)} />}
    </div>
  )
}
