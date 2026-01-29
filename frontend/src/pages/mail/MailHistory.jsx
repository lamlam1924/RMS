import React from "react";
import PageShell from "../../components/layout/PageShell/PageShell";

export default function MailHistory() {
  return (
    <PageShell title="Mail History">
      <SimpleTable
        cols={["To", "Subject", "Sent At", "Status", "Actions"]}
        rows={[
          ["khunkhun@gmail.com", "Interview Invitation", "2023-09-02 13:10", "Sent", "👁️"],
          ["mgaung@gmail.com", "Result Notification", "2023-09-02 15:45", "Sent", "👁️"],
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
