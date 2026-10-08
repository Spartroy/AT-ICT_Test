import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { PortalUIProvider } from './PortalUI';
import ChangePasswordDialog from './ChangePasswordDialog';
import { LogoTile, initials } from './kit';
import { clearAuth } from '../../utils/auth';
import { API_ENDPOINTS } from '../../config/api';
import { api } from '../../lib/api';
import '../../styles/generated/portal.css';
import '../../styles/portal-extra.css';

/**
 * Shared portal layout: 248px sticky sidebar (desktop) / bottom tab bar (≤900px), sticky top bar.
 * nav: [{ to, label, icon, badge?, end? }]. `aside` renders under the nav (points card, etc.).
 * meTo: optional link for the profile pill (the teacher's Settings).
 */
/** Profile pill that opens "Change password" (students and parents). */
function ProfilePill({ user }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="me me-link" aria-label={`${user?.name}: change password`} onClick={() => setOpen(true)}>
        <span className="av" aria-hidden="true">{initials(user?.name)}</span>
        <div><b>{user?.name}</b><small>{user?.sub}</small></div>
      </button>
      <ChangePasswordDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default function PortalShell({ variant, nav, title, user, tagline, aside, bell, meTo, children }) {
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // Logging out locally is enough if the server call fails.
    }
    clearAuth();
    navigate('/signin', { replace: true });
  };

  const navClass = (base) => ({ isActive }) => `${base} ${isActive ? 'on' : ''}`.trim();

  return (
    <div className={`atp atp-${variant}`}>
      <PortalUIProvider>
        <a href="#main-content" className="pt-skip">Skip to content</a>
        <div className="app">
          <aside className="side" aria-label="Sidebar">
            <div className="brand"><LogoTile /></div>
            {tagline && <small className="tp">{tagline}</small>}
            <nav aria-label="Main">
              {nav.map(n => (
                <NavLink key={n.to} to={n.to} end={n.end} className={navClass('nv')}>
                  <n.icon className="i" aria-hidden="true" />
                  <span>{n.label}</span>
                  {!!n.badge && <span className="bd" aria-label={`${n.badge} new`}>{n.badge}</span>}
                </NavLink>
              ))}
            </nav>
            {aside}
          </aside>
          <div className="main">
            <header className="top">
              <LogoTile mark className="mlogo" />
              <h2>{title}</h2>
              <span className="sp" />
              {bell && (
                <button type="button" className="ib" aria-label={bell.label || 'Notifications'} onClick={bell.onClick}>
                  <Bell className="i" aria-hidden="true" />
                  {bell.dot && <span className="dot" />}
                </button>
              )}
              <button type="button" className="ib" aria-label="Log out" onClick={logout}>
                <LogOut className="i" aria-hidden="true" />
              </button>
              {meTo ? (
                <NavLink to={meTo} className="me me-link" aria-label={`${user?.name}, settings`}>
                  <span className="av" aria-hidden="true">{initials(user?.name)}</span>
                  <div><b>{user?.name}</b><small>{user?.sub}</small></div>
                </NavLink>
              ) : (
                <ProfilePill user={user} />
              )}
            </header>
            <main id="main-content" tabIndex={-1}>
              <section className="view on">{children}</section>
            </main>
          </div>
        </div>
        <nav className="tabbar" aria-label="Main (mobile)" style={{ gridTemplateColumns: `repeat(${nav.length}, 1fr)` }}>
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} className={navClass('')}>
              <n.icon className="i" aria-hidden="true" />
              <span>{n.label}</span>
              {!!n.badge && <span className="bd" aria-label={`${n.badge} new`}>{n.badge}</span>}
            </NavLink>
          ))}
        </nav>
      </PortalUIProvider>
    </div>
  );
}
