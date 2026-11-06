import React, { createContext, forwardRef, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, GripVertical, Lightbulb, Pencil, Play, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { Dialog, DialogHeader } from '../../components/portal/PortalUI';
import { ACTIVITY_TAGS, cleanHtml, isActivity, kindOf } from './guideLogic';
import { applyOverrides, collectTexts, loadDemos, watchOverrides } from './activityText';
import { beginDrag, sortAttrs } from './sortable';
import '../../styles/guide.css';

/**
 * The guide is drawn by one set of components for both audiences. With `editing` off it is the page
 * students read. With it on, every piece of text becomes editable in place and items get controls.
 * Edits go through the actions on this context; paths are arrays into the guide document.
 */
export const GuideCtx = createContext({ editing: false });
export const useGuide = () => useContext(GuideCtx);

const Icon = ({ as: I }) => <I className="sg-i" aria-hidden="true" />;

// ---------- editable text ----------

/** A piece of text that can be clicked and typed over. Bold and italic survive; everything else is stripped. */
function EditableText({ v, onCommit, as: Tag = 'span', className = '', ph = 'Type here' }) {
  const ref = useRef(null);
  const html = cleanHtml(v);
  // Sync from the document unless the teacher is typing in this very box.
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== html && document.activeElement !== el) el.innerHTML = html;
  }, [html]);
  return (
    <Tag
      ref={ref}
      className={`${className} sg-ed`}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-ph={ph}
      onBlur={(e) => {
        const next = cleanHtml(e.currentTarget.innerHTML);
        if (next !== html) onCommit(next);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); }
        if (e.key === 'Escape') { e.currentTarget.innerHTML = html; e.currentTarget.blur(); }
      }}
      onPaste={(e) => {
        e.preventDefault();
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain').replace(/\s*\n\s*/g, ' '));
      }}
    />
  );
}

/** Text at `path`: plain markup for students, click-to-edit for the teacher. */
export function T({ v, path, as: Tag = 'span', className = '', ph }) {
  const { editing, set } = useGuide();
  if (editing) return <EditableText v={v} as={Tag} className={className} ph={ph} onCommit={(next) => set(path, next)} />;
  const html = cleanHtml(v);
  if (!html) return null;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

// ---------- editing controls ----------

/** Drag handle for item `i` of the list at `list`. Arrow keys move it too, for keyboard users. */
export function Grip({ list, i, label = 'Drag to reorder' }) {
  const { move } = useGuide();
  return (
    <button
      type="button"
      className="sg-grip"
      title={`${label} (or use the up and down arrow keys)`}
      aria-label={label}
      onPointerDown={(e) => beginDrag(e, list, i, move)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp') { e.preventDefault(); move(list, i, i - 1); }
        if (e.key === 'ArrowDown') { e.preventDefault(); move(list, i, i + 1); }
      }}
    ><Icon as={GripVertical} /></button>
  );
}

/** Drag handle and remove button for item `i` of the list at `list`. Draws nothing for students. */
export function ItemBar({ list, i, className = '' }) {
  const { editing, remove } = useGuide();
  if (!editing) return null;
  return (
    <span className={`sg-ib ${className}`} role="group" aria-label="Item controls">
      <Grip list={list} i={i} />
      <button type="button" className="x" title="Remove" aria-label="Remove" onClick={() => remove(list, i)}><Icon as={X} /></button>
    </span>
  );
}

/** "+ Add ..." under a list. Draws nothing for students. */
export function AddItem({ list, at, make, label }) {
  const { editing, add } = useGuide();
  if (!editing) return null;
  return (
    <button type="button" className="sg-add" onClick={() => add(list, at, make())}><Icon as={Plus} />Add {label}</button>
  );
}

// ---------- blocks ----------

function BlockTitle({ b, path }) {
  const { editing } = useGuide();
  if (!b.title && !editing) return null;
  return <T as="h3" className="sg-btitle" v={b.title} path={[...path, 'title']} ph="Heading" />;
}

function Def({ b, path }) {
  return (
    <div className="sg-def">
      <T as="div" className="sg-def-l" v={b.l} path={[...path, 'l']} ph="Term" />
      <T as="p" className="sg-def-h" v={b.h} path={[...path, 'h']} ph="Meaning" />
    </div>
  );
}

