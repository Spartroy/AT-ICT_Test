import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { BellRing, CalendarDays, Globe, Key, Zap } from 'lucide-react';
import useTeacherSettings from '../../hooks/useTeacherSettings';
import { ErrorNote, Loading, PageHead, Seg } from '../../components/portal/kit';
import WebsiteSettings from './WebsiteSettings';
import RegistrationSettings from './RegistrationSettings';
import NotificationSettings from './NotificationSettings';
import QuickActionsSettings from './QuickActionsSettings';
import AccountSettings from './AccountSettings';

export { labelFromCode } from './RegistrationSettings';

const TABS = [
  { id: 'registration', label: 'Registration', icon: CalendarDays, blurb: 'What students pick when they register: exam sessions and Royal College classes.' },
  { id: 'notifications', label: 'Notifications', icon: BellRing, blurb: 'What is sent to students and to you, and when.' },
  { id: 'quick-actions', label: 'Quick actions', icon: Zap, blurb: 'The buttons in the + menu on every page.' },
  { id: 'website', label: 'Website', icon: Globe, blurb: 'What visitors see on the public site. No developer needed.' },
  { id: 'account', label: 'Account', icon: Key, blurb: 'Your password and the leaderboard season.' }
];

/** Teacher settings, one topic per tab. Every tab stays mounted (just hidden) so edits survive switching tabs. */
export default function Settings() {
  const { settings, loading, error, reload, save } = useTeacherSettings();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab = TABS.some(t => t.id === requested) ? requested : TABS[0].id;

  if (loading && !settings) return <Loading label="Loading settings…" />;
  if (error && !settings) return <ErrorNote error={{ message: error }} onRetry={reload} />;

  const panel = (id, children) => <div role="tabpanel" id={`set-panel-${id}`} hidden={tab !== id}>{children}</div>;

  return (
    <>
      <PageHead title="Settings"><p className="sub">{TABS.find(t => t.id === tab).blurb}</p></PageHead>
      <Seg tabs={TABS.map(({ id, label, icon }) => ({ id, label, icon }))} value={tab} onChange={id => setParams({ tab: id }, { replace: true })} label="Settings sections" />

      {panel('registration', <RegistrationSettings settings={settings} save={save} reload={reload} />)}
      {panel('notifications', <NotificationSettings settings={settings} save={save} reload={reload} />)}
      {panel('quick-actions', <QuickActionsSettings settings={settings} save={save} />)}
      {panel('website', <WebsiteSettings />)}
      {panel('account', <AccountSettings settings={settings} />)}
    </>
  );
}
