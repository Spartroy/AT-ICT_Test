const { FEATURES, GROUPS, DEFAULT_PERMISSIONS, normalizePermissions, can, requirementFor, apiPath, stripHidden } = require('../config/assistantAccess');

describe('normalizePermissions', () => {
  it('fills every area, drops unknown areas and invalid levels', () => {
    const p = normalizePermissions({ homework: 'edit', videos: 'admin', payments: 'edit' });
    expect(Object.keys(p).sort()).toEqual([...FEATURES].sort());
    expect(p.homework).toBe('edit');
    expect(p.videos).toBe('none');
    expect(p.payments).toBeUndefined();
  });

  it('falls back to the defaults for missing input', () => {
    expect(normalizePermissions(undefined)).toEqual(DEFAULT_PERMISSIONS);
    expect(normalizePermissions('edit')).toEqual(DEFAULT_PERMISSIONS);
  });

  it('keeps the current level for an area the update does not mention', () => {
    expect(normalizePermissions({ homework: 'view' }, { groups: 'edit', homework: 'none' }).groups).toBe('edit');
  });
});

describe('can', () => {
  it('compares levels: none < view < edit', () => {
    expect(can({ homework: 'edit' }, 'homework', 'view')).toBe(true);
    expect(can({ homework: 'view' }, 'homework', 'edit')).toBe(false);
    expect(can({ homework: 'none' }, 'homework', 'view')).toBe(false);
    expect(can({}, 'homework', 'view')).toBe(false);
    expect(can(undefined, 'homework')).toBe(false);
  });

  it('treats a section id as any feature in it', () => {
    expect(can({ quizzes: 'view' }, 'work', 'view')).toBe(true);
    expect(can({ quizzes: 'view' }, 'work', 'edit')).toBe(false);
    expect(can({ quizzes: 'view' }, 'library', 'view')).toBe(false);
  });
});

describe('apiPath', () => {
  it('drops the /api prefix, the query string and trailing slashes', () => {
    expect(apiPath('/api/teacher/students/?page=2')).toBe('/teacher/students');
    expect(apiPath('/api')).toBe('/');
  });
});

describe('requirementFor', () => {
  const need = (m, u) => requirementFor(m, u);

  it('maps reads to view and writes to edit in the right area', () => {
    expect(need('GET', '/api/teacher/submissions?status=needs')).toEqual({ area: 'submissions', level: 'view' });
    expect(need('PUT', '/api/teacher/assignments/a1/students/s1')).toEqual({ area: 'submissions', level: 'edit' });
    expect(need('PUT', '/api/teacher/quizzes/q1/students/s1')).toEqual({ area: 'submissions', level: 'edit' });
    expect(need('POST', '/api/assignments')).toEqual({ area: 'homework', level: 'edit' });
    expect(need('GET', '/api/quizzes')).toEqual({ area: 'quizzes', level: 'view' });
    expect(need('GET', '/api/teacher/videos')).toEqual({ area: 'videos', level: 'view' });
    expect(need('POST', '/api/teacher/notes')).toEqual({ area: 'notes', level: 'edit' });
    expect(need('PUT', '/api/teacher/materials/m1')).toEqual({ area: 'materials', level: 'edit' });
    expect(need('GET', '/api/flashcards')).toEqual({ area: 'flashcards', level: 'view' });
    expect(need('PUT', '/api/guide/draft')).toEqual({ area: 'guide', level: 'edit' });
    expect(need('GET', '/api/teacher/schedule/weekly-overview')).toEqual({ area: 'classSchedule', level: 'view' });
    expect(need('POST', '/api/teacher/live/s1/attendance')).toEqual({ area: 'live', level: 'edit' });
    expect(need('GET', '/api/chat/conversations')).toEqual({ area: 'chat', level: 'view' });
    expect(need('POST', '/api/chat/send')).toEqual({ area: 'chat', level: 'edit' });
    expect(need('POST', '/api/announcements')).toEqual({ area: 'announcements', level: 'edit' });
    expect(need('GET', '/api/teacher/students')).toEqual({ area: 'studentList', level: 'view' });
    expect(need('PUT', '/api/teacher/groups/assign')).toEqual({ area: 'groups', level: 'edit' });
    expect(need('GET', '/api/teacher/settings')).toEqual({ area: 'studentList', level: 'view' });
  });

  it('never lets a feature id collide with a section id (a section id means "any feature in it")', () => {
    const sections = GROUPS.map(g => g.id);
    expect(FEATURES.filter(f => sections.includes(f))).toEqual([]);
  });

  it('does not let live-class access open the schedule endpoints', () => {
    expect(can({ live: 'edit' }, requirementFor('GET', '/api/teacher/schedule/schedules').area)).toBe(false);
    expect(can({ classSchedule: 'edit' }, requirementFor('POST', '/api/teacher/live/s1/attendance').area)).toBe(false);
  });

  it('treats the assistant account endpoints as self', () => {
    expect(need('GET', '/api/auth/me').area).toBe('self');
    expect(need('GET', '/api/assistant/me').area).toBe('self');
    expect(need('POST', '/api/auth/logout').area).toBe('self');
  });

  it.each([
    ['GET', '/api/teacher/income/summary'],
    ['GET', '/api/teacher/income/export'],
    ['POST', '/api/teacher/payments/p1/review'],
    ['GET', '/api/teacher/students/s1/payments'],
    ['POST', '/api/teacher/students/s1/reset-password'],
    ['POST', '/api/teacher/students/s1/create-parent'],
    ['PUT', '/api/teacher/students/s1'],
    ['DELETE', '/api/teacher/students/s1'],
    ['PUT', '/api/teacher/settings'],
    ['PUT', '/api/teacher/settings/site'],
    ['GET', '/api/teacher/settings/site'],
    ['GET', '/api/teacher/assistants'],
    ['POST', '/api/teacher/assistants'],
    ['GET', '/api/registration/pending'],
    ['PUT', '/api/registration/r1/approve'],
    ['POST', '/api/teacher/reset-session-points'],
    ['POST', '/api/teacher/legacy-students'],
    ['GET', '/api/teacher/sessions/students'],
    ['GET', '/api/parent/dashboard'],
    ['GET', '/api/student/dashboard'],
    ['POST', '/api/auth/profile']
  ])('never allows %s %s', (method, url) => {
    expect(need(method, url)).toBeNull();
  });

  it('refuses anything it does not know (default deny)', () => {
    expect(need('GET', '/api/something/new')).toBeNull();
    expect(need('GET', '/')).toBeNull();
  });
});

