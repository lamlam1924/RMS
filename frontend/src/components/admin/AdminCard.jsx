import React from "react";

/**
 * Reusable Card Component for Admin Pages
 */
export default function AdminCard({ title, children, actions, status }) {
  return (
    <div style={card}>
      <div style={cardHeader}>
        <div>
          <h3 style={cardTitle}>{title}</h3>
          {status && <span style={getStatusStyle(status)}>{status}</span>}
        </div>
        {actions && <div style={actionContainer}>{actions}</div>}
      </div>
      <div style={cardBody}>{children}</div>
    </div>
  );
}

function getStatusStyle(status) {
  const baseStyle = {
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
    marginTop: "8px",
    display: "inline-block",
  };

  if (status.toLowerCase() === "active") {
    return {
      ...baseStyle,
      backgroundColor: "#d4edda",
      color: "#155724",
    };
  } else if (status.toLowerCase() === "inactive") {
    return {
      ...baseStyle,
      backgroundColor: "#f8d7da",
      color: "#721c24",
    };
  }
  
  return {
    ...baseStyle,
    backgroundColor: "#e7f3ff",
    color: "#0056b3",
  };
}

// Styles
const card = {
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
  paddingBottom: "12px",
  borderBottom: "1px solid #e9ecef",
};

const cardTitle = {
  margin: 0,
  fontSize: "18px",
  fontWeight: "600",
  color: "#333",
};

const cardBody = {
  fontSize: "14px",
  color: "#495057",
  lineHeight: "1.6",
};

const actionContainer = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
};
