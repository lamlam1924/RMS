import React, { useMemo, useState } from "react";
import PageShell from "../../components/layout/PageShell/PageShell";

const seed = [
  {
    id: 1,
    position: "Python Developer",
    department: "Banking",
    startDate: "2023-09-05",
    endDate: "2023-09-14",
    type: "Online",
    stage: "Stage 1",
    status: "Active",
  },
  {
    id: 2,
    position: "C++ Developer",
    department: "Retail",
    startDate: "2023-09-01",
    endDate: "2023-09-05",
    type: "Online",
    stage: "Stage 1",
    status: "Expired",
  },
  {
    id: 3,
    position: "Python Developer",
    department: "Banking",
    startDate: "2023-09-01",
    endDate: "",
    type: "Online",
    stage: "Stage 1",
    status: "Expired",
  },
  {
    id: 4,
    position: "Java Developer",
    department: "Banking",
    startDate: "2023-08-31",
    endDate: "",
    type: "Online",
    stage: "Stage 1",
    status: "Expired",
  },
];

const uniq = (arr) => Array.from(new Set(arr));
const stages = ["All", "Stage 1", "Stage 2", "Stage 3"];
const types = ["All", "Online", "Offline"];
const statuses = ["All", "Active", "Expired", "Canceled"];

export default function Interviews() {
  const [items, setItems] = useState(seed);

  const [stage, setStage] = useState("All");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [department, setDepartment] = useState("All");
  const [position, setPosition] = useState("All");

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [search, setSearch] = useState("");

  // paging like screenshot
  const [pageSize] = useState(5);
  const [page, setPage] = useState(1);

  const positions = useMemo(() => ["All", ...uniq(items.map((x) => x.position))], [items]);
  const departments = useMemo(() => ["All", ...uniq(items.map((x) => x.department))], [items]);

  const filtered = useMemo(() => {
    return items.filter((x) => {
      if (stage !== "All" && x.stage !== stage) return false;
      if (type !== "All" && x.type !== type) return false;
      if (status !== "All" && x.status !== status) return false;
      if (department !== "All" && x.department !== department) return false;
      if (position !== "All" && x.position !== position) return false;

      // date range filter based on startDate
      if (from && x.startDate < from) return false;
      if (to && x.startDate > to) return false;

      if (search.trim()) {
        const s = search.toLowerCase();
        const hay = `${x.position} ${x.department} ${x.type} ${x.stage} ${x.status}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [items, stage, type, status, department, position, from, to, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe, pageSize]);

  const onReset = () => {
    setStage("All");
    setType("All");
    setStatus("All");
    setDepartment("All");
    setPosition("All");
    setFrom("");
    setTo("");
    setSearch("");
    setPage(1);
  };

  const onAdd = () => {
    // demo add quick
    const id = Math.max(...items.map((x) => x.id)) + 1;
    const newItem = {
      id,
      position: "Python Developer",
      department: "Banking",
      startDate: todayISO(),
      endDate: "",
      type: "Online",
      stage: "Stage 1",
      status: "Active",
    };
    setItems((p) => [newItem, ...p]);
    setPage(1);
  };

  const onCancel = (id) => {
    if (!confirm("Cancel this interview?")) return;
    setItems((p) => p.map((x) => (x.id === id ? { ...x, status: "Canceled" } : x)));
  };

  const onInfo = (row) => {
    alert(
      `Interview Info\n\nPosition: ${row.position}\nDepartment: ${row.department}\nStart: ${fmt(row.startDate)}\nEnd: ${row.endDate ? fmt(row.endDate) : "-"}\nType: ${row.type}\nStage: ${row.stage}\nStatus: ${row.status}`
    );
  };

  const onEdit = (row) => {
    // lightweight demo edit: toggle type
    const nextType = row.type === "Online" ? "Offline" : "Online";
    setItems((p) => p.map((x) => (x.id === row.id ? { ...x, type: nextType } : x)));
  };

  return (
    <PageShell title="Interview List">
      {/* FILTER PANEL */}
      <div style={panel}>
        <div style={row}>
          <Filter label="Stage:">
            <select style={input} value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }}>
              {stages.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Filter>

          <Filter label="Type:">
            <select style={input} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
              {types.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Filter>

          <Filter label="Status:">
            <select style={input} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Filter>

          <Filter label="Department:">
            <select style={inputWide} value={department} onChange={(e) => { setDepartment(e.target.value); setPage(1); }}>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Filter>

          <Filter label="Position:">
            <select style={inputWide} value={position} onChange={(e) => { setPosition(e.target.value); setPage(1); }}>
              {positions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </Filter>
        </div>

        <div style={row}>
          <Filter label="Start Date From:">
            <input style={input} type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          </Filter>

          <Filter label="End Date To:">
            <input style={input} type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          </Filter>

          <button style={btnReset} onClick={onReset}>Reset</button>
          <button style={btnAdd} onClick={onAdd}>Add</button>
        </div>

        <div style={rowBetween}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b7280", fontSize: 13 }}>
            Show
            <select style={{ ...input, width: 70 }} disabled>
              <option>{pageSize}</option>
            </select>
            entries
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#374151", fontSize: 13, fontWeight: 800 }}>Search:</span>
            <input style={{ ...input, width: 240 }} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Position</th>
              <th style={th}>Department</th>
              <th style={th}>Start Date</th>
              <th style={th}>End Date</th>
              <th style={th}>Type</th>
              <th style={th}>Stage</th>
              <th style={th}>Status</th>
              <th style={th}>Action</th>
              <th style={th}>Cancel</th>
            </tr>
          </thead>

          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id}>
                <td style={td}>{r.position}</td>
                <td style={td}>{r.department}</td>
                <td style={td}>{fmt(r.startDate)}</td>
                <td style={td}>{r.endDate ? fmt(r.endDate) : "-"}</td>
                <td style={td}>{r.type}</td>
                <td style={td}>{r.stage}</td>
                <td style={td}>{r.status}</td>

                <td style={td}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={btnInfo} title="Info" onClick={() => onInfo(r)}>i</button>
                    <button style={btnEdit} title="Edit" onClick={() => onEdit(r)}>✎</button>
                  </div>
                </td>

                <td style={td}>
                  {r.status === "Active" ? (
                    <button style={btnCancel} title="Cancel" onClick={() => onCancel(r.id)}>🗑</button>
                  ) : (
                    <span style={{ color: "#9ca3af" }}>-</span>
                  )}
                </td>
              </tr>
            ))}

            {pageRows.length === 0 && (
              <tr>
                <td style={{ ...td, textAlign: "center", color: "#6b7280" }} colSpan={9}>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER + PAGINATION */}
      <div style={footer}>
        <div style={{ color: "#6b7280", fontSize: 13 }}>
          Showing {(filtered.length === 0 ? 0 : (pageSafe - 1) * pageSize + 1)} to{" "}
          {Math.min(pageSafe * pageSize, filtered.length)} of {filtered.length} entries
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={pagerBtn} disabled={pageSafe === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </button>
          <button style={pagerNum}>{pageSafe}</button>
          <button style={pagerBtn} disabled={pageSafe === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </button>
        </div>
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

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmt(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

const panel = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: 12,
  marginBottom: 12,
};
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 10 };
const rowBetween = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 6 };

const input = { height: 34, borderRadius: 10, border: "1px solid #e5e7eb", padding: "0 10px", background: "#fff" };
const inputWide = { ...input, minWidth: 200 };

const btnReset = { height: 34, padding: "0 16px", borderRadius: 12, border: "none", background: "#6b7280", color: "#fff", cursor: "pointer", fontWeight: 900 };
const btnAdd = { height: 34, padding: "0 18px", borderRadius: 12, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 900 };

const tableWrap = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "auto" };
const table = { width: "100%", borderCollapse: "collapse", minWidth: 980 };
const th = { textAlign: "left", padding: 10, background: "#f8fafc", borderBottom: "1px solid #e5e7eb", fontWeight: 900, fontSize: 13, whiteSpace: "nowrap" };
const td = { padding: 10, borderBottom: "1px solid #f1f5f9", fontSize: 13, whiteSpace: "nowrap" };

const btnInfo = { height: 32, width: 42, borderRadius: 10, border: "none", background: "#06b6d4", color: "#fff", cursor: "pointer", fontWeight: 900 };
const btnEdit = { height: 32, width: 42, borderRadius: 10, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 900 };
const btnCancel = { height: 32, width: 50, borderRadius: 10, border: "none", background: "#ef4444", color: "#fff", cursor: "pointer", fontWeight: 900 };

const footer = { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10 };
const pagerBtn = { height: 34, padding: "0 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 800 };
const pagerNum = { height: 34, width: 34, borderRadius: 10, border: "none", background: "#2f3e9e", color: "#fff", fontWeight: 900 };
