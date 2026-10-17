import React, { useState } from 'react';
import { Video, Clock, CalendarDays } from 'lucide-react';
import { Dialog, DialogHeader } from './PortalUI';
import { Ic } from './kit';
import { WEEK, shortTime, typeChip } from '../../Pages/student/scheduleUtils';

/** Small dialog with everything about one timetable slot. */
function SlotDialog({ slot, onClose, onGoLive }) {
  return (
    <Dialog open={!!slot} onClose={onClose} size="sm" labelledBy="slot-title">
      {slot && (
        <>
          <DialogHeader id="slot-title" icon={CalendarDays} title={slot.topic || `${slot.type[0].toUpperCase()}${slot.type.slice(1)} session`} sub={`${slot.day} · ${shortTime(slot.startTime)}${slot.endTime ? ` – ${shortTime(slot.endTime)}` : ''}`} onClose={onClose} />
          <div className="mbody">
            <div className="slot-rows">
              <div><small>Type</small><span className={`chip ${typeChip(slot.type)}`}>{slot.type}</span></div>
              <div><small>Day</small><b>{slot.day}</b></div>
              <div><small>Time</small><b><Ic as={Clock} />{shortTime(slot.startTime)}{slot.endTime ? ` – ${shortTime(slot.endTime)}` : ''}</b></div>
              {slot.topic && <div><small>Topic</small><b>{slot.topic}</b></div>}
              {slot.schedule && <div><small>Schedule</small><b>{slot.schedule}</b></div>}
            </div>
            <div className="mfoot">
              <button type="button" className="btn o" onClick={onClose}>Close</button>
              {onGoLive && <button type="button" className="btn p" onClick={() => { onClose(); onGoLive(slot); }}><Ic as={Video} />Go live</button>}
            </div>
          </div>
        </>
      )}
    </Dialog>
  );
}

/**
 * The 7-day schedule grid. Each slot shows only its start time; click for the details, and (teacher) hover for a Go live button.
 * `week` is 7 arrays of { startTime, endTime, type, topic, schedule?, scheduleId? }.
 */
export default function WeekGrid({ week, todayIdx, id = 'wk2', onGoLive }) {
  const [open, setOpen] = useState(null);
  return (
    <>
      <div className="week" id={id}>
        {WEEK.map((d, i) => (
          <div className={`wd ${i === todayIdx ? 'today' : ''}`} key={d}>
            <small>{d.slice(0, 3)}</small>
            {week[i].length ? week[i].map((x, k) => {
              const slot = { ...x, day: d };
              return (
                <div className={`wev ${x.type === 'practical' ? 'pr' : x.type === 'revision' ? 'rv' : x.type === 'quiz' ? 'qz' : 'th'}`} key={k}>
                  <button type="button" className="wev-t" onClick={() => setOpen(slot)} aria-label={`${x.type} session on ${d} at ${shortTime(x.startTime)}${x.topic ? `: ${x.topic}` : ''}. Show details`}>
                    {shortTime(x.startTime)}
                  </button>
                  {onGoLive && (
                    <button type="button" className="wev-go" onClick={() => onGoLive(slot)} aria-label={`Go live for ${d} ${shortTime(x.startTime)}`}><Ic as={Video} />Go live</button>
                  )}
                </div>
              );
            }) : <span className="no" aria-label="No sessions">—</span>}
          </div>
        ))}
      </div>
      <SlotDialog slot={open} onClose={() => setOpen(null)} onGoLive={onGoLive} />
    </>
  );
}
