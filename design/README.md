# Handoff: AT-ICT Redesign (Website · Student Portal · Teacher Portal)

## Overview
A full redesign of the AT-ICT IGCSE ICT tutoring product (Cambridge 0417), delivered as three hi-fi HTML prototypes that share one design system:

1. **Public website**: one scrolling page replacing the old 7-tab information site.
2. **Student portal**: 5 tabs (Home, Learn, Work, Schedule, Inbox) replacing 10.
3. **Teacher portal**: 6 groups (Home, Students, Work, Library, Schedule, Inbox) replacing 14 tabs.

## About the Design Files
The HTML/CSS/JS files in this bundle are **design references**, prototypes that show the intended look and behaviour. They are **not production code to copy**. The task is to **recreate them in the existing production codebase (at-ict.vercel.app) using its framework, routing, auth, data layer and component patterns**. If something has no counterpart in the codebase, pick the idiomatic approach for that stack. All data in the prototypes is hard-coded sample data; wire everything to the real API.

## Fidelity
**High-fidelity.** Final colours, type, spacing, motion and responsive behaviour. Recreate pixel-faithfully at 1440 / 1024 / 768 / 390 px.

## Files
```
AT-ICT Website v2.html          + website/site.css, website/site.js
AT-ICT Student Portal v2.html   + portal/portal.css, portal/portal.js, portal/maps.css, portal/maps.js
AT-ICT Teacher Portal v2.html   + teacher/teacher.css, core.js, home.js, work.js, library.js, inbox.js, modals.js
styles.css, tokens/*.css        design tokens (colour, type, spacing, fonts)
assets/                         logos + Jumper/Absans fonts
```
Open any `.html` directly in a browser to see it. The teacher portal reuses `portal/portal.css` as its base. Open the source `.js` files for the exact data shapes (see "Data" below).

## Design Tokens
**Colour**: crimson-500 `#CA133E` (primary), crimson-700 `#A01030` (hover), crimson-50 `#FDE8EC`, gold-500 `#DC9F0E`, gold-300 `#F1C44F`; ink ramp 50 `#F5F5F6`, 100 `#E7E7E9`, 200 `#C9C9CE`, 300 `#A3A3AB`, 400 `#6B6B73`, 500 `#44444B`, 700 `#2A2A2E`, 900 `#1A1A1A`, 950 `#0F0F0F`; warm dark gradient `#1A1A1A → #2A1A1A → #3A1A1A`; success `#16B981`, warning `#F59E0B`, danger `#EF4444`, info `#3B82F6`.
**Portal surfaces (dark)**: bg `#09090A`, s1 `#111113`, s2 `#161618`, s3 `#1D1D20`, border `#26262A`, border-2 `#34343A`, muted `#A3A3AB`, faint `#6B6B73`. Phase colours: Phase 1 `#60A5FA`, Phase 2 `#34D399`, Phase 3 `#A78BFA`. Program colours: Word `#3B82F6`, PowerPoint `#F97316`, Access `#EF4444`, Excel `#22C55E`, SharePoint `#818CF8`. Gold/"Other" `#DC9F0E`.
**Type**: Display **Jumper** (headlines, big titles; has no digit glyphs, so use Poppins for text containing numbers), Body **Poppins** 400/500/600/700, Numerals **Absans** (stat tiles, scores, ranks). Display tracking `-0.02em`, line-height 1.05–1.15. Eyebrow labels: 0.7rem, uppercase, 0.14em tracking, 700.
**Radius**: buttons 12px, cards 20–24px, big panels 28px, chips/pills 99px, inputs 12–14px. **Min touch target 44px.**
**Shadows**: primary button `0 10px 26px -8px rgba(202,19,62,.7)`; cards on dark use borders, not shadows; popovers `0 24px 60px rgba(0,0,0,.65)`.
**Logo**: the logo PNG is dark on white. Always place it on a white rounded tile (`.lg` class: white bg, radius 10px, overflow hidden, image cropped) on dark surfaces.

