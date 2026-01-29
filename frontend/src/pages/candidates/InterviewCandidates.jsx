import React, { useMemo, useState } from "react";
import "../../styles/interview-candidates.css";

const seed = [
  { id: 1, name: "Mg Kaung", vacancy: "C++ Developer", dept: "Retail", tech: "C++", date: "01-09-2023", exp: "2 years", status: "CANCEL", stage: "STAGE 1" },
  { id: 2, name: "Mg Aung", vacancy: "C++ Developer", dept: "Retail", tech: "C++", date: "01-09-2023", exp: "3 years", status: "PASSED", stage: "STAGE 1" },
  { id: 3, name: "Khun Khun", vacancy: "Python Developer", dept: "Banking", tech: "Python", date: "01-09-2023", exp: "1 year", status: "CANCEL", stage: "STAGE 1" },
  { id: 4, name: "Khun Khun", vacancy: "C++ Developer", dept: "Retail", tech: "Python", date: "01-09-2023", exp: "1 year", status: "REACHED", stage: "STAGE 1" },
  { id: 5, name: "Khun Khun", vacancy: "Python Developer", dept: "Banking", tech: "C++", date: "01-09-2023", exp: "2 years", status: "REACHED", stage: "STAGE 1" },
];

const uniq = (arr) => Array.from(new Set(arr));

export default function InterviewCandidates() {
  const [status, setStatus] = useState("All");
  const [stage, setStage] = useState("All");
  const [position, setPosition] = useState("All");
  const [department, setDepartment] = useState("All");
  const [search, setSearch] = useState("");

  const positions = useMemo(() => ["All", ...uniq(seed.map((x) => x.vacancy))], []);
  const departments = useMemo(() => ["All", ...uniq(seed.map((x) => x.dept))], []);
  const statuses = ["All", "CANCEL", "PASSED", "REACHED"];
  const stages = ["All", "STAGE 1", "STAGE 2", "STAGE 3"];

  const rows = useMemo(() => {
    return seed.filter((x) => {
      if (status !== "All" && x.status !== status) return false;
      if (stage !== "All" && x.stage !== stage) return false;
      if (position !== "All" && x.vacancy !== position) return false;
      if (department !== "All" && x.dept !== department) return false;

      if (search.trim()) {
        const s = search.toLowerCase();
        const hay = `${x.name} ${x.vacancy} ${x.dept} ${x.tech}`.toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [status, stage, position, department, search]);

  const onReset = () => {
    setStatus("All");
    setStage("All");
    setPosition("All");
    setDepartment("All");
    setSearch("");
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1>All Interview Candidate Lists</h1>
      </div>

      <div className="filters">
        <div className="filter">
          <label>Status:</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="filter">
          <label>Stage:</label>
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            {stages.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="filter wide">
          <label>Position:</label>
          <select value={position} onChange={(e) => setPosition(e.target.value)}>
            {positions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="filter wide">
          <label>Department:</label>
          <select value={department} onChange={(e) => setDepartment(e.target.value)}>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <button className="btn-reset" onClick={onReset}>Reset</button>

        <div className="filter search">
          <label>Search:</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="type to search..." />
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Vacancy</th>
              <th>Vacancy's Department</th>
              <th>Main-Tech</th>
              <th>Submitted Date</th>
              <th>Exp</th>
              <th>Interview Status</th>
              <th>Interview Stage</th>
              <th>Interview Action</th>
              <th>Details</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.vacancy}</td>
                <td>{r.dept}</td>
                <td>{r.tech}</td>
                <td>{r.date}</td>
                <td>{r.exp}</td>

                <td>
                  <span className={`badge ${badgeStatus(r.status)}`}>{r.status}</span>
                </td>

                <td>
                  <span className="badge stage">{r.stage}</span>
                </td>

                <td>
                  <button className="action-btn" title="Edit Interview">✎</button>
                </td>

                <td>
                  <div className="detail-actions">
                    <button className="mini-btn cyan" title="Assign interviewers">👥</button>
                    <button className="mini-btn blue" title="View timeline">🕒</button>
                    <button className="mini-btn gray" title="Open profile">📄</button>
                  </div>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="empty">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function badgeStatus(status) {
  if (status === "PASSED") return "passed";
  if (status === "REACHED") return "reached";
  return "cancel";
}
