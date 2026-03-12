import React, { useState, useEffect } from "react";
import { candidateService } from "../../services/candidateService";
import notify from "../../utils/notification";

const STATUS_LABELS = {
  14: { label: "Nháp", color: "bg-gray-100 text-gray-700" },
  15: { label: "Đang duyệt", color: "bg-amber-100 text-amber-800" },
  16: { label: "Đã duyệt", color: "bg-blue-100 text-blue-800" },
  17: { label: "Từ chối", color: "bg-red-100 text-red-800" },
  18: { label: "Đã gửi", color: "bg-emerald-100 text-emerald-800" },
  19: { label: "Đã chấp nhận", color: "bg-green-100 text-green-800" },
  20: { label: "Đã từ chối", color: "bg-red-100 text-red-800" },
  21: { label: "Đang thương lượng", color: "bg-purple-100 text-purple-800" },
};

const CAN_RESPOND_STATUSES = [16, 18, 21]; // APPROVED (Đã duyệt), SENT, NEGOTIATING

export default function MyOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [respondModal, setRespondModal] = useState({ show: false, action: null });
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      setError("");
      const data = await candidateService.getMyOffers();
      setOffers(data);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách thư mời");
    } finally {
      setLoading(false);
    }
  };

  const loadOfferDetail = async (id) => {
    try {
      const data = await candidateService.getOfferById(id);
      setSelectedOffer(data);
    } catch (err) {
      notify.error(err.message || "Không thể tải chi tiết");
    }
  };

  const handleViewDetail = (offer) => {
    setSelectedOffer(null);
    loadOfferDetail(offer.id);
  };

  const handleCloseDetail = () => {
    setSelectedOffer(null);
  };

  const handleRespondClick = (action) => {
    setRespondModal({ show: true, action });
    setComment("");
  };

  const handleRespondSubmit = async () => {
    const action = respondModal.action;
    const responseMap = { accept: "ACCEPT", negotiate: "NEGOTIATE", reject: "REJECT" };
    const responseValue = responseMap[action];

    try {
      setSubmitting(true);
      await candidateService.respondToOffer(selectedOffer.id, responseValue, comment);
      notify.success("Đã gửi phản hồi thành công");
      setRespondModal({ show: false, action: null });
      setSelectedOffer(null);
      loadOffers();
    } catch (err) {
      notify.error(err.message || "Phản hồi thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const formatSalary = (val) => {
    if (!val) return "Thỏa thuận";
    return `${(val / 1000000).toFixed(0)} triệu VNĐ`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (statusId) => {
    const s = STATUS_LABELS[statusId] || { label: "N/A", color: "bg-gray-100 text-gray-700" };
    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
        {s.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600 bg-white p-6 rounded-xl shadow-sm">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span className="font-medium">Đang tải thư mời...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Thư mời nhận việc</h1>
        <p className="text-slate-500 mt-1">Xem và phản hồi các thư mời từ công ty</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {offers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-slate-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Chưa có thư mời nào</h3>
          <p className="text-slate-500">Khi có thư mời nhận việc, chúng sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              onClick={() => handleViewDetail(offer)}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{offer.positionTitle}</h3>
                  <p className="text-slate-600 text-sm mt-1">{offer.departmentName}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                    <span>Lương: {formatSalary(offer.salary)}</span>
                    <span>•</span>
                    <span>Ngày tạo: {formatDate(offer.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(offer.statusId)}
                  {CAN_RESPOND_STATUSES.includes(offer.statusId) && (
                    <span className="text-xs text-emerald-600 font-medium">Cần phản hồi</span>
                  )}
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={handleCloseDetail}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 flex justify-between items-start">
              <h2 className="text-xl font-bold text-slate-900">Chi tiết thư mời</h2>
              <button
                onClick={handleCloseDetail}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">{selectedOffer.positionTitle}</h3>
                <p className="text-slate-600">{selectedOffer.departmentName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-slate-500">Mức lương</span>
                  <p className="font-medium text-slate-900">{formatSalary(selectedOffer.salary)}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Ngày bắt đầu</span>
                  <p className="font-medium text-slate-900">{formatDate(selectedOffer.startDate)}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Ngày gửi</span>
                  <p className="font-medium text-slate-900">{formatDate(selectedOffer.sentAt)}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Trạng thái</span>
                  <div className="mt-1">{getStatusBadge(selectedOffer.statusId)}</div>
                </div>
              </div>
              {selectedOffer.benefits && (
                <div>
                  <span className="text-sm text-slate-500 block mb-2">Quyền lợi</span>
                  <p className="text-slate-700 whitespace-pre-line">{selectedOffer.benefits}</p>
                </div>
              )}
              {selectedOffer.candidateResponse && (
                <div>
                  <span className="text-sm text-slate-500 block mb-2">Phản hồi của bạn</span>
                  <p className="text-slate-700 font-medium">{selectedOffer.candidateResponse}</p>
                  {selectedOffer.candidateComment && (
                    <p className="text-slate-600 text-sm mt-1">{selectedOffer.candidateComment}</p>
                  )}
                </div>
              )}
              {CAN_RESPOND_STATUSES.includes(selectedOffer.statusId) && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-700 mb-3">Phản hồi thư mời</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleRespondClick("accept")}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      Chấp nhận
                    </button>
                    <button
                      onClick={() => handleRespondClick("negotiate")}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
                    >
                      Thương lượng
                    </button>
                    <button
                      onClick={() => handleRespondClick("reject")}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Respond Confirmation Modal */}
      {respondModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {respondModal.action === "accept" && "Chấp nhận thư mời"}
              {respondModal.action === "negotiate" && "Yêu cầu thương lượng"}
              {respondModal.action === "reject" && "Từ chối thư mời"}
            </h3>
            <p className="text-slate-600 text-sm mb-4">
              {(respondModal.action === "negotiate" || respondModal.action === "reject") &&
                "Bạn có thể ghi chú thêm (tuỳ chọn):"}
            </p>
            {(respondModal.action === "negotiate" || respondModal.action === "reject") && (
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhập nội dung..."
                className="w-full border border-slate-200 rounded-lg p-3 text-sm mb-4 resize-none"
                rows={3}
              />
            )}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRespondModal({ show: false, action: null })}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                Huỷ
              </button>
              <button
                onClick={handleRespondSubmit}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${
                  respondModal.action === "accept"
                    ? "bg-green-600 hover:bg-green-700"
                    : respondModal.action === "negotiate"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50`}
              >
                {submitting ? "Đang gửi..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
