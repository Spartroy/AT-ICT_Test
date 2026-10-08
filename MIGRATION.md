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
  `Pages/auth/SignIn.jsx` and `Pages/auth/Registration.jsx` are no longer routed; delete them in step E.
- The teacher dashboard has a temporary **Settings** tab (it moves behind the profile button in step D).
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
