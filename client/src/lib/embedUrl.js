/**
 * Turns a "share" link into the address that works inside an iframe.
 * Google Drive / Docs share pages show "You need access" when framed; their /preview pages don't.
 * Anything else is returned unchanged.
 */
export function toEmbedUrl(raw) {
  let url;
  try { url = new URL(raw); } catch { return raw; }
  const host = url.hostname.replace(/^www\./, '');
  const parts = url.pathname.split('/').filter(Boolean);

  if (host === 'drive.google.com') {
    if (parts[0] === 'file' && parts[1] === 'd' && parts[2]) return `https://drive.google.com/file/d/${parts[2]}/preview`;
    if ((parts[0] === 'open' || parts[0] === 'uc') && url.searchParams.get('id')) return `https://drive.google.com/file/d/${url.searchParams.get('id')}/preview`;
    const folder = parts.indexOf('folders');
    if (folder !== -1 && parts[folder + 1]) return `https://drive.google.com/embeddedfolderview?id=${parts[folder + 1]}#list`;
  }

  if (host === 'docs.google.com' && ['document', 'spreadsheets', 'presentation'].includes(parts[0]) && parts[1] === 'd' && parts[2] && parts[2] !== 'e') {
    return `https://docs.google.com/${parts[0]}/d/${parts[2]}/preview`;
  }

  if (host === 'youtube.com' || host === 'm.youtube.com') {
    const id = parts[0] === 'watch' ? url.searchParams.get('v') : ['shorts', 'live'].includes(parts[0]) ? parts[1] : null;
    if (id) return `https://www.youtube.com/embed/${id}`;
  }
  if (host === 'youtu.be' && parts[0]) return `https://www.youtube.com/embed/${parts[0]}`;

  return raw;
}
