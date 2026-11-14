import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import logo from '../../assets/brand/logo-full-light.png';
import { answerLines, splitBlanks } from './quizLogic';

// A printable paper (also what students use on an iPad with a pencil). It opens in its own window so the portal's
// styles never leak in, then the browser's Print dialog offers "Save as PDF".

const CSS = `
@page { size: A4; margin: 14mm 14mm 16mm; }
* { box-sizing: border-box; }
body { margin: 0; font: 13px/1.5 "Poppins", "Segoe UI", system-ui, sans-serif; color: #1a1a1a; background: #e9e9ec; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.sheet { max-width: 8.27in; margin: 20px auto; background: #fff; padding: 0.5in 0.6in; box-shadow: 0 10px 40px rgba(0,0,0,.12); }
.mast { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #1a1a1a; padding-bottom: 12px; }
.mast img { height: 38px; }
.mast h1 { margin: 0; font-size: 19px; line-height: 1.15; }
.mast small { display: block; color: #6b6b73; font-weight: 500; text-transform: uppercase; letter-spacing: .04em; font-size: 10.5px; margin-top: 3px; }
.mast .tot { margin-left: auto; text-align: right; font-size: 11px; color: #6b6b73; }
.mast .tot b { display: block; font-size: 20px; color: #ca133e; line-height: 1; }
.who { display: flex; gap: 22px; margin: 14px 0 6px; font-size: 12px; }
.who span { flex: 1; border-bottom: 1px solid #1a1a1a; padding-bottom: 2px; color: #6b6b73; }
.who span:last-child { flex: .6; }
.note { background: #f7f7f8; border-radius: 8px; padding: 9px 12px; font-size: 11.5px; color: #44444b; margin: 10px 0 4px; }
.q { break-inside: avoid; padding: 14px 0 12px; border-bottom: 1px solid #e7e7e9; }
.q:last-child { border-bottom: 0; }
.qh { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
.qn { background: #ca133e; color: #fff; font-weight: 800; font-size: 12px; border-radius: 6px; padding: 2px 9px; }
.qm { font-size: 11px; font-weight: 600; color: #a01030; background: #fde8ec; border-radius: 99px; padding: 2px 10px; }
.qt { font-size: 10px; color: #a3a3ab; text-transform: uppercase; letter-spacing: .08em; margin-left: auto; }
.lead { margin: 0 0 6px; font-weight: 600; }
.ctx { margin: 0 0 6px; color: #44444b; }
table { width: 100%; border-collapse: collapse; margin: 4px 0; }
th, td { border: 1px solid #c9c9ce; padding: 6px 9px; text-align: left; vertical-align: middle; }
th { background: #f7f7f8; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
td.c, th.c { text-align: center; width: 84px; }
.box { display: inline-block; width: 16px; height: 16px; border: 1.6px solid #1a1a1a; border-radius: 3px; vertical-align: middle; }
.box.on { background: #ca133e; border-color: #ca133e; position: relative; }
.box.on::after { content: "✓"; color: #fff; position: absolute; inset: -3px 0 0; text-align: center; font-size: 13px; font-weight: 800; }
.bank { display: flex; flex-wrap: wrap; gap: 6px; border: 1.5px dashed #c9c9ce; border-radius: 8px; padding: 8px 10px; margin: 4px 0 8px; }
.bank span { border: 1px solid #1a1a1a; border-radius: 99px; padding: 2px 11px; font-weight: 600; font-size: 12px; }
ol.fill { margin: 4px 0 0; padding-left: 22px; }
ol.fill li { margin: 0 0 8px; line-height: 1.9; }
.blank { display: inline-block; min-width: 130px; border-bottom: 1.5px solid #1a1a1a; margin: 0 4px; padding: 0 4px; font-family: "Patrick Hand", cursive; color: #1d3a6b; font-size: 15px; text-align: center; }
.lines { margin-top: 4px; }
.lines i { display: block; height: 27px; border-bottom: 1px solid #cfd8e6; }
.part { margin: 7px 0 4px; }
.part p { margin: 0; font-weight: 500; }
.part em { font-style: normal; font-weight: 700; color: #a01030; }
.pick { list-style: none; margin: 2px 0 0; padding: 0; columns: 2; }
.pick li { margin: 3px 0; display: flex; gap: 9px; align-items: center; break-inside: avoid; }
.model { background: #f7f7f8; border-left: 3px solid #ca133e; border-radius: 6px; padding: 8px 12px; margin-top: 6px; font-size: 12px; }
.model small { display: block; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: #a01030; font-size: 9.5px; margin-bottom: 3px; }
.model p { margin: 0 0 3px; }
.model ul { margin: 4px 0 0; padding-left: 18px; color: #44444b; }
.match { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 40px; margin: 6px 0; }
.match div { border: 1px solid #c9c9ce; border-radius: 6px; padding: 6px 10px; min-height: 32px; }
.foot { margin-top: 18px; text-align: center; color: #a3a3ab; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
.toolbar { position: sticky; top: 0; z-index: 5; display: flex; gap: 10px; align-items: center; justify-content: center; background: #1a1a1a; color: #fff; padding: 10px; font-size: 13px; }
.toolbar button { background: #ca133e; color: #fff; border: 0; border-radius: 8px; padding: 8px 16px; font-weight: 700; cursor: pointer; }
@media print { body { background: #fff; } .sheet { box-shadow: none; margin: 0; padding: 0; max-width: none; } .toolbar { display: none; } }
`;

const Lines = ({ n }) => <div className="lines">{Array.from({ length: n }, (_, i) => <i key={i} />)}</div>;
const Box = ({ on }) => <span className={`box ${on ? 'on' : ''}`} />;

