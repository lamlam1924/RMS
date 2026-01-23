import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./staff-layout.css";

const menu = [
  { key: "dashboard", label: "Dashboard", icon: "📊", to: "/staff/dashboard" },
  { key: "department", label: "Department", icon: "🏢", to: "/staff/departments" },
  { key: "position", label: "Position", icon: "🧩", to: "/staff/positions" },
  { key: "user", label: "User", icon: "👤", to: "/staff/users" },

  // ✅ Vacancy Group
  {
    key: "vacancyGroup",
    label: "Vacancy",
    icon: "📌",
    children: [
      { key: "vacancyAdd", label: "Add Vacancy", to: "/staff/vacancies/add" },
      { key: "vacancyList", label: "Vacancy List", to: "/staff/vacancies" },
    ],
  },

  { key: "candidate", label: "Candidate", icon: "🧑‍💼", to: "/staff/candidates" },
  { key: "interviewCandidate", label: "Interview Candidate", icon: "🗂️", to: "/staff/interview-candidates" },
  { key: "canceledCandidate", label: "Canceled Candidate", icon: "⛔", to: "/staff/canceled-candidates" },
  { key: "interview", label: "Interview", icon: "🗓️", to: "/staff/interviews" },
  { key: "mailHistory", label: "Mail History", icon: "✉️", to: "/staff/mail-history" },
];

export default function StaffLayout() {
  return (
    <div className="staff-shell">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <div className="brand-logo">ACE</div>
            <div className="brand-sub">Data Systems Ltd.</div>
          </div>
          <button className="icon-btn" aria-label="menu">☰</button>
        </div>

        <div className="topbar-right">
          <button className="icon-btn" aria-label="mail">✉️</button>
          <button className="icon-btn" aria-label="bell">🔔</button>
          <button className="avatar" aria-label="user">👤</button>
        </div>
      </header>

      <div className="body">
        <aside className="sidebar">
          {menu.map((m) => {
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
