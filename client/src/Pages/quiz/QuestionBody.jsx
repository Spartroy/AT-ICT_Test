import React from 'react';
import { Check } from 'lucide-react';
import { splitBlanks } from './quizLogic';

/**
 * Read-only view of a question (teacher side: the arrange step, the bank, the paper preview).
 * With `showAnswer` the correct answers and the mark-scheme points are shown.
 */
export default function QuestionBody({ item, showAnswer = false }) {
  const lead = item.lead && <p className="qz-lead">{item.lead}</p>;
  const ctx = (item.context || item.contextNote) && <p className="qz-ctx">{item.context || item.contextNote}</p>;
  const img = item.imageUrl && <img className="qz-img" src={item.imageUrl} alt="" loading="lazy" decoding="async" />;

  switch (item.type) {
    case 'tf':
      return (
        <div>{lead}{ctx}{img}
          <table className="qz-grid"><thead><tr><th /><th>True</th><th>False</th></tr></thead>
            <tbody>{item.items.map((r, i) => (
              <tr key={i}><td>{r.text}</td>
                {[true, false].map(v => <td key={String(v)}><span className={`qz-box ${showAnswer && r.answer === v ? 'on' : ''}`}>{showAnswer && r.answer === v && <Check size={13} />}</span></td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
      );
    case 'tick':
      return (
        <div>{lead}{ctx}{img}
          <table className="qz-grid"><thead><tr><th />{item.columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>{item.items.map((r, i) => (
              <tr key={i}><td>{r.text}</td>
                {item.columns.map(c => <td key={c}><span className={`qz-box ${showAnswer && r.answer === c ? 'on' : ''}`}>{showAnswer && r.answer === c && <Check size={13} />}</span></td>)}
              </tr>
            ))}</tbody>
          </table>
        </div>
      );
    case 'fill':
      return (
        <div>{lead}{ctx}{img}
          {item.presentation === 'wordbank' || item.wordbank?.length > 0 ? <div className="qz-bank">{item.wordbank.map(w => <span key={w}>{w}</span>)}</div> : null}
          <ol className="qz-fill">{item.items.map((r, i) => {
            const parts = splitBlanks(r.text);
            const hasBlank = parts.some(p => p.blank !== undefined);
            return (
              <li key={i}>
                {parts.map((p, k) => (p.blank !== undefined
                  ? <span key={k} className={`qz-blank ${showAnswer ? 'on' : ''}`}>{showAnswer ? r.answers[0] : ''}</span>
                  : <span key={k}>{p.text}</span>))}
                {!hasBlank && <span className={`qz-blank ${showAnswer ? 'on' : ''}`}>{showAnswer ? r.answers[0] : ''}</span>}
              </li>
            );
          })}</ol>
        </div>
      );
    case 'pick':
      return (
        <div>{lead}{ctx}{img}
          <ul className="qz-pick">{item.options.map(o => {
            const on = showAnswer && item.answers.includes(o);
            return <li key={o}><span className={`qz-box ${on ? 'on' : ''}`}>{on && <Check size={13} />}</span>{o}</li>;
          })}</ul>
        </div>
      );
    case 'match':
      return (
        <div>{lead}{ctx}{img}
          <div className="qz-bank">{item.terms.map(t => <span key={t}>{t}</span>)}</div>
          <ol className="qz-fill">{item.items.map((r, i) => <li key={i}>{r.text}<span className={`qz-blank ${showAnswer ? 'on' : ''}`}>{showAnswer ? r.answer : ''}</span></li>)}</ol>
        </div>
      );
    case 'multi':
      return (
        <div>{ctx}{img}
          {item.parts.map((p, i) => (
            <div className="qz-part" key={i}>
              <p><b>({p.label})</b> {p.text} <em>[{Math.round(p.marks * (item.marks / item.baseMarks) * 2) / 2}]</em></p>
              {p.subs?.length > 0 && <ol className="qz-subs">{p.subs.map(x => <li key={x.label}><b>({x.label})</b> {x.text} <em>[{x.marks}]</em></li>)}</ol>}
              {showAnswer ? <Answer text={p.model} points={p.points} /> : <div className="qz-lines" />}
            </div>
          ))}
        </div>
      );
    default:
      return (
        <div>{lead}{ctx}{img}
          {showAnswer ? <Answer text={item.model} points={item.points} /> : <div className="qz-lines" />}
        </div>
      );
  }
}

function Answer({ text, points }) {
  return (
    <div className="qz-model">
      <small>Model answer</small>
      {String(text || '').split('\n').map((l, i) => <p key={i}>{l}</p>)}
      {points?.length > 0 && <ul>{points.map((p, i) => <li key={i}>{p}</li>)}</ul>}
    </div>
  );
}
