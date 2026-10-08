Object.assign(IC,{doc:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',slides:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8M7 9h6M7 12h10"/>',db:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',grid:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>'});
const PCOL=['#60a5fa','#34d399','#a78bfa'],MREG={},store={get:(k,d)=>{const v=localStorage.getItem(k);return v===null?d:+v},set:(k,v)=>localStorage.setItem(k,v)};
const cols=()=>innerWidth<=700?3:4;let lastCols=cols();
/* ---- serpentine duolingo maps ---- */
function mapRender(id){const R=MREG[id],el=$('#'+id),n=cols(),prev=$$('.acc',el).map(a=>a.classList.contains('cl'));
const fc=Math.max(0,R.groups.findIndex((g,gi)=>store.get(`at-map-${id}-${gi}`,g.def)<g.items.length));
const html=R.groups.map((g,gi)=>{const done=store.get(`at-map-${id}-${gi}`,g.def);let rows='';
for(let r=0;r*n<g.items.length;r++){const part=g.items.slice(r*n,r*n+n),more=(r+1)*n<g.items.length;
rows+=`<div class="srow${r%2?' rev':''}${more?' more':''}" style="--n:${n};--k:${part.length};--c:${g.color}">`+part.map((t,k)=>{const i=r*n+k,st=i<done?'done':i===done?'cur':'open';return `<button class="node st-${st}" style="--c:${g.color}" data-m="${id}" data-g="${gi}" data-i="${i}" aria-label="${t}"><span class="nc">${ic(g.icon)}<i class="rr"></i></span><span class="nl">${t}</span></button>`}).join('')+'</div>'}
const nodes=`<div class="nodes">${rows}</div>`;if(R.magic)return nodes;
const closed=prev.length?prev[gi]:gi!==fc;
return `<div class="acc${closed?' cl':''}"><button><span class="n" style="border-color:${g.color};color:${g.color}">${g.num||ic(g.icon)}</span><span><h4>${g.title}</h4><small>${g.sub}</small></span><span class="gcount">${done}/${g.items.length}</span>${ic('down')}</button><div class="bd3"><div>${nodes}</div></div></div>`}).join('');
el.innerHTML=R.magic?`<div class="magic"><div class="mg-t">${R.magic.title}</div><p class="mg-s">✦ ${R.magic.sub} ✦</p>${html}</div>`:html}
function openNode(t){const id=t.dataset.m,gi=+t.dataset.g,i=+t.dataset.i,R=MREG[id],g=R.groups[gi],key=`at-map-${id}-${gi}`,done=store.get(key,g.def),isDone=i<done,name=g.items[i];
modal(`<button class="ib x" aria-label="Close">${ic('x')}</button><span class="chip" style="background:${g.color};color:#0b0b0c">${g.title}</span><h3 style="font-family:var(--font-body);letter-spacing:0;font-size:1.4rem;margin:14px 0 6px;padding-right:50px">${name}</h3><p class="sub">${g.kind}${isDone?' · completed ✓':''}</p><div style="display:flex;gap:10px;margin-top:22px;flex-wrap:wrap"><button class="btn p" id="nstart">${ic(g.icon)}${isDone?'Review':g.verb+' now'}</button>${isDone?'':`<button class="btn o" id="nmark">${ic('ok')}Mark as done</button>`}</div>`);
const adv=()=>{if(i>=store.get(key,g.def))store.set(key,i+1);closeM();mapRender(id)};
$('#nstart').onclick=()=>{toast(g.verb+'ing '+name+'…');isDone?closeM():adv()};const mk=$('#nmark');if(mk)mk.onclick=()=>{toast('Marked as done');adv()}}
MREG.vph={groups:PH_V.map((p,pi)=>({title:p[0],sub:p[1].length+' lessons',color:PCOL[pi],icon:'play',num:pi+1,items:p[1],def:[4,1,0][pi],verb:'Watch',kind:'Video lesson'}))};
const PROG=[['Microsoft Word','#3b82f6','doc',2],['Microsoft PowerPoint','#f97316','slides',2],['Microsoft Access','#ef4444','db',4],['Microsoft Excel','#22c55e','grid',4],['Microsoft SharePoint','#818cf8','share',4]];
MREG.vpr={groups:PROG.map((p,i)=>({title:p[0],sub:p[3]+' guides',color:p[1],icon:p[2],items:Array.from({length:p[3]},(_,k)=>'Guide '+(k+1)),def:[2,1,0,0,0][i],verb:'Watch',kind:p[0].replace('Microsoft ','')+' practical guide'}))};
MREG.vot={groups:[{title:'Valuable revisions',sub:'4 revision videos',color:'#DC9F0E',icon:'star',items:['The Grand Revision','Exam Technique','Paper 2 Shortcuts','Final Night Checklist'],def:1,verb:'Watch',kind:'Revision video'}]};
const mapAll=()=>['vph','vpr','vot'].forEach(mapRender);mapAll();
addEventListener('resize',()=>{if(cols()!==lastCols){lastCols=cols();mapAll()}});
/* ---- materials bookshelf (brand) ---- */
const MATS=[{t:'Classified',cat:'Theory',meta:'258 pages',c:'#CA133E',tc:'#fff'},{t:'Practical Files',cat:'Practical',meta:'Practical material',c:'#DC9F0E',tc:'#1a1a1a'}];
let mCat='Theory',mQ='';
function shelf(){const bs=MATS.map((m,i)=>({m,i})).filter(x=>x.m.cat===mCat&&x.m.t.toLowerCase().includes(mQ));
$('#mshelf').innerHTML=bs.length?`<div class="bshelf"><div class="books">${bs.map(({m,i})=>`<button class="spine" style="--c:${m.c};--tc:${m.tc}" data-i="${i}" aria-label="${m.t}"><span>${m.t}</span><b>AT-ICT</b></button>`).join('')}</div><div class="plank"></div></div><p class="sub" style="margin-top:12px;font-size:.85rem">Tap a book to open it.</p>`:'<p class="sub" style="padding:30px 0">Nothing here yet.</p>'}
shelf();
$('#mshelf').addEventListener('click',e=>{const s=e.target.closest('.spine');if(s)openBook(s,MATS[+s.dataset.i])});
$('#mchips').addEventListener('click',e=>{const b=e.target.closest('.ch');if(!b)return;mCat=b.firstChild.textContent.trim();shelf()});
$('#msearch').addEventListener('input',e=>{mQ=e.target.value.trim().toLowerCase();shelf()});
function openBook(sp,m){if($('#bkov'))return;
const ov=document.createElement('div');ov.id='bkov';ov.className='bk-ov';
ov.innerHTML=`<div class="fly"><div class="bwrap"><div class="book" style="--c:${m.c}"><div class="pgr"><small>${m.cat} material</small><h3>${m.t}</h3><span class="chip" style="background:${m.c};color:${m.tc}">${m.meta}</span><div class="pact"><button class="btn p" id="bview">${ic('eye')}View</button><button class="btn o" id="bclose">Close book</button></div></div><div class="cover"><div class="front"><i></i><small>AT-ICT</small><b>${m.t}</b><em>${m.meta}</em></div><div class="back"><span class="bn">${ic('book')}</span><p>${m.cat}</p></div></div></div></div></div><button class="bk-x" aria-label="Close">${ic('x')}</button>`;
document.body.appendChild(ov);document.body.style.overflow='hidden';
const fly=$('.fly',ov),book=$('.book',ov),rect=fly.getBoundingClientRect(),sr=sp.getBoundingClientRect();
const tf=r=>`translate(${r.left+r.width/2-(rect.left+rect.width/2)}px,${r.top+r.height/2-(rect.top+rect.height/2)}px) scale(${r.width/rect.width},${r.height/rect.height})`;
fly.style.transition='none';fly.style.transform=tf(sr);sp.classList.add('out');ov.offsetWidth;
requestAnimationFrame(()=>{ov.classList.add('on');fly.style.transition='transform .75s cubic-bezier(.22,1,.36,1)';fly.style.transform='none';setTimeout(()=>book.classList.add('open'),800)});
let closing=0;const esc=e=>e.key==='Escape'&&close();
function close(after){if(closing)return;closing=1;book.classList.remove('open');setTimeout(()=>{fly.style.transform=tf(sp.getBoundingClientRect());ov.classList.remove('on');setTimeout(()=>{ov.remove();sp.classList.remove('out');document.body.style.overflow='';document.removeEventListener('keydown',esc);after&&after()},750)},950)}
document.addEventListener('keydown',esc);$('.bk-x',ov).onclick=()=>close();$('#bclose').onclick=()=>close();ov.onclick=e=>{if(e.target===ov)close()};
$('#bview').onclick=()=>close(()=>modal(`<button class="ib x" aria-label="Close">${ic('x')}</button><h3 style="font-family:var(--font-body);letter-spacing:0;padding-right:50px">${m.t} <span class="chip c-th" style="margin-left:8px">${m.cat}</span></h3><div style="margin-top:18px;aspect-ratio:4/5;max-height:60vh;border-radius:16px;background:linear-gradient(160deg,#1a1a1a,#3a1a1a);border:3px solid var(--cr);display:grid;place-items:center;text-align:center"><div><h2 style="font-family:var(--font-display);font-size:2.6rem"><span style="color:#f2365f">${m.t[0]}</span>${m.t.slice(1)}</h2><p class="sub">${m.meta}</p></div></div>`))}
/* ---- interactive notes: orbit ---- */
const RK='at-notes-read',readSet=()=>new Set(JSON.parse(localStorage.getItem(RK)||'["CH 1 Computer Structure"]'));
let curPh=0,selCh=null;
const chInfo=t=>{const m=t.match(/^CH\s*(\d+)\s*(.*)$/);return{num:m?m[1]:'',title:m?m[2]:t}};
const twoLines=s=>{const w=s.split(' ');if(w.length<2)return[s];let b=1,bd=1e9;for(let i=1;i<w.length;i++){const d=Math.abs(w.slice(0,i).join(' ').length-w.slice(i).join(' ').length);if(d<bd){bd=d;b=i}}return[w.slice(0,b).join(' '),w.slice(b).join(' ')]};
function orbit(anim){const el=$('#nph'),rd=readSet(),P=PH_N[curPh],items=P[1],c=PCOL[curPh],R=items.length>5?128:112,rn=items.filter(t=>rd.has(t)).length;
if(!items.includes(selCh))selCh=items.find(t=>!rd.has(t))||items[0];
const pre=anim?' pre':'',CL=2*Math.PI*54;let lines='',orbs='';
items.forEach((t,i)=>{const a=-Math.PI/2+i*2*Math.PI/items.length,x=Math.round(R*Math.cos(a)),y=Math.round(R*Math.sin(a)),I=chInfo(t),L=twoLines(I.title);
lines+=`<line class="ol${pre}" x1="0" y1="0" x2="${x}" y2="${y}" style="--d:${(i*.07).toFixed(2)}s"/>`;
orbs+=`<g class="orb${pre}${rd.has(t)?' rd':''}${t===selCh?' sel':''}" data-t="${t}" style="--x:${x}px;--y:${y}px;--d:${(.15+i*.07).toFixed(2)}s" tabindex="0" role="button" aria-label="${t}"><circle r="36"/><text class="on" y="-15">${I.num}</text>${L.map((s,k)=>`<text class="ot" y="${(L.length===2?-1:5)+k*11}">${s}</text>`).join('')}<g class="ck"><circle cx="27" cy="-27" r="10"/><path d="m22 -27 4 4 7-8"/></g></g>`});
const sI=chInfo(selCh),sRead=rd.has(selCh);
el.innerHTML=`<div class="seg" id="oseg">${PH_N.map((p,i)=>`<button data-ph="${i}" class="${i===curPh?'on':''}">${p[0]}<em class="oc">${p[1].filter(t=>rd.has(t)).length}/${p[1].length}</em></button>`).join('')}</div><div class="orbit"><div class="ostage"><svg viewBox="-200 -185 400 370" style="--pc:${c}" role="group" aria-label="${P[0]} chapters"><circle class="orbring" r="${R}"/>${lines}<g class="hub"><circle class="h" r="46"/><circle class="hr" r="54"/><circle class="hp" r="54" stroke-dasharray="${CL}" stroke-dashoffset="${CL*(1-rn/items.length)}"/><text y="-2" style="font-weight:700;font-size:13px">${P[0]}</text><text y="14" style="font-size:10px">${rn}/${items.length} read</text></g>${orbs}</svg></div>
<aside class="odet card"><div class="onum">Chapter ${sI.num}</div><h3 style="font-family:var(--font-display);font-size:1.7rem;letter-spacing:-.01em;margin:4px 0 8px">${sI.title}</h3><p class="sub">Interactive notes · ${sRead?'<b class="ok">Read ✓</b>':'Not read yet'}</p><div class="oact"><button class="btn p" id="oopen">${ic('book')}Open notes</button><button class="btn o" id="oread">${sRead?'Mark as unread':'Mark as read'}</button></div></aside></div>`;
if(anim)requestAnimationFrame(()=>requestAnimationFrame(()=>$$('.pre',el).forEach(e=>e.classList.remove('pre'))))}
orbit(true);
$('#nph').addEventListener('click',e=>{const o=e.target.closest('.orb'),s=e.target.closest('#oseg button');
if(o){selCh=o.dataset.t;orbit(false)}else if(s){curPh=+s.dataset.ph;selCh=null;orbit(true)}
else if(e.target.closest('#oopen'))toast('Opening '+chInfo(selCh).title+' notes…');
else if(e.target.closest('#oread')){const r=readSet();r.has(selCh)?r.delete(selCh):r.add(selCh);localStorage.setItem(RK,JSON.stringify([...r]));orbit(false);toast(r.has(selCh)?'Marked as read':'Marked as unread')}});
$('#nph').addEventListener('keydown',e=>{const o=e.target.closest('.orb');if(o&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selCh=o.dataset.t;orbit(false);$(`.orb[data-t="${selCh}"]`).focus()}});
