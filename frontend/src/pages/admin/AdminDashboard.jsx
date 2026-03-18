import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../../layouts/PageShell";
import {
  userService,
  roleService,
  departmentService,
} from "../../services/adminService";
import { StatsCard } from "../../components/admin";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    totalDepartments: 0,
    activeDepartments: 0,
    recentUsers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      const [users, roles, departments] = await Promise.all([
        userService.getAll(),
        roleService.getAll(),
        departmentService.getAll(),
      ]);

      setStats({
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.isActive).length,
        totalRoles: roles.length,
        totalDepartments: departments.length,
        activeDepartments: departments.filter((d) => d.isActive).length,
        recentUsers: users.slice(0, 5),
      });
    } catch (err) {
      console.error("Error loading stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="Admin Dashboard">
        <div style={centerText}>Loading...</div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Admin Dashboard">
      {/* Stats Overview */}
      <div style={statsGrid}>
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon="👥"
          color="#007bff"
        />
        <StatsCard
          title="Active Users"
          value={stats.activeUsers}
          icon="✓"
          color="#28a745"
        />
        <StatsCard
          title="Total Roles"
          value={stats.totalRoles}
          icon="🎭"
          color="#6f42c1"
        />
        <StatsCard
          title="Total Departments"
          value={stats.totalDepartments}
          icon="🏢"
          color="#fd7e14"
        />
      </div>

      {/* Quick Actions */}
      <div style={section}>
        <h3 style={sectionTitle}>Quick Actions</h3>
        <div style={quickActionsGrid}>
          <QuickActionCard
            title="Manage Users"
            description="View, create, and manage user accounts"
            icon="👥"
            onClick={() => navigate("/staff/admin/users")}
          />
          <QuickActionCard
            title="Manage Roles"
            description="Configure roles and permissions"
            icon="🎭"
            onClick={() => navigate("/staff/admin/roles")}
          />
          <QuickActionCard
            title="Manage Departments"
            description="Organize departments and structure"
            icon="🏢"
            onClick={() => navigate("/staff/admin/departments")}
          />
          <QuickActionCard
            title="System Configuration"
            description="Configure system settings and preferences"
            icon="⚙️"
            onClick={() => navigate("/staff/admin/config")}
          />
        </div>
      </div>

      {/* Recent Users */}
      <div style={section}>
        <h3 style={sectionTitle}>Recently Added Users</h3>
        <div style={userList}>
          {stats.recentUsers.length > 0 ? (
            stats.recentUsers.map((user) => (
              <div key={user.userId} style={userCard}>
                <div style={userInfo}>
                  <div style={userName}>{user.fullName || "N/A"}</div>
                  <div style={userEmail}>{user.email}</div>
                </div>
                <div style={userMeta}>
                  <span style={roleBadge}>{user.roleName}</span>
                  <span style={user.isActive ? statusActive : statusInactive}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div style={centerText}>No users found</div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

// Quick Action Card Component
function QuickActionCard({ title, description, icon, onClick }) {
  return (
    <div style={actionCard} onClick={onClick}>
      <div style={actionIcon}>{icon}</div>
      <h4 style={actionTitle}>{title}</h4>
      <p style={actionDescription}>{description}</p>
    </div>
  );
}

// Styles
const statsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
  marginBottom: "32px",
};

const section = {
  marginBottom: "32px",
};

const sectionTitle = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#333",
  marginBottom: "20px",
};

const quickActionsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
};

const actionCard = {
  backgroundColor: "white",
  borderRadius: "12px",
  padding: "24px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  cursor: "pointer",
  transition: "transform 0.2s, box-shadow 0.2s",
  textAlign: "center",
};

const actionIcon = {
  fontSize: "48px",
  marginBottom: "16px",
};

const actionTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#333",
  marginBottom: "8px",
};

const actionDescription = {
  fontSize: "14px",
  color: "#6c757d",
  lineHeight: "1.5",
};

const userList = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const userCard = {
  backgroundColor: "white",
  borderRadius: "12px",
  padding: "16px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const userInfo = {
  flex: 1,
};

const userName = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#333",
  marginBottom: "4px",
};

const userEmail = {
  fontSize: "14px",
  color: "#6c757d",
};

const userMeta = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
};

const roleBadge = {
  padding: "4px 12px",
  borderRadius: "12px",
  backgroundColor: "#e7f3ff",
  color: "#0056b3",
  fontSize: "13px",
  fontWeight: "500",
};

const statusActive = {
  padding: "4px 12px",
  borderRadius: "12px",
  backgroundColor: "#d4edda",
  color: "#155724",
  fontSize: "13px",
  fontWeight: "500",
};

const statusInactive = {
  padding: "4px 12px",
  borderRadius: "12px",
  backgroundColor: "#f8d7da",
  color: "#721c24",
  fontSize: "13px",
  fontWeight: "500",
};

const centerText = {
  textAlign: "center",
  padding: "40px",
  fontSize: "16px",
  color: "#6c757d",
};
