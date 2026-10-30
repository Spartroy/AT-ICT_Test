import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bold, Eye, EyeOff, Italic, MoreHorizontal, Plus, Redo2, Send, Undo2 } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { ErrorNote, Ic, Loading, fmtDateTime } from '../../components/portal/kit';
import { Dialog, DialogHeader, useConfirm, useToast } from '../../components/portal/PortalUI';
import { apiError } from '../teacher/modals/form';
import { GuideCtx } from './GuideBlocks';
import ChapterView from './GuideChapter';
import GuideNav from './GuideNav';
import { scrollToSection } from './StudyGuideReader';
import { BLOCK_KINDS, insertAt, moveItem, newBlock, newSection, removeAt, setIn } from './guideLogic';

const HISTORY_LIMIT = 80;
const AUTOSAVE_MS = 1200;

/** Undo history for the document. Edits with the same `key` in quick succession (a dragged slider) count as one. */
function useHistory(initial) {
  const [state, setState] = useState({ past: [], present: initial, future: [] });
  const last = useRef({ key: null, at: 0 });

  const commit = useCallback((fn, key) => {
    setState((s) => {
      const next = fn(s.present);
      if (next === s.present) return s;
      const now = Date.now();
      const merge = key && last.current.key === key && now - last.current.at < 1000;
      last.current = { key: key || null, at: now };
      return { past: merge ? s.past : [...s.past, s.present].slice(-HISTORY_LIMIT), present: next, future: [] };
    });
  }, []);
  const undo = useCallback(() => setState(s => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s)), []);
  const redo = useCallback(() => setState(s => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s)), []);
  const reset = useCallback((doc) => { last.current = { key: null, at: 0 }; setState({ past: [], present: doc, future: [] }); }, []);
  return { doc: state.present, canUndo: state.past.length > 0, canRedo: state.future.length > 0, commit, undo, redo, reset };
}

const STATUS = {
  saved: 'All changes saved',
  dirty: 'Unsaved changes…',
  saving: 'Saving…',
  error: 'Could not save. Retrying on your next change.'
};

