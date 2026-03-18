import { useState, useEffect } from "react";
import directorService from "../../services/directorService";
import { ViewIcon, EditIcon } from "../../components/admin/ActionIcons";
import notify from "../../utils/notification";

const JobRequestApprovals = () => {
  const [jobRequests, setJobRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState(""); // "approve" or "reject"
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadJobRequests();
  }, []);

  const loadJobRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await directorService.jobRequests.getPending();
      setJobRequests(data);
    } catch (err) {
      setError("Failed to load job requests: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (id) => {
    try {
      const detail = await directorService.jobRequests.getDetail(id);
      setSelectedRequest(detail);
      setShowDetailModal(true);
    } catch (err) {
      notify.error("Không thể tải thông tin chi tiết: " + err.message);
    }
  };

  const handleApprovalClick = (request, action) => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setComment("");
    setShowApprovalModal(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedRequest) return;

    try {
      if (approvalAction === "approve") {
        await directorService.jobRequests.approve(selectedRequest.id, comment);
        notify.success("Phê duyệt yêu cầu tuyển dụng thành công");
      } else {
        await directorService.jobRequests.reject(selectedRequest.id, comment);
        notify.success("Từ chối yêu cầu tuyển dụng thành công");
      }
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setComment("");
      loadJobRequests();
    } catch (err) {
      notify.error("Thao tác thất bại: " + err.message);
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return "High";
      case 2: return "Medium";
      case 3: return "Low";
      default: return "Unknown";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return "#ef4444";
      case 2: return "#f97316";
      case 3: return "#10b981";
      default: return "#6b7280";
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Job Request Approvals</h1>
        <button onClick={loadJobRequests} style={styles.refreshBtn}>
          Refresh
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : jobRequests.length === 0 ? (
        <div style={styles.empty}>No pending job requests</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Position</th>
                <th style={styles.th}>Department</th>
                <th style={styles.th}>Requested By</th>
                <th style={styles.th}>Quantity</th>
                <th style={styles.th}>Priority</th>
                <th style={styles.th}>Budget</th>
                <th style={styles.th}>Created</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobRequests.map((req) => (
                <tr key={req.id} style={styles.tr}>
                  <td style={styles.td}>{req.id}</td>
                  <td style={styles.td}>{req.positionTitle}</td>
                  <td style={styles.td}>{req.departmentName}</td>
                  <td style={styles.td}>{req.requestedByName}</td>
                  <td style={styles.td}>{req.quantity}</td>
                  <td style={styles.td}>
                    <span style={{...styles.badge, backgroundColor: getPriorityColor(req.priority)}}>
                      {getPriorityLabel(req.priority)}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {req.budget ? `${req.budget.toLocaleString()} VND` : "N/A"}
                  </td>
                  <td style={styles.td}>
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => handleViewDetail(req.id)}
                        style={{...styles.btnIcon, color: "#3b82f6"}}
                        title="View Detail"
                      >
                        <ViewIcon />
                      </button>
                      <button
                        onClick={() => handleApprovalClick(req, "approve")}
                        style={{...styles.btnAction, ...styles.btnApprove}}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprovalClick(req, "reject")}
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
      {showDetailModal && selectedRequest && (
        <div style={styles.modalOverlay} onClick={() => setShowDetailModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>Job Request Detail</h2>
              <button onClick={() => setShowDetailModal(false)} style={styles.closeBtn}>×</button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.detailGroup}>
                <label>Position:</label>
                <p>{selectedRequest.positionTitle}</p>
              </div>
              <div style={styles.detailGroup}>
                <label>Department:</label>
                <p>{selectedRequest.departmentName}</p>
              </div>
              <div style={styles.detailGroup}>
                <label>Requested By:</label>
                <p>{selectedRequest.requestedByName} ({selectedRequest.requestedByEmail})</p>
              </div>
              <div style={styles.detailGroup}>
                <label>Quantity:</label>
                <p>{selectedRequest.quantity}</p>
              </div>
              <div style={styles.detailGroup}>
                <label>Priority:</label>
                <p>{getPriorityLabel(selectedRequest.priority)}</p>
              </div>
              <div style={styles.detailGroup}>
                <label>Budget:</label>
                <p>{selectedRequest.budget ? `${selectedRequest.budget.toLocaleString()} VND` : "N/A"}</p>
              </div>
              <div style={styles.detailGroup}>
                <label>Reason:</label>
                <p>{selectedRequest.reason || "N/A"}</p>
              </div>
              <div style={styles.detailGroup}>
                <label>Expected Start Date:</label>
                <p>{selectedRequest.expectedStartDate ? new Date(selectedRequest.expectedStartDate).toLocaleDateString() : "N/A"}</p>
              </div>
              
              {selectedRequest.approvalHistory && selectedRequest.approvalHistory.length > 0 && (
                <div style={styles.detailGroup}>
                  <label>Approval History:</label>
                  <div style={styles.historyList}>
                    {selectedRequest.approvalHistory.map((h, idx) => (
                      <div key={idx} style={styles.historyItem}>
                        <strong>{h.statusName}</strong> by {h.changedByName} ({h.changedByRole})
                        <br />
                        <small>{new Date(h.changedAt).toLocaleString()}</small>
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
      {showApprovalModal && selectedRequest && (
        <div style={styles.modalOverlay} onClick={() => setShowApprovalModal(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2>{approvalAction === "approve" ? "Approve" : "Reject"} Job Request</h2>
              <button onClick={() => setShowApprovalModal(false)} style={styles.closeBtn}>×</button>
            </div>
            <div style={styles.modalBody}>
              <p>
                <strong>Position:</strong> {selectedRequest.positionTitle}<br />
                <strong>Department:</strong> {selectedRequest.departmentName}<br />
                <strong>Requested By:</strong> {selectedRequest.requestedByName}
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
  badge: {
    padding: "4px 8px",
    borderRadius: "4px",
    color: "white",
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

export default JobRequestApprovals;
