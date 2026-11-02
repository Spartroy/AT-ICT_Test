import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';
import '../../styles/generated/student.css';
import '../../styles/student-extra.css';
import { Ic } from '../../components/portal/kit';
import { PortalUIProvider } from '../../components/portal/PortalUI';
import { LearnPreviewProvider } from '../../lib/learnPreview';
import LearnView from '../student/LearnView';
import { useTeacher } from './TeacherPortal';

/**
 * Library › Preview as student: the student Learn pages exactly as students see them, but read-only.
 * They read every active item (no access rules) and record nothing: no progress, points, practised ticks or study counts.
 * The student styles are scoped to .atp-student, and the nested portal UI keeps dialogs, books and toasts inside that scope.
 */
export default function StudentPreview() {
  const { base } = useTeacher();
  return (
    <LearnPreviewProvider value>
      <div className="pv-bar" role="note">
        <span className="pv-bar-l"><Ic as={Eye} /><b>Previewing as a student.</b> <span>Nothing you do here is saved.</span></span>
        <Link className="btn o sm" to={`${base}/library`}><Ic as={ArrowLeft} />Back to Library</Link>
      </div>
      <div className="atp-student">
        <PortalUIProvider>
          <LearnView base={base} learnPath="/preview" />
        </PortalUIProvider>
      </div>
    </LearnPreviewProvider>
  );
}