## Shared components (build once)
Button (primary / outline / green / small), Chip (theory blue, practical green, amber, red, grey), Card, Segmented tabs (`.seg`), Filter chips with counts, Accordion, Modal/Dialog (Esc closes, backdrop click closes, focus trapped), Toast, Progress ring (SVG, animated dashoffset), Stat tile, Search input, **Picker popover** (button + panel; mobile = bottom sheet), Sidebar + mobile bottom tab bar with badges, Floating quick-actions FAB, Empty state.

---
## 1. PUBLIC WEBSITE: `AT-ICT Website v2.html`
**Nav** (fixed, glass pill): logo, 6 anchor links (Method, Free samples, Fees, Results, FAQ, Contact), Log in, Join now. Active link underlined by section (IntersectionObserver). Scroll progress bar (3px crimson to gold) on top; side dots nav (desktop). Mobile: burger to full-screen menu; fixed bottom bar with Log in / Join now; WhatsApp floating button.
**Sections (in order, ids)**
1. `#top` Hero (dark): badge "92% average across students. Grade 9? Our standard.", H1 "Struggling with IGCSE? Let's fix that — fast." (clamp 2.6–5.2rem), lead, 2 CTAs, trust row, intro-video placeholder (4:5, crimson border, two floating cards), 4 animated stats (400+ students, 92%, 5+ years, 12+ countries) counting up on view.
2. `#method` **Pinned scroll section** (520vh container, sticky 100svh stage). Left: 4 steps (Interactive notes, Compact plan, Live & recorded sessions, Progress tracking); right: visual panel per step. Scroll progress drives step index and a local 0–1 progress `sp` (scaled so animation completes at ~80% of the step):
   - Notes: SVG mind map "Wireless" with 4 branches (Wi-Fi, Bluetooth, 4G/5G, Satellite) each with 2 leaf circles; nodes appear in order by threshold (`data-at`), lines draw via stroke-dashoffset, a cursor "clicks" the centre (ripple).
   - Plan: roadmap path draws with scroll, runner dot follows `getPointAtLength`, milestones Day 1, Week 2, Week 6, Week 10, glowing EXAM DAY star at 97%.
   - Sessions: video placeholder + Live / Recorded / Practical files pills.
   - Progress: 4 bars fill in sequence (90/75/55/30%), then "Weak points detected" box with 3 rows.
   - **Mobile (≤1000px)**: no pinning; panels render inline under each step and play once (3.5s) when 35% visible.
3. `#about` Tutor: photo placeholder, "From a struggler to an A* champion", checks, tags, quote.
4. `#samples` Free samples (dark): filter chips (All/Notes/Videos/Exercises) + 3-col card grid (**no buttons on cards**).
5. `#fees` Plans: Basic EGP 6,500/term, Standard EGP 16,000 (most popular, crimson border, raised), Premium EGP 20,000; three perk cards; "Not sure?" CTA bar.
6. `#results` Carousel of 7 reviews (scroll-snap, arrows, dots; 3/2/1 per view), then 3 big counters (clamp 3.2–4.8rem).
7. `#faq` Sticky side (title, search, category chips) + accordion (15 Q&As across Getting started, Course, Pricing, Support, Technical). First item open.
8. `#contact` Form (name, email, subject, phone, message) → opens `wa.me/201274584000?text=…`; info card (emails, phones, partner centres).
9. Final CTA band + footer.
**Auth modal**: tabs Sign in / Register. Register is 4 steps with a 4-segment progress bar: Personal info, Academic journey, Contact info, Skills assessment. Esc / backdrop closes.
**Motion**: reveal-on-scroll (translateY 36px → 0, 0.8s cubic-bezier(.23,1,.32,1)); respect `prefers-reduced-motion`.

