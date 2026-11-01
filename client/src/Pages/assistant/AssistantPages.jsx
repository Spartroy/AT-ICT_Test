import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Key, ShieldCheck } from 'lucide-react';
import { Empty, Ic, PageHead } from '../../components/portal/kit';
import ChangePasswordDialog from '../../components/portal/ChangePasswordDialog';
import { useTeacher } from '../teacher/TeacherPortal';
import { AREAS, hasNoAccess, levelLabel } from './access';

const chipFor = (level) => (level === 'edit' ? 'c-pr' : level === 'view' ? 'c-am' : 'c-gy');

/** Assistant home: what this assistant can open, with the level the teacher granted. */
export function AssistantHome() {
  const { base, me, assistant } = useTeacher();
  const permissions = assistant?.permissions || {};
  return (
    <>
      <PageHead title={`Welcome, ${me.firstName || 'assistant'}`}>
        <p className="sub">You help the teacher with the areas below. Anything not listed is not available to you.</p>
      </PageHead>
      {hasNoAccess(permissions) ? (
        <Empty icon={ShieldCheck}>The teacher has not given you access to anything yet. Ask them to open Settings → Assistants.</Empty>
      ) : (
        <div className="tbl">
          {AREAS.filter(a => permissions[a.id] && permissions[a.id] !== 'none').map(a => (
            <div className="trow" key={a.id}>
              <div className="lmain"><b><Link to={`${base}/${a.path}`}>{a.label}</Link></b><small>{a.blurb}</small></div>
              <span className={`chip ${chipFor(permissions[a.id])}`}>{levelLabel(permissions[a.id])}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/** Assistant account: name, password and a read-only list of the access they have. */
export function AssistantAccount() {
  const { me, assistant } = useTeacher();
  const [pwOpen, setPwOpen] = useState(false);
  const permissions = assistant?.permissions || {};
  return (
    <>
      <PageHead title="My account"><p className="sub">{me.name} · Assistant</p></PageHead>
      <section className="card set-card" aria-labelledby="as-pw">
        <h3 id="as-pw"><Ic as={Key} />Password</h3>
        <p className="sub set-note">Change the password you use to sign in.</p>
        <button type="button" className="btn o sm" onClick={() => setPwOpen(true)}><Ic as={Key} />Change password</button>
        <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
      </section>
      <section className="card set-card" aria-labelledby="as-access">
        <h3 id="as-access"><Ic as={ShieldCheck} />Your access</h3>
        <p className="sub set-note">Set by the teacher. Contact details, payments and settings are never available to assistants.</p>
        <div className="tbl">
          {AREAS.map(a => (
            <div className="trow" key={a.id}>
              <div className="lmain"><b>{a.label}</b><small>{a.blurb}</small></div>
              <span className={`chip ${chipFor(permissions[a.id])}`}>{levelLabel(permissions[a.id] || 'none')}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
