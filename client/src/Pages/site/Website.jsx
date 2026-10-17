import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Seo from '../../components/Seo';
import { useStories } from '../../context/StoriesContext';
import useMediaQuery, { useReducedMotion } from '../../hooks/useMediaQuery';
import tutorPhoto from '../../assets/PP.jpg';
import videoThumbnail from '../../assets/video-thumbnail.png';
import SiteLayout, { SI, useReveal } from './SiteLayout';
import Method from './Method';
import { HallSection } from './HallOfFame';
import { useSite } from './SiteSettings';
import { SAMPLE_FILTERS, PLANS, PERKS, CONTACT } from './siteContent';
import SampleViewer, { OptInGate } from './SampleViewer';
import { hasLead, track, variantFor } from '../../lib/leadTest';
import { API_ENDPOINTS } from '../../config/api';

/** Number that counts up (1.4s, ease-out) the first time it is 60% visible. */
export function CountUp({ to }) {
  const ref = useRef(null);
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (reduced || typeof IntersectionObserver === 'undefined') { setValue(to); return undefined; }
    let frame;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t) => {
        const p = Math.min((t - t0) / 1400, 1);
        setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(frame); };
  }, [to, reduced]);
  return <><span ref={ref} aria-hidden="true">{value}</span><span className="sr-only">{to}</span></>;
}

/** Public website: one scrolling page (design/AT-ICT Website v2.html). */
export default function Website({ children }) {
  return (
    <SiteLayout home>
      <Seo title="IGCSE ICT Mastery" description="Interactive notes, live sessions and personalised mentoring for IGCSE ICT students. Built to take you from zero to A*." path="/" />
      <Sections />
      {children}
    </SiteLayout>
  );
}

