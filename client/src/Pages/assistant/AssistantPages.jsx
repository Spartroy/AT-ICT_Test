import React, { useState } from 'react';
import { Key, ShieldCheck } from 'lucide-react';
import { Ic, PageHead } from '../../components/portal/kit';
import ChangePasswordDialog from '../../components/portal/ChangePasswordDialog';
import { useTeacher } from '../teacher/TeacherPortal';
import { GROUPS, levelLabel } from './access';

const chipFor = (level) => (level === 'edit' ? 'c-pr' : level === 'view' ? 'c-am' : 'c-gy');

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
          {GROUPS.map(g => (
            <React.Fragment key={g.id}>
              <small className="lbl" style={{ padding: '10px 8px 2px' }}>{g.label}</small>
              {g.features.map(f => (
                <div className="trow" key={f.id}>
                  <div className="lmain" style={{ flex: '1 1 0', minWidth: 90 }}><b>{f.label}</b><small style={{ whiteSpace: 'normal' }}>{f.blurb}</small></div>
                  <span className={`chip ${chipFor(permissions[f.id])}`}>{levelLabel(permissions[f.id] || 'none')}</span>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </section>
    </>
  );
}