/** Picks the kind of block to add. */
function BlockPicker({ onPick, onClose }) {
  const groups = ['Notes', 'Exam help', 'Practical activities'];
  return (
    <Dialog open size="lg" onClose={onClose} labelledBy="picker-title">
      <DialogHeader id="picker-title" icon={Plus} title="Add a block" sub="Pick what to add. It starts with sample text you can click and change." onClose={onClose} />
      <div className="mbody sg-picker">
        {groups.map(g => (
          <div key={g} className="sg-picker-group">
            <h4>{g}</h4>
            <div className="sg-picker-grid">
              {BLOCK_KINDS.filter(k => k.group === g).map(k => (
                <button key={k.t} type="button" onClick={() => onPick(k.t)}>
                  <b>{k.label}</b>
                  <span>{k.hint}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}

/** Library › Study guide: the teacher edits the revision guide that students read in Labs. */
export default function StudyGuideEditor() {
  const toast = useToast();
  const confirm = useConfirm();
  const loaded = useApi(API_ENDPOINTS.GUIDE.EDIT, (b) => b.data);
  const history = useHistory(null);
  const { doc, commit, undo, redo, reset } = history;

  const [meta, setMeta] = useState({ hasDraft: false, publishedAt: null, draftSavedAt: null });
  const [status, setStatus] = useState('saved');
  const [chapter, setChapter] = useState(0);
  const [preview, setPreview] = useState(false);
  const [picker, setPicker] = useState(null);
  const [busy, setBusy] = useState(false);
  const saved = useRef(null); // the version the server has: when `doc` is a different object, there is something to save
  const latest = useRef(null);
  latest.current = doc;

  // First load fills the editor once.
  useEffect(() => {
    if (loaded.data && !doc) {
      saved.current = loaded.data.content;
      reset(loaded.data.content);
      setMeta({ hasDraft: loaded.data.hasDraft, publishedAt: loaded.data.publishedAt, draftSavedAt: loaded.data.draftSavedAt });
    }
  }, [loaded.data, doc, reset]);

  // Autosave the working copy shortly after the last change. Nothing reaches students until Publish.
  useEffect(() => {
    if (!doc) return undefined;
    if (doc === saved.current) { setStatus('saved'); return undefined; }
    setStatus('dirty');
    const timer = setTimeout(async () => {
      setStatus('saving');
      try {
        const res = await api.put(API_ENDPOINTS.GUIDE.DRAFT, { content: doc });
        saved.current = doc;
        setMeta(m => ({ ...m, hasDraft: true, draftSavedAt: res.data?.draftSavedAt }));
        if (latest.current === doc) setStatus('saved');
      } catch (err) {
        setStatus('error');
        toast(apiError(err));
      }
    }, AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [doc, toast]);

  // Warn before leaving with edits that have not reached the server.
  useEffect(() => {
    const warn = (e) => { if (status === 'dirty' || status === 'saving') { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [status]);

  const edit = commit;

  // Ctrl+Z / Ctrl+Y outside of a text box undo and redo the whole document; inside a box the browser handles the text.
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const actions = useMemo(() => ({
    editing: !preview,
    set: (path, value, key) => edit(d => setIn(d, path, value), key),
    remove: (list, i) => { edit(d => removeAt(d, list, i)); toast('Removed. Undo is in the toolbar.'); },
    add: (list, at, item) => edit(d => insertAt(d, list, at, item)),
    move: (list, from, to) => edit(d => moveItem(d, list, from, to)),
    addSection: (ci) => edit(d => insertAt(d, ['chapters', ci, 'secs'], d.chapters[ci].secs.length, newSection(d.chapters[ci]))),
    pickBlock: (list, at) => setPicker({ list, at })
  }), [preview, edit, toast]);

  if (loaded.loading && !doc) return <Loading label="Opening the guide editor…" />;
  if (loaded.error) return <ErrorNote error={loaded.error} onRetry={loaded.reload} />;
  if (!doc) return null;

  const chapters = doc.chapters;
  const ci = Math.min(chapter, chapters.length - 1);
  const unpublished = meta.hasDraft || status !== 'saved';

  const addBlock = (type) => {
    edit(d => insertAt(d, picker.list, picker.at, newBlock(type)));
    setPicker(null);
  };

  const publish = async () => {
    const ok = await confirm({ title: 'Publish the study guide?', body: 'Students will see this version in their Labs tab straight away.', confirmLabel: 'Publish' });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await api.post(API_ENDPOINTS.GUIDE.PUBLISH, { content: doc });
      saved.current = doc;
      setStatus('saved');
      setMeta({ hasDraft: false, publishedAt: res.data?.publishedAt, draftSavedAt: null });
      toast(res.message || 'Published');
    } catch (err) {
      toast(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const discard = async () => {
    const ok = await confirm({ title: 'Discard your changes?', body: 'The guide goes back to what students see now. Unpublished edits are lost.', confirmLabel: 'Discard changes' });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await api.del(API_ENDPOINTS.GUIDE.DRAFT);
      saved.current = res.data.content;
      reset(res.data.content);
      setMeta(m => ({ ...m, hasDraft: false, draftSavedAt: null }));
      setStatus('saved');
      toast('Changes discarded');
    } catch (err) {
      toast(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const resetOriginal = async () => {
    const ok = await confirm({ title: 'Restore the original guide?', body: 'Every edit you have published or drafted is removed, for you and for students. This cannot be undone.', confirmLabel: 'Restore original' });
    if (!ok) return;
    setBusy(true);
    try {
      const res = await api.post(API_ENDPOINTS.GUIDE.RESET, {});
      saved.current = res.data.content;
      reset(res.data.content);
      setMeta({ hasDraft: false, publishedAt: null, draftSavedAt: null });
      setStatus('saved');
      toast(res.message || 'Original restored');
    } catch (err) {
      toast(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  // Keeps the text selection when the toolbar buttons are pressed.
  const keepSelection = (e) => e.preventDefault();
  const format = (command) => document.execCommand(command, false);

  return (
    <div className="sg sg-editor">
      <div className="sg-ebar">
        <div className="sg-ebar-l">
          <span className={`sg-status ${status}`} role="status">{STATUS[status]}</span>
          <span className="sg-muted">
            {unpublished ? 'Draft: students do not see these edits yet.' : meta.publishedAt ? `Live since ${fmtDateTime(meta.publishedAt)}.` : 'Students see the original guide.'}
          </span>
        </div>
        <div className="sg-ebar-r">
          <div className="sg-tools" role="toolbar" aria-label="Editing tools">
            <button type="button" title="Undo (Ctrl+Z)" aria-label="Undo" disabled={!history.canUndo || preview} onClick={undo}><Ic as={Undo2} /></button>
            <button type="button" title="Redo (Ctrl+Y)" aria-label="Redo" disabled={!history.canRedo || preview} onClick={redo}><Ic as={Redo2} /></button>
            <span className="sep" />
            <button type="button" title="Bold the selected text (Ctrl+B)" aria-label="Bold" disabled={preview} onMouseDown={keepSelection} onClick={() => format('bold')}><Ic as={Bold} /></button>
            <button type="button" title="Italic the selected text (Ctrl+I)" aria-label="Italic" disabled={preview} onMouseDown={keepSelection} onClick={() => format('italic')}><Ic as={Italic} /></button>
          </div>
          <button type="button" className="btn o sm" onClick={() => setPreview(p => !p)} aria-pressed={preview}>
            <Ic as={preview ? EyeOff : Eye} />{preview ? 'Back to editing' : 'Preview as student'}
          </button>
          <details className="sg-more">
            <summary className="btn o sm" aria-label="More options"><Ic as={MoreHorizontal} /></summary>
            <div className="sg-more-menu">
              <button type="button" onClick={discard} disabled={busy || !unpublished}>Discard unpublished changes</button>
              <button type="button" className="dng" onClick={resetOriginal} disabled={busy}>Restore the original guide</button>
            </div>
          </details>
          <button type="button" className="btn p sm" onClick={publish} disabled={busy || !unpublished}><Ic as={Send} />Publish</button>
        </div>
      </div>
      {!preview && <p className="sg-help">Click any text to change it, then press Enter. Use the small arrows and cross beside an item to reorder or remove it. Everything saves as a draft until you press Publish.</p>}

      <div className="sg-layout">
        <GuideNav chapters={chapters} current={ci} onSelect={setChapter} onSection={scrollToSection} />
        <main className="sg-paper">
          <GuideCtx.Provider value={actions}>
            <ChapterView key={chapters[ci].id} ch={chapters[ci]} ci={ci} />
          </GuideCtx.Provider>
        </main>
      </div>
      {picker && <BlockPicker onPick={addBlock} onClose={() => setPicker(null)} />}
    </div>
  );
}
