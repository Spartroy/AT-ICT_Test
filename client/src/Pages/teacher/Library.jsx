import React, { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Play, Library as LibIcon, Folder, LayoutGrid, Star, Plus, Search, Pencil, Trash2, Link2, Trophy, MessageSquare, Download } from 'lucide-react';
import useApi from '../../hooks/useApi';
import useMediaQuery from '../../hooks/useMediaQuery';
import { api, downloadFile } from '../../lib/api';
import { API_ENDPOINTS } from '../../config/api';
import { Empty, ErrorNote, Ic, Loading, PageHead, SearchBox, Seg, fmtDate, initials } from '../../components/portal/kit';
import { useConfirm, useToast } from '../../components/portal/PortalUI';
import { useTeacher } from './TeacherPortal';
import { apiError, useTeacherChange } from './modals/form';
import { programLabel } from './curriculum';
import { buildTree, inPath, highlight, sortByPath } from './libraryTree';

const TYPE_LABEL = { theory: 'Theory', practical: 'Practical', other: 'Other' };

// Each tab: how to load it, turn records into { id, title, path[], meta, raw }, and which modal edits it.
const TABS = [
  {
    id: 'videos', label: 'Videos', icon: Play, add: 'video', kind: 'video', url: `${API_ENDPOINTS.TEACHER.VIDEOS}?limit=1000`,
    select: b => b.data?.videos || [],
    toItem: v => ({
      id: v._id, title: v.title, raw: v,
      path: v.type === 'theory' ? ['Theory', `Phase ${v.phase}`, `Chapter ${v.chapter}`] : v.type === 'practical' ? ['Practical', programLabel(v.program)] : ['Other'],
      meta: [v.type === 'practical' && (v.contentType === 'task' ? 'Task' : 'Guide'), v.order ? `Order ${v.order}` : null, v.accessLevel && v.accessLevel !== 'all' ? v.accessLevel : null].filter(Boolean).join(' · ')
    }),
    remove: id => api.del(`${API_ENDPOINTS.TEACHER.VIDEOS}/${id}`)
  },
  {
    id: 'notes', label: 'Interactive notes', icon: LibIcon, add: 'note', kind: 'note', url: `${API_ENDPOINTS.TEACHER.NOTES}?limit=1000`,
    select: b => b.data?.notes || [],
    toItem: n => ({ id: n._id, title: n.title, raw: n, path: [`Phase ${n.phase}`], meta: n.order ? `Order ${n.order}` : '', link: n.linkUrl }),
    remove: id => api.del(`${API_ENDPOINTS.TEACHER.NOTES}/${id}`)
  },
  {
    id: 'materials', label: 'Materials', icon: Folder, add: 'material', kind: 'material', url: API_ENDPOINTS.TEACHER.MATERIALS,
    select: b => b.data?.materials || [],
    toItem: m => ({ id: m._id, title: m.title, raw: m, path: [TYPE_LABEL[m.type] || 'Other'], meta: `${m.downloadCount || 0} downloads · ${fmtDate(m.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}` }),
    remove: id => api.del(`${API_ENDPOINTS.TEACHER.MATERIALS}/${id}`)
  },
  {
    id: 'flashcards', label: 'Flashcards', icon: LayoutGrid, add: 'flashcard', kind: 'flashcard', url: API_ENDPOINTS.FLASHCARDS,
    select: b => b.data || [],
    toItem: s => ({ id: s._id, title: s.title, raw: s, path: [s.isTeacherStack ? 'Teacher stacks' : 'Student stacks'], meta: `${s.totalCards || s.cards?.length || 0} cards · by ${s.creatorName || 'student'}` }),
    remove: id => api.del(`${API_ENDPOINTS.FLASHCARDS}/${id}`)
  },
  { id: 'site', label: 'Website content', icon: Star, add: null }
];

export default function Library() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { base, openModal } = useTeacher();
  const current = TABS.find(t => t.id === tab);
  if (!current) return <Navigate to={`${base}/library/videos`} replace />;
  const addLabel = { videos: 'video', notes: 'note', materials: 'material', flashcards: 'stack' }[tab];

  return (
    <>
      <PageHead
        title="Library"
        actions={current.add && <button type="button" className="btn p" onClick={() => openModal(current.add)}><Ic as={Plus} />Add {addLabel}</button>}
      />
      <Seg tabs={TABS.map(t => ({ id: t.id, label: t.label, icon: t.icon }))} value={tab} onChange={id => navigate(`${base}/library/${id}`)} label="Library sections" />
      {tab === 'site' ? <SiteContent /> : <LibraryList key={tab} config={current} />}
    </>
  );
}

