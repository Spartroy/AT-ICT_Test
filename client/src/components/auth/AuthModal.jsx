import React, { useEffect, useRef, useState } from 'react';
import { Hourglass, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import SignInForm from './SignInForm';
import RegisterForm from './RegisterForm';
import { fireConfetti } from './confetti';
import './auth.css';

const TABS = [
  { id: 'in', label: 'Sign in' },
  { id: 'up', label: 'Register' }
];

/**
 * Auth modal from the public website: Sign in / Register tabs.
 * tab: 'in' | 'up'. onTabChange lets the page keep the URL (/signin, /register) in sync.
 */
export default function AuthModal({ open, tab = 'in', onTabChange, onClose, signInNotice }) {
  const [active, setActive] = useState(tab);
  const [registered, setRegistered] = useState(null);
  const [popup, setPopup] = useState(false);
  const cardRef = useRef(null);
  const tabRefs = useRef({});

  useEffect(() => { setActive(tab); }, [tab]);

  // Reset the success state whenever the modal closes.
  useEffect(() => {
    if (!open) {
      setRegistered(null);
      setPopup(false);
    }
  }, [open]);

  useEffect(() => {
    if (!registered) return undefined;
    const stopConfetti = fireConfetti(cardRef.current?.getBoundingClientRect());
    const t = setTimeout(() => setPopup(true), 1500);
    return () => {
      clearTimeout(t);
      stopConfetti();
    };
  }, [registered]);

  const select = (id) => {
    setActive(id);
    onTabChange?.(id);
  };

  const onTabKey = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = active === 'in' ? 'up' : 'in';
    select(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={registered ? 'reg-done-title' : `auth-tab-${active}`}
      panelClassName="auth-card-wrap"
      initialFocusSelector=".auth-pane input, .auth-pane select"
    >
      <div ref={cardRef} className="auth-card">
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close" inert={popup ? '' : undefined}>
          <X size={18} aria-hidden="true" />
        </button>

        {!registered && (
          <>
            <div className="auth-tabs" role="tablist" aria-label="Account">
              {TABS.map(t => (
                <button
                  key={t.id}
                  ref={el => { tabRefs.current[t.id] = el; }}
                  id={`auth-tab-${t.id}`}
                  type="button"
                  role="tab"
                  aria-selected={active === t.id}
                  aria-controls={`auth-pane-${t.id}`}
                  tabIndex={active === t.id ? 0 : -1}
                  className={active === t.id ? 'is-on' : ''}
                  onClick={() => select(t.id)}
                  onKeyDown={onTabKey}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div id={`auth-pane-${active}`} role="tabpanel" aria-labelledby={`auth-tab-${active}`} className="auth-pane">
              {active === 'in'
                ? <SignInForm onRegister={() => select('up')} notice={signInNotice} />
                : <RegisterForm onSuccess={setRegistered} />}
            </div>
          </>
        )}

        {registered && <RegisterSuccess info={registered} popup={popup} onDone={onClose} />}
      </div>
    </Modal>
  );
}

function RegisterSuccess({ info, popup, onDone }) {
  const gotItRef = useRef(null);
  const headingRef = useRef(null);
  // The form that held focus is gone: land on the heading, then on "Got it" once the popup shows.
  useEffect(() => { headingRef.current?.focus(); }, []);
  useEffect(() => {
    if (popup) gotItRef.current?.focus();
  }, [popup]);

  return (
    <div className="auth-done">
      <div inert={popup ? '' : undefined} aria-hidden={popup || undefined}>
        <svg className="auth-done__check" viewBox="0 0 52 52" aria-hidden="true">
          <circle cx="26" cy="26" r="24" />
          <path d="M15 27l8 8 14-16" />
        </svg>
        <h3 id="reg-done-title" ref={headingRef} tabIndex={-1} className="auth-title">Congratulations, {info.firstName}!</h3>
        <p className="auth-sub">Your registration ({info.summary}) has been received.</p>
        <ol className="auth-timeline">
          <li className="is-ok"><i aria-hidden="true" /><b>Registration sent</b><small>Just now</small></li>
          <li className="is-wait"><i aria-hidden="true" /><b>Admin review</b><small>Usually within 24 hours</small></li>
          <li><i aria-hidden="true" /><b>Account activated</b><small>You'll get a message</small></li>
        </ol>
      </div>

      <div className={`auth-popup ${popup ? 'is-shown' : ''}`} role="alertdialog" aria-modal="true" aria-labelledby="reg-pop-title" aria-describedby="reg-pop-body" hidden={!popup}>
        <div className="auth-popup__card">
          <span className="auth-popup__icon"><Hourglass size={30} aria-hidden="true" /></span>
          <h4 id="reg-pop-title">Please wait for admin confirmation</h4>
          <p id="reg-pop-body">
            Your account is <b>pending approval</b>. Please wait for the admin to confirm it — we'll contact you at <b>{info.email}</b> and on
            WhatsApp (<b>{info.contactNumber}</b>), usually within 24 hours.
          </p>
          <Button ref={gotItRef} block onClick={onDone}>Got it</Button>
        </div>
      </div>
    </div>
  );
}
