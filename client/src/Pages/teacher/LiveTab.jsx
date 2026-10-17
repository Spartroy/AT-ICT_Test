import React from 'react';
import { Video, Play, Square, ClipboardCheck, Pencil, Trash2, ExternalLink, CalendarClock } from 'lucide-react';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading, fmtDateTime } from '../../components/portal/kit';
import { useConfirm, useToast } from '../../components/portal/PortalUI';
import { typeChip } from '../student/scheduleUtils';
import { useLiveActions, useLiveFeed } from '../../components/portal/LiveFeed';
import { useTeacher } from './TeacherPortal';
import { announceChange, apiError } from './modals/form';

const openMeeting = (url) => window.open(url, '_blank', 'noopener,noreferrer');

function Row({ s, onStart, onEnd, onEdit, onRemove, onAttendance }) {
  const live = s.status === 'live';
  const ended = s.status === 'ended';
  return (
    <div className={`lv-row ${live ? 'live' : ''}`}>
      <div className="lv-main">
        <div className="lv-title">
          {live && <span className="lv-pill"><i />Live</span>}
          <b>{s.title}</b>
          <span className={`chip ${typeChip(s.type)}`}>{s.type}</span>
        </div>
        <small className="sub">
          {fmtDateTime(live ? s.startedAt : s.startsAt)}{s.topic ? ` · ${s.topic}` : ''}
          {s.slot?.scheduleTitle ? ` · ${s.slot.scheduleTitle}${s.slot.day ? `, ${s.slot.day}` : ''}` : ''}
        </small>
        <small className="sub">{s.joined} entered{s.audienceSize ? ` of ${s.audienceSize} invited` : ''}</small>
      </div>
      <div className="lact lv-act">
        {s.status === 'scheduled' && <button type="button" className="btn p sm" onClick={() => onStart(s)}><Ic as={Play} />Start</button>}
        {live && <button type="button" className="btn p sm" onClick={() => openMeeting(s.meetingUrl)}><Ic as={ExternalLink} />Open meeting</button>}
        {live && <button type="button" className="btn o sm" onClick={() => onEnd(s)}><Ic as={Square} />End</button>}
        <button type="button" className="btn o sm" onClick={() => onAttendance(s)}><Ic as={ClipboardCheck} />Attendance</button>
        {!ended && <button type="button" className="ib sm" aria-label={`Edit ${s.title}`} onClick={() => onEdit(s)}><Ic as={Pencil} /></button>}
        <button type="button" className="ib sm dng" aria-label={`Delete ${s.title}`} onClick={() => onRemove(s)}><Ic as={Trash2} /></button>
      </div>
    </div>
  );
}

export default function LiveTab() {
  const { openModal } = useTeacher();
  const toast = useToast();
  const confirm = useConfirm();
  const feed = useLiveFeed();
  const actions = useLiveActions();
  const all = feed.sessions;
  const live = all.filter(s => s.status === 'live');
  const upcoming = all.filter(s => s.status === 'scheduled');
  const past = all.filter(s => s.status === 'ended');

  const remove = async (s) => {
    if (!(await confirm({ title: `Delete “${s.title}”?`, body: 'Its attendance record is deleted too.', confirmLabel: 'Delete' }))) return;
    try {
      await api.del(`${API_ENDPOINTS.TEACHER_LIVE}/${s.id}`);
      toast('Session deleted');
      announceChange('live');
    } catch (err) { toast(apiError(err)); }
  };
  const rowProps = { onStart: actions.start, onEnd: actions.end, onRemove: remove, onEdit: s => openModal('live', { session: s }), onAttendance: s => openModal('attendance', { session: s }) };

  return (
    <>
      <div className="card lv-cta">
        <div>
          <h3 style={{ margin: 0 }}>Online classes</h3>
          <p className="sub" style={{ margin: '4px 0 0' }}>Hover a slot above and tap Go live, or start one from here. Students get a join popup in their portal.</p>
        </div>
        <div className="lact">
          <button type="button" className="btn p" onClick={() => openModal('live')}><Ic as={Video} />New session</button>
        </div>
      </div>
      {feed.loading && !all.length && <Loading label="Loading sessions…" />}
      {feed.error && <ErrorNote error={feed.error} onRetry={feed.reload} />}
      {!feed.loading && !feed.error && !all.length && <div className="card"><Empty icon={CalendarClock}>No online classes yet. Start one now or schedule it.</Empty></div>}
      {live.length > 0 && <div className="card"><h4 className="lv-h">Live now</h4>{live.map(s => <Row key={s.id} s={s} {...rowProps} />)}</div>}
      {upcoming.length > 0 && <div className="card"><h4 className="lv-h">Upcoming</h4>{upcoming.map(s => <Row key={s.id} s={s} {...rowProps} />)}</div>}
      {past.length > 0 && <div className="card"><h4 className="lv-h">Past sessions</h4>{past.map(s => <Row key={s.id} s={s} {...rowProps} />)}</div>}
    </>
  );
}
