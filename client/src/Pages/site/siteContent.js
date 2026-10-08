// Public website copy (design/AT-ICT Website v2.html + website/site.js). Marketing content, not API data.

// What the teacher can change from the portal (Settings > Website). The API returns the saved values;
// these defaults are used until it answers (and for pre-rendering) and mirror backend/validators/siteSettings.js.
export const DEFAULT_SITE = {
  heroStats: [
    { n: 400, suffix: '+', label: 'Students taught' },
    { n: 92, suffix: '%', label: 'Average A* – A' },
    { n: 5, suffix: '+', label: 'Years teaching' },
    { n: 12, suffix: '+', label: 'Countries reached' }
  ],
  resultCounters: [
    { n: 92, suffix: '%', label: 'average A* – A' },
    { n: 400, suffix: '+', label: 'students taught' },
    { n: 12, suffix: '+', label: 'countries' }
  ],
  whatsappNumber: '201274584000',
  emails: ['at.ictofficial@gmail.com', 'ahmad.tamer.ali11@gmail.com'],
  phones: ['(+20) 127 458 4000', '(+20) 107 089 5012'],
  sections: { fees: false, hallOfFame: true, results: true },
  banner: { enabled: false, text: '', link: '' }
};

export const makeWhatsappLink = (number) => (text) => `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

// `gate` ties a section to a teacher switch in site.sections.
const ALL_SECTIONS = [
  { id: 'top', label: 'Home' },
  { id: 'method', label: 'Method' },
  { id: 'about', label: 'Your tutor' },
  { id: 'samples', label: 'Free samples' },
  { id: 'fees', label: 'Fees', gate: 'fees' },
  { id: 'results', label: 'Results', gate: 'results' },
  { id: 'hall', label: 'Hall of Fame', gate: 'hallOfFame' },
  { id: 'faq', label: 'FAQ' },
  { id: 'contact', label: 'Contact' }
];
export const visibleSections = (site) => ALL_SECTIONS.filter(s => !s.gate || site.sections[s.gate]);
export const navLinksOf = (sections) => sections.filter(s => !['top', 'about'].includes(s.id));

export const METHOD_STEPS = [
  { icon: 'book', title: 'Interactive notes', text: 'Comprehensive, interactive learning materials designed to enhance understanding — and kill memorisation.' },
  { icon: 'cal', title: 'A compact plan', text: 'A structured path that plots every step from Day one till the exam day.' },
  { icon: 'vid', title: 'Live & recorded sessions', text: 'Stuck? A huge library of past videos solves practicals and explains theory — plus practical activities that make it fun.' },
  { icon: 'chart', title: 'Progress tracking', text: 'Regular assessments, quizzes and reports — with 24/7 support when exam stress hits.' }
];

export const SAMPLES = [
  { cat: 'notes', icon: 'file', title: 'Networks', type: 'Interactive Notes', text: 'Learn the basics of networks with our interactive notes.', points: ['Interactive diagrams', 'Quick revision notes'] },
  { cat: 'videos', icon: 'vid', title: 'CH(1) — Computer Structure', type: 'Video Explanation', text: 'Explanation of the building blocks of ICT — Input, Processing, Output.', points: ['HD video quality', 'Practice files included'] },
  { cat: 'notes', icon: 'file', title: 'Storage Devices', type: 'Interactive Notes', text: 'Learn the basics of storage devices with our interactive notes.', points: ['Interactive diagrams', 'Quick revision notes'] },
  { cat: 'exercises', icon: 'cc', title: 'Paper 2 — Exam Revision', type: 'Final Revision', text: 'A comprehensive final revision covering all Paper 2 topics for IGCSE ICT.', points: ['Real exam format', 'Detailed solutions'] },
  { cat: 'videos', icon: 'vid', title: 'CH(5) — Database', type: 'Video Explanation', text: 'Watch theoretical concepts, then dive into practical implementation.', points: ['HD video quality', 'Practice files included'] }
];
export const SAMPLE_FILTERS = [
  { id: 'all', label: 'All', icon: 'book' },
  { id: 'notes', label: 'Notes', icon: 'file' },
  { id: 'videos', label: 'Videos', icon: 'play' },
  { id: 'exercises', label: 'Exercises', icon: 'cc' }
];

export const PLANS = [
  { name: 'Basic', price: 'EGP 6,500', per: 'per term', text: 'Perfect for getting started with ICT fundamentals.', features: ['Interactive study notes', 'Whole ICT curriculum coverage', 'Progress tracking on the student portal', 'Recorded video sessions'], cta: 'Reserve Basic' },
  { name: 'Standard', price: 'EGP 16,000', popular: true, text: 'Most popular choice for comprehensive learning.', features: ['Everything in Basic', 'Personalised feedback', 'Live sessions with the teacher', 'Weekly office hours', 'Practice assignments & quizzes', 'Mock exam papers', '24/7 WhatsApp support'], cta: 'Reserve Standard' },
  { name: 'Premium', price: 'EGP 20,000', text: 'Complete package with personalised attention.', features: ['Everything in Standard', '1-on-1 support with the teacher', 'Priority support', 'Access to the student community'], cta: 'Reserve Premium' }
];
export const PERKS = [
  { icon: 'book', title: 'Flexible payment plans', text: 'Split payments over 2 or 3 instalments.' },
  { icon: 'users', title: 'Group discount', text: 'Bring a friend — 15% off for you both.' },
  { icon: 'clock', title: 'Early bird', text: '10% off when you register 1+ month ahead.' }
];

const FAQ_ALL = [
  ['Getting started', [
    ['How do I know if AT-ICT is right for me?', "AT-ICT is perfect for any IGCSE student who wants to excel. Whether you're struggling with basics or aiming for an A*, our personalised approach adapts to your level. Try our free samples to experience our teaching style risk-free!"],
    ["What if I'm a complete beginner in ICT?", 'No problem — we start from Day one. Every chapter is broken down step by step with interactive notes and recorded sessions you can replay.'],
    ['Can I join mid-course?', 'Yes. The Compact Plan maps every step from where you are to exam day, and recorded sessions let you catch up on earlier chapters.']
  ]],
  ['Course', [
    ['What exactly is included in the course?', 'Interactive study notes, the whole ICT curriculum, progress tracking on the student portal and recorded sessions. Standard and Premium add live sessions, office hours, mock papers and more.'],
    ['How is this different from school ICT lessons?', "Interactive sessions, no boring lectures and no memorising — hands-on activities and exam strategies from a top examiner's point of view."],
    ['Can I access materials after the course ends?', 'Ask us on WhatsApp for the current access policy for your package.']
  ]],
  ['Pricing', [
    ['Are there any hidden costs?', 'No. The price on the package is the price you pay.'],
    ['Do you offer payment plans or discounts?', 'Yes. Split payments over 2 or 3 instalments, 10% off when you register at least a month in advance, and 15% off for you and a friend.'],
    ["What if I'm not satisfied?", "Message us on WhatsApp and we'll sort it out together."]
  ]],
  ['Support', [
    ['How quickly do you respond to questions?', 'WhatsApp support is 24/7 on Standard and Premium. We reply as fast as we can.'],
    ["What if I don't achieve an A*?", "We stay with you through mock exams and revision until you're exam-ready. Our students average 92% (A* – A)."],
    ['Can parents track progress?', 'Yes — progress tracking on the portal includes regular assessments, quizzes and performance reports.']
  ]],
  ['Technical', [
    ['What technology do I need?', 'A laptop or tablet with internet, and a phone for WhatsApp. No coding required.'],
    ['How much time per week?', 'We recommend 3–4 hours per week for optimal results. However, our flexible format allows you to study at your own pace. Some students do intensive weekend sessions, others prefer daily 30 minute chunks.'],
    ['Is it suitable for different exam boards?', 'AT-ICT is built for Cambridge IGCSE ICT (0417).']
  ]]
];

// The Pricing questions only show while the Fees section does.
export const faqFor = (site) => FAQ_ALL.filter(([group]) => site.sections.fees || group !== 'Pricing');

export const CONTACT = {
  centers: 'Apex Academy · EzScience · IG Cubs · IG Stars · Bright Minds · Future Stars Center · IG Guide Academy · Royal College International School'
};