function LibraryList({ config }) {
  const { openModal } = useTeacher();
  const toast = useToast();
  const confirm = useConfirm();
  const wide = useMediaQuery('(min-width: 901px)');
  const res = useApi(config.url, config.select);
  useTeacherChange(config.kind, res.reload);
  const [path, setPath] = useState([]);
  const [q, setQ] = useState('');

  const items = useMemo(() => sortByPath((res.data || []).map(config.toItem)), [res.data, config]);
  const tree = useMemo(() => buildTree(items, path), [items, path]);
  const query = q.trim().toLowerCase();
  const shown = items.filter(it => inPath(it.path, path) && (!query || `${it.title} ${it.path.join(' ')}`.toLowerCase().includes(query)));

  if (res.loading && !res.data) return <Loading label={`Loading ${config.label.toLowerCase()}…`} />;
  if (res.error) return <ErrorNote error={res.error} onRetry={res.reload} />;

  const remove = async (it) => {
    if (!(await confirm({ title: `Delete “${it.title}”?`, confirmLabel: 'Delete' }))) return;
    try {
      await config.remove(it.id);
      toast('Deleted');
      res.reload();
    } catch (err) {
      toast(apiError(err));
    }
  };

  const edit = (it) => openModal(config.add, { [{ video: 'video', note: 'note', material: 'material', flashcard: 'stack' }[config.add]]: it.raw });
  const ItemIcon = config.icon;

  return (
    <div className="lib">
      <details className="treebox card" open={wide}>
        <summary><Ic as={Folder} />Browse by phase / chapter</summary>
        <div role="tree" aria-label={`${config.label} folders`}>
          <button type="button" role="treeitem" aria-selected={!path.length} className={`tn l0 ${path.length ? '' : 'on'}`} onClick={() => setPath([])}>
            <span>All {config.label.toLowerCase()}</span><em>{items.length}</em>
          </button>
          {tree.map(n => (
            <button type="button" role="treeitem" aria-selected={n.selected} key={n.key} className={`tn l${n.level} ${n.selected ? 'on' : ''}`} onClick={() => setPath(n.path)}>
              <span>{n.label}</span><em>{n.count}</em>
            </button>
          ))}
        </div>
      </details>
      <div>
        <div className="fbar">
          <SearchBox value={q} onChange={setQ} placeholder={`Search ${config.label.toLowerCase()}…`} style={{ margin: 0, flex: 1 }} />
          <span className="sub" aria-live="polite">{shown.length} of {items.length}</span>
        </div>
        <div className="card" style={{ padding: 8 }}>
          {!shown.length && <Empty icon={Search}>Nothing here. Try clearing the search or picking another folder.</Empty>}
          {shown.map(it => (
            <div className="lrow" key={it.id}>
              <span className="lic"><Ic as={ItemIcon} /></span>
              <div className="lmain">
                <b dangerouslySetInnerHTML={{ __html: highlight(it.title, query) }} />
                <small>{it.path.join(' › ')}{it.meta ? ` · ${it.meta}` : ''}</small>
              </div>
              {config.id === 'notes' && (it.link ? <span className="url"><Ic as={Link2} />prezi.com</span> : <span className="chip c-am">No link yet</span>)}
              {config.id === 'materials' && it.raw.fileName && (
                <button type="button" className="ib sm" aria-label={`Download ${it.title}`} onClick={() => downloadFile(`${API_ENDPOINTS.TEACHER.MATERIALS}/${it.id}/download`, it.raw.fileName).catch(() => toast("Couldn't download"))}><Ic as={Download} /></button>
              )}
              <div className="lact">
                <button type="button" className="ib sm" aria-label={`Edit ${it.title}`} onClick={() => edit(it)}><Ic as={Pencil} /></button>
                <button type="button" className="ib sm dng" aria-label={`Delete ${it.title}`} onClick={() => remove(it)}><Ic as={Trash2} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SiteContent() {
  const toast = useToast();
  const confirm = useConfirm();
  const hof = useApi(API_ENDPOINTS.LEADERBOARD.HALL_OF_FAME, b => b.data?.entries || b.data?.hallOfFame || b.data || []);
  const stories = useApi(API_ENDPOINTS.LEADERBOARD.STORIES, b => b.data?.stories || b.data || []);
  const [h, setH] = useState({ name: '', year: '' });
  const [st, setSt] = useState({ name: '', country: '', text: '' });

  const addHof = async (e) => {
    e.preventDefault();
    if (!h.name.trim()) return toast('Enter a name');
    try {
      await api.post(API_ENDPOINTS.TEACHER.HALL_OF_FAME, { name: h.name.trim(), year: h.year.trim() || undefined });
      setH({ name: '', year: '' });
      hof.reload();
      toast('Added to Hall of Fame');
    } catch (err) { toast(apiError(err)); }
  };
  const addStory = async (e) => {
    e.preventDefault();
    if (!st.name.trim() || !st.text.trim()) return toast('Enter a name and the story');
    try {
      await api.post(API_ENDPOINTS.TEACHER.STORIES, { name: st.name.trim(), country: st.country.trim() || undefined, text: st.text.trim() });
      setSt({ name: '', country: '', text: '' });
      stories.reload();
      toast('Story added');
    } catch (err) { toast(apiError(err)); }
  };
  const del = async (kind, item) => {
    if (!(await confirm({ title: `Delete ${item.name}?`, confirmLabel: 'Delete' }))) return;
    try {
      await api.del(kind === 'hof' ? API_ENDPOINTS.TEACHER.HALL_OF_FAME_BY_ID(item._id) : API_ENDPOINTS.TEACHER.STORY_BY_ID(item._id));
      (kind === 'hof' ? hof : stories).reload();
    } catch (err) { toast(apiError(err)); }
  };

  const hofList = Array.isArray(hof.data) ? hof.data : [];
  const storyList = Array.isArray(stories.data) ? stories.data : [];

  return (
    <div className="g2e">
      <div className="card">
        <h3><Ic as={Trophy} />Hall of Fame<span className="chip c-gy" style={{ marginLeft: 6 }}>{hofList.length}</span></h3>
        <form className="inl" onSubmit={addHof}>
          <input className="inp" value={h.name} onChange={e => setH(x => ({ ...x, name: e.target.value }))} placeholder="Student name" aria-label="Student name" required />
          <input className="inp" value={h.year} onChange={e => setH(x => ({ ...x, year: e.target.value }))} placeholder="Year (e.g. 2026)" aria-label="Year" />
          <button className="btn p sm">Add</button>
        </form>
        {hofList.map(x => (
          <div className="lrow" key={x._id}>
            <span className="av" style={{ width: 36, height: 36, fontSize: '.75rem' }} aria-hidden="true">{initials(x.name)}</span>
            <div className="lmain"><b>{x.name}</b><small>{x.year ? `Class of ${x.year}` : '—'}</small></div>
            <div className="lact"><button type="button" className="ib sm dng" aria-label={`Delete ${x.name}`} onClick={() => del('hof', x)}><Ic as={Trash2} /></button></div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3><Ic as={MessageSquare} />Student stories<span className="chip c-gy" style={{ marginLeft: 6 }}>{storyList.length}</span></h3>
        <form className="inl col" onSubmit={addStory}>
          <input className="inp" value={st.name} onChange={e => setSt(x => ({ ...x, name: e.target.value }))} placeholder="Student name" aria-label="Student name" required />
          <input className="inp" value={st.country} onChange={e => setSt(x => ({ ...x, country: e.target.value }))} placeholder="Country" aria-label="Country" />
          <textarea className="inp" rows={3} value={st.text} onChange={e => setSt(x => ({ ...x, text: e.target.value }))} placeholder="Story text" aria-label="Story" required />
          <button className="btn p sm" style={{ justifySelf: 'start' }}>Add</button>
        </form>
        {storyList.map(x => (
          <div className="lrow" style={{ alignItems: 'flex-start' }} key={x._id}>
            <span className="av" style={{ width: 36, height: 36, fontSize: '.75rem' }} aria-hidden="true">{initials(x.name)}</span>
            <div className="lmain"><b>{x.name} <small style={{ fontWeight: 400 }}>{x.country}</small></b><small className="wrap">{x.text}</small></div>
            <div className="lact"><button type="button" className="ib sm dng" aria-label={`Delete story by ${x.name}`} onClick={() => del('story', x)}><Ic as={Trash2} /></button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
