import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../../layouts/PageShell";
import { roleService } from "../../services/adminService";
import {
  ViewIcon,
  EditIcon,
  DeleteIcon,
} from "../../components/admin/ActionIcons";

export default function RoleList() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await roleService.getAll();
      setRoles(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error loading roles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;

    try {
      await roleService.delete(id);
      loadRoles();
    } catch (err) {
      alert("Error deleting role: " + err.message);
    }
  };

  const filteredRoles = roles.filter((role) => {
    return (
      role.roleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <PageShell title="Role Management">
        <div style={centerText}>Loading...</div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title="Role Management">
        <div style={{ ...centerText, color: "red" }}>Error: {error}</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Role Management"
      right={
        <button style={btnPrimary} onClick={() => navigate("/admin/roles/new")}>
          + Add New Role
        </button>
      }
    >
      {/* Search */}
      <div style={filterContainer}>
        <input
          type="text"
          placeholder="🔍 Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={searchInput}
        />
      </div>

      {/* Role Cards */}
      <div style={cardGrid}>
        {filteredRoles.length === 0 ? (
          <div style={centerText}>No roles found</div>
        ) : (
          filteredRoles.map((role) => (
            <div key={role.roleId} style={roleCard}>
              <div style={cardHeader}>
                <h3 style={roleTitle}>{role.roleName}</h3>
                <div style={actionButtons}>
                  <button
                    style={{ ...btnIcon, color: "#3b82f6" }}
                    onClick={() => navigate(`/admin/roles/${role.roleId}`)}
                    title="View Details"
                  >
                    <ViewIcon />
                  </button>
                  <button
                    style={{ ...btnIcon, color: "#10b981" }}
                    onClick={() => navigate(`/admin/roles/${role.roleId}/edit`)}
                    title="Edit"
                  >
                    <EditIcon />
                  </button>
                  <button
                    style={{ ...btnIcon, color: "#ef4444" }}
                    onClick={() => handleDelete(role.roleId)}
                    title="Delete"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>

              <p style={roleDescription}>
                {role.description || "No description available"}
              </p>

              <div style={roleFooter}>
                <span style={userCount}>👥 {role.userCount || 0} users</span>
                {role.isSystemRole && (
                  <span style={systemBadge}>System Role</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div style={summary}>
        Total: {filteredRoles.length} role(s)
        {searchTerm ? ` (filtered from ${roles.length})` : ""}
      </div>
    </PageShell>
  );
}

// Styles
const filterContainer = {
  marginBottom: "24px",
};

const searchInput = {
  width: "100%",
  maxWidth: "400px",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  fontSize: "14px",
};

const cardGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: "20px",
  marginBottom: "20px",
};

const roleCard = {
  backgroundColor: "white",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  transition: "transform 0.2s, box-shadow 0.2s",
  cursor: "pointer",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "12px",
};

const roleTitle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: "600",
  color: "#333",
  flex: 1,
};

const roleDescription = {
  fontSize: "14px",
  color: "#6c757d",
  lineHeight: "1.5",
  marginBottom: "16px",
  minHeight: "42px",
};

const roleFooter = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: "12px",
  borderTop: "1px solid #e9ecef",
};

const userCount = {
  fontSize: "13px",
  color: "#6c757d",
  fontWeight: "500",
};

const systemBadge = {
  padding: "4px 10px",
  borderRadius: "12px",
  backgroundColor: "#fff3cd",
  color: "#856404",
  fontSize: "12px",
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
