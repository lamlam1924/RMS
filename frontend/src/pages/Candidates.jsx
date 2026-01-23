import React, { useMemo, useState } from "react";
import PageShell from "./_PageShell";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const seed = [
  {
    id: 1,
    name: "Mg Kaung",
    vacancy: "Python Developer",
    dept: "Banking",
    tech: "C++",
    submittedDate: "2023-09-01",
    exp: "2 years",
    selectionStatus: "CONSIDERING",
    interviewStatus: "CANCEL",
    stage: "STAGE 1",
  },
  {
    id: 2,
    name: "Khun Khun",
    vacancy: "Python Developer",
    dept: "Banking",
    tech: "Python",
    submittedDate: "2023-09-01",
    exp: "1 year",
    selectionStatus: "CONSIDERING",
    interviewStatus: "REACHED",
    stage: "STAGE 1",
  },
  {
    id: 3,
    name: "Khun Khun",
    vacancy: "C++ Developer",
    dept: "Retail",
    tech: "Python",
    submittedDate: "2023-09-01",
    exp: "1 year",
    selectionStatus: "CONSIDERING",
    interviewStatus: "REACHED",
    stage: "STAGE 1",
  },
  {
    id: 4,
    name: "Ye Ye",
    vacancy: "PHP Developer",
    dept: "Onshore",
    tech: "PHP",
    submittedDate: "2023-09-01",
    exp: "3 years",
    selectionStatus: "CONSIDERING",
    interviewStatus: "—",
    stage: "—",
  },
  {
    id: 5,
    name: "Mg Kaung",
    vacancy: "C++ Developer",
    dept: "Retail",
    tech: "C++",
    submittedDate: "2023-09-01",
    exp: "2 years",
    selectionStatus: "CONSIDERING",
    interviewStatus: "CANCEL",
    stage: "STAGE 1",
  },
];

const uniq = (arr) => Array.from(new Set(arr));

const selectionStatuses = ["All", "CONSIDERING", "REJECTED", "HIRED"];
const interviewStatuses = ["All", "CANCEL", "REACHED", "PASSED", "—"];
const stages = ["All", "STAGE 1", "STAGE 2", "STAGE 3", "—"];

