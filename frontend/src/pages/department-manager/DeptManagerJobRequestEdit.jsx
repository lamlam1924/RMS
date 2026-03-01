import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import deptManagerService from '../../services/deptManagerService';
import { useJobRequestForm } from '../../hooks/department-manager/useJobRequestForm';
import { formatDateForInput } from '../../utils/formatters/date';
import { toast } from '../../utils';
import JobRequestWizard from '../../components/department-manager/wizard/JobRequestWizard';

/**
 * DeptManagerJobRequestEdit
 * Form chỉnh sửa yêu cầu tuyển dụng — tái dùng wizard từ trang tạo mới
 * Cho phép chỉnh sửa khi ở trạng thái DRAFT hoặc RETURNED
 */
export default function DeptManagerJobRequestEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [positions, setPositions] = useState([]);
  const [initialJdUrl, setInitialJdUrl] = useState(null);
  const [initialData, setInitialData] = useState({});

  const {
    formData,
    errors,
    handleChange,
    handleFileChange,
    validate,
    setFormData,
  } = useJobRequestForm(initialData);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jobRequest, positionsData] = await Promise.all([
        deptManagerService.jobRequests.getById(id),
        deptManagerService.jobRequests.getPositions(),
      ]);

      const editableStatuses = ['DRAFT', 'RETURNED'];
      if (!editableStatuses.includes(jobRequest.statusCode)) {
        toast.error('Chỉ có thể chỉnh sửa yêu cầu ở trạng thái Bản nháp hoặc Đã trả lại.');
        navigate(`/staff/dept-manager/job-requests/${id}`);
        return;
      }

      setPositions(positionsData || []);
      setInitialJdUrl(jobRequest.jdFileUrl || null);

      const mapped = {
        positionId: jobRequest.positionId || '',
        quantity: jobRequest.quantity || 1,
        priority: jobRequest.priority || 3,
        budget: jobRequest.budget ? String(Math.round(jobRequest.budget)) : '',
        reason: jobRequest.reason || '',
        expectedStartDate: jobRequest.expectedStartDate
          ? formatDateForInput(jobRequest.expectedStartDate)
          : '',
      };
      setInitialData(mapped);
      setFormData({ ...mapped, jdFile: null });
    } catch (error) {
      console.error('Không thể tải yêu cầu:', error);
      toast.error('Không thể tải dữ liệu yêu cầu. Vui lòng thử lại.');
      navigate('/staff/dept-manager/job-requests');
    } finally {
      setLoading(false);
    }
  };

  const buildUpdatePayload = () => ({
    quantity: parseInt(formData.quantity, 10) || 1,
    priority: parseInt(formData.priority, 10) || 3,
    budget: formData.budget ? parseFloat(formData.budget) : null,
    reason: (formData.reason || '').trim(),
    expectedStartDate: formData.expectedStartDate || null,
  });

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await deptManagerService.jobRequests.update(id, buildUpdatePayload());
      if (formData.jdFile) {
        await deptManagerService.jobRequests.uploadJd(id, formData.jdFile);
      }
      toast.success('Đã lưu thay đổi thành công!');
      navigate(`/staff/dept-manager/job-requests/${id}`);
    } catch (error) {
      console.error('Lỗi khi lưu:', error);
      toast.error(error?.response?.data?.message || 'Không thể lưu thay đổi. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSubmit = async (note = null) => {
    if (!validate()) return;
    try {
      setSaving(true);
      await deptManagerService.jobRequests.update(id, buildUpdatePayload());
      if (formData.jdFile) {
        await deptManagerService.jobRequests.uploadJd(id, formData.jdFile);
      }
      await deptManagerService.jobRequests.submit(id, note);
      toast.success('Đã lưu và gửi yêu cầu thành công!');
      navigate('/staff/dept-manager/job-requests');
    } catch (error) {
      console.error('Lỗi khi lưu & gửi:', error);
      toast.error(error?.response?.data?.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[#fafbfc] dark:bg-slate-900">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-blue-50 dark:border-slate-700 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
          Đang tải...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-slate-900 py-16 px-4 flex flex-col items-center">
      {/* Top accent line — amber for edit mode */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500"></div>
      <div className="fixed top-20 -right-20 w-80 h-80 bg-amber-50/50 dark:bg-amber-900/10 rounded-full blur-3xl -z-10"></div>
      <div className="fixed bottom-20 -left-20 w-80 h-80 bg-orange-50/50 dark:bg-orange-900/10 rounded-full blur-3xl -z-10"></div>

      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <button
            onClick={() => navigate(`/staff/dept-manager/job-requests/${id}`)}
            className="group flex items-center mx-auto text-sm font-semibold text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-all mb-4"
          >
            <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
            Quay lại chi tiết
          </button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-3">
            Chỉnh sửa Yêu cầu Tuyển dụng
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            Cập nhật thông tin yêu cầu trước khi gửi lại để duyệt.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold">
            ✏️ Chế độ chỉnh sửa — Mã #{id}
          </div>
        </div>

        {/* Wizard — reused from Create with isEdit flag */}
        <JobRequestWizard
          formData={formData}
          errors={errors}
          loading={saving}
          positions={positions}
          handleChange={handleChange}
          handleFileChange={handleFileChange}
          handleSubmit={handleSaveAndSubmit}
          handleSaveDraft={handleSave}
          initialJdUrl={initialJdUrl}
          isEdit={true}
        />

        <div className="mt-12 text-center text-slate-400 dark:text-slate-500 text-xs font-medium opacity-60">
          <p>© 2026 RMS — Chỉnh sửa chỉ khả dụng ở trạng thái Bản nháp / Đã trả lại</p>
        </div>
      </div>

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
          border-color: #f59e0b;
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
        }
        .dark .elegant-input:focus,
        .dark .elegant-select:focus,
        .dark .elegant-textarea:focus {
          background-color: rgb(30, 41, 59);
          border-color: rgb(245, 158, 11);
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.2);
        }
      `}</style>
    </div>
  );
}
