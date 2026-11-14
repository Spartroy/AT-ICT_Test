import React, { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { splitBlanks } from './quizLogic';

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

/** Sentences with a text box where each gap goes. */
function FillText({ item, value = [], onChange }) {
  const set = (i, v) => onChange(item.items.map((_, k) => (k === i ? v : (value[k] || ''))));
  return (
    <ol className="qz-fill qz-take">{item.items.map((r, i) => {
      const parts = splitBlanks(r.text);
      const has = parts.some(p => p.blank !== undefined);
      const box = <input className="qz-gap" value={value[i] || ''} onChange={e => set(i, e.target.value)} aria-label={`Answer ${i + 1}`} autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={200} />;
      return (
        <li key={i}>
          {parts.map((p, k) => (p.blank !== undefined ? <React.Fragment key={k}>{box}</React.Fragment> : <span key={k}>{p.text}</span>))}
          {!has && <>{' '}{box}</>}
        </li>
      );
    })}</ol>
  );
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
        const parts = splitBlanks(text);
        const has = parts.some(p => p.blank !== undefined);
        return <>{parts.map((p, k) => (p.blank !== undefined ? <React.Fragment key={k}>{slot}</React.Fragment> : <span key={k}>{p.text}</span>))}{!has && <> {slot}</>}</>;
      }}
    />
  );
}

function Match({ item, value, onChange }) {
  return <DropBank labels={item.items.map(r => r.text)} words={item.terms} value={value} onChange={onChange} render={(text, slot) => <><span>{text}</span> {slot}</>} />;
}

function Written({ marks, value = '', onChange, label }) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  return (
    <div className="qz-writ">
      <textarea className="inp qz-area" rows={Math.max(3, Math.min(10, Math.round(marks * 1.4)))} value={value} onChange={e => onChange(e.target.value)} placeholder="Write your answer here…" aria-label={label} maxLength={6000} spellCheck />
      <small>{words} word{words === 1 ? '' : 's'} · {marks} mark{marks === 1 ? '' : 's'}</small>
    </div>
  );
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
              <Written marks={p.marks} value={vals[i] || ''} label={`Question ${index + 1} part ${p.label}`} onChange={v => onChange(item.parts.map((_, k) => (k === i ? v : (vals[k] || ''))))} />
            </div>
          ))}
        </>
      );
    }
    default: return <>{lead}{ctx}{img}<Written marks={item.marks} value={typeof value === 'string' ? value : ''} label={`Question ${index + 1}`} onChange={onChange} /></>;
  }
}