function Model({ text, points }) {
  return (
    <div className="model"><small>Mark scheme</small>
      {String(text || '').split('\n').map((l, i) => <p key={i}>{l}</p>)}
      {points?.length > 0 && <ul>{points.map((p, i) => <li key={i}>{p}</li>)}</ul>}
    </div>
  );
}

function Body({ item, key_ }) {
  const lead = item.lead && <p className="lead">{item.lead}</p>;
  const ctx = (item.context || item.contextNote) && <p className="ctx">{item.context || item.contextNote}</p>;
  switch (item.type) {
    case 'tf':
      return (<>{lead}{ctx}<table><thead><tr><th>Statement</th><th className="c">True</th><th className="c">False</th></tr></thead><tbody>
        {item.items.map((r, i) => <tr key={i}><td>{r.text}</td><td className="c"><Box on={key_ && r.answer} /></td><td className="c"><Box on={key_ && !r.answer} /></td></tr>)}
      </tbody></table></>);
    case 'tick':
      return (<>{lead}{ctx}<table><thead><tr><th />{item.columns.map(c => <th className="c" key={c}>{c}</th>)}</tr></thead><tbody>
        {item.items.map((r, i) => <tr key={i}><td>{r.text}</td>{item.columns.map(c => <td className="c" key={c}><Box on={key_ && r.answer === c} /></td>)}</tr>)}
      </tbody></table></>);
    case 'fill':
      return (<>{lead}{ctx}
        {item.presentation === 'wordbank' && <div className="bank">{[...item.wordbank].sort((a, b) => a.localeCompare(b)).map(w => <span key={w}>{w}</span>)}</div>}
        <ol className="fill">{item.items.map((r, i) => {
          const parts = splitBlanks(r.text);
          const has = parts.some(p => p.blank !== undefined);
          return (<li key={i}>{parts.map((p, k) => (p.blank !== undefined ? <span className="blank" key={k}>{key_ ? r.answers[0] : ' '}</span> : <span key={k}>{p.text}</span>))}{!has && <span className="blank">{key_ ? r.answers[0] : ' '}</span>}</li>);
        })}</ol></>);
    case 'pick':
      return (<>{lead}{ctx}<ul className="pick">{item.options.map(o => <li key={o}><Box on={key_ && item.answers.includes(o)} />{o}</li>)}</ul></>);
    case 'match':
      return (<>{lead}{ctx}<div className="bank">{item.terms.map(t => <span key={t}>{t}</span>)}</div>
        <div className="match">{item.items.map((r, i) => <React.Fragment key={i}><div>{r.text}</div><div>{key_ ? r.answer : ''}</div></React.Fragment>)}</div></>);
    case 'multi':
      return (<>{ctx}{item.parts.map((p, i) => {
        const m = Math.round(p.marks * (item.marks / item.baseMarks) * 2) / 2;
        return (<div className="part" key={i}><p>({p.label}) {p.text} <em>[{m}]</em></p>{key_ ? <Model text={p.model} points={p.points} /> : <Lines n={answerLines(m)} />}</div>);
      })}</>);
    default:
      return (<>{lead}{ctx}{key_ ? <Model text={item.model} points={item.points} /> : <Lines n={answerLines(item.marks)} />}</>);
  }
}

function Paper({ quiz, items, answerKey, origin }) {
  const total = items.reduce((n, i) => n + i.marks, 0);
  return (
    <div className="sheet">
      <div className="mast">
        <img src={new URL(logo, origin).href} alt="AT-ICT" />
        <div><h1>{quiz.title || 'ICT theory quiz'}</h1><small>Cambridge IGCSE ICT (0417){answerKey ? ' · Mark scheme' : ' · Theory'}</small></div>
        <div className="tot"><b>{Math.round(total * 2) / 2}</b>marks{quiz.settings?.durationMin ? ` · ${quiz.settings.durationMin} min` : ''}</div>
      </div>
      {!answerKey && <div className="who"><span>Name</span><span>Class / group</span><span>Date</span></div>}
      {!answerKey && <div className="note">Answer all questions. Tick the boxes, fill the gaps and write your answers in the spaces. The marks for each question are shown in the brackets.</div>}
      {items.map((it, i) => (
        <div className="q" key={it.uid || i}>
          <div className="qh"><span className="qn">Q{i + 1}</span><span className="qm">{it.marks} mark{it.marks === 1 ? '' : 's'}</span>{answerKey && <span className="qt">{it.category} · {it.difficulty}</span>}</div>
          <Body item={it} key_={answerKey} />
        </div>
      ))}
      <div className="foot">AT-ICT · {answerKey ? 'Teacher copy' : 'End of paper'}</div>
    </div>
  );
}

/** Opens the paper (or its mark scheme) in a new window and offers the print dialog. Returns false if a popup blocker stopped it. */
export function openPaper({ quiz, items, answerKey = false }) {
  const w = window.open('', '_blank');
  if (!w) return false;
  const body = renderToStaticMarkup(<Paper quiz={quiz} items={items} answerKey={answerKey} origin={window.location.origin} />);
  const title = `${quiz.title || 'Quiz'}${answerKey ? ' - mark scheme' : ''}`.replace(/[<&>]/g, '');
  w.document.open();
  w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Patrick+Hand&display=swap" rel="stylesheet"><style>${CSS}</style></head><body><div class="toolbar"><span>Use Print and choose “Save as PDF”, or print it for pencil and paper.</span><button onclick="window.print()">Print / save as PDF</button></div>${body}</body></html>`);
  w.document.close();
  w.focus();
  return true;
}
