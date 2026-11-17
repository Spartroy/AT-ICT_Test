/* AT-ICT guide sims, part 2: <audioconf-demo>, <videoconf-demo>, <virus-demo>, <virussigns-demo>, <antivirus-demo> */
(function(){
const CSS=`
:host{display:block;width:100%;font-family:var(--font-body,'Poppins',system-ui,sans-serif);color:#1A1A1A;container-type:inline-size}
*{box-sizing:border-box}[hidden]{display:none!important}
.wrap{background:#FDF5F6;border-radius:20px;padding:16px 12px 14px;position:relative}
.def{text-align:center;font-size:15px;line-height:1.6;margin:0 6px 12px}.def b{color:#CA133E}
.seg{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:12px}
.seg button{font-family:inherit;font-weight:700;font-size:13px;padding:7px 14px;border-radius:999px;border:2px solid #CA133E;background:#fff;color:#CA133E;cursor:pointer}
.seg button.on{background:#CA133E;color:#fff;box-shadow:0 3px 0 #A01030}
.ctl{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;margin-top:12px}
.ctl button,button.pill{font-family:inherit;font-weight:700;font-size:14px;border-radius:999px;padding:8px 16px;cursor:pointer;border:2px solid #CA133E;background:#fff;color:#CA133E}
.ctl button.pri,button.pill.pri{background:#CA133E;color:#fff;box-shadow:0 3px 0 #A01030;font-size:15px;padding:9px 22px}
.ctl button:active,button.pill:active{transform:translateY(2px);box-shadow:none}
.ctl button:disabled{opacity:.4;cursor:default}
button:focus-visible{outline:3px solid #DC9F0E;outline-offset:2px}
.stx{text-align:center;font-size:13px;color:#44444B;margin-top:8px;min-height:19px}.stx b{color:#CA133E}
.stage{background:#fff;border:2px solid #F3C4CE;border-radius:16px;overflow:hidden;position:relative}
svg.s{display:block;width:100%;height:auto}
ol.steps{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:6px;counter-reset:s}
ol.steps li{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border-radius:12px;background:#fff;border:2px solid #F3C4CE;font-size:13.5px;line-height:1.45;cursor:pointer;transition:all .25s}
ol.steps li::before{counter-increment:s;content:counter(s);flex:0 0 24px;height:24px;border-radius:50%;background:#F3C4CE;color:#CA133E;font-weight:700;font-size:13px;display:grid;place-items:center}
ol.steps li.on{border-color:#CA133E;background:#FDE8EC}ol.steps li.on::before{background:#CA133E;color:#fff}
ol.steps li.done{border-color:#BFE6D5}ol.steps li.done::before{content:'✓';background:#059669;color:#fff}
ol.steps li b{color:#CA133E}ol.steps li>span{flex:1;min-width:0}
@media print{.ctl,.seg{display:none}}
`;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const DEFS=`<defs>
<linearGradient id="gBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f4f6"/><stop offset="1" stop-color="#c9c9d0"/></linearGradient>
<linearGradient id="gDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a4a52"/><stop offset="1" stop-color="#1c1c20"/></linearGradient>
<linearGradient id="gSteel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a9aa3"/><stop offset=".5" stop-color="#e4e4e8"/><stop offset="1" stop-color="#8a8a93"/></linearGradient>
<linearGradient id="gCrim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0305a"/><stop offset="1" stop-color="#a01030"/></linearGradient>
<linearGradient id="gWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c58a54"/><stop offset="1" stop-color="#8a5a32"/></linearGradient>
<linearGradient id="gWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe4e7"/><stop offset="1" stop-color="#d8c9ce"/></linearGradient>
<radialGradient id="gLens" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#5b7bd6"/><stop offset=".5" stop-color="#16203f"/><stop offset="1" stop-color="#05070f"/></radialGradient>
<linearGradient id="gMesh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a3a42"/><stop offset=".45" stop-color="#8a8a93"/><stop offset="1" stop-color="#2a2a30"/></linearGradient>
<filter id="fDrop" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity=".3"/></filter>
</defs>`;

class Act extends HTMLElement{
  constructor(){super();this.tm=[];this.r=this.attachShadow({mode:'open'});this.r.innerHTML='<style>'+CSS+this.css()+'</style>'+this.html();this.$=id=>this.r.getElementById(id);}
  connectedCallback(){if(!this._b){this._b=1;this.init();}this.start();}
  disconnectedCallback(){this.clr();this.stop();}
  later(f,ms){const t=setTimeout(()=>{this.tm=this.tm.filter(x=>x!==t);f();},ms);this.tm.push(t);return t;}
  clr(){this.tm.forEach(clearTimeout);this.tm=[];}
  css(){return'';}start(){}stop(){}init(){}
}

/* Stepper: Back / Next / Play all / Restart + a numbered list of steps. Subclasses give list(), show(k), ms(k). */
const CTL=`<div class="ctl"><button type="button" id="bk">◀ Back</button><button type="button" class="pri" id="nx">Next step ▶</button><button type="button" id="pa">⏩ Play all</button><button type="button" id="rs">↺ Restart</button></div><div class="stx" id="stx"></div>`;
class Steps extends Act{
  init(){this.k=0;this.auto=false;
    this.$('bk').onclick=()=>{this.auto=false;this.go(this.k-1);};
    this.$('nx').onclick=()=>{this.auto=false;this.go(this.k+1);};
    this.$('pa').onclick=()=>{this.auto=true;this.go(0);};
    this.$('rs').onclick=()=>{this.auto=false;this.go(0);};
    this.build();this.go(0);}
  stop(){this.auto=false;}
  ms(){return 3200;}
  build(){const ol=this.$('steps');ol.innerHTML=this.list().map(t=>`<li tabindex="0"><span>${t}</span></li>`).join('');
    [...ol.children].forEach((li,i)=>{li.onclick=()=>{this.auto=false;this.go(i);};li.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.auto=false;this.go(i);}};});}
  go(k){const n=this.list().length;if(k<0||k>=n)return;this.clr();this.k=k;this.show(k);this.mark();
    if(this.auto&&k<n-1)this.later(()=>this.go(k+1),this.ms(k));else if(this.auto&&k===n-1)this.later(()=>{this.auto=false;this.mark();},this.ms(k));}
  mark(){const n=this.list().length,k=this.k;
    [...this.$('steps').children].forEach((li,i)=>{li.className=i===k?'on':i<k?'done':'';});
    this.$('bk').disabled=k===0;this.$('nx').disabled=k>=n-1;this.$('pa').disabled=this.auto;
    this.$('stx').innerHTML=this.auto?`<b>Playing</b> · step ${k+1} of ${n}`:k>=n-1?`<b>All ${n} steps done</b>`:`<b>Step ${k+1} of ${n}</b>`;}
}

