import { useState, useEffect } from "react";
import directorService from "../../services/directorService";
import { ViewIcon } from "../../components/admin/ActionIcons";
import notify from "../../utils/notification";

const OfferApprovals = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(""); // "approve" or "reject"
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await directorService.offers.getPending();
      setOffers(data);
    } catch (err) {
      setError("Failed to load offers: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const detail = await directorService.offers.getDetail(id);
      setSelectedOffer(detail);
      setShowDetailModal(true);
    } catch (err) {
      notify.error("Không thể tải thông tin chi tiết: " + err.message);
    }
  };

  const handleApprovalClick = (offer, action) => {
    setSelectedOffer(offer);
    setApprovalAction(action);
    setComment("");
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedOffer) return;

    try {
      if (approvalAction === "approve") {
        await directorService.offers.approve(selectedOffer.id, comment);
        notify.success("Đã phê duyệt offer thành công");
      } else {
        await directorService.offers.reject(selectedOffer.id, comment);
        notify.success("Đã từ chối offer thành công");
      }
      setShowApprovalModal(false);
      setSelectedOffer(null);
      setComment("");
      loadOffers();
    } catch (err) {
      notify.error("Thao tác thất bại: " + err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Offer Approvals</h1>
        <button onClick={loadOffers} style={styles.refreshBtn}>
          Refresh
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : offers.length === 0 ? (
        <div style={styles.empty}>No pending offers</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Candidate</th>
                <th style={styles.th}>Position</th>
                <th style={styles.th}>Department</th>
                <th style={styles.th}>Proposed Salary</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer.id} style={styles.tr}>
                  <td style={styles.td}>{offer.id}</td>
                  <td style={styles.td}>{offer.candidateName}</td>
                  <td style={styles.td}>{offer.positionTitle}</td>
                  <td style={styles.td}>{offer.departmentName}</td>
                  <td style={styles.td}>
                    {offer.proposedSalary.toLocaleString()} VND
                  </td>
                  <td style={styles.td}>
                    <span style={styles.statusBadge}>{offer.currentStatus}</span>
                  </td>
                  <td style={styles.td}>
                    {new Date(offer.createdAt).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => handleViewDetail(offer.id)}
                        style={{...styles.btnIcon, color: "#3b82f6"}}
                        title="View Detail"
                      >
                        <ViewIcon />
                      </button>
                      <button
                        onClick={() => handleApprovalClick(offer, "approve")}
                        style={{...styles.btnAction, ...styles.btnApprove}}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprovalClick(offer, "reject")}
                        style={{...styles.btnAction, ...styles.btnReject}}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOffer && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>Offer Detail</h2>
              <button onClick={() => setShowDetailModal(false)} style={styles.closeBtn}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.detailGroup}>
                <label>Candidate:</label>
                <p>{selectedOffer.candidateName}</p>
                <p style={styles.contactInfo}>
                  Email: {selectedOffer.candidateEmail}<br />
                  Phone: {selectedOffer.candidatePhone || "N/A"}
                </p>
              </div>
              <div style={styles.detailGroup}>
                <label>Position:</label>
                <p>{selectedOffer.positionTitle}</p>
              </div>
              <div style={styles.detailGroup}>
                <label>Department:</label>
                <p>{selectedOffer.departmentName}</p>
              </div>
              <div style={styles.detailGroup}>
                <label>Proposed Salary:</label>
                <p style={styles.salary}>{selectedOffer.proposedSalary.toLocaleString()} VND</p>
              </div>
              <div style={styles.detailGroup}>
                <label>Start Date:</label>
                <p>{selectedOffer.startDate ? new Date(selectedOffer.startDate).toLocaleDateString() : "N/A"}</p>
              </div>
              {selectedOffer.benefits && (
                <div style={styles.detailGroup}>
                  <label>Benefits:</label>
                  <p>{selectedOffer.benefits}</p>
                </div>
              )}
              
              {selectedOffer.approvalHistory && selectedOffer.approvalHistory.length > 0 && (
                <div style={styles.detailGroup}>
                  <label>Approval History:</label>
                  <div style={styles.historyList}>
                    {selectedOffer.approvalHistory.map((h, idx) => (
                      <div key={idx} style={styles.historyItem}>
                        <strong>{h.decision}</strong> by {h.approverName} ({h.approverRole})
                        <br />
                        <small>{new Date(h.approvedAt).toLocaleString()}</small>
                        {h.comment && <p style={styles.historyComment}>{h.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedOffer && (
        <div style={styles.modalOverlay} onClick={() => setShowApprovalModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>{approvalAction === "approve" ? "Approve" : "Reject"} Offer</h2>
              <button onClick={() => setShowApprovalModal(false)} style={styles.closeBtn}>×</button>
            </div>
            <div style={styles.modalBody}>
              <p>
                <strong>Candidate:</strong> {selectedOffer.candidateName}<br />
                <strong>Position:</strong> {selectedOffer.positionTitle}<br />
                <strong>Department:</strong> {selectedOffer.departmentName}<br />
                <strong>Salary:</strong> {selectedOffer.proposedSalary.toLocaleString()} VND
              </p>
              <div style={styles.formGroup}>
                <label>Comment (Optional):</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Enter your comment..."
                  style={styles.textarea}
                  rows="4"
                />
              </div>
              <div style={styles.modalActions}>
                <button onClick={() => setShowApprovalModal(false)} style={styles.btnCancel}>
                  Cancel
                </button>
                <button
                  onClick={handleSubmitApproval}
                  style={approvalAction === "approve" ? styles.btnApprove : styles.btnReject}
                >
                  {approvalAction === "approve" ? "Approve" : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "24px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
  },
  refreshBtn: {
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  error: {
    padding: "12px",
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    borderRadius: "6px",
    marginBottom: "16px",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
  },
  empty: {
    textAlign: "center",
    padding: "40px",
    color: "#6b7280",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
  },
  tableContainer: {
    overflowX: "auto",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "12px",
    textAlign: "left",
    borderBottom: "2px solid #e5e7eb",
    fontWeight: "600",
    color: "#374151",
    backgroundColor: "#f9fafb",
  },
  tr: {
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    padding: "12px",
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "4px",
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontSize: "12px",
    fontWeight: "500",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  btnIcon: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "4px",
  },
  btnAction: {
    padding: "6px 12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "white",
  },
  btnApprove: {
    backgroundColor: "#10b981",
  },
  btnReject: {
    backgroundColor: "#ef4444",
  },
  btnCancel: {
    padding: "8px 16px",
    backgroundColor: "#6b7280",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: "8px",
    maxWidth: "600px",
    width: "90%",
    maxHeight: "90vh",
    overflow: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: "1px solid #e5e7eb",
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "32px",
    cursor: "pointer",
    color: "#6b7280",
    lineHeight: "1",
  },
  modalBody: {
    padding: "24px",
  },
  detailGroup: {
    marginBottom: "16px",
  },
  contactInfo: {
    color: "#6b7280",
    fontSize: "14px",
    marginTop: "4px",
  },
  salary: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#10b981",
  },
  formGroup: {
    marginBottom: "16px",
  },
  textarea: {
    width: "100%",
    padding: "8px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    marginTop: "24px",
  },
  historyList: {
    marginTop: "8px",
  },
  historyItem: {
    padding: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
    marginBottom: "8px",
  },
  historyComment: {
    marginTop: "8px",
    fontStyle: "italic",
    color: "#6b7280",
  },
};

export default OfferApprovals;
