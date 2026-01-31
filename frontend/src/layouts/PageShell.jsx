import React from "react";

export default function PageShell({ title, right, children }) {
  return (
    <div style={container}>
      {/* Page Header */}
      {(title || right) && (
        <div style={header}>
          {title && <h1 style={titleStyle}>{title}</h1>}
          {right && <div style={rightActions}>{right}</div>}
        </div>
      )}

      {/* Page Content */}
      <div style={content}>{children}</div>
    </div>
  );
}

// Styles
const container = {
  width: "100%",
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
  gap: "16px",
  flexWrap: "wrap",
};

const titleStyle = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#333",
  margin: 0,
};

const rightActions = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
};

const content = {
  width: "100%",
};