/* ====================================================== AUDIO CONFERENCE ====================================================== */
const PH=(id,x,y,name)=>`<g transform="translate(${x} ${y})"><g id="${id}" class="ph idle">
<g class="rg"><circle r="30"/><circle r="30"/><circle r="30"/></g>
<g class="wob"><rect x="-36" y="-4" width="72" height="34" rx="10" fill="url(#gBody)" stroke="#2b2b30" stroke-width="2" filter="url(#fDrop)"/>
<rect x="-44" y="-24" width="88" height="16" rx="8" fill="url(#gDark)" stroke="#000" stroke-width="1.5"/>
<rect x="-47" y="-29" width="17" height="24" rx="8" fill="url(#gDark)" stroke="#000" stroke-width="1.5"/><rect x="30" y="-29" width="17" height="24" rx="8" fill="url(#gDark)" stroke="#000" stroke-width="1.5"/>
${[-14,0,14].map(kx=>[7,19].map(ky=>`<circle cx="${kx}" cy="${ky}" r="3.3" fill="#55555d"/><circle cx="${kx-1}" cy="${ky-1}" r="1" fill="#aaa"/>`).join('')).join('')}
<circle class="led" cx="28" cy="7" r="3.4"/></g>
<g class="eq"><rect x="-13" y="-52" width="5" height="16" rx="2"/><rect x="-3" y="-52" width="5" height="16" rx="2"/><rect x="7" y="-52" width="5" height="16" rx="2"/></g>
<text class="nm" y="50" text-anchor="middle">${name}</text><text class="st" id="${id}t" y="65" text-anchor="middle"></text></g></g>`;
const STK=(id,x,y,lbl,pin)=>`<g transform="translate(${x} ${y})"><g class="sk" id="${id}"> <rect width="${lbl?82:58}" height="${lbl?38:32}" rx="3" fill="#FFE680" stroke="#D4B106"/><text x="${lbl?41:29}" y="${lbl?13:12}" class="skl" text-anchor="middle">${lbl||'PIN'}</text><text x="${lbl?41:29}" y="${lbl?31:27}" class="skp" text-anchor="middle">${pin}</text></g></g>`;
const AY=[50,165,280];
class AudioConf extends Steps{
  css(){return`
.ln{fill:none;stroke:#D9D9DE;stroke-width:4;stroke-linecap:round;opacity:0;transition:opacity .3s}
.ln.dial{opacity:1;stroke:#DC9F0E;stroke-dasharray:3 9;animation:fl .5s linear infinite}
.ln.live{opacity:1;stroke:#CA133E;stroke-dasharray:10 8;animation:fl 1s linear infinite}
.ln.hold{opacity:1;stroke:#DC9F0E;stroke-dasharray:2 9}
@keyframes fl{to{stroke-dashoffset:-18}}
.ph .led{fill:#b9b9c0}.ph.on .led{fill:#16B981}.ph.hold .led{fill:#DC9F0E}
.ph.ring .led,.ph.dial .led{fill:#DC9F0E;animation:bl .5s steps(2) infinite}@keyframes bl{50%{opacity:.25}}
.rg circle{fill:none;stroke:#DC9F0E;stroke-width:3;opacity:0;transform-box:fill-box;transform-origin:center}
.ph.ring .rg circle,.ph.dial .rg circle{animation:rr 1.3s ease-out infinite}.ph .rg circle:nth-child(2){animation-delay:.42s!important}.ph .rg circle:nth-child(3){animation-delay:.84s!important}
@keyframes rr{0%{transform:scale(.5);opacity:.9}100%{transform:scale(2.3);opacity:0}}
.wob{transform-box:fill-box;transform-origin:center}
.ph.ring .wob,.ph.dial .wob{animation:wb .3s ease-in-out infinite alternate}@keyframes wb{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}
.eq{opacity:0;transition:opacity .3s}.ph.talk .eq{opacity:1}.eq rect{fill:#CA133E;transform-box:fill-box;transform-origin:bottom;animation:eq .6s ease-in-out infinite alternate}
.eq rect:nth-child(2){animation-delay:.2s}.eq rect:nth-child(3){animation-delay:.4s}@keyframes eq{from{transform:scaleY(.25)}to{transform:scaleY(1)}}
.nm{font-size:13px;font-weight:700;fill:#1A1A1A}.st{font-size:12px;font-weight:600;fill:#6B6B73}
.ph.on .st{fill:#059669}.ph.hold .st,.ph.ring .st,.ph.dial .st{fill:#B45309}
.sk{opacity:0;transform-box:fill-box;transform-origin:center;transform:scale(.5) rotate(-8deg);transition:all .45s cubic-bezier(.3,1.6,.5,1)}.sk.on{opacity:1;transform:scale(1) rotate(-3deg)}
.skl{font-size:8.5px;font-weight:700;fill:#7a6200}.skp{font-size:15px;font-weight:700;fill:#1A1A1A;font-family:ui-monospace,Menlo,Consolas,monospace}
.cal{opacity:0;transition:opacity .4s}.cal.on{opacity:1}
.mid text{fill:#fff}.mt{font-size:11.5px;font-weight:700}.ml{font-size:10px;font-family:ui-monospace,Menlo,Consolas,monospace;fill:#7CF0B4!important}
.m1 .mid2{display:none}.m2 .mid1{display:none}
.pn{opacity:0;transition:opacity .4s}.pn.on{opacity:1}`;}
  html(){return`<div class="wrap">
<p class="def"><b>Audio conference:</b> an audio call between people in different places, using a phone.</p>
<div class="seg" id="seg"><button type="button" id="b1">Method 1 · PIN dial-in</button><button type="button" id="b2">Method 2 · Organiser rings</button></div>
<div class="stage"><svg class="s m1" id="svg" viewBox="0 0 560 350" role="img" aria-label="An organiser and three participants joining an audio conference by phone">${DEFS}
<rect width="560" height="350" fill="#fff"/>
<path id="L0" class="ln" d="M114 165 H215"/>
${AY.map((y,i)=>`<path id="L${i+1}" class="ln" d="M325 165 C368 165 362 ${y} 396 ${y}"/>`).join('')}
<g class="mid mid1"><rect x="215" y="117" width="110" height="96" rx="10" fill="url(#gDark)" stroke="#000" stroke-width="2" filter="url(#fDrop)"/>
<text class="mt" x="270" y="133" text-anchor="middle">Audio conferencing</text><text class="mt" x="270" y="146" text-anchor="middle">provider</text>
<rect x="223" y="153" width="94" height="52" rx="5" fill="#10281d" stroke="#3d6"/><g class="pn" id="pn"><text class="ml" x="228" y="167">ORG   2650</text><text class="ml" x="228" y="181">GUEST 4405</text></g><text class="ml" id="br" x="228" y="196"></text></g>
<g class="mid mid2"><rect x="215" y="117" width="110" height="96" rx="10" fill="url(#gDark)" stroke="#000" stroke-width="2" filter="url(#fDrop)" stroke-dasharray="0"/>
<text class="mt" x="270" y="137" text-anchor="middle">Telephone</text><text class="mt" x="270" y="150" text-anchor="middle">network</text>
<rect x="223" y="157" width="94" height="48" rx="5" fill="#10281d" stroke="#3d6"/><text class="ml" id="br2" x="270" y="186" text-anchor="middle"></text></g>
<g class="cal" id="cal"><rect x="212" y="8" width="136" height="30" rx="8" fill="#FDE8EC" stroke="#CA133E" stroke-width="2"/><text x="280" y="28" text-anchor="middle" font-size="14" font-weight="700" fill="#CA133E">📅 Friday · 10:00</text></g>
${PH('po',70,165,'Organiser')}${AY.map((y,i)=>PH('p'+(i+1),440,y,'Participant '+(i+1))).join('')}
${STK('sko1',0,62,"ORGANISER PIN",'2650')}${STK('sko2',88,62,"PARTICIPANT PIN",'4405')}
${AY.map((y,i)=>STK('skp'+(i+1),492,y-16,'','4405')).join('')}
</svg></div>
<ol class="steps" id="steps"></ol>${CTL}</div>`;}
  init(){this.m=1;this.S=null;this.$('b1').onclick=()=>this.setM(1);this.$('b2').onclick=()=>this.setM(2);super.init();this.$('b1').className='on';}
  setM(m){this.auto=false;this.m=m;this.$('b1').className=m===1?'on':'';this.$('b2').className=m===2?'on':'';this.$('svg').setAttribute('class','s m'+m);this.build();this.go(0);}
  /* each step: a patch on the previous state, then timed patches (seq) */
  steps(){const I=['idle',''],P=(a,b,c)=>[a,b,c];
    if(this.m===1)return[
      {c:'Participants agree on a <b>date and time</b> for the conference.',p:{cal:1,pins:0,o:['idle','Free at 10:00'],P:P(['idle','Free at 10:00'],['idle','Free at 10:00'],['idle','Free at 10:00']),br:''}},
      {c:'The organiser is given <b>two PINs</b> by an audio conferencing provider: <b>Organiser\'s PIN</b> (ex: 2650) and <b>Participant\'s PIN</b> (ex: 4405).',p:{cal:0,pins:1,o:['idle','Has both PINs'],P:P(I,I,I)}},
      {c:'The organiser gives the <b>participant\'s PIN</b> to all participants.',p:{pins:2,P:P(['idle','Has PIN 4405'],['idle','Has PIN 4405'],['idle','Has PIN 4405'])}},
      {c:'To start, the organiser <b>dials the conference phone number</b> and enters the <b>organiser\'s PIN</b>.',p:{o:['dial','Dialling… PIN 2650'],br:'Waiting…'},seq:[[1700,{o:['on','Host connected ✓'],br:'Conference open'}]]},
      {c:'Each participant then <b>dials the number</b> and enters the <b>participant\'s PIN</b>.',p:{P:P(['dial','Dialling… PIN 4405'],['idle','Has PIN 4405'],['idle','Has PIN 4405'])},seq:[
        [1100,{P:P(['on','Joined ✓'],['idle','Has PIN 4405'],['idle','Has PIN 4405']),br:'1 on the call'}],[1300,{P:P(['on','Joined ✓'],['dial','Dialling… PIN 4405'],['idle','Has PIN 4405'])}],
        [2400,{P:P(['on','Joined ✓'],['on','Joined ✓'],['idle','Has PIN 4405']),br:'2 on the call'}],[2600,{P:P(['on','Joined ✓'],['on','Joined ✓'],['dial','Dialling… PIN 4405'])}],
        [3700,{P:P(['on','Joined ✓'],['on','Joined ✓'],['on','Joined ✓']),br:'3 on the call',talk:1,o:['on','Everyone is talking']}]]}];
    return[
      {c:'Participants set a <b>date and time</b> for the conference.',p:{cal:1,pins:0,o:['idle','Free at 10:00'],P:P(['idle','Free at 10:00'],['idle','Free at 10:00'],['idle','Free at 10:00']),br:'',talk:0}},
      {c:'The organiser <b>phones the first participant</b>.',p:{cal:0,o:['dial','Calling P1…'],P:P(['ring','Ringing…'],I,I),br:'Ringing P1'},seq:[[1700,{o:['on','Talking to P1'],P:P(['on','Answered ✓'],I,I)}]]},
      {c:'The organiser then <b>phones each participant</b> and <b>puts them on hold</b>.',p:{o:['dial','Calling P2…'],P:P(['hold','On hold ⏸'],['ring','Ringing…'],I),br:'P1 on hold'},seq:[[1500,{o:['on','Talking to P2'],P:P(['hold','On hold ⏸'],['on','Answered ✓'],I)}],
        [2800,{o:['dial','Calling P3…'],P:P(['hold','On hold ⏸'],['hold','On hold ⏸'],['ring','Ringing…']),br:'P1, P2 on hold'}],[4200,{o:['on','Talking to P3'],P:P(['hold','On hold ⏸'],['hold','On hold ⏸'],['on','Answered ✓'])}]]},
      {c:'The organiser <b>joins the participants together</b>.',p:{o:['on','Joining the calls…'],P:P(['hold','On hold ⏸'],['hold','On hold ⏸'],['on','Answered ✓']),br:'Joining…'},seq:[[1400,{o:['on','Everyone is talking'],P:P(['on','Joined ✓'],['on','Joined ✓'],['on','Joined ✓']),br:'Calls joined ✓',talk:1}]]}];}
  list(){return this.steps().map(s=>s.c);}
  ms(k){return this.m===1?[2800,3600,2800,3600,5600][k]:[2800,3600,7000,4200][k];}
  show(k){const S=this.steps();let st={cal:0,pins:0,talk:0,br:'',o:['idle',''],P:[['idle',''],['idle',''],['idle','']]};
    const mg=(a,b)=>Object.assign({},a,b);
    for(let i=0;i<k;i++){st=mg(st,S[i].p);(S[i].seq||[]).forEach(q=>{st=mg(st,q[1]);});}
    st=mg(st,S[k].p);this.paint(st);(S[k].seq||[]).forEach(q=>{this.later(()=>{st=mg(st,q[1]);this.paint(st);},q[0]);});}
  paint(s){const cl=(id,c)=>{const e=this.$(id);if(e)e.setAttribute('class',c);};
    const ph=[s.o,...s.P];['po','p1','p2','p3'].forEach((id,i)=>{const [stt,txt]=ph[i];cl(id,'ph '+stt+(s.talk&&stt==='on'?' talk':''));this.$(id+'t').textContent=txt;});
    const lc=x=>x==='ring'||x==='dial'?'ln dial':x==='on'?'ln live':x==='hold'?'ln hold':'ln';
    cl('L0',lc(s.o[0]));s.P.forEach((p,i)=>cl('L'+(i+1),lc(p[0])));
    cl('cal',s.cal?'cal on':'cal');cl('pn',s.pins>=1?'pn on':'pn');cl('sko1',s.pins>=1?'sk on':'sk');cl('sko2',s.pins>=1?'sk on':'sk');
    [1,2,3].forEach(i=>cl('skp'+i,s.pins>=2?'sk on':'sk'));
    this.$('br').textContent=s.br||'';this.$('br2').textContent=s.br||'';}
}

