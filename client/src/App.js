import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from "./components/ProtectedRoute";
import { StoriesProvider } from "./context/StoriesContext";
import WhatsAppFab from "./components/WhatsAppFab";
import ErrorBoundary from "./components/ErrorBoundary";
import AnalyticsTracker from "./components/AnalyticsTracker";
import ScrollToTop from "./components/ScrollToTop";
import SkipLink from "./components/SkipLink";

const Home = lazy(() => import("./Pages/info/Home"));
const About = lazy(() => import("./Pages/info/About"));
const ContactUs = lazy(() => import("./Pages/info/ContactUs"));
const Curriculum = lazy(() => import("./Pages/info/Curriculum"));
const FAQ = lazy(() => import("./Pages/info/FAQ"));
const Fees = lazy(() => import("./Pages/info/Fees"));
const Samples = lazy(() => import("./Pages/info/Samples"));
const HallOfFame = lazy(() => import("./Pages/info/HallOfFame"));
const Privacy = lazy(() => import("./Pages/info/Privacy"));
const Terms = lazy(() => import("./Pages/info/Terms"));

const SignIn = lazy(() => import("./Pages/auth/SignIn"));
const Registration = lazy(() => import("./Pages/auth/Registration"));

const TeacherDashboard = lazy(() => import("./Pages/portal/TeacherDashboard"));
const StudentDashboard = lazy(() => import("./Pages/portal/StudentDashboard"));
const ParentDashboard = lazy(() => import("./Pages/portal/ParentDashboard"));

const NotFound = lazy(() => import("./components/NotFound"));

const RouteFallback = () => (
  <div
    className="min-h-screen bg-[#0F0F0F] flex items-center justify-center"
    role="status"
    aria-live="polite"
    aria-label="Loading page"
  >
    <div className="w-12 h-12 rounded-full border-4 border-[#CA133E] border-t-transparent animate-spin" />
  </div>
);

function App() {
  return (
    <Router>
      <StoriesProvider>
      <ErrorBoundary>
        <MotionConfig reducedMotion="user">
        <SkipLink />
        <ScrollToTop />
        <div className="App">
          <AnalyticsTracker />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* Info Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/hall-of-fame" element={<HallOfFame />} />
              <Route path="/contact" element={<ContactUs />} />
              <Route path="/curriculum" element={<Curriculum />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/fees" element={<Fees />} />
              <Route path="/samples" element={<Samples />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

              {/* Auth Routes */}
              <Route path="/signin" element={<SignIn />} />
              <Route path="/register" element={<Registration />} />

              {/* Portal Routes */}
              <Route
                path="/teacher-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/parent-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['parent']}>
                    <ParentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 404 catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>

          {/* Floating WhatsApp button (hidden on dashboards) */}
          <WhatsAppFab />

          {/* Toast Container for notifications */}
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            toastClassName="bg-gray-800 text-white"
            progressClassName="bg-[#CA133E]"
          />
        </div>
        </MotionConfig>
      </ErrorBoundary>
      </StoriesProvider>
    </Router>
  );
}

export default App;
