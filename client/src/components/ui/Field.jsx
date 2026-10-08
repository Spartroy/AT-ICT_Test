import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './ui.css';

/** Wraps a control with its label, hint and inline error. */
// The visible error is linked to its control with aria-describedby, so focusing the
// first invalid control after "Next" reads the message out.
export function Field({ label, error, errorId, hint, htmlFor, className = '', children }) {
  return (
    <div className={`ui-field ${error ? 'is-invalid' : ''} ${className}`}>
      {label && <label className="ui-field__label" htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && <small className="ui-field__hint">{hint}</small>}
      {error && <small id={errorId} className="ui-field__error">{error}</small>}
    </div>
  );
}

const describedBy = (id, error) => (error ? `${id}-err` : undefined);

export function TextField({ label, error, hint, className, inputRef, ...inputProps }) {
  const id = useId();
  return (
    <Field label={label} error={error} errorId={`${id}-err`} hint={hint} className={className} htmlFor={id}>
      <input id={id} ref={inputRef} className="ui-input" aria-invalid={!!error} aria-describedby={describedBy(id, error)} {...inputProps} />
    </Field>
  );
}

export function PasswordField({ label, error, hint, className, inputRef, children, ...inputProps }) {
  const id = useId();
  const [shown, setShown] = useState(false);
  return (
    <Field label={label} error={error} errorId={`${id}-err`} hint={hint} className={className} htmlFor={id}>
      <span className="ui-password">
        <input
          id={id}
          ref={inputRef}
          className="ui-input"
          type={shown ? 'text' : 'password'}
          aria-invalid={!!error}
          aria-describedby={describedBy(id, error)}
          {...inputProps}
        />
        <button type="button" className="ui-password__toggle" onClick={() => setShown(s => !s)} aria-label={shown ? 'Hide password' : 'Show password'}>
          {shown ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
        </button>
      </span>
      {children}
    </Field>
  );
}

export function SelectField({ label, error, className, inputRef, placeholder, options, ...selectProps }) {
  const id = useId();
  return (
    <Field label={label} error={error} errorId={`${id}-err`} className={className} htmlFor={id}>
      <select id={id} ref={inputRef} className="ui-input" aria-invalid={!!error} aria-describedby={describedBy(id, error)} {...selectProps}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map(o => (typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </Field>
  );
}

export function TextAreaField({ label, error, className, inputRef, ...props }) {
  const id = useId();
  return (
    <Field label={label} error={error} errorId={`${id}-err`} className={className} htmlFor={id}>
      <textarea id={id} ref={inputRef} className="ui-input ui-input--area" aria-invalid={!!error} aria-describedby={describedBy(id, error)} {...props} />
    </Field>
  );
}

export function CheckboxField({ label, error, className = '', inputRef, ...props }) {
  const id = useId();
  return (
    <div className={`ui-check-wrap ${error ? 'is-invalid' : ''} ${className}`}>
      <label className="ui-check" htmlFor={id}>
        <input id={id} ref={inputRef} type="checkbox" aria-invalid={!!error} aria-describedby={describedBy(id, error)} {...props} />
        <span>{label}</span>
      </label>
      {error && <small id={`${id}-err`} className="ui-field__error">{error}</small>}
    </div>
  );
}

/**
 * Radio group rendered as chips (default) or cards. Options: { value, label, description? }.
 * Arrow keys move between options (native radio behaviour).
 */
export function ChoiceGroup({ label, name, value, onChange, options, variant = 'chips', error, className = '', firstRef }) {
  const id = useId();
  return (
    <div className={`ui-choice ${error ? 'is-invalid' : ''} ${className}`} role="radiogroup" aria-labelledby={`${id}-label`} aria-describedby={describedBy(id, error)}>
      <span id={`${id}-label`} className="ui-field__label">{label}</span>
      <div className={variant === 'cards' ? 'ui-choice__cards' : 'ui-choice__chips'}>
        {options.map((o, i) => (
          <label key={o.value} className={variant === 'cards' ? 'ui-choice-card' : 'ui-chip'}>
            <input
              ref={i === 0 ? firstRef : undefined}
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
            />
            {variant === 'cards' ? (
              <span>
                <b>{o.label}</b>
                {o.description && <small>{o.description}</small>}
              </span>
            ) : (
              <span>{o.label}</span>
            )}
          </label>
        ))}
      </div>
      {error && <small id={`${id}-err`} className="ui-field__error">{error}</small>}
    </div>
  );
}
