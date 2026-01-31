import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../styles/MainLayout.css";
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
    <div className="staff-shell">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <div className="brand-logo">RMS</div>
            <div className="brand-sub">Recruitment Management</div>
          </div>
          <button className="icon-btn" aria-label="menu">
            ☰
          </button>
        </div>

        <div className="topbar-right">
          <div
            className="user-info"
            style={{ marginRight: 16, fontSize: 13, textAlign: "right" }}
          >
            <div style={{ fontWeight: 600 }}>{user?.fullName}</div>
            <div style={{ color: "#666", fontSize: 11 }}>
              {user?.roles?.join(", ")}
            </div>
          </div>
          <button
            className="icon-btn"
            aria-label="logout"
            onClick={handleLogout}
            title="Logout"
          >
            🚪
          </button>
        </div>
      </header>

      <div className="body">
        <aside className="sidebar">
          {filteredMenu.map((m) => {
            // Render divider
            if (m.isDivider) {
              return (
                <div
                  key={m.key}
                  style={{
                    height: 1,
                    background: "#d1d5db",
                    margin: "12px 16px",
                  }}
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
                    `side-item ${isActive ? "active" : ""}`
                  }
                  style={{ textDecoration: "none" }}
                >
                  <span className="side-label">{m.label}</span>
                </NavLink>
              );
            }

            // Render group with children
            return (
              <div key={m.key} className="side-group">
                <div className="side-group-title">
                  <span className="side-label">{m.label}</span>
                  <span className="side-caret">▾</span>
                </div>

                <div className="side-group-children">
                  {m.children.map((c) => (
                    <NavLink
                      key={c.key}
                      to={c.to}
                      end
                      className={({ isActive }) =>
                        `side-child ${isActive ? "active" : ""}`
                      }
                      style={{ textDecoration: "none" }}
                    >
                      {c.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </aside>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
