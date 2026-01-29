import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "../../styles/MainLayout.css";
import { ROLES, hasRole } from "../../constants/roles";
import { authService } from "../../services/authService";

const MENU_CONFIG = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "📊",
    to: "/staff/dashboard",
    // No specific role required = visible to everyone in staff portal
  },

  // ADMIN Section
  {
    key: "admin",
    label: "Admin",
    icon: "🛡️",
    roles: [ROLES.ADMIN],
    children: [
      { key: "users", label: "Users", to: "/staff/users" },
      { key: "departments", label: "Departments", to: "/staff/departments" },
      { key: "positions", label: "Positions", to: "/staff/positions" },
    ]
  },

  // HR Section
  {
    key: "recruitment",
    label: "Recruitment",
    icon: "📌",
    roles: [ROLES.HR_MANAGER, ROLES.HR_STAFF, ROLES.ADMIN],
    children: [
      { key: "vacancyAdd", label: "Add Vacancy", to: "/staff/vacancies/add" },
      { key: "vacancyList", label: "Vacancy List", to: "/staff/vacancies" },
    ]
  },
  {
    key: "candidates",
    label: "Candidates",
    icon: "🧑‍💼",
    roles: [ROLES.HR_MANAGER, ROLES.HR_STAFF, ROLES.ADMIN],
    children: [
      { key: "allCandidates", label: "All Candidates", to: "/staff/candidates" },
      { key: "interviewCandidates", label: "Interviewing", to: "/staff/interview-candidates" },
      { key: "canceledCandidates", label: "Canceled", to: "/staff/canceled-candidates" },
    ]
  },
  {
    key: "interviews",
    label: "Interviews",
    icon: "🗓️",
    to: "/staff/interviews",
    roles: [ROLES.HR_MANAGER, ROLES.HR_STAFF, ROLES.DEPARTMENT_MANAGER, ROLES.ADMIN]
  },
  {
    key: "communication",
    label: "Communication",
    icon: "✉️",
    to: "/staff/mail-history",
    roles: [ROLES.HR_MANAGER, ROLES.HR_STAFF, ROLES.ADMIN]
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
    navigate('/login');
  };

  // Filter menu based on roles
  const getFilteredMenu = () => {
    if (!user || !user.roles) return [];

    return MENU_CONFIG.filter(item => {
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
          <button className="icon-btn" aria-label="menu">☰</button>
        </div>

        <div className="topbar-right">
          <div className="user-info" style={{ marginRight: 16, fontSize: 13, textAlign: 'right' }}>
            <div style={{ fontWeight: 600 }}>{user?.fullName}</div>
            <div style={{ color: '#666', fontSize: 11 }}>{user?.roles?.join(', ')}</div>
          </div>
          <button className="icon-btn" aria-label="logout" onClick={handleLogout} title="Logout">🚪</button>
        </div>
      </header>

      <div className="body">
        <aside className="sidebar">
          {filteredMenu.map((m) => {
            if (!m.children) {
              return (
                <NavLink
                  key={m.key}
                  to={m.to}
                  end
                  className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}
                  style={{ textDecoration: "none" }}
                >
                  <span className="side-ic">{m.icon}</span>
                  <span className="side-label">{m.label}</span>
                </NavLink>
              );
            }

            return (
              <div key={m.key} className="side-group">
                <div className="side-group-title">
                  <span className="side-ic">{m.icon}</span>
                  <span className="side-label">{m.label}</span>
                  <span className="side-caret">▾</span>
                </div>

                <div className="side-group-children">
                  {m.children.map((c) => (
                    <NavLink
                      key={c.key}
                      to={c.to}
                      end
                      className={({ isActive }) => `side-child ${isActive ? "active" : ""}`}
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