/* ====================================================== VIDEO CONFERENCE ====================================================== */
const DEVS={
 cam:{n:'Video camera',why:'so they can see you',ic:'🎥',w:44,h:34,sc:[[298,22]],art:()=>`<rect x="0" y="4" width="44" height="22" rx="7" fill="url(#gDark)" stroke="#000" stroke-width="1.5" filter="url(#fDrop)"/><rect x="13" y="25" width="18" height="9" rx="2" fill="url(#gSteel)" stroke="#555"/><circle cx="22" cy="15" r="8.5" fill="#222" stroke="#8a8a93" stroke-width="2"/><circle cx="22" cy="15" r="5" fill="url(#gLens)"/><circle cx="20.3" cy="13.3" r="1.5" fill="#fff" opacity=".85"/><circle class="cled" cx="38" cy="9" r="2.2" fill="#16B981"/>`},
 mon:{n:'Large monitor',why:'so you can see them',ic:'🖥️',w:300,h:250,sc:[[170,40]],art:()=>`<rect x="135" y="186" width="30" height="54" fill="url(#gSteel)" stroke="#555"/><rect x="88" y="236" width="124" height="13" rx="6.5" fill="url(#gSteel)" stroke="#555" filter="url(#fDrop)"/><rect width="300" height="190" rx="14" fill="url(#gDark)" stroke="#0a0a0c" stroke-width="2" filter="url(#fDrop)"/><rect x="10" y="10" width="280" height="165" rx="3" fill="#0b0e13"/><path d="M10 10h150l-60 165H10z" fill="#fff" opacity=".05"/><circle cx="150" cy="182" r="2.2" fill="#16B981"/>`},
 mic:{n:'Microphone',why:'so they can hear you',ic:'🎤',w:60,h:84,sc:[[290,316]],art:()=>`<ellipse cx="30" cy="77" rx="26" ry="7" fill="url(#gDark)" stroke="#000"/><rect x="27" y="36" width="6" height="42" fill="url(#gSteel)" stroke="#555"/><rect x="14" y="2" width="32" height="42" rx="16" fill="url(#gMesh)" stroke="#111" stroke-width="1.5"/><path d="M18 10h24M16 18h28M16 26h28M18 34h24" stroke="#000" stroke-opacity=".35"/><rect x="13" y="19" width="34" height="4" rx="2" fill="#DC9F0E"/><circle class="mled" cx="30" cy="62" r="3.4" fill="#16B981" opacity=".4"/>`},
 spk:{n:'Speakers',why:'so you can hear them',ic:'🔊',w:70,h:130,sc:[[55,175],[515,175]],ic2:[[0,0],[78,0]],art:()=>`<rect width="70" height="130" rx="10" fill="url(#gDark)" stroke="#000" stroke-width="1.5" filter="url(#fDrop)"/><circle cx="35" cy="28" r="12" fill="#1a1a1a" stroke="#8a8a93" stroke-width="2"/><circle cx="35" cy="28" r="5" fill="#555"/><g class="cone"><circle cx="35" cy="82" r="26" fill="#17171a" stroke="#8a8a93" stroke-width="2.5"/><circle cx="35" cy="82" r="19" fill="none" stroke="#444" stroke-width="2"/><circle cx="35" cy="82" r="8" fill="url(#gSteel)"/></g><circle cx="35" cy="121" r="2.6" fill="#16B981"/>`},
 rtr:{n:'Router',why:'so the call can travel over the internet',ic:'📶',w:112,h:62,sc:[[452,334]],art:()=>`<path d="M18 28L10 3M94 28L102 3" stroke="#44444B" stroke-width="5" stroke-linecap="round"/><circle cx="10" cy="3" r="3.5" fill="#6B6B73"/><circle cx="102" cy="3" r="3.5" fill="#6B6B73"/><rect y="26" width="112" height="34" rx="8" fill="url(#gCrim)" stroke="#A01030" stroke-width="2" filter="url(#fDrop)"/>${[18,32,46,60].map((x,i)=>`<circle class="rled" style="animation-delay:${i*.23}s" cx="${x}" cy="43" r="3.6" fill="#FDE8EC"/>`).join('')}<rect x="76" y="36" width="9" height="14" rx="2" fill="#1a1a1a"/><rect x="88" y="36" width="9" height="14" rx="2" fill="#1a1a1a"/>`}
};
const CABLES={mon:['M300 284C300 330 252 360 236 400','#333'],cam:['M338 48V290C338 330 380 360 392 400','#2563EB'],mic:['M320 390C320 398 300 399 280 400','#CA133E'],spk0:['M90 304C90 350 150 380 190 400','#DC9F0E'],spk1:['M572 304V400','#DC9F0E'],rtr:['M456 366C430 366 440 392 420 400','#16B981']};
const CABLE_OF={mon:['mon'],cam:['cam'],mic:['mic'],spk:['spk0','spk1'],rtr:['rtr']};
const ORDER=['cam','mon','mic','spk','rtr'];
const GREET=/\b(hi|hello|hey|hiya|howdy|good (morning|afternoon|evening))\b/i,BYE=/\b(bye|goodbye|see you)\b/i;
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const AVATAR=`<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" id="av">
<defs><linearGradient id="vw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#CFE3EA"/><stop offset="1" stop-color="#9FC1CC"/></linearGradient></defs>
<rect width="320" height="200" fill="url(#vw)"/><rect x="214" y="22" width="76" height="82" rx="4" fill="#E9F5FA" stroke="#fff" stroke-width="5"/><path d="M252 22v82M214 63h76" stroke="#fff" stroke-width="3"/>
<rect x="20" y="70" width="64" height="5" rx="2" fill="#7b5a3c"/><rect x="28" y="52" width="10" height="18" fill="#CA133E"/><rect x="40" y="46" width="9" height="24" fill="#DC9F0E"/><rect x="51" y="56" width="11" height="14" fill="#2563EB"/>
<rect x="268" y="150" width="26" height="30" rx="4" fill="#b8693a"/><path d="M281 150C262 120 258 128 252 122M281 150C300 118 308 126 312 120M281 150C281 120 281 112 281 104" stroke="#2f8a4f" stroke-width="7" stroke-linecap="round" fill="none"/>
<path d="M62 200C62 158 108 144 160 144C212 144 258 158 258 200Z" fill="#CA133E"/><path d="M138 146L160 178 182 146Z" fill="#fff"/>
<rect x="147" y="124" width="26" height="26" fill="#E0AC8C"/><ellipse cx="160" cy="90" rx="42" ry="48" fill="#3B2418"/>
<path d="M120 94C112 124 114 142 124 154L136 154C132 132 132 112 134 96Z M200 94C208 124 206 142 196 154L184 154C188 132 188 112 186 96Z" fill="#3B2418"/>
<ellipse cx="160" cy="98" rx="33" ry="39" fill="#F0C3A3"/><path d="M126 90C132 56 188 56 194 90C180 72 140 72 126 90Z" fill="#3B2418"/>
<g class="eyes"><ellipse cx="146" cy="100" rx="4" ry="5" fill="#2b1b12"/><ellipse cx="174" cy="100" rx="4" ry="5" fill="#2b1b12"/></g>
<path d="M139 91q7-4 14 0M167 91q7-4 14 0" stroke="#3B2418" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M160 104q-3 8 2 9" stroke="#c98d6c" stroke-width="2" fill="none" stroke-linecap="round"/>
<g transform="translate(160 122)"><path class="smile" d="M-11 0Q0 9 11 0Q0 4 -11 0Z" fill="#8a2b2b"/><ellipse class="open" rx="8" ry="6" fill="#6b1d1d"/></g>
<text class="hand" x="236" y="150" font-size="34">👋</text></svg>`;
class VideoConf extends Act{
  css(){return`
.room{position:relative;aspect-ratio:16/10;border-radius:16px;overflow:hidden;border:2px solid #C9B6BC;background:#d8c9ce;box-shadow:inset 0 0 30px rgba(0,0,0,.12)}
.room>svg.rs{position:absolute;inset:0;width:100%;height:100%;display:block}
.dev{transition:opacity .4s;opacity:.16;filter:grayscale(1)}.dev.on{opacity:1;filter:none;animation:drop .7s cubic-bezier(.3,1.7,.5,1)}
@keyframes drop{from{transform:translateY(-22px);opacity:0}to{transform:none;opacity:1}}
.dev{transform-box:fill-box}
.slot{fill:none;stroke:#CA133E;stroke-width:2;stroke-dasharray:6 6;opacity:.55;animation:sl 1.6s ease-in-out infinite}.on+.slot,.slotoff{opacity:0;animation:none}
@keyframes sl{50%{opacity:.15}}
.cable{fill:none;stroke-width:5;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;opacity:0;transition:stroke-dashoffset .9s ease,opacity .05s}.cable.on{stroke-dashoffset:0;opacity:1}
.cled{animation:bl 1.6s steps(2) infinite}.rled{animation:bl 1s steps(2) infinite;opacity:.9}@keyframes bl{50%{opacity:.25}}
.cone{transform-box:fill-box;transform-origin:center}.talking .cone{animation:cn .18s ease-in-out infinite alternate}@keyframes cn{to{transform:scale(1.08)}}
.scr{position:absolute;left:28.125%;top:12.5%;width:43.75%;height:41.25%;border-radius:3px;background:#0b0e13;overflow:hidden;container-type:inline-size;opacity:0;pointer-events:none;z-index:3;
 transition:left .8s cubic-bezier(.6,0,.2,1),top .8s cubic-bezier(.6,0,.2,1),width .8s cubic-bezier(.6,0,.2,1),height .8s cubic-bezier(.6,0,.2,1),border-radius .8s,opacity .4s}
.scr:not([data-s=off]){opacity:1;pointer-events:auto}
.scr[data-s=meet]{left:0;top:0;width:100%;height:100%;border-radius:0}
.wt{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.6cqw;background:radial-gradient(circle at 50% 30%,#2a3550,#0b0e13);color:#fff;text-align:center}
.scr[data-s=meet] .wt{display:none}.scr:not([data-s=meet]) .meet{display:none}
.wt-t{font-size:7cqw;font-weight:700;letter-spacing:.02em}.wt-n{font-size:15cqw;font-weight:700;line-height:1;color:#DC9F0E}.wt-n small{font-size:7cqw;color:#9aa}
.wt-i{display:flex;gap:3.5cqw;font-size:9cqw}.wt-i span{opacity:.25;filter:grayscale(1);transition:all .3s}.wt-i span.ok{opacity:1;filter:none}
.wt-m{font-size:5.2cqw;color:#cfd4e6;max-width:90%}
#join{font-size:6.5cqw;padding:2cqw 7cqw;border-radius:999px;border:0;background:#16B981;color:#fff;font-family:inherit;font-weight:700;cursor:pointer;box-shadow:0 .8cqw 0 #0b7a57;animation:pu 1.2s ease-in-out infinite}@keyframes pu{50%{transform:scale(1.06)}}
.meet{position:absolute;inset:0;background:#10151f}
.mbar{position:absolute;left:0;right:0;top:0;height:6.4cqw;min-height:16px;display:flex;align-items:center;gap:2cqw;padding:0 2.4cqw;background:rgba(0,0,0,.55);color:#fff;font-size:max(9px,2.2cqw);z-index:2}
.mbar .lv{color:#ff5a6e;font-weight:700;animation:bl 1.2s steps(2) infinite}.mbar .t{margin-left:auto}
.main{position:absolute;inset:0}.main svg{width:100%;height:100%;display:block}
.eyes{transform-box:fill-box;transform-origin:center;animation:blink 4s infinite}@keyframes blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
.open{display:none;transform-box:fill-box;transform-origin:center}.smile{display:block}
.talk .smile{display:none}.talk .open{display:block;animation:mo .2s ease-in-out infinite alternate}@keyframes mo{from{transform:scaleY(.25)}to{transform:scaleY(1)}}
.hand{opacity:0;transform-box:fill-box;transform-origin:70% 90%}.wave .hand{opacity:1;animation:wv .5s ease-in-out infinite alternate}@keyframes wv{from{transform:rotate(-18deg)}to{transform:rotate(22deg)}}
.bub{position:absolute;left:2.4cqw;bottom:10.5cqw;max-width:56%;background:#fff;color:#1A1A1A;border-radius:2.4cqw;padding:1.6cqw 2.6cqw;font-size:max(9px,2.5cqw);line-height:1.35;font-weight:600;box-shadow:0 .6cqw 2cqw rgba(0,0,0,.35);z-index:2}
.bub b{color:#CA133E}
.nameTag{position:absolute;left:2.4cqw;top:8.4cqw;font-size:max(8px,1.9cqw);background:rgba(0,0,0,.55);color:#fff;padding:.5cqw 1.6cqw;border-radius:1cqw;z-index:2}
.pip{position:absolute;right:2.4cqw;bottom:10.5cqw;width:24cqw;aspect-ratio:4/3;border-radius:1.8cqw;overflow:hidden;border:.5cqw solid #fff;background:#222;box-shadow:0 .8cqw 2.4cqw rgba(0,0,0,.5);z-index:2}
.pip video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1);display:block}
.pip span{position:absolute;left:1cqw;bottom:.8cqw;font-size:max(8px,1.8cqw);color:#fff;background:rgba(0,0,0,.55);padding:.2cqw 1cqw;border-radius:.8cqw}
.mtool{position:absolute;left:0;right:0;bottom:0;height:8cqw;min-height:22px;display:flex;align-items:center;gap:2cqw;padding:0 2.4cqw;background:rgba(0,0,0,.7);color:#fff;z-index:2;font-size:max(9px,2.1cqw)}
.lvl{flex:0 0 14cqw;height:2cqw;min-height:5px;border-radius:99px;background:#333;overflow:hidden}.lvl i{display:block;height:100%;width:0;background:linear-gradient(90deg,#16B981,#DC9F0E,#ff5a6e);transition:width .08s}
.heard{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:.9}
#end{font-family:inherit;font-weight:700;font-size:max(9px,2.2cqw);padding:1cqw 3cqw;border:0;border-radius:999px;background:#e5304f;color:#fff;cursor:pointer}
.banner{position:absolute;left:50%;top:8px;transform:translate(-50%,-140%);background:#1A1A1A;color:#fff;padding:7px 14px;border-radius:999px;font-size:13px;font-weight:600;z-index:6;opacity:0;transition:all .4s;max-width:94%;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.35)}
.banner.on{transform:translate(-50%,0);opacity:1}.banner b{color:#DC9F0E}
.msg{margin:10px 4px 0;font-size:13.5px;text-align:center;color:#44444B;min-height:20px}.msg.err{color:#B3122F;font-weight:600}.msg b{color:#CA133E}
.tray{display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:8px;margin-top:10px}
.dv{font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 6px 9px;border-radius:14px;border:2px solid #CA133E;background:#fff;color:#1A1A1A;cursor:pointer;text-align:center;transition:all .25s;box-shadow:0 3px 0 #F3C4CE}
.dv svg{width:100%;max-width:64px;height:46px}.dv b{font-size:13px}.dv small{font-size:11.5px;line-height:1.3;color:#6B6B73;min-height:30px}
.dv:hover{transform:translateY(-2px)}.dv:active{transform:translateY(1px);box-shadow:none}
.dv.on{border-color:#059669;background:#ECFDF5;box-shadow:0 3px 0 #BFE6D5}.dv.on small{color:#047857;font-weight:600}
.dv.bad{border-color:#B3122F;background:#FFF1F3}
.tf{display:flex;gap:6px;justify-content:center;margin-top:8px}.tf input{font-family:inherit;font-size:14px;padding:7px 12px;border:2px solid #CA133E;border-radius:999px;min-width:0;flex:0 1 220px}
`;}
  html(){const dev=id=>{const d=DEVS[id];return d.sc.map(([x,y],i)=>`<g transform="translate(${x} ${y})"><g class="dev" data-d="${id}">${d.art()}</g><rect class="slot" data-s="${id}" width="${d.w}" height="${d.h}" rx="8"/></g>`).join('');};
    const icon=id=>{const d=DEVS[id];const parts=d.ic2||[[0,0]];const W=d.ic2?d.w*2+16:d.w;return`<svg viewBox="0 0 ${W} ${d.h}" aria-hidden="true">${parts.map(([x,y])=>`<g transform="translate(${x} ${y})">${d.art()}</g>`).join('')}</svg>`;};
    return`<div class="wrap" id="root">
<p class="def"><b>Video conference:</b> real-time, two-way <b>audio and video streaming</b> over the internet, so people far apart can meet face to face.</p>
<div class="room" id="room"><svg class="rs" viewBox="0 0 640 400" id="rsvg" role="img" aria-label="A conference desk with a monitor, camera, microphone, speakers and router">${DEFS}
<rect width="640" height="400" fill="url(#gWall)"/><rect x="26" y="26" width="86" height="60" rx="3" fill="#fff" stroke="#b9a" stroke-width="4"/><rect x="34" y="34" width="70" height="44" fill="#FDE8EC"/><text x="69" y="62" text-anchor="middle" font-size="16" font-weight="700" fill="#CA133E">AT-ICT</text>
<rect x="520" y="26" width="92" height="104" rx="4" fill="#CFE3EA" stroke="#fff" stroke-width="6"/><path d="M566 26v104M520 78h92" stroke="#fff" stroke-width="4"/>
<path d="M0 296H640V400H0Z" fill="url(#gWood)"/><path d="M0 296H640" stroke="#e8b886" stroke-width="3"/><path d="M0 330H640M0 366H640" stroke="#7a4d2a" stroke-opacity=".25"/>
${Object.entries(CABLES).map(([k,[d,c]])=>`<path class="cable" id="cb-${k}" pathLength="1" d="${d}" stroke="${c}"/>`).join('')}
${ORDER.map(dev).join('')}
</svg>
<div class="scr" id="scr" data-s="off"><div class="wt"><div class="wt-t">Video conference</div><div class="wt-n"><span id="cnt">0</span><small>/5</small></div><div class="wt-i" id="chk">${ORDER.map(id=>`<span data-c="${id}" title="${DEVS[id].n}">${DEVS[id].ic}</span>`).join('')}</div><div class="wt-m" id="wm">Connect all the hardware to start</div><button type="button" id="join" hidden>Join meeting</button></div>
<div class="meet"><div class="main" id="host">${AVATAR}</div><div class="mbar"><span class="lv">● LIVE</span><span>AT-ICT Meeting</span><span class="t" id="clk">00:00</span></div>
<div class="bub" id="bub">Say <b>“Hi”</b> or <b>“Hello”</b> into your microphone</div><div class="nameTag">Ms. Sara · Host</div>
<div class="pip"><video id="vid" autoplay muted playsinline></video><span>You</span></div>
<div class="mtool"><span>🎤</span><div class="lvl"><i id="lv"></i></div><span class="heard" id="heard">Listening…</span><button type="button" id="end">End call</button></div></div></div>
<div class="banner" id="ban"></div></div>
<div class="msg" id="msg">Click each device to connect it. Your browser will ask to use the <b>camera</b> and <b>microphone</b> — choose <b>Allow</b>.</div>
<form class="tf" id="tf" hidden><input id="ti" type="text" placeholder="Type hi or hello" autocomplete="off" aria-label="Type what you would say"><button type="button" class="pill pri" id="ts">Say it</button></form>
<div class="tray" id="tray">${ORDER.map(id=>`<button type="button" class="dv" data-b="${id}" aria-pressed="false">${icon(id)}<b>${DEVS[id].n}</b><small>Click to connect</small></button>`).join('')}</div></div>`;}
  init(){this.on={};this.meet=false;this.spoke=0;
    this.r.querySelectorAll('.dv').forEach(b=>b.onclick=()=>this.toggle(b.dataset.b));
    this.$('join').onclick=()=>this.open();this.$('end').onclick=()=>this.close('You left the call. Press Join meeting to go back in.');
    const sub=()=>{const v=this.$('ti').value.trim();if(v){this.$('ti').value='';this.heard(v,true);}};
    this.$('ts').onclick=sub;this.$('ti').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();sub();}};
    this.refresh();}
  start(){clearInterval(this.vis);this.vis=setInterval(()=>{if(this.getClientRects().length===0&&(this.meet||Object.values(this.on).some(Boolean))){this.shut();this.on={};this.left=false;this.refresh();this.say('Activity closed — devices switched off.');}},800);}
  stop(){clearInterval(this.vis);this.shut();}
  shut(){this.close(null,true);['cam','mic'].forEach(k=>this.drop(k));if(this.ac){try{this.ac.close();}catch(e){}this.ac=null;}cancelAnimationFrame(this.raf);}
  say(t,err){const m=this.$('msg');m.className='msg'+(err?' err':'');m.innerHTML=t;}
  ban(h){const b=this.$('ban');b.innerHTML=h;b.classList.add('on');clearTimeout(this._bt);this._bt=setTimeout(()=>b.classList.remove('on'),4200);}
  ctx(){if(!this.ac){try{this.ac=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(this.ac&&this.ac.state==='suspended')this.ac.resume();return this.ac;}
  beep(){const a=this.ctx();if(!a)return;[[660,0],[880,.16]].forEach(([f,t])=>{const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,a.currentTime+t);g.gain.exponentialRampToValueAtTime(.18,a.currentTime+t+.03);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+t+.25);o.connect(g);g.connect(a.destination);o.start(a.currentTime+t);o.stop(a.currentTime+t+.3);});}
  async toggle(id){
    if(this.on[id]){this.unplug(id);return;}
    if(this.busy)return;
    const md=navigator.mediaDevices;
    if(id==='cam'||id==='mic'){
      if(!md||!md.getUserMedia){this.say('This browser can’t reach the '+(id==='cam'?'camera':'microphone')+' on this page. Try Chrome or Edge on a secure (https) page.',true);this.flag(id,true);return;}
      this.say('Waiting for you to click <b>Allow</b> in the browser…');this.busy=true;
      try{const s=await md.getUserMedia(id==='cam'?{video:{facingMode:'user'}}:{audio:true});if(this.on[id]){s.getTracks().forEach(t=>t.stop());this.busy=false;return;}this[id==='cam'?'camS':'micS']=s;}
      catch(e){this.busy=false;const dn=e&&(e.name==='NotAllowedError'||e.name==='SecurityError'),nf=e&&e.name==='NotFoundError';
        this.say(dn?`The ${id==='cam'?'camera':'microphone'} was <b>blocked</b>. Click the 🔒 icon in the address bar, set it to <b>Allow</b>, then click the ${DEVS[id].n.toLowerCase()} again.`:nf?`No ${id==='cam'?'camera':'microphone'} was found. Plug one in and try again.`:'The '+DEVS[id].n.toLowerCase()+' could not start.',true);this.flag(id,true);return;}
    }
    this.busy=false;this.ctx();this.on[id]=true;this.flag(id,false);
    if(id==='mic')this.listen();
    if(id==='spk'||this.on.spk)this.beep();
    this.say(`<b>${DEVS[id].n}</b> connected — ${DEVS[id].why}.`);this.ban(`${DEVS[id].ic} <b>${DEVS[id].n}</b> — ${DEVS[id].why}`);
    this.refresh();
    if(ORDER.every(k=>this.on[k])){this.say('<b>Everything is connected!</b> Opening the meeting…');this.later(()=>{if(ORDER.every(k=>this.on[k])&&!this.meet)this.open();},1500);}
  }
  flag(id,bad){const b=this.r.querySelector(`[data-b=${id}]`);b.classList.toggle('bad',!!bad);}
  drop(k){const s=this[k==='cam'?'camS':'micS'];if(s)s.getTracks().forEach(t=>t.stop());this[k==='cam'?'camS':'micS']=null;if(k==='mic'){this.src&&this.src.disconnect&&this.src.disconnect();this.src=null;this.an=null;}}
  unplug(id){this.on[id]=false;if(id==='cam'||id==='mic')this.drop(id);
    this.say(`<b>${DEVS[id].n}</b> unplugged.${this.meet?' The meeting stopped because the hardware is not all connected.':''}`,this.meet);
    if(this.meet)this.close(null);this.refresh();}
  refresh(){const n=ORDER.filter(k=>this.on[k]).length;
    this.r.querySelectorAll('.dev').forEach(g=>g.classList.toggle('on',!!this.on[g.dataset.d]));
    this.r.querySelectorAll('.slot').forEach(s=>s.classList.toggle('slotoff',!!this.on[s.dataset.s]));
    Object.entries(CABLE_OF).forEach(([k,list])=>list.forEach(c=>this.$('cb-'+c).classList.toggle('on',!!this.on[k])));
    this.r.querySelectorAll('.dv').forEach(b=>{const id=b.dataset.b,o=!!this.on[id];b.classList.toggle('on',o);b.setAttribute('aria-pressed',o);b.querySelector('small').textContent=o?'✓ '+DEVS[id].why[0].toUpperCase()+DEVS[id].why.slice(1)+'. Click to unplug.':'Click to connect';});
    this.$('cnt').textContent=n;this.r.querySelectorAll('#chk span').forEach(s=>s.classList.toggle('ok',!!this.on[s.dataset.c]));
    const all=n===5;
    if(!this.on.mon)this.$('scr').dataset.s='off';else this.$('scr').dataset.s=this.meet?'meet':'wait';
    this.$('join').hidden=!(all&&!this.meet&&this.on.mon);
    this.$('wm').textContent=all?(this.left?'Call ended':'All hardware ready ✓'):n?`Missing: ${ORDER.filter(k=>!this.on[k]).map(k=>DEVS[k].n.toLowerCase()).join(', ')}`:'Connect all the hardware to start';
    const led=this.r.querySelector('.rs .mled');if(led)led.style.opacity=this.on.mic?'':'.4';
    this.$('tf').hidden=!(this.on.mic&&(!SR||this.noSR));
    this.r.querySelector('.room').classList.toggle('talking',!!this.speaking);}
  listen(){const a=this.ctx();if(!a||!this.micS)return;try{this.src=a.createMediaStreamSource(this.micS);this.an=a.createAnalyser();this.an.fftSize=512;this.src.connect(this.an);}catch(e){return;}
    const buf=new Uint8Array(this.an.fftSize),tick=()=>{if(!this.an){return;}this.an.getByteTimeDomainData(buf);let s=0;for(let i=0;i<buf.length;i++){const v=(buf[i]-128)/128;s+=v*v;}const lv=Math.min(1,Math.sqrt(s/buf.length)*5);
      this.$('lv').style.width=(lv*100)+'%';const led=this.r.querySelector('.rs .mled');if(led){led.style.opacity=.35+lv*.65;led.style.fill=lv>.45?'#ff5a6e':'#16B981';}this.raf=requestAnimationFrame(tick);};
    cancelAnimationFrame(this.raf);tick();}
  open(){if(this.meet||!ORDER.every(k=>this.on[k]))return;this.meet=true;this.left=false;this.refresh();
    const v=this.$('vid');v.srcObject=this.camS;const p=v.play();if(p&&p.catch)p.catch(()=>{});
    this.t0=Date.now();clearInterval(this.ck);this.ck=setInterval(()=>{const s=Math.floor((Date.now()-this.t0)/1000);this.$('clk').textContent=String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');},500);
    this.$('heard').textContent=SR?'Listening…':'Type below to talk';
    this.say('<b>You’re in the meeting!</b> Say <b>“Hi”</b> or <b>“Hello”</b> into your microphone'+(SR?'.':' (or type it below).'));
    this.later(()=>this.reply('Hi! I’m Ms. Sara. Can you see and hear me? Say <b>“Hi”</b> or <b>“Hello”</b>!','Hi! I am Miss Sara. Can you see and hear me? Say hi or hello!'),1200);
    this.later(()=>this.rec(),1800);}
  close(msg,silent){if(!this.meet&&!silent)return;this.meet=false;this.left=!!msg;clearInterval(this.ck);
    if(this.recog){try{this.recog.onend=null;this.recog.abort();}catch(e){}this.recog=null;}
    try{window.speechSynthesis&&speechSynthesis.cancel();}catch(e){}this.speaking=false;
    const h=this.$('host');if(h)h.classList.remove('talk','wave');const v=this.$('vid');if(v)v.srcObject=null;
    if(msg)this.say(msg);if(!silent)this.refresh();}
  rec(){if(!SR||!this.meet||!this.on.mic||this.recog||this.speaking)return;let r;try{r=new SR();}catch(e){return;}
    r.lang='en-US';r.continuous=true;r.interimResults=true;
    r.onresult=e=>{let t='';for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;t=t.trim();if(t)this.heard(t,false);};
    r.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){this.recog=null;this.noSR=true;this.$('tf').hidden=false;this.say('Speech recognition is blocked here. Type what you would say in the box instead.',true);}};
    r.onend=()=>{this.recog=null;if(this.meet&&!this.speaking&&!this.noSR)this.later(()=>this.rec(),250);};
    this.recog=r;try{r.start();}catch(e){this.recog=null;}}
  heard(t,typed){this.$('heard').textContent='You said: “'+t+'”';
    const now=Date.now();if(this.cool&&now<this.cool)return;
    if(GREET.test(t)){this.cool=now+4500;this.reply(/hello/i.test(t)?'<b>Hello!</b> Lovely to see you. Your microphone, speakers, camera and router are all working!':'<b>Hi there!</b> I can see and hear you. Welcome to the meeting!',/hello/i.test(t)?'Hello! Lovely to see you. Your microphone, speakers, camera and router are all working!':'Hi there! I can see and hear you. Welcome to the meeting!');}
    else if(BYE.test(t)){this.cool=now+4500;this.reply('<b>Goodbye!</b> Press <b>End call</b> when you are ready.','Goodbye! Press end call when you are ready.');}
    else if(typed){this.cool=now+2500;this.reply('Try saying <b>“Hi”</b> or <b>“Hello”</b>.','Try saying hi or hello.');}}
  reply(html,speech){if(!this.meet)return;this.$('bub').innerHTML=html;const h=this.$('host');h.classList.add('talk');if(/hello|hi/i.test(speech))h.classList.add('wave');this.speaking=true;this.refresh();
    if(this.recog){try{this.recog.onend=null;this.recog.abort();}catch(e){}this.recog=null;}
    const tok=this.tk=(this.tk||0)+1;const done=()=>{if(tok!==this.tk||!this.speaking)return;this.speaking=false;h.classList.remove('talk','wave');this.refresh();if(this.meet)this.later(()=>this.rec(),400);};
    let spoke=false;try{if(window.speechSynthesis&&this.on.spk){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(speech);u.rate=1;u.pitch=1.15;u.onend=done;u.onerror=done;speechSynthesis.speak(u);spoke=true;}}catch(e){}
    this.later(done,spoke?9000:Math.max(1800,speech.length*70));}
}

