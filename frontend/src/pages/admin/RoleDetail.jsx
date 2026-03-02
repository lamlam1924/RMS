import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PageShell from "../../layouts/PageShell";
import { roleService } from "../../services/adminService";

export default function RoleDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isNew = id === "new" || (id === undefined && location.pathname.endsWith("/new"));
  const isEdit = location.pathname.includes("/edit");
  const isValidId = isNew || (id != null && id !== "undefined" && !Number.isNaN(Number(id)));

  const [role, setRole] = useState({
    roleName: "",
    code: "",
    description: "",
    permissions: [],
  });
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!isValidId && !isNew) {
      navigate("/staff/admin/roles", { replace: true });
      return;
    }
    loadData();
  }, [id, isValidId]);

  const loadData = async () => {
    try {
      if (!isNew) setLoading(true);

      try {
        const permissions = await roleService.getPermissions();
        setAvailablePermissions(permissions || []);
      } catch {
        setAvailablePermissions([]);
      }

      if (!isNew && id != null && id !== "undefined") {
        const roleData = await roleService.getById(id);
        setRole({
          roleName: roleData.roleName ?? "",
          code: roleData.code ?? "",
          description: roleData.description ?? "",
          permissions: roleData.permissions || [],
        });
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
    setSubmitError(null);
    try {
      setSaving(true);
      if (isNew) {
        await roleService.create(role);
        alert("Tạo vai trò thành công!");
        navigate("/staff/admin/roles");
      } else {
        await roleService.update(id, role);
        alert("Cập nhật vai trò thành công!");
        navigate("/staff/admin/roles");
      }
    } catch (err) {
      setSubmitError(err.message || "Không thể lưu. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRole((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePermissionToggle = (permissionId) => {
    setRole((prev) => {
      const permissions = prev.permissions || [];
      const hasPermission = permissions.includes(permissionId);

      return {
        ...prev,
        permissions: hasPermission
          ? permissions.filter((id) => id !== permissionId)
          : [...permissions, permissionId],
      };
    });
  };

  if (!isValidId && !isNew) return null;
  if (loading && !isNew) {
    return (
      <PageShell title="Role Details">
        <div style={centerText}>Loading...</div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell title={isNew ? "New Role" : "Role Details"}>
        <div style={{ ...centerText, color: "red" }}>Error: {error}</div>
      </PageShell>
    );
  }

  // View mode
  if (!isNew && !isEdit) {
    return (
      <PageShell
        title="Role Details"
        right={
          <div style={actionButtons}>
            <button
              style={btnSecondary}
              onClick={() => navigate("/staff/admin/roles")}
            >
              ← Back
            </button>
            <button
              style={btnPrimary}
              onClick={() => navigate(`/staff/admin/roles/${id}/edit`)}
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
              <DetailItem label="Role Name" value={role.roleName} />
              <DetailItem label="Code" value={role.code} />
              <DetailItem
                label="System Role"
                value={role.isSystemRole ? "Yes" : "No"}
              />
            </div>
            <div style={{ marginTop: "16px" }}>
              <DetailItem label="Description" value={role.description} />
            </div>
          </div>

          <div style={detailSection}>
            <h3 style={sectionTitle}>Permissions</h3>
            <div style={permissionGrid}>
              {role.permissions && role.permissions.length > 0 ? (
                role.permissions.map((permission) => (
                  <div key={permission} style={permissionBadge}>
                    ✓ {permission}
                  </div>
                ))
              ) : (
                <div style={centerText}>No permissions assigned</div>
              )}
            </div>
          </div>

          <div style={detailSection}>
            <h3 style={sectionTitle}>Statistics</h3>
            <div style={detailGrid}>
              <DetailItem
                label="Users with this role"
                value={role.userCount || 0}
              />
              <DetailItem
                label="Created At"
                value={
                  role.createdAt
                    ? new Date(role.createdAt).toLocaleString()
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
      title={isNew ? "Create New Role" : "Edit Role"}
      right={
        <button style={btnSecondary} onClick={() => navigate("/staff/admin/roles")}>
          ← Cancel
        </button>
      }
    >
      <form onSubmit={handleSubmit} style={formCard}>
        {submitError && (
          <div style={{ marginBottom: 16, padding: 12, background: "#fef2f2", color: "#b91c1c", borderRadius: 8 }}>
            {submitError}
          </div>
        )}
        <div style={formSection}>
          <h3 style={sectionTitle}>Basic Information</h3>

          <FormField label="Role Name" required>
            <input
              type="text"
              name="roleName"
              value={role.roleName}
              onChange={handleChange}
              required
              style={input}
              placeholder="Nhập tên vai trò"
            />
          </FormField>

          {isNew && (
            <FormField label="Code" required>
              <input
                type="text"
                name="code"
                value={role.code}
                onChange={handleChange}
                required
                style={input}
                placeholder="VD: CUSTOM_ROLE (viết hoa, gạch dưới)"
              />
            </FormField>
          )}
          {!isNew && role.code && (
            <FormField label="Code">
              <input type="text" value={role.code} readOnly style={{ ...input, backgroundColor: "#f1f5f9", cursor: "not-allowed" }} />
            </FormField>
          )}

          <FormField label="Description">
            <textarea
              name="description"
              value={role.description}
              onChange={handleChange}
              style={{ ...input, minHeight: "100px", resize: "vertical" }}
              placeholder="Enter role description"
            />
          </FormField>
        </div>

        <div style={formSection}>
          <h3 style={sectionTitle}>Permissions</h3>
          <div style={permissionCheckboxGrid}>
            {availablePermissions.length > 0 ? (
              availablePermissions.map((permission) => (
                <label key={permission.id} style={checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={role.permissions?.includes(permission.id) || false}
                    onChange={() => handlePermissionToggle(permission.id)}
                    style={checkbox}
                  />
                  <div>
                    <div style={permissionName}>{permission.name}</div>
                    {permission.description && (
                      <div style={permissionDesc}>{permission.description}</div>
                    )}
                  </div>
                </label>
              ))
            ) : (
              <div style={centerText}>No permissions available</div>
            )}
          </div>
        </div>

        <div style={formActions}>
          <button
            type="button"
            style={btnSecondary}
            onClick={() => navigate("/staff/admin/roles")}
          >
            Cancel
          </button>
          <button type="submit" style={btnPrimary} disabled={saving}>
            {saving ? "Saving..." : isNew ? "Create Role" : "Update Role"}
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
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const checkbox = {
  marginRight: "12px",
  cursor: "pointer",
  width: "18px",
  height: "18px",
};

const checkboxLabel = {
  display: "flex",
  alignItems: "flex-start",
  padding: "12px",
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "background-color 0.2s",
};

const permissionCheckboxGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
  gap: "12px",
};

const permissionName = {
  fontSize: "14px",
  fontWeight: "500",
  color: "#333",
};

const permissionDesc = {
  fontSize: "12px",
  color: "#6c757d",
  marginTop: "4px",
};

const permissionGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: "12px",
};

const permissionBadge = {
  padding: "8px 12px",
  borderRadius: "8px",
  backgroundColor: "#e7f3ff",
  color: "#0056b3",
  fontSize: "13px",
  fontWeight: "500",
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

const centerText = {
  textAlign: "center",
  padding: "40px",
  fontSize: "16px",
  color: "#6c757d",
};
