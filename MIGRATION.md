# Migration notes: v2 redesign

## Registration flow (branch `redesign/registration`)

### Database
- **No manual migration.** A new `appsettings` collection holds one document (`key: 'global'`). It is created
  automatically with defaults the first time it is read:
  - exam sessions: `JUN 27` (June 2027, open), `NOV 27` (November 2027, open),
    `NOV 25` and `JUN 26` (closed; kept so existing students stay valid)
  - Royal College classes: `9H`, `9J`
- Existing students are not modified.
- Schema enums for `session` / `royalClass` were removed from `User`, `Student` and `Registration`.
  Allowed values are now checked in the route validators against the settings.

### API
- `GET /api/settings/registration` (public): open sessions and Royal classes for the form.
- `GET /api/teacher/settings`, `PUT /api/teacher/settings` (teacher): edit sessions and classes.
  Values still held by students can be closed or relabelled but not removed (409).
- `POST /api/registration/submit`:
  - `schoolType: 'royal'` needs `royalClass` only. Year, session, nationality, city and country are stored as `null`.
  - `schoolType: 'center'` needs year, session (must be open), school, nationality, city and country.
  - `royalNationality` is no longer required.
  - A duplicate email returns `errors: [{ path: 'email', msg }]`.
- `POST /api/auth/login`: a 403 response now carries `code: 'REGISTRATION_PENDING' | 'REGISTRATION_REJECTED'`.

### Frontend
- `/signin` and `/register` render the home page with the new auth modal open. The old
  `Pages/auth/SignIn.jsx` and `Pages/auth/Registration.jsx` were removed in step E.
