import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ROLES } from "./constants/roles";
import MainLayout from "./layouts/MainLayout/MainLayout";
import CandidateLayout from "./layouts/CandidateLayout/CandidateLayout";
import PrivateRoute from "./routes/PrivateRoute";
import { authService } from "./services/authService";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import GoogleCallback from "./pages/auth/GoogleCallback";

// Staff Pages
import Dashboard from "./pages/dashboard/Dashboard";
import Departments from "./pages/hr/Departments";
import Positions from "./pages/hr/Positions";
import Users from "./pages/hr/Users";
import Vacancies from "./pages/recruitment/Vacancies";
import VacancyAdd from "./pages/recruitment/VacancyAdd";
import Candidates from "./pages/candidates/Candidates";
import InterviewCandidates from "./pages/candidates/InterviewCandidates";
import CanceledCandidates from "./pages/candidates/CanceledCandidates";
import Interviews from "./pages/interviews/Interviews";
import MailHistory from "./pages/mail/MailHistory";

// Candidate Pages
import JobBoard from "./pages/candidate-portal/JobBoard";
import MyApplications from "./pages/candidate-portal/MyApplications";
import MyProfile from "./pages/candidate-portal/MyProfile";

const STAFF_ROLES = [
  ROLES.ADMIN,
  ROLES.DIRECTOR,
  ROLES.HR_MANAGER,
  ROLES.HR_STAFF,
  ROLES.DEPARTMENT_MANAGER,
  ROLES.EMPLOYEE
];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* Root redirect */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Candidate Portal */}
        <Route path="/app" element={
          <PrivateRoute roles={[ROLES.CANDIDATE]}>
            <CandidateLayout />
          </PrivateRoute>
        }>
          <Route path="jobs" element={<JobBoard />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="profile" element={<MyProfile />} />
          {/* Default redirect to jobs */}
          <Route index element={<Navigate to="jobs" replace />} />
        </Route>

        {/* Staff Portal (Internal) */}
        <Route path="/staff" element={
          <PrivateRoute roles={STAFF_ROLES}>
            <MainLayout />
          </PrivateRoute>
        }>
          <Route path="dashboard" element={<Dashboard />} />

          {/* Admin Rights */}
          <Route path="departments" element={
            <PrivateRoute roles={[ROLES.ADMIN]}><Departments /></PrivateRoute>
          } />
          <Route path="positions" element={
            <PrivateRoute roles={[ROLES.ADMIN]}><Positions /></PrivateRoute>
          } />
          <Route path="users" element={
            <PrivateRoute roles={[ROLES.ADMIN]}><Users /></PrivateRoute>
          } />

          {/* HR & Hiring Managers */}
          <Route path="vacancies" element={<Vacancies />} />
          <Route path="vacancies/add" element={<VacancyAdd />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="interview-candidates" element={<InterviewCandidates />} />
          <Route path="canceled-candidates" element={<CanceledCandidates />} />
          <Route path="interviews" element={<Interviews />} />
          <Route path="mail-history" element={<MailHistory />} />
        </Route>

        {/* 404 & Redirect Logic */}
        <Route path="*" element={
          authService.isAuthenticated()
            ? <Navigate to="/staff/dashboard" replace />
            : <Navigate to="/login" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}
