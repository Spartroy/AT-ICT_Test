import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Modal from '../ui/Modal';

const PortalUIContext = createContext(null);

/**
 * Toasts (2.2s), confirm dialogs and the dialog layer for a portal. Dialogs render into a layer
 * inside the portal's scoped root (.atp) so the ported portal styles apply to them.
 */
export function PortalUIProvider({ children }) {
  const [layer, setLayer] = useState(null);
  const [toastMsg, setToastMsg] = useState({ text: '', on: false });
  const [confirmState, setConfirmState] = useState(null);
  const timer = useRef();

  const toast = useCallback((text) => {
    clearTimeout(timer.current);
    setToastMsg({ text, on: true });
    timer.current = setTimeout(() => setToastMsg(t => ({ ...t, on: false })), 2200);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const confirm = useCallback((options) => new Promise(resolve => {
    setConfirmState({ ...options, resolve });
  }), []);

  const closeConfirm = (result) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  const value = useMemo(() => ({ toast, confirm, layer }), [toast, confirm, layer]);

  return (
    <PortalUIContext.Provider value={value}>
      {children}
      <div ref={setLayer} className="pt-layer" />
      <div className={`toast ${toastMsg.on ? 'on' : ''}`} role="status" aria-live="polite">{toastMsg.text}</div>
      {confirmState && (
        <Dialog open size="sm" onClose={() => closeConfirm(false)} labelledBy="confirm-title" role="alertdialog">
          <div className="mbody" style={{ textAlign: 'center', padding: '30px 24px' }}>
            <span className="mi mi-danger"><AlertTriangle className="i" aria-hidden="true" /></span>
            <h3 id="confirm-title" className="confirm-title">{confirmState.title}</h3>
            {confirmState.body && <p className="sub" style={{ marginTop: 8 }}>{confirmState.body}</p>}
            <div className="mfoot" style={{ justifyContent: 'center', marginTop: 20 }}>
              <button type="button" className="btn o" onClick={() => closeConfirm(false)}>Cancel</button>
              <button type="button" className="btn p" onClick={() => closeConfirm(true)}>{confirmState.confirmLabel || 'Confirm'}</button>
            </div>
          </div>
        </Dialog>
      )}
    </PortalUIContext.Provider>
  );
}

export const usePortalUI = () => {
  const ctx = useContext(PortalUIContext);
  if (!ctx) throw new Error('usePortalUI must be used inside PortalUIProvider');
  return ctx;
};
export const useToast = () => usePortalUI().toast;
export const useConfirm = () => usePortalUI().confirm;

/** Portal dialog (.mod/.dlg). size: '' | 'wide' | 'sm'. Esc, backdrop and focus trap from ui/Modal. */
export function Dialog({ open, onClose, size = '', labelledBy, label, className = '', role, initialFocusSelector, children }) {
  const ctx = useContext(PortalUIContext);
  return (
    <Modal
      open={open}
      onClose={onClose}
      labelledBy={labelledBy}
      label={label}
      role={role}
      overlayClassName="mod on"
      basePanelClassName={`dlg ${size}`}
      panelClassName={className}
      container={ctx?.layer || undefined}
      initialFocusSelector={initialFocusSelector}
    >
      {children}
    </Modal>
  );
}

/** Standard dialog header: icon tile, title, subtitle, close button. */
export function DialogHeader({ id, icon: Icon, title, sub, onClose, big = false, children }) {
  return (
    <div className={`mh ${big ? 'big' : ''}`}>
      {Icon && <span className="mi"><Icon className="i" aria-hidden="true" /></span>}
      {children}
      {title && (
        <div>
          <h3 id={id}>{title}</h3>
          {sub && <p className="sub">{sub}</p>}
        </div>
      )}
      <button type="button" className="ib x" aria-label="Close" onClick={onClose}><X className="i" aria-hidden="true" /></button>
    </div>
  );
}