/* ====================================================== VIRUS ====================================================== */
const FILES=[['📄','report.docx'],['🖼️','photo.jpg'],['🎵','song.mp3'],['📊','data.xlsx'],['🎮','free_game.exe'],['📝','notes.txt'],['📕','homework.pdf'],['🎬','video.mp4']];
const SRCF=4;
class VirusDemo extends Steps{
  css(){return`
.vdef{font-size:15px;line-height:1.7;text-align:center;margin:0 6px 12px}.vdef span{transition:all .3s;border-radius:6px}.vdef span.hl{background:#FDE8EC;color:#CA133E;font-weight:700;box-shadow:0 0 0 2px #CA133E}
.win{margin:12px;border-radius:12px;border:2px solid #C8C8CF;overflow:hidden;background:#F5F6FA;transition:border-color .4s;position:relative}.win.bad{border-color:#CA133E}
.tb{display:flex;align-items:center;gap:6px;padding:7px 10px;background:linear-gradient(#e9e9ee,#cfcfd6);font-size:12.5px;font-weight:700;transition:all .4s}.win.bad .tb{background:linear-gradient(#e0305a,#a01030);color:#fff}
.tb i{width:10px;height:10px;border-radius:50%;background:#ff5f57;display:inline-block}.tb i+i{background:#febc2e}.tb i+i+i{background:#28c840}
.tb .tt{margin-left:6px}.tb .cnt{margin-left:auto;font-weight:600;font-size:12px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:12px;position:relative}
.t{position:relative;aspect-ratio:1/.82;border-radius:12px;background:#fff;border:2px solid #DADAE2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:12px;font-weight:600;padding:4px;text-align:center;transition:all .4s;overflow:hidden}
.t .ic{font-size:clamp(22px,6.5cqw,38px);line-height:1}.t .nm{word-break:break-all;line-height:1.15;color:#44444B}
.t .bg{position:absolute;top:2px;right:3px;font-size:15px;opacity:0;transform:scale(.3);transition:all .35s}
.t.inf{border-color:#CA133E;background:#FFF1F3;animation:sh .5s ease-in-out infinite alternate}.t.inf .bg{opacity:1;transform:scale(1)}
@keyframes sh{from{transform:rotate(-1.5deg)}to{transform:rotate(1.5deg)}}
.t.src{border-color:#7C3AED;background:#F5F0FF;animation:none;box-shadow:0 0 0 0 rgba(124,58,237,.5)}.t.src .bg{opacity:1;transform:scale(1)}
.t.src.sleep .ic{animation:zz 2s ease-in-out infinite}@keyframes zz{50%{transform:scale(.92)}}
.t.src.hint{box-shadow:0 0 0 5px rgba(220,159,14,.55);cursor:pointer;animation:hn 1s ease-in-out infinite}@keyframes hn{50%{box-shadow:0 0 0 10px rgba(220,159,14,0)}}
.t.bad{border-color:#444;background:repeating-linear-gradient(45deg,#e8e8ec,#e8e8ec 5px,#d2d2d8 5px,#d2d2d8 10px);animation:none}.t.bad .ic{filter:grayscale(1);opacity:.5}.t.bad .nm{text-decoration:line-through}
.t.bad::after{content:'✕ corrupted';position:absolute;bottom:3px;font-size:10px;color:#CA133E;font-weight:700}
.t.gone{opacity:.15;transform:scale(.7);border-style:dashed;animation:none}.t.gone::after{content:'deleted';position:absolute;font-size:10px;color:#6B6B73}
.zz{position:absolute;top:-2px;left:2px;font-size:14px;font-weight:700;color:#7C3AED;opacity:0}.t.sleep .zz{opacity:1;animation:zf 1.8s ease-in-out infinite}@keyframes zf{0%{transform:translate(0,6px);opacity:0}50%{opacity:1}100%{transform:translate(8px,-8px);opacity:0}}
.cur{position:absolute;font-size:26px;z-index:5;pointer-events:none;transition:all .9s ease;opacity:0;filter:drop-shadow(0 2px 2px rgba(0,0,0,.4))}.cur.on{opacity:1}.cur.clk{animation:ck .35s ease-in-out 2}@keyframes ck{50%{transform:scale(.7)}}
.clone{position:absolute;font-size:20px;z-index:4;pointer-events:none}
.note{margin:0 12px 12px;padding:9px 12px;border-radius:12px;background:#FFF8E5;border:2px solid #F2D58A;font-size:13.5px;text-align:center;min-height:42px;display:flex;align-items:center;justify-content:center}.note b{color:#CA133E}
`;}
  html(){return`<div class="wrap"><p class="vdef" id="vd"><span data-h="0">Program</span> which <span data-h="2">replicates itself by attaching to files</span>, which causes the computer to be <span data-h="3">infected and damage it</span>. <span data-h="1">Requires human interaction to start action.</span></p>
<div class="stage"><div class="win" id="win"><div class="tb"><i></i><i></i><i></i><span class="tt" id="wt">📁 My Documents</span><span class="cnt" id="cnt"></span></div><div class="grid" id="grid"><span class="cur" id="cur">🖱️</span>
${FILES.map((f,i)=>`<div class="t" data-i="${i}" tabindex="${i===SRCF?0:-1}"><span class="zz">z z</span><span class="bg">🦠</span><span class="ic">${f[0]}</span><span class="nm">${f[1]}</span></div>`).join('')}</div>
<div class="note" id="note"></div></div></div>
<ol class="steps" id="steps"></ol>${CTL}</div>`;}
  list(){return['A virus is a <b>program</b> hidden inside a file. Here it is inside <b>free_game.exe</b> — asleep for now.','It <b>requires human interaction</b> to start. Nothing happens until the user <b>opens the file</b>.','Once running, it <b>replicates itself</b> by <b>attaching to other files</b>.','The computer is now <b>infected</b>.','The virus <b>damages</b> the computer: files are corrupted or deleted.'];}
  ms(k){return[3200,4600,5600,3400,4200][k];}
  init(){super.init();const s=this.r.querySelectorAll('.t')[SRCF];s.onclick=()=>{if(this.k===1&&s.classList.contains('hint')){this.auto=false;this.go(2);}};s.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();s.onclick();}};}
  setT(states){this.r.querySelectorAll('.t').forEach((t,i)=>{const s=states[i];t.className='t'+(s?' '+s:'');});const n=states.filter(s=>s==='inf'||s==='src'||s==='bad').length,d=states.filter(s=>s==='bad'||s==='gone').length;
    this.$('cnt').textContent=n?`🦠 Infected: ${n}/8${d?' · Damaged: '+d:''}`:'';}
  fly(from,to){const g=this.$('grid'),a=this.r.querySelectorAll('.t')[from],b=this.r.querySelectorAll('.t')[to];const gr=g.getBoundingClientRect(),ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
    const c=document.createElement('span');c.className='clone';c.textContent='🦠';c.style.left=(ar.left-gr.left+ar.width/2-10)+'px';c.style.top=(ar.top-gr.top+ar.height/2-10)+'px';g.appendChild(c);
    const dx=br.left-ar.left,dy=br.top-ar.top;if(c.animate){const an=c.animate([{transform:'translate(0,0) scale(.6)',opacity:1},{transform:`translate(${dx}px,${dy}px) scale(1.2)`,opacity:1}],{duration:650,easing:'ease-in-out'});an.onfinish=()=>c.remove();}else c.remove();setTimeout(()=>c.remove(),900);}
  show(k){const N=['clean','clean','clean','clean','clean','clean','clean','clean'];
    this.$('win').classList.toggle('bad',k>=3);this.$('wt').textContent=k>=3?'⚠ INFECTED — My Documents':'📁 My Documents';
    this.r.querySelectorAll('#vd span').forEach(s=>s.classList.toggle('hl',+s.dataset.h===k||(k===4&&s.dataset.h==='3')));
    const cur=this.$('cur');cur.className='cur';
    const note=t=>{this.$('note').innerHTML='<span>'+t+'</span>';};
    const base=N.map(()=>'');
    if(k===0){const s=base.slice();s[SRCF]='src sleep';this.setT(s);note('💤 The virus is <b>asleep</b>. It cannot do anything on its own.');}
    if(k===1){const s=base.slice();s[SRCF]='src sleep';this.setT(s);note('A virus <b>needs a human</b> to start it. 🤔');
      const t=this.r.querySelectorAll('.t')[SRCF],g=this.$('grid');const gr=g.getBoundingClientRect(),tr=t.getBoundingClientRect();
      cur.style.left=(tr.left-gr.left+tr.width*.55)+'px';cur.style.top=(tr.top-gr.top+tr.height*.5)+'px';
      cur.style.transition='none';cur.style.left=(tr.left-gr.left+tr.width*1.6)+'px';cur.style.top=(tr.top-gr.top+tr.height*1.5)+'px';void cur.offsetWidth;cur.style.transition='';
      this.later(()=>{cur.classList.add('on');cur.style.left=(tr.left-gr.left+tr.width*.58)+'px';cur.style.top=(tr.top-gr.top+tr.height*.3)+'px';},300);
      if(this.auto){this.later(()=>{cur.classList.add('clk');},1500);this.later(()=>{const s2=base.slice();s2[SRCF]='src';this.setT(s2);note('👆 <b>Double-click!</b> The user opened the file — the virus wakes up and runs.');},1900);}
      else{this.later(()=>{const s2=base.slice();s2[SRCF]='src sleep hint';this.setT(s2);note('👆 <b>You are the user.</b> Double-click the glowing file to open it.');},1100);}}
    if(k===2){const s=base.slice();s[SRCF]='src';this.setT(s);note('The virus <b>copies itself</b> and attaches to every other file…');
      const order=[0,1,2,3,5,6,7];order.forEach((ti,j)=>{this.later(()=>{this.fly(SRCF,ti);},350+j*520);this.later(()=>{s[ti]='inf';this.setT(s.slice());},950+j*520);});}
    if(k===3){this.setT(base.map((_,i)=>i===SRCF?'src':'inf'));note('⚠ <b>Every file</b> now carries the virus. The computer is <b>infected</b>.');}
    if(k===4){const s=base.map((_,i)=>i===SRCF?'src':'inf');this.setT(s);note('The virus starts to <b>damage</b> the computer…');
      [[1,'bad'],[3,'bad'],[5,'gone'],[6,'gone'],[7,'bad']].forEach(([ti,v],j)=>this.later(()=>{s[ti]=v;this.setT(s.slice());if(j===4)note('💥 Files <b>corrupted</b> and <b>deleted</b>. Without a human opening that first file, none of this would have happened.');},700+j*650));}
  }
}

