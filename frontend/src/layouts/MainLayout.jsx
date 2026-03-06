import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ROLES, hasRole } from "../constants/roles";
import { authService } from "../services/authService";
import { useDarkMode } from "../contexts/DarkModeContext";

const MENU_CONFIG = [
  // ADMIN Section
  {
    key: "admin",
    label: "Admin",
    roles: [ROLES.ADMIN],
    children: [
      { key: "adminDashboard", label: "Tổng quan", to: "/staff/admin" },
      { key: "adminUsers", label: "Quản lý Người dùng", to: "/staff/admin/users" },
      { key: "adminRoles", label: "Quản lý Vai trò", to: "/staff/admin/roles" },
      { key: "adminDepartments", label: "Quản lý Phòng ban", to: "/staff/admin/departments" },
      { key: "adminWorkflow", label: "Quản lý Quy trình", to: "/staff/admin/workflow" },
      { key: "adminConfig", label: "Cấu hình Hệ thống", to: "/staff/admin/config" },
    ],
  },

  // DIRECTOR Section
  {
    key: "director",
    label: "Giám đốc",
    roles: [ROLES.DIRECTOR],
    children: [
      { key: "directorDashboard", label: "Tổng quan", to: "/staff/director" },
      {
        key: "directorJobRequests",
        label: "Duyệt Yêu cầu Tuyển dụng",
        to: "/staff/director/job-requests",
      },
      {
        key: "directorOffers",
        label: "Duyệt Đề nghị Tuyển dụng",
        to: "/staff/director/offers",
      },
    ],
  },

  // DEPARTMENT MANAGER Section
  {
    key: "deptManager",
    label: "Trưởng phòng ban",
    roles: [ROLES.DEPARTMENT_MANAGER],
    children: [
      {
        key: "deptManagerDashboard",
        label: "Tổng quan",
        to: "/staff/dept-manager",
      },
      {
        key: "deptManagerJobRequests",
        label: "Yêu cầu Tuyển dụng",
        to: "/staff/dept-manager/job-requests",
      },
      {
        key: "deptManagerInterviews",
        label: "Phỏng vấn của tôi",
        to: "/staff/dept-manager/interviews",
      },
    ],
  },

  // HR MANAGER Section
  {
    key: "hrManager",
    label: "Trưởng phòng nhân sự",
    roles: [ROLES.HR_MANAGER],
    children: [
      {
        key: "hrManagerDashboard",
        label: "Tổng quan",
        to: "/staff/hr-manager",
      },
      {
        key: "hrManagerJobRequests",
        label: "Yêu cầu Tuyển dụng",
        to: "/staff/hr-manager/job-requests",
      },
      {
        key: "hrManagerJobPostings",
        label: "Tin tuyển dụng",
        to: "/staff/hr-manager/job-postings",
      },
    ],
  },

  // HR STAFF Section
  {
    key: "hrStaff",
    label: "Nhân viên nhân sự",
    roles: [ROLES.HR_STAFF],
    children: [
      {
        key: "hrStaffJobPostings",
        label: "Tin tuyển dụng",
        to: "/staff/hr-staff/job-postings",
      },
    ],
  },

  // EMPLOYEE Section
  {
    key: "employee",
    label: "Nhân viên",
    roles: [ROLES.EMPLOYEE],
    children: [
      {
        key: "employeeInterviews",
        label: "Phỏng vấn của tôi",
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
    label: "Hồ sơ Ứng tuyển",
    to: "/staff/hr-manager/applications",
    roles: [ROLES.HR_MANAGER, ROLES.HR_STAFF],
  },
  {
    key: "sharedInterviews",
    label: "Phỏng vấn",
    to: "/staff/hr-manager/interviews",
    roles: [ROLES.HR_MANAGER, ROLES.HR_STAFF],
  },
  {
    key: "sharedOffers",
    label: "Đề nghị Tuyển dụng",
    to: "/staff/hr-manager/offers",
    roles: [ROLES.HR_MANAGER, ROLES.HR_STAFF],
  },
];

export default function MainLayout() {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications] = useState(3); // Mock notification count
  const navigate = useNavigate();
  const { isDark, toggleDarkMode } = useDarkMode();

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
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-6 shadow-sm sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition-colors lg:hidden"
            aria-label="mở/đóng menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Desktop sidebar collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 transition-colors"
            aria-label="thu gọn thanh bên"
            title={sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-xl text-gray-900 dark:text-slate-100">RMS</div>
              <div className="text-xs text-gray-500 dark:text-slate-400 -mt-0.5">Quản lý Tuyển dụng</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button
            className="relative p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-all"
            aria-label="thông báo"
            title="Thông báo"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {notifications}
              </span>
            )}
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 transition-all"
            aria-label="chuyển chế độ tối/sáng"
            title={isDark ? "Chế độ Sáng" : "Chế độ Tối"}
          >
            {isDark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* User info */}
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="text-left">
              <div className="font-semibold text-sm text-gray-900 dark:text-slate-100">{user?.fullName}</div>
              <div className="text-xs text-gray-500 dark:text-slate-400">{user?.roles?.[0]}</div>
            </div>
          </div>
          
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-all border border-transparent hover:border-red-200 dark:hover:border-red-800"
            aria-label="đăng xuất"
            title="Đăng xuất"
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
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700
          transition-all duration-300 ease-in-out
          flex flex-col mt-16 lg:mt-0
        `}>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {filteredMenu.map((m) => {
              if (m.isDivider) {
                return <div key={m.key} className="h-px bg-gray-200 dark:bg-slate-700 my-3" />;
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
                          : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                      }`
                    }
                  >
                    <span className={`flex-1 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{m.label}</span>
                  </NavLink>
                );
              }

              return (
                <div key={m.key} className="space-y-1">
                  <div className={`px-3 py-2 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
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
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border-l-4 border-blue-600 pl-3"
                              : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-200 border-l-4 border-transparent pl-3"
                          }`
                        }
                      >
                        <span className={sidebarCollapsed ? 'lg:hidden' : ''}>{c.label}</span>
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
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 transition-colors">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
