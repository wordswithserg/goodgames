import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthModal from './AuthModal'
import { fonts } from '../../styles/theme'

const styles = {
  wrapper: { display: 'flex', alignItems: 'center', gap: '12px' },
  loginBtn: { padding: '7px 16px', backgroundColor: '#7c3aed', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  signupBtn: { padding: '7px 16px', backgroundColor: 'transparent', color: '#7c3aed', border: '1px solid #7c3aed', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' },
  userMenu: { position: 'relative', display: 'inline-block' },
  avatar: { width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: fonts.pixel, fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dropdown: { position: 'absolute', right: 0, top: 'calc(100% + 8px)', backgroundColor: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: '8px', padding: '8px 0', minWidth: '160px', zIndex: 500, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' },
  dropdownHeader: { padding: '8px 16px 12px', borderBottom: '1px solid #2a2a4a', marginBottom: '4px' },
  dropdownUsername: { fontSize: '13px', fontWeight: 700, color: '#fff' },
  dropdownEmail: { fontSize: '11px', color: '#666', marginTop: '2px' },
  dropdownItem: { width: '100%', padding: '8px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: '13px', color: '#ccc', cursor: 'pointer', display: 'block' },
  logoutItem: { width: '100%', padding: '8px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: '13px', color: '#f87171', cursor: 'pointer', display: 'block', borderTop: '1px solid #2a2a4a', marginTop: '4px' },
}

export default function NavAuth({ onNavigateToProfile, onNavigateToSettings }) {
  const { user, profile, isLoggedIn, signOut, loading } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [modalTab, setModalTab] = useState('login')
  const [showDropdown, setShowDropdown] = useState(false)

  if (loading) return null

  if (!isLoggedIn) return (
    <>
      <div style={styles.wrapper}>
        <button style={styles.loginBtn} onClick={() => { setModalTab('login'); setShowModal(true) }}>Log In</button>
        <button style={styles.signupBtn} onClick={() => { setModalTab('signup'); setShowModal(true) }}>Sign Up</button>
      </div>
      {showModal && <AuthModal defaultTab={modalTab} onClose={() => setShowModal(false)} />}
    </>
  )

  const initials = profile?.username ? profile.username[0].toUpperCase() : user.email[0].toUpperCase()

  return (
    <div style={styles.userMenu}>
      <button style={styles.avatar} onClick={() => setShowDropdown(prev => !prev)}>{initials}</button>
      {showDropdown && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 499 }} onClick={() => setShowDropdown(false)} />
          <div style={styles.dropdown}>
            <div style={styles.dropdownHeader}>
              <div style={styles.dropdownUsername}>@{profile?.username || 'loading...'}</div>
              <div style={styles.dropdownEmail}>{user.email}</div>
            </div>
            <button style={styles.dropdownItem} onClick={() => { setShowDropdown(false); onNavigateToSettings?.() }}>Settings</button>
            <button style={styles.logoutItem} onClick={async () => { setShowDropdown(false); await signOut() }}>Log Out</button>
          </div>
        </>
      )}
    </div>
  )
}
