import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../../layouts/PageShell";
import { departmentService, userService } from "../../services/adminService";
import notify from "../../utils/notification";
import {
  ViewIcon,
  EditIcon,
  LockIcon,
  UnlockIcon,
} from "../../components/admin/ActionIcons";
export default function DepartmentList() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentService.getAll();
      setDepartments(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error loading departments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    notify.confirm(
      "Are you sure you want to delete this department?",
      async () => {
        try {
          await departmentService.delete(id);
          notify.success('Xóa phòng ban thành công');
          loadDepartments();
        } catch (err) {
          notify.error("Lỗi khi xóa phòng ban: " + err.message);
        }
      }
    );
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await departmentService.updateStatus(id, !currentStatus);
      notify.success('Cập nhật trạng thái thành công');
      loadDepartments();
    } catch (err) {
      notify.error("Lỗi khi cập nhật trạng thái: " + err.message);
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch =
      dept.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      !filterStatus ||
      (filterStatus === "active" && dept.isActive) ||
      (filterStatus === "inactive" && !dept.isActive);
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <PageShell title="Department Management">
        <div style={centerText}>Loading...</div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Department Management">
        <div style={{ ...centerText, color: "red" }}>Error: {error}</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Department Management"
      right={
        <button
          style={btnPrimary}
          onClick={() => navigate("/staff/admin/departments/new")}
        >
          + Add New Department
        </button>
      }
    >
      {/* Filters */}
      <div style={filterContainer}>
        <input
          type="text"
          placeholder="🔍 Search departments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchInput}
        />
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

      {/* Department Cards */}
      <div style={cardGrid}>
        {filteredDepartments.length === 0 ? (
          <div style={centerText}>No departments found</div>
        ) : (
          filteredDepartments.map((dept) => (
            <div key={dept.departmentId} style={deptCard}>
              <div style={cardHeader}>
                <div>
                  <h3 style={deptTitle}>{dept.departmentName}</h3>
                  <span style={dept.isActive ? statusActive : statusInactive}>
                    {dept.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div style={actionButtons}>
                  <button
                    style={{ ...btnIcon, color: "#3b82f6" }}
                    onClick={() =>
                      navigate(`/staff/admin/departments/${dept.departmentId}`)
                    }
                    title="View Details"
                  >
                    <ViewIcon />
                  </button>
                  <button
                    style={{ ...btnIcon, color: "#10b981" }}
                    onClick={() =>
                      navigate(`/staff/admin/departments/${dept.departmentId}/edit`)
                    }
                    title="Edit"
                  >
                    <EditIcon />
                  </button>
                  <button
                    style={{
                      ...btnIcon,
                      color: dept.isActive ? "#f59e0b" : "#8b5cf6",
                    }}
                    onClick={() =>
                      handleToggleStatus(dept.departmentId, dept.isActive)
                    }
                    title={dept.isActive ? "Deactivate" : "Activate"}
                  >
                    {dept.isActive ? <LockIcon /> : <UnlockIcon />}
                  </button>
                </div>
              </div>

              <p style={deptDescription}>
                {dept.description || "No description available"}
              </p>

              <div style={deptInfo}>
                <div style={infoItem}>
                  <span style={infoLabel}>Manager:</span>
                  <span style={infoValue}>
                    {dept.managerName || "Not assigned"}
                  </span>
                </div>
                <div style={infoItem}>
                  <span style={infoLabel}>Employees:</span>
                  <span style={infoValue}>👥 {dept.employeeCount || 0}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div style={summary}>
        Total: {filteredDepartments.length} department(s)
        {searchTerm || filterStatus
          ? ` (filtered from ${departments.length})`
          : ""}
      </div>
    </PageShell>
  );
}

// Styles
const filterContainer = {
  display: "flex",
  gap: "12px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const searchInput = {
  flex: "1",
  minWidth: "250px",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "14px",
};

const filterSelect = {
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "14px",
  backgroundColor: "white",
  cursor: "pointer",
};

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
  gap: "20px",
  marginBottom: "20px",
};

const deptCard = {
  backgroundColor: "white",
  borderRadius: "12px",
  padding: "24px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  transition: "transform 0.2s, box-shadow 0.2s",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "16px",
};

const deptTitle = {
  margin: "0 0 8px 0",
  fontSize: "20px",
  fontWeight: "600",
  color: "#333",
};

const deptDescription = {
  fontSize: "14px",
  color: "#6c757d",
  lineHeight: "1.5",
  marginBottom: "16px",
  minHeight: "42px",
};

const deptInfo = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  paddingTop: "16px",
  borderTop: "1px solid #e9ecef",
};

const infoItem = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const infoLabel = {
  fontSize: "13px",
  color: "#6c757d",
  fontWeight: "500",
};

const infoValue = {
  fontSize: "14px",
  color: "#333",
  fontWeight: "500",
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
};

const btnIcon = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: "18px",
  padding: "4px",
  transition: "transform 0.2s",
};

const actionButtons = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
};

const statusActive = {
  padding: "4px 12px",
  borderRadius: "12px",
  backgroundColor: "#d4edda",
  color: "#155724",
  fontSize: "12px",
  fontWeight: "500",
};

const statusInactive = {
  padding: "4px 12px",
  borderRadius: "12px",
  backgroundColor: "#f8d7da",
  color: "#721c24",
  fontSize: "12px",
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
  color: "#6c757d",
};
