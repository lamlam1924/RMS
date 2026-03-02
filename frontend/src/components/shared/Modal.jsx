import React, { useEffect } from "react";

export default function Modal({ open, title, onClose, children, width = 720 }) {
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={styles.backdrop} onMouseDown={onClose}>
      <div
        style={{ ...styles.card, width }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div style={styles.header}>
          <div style={styles.title}>{title}</div>
          <button onClick={onClose} style={styles.xBtn} aria-label="close">
            ✕
          </button>
        </div>

        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 50,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    maxHeight: "85vh",
    overflow: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid #e5e7eb",
  },
  title: { fontWeight: 800, fontSize: 16 },
  xBtn: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 10,
    width: 36,
    height: 36,
    cursor: "pointer",
  },
  body: { padding: 16 },
};
