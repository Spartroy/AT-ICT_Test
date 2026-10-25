import React from 'react';
import useGroups from '../../../hooks/useGroups';
import { groupColor } from '../../../lib/groups';
import { Fld } from './form';
import StudentChecklist from './StudentChecklist';
import '../../../styles/groups.css';

export const emptyAudience = () => ({ mode: 'all', groups: new Set(), students: new Set() });

/** The fields of an API request for this audience (homework, quizzes, schedules…). */
export const audienceBody = (a) => {
  if (a.mode === 'groups') return { assignToAll: false, groups: [...a.groups] };
  if (a.mode === 'selected') return { assignToAll: false, selectedStudents: [...a.students] };
  return { assignToAll: true };
};

/** A message when the audience is not usable yet, otherwise ''. */
export const audienceError = (a) => {
  if (a.mode === 'groups' && !a.groups.size) return 'Choose at least one group';
  if (a.mode === 'selected' && !a.students.size) return 'Choose at least one student';
  return '';
};

/** Toggle chips for the teacher's groups. `value` is a Set of group codes. */
export function GroupChoice({ value, onChange, groups, error }) {
  const toggle = (code) => {
    const next = new Set(value);
    next.has(code) ? next.delete(code) : next.add(code);
    onChange(next);
  };
  const total = groups.filter(g => value.has(g.code)).reduce((n, g) => n + g.count, 0);
  return (
    <>
      <div className="aud-groups" role="group" aria-label="Groups">
        {groups.map(g => (
          <button key={g.code} type="button" className={`aud-g ${value.has(g.code) ? 'on' : ''}`} style={{ '--gc': groupColor(g.code) }} aria-pressed={value.has(g.code)} onClick={() => toggle(g.code)}>
            <i aria-hidden="true" />{g.name}<small>{g.count}</small>
          </button>
        ))}
      </div>
      {value.size > 0 && <p className="sub aud-sum" aria-live="polite">{total} student{total === 1 ? '' : 's'} in {value.size === 1 ? 'this group' : 'these groups'}. Students who join later are included.</p>}
      {error && <span className="fld-err">{error}</span>}
    </>
  );
}

/**
 * "Assign to": everyone, one or more groups, or hand-picked students.
 * The Groups option only shows once the teacher has made groups.
 */
export default function AudiencePicker({ value, onChange, error, label = 'Assign to', allLabel = 'All students' }) {
  const { groups } = useGroups();
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <>
      <Fld label={label}>
        <select className="inp" value={value.mode} onChange={e => set({ mode: e.target.value })}>
          <option value="all">{allLabel}</option>
          {groups.length > 0 && <option value="groups">A group (or several)</option>}
          <option value="selected">Selected students</option>
        </select>
      </Fld>
      {value.mode === 'groups' && <GroupChoice value={value.groups} onChange={g => set({ groups: g })} groups={groups} error={error} />}
      {value.mode === 'selected' && <StudentChecklist chosen={value.students} onChange={students => set({ students })} error={error} />}
    </>
  );
}
