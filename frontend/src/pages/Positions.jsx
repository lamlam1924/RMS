import React from "react";
import PageShell from "./_PageShell";

export default function Positions() {
  return (
    <PageShell title="Position" right={<button style={btnPrimary}>+ Add Position</button>}>
      <SimpleTable
        cols={["Position", "Department", "Main Tech", "Actions"]}
        rows={[
          ["C++ Developer", "IT", "C++", "✎  🗑️"],
          ["Python Developer", "IT", "Python", "✎  🗑️"],
          ["HR Executive", "HR", "-", "✎  🗑️"],
        ]}
      />
    </PageShell>
  );
}

function SimpleTable({ cols, rows }) {
  return (
    <table style={table}>
      <thead>
        <tr>{cols.map((c) => <th key={c} style={th}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx}>{r.map((cell, i) => <td key={i} style={td}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

const btnPrimary = {
  height: 34, padding: "0 14px", borderRadius: 10, border: "none",
  cursor: "pointer", background: "#2f3e9e", color: "#fff", fontWeight: 700,
};
const table = { width: "100%", borderCollapse: "collapse" };
const th = { textAlign: "left", padding: 10, background: "#f8fafc", borderBottom: "1px solid #e5e7eb" };
const td = { padding: 10, borderBottom: "1px solid #f1f5f9" };
