import React, { useEffect, useState } from 'react';
import { LayoutGrid, Plus, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogHeader, useToast } from './PortalUI';
import { Ic } from './kit';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';

const blankCard = () => ({ front: '', back: '' });

/** Create (or edit) a flashcard stack: title, visibility, cards. Calls onSaved(stack). */
export function StackFormDialog({ open, onClose, onSaved, stack }) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [cards, setCards] = useState([blankCard()]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(stack?.title || '');
    setIsPublic(stack ? stack.isPublic !== false : true);
    setCards(stack?.cards?.length ? stack.cards.map(c => ({ front: c.front, back: c.back })) : [blankCard()]);
    setErrors({});
  }, [open, stack]);

  const setCard = (i, side, value) => setCards(cs => cs.map((c, k) => (k === i ? { ...c, [side]: value } : c)));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (title.trim().length < 3) next.title = 'Title must be at least 3 characters';
    const filled = cards.filter(c => c.front.trim() || c.back.trim());
    if (!filled.length) next.cards = 'Add at least one card';
    else if (filled.some(c => !c.front.trim() || !c.back.trim())) next.cards = 'Every card needs a front and a back';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const body = { title: title.trim(), isPublic, category: 'technology', cards: filled.map(c => ({ front: c.front.trim(), back: c.back.trim() })) };
      const res = stack ? await api.put(`${API_ENDPOINTS.FLASHCARDS}/${stack._id}`, body) : await api.post(API_ENDPOINTS.FLASHCARDS, body);
      toast(stack ? 'Stack saved' : 'Stack created');
      onSaved?.(res.data);
      onClose();
    } catch (err) {
      setErrors({ form: err.body?.errors?.[0]?.msg || err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} size="wide" labelledBy="stack-form-title">
      <DialogHeader id="stack-form-title" icon={LayoutGrid} title={stack ? 'Edit flashcard stack' : 'Create flashcard stack'} sub="A set of question / answer cards" onClose={onClose} />
      <form className="mbody" onSubmit={submit} noValidate>
        <div className="r2">
          <label className="fld">
            <span>Stack title *</span>
            <input className="inp" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 1 key terms" aria-invalid={!!errors.title} />
            {errors.title && <span className="fld-err">{errors.title}</span>}
          </label>
          <label className="fld">
            <span>Visibility</span>
            <select className="inp" value={isPublic ? 'public' : 'private'} onChange={e => setIsPublic(e.target.value === 'public')}>
              <option value="public">Public: everyone can study it</option>
              <option value="private">Private: only me</option>
            </select>
          </label>
        </div>
        {cards.map((c, i) => (
          <div className="fcd" key={i}>
            <b aria-hidden="true">{i + 1}</b>
            <label className="fld"><span>Front *</span><textarea className="inp" rows={2} value={c.front} onChange={e => setCard(i, 'front', e.target.value)} placeholder="Question or prompt…" aria-label={`Card ${i + 1} front`} /></label>
            <label className="fld"><span>Back *</span><textarea className="inp" rows={2} value={c.back} onChange={e => setCard(i, 'back', e.target.value)} placeholder="Answer or explanation…" aria-label={`Card ${i + 1} back`} /></label>
            {cards.length > 1 && (
              <button type="button" className="ib sm dng fcd-rm" aria-label={`Remove card ${i + 1}`} onClick={() => setCards(cs => cs.filter((_, k) => k !== i))}><Ic as={Trash2} /></button>
            )}
          </div>
        ))}
        {errors.cards && <p className="fld-err">{errors.cards}</p>}
        <button type="button" className="btn o sm" onClick={() => setCards(cs => [...cs, blankCard()])}><Ic as={Plus} />Add card</button>
        {errors.form && <p className="fld-err" role="alert" style={{ marginTop: 10 }}>{errors.form}</p>}
        <div className="mfoot">
          <button type="button" className="btn o" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn p" disabled={saving}>{saving ? 'Saving…' : stack ? 'Save stack' : 'Create stack'}</button>
        </div>
      </form>
    </Dialog>
  );
}

/** Flip-card study dialog with previous / next. Records a study on open. */
export function StudyDialog({ stack, onClose }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    if (!stack) return;
    setI(0);
    setFlipped(false);
    api.post(`${API_ENDPOINTS.FLASHCARDS}/${stack._id}/study`).catch(() => {});
  }, [stack]);
  if (!stack) return null;
  const cards = stack.cards || [];
  const card = cards[i];
  const go = (d) => { setI(x => x + d); setFlipped(false); };

  return (
    <Dialog open onClose={onClose} labelledBy="study-title">
      <button type="button" className="ib x" aria-label="Close" onClick={onClose}><Ic as={X} /></button>
      <h3 id="study-title" className="node-title" style={{ marginTop: 0 }}>{stack.title}</h3>
      <p className="sub">{cards.length} card{cards.length === 1 ? '' : 's'} · By {stack.creatorName || 'AT-ICT'}</p>
      {card ? (
        <>
          <div className={`fcard ${flipped ? 'fl' : ''}`}>
            <div role="button" tabIndex={0} aria-label={flipped ? 'Answer. Press to show the question' : 'Question. Press to show the answer'}
              onClick={() => setFlipped(f => !f)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(f => !f); } }}>
              <div className="f fr" aria-hidden={flipped}><span>{card.front}<small>Click to flip</small></span></div>
              <div className="f bk" aria-hidden={!flipped}><span>{card.back}</span></div>
            </div>
          </div>
          <div className="fc-nav">
            <button type="button" className="btn o sm" onClick={() => go(-1)} disabled={i === 0}><Ic as={ChevronLeft} />Previous</button>
            <span className="sub" aria-live="polite">{i + 1} of {cards.length}</span>
            <button type="button" className="btn o sm" onClick={() => go(1)} disabled={i >= cards.length - 1}>Next<Ic as={ChevronRight} /></button>
          </div>
        </>
      ) : <p className="sub" style={{ marginTop: 20 }}>This stack has no cards yet.</p>}
    </Dialog>
  );
}
