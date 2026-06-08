// API Configuration
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    ME: `${API_BASE_URL}/api/auth/me`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`,
    UPDATE_PROFILE: `${API_BASE_URL}/api/auth/profile`,
  },
  STUDENT: {
    DASHBOARD: `${API_BASE_URL}/api/student/dashboard`,
    MATERIALS: `${API_BASE_URL}/api/student/materials`,
    ASSIGNMENTS: `${API_BASE_URL}/api/student/assignments`,
    QUIZZES: `${API_BASE_URL}/api/student/quizzes`,
    SCHEDULE: `${API_BASE_URL}/api/student/schedule`,
    VIDEOS: `${API_BASE_URL}/api/student/videos`,
    NOTES: `${API_BASE_URL}/api/student/notes`,
  },
  TEACHER: {
    DASHBOARD: `${API_BASE_URL}/api/teacher/dashboard`,
    STUDENTS: `${API_BASE_URL}/api/teacher/students`,
    MATERIALS: `${API_BASE_URL}/api/teacher/materials`,
    SCHEDULE: `${API_BASE_URL}/api/teacher/schedule`,
    SCHEDULES: `${API_BASE_URL}/api/teacher/schedules`,
    SCHEDULES_STUDENTS: `${API_BASE_URL}/api/teacher/schedules/students`,
    VIDEOS: `${API_BASE_URL}/api/teacher/videos`,
    NOTES: `${API_BASE_URL}/api/teacher/notes`,
    ACTIVITIES: `${API_BASE_URL}/api/teacher/activities`,
    ADD_LEGACY_STUDENT: `${API_BASE_URL}/api/teacher/legacy-students`,
    RESET_SESSION_POINTS: `${API_BASE_URL}/api/teacher/reset-session-points`,
    HALL_OF_FAME: `${API_BASE_URL}/api/teacher/hall-of-fame`,
    HALL_OF_FAME_BY_ID: (id) => `${API_BASE_URL}/api/teacher/hall-of-fame/${id}`,
    STORIES: `${API_BASE_URL}/api/teacher/stories`,
    STORY_BY_ID: (id) => `${API_BASE_URL}/api/teacher/stories/${id}`,
    STUDENT_PAYMENTS: (studentId) => `${API_BASE_URL}/api/teacher/students/${studentId}/payments`,
    PAYMENT: (paymentId) => `${API_BASE_URL}/api/teacher/payments/${paymentId}`,
    RESET_STUDENT_PASSWORD: (studentId) => `${API_BASE_URL}/api/teacher/students/${studentId}/reset-password`,
  },
  LEADERBOARD: {
    BASE: `${API_BASE_URL}/api/leaderboard`,
    HALL_OF_FAME: `${API_BASE_URL}/api/leaderboard/hall-of-fame`,
    STORIES: `${API_BASE_URL}/api/leaderboard/stories`,
  },
  SCHEDULE: {
    QR: `${API_BASE_URL}/api/schedule/qr`,
    ASSIGN_STUDENTS: `${API_BASE_URL}/api/teacher/schedule/assign-students`,
    ASSIGNED_STUDENTS: `${API_BASE_URL}/api/teacher/schedule/assigned-students`,
    REMOVE_STUDENT: `${API_BASE_URL}/api/teacher/schedule/students`,
    WEEKLY_OVERVIEW: `${API_BASE_URL}/api/teacher/schedule/weekly-overview`,
    SCHEDULES: `${API_BASE_URL}/api/teacher/schedule/schedules`,
    SCHEDULES_STUDENTS: `${API_BASE_URL}/api/teacher/schedule/schedules/students`,
  },
  PARENT: {
    DASHBOARD: `${API_BASE_URL}/api/parent/dashboard`,
    BASE: `${API_BASE_URL}/api/parent`,
    PAYMENTS: `${API_BASE_URL}/api/parent/payments`,
    PAY: (paymentId) => `${API_BASE_URL}/api/parent/payments/${paymentId}/pay`,
    PAY_INSTAPAY: (paymentId) => `${API_BASE_URL}/api/parent/payments/${paymentId}/instapay`,
  },
  CHAT: {
    BASE: `${API_BASE_URL}/api/chat`,
    SEND: `${API_BASE_URL}/api/chat/send`,
    CONVERSATIONS: `${API_BASE_URL}/api/chat/conversations`,
    FILES: `${API_BASE_URL}/api/chat/files`,
    MESSAGES: `${API_BASE_URL}/api/chat/messages`,
  },
  ANNOUNCEMENTS: {
    BASE: `${API_BASE_URL}/api/announcements`,
    MANAGEMENT: `${API_BASE_URL}/api/announcements/management`,
  },
  ASSIGNMENTS: `${API_BASE_URL}/api/assignments`,
  QUIZZES: `${API_BASE_URL}/api/quizzes`,
  FLASHCARDS: `${API_BASE_URL}/api/flashcards`,
  FLASHCARDS_MY_STACKS: `${API_BASE_URL}/api/flashcards/my-stacks`,
  SESSIONS: {
    BASE: `${API_BASE_URL}/api/sessions`,
    STATS: `${API_BASE_URL}/api/sessions/stats`,
    ALL: `${API_BASE_URL}/api/sessions/all`,
  },
  TEACHER_SESSIONS: {
    BASE: `${API_BASE_URL}/api/teacher/sessions`,
    STUDENTS: `${API_BASE_URL}/api/teacher/sessions/students`,
    STATS: `${API_BASE_URL}/api/teacher/sessions/stats`,
  },
  REGISTRATION: {
    BASE: `${API_BASE_URL}/api/registration`,
    SUBMIT: `${API_BASE_URL}/api/registration/submit`,
    PENDING: `${API_BASE_URL}/api/registration/pending`,
  },
};

// Utility function to build URLs
export const buildApiUrl = (endpoint, params = {}) => {
  let url = endpoint;
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  return url;
};

 