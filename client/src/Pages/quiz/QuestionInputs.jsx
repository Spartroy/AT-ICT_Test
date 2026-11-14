import React, { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { answerLayout, blankCount, composeGaps, composeLayout, gapJoins, splitBlanks, splitGaps, splitLayout } from './quizLogic';

// The answer widgets students use inside the portal. Every one is controlled: it gets `value` and calls `onChange`.
// Value shapes match what the server marks: tf [true|false|null...], tick [column...], fill [text...],
// pick [option...], match [term...], written 'text', multi [text...].

function TickBox({ on, label, onClick, shape = 'box' }) {
  return (
    <button type="button" role="radio" aria-checked={on} aria-label={label} className={`qz-tickbox ${shape} ${on ? 'on' : ''}`} onClick={onClick}>
      {on && <Check size={15} strokeWidth={3} />}
    </button>
  );
}

/** True / false table: one tick per row in the True or False column. */
function TrueFalse({ item, value = [], onChange }) {
  const set = (i, v) => { const n = item.items.map((_, k) => (k === i ? (value[i] === v ? null : v) : (value[k] ?? null))); onChange(n); };
  return (
    <table className="qz-grid qz-take">
      <thead><tr><th>Statement</th><th>True</th><th>False</th></tr></thead>
      <tbody>{item.items.map((r, i) => (
        <tr key={i}><td>{r.text}</td>
          <td><TickBox on={value[i] === true} label={`True: ${r.text}`} onClick={() => set(i, true)} /></td>
          <td><TickBox on={value[i] === false} label={`False: ${r.text}`} onClick={() => set(i, false)} /></td>
        </tr>
      ))}</tbody>
    </table>
  );
}

function TickTable({ item, value = [], onChange }) {
  const set = (i, c) => onChange(item.items.map((_, k) => (k === i ? (value[i] === c ? '' : c) : (value[k] || ''))));
  return (
    <div className="qz-scroll">
      <table className="qz-grid qz-take">
        <thead><tr><th />{item.columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>{item.items.map((r, i) => (
          <tr key={i}><td>{r.text}</td>{item.columns.map(c => <td key={c}><TickBox on={value[i] === c} label={`${c}: ${r.text}`} onClick={() => set(i, c)} /></td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}

/** Pick N: tick boxes with a cap so students cannot just tick everything. */
function Pick({ item, value = [], onChange }) {
  const toggle = (o) => {
    if (value.includes(o)) return onChange(value.filter(v => v !== o));
    if (value.length >= item.n) return undefined;
    return onChange([...value, o]);
  };
  return (
    <div>
      <p className="qz-hint">Choose {item.n}. {value.length}/{item.n} chosen.</p>
      <ul className="qz-pick qz-take">{item.options.map(o => (
        <li key={o}><TickBox on={value.includes(o)} label={o} onClick={() => toggle(o)} /><span onClick={() => toggle(o)}>{o}</span></li>
      ))}</ul>
    </div>
  );
}

/** One sentence. Every gap gets its own box; several boxes are joined back into the one answer the server marks. */
function FillRow({ text, index, value, onChange }) {
  const parts = useMemo(() => splitBlanks(text), [text]);
  const joins = useMemo(() => gapJoins(text), [text]);
  const n = Math.max(1, blankCount(text));
  const [boxes, setBoxes] = useState(() => (n === 1 ? [value || ''] : splitGaps(value || '', joins, n)));
  const set = (k, v) => {
    const next = [...boxes];
    next[k] = v;
    setBoxes(next);
    onChange(n === 1 ? v : composeGaps(next, joins));
  };
  const box = (k) => <input className="qz-gap" value={boxes[k] || ''} onChange={e => set(k, e.target.value)} aria-label={n === 1 ? `Answer ${index + 1}` : `Answer ${index + 1}, gap ${k + 1}`} autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={200} />;
  let seen = -1;
  return (
    <li>
      {parts.map((p, k) => (p.blank !== undefined ? <React.Fragment key={k}>{box(++seen)}</React.Fragment> : <span key={k}>{p.text}</span>))}
      {!parts.some(p => p.blank !== undefined) && <>{' '}{box(0)}</>}
    </li>
  );
}

function FillText({ item, value = [], onChange }) {
  const set = (i, v) => onChange(item.items.map((_, k) => (k === i ? v : (value[k] || ''))));
  return <ol className="qz-fill qz-take">{item.items.map((r, i) => <FillRow key={i} text={r.text} index={i} value={value[i]} onChange={v => set(i, v)} />)}</ol>;
}

/**
 * Drag-and-drop with a tap fallback (tap a word, then tap a gap) so it works with a mouse, a finger and a keyboard.
 * Used for word banks and for matching terms to statements.
 */
function DropBank({ labels, words, value, onChange, render }) {
  const [picked, setPicked] = useState(null); // word waiting to be placed
  const [over, setOver] = useState(-1);
  const count = labels.length;
  const slots = useMemo(() => Array.from({ length: count }, (_, i) => (Array.isArray(value) ? value[i] : '') || ''), [count, value]);
  const free = useMemo(() => {
    const left = [...words];
    slots.forEach(w => { const k = left.indexOf(w); if (w && k >= 0) left.splice(k, 1); });
    return left;
  }, [words, slots]);

  const put = (i, w) => {
    const next = [...slots];
    const prev = next[i];
    next[i] = w;
    onChange(next);
    setPicked(null);
    return prev;
  };
  const clear = (i) => { const n = [...slots]; n[i] = ''; onChange(n); };
  const drop = (e, i) => {
    e.preventDefault();
    setOver(-1);
    const data = e.dataTransfer.getData('text/plain');
    if (data.startsWith('slot:')) {
      const from = Number(data.slice(5));
      if (from === i) return;
      const n = [...slots];
      [n[from], n[i]] = [n[i], n[from]];
      onChange(n);
    } else if (data) put(i, data);
  };
  const dropOnBank = (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (data.startsWith('slot:')) clear(Number(data.slice(5)));
  };

  return (
    <div className="qz-dnd">
      <div className="qz-bankbox" onDragOver={e => e.preventDefault()} onDrop={dropOnBank} aria-label="Word bank">
        {free.map((w, i) => (
          <button key={`${w}-${i}`} type="button" draggable className={`qz-word ${picked === w ? 'sel' : ''}`} onDragStart={e => e.dataTransfer.setData('text/plain', w)} onClick={() => setPicked(p => (p === w ? null : w))}>{w}</button>
        ))}
        {!free.length && <em>All words used. Drag one back here to take it out.</em>}
      </div>
      <p className="qz-hint">Drag a word into its gap, or tap a word and then tap the gap.</p>
      <ol className="qz-fill qz-take qz-dndlist">
        {labels.map((label, i) => (
          <li key={i}>
            {render(label, (
              <span
                className={`qz-slot ${slots[i] ? 'full' : ''} ${over === i ? 'over' : ''} ${picked ? 'ready' : ''}`}
                onDragOver={e => { e.preventDefault(); setOver(i); }}
                onDragLeave={() => setOver(-1)}
                onDrop={e => drop(e, i)}
                onClick={() => { if (picked) put(i, picked); else if (slots[i]) clear(i); }}
                role="button"
                tabIndex={0}
                aria-label={slots[i] ? `Gap ${i + 1}: ${slots[i]}. Press to remove` : `Gap ${i + 1}, empty`}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (picked) put(i, picked); else if (slots[i]) clear(i); } }}
              >
                {slots[i] ? <b draggable onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('text/plain', `slot:${i}`); }}>{slots[i]}</b> : <i>drop here</i>}
              </span>
            ), i)}
          </li>
        ))}
      </ol>
    </div>
  );
}

function WordBankFill({ item, value, onChange }) {
  return (
    <DropBank
      labels={item.items.map(r => r.text)} words={item.wordbank || []} value={value} onChange={onChange}
      render={(text, slot) => {
        // One word per sentence: a second gap in the same sentence would show the same word twice
        const parts = splitBlanks(text);
        const has = parts.some(p => p.blank !== undefined);
        return <>{parts.map((p, k) => (p.blank === undefined ? <span key={k}>{p.text}</span> : p.blank === 0 ? <React.Fragment key={k}>{slot}</React.Fragment> : null))}{!has && <> {slot}</>}</>;
      }}
    />
  );
}

function Match({ item, value, onChange }) {
  return <DropBank labels={item.items.map(r => r.text)} words={item.terms} value={value} onChange={onChange} render={(text, slot) => <><span>{text}</span> {slot}</>} />;
}

function Written({ marks, value = '', onChange, label, rows, placeholder, caption }) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  return (
    <div className="qz-writ">
      <textarea className="inp qz-area" rows={rows || Math.max(3, Math.min(10, Math.round(marks * 1.4)))} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Write your answer here…'} aria-label={label} maxLength={6000} spellCheck />
      <small>{caption || `${words} word${words === 1 ? '' : 's'} · ${marks} mark${marks === 1 ? '' : 's'}`}</small>
    </div>
  );
}

/** A written answer split into labelled boxes: (a)(b)(c) in one sentence, explanation + example, or "three features". */
function WrittenBoxes({ layout, marks, value, onChange, label }) {
  const n = layout.kind === 'example' ? 2 : layout.kind === 'parts' ? layout.parts.length : layout.n;
  const [boxes, setBoxes] = useState(() => splitLayout(layout, typeof value === 'string' ? value : ''));
  const set = (i, v) => { const next = [...boxes]; next[i] = v; setBoxes(next); onChange(composeLayout(layout, next)); };
  const each = Math.round((marks / n) * 2) / 2;
  const names = layout.kind === 'example' ? ['Your answer', 'Your example'] : layout.kind === 'parts' ? layout.parts.map(p => `(${p.label})`) : Array.from({ length: n }, (_, i) => `${layout.noun.replace(/s$/, '')} ${i + 1}`);
  return (
    <div className="qz-boxes">
      {layout.kind === 'parts' && layout.intro && <p className="qz-lead">{layout.intro}</p>}
      {names.map((nm, i) => (
        <div className="qz-part" key={i}>
          <p>{layout.kind === 'parts' ? <><b>{nm}</b> {layout.parts[i].text}</> : <b>{nm}</b>}</p>
          <Written marks={each} rows={layout.kind === 'example' ? (i ? 2 : 4) : 2} value={boxes[i] || ''} label={`${label} ${nm}`} onChange={v => set(i, v)} caption={layout.kind === 'parts' ? undefined : ' '} placeholder={layout.kind === 'example' && i ? 'Give an example…' : undefined} />
        </div>
      ))}
    </div>
  );
}

function WrittenAnswer({ text, category, marks, value, onChange, label }) {
  const layout = useMemo(() => answerLayout(text, category), [text, category]);
  if (!layout) return <Written marks={marks} value={typeof value === 'string' ? value : ''} label={label} onChange={onChange} />;
  return <WrittenBoxes layout={layout} marks={marks} value={value} onChange={onChange} label={label} />;
}

/** Renders the right widget for a question the server sent (no answers inside). */
export default function QuestionInput({ item, value, onChange, index }) {
  const lead = item.lead && <p className="qz-lead">{item.lead}</p>;
  const ctx = (item.context || item.contextNote) && <p className="qz-ctx">{item.context || item.contextNote}</p>;
  const img = item.imageUrl && <img className="qz-img" src={item.imageUrl} alt="Question diagram" />;
  switch (item.type) {
    case 'tf': return <>{lead}{ctx}{img}<TrueFalse item={item} value={value} onChange={onChange} /></>;
    case 'tick': return <>{lead}{ctx}{img}<TickTable item={item} value={value} onChange={onChange} /></>;
    case 'pick': return <>{lead}{ctx}{img}<Pick item={item} value={value} onChange={onChange} /></>;
    case 'match': return <>{lead}{ctx}{img}<Match item={item} value={value} onChange={onChange} /></>;
    case 'fill': return <>{lead}{ctx}{img}{item.presentation === 'wordbank' ? <WordBankFill item={item} value={value} onChange={onChange} /> : <FillText item={item} value={value} onChange={onChange} />}</>;
    case 'multi': {
      const vals = Array.isArray(value) ? value : [];
      return (
        <>{ctx}{img}
          {item.parts.map((p, i) => (
            <div className="qz-part" key={i}>
              <p><b>({p.label})</b> {p.text}</p>
              <WrittenAnswer text={p.text} category="" marks={p.marks} value={vals[i] || ''} label={`Question ${index + 1} part ${p.label}`} onChange={v => onChange(item.parts.map((_, k) => (k === i ? v : (vals[k] || ''))))} />
            </div>
          ))}
        </>
      );
    }
    default: {
      const own = answerLayout(item.lead, item.category);
      return <>{own?.kind === 'parts' ? null : lead}{ctx}{img}<WrittenAnswer text={item.lead} category={item.category} marks={item.marks} value={value} label={`Question ${index + 1}`} onChange={onChange} /></>;
    }
  }
}
