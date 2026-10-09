import React from 'react';
import { FileText, Paperclip } from 'lucide-react';
import logoCircle from '../../../assets/brand/logo-circle.png';
import { sizeTier } from './bookDesign';

/**
 * A revision sheet: a crimson folder with loose sheets peeking out. Hover or focus slides the sheets up;
 * clicking opens it in the in-page reader.
 */
export default function RevSheet({ m, onOpen }) {
  return (
    <button type="button" className={`rsh tier-${sizeTier(m.title)}`} onClick={() => onOpen(m)} aria-label={`${m.title}, revision sheet, open`}>
      <span className="rs-shadow" aria-hidden="true" />
      <span className="rs-back" aria-hidden="true"><span className="rs-tab">Rev sheet</span></span>
      <span className="rs-paper p1" aria-hidden="true" />
      <span className="rs-paper p2" aria-hidden="true" />
      <span className="rs-front">
        <img className="rs-logo" src={logoCircle} alt="" />
        <span className="rs-title">{m.title}</span>
        <FileText className="rs-icon" aria-hidden="true" />
        {m.sourceUrl && <Paperclip className="rs-clip" aria-label="Includes source files" />}
      </span>
    </button>
  );
}
