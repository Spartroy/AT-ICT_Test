# Handoff: Student Registration Flow (4-step modal)

## Overview
A redesigned multi-step registration form with a confetti success state and an "awaiting admin confirmation" popup. Lives inside the auth modal of the public website (Register tab). Only this flow is covered here; the rest of the site is in the main handoff bundle.

## About the Design Files
`AT-ICT Website v2.html` + `website/register.js` + `website/site.css` are **design references** (HTML prototype). Recreate them in the production codebase's framework and component patterns; don't ship the HTML. To see it: open the HTML, click **Join now**, use the **Register** tab. `site.js` is included only for the modal open/close/tab plumbing (`open`, `close`, `tab`).

## Fidelity
High-fidelity. Match colours, type, spacing, motion.

## Product decision (important)
**The backend contract wins.** The design was adjusted so every field maps to a field the backend already requires; fields the backend doesn't store were removed (target grade, "how did you hear about us"). **No backend change should be needed except the two items marked ⚠ below.**

## Flow and fields

Modal: dark card (`#0b0b0c`, 1px crimson border, 28px radius, crimson glow). Tabs: Sign in / Register. Header "Student registration", a 4-circle stepper (Personal, Academic, Contact, Skills) with a connecting line (crimson when reached; completed circles show ✓), and a 3px progress bar (crimson to gold, width = step/4). Panels slide in (translateX 18px to 0, 0.35s). Previous / Next buttons; Enter advances; last step button reads "Create account". Each panel has a centred heading (Jumper, `#f2365f`, 1.45rem) and a one-line subtitle.

### Step 1: Personal ("I need a name… a full name!")
| UI field | Backend field | Rules |
|---|---|---|
| First name * | `firstName` | required |
| Last name * | `lastName` | required |
| Email address * | `email` | valid email |
| Password * | `password` | ≥ 8 chars; show/hide toggle; 4-segment strength meter (length, mixed case, digit, symbol or ≥12 chars) |
| Confirm password * | (client only) | must match |

### Step 2: Academic ("Which school are you from?")
Two selectable cards (radio): **The Royal College School** ("I am a student at The Royal College School") and **Center / Other school** ("I study at a center or another school"). Content below depends on the choice:
- **Royal College** → Class * (chips: Class 9H, Class 9J). **Nothing else.**
- **Center / Other** → Year * (Year 10/11/12), Session * (November 2025 = `NOV 25`, June 2026 = `JUN 26`), School name *, Nationality * (select), "I'm a retaker" checkbox, "Other subjects" textarea (optional).

### Step 3: Contact ("Contact number, so we can talk!")
- Your contact number * → `studentPhone` (8–15 digits, optional +, spaces/dashes OK)
- Parent / guardian contact * → `parentNumber` (same rule)
- **Center / Other only**: "Where are you located?" → City * `city`, Country * `country`
- Royal College students see **only the two phone fields**.

### Step 4: Skills ("Skills assessment")
Two slider cards (1–10, default 5), each with a question, range input (accent crimson), min/max pills and a 56px gradient value circle:
- "How comfortable are you with technology and computers?" (1 · Complete beginner … 10 · Tech expert) → `techKnowledge`
- "How comfortable are you with the English language?" (1 · Basic English … 10 · Fluent English) → `englishLevel`
Then a **Review** card (name, email, school/class line, location or phone) and the required Terms & Privacy checkbox (client only, or store consent timestamp if legally required).

### Field mapping summary (what the frontend should POST)
```
firstName, lastName, email, password,
schoolType: "royal" | "other",
school:     "The Royal College School" | <typed school name>,
class:      "Class 9H" | "Class 9J" | null        // royal only
year:       "10" | "11" | "12" | null             // other only
session:    "NOV 25" | "JUN 26" | null            // other only
nationality: string | null                        // other only
isRetaker:  boolean                               // other only, default false
otherSubjects: string | null                      // other only, optional
studentPhone, parentNumber,
city: string | null, country: string | null       // other only
techKnowledge: 1..10, englishLevel: 1..10
```

### ⚠ Backend gaps to resolve
1. **Royal College registrations omit `year`, `session`, `nationality`, `city`, `country`, `isRetaker`, `otherSubjects`.** Make these optional for `schoolType = "royal"`, or fill server-side defaults. Decide: derive `year` from class (9H/9J → confirm with the school), set `session` to the current intake, default `nationality` to null. Pending teacher-side screens already tolerate "N/A".
2. **`class` (9H, 9J) and `englishLevel`**: confirm both exist on the registration model/DB; add if missing. Confirm the complete list of Royal College classes (the prototype only has 9H and 9J).

## Validation and errors
Validate on Next per step; show an inline error under the field (`#ff7d98`, 0.76rem) and highlight the control (`#fb7185` border). Focus the first invalid field. Errors clear on input/change. On final submit, re-validate all steps and jump to the first step with an error. Also surface server errors (e.g. email already registered) inline on step 1.

## Success state
After a successful POST:
1. Hide tabs and form; show success panel.
2. Animated check: SVG circle (stroke-dashoffset 151 to 0, 0.7s) then tick path (0.5s, 0.65s delay).
3. **Confetti** (canvas, fixed full screen, z-index 200, pointer-events none): colours `#CA133E #DC9F0E #F1C44F #FFFFFF #ff5a7c #A01030`; 150-particle burst from the card centre (angles −160° to −20°, speed 6–17), then side bursts from bottom-left/right at 350ms (70 each) and a top rain at 900ms (80); gravity 0.28, drag 0.992, rect/circle pieces with rotation, alpha fades over ~260 frames; canvas hidden when done. **Skip entirely if `prefers-reduced-motion`.**
4. Heading "Congratulations, {firstName}!", subtitle with school/class summary, and a 3-step timeline: *Registration sent* (done), *Admin review* (pulsing gold dot, "Usually within 24 hours"), *Account activated* (dimmed).
5. After 1.5s a **popup** (alertdialog) fades over the card: gold-bordered card, hourglass icon, title **"Please wait for admin confirmation"**, body "Your account is pending approval. Please wait for the admin to confirm it. We'll contact you at {email} and on WhatsApp ({studentPhone}), usually within 24 hours.", primary **Got it** button (focused). Got it closes the modal and resets the form. The user must not be able to sign in until approved (the backend should respond with a "pending" status; the login screen should show a matching message).

## Design tokens
Crimson `#CA133E` (hover `#A01030`), gold `#DC9F0E` / `#F1C44F`, text `#fff`, muted `#a3a3ab` / `#8a8a93`, surfaces `#0b0b0c` (modal), `#151516` (inputs/chips), `#0d0d0e` (cards), borders `#26262a`/`#333`, error `#fb7185` / `#ff7d98`. Fonts: Jumper (step headings, success title), Poppins (everything else), Absans (slider value). Radii: inputs 12–14px, cards 16–20px, chips 12px, pills 99px. Touch targets ≥ 44px. Chips/cards use hidden radio inputs with visible `:focus-visible` rings.

## Accessibility
Real `<label>`s; radio groups as radio inputs; ranges have `aria-label`; modal traps focus and closes on Esc/backdrop; popup is `role="alertdialog" aria-modal="true"`; errors are text (not colour only).

## Files
```
AT-ICT Website v2.html   registration markup is #pup (form) and #regdone (success), inside #auth
website/register.js      steps, validation, review, success, confetti
website/site.css         styles under "/* registration */" and the later registration blocks
website/site.js          modal open/close/tab plumbing only
styles.css, tokens/      design tokens;  assets/ logos + fonts
```
