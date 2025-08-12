import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';

const QuizTracking = ({ stats, selectedChild }) => {
  const [quizzes, setQuizzes] = useState([]);
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_ENDPOINTS.PARENT.BASE}/child/${selectedChild?.student?._id}/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setQuizzes(data.data.quizzes || []);
        }
      } catch {}
    };
    if (selectedChild?.student?._id) load();
  }, [selectedChild?.student?._id]);

  const total = stats?.quizzes?.totalQuizzes || 0;
  const completed = stats?.quizzes?.completedQuizzes || 0;
  const avg = Math.round(stats?.quizzes?.avgScore || 0);

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-semibold mb-4">Quiz Tracking</h3>
        <div className="text-gray-300">Completed: {completed} / {total}</div>
        <div className="text-gray-300 mt-2">Average Score: {avg}%</div>
      </div>

      <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700">
        <h4 className="text-lg font-semibold mb-3">All Quizzes</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-300">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Submitted</th>
                <th className="py-2 pr-4">Late</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Feedback</th>
              </tr>
            </thead>
            <tbody className="text-gray-200">
              {quizzes.map(q => (
                <tr key={q._id} className="border-t border-gray-800">
                  <td className="py-2 pr-4">{q.title}</td>
                  <td className="py-2 pr-4">{new Date(q.startDate).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">{q.status}</td>
                  <td className="py-2 pr-4">{q.submissionDate ? new Date(q.submissionDate).toLocaleDateString() : '-'}</td>
                  <td className="py-2 pr-4">{q.isLate ? 'Yes' : 'No'}</td>
                  <td className="py-2 pr-4">{q.score ?? '-'}/{q.maxScore}</td>
                  <td className="py-2 pr-4">{q.feedback || '-'}</td>
                </tr>
              ))}
              {quizzes.length === 0 && (
                <tr>
                  <td className="py-3 text-gray-400" colSpan={7}>No quizzes yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuizTracking;

