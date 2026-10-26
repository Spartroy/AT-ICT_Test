/**
 * The first-run tour of the student portal. `target` is a CSS selector, `path` the route under the portal base
 * ('' is Home). Steps marked optional are skipped when their element isn't on screen (hidden on phones, no data yet).
 * data-tour hooks live on the nav links (PortalShell) so the sidebar and the phone tab bar share them.
 */
export const studentTourSteps = (firstName) => [
  {
    id: 'welcome',
    path: '',
    title: `Welcome to AT-ICT, ${firstName || 'there'}!`,
    body: "Let's take a one-minute walk through your student portal, so you know where everything lives. You can replay this tour any time from the ? button at the top.",
    cta: "Let's go"
  },
  {
    id: 'home',
    path: '',
    target: '.hero',
    title: 'Your home base',
    body: "This is the first thing you see each time: your progress through the term plan, plus quick buttons for pending work and picking up your lessons where you left off."
  },
  {
    id: 'stats',
    path: '',
    target: '.g4',
    title: 'Your progress at a glance',
    body: 'Assignments, quizzes, announcements and your average score. Red numbers mean something is waiting for you; green ticks mean you are all caught up.'
  },
  {
    id: 'nav-learn',
    path: '',
    target: '[data-tour="nav-learn"]',
    side: 'right',
    title: 'Learn',
    body: 'All your study material: books, video lessons, interactive notes, flashcards, past papers and labs. We will look inside in a moment.'
  },
  {
    id: 'nav-work',
    path: '',
    target: '[data-tour="nav-work"]',
    side: 'right',
    title: 'Work',
    body: 'Homework and quizzes from your teacher. The number on the tab is how many things still need you. Hand in files here and see your score and feedback.'
  },
  {
    id: 'nav-schedule',
    path: '',
    target: '[data-tour="nav-schedule"]',
    side: 'right',
    title: 'Schedule',
    body: 'Your weekly timetable of theory and practical sessions, so you always know what is next. Live classes show up here with a Join button when they start.'
  },
  {
    id: 'nav-inbox',
    path: '',
    target: '[data-tour="nav-inbox"]',
    side: 'right',
    title: 'Inbox',
    body: 'Announcements from your teacher and your chat messages live here. A badge appears when there is something new.'
  },
  {
    id: 'points',
    path: '',
    target: '.pts',
    side: 'right',
    optional: true,
    title: 'Your points',
    body: 'You earn points for finishing work on time. The bar shows how close you are to the top of the leaderboard.'
  },
  {
    id: 'bell',
    path: '',
    target: '[data-tour="bell"]',
    title: 'Notifications',
    body: 'New announcements, grades and live classes appear here. Turn on notifications for this device so you never miss a deadline.'
  },
  {
    id: 'profile',
    path: '',
    target: '.top .me',
    title: 'Your profile',
    body: 'Your name and group. Tap it to change your password. The arrow button next to it logs you out.'
  },
  {
    id: 'learn-tabs',
    path: 'learn/materials',
    target: '[aria-label="Learning sections"]',
    title: 'Six ways to study',
    body: 'Materials are books, Videos are step-by-step lessons, Notes are interactive chapters, Flashcards help you memorise, Past papers are exam practice, and Labs are hands-on.'
  },
  {
    id: 'learn-materials',
    path: 'learn/materials',
    target: '[aria-label="Material category"]',
    optional: true,
    title: 'Theory, Practical, Revision',
    body: 'Switch shelves here. The number shows how many items are on each one. Tap any book to open and read it.'
  },
  {
    id: 'learn-videos',
    path: 'learn/videos',
    target: '[aria-label="Video section"]',
    optional: true,
    title: 'Video lesson maps',
    body: 'Lessons are laid out as a path. Tap a circle to watch, then press "Mark done" to track your progress and unlock the next step.'
  },
  {
    id: 'learn-notes',
    path: 'learn/notes',
    target: '[aria-label="Phases"]',
    optional: true,
    title: 'Notes by phase',
    body: 'Your course is split into three phases. Pick a phase, tap a chapter bubble to read its notes, and mark it as read to fill the progress ring.'
  },
  {
    id: 'learn-papers',
    path: 'learn/pastpapers',
    target: '[aria-label="Past paper"]',
    optional: true,
    title: 'Past papers',
    body: 'Choose a paper, then find the year and session. Every variant has its question paper and mark scheme, and source files where they exist.'
  },
  {
    id: 'work-tabs',
    path: 'work/assignments',
    target: '[aria-label="Work sections"]',
    title: 'Assignments and quizzes',
    body: 'Assignments are handed in as files before the deadline. Quizzes are timed: press "Start quiz" only when you are ready, the clock starts straight away.'
  },
  {
    id: 'work-card',
    path: 'work/assignments',
    target: '.row .hd',
    optional: true,
    title: 'Open an assignment',
    body: 'Tap a card to see the details, upload your files and submit. After your teacher grades it, your score and feedback appear in the same place.'
  },
  {
    id: 'done',
    path: '',
    title: "You're all set!",
    body: 'Start with the Work tab to see what is due, then dive into Learn. If you ever forget something, the ? button at the top replays this tour.',
    cta: 'Start learning'
  }
];
