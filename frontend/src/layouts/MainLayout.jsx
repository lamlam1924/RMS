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
        // Show divider only if user has any of the required roles
        return item.roles ? hasRole(user.roles, item.roles) : true;
      }
      if (!item.roles) return true; // No restriction
      return hasRole(user.roles, item.roles);
    });
  };

  const filteredMenu = getFilteredMenu();

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-gray-800 font-sans">
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-5 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex flex-col leading-tight">
            <div className="font-extrabold tracking-wide text-lg text-blue-900">RMS</div>
            <div className="text-xs text-gray-500 font-medium">Recruitment Management</div>
          </div>
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors" aria-label="menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="font-semibold text-sm text-gray-800">{user?.fullName}</div>
            <div className="text-xs text-gray-500">{user?.roles?.join(", ")}</div>
          </div>
          <button
            className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors border border-transparent hover:border-red-100"
            aria-label="logout"
            onClick={handleLogout}
            title="Logout"
          >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-[260px_1fr] min-h-0">
        <aside className="bg-white border-r border-gray-200 p-3 overflow-y-auto hidden md:block">
          {filteredMenu.map((m) => {
            // Render divider
            if (m.isDivider) {
              return (
                <div
                  key={m.key}
                  className="h-px bg-gray-200 my-4 mx-2"
                />
              );
            }

            // Render single menu item
            if (!m.children) {
              return (
                <NavLink
                  key={m.key}
                  to={m.to}
                  end
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl transition-all duration-200 text-sm font-medium ${
                      isActive 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  <span>{m.label}</span>
                </NavLink>
              );
            }

            // Render group with children
            return (
              <div key={m.key} className="mt-4 mb-2">
                <div className="flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span>{m.label}</span>
                </div>

                <div className="mt-1 space-y-1">
                  {m.children.map((c) => (
                    <NavLink
                      key={c.key}
                      to={c.to}
                      end
                      className={({ isActive }) =>
                        `block w-full text-left px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                          isActive
                            ? "bg-blue-50 text-blue-700 font-semibold"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }`
                      }
                    >
                      {c.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </aside>

        <main className="p-6 overflow-y-auto bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
