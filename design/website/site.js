const IC={
arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',check:'<path d="M20 6 9 17l-5-5"/>',cc:'<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
book:'<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',vid:'<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m22 8-6 4 6 4z"/>',
life:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.9 4.9 4.3 4.3M14.8 14.8l4.3 4.3M14.8 9.2l4.3-4.3M4.9 19.1l4.3-4.3"/>',
chart:'<path d="M3 3v18h18M8 17v-5M13 17V8M18 17v-9"/>',puzzle:'<path d="M12 3a2 2 0 0 1 2 2v1h4v4h1a2 2 0 1 1 0 4h-1v4h-4v-1a2 2 0 1 0-4 0v1H6v-4H5a2 2 0 1 1 0-4h1V6h4V5a2 2 0 0 1 2-2z"/>',
star:'<path d="m12 2 3 6.9 7.5.7-5.6 5 1.7 7.4L12 18l-6.6 4 1.7-7.4-5.6-5 7.5-.7z"/>',
quote:'<path d="M3 21c3 0 7-1 7-8V5H3v8h4c0 3-2 4-4 4zM14 21c3 0 7-1 7-8V5h-7v8h4c0 3-2 4-4 4z"/>',
mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',phone:'<path d="M22 17v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
down:'<path d="m6 9 6 6 6-6"/>',search:'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
msg:'<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2-5.4A8.4 8.4 0 1 1 21 11.5z"/>',ig:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
yt:'<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/>',
play:'<path d="m6 3 14 9-14 9z"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
award:'<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/>',trend:'<path d="m22 7-8.5 8.5-5-5L2 17M16 7h6v6"/>'};
const ico=n=>`<svg class="i" viewBox="0 0 24 24">${IC[n]||''}</svg>`;
document.querySelectorAll('[data-i]').forEach(e=>e.insertAdjacentHTML('afterbegin',ico(e.dataset.i)));
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
/* samples + faq data */
const SAMPLES=[['notes','file','Networks','Interactive Notes','Learn the basics of networks with our interactive notes.',['Interactive diagrams','Quick revision notes']],
['videos','vid','CH(1) — Computer Structure','Video Explanation','Explanation of the building blocks of ICT — Input, Processing, Output.',['HD video quality','Practice files included']],
['notes','file','Storage Devices','Interactive Notes','Learn the basics of storage devices with our interactive notes.',['Interactive diagrams','Quick revision notes']],
['exercises','cc','Paper 2 — Exam Revision','Final Revision','A comprehensive final revision covering all Paper 2 topics for IGCSE ICT.',['Real exam format','Detailed solutions']],
['videos','vid','CH(5) — Database','Video Explanation','Watch theoretical concepts, then dive into practical implementation.',['HD video quality','Practice files included']]];
$('#cards').innerHTML=SAMPLES.map(s=>`<article class="sc" data-t="${s[0]}"><div class="sc-h"><span class="chip">${ico(s[1])}</span><div><h3>${s[2]}</h3><small>${s[3]}</small></div><span class="free">FREE</span></div><p>${s[4]}</p><ul>${s[5].map(x=>`<li>${ico('cc')}${x}</li>`).join('')}</ul></article>`).join('');
$$('.f').forEach(b=>b.onclick=()=>{$$('.f').forEach(x=>x.classList.toggle('on',x===b));$$('.sc').forEach(c=>c.classList.toggle('hide',b.dataset.f!=='all'&&c.dataset.t!==b.dataset.f))});
const FAQ=[['Getting started',[['How do I know if AT-ICT is right for me?','AT-ICT is perfect for any IGCSE student who wants to excel. Whether you\'re struggling with basics or aiming for an A*, our personalised approach adapts to your level. Try our free samples to experience our teaching style risk-free!'],['What if I\'m a complete beginner in ICT?','No problem — we start from Day one. Every chapter is broken down step by step with interactive notes and recorded sessions you can replay.'],['Can I join mid-course?','Yes. The Compact Plan maps every step from where you are to exam day, and recorded sessions let you catch up on earlier chapters.']]],
['Course',[['What exactly is included in the course?','Interactive study notes, the whole ICT curriculum, progress tracking on the student portal and recorded sessions. Standard and Premium add live sessions, office hours, mock papers and more.'],['How is this different from school ICT lessons?','Interactive sessions, no boring lectures and no memorising — hands-on activities and exam strategies from a top examiner\'s point of view.'],['Can I access materials after the course ends?','Ask us on WhatsApp for the current access policy for your package.']]],
['Pricing',[['Are there any hidden costs?','No. The price on the package is the price you pay.'],['Do you offer payment plans or discounts?','Yes. Split payments over 2 or 3 instalments, 10% off when you register at least a month in advance, and 15% off for you and a friend.'],['What if I\'m not satisfied?','Message us on WhatsApp and we\'ll sort it out together.']]],
['Support',[['How quickly do you respond to questions?','WhatsApp support is 24/7 on Standard and Premium. We reply as fast as we can.'],['What if I don\'t achieve an A*?','We stay with you through mock exams and revision until you\'re exam-ready. Our students average 92% (A* – A).'],['Can parents track progress?','Yes — progress tracking on the portal includes regular assessments, quizzes and performance reports.']]],
['Technical',[['What technology do I need?','A laptop or tablet with internet, and a phone for WhatsApp. No coding required.'],['How much time per week?','We recommend 3–4 hours per week for optimal results. However, our flexible format allows you to study at your own pace. Some students do intensive weekend sessions, others prefer daily 30 minute chunks.'],['Is it suitable for different exam boards?','AT-ICT is built for Cambridge IGCSE ICT (0417).']]]];
$('#cats').innerHTML=['All',...FAQ.map(f=>f[0])].map((c,i)=>`<button class="cat${i?'':' on'}" data-c="${c}">${c}</button>`).join('');
$('#qas').innerHTML=FAQ.map(f=>f[1].map(q=>`<div class="qa" data-c="${f[0]}"><button aria-expanded="false">${q[0]}${ico('down')}</button><div><p>${q[1]}</p></div></div>`).join('')).join('')+'<p class="empty" id="empty">No matches — ask us on WhatsApp instead.</p>';
let cat='All';const filt=()=>{const t=$('#fs').value.toLowerCase();let n=0;$$('.qa').forEach(q=>{const ok=(cat==='All'||q.dataset.c===cat)&&q.textContent.toLowerCase().includes(t);q.classList.toggle('hide',!ok);n+=ok});$('#empty').style.display=n?'none':'block'};
$$('.cat').forEach(b=>b.onclick=()=>{cat=b.dataset.c;$$('.cat').forEach(x=>x.classList.toggle('on',x===b));filt()});$('#fs').oninput=filt;
$$('.qa button').forEach(b=>b.onclick=()=>{const q=b.parentElement,o=q.classList.toggle('open');b.setAttribute('aria-expanded',o)});$('.qa').classList.add('open');
/* reveal + counters */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.15});
$$('.rv').forEach(e=>io.observe(e));
const cio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;cio.unobserve(e.target);const el=e.target,to=+el.dataset.n,t0=performance.now();(function f(t){const p=Math.min((t-t0)/1400,1);el.textContent=Math.round(to*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(f)})(t0)}),{threshold:.6});
$$('[data-n]').forEach(e=>cio.observe(e));
/* scroll engine */
const nav=$('.nav'),prog=$('.prog'),ghost=$('.ghost'),meth=$('.method'),steps=$$('.m-step'),panels=$$('.m-panel'),mbar=$('.m-bar i');
let cur=-1;const setStep=i=>{if(i===cur)return;cur=i;steps.forEach((s,k)=>s.classList.toggle('on',k===i));panels.forEach((p,k)=>p.classList.toggle('on',k===i))};
const rpath=$('#rpath'),runner=$('#runner'),RL=rpath?rpath.getTotalLength():0;
function paint(sp,ix=cur){const pn=panels[ix];if(!pn)return;pn.querySelectorAll('[data-at]').forEach(e=>e.classList.toggle('sh',sp>=+e.dataset.at));if(ix===1&&rpath){rpath.style.strokeDasharray=RL;rpath.style.strokeDashoffset=RL*(1-sp);const q=rpath.getPointAtLength(RL*sp);runner.setAttribute('cx',q.x);runner.setAttribute('cy',q.y);runner.style.opacity=sp>.96?0:1}}
function onScroll(){const y=scrollY,h=document.documentElement.scrollHeight-innerHeight;prog.style.width=(y/h*100)+'%';nav.classList.toggle('stuck',y>40);
if(ghost&&y<innerHeight*1.2)ghost.style.transform=`translateY(${-y*.18}px)`;
const r=meth.getBoundingClientRect(),tr=meth.offsetHeight-innerHeight;
if(innerWidth>1000){const p=Math.min(Math.max(-r.top/tr,0),.999),n=steps.length;setStep(Math.floor(p*n));mbar.style.width=(p*100)+'%';paint(Math.min((p*n-cur)/.8,1))}else setStep(0)}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();
steps.forEach((s,i)=>s.onclick=()=>{if(innerWidth>1000){const tr=meth.offsetHeight-innerHeight;scrollTo({top:meth.offsetTop+tr*(i+.5)/steps.length})}});
/* active section */
const secs=$$('main>section[id]'),sio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const id=e.target.id;$$('.links a,.dots a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+id))}}),{rootMargin:'-45% 0px -50% 0px'});secs.forEach(s=>sio.observe(s));
/* menu */
const mn=$('#mnav');$('.burger').onclick=()=>mn.classList.add('open');$$('#mnav a,.mclose').forEach(a=>a.addEventListener('click',()=>mn.classList.remove('open')));
$('#waclose').onclick=()=>$('.wa-t').remove();
/* auth */
const modal=$('#auth');let step=0;const panes=$$('.rp');
const open=m=>{modal.classList.add('open');tab(m);document.body.style.overflow='hidden'},close=()=>{modal.classList.remove('open');document.body.style.overflow=''};
function tab(m){$$('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));$('#pin').classList.toggle('on',m==='in');$('#pup').classList.toggle('on',m==='up');if(m==='up')regReset();else regHideDone()}
$$('[data-open]').forEach(b=>b.onclick=e=>{e.preventDefault();mn.classList.remove('open');open(b.dataset.open)});$('.auth .x').onclick=close;modal.onclick=e=>{if(e.target===modal)close()};addEventListener('keydown',e=>e.key==='Escape'&&close());
$$('.tabs button').forEach(b=>b.onclick=()=>tab(b.dataset.m));$$('form').forEach(f=>f.onsubmit=e=>e.preventDefault());
$('#cf').onsubmit=e=>{e.preventDefault();const v=n=>e.target[n].value;open;window.open('https://wa.me/201274584000?text='+encodeURIComponent(`Hi AT-ICT! I'm ${v('n')} (${v('p')}). ${v('s')}: ${v('m')}`),'_blank')};

/* mobile: panels inline under each step, animated on view */
const mvis=$('.m-vis');let mob=null;
function place(){const m=innerWidth<=1000;if(m===mob)return;mob=m;if(m)panels.forEach((p,i)=>steps[i].after(p));else panels.forEach(p=>mvis.appendChild(p))}
place();addEventListener('resize',place);
const pio=new IntersectionObserver(es=>es.forEach(e=>{const i=panels.indexOf(e.target);if(!mob)return;if(e.isIntersecting&&!e.target._run){e.target._run=1;const t0=performance.now();(function f(t){const sp=Math.min((t-t0)/3500,1);paint(sp,i);if(sp<1)requestAnimationFrame(f)})(t0)}}),{threshold:.35});
panels.forEach(p=>pio.observe(p));

(function(){const tr=$('#track'),cs=$$('.tc',tr),dots=$('#cdots');dots.innerHTML=cs.map(()=>'<i></i>').join('');const step=()=>cs[0].offsetWidth+20;
const upd=()=>{const i=Math.round(tr.scrollLeft/step());$$('i',dots).forEach((d,k)=>d.classList.toggle('on',k===i))};tr.addEventListener('scroll',upd,{passive:true});upd();
$('#cprev').onclick=()=>tr.scrollBy({left:-step(),behavior:'smooth'});$('#cnext').onclick=()=>tr.scrollBy({left:step(),behavior:'smooth'})})();
