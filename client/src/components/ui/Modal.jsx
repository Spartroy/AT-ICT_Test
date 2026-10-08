import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ui.css';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Keeps Tab / Shift+Tab inside `ref`. On open, focuses initialFocusRef, else the first match for
 * initialFocusSelector (e.g. the first form field), else the first focusable element. */
export function useFocusTrap(ref, active, initialFocusRef, initialFocusSelector) {
  useEffect(() => {
    if (!active || !ref.current) return undefined;
    const root = ref.current;
    const visible = () => [...root.querySelectorAll(FOCUSABLE)].filter(el => !el.closest('[hidden], [inert], [aria-hidden="true"]'));
    const first = initialFocusRef?.current
      || (initialFocusSelector && visible().find(el => el.matches(initialFocusSelector)))
      || visible()[0]
      || root;
    first.focus({ preventScroll: true });

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const items = visible();
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const [head, tail] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === head) {
        e.preventDefault();
        tail.focus();
      } else if (!e.shiftKey && document.activeElement === tail) {
        e.preventDefault();
        head.focus();
      }
    };
    root.addEventListener('keydown', onKeyDown);
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [ref, active, initialFocusRef, initialFocusSelector]);
}

/**
 * Accessible dialog: portal, focus trap, Escape and backdrop close, scroll lock,
 * focus restored to the opener on close.
 */
export default function Modal({ open, onClose, labelledBy, label, className = '', panelClassName = '', initialFocusRef, initialFocusSelector, children }) {
  const panelRef = useRef(null);
  const openerRef = useRef(null);
  // Callers often pass an inline onClose; keep the latest one without re-running the open/close effect.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Layout effects run before the focus trap's effect moves focus, so this records the real opener.
  useLayoutEffect(() => {
    if (open) openerRef.current = document.activeElement;
  }, [open]);

  useFocusTrap(panelRef, open, initialFocusRef, initialFocusSelector);

  useEffect(() => {
    if (!open) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKeyDown);
      if (openerRef.current && typeof openerRef.current.focus === 'function') openerRef.current.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className={`ui-modal ${className}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCloseRef.current?.();
      }}
    >
      <div
        ref={panelRef}
        className={`ui-modal__panel ${panelClassName}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
