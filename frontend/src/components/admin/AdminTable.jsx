import React from "react";

/**
 * Reusable Table Component for Admin Pages
 */
export default function AdminTable({ columns, data, actions, emptyMessage = "No data found" }) {
  return (
    <div style={tableContainer}>
      <table style={table}>
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index} style={th}>
                {col.label}
              </th>
            ))}
            {actions && <th style={th}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} style={{ ...td, textAlign: "center" }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} style={tr}>
                {columns.map((col, colIndex) => (
                  <td key={colIndex} style={td}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td style={td}>
                    <div style={actionButtons}>
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// Styles
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
};

const td = {
  padding: "15px",
  fontSize: "14px",
  color: "#495057",
};

const actionButtons = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
};
