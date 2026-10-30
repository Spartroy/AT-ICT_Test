import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { useConfirm } from '../../components/portal/PortalUI';
import { BlockView, AddItem, ItemBar, T, useGuide } from './GuideBlocks';
import { cleanHtml, newQuestion, plainText, scoreQuiz, sectionNum, verdict } from './guideLogic';

const Icon = ({ as: I }) => <I className="sg-i" aria-hidden="true" />;
const LETTERS = 'ABCDEFGH';

// ---------- sections ----------

function SectionView({ sec, path, index, count }) {
  const ctx = useGuide();
  const confirm = useConfirm();
  const blocksPath = [...path, 'blocks'];
  const list = path.slice(0, -1);

  const removeSection = async () => {
    const ok = await confirm({ title: `Delete section ${sec.num}?`, body: `"${plainText(sec.title)}" and its ${sec.blocks.length} block${sec.blocks.length === 1 ? '' : 's'} will be removed. You can undo this straight after.`, confirmLabel: 'Delete section' });
    if (ok) ctx.remove(list, index);
  };

  return (
    <section id={`sec-${sec.id}`} className="sg-sec" data-sec={sec.id}>
      <header className="sg-sec-h">
        <T as="span" className="sg-num" v={sectionNum(sec)} path={[...path, 'num']} ph="1.1" />
        <T as="h2" v={sec.title} path={[...path, 'title']} ph="Section title" />
        {ctx.editing && (
          <span className="sg-ib sg-ib-inline" role="group" aria-label="Section controls">
            <button type="button" title="Move section up" aria-label="Move section up" disabled={index === 0} onClick={() => ctx.move(list, index, index - 1)}><Icon as={ArrowUp} /></button>
            <button type="button" title="Move section down" aria-label="Move section down" disabled={index === count - 1} onClick={() => ctx.move(list, index, index + 1)}><Icon as={ArrowDown} /></button>
            <button type="button" className="x" title="Delete section" aria-label="Delete section" onClick={removeSection}><Icon as={Trash2} /></button>
          </span>
        )}
      </header>
      <div className="sg-blocks">
        {ctx.editing && <InsertPoint list={blocksPath} at={0} />}
        {sec.blocks.map((b, bi) => (
          <React.Fragment key={b.id}>
            <BlockView b={b} path={[...blocksPath, bi]} index={bi} count={sec.blocks.length} />
            {ctx.editing && <InsertPoint list={blocksPath} at={bi + 1} />}
          </React.Fragment>
        ))}
        {!sec.blocks.length && ctx.editing && <p className="sg-muted">This section is empty. Add a block above.</p>}
      </div>
    </section>
  );
}

/** A thin "+ Add block here" strip between blocks. Only the teacher sees it. */
function InsertPoint({ list, at }) {
  const { pickBlock } = useGuide();
  return (
    <button type="button" className="sg-insert" onClick={() => pickBlock(list, at)} aria-label="Add a block here">
      <span><Icon as={Plus} />Add block here</span>
    </button>
  );
}

// ---------- quiz ----------

/** Students: one question at a time, then a score and the sections to revisit. */
function QuizReader({ ch }) {
  const [answers, setAnswers] = useState({});
  const [at, setAt] = useState(0);
  const quiz = ch.quiz;
  const { answered, score, missed, done } = scoreQuiz(quiz, answers);
  if (!quiz.length) return null;
  const q = quiz[Math.min(at, quiz.length - 1)];
  const picked = answers[at];
  const reveal = picked !== undefined;

  return (
    <section id="sg-quiz" className="sg-quiz" aria-labelledby={`quiz-${ch.id}`}>
      <div className="sg-quiz-top">
        <span className="sg-kicker">Chapter {ch.n} · MCQ check</span>
        <h2 id={`quiz-${ch.id}`}>Did it stick?</h2>
        <p>{quiz.length} questions covering the chapter. Answer them all to see your score and which sections to revisit.</p>
        <div className="sg-quiz-dots" role="group" aria-label="Questions">
          {quiz.map((_, i) => (
            <button key={i} type="button" className={`${i === at ? 'cur' : ''} ${answers[i] === undefined ? '' : answers[i] === quiz[i].c ? 'ok' : 'no'}`} onClick={() => setAt(i)} aria-label={`Question ${i + 1}`} aria-current={i === at}>{i + 1}</button>
          ))}
        </div>
      </div>

      <div className="sg-q">
        <div className="sg-q-meta"><span>Question {at + 1} of {quiz.length}</span><span className="sg-q-sec">Section {q.sec}</span></div>
        <p className="sg-q-t" dangerouslySetInnerHTML={{ __html: cleanHtml(q.t) }} />
        <div className="sg-opts">
          {q.o.map((opt, j) => {
            const right = reveal && j === q.c;
            const wrong = reveal && j === picked && picked !== q.c;
            return (
              <button key={j} type="button" className={`sg-opt ${right ? 'right' : ''} ${wrong ? 'wrong' : ''}`} disabled={reveal} onClick={() => setAnswers(a => ({ ...a, [at]: j }))}>
                <b>{LETTERS[j]}</b>
                <span dangerouslySetInnerHTML={{ __html: cleanHtml(opt) }} />
                {right && <Icon as={Check} />}{wrong && <Icon as={X} />}
              </button>
            );
          })}
        </div>
        {reveal && (
          <p className={`sg-q-exp ${picked === q.c ? 'ok' : 'no'}`}>
            <b>{picked === q.c ? 'Correct.' : 'Not quite.'}</b> <span dangerouslySetInnerHTML={{ __html: cleanHtml(q.e) }} />
          </p>
        )}
        <div className="sg-q-nav">
          <button type="button" className="sg-btn" disabled={at === 0} onClick={() => setAt(at - 1)}>Previous</button>
          <span className="sg-muted">{answered} of {quiz.length} answered</span>
          <button type="button" className="sg-btn pri" disabled={at === quiz.length - 1} onClick={() => setAt(at + 1)}>Next</button>
        </div>
      </div>

      {done && (
        <div className="sg-result" role="status">
          <div className="sg-result-n">{score}<small>/{quiz.length}</small></div>
          <div>
            <b>{verdict(score, quiz.length)}</b>
            <p>{missed.length ? `Revisit: ${missed.join(', ')}` : 'No sections to revisit.'}</p>
            <button type="button" className="sg-btn pri" onClick={() => { setAnswers({}); setAt(0); }}><Icon as={RotateCcw} />Retry quiz</button>
          </div>
        </div>
      )}
    </section>
  );
}

