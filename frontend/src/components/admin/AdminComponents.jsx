import React from "react";

/**
 * Status Badge Component
 */
export function StatusBadge({ status, type = "default" }) {
  const style = getStatusStyle(status, type);
  return <span style={style}>{status}</span>;
}

/**
 * Action Button Component
 */
export function ActionButton({ icon, onClick, title, variant = "default" }) {
  return (
    <button
      style={getButtonStyle(variant)}
      onClick={onClick}
      title={title}
      type="button"
    >
      {icon}
    </button>
  );
}

/**
 * Stats Card Component
 */
export function StatsCard({ title, value, icon, color = "#007bff" }) {
  return (
    <div style={statsCard}>
      <div style={{ ...statsIcon, backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <div style={statsContent}>
        <div style={statsTitle}>{title}</div>
        <div style={statsValue}>{value}</div>
      </div>
    </div>
  );
}

/**
 * Empty State Component
 */
export function EmptyState({ icon = "📭", title, message, action }) {
  return (
    <div style={emptyState}>
      <div style={emptyIcon}>{icon}</div>
      <h3 style={emptyTitle}>{title}</h3>
      {message && <p style={emptyMessage}>{message}</p>}
      {action && <div style={{ marginTop: "20px" }}>{action}</div>}
    </div>
  );
}

/**
 * Loading Spinner Component
 */
export function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div style={loadingContainer}>
      <div style={spinner}></div>
      <p style={loadingMessage}>{message}</p>
    </div>
  );
}

/**
 * Confirm Dialog Component
 */
export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div style={dialogOverlay} onClick={onCancel}>
      <div style={dialogBox} onClick={(e) => e.stopPropagation()}>
        <h3 style={dialogTitle}>{title}</h3>
        <p style={dialogMessage}>{message}</p>
        <div style={dialogActions}>
          <button style={btnSecondary} onClick={onCancel}>
            Cancel
          </button>
          <button style={btnDanger} onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getStatusStyle(status, type) {
  const baseStyle = {
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: "500",
    display: "inline-block",
  };

  if (type === "active" || status.toLowerCase() === "active") {
    return { ...baseStyle, backgroundColor: "#d4edda", color: "#155724" };
  } else if (type === "inactive" || status.toLowerCase() === "inactive") {
    return { ...baseStyle, backgroundColor: "#f8d7da", color: "#721c24" };
  } else if (type === "pending" || status.toLowerCase() === "pending") {
    return { ...baseStyle, backgroundColor: "#fff3cd", color: "#856404" };
  }
  
  return { ...baseStyle, backgroundColor: "#e7f3ff", color: "#0056b3" };
}

function getButtonStyle(variant) {
  const baseStyle = {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    padding: "4px",
    transition: "transform 0.2s",
  };

  if (variant === "danger") {
    return { ...baseStyle, color: "#dc3545" };
  } else if (variant === "success") {
    return { ...baseStyle, color: "#28a745" };
  } else if (variant === "warning") {
    return { ...baseStyle, color: "#ffc107" };
  }
  
  return baseStyle;
}

// Styles
const statsCard = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  backgroundColor: "white",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const statsIcon = {
  width: "50px",
  height: "50px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "24px",
};

const statsContent = {
  flex: 1,
};

const statsTitle = {
  fontSize: "13px",
  color: "#6c757d",
  marginBottom: "4px",
  fontWeight: "500",
};

const statsValue = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#333",
};

const emptyState = {
  textAlign: "center",
  padding: "60px 20px",
};

const emptyIcon = {
  fontSize: "64px",
  marginBottom: "16px",
};

const emptyTitle = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#333",
  marginBottom: "8px",
};

const emptyMessage = {
  fontSize: "14px",
  color: "#6c757d",
  maxWidth: "400px",
  margin: "0 auto",
};

const loadingContainer = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "60px 20px",
};

const spinner = {
  width: "40px",
  height: "40px",
  border: "4px solid #f3f3f3",
  borderTop: "4px solid #007bff",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const loadingMessage = {
  marginTop: "16px",
  fontSize: "14px",
  color: "#6c757d",
};

const dialogOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const dialogBox = {
  backgroundColor: "white",
  borderRadius: "12px",
  padding: "24px",
  maxWidth: "400px",
  width: "90%",
  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
};

const dialogTitle = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#333",
  marginBottom: "12px",
};

const dialogMessage = {
  fontSize: "14px",
  color: "#6c757d",
  marginBottom: "24px",
  lineHeight: "1.5",
};

const dialogActions = {
  display: "flex",
  gap: "12px",
  justifyContent: "flex-end",
};

const btnSecondary = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "1px solid #ddd",
  backgroundColor: "white",
  color: "#333",
  fontWeight: "500",
  cursor: "pointer",
  fontSize: "14px",
};

const btnDanger = {
  padding: "8px 16px",
  borderRadius: 8,
  border: "none",
  backgroundColor: "#dc3545",
  color: "white",
  fontWeight: "500",
  cursor: "pointer",
  fontSize: "14px",
};

// Add CSS animation for spinner (should be in a CSS file, but inline here for completeness)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
