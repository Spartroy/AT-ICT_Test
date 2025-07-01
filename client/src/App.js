import React from "react";
import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Info pages
import Home from "./Pages/info/Home";
import About from "./Pages/info/About";
import ContactUs from "./Pages/info/ContactUs";
import Curriculum from "./Pages/info/Curriculum";
import FAQ from "./Pages/info/FAQ";
import Fees from "./Pages/info/Fees";
import Samples from "./Pages/info/Samples";

// Auth pages
import SignIn from "./Pages/auth/SignIn";
import Registration from "./Pages/auth/Registration";

// Portal pages
import TeacherDashboard from "./Pages/portal/TeacherDashboard";
import StudentDashboard from "./Pages/portal/StudentDashboard";
import ParentDashboard from "./Pages/portal/ParentDashboard";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Info Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/samples" element={<Samples />} />
          
          {/* Auth Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/register" element={<Registration />} />
          
          {/* Portal Routes */}
          <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          <Route path="/parent-dashboard" element={<ParentDashboard />} />
        </Routes>
        
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
    </Router>
  );
}

export default App;