/** Teacher: every question open for editing at once. */
function QuizEditor({ ch, path }) {
  const ctx = useGuide();
  const list = [...path, 'quiz'];
  const sections = ch.secs.map(s => s.num);
  return (
    <section id="sg-quiz" className="sg-quiz sg-quiz-edit">
      <div className="sg-quiz-top">
        <span className="sg-kicker">Chapter {ch.n} · MCQ check</span>
        <h2>Quiz questions</h2>
        <p>Click any text to edit it. Choose the correct option with the tick. Students see these one at a time.</p>
      </div>
      {ch.quiz.map((q, qi) => {
        const at = [...list, qi];
        return (
          <div key={q.id} className="sg-qe sg-li">
            <div className="sg-qe-top">
              <b>Question {qi + 1}</b>
              <label className="sg-qe-sec">Section
                <select value={q.sec} onChange={(e) => ctx.set([...at, 'sec'], e.target.value)}>
                  {!sections.includes(q.sec) && <option value={q.sec}>{q.sec}</option>}
                  {sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <ItemBar list={list} i={qi} n={ch.quiz.length} />
            </div>
            <T as="p" className="sg-q-t" v={q.t} path={[...at, 't']} ph="Question" />
            <div className="sg-opts">
              {q.o.map((opt, j) => (
                <div key={j} className={`sg-opt-e ${j === q.c ? 'right' : ''}`}>
                  <button type="button" className="sg-tick" aria-label={`Mark option ${LETTERS[j]} as correct`} aria-pressed={j === q.c} title="Correct answer" onClick={() => ctx.set([...at, 'c'], j)}>{j === q.c ? <Icon as={Check} /> : LETTERS[j]}</button>
                  <T as="span" className="sg-opt-t" v={opt} path={[...at, 'o', j]} ph="Option" />
                  {q.o.length > 2 && <button type="button" className="sg-chip-x" aria-label="Remove option" title="Remove option" onClick={() => {
                    ctx.remove([...at, 'o'], j);
                    if (q.c === j) ctx.set([...at, 'c'], 0);
                    else if (q.c > j) ctx.set([...at, 'c'], q.c - 1);
                  }}><Icon as={X} /></button>}
                </div>
              ))}
              {q.o.length < 6 && <AddItem list={[...at, 'o']} at={q.o.length} make={() => 'New option'} label="option" />}
            </div>
            <div className="sg-qe-exp"><span>Explanation</span><T as="p" v={q.e} path={[...at, 'e']} ph="Why this is correct" /></div>
          </div>
        );
      })}
      <AddItem list={list} at={ch.quiz.length} make={() => newQuestion(sections[0] || '')} label="question" />
    </section>
  );
}

// ---------- a whole chapter ----------

export default function ChapterView({ ch, ci }) {
  const ctx = useGuide();
  const path = ['chapters', ci];
  const secsPath = [...path, 'secs'];
  return (
    <div className="sg-chapter">
      <header className="sg-ch-head">
        <span className="sg-kicker">Chapter {ctx.editing ? <T v={ch.n} path={[...path, 'n']} ph="1" /> : ch.n}</span>
        <h1><T v={ch.title} path={[...path, 'title']} ph="Chapter title" /> <em><T v={ch.hl} path={[...path, 'hl']} ph="Highlight" /></em></h1>
        <T as="p" className="sg-lede" v={ch.blurb} path={[...path, 'blurb']} ph="One sentence on what this chapter covers" />
      </header>
      {ch.secs.map((s, si) => <SectionView key={s.id} sec={s} path={[...secsPath, si]} index={si} count={ch.secs.length} />)}
      {ctx.editing && (
        <button type="button" className="sg-add sg-add-big" onClick={() => ctx.addSection(ci)}><Icon as={Plus} />Add a section to this chapter</button>
      )}
      {ctx.editing ? <QuizEditor ch={ch} path={path} /> : <QuizReader key={ch.id} ch={ch} />}
    </div>
  );
}