function Flow({ b, path }) {
  const list = [...path, 'steps'];
  return (
    <>
      <BlockTitle b={b} path={path} />
      <ol className="sg-flow">
        {b.steps.map((s, i) => (
          <li key={i} className="sg-li" {...sortAttrs(list, i)}>
            <span className="sg-step-n">{i + 1}</span>
            <T as="b" className="sg-step-h" v={s[0]} path={[...list, i, 0]} ph="Step" />
            <T as="span" className="sg-step-d" v={s[1]} path={[...list, i, 1]} ph="What happens" />
            <ItemBar list={list} i={i} />
          </li>
        ))}
      </ol>
      <AddItem list={list} at={b.steps.length} make={() => ['New step', 'What happens']} label="step" />
    </>
  );
}

function Tree({ b, path }) {
  const list = [...path, 'kids'];
  return (
    <div className="sg-tree">
      <T as="div" className="sg-tree-root" v={b.root} path={[...path, 'root']} ph="Topic" />
      <div className="sg-tree-kids">
        {b.kids.map((k, i) => {
          const leaves = [...list, i, 1];
          return (
            <div key={i} className="sg-tree-kid sg-li" {...sortAttrs(list, i)}>
              <T as="h4" v={k[0]} path={[...list, i, 0]} ph="Branch" />
              <ul>
                {k[1].map((x, j) => (
                  <li key={j} className="sg-li" {...sortAttrs(leaves, j)}>
                    <T v={x} path={[...leaves, j]} ph="Point" />
                    <ItemBar list={leaves} i={j} />
                  </li>
                ))}
              </ul>
              <AddItem list={leaves} at={k[1].length} make={() => 'New point'} label="point" />
              <ItemBar list={list} i={i} className="sg-ib-corner" />
            </div>
          );
        })}
      </div>
      <AddItem list={list} at={b.kids.length} make={() => ['New branch', ['Point']]} label="branch" />
    </div>
  );
}

function Cards({ b, path }) {
  const list = [...path, 'items'];
  return (
    <>
      <BlockTitle b={b} path={path} />
      <div className="sg-cards">
        {b.items.map((it, i) => (
          <div key={i} className="sg-card sg-li" {...sortAttrs(list, i)}>
            <T as="h4" v={it[0]} path={[...list, i, 0]} ph="Heading" />
            <T as="p" v={it[1]} path={[...list, i, 1]} ph="Detail" />
            <ItemBar list={list} i={i} className="sg-ib-corner" />
          </div>
        ))}
      </div>
      <AddItem list={list} at={b.items.length} make={() => ['New card', 'Detail']} label="card" />
    </>
  );
}

function Parts({ b, path }) {
  const list = [...path, 'items'];
  return (
    <>
      <BlockTitle b={b} path={path} />
      <dl className="sg-parts">
        {b.items.map((it, i) => (
          <div key={i} className="sg-part sg-li" {...sortAttrs(list, i)}>
            <T as="dt" v={it[0]} path={[...list, i, 0]} ph="Part" />
            <T as="dd" v={it[1]} path={[...list, i, 1]} ph="What it is" />
            <ItemBar list={list} i={i} className="sg-ib-corner" />
          </div>
        ))}
      </dl>
      <AddItem list={list} at={b.items.length} make={() => ['New part', 'What it is']} label="part" />
    </>
  );
}

function Chips({ b, path }) {
  const { editing, remove } = useGuide();
  const list = [...path, 'items'];
  return (
    <>
      <BlockTitle b={b} path={path} />
      <ul className="sg-chips">
        {b.items.map((it, i) => (
          <li key={i}>
            <T v={it} path={[...list, i]} ph="Tag" />
            {editing && <button type="button" className="sg-chip-x" aria-label="Remove" title="Remove" onClick={() => remove(list, i)}><Icon as={X} /></button>}
          </li>
        ))}
      </ul>
      <AddItem list={list} at={b.items.length} make={() => 'New tag'} label="tag" />
    </>
  );
}

function Meter({ b, path }) {
  const { editing, set } = useGuide();
  const list = [...path, 'items'];
  return (
    <>
      <BlockTitle b={b} path={path} />
      <div className="sg-meter">
        {b.items.map((m, i) => (
          <div key={i} className="sg-meter-row sg-li" {...sortAttrs(list, i)}>
            <T as="span" className="sg-meter-n" v={m[0]} path={[...list, i, 0]} ph="Item" />
            <span className="sg-meter-bar" aria-hidden="true"><i style={{ width: `${Math.max(Number(m[1]) || 0, 4)}%` }} /></span>
            <T as="span" className="sg-meter-l" v={m[2]} path={[...list, i, 2]} ph="Label" />
            {editing && (
              <input type="range" min="0" max="100" className="sg-range" aria-label={`${m[0]} bar length`} value={Number(m[1]) || 0} onChange={(e) => set([...list, i, 1], Number(e.target.value), `m${path.join('.')}${i}`)} />
            )}
            <ItemBar list={list} i={i} />
          </div>
        ))}
      </div>
      <AddItem list={list} at={b.items.length} make={() => ['New item', 50, 'Medium']} label="row" />
    </>
  );
}

