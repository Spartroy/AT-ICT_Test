import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { API_ENDPOINTS } from '../../config/api';
import { Dialog } from '../../components/portal/PortalUI';
import { fireConfetti } from '../../components/auth/confetti';
import { POINTS_EVENT } from './pointsEvents';
import { celebrationFor, levelFor } from './gamify';

const key = (id) => `atp:points-seen:${id}`;
const read = (id) => { try { return JSON.parse(localStorage.getItem(key(id))); } catch { return null; } };
const write = (id, value) => { try { localStorage.setItem(key(id), JSON.stringify(value)); } catch { /* storage blocked: skip the celebration next time */ } };

const rankLine = ({ rankChange, rank }) => {
  if (rankChange > 0) return { tone: 'up', text: `You climbed ${rankChange} place${rankChange === 1 ? '' : 's'} to #${rank}!` };
  if (rankChange < 0) return { tone: 'down', text: `You slipped ${-rankChange} place${rankChange === -1 ? '' : 's'} to #${rank}. Time to fight back!` };
  return null;
};

/**
 * Welcome-back modal: when the student has earned points since their last visit (homework graded, say) or their place
 * on the leaderboard moved, tell them, with confetti if it is good news. Remembers what they last saw on this device.
 */
export default function PointsCelebration({ userId }) {
  const pts = useApi('/api/student/points', b => b.data || {});
  const board = useApi(`${API_ENDPOINTS.LEADERBOARD.BASE}?view=session`, b => b.data?.leaderboard || []);
  const [result, setResult] = useState(null);
  const done = useRef(false);
  const snapshot = useRef(null);

  useEffect(() => {
    if (done.current || !userId || !pts.data || pts.loading || board.loading || board.data === undefined) return;
    done.current = true;
    const mine = board.data.find(l => String(l._id) === String(userId));
    const current = { points: pts.data.currentSession || 0, rank: mine?.rank || null, history: pts.data.history || [] };
    snapshot.current = { points: current.points, rank: current.rank, at: new Date().toISOString() };
    const found = celebrationFor(read(userId), current);
    if (found) setResult({ ...found, level: levelFor(current.points) });
    else write(userId, snapshot.current);
  }, [userId, pts.data, pts.loading, board.data, board.loading]);

  // Points earned while the portal is open are already celebrated live, so don't repeat them at the next login.
  useEffect(() => {
    const on = (e) => {
      const prev = read(userId);
      if (prev) write(userId, { ...prev, points: prev.points + (e.detail?.points || 0), at: new Date().toISOString() });
    };
    window.addEventListener(POINTS_EVENT, on);
    return () => window.removeEventListener(POINTS_EVENT, on);
  }, [userId]);

  const panel = useRef(null);
  useEffect(() => {
    if (result && (result.gained > 0 || result.rankChange > 0)) {
      const t = setTimeout(() => fireConfetti(panel.current?.getBoundingClientRect()), 250);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [result]);

  const close = useCallback(() => {
    if (snapshot.current) write(userId, snapshot.current);
    setResult(null);
  }, [userId]);

  if (!result) return null;
  const rl = rankLine(result);
  return (
    <Dialog open onClose={close} labelledBy="pc-title">
      <div className="pc" ref={panel}>
        <div className="pc-badge" aria-hidden="true"><Trophy /></div>
        {result.gained > 0 ? (
          <>
            <h3 id="pc-title">You earned points!</h3>
            <p className="pc-big"><span>+{result.gained}</span> pts</p>
          </>
        ) : (
          <h3 id="pc-title">The leaderboard moved</h3>
        )}
        {!!result.items.length && (
          <ul className="pc-items">
            {result.items.slice(0, 5).map((it, i) => <li key={`${it.title}-${i}`}><span>{it.title}</span><b>+{it.total}</b></li>)}
          </ul>
        )}
        {rl && (
          <p className={`pc-rank ${rl.tone}`}>
            {rl.tone === 'up' ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}{rl.text}
          </p>
        )}
        <p className="pc-lvl">{result.level.level.emoji} {result.level.level.name}{result.level.next ? ` · ${result.level.toNext} pts to ${result.level.next.name}` : ''}</p>
        <button type="button" className="btn p" onClick={close}>{result.gained > 0 || result.rankChange > 0 ? 'Awesome!' : 'Challenge accepted'}</button>
      </div>
    </Dialog>
  );
}
