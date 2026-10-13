import React, { useState } from 'react';
import { Key, RotateCcw } from 'lucide-react';
import ChangePasswordDialog from '../../components/portal/ChangePasswordDialog';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Ic } from '../../components/portal/kit';
import { useConfirm, useToast } from '../../components/portal/PortalUI';
import { apiError } from './modals/form';

/** Teacher account (password) and the leaderboard season reset. */
export default function AccountSettings({ settings }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [pwOpen, setPwOpen] = useState(false);
  const [picked, setPicked] = useState('');
  const sessions = settings?.examSessions || [];
  const season = picked || sessions.find(x => x.open)?.code || '';

  const resetSeason = async () => {
    if (!season) return;
    if (!(await confirm({ title: `Start a new season (${season})?`, body: "Every student's current-session points go back to 0. All-time points are kept.", confirmLabel: 'Reset season' }))) return;
    try {
      const res = await api.post(API_ENDPOINTS.TEACHER.RESET_SESSION_POINTS, { newSessionLabel: season });
      toast(res.message || 'Season reset');
    } catch (err) { toast(apiError(err)); }
  };

  return (
    <>
      <section className="card set-card" aria-labelledby="set-account">
        <h3 id="set-account"><Ic as={Key} />Password</h3>
        <p className="sub set-note">Change the password you use to sign in.</p>
        <button type="button" className="btn o sm" onClick={() => setPwOpen(true)}><Ic as={Key} />Change password</button>
        <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
      </section>

      <section className="card set-card" aria-labelledby="set-season">
        <h3 id="set-season"><Ic as={RotateCcw} />Reset season</h3>
        <p className="sub set-note">Starts a new leaderboard season: current-session points go back to 0 for every student. All-time points are kept.</p>
        <div className="inl">
          <select className="inp" value={season} onChange={e => setPicked(e.target.value)} aria-label="New season label" style={{ maxWidth: 220 }}>
            {sessions.map(s => <option key={s.code} value={s.code}>{s.code} — {s.label}</option>)}
          </select>
          <button type="button" className="btn p sm" onClick={resetSeason} disabled={!season}><Ic as={RotateCcw} />Reset season</button>
        </div>
      </section>
    </>
  );
}
