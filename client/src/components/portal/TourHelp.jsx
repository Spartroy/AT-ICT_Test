import React from 'react';
import { CircleHelp, X } from 'lucide-react';

/**
 * The "?" button that replays the tour. While `hint` is on it gets a pulsing halo and a bubble asking if the
 * student needs help; the bubble can be closed without starting the tour.
 */
export default function TourHelp({ hint, onOpen, onDismiss }) {
  return (
    <span className="tour-help-wrap">
      <button
        type="button"
        className={`ib tour-help ${hint ? 'halo' : ''}`}
        aria-label="Take the portal tour"
        aria-describedby={hint ? 'tour-hint' : undefined}
        title="Take the portal tour"
        onClick={onOpen}
      >
        <CircleHelp className="i" aria-hidden="true" />
      </button>
      {hint && (
        <div className="tour-hint" id="tour-hint" role="note">
          <b>Need a hand?</b>
          <p>New here? Tap the <span aria-hidden="true">?</span> button for a one-minute tour of the portal.</p>
          <div className="tour-hint-acts">
            <button type="button" className="btn p sm" onClick={onOpen}>Show me around</button>
            <button type="button" className="tour-hint-no" onClick={onDismiss}>Not now</button>
          </div>
          <button type="button" className="tour-hint-x" aria-label="Close hint" onClick={onDismiss}><X className="i" aria-hidden="true" /></button>
        </div>
      )}
    </span>
  );
}
