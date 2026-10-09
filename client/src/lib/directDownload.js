/**
 * Turns a share link into a link that downloads the file straight away.
 * Google Drive files, Docs, Sheets, Slides and Dropbox are converted; anything else is returned as it is
 * and `isDirect` tells the caller whether a straight download is expected.
 */
export function directDownload(raw) {
  let url;
  try { url = new URL(raw); } catch { return { url: raw, isDirect: false }; }
  const host = url.hostname.replace(/^www\./, '');
  const parts = url.pathname.split('/').filter(Boolean);

  if (host === 'drive.google.com') {
    const id = parts[0] === 'file' && parts[1] === 'd' ? parts[2] : (['open', 'uc'].includes(parts[0]) ? url.searchParams.get('id') : null);
    if (id) return { url: `https://drive.google.com/uc?export=download&id=${id}`, isDirect: true };
    return { url: raw, isDirect: false }; // folders can't be fetched as one file
  }

  if (host === 'docs.google.com' && parts[1] === 'd' && parts[2] && parts[2] !== 'e') {
    const base = `https://docs.google.com/${parts[0]}/d/${parts[2]}`;
    if (parts[0] === 'document') return { url: `${base}/export?format=pdf`, isDirect: true };
    if (parts[0] === 'spreadsheets') return { url: `${base}/export?format=xlsx`, isDirect: true };
    if (parts[0] === 'presentation') return { url: `${base}/export/pptx`, isDirect: true };
  }

  if (host === 'dropbox.com' || host === 'dl.dropboxusercontent.com') {
    url.searchParams.set('dl', '1');
    return { url: url.toString(), isDirect: true };
  }

  return { url: raw, isDirect: false };
}

/** Starts the download without leaving the page (the server answers with an attachment). */
export function startDownload(href) {
  const a = document.createElement('a');
  a.href = href;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
}
