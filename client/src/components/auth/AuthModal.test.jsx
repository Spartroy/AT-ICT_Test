import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AuthModal from './AuthModal';

// The registration tests type through all four steps, which can take more than Jest's 5s default on a busy machine.
jest.setTimeout(30000);

const OPTIONS = {
  status: 'success',
  data: {
    examSessions: [{ code: 'JUN 27', label: 'June 2027' }, { code: 'NOV 27', label: 'November 2027' }],
    royalClasses: ['9H', '9J']
  }
};

const reply = (status, body) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });

function mockApi({ submit = () => reply(201, { status: 'success' }), login } = {}) {
  global.fetch = jest.fn((url, options = {}) => {
    if (url.endsWith('/api/settings/registration')) return reply(200, OPTIONS);
    if (url.endsWith('/api/registration/submit')) return submit(JSON.parse(options.body));
    if (url.endsWith('/api/auth/login') && login) return login(JSON.parse(options.body));
    return reply(404, {});
  });
}

const submitCalls = () => global.fetch.mock.calls.filter(([url]) => url.endsWith('/api/registration/submit'));

function renderModal(props = {}) {
  const onClose = jest.fn();
  const user = userEvent.setup();
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthModal open tab="up" onClose={onClose} {...props} />
    </MemoryRouter>
  );
  return { user, onClose };
}

const next = (user) => user.click(screen.getByRole('button', { name: /^next/i }));
const stepHeading = (text) => screen.findByRole('heading', { level: 4, name: text });

async function fillPersonal(user) {
  await user.type(screen.getByLabelText('First name *'), 'Joud');
  await user.type(screen.getByLabelText('Last name *'), 'El Daher');
  await user.type(screen.getByLabelText('Email address *'), 'joud@example.com');
  await user.type(screen.getByLabelText('Password *'), 'Secret123!');
  await user.type(screen.getByLabelText('Confirm password *'), 'Secret123!');
  await next(user);
}

async function fillPhones(user) {
  await user.type(screen.getByLabelText('Your contact number *'), '01012345678');
  await user.type(screen.getByLabelText('Parent / guardian contact *'), '01112345678');
}

afterEach(() => {
  delete global.fetch;
});

describe('registration: Royal College path', () => {
  it('walks all 4 steps, posts a class without session or location, and shows the pending popup', async () => {
    mockApi();
    const { user, onClose } = renderModal();

    await fillPersonal(user);
    await stepHeading('Which school are you from?');
    await user.click(screen.getByRole('radio', { name: /The Royal College School/ }));
    await user.click(await screen.findByRole('radio', { name: 'Class 9J' }));
    expect(screen.queryByText('Which session? *')).not.toBeInTheDocument();
    await next(user);

    await stepHeading('Contact number, so we can talk!');
    expect(screen.queryByLabelText('City *')).not.toBeInTheDocument();
    await fillPhones(user);
    await next(user);

    await stepHeading('Skills assessment');
    const review = screen.getByLabelText('Review');
    expect(within(review).getByText('The Royal College School · Class 9J')).toBeInTheDocument();
    expect(within(review).getByText('01012345678')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /I agree to the Terms/ }));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByRole('heading', { name: 'Congratulations, Joud!' })).toBeInTheDocument();
    expect(submitCalls()).toHaveLength(1);
    const body = JSON.parse(submitCalls()[0][1].body);
    expect(body).toEqual({
      firstName: 'Joud', lastName: 'El Daher', email: 'joud@example.com', password: 'Secret123!',
      schoolType: 'royal', school: 'The Royal College School', royalClass: '9J',
      contactNumber: '01012345678', parentNumber: '01112345678', techKnowledge: 5, englishLevel: 5
    });

    const popup = await screen.findByRole('alertdialog', {}, { timeout: 3000 });
    expect(within(popup).getByText(/joud@example.com/)).toBeInTheDocument();
    const gotIt = within(popup).getByRole('button', { name: 'Got it' });
    await waitFor(() => expect(gotIt).toHaveFocus());
    await user.click(gotIt);
    expect(onClose).toHaveBeenCalled();
  });
});

