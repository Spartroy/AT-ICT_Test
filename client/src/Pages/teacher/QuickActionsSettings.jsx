import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, RotateCcw, Trash2, Zap } from 'lucide-react';
import { Ic } from '../../components/portal/kit';
import { useToast } from '../../components/portal/PortalUI';
import { DEFAULT_QUICK_ACTIONS, MAX_QUICK_ACTIONS, QUICK_ACTION_CATALOG, QUICK_ACTIONS_CHANGED, moveItem, resolveQuickActions } from './quickActionCatalog';

const sameList = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * Choose, order and save the buttons of the quick-actions (+) menu.
 * The list on screen follows the saved list only when that list itself changes, so refreshes caused by saving other
 * settings never wipe edits in progress.
 */
export default function QuickActionsSettings({ settings, save }) {
  const toast = useToast();
  const savedIds = useMemo(() => resolveQuickActions(settings?.quickActions).map(a => a.id), [settings?.quickActions]);
  const savedKey = savedIds.join(',');
  const [ids, setIds] = useState(savedIds);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setIds(savedKey.split(',')); }, [savedKey]);

  const dirty = !sameList(ids, savedIds);
  const available = QUICK_ACTION_CATALOG.filter(a => !ids.includes(a.id));

  const submit = async () => {
    setSaving(true);
    const res = await save({ quickActions: ids });
    setSaving(false);
    if (!res.ok) return toast(res.errors?.[0]?.msg || res.message || "Couldn't save the quick actions.");
    // Older server code ignores fields it doesn't know and still says "saved"; check that our list really came back.
    if (!Array.isArray(res.data?.quickActions) || !sameList(res.data.quickActions, ids)) {
      setIds(savedIds);
      return toast("The server didn't keep that change. It may still be updating; try again in a minute.");
    }
    toast('Quick actions saved');
    window.dispatchEvent(new Event(QUICK_ACTIONS_CHANGED));
  };

  return (
    <section className="card set-card" aria-labelledby="set-actions">
      <h3 id="set-actions"><Ic as={Zap} />Quick actions</h3>
      <p className="sub set-note">The + button at the bottom-right of every page. Choose up to {MAX_QUICK_ACTIONS} and put the ones you use most first (the first one sits closest to the button).</p>

      <ol className="set-qa">
        {ids.map((id, i) => {
          const a = QUICK_ACTION_CATALOG.find(x => x.id === id);
          if (!a) return null;
          return (
            <li key={id}>
              <span className="set-qa__n" aria-hidden="true">{i + 1}</span>
              <span className="set-qa__ic"><Ic as={a.icon} /></span>
              <span className="set-qa__l">{a.label}</span>
              <button type="button" className="ib sm" disabled={i === 0} aria-label={`Move ${a.label} up`} onClick={() => setIds(l => moveItem(l, i, -1))}><Ic as={ArrowUp} /></button>
              <button type="button" className="ib sm" disabled={i === ids.length - 1} aria-label={`Move ${a.label} down`} onClick={() => setIds(l => moveItem(l, i, 1))}><Ic as={ArrowDown} /></button>
              <button type="button" className="ib sm dng" disabled={ids.length === 1} aria-label={`Remove ${a.label}`} onClick={() => setIds(l => l.filter(x => x !== id))}><Ic as={Trash2} /></button>
            </li>
          );
        })}
      </ol>

      {ids.length < MAX_QUICK_ACTIONS && available.length > 0 && (
        <div className="set-qa__add">
          <span className="sub">Add:</span>
          {available.map(a => (
            <button type="button" key={a.id} className="btn o sm" onClick={() => setIds(l => [...l, a.id])}><Ic as={a.icon} />{a.label}</button>
          ))}
        </div>
      )}

      <div className="mfoot" style={{ justifyContent: 'flex-start', alignItems: 'center' }}>
        <button type="button" className="btn p" onClick={submit} disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save quick actions'}</button>
        <button type="button" className="btn o" onClick={() => setIds(DEFAULT_QUICK_ACTIONS)} disabled={sameList(ids, DEFAULT_QUICK_ACTIONS)}><Ic as={RotateCcw} />Reset to default</button>
        {dirty && <span className="sub">Unsaved changes</span>}
      </div>
    </section>
  );
}
