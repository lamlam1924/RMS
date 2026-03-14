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
import DirectorJobRequestList from "./pages/director/DirectorJobRequestList";
import OfferApprovals from "./pages/director/OfferApprovals";
import DirectorInterviewList from "./pages/director/DirectorInterviewList";
import DirectorInterviewDetail from "./pages/director/DirectorInterviewDetail";
import DirectorNominationList from "./pages/director/DirectorNominationList";

// Department Manager Pages
import DeptManagerDashboard from "./pages/department-manager/DeptManagerDashboard";
import DeptManagerJobRequestList from "./pages/department-manager/DeptManagerJobRequestList";
import CreateJobRequest from "./pages/department-manager/DeptManagerJobRequestCreate";
import DeptManagerJobRequestDetail from "./pages/department-manager/DeptManagerJobRequestDetail";
import DeptManagerJobRequestEdit from "./pages/department-manager/DeptManagerJobRequestEdit";
import DeptManagerInterviewList from "./pages/department-manager/DeptManagerInterviewList";
import DeptManagerInterviewDetail from "./pages/department-manager/DeptManagerInterviewDetail";
import DeptManagerNominationList from "./pages/department-manager/DeptManagerNominationList";

// HR Manager Pages
import HRManagerDashboard from "./pages/hr/dashboard/HRManagerDashboard";
import HRJobRequestList from "./pages/hr/manager/HRJobRequestList";
import HRJobRequestDetail from "./pages/hr/manager/HRJobRequestDetail";
import HRManagerJobPostingList from "./pages/hr/manager/HRManagerJobPostingList";
import HRApplicationList from "./pages/hr/manager/HRApplicationList";
import HRApplicationDetail from "./pages/hr/manager/HRApplicationDetail";
import HRInterviewList from "./pages/hr/manager/HRInterviewList";
import HRInterviewDetail from "./pages/hr/manager/HRInterviewDetail";
import HRInterviewCreate from "./pages/hr/manager/HRInterviewCreate";
import HROfferList from "./pages/hr/manager/HROfferList";
import HROfferCreate from "./pages/hr/manager/HROfferCreate";
import HROfferDetail from "./pages/hr/manager/HROfferDetail";

// HR Staff Pages
import HRJobPostingList from "./pages/hr/staff/HRJobPostingList";
import CreateJobPosting from "./pages/hr/staff/CreateJobPosting";
import EditJobPosting from "./pages/hr/staff/EditJobPosting";

// Employee Pages
import EmployeeInterviewList from "./pages/employee/EmployeeInterviewList";
import EmployeeInterviewDetail from "./pages/employee/EmployeeInterviewDetail";
import InterviewerInterviewList from "./pages/interviewer/InterviewerInterviewList";
import InterviewerInterviewDetail from "./pages/interviewer/InterviewerInterviewDetail";

// Candidate Pages
import JobBoard from "./pages/candidate/JobBoard";
import JobDetail from "./pages/candidate/JobDetail";
import MyApplications from "./pages/candidate/MyApplications";
import MyProfile from "./pages/candidate/MyProfile";
import CandidateInterviewList from "./pages/candidate/CandidateInterviewList";
import CandidateInterviewDetail from "./pages/candidate/CandidateInterviewDetail";

// Resume Builder (standalone)
import ResumePage from "./pages/resume-builder/ResumePage";

const STAFF_ROLES = [
  ROLES.ADMIN,
  ROLES.DIRECTOR,
  ROLES.HR_MANAGER,
  ROLES.HR_STAFF,
  ROLES.DEPARTMENT_MANAGER,
  ROLES.EMPLOYEE,
];

const INTERVIEWER_ROLES = [
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
        <Toaster 
          position="top-center" 
          richColors 
          closeButton 
          expand={true} 
          duration={3000}
          toastOptions={{
            style: {
              fontSize: '16px',
              minWidth: '400px',
              padding: '16px 20px',
            },
            actionButtonStyle: {
              backgroundColor: '#10b981',
              color: 'white',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '8px',
            },
            cancelButtonStyle: {
              backgroundColor: '#ef4444',
              color: 'white',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: '8px',
            },
          }}
        />
        <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Resume Builder - Standalone */}
        <Route path="/resume-builder" element={<ResumePage />} />

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
          <Route path="interviews" element={<CandidateInterviewList />} />
          <Route path="interviews/:id" element={<CandidateInterviewDetail />} />
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
          <Route path="dashboard" element={<RoleBasedRedirect />} />

          <Route
            path="interviews"
            element={
              <PrivateRoute roles={INTERVIEWER_ROLES}>
                <InterviewerInterviewList />
              </PrivateRoute>
            }
          />
          <Route
            path="interviews/:id"
            element={
              <PrivateRoute roles={INTERVIEWER_ROLES}>
                <InterviewerInterviewDetail />
              </PrivateRoute>
            }
          />

          {/* Admin Management Routes */}
          <Route
            path="admin"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          {/* Admin Users: specific routes first */}
          <Route
            path="admin/users/new"
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
            path="admin/users/:id"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <UserDetail />
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

          {/* Admin Roles: specific routes first */}
          <Route
            path="admin/roles/new"
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
            path="admin/roles/:id"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <RoleDetail />
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

          {/* Admin Departments: specific routes first */}
          <Route
            path="admin/departments/new"
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
            path="admin/departments/:id"
            element={
              <PrivateRoute roles={[ROLES.ADMIN]}>
                <DepartmentDetail />
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
                <DirectorJobRequestList />
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
          <Route
            path="director/my-interviews"
            element={
              <PrivateRoute roles={[ROLES.DIRECTOR]}>
                <DirectorInterviewList />
              </PrivateRoute>
            }
          />
          <Route
            path="director/my-interviews/:id"
            element={
              <PrivateRoute roles={[ROLES.DIRECTOR]}>
                <DirectorInterviewDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="director/nominations"
            element={
              <PrivateRoute roles={[ROLES.DIRECTOR]}>
                <DirectorNominationList />
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
          <Route
            path="dept-manager/nominations"
            element={
              <PrivateRoute roles={[ROLES.DEPARTMENT_MANAGER]}>
                <DeptManagerNominationList />
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
          <Route
            path="hr-manager/job-postings"
            element={
              <PrivateRoute roles={[ROLES.HR_MANAGER]}>
                <HRManagerJobPostingList />
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
          <Route
            path="hr-staff/job-postings/new"
            element={
              <PrivateRoute roles={[ROLES.HR_STAFF]}>
                <CreateJobPosting />
              </PrivateRoute>
            }
          />
          <Route
            path="hr-staff/job-postings/:id/edit"
            element={
              <PrivateRoute roles={[ROLES.HR_STAFF]}>
                <EditJobPosting />
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
            path="hr-manager/interviews/create"
            element={
              <PrivateRoute roles={[ROLES.HR_MANAGER, ROLES.HR_STAFF]}>
                <HRInterviewCreate />
              </PrivateRoute>
            }
          />
          <Route
            path="hr-manager/interviews/:id"
            element={
              <PrivateRoute roles={[ROLES.HR_MANAGER, ROLES.HR_STAFF]}>
                <HRInterviewDetail />
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