describe('registration: Center / other school path', () => {
  it('walks all 4 steps with the keyboard and posts year, session, school and location', async () => {
    mockApi();
    const { user } = renderModal();

    await fillPersonal(user);
    await stepHeading('Which school are you from?');
    await user.click(screen.getByRole('radio', { name: /Center \/ Other school/ }));
    await user.click(await screen.findByRole('radio', { name: 'Year 11' }));
    await user.click(screen.getByRole('radio', { name: 'November 2027' }));
    await user.type(screen.getByLabelText('Which school do you attend? *'), 'IG Stars');
    await user.selectOptions(screen.getByLabelText("What's your nationality? *"), 'Egyptian');
    await user.click(screen.getByRole('checkbox', { name: /I'm a retaker/ }));
    // Enter submits the step, like the prototype.
    await user.type(screen.getByLabelText('Which school do you attend? *'), '{Enter}');

    await stepHeading('Contact number, so we can talk!');
    await fillPhones(user);
    await user.type(screen.getByLabelText('City *'), 'Cairo');
    await user.type(screen.getByLabelText('Country *'), 'Egypt{Enter}');

    await stepHeading('Skills assessment');
    expect(within(screen.getByLabelText('Review')).getByText('IG Stars · Year 11 · November 2027')).toBeInTheDocument();
    const terms = screen.getByRole('checkbox', { name: /I agree to the Terms/ });
    terms.focus();
    await user.keyboard(' ');
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('heading', { name: 'Congratulations, Joud!' })).toBeInTheDocument();
    const body = JSON.parse(submitCalls()[0][1].body);
    expect(body).toMatchObject({
      schoolType: 'center', year: '11', session: 'NOV 27', school: 'IG Stars', nationality: 'Egyptian',
      isRetaker: true, otherSubjects: null, city: 'Cairo', country: 'Egypt'
    });
    expect(body).not.toHaveProperty('royalClass');
  });
});

describe('registration: validation and server errors', () => {
  it('blocks Next with inline errors and focuses the first invalid field', async () => {
    mockApi();
    const { user } = renderModal();
    await next(user);
    expect(screen.getByText('Enter your first name')).toBeInTheDocument();
    expect(screen.getByLabelText('First name *')).toHaveFocus();
    expect(screen.getByLabelText('First name *')).toHaveAccessibleDescription('Enter your first name');
    await user.type(screen.getByLabelText('First name *'), 'J');
    expect(screen.queryByText('Enter your first name')).not.toBeInTheDocument();
  });

  it('shows a duplicate email from the server inline on step 1', async () => {
    mockApi({ submit: () => reply(400, { status: 'error', message: 'An account with this email already exists', errors: [{ path: 'email', msg: 'An account with this email already exists' }] }) });
    const { user } = renderModal();
    await fillPersonal(user);
    await user.click(await screen.findByRole('radio', { name: /The Royal College School/ }));
    await user.click(await screen.findByRole('radio', { name: 'Class 9H' }));
    await next(user);
    await fillPhones(user);
    await next(user);
    await user.click(screen.getByRole('checkbox', { name: /I agree to the Terms/ }));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await stepHeading('I need a name… a full name!');
    expect(screen.getByText('An account with this email already exists')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Email address *')).toHaveFocus());
  });

  it('skips the confetti canvas for reduced-motion users', async () => {
    mockApi();
    const { user } = renderModal();
    await fillPersonal(user);
    await user.click(await screen.findByRole('radio', { name: /The Royal College School/ }));
    await user.click(await screen.findByRole('radio', { name: 'Class 9H' }));
    await next(user);
    await fillPhones(user);
    await next(user);
    await user.click(screen.getByRole('checkbox', { name: /I agree to the Terms/ }));
    const createElement = jest.spyOn(document, 'createElement');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await screen.findByRole('heading', { name: 'Congratulations, Joud!' });
    expect(createElement).not.toHaveBeenCalledWith('canvas');
    createElement.mockRestore();
  });
});

describe('sign in', () => {
  it('explains a pending account inline instead of signing in', async () => {
    mockApi({
      login: () => reply(403, {
        status: 'error',
        code: 'REGISTRATION_PENDING',
        message: "Your account is awaiting admin confirmation. You'll be able to sign in once it's approved."
      })
    });
    const { user } = renderModal({ tab: 'in' });
    await user.type(screen.getByLabelText('Email address'), 'joud@example.com');
    await user.type(screen.getByLabelText('Password'), 'Secret123!{Enter}');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Awaiting admin confirmation');
    expect(alert).toHaveTextContent(/awaiting admin confirmation/i);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('switches tabs with the arrow keys', async () => {
    mockApi();
    const { user } = renderModal({ tab: 'in' });
    screen.getByRole('tab', { name: 'Sign in' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Register' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Student registration' })).toBeInTheDocument();
  });
});