---
## 2. STUDENT PORTAL: `AT-ICT Student Portal v2.html`
**Shell**: 248px sticky sidebar (logo tile, 5 nav items with badges, points card) → mobile bottom tab bar (5 items). Sticky top bar: title, bell, logout, user pill.
**Home**: hero banner with greeting + 140px progress ring (93%); 4 stat tiles with rings (Assignments, Quizzes, Attendance, Avg score); "Up next" list; leaderboard (top 3 medal colours); latest announcement; compact 7-column week strip (**no horizontal scroll**: chips show TH/PR + short time).
**Learn** (sub-tabs: Materials, Videos, Notes, Flashcards)
- **Videos** → chips Theory / Practical / Other, each a list of accordions:
  - Theory: 3 phase accordions (phase colour). Practical: 5 program accordions colour-coded with program icon (Word doc, PowerPoint slides, Access database, Excel grid, SharePoint share). Other: one accordion "Valuable revisions" in gold with star icon.
  - Inside each: **Duolingo-style serpentine map**: nodes in rows (4 per row desktop, 3 ≤700px); odd rows run right to left; dashed connector between nodes and a vertical dashed connector at each row end. Node states: done (phase colour + gold check badge), current (crimson, pulsing, "START" tag bobbing), open (dark with coloured outline). Row height 176px. Tap node opens modal with Watch / Mark as done; progress persists per group and advances the "current" node. Default open accordion = first group with unfinished lessons.
- **Materials** → **bookshelf** in brand style (dark card, crimson→gold shelf plank, spines in crimson/gold with vertical title). Filter chips Theory/Practical/Other + search. Tap a spine: the book flies from its slot to centre (FLIP, 0.75s), cover opens in 3D (rotateY −180°, 1.1s, book shifts right 50% on desktop), left page = icon + category, right page = title, meta, **View** and **Close book**; closing reverses the animation. Esc / backdrop closes.
- **Notes** → **orbit mind map**: phase tabs (with read counts); selected phase is a hub (progress ring = chapters read), chapters orbit as circles (number + 2-line title; read = filled phase colour + gold tick; selected = white ring + glow). Switching phase re-animates: nodes fly out from the hub (0.65s spring, 70ms stagger), lines draw. Detail card: chapter number, title, **Open notes**, **Mark as read/unread**. Persist read state per student.
- **Flashcards** → stats row, stack list, flip-card modal (3D, prev/next).
**Work**: Assignments / Quizzes; expandable rows (instructions, submission, score, status chips); quiz rows with Start quiz and countdown.
**Schedule**: week grid, today card, upcoming sessions.
**Inbox**: Announcements (search, category chips, modal with like + comments) and Chat (class group + DMs).