export default function Candidates() {
  const [selectionStatus, setSelectionStatus] = useState("All");
  const [interviewStatus, setInterviewStatus] = useState("All");
  const [stage, setStage] = useState("All");
  const [position, setPosition] = useState("All");
  const [department, setDepartment] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");

  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const positions = useMemo(() => ["All", ...uniq(seed.map((x) => x.vacancy))], []);
  const departments = useMemo(() => ["All", ...uniq(seed.map((x) => x.dept))], []);

  const rows = useMemo(() => {
    return seed.filter((x) => {
      if (selectionStatus !== "All" && x.selectionStatus !== selectionStatus) return false;
      if (interviewStatus !== "All" && x.interviewStatus !== interviewStatus) return false;
      if (stage !== "All" && x.stage !== stage) return false;
      if (position !== "All" && x.vacancy !== position) return false;
      if (department !== "All" && x.dept !== department) return false;

      // date range filter (submittedDate is ISO yyyy-mm-dd)
      if (from && x.submittedDate < from) return false;
      if (to && x.submittedDate > to) return false;

      if (search.trim()) {
        const s = search.toLowerCase();
        const hay = `${x.name} ${x.vacancy} ${x.dept} ${x.tech} ${x.selectionStatus} ${x.interviewStatus}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [selectionStatus, interviewStatus, stage, position, department, from, to, search]);

  const allVisibleSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  const toggleAllVisible = () => {
    const next = new Set(selectedIds);
    if (allVisibleSelected) {
      rows.forEach((r) => next.delete(r.id));
    } else {
      rows.forEach((r) => next.add(r.id));
    }
    setSelectedIds(next);
  };

  const toggleOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const onReset = () => {
    setSelectionStatus("All");
    setInterviewStatus("All");
    setStage("All");
    setPosition("All");
    setDepartment("All");
    setFrom("");
    setTo("");
    setSearch("");
    setSelectedIds(new Set());
  };

  const exportRows = rows.filter((r) => selectedIds.size === 0 || selectedIds.has(r.id));

  const downloadExcel = () => {
    const data = exportRows.map((r) => ({
      Name: r.name,
      Vacancy: r.vacancy,
      Department: r.dept,
      "Main Tech": r.tech,
      "Submitted Date": r.submittedDate,
      Exp: r.exp,
      "Selection Status": r.selectionStatus,
      "Interview Status": r.interviewStatus,
      Stage: r.stage,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates");
    XLSX.writeFile(wb, "candidates.xlsx");
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("All Candidates", 14, 14);

    autoTable(doc, {
      startY: 20,
      head: [[
        "Name", "Vacancy", "Department", "Main Tech", "Submitted Date", "Exp",
        "Selection Status", "Interview Status", "Stage",
      ]],
      body: exportRows.map((r) => [
        r.name, r.vacancy, r.dept, r.tech, r.submittedDate, r.exp,
        r.selectionStatus, r.interviewStatus, r.stage,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [248, 250, 252], textColor: [31, 41, 55] },
    });

    doc.save("candidates.pdf");
  };

  return (
    <PageShell title="All Candidates">
      {/* FILTER BAR (giống ảnh) */}
      <div style={filtersWrap}>
        <div style={filterRow}>
          <Filter label="Selection Status:">
            <select style={input} value={selectionStatus} onChange={(e) => setSelectionStatus(e.target.value)}>
              {selectionStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Filter>

          <Filter label="Interview Status:">
            <select style={input} value={interviewStatus} onChange={(e) => setInterviewStatus(e.target.value)}>
              {interviewStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Filter>

          <Filter label="Stage:">
            <select style={input} value={stage} onChange={(e) => setStage(e.target.value)}>
              {stages.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Filter>

          <Filter label="Position:">
            <select style={inputWide} value={position} onChange={(e) => setPosition(e.target.value)}>
              {positions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Filter>

          <Filter label="Department:">
            <select style={inputWide} value={department} onChange={(e) => setDepartment(e.target.value)}>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Filter>
        </div>

        <div style={filterRow}>
          <Filter label="From:">
            <input style={input} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Filter>

          <Filter label="To:">
            <input style={input} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Filter>

          <button style={btnReset} onClick={onReset}>Reset</button>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 800, color: "#374151", fontSize: 13 }}>Download As:</span>
            <button style={btnExcel} onClick={downloadExcel} title="Download Excel">XLS</button>
            <button style={btnPdf} onClick={downloadPDF} title="Download PDF">PDF</button>
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
            <span style={{ color: "#374151", fontSize: 13, fontWeight: 700 }}>Search:</span>
            <input style={{ ...input, width: 240 }} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
              </th>
              <th style={th}>Name</th>
              <th style={th}>Vacancy</th>
              <th style={th}>Vacancy&apos;s Department</th>
              <th style={th}>Main Tech</th>
              <th style={th}>Submitted Date</th>
              <th style={th}>Exp</th>
              <th style={th}>Selection Status</th>
              <th style={th}>Selection Action</th>
              <th style={th}>Interview Status</th>
              <th style={th}>Interview Stage</th>
              <th style={th}>Interview Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={td}>
                  <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleOne(r.id)} />
                </td>
                <td style={td}>{r.name}</td>
                <td style={td}>{r.vacancy}</td>
                <td style={td}>{r.dept}</td>
                <td style={td}>{r.tech}</td>
                <td style={td}>{formatDDMMYYYY(r.submittedDate)}</td>
                <td style={td}>{r.exp}</td>

                <td style={td}>
                  <span style={{ ...pill, background: "#16a34a" }}>{r.selectionStatus}</span>
                </td>

                <td style={td}>-</td>

                <td style={td}>
                  {r.interviewStatus === "—" ? (
                    <span style={{ color: "#9ca3af" }}>-</span>
                  ) : (
                    <span style={{ ...pill, ...interviewPill(r.interviewStatus) }}>{r.interviewStatus}</span>
                  )}
                </td>

                <td style={td}>
                  {r.stage === "—" ? (
                    <span style={{ color: "#9ca3af" }}>-</span>
                  ) : (
                    <span style={{ ...pill, background: "#0ea5e9" }}>{r.stage}</span>
                  )}
                </td>

                <td style={td}>
                  {r.stage === "—" ? (
                    <span style={{ color: "#9ca3af" }}>-</span>
                  ) : (
                    <button style={btnMini} title="Interview Action">Select</button>
                  )}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td style={{ ...td, textAlign: "center", color: "#6b7280" }} colSpan={12}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 10, color: "#6b7280", fontSize: 12 }}>
        * Export sẽ lấy <b>rows đang filter</b>. Nếu bạn tick checkbox thì export chỉ lấy <b>hàng được chọn</b>.
      </div>
    </PageShell>
  );
}

function Filter({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontWeight: 800, color: "#374151", fontSize: 13 }}>{label}</span>
      {children}
    </div>
  );
}

function formatDDMMYYYY(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

function interviewPill(status) {
  if (status === "CANCEL") return { background: "#ef4444" };
  if (status === "REACHED") return { background: "#f59e0b" };
  if (status === "PASSED") return { background: "#22c55e" };
  return { background: "#6b7280" };
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

const inputWide = { ...input, minWidth: 180 };

const btnReset = {
  height: 34,
  padding: "0 14px",
  borderRadius: 10,
  border: "none",
  background: "#6b7280",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 800,
};

const btnExcel = {
  height: 34,
  width: 44,
  borderRadius: 10,
  border: "none",
  background: "#16a34a",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};

const btnPdf = {
  height: 34,
  width: 44,
  borderRadius: 10,
  border: "none",
  background: "#ef4444",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};

const tableWrap = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  overflow: "auto",
};

const table = { width: "100%", borderCollapse: "collapse", minWidth: 1150 };
const th = { textAlign: "left", padding: 10, background: "#f8fafc", borderBottom: "1px solid #e5e7eb", fontWeight: 900, fontSize: 13, whiteSpace: "nowrap" };
const td = { padding: 10, borderBottom: "1px solid #f1f5f9", fontSize: 13, whiteSpace: "nowrap" };

const pill = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 12px",
  borderRadius: 999,
  color: "#fff",
  fontWeight: 900,
  fontSize: 12,
};

const btnMini = {
  height: 30,
  padding: "0 12px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 800,
};
