const { AREAS, DEFAULT_PERMISSIONS, normalizePermissions, can, requirementFor, apiPath, stripHidden } = require('../config/assistantAccess');

describe('normalizePermissions', () => {
  it('fills every area, drops unknown areas and invalid levels', () => {
    const p = normalizePermissions({ work: 'edit', library: 'admin', payments: 'edit' });
    expect(Object.keys(p).sort()).toEqual([...AREAS].sort());
    expect(p.work).toBe('edit');
    expect(p.library).toBe('none');
    expect(p.payments).toBeUndefined();
  });

  it('falls back to the defaults for missing input', () => {
    expect(normalizePermissions(undefined)).toEqual(DEFAULT_PERMISSIONS);
    expect(normalizePermissions('edit')).toEqual(DEFAULT_PERMISSIONS);
  });

  it('keeps the current level for an area the update does not mention', () => {
    expect(normalizePermissions({ work: 'view' }, { students: 'edit', work: 'none' }).students).toBe('edit');
  });
});

describe('can', () => {
  it('compares levels: none < view < edit', () => {
    expect(can({ work: 'edit' }, 'work', 'view')).toBe(true);
    expect(can({ work: 'view' }, 'work', 'edit')).toBe(false);
    expect(can({ work: 'none' }, 'work', 'view')).toBe(false);
    expect(can({}, 'work', 'view')).toBe(false);
    expect(can(undefined, 'work')).toBe(false);
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
    expect(need('GET', '/api/teacher/submissions?status=needs')).toEqual({ area: 'work', level: 'view' });
    expect(need('PUT', '/api/teacher/assignments/a1/students/s1')).toEqual({ area: 'work', level: 'edit' });
    expect(need('GET', '/api/teacher/videos')).toEqual({ area: 'library', level: 'view' });
    expect(need('POST', '/api/teacher/notes')).toEqual({ area: 'library', level: 'edit' });
    expect(need('GET', '/api/teacher/schedule/weekly-overview')).toEqual({ area: 'schedule', level: 'view' });
    expect(need('POST', '/api/teacher/live/s1/attendance')).toEqual({ area: 'schedule', level: 'edit' });
    expect(need('GET', '/api/chat/conversations')).toEqual({ area: 'inbox', level: 'view' });
    expect(need('POST', '/api/chat/send')).toEqual({ area: 'inbox', level: 'edit' });
    expect(need('POST', '/api/announcements')).toEqual({ area: 'inbox', level: 'edit' });
    expect(need('GET', '/api/teacher/students')).toEqual({ area: 'students', level: 'view' });
    expect(need('PUT', '/api/teacher/groups/assign')).toEqual({ area: 'students', level: 'edit' });
    expect(need('GET', '/api/teacher/settings')).toEqual({ area: 'students', level: 'view' });
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
