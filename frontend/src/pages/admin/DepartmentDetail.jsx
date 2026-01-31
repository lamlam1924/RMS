import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageShell from "../../layouts/PageShell";
import { departmentService, userService } from "../../services/adminService";

export default function DepartmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const isEdit = window.location.pathname.includes("/edit");

  const [department, setDepartment] = useState({
    departmentName: "",
    description: "",
    managerId: "",
    isActive: true,
  });
  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load potential managers (users with manager roles)
      const usersData = await userService.getAll();
      setManagers(
        usersData.filter(
          (u) =>
            u.roleName?.toLowerCase().includes("manager") ||
            u.roleName?.toLowerCase().includes("director"),
        ),
      );

      // Load department data if editing
      if (!isNew) {
        const deptData = await departmentService.getById(id);
        setDepartment(deptData);

        // Load employees of this department
        const deptEmployees = usersData.filter(
          (u) => u.departmentId === parseInt(id),
        );
        setEmployees(deptEmployees);
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
        await departmentService.create(department);
        alert("Department created successfully!");
      } else {
        await departmentService.update(id, department);
        alert("Department updated successfully!");
      }

      navigate("/admin/departments");
    } catch (err) {
      alert("Error saving department: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDepartment((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  if (loading) {
    return (
      <PageShell title={isNew ? "New Department" : "Department Details"}>
        <div style={centerText}>Loading...</div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title={isNew ? "New Department" : "Department Details"}>
        <div style={{ ...centerText, color: "red" }}>Error: {error}</div>
      </PageShell>
    );
  }

  // View mode
  if (!isNew && !isEdit) {
    return (
      <PageShell
        title="Department Details"
        right={
          <div style={actionButtons}>
            <button
              style={btnSecondary}
              onClick={() => navigate("/admin/departments")}
            >
              ← Back
            </button>
            <button
              style={btnPrimary}
              onClick={() => navigate(`/admin/departments/${id}/edit`)}
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
              <DetailItem
                label="Department Name"
                value={department.departmentName}
              />
              <DetailItem
                label="Status"
                value={
                  <span
                    style={department.isActive ? statusActive : statusInactive}
                  >
                    {department.isActive ? "Active" : "Inactive"}
                  </span>
                }
              />
            </div>
            <div style={{ marginTop: "16px" }}>
              <DetailItem label="Description" value={department.description} />
            </div>
          </div>

          <div style={detailSection}>
            <h3 style={sectionTitle}>Management</h3>
            <div style={detailGrid}>
              <DetailItem
                label="Manager"
                value={department.managerName || "Not assigned"}
              />
              <DetailItem label="Total Employees" value={employees.length} />
            </div>
          </div>

          {employees.length > 0 && (
            <div style={detailSection}>
              <h3 style={sectionTitle}>Employees</h3>
              <div style={employeeList}>
                {employees.map((emp) => (
                  <div key={emp.userId} style={employeeCard}>
                    <div style={employeeInfo}>
                      <div style={employeeName}>{emp.fullName}</div>
                      <div style={employeeRole}>{emp.roleName}</div>
                    </div>
                    <div style={employeeEmail}>{emp.email}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={detailSection}>
            <h3 style={sectionTitle}>System Information</h3>
            <div style={detailGrid}>
              <DetailItem
                label="Created At"
                value={
                  department.createdAt
                    ? new Date(department.createdAt).toLocaleString()
                    : "N/A"
                }
              />
              <DetailItem
                label="Updated At"
                value={
                  department.updatedAt
                    ? new Date(department.updatedAt).toLocaleString()
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
      title={isNew ? "Create New Department" : "Edit Department"}
      right={
        <button
          style={btnSecondary}
          onClick={() => navigate("/admin/departments")}
        >
          ← Cancel
        </button>
      }
    >
      <form onSubmit={handleSubmit} style={formCard}>
        <div style={formSection}>
          <h3 style={sectionTitle}>Basic Information</h3>

          <FormField label="Department Name" required>
            <input
              type="text"
              name="departmentName"
              value={department.departmentName}
              onChange={handleChange}
              required
              style={input}
              placeholder="Enter department name"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              name="description"
              value={department.description}
              onChange={handleChange}
              style={{ ...input, minHeight: "100px", resize: "vertical" }}
              placeholder="Enter department description"
            />
          </FormField>
        </div>

        <div style={formSection}>
          <h3 style={sectionTitle}>Management</h3>

          <FormField label="Manager">
            <select
              name="managerId"
              value={department.managerId}
              onChange={handleChange}
              style={select}
            >
              <option value="">Select a manager...</option>
              {managers.map((manager) => (
                <option key={manager.userId} value={manager.userId}>
                  {manager.fullName} ({manager.roleName})
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
                checked={department.isActive}
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
            onClick={() => navigate("/admin/departments")}
          >
            Cancel
          </button>
          <button type="submit" style={btnPrimary} disabled={saving}>
            {saving
              ? "Saving..."
              : isNew
                ? "Create Department"
                : "Update Department"}
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

const employeeList = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: "12px",
};

const employeeCard = {
  padding: "16px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  border: "1px solid #e9ecef",
};

const employeeInfo = {
  marginBottom: "8px",
};

const employeeName = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#333",
};

const employeeRole = {
  fontSize: "13px",
  color: "#6c757d",
  marginTop: "4px",
};

const employeeEmail = {
  fontSize: "13px",
  color: "#6c757d",
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
  boxSizing: "border-box",
  fontFamily: "inherit",
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