function Table({ b, path }) {
  const { editing, remove, add } = useGuide();
  const cols = b.head.length;
  const rows = [...path, 'rows'];
  return (
    <>
      <BlockTitle b={b} path={path} />
      <div className="sg-table-wrap">
        <div className="sg-table" style={{ gridTemplateColumns: `repeat(${cols}, minmax(150px, 1fr))${editing ? ' 84px' : ''}` }} role="table">
          {b.head.map((h, c) => (
            <div key={`h${c}`} className="sg-th sg-li" role="columnheader">
              <T v={h} path={[...path, 'head', c]} ph="Column" />
              {editing && cols > 1 && (
                <button type="button" className="sg-col-x" title="Remove this column" aria-label="Remove this column" onClick={() => {
                  remove([...path, 'head'], c);
                  b.rows.forEach((_, r) => remove([...rows, r], c));
                }}><Icon as={X} /></button>
              )}
            </div>
          ))}
          {editing && <div className="sg-th" aria-hidden="true" />}
          {b.rows.map((row, r) => (
            <React.Fragment key={r}>
              {row.map((cell, c) => (
                <div key={c} className={`sg-td ${r % 2 ? 'alt' : ''} ${c === 0 ? 'first' : ''}`} role="cell" {...sortAttrs(rows, r)}>
                  <T v={cell} path={[...rows, r, c]} ph="Cell" />
                </div>
              ))}
              {editing && <div className={`sg-td sg-td-bar ${r % 2 ? 'alt' : ''}`} {...sortAttrs(rows, r)}><ItemBar list={rows} i={r} /></div>}
            </React.Fragment>
          ))}
        </div>
      </div>
      {editing && (
        <div className="sg-add-row">
          <AddItem list={rows} at={b.rows.length} make={() => b.head.map(() => '')} label="row" />
          <button type="button" className="sg-add" onClick={() => {
            add([...path, 'head'], cols, 'New column');
            b.rows.forEach((_, r) => add([...rows, r], cols, ''));
          }}><Icon as={Plus} />Add column</button>
        </div>
      )}
    </>
  );
}

function Tabs({ b, path }) {
  const { editing, remove } = useGuide();
  const list = [...path, 'tabs'];
  return (
    <>
      <BlockTitle b={b} path={path} />
      <div className="sg-panels">
        {b.tabs.map((t, i) => {
          const at = [...list, i];
          const pros = t.p || [];
          const cons = t.c || [];
          const extras = t.x || [];
          return (
            <div key={i} className="sg-panel sg-li" {...sortAttrs(list, i)}>
              <T as="h4" v={t.n} path={[...at, 'n']} ph="Name" />
              {(t.d || editing) && <T as="div" className="sg-panel-d" v={t.d} path={[...at, 'd']} ph="Description" />}
              {(t.u || editing) && (
                <p className="sg-panel-u"><b>Uses:</b> <T v={t.u} path={[...at, 'u']} ph="Where it is used" /></p>
              )}
              {(extras.length > 0 || editing) && (
                <>
                  <ul className="sg-chips sg-chips-sm">
                    {extras.map((x, j) => (
                      <li key={j}><T v={x} path={[...at, 'x', j]} ph="Tag" />
                        {editing && <button type="button" className="sg-chip-x" aria-label="Remove" onClick={() => remove([...at, 'x'], j)}><Icon as={X} /></button>}
                      </li>
                    ))}
                  </ul>
                  <AddItem list={[...at, 'x']} at={extras.length} make={() => 'New tag'} label="tag" />
                </>
              )}
              <div className="sg-procon">
                <div className="sg-pro">
                  <T as="b" v={t.pl || 'Advantages'} path={[...at, 'pl']} />
                  <ul>
                    {pros.map((x, j) => (
                      <li key={j} className="sg-li" {...sortAttrs([...at, 'p'], j)}><T v={x} path={[...at, 'p', j]} ph="Point" /><ItemBar list={[...at, 'p']} i={j} /></li>
                    ))}
                  </ul>
                  <AddItem list={[...at, 'p']} at={pros.length} make={() => 'New point'} label="point" />
                </div>
                {(cons.length > 0 || editing) && (
                  <div className="sg-con">
                    <T as="b" v={t.cl || 'Disadvantages'} path={[...at, 'cl']} />
                    <ul>
                      {cons.map((x, j) => (
                        <li key={j} className="sg-li" {...sortAttrs([...at, 'c'], j)}><T v={x} path={[...at, 'c', j]} ph="Point" /><ItemBar list={[...at, 'c']} i={j} /></li>
                      ))}
                    </ul>
                    <AddItem list={[...at, 'c']} at={cons.length} make={() => 'New point'} label="point" />
                  </div>
                )}
              </div>
              <ItemBar list={list} i={i} className="sg-ib-corner" />
            </div>
          );
        })}
      </div>
      <AddItem list={list} at={b.tabs.length} make={() => ({ n: 'New panel', d: '', p: ['Point'], c: [] })} label="panel" />
    </>
  );}

