// API Configuration
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  },
  STUDENT: {
    DASHBOARD: `${API_BASE_URL}/api/student/dashboard`,
    MATERIALS: `${API_BASE_URL}/api/student/materials`,
    ASSIGNMENTS: `${API_BASE_URL}/api/student/assignments`,
    QUIZZES: `${API_BASE_URL}/api/student/quizzes`,
    SCHEDULE: `${API_BASE_URL}/api/student/schedule`,
    VIDEOS: `${API_BASE_URL}/api/student/videos`,
  },
  TEACHER: {
    DASHBOARD: `${API_BASE_URL}/api/teacher/dashboard`,
    STUDENTS: `${API_BASE_URL}/api/teacher/students`,
    MATERIALS: `${API_BASE_URL}/api/teacher/materials`,
    SCHEDULE: `${API_BASE_URL}/api/teacher/schedule`,
    VIDEOS: `${API_BASE_URL}/api/teacher/videos`,
    ACTIVITIES: `${API_BASE_URL}/api/teacher/activities`,
  },
  SCHEDULE: {
    QR: `${API_BASE_URL}/api/schedule/qr`,
    STUDENT_CHECK: `${API_BASE_URL}/api/schedule/attendance/check`,
  },
  PARENT: {
    DASHBOARD: `${API_BASE_URL}/api/parent/dashboard`,
    BASE: `${API_BASE_URL}/api/parent`
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

export default API_ENDPOINTS; 