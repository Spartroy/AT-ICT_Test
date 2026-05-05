import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageCircle, Instagram, Youtube } from 'lucide-react';
import Logo from '../assets/logo.png';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/fees', label: 'Fees' },
  { to: '/samples', label: 'Free Samples' },
  { to: '/hall-of-fame', label: 'Hall of Fame' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' }
];

const accountLinks = [
  { to: '/signin', label: 'Sign In' },
  { to: '/register', label: 'Register' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' }
];

const centers = [
  'Apex Academy',
  'EzScience',
  'IG Cubs',
  'IG Stars',
  'Bright Minds',
  'Future Stars Center',
  'IG Guide Academy',
  'Royal College International School'
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0F0F0F] text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="inline-block mb-3">
              <img
                src={Logo}
                alt="AT-ICT logo"
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm leading-relaxed mb-4">
              IGCSE ICT mastery built for ambitious students. Interactive notes, live sessions,
              and personalised guidance — all in one platform.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/201274584000"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#1f1f1f] hover:bg-[#25D366] flex items-center justify-center transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle size={16} />
              </a>
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#1f1f1f] hover:bg-[#CA133E] flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#1f1f1f] hover:bg-[#CA133E] flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={16} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Explore</h3>
            <ul className="space-y-2 text-sm">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-[#CA133E] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Account</h3>
            <ul className="space-y-2 text-sm">
              {accountLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-[#CA133E] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Get in touch</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Mail size={16} className="text-[#CA133E] mt-0.5 flex-shrink-0" />
                <a href="mailto:at.ictofficial@gmail.com" className="hover:text-[#CA133E] transition-colors break-all">
                  at.ictofficial@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone size={16} className="text-[#CA133E] mt-0.5 flex-shrink-0" />
                <a href="tel:+201274584000" className="hover:text-[#CA133E] transition-colors">
                  (+20) 127 458 4000
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="text-[#CA133E] mt-0.5 flex-shrink-0" />
                <span>Cairo, Egypt</span>
              </li>
            </ul>

            <div className="mt-4">
              <h4 className="text-white text-sm font-semibold mb-2">Centers</h4>
              <ul className="text-xs text-gray-400 leading-relaxed list-disc pl-4 space-y-1">
                {centers.map((center, idx) => (
                  <li key={idx}>{center}</li>
                ))}
              </ul>
            </div>
       
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>© {year} AT-ICT. All rights reserved.</p>
          <p>
            Built with care for IGCSE ICT students.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
