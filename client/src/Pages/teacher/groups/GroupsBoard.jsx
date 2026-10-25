import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext, DragOverlay, KeyboardSensor, MeasuringStrategy, PointerSensor, TouchSensor, closestCenter, closestCorners,
  defaultDropAnimationSideEffects, pointerWithin, useDroppable, useSensor, useSensors
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Link2, Settings2, Trash2, UserX } from 'lucide-react';
import { Ic, initials } from '../../../components/portal/kit';
import useMediaQuery, { useReducedMotion } from '../../../hooks/useMediaQuery';
import { UNASSIGNED, groupColor } from '../../../lib/groups';

const DROP_ANIMATION = {
  duration: 280,
  easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.15)',
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.3' } } })
};

/** { __none: [ids], A: [ids], … } from the student list. */
const build = (students, groups) => {
  const out = { [UNASSIGNED]: [], ...Object.fromEntries(groups.map(g => [g.code, []])) };
  students.forEach((s) => { (out[s.group] || out[UNASSIGNED]).push(s.id); });
  return out;
};

/** What a student card looks like (also used, without any drag hooks, for the floating copy while dragging). */
function CardView({ student, cardRef, style, className = '', cardProps = {}, gripProps = {}, fine, groups = [], onMove }) {
  return (
    <div ref={cardRef} style={style} className={`gcard ${className}`} {...cardProps}>
      <span className="av" aria-hidden="true">{initials(student.name)}</span>
      <div className="gcard-main">
        <b>{student.name}</b>
        {student.studentId && <small>{student.studentId}</small>}
      </div>
      {!fine && onMove && (
        <select className="gcard-move" aria-label={`Move ${student.name} to a group`} value={student.group || ''} onChange={e => onMove(student.id, e.target.value || null)}>
          <option value="">No group</option>
          {groups.map(g => <option key={g.code} value={g.code}>{g.name}</option>)}
        </select>
      )}
      <span className="gcard-grip" {...gripProps}><Ic as={GripVertical} /></span>
    </div>
  );
}

/** "id:group" for everyone, sorted: two boards with the same signature have the same members in the same groups. */
const signature = (pairs) => pairs.sort().join('|');
const boardSignature = (c) => signature(Object.entries(c).flatMap(([key, ids]) => ids.map(id => `${id}:${key === UNASSIGNED ? '' : key}`)));
const dataSignature = (students, groups) => {
  const known = new Set(groups.map(g => g.code));
  return signature(students.map(s => `${s.id}:${known.has(s.group) ? s.group : ''}`));
};

function StudentCard({ student, fine, groups, onMove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: student.id });
  const drag = { ...attributes, ...listeners };
  // Mouse users grab the whole card; on touch screens only the handle starts a drag, so the page still scrolls.
  return (
    <CardView
      student={student}
      cardRef={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'is-dragging' : ''}
      cardProps={fine ? drag : {}}
      gripProps={fine ? { 'aria-hidden': true } : { ...drag, 'aria-label': `Drag ${student.name}` }}
      fine={fine}
      groups={groups}
      onMove={onMove}
    />
  );
}

