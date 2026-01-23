// Example App.jsx with authentication routing
// Copy and adapt this to your existing App.jsx

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import GoogleCallback from './pages/GoogleCallback';
import ProtectedRoute from './components/ProtectedRoute';
import StaffLayout from './layouts/StaffLayout';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import Interviews from './pages/Interviews';
import Vacancies from './pages/Vacancies';
import VacancyAdd from './pages/VacancyAdd';
import Positions from './pages/Positions';
import Departments from './pages/Departments';
import Users from './pages/Users';
import InterviewCandidates from './pages/InterviewCandidates';
import CanceledCandidates from './pages/CanceledCandidates';
import MailHistory from './pages/MailHistory';
import { authService } from './services/authService';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <StaffLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="interviews" element={<Interviews />} />
          <Route path="interview-candidates" element={<InterviewCandidates />} />
          <Route path="canceled-candidates" element={<CanceledCandidates />} />
          <Route path="vacancies" element={<Vacancies />} />
          <Route path="vacancies/add" element={<VacancyAdd />} />
          <Route path="positions" element={<Positions />} />
          <Route path="departments" element={<Departments />} />
          <Route path="users" element={<Users />} />
          <Route path="mail-history" element={<MailHistory />} />
        </Route>

        {/* Redirect unknown routes */}
        <Route path="*" element={
          authService.isAuthenticated() 
            ? <Navigate to="/dashboard" replace /> 
            : <Navigate to="/login" replace />
        } />
      </Routes>
    </Router>
  );
}

export default App;