function Hint({ b, path }) {
  return (
    <div className="sg-note sg-tip">
      <span className="sg-note-ic"><Icon as={Lightbulb} /></span>
      <div>
        <div className="sg-note-k">Exam tip</div>
        <T as="p" v={b.h} path={[...path, 'h']} ph="Tip" />
      </div>
    </div>
  );
}

function Mistake({ b, path }) {
  return (
    <div className="sg-note sg-mis">
      <span className="sg-note-ic"><Icon as={AlertTriangle} /></span>
      <div className="sg-mis-body">
        <div className="sg-note-k">Common mistake</div>
        <div className="sg-mis-row bad"><span>Students write</span><T as="p" v={b.w} path={[...path, 'w']} ph="What students write" /></div>
        <div className="sg-mis-row good"><span>Correct</span><T as="p" v={b.r} path={[...path, 'r']} ph="The correct answer" /></div>
      </div>
    </div>
  );
}

function QuickCheck({ b, path }) {
  const { editing } = useGuide();
  const [open, setOpen] = useState(false);
  const show = open || editing;
  return (
    <div className="sg-note sg-qc">
      <div className="sg-note-k">Quick check</div>
      <T as="p" className="sg-qc-q" v={b.q} path={[...path, 'q']} ph="Question" />
      {!editing && <button type="button" className="sg-btn" onClick={() => setOpen(o => !o)} aria-expanded={open}>{open ? 'Hide answer' : 'Reveal answer'}</button>}
      {show && <T as="p" className="sg-qc-a" v={b.a} path={[...path, 'a']} ph="Answer" />}
    </div>
  );
}

// ---------- practical activities ----------

/** Mounts one activity element and keeps the teacher's reworded labels applied to it. */
const DemoHost = forwardRef(function DemoHost({ tag, map }, hostRef) {
  const [state, setState] = useState('loading');
  const mapRef = useRef(map);
  mapRef.current = map || {};
  const elRef = useRef(null);

  useEffect(() => {
    let live = true;
    loadDemos().then(() => live && setState('ready'), () => live && setState('error'));
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (state !== 'ready') return undefined;
    const el = elRef.current;
    if (!el?.shadowRoot) return undefined;
    return watchOverrides(el.shadowRoot, () => mapRef.current);
  }, [state]);

  useEffect(() => {
    if (state === 'ready' && elRef.current?.shadowRoot) applyOverrides(elRef.current.shadowRoot, map || {});
  }, [map, state]);

  if (state === 'error') return <p className="sg-muted">This activity could not be loaded. Check your connection and reload the page.</p>;
  if (state === 'loading') return <p className="sg-muted">Loading the activity…</p>;
  return React.createElement(tag, { ref: (el) => { elRef.current = el; if (hostRef) hostRef.current = el; } });
});

/** A practical activity in its own labelled panel: instruction first, the demo opens on demand. */
function TryIt({ b, path }) {
  const { editing, set } = useGuide();
  const [open, setOpen] = useState(editing);
  const [mounted, setMounted] = useState(editing);
  const [wording, setWording] = useState(false);
  const hostRef = useRef(null);
  const toggle = () => { setMounted(true); setOpen(o => !o); };

  return (
    <div className={`sg-try ${open ? 'open' : ''}`}>
      <div className="sg-try-head">
        <span className="sg-try-badge"><Icon as={Play} />Try it</span>
        <div className="sg-try-text">
          <T as="h3" v={b.title} path={[...path, 'title']} ph="Activity title" />
          <T as="p" v={b.ins} path={[...path, 'ins']} ph="What should students do?" />
        </div>
        <button type="button" className="sg-try-go" onClick={toggle} aria-expanded={open}>
          {open ? 'Close' : 'Open activity'}<Icon as={ChevronDown} />
        </button>
      </div>
      {mounted && (
        <div className="sg-try-body" hidden={!open}>
          <DemoHost tag={ACTIVITY_TAGS[b.t]} map={b.tx} ref={hostRef} />
          {editing && (
            <div className="sg-try-edit">
              <button type="button" className="sg-btn" onClick={() => setWording(true)}><Icon as={Pencil} />Edit the wording inside this activity</button>
              {b.tx && Object.keys(b.tx).length > 0 && <span className="sg-muted">{Object.keys(b.tx).length} label{Object.keys(b.tx).length === 1 ? '' : 's'} reworded</span>}
            </div>
          )}
        </div>
      )}
      {wording && <ActivityWording host={hostRef} value={b.tx || {}} onClose={() => setWording(false)} onSave={(map) => { set([...path, 'tx'], map); setWording(false); }} />}
    </div>
  );
}

