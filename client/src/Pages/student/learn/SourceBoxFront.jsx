import React from 'react';
import { useSourceDownload } from './SourceBox';
import logoCircle from '../../../assets/brand/logo-circle.png';

/**
 * Front view of a box of source files (no perspective), made to sit on a hanging shelf under the books.
 * Hover or focus lifts the lid and the files peek out; clicking downloads them.
 */
export default function SourceBoxFront({ m, label }) {
  const { go, busy } = useSourceDownload(m);
  return (
    <button type="button" className="fbox" onClick={go} disabled={busy} aria-label={`${label || m.title}, source files, download`}>
      <span className="fb-files" aria-hidden="true">
        <i className="f-xl" /><i className="f-wd" /><i className="f-pp" />
      </span>
      <span className="fb-body">
        <img className="fb-logo" src={logoCircle} alt="" />
        <span className="fb-handle" />
        <span className="fb-label"><em>AT-ICT</em><b>{label || m.title}</b></span>
        <s className="fb-rv r1" /><s className="fb-rv r2" /><s className="fb-rv r3" /><s className="fb-rv r4" />
      </span>
      <span className="fb-lid" aria-hidden="true" />
    </button>
  );
}
