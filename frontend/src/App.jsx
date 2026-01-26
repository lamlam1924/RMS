import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StaffLayout from "./layouts/StaffLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import GoogleCallback from "./pages/GoogleCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import { authService } from "./services/authService";

import Dashboard from "./pages/Dashboard";
import Departments from "./pages/Departments";
import Positions from "./pages/Positions";
import Users from "./pages/Users";
import Vacancies from "./pages/Vacancies";
import VacancyAdd from "./pages/VacancyAdd";
import Candidates from "./pages/Candidates";
import InterviewCandidates from "./pages/InterviewCandidates";
import CanceledCandidates from "./pages/CanceledCandidates";
import Interviews from "./pages/Interviews";
import MailHistory from "./pages/MailHistory";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* Root redirect - luôn về login trước */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Protected HR Staff Area */}
        <Route path="/staff" element={
          <ProtectedRoute>
            <StaffLayout />
          </ProtectedRoute>
        }>
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

        {/* 404 */}
        <Route path="*" element={
          authService.isAuthenticated()
            ? <Navigate to="/staff/interview-candidates" replace />
            : <Navigate to="/login" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}
