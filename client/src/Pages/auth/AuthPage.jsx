import React, { useMemo } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Website from '../site/Website';
import AuthModal from '../../components/auth/AuthModal';
import { getValidToken, clearAuth } from '../../utils/auth';

const PATHS = { in: '/signin', up: '/register' };

// Messages other pages send here via query string (see utils/auth.js redirectToLogin).
const NOTICES = {
  session_expired: { tone: 'info', text: 'Your session has expired. Please sign in again.' },
  invalid_token: { tone: 'info', text: 'Your session has expired or is invalid. Please sign in again.' },
  'registration-pending': { tone: 'pending', title: 'Awaiting admin confirmation', text: "Your registration was received. You'll be able to sign in once the admin approves it." }
};

function signedInDashboard() {
  const token = getValidToken();
  const raw = localStorage.getItem('user');
  if (!token || !raw) return null;
  try {
    return JSON.parse(raw).dashboardUrl || null;
  } catch {
    clearAuth();
    return null;
  }
}

/**
 * The public home page. On /signin and /register the auth modal is open on the matching tab.
 * All three routes render this same component so opening / closing the modal never remounts the page.
 */
export default function AuthPage({ tab }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const notice = useMemo(() => {
    const key = params.get('error') || params.get('message');
    if (key === 'invalid_token' || key === 'session_expired') clearAuth();
    return NOTICES[key] || null;
  }, [params]);

  const dashboard = tab ? signedInDashboard() : null;
  if (dashboard && !notice) return <Navigate to={dashboard} replace />;

  return (
    <Website>
      <AuthModal
        open={!!tab}
        tab={tab || 'in'}
        signInNotice={notice}
        onTabChange={next => navigate(PATHS[next], { replace: true })}
        onClose={() => navigate('/', { replace: true })}
      />
    </Website>
  );
}