function Sections() {
  const { site } = useSite();
  const rootRef = useRef(null);
  const location = useLocation();
  const { fees, results, hallOfFame } = site.sections;
  // Sections the teacher switches on after the settings arrive still need their reveal-on-scroll.
  useReveal(rootRef, [fees, results, hallOfFame]);

  // /#section links from other pages (and the old /about, /fees … URLs).
  useEffect(() => {
    if (!location.hash) return undefined;
    const t = setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 60);
    return () => clearTimeout(t);
  }, [location.hash]);

  return (
    <div ref={rootRef}>
      <Hero />
      <Method />
      <Tutor />
      <Samples />
      {fees && <Fees />}
      {results && <Results />}
      {hallOfFame && <HallSection />}
      <Faq />
      <Contact />
      <section className="final">
        <div className="wrap rv">
          <h2>Your A* journey starts today.</h2>
          <p>Try the free samples first, or jump straight in and reserve your seat.</p>
          <div className="ctas">
            <a className="btn btn-w" href="#samples">Try free samples</a>
            <Link className="btn btn-o" to="/register">Reserve my seat</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Hero() {
  const { site } = useSite();
  const [playing, setPlaying] = useState(false);
  return (
    <section id="top" className="hero dark" aria-labelledby="hero-title">
      <div className="wrap">
        <div className="hero-g">
          <div>
            <span className="badge"><SI name="award" />92% average across students.an A*? It's Our standard.</span>
            <h1 id="hero-title">Struggling with <span className="hl">ICT</span> ? Let's fix that — <span className="hl">fast.</span></h1>
            <p className="lead">The only ICT tutoring course built on interactive sessions. No boring sessions. No memorizing.</p>
            <div className="ctas">
              <a className="btn btn-p" href="#samples"><SI name="play" />Watch a free lesson</a>
              {site.sections.fees ? <a className="btn btn-o" href="#fees">See plans</a> : <a className="btn btn-o" href="#method">See how it works</a>}
            </div>
            <div className="trust">
              {['Scoring A*','Interactive Learning', '24/7 support'].map(t => <span key={t}><SI name="cc" />{t}</span>)}
            </div>
          </div>
          <div className="vid">
            {playing ? (
              <iframe
                className="vid-frame"
                title="AT-ICT intro video"
                src="https://www.instagram.com/reel/DBGr8dvton8/embed"
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <img className="vid-thumb" src={videoThumbnail} alt="" aria-hidden="true" />
                <button type="button" className="play" aria-label="Play intro video" onClick={() => setPlaying(true)}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 4 13 8-13 8z" /></svg>
                </button>
              </>
            )}
            <a className="float a" href="/study-guide.html"><em>NEW FOR STUDENTS</em><b>Complete IGCSE ICT Revision</b><span>Every chapter in one place.</span></a>
            <a className="float b" href="/ict-mindmap.html"><em>VISUAL REVISION</em><b>ICT Mindmap</b><span>The whole syllabus at a glance.</span></a>
          </div>
        </div>
        <div className="stats">
          {site.heroStats.map(s => (
            <div className="stat" key={s.label}><b><CountUp to={s.n} /><i>{s.suffix}</i></b><span>{s.label}</span></div>
          ))}
        </div>
      </div>
      <div className="scroll-cue" aria-hidden="true" />
    </section>
  );
}

function Tutor() {
  return (
    <section id="about" className="sec tint" aria-labelledby="tutor-title">
      <div className="wrap tutor-g">
        <div className="photo rv"><img src={tutorPhoto} alt="Eng. Ahmad Tamer Ali, your ICT tutor" /></div>
        <div className="rv" style={{ '--d': '.12s' }}>
          <span className="eyebrow">My journey</span>
          <h2 className="h2" id="tutor-title">From a struggler to an <em>A* champion.</em></h2>
          <p className="lead">I remember my own IGCSE struggles — sitting in class, completely lost with notes and classified. That frustration is exactly why I created AT-ICT.</p>
          <ul className="checks">
            {['Software engineer & IGCSE expert', '5+ years teaching experience', "Former IGCSE student — I've been there"].map(t => <li key={t}><SI name="cc" />{t}</li>)}
          </ul>
          <div className="tags"><span>Simple</span><span>Engaging</span><span>Actually fun</span></div>
          <blockquote className="quote" style={{ marginBottom: 0 }}>
            “I won't just teach you ICT concepts — I'll show you how to think like a tech expert, solve problems confidently, and ace your exams with strategies that actually work in the real world.”
            <cite>Eng. Ahmad Tamer Ali · Your ICT success partner</cite>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

const KIND_META = {
  notes: { cat: 'notes', icon: 'file', type: 'Interactive Notes', points: ['Interactive diagrams', 'Quick revision notes'] },
  video: { cat: 'videos', icon: 'vid', type: 'Video Explanation', points: ['HD video quality', 'Practice files included'] },
  file: { cat: 'exercises', icon: 'cc', type: 'Practice File', points: ['Exam-style questions', 'Detailed solutions'] }
};

function Samples() {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState(null);
  const [mode, setMode] = useState('ab');
  const [gate, setGate] = useState(null); // { sample, variant } waiting for the form (version A)
  const [viewer, setViewer] = useState(null); // { sample, variant, askLater }

  useEffect(() => {
    let off = false;
    fetch(API_ENDPOINTS.SAMPLES)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(b => { if (!off) { setItems(b.data.samples || []); setMode(b.data.test?.mode || 'ab'); } })
      .catch(() => { if (!off) setItems([]); });
    return () => { off = true; };
  }, []);

  const open = (sample) => {
    if (!sample.url) return;
    if (mode === 'off' || hasLead()) { setViewer({ sample, variant: 'none', askLater: false }); return; }
    const variant = variantFor(mode);
    track('open', { variant, sampleId: sample.id });
    if (variant === 'A') {
      setGate({ sample, variant });
      track('prompt', { variant, sampleId: sample.id });
    } else {
      setViewer({ sample, variant, askLater: true });
    }
  };

  const cards = (items || []).map(s => ({ ...s, ...KIND_META[s.kind] || KIND_META.notes }));
  const shown = cards.filter(s => filter === 'all' || s.cat === filter);

  return (
    <section id="samples" className="sec dark" aria-labelledby="samples-title">
      <div className="wrap">
        <div className="center rv">
          <span className="eyebrow">Free · no account needed</span>
          <h2 className="h2" id="samples-title"><em>Free</em> sample materials</h2>
          <p className="lead">Experience our teaching quality before you enrol.</p>
        </div>
        <div className="filters rv" role="group" aria-label="Filter samples">
          {SAMPLE_FILTERS.map(f => (
            <button key={f.id} type="button" className={`f ${filter === f.id ? 'on' : ''}`} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              <SI name={f.icon} />{f.label}
            </button>
          ))}
        </div>
        {items && !cards.length && <p className="center lead rv" style={{ marginTop: 32 }}>New free samples are on the way. Check back soon.</p>}
        <div className="cards" aria-live="polite">
          {shown.map(s => (
            <article className="sc" key={s.id}>
              <div className="sc-h">
                <span className="chip"><SI name={s.icon} /></span>
                <div><h3>{s.title}</h3><small>{s.type}</small></div>
                <span className="free">FREE</span>
              </div>
              <p>{s.description}</p>
              <ul>{s.points.map(p => <li key={p}><SI name="cc" />{p}</li>)}</ul>
              <button type="button" className="btn btn-p sc-go" disabled={!s.url} onClick={() => open(s)}>
                {s.url ? <>Open free sample <SI name="arrow" /></> : 'Coming soon'}
              </button>
            </article>
          ))}
        </div>
      </div>
      {gate && (
        <OptInGate
          sample={gate.sample}
          variant={gate.variant}
          onClose={() => { track('dismiss', { variant: gate.variant, sampleId: gate.sample.id }); setGate(null); }}
          onDone={() => { setViewer({ sample: gate.sample, variant: gate.variant, askLater: false }); setGate(null); }}
        />
      )}
      {viewer && <SampleViewer sample={viewer.sample} variant={viewer.variant} askLater={viewer.askLater} onClose={() => setViewer(null)} />}
    </section>
  );
}

function Fees() {
  const { whatsappLink } = useSite();
  return (
    <section id="fees" className="sec tint" aria-labelledby="fees-title">
      <div className="wrap">
        <div className="center rv">
          <span className="eyebrow">Course fees</span>
          <h2 className="h2" id="fees-title">Choose your <em>plan.</em></h2>
          <p className="lead">Three ways in. Same curriculum, more support as you go up.</p>
        </div>
        <div className="plans">
          {PLANS.map((p, i) => (
            <div className={`plan rv ${p.popular ? 'pop' : ''}`} style={{ '--d': `${i * 0.1}s` }} key={p.name}>
              {p.popular && <span className="pt"><SI name="star" />Most popular</span>}
              <h3>{p.name}</h3>
              <div className="price">{p.price} {p.per && <small>{p.per}</small>}</div>
              <p>{p.text}</p>
              <ul>{p.features.map(f => <li key={f}><SI name="check" />{f}</li>)}</ul>
              <a className={`btn ${p.popular ? 'btn-p' : 'btn-d'}`} href={whatsappLink(`Hi AT-ICT! I'd like to reserve the ${p.name} plan.`)} target="_blank" rel="noreferrer">{p.cta}</a>
            </div>
          ))}
        </div>
        <div className="perks">
          {PERKS.map((p, i) => (
            <div className="perk rv" style={{ '--d': `${i * 0.1}s` }} key={p.title}>
              <span className="chip"><SI name={p.icon} /></span>
              <div><h4>{p.title}</h4><p>{p.text}</p></div>
            </div>
          ))}
        </div>
        <div className="help rv">
          <div><h3>Not sure which plan fits?</h3><p>Get a free consultation about your goals.</p></div>
          <a className="btn btn-p" href="#contact">Contact us for guidance</a>
        </div>
      </div>
    </section>
  );
}

const STORY_MS = 4000;

function Results() {
  const { site } = useSite();
  const { stories } = useStories();
  const reduced = useReducedMotion();
  const wide = useMediaQuery('(min-width: 1001px)');
  const mid = useMediaQuery('(min-width: 641px)');
  // Always two rows: 3×2 on desktop, 2×2 on tablets, 1×2 on phones.
  const perPage = wide ? 6 : mid ? 4 : 2;
  const pages = useMemo(() => {
    const out = [];
    for (let i = 0; i < stories.length; i += perPage) out.push(stories.slice(i, i + perPage));
    return out;
  }, [stories, perPage]);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = pages.length;
  const current = Math.min(page, Math.max(0, count - 1));

  const go = (dir) => setPage(p => (Math.min(p, count - 1) + dir + count) % count);

  // Advance every 4s; the timer restarts whenever the page changes, so manual clicks get a full 4s too.
  useEffect(() => {
    if (reduced || paused || count < 2) return undefined;
    const t = setTimeout(() => go(1), STORY_MS);
    return () => clearTimeout(t);
  }, [current, paused, reduced, count]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section id="results" className="sec deep" aria-labelledby="results-title">
      <div className="wrap">
        <div className="center rv">
          <span className="eyebrow">Student stories</span>
          <h2 className="h2" id="results-title">Real students, <em>real results.</em></h2>
          <p className="lead">Don't just take our word for it.</p>
        </div>
        <div
          className="car rv"
          role="region"
          aria-roledescription="carousel"
          aria-label="Student reviews"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onKeyDown={e => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); }}
        >
          <div className="tstack">
            {pages.map((group, pi) => (
              <div className={`tgrid ${pi === current ? 'on' : ''}`} key={pi} aria-hidden={pi !== current} inert={pi !== current ? '' : undefined}>
                {group.map((s, i) => (
                  <figure className="tc" key={`${s.name}-${i}`}>
                    <div className="stars" aria-label="5 stars">★★★★★</div>
                    <blockquote dir="auto">“{s.text}”</blockquote>
                    <figcaption><span className="av" aria-hidden="true">{(s.name || '?')[0]}</span><div><b>{s.name}</b><small>{s.country}</small></div></figcaption>
                  </figure>
                ))}
              </div>
            ))}
          </div>
          <div className="car-ctl">
            <button type="button" className="cb" aria-label="Previous reviews" onClick={() => go(-1)}>‹</button>
            <span className="cdots">
              {pages.map((_, i) => <button type="button" key={i} className={i === current ? 'on' : ''} aria-label={`Reviews page ${i + 1} of ${count}`} aria-current={i === current} onClick={() => setPage(i)} />)}
            </span>
            <button type="button" className="cb" aria-label="Next reviews" onClick={() => go(1)}>›</button>
          </div>
        </div>
        <div className="res">
          {site.resultCounters.map((c, i) => (
            <div className="rv" style={{ '--d': `${i * 0.1}s` }} key={c.label}><b><CountUp to={c.n} />{c.suffix}</b><span>{c.label}</span></div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const { faq: FAQ, whatsappLink } = useSite();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [open, setOpen] = useState(() => new Set([FAQ[0][1][0][0]]));
  const items = useMemo(() => FAQ.flatMap(([c, qs]) => qs.map(([question, answer]) => ({ c, question, answer }))), [FAQ]);
  const shown = items.filter(i => (cat === 'All' || i.c === cat) && `${i.question} ${i.answer}`.toLowerCase().includes(q.trim().toLowerCase()));
  const toggle = (k) => setOpen(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  return (
    <section id="faq" className="sec" aria-labelledby="faq-title">
      <div className="wrap faq-g">
        <div className="faq-side rv">
          <span className="eyebrow">FAQ</span>
          <h2 className="h2" id="faq-title">Frequently asked <em>questions.</em></h2>
          <p className="lead">Can't find your answer? We're always here to help.</p>
          <div className="search"><SI name="search" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search the FAQ…" aria-label="Search FAQ" /></div>
          <div className="cats" role="group" aria-label="FAQ categories">
            {['All', ...FAQ.map(f => f[0])].map(c => <button key={c} type="button" className={`cat ${cat === c ? 'on' : ''}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
          </div>
        </div>
        <div>
          {shown.map((i, k) => {
            const isOpen = open.has(i.question);
            return (
              <div className={`qa ${isOpen ? 'open' : ''}`} key={i.question}>
                <button type="button" aria-expanded={isOpen} aria-controls={`qa-${k}`} onClick={() => toggle(i.question)}>{i.question}<SI name="down" /></button>
                <div id={`qa-${k}`} role="region"><p inert={isOpen ? undefined : ''}>{i.answer}</p></div>
              </div>
            );
          })}
          {!shown.length && <p className="empty" style={{ display: 'block' }}>No matches — <a href={whatsappLink(q ? `Hi AT-ICT! Question: ${q}` : '')} target="_blank" rel="noreferrer">ask us on WhatsApp</a> instead.</p>}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const { site, whatsappLink } = useSite();
  const [v, setV] = useState({ n: '', e: '', s: '', p: '', m: '' });
  const [errors, setErrors] = useState({});
  const set = (k) => (ev) => setV(x => ({ ...x, [k]: ev.target.value }));
  const submit = (ev) => {
    ev.preventDefault();
    const next = {};
    if (!v.n.trim()) next.n = 'Enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.e.trim())) next.e = 'Enter a valid email';
    if (v.p.trim() && !/^\+?[\d\s-]{8,15}$/.test(v.p.trim())) next.p = 'Enter a valid phone number';
    setErrors(next);
    if (Object.keys(next).length) return;
    const text = `Hi AT-ICT! I'm ${v.n.trim()} (${v.e.trim()}${v.p.trim() ? `, ${v.p.trim()}` : ''}). ${v.s.trim() ? `${v.s.trim()}: ` : ''}${v.m.trim()}`;
    window.open(whatsappLink(text), '_blank', 'noopener,noreferrer');
  };
  const fld = (k, label, input) => (
    <label className={`fld ${errors[k] ? 'bad' : ''}`}>{label}{input}{errors[k] && <small className="ferr" style={{ display: 'block' }}>{errors[k]}</small>}</label>
  );
  return (
    <section id="contact" className="sec dark" aria-labelledby="contact-title">
      <div className="wrap">
        <div className="center rv">
          <span className="eyebrow">Contact</span>
          <h2 className="h2" id="contact-title">Let's talk <em>AT-ICT.</em></h2>
          <p className="lead">Questions about the course, teaching methods or enrolment — we reply on WhatsApp.</p>
        </div>
        <div className="c-g">
          <form className="card rv" onSubmit={submit} noValidate>
            <h3>Send us a message</h3>
            <div className="row2">
              {fld('n', 'Full name', <input value={v.n} onChange={set('n')} autoComplete="name" required aria-invalid={!!errors.n} />)}
              {fld('e', 'Email', <input type="email" value={v.e} onChange={set('e')} autoComplete="email" required aria-invalid={!!errors.e} />)}
            </div>
            {fld('s', 'Subject', <input value={v.s} onChange={set('s')} placeholder="What is this about?" />)}
            {fld('p', 'Phone', <><input type="tel" value={v.p} onChange={set('p')} placeholder="01012345678" autoComplete="tel" aria-invalid={!!errors.p} /><small>Egyptian mobile — e.g. 01012345678 or +201012345678</small></>)}
            {fld('m', 'Message', <textarea value={v.m} onChange={set('m')} placeholder="Tell us how we can help you…" />)}
            <button className="btn btn-wa btn-block"><SI name="msg" />Send via WhatsApp</button>
          </form>
          <div className="card rv" style={{ '--d': '.12s' }}>
            <h3>Get in touch</h3>
            <div className="ci"><span className="chip"><SI name="mail" /></span><div><b>Email</b>{site.emails.map(e => <a key={e} href={`mailto:${e}`}>{e}</a>)}</div></div>
            <div className="ci"><span className="chip"><SI name="phone" /></span><div><b>Phone</b>{site.phones.map(p => <a key={p} href={`tel:${p.replace(/[^\d+]/g, '')}`}>{p}</a>)}</div></div>
            <div className="ci"><span className="chip"><SI name="pin" /></span><div><b>Centers &amp; schools</b><span>{CONTACT.centers}</span></div></div>
          </div>
        </div>
      </div>
    </section>
  );
}
