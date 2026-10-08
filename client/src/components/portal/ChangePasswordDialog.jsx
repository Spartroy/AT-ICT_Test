import React, { useEffect, useState } from 'react';
import { Key } from 'lucide-react';
import { Dialog, DialogHeader, useToast } from './PortalUI';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';

/** Change your own password (PUT /api/auth/change-password). Used by every portal. */
export default function ChangePasswordDialog({ open, onClose }) {
  const toast = useToast();
  const [v, setV] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) { setV({ current: '', next: '', confirm: '' }); setErrors({}); }
  }, [open]);

  const set = (k) => (e) => setV(x => ({ ...x, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!v.current) next.current = 'Enter your current password';
    if (v.next.length < 8) next.next = 'Use at least 8 characters';
    if (v.confirm !== v.next) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await api.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, { currentPassword: v.current, newPassword: v.next });
      toast('Password changed');
      onClose();
    } catch (err) {
      setErrors({ form: err.body?.errors?.[0]?.msg || err.message || "Couldn't change the password" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} size="sm" labelledBy="pw-title">
      <DialogHeader id="pw-title" icon={Key} title="Change password" onClose={onClose} />
      <form className="mbody" onSubmit={submit} noValidate>
        {[['current', 'Current password', 'current-password'], ['next', 'New password', 'new-password'], ['confirm', 'Confirm new password', 'new-password']].map(([k, label, ac]) => (
          <label className="fld" key={k}>
            <span>{label}</span>
            <input className="inp" type="password" autoComplete={ac} value={v[k]} onChange={set(k)} aria-invalid={!!errors[k]} />
            {errors[k] && <span className="fld-err">{errors[k]}</span>}
          </label>
        ))}
        {errors.form && <p className="fld-err" role="alert">{errors.form}</p>}
        <div className="mfoot">
          <button type="button" className="btn o" onClick={onClose}>Cancel</button>
          <button className="btn p" disabled={busy}>{busy ? 'Saving…' : 'Change password'}</button>
        </div>
      </form>
    </Dialog>
  );
}
