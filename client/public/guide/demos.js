/* AT-ICT guide sims: <compiler-demo>, <linker-demo>, <keyboard-demo> */
(function(){
const BASE=`
:host{display:block;width:100%;font-family:var(--font-body,'Poppins',system-ui,sans-serif);color:#1A1A1A;container-type:inline-size}
*{box-sizing:border-box}
.wrap{background:#FDF5F6;border-radius:20px;padding:18px 12px 16px;outline:none}
.def{text-align:center;font-size:15px;line-height:1.6;color:#1A1A1A;margin:0 6px 14px}
.def b{font-weight:700}.def .gy{color:#6B6B73}.def .r{color:#CA133E}.def .gr{color:#059669}
.row{display:flex;align-items:stretch;justify-content:center}
.card{background:#fff;border:2px solid #CA133E;border-radius:16px;padding:12px 10px;box-shadow:0 4px 10px rgba(202,19,62,.1);text-align:center;display:flex;flex-direction:column;align-items:center;min-width:0}
.h{font-weight:700;font-size:15px;line-height:1.3}
.d{font-size:13px;color:#6B6B73;line-height:1.4;margin-top:2px}
.arrow{flex:0 0 44px;position:relative;display:flex;align-items:center;justify-content:center;color:#CA133E}
.arrow .ln{position:absolute;left:4px;right:4px;top:50%;height:2px;margin-top:-1px;background:repeating-linear-gradient(90deg,#F58AA0 0 6px,transparent 6px 10px)}
.arrow .hd{position:absolute;right:0;top:50%;transform:translateY(-52%);font-size:20px;font-weight:700;line-height:1}
.pane{background:linear-gradient(135deg,#1a1a1a,#3a1a1a);border-radius:10px;color:#fff;text-align:left;width:100%;box-shadow:inset 0 0 12px rgba(0,0,0,.5)}
.mono{font-family:ui-monospace,Menlo,Consolas,'Courier New',monospace}
.chip{display:inline-block;margin-top:8px;font-weight:700;font-size:12px;padding:3px 10px;border-radius:999px;font-family:'JumperSafe','Poppins',sans-serif}
.chip.r{background:#FDE8EC;color:#CA133E}.chip.g{background:#D1FAE5;color:#059669}
.act{display:flex;justify-content:center;margin-top:14px}
button.re{font-family:'JumperSafe','Poppins',sans-serif;font-weight:700;font-size:14px;color:#fff;background:#CA133E;border:0;border-radius:999px;padding:8px 18px;cursor:pointer;box-shadow:0 3px 0 #A01030}
button.re:active{transform:translateY(2px);box-shadow:none}
button:focus-visible{outline:3px solid #DC9F0E;outline-offset:2px}
.noanim *{animation:none!important;transition:none!important}
@media print{button.re{display:none}}
`;
const CTL_CSS=`
.ctl{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center}
.ctl button{font-family:'JumperSafe','Poppins',sans-serif;font-weight:700;font-size:14px;border-radius:999px;padding:8px 16px;cursor:pointer;border:2px solid #CA133E;background:#fff;color:#CA133E;box-shadow:none}
.ctl button.pri{background:#CA133E;color:#fff;box-shadow:0 3px 0 #A01030;font-size:15px;padding:9px 22px}
.ctl button:active{transform:translateY(2px);box-shadow:none}
.ctl button:disabled{opacity:.4;cursor:default}
.stx{text-align:center;font-size:13px;color:#44444B;margin-top:8px;min-height:19px}.stx b{color:#CA133E}
.ffm *{animation:none!important;transition:none!important}
[hidden]{display:none!important}
@media print{.ctl,.stx{display:none}}`;
const CTL_HTML=`<div class="ctl"><button type="button" id="bk">◀ Back</button><button type="button" class="pri" id="nx">Next step ▶</button><button type="button" id="pa">⏩ Play all</button><button type="button" id="rs">↺ Restart</button></div><div class="stx" id="stx"></div>`;
const DUAL_HTML=`<div id="ca" class="ctl"><button type="button" class="pri" id="rp">▶ Replay</button><button type="button" id="tg">⏯ Step by step</button></div><div id="cs" hidden><div class="ctl"><button type="button" id="bk">◀ Back</button><button type="button" class="pri" id="nx">Next step ▶</button><button type="button" id="pa">⏩ Play all</button><button type="button" id="rs">↺ Restart</button><button type="button" id="tg2">▶ Autoplay</button></div><div class="stx" id="stx"></div></div>`;
class Sim extends HTMLElement{
  get stepper(){return true;}
  get auto(){return false;}
  get dual(){return false;}
  setSm(v){this.sm=v;this.$('ca').hidden=v;this.$('cs').hidden=!v;this.r.querySelectorAll('#steps li').forEach(l=>l.style.cursor=v?'pointer':'');this.begin();this.ui();}
  fly(el,p,ms,rev){const L=p.getTotalLength();const set=k=>{const q=p.getPointAtLength((rev?1-k:k)*L);el.setAttribute('transform',`translate(${q.x} ${q.y})`);};el.style.opacity=1;if(this.ffm||this.skip||ms<=0){set(1);return;}set(0);const t0=performance.now(),tk={id:0};this.fl.push(tk);const f=t=>{const k=Math.min(1,(t-t0)/ms);set(k);if(k<1)tk.id=requestAnimationFrame(f);};tk.id=requestAnimationFrame(f);}
  get noBase(){return false;}
  meta(){return {n:1,labels:[]};}
  constructor(){super();this.sm=false;this.fl=[];this.q=[];this.cur=0;this.vt=0;this.seq=0;this.gc=0;this.pass=0;this.k=0;this.waiting=0;this.running=false;this.skip=false;this.autoAll=false;this.ffm=false;this.tm=0;this.t=[];
    this.r=this.attachShadow({mode:'open'});
    this.r.innerHTML='<style>'+(this.noBase?'':BASE)+CTL_CSS+this.css()+'</style>'+this.html();
    this.$=id=>this.r.getElementById(id);this.root=this.$('root');
    const re=this.$('re');
    if(re){if(this.dual){const d=document.createElement('div');d.innerHTML=DUAL_HTML;re.parentNode.replaceChild(d,re);
        this.$('rp').onclick=()=>this.begin();this.$('tg').onclick=()=>this.setSm(true);this.$('tg2').onclick=()=>this.setSm(false);
        this.$('bk').onclick=()=>this.back();this.$('nx').onclick=()=>this.next();this.$('pa').onclick=()=>this.playAll();this.$('rs').onclick=()=>this.begin();}
      else if(this.stepper){const d=document.createElement('div');d.innerHTML=CTL_HTML;const p=re.parentNode;p.replaceChild(d,re);
        this.$('bk').onclick=()=>this.back();this.$('nx').onclick=()=>this.next();this.$('pa').onclick=()=>this.playAll();this.$('rs').onclick=()=>this.begin();}
      else re.addEventListener('click',()=>this.auto?this.begin():this.play());}
    this.r.querySelectorAll('#steps li').forEach((li,i)=>{if(this.stepper)li.style.cursor='pointer';li.addEventListener('click',()=>{if(this.stepper)this.jump(i+1);});});
    this._bp=()=>{this.stop();this.final();this.k=this.meta().n;this.waiting=0;this.ui();};
    this.init&&this.init();}
  connectedCallback(){window.addEventListener('beforeprint',this._bp);if(this.stepper||this.auto)this.begin();}
  disconnectedCallback(){this.stop();window.removeEventListener('beforeprint',this._bp);}
  clear(){clearTimeout(this.tm);(this.fl||[]).forEach(k=>cancelAnimationFrame(k.id));this.fl=[];this.q=[];this.cur=0;this.vt=0;this.gc=0;this.pass=0;if(this.raf)cancelAnimationFrame(this.raf);this.t.forEach(clearTimeout);this.t=[];}
  stop(){this.clear();this.waiting=0;this.running=false;this.skip=false;this.autoAll=false;this.ffm=false;if(this.root)this.root.classList.remove('ffm');}
  at(ms,f){this.q.push({t:this.cur+ms,f,id:++this.seq});}
  gate(ms){this.q.push({t:this.cur+(ms||0),gate:true,j:++this.gc,id:++this.seq});}
  busy(){}
  begin(){this.stop();this.k=0;if(this.auto){this.autoAll=true;this.running=true;}this.play();this.loop();}
  next(){if(this.waiting){const j=this.waiting;this.waiting=0;this.pass=j;this.k=j-1;this.running=true;this.ui();this.loop();}
    else if(this.running){this.skip=true;this.root.classList.add('ffm');clearTimeout(this.tm);this.loop();}}
  back(){const j=this.running?this.k:Math.max(0,this.k-1);this.goto(j);}
  jump(n){if(this.waiting===n){this.next();return;}this.goto(n-1);if(this.waiting===n)this.next();}
  goto(k){this.stop();this.ffm=true;this.target=k;this.root.classList.add('ffm');this.play();this.loop();}
  playAll(){this.stop();this.autoAll=true;this.k=0;this.play();this.running=true;this.ui();this.loop();}
  ffEnd(){this.ffm=false;this.skip=false;requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!this.ffm&&!this.skip)this.root.classList.remove('ffm');}));}
  loop(){clearTimeout(this.tm);
    for(;;){
      if(!this.q.length){this.k=this.meta().n;this.waiting=0;this.running=false;this.autoAll=false;if(this.ffm||this.skip)this.ffEnd();this.ui();return;}
      let bi=0;for(let i=1;i<this.q.length;i++){const a=this.q[i],b=this.q[bi];if(a.t<b.t||(a.t===b.t&&a.id<b.id))bi=i;}
      const e=this.q[bi];
      if(e.gate){
        if(this.pass>=e.j||this.autoAll||(this.ffm&&e.j-1<this.target)){this.q.splice(bi,1);this.pass=Math.max(this.pass,e.j);continue;}
        this.q.splice(bi,1);this.waiting=e.j;this.pass=e.j-1;this.k=e.j-1;this.running=false;
        if(this.ffm||this.skip)this.ffEnd();this.skip=false;this.ui();return;}
      const wait=(this.ffm||this.skip)?0:Math.max(0,e.t-this.vt);
      if(wait>0){this.tm=setTimeout(()=>{const i=this.q.indexOf(e);if(i>=0)this.q.splice(i,1);this.vt=e.t;this.cur=e.t;e.f();this.loop();},wait);return;}
      this.q.splice(bi,1);this.vt=Math.max(this.vt,e.t);this.cur=e.t;e.f();}
  }
  ui(){const st=this.$('stx');if(!st||!this.stepper)return;const m=this.meta(),n=m.n,k=this.k,lb=j=>m.labels&&m.labels[j-1]?' · '+m.labels[j-1]:'';
    const done=!this.waiting&&!this.running&&k>=n;
    this.$('bk').disabled=(k===0&&!this.running);this.$('nx').disabled=done;this.$('nx').textContent=this.running?'Skip ⏭':'Next step ▶';
    st.innerHTML=done?`<b>All ${n} steps done</b>`:this.waiting?(k===0?`Ready — press <b>Next step</b> to begin (${n} steps)`:`Step ${k} of ${n}${lb(k)} — done. Press <b>Next step</b>`):`<b>Step ${k+1} of ${n}</b>${lb(k+1)}`;}
}
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* ---------------- Compiler ---------------- */
const SRC=['#include <iostream>','using namespace std;','int main() {','','cout << "Hello this is a calculator "<<endl;','cout << "2 + 2 = "<<endl<<endl;','cout<< 2+2;','','return 0;','}'];
const OUT='Hello this is a calculator\n\n2 + 2 = 4';
const BIN=[...OUT].map(c=>c.charCodeAt(0).toString(2).padStart(8,'0'));
const GEAR=(s)=>`<svg width="${s}" height="${s}" viewBox="-50 -50 100 100"><g fill="#CA133E"><circle r="30"/>${[0,45,90,135].map(a=>`<rect x="-9" y="-44" width="18" height="88" rx="4" transform="rotate(${a})"/>`).join('')}</g><circle r="14" fill="#fff"/><circle r="6" fill="#DC9F0E"/></svg>`;
class CompilerDemo extends Sim{
  get stepper(){return false;}get auto(){return true;}
  meta(){return {n:3,labels:['Source code (original program code)','Compiler translates it into object code','Program runs: output for end-user']};}
  css(){return `
.row{align-items:center}
.c1{flex:2.2 1 0}.c2{flex:.7 1 0;align-self:center}.c3{flex:1.2 1 0}
.code{padding:8px 4px 8px 0;font-size:8.5px;line-height:1.6;height:158px;overflow:hidden;white-space:pre}
.code div{display:flex;opacity:0;transition:opacity 200ms;border-left:3px solid transparent;min-height:14px}
.code div.on{opacity:1}.code div.cur{background:rgba(202,19,62,.5);border-left-color:#DC9F0E}
.code i{font-style:normal;width:22px;text-align:right;padding-right:7px;color:#9a9aa3;flex:none}
.code .kw{color:#DC9F0E}.code .st{color:#9fd8a8}.code .nm{color:#F58AA0}.code .ty{color:#fff}
.bin{padding:8px;font-size:9px;line-height:1.5;height:158px;overflow:hidden;color:#fff;word-break:break-all}
.gear{margin:8px 0 4px;display:flex}
.gear svg{transition:transform 300ms}
.spin svg{animation:sp 1s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.out{margin-top:12px;background:#fff;border:2px solid #E7E7E9;border-radius:16px;padding:12px 14px;display:flex;flex-direction:column;align-items:center}
.out .pane{max-width:300px;padding:10px 12px;font-size:12px;line-height:1.5;min-height:62px;white-space:pre}
.out .d{margin-top:6px}
.arrow .chev{display:none}
@container (max-width:600px){
 .row{flex-direction:column}.c1,.c2,.c3{flex:none;width:100%}
 .arrow{flex:0 0 36px;width:40px}
 .arrow .ln{left:50%;right:auto;top:4px;bottom:4px;width:2px;height:auto;margin:0 0 0 -1px;background:repeating-linear-gradient(180deg,#F58AA0 0 6px,transparent 6px 10px)}
 .arrow .hd{right:auto;left:50%;top:auto;bottom:0;transform:translateX(-50%) rotate(90deg)}
 .code,.bin{height:auto;min-height:100px}.code{font-size:9px}
}`;}
  html(){
    const K=t=>`<span class="kw">${t}</span>`,S=t=>`<span class="st">${esc(t)}</span>`,N=t=>`<span class="nm">${t}</span>`;
    const HL=[K('#include')+' '+N('&lt;iostream&gt;'),K('using namespace')+' std;',K('int')+' main() {','','cout &lt;&lt; '+S('"Hello this is a calculator "')+'&lt;&lt;endl;','cout &lt;&lt; '+S('"2 + 2 = "')+'&lt;&lt;endl&lt;&lt;endl;','cout&lt;&lt; '+N('2+2')+';','',K('return')+' '+N('0')+';','}'];
    const hl=(l,i)=>HL[i];
    return `<div class="wrap" id="root">
<div class="def">Computer program that <b class="gy">translates</b> program written in a <b class="r">High-level language</b> into <b class="gr">Machine code</b></div>
<div class="row">
 <div class="card c1"><div class="h">Source code</div><div class="d">Original program code</div>
  <div class="pane mono code" id="src" style="margin-top:8px">${SRC.map((l,i)=>`<div data-i="${i}"><i>${i+1}</i><span>${hl(l,i)}</span></div>`).join('')}</div>
  <span class="chip r">High-level language</span></div>
 <div class="arrow"><div class="ln"></div><div class="hd">→</div></div>
 <div class="card c2"><div class="h">Compiler</div><div class="gear" id="gear">${GEAR(56)}</div></div>
 <div class="arrow"><div class="ln"></div><div class="hd">→</div></div>
 <div class="card c3"><div class="h">Object code</div><div class="d">Code after compilation</div>
  <div class="pane mono bin" id="bin" style="margin-top:8px"></div>
  <span class="chip g">Machine code</span></div>
</div>
<div class="out"><div class="pane mono" id="term" aria-label="program output"></div><div class="d">Output for end-user</div></div>
<div class="act"><button class="re" id="re" type="button">▶ Replay</button></div></div>`;}
  reset(){this.clear();this.root.classList.remove('noanim');
    this.r.querySelectorAll('#src div').forEach(d=>d.classList.remove('on','cur'));
    this.$('bin').textContent='';this.$('term').textContent='';this.$('gear').classList.remove('spin');}
  play(){this.reset();const L=this.r.querySelectorAll('#src div'),n=L.length;this.gate(0);
    L.forEach((d,i)=>this.at(400+i*230,()=>d.classList.add('on')));
    let t=400+n*230+500;const per=Math.ceil(BIN.length/n);
    this.gate(t);this.at(t,()=>this.$('gear').classList.add('spin'));
    L.forEach((d,i)=>{this.at(t+i*380,()=>{L.forEach(x=>x.classList.remove('cur'));d.classList.add('cur');
      const chunk=BIN.slice(i*per,(i+1)*per).join(' ');if(chunk)this.$('bin').textContent+=(this.$('bin').textContent?' ':'')+chunk;});});
    t+=n*380;
    this.at(t,()=>{L.forEach(x=>x.classList.remove('cur'));this.$('gear').classList.remove('spin');});
    t+=700;this.gate(t);const o=OUT.split('');
    o.forEach((c,i)=>this.at(t+i*45,()=>{this.$('term').textContent+=c;}));
    this.at(t+o.length*45+300,()=>this.busy(false));}
  final(){this.reset();this.root.classList.add('noanim');
    this.r.querySelectorAll('#src div').forEach(d=>d.classList.add('on'));
    this.$('bin').textContent=BIN.join(' ');this.$('term').textContent=OUT;this.busy(false);this.started=true;}
}

