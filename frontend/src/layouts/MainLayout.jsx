import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ROLES, hasRole } from "../constants/roles";
import { authService } from "../services/authService";

const MENU_CONFIG = [
  // ADMIN Section
  {
    key: "admin",
    label: "Admin",
    roles: [ROLES.ADMIN],
    children: [
      { key: "adminDashboard", label: "Dashboard", to: "/staff/admin" },
      { key: "adminUsers", label: "User Management", to: "/staff/admin/users" },
      { key: "adminRoles", label: "Role Management", to: "/staff/admin/roles" },
      {
        key: "adminDepartments",
        label: "Department Management",
        to: "/staff/admin/departments",
      },
      {
        key: "adminWorkflow",
        label: "Workflow Management",
        to: "/staff/admin/workflow",
      },
      {
        key: "adminConfig",
        label: "System Configuration",
        to: "/staff/admin/config",
      },
    ],
  },

  // DIRECTOR Section
  {
    key: "director",
    label: "Director",
    roles: [ROLES.DIRECTOR],
    children: [
      { key: "directorDashboard", label: "Dashboard", to: "/staff/director" },
      {
        key: "directorJobRequests",
        label: "Job Request Approvals",
        to: "/staff/director/job-requests",
      },
      {
        key: "directorOffers",
        label: "Offer Approvals",
        to: "/staff/director/offers",
      },
    ],
  },

  // DEPARTMENT MANAGER Section
  {
    key: "deptManager",
    label: "Department Manager",
    roles: [ROLES.DEPARTMENT_MANAGER],
    children: [
      {
        key: "deptManagerDashboard",
        label: "Dashboard",
        to: "/staff/dept-manager",
      },
      {
        key: "deptManagerJobRequests",
        label: "Job Requests",
        to: "/staff/dept-manager/job-requests",
      },
      {
        key: "deptManagerInterviews",
        label: "My Interviews",
        to: "/staff/dept-manager/interviews",
      },
    ],
  },

  // HR MANAGER Section (Strategic Dashboard + Approval Functions)
  {
    key: "hrManager",
    label: "HR Manager",
    roles: [ROLES.HR_MANAGER],
    children: [
      {
        key: "hrManagerDashboard",
        label: "Dashboard",
        to: "/staff/hr-manager",
      },
      {
        key: "hrManagerJobRequests",
        label: "Job Requests",
        to: "/staff/hr-manager/job-requests",
      },
    ],
  },

  // HR STAFF Section (Operational Functions)
  {
    key: "hrStaff",
    label: "HR Staff",
    roles: [ROLES.HR_STAFF],
    children: [
      {
        key: "hrStaffJobPostings",
        label: "Job Postings",
        to: "/staff/hr-staff/job-postings",
      },
    ],
  },

  // EMPLOYEE Section (Interview Participation)
  {
    key: "employee",
    label: "Employee",
    roles: [ROLES.EMPLOYEE],
    children: [
      {
        key: "employeeInterviews",
        label: "My Interviews",
        to: "/staff/employee/interviews",
      },
    ],
  },

  // Divider
  {
    key: "divider2",
    isDivider: true,
    roles: [ROLES.HR_MANAGER, ROLES.HR_STAFF],
  },

  // Shared Operations (HR Manager + HR Staff)
  {
    key: "sharedApplications",
    label: "Applications",
    to: "/staff/hr-manager/applications",
    roles: [ROLES.HR_MANAGER, ROLES.HR_STAFF],
  },
  {
    key: "sharedInterviews",
    label: "Interviews",
    to: "/staff/hr-manager/interviews",
    roles: [ROLES.HR_MANAGER, ROLES.HR_STAFF],
  },
  {
    key: "sharedOffers",
    label: "Offers",
    to: "/staff/hr-manager/offers",
    roles: [ROLES.HR_MANAGER, ROLES.HR_STAFF],
  },
];

export default function MainLayout() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = authService.getUserInfo();
    setUser(userInfo);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  // Filter menu based on roles
  const getFilteredMenu = () => {
    if (!user || !user.roles) return [];

    return MENU_CONFIG.filter((item) => {
      if (item.isDivider) {
        return item.roles ? hasRole(user.roles, item.roles) : true;
      }
      if (!item.roles) return true;
      return hasRole(user.roles, item.roles);
    });
  };

  const filteredMenu = getFilteredMenu();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors lg:hidden"
            aria-label="toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-xl text-gray-900">RMS</div>
              <div className="text-xs text-gray-500 -mt-0.5">Recruitment Management</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm text-gray-900">{user?.fullName}</div>
              <div className="text-xs text-gray-500">{user?.roles?.[0]}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-lg hover:bg-red-50 text-gray-600 hover:text-red-600 transition-all border border-transparent hover:border-red-200"
            aria-label="logout"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 
          transition-transform duration-300 ease-in-out lg:transition-none
          flex flex-col mt-16 lg:mt-0
        `}>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {filteredMenu.map((m) => {
              if (m.isDivider) {
                return <div key={m.key} className="h-px bg-gray-200 my-3" />;
              }

              if (!m.children) {
                return (
                  <NavLink
                    key={m.key}
                    to={m.to}
                    end
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium group ${
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                          : "text-gray-700 hover:bg-gray-100"
                      }`
                    }
                  >
                    <span className="flex-1">{m.label}</span>
                  </NavLink>
                );
              }

              return (
                <div key={m.key} className="space-y-1">
                  <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {m.label}
                  </div>
                  <div className="space-y-0.5">
                    {m.children.map((c) => (
                      <NavLink
                        key={c.key}
                        to={c.to}
                        end
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                            isActive
                              ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 pl-3"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent pl-3"
                          }`
                        }
                      >
                        <span>{c.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden mt-16"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
