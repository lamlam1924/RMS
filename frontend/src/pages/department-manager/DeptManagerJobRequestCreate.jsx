import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight, PlusCircle } from "lucide-react";
import deptManagerService from "../../services/deptManagerService";
import { useJobRequestForm } from "../../hooks/department-manager/useJobRequestForm";
import { useAutoSave } from "../../hooks/useAutoSave";
import DraftIndicator from "../../components/common/DraftIndicator";
import DraftRecoveryModal from "../../components/common/DraftRecoveryModal";
import JobRequestWizard from "../../components/department-manager/wizard/JobRequestWizard";
import notify from "../../utils/notification";

/**
 * DeptManagerJobRequestCreate Component
 * Giao diện tối giản, tinh tế, lấy cảm hứng từ LandingPageNew
 * Tập trung vào trải nghiệm mượt mà và mỹ thuật cao cấp (Recruitment Theme)
 */
export default function DeptManagerJobRequestCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState([]);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdId, setCreatedId] = useState(null);

  const {
    formData,
    errors,
    handleChange,
    handleFileChange,
    validate,
    buildPayload,
    setFormData,
  } = useJobRequestForm();

  // Auto-save functionality
  const { lastSaved, clearDraft, hasDraft, loadDraft } = useAutoSave(formData, {
    key: 'dept-manager-job-request-draft',
    interval: 30000, // Save every 30 seconds
    enabled: true,
  });

  useEffect(() => {
    loadPositions();
    
    // Check for existing draft on mount
    if (hasDraft()) {
      const draft = loadDraft();
      if (draft && draft.data) {
        setShowRecoveryModal(true);
      }
    }
  }, []);

  const loadPositions = async () => {
    try {
      const data = await deptManagerService.jobRequests.getPositions();
      setPositions(data || []);
    } catch (error) {
      console.error("Không thể tải danh sách vị trí:", error);
    }
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const payload = buildPayload();
      const response = await deptManagerService.jobRequests.create(payload);
      clearDraft();
      setCreatedId(response?.data?.id ?? null);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Lỗi khi lưu nháp:", error);
      notify.error(error.message || "Có lỗi xảy ra khi lưu nháp.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = () => {
    navigate(`/staff/dept-manager/job-requests/${createdId}`);
  };

  const handleCreateAnother = () => {
    // Navigate to same route to fully reset the component + auto-save state
    navigate(0);
  };

  const handleRestoreDraft = () => {
    const draft = loadDraft();
    if (draft && draft.data) {
      setFormData(draft.data);
      setShowRecoveryModal(false);
    }
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowRecoveryModal(false);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-slate-900 py-16 px-4 flex flex-col items-center">
      {/* Background Decor - Subtle Gradients */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>
      <div className="fixed top-20 -right-20 w-80 h-80 bg-blue-50/50 dark:bg-blue-900/20 rounded-full blur-3xl -z-10"></div>
      <div className="fixed bottom-20 -left-20 w-80 h-80 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-3xl">
        {/* Navigation & Title */}
        <div className="mb-12 text-center">
          <button
            onClick={() => navigate("/staff/dept-manager/job-requests")}
            className="group flex items-center mx-auto text-sm font-semibold text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all mb-4"
          >
            <span className="mr-2 group-hover:-translate-x-1 transition-transform">
              ←
            </span>
            Quay lại danh sách
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-3">
            Khởi tạo Yêu cầu Tuyển dụng
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            Hãy mô tả vị trí bạn cần để chúng tôi tìm kiếm tài năng phù hợp
            nhất.
          </p>
          
          {/* Draft Auto-save Indicator */}
          <div className="mt-4 flex justify-center">
            <DraftIndicator lastSaved={lastSaved} />
          </div>
        </div>

        {/* Wizard Form */}
        <JobRequestWizard
          formData={formData}
          errors={errors}
          loading={loading}
          positions={positions}
          handleChange={handleChange}
          handleFileChange={handleFileChange}
          handleSaveDraft={handleSaveDraft}
        />

        {/* Footer Info */}
        <div className="mt-12 text-center text-slate-400 dark:text-slate-500 text-xs font-medium space-y-2 opacity-60">
          <p>© 2026 RMS - Recruitment Management System</p>
          <p>
            Thông tin của bạn sẽ được bảo mật và trình duyệt bởi bộ phận Nhân sự.
          </p>
        </div>
      </div>

      {/* Draft Recovery Modal */}
      <DraftRecoveryModal
        isOpen={showRecoveryModal}
        timestamp={loadDraft()?.timestamp}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-10 pb-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Tạo yêu cầu thành công!
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Yêu cầu đã được lưu ở trạng thái <span className="font-semibold text-slate-700 dark:text-slate-300">Bản nháp</span>.
                Vào trang chi tiết để xem lại và gửi duyệt lên HR.
              </p>
            </div>

            {/* Actions */}
            <div className="px-8 pb-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleViewDetail}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white font-bold hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 dark:shadow-blue-900 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Xem chi tiết &amp; Gửi duyệt
              </button>
              <button
                type="button"
                onClick={handleCreateAnother}
                className="w-full py-3.5 px-6 rounded-2xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Tạo yêu cầu khác
              </button>
              <button
                type="button"
                onClick={() => navigate("/staff/dept-manager/job-requests")}
                className="w-full py-2 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                Về danh sách
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Styles for Wizard */}
      <style jsx="true">{`
        .elegant-input,
        .elegant-select,
        .elegant-textarea {
          width: 100%;
          padding: 0.875rem 1.25rem;
          background-color: #fcfdfe;
          border: 1.5px solid #edf1f7;
          border-radius: 1rem;
          color: #1e293b;
          font-size: 0.9375rem;
          font-weight: 600;
          outline: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .dark .elegant-input,
        .dark .elegant-select,
        .dark .elegant-textarea {
          background-color: rgb(51, 65, 85);
          border-color: rgb(71, 85, 105);
          color: rgb(226, 232, 240);
        }
        
        .elegant-input:focus,
        .elegant-select:focus,
        .elegant-textarea:focus {
          background-color: #ffffff;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        
        .dark .elegant-input:focus,
        .dark .elegant-select:focus,
        .dark .elegant-textarea:focus {
          background-color: rgb(30, 41, 59);
          border-color: rgb(59, 130, 246);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
        }
        
        .elegant-input::placeholder {
          color: #94a3b8;
          font-weight: 500;
        }
        
        .dark .elegant-input::placeholder {
          color: rgb(100, 116, 139);
        }
        
        .elegant-textarea {
          resize: none;
        }
      `}</style>
    </div>
  );
}
