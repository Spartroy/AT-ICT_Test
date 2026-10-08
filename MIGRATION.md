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
