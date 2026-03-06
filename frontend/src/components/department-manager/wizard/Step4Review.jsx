import React from 'react';
import { CheckCircle2, Calendar, Briefcase, DollarSign, FileText, AlertTriangle } from 'lucide-react';
import { getPriorityBadge } from '../../../utils/helpers/badge';

/**
 * Step4Review - Wizard Step 4: Review & Submit
 * Summary of all inputs before submission
 */
export default function Step4Review({ formData, positions }) {
  const position = positions.find(p => p.id == formData.positionId);
  const priorityBadge = getPriorityBadge(formData.priority);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Xác nhận & gửi
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Kiểm tra lại thông tin trước khi gửi yêu cầu
          </p>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info Card */}
        <ReviewCard
          icon={<Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
          title="Thông tin cơ bản"
          bgClass="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
        >
          <ReviewItem label="Vị trí" value={position?.title || 'N/A'} />
          <ReviewItem
            label="Độ ưu tiên"
            value={
              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${priorityBadge.className}`}>
                {priorityBadge.label}
              </span>
            }
          />
          <ReviewItem label="Số lượng" value={`${formData.quantity} nhân sự`} />
        </ReviewCard>

        {/* Date Card */}
        <ReviewCard
          icon={<Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
          title="Thời gian"
          bgClass="bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-800"
        >
          <ReviewItem
            label="Ngày bắt đầu mong muốn"
            value={formatDate(formData.expectedStartDate)}
          />
        </ReviewCard>

        {/* Budget Card */}
        <ReviewCard
          icon={<DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          title="Ngân sách"
          bgClass="bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800"
        >
          <ReviewItem
            label="Ngân sách tháng"
            value={`${formatCurrency(formData.budget)} VNĐ`}
          />
          <ReviewItem
            label="Ước tính năm"
            value={`${formatCurrency((parseInt(formData.budget) * 12).toString())} VNĐ`}
            className="text-emerald-600 dark:text-emerald-400 font-bold"
          />
        </ReviewCard>

        {/* JD File Card */}
        <ReviewCard
          icon={<FileText className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
          title="Job Description"
          bgClass="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800"
        >
          {formData.jdFile ? (
            <>
              <ReviewItem label="Tên file" value={formData.jdFile.name} />
              <ReviewItem
                label="Kích thước"
                value={`${(formData.jdFile.size / 1024 / 1024).toFixed(2)} MB`}
              />
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có file</p>
          )}
        </ReviewCard>
      </div>

      {/* Reason Section */}
      <ReviewCard
        icon={<AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
        title="Lý do tuyển dụng"
        bgClass="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800"
      >
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {formData.reason || 'Chưa có lý do'}
          </p>
        </div>
      </ReviewCard>

      {/* Important Note */}
      <div className="rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950 dark:to-sky-950 p-6">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">
              Lưu ý quan trọng
            </h4>
            <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
              <li>• Yêu cầu sẽ được gửi đến HR để xem xét và xử lý</li>
              <li>• Bạn có thể theo dõi trạng thái yêu cầu trong mục "Yêu cầu tuyển dụng"</li>
              <li>• Thời gian xử lý phụ thuộc vào độ ưu tiên và tình trạng công việc của HR</li>
              <li>• Sau khi gửi, bạn không thể chỉnh sửa. Vui lòng kiểm tra kỹ thông tin</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Review Card Component - Wrapper for review sections
 */
function ReviewCard({ icon, title, bgClass, children }) {
  return (
    <div className={`rounded-2xl border-2 p-5 ${bgClass}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

/**
 * Review Item Component - Label-value pair
 */
function ReviewItem({ label, value, className = '' }) {
  return (
    <div className="flex justify-between items-start gap-3">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {label}:
      </span>
      <span className={`text-sm font-bold text-slate-900 dark:text-slate-100 text-right ${className}`}>
        {value}
      </span>
    </div>
  );
}

/**
 * Format Currency - Adds thousand separators
 */
function formatCurrency(value) {
  if (!value) return '0';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format Date - Vietnamese date format
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
