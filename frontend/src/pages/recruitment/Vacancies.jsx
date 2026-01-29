import React, { useMemo, useState } from "react";
import PageShell from "../../components/layout/PageShell/PageShell";
import { loadVacancies, saveVacancies } from "../../store/vacancyStore";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const seedVacancies = [
  { id: "V001", position: "Java Developer", post: 7, startDate: "2023-09-02", endDate: "2023-10-02", department: "Retail", status: "Open" },
  { id: "V002", position: "C++ Developer", post: 6, startDate: "2023-09-01", endDate: "2023-10-01", department: "Retail", status: "Open" },
  { id: "V003", position: "Python Developer", post: 8, startDate: "2023-09-01", endDate: "2023-10-01", department: "Banking", status: "Open" },
  { id: "V004", position: "PHP Developer", post: 5, startDate: "2023-09-01", endDate: "2023-10-01", department: "Onshore", status: "Draft" },
  { id: "V005", position: "Java Developer", post: 7, startDate: "2023-09-01", endDate: "2023-10-01", department: "Retail", status: "Closed" },
];

const uniq = (arr) => Array.from(new Set(arr));
const statuses = ["All", "Draft", "Open", "Closed"];

export default function Vacancies() {
  const [items, setItems] = useState(() => {
    const fromLS = loadVacancies(null);

    // Nếu localStorage đang dùng kiểu cũ (title/mainTech...) thì fallback seed
    if (!fromLS || !Array.isArray(fromLS) || fromLS.length === 0) {
      saveVacancies(seedVacancies);
      return seedVacancies;
    }

    // Nếu localStorage là object kiểu Add Vacancy page (title/department/openDate...)
    // thì map sang format list
    const mapped = fromLS.map((v, idx) => ({
      id: v.id || `V${String(idx + 1).padStart(3, "0")}`,
      position: v.position || v.title || "Unknown",
      post: v.quantity ?? v.post ?? 1,
      startDate: v.openDate || v.startDate || "2023-09-01",

      // ✅ FIX BUG: bỏ lặp "v.endDate || v.endDate"
      endDate: v.endDate || addDays(v.openDate || v.startDate || "2023-09-01", 30),

      department: v.department || "IT",
      status: v.status || "Draft",
    }));

    return mapped;
  });

  const [status, setStatus] = useState("All");
  const [department, setDepartment] = useState("All");
  const [position, setPosition] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");

  const positions = useMemo(() => ["All", ...uniq(items.map((x) => x.position))], [items]);
  const departments = useMemo(() => ["All", ...uniq(items.map((x) => x.department))], [items]);

  const rows = useMemo(() => {
    return items.filter((x) => {
      if (status !== "All" && x.status !== status) return false;
      if (department !== "All" && x.department !== department) return false;
      if (position !== "All" && x.position !== position) return false;
      if (from && x.startDate < from) return false;
      if (to && x.endDate > to) return false;

      if (search.trim()) {
        const s = search.toLowerCase();
        const hay = `${x.position} ${x.department} ${x.status}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [items, status, department, position, from, to, search]);

  const onReset = () => {
    setStatus("All");
    setDepartment("All");
    setPosition("All");
    setFrom("");
    setTo("");
    setSearch("");
  };

  const downloadExcel = () => {
    const data = rows.map((r) => ({
      Position: r.position,
      Post: r.post,
      "Start Date": formatDDMMYYYY(r.startDate),
      "End Date": formatDDMMYYYY(r.endDate),
      Department: r.department,
      Status: r.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vacancies");
    XLSX.writeFile(wb, "vacancy_list.xlsx");
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Vacancy List", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [["Position", "Post", "Start Date", "End Date", "Department", "Status"]],
      body: rows.map((r) => [
        r.position,
        String(r.post),
        formatDDMMYYYY(r.startDate),
        formatDDMMYYYY(r.endDate),
        r.department,
        r.status,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [248, 250, 252], textColor: [31, 41, 55] },
    });
    doc.save("vacancy_list.pdf");
  };

  return (
    <PageShell title="Vacancy List">
      {/* FILTERS giống ảnh */}
      <div style={filtersWrap}>
        <div style={filterRow}>
          <Filter label="Status:">
            <select style={input} value={status} onChange={(e) => setStatus(e.target.value)}>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Filter>

          <Filter label="Department:">
            <select style={inputWide} value={department} onChange={(e) => setDepartment(e.target.value)}>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Filter>

          <Filter label="Position:">
            <select style={inputWide} value={position} onChange={(e) => setPosition(e.target.value)}>
              {positions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Filter>

          <button style={btnReset} onClick={onReset}>Reset</button>
        </div>

        <div style={filterRow}>
          <Filter label="From:">
            <input style={input} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Filter>

          <Filter label="To:">
            <input style={input} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Filter>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 900, color: "#374151", fontSize: 13 }}>
              Interview Summary Download:
            </span>
            <button style={btnExcel} onClick={downloadExcel} title="Excel">XLS</button>
            <button style={btnPdf} onClick={downloadPDF} title="PDF">PDF</button>
          </div>
        </div>

        <div style={topRow}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b7280", fontSize: 13 }}>
            Show
            <select style={{ ...input, width: 70 }} disabled>
              <option>10</option>
            </select>
            entries
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#374151", fontSize: 13, fontWeight: 800 }}>Search:</span>
            <input style={{ ...input, width: 240 }} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Position</th>
              <th style={th}>Post</th>
              <th style={th}>Start Date</th>
              <th style={th}>End Date</th>
              <th style={th}>Department</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
              <th style={th}>Download</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={td}>{r.position}</td>
                <td style={td}>{r.post}</td>
                <td style={td}>{formatDDMMYYYY(r.startDate)}</td>
                <td style={td}>{formatDDMMYYYY(r.endDate)}</td>
                <td style={td}>{r.department}</td>

                <td style={td}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ ...dot, ...dotColor(r.status) }} />
                  </span>
                </td>

                <td style={td}>
                  <button style={btnDots} title="Actions">⋮</button>
                </td>

                <td style={td}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={btnExcel} onClick={downloadExcel} title="Excel">XLS</button>
                    <button style={btnPdf} onClick={downloadPDF} title="PDF">PDF</button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td style={{ ...td, textAlign: "center", color: "#6b7280" }} colSpan={8}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

function Filter({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontWeight: 900, color: "#374151", fontSize: 13 }}>{label}</span>
      {children}
    </div>
  );
}

function formatDDMMYYYY(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

function dotColor(status) {
  if (status === "Open") return { background: "#22c55e" };    // xanh
  if (status === "Closed") return { background: "#9ca3af" };  // xám
  return { background: "#f59e0b" };                           // vàng (Draft)
}

function addDays(iso, days) {
  try {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

const filtersWrap = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 12,
  marginBottom: 12,
};

const filterRow = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 12,
  marginBottom: 10,
};

const topRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginTop: 6,
};

const input = {
  height: 34,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  padding: "0 10px",
  background: "#fff",
};

const inputWide = { ...input, minWidth: 220 };

const btnReset = {
  height: 34,
  padding: "0 16px",
  borderRadius: 12,
  border: "none",
  background: "#6b7280",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};

const btnExcel = {
  height: 34,
  width: 54,
  borderRadius: 12,
  border: "none",
  background: "#16a34a",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};

const btnPdf = {
  height: 34,
  width: 54,
  borderRadius: 12,
  border: "none",
  background: "#ef4444",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};

const btnDots = {
  height: 34,
  width: 40,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 900,
  fontSize: 18,
};

const dot = {
  width: 10,
  height: 10,
  borderRadius: 999,
};

const tableWrap = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  overflow: "auto",
};

const table = { width: "100%", borderCollapse: "collapse", minWidth: 1050 };
const th = { textAlign: "left", padding: 10, background: "#f8fafc", borderBottom: "1px solid #e5e7eb", fontWeight: 900, fontSize: 13, whiteSpace: "nowrap" };
const td = { padding: 10, borderBottom: "1px solid #f1f5f9", fontSize: 13, whiteSpace: "nowrap" };
