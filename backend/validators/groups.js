// Teaching groups ("GRP A", "GRP B", …): definitions, the alphabetical split, and the live-class link rules.
// Kept as plain functions (no database) so they can be unit-tested.
const crypto = require('crypto');

const MAX_GROUPS = 26;
const CODE = /^[A-Z0-9]{1,6}$/;
const LIVE_MODES = ['manual', 'preset', 'auto'];

const DEFAULTS = Object.freeze({
  groups: [],
  // How a new live class gets its meeting link: typed each time, one saved link, or a fresh room per class.
  live: { mode: 'manual', url: '' },
  // New approved students join the smallest group on their own.
  autoAssign: true
});

/** "A", "B", … "Z" for the first 26 groups. */
const codeAt = (i) => String.fromCharCode(65 + i);

/** Label shown to people: "GRP A". */
const labelOf = (group) => (group?.name || (group?.code ? `GRP ${group.code}` : ''));

const isHttp = (value) => {
  try {
    return ['http:', 'https:'].includes(new URL(String(value)).protocol);
  } catch {
    return false;
  }
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** Stored config with defaults for anything missing. */
const withDefaults = (stored) => {
  const s = isObj(stored) ? stored : {};
  return {
    groups: Array.isArray(s.groups) ? s.groups.map(g => ({ code: g.code, name: g.name || `GRP ${g.code}`, meetingUrl: g.meetingUrl || '' })) : [],
    live: { ...DEFAULTS.live, ...(isObj(s.live) ? s.live : {}) },
    autoAssign: s.autoAssign === undefined ? DEFAULTS.autoAssign : !!s.autoAssign
  };
};

/**
 * Merges an update into the stored config and validates it. `memberCounts` is { CODE: n } so a group that
 * still has students can't be removed. Returns { value, errors }.
 */
const normalize = (input, current, memberCounts = {}) => {
  const errors = [];
  const next = withDefaults(current);
  const body = isObj(input) ? input : {};

  if ('groups' in body) {
    if (!Array.isArray(body.groups) || body.groups.length > MAX_GROUPS) {
      errors.push({ path: 'groups', msg: `You can have up to ${MAX_GROUPS} groups` });
    } else {
      const seen = new Set();
      const groups = body.groups.map((g, i) => {
        const code = String(g?.code ?? '').trim().toUpperCase();
        const name = String(g?.name ?? '').trim() || `GRP ${code}`;
        const meetingUrl = String(g?.meetingUrl ?? '').trim();
        if (!CODE.test(code)) errors.push({ path: `groups.${i}.code`, msg: 'A group code is 1-6 letters or numbers, e.g. A' });
        if (seen.has(code)) errors.push({ path: `groups.${i}.code`, msg: `Group ${code} appears twice` });
        seen.add(code);
        if (name.length > 30) errors.push({ path: `groups.${i}.name`, msg: 'Group names can be up to 30 characters' });
        if (meetingUrl && (!isHttp(meetingUrl) || meetingUrl.length > 600)) errors.push({ path: `groups.${i}.meetingUrl`, msg: 'The meeting link must start with https://' });
        return { code, name, meetingUrl };
      });
      const removed = next.groups.map(g => g.code).filter(c => !seen.has(c) && memberCounts[c] > 0);
      if (removed.length) errors.push({ path: 'groups', msg: `Move the students out of ${removed.map(c => `GRP ${c}`).join(', ')} before removing ${removed.length === 1 ? 'it' : 'them'}`, code: 'GROUP_NOT_EMPTY', groups: removed });
      next.groups = groups;
    }
  }

  if ('live' in body) {
    const live = isObj(body.live) ? body.live : {};
    const mode = LIVE_MODES.includes(live.mode) ? live.mode : null;
    const url = String(live.url ?? '').trim();
    if (!mode) errors.push({ path: 'live.mode', msg: 'Choose how live-class links are made' });
    if (url && (!isHttp(url) || url.length > 600)) errors.push({ path: 'live.url', msg: 'The saved link must start with https://' });
    if (mode === 'preset' && !url && !next.groups.some(g => g.meetingUrl)) {
      errors.push({ path: 'live.url', msg: 'Paste the meeting link to reuse (or give a group its own link)' });
    }
    next.live = { mode: mode || next.live.mode, url };
  }

  if ('autoAssign' in body) next.autoAssign = body.autoAssign === true || body.autoAssign === 'true';

  return { value: next, errors };
};

/**
 * Splits students alphabetically (first name, then last name) into `count` consecutive groups of near-equal size:
 * 10 students into 3 groups → 4, 3, 3. Returns an array of arrays (some may be empty when count > students).
 */
const splitAlphabetical = (students, count) => {
  const n = Math.max(1, Math.min(MAX_GROUPS, Math.floor(Number(count) || 1)));
  const sorted = [...students].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, undefined, { sensitivity: 'base' }));
  const base = Math.floor(sorted.length / n);
  const extra = sorted.length % n;
  const out = [];
  let at = 0;
  for (let i = 0; i < n; i++) {
    const size = base + (i < extra ? 1 : 0);
    out.push(sorted.slice(at, at + size));
    at += size;
  }
  return out;
};

/** The code of the group with the fewest students (the first one on a tie), or null when there are no groups. */
const smallestGroup = (groups, memberCounts) => {
  let best = null;
  groups.forEach((g) => {
    if (best === null || (memberCounts[g.code] || 0) < (memberCounts[best] || 0)) best = g.code;
  });
  return best;
};

/** A fresh, hard-to-guess video room that needs no account to create: https://meet.jit.si/ATICT-A-3f9c2b7e1a */
const autoRoomUrl = (groupCodes = [], random = crypto.randomBytes(5).toString('hex')) => {
  const tag = groupCodes.length === 1 ? groupCodes[0] : 'ALL';
  return `https://meet.jit.si/ATICT-${tag}-${random}`;
};

/**
 * Picks the meeting link for a live class.
 *   manual: the link typed in the form.
 *   preset: the chosen group's own link when it has one, otherwise the saved default link.
 *   auto:   a brand-new room for this class.
 * Returns { url } or { error }.
 */
const resolveLiveLink = ({ mode, manualUrl, groupCodes = [], config, random }) => {
  const cfg = withDefaults(config);
  if (mode === 'auto') return { url: autoRoomUrl(groupCodes, random) };
  if (mode === 'preset') {
    const single = groupCodes.length === 1 ? cfg.groups.find(g => g.code === groupCodes[0]) : null;
    const url = single?.meetingUrl || cfg.live.url || cfg.groups.find(g => groupCodes.includes(g.code) && g.meetingUrl)?.meetingUrl || '';
    return url ? { url } : { error: 'No saved meeting link yet. Add one in Students › Groups.' };
  }
  const url = String(manualUrl || '').trim();
  return isHttp(url) ? { url } : { error: 'Paste the meeting link (Zoom, Google Meet…) starting with https://' };
};

module.exports = { MAX_GROUPS, LIVE_MODES, DEFAULTS, codeAt, labelOf, withDefaults, normalize, splitAlphabetical, smallestGroup, autoRoomUrl, resolveLiveLink };
