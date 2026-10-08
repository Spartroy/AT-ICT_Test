import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import Button from '../ui/Button';
import { TextField, PasswordField, SelectField, TextAreaField, CheckboxField, ChoiceGroup } from '../ui/Field';
import { fetchRegistrationOptions, submitRegistration } from '../../utils/authApi';
import {
  STEPS, SCHOOL_TYPES, YEARS, NATIONALITIES, initialValues,
  validateStep, firstInvalidStep, buildPayload, mapServerErrors,
  passwordStrength, STRENGTH_LABELS, schoolSummary
} from './registration';

const STRENGTH_COLORS = ['var(--dark-error)', 'var(--dark-warn)', 'var(--dark-good)', 'var(--dark-ok)'];

function useRegistrationOptions() {
  const [state, setState] = useState({ status: 'loading', examSessions: [], royalClasses: [] });
  const load = useCallback(async () => {
    setState(s => ({ ...s, status: 'loading' }));
    const res = await fetchRegistrationOptions();
    if (res.ok && res.body?.data) setState({ status: 'ready', ...res.body.data });
    else setState({ status: 'error', examSessions: [], royalClasses: [] });
  }, []);
  useEffect(() => { load(); }, [load]);
  return [state, load];
}

/**
 * Student registration: 4 steps, inline validation, server errors mapped back to their step.
 * Calls onSuccess({ firstName, email, contactNumber, summary }) after a successful POST.
 */
