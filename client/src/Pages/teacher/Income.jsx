import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, LineChart, Receipt } from 'lucide-react';
import { PageHead, Seg } from '../../components/portal/kit';
import { useTeacher } from './TeacherPortal';
import Overview from './income/Overview';
import Proofs from './income/Proofs';
import Entries from './income/Entries';
import '../../styles/income.css';

/** Income: the money picture (Overview), transfer proofs to confirm, and manual income and expenses. */
export default function Income() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const { base, counts } = useTeacher();
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LineChart },
    { id: 'proofs', label: 'Payment proofs', icon: Receipt, count: counts.proofs || '' },
    { id: 'entries', label: 'Income & expenses', icon: BookOpen }
  ];
  if (!tabs.some(t => t.id === tab)) return <Navigate to={`${base}/income/overview`} replace />;
  return (
    <>
      <PageHead title="Income"><p className="sub">What comes in, what goes out and what is left.</p></PageHead>
      <Seg tabs={tabs} value={tab} onChange={id => navigate(`${base}/income/${id}`)} label="Income sections" />
      {tab === 'overview' && <Overview />}
      {tab === 'proofs' && <Proofs />}
      {tab === 'entries' && <Entries />}
    </>
  );
}
