import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import { ROLES } from "./constants/roles";
import MainLayout from "./layouts/MainLayout";
import CandidateLayout from "./layouts/CandidateLayout";
import PrivateRoute from "./routes/PrivateRoute";
import { authService } from "./services/authService";

// Landing Page
import LandingPage from "./pages/LandingPageNew";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import GoogleCallback from "./pages/auth/GoogleCallback";

// Staff Pages
import Dashboard from "./pages/dashboard/Dashboard";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserList from "./pages/admin/UserList";
import UserDetail from "./pages/admin/UserDetail";
import RoleList from "./pages/admin/RoleList";
import RoleDetail from "./pages/admin/RoleDetail";
import DepartmentList from "./pages/admin/DepartmentList";
import DepartmentDetail from "./pages/admin/DepartmentDetail";
import SystemConfiguration from "./pages/admin/SystemConfiguration";
import WorkflowManagement from "./pages/admin/WorkflowManagement";

// Director Pages
import DirectorDashboard from "./pages/director/DirectorDashboard";
import JobRequestApprovals from "./pages/director/JobRequestApprovals";
import OfferApprovals from "./pages/director/OfferApprovals";

// Department Manager Pages
import DeptManagerDashboard from "./pages/department-manager/DeptManagerDashboard";
import DeptManagerJobRequestList from "./pages/department-manager/DeptManagerJobRequestList";
import CreateJobRequest from "./pages/department-manager/DeptManagerJobRequestCreate";
import DeptManagerJobRequestDetail from "./pages/department-manager/DeptManagerJobRequestDetail";
import DeptManagerJobRequestEdit from "./pages/department-manager/DeptManagerJobRequestEdit";
import DeptManagerInterviewList from "./pages/department-manager/DeptManagerInterviewList";
import DeptManagerInterviewDetail from "./pages/department-manager/DeptManagerInterviewDetail";

// HR Manager Pages
import HRManagerDashboard from "./pages/hr/dashboard/HRManagerDashboard";
import HRJobRequestList from "./pages/hr/manager/HRJobRequestList";
import HRJobRequestDetail from "./pages/hr/manager/HRJobRequestDetail";
import HRApplicationList from "./pages/hr/manager/HRApplicationList";
import HRApplicationDetail from "./pages/hr/manager/HRApplicationDetail";
import HRInterviewList from "./pages/hr/manager/HRInterviewList";
import HROfferList from "./pages/hr/manager/HROfferList";

// HR Staff Pages
import HRJobPostingList from "./pages/hr/staff/HRJobPostingList";

// Employee Pages
import EmployeeInterviewList from "./pages/employee/EmployeeInterviewList";
import EmployeeInterviewDetail from "./pages/employee/EmployeeInterviewDetail";

// Candidate Pages
import JobBoard from "./pages/candidate/JobBoard";
import JobDetail from "./pages/candidate/JobDetail";
import MyApplications from "./pages/candidate/MyApplications";
import MyProfile from "./pages/candidate/MyProfile";

const STAFF_ROLES = [
  ROLES.ADMIN,
  ROLES.DIRECTOR,
  ROLES.HR_MANAGER,
  ROLES.HR_STAFF,
  ROLES.DEPARTMENT_MANAGER,
  ROLES.EMPLOYEE,
];

// Role-based redirect component
function RoleBasedRedirect() {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = authService.getUserInfo();
  if (!user || !user.roles || user.roles.length === 0) {
    return <Navigate to="/login" replace />;
  }

  // Priority: Admin > Director > HR Manager > HR Staff > Department Manager > Employee > Candidate
  if (user.roles.includes(ROLES.ADMIN)) {
    return <Navigate to="/staff/admin" replace />;
  }
  if (user.roles.includes(ROLES.DIRECTOR)) {
    return <Navigate to="/staff/director" replace />;
  }
  if (user.roles.includes(ROLES.HR_MANAGER)) {
    return <Navigate to="/staff/hr-manager" replace />;
  }
  if (user.roles.includes(ROLES.HR_STAFF)) {
    return <Navigate to="/staff/hr-staff/job-postings" replace />;
  }
  if (user.roles.includes(ROLES.DEPARTMENT_MANAGER)) {
    return <Navigate to="/staff/dept-manager" replace />;
  }
  if (user.roles.includes(ROLES.EMPLOYEE)) {
    return <Navigate to="/staff/employee/interviews" replace />;
  }
  if (user.roles.includes(ROLES.CANDIDATE)) {
    return <Navigate to="/app/jobs" replace />;
  }

  return <Navigate to="/staff/dashboard" replace />;
}

