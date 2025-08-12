import React, { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../../config/api';

const AttendanceHomework = ({ selectedChild, stats }) => {
  const [assignments, setAssignments] = useState([]);
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_ENDPOINTS.PARENT.BASE}/child/${selectedChild?.student?._id}/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAssignments(data.data.assignments || []);
        }
      } catch {}
    };
    if (selectedChild?.student?._id) load();
  }, [selectedChild?.student?._id]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-semibold mb-2">Attendance Summary</h3>
        <p className="text-gray-300 text-sm">Present: {stats?.attendance?.present || 0} • Absent: {stats?.attendance?.absent || 0} • Late: {stats?.attendance?.late || 0}</p>
        <div className="mt-4">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="h-2 rounded-full bg-green-500" style={{ width: `${stats?.attendance?.percentage || 0}%` }} />
          </div>
          <div className="text-gray-300 text-sm mt-1">{stats?.attendance?.percentage || 0}% Attendance</div>
        </div>
      </div>

      <div className="bg-gray-900/60 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-semibold mb-4">Homework Tracking</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-300">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Due</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Submitted</th>
                <th className="py-2 pr-4">Late</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Feedback</th>
              </tr>
            </thead>
            <tbody className="text-gray-200">
              {assignments.map(a => (
                <tr key={a._id} className="border-t border-gray-800">
                  <td className="py-2 pr-4">{a.title}</td>
                  <td className="py-2 pr-4">{new Date(a.dueDate).toLocaleDateString()}</td>
                  <td className="py-2 pr-4">{a.status}</td>
                  <td className="py-2 pr-4">{a.submissionDate ? new Date(a.submissionDate).toLocaleDateString() : '-'}</td>
                  <td className="py-2 pr-4">{a.isLate ? 'Yes' : 'No'}</td>
                  <td className="py-2 pr-4">{a.score ?? '-'}/{a.maxScore}</td>
                  <td className="py-2 pr-4">{a.feedback || '-'}</td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <td className="py-3 text-gray-400" colSpan={7}>No assignments yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHomework;

