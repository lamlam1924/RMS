import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageShell from "../../layouts/PageShell";
import {
  userService,
  roleService,
  departmentService,
} from "../../services/adminService";

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const isEdit = window.location.pathname.includes("/edit");

  const [user, setUser] = useState({
    email: "",
    fullName: "",
    phoneNumber: "",
    roleId: "",
    departmentId: "",
    isActive: true,
    password: "",
  });
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load roles and departments
      const [rolesData, deptData] = await Promise.all([
        roleService.getAll(),
        departmentService.getAll(),
      ]);
      setRoles(rolesData);
      setDepartments(deptData);

      // Load user data if editing
      if (!isNew) {
        const userData = await userService.getById(id);
        setUser(userData);
      }

      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      if (isNew) {
        await userService.create(user);
        alert("User created successfully!");
      } else {
        await userService.update(id, user);
        alert("User updated successfully!");
      }

      navigate("/admin/users");
    } catch (err) {
      alert("Error saving user: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  if (loading) {
    return (
      <PageShell title={isNew ? "New User" : "User Details"}>
        <div style={centerText}>Loading...</div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title={isNew ? "New User" : "User Details"}>
        <div style={{ ...centerText, color: "red" }}>Error: {error}</div>
      </PageShell>
    );
  }

  // View mode
  if (!isNew && !isEdit) {
    return (
      <PageShell
        title="User Details"
        right={
          <div style={actionButtons}>
            <button
              style={btnSecondary}
              onClick={() => navigate("/admin/users")}
            >
              ← Back
            </button>
            <button
              style={btnPrimary}
              onClick={() => navigate(`/admin/users/${id}/edit`)}
            >
              ✏️ Edit
            </button>
          </div>
        }
      >
        <div style={detailCard}>
          <div style={detailSection}>
            <h3 style={sectionTitle}>Basic Information</h3>
            <div style={detailGrid}>
              <DetailItem label="Full Name" value={user.fullName} />
              <DetailItem label="Email" value={user.email} />
              <DetailItem label="Phone Number" value={user.phoneNumber} />
              <DetailItem
                label="Status"
                value={
                  <span style={user.isActive ? statusActive : statusInactive}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                }
              />
            </div>
          </div>

          <div style={detailSection}>
            <h3 style={sectionTitle}>Role & Department</h3>
            <div style={detailGrid}>
              <DetailItem label="Role" value={user.roleName || "N/A"} />
              <DetailItem
                label="Department"
                value={user.departmentName || "N/A"}
              />
            </div>
          </div>

          <div style={detailSection}>
            <h3 style={sectionTitle}>System Information</h3>
            <div style={detailGrid}>
              <DetailItem
                label="Created At"
                value={
                  user.createdAt
                    ? new Date(user.createdAt).toLocaleString()
                    : "N/A"
                }
              />
              <DetailItem
                label="Updated At"
                value={
                  user.updatedAt
                    ? new Date(user.updatedAt).toLocaleString()
                    : "N/A"
                }
              />
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  // Edit/Create mode
  return (
    <PageShell
      title={isNew ? "Create New User" : "Edit User"}
      right={
        <button style={btnSecondary} onClick={() => navigate("/admin/users")}>
          ← Cancel
        </button>
      }
    >
      <form onSubmit={handleSubmit} style={formCard}>
        <div style={formSection}>
          <h3 style={sectionTitle}>Basic Information</h3>

          <FormField label="Full Name" required>
            <input
              type="text"
              name="fullName"
              value={user.fullName}
              onChange={handleChange}
              required
              style={input}
              placeholder="Enter full name"
            />
          </FormField>

          <FormField label="Email" required>
            <input
              type="email"
              name="email"
              value={user.email}
              onChange={handleChange}
              required
              style={input}
              placeholder="user@example.com"
            />
          </FormField>

          <FormField label="Phone Number">
            <input
              type="tel"
              name="phoneNumber"
              value={user.phoneNumber}
              onChange={handleChange}
              style={input}
              placeholder="+84 123 456 789"
            />
          </FormField>

          {isNew && (
            <FormField label="Password" required>
              <input
                type="password"
                name="password"
                value={user.password}
                onChange={handleChange}
                required={isNew}
                style={input}
                placeholder="Enter password"
                minLength="6"
              />
            </FormField>
          )}
        </div>

        <div style={formSection}>
          <h3 style={sectionTitle}>Role & Department</h3>

          <FormField label="Role" required>
            <select
              name="roleId"
              value={user.roleId}
              onChange={handleChange}
              required
              style={select}
            >
              <option value="">Select a role...</option>
              {roles.map((role) => (
                <option key={role.roleId} value={role.roleId}>
                  {role.roleName}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Department">
            <select
              name="departmentId"
              value={user.departmentId}
              onChange={handleChange}
              style={select}
            >
              <option value="">Select a department...</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div style={formSection}>
          <FormField label="">
            <label style={checkboxLabel}>
              <input
                type="checkbox"
                name="isActive"
                checked={user.isActive}
                onChange={handleChange}
                style={checkbox}
              />
              <span>Active</span>
            </label>
          </FormField>
        </div>

        <div style={formActions}>
          <button
            type="button"
            style={btnSecondary}
            onClick={() => navigate("/admin/users")}
          >
            Cancel
          </button>
          <button type="submit" style={btnPrimary} disabled={saving}>
            {saving ? "Saving..." : isNew ? "Create User" : "Update User"}
          </button>
        </div>
      </form>
    </PageShell>
  );
}

// Helper Components
function DetailItem({ label, value }) {
  return (
    <div style={detailItem}>
      <div style={detailLabel}>{label}</div>
      <div style={detailValue}>{value || "N/A"}</div>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div style={formField}>
      {label && (
        <label style={label_style}>
          {label}
          {required && <span style={requiredMark}>*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

// Styles
const detailCard = {
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  padding: "24px",
};

const formCard = {
  backgroundColor: "white",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  padding: "24px",
};

const detailSection = {
  marginBottom: "32px",
};

const formSection = {
  marginBottom: "32px",
};

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#333",
  marginBottom: "16px",
  paddingBottom: "8px",
  borderBottom: "2px solid #e9ecef",
};

const detailGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "16px",
};

const detailItem = {
  padding: "12px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
};

const detailLabel = {
  fontSize: "12px",
  color: "#6c757d",
  fontWeight: "500",
  marginBottom: "4px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const detailValue = {
  fontSize: "15px",
  color: "#333",
  fontWeight: "500",
};

const formField = {
  marginBottom: "20px",
};

const label_style = {
  display: "block",
  fontSize: "14px",
  fontWeight: "500",
  color: "#333",
  marginBottom: "8px",
};

const requiredMark = {
  color: "#dc3545",
  marginLeft: "4px",
};

const input = {
  width: "100%",
  padding: "10px 15px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "14px",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

const select = {
  width: "100%",
  padding: "10px 15px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "14px",
  backgroundColor: "white",
  cursor: "pointer",
  boxSizing: "border-box",
};

const checkbox = {
  marginRight: "8px",
  cursor: "pointer",
};

const checkboxLabel = {
  display: "flex",
  alignItems: "center",
  fontSize: "14px",
  cursor: "pointer",
};

const formActions = {
  display: "flex",
  gap: "12px",
  justifyContent: "flex-end",
  paddingTop: "20px",
  borderTop: "1px solid #e9ecef",
};

const btnPrimary = {
  padding: "10px 24px",
  borderRadius: 8,
  border: "none",
  backgroundColor: "#007bff",
  color: "white",
  fontWeight: "500",
  cursor: "pointer",
  fontSize: "14px",
  transition: "background-color 0.2s",
};

const btnSecondary = {
  padding: "10px 24px",
  borderRadius: 8,
  border: "1px solid #ddd",
  backgroundColor: "white",
  color: "#333",
  fontWeight: "500",
  cursor: "pointer",
  fontSize: "14px",
  transition: "all 0.2s",
};

const actionButtons = {
  display: "flex",
  gap: "12px",
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
};
