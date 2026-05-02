import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleReset = async () => {
    setMsg(''); setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setSaving(true);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setMsg('Password updated! You can now log in.');
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: '0 24px' }}>
      <h2 style={{ fontFamily: "'Press Start 2P'", fontSize: 18, marginBottom: 32 }}>Reset Password</h2>
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ display: 'block', width: '100%', padding: '10px 12px', marginBottom: 12, boxSizing: 'border-box' }}
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        style={{ display: 'block', width: '100%', padding: '10px 12px', marginBottom: 12, boxSizing: 'border-box' }}
      />
      <button onClick={handleReset} disabled={saving}>
        {saving ? 'Saving...' : 'Set New Password'}
      </button>
      {msg && <p style={{ color: 'green', marginTop: 8 }}>{msg}</p>}
      {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
    </div>
  );
}