- Teacher **Settings** (sessions, Royal classes, account, reset season) is at `/teacher-dashboard/settings`.
- New design tokens are in `client/src/styles/tokens.css` and mapped into `tailwind.config.js`.
- New dev dependencies: `@testing-library/react`, `@testing-library/user-event`,
  `@testing-library/jest-dom`, `@testing-library/dom@9` (pinned so user-event shares React's act()).

### Env vars
- None added.

### Assumptions / open items
- Royal College students get year and session `null` until the full class list and defaults are confirmed.
- The terms checkbox is client-only; no consent timestamp is stored.
- `ScheduleManager` / the schedule controller still hard-code `9H` / `9J` groups (not mounted; step D).
- Client password rule is 8+ characters; the server still accepts 6+.
- **Security:** `POST /api/auth/register` is public and creates auto-approved teacher accounts.
  Tracked as a separate task; not changed here.

## Portals, website and cleanup (steps C–E)

### Database
- **No manual migration.** New collection `learningprogresses` (videos watched, notes read per student).
- New optional fields: `Assignment.lesson`, `Note.chapter`. `Note.linkUrl` is now optional.

### API
- `GET /api/student/progress`, `PUT /api/student/progress/:kind/:itemId` (map progress / read-state).
- `GET /api/teacher/submissions` (inbox with filters), `GET /api/teacher/submissions/zip` (zip download).
- The teacher students list now returns `schoolType` and `royalClass`.
- New backend dependency: `archiver`.

### Frontend
- One-page site at `/` (`Pages/site/*`). `/about`, `/fees`, `/samples`, `/faq`, `/contact`, `/curriculum`
  redirect to `/#section`. `/hall-of-fame`, `/privacy`, `/terms` remain pages.
- Portals use nested routes: `/student-dashboard/*`, `/teacher-dashboard/*`, `/parent-dashboard/*`.
- Change password dialog in every portal; teachers can classify legacy students as Royal College.
- Removed ~70 old UI files, old fonts/logos, and the deps `@heroicons/react`, `socket.io-client`,
  `html5-qrcode`, `react-qr-code`, `framer-motion`, `react-toastify`.

### Mock-only / dropped
- Parent payments: InstaPay link + proof upload only (card checkout dropped). Parent chat not built.
- QR attendance (no `/api/schedule/qr` endpoint) and "Add new student" (no endpoint) not shown.
- Catch-up Generator, Curriculum page and Reports placeholder dropped. Submission preview is download-only.

### Known issues
- `User` email regex limits TLDs to 2–3 letters (e.g. `.academy` fails registration).
- Instagram / YouTube links in the site are placeholders; Jumper font licence to confirm.
- Library lists load up to 1000 items client-side. Schedule groups still use `9H` / `9J` enums.
- A few literal colours remain in generated CSS (decorative only).
- **Security:** public teacher self-registration; parent "mark paid" endpoint charges nothing;
  `backend/.env` holds committed secrets (rotate them).

## Reader, Hall of Fame and polish (follow-up)

### Database
- **No manual migration.** `AppSettings.hofSeeded` (new flag) marks that the preset Hall of Fame names were inserted.
  The first public `GET /api/leaderboard/hall-of-fame` inserts the 5 preset names (Class of 2025) **only when the
  collection is empty**. A deployment that already has entries is left untouched. After that the teacher owns the list.
- `HallOfFameEntry.createdBy` is no longer required (preset names have no author).
- `year` is optional when the teacher adds a name (defaults to the current year). The public list is sorted newest class first.

### Frontend
- New deps: `pdfjs-dist@3.11.174` (PDF rendering, worker bundled as an asset) and `react-pageflip`.
- `components/portal/viewer/ResourceViewer`: full-page reader with a Back button (Esc closes only the reader).
  PDF materials open as a page-turning book; external materials and interactive notes open in a wide iframe.
  Sites that forbid embedding show an "Open in new tab" fallback. Non-PDF files still download.
- Videos open the (larger) player straight from the map; "Mark done" pops up on hover/focus and is also in the player.
  Opening a video no longer marks it done automatically.
- Interactive notes: clicking a chapter opens its notes in the reader; phase tabs replay the pop-out animation.
- Public site: light navigation bar with the original logo (transparent PNGs, no white tile), larger hero/results
  numbers, new Hall of Fame section (`#hall`) and page. **Fees are hidden** with `SHOW_FEES = false` in
  `Pages/site/siteContent.js` (also hides the nav link, the "See plans" button and the Pricing FAQ).
- Roadmap labels in the Method section no longer overlap.

### Known issues / notes
- Only the 5 prototype names are preset; add the rest from the teacher portal (Library, site content).
- The reader only renders PDFs that the API streams (`/api/student/materials/:id/download`).

## Teacher-editable website (Settings > Website)

- **No manual migration.** `AppSettings.site` is a new optional field; anything missing falls back to the defaults in
  `backend/validators/siteSettings.js` (mirrored in `client/src/Pages/site/siteContent.js`).
- API: `GET /api/settings/site` (public), `PUT /api/teacher/settings/site` (teacher, partial updates allowed).
- The teacher can change: the home-page and results numbers, WhatsApp number, emails and phones, which sections show
  (Fees, Results & stories, Hall of Fame), and an announcement banner (text, optional https or relative link; dismissible).
- `SHOW_FEES` was replaced by the "Fees section" switch (off by default; also controls the Pricing FAQ).
- The public site shows the defaults until the API answers, and keeps them if it can't be reached (also what react-snap pre-renders).

## Chapter flashcards (from the revision study guide)

- `backend/data/chapterFlashcards.json`: 13 stacks (601 cards), one per chapter (Networks parts 1 and 2 are one stack), built from
  `client/public/study-guide.html` by `node backend/scripts/buildChapterFlashcards.js`. Re-run it when the guide changes.
- `POST /api/flashcards/import-chapters` (teacher): creates the stacks that don't exist yet as public teacher stacks; safe to run again.
  In the portal: **Library > Flashcards > Import chapter flashcards**. Nothing is written to the database until the teacher clicks it.
- The student Flashcards page no longer shows the four stat tiles, and lists teacher stacks first in chapter order.

## Practical source-file boxes

- `Material.isSourceFile` (Boolean, default false): no migration needed, existing materials stay books. Only practical materials can be source files;
  the server clears the flag for any other type.
- Teacher: in the add/edit material dialog, choosing **Practical** shows "This is a source file". Ticked materials show as a cardboard box of files
  (lid lifts on hover) in a "Source files" shelf under the practical books. Clicking downloads the uploaded file or opens the link.

### Update: chapter flashcards
- "Common mistake" and "Exam tip" boxes are no longer turned into cards (521 cards in 13 stacks).
- **Import chapter flashcards** now also refreshes existing chapter stacks with the current cards (study counts are kept). Edits made by hand
  to those stacks are replaced; stacks with other titles are never touched.
- The student Flashcards page shows chapter number + name only, grouped by phase (1: chapters 1-4, 2: 5-7, 3: 8-13), with other stacks last.