export default function App() {
  return (
    <DarkModeProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors closeButton expand={false} duration={3000} />
        <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* Candidate Portal */}
        <Route
          path="/app"
          element={
            <PrivateRoute roles={[ROLES.CANDIDATE]}>
              <CandidateLayout />
            </PrivateRoute>
          }
        >
          <Route path="jobs" element={<JobBoard />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="profile" element={<MyProfile />} />
          {/* Default redirect to jobs */}
          <Route index element={<Navigate to="jobs" replace />} />
        </Route>

        {/* Staff Portal (Internal) */}
        <Route
          path="/staff"
          element={
            <PrivateRoute roles={STAFF_ROLES}>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />

          {/* Admin Management Routes */}
          <Route
            path="admin"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="admin/users"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <UserList />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/users/new"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <UserDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/users/:id"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <UserDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/users/:id/edit"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <UserDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="admin/roles"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <RoleList />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/roles/new"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <RoleDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/roles/:id"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <RoleDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/roles/:id/edit"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <RoleDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="admin/departments"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <DepartmentList />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/departments/new"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <DepartmentDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/departments/:id"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <DepartmentDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="admin/departments/:id/edit"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <DepartmentDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="admin/workflow"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <WorkflowManagement />
              </PrivateRoute>
            }
          />

          <Route
            path="admin/config"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <SystemConfiguration />
              </PrivateRoute>
            }
          />

          {/* Director Management Routes */}
          <Route
            path="director"
            element={
              <PrivateRoute roles={[ROLES.DIRECTOR]}>
                <DirectorDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="director/job-requests"
            element={
              <PrivateRoute roles={[ROLES.DIRECTOR]}>
                <JobRequestApprovals />
              </PrivateRoute>
            }
          />
          <Route
            path="director/offers"
            element={
              <PrivateRoute roles={[ROLES.DIRECTOR]}>
                <OfferApprovals />
              </PrivateRoute>
            }
          />

          {/* Department Manager Routes */}
          <Route
            path="dept-manager"
            element={
              <PrivateRoute roles={[ROLES.DEPARTMENT_MANAGER]}>
                <DeptManagerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="dept-manager/job-requests"
            element={
              <PrivateRoute roles={[ROLES.DEPARTMENT_MANAGER]}>
                <DeptManagerJobRequestList />
              </PrivateRoute>
            }
          />
          <Route
            path="dept-manager/job-requests/new"
            element={
              <PrivateRoute roles={[ROLES.DEPARTMENT_MANAGER]}>
                <CreateJobRequest />
              </PrivateRoute>
            }
          />
          <Route
            path="dept-manager/job-requests/:id/edit"
            element={
              <PrivateRoute roles={[ROLES.DEPARTMENT_MANAGER]}>
                <DeptManagerJobRequestEdit />
              </PrivateRoute>
            }
          />
          <Route
            path="dept-manager/job-requests/:id"
            element={
              <PrivateRoute roles={[ROLES.DEPARTMENT_MANAGER]}>
                <DeptManagerJobRequestDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="dept-manager/interviews"
            element={
              <PrivateRoute roles={[ROLES.DEPARTMENT_MANAGER]}>
                <DeptManagerInterviewList />
              </PrivateRoute>
            }
          />
          <Route
            path="dept-manager/interviews/:id"
            element={
              <PrivateRoute roles={[ROLES.DEPARTMENT_MANAGER]}>
                <DeptManagerInterviewDetail />
              </PrivateRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="employee/interviews"
            element={
              <PrivateRoute roles={[ROLES.EMPLOYEE]}>
                <EmployeeInterviewList />
              </PrivateRoute>
            }
          />
          <Route
            path="employee/interviews/:id"
            element={
              <PrivateRoute roles={[ROLES.EMPLOYEE]}>
                <EmployeeInterviewDetail />
              </PrivateRoute>
            }
          />

          {/* HR Manager Routes (Manager Only) */}
          <Route
            path="hr-manager"
            element={
              <PrivateRoute roles={[ROLES.HR_MANAGER]}>
                <HRManagerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="hr-manager/job-requests"
            element={
              <PrivateRoute roles={[ROLES.HR_MANAGER]}>
                <HRJobRequestList />
              </PrivateRoute>
            }
          />
          <Route
            path="hr-manager/job-requests/:id"
            element={
              <PrivateRoute roles={[ROLES.HR_MANAGER]}>
                <HRJobRequestDetail />
              </PrivateRoute>
            }
          />

          {/* HR Staff Routes (Staff Only) */}
          <Route
            path="hr-staff/job-postings"
            element={
              <PrivateRoute roles={[ROLES.HR_STAFF]}>
                <HRJobPostingList />
              </PrivateRoute>
            }
          />

          {/* Shared Routes (HR Manager + HR Staff) */}
          <Route
            path="hr-manager/applications"
            element={
              <PrivateRoute roles={[ROLES.HR_MANAGER, ROLES.HR_STAFF]}>
                <HRApplicationList />
              </PrivateRoute>
            }
          />
          <Route
            path="hr-manager/applications/:id"
            element={
              <PrivateRoute roles={[ROLES.HR_MANAGER, ROLES.HR_STAFF]}>
                <HRApplicationDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="hr-manager/interviews"
            element={
              <PrivateRoute roles={[ROLES.HR_MANAGER, ROLES.HR_STAFF]}>
                <HRInterviewList />
              </PrivateRoute>
            }
          />
          <Route
            path="hr-manager/offers"
            element={
              <PrivateRoute roles={[ROLES.HR_MANAGER, ROLES.HR_STAFF]}>
                <HROfferList />
              </PrivateRoute>
            }
          />
        </Route>

        {/* 404 & Redirect Logic */}
        <Route path="*" element={<RoleBasedRedirect />} />
      </Routes>
    </BrowserRouter>
    </DarkModeProvider>
  );
}
