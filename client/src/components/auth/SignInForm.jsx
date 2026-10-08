import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hourglass, Info } from 'lucide-react';
import Button from '../ui/Button';
import { TextField, PasswordField } from '../ui/Field';
import { loginRequest, storeSession } from '../../utils/authApi';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sign-in tab of the auth modal. Pending / rejected registrations are explained inline
 * (server code REGISTRATION_PENDING / REGISTRATION_REJECTED) instead of a generic error.
 * `notice` is an optional { tone: 'info' | 'pending' | 'error', text } shown above the form.
 */
export default function SignInForm({ onRegister, notice }) {
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(notice || null);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const onInput = name => e => {
    setValues(v => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors(({ [name]: _removed, ...rest }) => rest);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!EMAIL.test(values.email.trim())) next.email = 'Enter a valid email address';
    if (!values.password) next.password = 'Enter your password';
    setErrors(next);
    if (next.email) return emailRef.current?.focus();
    if (next.password) return passwordRef.current?.focus();

    setLoading(true);
    setStatus(null);
    const res = await loginRequest(values.email.trim(), values.password);
    setLoading(false);

    if (res.ok) {
      storeSession(res.body.data);
      navigate(res.body.data.user.dashboardUrl || '/');
      return;
    }
    const { code, message } = res.body;
    if (code === 'REGISTRATION_PENDING') setStatus({ tone: 'pending', title: 'Awaiting admin confirmation', text: message });
    else if (res.status === 423) setStatus({ tone: 'error', text: 'Your account is temporarily locked after too many failed attempts. Please try again later.' });
    else setStatus({ tone: 'error', text: message || 'Sign in failed. Please check your email and password.' });
  };

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby="signin-title">
      <h3 id="signin-title" className="auth-title">Welcome back</h3>
      <p className="auth-sub">Sign in to access your AT-ICT dashboard.</p>

      {status && (
        <div className={`auth-status auth-status--${status.tone}`} role={status.tone === 'info' ? 'status' : 'alert'}>
          {status.tone === 'pending' && <Hourglass size={20} aria-hidden="true" />}
          <div>
            {status.title && <b>{status.title}</b>}
            <p>{status.text}</p>
          </div>
        </div>
      )}

      <TextField label="Email address" name="email" type="email" placeholder="you@email.com" autoComplete="email" value={values.email} onChange={onInput('email')} error={errors.email} inputRef={emailRef} />
      <PasswordField label="Password" name="password" placeholder="••••••••" autoComplete="current-password" value={values.password} onChange={onInput('password')} error={errors.password} inputRef={passwordRef} />

      <Button type="submit" block loading={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>

      <div className="auth-alt">
        <button type="button" className="auth-link" aria-expanded={showForgot} aria-controls="forgot-help" onClick={() => setShowForgot(s => !s)}>
          Forgot password?
        </button>
        <span>No account? <button type="button" className="auth-link auth-link--accent" onClick={onRegister}>Register</button></span>
      </div>

      {showForgot && (
        <div id="forgot-help" className="auth-status auth-status--info">
          <Info size={20} aria-hidden="true" />
          <div>
            <p>Password resets are handled by your <b>teacher</b>. Ask them for a temporary password, sign in with it, then change it from your profile.</p>
          </div>
        </div>
      )}
    </form>
  );
}
