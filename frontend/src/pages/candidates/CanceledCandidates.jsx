import React from "react";
import PageShell from "../../components/layout/PageShell/PageShell";

export default function CanceledCandidates() {
  return (
    <PageShell title="Canceled Candidate">
      <SimpleTable
        cols={["Name", "Position", "Canceled Reason", "Canceled Date", "Actions"]}
        rows={[
          ["Mg Kaung", "C++ Developer", "No show", "2023-09-02", "👁️"],
          ["Khun Khun", "Python Developer", "Rejected", "2023-09-02", "👁️"],
        ]}
      />
    </PageShell>
  );
}

function SimpleTable({ cols, rows }) {
  return (
    <table style={table}>
      <thead><tr>{cols.map((c) => <th key={c} style={th}>{c}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx}>{r.map((cell, i) => <td key={i} style={td}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

const table = { width: "100%", borderCollapse: "collapse" };
const th = { textAlign: "left", padding: 10, background: "#f8fafc", borderBottom: "1px solid #e5e7eb" };
const td = { padding: 10, borderBottom: "1px solid #f1f5f9" };
