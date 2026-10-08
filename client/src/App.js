import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import { StoriesProvider } from "./context/StoriesContext";
import ErrorBoundary from "./components/ErrorBoundary";
import AnalyticsTracker from "./components/AnalyticsTracker";
import ScrollToTop from "./components/ScrollToTop";

// The public home page; /signin and /register are the same page with the auth modal open.
const AuthPage = lazy(() => import("./Pages/auth/AuthPage"));
const Privacy = lazy(() => import("./Pages/site/ContentPages").then(m => ({ default: m.Privacy })));
const Terms = lazy(() => import("./Pages/site/ContentPages").then(m => ({ default: m.Terms })));
const HallOfFame = lazy(() => import("./Pages/site/HallOfFame"));
const NotFound = lazy(() => import("./Pages/site/ContentPages").then(m => ({ default: m.NotFound })));

const TeacherPortal = lazy(() => import("./Pages/teacher/TeacherPortal"));
const StudentPortal = lazy(() => import("./Pages/student/StudentPortal"));
const ParentPortal = lazy(() => import("./Pages/parent/ParentPortal"));

// Old standalone pages now live as sections of the one-page site.
const SECTION_REDIRECTS = { '/about': 'about', '/fees': 'fees', '/samples': 'samples', '/faq': 'faq', '/contact': 'contact', '/curriculum': 'method' };

const RouteFallback = () => (
  <div
    style={{ minHeight: '100vh', background: 'var(--ink-950)', display: 'grid', placeItems: 'center' }}
    role="status"
    aria-live="polite"
    aria-label="Loading page"
  >
    <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid var(--crimson-500)', borderTopColor: 'transparent' }} className="animate-spin" />
  </div>
);

function App() {
  return (
    <Router>
      <StoriesProvider>
      <ErrorBoundary>
        <ScrollToTop />
        <div className="App">
          <AnalyticsTracker />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Public site */}
              <Route path="/" element={<AuthPage />} />
              <Route path="/signin" element={<AuthPage tab="in" />} />
              <Route path="/register" element={<AuthPage tab="up" />} />
              <Route path="/hall-of-fame" element={<HallOfFame />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              {Object.entries(SECTION_REDIRECTS).map(([path, id]) => (
                <Route key={path} path={path} element={<Navigate to={`/#${id}`} replace />} />
              ))}

              {/* Portals */}
              <Route
                path="/teacher-dashboard/*"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <TeacherPortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student-dashboard/*"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentPortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent-dashboard/*"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentPortal />
                  </ProtectedRoute>
                }
              />

              {/* 404 catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </ErrorBoundary>
      </StoriesProvider>
    </Router>
  );
}

export default App;
