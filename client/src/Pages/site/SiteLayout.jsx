import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award, CheckCircle2, Play, BookOpen, CalendarDays, Video, BarChart3, FileText, Check, Star, Users, Clock,
  MessageCircle, Mail, Phone, MapPin, Instagram, Youtube, Search, Menu, X, ChevronDown, ArrowRight
} from 'lucide-react';
import logoFull from '../../assets/brand/logo-full.png';
import logoFullLight from '../../assets/brand/logo-full-light.png';
import { NAV_LINKS, SECTIONS, whatsappLink } from './siteContent';
import '../../styles/generated/site.css';
import '../../styles/site-extra.css';

const ICONS = {
  award: Award, cc: CheckCircle2, play: Play, book: BookOpen, cal: CalendarDays, vid: Video, chart: BarChart3,
  file: FileText, check: Check, star: Star, users: Users, clock: Clock, msg: MessageCircle, mail: Mail, phone: Phone,
  pin: MapPin, ig: Instagram, yt: Youtube, search: Search, menu: Menu, x: X, down: ChevronDown, arrow: ArrowRight
};

/** Site icon by prototype name (data-i="…"). */
export const SI = ({ name, ...props }) => {
  const Icon = ICONS[name];
  return Icon ? <Icon className="i" aria-hidden="true" {...props} /> : null;
};

/** Adds `.in` to `.rv` elements inside `ref` as they scroll into view (reveal-on-scroll). */
export function useReveal(ref, deps = []) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const els = [...root.querySelectorAll('.rv:not(.in)')];
    if (typeof IntersectionObserver === 'undefined') {
      els.forEach(e => e.classList.add('in'));
      return undefined;
    }
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.15 });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Link to a home-page section: a plain hash on the home page, a router link elsewhere. */
export function SectionLink({ id, home, children, ...props }) {
  return home ? <a href={`#${id}`} {...props}>{children}</a> : <Link to={`/#${id}`} {...props}>{children}</Link>;
}

/**
 * Public site chrome: progress bar, glass nav, section dots, mobile menu, footer, WhatsApp button,
 * mobile Log in / Join bar. `home` turns links into in-page anchors and enables the section tracking.
 */
export default function SiteLayout({ home = false, children }) {
  const [progress, setProgress] = useState(0);
  const [stuck, setStuck] = useState(false);
  const [active, setActive] = useState('top');
  const [menu, setMenu] = useState(false);
  const [waTip, setWaTip] = useState(true);
  const burgerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    let frame;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
        setStuck(window.scrollY > 40);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Highlight the nav link / dot of the section in the middle of the viewport.
  useEffect(() => {
    if (!home || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(entries => entries.forEach(e => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-45% 0px -50% 0px' });
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [home]);

  // Smooth scrolling + offset for the fixed nav while the site is mounted.
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('site-html');
    return () => html.classList.remove('site-html');
  }, []);

  useEffect(() => {
    if (!menu) return undefined;
    const burger = burgerRef.current;
    const onKey = (e) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    menuRef.current?.querySelector('a, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      burger?.focus();
    };
  }, [menu]);

  const closeMenu = () => setMenu(false);

  return (
    <div className="site">
      <a href="#main-content" className="site-skip">Skip to content</a>
      <div className="prog" style={{ width: `${progress}%` }} aria-hidden="true" />
      <header className={`nav ${stuck ? 'stuck' : ''}`}>
        <div className="nav-in">
          <SectionLink id="top" home={home} className="lg" aria-label="AT-ICT home"><img className="lgi" src={logoFull} alt="Ahmad Tamer — AT-ICT" /></SectionLink>
          <nav className="links" aria-label="Main">
            {NAV_LINKS.map(l => (
              <SectionLink key={l.id} id={l.id} home={home} className={home && active === l.id ? 'on' : ''} aria-current={home && active === l.id ? 'location' : undefined}>{l.label}</SectionLink>
            ))}
          </nav>
          <div className="nav-cta">
            <Link className="btn btn-o" to="/signin">Log in</Link>
            <Link className="btn btn-p" to="/register">Join now</Link>
            <button ref={burgerRef} type="button" className="burger" aria-label="Open menu" aria-expanded={menu} aria-controls="mnav" onClick={() => setMenu(true)}><SI name="menu" /></button>
          </div>
        </div>
      </header>

      {home && (
        <nav className="dots" aria-label="Sections">
          {SECTIONS.map(s => <a key={s.id} href={`#${s.id}`} className={active === s.id ? 'on' : ''} aria-label={s.label} aria-current={active === s.id ? 'location' : undefined}><span>{s.label}</span></a>)}
        </nav>
      )}

      <div ref={menuRef} id="mnav" className={`mnav ${menu ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu" hidden={!menu}>
        <button type="button" className="mclose" aria-label="Close menu" onClick={closeMenu}><SI name="x" /></button>
        {NAV_LINKS.map(l => <SectionLink key={l.id} id={l.id} home={home} className="l" onClick={closeMenu}>{l.label}</SectionLink>)}
        <Link className="btn btn-p" to="/register" onClick={closeMenu}>Join now</Link>
        <Link className="btn btn-o" to="/signin" onClick={closeMenu}>Log in</Link>
      </div>

      <main id="main-content" tabIndex={-1}>{children}</main>

      <footer className="deep">
        <div className="wrap">
          <div className="fg">
            <div>
              <span className="lg" style={{ marginBottom: 16 }}><img className="lgi" src={logoFullLight} alt="AT-ICT" /></span>
              <p>IGCSE ICT mastery built for ambitious students. Interactive notes, live sessions and personalised guidance — all in one platform.</p>
              <div className="soc">
                <a href={whatsappLink()} target="_blank" rel="noreferrer" aria-label="WhatsApp"><SI name="msg" /></a>
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram"><SI name="ig" /></a>
                <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" aria-label="YouTube"><SI name="yt" /></a>
              </div>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>
                {NAV_LINKS.filter(l => l.id !== 'contact').map(l => <li key={l.id}><SectionLink id={l.id} home={home}>{l.label}</SectionLink></li>)}
              </ul>
            </div>
            <div>
              <h4>Account</h4>
              <ul>
                <li><Link to="/signin">Sign in</Link></li>
                <li><Link to="/register">Register</Link></li>
                <li><Link to="/privacy">Privacy</Link></li>
                <li><Link to="/terms">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4>Get in touch</h4>
              <ul>
                <li><a href="mailto:at.ictofficial@gmail.com">at.ictofficial@gmail.com</a></li>
                <li><a href="tel:+201274584000">(+20) 127 458 4000</a></li>
                <li>Cairo, Egypt</li>
              </ul>
            </div>
          </div>
          <div className="fb"><span>© {new Date().getFullYear()} AT-ICT. All rights reserved.</span><span>Built with care for IGCSE ICT students.</span></div>
        </div>
      </footer>

      <div className="wa">
        {waTip && <div className="wa-t">Have a question? Chat on WhatsApp.<button type="button" aria-label="Dismiss" onClick={() => setWaTip(false)}>×</button></div>}
        <a className="wa-b" href={whatsappLink("Hi AT-ICT! I'd like to know more about the course.")} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp"><SI name="msg" /></a>
      </div>
      <div className="mbar">
        <Link className="btn btn-o" to="/signin">Log in</Link>
        <Link className="btn btn-p" to="/register">Join now</Link>
      </div>
    </div>
  );
}
