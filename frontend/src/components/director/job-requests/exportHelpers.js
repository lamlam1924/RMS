import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateDisplay } from "../../../utils/formatters/date";
import { STATUS_BADGE } from "./constants";

function buildExportRows(requests) {
  return requests.map((r) => ({
    "Mã YC":          r.id,
    "Vị trí":         r.positionTitle,
    "Phòng ban":      r.departmentName,
    "Người yêu cầu":  r.requestedByName,
    "Số lượng":       r.quantity,
    "Trạng thái":     STATUS_BADGE[r.currentStatusCode]?.label ?? r.currentStatus,
    "Ngày tạo":       formatDateDisplay(r.createdAt),
  }));
}

export function exportToExcel(requests, tabLabel) {
  const rows = buildExportRows(requests);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Yêu cầu tuyển dụng");
  XLSX.writeFile(
    wb,
    `Director_YeuCauTuyenDung_${tabLabel}_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.xlsx`,
  );
}

export function exportToPDF(requests, tabLabel) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFont("helvetica");
  doc.setFontSize(14);
  doc.text(`Danh sách yêu cầu tuyển dụng - ${tabLabel}`, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Xuất ngày: ${new Date().toLocaleDateString("vi-VN")}`, 14, 22);

  const rows = buildExportRows(requests);
  if (rows.length === 0) {
    doc.text("Không có dữ liệu.", 14, 32);
  } else {
    autoTable(doc, {
      startY: 27,
      head: [Object.keys(rows[0])],
      body: rows.map(Object.values),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [51, 65, 85], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }
  doc.save(
    `Director_YeuCauTuyenDung_${tabLabel}_${new Date().toLocaleDateString("vi-VN").replace(/\//g, "-")}.pdf`,
  );
}