/** Lists the words visible inside an activity so each can be reworded: original on the left, your wording on the right. */
function ActivityWording({ host, value, onClose, onSave }) {
  const [texts] = useState(() => (host.current?.shadowRoot ? collectTexts(host.current.shadowRoot) : []));
  const [draft, setDraft] = useState(() => Object.fromEntries(texts.map(t => [t, value[t] ?? t])));
  const isChanged = (t) => (draft[t] ?? t).trim() !== t;
  const changed = texts.filter(isChanged).length;
  const save = () => {
    const out = {};
    texts.forEach((t) => { const next = (draft[t] || '').trim(); if (next && next !== t) out[t] = next; });
    onSave(out);
  };
  return (
    <Dialog open size="wide" className="sg-wd" onClose={onClose} labelledBy="wording-title">
      <DialogHeader id="wording-title" icon={Pencil} title="Edit the wording" sub="Change any label, caption or step shown in this activity. Step through the activity to reveal more of its text." onClose={onClose} />
      <div className="sg-wd-body">
        {texts.length === 0 && (
          <div className="sg-wd-empty">
            <b>Nothing to edit yet</b>
            <p>Open the activity and press its buttons so more text appears, then come back here.</p>
          </div>
        )}
        {texts.length > 0 && (
          <>
            <div className="sg-wd-cols" aria-hidden="true"><span>Original</span><span>Your wording</span></div>
            {texts.map((t) => (
              <div key={t} className={`sg-wd-row ${isChanged(t) ? 'changed' : ''}`}>
                <p className="sg-wd-orig">{t}</p>
                <textarea
                  className="inp"
                  rows={Math.min(6, Math.max(1, Math.ceil(t.length / 44)))}
                  value={draft[t] ?? ''}
                  aria-label={`Wording for “${t}”`}
                  onChange={(e) => setDraft(d => ({ ...d, [t]: e.target.value }))}
                />
                {isChanged(t) && (
                  <button type="button" className="sg-wd-undo" title="Put the original back" aria-label="Put the original wording back" onClick={() => setDraft(d => ({ ...d, [t]: t }))}><Icon as={RotateCcw} /></button>
                )}
              </div>
            ))}
          </>
        )}
      </div>
      <div className="sg-wd-foot">
        <span className="sg-wd-count">{changed ? `${changed} changed` : 'No changes yet'}</span>
        <button type="button" className="btn o" onClick={() => onSave({})}>Restore all original</button>
        <button type="button" className="btn o" onClick={onClose}>Cancel</button>
        <button type="button" className="btn p" onClick={save} disabled={!texts.length}>Save wording</button>
      </div>
    </Dialog>
  );
}

// ---------- one block, with its editing bar ----------

const VIEWS = { def: Def, flow: Flow, tree: Tree, cards: Cards, parts: Parts, chips: Chips, meter: Meter, table: Table, tabs: Tabs, hint: Hint, mis: Mistake, qc: QuickCheck };

export function BlockView({ b, path, index }) {
  const ctx = useGuide();
  const View = isActivity(b.t) ? TryIt : VIEWS[b.t];
  if (!View) return null;
  const list = path.slice(0, -1);
  return (
    <article className={`sg-block sg-b-${isActivity(b.t) ? 'try' : b.t}`} data-id={b.id} {...sortAttrs(list, index)}>
      {ctx.editing && (
        <div className="sg-bbar" role="group" aria-label={`${kindOf(b.t)?.label || b.t} block controls`}>
          <span className="sg-bbar-k">{kindOf(b.t)?.label || b.t}</span>
          <Grip list={list} i={index} label="Drag to move this block" />
          <button type="button" className="x" title="Delete this block" aria-label="Delete this block" onClick={() => ctx.remove(list, index)}><Icon as={Trash2} /></button>
        </div>
      )}
      <View b={b} path={path} />
    </article>
  );
}
