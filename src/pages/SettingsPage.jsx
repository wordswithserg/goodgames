import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { username } = useCurrentUser();
  const { user } = useAuth();
  const [newUsername, setNewUsername] = useState('');
  const [usernameMsg, setUsernameMsg] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetError, setResetError] = useState('');
  const [sendingReset, setSendingReset] = useState(false);

  const handlePasswordReset = async () => {
    setSendingReset(true);
    setResetMsg('');
    setResetError('');
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setResetError(error.message);
    else setResetMsg(`Reset link sent to ${user.email}`);
    setSendingReset(false);
  };

  const handleUsernameChange = async () => {
    const trimmed = newUsername.trim();
    if (!trimmed) return;
    setSaving(true);
    setUsernameMsg('');
    setUsernameError('');

    // Check uniqueness
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', trimmed)
      .maybeSingle();

    if (existing) {
      setUsernameError('That username is already taken.');
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ username: trimmed })
      .eq('id', (await supabase.auth.getUser()).data.user.id);

    if (error) {
      setUsernameError('Something went wrong. Try again.');
    } else {
      setUsernameMsg('Username updated!');
      setNewUsername('');
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 24px' }}>
      <h2 style={{ fontFamily: "'Press Start 2P'", fontSize: 18, marginBottom: 32 }}>Settings</h2>

      <section style={{ marginBottom: 40 }}>
        <h3 style={{ marginBottom: 8 }}>Change Username</h3>
        <p style={{ color: '#888', marginBottom: 16 }}>Current: <strong>{username}</strong></p>
        <input
          type="text"
          placeholder="New username"
          value={newUsername}
          onChange={e => setNewUsername(e.target.value)}
          style={{ display: 'block', width: '100%', padding: '10px 12px', marginBottom: 12, boxSizing: 'border-box' }}
        />
        <button onClick={handleUsernameChange} disabled={saving}>
          {saving ? 'Saving...' : 'Update Username'}
        </button>
        {usernameMsg && <p style={{ color: 'green', marginTop: 8 }}>{usernameMsg}</p>}
        {usernameError && <p style={{ color: 'red', marginTop: 8 }}>{usernameError}</p>}
      </section>

      <section style={{ marginBottom: 40 }}>
        <h3 style={{ marginBottom: 8 }}>Reset Password</h3>
        <p style={{ color: '#888', marginBottom: 16 }}>
          We'll send a reset link to <strong>{user?.email}</strong>.
        </p>
        <button onClick={handlePasswordReset} disabled={sendingReset}>
          {sendingReset ? 'Sending...' : 'Send Reset Email'}
        </button>
        {resetMsg && <p style={{ color: 'green', marginTop: 8 }}>{resetMsg}</p>}
        {resetError && <p style={{ color: 'red', marginTop: 8 }}>{resetError}</p>}
      </section>
    </div>
  );
}