/* ====================================================== VIRUS SIGNS ====================================================== */
const SIGNS=[
 ['Corruption of files','Corruption of files'],['Deletion of files','Deletion of files'],['Software errors','Software errors'],['Random restarts','Random restarts'],['Hard disk storage fills up','Hard disk storage fills up'],['Anti-virus stops working','Anti-virus stops working']];
class VirusSigns extends Steps{
  css(){return`
.lay{display:grid;gap:12px}@container (min-width:600px){.lay{grid-template-columns:1.25fr 1fr;align-items:start}.lay ol.steps{margin-top:0}}
.mon{background:linear-gradient(#3a3a42,#1c1c20);border-radius:16px;padding:10px 10px 14px;box-shadow:0 6px 14px rgba(0,0,0,.25);position:relative}
.mon::after{content:'';display:block;width:34%;height:10px;margin:10px auto -14px;background:linear-gradient(#aaa,#777);border-radius:0 0 8px 8px}
.scr{position:relative;aspect-ratio:16/10;border-radius:8px;overflow:hidden;background:linear-gradient(135deg,#E8F0FB,#CFE0F6);container-type:inline-size;font-size:max(10px,3cqw)}
.tag{position:absolute;left:2cqw;top:2cqw;background:#CA133E;color:#fff;font-weight:700;font-size:max(10px,3cqw);padding:.6cqw 2.4cqw;border-radius:99px;z-index:9;box-shadow:0 .5cqw 1.5cqw rgba(0,0,0,.3)}
.dlg{position:absolute;background:#fff;border:.4cqw solid #8a8a93;border-radius:1.6cqw;box-shadow:0 1cqw 3cqw rgba(0,0,0,.35);overflow:hidden;opacity:0;animation:pop .35s cubic-bezier(.3,1.6,.5,1) forwards}
@keyframes pop{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
.dlg .h{background:linear-gradient(#e0305a,#a01030);color:#fff;font-weight:700;padding:.8cqw 2cqw;font-size:max(10px,2.8cqw)}.dlg .b{padding:1.8cqw 2.4cqw;font-size:max(10px,2.8cqw);line-height:1.35}
.dlg .bt{display:inline-block;margin:0 2.4cqw 2cqw;padding:.6cqw 3cqw;border:.3cqw solid #8a8a93;border-radius:.8cqw;background:#eee;font-size:max(9px,2.6cqw)}
.doc{position:absolute;left:12%;top:18%;width:76%;height:68%;background:#fff;border-radius:1.4cqw;box-shadow:0 1cqw 3cqw rgba(0,0,0,.25);padding:3cqw 4cqw;overflow:hidden}
.doc h4{margin:0 0 2cqw;font-size:max(11px,3.4cqw)}.doc p{margin:0;font-size:max(10px,3cqw);line-height:1.6;position:absolute;inset:11cqw 4cqw auto 4cqw;word-break:break-all}
.doc .g{opacity:0;color:#CA133E;font-family:ui-monospace,Menlo,Consolas,monospace;animation:gar 2.4s .5s steps(6) forwards}.doc .c{animation:cln 2.4s .5s steps(6) forwards}
@keyframes gar{to{opacity:1}}@keyframes cln{to{opacity:0}}
.fol{position:absolute;inset:14% 8% 8% 8%;display:grid;grid-template-columns:repeat(3,1fr);gap:2cqw;align-content:start}
.fi{background:#fff;border-radius:1.6cqw;text-align:center;padding:1.6cqw 0;font-size:max(18px,6cqw);box-shadow:0 .4cqw 1.2cqw rgba(0,0,0,.18);animation:poof .5s forwards}.fi small{display:block;font-size:max(9px,2.3cqw);color:#555}
@keyframes poof{to{transform:scale(0);opacity:0}}
.empty{position:absolute;inset:0;display:grid;place-items:center;font-size:max(12px,3.6cqw);font-weight:700;color:#555;opacity:0;animation:pop .4s 2.6s forwards}
.rb{position:absolute;inset:0;background:#000;display:grid;place-items:center;color:#fff;animation:rbk 5s infinite}
@keyframes rbk{0%,38%{opacity:0}42%,92%{opacity:1}96%,100%{opacity:0}}
.rb .sp{width:8cqw;height:8cqw;border:1cqw solid #444;border-top-color:#fff;border-radius:50%;animation:spn 1s linear infinite;margin:0 auto 2cqw}@keyframes spn{to{transform:rotate(360deg)}}
.rb div{text-align:center;font-size:max(11px,3.4cqw)}
.dsk{position:absolute;left:8%;right:8%;top:22%;background:#fff;border-radius:1.8cqw;padding:3cqw;box-shadow:0 1cqw 3cqw rgba(0,0,0,.25)}
.dsk .l{display:flex;justify-content:space-between;font-weight:700;font-size:max(10px,3cqw);margin-bottom:1.6cqw}
.bar{height:5cqw;border-radius:99px;background:#e3e3ea;overflow:hidden}.bar i{display:block;height:100%;width:38%;background:#16B981;border-radius:99px;animation:fill 4.2s .3s linear forwards}
@keyframes fill{0%{width:38%;background:#16B981}55%{background:#DC9F0E}100%{width:100%;background:#CA133E}}
.num{font-variant-numeric:tabular-nums}
.tray2{position:absolute;left:0;right:0;bottom:0;height:11cqw;background:rgba(30,30,40,.9);display:flex;align-items:center;justify-content:flex-end;gap:2cqw;padding:0 3cqw;color:#fff;font-size:max(9px,2.6cqw)}
.sh{font-size:max(16px,6cqw);position:relative;display:inline-block}
.sh.off{animation:shoff .6s 1.6s forwards}@keyframes shoff{to{filter:grayscale(1);opacity:.5}}
.sh .x{position:absolute;right:-1cqw;bottom:-1cqw;font-size:max(10px,3.6cqw);opacity:0;animation:pop .3s 2.1s forwards}
.sw{width:11cqw;height:5.4cqw;border-radius:99px;background:#16B981;position:relative;animation:swoff .4s 1.5s forwards}.sw::after{content:'';position:absolute;top:.7cqw;right:.7cqw;width:4cqw;height:4cqw;border-radius:50%;background:#fff;animation:swm .4s 1.5s forwards}
@keyframes swoff{to{background:#9a9aa3}}@keyframes swm{to{right:6.7cqw}}
.bugs{position:absolute;right:6cqw;bottom:8cqw;font-size:max(14px,5cqw);animation:bug 1.4s ease-in forwards}@keyframes bug{from{transform:translate(-45cqw,-25cqw) rotate(-30deg)}to{transform:translate(0,0) rotate(0)}}
`;}
  html(){return`<div class="wrap"><p class="def">Spot the <b>symptoms</b> that show a virus is on the computer. Step through each one.</p>
<div class="lay"><div class="mon"><div class="scr" id="scr"></div></div><div><ol class="steps" id="steps"></ol></div></div>${CTL}</div>`;}
  list(){return SIGNS.map(s=>`<b>${s[0]}</b>`);}
  ms(){return 5200;}
  show(k){const s=this.$('scr');const T=`<span class="tag">⚠ Symptom ${k+1}: ${SIGNS[k][1]}</span>`;let h='';
    if(k===0)h=`<div class="doc"><h4>📄 homework.docx</h4><p class="c">The water cycle describes how water moves between the sea, the air and the land. It evaporates, condenses and falls again as rain.</p><p class="g">▒#@%$▓&▒░#!%▒▓&@#░▒$%#▓▒&░@!#▒%▓$&░#▒@%▓#░&$▒%@!#▓&░▒$%@#░▓▒&</p></div><div class="dlg" style="left:22%;top:44%;width:56%;animation-delay:3s"><div class="h">⚠ Cannot open file</div><div class="b">homework.docx is <b>corrupted</b> and cannot be opened.</div><span class="bt">OK</span></div>`;
    if(k===1){const fs=[['📄','report'],['🖼️','photo'],['🎵','song'],['📊','data'],['📝','notes'],['🎬','video']];h=`<div class="fol">${fs.map((f,i)=>`<div class="fi" style="animation-delay:${.7+i*.45}s">${f[0]}<small>${f[1]}</small></div>`).join('')}</div><div class="empty">📂 Folder is empty — files deleted</div>`;}
    if(k===2)h=`<div class="dlg" style="left:6%;top:20%;width:54%;animation-delay:.2s"><div class="h">⚠ Error 0x80070057</div><div class="b">An unexpected error occurred.</div></div><div class="dlg" style="left:30%;top:36%;width:56%;animation-delay:1s"><div class="h">⚠ Not responding</div><div class="b">Word <b>has stopped working</b>.</div><span class="bt">Close</span></div><div class="dlg" style="left:14%;top:54%;width:58%;animation-delay:1.8s"><div class="h">⚠ Software error</div><div class="b">The application <b>crashed</b>. Data may be lost.</div><span class="bt">OK</span></div>`;
    if(k===3)h=`<div class="doc" style="top:22%;height:58%"><h4>📄 Working on my project…</h4><p style="color:#6B6B73">Typing the essay, everything seems fine…</p></div><div class="rb"><div><div class="sp"></div>Restarting…</div></div>`;
    if(k===4)h=`<div class="dsk"><div class="l"><span>💽 Local Disk (C:)</span><span class="num" id="gb">380 GB of 1000 GB used</span></div><div class="bar"><i></i></div></div><div class="dlg" style="left:22%;top:58%;width:56%;animation-delay:4.4s"><div class="h">⚠ Low disk space</div><div class="b">Disk is <b>full</b>. 0 bytes free.</div></div>`;
    if(k===5)h=`<div class="dsk" style="top:16%"><div class="l"><span>🛡️ Real-time protection</span><div class="sw"></div></div><div style="font-size:max(10px,2.8cqw);color:#555">Antivirus is switching itself <b style="color:#CA133E">off</b>…</div></div><div class="dlg" style="left:20%;top:48%;width:60%;animation-delay:2.4s"><div class="h">⚠ Protection is OFF</div><div class="b">Your computer is <b>not protected</b>.</div></div><div class="tray2"><span class="bugs">🦠</span><span class="sh off">🛡️<span class="x">❌</span></span><span>10:42</span></div>`;
    s.innerHTML=h+T;
    if(k===4){clearInterval(this.iv);let v=380;const gb=this.$('gb');this.later(()=>{this.iv=setInterval(()=>{v=Math.min(1000,v+20);if(gb)gb.textContent=`${v} GB of 1000 GB used`;if(v>=1000)clearInterval(this.iv);},134);},300);}
  }
  stop(){clearInterval(this.iv);super.stop();}
}