/* ---------------- Linker ---------------- */
const COL=['#CA133E','#DC9F0E','#2563EB','#16B981'];
const FILE=(c,lbl,w=40)=>`<svg width="${w}" height="${w*1.2}" viewBox="0 0 40 48"><path d="M4 2h22l10 10v34H4z" fill="#fff" stroke="${c}" stroke-width="2.5" stroke-linejoin="round"/><path d="M26 2v10h10" fill="${c}" opacity=".35"/><rect x="9" y="22" width="22" height="14" rx="3" fill="${c}"/><text x="20" y="32.5" font-size="8" font-weight="700" fill="#fff" text-anchor="middle" font-family="Poppins,sans-serif">${lbl}</text></svg>`;
const PERSON=c=>`<svg width="38" height="38" viewBox="0 0 40 40"><circle cx="20" cy="20" r="19" fill="${c}"/><circle cx="20" cy="15" r="6" fill="#fff"/><path d="M8 33c1-8 6-11 12-11s11 3 12 11" fill="#fff"/></svg>`;
class LinkerDemo extends Sim{
  get stepper(){return false;}get auto(){return true;}
  meta(){return {n:3,labels:['Each user compiles: 4 object files','Object files go to the linker','Linker combines them into a single program']};}
  css(){return `
.users{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.u{background:#fff;border:2px solid #CA133E;border-radius:16px;padding:10px 6px;display:flex;flex-direction:column;align-items:center;box-shadow:0 4px 10px rgba(202,19,62,.1);transition:opacity 300ms}
.u .n{font-weight:700;font-size:13px;margin-top:3px}
.dn{color:#CA133E;font-weight:700;font-size:16px;line-height:1;margin:5px 0}
.cp{font-size:11px;font-weight:700;background:#FDE8EC;color:#CA133E;border-radius:999px;padding:3px 8px;transition:background 200ms,color 200ms}
.cp.act{background:#CA133E;color:#fff;animation:bl 500ms ease-in-out 2}
@keyframes bl{50%{transform:scale(1.12)}}
.slot{height:54px;display:flex;align-items:center;justify-content:center;margin-top:2px}
.slot .f{opacity:0;transform:scale(.4);transition:opacity 300ms,transform 300ms cubic-bezier(.3,1.6,.5,1)}
.slot.on .f{opacity:1;transform:none}.slot.gone .f{opacity:.18}
.lbl{font-size:11px;color:#6B6B73;line-height:1.2;text-align:center}
.mid{display:flex;justify-content:center;margin:12px 0 2px}
.lk{background:#fff;border:2px solid #CA133E;border-radius:16px;padding:10px 22px;box-shadow:0 4px 10px rgba(202,19,62,.1);display:flex;align-items:center;gap:10px}
.lk .h{font-size:16px}.lk .gear{display:flex}.lk.spin svg{animation:sp 1s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.res{display:flex;flex-direction:column;align-items:center;margin-top:6px;min-height:84px}
.res .f{opacity:0;transform:scale(.4);transition:opacity 300ms,transform 300ms cubic-bezier(.3,1.6,.5,1)}
.res.on .f{opacity:1;transform:none}
.res .h{margin-top:4px;opacity:0;transition:opacity 300ms}.res.on .h{opacity:1}
.fly{position:absolute;left:0;top:0;z-index:5;pointer-events:none}
@container (max-width:420px){.users{grid-template-columns:repeat(2,1fr)}}`;}
  html(){
    return `<div class="wrap" id="root" style="position:relative">
<div class="def">Program that takes <b class="r">multiple object files</b> produced by a compiler<br>Then<br><b class="gr">Combines them into a Single program</b></div>
<div class="users">${[1,2,3,4].map(i=>`<div class="u" id="u${i}">${PERSON(COL[i-1])}<div class="n">User ${i}</div><div class="dn">↓</div><div class="cp" id="cp${i}">Compiler</div><div class="dn">↓</div><div class="slot" id="sl${i}"><div class="f" id="f${i}">${FILE(COL[i-1],'OBJ')}</div></div><div class="lbl">Object file</div></div>`).join('')}</div>
<div class="mid"><div class="lk" id="lk"><div class="gear">${GEAR(34)}</div><div class="h">Linker</div></div></div>
<div class="dn" style="text-align:center;font-size:18px">↓</div>
<div class="res" id="res"><div class="f"><svg width="46" height="56" viewBox="0 0 40 48"><path d="M4 2h22l10 10v34H4z" fill="#fff" stroke="#1A1A1A" stroke-width="2.5" stroke-linejoin="round"/><path d="M26 2v10h10" fill="#1A1A1A" opacity=".25"/>${COL.map((c,i)=>`<rect x="9" y="${17+i*7}" width="22" height="6" rx="1.5" fill="${c}"/>`).join('')}</svg></div><div class="h">Single program</div></div>
<div class="act"><button class="re" id="re" type="button">▶ Replay</button></div></div>`;}
  reset(){this.clear();this.root.classList.remove('noanim');
    this.r.querySelectorAll('.slot').forEach(s=>s.classList.remove('on','gone'));
    this.r.querySelectorAll('.cp').forEach(s=>s.classList.remove('act'));
    this.r.querySelectorAll('.fly').forEach(e=>e.remove());
    this.$('lk').classList.remove('spin');this.$('res').classList.remove('on');}
  play(){this.reset();this.gate(0);
    for(let i=1;i<=4;i++){const s=(i-1)*650+400;
      this.at(s,()=>this.$('cp'+i).classList.add('act'));
      this.at(s+700,()=>{this.$('cp'+i).classList.remove('act');this.$('sl'+i).classList.add('on');});}
    const t=4*650+1400;
    this.gate(t);this.at(t,()=>{const wr=this.root.getBoundingClientRect(),lk=this.$('lk').getBoundingClientRect();
      for(let i=1;i<=4;i++){const f=this.$('f'+i),fr=f.getBoundingClientRect();
        const c=f.cloneNode(true);c.removeAttribute('id');c.className='fly';c.style.opacity=1;c.style.transform='none';
        c.style.left=(fr.left-wr.left)+'px';c.style.top=(fr.top-wr.top)+'px';this.root.appendChild(c);
        const dx=(lk.left+lk.width/2-fr.width/2-fr.left)+(i-2.5)*8,dy=(lk.top+lk.height/2-fr.height/2-fr.top);
        c.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(.5)`,opacity:.9}],{duration:800,delay:i*120,easing:'ease-in-out',fill:'forwards'});
        this.$('sl'+i).classList.add('gone');}});
    this.gate(t+1500);this.at(t+1500,()=>this.$('lk').classList.add('spin'));
    this.at(t+2900,()=>{this.$('lk').classList.remove('spin');this.r.querySelectorAll('.fly').forEach(e=>e.remove());this.$('res').classList.add('on');this.busy(false);});}
  final(){this.reset();this.root.classList.add('noanim');
    this.r.querySelectorAll('.slot').forEach(s=>s.classList.add('on','gone'));this.$('res').classList.add('on');this.busy(false);this.started=true;}
}

/* ---------------- Keyboard ---------------- */
const ROWS=[{k:'QWERTYUIOP',o:0},{k:'ASDFGHJKL',o:.5},{k:'ZXCVBNM',o:1.5}];
const RY=[26,54,82],BUS=128;
const LET='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const KPOS={};ROWS.forEach((r,ri)=>[...r.k].forEach((ch,i)=>KPOS[ch]={x:(i+r.o+.5)*60,y:RY[ri]}));
class KeyboardDemo extends Sim{
  get stepper(){return false;}get auto(){return true;}
  meta(){return {n:4,labels:['Circuit board under the keys','Key pressed completes the circuit','Signal sent to the CPU','CPU looks up the index file (ASCII table)']};}
  css(){return `
.kb{width:85.7%;background:linear-gradient(#44444B,#1a1a1a);border-radius:14px;padding:10px 8px 8px;box-shadow:0 6px 12px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.2)}
.kr{display:flex;margin-bottom:5px}
.key{width:calc(10% - 4px);margin-right:4px;aspect-ratio:1/.95;border-radius:6px;border:0;background:linear-gradient(#F5F5F6,#bdbdc2);color:#44444B;font-weight:700;font-size:clamp(9px,2.6cqw,15px);font-family:'JumperSafe','Poppins',sans-serif;box-shadow:0 3px 0 #6B6B73;padding:0;cursor:pointer;transition:transform 90ms,box-shadow 90ms}
.key.dn{transform:translateY(3px);box-shadow:0 0 0 #000;background:linear-gradient(#F58AA0,#EE6E89);color:#fff}
.hint{font-size:12px;color:#6B6B73;margin:6px 0 0 4px}
.panel{background:#fff;border:2px solid #CA133E;border-radius:16px;padding:10px 12px;margin-top:12px;box-shadow:0 4px 10px rgba(202,19,62,.1);transition:opacity 400ms,transform 400ms;opacity:0;transform:translateY(-10px);display:none}
.panel.on{display:block;opacity:1;transform:none}
.panel .h{font-size:14px;margin-bottom:4px}
svg.cb{width:100%;display:block;background:#0f3d2e;background:linear-gradient(135deg,#1a1a1a,#3a1a1a);border-radius:10px}
.tr{stroke:#6B6B73;stroke-width:1.5;fill:none;opacity:.55}
.sw{fill:#E7E7E9;stroke:#6B6B73;stroke-width:1.5}
.sw.on{fill:#DC9F0E;stroke:#fff;filter:drop-shadow(0 0 4px #DC9F0E)}
.sig{fill:none;stroke:#CA133E;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 3px #CA133E)}
.dot{fill:#DC9F0E}
.cpu rect.die{fill:#3a1a1a;stroke:#DC9F0E;stroke-width:2}.cpu.hot rect.die{filter:drop-shadow(0 0 8px #CA133E);stroke:#F58AA0}
.cpu text{fill:#fff;font-weight:700;font-size:16px;font-family:'JumperSafe','Poppins',sans-serif;text-anchor:middle}
.ascii{display:grid;grid-template-columns:repeat(9,1fr);gap:4px}
.ac{background:#F5F5F6;border:1px solid #E7E7E9;border-radius:6px;text-align:center;padding:2px 0;font-size:11px;line-height:1.2;color:#44444B;transition:background 80ms}
.ac b{display:block;font-size:13px;color:#1A1A1A}
.ac.scan{background:#DC9F0E;color:#fff}.ac.scan b{color:#fff}
.ac.hit{background:#CA133E;color:#fff;box-shadow:0 0 8px rgba(202,19,62,.6)}.ac.hit b{color:#fff}
.rd{margin-top:8px;min-height:22px;font-weight:700;font-size:14px;color:#CA133E;text-align:center}
.rd span{color:#44444B}
.scr{margin-top:8px;background:linear-gradient(135deg,#1a1a1a,#3a1a1a);border-radius:10px;padding:8px 12px;color:#DC9F0E;font-size:15px;min-height:36px;letter-spacing:2px;word-break:break-all}
.scr:after{content:"";display:inline-block;width:8px;height:15px;background:#DC9F0E;margin-left:2px;vertical-align:-2px;animation:cur 1s steps(1) infinite}
@keyframes cur{50%{opacity:0}}
.steps{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:6px}
.steps li{text-align:left;background:#fff;border:2px solid #E7E7E9;border-radius:12px;padding:8px 12px 8px 40px;font-size:13.5px;line-height:1.45;position:relative;transition:border-color 200ms,background 200ms,opacity 200ms;opacity:.55}
.steps li:before{content:attr(data-n);position:absolute;left:10px;top:8px;width:22px;height:22px;border-radius:50%;background:#E7E7E9;color:#44444B;font-weight:700;font-size:12px;line-height:22px;text-align:center}
.steps li.cur{border-color:#CA133E;background:#FDE8EC;opacity:1}.steps li.cur:before{background:#CA133E;color:#fff}
.steps li.done{opacity:1}
.steps .sent{font-style:italic}`;}
  html(){
    return `<div class="wrap" id="root" tabindex="0">
<div class="kb" id="kb">${ROWS.map(r=>`<div class="kr" style="margin-left:${r.o*10}%">${[...r.k].map(c=>`<button type="button" class="key" data-k="${c}" aria-label="Key ${c}">${c}</button>`).join('')}</div>`).join('')}</div>
<div class="hint">Press a key (tap it, or click here and type)</div>
<div class="panel" id="p1"><div class="h">Circuit board</div>
 <svg class="cb" id="cb" viewBox="0 0 700 150" role="img" aria-label="circuit board under the keys">
  ${RY.map(y=>`<path class="tr" d="M8 ${y}H592"/>`).join('')}
  ${ROWS.map((r,ri)=>[...r.k].map(c=>`<path class="tr" d="M${KPOS[c].x} ${KPOS[c].y}V${BUS}"/>`).join('')).join('')}
  <path class="tr" d="M8 ${BUS}H612"/>
  ${Object.keys(KPOS).map(c=>`<circle class="sw" id="sw${c}" cx="${KPOS[c].x}" cy="${KPOS[c].y}" r="5"/>`).join('')}
  <path class="sig" id="s1" d=""/><path class="sig" id="s2" d=""/><circle class="dot" id="dot" r="5" cx="-20" cy="-20"/>
  <g class="cpu" id="cpu"><rect class="die" x="612" y="98" width="80" height="44" rx="8"/><text x="652" y="125">CPU</text></g>
 </svg></div>
<div class="panel" id="p2"><div class="h">Index file · ASCII table</div>
 <div class="ascii" id="asc">${[...LET].map(c=>`<div class="ac" data-c="${c}"><b>${c}</b>${c.charCodeAt(0)}</div>`).join('')}</div>
 <div class="rd" id="rd"></div><div class="scr mono" id="scr"></div></div>
<ol class="steps" id="steps">
 <li data-n="1">There is a <b>circuit board</b> at the base of the keys.</li>
 <li data-n="2">Key is pressed and this <b>completes</b> a circuit</li>
 <li data-n="3" id="st3">Signal is <b class="sent">sent</b> to the <b>CPU</b>, showing that Key 'H' is pressed</li>
 <li data-n="4">The <b>CPU transmit</b> signal to an <b>index file</b> to identify which character the key press represents.</li></ol>
</div>`;}
  init(){this.typed='';
    this.r.querySelectorAll('.key').forEach(k=>k.addEventListener('click',()=>{this.letter=k.dataset.k;this.begin();}));
    this.root.addEventListener('keydown',e=>{const c=(e.key||'').toUpperCase();if(c.length===1&&KPOS[c]&&!e.ctrlKey&&!e.metaKey&&!e.altKey){this.letter=c;this.begin();}});}
  reset(){this.clear();this.root.classList.remove('noanim');
    this.r.querySelectorAll('.key.dn').forEach(k=>k.classList.remove('dn'));
    this.r.querySelectorAll('.sw.on').forEach(k=>k.classList.remove('on'));
    this.r.querySelectorAll('.ac').forEach(a=>a.classList.remove('scan','hit'));
    this.$('s1').setAttribute('d','');this.$('s2').setAttribute('d','');this.$('dot').setAttribute('cx',-20);
    this.$('cpu').classList.remove('hot');this.$('rd').textContent='';
    this.r.querySelectorAll('#steps li').forEach(l=>l.classList.remove('cur','done'));}
  step(n){this.r.querySelectorAll('#steps li').forEach((l,i)=>{l.classList.toggle('cur',i===n-1);l.classList.toggle('done',i<n-1);});}
  draw(el,d,ms,cb){el.setAttribute('d',d);const L=el.getTotalLength();if(this.ffm||this.skip){el.style.transition='none';el.style.strokeDasharray='none';el.style.strokeDashoffset=0;cb&&cb();return;}el.style.transition='none';el.style.strokeDasharray=L;el.style.strokeDashoffset=L;
    void el.getBoundingClientRect();el.style.transition=`stroke-dashoffset ${ms}ms linear`;el.style.strokeDashoffset=0;
    const t0=performance.now(),dot=this.$('dot');const f=now=>{const p=Math.min(1,(now-t0)/ms);const pt=el.getPointAtLength(L*p);dot.setAttribute('cx',pt.x);dot.setAttribute('cy',pt.y);if(p<1)this.raf=requestAnimationFrame(f);else{cb&&cb();}};
    this.raf=requestAnimationFrame(f);}
  label(c,n){this.$('st3').innerHTML=`Signal is <b class="sent">sent</b> to the <b>CPU</b>, showing that Key '${c}' is pressed`;}
  press(c){this.reset();this.label(c);const k=this.r.querySelector(`.key[data-k="${c}"]`),{x,y}=KPOS[c];
    this.gate(0);this.at(0,()=>{k.classList.add('dn');this.$('p1').classList.add('on');this.step(1);});
    this.at(900,()=>{k.classList.remove('dn');});
    this.gate(1000);this.at(1000,()=>{this.step(2);this.$('sw'+c).classList.add('on');this.draw(this.$('s1'),`M8 ${y}H${x}`,700);});
    this.gate(2100);this.at(2100,()=>{this.step(3);this.draw(this.$('s2'),`M${x} ${y}V${BUS}H612`,1300,()=>this.$('cpu').classList.add('hot'));});
    this.gate(3700);this.at(3700,()=>{this.step(4);this.$('p2').classList.add('on');const cells=[...this.r.querySelectorAll('.ac')];const idx=LET.indexOf(c);
      cells.forEach((a,i)=>{if(i>idx)return;this.at(300+i*85,()=>{cells.forEach(z=>z.classList.remove('scan'));a.classList.add(i===idx?'hit':'scan');});});
      this.at(300+idx*85+400,()=>{const code=c.charCodeAt(0);this.$('rd').innerHTML=`'${c}' <span>→</span> ${code} <span>→</span> ${code.toString(2).padStart(8,'0')}`;this.typed=(this.typed+c).slice(-18);this.$('scr').textContent=this.typed;this.r.querySelectorAll('#steps li').forEach(l=>l.classList.add('done'));});});}
  play(){this.press(this.letter||'H');}
  final(){this.reset();this.root.classList.add('noanim');const c='H',{x,y}=KPOS[c];this.label(c);
    this.$('p1').classList.add('on');this.$('p2').classList.add('on');this.$('sw'+c).classList.add('on');
    for(const [id,d] of [['s1',`M8 ${y}H${x}`],['s2',`M${x} ${y}V${BUS}H612`]]){const e=this.$(id);e.setAttribute('d',d);e.style.strokeDasharray='none';}
    this.$('cpu').classList.add('hot');this.r.querySelector('.ac[data-c="H"]').classList.add('hit');
    this.$('rd').innerHTML=`'H' <span>→</span> 72 <span>→</span> 01001000`;this.typed='H';this.$('scr').textContent='H';
    this.r.querySelectorAll('#steps li').forEach(l=>l.classList.add('done'));this.started=true;}
}
/* ---------------- 3D printer ---------------- */
const W3=[190,140,90,44],NL=4,CX=365;
class Printer3D extends Sim{
  get stepper(){return false;}get auto(){return true;}
  meta(){return this.mode==='S'?{n:3,labels:['Design and raw block','Cutter removes material','Finished object']}:{n:5,labels:['CAD design','Slicing into layers','Built layer by layer','Layers bound together','Excess powder removed']};}
  css(){return `
.types{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;font-size:12px;font-weight:700;margin-bottom:10px}
.types .t{padding:3px 10px;border-radius:999px;background:#fff;border:2px solid #CA133E;color:#1A1A1A}
.types .t.root{background:#CA133E;color:#fff}.types .t.sub{background:#FDE8EC;color:#CA133E;border-color:#F58AA0}
.types .a{color:#CA133E}
.tabs{display:flex;justify-content:center;gap:8px;margin-bottom:10px}
.tabs button{font-family:'JumperSafe','Poppins',sans-serif;font-weight:700;font-size:14px;border:2px solid #CA133E;background:#fff;color:#CA133E;border-radius:999px;padding:6px 18px;cursor:pointer}
.tabs button.on{background:#CA133E;color:#fff}
.grid{display:grid;grid-template-columns:1.5fr 1fr;gap:12px;align-items:start}
.stage{background:#fff;border:2px solid #CA133E;border-radius:16px;padding:8px;box-shadow:0 4px 10px rgba(202,19,62,.1)}
svg.s{width:100%;display:block;background:#F5F5F6;border-radius:10px}
.cap{margin-top:8px;font-size:13.5px;line-height:1.5;text-align:left;min-height:44px}
.cap .m{display:inline-block;opacity:.45;transition:opacity 200ms,background 200ms;border-radius:8px;padding:1px 6px}
.cap .m.on{opacity:1;background:#FDE8EC}
.cap div{margin-bottom:3px}
.steps{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.steps li{text-align:left;background:#fff;border:2px solid #E7E7E9;border-radius:12px;padding:8px 10px 8px 38px;font-size:13px;line-height:1.4;position:relative;opacity:.5;transition:all 200ms}
.steps li:before{content:attr(data-n);position:absolute;left:9px;top:8px;width:21px;height:21px;border-radius:50%;background:#E7E7E9;color:#44444B;font-weight:700;font-size:12px;line-height:21px;text-align:center}
.steps li.cur{border-color:#CA133E;background:#FDE8EC;opacity:1}.steps li.cur:before{background:#CA133E;color:#fff}.steps li.done{opacity:1}
.steps li.done:before{background:#16B981;color:#fff}
.lay{transform-box:fill-box;transform-origin:left center;transform:scaleX(0);fill:#CA133E;stroke:#A01030;stroke-width:1}
.lay.p{fill:url(#pw);stroke:none}
.head{transition:transform 250ms ease-in-out}
.bitf{animation:bsp 120ms linear infinite;animation-play-state:paused}.cut .bitf{animation-play-state:running}@keyframes bsp{50%{transform:translateX(1.5px)}}
.sp{stroke-dasharray:2 4;animation:dsh 300ms linear infinite;opacity:0}.sp.on{opacity:1}
@keyframes dsh{to{stroke-dashoffset:-12}}
.ind{font-size:12px;font-weight:700;display:flex;gap:8px;margin-bottom:6px}
.ind span{padding:2px 8px;border-radius:999px;background:#E7E7E9;color:#6B6B73;transition:all 150ms}
.ind span.on{background:#CA133E;color:#fff}
@container (max-width:600px){.grid{grid-template-columns:1fr}}`;}
  html(){
    const lay=(i,ys)=>`<rect class="lay" data-i="${i}" x="${CX-W3[i]/2}" y="${ys}" width="${W3[i]}" height="14"/>`;
    return `<div class="wrap" id="root">
<div class="types"><span class="t root">3D printer</span><span class="a">→</span><span class="t">Additive</span><span class="a">→</span><span class="t sub">Direct</span><span class="t sub">Binder</span><span style="width:10px"></span><span class="t">Subtractive</span></div>
<div class="tabs" role="tablist"><button type="button" id="tD" class="on">Direct</button><button type="button" id="tB">Binder</button><button type="button" id="tS">Subtractive</button></div>
<div class="grid"><div class="stage">
<svg class="s" viewBox="0 0 560 250" id="svg" role="img" aria-label="3D printer animation">
<defs><pattern id="pw" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#E7E7E9"/><circle cx="1.5" cy="1.5" r="1" fill="#9a9aa3"/><circle cx="4.5" cy="4" r="1" fill="#bdbdc2"/></pattern>
<clipPath id="armclip"><rect x="-12" y="62" width="24" height="220"/></clipPath><clipPath id="bedclip"><rect x="260" y="100" width="210" height="122"/></clipPath></defs>
<!-- CAD monitor -->
<rect x="14" y="40" width="160" height="118" rx="8" fill="#44444B"/><rect x="21" y="47" width="146" height="104" rx="4" fill="#1a1a1a"/>
<rect x="76" y="158" width="30" height="10" fill="#6B6B73"/><rect x="58" y="166" width="66" height="6" rx="3" fill="#44444B"/>
<g id="cad" fill="none" stroke="#F58AA0" stroke-width="1.5">${W3.map((w,i)=>`<rect x="${94-w*.4}" y="${138-9*(i+1)}" width="${w*.8}" height="9"/>`).join('')}</g>
<g id="slices" stroke="#DC9F0E" stroke-width="2">${W3.map((w,i)=>`<line class="sl" x1="${94-w*.4-4}" x2="${94+w*.4+4}" y1="${138-9*(i+1)}" y2="${138-9*(i+1)}" style="opacity:0;transition:opacity 200ms"/>`).join('')}</g>
<!-- printer frame -->
<rect x="196" y="224" width="338" height="14" rx="4" fill="#44444B"/>
<!-- DIRECT -->
<g id="gD"><rect x="203" y="50" width="324" height="8" rx="3" fill="#6B6B73"/><rect x="198" y="50" width="8" height="176" fill="#44444B"/><rect x="524" y="50" width="8" height="176" fill="#44444B"/>
<rect x="260" y="200" width="210" height="10" rx="2" fill="#44444B"/>
${W3.map((w,i)=>lay(i,186-14*i)).join('')}
<g class="head" id="car" style="transform:translate(${CX}px,0)"><rect x="-18" y="46" width="36" height="16" rx="4" fill="#CA133E"/>
 <rect id="arm" width="0" height="0" style="display:none"/><g clip-path="url(#armclip)">
 <g class="head" id="noz" style="transform:translate(0,3px)"><rect x="-3" y="-140" width="6" height="226" fill="#44444B"/><rect x="-10" y="86" width="20" height="14" rx="3" fill="#DC9F0E"/><polygon points="-7,100 7,100 0,112" fill="#DC9F0E"/><line class="sp" id="spD" x1="0" x2="0" y1="113" y2="124" stroke="#CA133E" stroke-width="3"/></g></g></g></g>
<!-- BINDER -->
<g id="gB" style="display:none"><rect x="252" y="100" width="8" height="124" fill="#44444B"/><rect x="470" y="100" width="8" height="124" fill="#44444B"/>
<g clip-path="url(#bedclip)"><g id="bgrp" style="transition:transform 250ms ease-in-out"><rect x="260" y="114" width="210" height="6" fill="#44444B"/>
${W3.map((w,i)=>`<rect class="lay p" data-i="${i}" x="260" y="${100-14*i}" width="210" height="14"/><rect class="lay" data-s="${i}" x="${CX-w/2}" y="${100-14*i}" width="${w}" height="14"/>`).join('')}</g></g>
<rect x="203" y="60" width="324" height="6" rx="3" fill="#6B6B73"/>
<g class="head" id="hop" style="transform:translate(260px,0)"><polygon points="-14,66 14,66 8,90 -8,90" fill="#9a9aa3" stroke="#44444B" stroke-width="2"/><line class="sp" id="spP" x1="0" x2="0" y1="92" y2="99" stroke="#6B6B73" stroke-width="3"/></g>
<g class="head" id="bnd" style="transform:translate(260px,0)"><rect x="-12" y="66" width="24" height="16" rx="3" fill="#DC9F0E" stroke="#7a5606" stroke-width="2"/><polygon points="-6,82 6,82 0,92" fill="#DC9F0E"/><line class="sp" id="spB" x1="0" x2="0" y1="94" y2="99" stroke="#DC9F0E" stroke-width="3"/></g></g>
<!-- SUBTRACTIVE -->
<g id="gS" style="display:none"><rect x="203" y="50" width="324" height="8" rx="3" fill="#6B6B73"/><rect x="198" y="50" width="8" height="176" fill="#44444B"/><rect x="524" y="50" width="8" height="176" fill="#44444B"/>
<rect x="260" y="200" width="210" height="10" rx="2" fill="#44444B"/>
${W3.map((w,i)=>`<rect class="blk" x="${CX-w/2}" y="${186-14*i}" width="${w}" height="14" id="kp${i}" style="fill:#9a9aa3;stroke:#6B6B73;stroke-width:1;transition:fill 700ms"/><rect class="wst" data-i="${i}" data-d="L" x="${CX-95}" y="${186-14*i}" width="${95-w/2}" height="14" style="transform-box:fill-box;transform-origin:left center;fill:#9a9aa3;stroke:#6B6B73;stroke-width:1"/><rect class="wst" data-i="${i}" data-d="R" x="${CX+w/2}" y="${186-14*i}" width="${95-w/2}" height="14" style="transform-box:fill-box;transform-origin:right center;fill:#9a9aa3;stroke:#6B6B73;stroke-width:1"/>`).join('')}
<g class="head" id="car2" style="transform:translate(${CX}px,0)"><rect x="-18" y="46" width="36" height="16" rx="4" fill="#DC9F0E"/>
 <rect id="arm2" width="0" height="0" style="display:none"/><g clip-path="url(#armclip)">
 <g class="head" id="bit" style="transform:translate(0,3px)"><rect x="-3" y="-140" width="6" height="220" fill="#44444B"/><rect x="-9" y="80" width="18" height="16" rx="3" fill="#bdbdc2" stroke="#44444B" stroke-width="2"/><g class="bitf"><rect x="-3" y="96" width="6" height="20" fill="#6B6B73"/><path d="M-3 100l6 3M-3 106l6 3M-3 112l6 3" stroke="#F5F5F6" stroke-width="1.5"/></g></g></g></g></g>
<g id="dust"></g>
</svg>
<div class="cap" id="cap"></div></div>
<ol class="steps" id="steps">
<li data-n="1">A design is made using (CAD) software.</li><li data-n="2">Software Slices the drawing into layers</li><li data-n="3">Solid object is built up layer by layer</li><li data-n="4">Layers are binded together</li><li data-n="5">Excess plastic powder is removed</li></ol></div>
<div class="act"><button class="re" id="re" type="button">▶ Replay</button></div></div>`;}
  init(){this.mode='D';this.$('tD').onclick=()=>this.setMode('D');this.$('tB').onclick=()=>this.setMode('B');this.$('tS').onclick=()=>this.setMode('S');this.setMode('D',true);}
  setMode(m,quiet){this.mode=m;this.$('tD').classList.toggle('on',m==='D');this.$('tB').classList.toggle('on',m==='B');this.$('tS').classList.toggle('on',m==='S');this.$('gS').style.display=m==='S'?'':'none';this.$('steps').style.display=m==='S'?'none':'';this.r.querySelector('.grid').style.gridTemplateColumns=m==='S'?'1fr':'';
    this.$('gD').style.display=m==='D'?'':'none';this.$('gB').style.display=m==='B'?'':'none';
    this.$('cap').innerHTML=m==='S'?`<div class="ind"><span id="iH">↔ cutter moves</span></div><div><b>Subtractive</b> — removal of material to produce an object</div>`:m==='D'?`<div class="ind"><span id="iH">↔ left / right</span><span id="iV">↕ up / down</span></div><div>Print head moves (left/right) &amp; (up/down) to build the layer of object</div>`
     :`<div><span class="m" id="m1">· Dry powder is sprayed</span></div><div><span class="m" id="m2">· Binder (glue like material) is sprayed to make a solid form.</span></div>`;
    if(!quiet)this.begin();else this.reset();}
  step(n,all){this.r.querySelectorAll('#steps li').forEach((l,i)=>{l.classList.toggle('cur',!all&&i===n-1);l.classList.toggle('done',all?i<n:i<n-1);});}
  tf(el,x,y,ms){el.style.transitionDuration=ms+'ms';el.style.transform=`translate(${x}px,${y}px)`;}
  reset(){this.clear();this.root.classList.remove('noanim');
    this.r.querySelectorAll('.lay').forEach(l=>{l.style.transition='none';l.style.transform='scaleX(0)';l.style.opacity=1;});
    this.r.querySelectorAll('.sl').forEach(l=>l.style.opacity=0);
    this.r.querySelectorAll('.sp').forEach(l=>l.classList.remove('on'));
    this.tf(this.$('car'),CX,0,0);this.tf(this.$('noz'),0,3+14*5,0);this.$('arm').style.transform='scaleY(.8)';
    this.tf(this.$('hop'),260,0,0);this.tf(this.$('bnd'),260,0,0);this.$('bgrp').style.transitionDuration='0ms';this.$('bgrp').style.transform='translate(0,0)';
    this.r.querySelectorAll('.wst').forEach(w=>{w.style.transition='none';w.style.transform='scaleX(1)';w.style.opacity=1;});this.r.querySelectorAll('.blk').forEach(b=>{b.style.transition='none';b.style.fill='#9a9aa3';});
    this.tf(this.$('car2'),CX,0,0);this.tf(this.$('bit'),0,3+14*5,0);this.$('arm2').style.transform='scaleY(.8)';this.$('dust').innerHTML='';this.$('gS').classList.remove('cut');
    this.r.querySelectorAll('#gD .lay,#gB .lay').forEach(l=>{l.style.filter='none';});
    this.step(0);['m1','m2','iH','iV'].forEach(i=>{const e=this.$(i);e&&e.classList.remove('on');});}
  sweep(l,ms){l.style.transition=`transform ${ms}ms linear`;l.style.transform='scaleX(1)';}
  play(){this.reset();
    if(this.mode==='S'){this.gate(0);this.at(300,()=>this.r.querySelectorAll('.sl').forEach((l,i)=>setTimeout(()=>l.style.opacity=1,i*160)));this.gate(1300);this.playS(1300);return;}
    const S=n=>this.step(n);let t=300;this.gate(0);
    this.at(t,()=>S(1));t+=1100;this.gate(t);
    this.at(t,()=>{S(2);this.r.querySelectorAll('.sl').forEach((l,i)=>setTimeout(()=>l.style.opacity=1,i*160));});t+=1300;this.gate(t);
    this.at(t,()=>S(3));
    this.mode==='D'?this.playD(t+200):this.mode==='B'?this.playB(t+200):this.playS(t+200);}
  playD(t0){let t=t0;const car=this.$('car'),noz=this.$('noz'),arm=this.$('arm'),L=[...this.r.querySelectorAll('#gD .lay')];
    // start position: bottom layer left edge, nozzle at bottom
    for(let i=0;i<NL;i++){const w=W3[i],a=CX-w/2,b=CX+w/2,dyi=3+14*(5-i),ltr=i%2===0,sx=ltr?a:b,ex=ltr?b:a;
      this.at(t,()=>{this.$('iV').classList.add('on');this.tf(car,sx,0,300);this.tf(noz,0,dyi,300);arm.style.transform=`scaleY(${(38+dyi)/100})`;});
      this.at(t+300,()=>{this.$('iV').classList.remove('on');this.$('iH').classList.add('on');this.$('spD').classList.add('on');
        const l=L[i];l.style.transformOrigin=ltr?'left center':'right center';this.sweep(l,520);this.tf(car,ex,0,520);});
      this.at(t+830,()=>{this.$('iH').classList.remove('on');this.$('spD').classList.remove('on');});
      t+=900;}
    this.gate(t);this.at(t,()=>{this.tf(car,CX,0,500);this.tf(noz,0,3+14*5,500);arm.style.transform='scaleY(.8)';this.step(4);
      L.forEach((l,i)=>setTimeout(()=>{l.style.transition='filter 500ms';l.style.stroke='none';l.style.filter='drop-shadow(0 0 5px #F58AA0)';},i*120));});
    this.gate(t+1300);this.at(t+1300,()=>{this.step(5);L.forEach(l=>l.style.filter='none');this.dust(220,200,60);});
    this.at(t+2700,()=>{this.r.querySelectorAll('#steps li').forEach(l=>{l.classList.remove('cur');l.classList.add('done');});this.busy(false);});}
  dust(x0,y0,n){const g=this.$('dust');for(let i=0;i<n;i++){const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('r',1+Math.random()*1.6);c.setAttribute('cx',x0+Math.random()*(this.mode==='D'?150:140)+ (this.mode==='D'?0:0));c.setAttribute('cy',y0-Math.random()*8);c.setAttribute('fill',Math.random()<.5?'#9a9aa3':'#bdbdc2');c.style.transition='transform 900ms ease-in,opacity 900ms';c.style.opacity=1;g.appendChild(c);
    setTimeout(()=>{c.style.transform=`translate(${(Math.random()-.5)*60}px,${14+Math.random()*10}px)`;c.style.opacity=0;},30+Math.random()*300);}}
  playS(t0){let t=t0;const car=this.$('car2'),bit=this.$('bit'),arm=this.$('arm2');this.$('gS').classList.add('cut');
    for(let k=0;k<NL;k++){const i=NL-1-k,w=W3[i],yl=3+14*(5-i),dy=yl,inL=CX-w/2,outL=CX-95,inR=CX+w/2,outR=CX+95;
      const Lw=this.r.querySelector(`.wst[data-i="${i}"][data-d="L"]`),Rw=this.r.querySelector(`.wst[data-i="${i}"][data-d="R"]`);
      if(w>=190)continue;
      this.at(t,()=>{this.$('iH').classList.add('on');this.tf(car,inL,0,350);this.tf(bit,0,dy+10,350);arm.style.transform=`scaleY(${(48+dy)/100})`;});
      this.at(t+380,()=>{Lw.style.transition='transform 450ms linear';Lw.style.transform='scaleX(0)';this.tf(car,outL,0,450);this.dust(outL,186-14*i+10,8);});
      this.at(t+900,()=>{this.tf(car,inR,0,300);});
      this.at(t+1250,()=>{Rw.style.transition='transform 450ms linear';Rw.style.transform='scaleX(0)';this.tf(car,outR,0,450);this.dust(outR-30,186-14*i+10,8);});
      t+=1800;}
    this.gate(t);this.at(t,()=>{this.$('iH').classList.remove('on');this.tf(car,CX,0,500);this.tf(bit,0,3+14*5,500);arm.style.transform='scaleY(.8)';this.$('gS').classList.remove('cut');
      W3.forEach((w,i)=>{const b=this.$('kp'+i);b.style.transition='fill 700ms';b.style.fill='#CA133E';b.style.stroke='#A01030';});});
    this.at(t+1000,()=>this.busy(false));}
  playB(t0){let t=t0;const P=[...this.r.querySelectorAll('#gB .lay.p')],Sd=[...this.r.querySelectorAll('#gB .lay:not(.p)')];
    for(let i=0;i<NL;i++){const w=W3[i];
      this.at(t,()=>{this.$('m1').classList.add('on');this.$('m2').classList.remove('on');this.$('spP').classList.add('on');this.tf(this.$('hop'),260,0,0);
        requestAnimationFrame(()=>{this.tf(this.$('hop'),470,0,450);});this.sweep(P[i],450);});
      this.at(t+480,()=>{this.$('spP').classList.remove('on');this.tf(this.$('hop'),260,-0,0);this.$('m1').classList.remove('on');this.$('m2').classList.add('on');this.$('spB').classList.add('on');
        this.tf(this.$('bnd'),CX-w/2,0,200);});
      this.at(t+700,()=>{this.tf(this.$('bnd'),CX+w/2,0,450);this.sweep(Sd[i],450);});
      this.at(t+1160,()=>{this.$('spB').classList.remove('on');this.$('bgrp').style.transitionDuration='250ms';this.$('bgrp').style.transform=`translate(0,${14*(i+1)}px)`;});
      t+=1500;}
    this.gate(t);this.at(t,()=>{this.$('m2').classList.remove('on');this.step(4);this.tf(this.$('bnd'),260,0,400);});t+=1100;this.gate(t);
    this.at(t,()=>{this.step(5);P.forEach(p=>{p.style.transition='opacity 900ms';p.style.opacity=0;});});
    this.at(t+1100,()=>{this.step(5,true);this.step(5,true);this.r.querySelectorAll('#steps li').forEach(l=>{l.classList.remove('cur');l.classList.add('done');});this.busy(false);});}
  final(){this.reset();this.root.classList.add('noanim');
    if(this.mode==='S'){this.r.querySelectorAll('.wst').forEach(w=>w.style.transform='scaleX(0)');this.r.querySelectorAll('.blk').forEach(b=>{b.style.fill='#CA133E';b.style.stroke='#A01030';});}
    else if(this.mode==='D'){this.r.querySelectorAll('#gD .lay').forEach(l=>l.style.transform='scaleX(1)');}
    else{this.r.querySelectorAll('#gB .lay:not(.p)').forEach(l=>l.style.transform='scaleX(1)');this.r.querySelectorAll('#gB .lay.p').forEach(l=>l.style.opacity=0);this.$('bgrp').style.transform='translate(0,56px)';}
    this.r.querySelectorAll('.sl').forEach(l=>l.style.opacity=1);
    this.r.querySelectorAll('#steps li').forEach(l=>l.classList.add('done'));this.busy(false);this.started=true;}
}

/* ---------------- Speaker ---------------- */
class SpeakerDemo extends Sim{
  meta(){return {n:4,labels:['Current flows through the coil','Current varies: iron core vibrates','Paper cone vibrates','Sound wave is produced']};}
  css(){return `
.grid{display:grid;grid-template-columns:1.5fr 1fr;gap:12px;align-items:start}
.stage{background:#fff;border:2px solid #CA133E;border-radius:16px;padding:8px;box-shadow:0 4px 10px rgba(202,19,62,.1)}
svg.s{width:100%;display:block;background:#F5F5F6;border-radius:10px}
.steps{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.steps li{text-align:left;background:#fff;border:2px solid #E7E7E9;border-radius:12px;padding:8px 10px 8px 38px;font-size:13px;line-height:1.4;position:relative;opacity:.5;transition:all 200ms}
.steps li:before{content:attr(data-n);position:absolute;left:9px;top:8px;width:21px;height:21px;border-radius:50%;background:#E7E7E9;color:#44444B;font-weight:700;font-size:12px;line-height:21px;text-align:center}
.steps li.cur{border-color:#CA133E;background:#FDE8EC;opacity:1}.steps li.cur:before{background:#CA133E;color:#fff}.steps li.done{opacity:1}
.steps li.done:before{background:#16B981;color:#fff}
.wire{fill:none;stroke:#44444B;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.flow{fill:none;stroke:#DC9F0E;stroke-width:3.5;stroke-linecap:round;stroke-dasharray:1 12;opacity:0}
.s1 .flow{opacity:1;animation:fl 600ms linear infinite alternate}
@keyframes fl{from{stroke-dashoffset:0}to{stroke-dashoffset:-26}}
.coil{fill:none;stroke:#44444B;stroke-width:3}.s1 .coil{stroke:#CA133E;filter:drop-shadow(0 0 3px rgba(202,19,62,.7))}
.core,.cone{transition:none}
.s2 .core{animation:vb 140ms ease-in-out infinite alternate}
.s3 .cone{animation:vb 140ms ease-in-out infinite alternate}
@keyframes vb{from{transform:translateX(-4px)}to{transform:translateX(5px)}}
.wv{fill:none;stroke:#CA133E;stroke-width:3;stroke-linecap:round;opacity:0}
.s4 .wv{animation:wave 1.6s ease-out infinite}
.s4 .wv:nth-child(2){animation-delay:.5s}.s4 .wv:nth-child(3){animation-delay:1s}
@keyframes wave{0%{opacity:.9;transform:translateX(0) scale(.7)}100%{opacity:0;transform:translateX(70px) scale(1.5)}}
.wv{transform-box:fill-box;transform-origin:left center}
.graph{opacity:0;transition:opacity 300ms}.s2 .graph{opacity:1}
.sine{fill:none;stroke:#CA133E;stroke-width:3}.s2 .sine{animation:sc 1.6s linear infinite}
@keyframes sc{to{transform:translateX(-80px)}}
@container (max-width:600px){.grid{grid-template-columns:1fr}}`;}
  html(){
    let loops='';for(let i=0;i<7;i++){const x=104+i*8;loops+=`<ellipse class="coil" cx="${x}" cy="120" rx="4" ry="21"/>`;}
    let sine='M0 40';for(let k=0;k<4;k++)sine+=` q20 -36 40 0 t40 0`;
    return `<div class="wrap" id="root"><div class="grid"><div class="stage">
<svg class="s" id="svg" viewBox="0 0 560 270" role="img" aria-label="speaker cross-section">
<g class="graph"><rect x="14" y="14" width="150" height="60" rx="8" fill="#1a1a1a"/><clipPath id="gc"><rect x="18" y="18" width="142" height="52"/></clipPath><g clip-path="url(#gc)"><g transform="translate(18,4)"><path class="sine" d="${sine}"/></g></g></g>
<rect x="64" y="70" width="34" height="100" rx="4" fill="#44444B"/><rect x="64" y="70" width="34" height="50" rx="4" fill="#CA133E"/>
<path class="wire" d="M62 226 V148 H98"/><path class="wire" d="M170 100 V84 H34 V226 H38"/>
<path class="flow" d="M62 226 V148 H98"/><path class="flow" d="M170 100 V84 H34 V226 H38"/>
<rect x="98" y="108" width="14" height="24" fill="#bdbdc2"/>
<g class="core" id="core"><rect x="98" y="108" width="72" height="24" rx="3" fill="#9a9aa3" stroke="#44444B" stroke-width="2"/></g>
${loops}
<g class="cone" id="cone"><path d="M168 106 L168 134 L318 226 L318 14 Z" fill="#fff" stroke="#44444B" stroke-width="3" stroke-linejoin="round"/><path d="M168 120 L318 120" stroke="#E7E7E9" stroke-width="2"/></g>
<rect x="312" y="8" width="12" height="14" rx="3" fill="#44444B"/><rect x="312" y="218" width="12" height="14" rx="3" fill="#44444B"/>
<g><path class="wv" d="M345 90 Q375 120 345 150"/><path class="wv" d="M345 90 Q375 120 345 150"/><path class="wv" d="M345 90 Q375 120 345 150"/></g>
<g><path class="wv" d="M345 40 Q395 120 345 200" style="stroke-width:2"/></g>
<g transform="translate(36,214)"><circle cx="16" cy="12" r="16" fill="#fff" stroke="#44444B" stroke-width="3"/><path d="M6 12q5 -9 10 0t10 0" fill="none" stroke="#CA133E" stroke-width="2.5"/></g>
</svg></div>
<ol class="steps" id="steps">
<li data-n="1">Current flows through the coil of wire around an iron core</li>
<li data-n="2">Electric current varies and make the iron core vibrated</li>
<li data-n="3">Thin sheet of paper is attached to the iron core is vibrated within it</li>
<li data-n="4">Sound wave is produced</li></ol></div>
<div class="act"><button class="re" id="re" type="button">▶ Replay</button></div></div>`;}
  reset(){this.clear();this.root.classList.remove('noanim');const s=this.$('svg');s.setAttribute('class','s');this.r.querySelectorAll('#steps li').forEach(l=>l.classList.remove('cur','done'));}
  step(n){const s=this.$('svg');s.setAttribute('class','s '+[1,2,3,4].filter(i=>i<=n).map(i=>'s'+i).join(' '));
    this.r.querySelectorAll('#steps li').forEach((l,i)=>{l.classList.toggle('cur',i===n-1);l.classList.toggle('done',i<n-1);});}
  play(){this.reset();[1,2,3,4].forEach((n,i)=>{this.gate(400+i*1900);this.at(400+i*1900,()=>this.step(n));});
    this.at(400+4*1900,()=>{this.r.querySelectorAll('#steps li').forEach(l=>{l.classList.remove('cur');l.classList.add('done');});this.busy(false);});}
  final(){this.reset();this.root.classList.add('noanim');this.$('svg').setAttribute('class','s s1 s4');
    this.r.querySelectorAll('.wv').forEach(w=>w.style.opacity=.7);
    this.r.querySelectorAll('#steps li').forEach(l=>l.classList.add('done'));this.busy(false);this.started=true;}
}

/* ---------------- Actuator lab ---------------- */
const IC={
motor:`<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#44444B"/><circle cx="32" cy="32" r="21" fill="#E7E7E9"/><g class="rot"><rect x="29" y="12" width="6" height="20" rx="2" fill="#CA133E"/><rect x="29" y="32" width="6" height="20" rx="2" fill="#F58AA0"/><rect x="12" y="29" width="20" height="6" rx="2" fill="#F58AA0"/><rect x="32" y="29" width="20" height="6" rx="2" fill="#CA133E"/></g><circle cx="32" cy="32" r="5" fill="#1a1a1a"/><rect x="29" y="2" width="6" height="6" fill="#DC9F0E"/></svg>`,
bulb:`<svg viewBox="0 0 64 64"><g class="rays" stroke="#DC9F0E" stroke-width="3" stroke-linecap="round"><path d="M32 3v6M8 14l4 4M56 14l-4 4M3 32h6M55 32h6"/></g><circle class="glow" cx="32" cy="27" r="17" fill="#FFE08A"/><path d="M32 8a19 19 0 0 0-8 36v6h16v-6a19 19 0 0 0-8-36z" fill="rgba(255,255,255,.6)" stroke="#44444B" stroke-width="3"/><path d="M26 44l3-14 3 8 3-8 3 14" fill="none" stroke="#6B6B73" stroke-width="2.5" class="fil"/><rect x="24" y="50" width="16" height="9" rx="2" fill="#6B6B73"/></svg>`,
heater:`<svg viewBox="0 0 64 64"><g class="heat" fill="none" stroke="#EF4444" stroke-width="3" stroke-linecap="round"><path d="M20 22q-5-5 0-10t0-9"/><path d="M32 22q-5-5 0-10t0-9"/><path d="M44 22q-5-5 0-10t0-9"/></g><rect x="6" y="26" width="52" height="30" rx="6" fill="#44444B"/><path class="coilh" d="M12 41h6l3-9 6 18 6-18 6 18 3-9h6" fill="none" stroke="#bdbdc2" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
valve:`<svg viewBox="0 0 64 64"><rect x="0" y="34" width="64" height="16" fill="#6B6B73"/><g class="water"><rect x="0" y="38" width="64" height="8" fill="#BFD8FB"/><path d="M0 42h64" stroke="#2563EB" stroke-width="4" stroke-dasharray="6 6"/></g><rect x="20" y="28" width="24" height="28" rx="4" fill="#2563EB"/><rect class="gate" x="28" y="32" width="8" height="20" fill="#1a1a1a"/><rect x="30" y="14" width="4" height="16" fill="#44444B"/><g class="wheel"><rect x="18" y="9" width="28" height="6" rx="3" fill="#CA133E"/></g></svg>`,
buzzer:`<svg viewBox="0 0 64 64"><g class="snd" fill="none" stroke="#CA133E" stroke-width="3" stroke-linecap="round"><path d="M52 18q8 14 0 28"/><path d="M58 10q14 22 0 44"/></g><g class="bz"><circle cx="28" cy="32" r="22" fill="#1a1a1a"/><circle cx="28" cy="32" r="7" fill="#F5F5F6"/><circle cx="28" cy="32" r="3" fill="#44444B"/><text x="12" y="20" font-size="10" font-weight="700" fill="#DC9F0E">+</text></g></svg>`};
const COMPS=[['motor','Motor','Washing machines · Robotics'],['bulb','Bulb','Produces light'],['heater','Heater','Turns heating on/off'],['valve','Water valve','Controls water flow'],['buzzer','Buzzer','Produces sound']];
class ActuatorLab extends Sim{
  get stepper(){return false;}
  css(){return `
.lab{position:relative;background:#fff;border:2px solid #CA133E;border-radius:16px;padding:10px;box-shadow:0 4px 10px rgba(202,19,62,.1);touch-action:pan-y;user-select:none;-webkit-user-select:none}
.board{display:grid;grid-template-columns:64px 1fr;gap:6px}
.pw{display:flex;flex-direction:column;align-items:center;gap:4px;padding-top:0}
.swb{border:0;background:none;padding:0;cursor:pointer;width:56px;height:36px}
.bat{width:46px}
.slots{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:44px}
.slot{aspect-ratio:1/1.1;border:2px dashed #F58AA0;border-radius:12px;background:#FDF5F6;position:relative;display:flex;align-items:flex-end;justify-content:center;font-size:10px;color:#CA133E;padding-bottom:3px;opacity:.9}
.slot.hot{background:#FDE8EC;border-color:#CA133E}
.tray{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:18px 0 0 70px;padding-top:10px;border-top:2px dashed #E7E7E9}
.tc{aspect-ratio:1/1.1;border-radius:12px;background:#F5F5F6}
.comp{position:absolute;z-index:4;cursor:grab;touch-action:none;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:left 220ms,top 220ms;border-radius:12px;background:#fff;border:2px solid #E7E7E9;box-shadow:0 3px 6px rgba(0,0,0,.12);padding:3px}
.comp.drag{cursor:grabbing;transition:none;z-index:9;box-shadow:0 8px 16px rgba(0,0,0,.25);border-color:#CA133E}
.comp svg{width:78%;height:auto;pointer-events:none;overflow:visible}
.comp .nm{font-size:10px;font-weight:700;line-height:1.1;margin-top:1px;pointer-events:none;text-align:center}
.wires{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2}
.w{fill:none;stroke:#6B6B73;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.w.live{stroke:#CA133E}.fl{fill:none;stroke:#DC9F0E;stroke-width:3;stroke-linecap:round;stroke-dasharray:1 10;animation:fl 500ms linear infinite}
@keyframes fl{to{stroke-dashoffset:-22}}
.info{margin-top:10px;font-size:13.5px;min-height:40px;text-align:center;color:#44444B}
.info b{color:#CA133E}
.hintt{text-align:center;font-size:12.5px;color:#6B6B73;margin-bottom:8px}
/* component effects */
.comp .rot{transform-origin:32px 32px}.comp.on .rot{animation:sp .5s linear infinite}@keyframes sp{to{transform:rotate(360deg)}}
.comp .glow{opacity:0}.comp .rays{opacity:0}.comp.on .glow{opacity:.95;filter:drop-shadow(0 0 8px #FFD54A)}.comp.on .rays{opacity:1}.comp.on .fil{stroke:#CA133E}
.comp .heat{opacity:0}.comp.on .heat{animation:ht 1s ease-in-out infinite}@keyframes ht{0%{opacity:0;transform:translateY(6px)}50%{opacity:1}100%{opacity:0;transform:translateY(-6px)}}
.comp.on .coilh{stroke:#EF4444;filter:drop-shadow(0 0 4px #EF4444)}
.comp .water{opacity:0}.comp.on .water{opacity:1}.comp.on .water path{animation:wt .4s linear infinite}@keyframes wt{to{stroke-dashoffset:-12}}
.comp .gate{transition:transform 300ms}.comp.on .gate{transform:translateY(-22px)}
.comp .wheel{transform-origin:32px 12px;transition:transform 300ms}.comp.on .wheel{transform:rotate(90deg)}
.comp .snd{opacity:0}.comp.on .snd{animation:sn .5s ease-in-out infinite alternate}@keyframes sn{from{opacity:.2}to{opacity:1}}
.comp.on .bz{animation:sh .12s linear infinite alternate}@keyframes sh{from{transform:translateX(-1px)}to{transform:translateX(1px)}}
button.re.gh{background:#fff;color:#CA133E;border:2px solid #CA133E;box-shadow:none;margin-left:8px}`;}
  html(){
    const sw=`<svg viewBox="0 0 56 36"><circle cx="8" cy="26" r="4" fill="#44444B"/><circle cx="48" cy="26" r="4" fill="#44444B"/><line id="lev" x1="8" y1="26" x2="44" y2="6" stroke="#CA133E" stroke-width="5" stroke-linecap="round" style="transition:all 200ms"/></svg>`;
    const bat=`<svg viewBox="0 0 46 96" class="bat"><rect x="14" y="2" width="18" height="8" fill="#DC9F0E"/><rect x="3" y="10" width="40" height="82" rx="6" fill="#1a1a1a"/><rect x="3" y="10" width="40" height="30" rx="6" fill="#CA133E"/><text x="23" y="30" font-size="14" font-weight="800" fill="#fff" text-anchor="middle" font-family="Poppins,sans-serif">9V</text><text x="23" y="62" font-size="18" fill="#DC9F0E" text-anchor="middle" font-weight="700">+</text><text x="23" y="84" font-size="18" fill="#bdbdc2" text-anchor="middle" font-weight="700">−</text></svg>`;
    return `<div class="wrap" id="root"><div class="hintt">Drag each component into a slot, then close the switch.</div>
<div class="lab" id="lab"><div class="board"><div class="pw"><button type="button" class="swb" id="swb" aria-label="Switch" aria-pressed="false">${sw}</button><div id="bat">${bat}</div></div>
<div class="slots" id="slots">${COMPS.map((c,i)=>`<div class="slot" data-i="${i}"></div>`).join('')}</div></div>
<div class="tray" id="tray">${COMPS.map(()=>'<div class="tc"></div>').join('')}</div>
<svg class="wires" id="wires"></svg>
${COMPS.map(([id,n],i)=>`<div class="comp" data-id="${id}" data-i="${i}" tabindex="0" role="button" aria-label="${n}">${IC[id]}<div class="nm">${n}</div></div>`).join('')}
</div>
<div class="info" id="info"></div>
<div class="act"><button class="re" id="re" type="button">↺ Reset</button></div></div>`;}
  init(){this.on=false;this.sl=COMPS.map(()=>-1);this.info='';
    this.$('swb').addEventListener('click',()=>{this.on=!this.on;this.layout();this.msg();});
    const lab=this.$('lab');
    this.r.querySelectorAll('.comp').forEach(el=>{
      el.addEventListener('pointerdown',e=>{e.preventDefault();this.drag(el,e);});
      el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();const i=+el.dataset.i;
        if(this.sl[i]<0){const free=[0,1,2,3,4].find(s=>!this.sl.includes(s));this.sl[i]=free;}else this.sl[i]=-1;this.layout();this.msg(i);}});});
    if(window.ResizeObserver){this.ro=new ResizeObserver(()=>this.layout());this.ro.observe(lab);}
    this.layout();this.msg();}
  connectedCallback(){super.connectedCallback();this.layout();setTimeout(()=>this.layout(),300);}
  disconnectedCallback(){super.disconnectedCallback();}
  rel(el){const a=el.getBoundingClientRect(),b=this.$('lab').getBoundingClientRect();return{x:a.left-b.left,y:a.top-b.top,w:a.width,h:a.height,cx:a.left-b.left+a.width/2,cy:a.top-b.top+a.height/2,r:a.right-b.left,b:a.bottom-b.top};}
  layout(){const lab=this.$('lab');if(!lab||!lab.offsetWidth)return;
    const slots=[...this.r.querySelectorAll('.slot')],tcs=[...this.r.querySelectorAll('.tc')];
    this.r.querySelectorAll('.comp').forEach((el,i)=>{if(el.classList.contains('drag'))return;
      const t=this.sl[i]>=0?this.rel(slots[this.sl[i]]):this.rel(tcs[i]);
      el.style.left=t.x+'px';el.style.top=t.y+'px';el.style.width=t.w+'px';el.style.height=t.h+'px';
      el.classList.toggle('on',this.on&&this.sl[i]>=0);});
    slots.forEach((s,i)=>s.classList.toggle('hot',this.sl.includes(i)));
    this.$('lev').setAttribute('x2',this.on?44:44);this.$('lev').setAttribute('y2',this.on?26:6);this.$('swb').setAttribute('aria-pressed',this.on);
    this.wires(slots);}
  wires(slots){const sv=this.$('wires'),sw=this.rel(this.$('swb')),bt=this.rel(this.$('bat')),R=slots.map(s=>this.rel(s));
    const top=R[0].y-18,bot=R[0].b+18,xr=R[4].cx;const busy=this.sl.some(s=>s>=0),live=this.on&&busy;
    const swOut={x:sw.x+sw.w*(48/56),y:sw.y+sw.h*(26/36)},swIn={x:sw.x+sw.w*(8/56),y:sw.y+sw.h*(26/36)};
    const batT={x:bt.cx,y:bt.y+2},batB={x:bt.cx,y:bt.b-2};
    const P=[];const add=(d,l)=>P.push([d,l]);
    add(`M${batT.x} ${batT.y}V${swIn.y}H${swIn.x}`,this.on&&busy);
    add(`M${swOut.x} ${swOut.y}V${top}H${xr}`,live);
    add(`M${batB.x} ${batB.y}V${bot}H${xr}`,live);
    R.forEach((r,i)=>{const on=this.sl.includes(i)&&this.on;add(`M${r.cx} ${top}V${r.y+2}`,on);add(`M${r.cx} ${r.b-2}V${bot}`,on);});
    sv.innerHTML=P.map(([d,l])=>`<path class="w${l?' live':''}" d="${d}"/>${l?`<path class="fl" d="${d}"/>`:''}`).join('')+
     R.map(r=>`<circle cx="${r.cx}" cy="${r.y}" r="3.5" fill="#44444B"/><circle cx="${r.cx}" cy="${r.b}" r="3.5" fill="#44444B"/>`).join('');}
  msg(i){const n=this.sl.filter(s=>s>=0).length;let t;
    if(i!=null&&this.sl[i]>=0){const c=COMPS[i];t=`<b>${c[1]}</b> — ${c[2]}`+(this.on?'':'. Close the switch to complete the circuit.');}
    else if(!n)t=this.on?'Switch closed, but there is nothing in the circuit yet.':'Switch open — no current flows.';
    else t=this.on?`Circuit complete — current flows through ${n} component${n>1?'s':''}.`:'Switch open — no current flows. Click the switch to close it.';
    this.$('info').innerHTML=t;}
  drag(el,e){const i=+el.dataset.i,lab=this.$('lab'),lr=lab.getBoundingClientRect(),er=el.getBoundingClientRect();
    const ox=e.clientX-er.left,oy=e.clientY-er.top;el.classList.add('drag');el.setPointerCapture(e.pointerId);
    const mv=ev=>{el.style.left=(ev.clientX-lr.left-ox)+'px';el.style.top=(ev.clientY-lr.top-oy)+'px';
      const c=this.rel(el);this.r.querySelectorAll('.slot').forEach((s,k)=>{const q=this.rel(s);s.classList.toggle('hot',Math.hypot(q.cx-c.cx,q.cy-c.cy)<q.w*.8||this.sl.includes(k));});};
    const up=ev=>{el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);
      el.classList.remove('drag');const c=this.rel(el);let best=-1,bd=1e9;
      this.r.querySelectorAll('.slot').forEach((s,k)=>{const q=this.rel(s),d=Math.hypot(q.cx-c.cx,q.cy-c.cy);if(d<bd&&d<q.w*.9){bd=d;best=k;}});
      if(best>=0){const other=this.sl.indexOf(best);if(other>=0&&other!==i)this.sl[other]=this.sl[i];this.sl[i]=best;}else this.sl[i]=-1;
      this.layout();this.msg(i);};
    el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);}
  play(){this.sl=COMPS.map(()=>-1);this.on=false;this.layout();this.msg();}
  connectedCallback2(){}
  final(){this.sl=[0,1,2,3,4];this.on=true;this.layout();this.msg();this.started=true;}
}

/* ---------------- shared defs for skeuomorphic storage sims ---------------- */
const DEFS=`<defs>
<linearGradient id="gSteel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F5F5F6"/><stop offset=".5" stop-color="#bdbdc2"/><stop offset="1" stop-color="#8a8a93"/></linearGradient>
<linearGradient id="gDark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a1a1a"/><stop offset="1" stop-color="#3a1a1a"/></linearGradient>
<linearGradient id="gBrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2C14E"/><stop offset=".55" stop-color="#DC9F0E"/><stop offset="1" stop-color="#9a6c06"/></linearGradient>
<linearGradient id="gCrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EE6E89"/><stop offset=".5" stop-color="#CA133E"/><stop offset="1" stop-color="#A01030"/></linearGradient>
<radialGradient id="gPlat" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#E7E7E9"/><stop offset="1" stop-color="#9a9aa3"/></radialGradient>
<linearGradient id="gTape" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a2f2f"/><stop offset="1" stop-color="#2a1414"/></linearGradient>
<filter id="fDrop" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="1" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".35"/></filter>
</defs>`;
const SCREW=(x,y,r=6)=>`<g><circle cx="${x}" cy="${y}" r="${r}" fill="url(#gSteel)" stroke="#44444B"/><line x1="${x-r*.6}" y1="${y-r*.3}" x2="${x+r*.6}" y2="${y+r*.3}" stroke="#44444B" stroke-width="1.5"/></g>`;
const STEPS_CSS=`
.grid{display:grid;grid-template-columns:1.5fr 1fr;gap:12px;align-items:start}
.stage{background:#fff;border:2px solid #CA133E;border-radius:16px;padding:8px;box-shadow:0 4px 10px rgba(202,19,62,.1)}
.stage+.stage{margin-top:12px}
svg.s{width:100%;display:block;border-radius:10px}
.steps{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.steps li{text-align:left;background:#fff;border:2px solid #E7E7E9;border-radius:12px;padding:8px 10px 8px 38px;font-size:13px;line-height:1.4;position:relative;opacity:.5;transition:all 200ms}
.steps li:before{content:attr(data-n);position:absolute;left:9px;top:8px;width:21px;height:21px;border-radius:50%;background:#E7E7E9;color:#44444B;font-weight:700;font-size:12px;line-height:21px;text-align:center}
.steps li.cur{border-color:#CA133E;background:#FDE8EC;opacity:1}.steps li.cur:before{background:#CA133E;color:#fff}.steps li.done{opacity:1}
.steps li.done:before{background:#16B981;color:#fff}
@container (max-width:600px){.grid{grid-template-columns:1fr}}`;
const stepsOl=a=>`<ol class="steps" id="steps">${a.map((t,i)=>`<li data-n="${i+1}">${t}</li>`).join('')}</ol>`;
const SV='http://www.w3.org/2000/svg';
const sv=(t,at)=>{const e=document.createElementNS(SV,t);for(const k in at)e.setAttribute(k,at[k]);return e;};

/* ---------------- HDD mechanism ---------------- */
const HC={x:210,y:185},HP={x:292,y:372},HL=170,HR=150;
class HddDemo extends Sim{
  meta(){return {n:3,labels:['Actuator moves the arm','Arm swings the head across the platter','Head reads the magnetic data']};}
  css(){return STEPS_CSS+`
.coilg{transition:filter 300ms}.s1 .coilg,.s2 .coilg{filter:drop-shadow(0 0 6px #DC9F0E)}
.mag{transition:filter 300ms}.s1 .mag{filter:drop-shadow(0 0 5px #CA133E)}
.spin{transform-origin:${HC.x}px ${HC.y}px;animation:spn 2.2s linear infinite;animation-play-state:paused}
.go .spin{animation-play-state:running}
@keyframes spn{to{transform:rotate(360deg)}}
.armg{transition:transform 900ms cubic-bezier(.45,0,.25,1)}
.cur2{opacity:0;transition:opacity 300ms}.s3 .cur2{opacity:1}
.hd{transition:filter 300ms}.s3 .hd{filter:drop-shadow(0 0 5px #16B981)}
.readout{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:15px;letter-spacing:3px;background:linear-gradient(135deg,#1a1a1a,#3a1a1a);color:#DC9F0E;border-radius:8px;padding:6px 10px;margin-top:8px;min-height:32px;text-align:center}
.lbl{font-size:12px;font-weight:700;color:#CA133E;text-align:center;margin-bottom:4px}
.inset{display:none}.inset.on{display:block}`;}
  html(){
    let tracks='';for(let r=62;r<=150;r+=11)tracks+=`<circle cx="${HC.x}" cy="${HC.y}" r="${r}" fill="none" stroke="#9a9aa3" stroke-opacity=".5"/>`;
    return `<div class="wrap" id="root"><div class="grid"><div>
<div class="stage"><svg class="s" id="svg" viewBox="0 0 420 500" role="img" aria-label="Hard disk drive mechanism">${DEFS}
<rect x="6" y="6" width="408" height="488" rx="22" fill="url(#gDark)" filter="url(#fDrop)"/><rect x="14" y="14" width="392" height="472" rx="16" fill="none" stroke="#6B6B73" stroke-width="2"/>
${SCREW(34,34)}${SCREW(386,34)}${SCREW(34,466)}${SCREW(386,466)}${SCREW(386,250)}${SCREW(34,250)}
<circle cx="${HC.x}" cy="${HC.y}" r="${HR+14}" fill="#44444B"/><circle cx="${HC.x}" cy="${HC.y}" r="${HR+9}" fill="url(#gPlat)"/>
<g class="spin" id="plat">${tracks}<path d="M${HC.x} ${HC.y}L${HC.x+HR} ${HC.y}A${HR} ${HR} 0 0 0 ${HC.x+HR*.5} ${HC.y-HR*.87}Z" fill="#fff" opacity=".5"/><path d="M${HC.x} ${HC.y}L${HC.x-HR} ${HC.y}A${HR} ${HR} 0 0 0 ${HC.x-HR*.5} ${HC.y+HR*.87}Z" fill="#fff" opacity=".5"/>
 <circle cx="${HC.x}" cy="${HC.y}" r="40" fill="url(#gSteel)" stroke="#6B6B73"/>${[0,60,120,180,240,300].map(a=>`<circle cx="${HC.x+27*Math.cos(a*Math.PI/180)}" cy="${HC.y+27*Math.sin(a*Math.PI/180)}" r="3.5" fill="#6B6B73"/>`).join('')}<circle cx="${HC.x}" cy="${HC.y}" r="12" fill="url(#gSteel)" stroke="#44444B"/><circle cx="${HC.x}" cy="${HC.y}" r="4" fill="#44444B"/></g>
<!-- magnet plates -->
<g transform="translate(${HP.x} ${HP.y}) rotate(${Math.atan2(HC.y-HP.y,HC.x-HP.x)*180/Math.PI+180})"><g class="mag" id="mag"><rect x="24" y="-66" width="84" height="18" rx="3" fill="url(#gSteel)" stroke="#44444B"/><rect x="24" y="48" width="84" height="18" rx="3" fill="url(#gSteel)" stroke="#44444B"/><rect x="106" y="-68" width="10" height="136" rx="3" fill="#6B6B73"/><text x="66" y="-53" font-size="11" font-weight="800" fill="#CA133E" text-anchor="middle" font-family="Poppins,sans-serif">N</text><text x="66" y="61" font-size="11" font-weight="800" fill="#2563EB" text-anchor="middle" font-family="Poppins,sans-serif">S</text></g></g>
<!-- PCB + cable -->
<rect x="28" y="404" width="170" height="64" rx="8" fill="url(#gCrim)" stroke="#7a0b27" filter="url(#fDrop)"/>
<rect x="44" y="418" width="26" height="20" rx="2" fill="#1a1a1a"/><rect x="80" y="418" width="40" height="20" rx="2" fill="#1a1a1a"/><rect x="132" y="420" width="18" height="14" rx="2" fill="#44444B"/>${[0,1,2,3,4,5,6].map(i=>`<rect x="${44+i*16}" y="448" width="8" height="10" fill="url(#gBrass)"/>`).join('')}
<path d="M198 436 C 240 436, 250 420, 268 396" fill="none" stroke="#6B3A2A" stroke-width="7" stroke-linecap="round"/>
<!-- arm -->
<g id="arm" transform="translate(${HP.x} ${HP.y})"><g class="armg" id="armr" style="transform:rotate(0deg)">
 <g class="coilg" id="coil"><rect x="-86" y="-24" width="70" height="48" rx="8" fill="url(#gBrass)" stroke="#7a5606" filter="url(#fDrop)"/>${[0,1,2,3,4,5].map(i=>`<line x1="${-80+i*10}" y1="-22" x2="${-80+i*10}" y2="22" stroke="#7a5606" stroke-width="2"/>`).join('')}</g>
 <polygon points="-18,-14 ${HL},-4 ${HL},4 -18,14" fill="url(#gSteel)" stroke="#44444B" filter="url(#fDrop)"/><circle cx="60" cy="0" r="4" fill="#44444B"/><circle cx="110" cy="0" r="3" fill="#44444B"/>
 <g class="hd" id="head"><rect x="${HL-10}" y="-8" width="22" height="16" rx="3" fill="url(#gDark)" stroke="#6B6B73"/><rect x="${HL+2}" y="-3" width="7" height="6" rx="1" fill="#16B981"/></g></g>
 <circle r="16" fill="url(#gSteel)" stroke="#44444B" filter="url(#fDrop)"/><circle r="6" fill="#44444B"/></g>
<circle class="cur2" id="spot" cx="${HC.x}" cy="${HC.y}" r="9" fill="none" stroke="#16B981" stroke-width="3"/>
</svg></div>
<div class="stage inset" id="ins"><div class="lbl">Read/write head and the magnetic data on the platter</div>
<svg class="s" id="isv" viewBox="0 0 420 120" style="background:linear-gradient(135deg,#1a1a1a,#3a1a1a)"><g id="strip"></g>
 <g id="hh"><rect x="188" y="14" width="44" height="46" rx="6" fill="url(#gSteel)" stroke="#44444B" stroke-width="2"/><rect x="198" y="22" width="12" height="30" fill="#CA133E"/><rect x="210" y="22" width="12" height="30" fill="#2563EB"/><polygon points="196,60 224,60 210,72" fill="#16B981"/></g></svg>
<div class="readout" id="ro"></div></div></div>
${stepsOl(['Actuators moves the (read/write) Arm','A (read/write) arm swings the (read/write) head back and forth across the platter','Each (read/write) head contains a tiny magnet which reads the data on the platter'])}</div>
<div class="act"><button class="re" id="re" type="button">▶ Replay</button></div></div>`;}
  init(){this.bits=[1,0,1,1,0,0,1,0,1,0,0,1,1,0,1,0,0,1,0,1,1,0,0,1];this.W=34;
    const st=this.$('strip');this.bits.forEach((b,i)=>{const x=i*this.W;st.appendChild(this.dom(x,b));});this.pos=0;
    // angle lookup
    const pc=Math.atan2(HC.y-HP.y,HC.x-HP.x),d=Math.hypot(HC.x-HP.x,HC.y-HP.y);
    this.ang=r=>{const c=(HL*HL+d*d-r*r)/(2*HL*d);const th=Math.acos(Math.max(-1,Math.min(1,c)));return (pc-th)*180/Math.PI;};
    this.angPC=pc*180/Math.PI;}
  dom(x,b){const g=sv('g',{});g.appendChild(sv('rect',{x:x+192,y:84,width:this.W-3,height:26,rx:3,fill:'#44444B'}));
    g.appendChild(sv('rect',{x:x+194,y:86,width:(this.W-7)/2,height:22,fill:b?'#CA133E':'#2563EB'}));g.appendChild(sv('rect',{x:x+194+(this.W-7)/2,y:86,width:(this.W-7)/2,height:22,fill:b?'#2563EB':'#CA133E'}));return g;}
  rot(a){this.$('armr').style.transform=`rotate(${a-this.angPC}deg)`;
    // rotation is relative to arm drawn along +x; arm points initially along +x, so need absolute angle
    }
  setArm(a){this.$('armr').style.transform=`rotate(${a}deg)`;const t=a*Math.PI/180;this.tip={x:HP.x+HL*Math.cos(t),y:HP.y+HL*Math.sin(t)};const sp=this.$('spot');sp.setAttribute('cx',this.tip.x);sp.setAttribute('cy',this.tip.y);}
  reset(){this.clear();this.root.classList.remove('noanim');const s=this.$('svg');s.setAttribute('class','s');this.$('ins').classList.remove('on');
    this.r.querySelectorAll('#steps li').forEach(l=>l.classList.remove('cur','done'));this.$('ro').textContent='';this.$('strip').setAttribute('transform','translate(0,0)');this.$('strip').style.transition='none';this.pos=0;
    this.$('armr').style.transition='none';this.setArm(this.ang(150));void this.$('armr').getBoundingClientRect();this.$('armr').style.transition='';}
  step(n){this.$('svg').setAttribute('class','s '+[1,2,3].filter(i=>i<=n).map(i=>'s'+i).join(' ')+' go');
    this.r.querySelectorAll('#steps li').forEach((l,i)=>{l.classList.toggle('cur',i===n-1);l.classList.toggle('done',i<n-1);});}
  play(){this.reset();this.$('svg').setAttribute('class','s go');
    this.gate(400);this.at(400,()=>{this.step(1);this.setArm(this.ang(130));});
    this.gate(1600);this.at(1600,()=>{this.step(2);this.setArm(this.ang(55));});
    this.at(2700,()=>this.setArm(this.ang(145)));
    this.at(3800,()=>this.setArm(this.ang(70)));
    this.gate(4900);this.at(4900,()=>{this.step(3);this.setArm(this.ang(105));this.$('ins').classList.add('on');this.read();});}
  read(){let i=0;const n=12,st=this.$('strip');
    const tick=()=>{if(i>=n){this.r.querySelectorAll('#steps li').forEach(l=>{l.classList.remove('cur');l.classList.add('done');});this.busy(false);return;}
      this.$('ro').textContent+=(this.$('ro').textContent?' ':'')+this.bits[i+0];i++;st.style.transition='transform 380ms linear';st.setAttribute('transform',`translate(${-this.W*i},0)`);this.at(430,tick);};
    this.at(500,tick);}
  final(){this.reset();this.root.classList.add('noanim');this.step(3);this.r.querySelectorAll('#steps li').forEach(l=>{l.classList.remove('cur');l.classList.add('done');});
    this.setArm(this.ang(105));this.$('ins').classList.add('on');this.$('ro').textContent=this.bits.slice(0,12).join(' ');this.busy(false);this.started=true;}
}

/* ---------------- CD ---------------- */
const CDC={x:190,y:190},CDR=172;
const PAT='0001000010000010010010000100000100010000';
class CdDemo extends Sim{
  meta(){return {n:5,labels:['Pits and lands on the spiral track','Red laser beamed to the CD','Pit depth and land length','Interference','Converted into binary']};}
  css(){return STEPS_CSS+`
.spin{transform-origin:${CDC.x}px ${CDC.y}px;animation:spn 2.4s linear infinite;animation-play-state:paused}
.go .spin{animation-play-state:running}@keyframes spn{to{transform:rotate(360deg)}}
.trk{fill:none;stroke:#CA133E;stroke-width:1.6;opacity:.85}
.sled{opacity:0;transition:opacity 400ms}.s2 .sled{opacity:1}
.beam{opacity:0}.s2 .beam{opacity:1;animation:bm 600ms ease-in-out infinite alternate}@keyframes bm{from{opacity:.55}to{opacity:1}}
.lens{opacity:0;transition:opacity 300ms}.mg .lens{opacity:1}
.big{opacity:0;transition:opacity 300ms}.mg .big{opacity:1}
.arr{opacity:0;transition:opacity 300ms}.mg .arr{opacity:1}
.cdbox{position:relative}.mgbtn{position:absolute;top:10px;right:10px;z-index:2;font-family:'JumperSafe','Poppins',sans-serif;font-weight:700;font-size:14px;border:2px solid #CA133E;background:#fff;color:#CA133E;border-radius:999px;padding:7px 16px;cursor:pointer}
.mgbtn.on{background:#CA133E;color:#fff}
.btns{display:flex;justify-content:center;gap:8px;margin-top:14px}
.prof{opacity:.35;transition:opacity 300ms}.p3 .prof,.p4 .prof,.p5 .prof{opacity:1}
.dim{opacity:0;transition:opacity 300ms}.p3 .dim{opacity:1}
.refl{opacity:0}.p4 .refl,.p5 .refl{opacity:1}
.bitsr{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:15px;letter-spacing:2.5px;background:linear-gradient(135deg,#1a1a1a,#3a1a1a);color:#DC9F0E;border-radius:8px;padding:6px 8px;margin-top:6px;min-height:30px;overflow:hidden;white-space:nowrap}
.bitsr b{color:#fff}
.sig{margin-top:4px;font-size:12px;font-weight:700;text-align:center;color:#44444B;min-height:18px}
.sig b{color:#CA133E}`;}
  html(){
    // spiral
    let d='';const turns=13,r0=48,r1=164,N=turns*60;for(let i=0;i<=N;i++){const a=i/60*2*Math.PI,r=r0+(r1-r0)*i/N;d+=(i?'L':'M')+(CDC.x+r*Math.cos(a)).toFixed(1)+' '+(CDC.y+r*Math.sin(a)).toFixed(1);}
    this.spiral=d;
    // profile
    let p='',x=14,hi=true,pits='';const CW=17;let state=true;let lx=0;const ys={hi:34,lo:66};p=`M0 ${ys.hi}`;
    [...PAT].forEach((b,i)=>{if(b==='1'){const px=14+i*CW;p+=`H${px}V${state?ys.lo:ys.hi}`;state=!state;}});p+=`H${14+PAT.length*CW}`;
    // pit rects
    state=true;let start=0;const rects=[];[...PAT].forEach((b,i)=>{if(b==='1'){if(state){start=14+i*CW;}else rects.push([start,14+i*CW]);state=!state;}});if(!state)rects.push([start,14+PAT.length*CW]);
    pits=rects.map(([a,b])=>`<rect x="${a}" y="74" width="${b-a}" height="10" fill="#F58AA0" rx="2"/>`).join('');
    this.CW=CW;this.prof=p;this.rects=rects;
    const rows=[0,1,2,3].map(r=>{let o='';let x=r*13-10;const L=[40,24,56,30,44,26,52,34,22,48];for(let k=0;k<10;k++){const w=L[(k+r*3)%10];o+=`<path d="M${x} ${300-r*0+ (r*0)} " />`;x+=w+28;}return o;});
    let pit='';const rowY=[128,160,192,224];const lens=[[26,50,34],[46,30,58],[30,56,36],[52,34,44]];
    rowY.forEach((y,r)=>{let x=300+r*12;for(let rep=0;rep<4;rep++)lens[r].forEach(w=>{pit+=`<path d="M${x+14} ${y} h${w} l-14 18 h-${w} Z" fill="#fff" stroke="#bdbdc2" stroke-width="1"/>`;x+=w+30;});});
    return `<div class="wrap" id="root"><div class="grid"><div>
<div class="stage cdbox"><button type="button" class="mgbtn" id="mg" aria-pressed="false">🔍 Magnify</button><svg class="s" id="svg" viewBox="0 0 600 380" role="img" aria-label="CD with spiral track and magnifier" style="background:#F5F5F6">${DEFS}
<defs><clipPath id="bigc"><circle cx="430" cy="190" r="118"/></clipPath><radialGradient id="gCD" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#E7E7E9"/><stop offset="1" stop-color="#bdbdc2"/></radialGradient>
<linearGradient id="gSlab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E7E7E9"/><stop offset="1" stop-color="#9a9aa3"/></linearGradient></defs>
<circle cx="${CDC.x}" cy="${CDC.y}" r="${CDR+6}" fill="#44444B" filter="url(#fDrop)"/><circle cx="${CDC.x}" cy="${CDC.y}" r="${CDR}" fill="url(#gCD)"/>
<g class="spin" id="cd"><path id="sp" class="trk" d="${d}"/><circle cx="${CDC.x}" cy="${CDC.y}" r="40" fill="#E7E7E9" stroke="#9a9aa3" stroke-width="5"/><path d="M${CDC.x} ${CDC.y}L${CDC.x+CDR} ${CDC.y}A${CDR} ${CDR} 0 0 0 ${CDC.x+CDR*.5} ${CDC.y-CDR*.87}Z" fill="#fff" opacity=".45"/><path d="M${CDC.x} ${CDC.y}L${CDC.x-CDR} ${CDC.y}A${CDR} ${CDR} 0 0 0 ${CDC.x-CDR*.5} ${CDC.y+CDR*.87}Z" fill="#fff" opacity=".45"/></g>
<circle cx="${CDC.x}" cy="${CDC.y}" r="20" fill="#F5F5F6" stroke="#44444B" stroke-width="2"/>
<g class="sled" id="sled"><rect x="178" y="244" width="24" height="90" rx="6" fill="url(#gSteel)" stroke="#44444B" filter="url(#fDrop)"/><circle cx="190" cy="244" r="11" fill="url(#gDark)" stroke="#44444B" stroke-width="2"/><circle class="beam" cx="190" cy="244" r="16" fill="#EF4444" opacity=".35" style="filter:blur(3px)"/><circle class="beam" cx="190" cy="244" r="5" fill="#EF4444" style="filter:drop-shadow(0 0 6px #EF4444)"/></g>
<g class="lens" id="lens"><circle cx="300" cy="100" r="34" fill="rgba(255,255,255,.35)" stroke="#CA133E" stroke-width="5"/><line x1="324" y1="124" x2="346" y2="146" stroke="#CA133E" stroke-width="8" stroke-linecap="round"/></g>
<path class="arr" d="M332 98 C 360 60, 390 60, 408 74" fill="none" stroke="#44444B" stroke-width="5" stroke-linecap="round"/><polygon class="arr" points="402,60 424,80 396,88" fill="#44444B"/>
<g class="big"><circle cx="430" cy="190" r="122" fill="#fff" stroke="#44444B" stroke-width="3"/><g clip-path="url(#bigc)"><rect x="300" y="110" width="260" height="160" fill="#F5F5F6"/>
 <path d="M330 120 Q430 96 540 120 L560 250 Q430 282 310 250 Z" fill="url(#gSlab)" stroke="#6B6B73"/><g class="pitrows">${pit}</g><path d="M310 250 Q430 282 560 250 L560 262 Q430 296 310 262 Z" fill="#6B6B73"/></g>
 <text x="430" y="328" font-size="17" font-weight="700" text-anchor="middle" fill="#1A1A1A" font-family="Poppins,sans-serif" opacity="0" class="arr">pits and lands</text></g>
</svg></div>
<div class="stage" id="pst" style="display:none"><svg class="s" id="psv" viewBox="0 0 700 150" style="background:linear-gradient(135deg,#1a1a1a,#3a1a1a)" role="img" aria-label="pits and lands profile">
 <g class="prof"><path d="${p.replace(/H(\d+(?:\.\d+)?)/g,(m,v)=>'H'+(+v*1+14))}" transform="translate(0,12)" fill="none" stroke="#fff" stroke-width="3"/>
 <g transform="translate(0,12)">${pits}</g></g>
 <g class="dim" fill="#F58AA0" font-size="13" font-weight="700" font-family="Poppins,sans-serif"><text x="${14+CW*2}" y="20" text-anchor="middle">Land</text><text x="${(this.rects[0][0]+this.rects[0][1])/2}" y="120" text-anchor="middle" fill="#F58AA0">Pit</text></g>
 <g class="dim" stroke="#DC9F0E" stroke-width="2"><line x1="${14+CW*10}" y1="46" x2="${14+CW*10}" y2="78"/><polygon points="${14+CW*10-4},50 ${14+CW*10+4},50 ${14+CW*10},44" fill="#DC9F0E"/><polygon points="${14+CW*10-4},74 ${14+CW*10+4},74 ${14+CW*10},80" fill="#DC9F0E"/></g>
 <text class="dim" x="${14+CW*10+8}" y="66" fill="#DC9F0E" font-size="12" font-weight="700" font-family="Poppins,sans-serif">depth</text>
 <g class="dim" stroke="#DC9F0E" stroke-width="2"><line x1="${14+CW*15}" y1="108" x2="${14+CW*17}" y2="108"/></g><text class="dim" x="${14+CW*18.2}" y="112" fill="#DC9F0E" font-size="12" font-weight="700" font-family="Poppins,sans-serif">length</text>
 <g id="pb" style="transform:translate(14px,0);transition:transform 90ms linear"><line x1="0" y1="2" x2="0" y2="40" stroke="#EF4444" stroke-width="4" stroke-linecap="round" style="filter:drop-shadow(0 0 4px #EF4444)"/><g class="refl" id="rf"><path d="M7 38 L7 8" stroke="#EF4444" stroke-width="3" stroke-dasharray="3 3"/><polygon points="3,12 11,12 7,4" fill="#EF4444"/></g></g>
</svg><div class="bitsr mono" id="br"></div><div class="sig" id="sg"></div></div>
</div>${stepsOl(['Data is stored in pits and lands on the spiral track','Red laser is Beamed to the CD','Each pit has a certain depth and land has a certain length','The change of depth &amp; length cause interferance','Which convert this difference into binary'])}</div>
<div class="btns"><button class="re" id="re" type="button">▶ Replay</button></div></div>`;}
  init(){this.mg=false;this.$('mg').onclick=()=>this.magnify(!this.mg);}
  magnify(on){this.mg=on;this.$('svg').classList.toggle('mg',on);this.$('mg').classList.toggle('on',on);this.$('mg').setAttribute('aria-pressed',on);}
  reset(){this.clear();this.root.classList.remove('noanim');const s=this.$('svg');s.setAttribute('class','s');this.magnify(false);this.$('pst').style.display='none';
    this.$('psv').setAttribute('class','s');this.r.querySelectorAll('#steps li').forEach(l=>l.classList.remove('cur','done'));this.$('br').innerHTML='';this.$('sg').innerHTML='';
    const sp=this.$('sp');sp.style.transition='none';sp.style.strokeDasharray='none';this.$('sled').style.transition='none';this.$('sled').style.transform='translate(0,0)';this.$('pb').style.transform='translate(14px,0)';}
  step(n){const s=this.$('svg');s.classList.add('go');for(let i=1;i<=5;i++)s.classList.toggle('s'+i,i<=Math.min(n,2));
    this.$('psv').setAttribute('class','s '+[3,4,5].filter(i=>i<=n).map(i=>'p'+i).join(' '));
    this.r.querySelectorAll('#steps li').forEach((l,i)=>{l.classList.toggle('cur',i===n-1);l.classList.toggle('done',i<n-1);});}
  scan(bits,ms,done){const CW=this.CW,n=PAT.length;let i=0;const pb=this.$('pb'),rf=this.$('rf');
    const tick=()=>{if(i>=n){done&&done();return;}
      const x=14+i*CW+CW/2;pb.style.transform=`translate(${x}px,0)`;
      // surface state at cell i
      let st=true;for(let k=0;k<=i;k++)if(PAT[k]==='1')st=!st;const inPit=!st;
      pb.firstElementChild.setAttribute('y2',inPit?72:40);rf.style.opacity=inPit?.12:1;
      if(bits){const b=PAT[i];this.$('br').innerHTML=[...PAT.slice(0,i+1)].map((c,j)=>c==='1'?`<b>1</b>`:'0').join('');
        this.$('sg').innerHTML=b==='1'?'Change between land and pit → <b>1</b>':'No change → <b>0</b>';}
      else this.$('sg').innerHTML=inPit?'Pit: reflected light is <b>cancelled</b> (interference)':'Land: light is <b>reflected</b> back';
      i++;this.at(ms,tick);};tick();}
  play(){this.reset();const sp=this.$('sp');
    this.gate(300);this.at(300,()=>{this.step(1);const L=sp.getTotalLength();sp.style.strokeDasharray=L;sp.style.strokeDashoffset=L;void sp.getBoundingClientRect();sp.style.transition='stroke-dashoffset 2200ms ease-in-out';sp.style.strokeDashoffset=0;});
    this.gate(2900);this.at(2900,()=>{this.step(2);const sl=this.$('sled');sl.style.transition='opacity 400ms,transform 9000ms linear';sl.style.transform='translate(0,104px)';});
    this.gate(4600);this.at(4600,()=>{this.step(3);this.$('pst').style.display='';this.magnify(true);});
    this.gate(7600);this.at(7600,()=>{this.step(4);this.$('br').innerHTML='';this.scan(false,95,()=>{this.gate(400);this.at(400,()=>{this.step(5);this.$('pb').style.transform='translate(14px,0)';this.scan(true,120,()=>{this.r.querySelectorAll('#steps li').forEach(l=>{l.classList.remove('cur');l.classList.add('done');});this.busy(false);});});});});}
  final(){this.reset();this.root.classList.add('noanim');this.step(5);this.r.querySelectorAll('#steps li').forEach(l=>{l.classList.remove('cur');l.classList.add('done');});
    this.$('svg').setAttribute('class','s s1 s2 mg');this.magnify(true);this.$('pst').style.display='';this.$('br').innerHTML=[...PAT].map(c=>c==='1'?'<b>1</b>':'0').join('');this.$('sg').innerHTML='Change between land and pit → <b>1</b>';this.busy(false);this.started=true;}
}


/* ---------------- Serial vs Direct access game ---------------- */
const NOTE_ROWS=[['Serial / sequential','Files accessed one by one — must pass every file to reach the target','Very slow'],['Direct / random','Data accessed directly without passing other files','Much faster']];
const PIV={x:336,y:338},ACX=190,ACY=190;
class AccessDemo extends Sim{
  get stepper(){return false;}
  css(){return `
.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}
.pn{background:#fff;border:2px solid #CA133E;border-radius:16px;padding:10px;box-shadow:0 4px 10px rgba(202,19,62,.1);text-align:center}
.pn h3{margin:0 0 8px;font-size:15px;font-weight:700}
.rw{display:flex;gap:8px;align-items:center;justify-content:center;margin:6px 0}
.key{font-family:'JumperSafe','Poppins',sans-serif;font-weight:700;font-size:13px;color:#fff;background:linear-gradient(#EE6E89,#CA133E);border:0;border-radius:10px;padding:8px 14px;cursor:pointer;box-shadow:0 3px 0 #A01030,0 5px 8px rgba(0,0,0,.2);touch-action:manipulation}
.key:active{transform:translateY(2px);box-shadow:0 1px 0 #A01030}
.key:disabled{opacity:.45;cursor:default}
.key.alt{background:linear-gradient(#F2C14E,#DC9F0E);box-shadow:0 3px 0 #9a6c06,0 5px 8px rgba(0,0,0,.2)}
.lcd{flex:1;background:linear-gradient(135deg,#1a1a1a,#3a1a1a);color:#DC9F0E;border-radius:8px;padding:7px 10px;font-family:ui-monospace,Menlo,Consolas,monospace;font-weight:700;font-size:14px;letter-spacing:1px;box-shadow:inset 0 2px 6px rgba(0,0,0,.6)}
svg.art{width:100%;display:block}
.win{position:relative;height:50px;overflow:hidden;background:linear-gradient(135deg,#1a1a1a,#3a1a1a);border-radius:10px;margin-top:8px;box-shadow:inset 0 2px 6px rgba(0,0,0,.6)}
.mk{position:absolute;left:50%;top:0;bottom:0;width:3px;margin-left:-1px;background:#EF4444;z-index:2;box-shadow:0 0 6px #EF4444}
.reel{position:absolute;left:0;top:8px;display:flex;gap:8px;transition:transform 130ms linear}
.fl{flex:none;width:56px;height:34px;border-radius:6px;background:linear-gradient(#F5F5F6,#bdbdc2);color:#44444B;font-weight:700;font-size:13px;line-height:34px;box-shadow:0 2px 0 #6B6B73}
.fl.now{background:linear-gradient(#F2C14E,#DC9F0E);color:#fff}
.st{font-size:13px;color:#44444B;margin:8px 0 0}.st b{color:#CA133E}
.ms{font-size:13px;font-weight:700;color:#059669;margin-top:6px}
.led{display:inline-block;width:12px;height:12px;border-radius:50%;background:#6B6B73;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}.led.g{background:#16B981;box-shadow:0 0 8px #16B981}
.sec circle{fill:#fff;stroke:#6B6B73;stroke-width:1;cursor:pointer;transition:fill 150ms}.sec text{font-size:7px;font-weight:700;fill:#44444B;pointer-events:none;font-family:Poppins,sans-serif}
.sec:hover circle{fill:#FDE8EC}.sec.hit circle{fill:#16B981}.sec.hit text{fill:#fff}.sec.miss circle{fill:#F58AA0}
.off .sec circle{cursor:default;opacity:.6}.off .sec:hover circle{fill:#fff}
.spin{transform-origin:${ACX}px ${ACY}px;animation:spn 3s linear infinite}@keyframes spn{to{transform:rotate(360deg)}}
.res{margin-top:12px;background:#fff;border:2px solid #CA133E;border-radius:16px;padding:10px 12px;display:none}
.res.on{display:block}
.res h3{margin:0 0 6px;font-size:15px}
table{width:100%;border-collapse:collapse;font-size:12.5px;text-align:left}th{background:#CA133E;color:#fff;padding:6px 8px}td{padding:6px 8px;border-bottom:1px solid #E7E7E9}
.sm{font-size:12px;color:#6B6B73;margin-top:6px}
@container (max-width:640px){.g2{grid-template-columns:1fr}}
`;}
  html(){
    return `<div class="wrap" id="root"><div class="g2">
<div class="pn"><h3>Round 1 · Magnetic tape</h3><div class="rw"><button class="key" id="ts" type="button">Start</button><div class="lcd" id="tt">PRESS START</div></div>
<svg class="art" viewBox="0 0 360 210">${DEFS}<rect x="4" y="4" width="352" height="202" rx="14" fill="url(#gDark)" stroke="#6B6B73" filter="url(#fDrop)"/>
<rect x="70" y="14" width="200" height="40" rx="8" fill="#0b0b0c"/><text x="80" y="39" fill="#F58AA0" font-family="Poppins,sans-serif" font-weight="700" font-size="10" letter-spacing="1">FILES PASSED</text>
<g font-family="ui-monospace,Menlo,monospace" font-weight="700" font-size="26" fill="#DC9F0E"><rect x="176" y="20" width="26" height="28" rx="3" fill="#1a1a1a"/><rect x="206" y="20" width="26" height="28" rx="3" fill="#1a1a1a"/><rect x="236" y="20" width="26" height="28" rx="3" fill="#1a1a1a"/><text id="d0" x="189" y="43" text-anchor="middle">0</text><text id="d1" x="219" y="43" text-anchor="middle">0</text><text id="d2" x="249" y="43" text-anchor="middle">0</text></g>
<path id="tp" d="" fill="none" stroke="#6B3A2A" stroke-width="4"/>
<g><circle cx="85" cy="125" r="56" fill="#1a1a1a" stroke="#6B6B73"/><circle id="wl" cx="85" cy="125" r="46" fill="url(#gTape)"/></g><g><circle cx="275" cy="125" r="56" fill="#1a1a1a" stroke="#6B6B73"/><circle id="wr" cx="275" cy="125" r="24" fill="url(#gTape)"/></g>
<g id="sl" style="transform-origin:85px 125px"><circle cx="85" cy="125" r="17" fill="url(#gSteel)" stroke="#44444B"/><g stroke="#44444B" stroke-width="3"><line x1="85" y1="110" x2="85" y2="140"/><line x1="72" y1="117" x2="98" y2="133"/><line x1="72" y1="133" x2="98" y2="117"/></g></g>
<g id="sr" style="transform-origin:275px 125px"><circle cx="275" cy="125" r="17" fill="url(#gSteel)" stroke="#44444B"/><g stroke="#44444B" stroke-width="3"><line x1="275" y1="110" x2="275" y2="140"/><line x1="262" y1="117" x2="288" y2="133"/><line x1="262" y1="133" x2="288" y2="117"/></g></g>
<rect x="160" y="172" width="40" height="22" rx="3" fill="url(#gBrass)" stroke="#7a5606"/><text x="180" y="204" text-anchor="middle" font-family="Poppins,sans-serif" font-weight="700" font-size="8" letter-spacing="1" fill="#bdbdc2">READ / WRITE HEAD</text></svg>
<div class="win" id="win"><div class="mk"></div><div class="reel" id="reel"></div></div>
<div class="rw"><button class="key alt" id="wd" type="button" disabled>▶▶ Wind one file</button><span class="led" id="led"></span></div>
<p class="st">Files passed: <b id="tp1">0</b> · Time: <b id="tt1">0.0 s</b></p><p class="ms" id="tm" hidden></p></div>
<div class="pn"><h3>Round 2 · Hard disk</h3><div class="rw"><button class="key" id="ds" type="button">Start</button><div class="lcd" id="dt">PRESS START</div></div>
<svg class="art off" id="hd" viewBox="0 0 380 380">${DEFS}<rect x="4" y="4" width="372" height="372" rx="18" fill="url(#gDark)" stroke="#6B6B73" filter="url(#fDrop)"/>${SCREW(20,20,5)}${SCREW(360,20,5)}${SCREW(20,360,5)}
<circle cx="${ACX}" cy="${ACY}" r="170" fill="#44444B"/><circle cx="${ACX}" cy="${ACY}" r="164" fill="url(#gPlat)"/>
<g class="spin" opacity=".55"><path d="M190 190 L354 190 A164 164 0 0 0 306 74 Z" fill="#fff"/><path d="M190 190 L26 190 A164 164 0 0 0 74 306 Z" fill="#fff"/></g>
<g fill="none" stroke="#00000022"><circle cx="${ACX}" cy="${ACY}" r="62"/><circle cx="${ACX}" cy="${ACY}" r="90"/><circle cx="${ACX}" cy="${ACY}" r="118"/><circle cx="${ACX}" cy="${ACY}" r="146"/></g>
<circle cx="${ACX}" cy="${ACY}" r="30" fill="url(#gDark)" stroke="#222"/><circle cx="${ACX}" cy="${ACY}" r="11" fill="url(#gSteel)"/><g id="secs"></g>
<g id="arm"><g id="armr"><polygon id="ab" points="0,-6 100,-2 100,2 0,6" fill="url(#gSteel)" stroke="#44444B" stroke-width=".8" filter="url(#fDrop)"/><rect id="at" x="92" y="-5" width="12" height="10" rx="2" fill="#1a1a1a"/><circle id="al" cx="99" cy="0" r="2.6" fill="#EF4444"/></g><circle r="14" fill="url(#gBrass)" stroke="#7a5606"/><circle r="5" fill="#44444B"/></g></svg>
<p class="st">Files passed: <b id="dp">0</b> · Time: <b id="dtm">0.0 s</b> · Wrong clicks: <b id="dm">0</b></p><p class="ms" id="dd" hidden></p></div></div>
<div class="res" id="res"></div>
<div class="act"><button class="re" id="re" type="button">↺ Reset</button></div></div>`;}
  init(){this.fmt=ms=>(ms/1000).toFixed(1)+' s';this.tape={on:false,idx:1,target:0,t0:0,done:null,timer:0};this.disk={on:false,mv:false,target:0,t0:0,miss:0,done:null,timer:0};
    const reel=this.$('reel');for(let i=1;i<=100;i++){const d=document.createElement('div');d.className='fl';d.textContent=i;reel.appendChild(d);}
    this.files=[...reel.children];
    const sg=this.$('secs');for(let n=1;n<=100;n++){const p=this.secPos(n),g=sv('g',{class:'sec','data-n':n,tabindex:0,role:'button','aria-label':'File '+n});g.appendChild(sv('circle',{cx:p.x,cy:p.y,r:7.4}));const t=sv('text',{x:p.x,y:p.y+2.4,'text-anchor':'middle'});t.textContent=n;g.appendChild(t);
      g.addEventListener('click',()=>this.pick(n,g));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.pick(n,g);}});sg.appendChild(g);}
    this.arm={R:0,len:0};this.arm=this.armT({x:236,y:352});this.applyArm();
    this.$('ts').onclick=()=>this.startTape();this.$('ds').onclick=()=>this.startDisk();
    const wd=this.$('wd');let hold=0;const wind=()=>this.wind();
    wd.addEventListener('pointerdown',e=>{e.preventDefault();wind();clearInterval(hold);hold=setInterval(wind,150);});
    ['pointerup','pointerleave','pointercancel'].forEach(ev=>wd.addEventListener(ev,()=>clearInterval(hold)));
    wd.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();wind();}});
    this.placeTape();if(window.ResizeObserver){new ResizeObserver(()=>this.placeTape()).observe(this.$('win'));}}
  disconnectedCallback(){super.disconnectedCallback();clearInterval(this.tape.timer);clearInterval(this.disk.timer);}
  secPos(n){const ring=Math.floor((n-1)/25),i=(n-1)%25,r=62+ring*28,a=(i*360/25-90)*Math.PI/180;return{x:ACX+r*Math.cos(a),y:ACY+r*Math.sin(a)};}
  armT(P){const dx=P.x-PIV.x,dy=P.y-PIV.y;return{R:Math.atan2(dy,dx)*180/Math.PI+180,len:Math.hypot(dx,dy)};}
  applyArm(){const a=this.arm;this.$('arm').setAttribute('transform',`translate(${PIV.x} ${PIV.y})`);this.$('armr').setAttribute('transform',`rotate(${a.R})`);
    this.$('ab').setAttribute('points',`0,-6 ${a.len},-2 ${a.len},2 0,6`);this.$('at').setAttribute('x',a.len-8);this.$('al').setAttribute('cx',a.len-1.5);}
  placeTape(){const t=this.tape,win=this.$('win'),reel=this.$('reel');if(!win)return;
    this.files.forEach((f,i)=>f.classList.toggle('now',i+1===t.idx));
    reel.style.transform=`translateX(${win.clientWidth/2-((t.idx-1)*64+28)}px)`;
    const passed=Math.max(0,t.idx-1),p=Math.min(1,passed/99);this.$('tp1').textContent=passed;
    const d=String(passed).padStart(3,'0');['d0','d1','d2'].forEach((id,i)=>this.$(id).textContent=d[i]);
    const rL=46-22*p,rR=24+22*p;this.$('wl').setAttribute('r',rL);this.$('wr').setAttribute('r',rR);
    this.$('tp').setAttribute('d',`M85,${125+rL} L135,179 L225,179 L275,${125+rR}`);
    ['sl','sr'].forEach(id=>{const e=this.$(id);e.style.transition='transform .14s linear';e.style.transform=`rotate(${passed*36}deg)`;});}
  startTape(){clearInterval(this.tape.timer);const t=this.tape=this.tape={on:true,idx:1,target:25+Math.floor(Math.random()*21),t0:performance.now(),done:null,timer:0};
    this.$('tt').textContent='FIND FILE '+t.target;this.$('wd').disabled=false;this.$('tm').hidden=true;this.$('led').className='led';this.placeTape();
    t.timer=setInterval(()=>{if(t.on)this.$('tt1').textContent=this.fmt(performance.now()-t.t0);},100);}
  wind(){const t=this.tape;if(!t.on)return;t.idx++;this.placeTape();
    if(t.idx===t.target){t.on=false;clearInterval(t.timer);t.done={passed:t.target-1,ms:performance.now()-t.t0};this.$('tt1').textContent=this.fmt(t.done.ms);this.$('wd').disabled=true;this.$('led').className='led g';
      const m=this.$('tm');m.hidden=false;m.textContent='Found File '+t.target+' after passing '+t.done.passed+' files.';this.finish();}}
  seek(P,cb){const from={...this.arm},to=this.armT(P),t0=performance.now(),D=560;this.$('al').setAttribute('fill','#EF4444');
    const f=t=>{const k=Math.min(1,(t-t0)/D),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;this.arm={R:from.R+(to.R-from.R)*e,len:from.len+(to.len-from.len)*e};this.applyArm();
      if(k<1)this.raf=requestAnimationFrame(f);else{this.$('al').setAttribute('fill','#16B981');cb&&cb();}};this.raf=requestAnimationFrame(f);}
  startDisk(){clearInterval(this.disk.timer);this.r.querySelectorAll('.sec').forEach(g=>g.setAttribute('class','sec'));
    const d=this.disk={on:true,mv:false,target:40+Math.floor(Math.random()*60),t0:performance.now(),miss:0,done:null,timer:0};
    this.$('dt').textContent='FIND FILE '+d.target;this.$('dm').textContent='0';this.$('dd').hidden=true;this.$('hd').classList.remove('off');
    d.timer=setInterval(()=>{if(d.on)this.$('dtm').textContent=this.fmt(performance.now()-d.t0);},100);}
  pick(n,g){const d=this.disk;if(!d.on||d.mv)return;d.mv=true;
    this.seek(this.secPos(n),()=>{d.mv=false;
      if(n===d.target){d.on=false;clearInterval(d.timer);this.$('hd').classList.add('off');g.classList.add('hit');d.done={passed:0,ms:performance.now()-d.t0};this.$('dtm').textContent=this.fmt(d.done.ms);
        const m=this.$('dd');m.hidden=false;m.textContent='Found File '+d.target+' after passing 0 files.';this.finish();}
      else{d.miss++;g.classList.add('miss');this.$('dm').textContent=d.miss;}});}
  finish(){const t=this.tape,d=this.disk;if(!t.done||!d.done)return;const r=this.$('res');r.classList.add('on');
    r.innerHTML=`<h3>Your results</h3><table><thead><tr><th>Access type</th><th>Definition</th><th>Speed</th><th>Files passed</th><th>Time</th></tr></thead><tbody>
<tr><td>${NOTE_ROWS[0][0]}</td><td>${NOTE_ROWS[0][1]}</td><td>${NOTE_ROWS[0][2]}</td><td><b>${t.done.passed}</b></td><td><b>${this.fmt(t.done.ms)}</b></td></tr>
<tr><td>${NOTE_ROWS[1][0]}</td><td>${NOTE_ROWS[1][1]}</td><td>${NOTE_ROWS[1][2]}</td><td><b>${d.done.passed}</b></td><td><b>${this.fmt(d.done.ms)}</b></td></tr></tbody></table>`;}
  play(){clearInterval(this.tape.timer);clearInterval(this.disk.timer);if(this.raf)cancelAnimationFrame(this.raf);
    this.tape={on:false,idx:1,target:0,t0:0,done:null,timer:0};this.disk={on:false,mv:false,target:0,t0:0,miss:0,done:null,timer:0};
    this.$('tt').textContent='PRESS START';this.$('dt').textContent='PRESS START';this.$('wd').disabled=true;this.$('led').className='led';this.$('tt1').textContent='0.0 s';this.$('dtm').textContent='0.0 s';this.$('dm').textContent='0';
    this.$('tm').hidden=true;this.$('dd').hidden=true;this.$('res').classList.remove('on');this.$('hd').classList.add('off');this.r.querySelectorAll('.sec').forEach(g=>g.setAttribute('class','sec'));
    this.arm=this.armT({x:236,y:352});this.applyArm();this.placeTape();}
  final(){this.started=true;}
}

const IPO_CSS=`
:host{display:block;width:100%;font-family:var(--font-body,'Poppins',system-ui,sans-serif);color:#1A1A1A;container-type:inline-size}
*{box-sizing:border-box}
.wrap{background:#FDF5F6;border-radius:20px;padding:20px 12px 16px}
.row{display:flex;align-items:stretch;justify-content:center;gap:0}
.card{flex:1 1 0;min-width:0;max-width:230px;background:#fff;border:2px solid #CA133E;border-radius:16px;padding:12px 10px;box-shadow:0 4px 10px rgba(202,19,62,.1);text-align:center;display:flex;flex-direction:column;align-items:center}
.badge{width:26px;height:26px;border-radius:50%;background:#CA133E;color:#fff;font-size:13px;font-weight:700;line-height:26px;margin-bottom:4px}
.h{font-weight:700;font-size:15px;line-height:1.3}
.d{font-size:13px;color:#6B6B73;line-height:1.4;margin-top:2px}
.stage{height:150px;width:100%;display:flex;align-items:center;justify-content:center;margin:8px 0 6px;position:relative}
.arrow{flex:0 0 56px;position:relative;display:flex;align-items:center;justify-content:center;color:#CA133E;font-weight:700;font-size:22px}
.arrow .ln{position:absolute;left:6px;right:6px;top:50%;height:2px;margin-top:-1px;background:repeating-linear-gradient(90deg,#F58AA0 0 6px,transparent 6px 10px)}
.arrow .hd{position:absolute;right:2px;top:50%;transform:translateY(-52%);line-height:1;font-size:20px}
.chip{position:absolute;left:0;top:50%;transform:translate(-50%,-50%);opacity:0;background:#CA133E;color:#fff;font-family:'JumperSafe','Poppins',sans-serif;font-weight:700;font-size:12px;padding:3px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 3px 8px rgba(202,19,62,.35);z-index:3}
.chip.go{animation:travel 800ms ease-in-out forwards}
@keyframes travel{0%{left:0;opacity:0}12%{opacity:1}88%{opacity:1}100%{left:100%;opacity:0}}
/* calculator */
.calc{width:112px;background:linear-gradient(#44444B,#1a1a1a);border-radius:12px;padding:8px;box-shadow:0 6px 12px rgba(0,0,0,.25),inset 0 1px 0 rgba(255,255,255,.2)}
.lcd{height:28px;background:#F5F5F6;border-radius:6px;color:#1A1A1A;text-align:right;padding:0 7px;font-family:'JumperSafe','Poppins',sans-serif;font-weight:700;font-size:17px;line-height:28px;margin-bottom:7px;box-shadow:inset 0 2px 4px rgba(0,0,0,.25);overflow:hidden;white-space:nowrap}
.keys{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}
.k{height:17px;border-radius:4px;background:linear-gradient(#E7E7E9,#bdbdc2);color:#44444B;font-size:9px;font-weight:700;line-height:17px;box-shadow:0 2px 0 #6B6B73;transition:transform 90ms,background 90ms,box-shadow 90ms}
.k.op{background:linear-gradient(#F58AA0,#EE6E89);color:#fff;box-shadow:0 2px 0 #A01030}
.k.eq{background:linear-gradient(#DC9F0E,#b8800a);color:#fff;box-shadow:0 2px 0 #7a5606}
.k.press{transform:translateY(2px);box-shadow:0 0 0 #000;background:#CA133E;color:#fff}
/* cpu */
.cpu{position:relative;width:104px;height:104px}
.pins{position:absolute;inset:0}
.pins i{position:absolute;background:#DC9F0E;border-radius:2px}
.die{position:absolute;inset:12px;border-radius:12px;background:linear-gradient(135deg,#1a1a1a,#3a1a1a);box-shadow:0 6px 12px rgba(0,0,0,.3);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;overflow:hidden}
.die b{font-family:'JumperSafe','Poppins',sans-serif;font-size:13px;letter-spacing:1px;color:#F58AA0}
.bits{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;color:#DC9F0E;height:18px;line-height:18px;letter-spacing:2px}
.ans{font-family:'JumperSafe','Poppins',sans-serif;font-size:26px;font-weight:700;color:#fff;line-height:18px;display:none}
.ring{position:absolute;inset:4px;border-radius:16px;border:3px solid #CA133E;opacity:0}
.proc .ring{animation:pulse 900ms ease-out infinite}
@keyframes pulse{0%{transform:scale(.92);opacity:.9}100%{transform:scale(1.18);opacity:0}}
.proc .die{animation:glow 600ms ease-in-out infinite alternate}
@keyframes glow{from{box-shadow:0 0 0 rgba(202,19,62,0)}to{box-shadow:0 0 18px rgba(202,19,62,.85)}}
.fin .bits{display:none}.fin .ans{display:block}
/* output */
.out{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%}
.mon{width:104px}
.scr{height:58px;background:linear-gradient(135deg,#1a1a1a,#3a1a1a);border:4px solid #44444B;border-radius:8px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 8px rgba(0,0,0,.25),inset 0 0 12px rgba(0,0,0,.6)}
.scr span{font-family:'JumperSafe','Poppins',sans-serif;font-weight:700;font-size:34px;color:#DC9F0E;opacity:0;transform:scale(.6);transition:opacity 300ms,transform 300ms;text-shadow:0 0 10px rgba(220,159,14,.7)}
.show .scr span{opacity:1;transform:none}
.neck{width:14px;height:6px;background:#6B6B73;margin:0 auto}
.base{width:40px;height:5px;background:#44444B;border-radius:3px;margin:0 auto}
.prt{width:112px;position:relative}
.pbody{position:relative;z-index:2;height:24px;background:linear-gradient(#F5F5F6,#d6d6da);border:2px solid #44444B;border-radius:8px 8px 4px 4px;box-shadow:0 3px 6px rgba(0,0,0,.2)}
.pbody:before{content:"";position:absolute;left:10px;right:10px;bottom:4px;height:4px;background:#1a1a1a;border-radius:2px}
.pbody:after{content:"";position:absolute;right:8px;top:4px;width:6px;height:6px;border-radius:50%;background:#6B6B73}
.printing .pbody:after{background:#16B981;box-shadow:0 0 6px #16B981}
.tray{position:relative;height:54px;overflow:hidden;margin:0 10px}
.paper{position:absolute;left:0;right:0;top:0;height:54px;background:#fff;border:1px solid #E7E7E9;border-top:0;box-shadow:0 2px 4px rgba(0,0,0,.2);transform:translateY(-100%);display:flex;align-items:center;justify-content:center;font-family:'JumperSafe','Poppins',sans-serif;font-weight:700;font-size:26px;color:#1A1A1A}
.paper span{opacity:0;transition:opacity 500ms}
.printing .paper{animation:eject 1800ms steps(14,end) forwards}
.printing .paper span,.done .paper span{opacity:1}
.printing .paper span{transition-delay:900ms}
.done .paper{transform:none}
@keyframes eject{from{transform:translateY(-100%)}to{transform:translateY(0)}}
.act{display:flex;justify-content:center;margin-top:14px}
button{font-family:'JumperSafe','Poppins',sans-serif;font-weight:700;font-size:14px;color:#fff;background:#CA133E;border:0;border-radius:999px;padding:8px 18px;cursor:pointer;box-shadow:0 3px 0 #A01030}
button:active{transform:translateY(2px);box-shadow:none}
button:focus-visible{outline:3px solid #DC9F0E;outline-offset:2px}
.noanim *{animation:none!important;transition:none!important}
@container (max-width:560px){
 .row{flex-direction:column;align-items:center}
 .card{max-width:260px;width:100%;flex:none}
 .arrow{flex:0 0 48px;width:56px}
 .arrow .ln{left:50%;right:auto;top:6px;bottom:6px;width:2px;height:auto;margin:0 0 0 -1px;background:repeating-linear-gradient(180deg,#F58AA0 0 6px,transparent 6px 10px)}
 .arrow .hd{right:auto;left:50%;top:auto;bottom:0;transform:translateX(-50%) rotate(90deg)}
 .chip{left:50%;top:0}
 .chip.go{animation:travelv 800ms ease-in-out forwards}
 @keyframes travelv{0%{top:0;opacity:0}12%{opacity:1}88%{opacity:1}100%{top:100%;opacity:0}}
}
@media print{button{display:none}}
`;
const PINS = (()=>{let s='';for(let i=0;i<5;i++){const p=8+i*18;
 s+=`<i style="left:${p}px;top:0;width:6px;height:12px"></i><i style="left:${p}px;bottom:0;width:6px;height:12px"></i><i style="top:${p}px;left:0;height:6px;width:12px"></i><i style="top:${p}px;right:0;height:6px;width:12px"></i>`;}return s;})();
const KEYS=['7','8','9','÷','4','5','6','×','1','2','3','+','C','0','.','='];
const IPO_HTML=`<div class="wrap" id="root">
<div class="row">
 <div class="card"><div class="badge">1</div><div class="h">Input</div>
  <div class="stage"><div class="calc" aria-hidden="true"><div class="lcd" id="lcd">&nbsp;</div><div class="keys">${KEYS.map((k,i)=>`<div class="k${k==='+'?' op':''}${k==='='?' eq':''}" data-k="${i}">${k}</div>`).join('')}</div></div></div>
  <div class="d">Data goes in</div></div>
 <div class="arrow"><div class="ln"></div><div class="hd">→</div><div class="chip" id="c1">2 + 2</div></div>
 <div class="card"><div class="badge">2</div><div class="h">Process</div>
  <div class="stage"><div class="cpu" id="cpu" aria-hidden="true"><div class="pins">${PINS}</div><div class="ring"></div><div class="die"><b>CPU</b><div class="bits" id="bits">&nbsp;</div><div class="ans">4</div></div></div></div>
  <div class="d">The CPU works on it</div></div>
 <div class="arrow"><div class="ln"></div><div class="hd">→</div><div class="chip" id="c2">4</div></div>
 <div class="card"><div class="badge">3</div><div class="h">Output</div>
  <div class="stage"><div class="out" id="out" aria-hidden="true">
   <div class="mon"><div class="scr"><span>4</span></div><div class="neck"></div><div class="base"></div></div>
   <div class="prt"><div class="pbody"></div><div class="tray"><div class="paper"><span>4</span></div></div></div>
  </div></div>
  <div class="d">Results come out</div></div>
</div>
<div class="act"><button type="button" id="re">▶ Replay</button></div>
</div>`;

class IpoCalc extends Sim{
  get stepper(){return false;}get auto(){return true;}
  get noBase(){return true;}
  meta(){return {n:3,labels:['Input: 2 + 2 is keyed in','Process: the CPU works on it','Output: monitor shows 4 and the printer prints it']};}
  css(){return IPO_CSS;}
  html(){return IPO_HTML;}
  clear(){super.clear();clearInterval(this.iv);}
  reset(){this.clear();const r=this.r;this.$('lcd').innerHTML='&nbsp;';
    r.querySelectorAll('.k').forEach(k=>k.classList.remove('press'));['c1','c2'].forEach(i=>this.$(i).classList.remove('go'));
    this.$('cpu').classList.remove('proc','fin');this.$('bits').innerHTML='&nbsp;';this.$('out').classList.remove('show','printing','done');this.root.classList.remove('noanim');}
  press(i,txt){const k=this.r.querySelector(`.k[data-k="${i}"]`);k.classList.add('press');this.$('lcd').textContent=txt;setTimeout(()=>k.classList.remove('press'),260);}
  play(){this.reset();this.gate(0);
    this.at(500,()=>this.press(9,'2'));this.at(1100,()=>this.press(11,'2+'));this.at(1700,()=>this.press(9,'2+2'));this.at(2300,()=>this.press(15,'2+2'));
    this.gate(2600);this.at(2600,()=>this.$('c1').classList.add('go'));
    this.at(3400,()=>{this.$('cpu').classList.add('proc');this.iv=setInterval(()=>{let s='';for(let i=0;i<4;i++)s+=Math.random()<.5?'0':'1';this.$('bits').textContent=s;},90);});
    this.at(5400,()=>{clearInterval(this.iv);const c=this.$('cpu');c.classList.remove('proc');c.classList.add('fin');});
    this.gate(5800);this.at(5800,()=>this.$('c2').classList.add('go'));
    this.at(6600,()=>this.$('out').classList.add('show','printing'));
    this.at(8600,()=>{const o=this.$('out');o.classList.remove('printing');o.classList.add('done');});}
  final(){this.reset();this.root.classList.add('noanim');this.$('lcd').textContent='2+2';this.$('cpu').classList.add('fin');this.$('out').classList.add('show','done');}
}

/* ---------------- Chapter 6: networks + web ---------------- */
const NCSS=`
text{font-family:'Poppins',system-ui,sans-serif}
svg.s{background:#F5F5F6}
.steps.h{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin-top:10px}
.cp{font-size:11px;font-weight:700;fill:#44444B}
.tg{font-size:11px;font-weight:700}
.glow{transition:filter 300ms}
.hid{opacity:0;transition:opacity 300ms}
.pk{transition:none}
`;
const PKT=(id,t='')=>`<g id="${id}" style="opacity:0"><rect x="-11" y="-8" width="22" height="16" rx="3" fill="#fff" stroke="#CA133E" stroke-width="1.8" filter="url(#fDrop)"/><path d="M-11,-8 L0,1 L11,-8" fill="none" stroke="#CA133E" stroke-width="1.5"/>${t?`<text x="0" y="-12" text-anchor="middle" class="tg" fill="#CA133E">${t}</text>`:''}</g>`;
const MON=(x,y,w,h,inner='')=>`<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="7" fill="url(#gDark)" stroke="#111" filter="url(#fDrop)"/><rect x="5" y="5" width="${w-10}" height="${h-14}" rx="3" fill="#FDE8EC"/>${inner}<path d="M${w/2-8} ${h} h16 l4 10 h-24 z" fill="url(#gSteel)" stroke="#555"/><rect x="${w/2-22}" y="${h+9}" width="44" height="5" rx="2" fill="url(#gSteel)" stroke="#555"/></g>`;
const LAP=(x,y,w,h,inner='')=>`<g transform="translate(${x} ${y})"><rect x="6" width="${w-12}" height="${h}" rx="6" fill="url(#gDark)" stroke="#111" filter="url(#fDrop)"/><rect x="12" y="6" width="${w-24}" height="${h-12}" rx="3" fill="#FDE8EC"/>${inner}<path d="M0 ${h+2} h${w} l-6 9 h-${w-12} z" fill="url(#gSteel)" stroke="#555"/></g>`;
const ROUTERSVG=(x,y,w=44,h=34)=>`<g transform="translate(${x} ${y})" filter="url(#fDrop)"><path d="M8 0v-16M${w-8} 0v-16" stroke="#44444B" stroke-width="4" stroke-linecap="round"/><rect width="${w}" height="${h}" rx="6" fill="url(#gCrim)" stroke="#A01030" stroke-width="2"/><circle cx="10" cy="${h-9}" r="3" fill="#FDE8EC"/><circle cx="20" cy="${h-9}" r="3" fill="#FDE8EC"/><circle class="led" cx="30" cy="${h-9}" r="3" fill="#DC9F0E"/></g>`;
const SRV=(x,y,w,h,n=3)=>`<g transform="translate(${x} ${y})" filter="url(#fDrop)"><rect width="${w}" height="${h}" rx="8" fill="url(#gDark)" stroke="#111"/>${Array.from({length:n},(_,i)=>{const yy=8+i*((h-16)/n);return `<rect x="8" y="${yy}" width="${w-16}" height="${(h-16)/n-6}" rx="3" fill="#44444B" stroke="#6B6B73"/><circle class="led" cx="${w-18}" cy="${yy+((h-16)/n-6)/2}" r="3.5" fill="#16B981"/><rect x="14" y="${yy+((h-16)/n-6)/2-2}" width="${w*.35}" height="4" rx="2" fill="#9a9aa3"/>`;}).join('')}</g>`;
const CLOUD=(x,y)=>`<g transform="translate(${x} ${y})"><path d="M10 34a12 12 0 0 1 2-23 16 16 0 0 1 30-3 14 14 0 0 1 6 26z" fill="#fff" stroke="#44444B" stroke-width="2.5"/></g>`;
class Dual extends Sim{
  get stepper(){return !!this.sm;}get auto(){return !this.sm;}get dual(){return true;}
  all(){return Array.from({length:this.meta().n},(_,i)=>'s'+(i+1)).join(' ');}
  step(n){const N=this.meta().n;this.$('svg').setAttribute('class','s c'+n+' '+Array.from({length:N},(_,i)=>i+1).filter(i=>i<=n).map(i=>'s'+i).join(' '));
    this.r.querySelectorAll('#steps li').forEach((l,i)=>{l.classList.toggle('cur',i===n-1);l.classList.toggle('done',i<n-1);});}
  reset(){this.clear();this.root.classList.remove('noanim');this.$('svg').setAttribute('class','s');this.r.querySelectorAll('#steps li').forEach(l=>l.classList.remove('cur','done'));this.r0&&this.r0();}
  doneAll(){this.r.querySelectorAll('#steps li').forEach(l=>{l.classList.remove('cur');l.classList.add('done');});}
  stp(t,n,f){this.gate(t);this.at(t,()=>{this.step(n);f&&f();});}
  final(){this.reset();this.root.classList.add('noanim');this.$('svg').setAttribute('class','s '+this.all());this.doneAll();this.fin&&this.fin();this.started=true;}
  mv(el,x,y,ms){el.style.transition=ms?`transform ${ms}ms ease-in-out`:'none';el.style.transform=`translate(${x}px,${y}px)`;}
}

/* ---------- Hub vs switch (free play) ---------- */
class HubSwitch extends Sim{
  get stepper(){return false;}
  css(){return NCSS+`
.top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;margin-bottom:10px}
.tabs button{font-family:'JumperSafe','Poppins',sans-serif;font-weight:700;font-size:14px;border:2px solid #CA133E;background:#fff;color:#CA133E;border-radius:999px;padding:6px 18px;cursor:pointer}
.tabs button.on{background:#CA133E;color:#fff}.tabs{display:flex;gap:8px}
select{font:inherit;font-size:13px;font-weight:600;border:2px solid #E7E7E9;border-radius:10px;padding:5px 8px;background:#fff;color:#1A1A1A}
label{font-size:12px;font-weight:700;color:#44444B;display:flex;gap:6px;align-items:center}
button.send{font-family:'JumperSafe','Poppins',sans-serif;font-weight:700;font-size:14px;color:#fff;background:#CA133E;border:0;border-radius:999px;padding:8px 20px;cursor:pointer;box-shadow:0 3px 0 #A01030}
button.send:disabled{opacity:.5}
.grid{display:grid;grid-template-columns:1.5fr 1fr;gap:12px;align-items:start}
.stage{background:#fff;border:2px solid #CA133E;border-radius:16px;padding:8px;box-shadow:0 4px 10px rgba(202,19,62,.1)}
.cap{min-height:40px;margin-top:6px;font-size:14px;font-weight:600;text-align:center;color:#1A1A1A}
.cap b{color:#CA133E}
.side{display:grid;gap:10px}
.cnt{background:linear-gradient(135deg,#1a1a1a,#3a1a1a);color:#fff;border-radius:14px;padding:10px 14px;text-align:center}
.cnt .n{font-family:'JumperSafe','Poppins',sans-serif;font-size:34px;font-weight:700;color:#DC9F0E;line-height:1}.cnt .l{font-size:12px;color:#D1D1D6}
table.lk{width:100%;border-collapse:collapse;font-size:12px;background:#fff;border:2px solid #CA133E;border-radius:12px;overflow:hidden}
table.lk th{background:#CA133E;color:#fff;padding:5px 8px;text-align:left;font-size:11px}
table.lk td{padding:4px 8px;border-top:1px solid #E7E7E9;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px}
table.lk tr.look td{background:#FDE8EC;font-weight:700;color:#CA133E}
.pc .ring{fill:none;stroke:transparent;stroke-width:3;transition:stroke 200ms}
.pc.got .ring{stroke:#DC9F0E}.pc.dest .ring{stroke:#16B981}
.pc .nm{font-size:11px;font-weight:700;fill:#CA133E}.pc .mc{font-size:6.3px;fill:#44444B;font-family:ui-monospace,Menlo,monospace}
.jl{fill:#3a3a3f;transition:fill 150ms}.jl.on{fill:#16B981;filter:drop-shadow(0 0 4px #16B981)}
.rn{font-size:15px;font-weight:700;fill:#44444B;font-family:'JumperSafe','Poppins',sans-serif;letter-spacing:.1em}
@container (max-width:600px){.grid{grid-template-columns:1fr}}`;}
  html(){return `<div class="wrap" id="root"><div class="top"><div class="tabs"><button type="button" id="mH" class="on">Hub</button><button type="button" id="mS">Switch</button></div>
<label>From <select id="fr"></select></label><label>To <select id="to"></select></label><button type="button" class="send" id="sd">Send packet ▶</button></div>
<div class="grid"><div><div class="stage"><svg class="s" id="svg" viewBox="0 0 480 290" role="img" aria-label="five computers connected to a hub or switch">${DEFS}<g id="cb"></g><g id="dev"></g><g id="pcs"></g><g id="pk"></g></svg>
<div class="cap" id="cap">Connects devices to form a LAN. Pick a sender and a receiver, then send.</div></div></div>
<div class="side"><div class="cnt"><div class="n" id="n">0</div><div class="l">computers that received the packet</div></div><table class="lk" id="tb" hidden><thead><tr><th colspan="2">Switch look-up table (MAC addresses)</th></tr></thead><tbody id="tbb"></tbody></table></div></div></div>`;}
  init(){const MACS=['FF B3 A4 33 7E F1','3C 5D 91 0A 22 B8','A0 E4 17 6F C9 3D','7B 28 D5 EE 04 61','9A 0F 6C B2 85 47'];
    const PCS=[{x:64,y:62},{x:240,y:42},{x:416,y:62},{x:416,y:232},{x:64,y:232}],ST=[{x:112,y:70},{x:240,y:74},{x:368,y:70},{x:368,y:232},{x:112,y:232}],JK=[{x:165,y:128},{x:240,y:106},{x:315,y:128},{x:315,y:172},{x:165,y:172}];
    const cp=i=>{const s=ST[i],e=JK[i];if(Math.abs(e.x-s.x)>Math.abs(e.y-s.y)){const m=(s.x+e.x)/2;return `M${s.x} ${s.y}C${m} ${s.y} ${m} ${e.y} ${e.x} ${e.y}`;}const m=(s.y+e.y)/2;return `M${s.x} ${s.y}C${s.x} ${m} ${e.x} ${m} ${e.x} ${e.y}`;};
    this.MACS=MACS;this.mode='H';this.busy=false;
    this.$('cb').innerHTML=PCS.map((_,i)=>`<path d="${cp(i)}" fill="none" stroke="#44444B" stroke-width="7" stroke-linecap="round"/><path id="c${i}" d="${cp(i)}" fill="none" stroke="#F58AA0" stroke-width="3.5" stroke-linecap="round"/>`).join('');
    this.$('dev').innerHTML=`<g filter="url(#fDrop)"><rect x="165" y="108" width="150" height="84" rx="9" fill="url(#gSteel)" stroke="#6B6B73"/><rect x="175" y="116" width="130" height="68" rx="5" fill="none" stroke="rgba(0,0,0,.12)"/><text id="rn" x="240" y="158" text-anchor="middle" class="rn">HUB</text>${JK.map(j=>`<rect x="${j.x-6}" y="${j.y-7}" width="12" height="14" rx="2" fill="#15181c"/>`).join('')}${JK.map((j,i)=>`<circle class="jl" id="j${i}" cx="${[178,240,302,302,178][i]}" cy="${[128,119,128,172,172][i]}" r="3.4"/>`).join('')}</g>`;
    this.$('pcs').innerHTML=PCS.map((p,i)=>`<g class="pc" id="p${i}" transform="translate(${p.x} ${p.y})"><rect class="ring" x="-50" y="-34" width="100" height="70" rx="12"/><path d="M-12 16L-8 29H8L12 16Z" fill="url(#gSteel)" stroke="#555"/><rect x="-22" y="28" width="44" height="5" rx="2" fill="url(#gSteel)" stroke="#555"/><rect x="-42" y="-30" width="84" height="48" rx="6" fill="url(#gDark)" stroke="#111" filter="url(#fDrop)"/><rect x="-37" y="-25" width="74" height="38" rx="3" fill="#FDE8EC"/><text class="nm" y="-9" text-anchor="middle">PC ${i+1}</text><text class="mc" y="3" text-anchor="middle">${MACS[i]}</text></g>`).join('');
    const fr=this.$('fr'),to=this.$('to');for(let i=0;i<5;i++){fr.add(new Option('PC '+(i+1),i));to.add(new Option('PC '+(i+1),i));}fr.value=0;to.value=2;
    this.$('tbb').innerHTML=MACS.map((m,i)=>`<tr id="l${i}"><td>PC ${i+1}</td><td>${m}</td></tr>`).join('');
    this.PCS=PCS;this.cab=PCS.map((_,i)=>this.$('c'+i));
    const sm=m=>{if(this.busy)return;this.mode=m;this.$('mH').classList.toggle('on',m==='H');this.$('mS').classList.toggle('on',m==='S');this.$('rn').textContent=m==='H'?'HUB':'SWITCH';this.$('tb').hidden=m==='H';this.cap(m==='H'?'Connects devices to form a LAN. Pick a sender and a receiver, then send.':'Connects devices to form a LAN. It keeps a look-up table of MAC addresses.');this.clr();};
    this.$('mH').onclick=()=>sm('H');this.$('mS').onclick=()=>sm('S');this.$('sd').onclick=()=>this.send();}
  cap(t){this.$('cap').innerHTML=t;}
  clr(){this.r.querySelectorAll('.pc').forEach(p=>p.setAttribute('class','pc'));this.r.querySelectorAll('#tbb tr').forEach(t=>t.classList.remove('look'));this.$('n').textContent='0';this.$('pk').innerHTML='';}
  blink(i){const j=this.$('j'+i);j.classList.add('on');setTimeout(()=>j.classList.remove('on'),900);}
  trav(i,rev,ms){return new Promise(res=>{const g=sv('g',{});g.innerHTML='<rect x="-10" y="-7" width="20" height="14" rx="2" fill="#fff" stroke="#CA133E" stroke-width="1.7"/><path d="M-10,-7L0,1L10,-7" fill="none" stroke="#CA133E" stroke-width="1.4"/>';g.setAttribute('filter','url(#fDrop)');this.$('pk').append(g);
    const p=this.cab[i],L=p.getTotalLength(),set=k=>{const q=p.getPointAtLength((rev?1-k:k)*L);g.setAttribute('transform',`translate(${q.x} ${q.y})`);};set(0);const t0=performance.now();const f=t=>{const k=Math.min(1,(t-t0)/ms);set(k);if(k<1)requestAnimationFrame(f);else{g.remove();res();}};requestAnimationFrame(f);});}
  sl(ms){return new Promise(r=>setTimeout(r,ms));}
  async send(){if(this.busy)return;const f=+this.$('fr').value,t=+this.$('to').value;if(f===t){this.cap('Pick a <b>different</b> receiver.');return;}
    this.busy=true;this.$('sd').disabled=true;this.clr();let got=[];this.blink(f);await this.trav(f,false,600);
    if(this.mode==='H'){this.cap('The hub <b>broadcasts</b> to every device.');got=[0,1,2,3,4].filter(i=>i!==f);got.forEach(i=>this.blink(i));await Promise.all(got.map(i=>this.trav(i,true,600)));}
    else{this.cap('Reads the <b>MAC</b> of the incoming packet.');this.$('l'+t).classList.add('look');await this.sl(1100);this.cap('Sends <b>only to the destination</b> computer.');got=[t];this.blink(t);await this.trav(t,true,600);}
    got.forEach(i=>this.r.getElementById('p'+i).classList.add('got'));this.r.getElementById('p'+t).classList.add('dest');this.$('n').textContent=got.length;
    this.busy=false;this.$('sd').disabled=false;}
  final(){}
}

/* ---------- Router (animated, like the routing-table drawing) ---------- */
const SQ=(y,k)=>{if(k===0)return `M276 ${y}q9 -16 19 0t19 0t19 0t19 0t19 0t19 0t19 0t19 0`;
  if(k===1)return `M276 ${y}h14v-12h12v12h12v-12h10v12h18v-12h12v12h14v-12h14v12h14v-12h12v12h12`;
  if(k===2)return `M276 ${y}q12 -22 30 -8t28 0q16 14 30 0t30 -6t30 8t16 6`;
  if(k===3){let d=`M276 ${y}`;for(let i=0;i<13;i++)d+='q6 -12 12 0';return d;}
  return `M276 ${y}l8 -6 8 9 8 -10 8 8 8 -4 8 10 8 -9 8 5 8 -7 8 8 8 -9 8 6 8 -5 8 4`;};
class RouterDemo extends Dual{
  meta(){return {n:5,labels:['Packets go to the router','Router reads the IP address','Finds paths in its routing table','Picks the quickest, least busy path','Passes to the destination hub']};}
  css(){return STEPS_CSS+NCSS+`
.rt{fill:none;stroke:#F58AA0;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;transition:stroke 200ms,opacity 300ms}
.rt.scan{stroke:#CA133E}.s4 .rt{opacity:.25}.s4 .rt.pick{opacity:1;stroke:#DC9F0E;stroke-width:4}
.tag{opacity:0;transition:opacity 300ms}.c2 .tg2,.c4 .tg4{opacity:1}
.s2:not(.s3) .rA{filter:drop-shadow(0 0 6px #CA133E)}
.hubp{fill:#fff;stroke:#CA133E;stroke-width:3;rx:12}.hubt{font-size:11px;font-weight:700;fill:#CA133E}
.led{animation:bl 1s steps(2) infinite}@keyframes bl{50%{opacity:.35}}
.s5 .rB{filter:drop-shadow(0 0 6px #DC9F0E)}`;}
  html(){const ys=[104,138,172,206,240],pick=2;
    return `<div class="wrap" id="root"><div class="stage"><svg class="s" id="svg" viewBox="0 0 700 290" role="img" aria-label="a packet travelling PC, hub, router, routing table, router, hub, PC">${DEFS}
<path d="M92 130H132M196 130H226M486 130H496M560 130H598" stroke="#F58AA0" stroke-width="5" stroke-linecap="round"/><path id="P1" d="M92 130H236" fill="none"/>
${MON(12,102,80,54)}${MON(598,102,80,54)}
<rect class="hubp" x="132" y="116" width="64" height="28" rx="12"/><text class="hubt" x="164" y="134" text-anchor="middle">HUB 1</text><rect class="hubp" x="496" y="116" width="64" height="28" rx="12"/><text class="hubt" x="528" y="134" text-anchor="middle">HUB 2</text>
<text x="246" y="30" text-anchor="middle" class="cp" fill="#CA133E" style="font-size:12px">Router</text><path d="M240 36 L244 100" stroke="#44444B" stroke-width="1.5" stroke-dasharray="3 3"/>
<text x="356" y="30" text-anchor="middle" class="cp" style="fill:#DC9F0E;font-size:13px">Routing table</text>
<rect x="268" y="40" width="176" height="236" rx="8" fill="#fff" stroke="#DC9F0E" stroke-width="3"/><path d="M268 78H444" stroke="#DC9F0E" stroke-width="3"/><text x="276" y="63" class="cp" style="font-size:10px;fill:#6B6B73">Destination IP</text><text x="438" y="63" class="cp" text-anchor="end" style="font-size:10px;fill:#6B6B73">Path</text>
${ys.map((y,k)=>`<path class="rt${k===pick?' pick':''}" id="rt${k}" d="${SQ(y,k)}"/>`).join('')}
<g class="rA">${ROUTERSVG(226,113)}</g><g class="rB">${ROUTERSVG(450,113)}</g>
<g class="tag tg2"><rect x="150" y="62" width="176" height="24" rx="12" fill="#1a1a1a"/><text x="238" y="78" text-anchor="middle" class="tg" fill="#DC9F0E">Reads IP: 192.108.158.1</text></g>
<g class="tag tg4"><rect x="288" y="250" width="136" height="20" rx="10" fill="#DC9F0E"/><text x="356" y="264" text-anchor="middle" class="tg" fill="#1a1a1a">Quickest · least busy</text></g>
<path id="P2" d="M236 130C254 130 258 ${ys[pick]} 276 ${ys[pick]}${SQ(ys[pick],pick).replace(`M276 ${ys[pick]}`,'')}C452 ${ys[pick]} 446 130 466 130H604" fill="none" stroke="none"/>
${PKT('pk')}</svg></div>${stepsOl(['Packets go to the router','Router reads the IP address','Finds paths in its routing table','Picks the quickest, least busy path','Passes to the destination hub'])}<div class="act"><div id="re"></div></div></div>`.replace('class="steps"','class="steps h"');}
  r0(){const p=this.$('pk');p.style.opacity=0;this.r.querySelectorAll('.rt').forEach(r=>r.classList.remove('scan'));}
  play(){this.reset();const pk=this.$('pk'),P1=this.$('P1'),P2=this.$('P2');
    this.stp(300,1,()=>this.fly(pk,P1,1500));
    this.stp(2100,2);
    this.stp(3600,3,()=>{for(let k=0;k<5;k++)this.at(k*420,()=>{this.r.querySelectorAll('.rt').forEach(r=>r.classList.remove('scan'));this.$('rt'+k).classList.add('scan');});this.at(5*420,()=>this.r.querySelectorAll('.rt').forEach(r=>r.classList.remove('scan')));});
    this.stp(6300,4);
    this.stp(8100,5,()=>{this.fly(pk,P2,3200);});
    this.at(8100+3600,()=>{this.doneAll();this.busy&&this.busy(false);});}
  fin(){this.$('pk').style.opacity=0;this.$('rt2').classList.add('pick');}
}

/* ---------- Wi-Fi ---------- */
class WifiDemo extends Dual{
  meta(){return {n:3,labels:['Computer sends data to its wireless adapter','Radio waves transmitted to a router','Router converts radio waves into data']};}
  css(){return STEPS_CSS+NCSS+`
.arc{fill:none;stroke:#CA133E;stroke-width:3;stroke-linecap:round;opacity:0;transform-origin:236px 130px;vector-effect:non-scaling-stroke}
.s2 .arc{animation:arcs 1.8s ease-out infinite}.s2 .arc:nth-of-type(2){animation-delay:.6s}.s2 .arc:nth-of-type(3){animation-delay:1.2s}
.s3 .arc{animation:none;opacity:0}
@keyframes arcs{0%{transform:scale(.4);opacity:0}15%{opacity:.95}100%{transform:scale(7.2);opacity:0}}
.bits{font-family:ui-monospace,Menlo,monospace;font-size:12px;font-weight:700;fill:#CA133E}
.adp{transition:filter 300ms}.s1 .adp{filter:drop-shadow(0 0 6px #DC9F0E)}.s3 .adp{filter:none}
.s3 .rr{filter:drop-shadow(0 0 7px #DC9F0E)}
.l1,.l2,.l3{opacity:0;transition:opacity 300ms}.c1 .l1,.c2 .l2,.c3 .l3{opacity:1}
.led{animation:bl 1s steps(2) infinite}@keyframes bl{50%{opacity:.35}}`;}
  html(){return `<div class="wrap" id="root"><div class="grid"><div class="stage"><svg class="s" id="svg" viewBox="0 0 560 270" role="img" aria-label="a computer sends radio waves to a router">${DEFS}
<path id="W1" d="M120 118 H214" fill="none"/><path id="W2" d="M470 130 H536" fill="none"/>
${LAP(34,72,150,92,'<text x="46" y="52" class="bits" id="b0">01101001</text><text x="46" y="72" class="bits">10010110</text>')}
<g class="adp"><rect x="190" y="112" width="48" height="36" rx="6" fill="url(#gBrass)" stroke="#7a5606" stroke-width="2" filter="url(#fDrop)"/><rect x="198" y="120" width="20" height="8" rx="2" fill="#1a1a1a"/><path d="M226 112V98" stroke="#44444B" stroke-width="4" stroke-linecap="round"/></g>
<g><path class="arc" d="M236 100A30 30 0 0 1 236 160"/><path class="arc" d="M236 100A30 30 0 0 1 236 160"/><path class="arc" d="M236 100A30 30 0 0 1 236 160"/></g>
<g class="rr">${ROUTERSVG(440,113,60,40)}</g>
<path d="M500 134 H536" stroke="#F58AA0" stroke-width="5" stroke-linecap="round"/><circle cx="545" cy="134" r="6" fill="#44444B"/>
<text class="cp l1" x="214" y="190" text-anchor="middle">Wireless adapter</text><text class="cp l1" x="214" y="204" text-anchor="middle" style="fill:#CA133E">data → radio waves</text>
<text class="cp l2" x="330" y="104" text-anchor="middle" style="fill:#CA133E">radio waves</text>
<text class="cp l3" x="470" y="192" text-anchor="middle">Router</text><text class="cp l3" x="470" y="206" text-anchor="middle" style="fill:#CA133E">radio waves → data</text>
<text class="cp" x="109" y="224" text-anchor="middle">Computer</text>
<g id="bt" style="opacity:0"><rect x="-26" y="-11" width="52" height="22" rx="11" fill="#1a1a1a"/><text y="4" text-anchor="middle" class="bits" style="fill:#DC9F0E">01101</text></g>
${PKT('pk')}</svg></div>${stepsOl(['Computer sends data to its wireless adapter which converts to radio waves','Radio waves transmitted to a Router','Router receives radio waves and converts them into data'])}</div><div class="act"><div id="re"></div></div></div>`;}
  r0(){this.$('bt').style.opacity=0;this.$('bt').setAttribute('transform','translate(-60 -60)');}
  play(){this.reset();const bt=this.$('bt');
    this.stp(300,1,()=>{this.fly(bt,this.$('W1'),1500);});
    this.at(1900,()=>{bt.style.opacity=0;});
    this.stp(2300,2);
    this.stp(5100,3,()=>{bt.style.opacity=0;this.at(500,()=>this.fly(bt,this.$('W2'),1300));});
    this.at(7200,()=>{this.doneAll();});}
  fin(){this.$('bt').setAttribute('transform','translate(536 130)');this.$('bt').style.opacity=1;}
}

/* ---------- Web terms ---------- */
class WebTerms extends Dual{
  meta(){return {n:4,labels:['Web server','Webpage','Website','Web browser']};}
  css(){return STEPS_CSS+NCSS+`
.tile{fill:#fff;stroke:#bdbdc2;stroke-width:2;transition:all 300ms;transform-box:fill-box;transform-origin:center}
.tile.on{stroke:#CA133E;stroke-width:3.5}
.s2 .t0{stroke:#CA133E;stroke-width:3.5;transform:scale(1.18);fill:#FDE8EC}
.tc{font-size:11px;font-weight:700;fill:#44444B;transition:fill 300ms}.s2 .t0c{fill:#CA133E}
.ws{opacity:0;transition:opacity 300ms;fill:none;stroke:#DC9F0E;stroke-width:3;stroke-dasharray:7 5}.s3 .ws{opacity:1}
.sbox{transition:filter 300ms}.s1 .sbox{filter:drop-shadow(0 0 8px #CA133E)}.s2 .sbox,.s3 .sbox,.s4 .sbox{filter:none}
.brw{opacity:.25;transition:opacity 400ms}.s4 .brw{opacity:1}
.tgp{opacity:0;transition:opacity 300ms}.c1 .g1,.c2 .g2,.c3 .g3,.c4 .g4{opacity:1}
.link{stroke:#F58AA0;stroke-width:4;stroke-dasharray:3 7;stroke-linecap:round;opacity:0;transition:opacity 300ms}.s4 .link{opacity:1;animation:dsh 500ms linear infinite}
@keyframes dsh{to{stroke-dashoffset:-20}}
.pg{opacity:0;transition:opacity 500ms}.s4 .pg{opacity:1}`;}
  html(){let tiles='';for(let i=0;i<6;i++){const x=40+(i%3)*68,y=96+Math.floor(i/3)*84;tiles+=`<g><rect class="tile t${i}" x="${x}" y="${y}" width="54" height="68" rx="5"/><path d="M${x+38} ${y}v14h16" fill="#E7E7E9"/><text class="tc t${i}c" x="${x+27}" y="${y+44}" text-anchor="middle">&lt;/&gt;</text><rect x="${x+8}" y="${y+10}" width="26" height="4" rx="2" fill="#E7E7E9"/></g>`;}
    return `<div class="wrap" id="root"><div class="grid"><div class="stage"><svg class="s" id="svg" viewBox="0 0 560 290" role="img" aria-label="web server holding web pages, a website, and a web browser">${DEFS}
<g class="sbox"><rect x="20" y="48" width="226" height="226" rx="12" fill="url(#gDark)" stroke="#111" filter="url(#fDrop)"/><rect x="28" y="56" width="210" height="18" rx="4" fill="#44444B"/><circle class="led" cx="224" cy="65" r="4" fill="#16B981"/><text x="36" y="69" class="cp" style="fill:#fff;font-size:10px;letter-spacing:.1em">WEB SERVER</text><rect x="28" y="78" width="210" height="188" rx="6" fill="#2b2b30"/></g>${tiles}
<rect class="ws" x="32" y="86" width="206" height="170" rx="12"/>
<g class="tgp g1"><rect x="44" y="14" width="180" height="24" rx="12" fill="#CA133E"/><text x="134" y="30" text-anchor="middle" class="tg" fill="#fff">Web server: contains pages</text></g>
<g class="tgp g2"><rect x="262" y="96" width="128" height="22" rx="11" fill="#CA133E"/><text x="326" y="111" text-anchor="middle" class="tg" fill="#fff">Webpage: HTML</text><path d="M262 107 C 256 107 250 107 246 118" fill="none" stroke="#CA133E" stroke-width="2"/></g>
<g class="tgp g3"><rect x="44" y="14" width="180" height="24" rx="12" fill="#DC9F0E"/><text x="134" y="30" text-anchor="middle" class="tg" fill="#1a1a1a">Website: related webpages</text></g>
<g class="brw"><g filter="url(#fDrop)"><rect x="318" y="150" width="224" height="124" rx="10" fill="#fff" stroke="#44444B" stroke-width="2.5"/><path d="M318 160a10 10 0 0 1 10-10h204a10 10 0 0 1 10 10v22H318z" fill="#E7E7E9"/><circle cx="334" cy="166" r="4" fill="#EF4444"/><circle cx="347" cy="166" r="4" fill="#DC9F0E"/><circle cx="360" cy="166" r="4" fill="#16B981"/><rect x="372" y="159" width="160" height="14" rx="7" fill="#fff" stroke="#bdbdc2"/><text x="380" y="170" class="cp" style="font-size:8px">www.cie.org.uk</text></g>
 <g class="pg"><rect x="334" y="192" width="90" height="12" rx="3" fill="#CA133E"/><rect x="334" y="212" width="190" height="6" rx="3" fill="#E7E7E9"/><rect x="334" y="224" width="170" height="6" rx="3" fill="#E7E7E9"/><rect x="334" y="236" width="150" height="6" rx="3" fill="#E7E7E9"/><rect x="450" y="190" width="72" height="16" rx="3" fill="#FDE8EC"/></g></g>
<path class="link" d="M246 190 C 280 190 290 210 318 212"/>
<g class="tgp g4"><rect x="340" y="120" width="192" height="22" rx="11" fill="#CA133E"/><text x="436" y="135" text-anchor="middle" class="tg" fill="#fff">Web browser: shows the page</text></g>
</svg></div>${stepsOl(['<b>Web server:</b> Computer which contain pages','<b>Webpage:</b> document written in HTML','<b>Website:</b> Collection of related webpages','<b>Web browser:</b> Software which allows user to display webpage on computer screen'])}</div><div class="act"><div id="re"></div></div></div>`;}
  play(){this.reset();[0,1,2,3].forEach((i,k)=>{const t=300+k*2200;this.stp(t,[1,2,3,4][k]);});this.at(300+4*2200,()=>this.doneAll());}
  fin(){}
}

/* ---------- How a web browser works ---------- */
class BrowserDemo extends Dual{
  meta(){return {n:3,labels:['Code is retrieved from server','Web browser runs the code','Website is displayed']};}
  css(){return STEPS_CSS+NCSS+`
.cl{font-family:ui-monospace,Menlo,monospace;font-size:10px;fill:#44444B;opacity:0;transition:opacity 250ms}
.cl.on{opacity:1}.cl.hl{fill:#CA133E;font-weight:700}
.gear{transform-origin:222px 190px;opacity:0;transition:opacity 300ms}.s2 .gear{opacity:1;animation:spin 2s linear infinite}.s3 .gear{opacity:0;animation:none}
@keyframes spin{to{transform:rotate(360deg)}}
.code{transition:opacity 400ms}.s3 .code{opacity:0}
.ren{opacity:0;transition:opacity 500ms}.s3 .ren{opacity:1}
.lbl{opacity:0;transition:opacity 300ms}.c1 .l1{opacity:1}
.led{animation:bl 1s steps(2) infinite}@keyframes bl{50%{opacity:.35}}`;}
  html(){const C=['&lt;html&gt;','&lt;h1&gt;Giraffe&lt;/h1&gt;','&lt;img src="giraffe.png"&gt;','&lt;p&gt;Giraffes are...&lt;/p&gt;','&lt;/html&gt;'];
    return `<div class="wrap" id="root"><div class="grid"><div class="stage"><svg class="s" id="svg" viewBox="0 0 560 280" role="img" aria-label="browser requests code from a server and displays the page">${DEFS}
<path id="RQ" d="M262 110H440" fill="none"/><path id="CD" d="M440 150H262" fill="none"/>
<path d="M262 110H440M440 150H262" stroke="#E7E7E9" stroke-width="2" stroke-dasharray="4 6"/>
<g filter="url(#fDrop)"><rect x="20" y="30" width="242" height="226" rx="12" fill="#fff" stroke="#44444B" stroke-width="2.5"/><path d="M20 42a12 12 0 0 1 12-12h218a12 12 0 0 1 12 12v22H20z" fill="#E7E7E9"/><circle cx="38" cy="47" r="4.5" fill="#EF4444"/><circle cx="52" cy="47" r="4.5" fill="#DC9F0E"/><circle cx="66" cy="47" r="4.5" fill="#16B981"/><rect x="80" y="39" width="168" height="16" rx="8" fill="#fff" stroke="#bdbdc2"/><text x="90" y="51" class="cp" style="font-size:9px">www.cie.org.uk/giraffe.html</text></g>
<g class="code">${C.map((c,i)=>`<text class="cl" id="c${i}" x="34" y="${92+i*24}">${c}</text>`).join('')}</g>
<g class="gear"><circle cx="222" cy="190" r="22" fill="none"/><g fill="#CA133E">${[0,45,90,135].map(a=>`<rect x="-4" y="-27" width="8" height="54" rx="2" transform="translate(222 190) rotate(${a})"/>`).join('')}<circle cx="222" cy="190" r="15"/></g><circle cx="222" cy="190" r="7" fill="#fff"/></g>
<g class="ren"><rect x="34" y="78" width="120" height="16" rx="4" fill="#CA133E"/><rect x="34" y="104" width="196" height="9" rx="4" fill="#E7E7E9"/><rect x="34" y="120" width="170" height="9" rx="4" fill="#E7E7E9"/><rect x="34" y="136" width="150" height="9" rx="4" fill="#E7E7E9"/><rect x="34" y="158" width="204" height="84" rx="8" fill="#FDE8EC" stroke="#F58AA0"/><path d="M52 232l40-44 28 30 20-18 44 32z" fill="#F58AA0"/><circle cx="196" cy="180" r="9" fill="#DC9F0E"/></g>
${SRV(440,70,100,120)}<text class="cp" x="490" y="212" text-anchor="middle">Web server</text>
<g class="lbl l1"><text class="tg" x="350" y="98" text-anchor="middle" fill="#CA133E">request</text><text class="tg" x="350" y="176" text-anchor="middle" fill="#CA133E">code (HTML)</text></g>
${PKT('pk')}<g id="pc" style="opacity:0"><rect x="-13" y="-9" width="26" height="18" rx="3" fill="#1a1a1a"/><text y="4" text-anchor="middle" class="bits" style="font-size:9px;fill:#DC9F0E;font-family:ui-monospace,monospace;font-weight:700">&lt;/&gt;</text></g>
</svg></div>${stepsOl(['Code is retrieved from server','Web browser runs the code','Website is displayed'])}</div><div class="act"><div id="re"></div></div></div>`;}
  r0(){['pk','pc'].forEach(i=>this.$(i).style.opacity=0);this.r.querySelectorAll('.cl').forEach(c=>c.classList.remove('on','hl'));}
  play(){this.reset();
    this.stp(300,1,()=>{this.fly(this.$('pk'),this.$('RQ'),1100);this.at(1200,()=>{this.$('pk').style.opacity=0;this.fly(this.$('pc'),this.$('CD'),1300);});
      for(let i=0;i<5;i++)this.at(2600+i*260,()=>{this.$('pc').style.opacity=i===4?0:1;this.$('c'+i).classList.add('on');});});
    this.stp(5100,2,()=>{for(let i=0;i<5;i++)this.at(300+i*420,()=>{this.r.querySelectorAll('.cl').forEach(c=>c.classList.remove('hl'));this.$('c'+i).classList.add('hl');});});
    this.stp(8000,3);
    this.at(9500,()=>this.doneAll());}
  fin(){this.r.querySelectorAll('.cl').forEach(c=>c.classList.add('on'));['pk','pc'].forEach(i=>this.$(i).style.opacity=0);}
}

/* ---------- Protocol ---------- */
class ProtocolDemo extends Dual{
  meta(){return {n:3,labels:['Agree the rules','Data is sent following the rules','Receiver understands the data']};}
  css(){return STEPS_CSS+NCSS+`
.rule{opacity:0;transform-box:fill-box;transform-origin:center;transform:scale(.6);transition:opacity 400ms,transform 500ms cubic-bezier(.3,1.4,.5,1)}.s1 .rule{opacity:1;transform:none}
.cpy{opacity:0;transition:opacity 400ms,transform 700ms ease-in-out}.s1 .cpy{opacity:1;transform:translate(0,0)!important}
.ok{opacity:0;transition:opacity 300ms}.s1 .ok1{opacity:1}.s3 .ok3{opacity:1}
.msg{opacity:0;transition:opacity 400ms}.s3 .msg{opacity:1}
.def2{background:#fff;border:2px solid #CA133E;border-radius:14px;padding:8px 14px;font-size:14px;text-align:center;margin-bottom:10px;line-height:1.5}.def2 b{color:#CA133E}`;}
  html(){return `<div class="wrap" id="root"><div class="def2"><b>Protocol:</b> Set of rules agreed by the sender and receiver when data is transferred between 2 devices over internet</div><div class="grid"><div class="stage"><svg class="s" id="svg" viewBox="0 0 560 250" role="img" aria-label="sender and receiver agree on rules, then data is sent">${DEFS}
<path id="PW" d="M150 128H410" fill="none" stroke="#E7E7E9" stroke-width="5" stroke-dasharray="4 7" stroke-linecap="round"/>
${LAP(16,76,130,84,'<text x="75" y="60" text-anchor="middle" class="cp" style="fill:#CA133E;font-size:13px">Hello!</text>')}${LAP(414,76,130,84,'<text class="msg" x="75" y="60" text-anchor="middle" style="fill:#16B981;font-size:13px;font-weight:700">Hello!</text>')}
<text class="cp" x="81" y="196" text-anchor="middle">Sender</text><text class="cp" x="479" y="196" text-anchor="middle">Receiver</text>
<g class="rule"><rect x="220" y="32" width="120" height="76" rx="10" fill="url(#gDark)" stroke="#111" filter="url(#fDrop)"/><text x="280" y="52" text-anchor="middle" class="tg" fill="#DC9F0E">RULES (PROTOCOL)</text><g fill="#fff" font-size="11" font-weight="700"><text x="232" y="72">✓ Format</text><text x="232" y="88">✓ Order</text><text x="232" y="104">✓ Speed</text></g></g>
<g class="cpy" style="transform:translate(70px,-70px)"><rect x="150" y="150" width="52" height="30" rx="6" fill="#1a1a1a"/><text x="176" y="169" text-anchor="middle" class="tg" fill="#DC9F0E">RULES ✓</text></g>
<g class="cpy" style="transform:translate(-70px,-70px)"><rect x="358" y="150" width="52" height="30" rx="6" fill="#1a1a1a"/><text x="384" y="169" text-anchor="middle" class="tg" fill="#DC9F0E">RULES ✓</text></g>
<g class="ok ok3"><circle cx="479" cy="214" r="12" fill="#16B981"/><path d="M473 214l4 4 8-9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>
${PKT('pk','DATA')}</svg></div>${stepsOl(['Sender and receiver agree on a set of rules','Data is sent following those rules','Receiver understands the data'])}</div><div class="act"><div id="re"></div></div></div>`;}
  r0(){this.$('pk').style.opacity=0;}
  play(){this.reset();
    this.stp(300,1);
    this.stp(2700,2,()=>this.fly(this.$('pk'),this.$('PW'),2000));
    this.stp(5200,3,()=>{this.$('pk').style.opacity=0;});
    this.at(6800,()=>this.doneAll());}
  fin(){this.$('pk').style.opacity=0;}
}

/* ---------- HTTP / SSL / HTTPS ---------- */
const HTT={
 H:{t:'HTTP',st:'Hypertext transfer protocol',d:'Communication protocol which allows transmission of <b>data</b> to and from <b>webserver</b>',u:['Accessing "WWW"','Transfer contents of a webpage to webbrowser for viewing','Download From webserver']},
 S:{t:'SSL',st:'Secure Socket Layer',d:'Communication protocol that forms an <b class="bl">encrypted link</b> between <b>webserver</b> &amp; <b>client</b>',u:['Allow data to be <b>encrypted</b> while being transmitted over the internet']},
 X:{t:'HTTPS',st:'Hypertext Transfer Protocol Secure',d:'Communication protocol which allows transmission of data to and from webserver by using <b>encryption</b>',u:['Uses <b>SSL</b>']}};
class HttpDemo extends Sim{
  get stepper(){return false;}get auto(){return true;}
  css(){return NCSS+`
.tabs{display:flex;justify-content:center;gap:8px;margin-bottom:10px}
.tabs button{font-family:'JumperSafe','Poppins',sans-serif;font-weight:700;font-size:14px;border:2px solid #CA133E;background:#fff;color:#CA133E;border-radius:999px;padding:6px 18px;cursor:pointer}
.tabs button.on{background:#CA133E;color:#fff}
.grid{display:grid;grid-template-columns:1.4fr 1fr;gap:12px;align-items:start}
.stage{background:#fff;border:2px solid #CA133E;border-radius:16px;padding:8px;box-shadow:0 4px 10px rgba(202,19,62,.1)}
.txt{background:#fff;border:2px solid #E7E7E9;border-radius:16px;padding:12px 16px;text-align:left;font-size:14px;line-height:1.55}
.txt .st{font-family:'JumperSafe','Poppins',sans-serif;font-style:italic}.txt .st b{font-size:17px;font-style:normal}
.txt .bl{color:#2563EB}.txt ul{margin:6px 0 0;padding-left:20px}.txt li{margin:3px 0}.txt .ul{font-weight:700;color:#CA133E;font-size:12px;letter-spacing:.08em;text-transform:uppercase;margin-top:10px}
.tun{transform-box:fill-box;transform-origin:left center;transform:scaleX(0);transition:transform 900ms ease-in-out}.tn .tun{transform:scaleX(1)}
.lk{opacity:0;transition:opacity 400ms}.tn .lk{opacity:1}
.use{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:8px}
.use span{display:flex;align-items:center;gap:6px;background:#fff;border:2px solid #E7E7E9;border-radius:999px;padding:5px 12px 5px 8px;font-size:12.5px;font-weight:700;color:#44444B;opacity:.45;transition:all 300ms}
.use span.on{opacity:1;border-color:#CA133E;background:#FDE8EC;color:#CA133E}.use svg{width:20px;height:20px}
.ul li{opacity:0;transition:opacity 300ms}
.sc{opacity:0;transition:opacity 300ms}.tn .sc{opacity:1}
.led{animation:bl 1s steps(2) infinite}@keyframes bl{50%{opacity:.35}}
@container (max-width:600px){.grid{grid-template-columns:1fr}}`;}
  html(){const IC={cart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h3l2.5 11h9L20 7H7"/><circle cx="10" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/></svg>',bank:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-6 9 6M5 10v8M10 10v8M14 10v8M19 10v8M3 21h18"/></svg>',chat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H10l-5 4v-4H4z"/></svg>',mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></svg>'};
    const lock=(x,y)=>`<g class="lk" transform="translate(${x} ${y})"><rect x="-12" y="-4" width="24" height="18" rx="4" fill="url(#gBrass)" stroke="#7a5606" stroke-width="2"/><path d="M-7 -4v-6a7 7 0 0 1 14 0v6" fill="none" stroke="#44444B" stroke-width="3.5"/><circle cy="5" r="2.2" fill="#1a1a1a"/></g>`;
    this.IC=IC;
    return `<div class="wrap" id="root"><div class="tabs"><button type="button" id="tH" class="on">HTTP</button><button type="button" id="tS">SSL</button><button type="button" id="tX">HTTPS</button></div>
<div class="grid"><div><div class="stage"><svg class="s" id="svg" viewBox="0 0 520 220" role="img" aria-label="client and web server">${DEFS}
<path id="HQ" d="M120 100H400" fill="none"/><path id="HR" d="M400 126H120" fill="none"/>
<rect class="tun" x="110" y="84" width="300" height="56" rx="28" fill="url(#gDark)" stroke="#111" filter="url(#fDrop)"/>
<text class="sc" x="260" y="76" text-anchor="middle" style="font-size:11px;font-weight:700;fill:#2563EB">encrypted link</text>
${LAP(14,70,100,64)}${SRV(410,60,80,100)}<text class="cp" x="64" y="168" text-anchor="middle">Client</text><text class="cp" x="450" y="178" text-anchor="middle">Webserver</text>
${lock(116,112)}${lock(404,112)}
<g id="sc1" style="opacity:0"><rect x="-26" y="-11" width="52" height="22" rx="11" fill="#fff" stroke="#CA133E" stroke-width="2"/><text y="4" text-anchor="middle" class="tg" id="sc1t" fill="#CA133E">GET</text></g>
<g id="sc2" style="opacity:0"><rect x="-26" y="-11" width="52" height="22" rx="11" fill="#CA133E"/><text y="4" text-anchor="middle" class="tg" id="sc2t" fill="#fff">&lt;/&gt;</text></g>
</svg></div><div class="use" id="use">${[['cart','Online shopping'],['bank','Online banking'],['chat','Instant messaging'],['mail','Sending &amp; receiving emails']].map(([i,t])=>`<span>${IC[i]}${t}</span>`).join('')}</div></div>
<div class="txt" id="txt"></div></div><div class="act"><button class="re" id="re" type="button">▶ Replay</button></div></div>`;}
  init(){this.m='H';[['tH','H'],['tS','S'],['tX','X']].forEach(([i,m])=>this.$(i).onclick=()=>this.mode(m));this.mode('H',true);}
  mode(m,q){this.m=m;[['tH','H'],['tS','S'],['tX','X']].forEach(([i,k])=>this.$(i).classList.toggle('on',k===m));const d=HTT[m];
    this.$('use').style.display=m==='X'?'':'none';
    this.$('txt').innerHTML=`<div class="st"><b>Stands for:-</b><br>${d.st}</div><p>${d.d}</p><div class="ul">${m==='X'?'':'Usage'}</div><ul class="ul" style="padding-left:20px;font-weight:400;font-size:14px;text-transform:none;letter-spacing:0;color:#1A1A1A;margin-top:4px">${d.u.map(u=>`<li>${u}</li>`).join('')}</ul>`;
    if(!q)this.begin();else this.reset();}
  reset(){this.clear();this.root.classList.remove('noanim','tn');['sc1','sc2'].forEach(i=>this.$(i).style.opacity=0);this.r.querySelectorAll('.use span').forEach(s=>s.classList.remove('on'));this.r.querySelectorAll('#txt li').forEach(l=>l.style.opacity=0);}
  play(){this.reset();const m=this.m,a=this.$('sc1'),b=this.$('sc2');
    this.at(200,()=>this.r.querySelectorAll('#txt li').forEach((l,i)=>setTimeout(()=>l.style.opacity=1,i*350)));
    const run=t=>{this.at(t,()=>{this.$('sc1t').textContent=m==='H'?'GET':'GET 🔒';a.style.opacity=1;this.fly(a,this.$('HQ'),1200);});this.at(t+1250,()=>{a.style.opacity=0;this.$('sc2t').textContent=m==='H'?'</>':'#@%▒';this.fly(b,this.$('HR'),1300);});this.at(t+2600,()=>{b.style.opacity=0;});};
    if(m==='H'){run(500);this.at(4000,()=>this.busy&&this.busy(false));}
    else if(m==='S'){this.at(500,()=>this.root.classList.add('tn'));this.at(1700,()=>{this.$('sc1t').textContent='#@%▒';a.style.opacity=1;this.fly(a,this.$('HQ'),1400);});this.at(3200,()=>{a.style.opacity=0;});}
    else{this.at(500,()=>this.root.classList.add('tn'));run(1700);const us=[...this.r.querySelectorAll('.use span')];us.forEach((s,i)=>this.at(4700+i*500,()=>s.classList.add('on')));}}
  final(){this.reset();this.root.classList.add('noanim','tn');this.r.querySelectorAll('#txt li').forEach(l=>l.style.opacity=1);if(this.m==='X')this.r.querySelectorAll('.use span').forEach(s=>s.classList.add('on'));}
}

/* ---------- FTP ---------- */
class FtpDemo extends Dual{
  meta(){return {n:5,labels:['Download FTP client program','Connect to FTP server','Login with username & password','Locate files on your computer','Click upload']};}
  css(){return STEPS_CSS+NCSS+`
.win{opacity:0;transform-box:fill-box;transform-origin:center;transform:scale(.85);transition:opacity 400ms,transform 500ms cubic-bezier(.3,1.4,.5,1)}.win.show{opacity:1;transform:none}
.dl{opacity:0}.dlc{opacity:0;transition:opacity 300ms}
.line{fill:none;stroke:#F58AA0;stroke-width:5;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1000ms ease-in-out}.s2 .line{stroke-dashoffset:0}
.stt{font-size:10px;font-weight:700}
.btn{fill:#fff;stroke:#CA133E;stroke-width:2;transition:fill 150ms}.btn.pr{fill:#CA133E}
.fr{fill:#fff;stroke:#E7E7E9;stroke-width:1.5;transition:fill 200ms,stroke 200ms}.fr.sel{fill:#FDE8EC;stroke:#CA133E;stroke-width:2.5}
.fi{font-size:10.5px;font-weight:600;fill:#1A1A1A}
.srvf{opacity:0;transition:opacity 400ms}.srvf.on{opacity:1}
.led{animation:bl 1s steps(2) infinite}@keyframes bl{50%{opacity:.35}}
.def2{background:#fff;border:2px solid #CA133E;border-radius:14px;padding:8px 14px;font-size:13.5px;text-align:center;margin-bottom:10px;line-height:1.5}.def2 b{color:#CA133E}`;}
  html(){const F=['index.html','logo.png','video.mp4'];
    return `<div class="wrap" id="root"><div class="def2"><b>FTP</b> — File Transfer Protocol. Used to transfer files from 1 pc to another over internet · download from other servers · used in cases when file size is very large</div><div class="stage"><svg class="s" id="svg" viewBox="0 0 700 300" role="img" aria-label="uploading a file to an FTP server with an FTP client">${DEFS}
<path id="D1" d="M46 40 L190 200" fill="none"/><path id="U1" d="M110 210 C 200 150 300 120 566 150" fill="none"/><path class="line" pathLength="1" d="M360 150 C 420 150 440 150 480 150"/>
${CLOUD(20,6)}<text class="cp" x="46" y="58" text-anchor="middle">Internet</text>
<rect x="14" y="70" width="352" height="220" rx="10" fill="#E7E7E9" stroke="#bdbdc2"/><text class="cp" x="28" y="86" style="font-size:9px">Your computer</text>
<g class="win" id="win"><g filter="url(#fDrop)"><rect x="26" y="96" width="328" height="184" rx="10" fill="#fff" stroke="#44444B" stroke-width="2.5"/><path d="M26 106a10 10 0 0 1 10-10h308a10 10 0 0 1 10 10v16H26z" fill="#CA133E"/><text x="40" y="115" class="tg" fill="#fff" style="font-size:11px">FTP client</text><circle cx="332" cy="109" r="4" fill="#fff" opacity=".7"/></g>
<text class="stt" x="40" y="142" fill="#44444B">Host:</text><rect x="74" y="131" width="78" height="15" rx="4" fill="#F5F5F6" stroke="#bdbdc2"/><text id="th" class="stt" x="79" y="142" fill="#1A1A1A">ftp.mysite.com</text>
<text class="stt" x="160" y="142" fill="#44444B">User:</text><rect x="190" y="131" width="62" height="15" rx="4" fill="#F5F5F6" stroke="#bdbdc2"/><text id="tu" class="stt" x="195" y="142" fill="#1A1A1A"></text>
<text class="stt" x="258" y="142" fill="#44444B">Pass:</text><rect x="288" y="131" width="50" height="15" rx="4" fill="#F5F5F6" stroke="#bdbdc2"/><text id="tp" class="stt" x="293" y="143" fill="#1A1A1A"></text>
<rect id="bc" class="btn" x="40" y="154" width="70" height="20" rx="10"/><text x="75" y="168" text-anchor="middle" class="tg" fill="#CA133E" id="bct">Connect</text>
<text id="stt" class="stt" x="122" y="168" fill="#6B6B73">Not connected</text>
<text class="cp" x="40" y="194" style="font-size:9px">Local files</text>${F.map((f,i)=>`<g><rect class="fr" id="fr${i}" x="40" y="${200+i*24}" width="130" height="20" rx="5"/><text class="fi" x="50" y="${214+i*24}">📄 ${f}</text></g>`).join('')}
<text class="cp" x="196" y="194" style="font-size:9px">Server</text><rect x="196" y="200" width="144" height="68" rx="6" fill="#F5F5F6" stroke="#E7E7E9"/><g id="sf" class="srvf"><rect x="204" y="208" width="128" height="20" rx="5" fill="#D1FAE5" stroke="#16B981"/><text class="fi" x="214" y="222">📄 index.html ✓</text></g>
<rect id="bu" class="btn" x="260" y="154" width="80" height="20" rx="10"/><text x="300" y="168" text-anchor="middle" class="tg" fill="#CA133E" id="but">⬆ Upload</text></g>
${SRV(486,96,160,150,3)}<text class="cp" x="566" y="266" text-anchor="middle">FTP server</text>
<g id="dli" style="opacity:0"><rect x="-17" y="-13" width="34" height="26" rx="5" fill="#CA133E"/><path d="M0 -6v10M-5 0l5 6 5-6" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>
<g id="fl" style="opacity:0"><rect x="-13" y="-10" width="26" height="20" rx="3" fill="#fff" stroke="#CA133E" stroke-width="2"/><text y="4" text-anchor="middle" class="tg" fill="#CA133E" style="font-size:8px">HTML</text></g>
</svg></div>${stepsOl(['Download FTP client program','Connect to FTP server','Login to server using username &amp; password','Locate files on your computer','Click the upload button, to upload files'])}<div class="act"><div id="re"></div></div></div>`.replace('class="steps"','class="steps h"');}
  r0(){['dli','fl'].forEach(i=>this.$(i).style.opacity=0);['th'].forEach(()=>{});this.$('tu').textContent='';this.$('tp').textContent='';this.$('stt').textContent='Not connected';this.$('stt').setAttribute('fill','#6B6B73');this.$('bct').textContent='Connect';this.$('bct').setAttribute('fill','#CA133E');this.$('but').setAttribute('fill','#CA133E');this.r.querySelectorAll('.fr').forEach(f=>f.classList.remove('sel'));this.r.querySelectorAll('.btn').forEach(b=>b.classList.remove('pr'));this.$('sf').classList.remove('on');this.$('win').classList.remove('show');this.$('dli').setAttribute('transform','translate(46 40)');}
  type(el,txt,t,mask){for(let i=1;i<=txt.length;i++)this.at(t+i*110,()=>{this.$(el).textContent=mask?'•'.repeat(i):txt.slice(0,i);});}
  play(){this.reset();const d=this.$('dli');
    this.stp(300,1,()=>{d.style.opacity=1;d.setAttribute('transform','translate(46 40)');this.at(100,()=>this.fly(d,this.$('D1'),1300));this.at(1500,()=>{d.style.opacity=0;this.$('win').classList.add('show');});});
    this.stp(2700,2,()=>{this.at(900,()=>{this.$('stt').textContent='Connected ✓';this.$('stt').setAttribute('fill','#059669');});});
    this.stp(4600,3,()=>{this.type('tu','ahmad',100);this.type('tp','secret1',800,true);this.at(1900,()=>{this.$('bct').textContent='Login';this.$('bc').classList.add('pr');this.$('bct').setAttribute('fill','#fff');});this.at(2300,()=>{this.$('stt').textContent='Logged in ✓';});});
    this.stp(7600,4,()=>{this.at(500,()=>this.$('fr0').classList.add('sel'));});
    this.stp(9600,5,()=>{this.at(400,()=>{this.$('bu').classList.add('pr');this.$('but').setAttribute('fill','#fff');});this.at(900,()=>this.fly(this.$('fl'),this.$('U1'),1800));this.at(2800,()=>{this.$('fl').style.opacity=0;this.$('sf').classList.add('on');});});
    this.at(13200,()=>this.doneAll());}
  fin(){this.$('win').classList.add('show');this.$('fl').style.opacity=0;this.$('sf').classList.add('on');this.$('fr0').classList.add('sel');this.$('stt').textContent='Logged in ✓';this.$('stt').setAttribute('fill','#059669');this.$('tu').textContent='ahmad';this.$('tp').textContent='•••••••';}
}

/* ---------- URL game ---------- */
const URLC=[['p','Protocol'],['s1','://'],['w','www.'],['d','Domain name'],['t','Domain type'],['s2','/'],['a','Path'],['s3','/'],['f','File name']];
class UrlGame extends Sim{
  get stepper(){return false;}
  css(){return NCSS+`
.def2{background:#fff;border:2px solid #CA133E;border-radius:14px;padding:10px 14px;font-size:14px;text-align:center;margin-bottom:12px;line-height:1.55}.def2 b{color:#CA133E}
.bar{background:linear-gradient(180deg,#F5F5F6,#d9d9de);border:2px solid #44444B;border-radius:18px;padding:10px 12px;box-shadow:inset 0 2px 5px rgba(0,0,0,.2),0 4px 10px rgba(0,0,0,.12)}
.bar .top{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;color:#6B6B73;margin-bottom:8px;letter-spacing:.06em}
.dot{width:10px;height:10px;border-radius:50%;display:inline-block}
.tray{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;min-height:56px;background:#fff;border-radius:999px;padding:10px 14px;border:2px solid #bdbdc2}
.chip{touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab;font-family:'JumperSafe','Poppins',sans-serif;font-weight:700;font-size:13px;border-radius:999px;padding:8px 14px;border:2px solid #A01030;background:#CA133E;color:#fff;box-shadow:0 3px 0 #A01030;position:relative;margin:0}
.chip.sy{background:#fff;color:#1A1A1A;border-color:#DC9F0E;box-shadow:0 3px 0 #9a6c06;font-size:15px;padding:8px 12px}
.chip.drag{z-index:5;cursor:grabbing;box-shadow:0 10px 18px rgba(0,0,0,.3);transition:none}
.chip.ok{background:#16B981;border-color:#059669;box-shadow:0 3px 0 #059669;color:#fff}.chip.no{background:#EF4444;border-color:#b91c1c;box-shadow:0 3px 0 #b91c1c;color:#fff}
.chip:focus-visible{outline:3px solid #DC9F0E;outline-offset:2px}
.acts{display:flex;gap:8px;justify-content:center;margin-top:12px}
.acts button{font-family:'JumperSafe','Poppins',sans-serif;font-weight:700;font-size:14px;border-radius:999px;padding:8px 18px;cursor:pointer;border:2px solid #CA133E;background:#fff;color:#CA133E}
.acts button.pri{background:#CA133E;color:#fff;box-shadow:0 3px 0 #A01030}
.msg{text-align:center;font-weight:700;font-size:14px;margin-top:10px;min-height:22px}.msg.g{color:#059669}.msg.r{color:#CA133E}
.ex{display:none;margin-top:10px;background:linear-gradient(135deg,#1a1a1a,#3a1a1a);border-radius:14px;padding:12px 14px;text-align:center;font-family:ui-monospace,Menlo,monospace;font-size:14px;color:#fff;word-break:break-all}
.ex.show{display:block}.ex b{font-weight:700}.ex .c1{color:#F58AA0}.ex .c2{color:#DC9F0E}.ex .c3{color:#fff}.ex .c4{color:#86efac}.ex .c5{color:#93c5fd}
.ex small{display:block;font-family:'Poppins',sans-serif;color:#D1D1D6;font-size:11px;margin-top:6px}`;}
  html(){return `<div class="wrap" id="root"><div class="def2"><b>URL</b> — Uniform Resource Locator. It's a simpler way to identify a website than using the IP address of the web server.<br><b>Drag the pieces</b> into the right order to build the address.</div>
<div class="bar"><div class="top"><span class="dot" style="background:#EF4444"></span><span class="dot" style="background:#DC9F0E"></span><span class="dot" style="background:#16B981"></span>&nbsp;ADDRESS BAR</div><div class="tray" id="tray"></div></div>
<div class="msg" id="msg"></div><div class="acts"><button type="button" class="pri" id="ck">Check order</button><button type="button" id="sh">Shuffle</button></div>
<div class="ex" id="ex"><span class="c1">https</span><span class="c2">://</span><span class="c3">www.</span><span class="c4">cie</span><span class="c5">.org.uk</span><span class="c2">/</span><span class="c1">gcseict</span><span class="c2">/</span><span class="c4">giraffe.html</span><small>protocol · :// · www. · domain name · domain type · / · path · / · file name</small></div></div>`;}
  init(){this.$('ck').onclick=()=>this.check();this.$('sh').onclick=()=>this.shuffle();this.shuffle();}
  shuffle(){const tr=this.$('tray');tr.innerHTML='';let a=URLC.slice();do{a.sort(()=>Math.random()-.5);}while(a.every((c,i)=>c[1]===URLC[i][1]));
    a.forEach(([id,l])=>{const b=document.createElement('button');b.type='button';b.className='chip'+(/^s/.test(id)||id==='w'?' sy':'');b.textContent=l;b.dataset.l=l;this.wire(b);tr.append(b);});
    this.$('msg').textContent='';this.$('msg').className='msg';this.$('ex').classList.remove('show');}
  wire(b){const tr=this.$('tray');
    b.addEventListener('pointerdown',e=>{if(e.button)return;e.preventDefault();this.clrm();tr.setPointerCapture(e.pointerId);b.classList.add('drag');const r0=b.getBoundingClientRect(),gx=e.clientX-r0.left,gy=e.clientY-r0.top;
      const mv=ev=>{b.style.transform='';const n=b.getBoundingClientRect();b.style.transform=`translate(${ev.clientX-gx-n.left}px,${ev.clientY-gy-n.top}px)`;
        const px=ev.clientX,py=ev.clientY;for(const o of [...tr.children]){if(o===b)continue;const q=o.getBoundingClientRect();if(px>q.left&&px<q.right&&py>q.top-6&&py<q.bottom+6){const before=px<q.left+q.width/2;const nb=before?o:o.nextSibling;if(nb!==b&&b.nextSibling!==nb){const bf=b.getBoundingClientRect();tr.insertBefore(b,nb);b.style.transform='';const af=b.getBoundingClientRect();b.style.transform=`translate(${ev.clientX-gx-af.left}px,${ev.clientY-gy-af.top}px)`;}break;}}};
      const up=()=>{b.classList.remove('drag');b.style.transform='';tr.removeEventListener('pointermove',mv);tr.removeEventListener('pointerup',up);tr.removeEventListener('pointercancel',up);};
      tr.addEventListener('pointermove',mv);tr.addEventListener('pointerup',up);tr.addEventListener('pointercancel',up);});
    b.addEventListener('keydown',e=>{const k=e.key;if(k==='ArrowLeft'&&b.previousElementSibling){tr.insertBefore(b,b.previousElementSibling);b.focus();e.preventDefault();this.clrm();}else if(k==='ArrowRight'&&b.nextElementSibling){tr.insertBefore(b.nextElementSibling,b);b.focus();e.preventDefault();this.clrm();}});}
  clrm(){this.r.querySelectorAll('.chip').forEach(c=>c.classList.remove('ok','no'));this.$('msg').textContent='';this.$('msg').className='msg';}
  check(){const cs=[...this.$('tray').children];let n=0;cs.forEach((c,i)=>{const ok=c.dataset.l===URLC[i][1];c.classList.toggle('ok',ok);c.classList.toggle('no',!ok);if(ok)n++;});
    const m=this.$('msg');if(n===cs.length){m.textContent='Correct! That is a full URL.';m.className='msg g';this.$('ex').classList.add('show');}else{m.textContent=n+' of '+cs.length+' in the right place. Fix the red ones.';m.className='msg r';this.$('ex').classList.remove('show');}}
  final(){}
}

[['compiler-demo',CompilerDemo],['linker-demo',LinkerDemo],['keyboard-demo',KeyboardDemo],['printer3d-demo',Printer3D],['speaker-demo',SpeakerDemo],['actuator-lab',ActuatorLab],['hdd-demo',HddDemo],['cd-demo',CdDemo],['access-demo',AccessDemo],['ipo-calc',IpoCalc],['hubswitch-demo',HubSwitch],['router-demo',RouterDemo],['wifi-demo',WifiDemo],['webterms-demo',WebTerms],['browser-demo',BrowserDemo],['protocol-demo',ProtocolDemo],['http-demo',HttpDemo],['ftp-demo',FtpDemo],['url-game',UrlGame]].forEach(([n,c])=>{if(!customElements.get(n))customElements.define(n,c);});
})();