import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { PortalUIProvider } from './PortalUI';
import ChangePasswordDialog from './ChangePasswordDialog';
import { LogoTile, initials } from './kit';
import { clearAuth } from '../../utils/auth';
import { API_ENDPOINTS } from '../../config/api';
import { api } from '../../lib/api';
import { useLang } from '../../i18n/context';
import '../../styles/generated/portal.css';
import '../../styles/portal-extra.css';

/**
 * Shared portal layout: 248px sticky sidebar (desktop) / bottom tab bar (≤900px), sticky top bar.
 * nav: [{ to, label, icon, badge?, end?, tour? }] (tour = data-tour hook for the guided tour). `aside` renders under the nav (points card, etc.).
 * meTo: optional link for the profile pill (the teacher's Settings).
 */
/** Profile pill that opens "Change password" (students and parents). */
function ProfilePill({ user }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  return (
    <>
      <button type="button" className="me me-link" aria-label={`${user?.name}: ${t('change password')}`} onClick={() => setOpen(true)}>
        <span className="av" aria-hidden="true">{initials(user?.name)}</span>
        <div><b>{user?.name}</b><small>{user?.sub}</small></div>
      </button>
      <ChangePasswordDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default function PortalShell({ variant, nav, user, tagline, aside, bell, bellSlot, meTo, children }) {
  const navigate = useNavigate();
  const { t, dir, lang } = useLang();

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
    <div className={`atp atp-${variant}`} dir={dir} lang={lang}>
      <PortalUIProvider>
        <a href="#main-content" className="pt-skip">{t('Skip to content')}</a>
        <div className="app">
          <aside className="side" aria-label={t('Sidebar')}>
            <div className="brand"><LogoTile /></div>
            {tagline && <small className="tp">{t(tagline)}</small>}
            <nav aria-label={t('Main')}>
              {nav.map(n => (
                <NavLink key={n.to} to={n.to} end={n.end} className={navClass('nv')} data-tour={n.tour}>
                  <n.icon className="i" aria-hidden="true" />
                  <span>{t(n.label)}</span>
                  {!!n.badge && <span className="bd" aria-label={`${n.badge} ${t('new')}`}>{n.badge}</span>}
                </NavLink>
              ))}
            </nav>
            {aside}
          </aside>
          <div className="main">
            <header className="top">
              <LogoTile mark className="mlogo" />
              <span className="sp" />
              {bellSlot || (bell && (
                <button type="button" className="ib" aria-label={bell.label || t('Notifications')} onClick={bell.onClick}>
                  <Bell className="i" aria-hidden="true" />
                  {bell.dot && <span className="dot" />}
                </button>
              ))}
              <button type="button" className="ib" aria-label={t('Log out')} onClick={logout}>
                <LogOut className="i" aria-hidden="true" />
              </button>
              {meTo ? (
                <NavLink to={meTo} className="me me-link" aria-label={`${user?.name}, ${t('settings')}`}>
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
         <nav className="tabbar" aria-label={t('Main (mobile)')} style={{ gridTemplateColumns: `repeat(${nav.length}, 1fr)` }}>
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} className={navClass('')} data-tour={n.tour}>
              <n.icon className="i" aria-hidden="true" />
              <span>{t(n.label)}</span>
              {!!n.badge && <span className="bd" aria-label={`${n.badge} ${t('new')}`}>{n.badge}</span>}
            </NavLink>
          ))}
        </nav>
      </PortalUIProvider>
    </div>
  );
}