function Column({ id, group, ids, studentsById, fine, groups, onMove, onSave, onRemove, saving, hot }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(group?.name || '');
  const [link, setLink] = useState(group?.meetingUrl || '');
  useEffect(() => { setName(group?.name || ''); setLink(group?.meetingUrl || ''); }, [group?.name, group?.meetingUrl]);
  const none = id === UNASSIGNED;
  const color = none ? 'var(--mu)' : groupColor(group.code);
  const heading = none ? 'No group yet' : group.name;
  const dirty = !none && (name.trim() !== group.name || link.trim() !== (group.meetingUrl || ''));

  return (
    <section className={`gcol ${isOver || hot ? 'over' : ''} ${none ? 'gcol--none' : ''}`} style={{ '--gc': color }} aria-label={heading}>
      <header className="gcol-h">
        <span className="gcol-dot" aria-hidden="true">{none ? <Ic as={UserX} /> : group.code}</span>
        <div className="gcol-t">
          <h4>{heading}</h4>
          <small key={ids.length} className="gcol-n">{ids.length} student{ids.length === 1 ? '' : 's'}</small>
        </div>
        {!none && (
          <>
            {group.meetingUrl && <span className="gcol-link" title="This group has its own meeting link"><Ic as={Link2} /></span>}
            <button type="button" className="ib sm" aria-label={`Settings for ${group.name}`} aria-expanded={open} onClick={() => setOpen(o => !o)}><Ic as={Settings2} /></button>
          </>
        )}
      </header>

      {!none && open && (
        <div className="gcol-set">
          <label className="fld"><span>Group name</span><input className="inp" value={name} maxLength={30} onChange={e => setName(e.target.value)} /></label>
          <label className="fld"><span>Meeting link for this group (optional)</span><input className="inp" type="url" inputMode="url" value={link} placeholder="https://meet.google.com/…" onChange={e => setLink(e.target.value)} /></label>
          <div className="gcol-acts">
            <button type="button" className="btn p sm" disabled={!dirty || saving} onClick={() => onSave(group.code, { name: name.trim() || `GRP ${group.code}`, meetingUrl: link.trim() })}>{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" className="btn o sm dng" disabled={ids.length > 0} title={ids.length ? 'Move the students out first' : ''} onClick={() => onRemove(group)}><Ic as={Trash2} />Delete group</button>
          </div>
        </div>
      )}

      <SortableContext id={id} items={ids} strategy={verticalListSortingStrategy}>
        <div className="gcol-b" ref={setNodeRef}>
          {ids.map(sid => studentsById.get(sid) && (
            <StudentCard key={sid} student={{ ...studentsById.get(sid), group: none ? null : group.code }} fine={fine} groups={groups} onMove={onMove} />
          ))}
          {!ids.length && <p className="gcol-empty">{none ? 'Everyone has a group.' : 'Drop students here'}</p>}
        </div>
      </SortableContext>
    </section>
  );
}

/**
 * Drag students between groups. Cards slide out of the way while you drag, the column you hover lights up,
 * and the card settles into place when dropped. Keyboard: focus a card, Space to pick up, arrows to move, Space to drop.
 */
export default function GroupsBoard({ groups, students, onMove, onSaveGroup, onRemoveGroup, savingCode }) {
  const [containers, setContainers] = useState(() => build(students, groups));
  const [activeId, setActiveId] = useState(null);
  const [hotCol, setHotCol] = useState(null); // the column the dragged card is over (also while hovering one of its cards)
  const origin = useRef(null);
  const before = useRef(null);
  const fine = useMediaQuery('(pointer: fine)');
  const reduced = useReducedMotion();
  const studentsById = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);

  // New data from the server (after a divide, a reload…) replaces the board, unless a card is in the air or the board
  // already shows the same people in the same groups (so the order you just made is not shuffled back).
  const latest = useRef(containers);
  latest.current = containers;

  // The column under the pointer decides where a card goes; inside it, the nearest card decides the position.
  // (Judging by individual cards alone picked the wrong column once the layout shifted mid-drag.)
  const collision = useCallback((args) => {
    const board = latest.current;
    const column = pointerWithin(args).find(c => c.id in board);
    if (!column) return closestCorners(args);
    const inside = board[column.id];
    if (!inside.length) return [column];
    const near = closestCenter({ ...args, droppableContainers: args.droppableContainers.filter(d => inside.includes(d.id)) });
    return near.length ? near : [column];
  }, []);
  useEffect(() => {
    if (activeId) return;
    if (boardSignature(latest.current) !== dataSignature(students, groups)) setContainers(build(students, groups));
  }, [students, groups]); // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findContainer = useCallback((id, from = containers) => (id in from ? id : Object.keys(from).find(k => from[k].includes(id))), [containers]);

  const onDragStart = ({ active }) => {
    setActiveId(active.id);
    origin.current = findContainer(active.id);
    before.current = containers;
  };

  const onDragOver = ({ active, over }) => {
    setHotCol(over ? findContainer(over.id) : null);
    if (!over) return;
    const from = findContainer(active.id);
    const to = findContainer(over.id);
    if (!from || !to || from === to) return;
    setContainers((prev) => {
      const target = prev[to];
      const overIndex = target.indexOf(over.id);
      let index = target.length;
      if (!(over.id in prev) && overIndex >= 0) {
        const translated = active.rect.current.translated;
        const below = translated && translated.top > over.rect.top + over.rect.height / 2;
        index = overIndex + (below ? 1 : 0);
      }
      return { ...prev, [from]: prev[from].filter(i => i !== active.id), [to]: [...target.slice(0, index), active.id, ...target.slice(index)] };
    });
  };

  const revert = () => { setContainers(before.current || build(students, groups)); setActiveId(null); setHotCol(null); };

  const onDragEnd = ({ active, over }) => {
    const to = findContainer(over?.id ?? active.id);
    const from = findContainer(active.id);
    let next = containers;
    if (over && from && to && from === to && active.id !== over.id) {
      const oldIndex = containers[from].indexOf(active.id);
      const newIndex = containers[to].indexOf(over.id);
      if (newIndex >= 0) {
        next = { ...containers, [to]: arrayMove(containers[to], oldIndex, newIndex) };
        setContainers(next);
      }
    }
    setActiveId(null);
    setHotCol(null);
    if (from && from !== origin.current) {
      Promise.resolve(onMove([{ student: active.id, group: from === UNASSIGNED ? null : from }])).then((ok) => { if (ok === false) setContainers(before.current); });
    }
  };

  // Used by the "Move to…" menu on touch screens.
  const moveTo = (studentId, code) => {
    const target = code || UNASSIGNED;
    const from = findContainer(studentId);
    if (!from || from === target) return;
    const snapshot = containers;
    setContainers(prev => ({ ...prev, [from]: prev[from].filter(i => i !== studentId), [target]: [...prev[target], studentId] }));
    Promise.resolve(onMove([{ student: studentId, group: code || null }])).then((ok) => { if (ok === false) setContainers(snapshot); });
  };

  const active = activeId ? studentsById.get(activeId) : null;
  const columns = [{ id: UNASSIGNED, group: null }, ...groups.map(g => ({ id: g.code, group: g }))];

  return (
    <DndContext sensors={sensors} collisionDetection={collision} measuring={{ droppable: { strategy: MeasuringStrategy.Always } }} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={revert}>
      <div className="gboard">
        {columns.map(c => (
          <Column
            key={c.id}
            id={c.id}
            group={c.group}
            ids={containers[c.id] || []}
            studentsById={studentsById}
            fine={fine}
            groups={groups}
            onMove={moveTo}
            onSave={onSaveGroup}
            onRemove={onRemoveGroup}
            saving={savingCode === c.id}
            hot={hotCol === c.id && activeId !== null}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={reduced ? null : DROP_ANIMATION}>
        {active ? <CardView student={active} className="is-overlay" fine /> : null}
      </DragOverlay>
    </DndContext>
  );
}
