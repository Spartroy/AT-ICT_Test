import { useMemo } from 'react';
import useApi from './useApi';
import { API_ENDPOINTS } from '../config/api';
import { groupLabel } from '../lib/groups';
import { useTeacherChange } from '../Pages/teacher/modals/form';

/**
 * The teacher's teaching groups: [{ code, name, meetingUrl, count }], plus every student with their group.
 * Reloads by itself when the Groups board changes something.
 */
export default function useGroups(enabled = true) {
  const api = useApi(enabled ? API_ENDPOINTS.TEACHER_GROUPS : null, b => b.data || {});
  useTeacherChange('group', api.reload);
  const groups = useMemo(() => api.data?.groups || [], [api.data]);
  return {
    ...api,
    groups,
    students: api.data?.students || [],
    live: api.data?.live || { mode: 'manual', url: '' },
    autoAssign: api.data?.autoAssign !== false,
    label: (code) => groupLabel(code, groups)
  };
}
