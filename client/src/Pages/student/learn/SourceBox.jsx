import React, { useState } from 'react';
import { API_ENDPOINTS } from '../../../config/api';
import { downloadFile } from '../../../lib/api';
import { usePortalUI } from '../../../components/portal/PortalUI';

/**
 * A cardboard box of practical source files. Hover or focus lifts the lid and files pop up;
 * clicking downloads the uploaded file, or opens the download link the teacher added.
 */
export default function SourceBox({ m }) {
  const { toast } = usePortalUI();
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (m.fileName) {
      setBusy(true);
      try {
        await downloadFile(`${API_ENDPOINTS.STUDENT.MATERIALS}/${m._id}/download`, m.fileName);
      } catch {
        toast("Couldn't download these files. Please try again.");
      } finally {
        setBusy(false);
      }
    } else if (m.externalUrl) {
      window.open(m.externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast('The download link for these files is coming soon.');
    }
  };

  return (
    <div className="sbox-wrap">
      <button type="button" className="sbox" onClick={go} disabled={busy} aria-label={`${m.title}, practical source files, download`}>
        <span className="sb-shadow" aria-hidden="true" />
        <span className="sb-in" aria-hidden="true" />
        <span className="sb-files" aria-hidden="true">
          <i className="sb-f f-xl" style={{ '--i': 0, '--r': '-7deg', '--x': '58px' }}><u /></i>
          <i className="sb-f f-wd" style={{ '--i': 1, '--r': '2deg', '--x': '96px' }}><u /></i>
          <i className="sb-f f-pp" style={{ '--i': 2, '--r': '9deg', '--x': '134px' }}><u /></i>
        </span>
        <span className="sb-front">
          <span className="sb-handle" />
          <span className="sb-label"><b>{m.title}</b></span>
          <s className="rv r1" /><s className="rv r2" /><s className="rv r3" /><s className="rv r4" />
        </span>
        <span className="sb-side" aria-hidden="true" />
        <span className="sb-lid" aria-hidden="true">
          <span className="sb-top" />
          <span className="sb-lip" />
          <span className="sb-lipside" />
        </span>
      </button>
      <span className="sb-cap">{busy ? 'Downloading…' : m.fileName ? 'Tap to download' : 'Tap to open the files'}</span>
    </div>
  );
}
