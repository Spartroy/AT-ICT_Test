// Registration form model: field names match the backend contract
// (POST /api/registration/submit). See design/registration/README.md.

export const ROYAL_SCHOOL = 'The Royal College School';

export const STEPS = [
  { short: 'Personal', name: 'Personal info', title: 'I need a name… a full name!', subtitle: "Let's start with who you are." },
  { short: 'Academic', name: 'Academic journey', title: 'Which school are you from?', subtitle: 'Tell us about your academic journey.' },
  { short: 'Contact', name: 'Contact info', title: 'Contact number, so we can talk!', subtitle: 'We need to know how to reach you and your parents.' },
  { short: 'Skills', name: 'Skills assessment', title: 'Skills assessment', subtitle: 'Help us understand your comfort level with technology and English.' }
];

export const SCHOOL_TYPES = [
  { value: 'royal', label: ROYAL_SCHOOL, description: 'I am a student at The Royal College School' },
  { value: 'center', label: 'Center / Other school', description: 'I study at a center or another school' }
];

export const YEARS = [
  { value: '10', label: 'Year 10' },
  { value: '11', label: 'Year 11' },
  { value: '12', label: 'Year 12' }
];

export const NATIONALITIES = ['Egyptian', 'Emirati', 'Saudi', 'Kuwaiti', 'Qatari', 'Jordanian', 'Lebanese', 'Palestinian', 'Syrian', 'Pakistani', 'Other'];

export const initialValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  schoolType: '',
  royalClass: '',
  year: '',
  session: '',
  school: '',
  nationality: '',
  isRetaker: false,
  otherSubjects: '',
  contactNumber: '',
  parentNumber: '',
  city: '',
  country: '',
  techKnowledge: 5,
  englishLevel: 5,
  terms: false
};

// Which step each field (client or server name) lives on, so errors can jump there.
export const FIELD_STEP = {
  firstName: 0, lastName: 0, email: 0, password: 0, confirmPassword: 0,
  schoolType: 1, royalClass: 1, year: 1, session: 1, school: 1, nationality: 1, isRetaker: 1, otherSubjects: 1,
  contactNumber: 2, parentNumber: 2, city: 2, country: 2,
  techKnowledge: 3, englishLevel: 3, terms: 3
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME = /^[a-zA-Z\s]+$/;
const PHONE = /^\+?[\d\s-]{8,15}$/;
const blank = v => !String(v ?? '').trim();

const isCenter = v => v.schoolType === 'center';

/** Returns { field: message } for the given step; empty object when valid. Order = focus order. */
export function validateStep(step, v) {
  const e = {};
  const check = (field, bad, message) => { if (bad) e[field] = message; };

  if (step === 0) {
    check('firstName', blank(v.firstName), 'Enter your first name');
    if (!e.firstName) check('firstName', !NAME.test(v.firstName.trim()), 'Use letters and spaces only');
    check('lastName', blank(v.lastName), 'Enter your last name');
    if (!e.lastName) check('lastName', !NAME.test(v.lastName.trim()), 'Use letters and spaces only');
    check('email', !EMAIL.test(v.email.trim()), 'Enter a valid email address');
    check('password', v.password.length < 8, 'Password must be at least 8 characters');
    check('confirmPassword', !v.confirmPassword || v.confirmPassword !== v.password, 'Passwords do not match');
  }
  if (step === 1) {
    check('schoolType', !v.schoolType, 'Choose your school type');
    if (v.schoolType === 'royal') check('royalClass', !v.royalClass, 'Select your class');
    if (isCenter(v)) {
      check('year', !v.year, 'Select your year');
      check('session', !v.session, 'Select your session');
      check('school', blank(v.school), 'Enter your school name');
      check('nationality', !v.nationality, 'Select your nationality');
    }
  }
  if (step === 2) {
    check('contactNumber', !PHONE.test(v.contactNumber.trim()), 'Enter a valid phone number');
    check('parentNumber', !PHONE.test(v.parentNumber.trim()), 'Enter a valid parent phone number');
    if (isCenter(v)) {
      check('city', blank(v.city), 'Enter your city');
      check('country', blank(v.country), 'Enter your country');
    }
  }
  if (step === 3) {
    check('terms', !v.terms, 'Please accept to continue');
  }
  return e;
}

/** Validates every step; returns { step, errors } for the first invalid step, or null. */
export function firstInvalidStep(v) {
  for (let step = 0; step < STEPS.length; step++) {
    const errors = validateStep(step, v);
    if (Object.keys(errors).length) return { step, errors };
  }
  return null;
}

/** Request body for POST /api/registration/submit. Royal students send no centre fields. */
export function buildPayload(v) {
  const common = {
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    email: v.email.trim(),
    password: v.password,
    schoolType: v.schoolType,
    contactNumber: v.contactNumber.trim(),
    parentNumber: v.parentNumber.trim(),
    techKnowledge: Number(v.techKnowledge),
    englishLevel: Number(v.englishLevel)
  };
  if (v.schoolType === 'royal') {
    return { ...common, school: ROYAL_SCHOOL, royalClass: v.royalClass };
  }
  return {
    ...common,
    year: v.year,
    session: v.session,
    school: v.school.trim(),
    nationality: v.nationality,
    isRetaker: Boolean(v.isRetaker),
    otherSubjects: v.otherSubjects.trim() || null,
    city: v.city.trim(),
    country: v.country.trim()
  };
}

/** Maps a server error response to { fields: {path: msg}, step, message }. */
export function mapServerErrors(body) {
  const fields = {};
  (body?.errors || []).forEach(err => {
    const path = err.path || err.param || err.field;
    const msg = err.msg || err.message;
    if (path && msg && FIELD_STEP[path] !== undefined && !fields[path]) fields[path] = msg;
  });
  const steps = Object.keys(fields).map(f => FIELD_STEP[f]);
  return {
    fields,
    step: steps.length ? Math.min(...steps) : null,
    message: steps.length ? null : (body?.message || 'Registration failed. Please try again.')
  };
}

/** 0-4 strength score: length ≥ 8, mixed case, digit, symbol or ≥ 12 chars. */
export function passwordStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++;
  return s;
}

export const STRENGTH_LABELS = ['Weak', 'Weak', 'Okay', 'Good', 'Strong'];

/** "The Royal College School · Class 9H" or "IG Stars · Year 11 · June 2027". */
export function schoolSummary(v, sessions = []) {
  if (v.schoolType === 'royal') return `${ROYAL_SCHOOL} · Class ${v.royalClass}`;
  const session = sessions.find(s => s.code === v.session)?.label || v.session;
  return [v.school.trim(), v.year && `Year ${v.year}`, session].filter(Boolean).join(' · ');
}