/* ====================================================== ANTIVIRUS ====================================================== */
const AVF=[['📝','notes.txt',0],['🖼️','holiday.jpg',0],['🎮','free_game.exe',1],['📕','invoice.pdf',1]];
const SIGDB=[['A3 91 0F 22','Worm.Net.07'],['5C 7E 44 B0','Spyware.Key.19'],['4D 5A 90 00','Trojan.Gen.42'],['E1 08 FF 3A','Adware.Pop.03'],['9B 12 C6 71','Ransom.Lock.88']];
class Antivirus extends Act{
  css(){return`
.shield{display:inline-block}
.sc{position:relative;min-height:230px;padding:14px;background:linear-gradient(#fff,#FDF5F6)}
.p1{display:grid;gap:10px;justify-items:center;text-align:center}
.big{font-size:15px;line-height:1.65;max-width:520px}.big b{color:#CA133E}
.pcs{position:relative;width:min(100%,320px);aspect-ratio:16/10;border-radius:12px;background:linear-gradient(#3a3a42,#1c1c20);padding:8px;box-shadow:0 6px 14px rgba(0,0,0,.25)}
.pcs .in{position:relative;width:100%;height:100%;border-radius:6px;background:linear-gradient(135deg,#E8F0FB,#CFE0F6);overflow:hidden;container-type:inline-size}
.pcs .f{position:absolute;font-size:max(16px,9cqw)}.pcs .f:nth-child(1){left:10%;top:14%}.pcs .f:nth-child(2){left:42%;top:14%}.pcs .f:nth-child(3){left:72%;top:14%}.pcs .f:nth-child(4){left:26%;top:56%}.pcs .f:nth-child(5){left:58%;top:56%}
.pcs .vb{position:absolute;left:58%;top:56%;font-size:max(18px,10cqw);opacity:0;animation:vb 6s infinite}
@keyframes vb{0%,28%{opacity:0;transform:scale(.3)}34%,56%{opacity:1;transform:scale(1)}62%,100%{opacity:0;transform:scale(0) rotate(180deg)}}
.pcs .mg{position:absolute;font-size:max(22px,13cqw);animation:mg 6s ease-in-out infinite;filter:drop-shadow(0 2px 3px rgba(0,0,0,.3))}
@keyframes mg{0%{left:6%;top:8%}16%{left:60%;top:10%}32%{left:20%;top:50%}50%{left:56%;top:50%}70%{left:70%;top:58%}100%{left:6%;top:8%}}
.pcs .al{position:absolute;left:50%;bottom:6%;transform:translateX(-50%) scale(0);background:#CA133E;color:#fff;font-weight:700;padding:.6cqw 3cqw;border-radius:99px;font-size:max(10px,4.4cqw);white-space:nowrap;animation:al 6s infinite}
@keyframes al{0%,34%{transform:translateX(-50%) scale(0)}40%,58%{transform:translateX(-50%) scale(1)}64%,100%{transform:translateX(-50%) scale(0)}}
.fc{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;padding:12px 12px 0}
.fc button{font-family:inherit;display:flex;gap:8px;align-items:center;text-align:left;padding:8px 10px;border-radius:12px;border:2px solid #F3C4CE;background:#fff;cursor:pointer;font-size:13px;font-weight:700;color:#1A1A1A;transition:all .25s}
.fc button .e{font-size:22px}.fc button.on{border-color:#CA133E;background:#FDE8EC;color:#CA133E}
.fs{position:relative;height:220px;margin:10px 12px 12px;border-radius:14px;background:linear-gradient(135deg,#E8F0FB,#CFE0F6);overflow:hidden;container-type:inline-size;border:2px solid #C9D6EC}
.fcap{margin:0 12px 12px;text-align:center;font-size:13.5px;line-height:1.5;min-height:40px}.fcap b{color:#CA133E}
.ab{position:absolute;left:0;right:0;bottom:0;height:12cqw;min-height:28px;background:rgba(30,30,40,.92);display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:0 14px;color:#fff;font-size:12px}
.spin{display:inline-block;font-size:22px;position:relative}.spin::before{content:'';position:absolute;inset:-5px;border:3px dashed #7CF0B4;border-radius:50%;animation:rot 2.4s linear infinite}@keyframes rot{to{transform:rotate(360deg)}}
.gate{position:absolute;left:44%;top:12%;width:12%;min-width:44px;height:62%;border-radius:12px;background:linear-gradient(#2563EB,#1d3f9a);box-shadow:0 0 18px rgba(37,99,235,.6);display:grid;place-items:center;font-size:30px;overflow:hidden}
.gate::after{content:'';position:absolute;left:0;right:0;height:4px;background:#7CF0B4;box-shadow:0 0 10px #7CF0B4;animation:scan 1.1s ease-in-out infinite alternate}@keyframes scan{from{top:6%}to{top:92%}}
.fl1{position:absolute;top:30%;left:4%;font-size:36px;animation:fl1 5s ease-in-out infinite}
@keyframes fl1{0%{left:4%}30%,42%{left:30%}55%,100%{left:80%}}
.okb{position:absolute;left:46%;top:2%;font-size:26px;opacity:0;animation:okb 5s infinite}@keyframes okb{0%,40%{opacity:0;transform:scale(0)}48%,100%{opacity:1;transform:scale(1)}}
.win2{position:absolute;right:3%;top:20%;width:24%;min-width:90px;background:#fff;border-radius:8px;border:2px solid #16B981;font-size:12px;overflow:hidden;opacity:0;animation:okb 5s infinite}.win2 div{background:#16B981;color:#fff;padding:3px 6px;font-weight:700}.win2 p{margin:0;padding:6px}
.toast{position:absolute;right:3%;top:8%;width:62%;max-width:300px;background:#fff;border-left:6px solid #CA133E;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,.3);padding:10px 12px;font-size:13px;animation:slide .6s cubic-bezier(.3,1.4,.5,1) both}
@keyframes slide{from{transform:translateX(120%)}to{transform:none}}.toast b{color:#CA133E}.toast .b2{display:flex;gap:6px;margin-top:6px}.toast .b2 span{padding:3px 10px;border-radius:99px;border:1.5px solid #CA133E;font-size:11.5px;font-weight:700;color:#CA133E}
.bell{position:absolute;left:10%;top:28%;font-size:54px;animation:bell .5s ease-in-out infinite alternate;transform-origin:50% 0}@keyframes bell{from{transform:rotate(-18deg)}to{transform:rotate(18deg)}}
.cal2{position:absolute;left:5%;top:10%;width:34%;min-width:120px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.2);text-align:center}.cal2 .t{background:#CA133E;color:#fff;font-weight:700;padding:4px;font-size:12px}.cal2 .d{padding:8px;font-size:13px;font-weight:700}.cal2 .d small{display:block;font-weight:600;color:#6B6B73}
.clk2{position:absolute;left:8%;top:62%;width:56px;height:56px;border-radius:50%;background:#fff;border:3px solid #44444B;box-shadow:0 3px 8px rgba(0,0,0,.2)}.clk2 i{position:absolute;left:50%;bottom:50%;width:3px;background:#1A1A1A;border-radius:2px;transform-origin:50% 100%}.clk2 i:nth-child(1){height:18px;animation:rot 1.6s linear infinite}.clk2 i:nth-child(2){height:12px;animation:rot 19s linear infinite}
.sbx{position:absolute;right:4%;top:14%;width:50%;background:#fff;border-radius:12px;padding:10px 12px;box-shadow:0 4px 12px rgba(0,0,0,.2);font-size:12.5px}.sbx .bar2{height:12px;border-radius:99px;background:#e3e3ea;overflow:hidden;margin:6px 0}.sbx .bar2 i{display:block;height:100%;width:0;background:#2563EB;animation:sfill 3.6s .6s linear forwards}
@keyframes sfill{to{width:100%}}.sbx .ok{opacity:0;color:#059669;font-weight:700;animation:okb 5s 4.1s forwards}
.hw{display:grid;gap:12px;grid-template-columns:1fr}@container (min-width:780px){.hw{grid-template-columns:1.5fr 1fr;align-items:start}}
.arena{position:relative;border-radius:14px;background:linear-gradient(135deg,#E8F0FB,#CFE0F6);border:2px solid #C9D6EC;min-height:300px;padding:12px;overflow:hidden;container-type:inline-size}
.pr{text-align:center;font-size:13.5px;font-weight:600;margin-bottom:10px;line-height:1.45}.pr b{color:#CA133E}
.fgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px}
.fb{font-family:inherit;background:#fff;border:2px solid #DADAE2;border-radius:12px;padding:10px 6px;cursor:pointer;display:grid;gap:2px;justify-items:center;font-size:12.5px;font-weight:700;transition:all .2s}.fb:hover{border-color:#CA133E;transform:translateY(-2px)}.fb span{font-size:30px}
.row3{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;margin:6px 0}
.big1{font-size:44px;text-align:center}
.sg{display:flex;flex-direction:column;align-items:center;gap:8px}
.gshield{font-size:64px;position:relative;display:inline-block}.gshield.scan::after{content:'';position:absolute;left:0;right:0;top:0;height:4px;background:#7CF0B4;box-shadow:0 0 12px #16B981;animation:scan2 1s ease-in-out infinite alternate}@keyframes scan2{from{top:6%}to{top:94%}}
.cmp{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}.cmp>div{background:#fff;border-radius:10px;border:2px solid #DADAE2;padding:8px;font-size:12px}.cmp h5{margin:0 0 6px;font-size:12px;color:#44444B}
.mono2{font-family:ui-monospace,Menlo,Consolas,monospace}
.sig{display:flex;justify-content:space-between;gap:6px;padding:3px 6px;border-radius:6px;font-size:11px;white-space:nowrap;transition:all .15s}.sig.chk{background:#FFF3C4}.sig.hit{background:#CA133E;color:#fff;font-weight:700}.sig.no{background:transparent;opacity:.5}
.fsig{font-size:15px;font-weight:700;color:#CA133E;text-align:center;padding:8px 0}
.res{margin-top:8px;text-align:center;font-size:13.5px;font-weight:700}.res.ok{color:#059669}.res.bad{color:#CA133E}
.dg{background:#fff;border:3px solid #CA133E;border-radius:14px;padding:12px;text-align:center;box-shadow:0 8px 22px rgba(0,0,0,.25);animation:pop .4s cubic-bezier(.3,1.6,.5,1)}
@keyframes pop{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}
.dg h4{margin:0 0 4px;color:#CA133E;font-size:15px}.dg p{margin:0 0 10px;font-size:13px}
.opts{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}.opts button{font-family:inherit;font-weight:700;font-size:13.5px;padding:9px 16px;border-radius:12px;border:2px solid #CA133E;background:#fff;color:#CA133E;cursor:pointer}.opts button.q{background:#CA133E;color:#fff;box-shadow:0 3px 0 #A01030}
.shred{animation:shr .9s ease-in forwards}@keyframes shr{to{transform:translateY(40px) scale(.1) rotate(25deg);opacity:0}}
.vault{border:3px dashed #7C3AED;background:#F5F0FF;border-radius:14px;padding:10px;text-align:center;position:relative;margin-top:8px}.vault h5{margin:0 0 4px;color:#7C3AED;font-size:13px}.vault .lk{font-size:30px}
.vault .fin{display:inline-block;font-size:34px;animation:intoV .8s ease-in both}@keyframes intoV{from{transform:translateY(-70px) scale(1.3);opacity:0}to{transform:none;opacity:1}}
.cln{height:12px;border-radius:99px;background:#e3e3ea;overflow:hidden;margin:6px auto;max-width:220px}.cln i{display:block;height:100%;width:0;background:linear-gradient(90deg,#7C3AED,#16B981);animation:sfill 2.6s linear forwards}
.deny{color:#CA133E;font-weight:700;animation:shk .4s}@keyframes shk{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.ghostb{font-family:inherit;font-weight:700;font-size:12.5px;border-radius:99px;border:2px solid #7C3AED;background:#fff;color:#7C3AED;padding:4px 12px;cursor:pointer;margin-top:4px}
.badge{display:inline-flex;gap:4px;align-items:center;font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px;background:#fff;border:2px solid #DADAE2;color:#6B6B73}.badge.on{border-color:#059669;color:#059669;background:#ECFDF5}
.tries{display:flex;gap:6px;justify-content:center;margin-top:8px;flex-wrap:wrap}
`;}
  html(){return`<div class="wrap"><p class="def"><b>Antivirus:</b> a program which <b>detects the presence of a virus</b> on the computer.</p>
<div class="seg"><button type="button" data-t="0">① What it is</button><button type="button" data-t="1">② What it does</button><button type="button" data-t="2">③ How it works</button></div>
<div class="stage" id="body"></div></div>`;}
  init(){this.tab=0;this.fn=0;this.tried={del:0,qua:0};this.r.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>this.setTab(+b.dataset.t));this.setTab(0);}
  setTab(t){this.clr();this.tab=t;this.r.querySelectorAll('.seg button').forEach((b,i)=>b.className=i===t?'on':'');
    this.$('body').innerHTML=t===0?this.pOver():t===1?this.pFun():this.pHow();
    if(t===1)this.bindFun();if(t===2)this.howStart();}
  pOver(){return`<div class="sc p1"><div class="big">An <b>antivirus</b> is a program that <b>scans the computer</b> and tells you when a <b>virus</b> is present.</div>
<div class="pcs"><div class="in"><span class="f">📄</span><span class="f">🖼️</span><span class="f">🎵</span><span class="f">📊</span><span class="f">🎮</span><span class="vb">🦠</span><span class="mg">🔍</span><span class="al">🚨 Virus detected!</span></div></div>
<div class="big" style="font-size:13.5px;color:#6B6B73">Watch the <b>magnifier</b> sweep the files and find the virus.</div></div>`;}
  FUN(){return[
    ['🔎','Checks files & software before running','The antivirus <b>checks files and software before they run</b>. A file only opens if it is clean.',()=>`<div class="fl1">📦</div><div class="gate">🛡️</div><div class="okb">✅</div><div class="win2"><div>setup.exe</div><p>Running safely ✓</p></div>`],
    ['⏱️','Runs constantly in the background','It <b>runs constantly in the background</b>, protecting you while you work — you do not have to start it.',()=>`<div style="position:absolute;left:8%;top:12%;width:60%;background:#fff;border-radius:10px;padding:10px;box-shadow:0 4px 12px rgba(0,0,0,.2);font-size:13px"><b>📝 My essay</b><br>Typing away… antivirus is still watching.</div><div class="toast" style="top:52%;right:3%;width:46%;border-left-color:#16B981;animation-delay:1.2s;font-size:12px">⬇ Download scanned <b style="color:#059669">✓ clean</b></div><div class="ab"><span>Protection <b style="color:#7CF0B4">ON</b></span><span class="spin">🛡️</span><span>10:42</span></div>`],
    ['🔔','Notifies you of a virus','When it finds a virus it <b>notifies you</b> so you can decide what to do.',()=>`<div class="bell">🔔</div><div class="toast"><b>⚠ Virus found!</b><br>invoice.exe contains <b>Trojan.Gen.42</b><div class="b2"><span>Delete</span><span>Quarantine</span></div></div>`],
    ['📅','Can run a scheduled scan','You can set it to <b>run a scheduled scan</b> — for example every Sunday at 2 am — without being there.',()=>`<div class="cal2"><div class="t">SCHEDULED SCAN</div><div class="d">Every Sunday<small>2:00 am</small></div></div><div class="clk2"><i></i><i></i></div><div class="sbx"><b>🛡️ Scanning…</b><div class="bar2"><i></i></div><span class="ok">No threats found ✓</span></div>`]];}
  pFun(){return`<div class="fc">${this.FUN().map((f,i)=>`<button type="button" data-f="${i}"><span class="e">${f[0]}</span>${f[1]}</button>`).join('')}</div><div class="fs" id="fs"></div><div class="fcap" id="fcap"></div><div class="ctl" style="margin:0 0 12px"><button type="button" id="rp" class="pri">▶ Replay</button><button type="button" id="nf">Next function ▶</button></div>`;}
  bindFun(){this.r.querySelectorAll('.fc button').forEach(b=>b.onclick=()=>this.showFun(+b.dataset.f));this.$('rp').onclick=()=>this.showFun(this.fn);this.$('nf').onclick=()=>this.showFun((this.fn+1)%4);this.showFun(this.fn);}
  showFun(i){this.fn=i;this.r.querySelectorAll('.fc button').forEach((b,j)=>b.className=j===i?'on':'');const f=this.FUN()[i];this.$('fs').innerHTML=f[3]();this.$('fcap').innerHTML=`<b>Function ${i+1}:</b> ${f[2]}`;}
  /* ---- how it works: interactive ---- */
  STEPS(){return['Antivirus <b>checks programs &amp; files before running</b> them','It <b>compares the file with a database of viruses</b>','If the file is infected you have <b>2 options</b>: <b>delete</b> it or <b>quarantine</b> it','<b>Quarantine:</b> the file moves to a <b>hidden folder</b> (the user has no access) and the antivirus starts <b>cleaning</b> it'];}
  pHow(){return`<div class="sc"><div class="hw"><div class="arena" id="ar"></div><div><ol class="steps" id="hs">${this.STEPS().map(s=>`<li><span>${s}</span></li>`).join('')}</ol><div class="tries" id="tr"></div></div></div></div>`;}
  mark(n){[...this.$('hs').children].forEach((li,i)=>{li.className=i+1===n?'on':i+1<n?'done':'';});}
  howStart(){this.$('hs').querySelectorAll('li').forEach(li=>li.style.cursor='default');this.picked=null;this.tr();this.pick();}
  tr(){this.$('tr').innerHTML=`<span class="badge ${this.tried.del?'on':''}">${this.tried.del?'✓':'○'} Tried: Delete</span><span class="badge ${this.tried.qua?'on':''}">${this.tried.qua?'✓':'○'} Tried: Quarantine</span>`;}
  ar(h){this.$('ar').innerHTML=h;}
  pick(){this.clr();this.mark(0);this.ar(`<div class="pr">You want to open a file. <b>Pick one</b> — the antivirus will check it first.</div><div class="fgrid">${AVF.map((f,i)=>`<button type="button" class="fb" data-i="${i}"><span>${f[0]}</span>${f[1]}</button>`).join('')}</div><div class="ctl"><button type="button" id="wd">▶ Watch a demo</button></div>`);
    this.r.querySelectorAll('.fb').forEach(b=>b.onclick=()=>this.scan(+b.dataset.i));this.$('wd').onclick=()=>{this.demo=1;this.scan(2);};this.demo=0;}
  scan(i){this.clr();this.f=AVF[i];this.mark(1);
    this.ar(`<div class="sg"><div class="pr"><b>Step 1:</b> you open <b>${this.f[1]}</b>. The antivirus <b>stops it and checks it before it runs</b>.</div><div class="row3"><span class="big1">${this.f[0]}</span><span style="font-size:26px">➜</span><span class="gshield scan">🛡️</span></div><div class="res" style="color:#2563EB">Scanning…</div></div>`);
    this.later(()=>this.compare(),2200);}
  compare(){this.mark(2);const inf=this.f[2];const sig=inf?SIGDB[2][0]:'7F 3A 11 C2';
    this.ar(`<div class="pr"><b>Step 2:</b> the antivirus <b>compares the file with its database of viruses</b>.</div><div class="cmp"><div><h5>📄 ${this.f[1]}</h5><div class="fsig mono2">${sig}</div></div><div><h5>🗄️ Virus database</h5>${SIGDB.map((s,j)=>`<div class="sig mono2" id="sg${j}"><span>${s[0]}</span><span>${s[1]}</span></div>`).join('')}</div></div><div class="res" id="rs2"></div>`);
    const hit=inf?2:-1;SIGDB.forEach((_,j)=>{this.later(()=>{SIGDB.forEach((_,q)=>{const e=this.$('sg'+q);if(e)e.className='sig mono2'+(q===j?(j===hit?' hit':' chk'):q<j?' no':'');});},500+j*650);});
    this.later(()=>{const r=this.$('rs2');if(!r)return;if(inf){r.className='res bad';r.textContent='🚨 Match found: '+SIGDB[2][1]+' — this file is infected!';}else{SIGDB.forEach((_,q)=>{const e=this.$('sg'+q);if(e)e.className='sig mono2 no';});r.className='res ok';r.textContent='✅ No match — the file is clean.';}},500+SIGDB.length*650);
    this.later(()=>inf?this.decide():this.clean(),500+SIGDB.length*650+1700);}
  clean(){this.ar(`<div class="sg"><div class="pr"><b>${this.f[1]}</b> is clean, so the antivirus lets it <b>run normally</b>.</div><div class="row3"><span class="big1">${this.f[0]}</span><span style="font-size:30px">✅</span></div><div class="res ok">File opened safely.</div><div class="ctl"><button type="button" class="pri" id="an">Try another file</button></div></div>`);this.$('an').onclick=()=>this.pick();this.mark(2.5);}
  decide(){this.mark(3);this.ar(`<div class="sg"><div class="pr"><b>Step 3:</b> <b>${this.f[1]}</b> is infected. You have <b>2 options</b>.</div><div class="dg"><h4>🚨 Virus found in ${this.f[1]}</h4><p>What would you like to do with the file?</p><div class="opts"><button type="button" id="od">🗑️ Delete the file</button><button type="button" class="q" id="oq">🔒 Quarantine</button></div></div></div>`);
    this.$('od').onclick=()=>this.del();this.$('oq').onclick=()=>this.qua();
    if(this.demo)this.later(()=>this.qua(),2200);}
  del(){this.clr();this.tried.del=1;this.tr();this.mark(3);
    this.ar(`<div class="sg"><div class="pr"><b>Delete:</b> the file is <b>removed</b>, and the virus goes with it.</div><div class="row3"><span class="big1 shred">${this.f[0]}</span><span style="font-size:40px">🗑️</span></div><div class="res bad" id="dm" style="opacity:0">File deleted — but you lose the file too.</div><div class="ctl"><button type="button" class="pri" id="an">Try another file</button></div></div>`);
    this.later(()=>{const e=this.$('dm');if(e)e.style.opacity=1;},900);this.$('an').onclick=()=>this.pick();}
  qua(){this.clr();this.tried.qua=1;this.tr();this.mark(4);
    this.ar(`<div class="sg"><div class="pr"><b>Quarantine:</b> the file is moved to a <b>hidden folder</b>. The user <b>has no access</b> to it.</div><div class="vault"><h5>🔒 Quarantine folder (hidden)</h5><span class="fin">${this.f[0]}</span><div class="lk">🔒</div><button type="button" class="ghostb" id="tp">Try to open it</button><div id="dn" style="min-height:20px;font-size:12.5px"></div></div><div class="res" id="cl" style="color:#7C3AED">Antivirus starts cleaning the file…</div><div class="cln"><i></i></div></div>`);
    this.$('tp').onclick=()=>{const d=this.$('dn');d.className='deny';d.textContent='⛔ Access denied — user has no access';d.style.animation='none';void d.offsetWidth;d.style.animation='';};
    this.later(()=>{const c=this.$('cl');if(!c)return;c.className='res ok';c.textContent='✅ Virus removed — the file is cleaned!';const v=this.r.querySelector('.vault');if(v)v.insertAdjacentHTML('beforeend','<div style="margin-top:6px;font-size:13px;color:#059669;font-weight:700">🛡️ '+this.f[1]+' is now safe</div>');
      const b=this.$('ar');b.insertAdjacentHTML('beforeend','<div class="ctl"><button type="button" class="pri" id="an">Try another file</button></div>');this.$('an').onclick=()=>this.pick();},3300);}
}

[['audioconf-demo',AudioConf],['videoconf-demo',VideoConf],['virus-demo',VirusDemo],['virussigns-demo',VirusSigns],['antivirus-demo',Antivirus]].forEach(([n,c])=>{if(!customElements.get(n))customElements.define(n,c);});
})();
