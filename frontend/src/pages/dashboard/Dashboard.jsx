import React from "react";
import PageShell from "../../layouts/PageShell";

export default function Dashboard() {
  return (
    <PageShell title="Dashboard">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        <Card label="Open Vacancies" value="12" />
        <Card label="Candidates" value="84" />
        <Card label="Interviews Today" value="5" />
        <Card label="Offers Pending" value="3" />
      </div>
    </PageShell>
  );
}

function Card({ label, value }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14 }}>
      <div style={{ color: "#6b7280", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>{value}</div>
    </div>
  );
}
