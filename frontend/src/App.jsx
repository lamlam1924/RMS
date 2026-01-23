import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StaffLayout from "./layouts/StaffLayout";

import Dashboard from "./pages/Dashboard";
import Departments from "./pages/Departments";
import Positions from "./pages/Positions";
import Users from "./pages/Users";
import Vacancies from "./pages/Vacancies";          // Vacancy List
import VacancyAdd from "./pages/VacancyAdd";       // Add Vacancy page (form)
import Candidates from "./pages/Candidates";
import InterviewCandidates from "./pages/InterviewCandidates";
import CanceledCandidates from "./pages/CanceledCandidates";
import Interviews from "./pages/Interviews";
import MailHistory from "./pages/MailHistory";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to="/staff/interview-candidates" replace />}
        />

        {/* HR Staff Area */}
        <Route path="/staff" element={<StaffLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="departments" element={<Departments />} />
          <Route path="positions" element={<Positions />} />
          <Route path="users" element={<Users />} />
          <Route path="vacancies" element={<Vacancies />} />
          <Route path="vacancies/add" element={<VacancyAdd />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="interview-candidates" element={<InterviewCandidates />} />
          <Route path="canceled-candidates" element={<CanceledCandidates />} />
          <Route path="interviews" element={<Interviews />} />
          <Route path="mail-history" element={<MailHistory />} />
        </Route>

        <Route path="*" element={<div style={{ padding: 16 }}>404</div>} />
      </Routes>
    </BrowserRouter>
  );
}
