import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../../layouts/PageShell";
import { userService } from "../../services/adminService";
import notify from "../../utils/notification";
import {
  ViewIcon,
  EditIcon,
  LockIcon,
  UnlockIcon,
  KeyIcon,
  DeleteIcon,
} from "../../components/admin/ActionIcons";

export default function UserList() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    notify.confirm(
      "Are you sure you want to delete this user?",
      async () => {
        try {
          await userService.delete(id);
          notify.success('Xóa người dùng thành công');
          loadUsers();
        } catch (err) {
          notify.error("Lỗi khi xóa người dùng: " + err.message);
        }
      }
    );
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await userService.updateStatus(id, !currentStatus);
      notify.success('Cập nhật trạng thái thành công');
      loadUsers();
    } catch (err) {
      notify.error("Lỗi khi cập nhật trạng thái: " + err.message);
    }
  };

  const handleResetPassword = async (id) => {
    notify.confirm(
      "Are you sure you want to reset this user's password?",
      async () => {
        try {
          const result = await userService.resetPassword(id);
          notify.success(`Reset mật khẩu thành công. Mật khẩu mới: ${result.newPassword}`, { duration: 8000 });
        } catch (err) {
          notify.error("Lỗi khi reset mật khẩu: " + err.message);
        }
      }
    );
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.roleName === filterRole;
    const matchesStatus =
      !filterStatus ||
      (filterStatus === "active" && user.isActive) ||
      (filterStatus === "inactive" && !user.isActive);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const uniqueRoles = [
    ...new Set(users.map((u) => u.roleName).filter(Boolean)),
  ];

  if (loading) {
    return (
      <PageShell title="User Management">
        <div style={centerText}>Loading...</div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="User Management">
        <div style={{ ...centerText, color: "red" }}>Error: {error}</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="User Management"
      right={
        <button style={btnPrimary} onClick={() => navigate("/staff/admin/users/new")}>
          + Add New User
        </button>
      }
    >
      {/* Filters */}
      <div style={filterContainer}>
        <input
          type="text"
          placeholder="🔍 Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchInput}
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={filterSelect}
        >
          <option value="">All Roles</option>
          {uniqueRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={filterSelect}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* User Table */}
      <div style={tableContainer}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Full Name</th>
              <th style={th}>Email</th>
              <th style={th}>Role</th>
              <th style={th}>Department</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ ...td, textAlign: "center" }}>
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.userId} style={tr}>
                  <td style={td}>{user.fullName || "N/A"}</td>
                  <td style={td}>{user.email}</td>
                  <td style={td}>
                    <span style={roleBadge}>{user.roleName || "N/A"}</span>
                  </td>
                  <td style={td}>{user.departmentName || "N/A"}</td>
                  <td style={td}>
                    <span style={user.isActive ? statusActive : statusInactive}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={td}>
                    <div style={actionButtons}>
                      <button
                        style={{ ...btnIcon, color: "#3b82f6" }}
                        onClick={() => navigate(`/staff/admin/users/${user.userId}`)}
                        title="View Details"
                      >
                        <ViewIcon />
                      </button>
                      <button
                        style={{ ...btnIcon, color: "#10b981" }}
                        onClick={() =>
                          navigate(`/staff/admin/users/${user.userId}/edit`)
                        }
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        style={{
                          ...btnIcon,
                          color: user.isActive ? "#f59e0b" : "#8b5cf6",
                        }}
                        onClick={() =>
                          handleToggleStatus(user.userId, user.isActive)
                        }
                        title={
                          user.isActive ? "Deactivate User" : "Activate User"
                        }
                      >
                        {user.isActive ? <LockIcon /> : <UnlockIcon />}
                      </button>
                      <button
                        style={{ ...btnIcon, color: "#6366f1" }}
                        onClick={() => handleResetPassword(user.userId)}
                        title="Reset Password"
                      >
                        <KeyIcon />
                      </button>
                      <button
                        style={{ ...btnIcon, color: "#ef4444" }}
                        onClick={() => handleDelete(user.userId)}
                        title="Delete"
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div style={summary}>
        Total: {filteredUsers.length} user(s)
        {searchTerm || filterRole || filterStatus
          ? ` (filtered from ${users.length})`
          : ""}
      </div>
    </PageShell>
  );
}

// Styles
const filterContainer = {
  display: "flex",
  gap: "12px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const searchInput = {
  flex: "1",
  minWidth: "250px",
  padding: "10px 15px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "14px",
};

const filterSelect = {
  padding: "10px 15px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "14px",
  backgroundColor: "white",
  cursor: "pointer",
};

const tableContainer = {
  overflowX: "auto",
  backgroundColor: "white",
  borderRadius: "10px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "800px",
};

const th = {
  padding: "15px",
  textAlign: "left",
  fontWeight: "600",
  color: "#333",
  backgroundColor: "#f8f9fa",
  borderBottom: "2px solid #dee2e6",
  fontSize: "14px",
};

const tr = {
  borderBottom: "1px solid #dee2e6",
  transition: "background-color 0.2s",
  ":hover": {
    backgroundColor: "#f8f9fa",
  },
};

const td = {
  padding: "15px",
  fontSize: "14px",
  color: "#495057",
};

const btnPrimary = {
  height: 38,
  padding: "0 20px",
  borderRadius: 8,
  border: "none",
  backgroundColor: "#007bff",
  color: "white",
  fontWeight: "500",
  cursor: "pointer",
  fontSize: "14px",
  transition: "background-color 0.2s",
};

const btnIcon = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "6px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "4px",
  transition: "background-color 0.2s, transform 0.1s",
};

const actionButtons = {
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

const summary = {
  marginTop: "16px",
  padding: "12px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  fontSize: "14px",
  color: "#6c757d",
};

const centerText = {
  textAlign: "center",
  padding: "40px",
  fontSize: "16px",
};
