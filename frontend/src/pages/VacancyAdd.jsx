import React, { useState } from "react";
import PageShell from "./_PageShell";
import { loadVacancies, saveVacancies } from "../storage/vacancyStore";

const departments = ["IT", "HR", "Sales", "Retail", "Banking"];
const statuses = ["Draft", "Open", "Closed"];

export default function VacancyAdd() {
  const [form, setForm] = useState({
    title: "",
    department: "IT",
    position: "",
    mainTech: "",
    quantity: 1,
    openDate: todayISO(),
    status: "Draft",
    description: "",
  });

  const [errors, setErrors] = useState({});

  const onChange = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.position.trim()) e.position = "Position is required";
    if (!form.mainTech.trim()) e.mainTech = "Main Tech is required";
    const qty = Number(form.quantity);
    if (!Number.isFinite(qty) || qty <= 0) e.quantity = "Quantity must be >= 1";
    if (!form.openDate) e.openDate = "Open date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const createVacancyId = (items) => {
    const maxNum = items.reduce((mx, v) => {
      const m = String(v.id || "").match(/^V(\d+)$/);
      if (!m) return mx;
      return Math.max(mx, parseInt(m[1], 10));
    }, 0);
    return `V${String(maxNum + 1).padStart(3, "0")}`;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const items = loadVacancies([]);
    const newVacancy = {
      id: createVacancyId(items),
      title: form.title.trim(),
      department: form.department,
      position: form.position.trim(),
      mainTech: form.mainTech.trim(),
      quantity: Number(form.quantity),
      openDate: form.openDate,
      status: form.status,
      description: form.description?.trim() || "",
      // thêm endDate mặc định để list giống ảnh
      endDate: addDays(form.openDate, 30),
    };

    const next = [newVacancy, ...items];
    saveVacancies(next);

    alert("Created vacancy ✅ (saved to localStorage)");
  };

  return (
    <PageShell title="Add Vacancy">
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 860 }}>
        <Field label="Title *" error={errors.title}>
          <input style={input} value={form.title} onChange={(e) => onChange("title", e.target.value)} />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Department *">
            <select style={input} value={form.department} onChange={(e) => onChange("department", e.target.value)}>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>

          <Field label="Status *">
            <select style={input} value={form.status} onChange={(e) => onChange("status", e.target.value)}>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Position *" error={errors.position}>
            <input style={input} value={form.position} onChange={(e) => onChange("position", e.target.value)} />
          </Field>

          <Field label="Main Tech *" error={errors.mainTech}>
            <input style={input} value={form.mainTech} onChange={(e) => onChange("mainTech", e.target.value)} />
          </Field>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Quantity *" error={errors.quantity}>
            <input style={input} type="number" min={1} value={form.quantity} onChange={(e) => onChange("quantity", e.target.value)} />
          </Field>

          <Field label="Open Date *" error={errors.openDate}>
            <input style={input} type="date" value={form.openDate} onChange={(e) => onChange("openDate", e.target.value)} />
          </Field>
        </div>

        <Field label="Description">
          <textarea style={{ ...input, height: 110, paddingTop: 10 }} value={form.description} onChange={(e) => onChange("description", e.target.value)} />
        </Field>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button type="submit" style={btnPrimary}>Create</button>
        </div>
      </form>
    </PageShell>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 13, color: "#374151", fontWeight: 800 }}>{label}</label>
        {error && <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 800 }}>{error}</span>}
      </div>
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

function addDays(iso, days) {
  try {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

const input = {
  width: "100%",
  height: 38,
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  padding: "0 12px",
  outline: "none",
};
const btnPrimary = {
  height: 38,
  padding: "0 16px",
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  background: "#2f3e9e",
  color: "#fff",
  fontWeight: 900,
};
