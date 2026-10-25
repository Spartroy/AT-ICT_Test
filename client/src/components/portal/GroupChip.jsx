import React from 'react';
import { groupColor } from '../../lib/groups';
import '../../styles/groups.css';

/** Small coloured pill: "GRP A". Renders nothing without a group. */
export default function GroupChip({ code, name, className = '' }) {
  if (!code) return null;
  return (
    <span className={`gchip ${className}`} style={{ '--gc': groupColor(code) }} title={name || `GRP ${code}`}>
      <i aria-hidden="true" />{name || `GRP ${code}`}
    </span>
  );
}
