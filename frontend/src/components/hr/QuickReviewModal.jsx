import React, { useState, useEffect } from 'react';
import { X, Briefcase, Calendar, DollarSign, Users, FileText, Clock, Send, CornerUpLeft, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatVND } from '../../utils/formatters/currency';
import { formatDateDisplay } from '../../utils/formatters/date';
import SLABadge from '../common/SLABadge';
import { getPriorityBadge } from '../../utils/helpers/badge';

/**
 * QuickReviewModal Component
 * Modal for HR Manager to quickly review and act on job requests without navigation
 * @param {boolean} isOpen - Whether modal is open
 * @param {Function} onClose - Callback when modal closes
 * @param {number} requestId - Job request ID to review
 * @param {Function} onAction - Callback when action is taken (forward/return)
 * @param {Function} fetchDetails - Function to fetch job request details
 */
export default function QuickReviewModal({ 
  isOpen, 
  onClose, 
  requestId,
  onAction,
  fetchDetails
}) {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [request, setRequest] = useState(null);
  const [note, setNote] = useState('');
  const [actionType, setActionType] = useState(null); // 'forward' or 'return'
  const [showNoteInput, setShowNoteInput] = useState(false);

  useEffect(() => {
    if (isOpen && requestId) {
      loadRequestDetails();
    }
  }, [isOpen, requestId]);

  const loadRequestDetails = async () => {
    try {
      setLoading(true);
      const data = await fetchDetails(requestId);
      setRequest(data);
    } catch (error) {
      console.error('Failed to load request details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type) => {
    if (!showNoteInput) {
      setActionType(type);
      setShowNoteInput(true);
      return;
    }

    try {
      setActionLoading(true);
      await onAction(requestId, type, note);
      setNote('');
      setShowNoteInput(false);
      setActionType(null);
      onClose();
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const cancelAction = () => {
    setShowNoteInput(false);
    setActionType(null);
    setNote('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Đánh giá nhanh
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {loading ? 'Đang tải...' : `#${requestId}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-180px)] px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
          ) : request ? (
            <div className="space-y-6">
              {/* Title & Status */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {request.positionTitle}
                  </h3>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                      {request.currentStatus}
                    </span>
                    {request.priority && (
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider ${getPriorityBadge(request.priority).className}`}>
                        {getPriorityBadge(request.priority).label}
                      </span>
                    )}
                    <SLABadge 
                      createdDate={request.createdAt} 
                      priority={request.priority} 
                      status={request.currentStatus}
                      size="sm"
                      showTime={true}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    <span>{request.departmentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{formatDateDisplay(request.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Key Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoCard
                  icon={Users}
                  label="Số lượng"
                  value={`${request.quantity} nhân sự`}
                  color="blue"
                />
                <InfoCard
                  icon={DollarSign}
                  label="Ngân sách"
                  value={formatVND(request.budget)}
                  color="green"
                />
                <InfoCard
                  icon={Calendar}
                  label="Ngày bắt đầu"
                  value={formatDateDisplay(request.expectedStartDate)}
                  color="purple"
                />
                <InfoCard
                  icon={AlertCircle}
                  label="Ưu tiên"
                  value={getPriorityBadge(request.priority).label}
                  color={request.priority === 1 ? 'red' : request.priority === 2 ? 'amber' : 'slate'}
                />
              </div>

              {/* Reason */}
              <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Lý do tuyển dụng
                  </h4>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {request.reason}
                </p>
              </div>

              {/* JD File */}
              {request.jdFileUrl && (
                <div className="space-y-3">
                  {request.jdFileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <div className="relative border-2 border-blue-200 dark:border-blue-800 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                      <img
                        src={`/api/files/jd/${request.id}`}
                        alt="Job Description"
                        className="w-full h-auto max-h-[600px] object-contain"
                      />
                    </div>
                  ) : null}
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                        Bản mô tả công việc (JD)
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        {request.jdFileName || 'job-description.pdf'}
                      </div>
                    </div>
                    <a
                      href={`/api/files/jd/${request.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Xem
                    </a>
                  </div>
                </div>
              )}

              {/* Note Input (when action is selected) */}
              {showNoteInput && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <h4 className="text-sm font-bold text-yellow-900 dark:text-yellow-300 uppercase tracking-wider">
                      {actionType === 'forward' ? 'Ghi chú chuyển tiếp' : 'Lý do trả lại'}
                    </h4>
                  </div>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={
                      actionType === 'forward' 
                        ? 'Nhập ghi chú (tùy chọn)...' 
                        : 'Nhập lý do trả lại (bắt buộc)...'
                    }
                    rows={3}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-yellow-300 dark:border-yellow-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all resize-none"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20">
              <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                Không thể tải thông tin yêu cầu
              </p>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        {!loading && request && (
          <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-8 py-6">
            {showNoteInput ? (
              <div className="flex gap-3">
                <button
                  onClick={cancelAction}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleAction(actionType)}
                  disabled={actionLoading || (actionType === 'return' && !note.trim())}
                  className={`
                    flex-[2] px-6 py-3 rounded-xl font-semibold text-sm text-white
                    transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                    ${actionType === 'forward' 
                      ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600' 
                      : 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                    }
                  `}
                >
                  {actionLoading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      {actionType === 'forward' ? <Send className="w-4 h-4" /> : <CornerUpLeft className="w-4 h-4" />}
                      <span>{actionType === 'forward' ? 'Xác nhận chuyển tiếp' : 'Xác nhận trả lại'}</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction('return')}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CornerUpLeft className="w-4 h-4" />
                  <span>Trả lại</span>
                </button>
                <button
                  onClick={() => handleAction('forward')}
                  disabled={actionLoading}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>Chuyển tiếp</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * InfoCard Component
 * Display key information in a card format
 */
function InfoCard({ icon: Icon, label, value, color = 'blue' }) {
  const colorClasses = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    green:  'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    amber:  'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
    red:    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
    slate:  'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
          {label}
        </span>
      </div>
      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </div>
  );
}