describe('stripHidden', () => {
  it('removes contact details, payments and credentials at every depth', () => {
    const out = stripHidden({
      status: 'success',
      data: {
        students: [{
          _id: '1', firstName: 'Mona', email: 'm@x.com', contactNumber: '0100', address: { city: 'Cairo' },
          studentInfo: { year: 11, parentContactNumber: '0111', group: 'A' },
          payments: [{ amount: 5 }], Password: 'x'
        }]
      }
    });
    const s = out.data.students[0];
    expect(s).toEqual({ _id: '1', firstName: 'Mona', studentInfo: { year: 11, group: 'A' } });
    expect(out.status).toBe('success');
  });

  it('works through toJSON of documents and leaves primitives alone', () => {
    expect(stripHidden({ toJSON: () => ({ a: 1, email: 'x' }) })).toEqual({ a: 1 });
    expect(stripHidden('ok')).toBe('ok');
    expect(stripHidden(null)).toBeNull();
  });
});

describe('parent numbers', () => {
  const need = (m, u) => requirementFor(m, u);
  it('is a separate, off-by-default permission in the Students section', () => {
    expect(GROUPS.find(g => g.id === 'students').features).toContain('parentNumbers');
    expect(DEFAULT_PERMISSIONS.parentNumbers).toBe('none');
  });

  it('keeps parent accounts and linking closed to assistants', () => {
    expect(need('GET', '/api/teacher/parents')).toBeNull();
    expect(need('POST', '/api/teacher/students/s1/link-parent')).toBeNull();
    expect(need('POST', '/api/teacher/message-templates')).toBeNull();
  });

  it('lets assistants read message templates under parentNumbers', () => {
    expect(need('GET', '/api/teacher/message-templates')).toEqual({ area: 'parentNumbers', level: 'view' });
  });

  it('stripHidden keeps only the parent number keys it is told to allow', () => {
    const row = { name: 'A', email: 'e', contactNumber: '1', parentNumber: '2', parentContactNumber: '3' };
    expect(stripHidden(row)).toEqual({ name: 'A' });
    expect(stripHidden(row, ['parentnumber', 'parentcontactnumber'])).toEqual({ name: 'A', parentNumber: '2', parentContactNumber: '3' });
  });
});