export default function RegisterForm({ onSuccess }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [focusTarget, setFocusTarget] = useState(null);
  const [options, reloadOptions] = useRegistrationOptions();
  const refs = useRef({});
  const formRef = useRef(null);
  const reg = name => el => { refs.current[name] = el; };

  // Move focus once the step containing the target has rendered.
  useEffect(() => {
    if (!focusTarget) return;
    const el = refs.current[focusTarget];
    if (el) el.focus();
    setFocusTarget(null);
  }, [focusTarget, step]);

  const set = (name, value) => {
    setValues(v => ({ ...v, [name]: value }));
    setErrors(e => {
      if (!e[name]) return e;
      const { [name]: _removed, ...rest } = e;
      return rest;
    });
    setGeneralError('');
  };
  const onInput = name => e => set(name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);

  const firstFieldOf = (s) => ({ 0: 'firstName', 1: 'schoolType', 2: 'contactNumber', 3: 'techKnowledge' }[s]);

  const goTo = (next, focus) => {
    setStep(next);
    setFocusTarget(focus || firstFieldOf(next));
    formRef.current?.closest('.ui-modal')?.scrollTo?.({ top: 0 });
  };

  const showErrors = (s, errs) => {
    setErrors(errs);
    if (s !== step) setStep(s);
    setFocusTarget(Object.keys(errs)[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (step === 1 && values.schoolType && options.status !== 'ready') {
      setGeneralError("We couldn't load the class and session lists. Please try again.");
      return;
    }
    const stepErrors = validateStep(step, values);
    if (Object.keys(stepErrors).length) {
      showErrors(step, stepErrors);
      return;
    }
    if (step < STEPS.length - 1) {
      setErrors({});
      goTo(step + 1);
      return;
    }

    const invalid = firstInvalidStep(values);
    if (invalid) {
      showErrors(invalid.step, invalid.errors);
      return;
    }

    setSubmitting(true);
    const res = await submitRegistration(buildPayload(values));
    setSubmitting(false);

    if (res.ok) {
      onSuccess({
        firstName: values.firstName.trim(),
        email: values.email.trim(),
        contactNumber: values.contactNumber.trim(),
        summary: schoolSummary(values, options.examSessions)
      });
      return;
    }

    const mapped = mapServerErrors(res.body);
    if (mapped.step !== null) showErrors(mapped.step, mapped.fields);
    else setGeneralError(res.status === 429 ? 'Too many attempts. Please wait a minute and try again.' : mapped.message);
  };

  const strength = passwordStrength(values.password);
  const isRoyal = values.schoolType === 'royal';
  const isCenter = values.schoolType === 'center';
  const current = STEPS[step];

  return (
    <form ref={formRef} className="auth-register" onSubmit={handleSubmit} noValidate aria-labelledby="register-title">
      <h3 id="register-title" className="auth-title">Student registration</h3>
      <p className="auth-sub auth-sub--tight">Create your account in about 2 minutes.</p>

      <ol className="auth-steps">
        {STEPS.map((s, i) => (
          <li key={s.short} className={i === step ? 'is-current' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
            <i aria-hidden="true">{i < step ? <Check size={16} strokeWidth={3} /> : i + 1}</i>
            <span>{s.short}<span className="sr-only">{i < step ? ' (completed)' : ''}</span></span>
          </li>
        ))}
      </ol>
      <div className="auth-progress" aria-hidden="true"><i style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      <p className="sr-only" aria-live="polite">{`Step ${step + 1} of ${STEPS.length}: ${current.name}`}</p>

      <div className="auth-panel" key={step}>
        <div className="auth-step-head">
          <h4>{current.title}</h4>
          <p>{current.subtitle}</p>
        </div>

        {step === 0 && (
          <>
            <div className="auth-row2">
              <TextField label="First name *" name="firstName" placeholder="e.g. Joud" autoComplete="given-name" value={values.firstName} onChange={onInput('firstName')} error={errors.firstName} inputRef={reg('firstName')} />
              <TextField label="Last name *" name="lastName" placeholder="e.g. El Daher" autoComplete="family-name" value={values.lastName} onChange={onInput('lastName')} error={errors.lastName} inputRef={reg('lastName')} />
            </div>
            <TextField label="Email address *" name="email" type="email" placeholder="you@email.com" autoComplete="email" value={values.email} onChange={onInput('email')} error={errors.email} inputRef={reg('email')} />
            <div className="auth-row2">
              <PasswordField
                label="Password *"
                name="password"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                value={values.password}
                onChange={onInput('password')}
                error={errors.password}
                inputRef={reg('password')}
                hint={values.password ? STRENGTH_LABELS[strength] : 'Use 8+ characters with letters and numbers.'}
              >
                <span className="auth-strength" aria-hidden="true">
                  {[0, 1, 2, 3].map(i => (
                    <i key={i} style={i < strength ? { background: STRENGTH_COLORS[Math.max(0, strength - 1)] } : undefined} />
                  ))}
                </span>
              </PasswordField>
              <PasswordField label="Confirm password *" name="confirmPassword" placeholder="Confirm your password" autoComplete="new-password" value={values.confirmPassword} onChange={onInput('confirmPassword')} error={errors.confirmPassword} inputRef={reg('confirmPassword')} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <ChoiceGroup
              label="School type *"
              name="schoolType"
              variant="cards"
              options={SCHOOL_TYPES}
              value={values.schoolType}
              onChange={v => {
                set('schoolType', v);
                setErrors({});
              }}
              error={errors.schoolType}
              firstRef={reg('schoolType')}
            />
            {options.status === 'loading' && values.schoolType && <p className="auth-note">Loading options…</p>}
            {options.status === 'error' && values.schoolType && (
              <div className="auth-alert" role="alert">
                We couldn't load the class and session lists.
                <button type="button" className="auth-link" onClick={reloadOptions}>Try again</button>
              </div>
            )}

            {isRoyal && options.status === 'ready' && (
              <div className="auth-reveal">
                <ChoiceGroup
                  label="Class *"
                  name="royalClass"
                  options={options.royalClasses.map(c => ({ value: c, label: `Class ${c}` }))}
                  value={values.royalClass}
                  onChange={v => set('royalClass', v)}
                  error={errors.royalClass}
                  firstRef={reg('royalClass')}
                />
              </div>
            )}

            {isCenter && options.status === 'ready' && (
              <div className="auth-reveal">
                <div className="auth-row2">
                  <ChoiceGroup label="What year are you in? *" name="year" options={YEARS} value={values.year} onChange={v => set('year', v)} error={errors.year} firstRef={reg('year')} />
                  <ChoiceGroup
                    label="Which session? *"
                    name="session"
                    options={options.examSessions.map(s => ({ value: s.code, label: s.label }))}
                    value={values.session}
                    onChange={v => set('session', v)}
                    error={errors.session}
                    firstRef={reg('session')}
                  />
                </div>
                <TextField label="Which school do you attend? *" name="school" placeholder="Your school name" value={values.school} onChange={onInput('school')} error={errors.school} inputRef={reg('school')} />
                <SelectField label="What's your nationality? *" name="nationality" placeholder="Select your nationality" options={NATIONALITIES} value={values.nationality} onChange={onInput('nationality')} error={errors.nationality} inputRef={reg('nationality')} />
                <CheckboxField label="I'm a retaker (don't worry, we've all been there)" name="isRetaker" checked={values.isRetaker} onChange={onInput('isRetaker')} />
                <TextAreaField label="What other subjects are you taking? (optional)" name="otherSubjects" rows={2} placeholder="e.g. Mathematics, Physics, Chemistry, Business Studies…" value={values.otherSubjects} onChange={onInput('otherSubjects')} />
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div className="auth-row2">
              <TextField label="Your contact number *" name="contactNumber" type="tel" placeholder="01012345678" autoComplete="tel" value={values.contactNumber} onChange={onInput('contactNumber')} error={errors.contactNumber} inputRef={reg('contactNumber')} />
              <TextField label="Parent / guardian contact *" name="parentNumber" type="tel" placeholder="01012345678" value={values.parentNumber} onChange={onInput('parentNumber')} error={errors.parentNumber} inputRef={reg('parentNumber')} />
            </div>
            <p className="auth-note auth-note--tight">Used only for class updates and WhatsApp support.</p>
            {isCenter && (
              <div className="auth-reveal">
                <div className="auth-where">Where are you located?</div>
                <div className="auth-row2">
                  <TextField label="City *" name="city" placeholder="Your city" autoComplete="address-level2" value={values.city} onChange={onInput('city')} error={errors.city} inputRef={reg('city')} />
                  <TextField label="Country *" name="country" placeholder="Your country" autoComplete="country-name" value={values.country} onChange={onInput('country')} error={errors.country} inputRef={reg('country')} />
                </div>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <SkillSlider
              name="techKnowledge"
              question="On a scale of 1–10, how comfortable are you with technology and computers?"
              min="1 · Complete beginner"
              max="10 · Tech expert"
              value={values.techKnowledge}
              onChange={v => set('techKnowledge', v)}
              inputRef={reg('techKnowledge')}
            />
            <SkillSlider
              name="englishLevel"
              question="On a scale of 1–10, how comfortable are you with the English language?"
              min="1 · Basic English"
              max="10 · Fluent English"
              value={values.englishLevel}
              onChange={v => set('englishLevel', v)}
              inputRef={reg('englishLevel')}
            />
            <dl className="auth-review" aria-label="Review">
              <b>Review</b>
              <div><dt>Name</dt><dd>{values.firstName} {values.lastName}</dd></div>
              <div><dt>Email</dt><dd>{values.email}</dd></div>
              <div><dt>School</dt><dd>{schoolSummary(values, options.examSessions)}</dd></div>
              {isCenter
                ? <div><dt>Location</dt><dd>{values.city}, {values.country}</dd></div>
                : <div><dt>Phone</dt><dd>{values.contactNumber}</dd></div>}
            </dl>
            <CheckboxField
              label={<>I agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms</a> &amp; <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a> *</>}
              name="terms"
              checked={values.terms}
              onChange={onInput('terms')}
              error={errors.terms}
              inputRef={reg('terms')}
            />
          </>
        )}
      </div>

      {generalError && <div className="auth-alert" role="alert">{generalError}</div>}

      <div className="auth-nav">
        <Button variant="outline" onClick={() => goTo(step - 1)} style={{ visibility: step ? 'visible' : 'hidden' }} tabIndex={step ? 0 : -1} aria-hidden={!step}>
          Previous
        </Button>
        <Button type="submit" loading={submitting}>
          {step === STEPS.length - 1 ? 'Create account' : 'Next'}
          {!submitting && <ArrowRight size={18} aria-hidden="true" />}
        </Button>
      </div>
    </form>
  );
}

function SkillSlider({ name, question, min, max, value, onChange, inputRef }) {
  return (
    <div className="auth-skill">
      <p id={`${name}-q`}>{question}</p>
      <input
        ref={inputRef}
        type="range"
        name={name}
        min="1"
        max="10"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        aria-labelledby={`${name}-q`}
        aria-valuetext={`${value} out of 10`}
      />
      <div className="auth-skill__foot">
        <span className="auth-pill">{min}</span>
        <output aria-hidden="true">{value}</output>
        <span className="auth-pill">{max}</span>
      </div>
    </div>
  );
}