---
## 3. TEACHER PORTAL: `AT-ICT Teacher Portal v2.html`
**Shell**: same as student: sidebar / bottom bar with 6 groups; badges: Students = pending registrations, Work = submissions needing grading, Inbox = unread chats. Top bell opens Registrations.
**Global quick-actions FAB** (bottom-right, on every page): tap to fan 7 actions in a gently curved column (spring 0.45s, 30ms stagger, labels left of circles, dim backdrop); Esc / backdrop retracts. Actions: Create H.W, Create quiz, Send announcement, Add video, Add interactive note, Approve registrations, Create schedule. (Reset Season intentionally removed from quick actions. Re-home it, e.g. in Settings, with a confirm.)
**Home**: 4 "attention" cards (Need grading, Pending registrations, Late submissions, Unread messages) that deep-link; 4 stat tiles; "Needs your action" list with inline Approve / Reject / View / Grade; Recent activity grouped into collapsed accordions with counts + Mark all read; leaderboard.
**Students**: sub-tabs *All students* / *Registrations*. Filters have self-describing placeholders ("All sessions", "All years", "All statuses") + search (name / ID / email). Rows: avatar, name, ID · year · session, school, enrolled, **View** + ⋯ menu (Create/View parent, Chat with parent, Reset password, Remove w/ confirm). Registration cards (View details modal, Approve, Reject w/ confirm).
**Student modal** (wide): header + tabs Summary / Assignments / Quizzes / Payments. Assignments tab lists each assignment with status and **Open submission**, which jumps to Work → Submissions with that submission selected (this is the original student-first route; keep it). Payments: plan list, Mark paid, Delete, Add plan form, Reset password.
**Work**
- **Submissions inbox** (the main homework fix): filter chips (Needs grading / Late / Graded / All with counts); **Lesson picker** (popover: Section All/Theory/Practical → Phase → Chapter, or Program; each step has an "All" option; choosing a leaf closes; button shows breadcrumb); **Student picker** (popover with search + list incl. submission count). List rows have checkboxes + "Download selected/all (zip)". Selecting a row opens the pane: header (name, assignment, section/type chips, submitted date, Late chip), file preview area, file list with download, grade box (score input / max, quick buttons 100/75/50%, feedback, **Skip** and **Save & next** which jumps to the next ungraded). Layout: ≥1500px list + (preview | side column); 1181–1499px list + stacked pane; ≤1180px list OR pane (Back button).
- **Assignments**: table of homework; click = open Submissions filtered to it. **Quizzes**: table.
- **Create H.W modal**: Section (Theory / Practical). Theory → Phase → Chapter. Practical → Program → **Guides row and Tasks row of numbers** (1..n per program: Word 2, PowerPoint 2, Access 4, Excel 4, SharePoint 4). Title optional (auto-filled from selection, e.g. "CH 6 P1 Networks", "Excel Task 2"). Max score presets 10/20/30/40/50/100 + custom. Due date, assign to (all / selected), instructions.
**Library** (sub-tabs Videos, Interactive notes, Materials, Flashcards, Website content). Left **phase → chapter tree** with counts (mirrors the student's structure; chapter level shows only under the selected phase; collapses into "Browse" details on mobile), search with match highlighting, "x of y" count, compact rows with edit/delete on hover. Notes without a Prezi link show a "No link yet" chip. Website content: Hall of Fame + Student stories (inline add forms).
**Schedule**: Schedules list + Weekly view; builder modal with 7 day accordions, sessions (start/end time pickers, type, topic); Assign students modal (search, select all, live count).
**Inbox**: Announcements (stats + list + create modal: title, content, category, priority, audience, publish/expiry, pin), Chat (threads, send), Sessions (stats, online/offline filter, search, end session with confirm).

---
## Interactions & Behaviour (cross-cutting)
- Modals: Esc and backdrop close; destructive actions use a small confirm dialog.
- Toasts for every mutation (2.2s).
- Pickers: only one open at a time; click outside closes; on ≤700px they become bottom sheets.
- All lists filter client-side in the prototype; use server-side filtering and pagination for students, submissions and library at real data sizes.
- Animations use `cubic-bezier(.23,1,.32,1)` (ease-out) and spring `cubic-bezier(.34,1.56,.64,1)`; disable under `prefers-reduced-motion`.

## State Management
Per view: active sub-tab, filters (query, chips, pickers), selected item, and modal state. Persist: teacher last view; student map progress per group, notes read-set, flashcard studies. Move all `localStorage` keys (`at-map-*`, `at-notes-read`, `at-portal-v`, `at-teacher-v`) to the backend.

## Data (shapes are in the JS files; summary)
Student {id, name, email, year, session, school, enrolled, status, parent?}; Submission {id, student, assignment, type(task|classified), section(theory|practical), submittedAt, late, files[{name,size,url}], status(needs|graded), score, max, feedback, lesson(chapter|program)}; Assignment {title, type, section, lesson, due, max}; Video/Note/Material {title, path[], order, url}; Schedule {name, sessions[{day,start,end,type,topic}], students[]}; Announcement; Chat thread/message; Session {student, lastLogin, online}; PaymentPlan {title, kind, amount, due, status}; Registration. **Backend additions probably needed**: submission→lesson mapping (chapter or program), file URLs/zip endpoint, per-student map progress and notes-read tables, "valuable revisions" video category.

## Mock-only in the prototypes (needs real implementation)
File preview rendering, zip download, chat, session revoke, parent account creation, password reset email, payments, quiz taking, intro/lesson videos, "Open notes" (Prezi) links, WhatsApp form (works but verify the number), "Sacred/valuable revisions" lesson titles (placeholder: The Grand Revision, Exam Technique, Paper 2 Shortcuts, Final Night Checklist), "Practical Files" material title, the sample Malak/Malek submissions.

## Assets
Logos in `assets/` (dark on white, always on a white tile on dark UIs). Fonts: Jumper (Regular/Bold/Italics) and Absans in `assets/fonts` + Poppins from Google Fonts. Icons are inline stroke SVGs (24px grid, 2px stroke, round caps); replace with the codebase's icon library (Lucide equivalents).
