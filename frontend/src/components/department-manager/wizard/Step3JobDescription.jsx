import React, { useState, useRef } from 'react';
import { FileText, Upload, AlertCircle, X, Eye, Download } from 'lucide-react';

/**
 * Step3JobDescription - Wizard Step 3: Job Description Upload
 * Upload JD file with preview capability
 */
export default function Step3JobDescription({ formData, errors, handleFileChange, initialJdUrl = null }) {
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Call the parent's handleFileChange
      handleFileChange(e);
      
      // Generate preview for supported file types
      const fileType = file.type || '';
      if (fileType.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
      } else if (fileType === 'application/pdf') {
        setPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleRemoveFile = () => {
    // Create a synthetic event to clear the file
    const syntheticEvent = {
      target: {
        name: 'jdFile',
        files: [],
        value: ''
      }
    };
    handleFileChange(syntheticEvent);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900 flex items-center justify-center">
          <FileText className="w-6 h-6 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Job Description
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Upload file mô tả công việc chi tiết
          </p>
        </div>
      </div>

      {/* File Upload Area */}
      <div>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-1 mb-2 block">
          Tệp mô tả công việc <span className="text-red-500">*</span>
        </label>

        {/* Input always in DOM so ref is always valid and value reset works */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,image/*"
          onChange={handleChange}
          className="hidden"
        />

        {!formData.jdFile && initialJdUrl ? (
          <ExistingFileCard
            url={initialJdUrl}
            onReplace={() => fileInputRef.current?.click()}
          />
        ) : !formData.jdFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all ${
              errors.jdFile
                ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950'
                : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950'
            }`}
          >
            <div className="p-12 text-center">
              <Upload className={`w-12 h-12 mx-auto mb-4 ${
                errors.jdFile
                  ? 'text-red-400 dark:text-red-500'
                  : 'text-slate-400 dark:text-slate-500 group-hover:text-violet-500 dark:group-hover:text-violet-400'
              } transition-colors`} />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                Click để chọn file hoặc kéo thả vào đây
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hỗ trợ: PDF, DOC, DOCX, PNG, JPG (Tối đa 10MB)
              </p>
            </div>
          </div>
        ) : (
          <FilePreviewCard
            file={formData.jdFile}
            preview={preview}
            onRemove={handleRemoveFile}
            onViewPreview={() => setShowPreview(true)}
          />
        )}

        {errors.jdFile && (
          <div className="flex items-center gap-2 mt-2 px-1 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-3 h-3 text-red-500" />
            <p className="text-red-500 dark:text-red-400 text-[11px] font-bold">
              {errors.jdFile}
            </p>
          </div>
        )}
        {!errors.jdFile && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 px-1">
            File JD nên bao gồm: Mô tả công việc, yêu cầu kỹ năng, kinh nghiệm, và phúc lợi
          </p>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && preview && (
        <PreviewModal
          file={formData.jdFile}
          preview={preview}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

/**
 * File Preview Card - Shows uploaded file with actions
 */
function FilePreviewCard({ file, preview, onRemove, onViewPreview }) {
  const fileSize = file.size ? (file.size / 1024 / 1024).toFixed(2) : '0.00';
  const fileType = getFileType(file.type || file.name?.split('.').pop());

  return (
    <div className="rounded-2xl border-2 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 p-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${fileType.bgClass}`}>
          <FileText className={`w-7 h-7 ${fileType.iconClass}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mb-1">
                {file.name}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {fileSize} MB
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${fileType.badgeClass}`}>
                  {fileType.label}
                </span>
              </div>
            </div>

            <button
              onClick={onRemove}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            {preview && fileType.canPreview && (
              <button
                onClick={onViewPreview}
                className="px-3 py-1.5 rounded-lg bg-violet-600 dark:bg-violet-500 text-white text-xs font-bold hover:bg-violet-700 dark:hover:bg-violet-600 transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Xem trước
              </button>
            )}
            <button
              onClick={() => {
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                a.click();
              }}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Tải xuống
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Preview Modal - Full-screen preview for supported file types
 */
function PreviewModal({ file, preview, onClose }) {
  const fileType = getFileType(file.type || file.name?.split('.').pop());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate pr-4">
            {file.name}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-4 overflow-auto" style={{ maxHeight: 'calc(90vh - 64px)' }}>
          {(file.type || '').startsWith('image/') && (
            <img src={preview} alt={file.name} className="w-full h-auto rounded-lg" />
          )}
          {(file.type || '') === 'application/pdf' && (
            <iframe
              src={preview}
              className="w-full h-[75vh] rounded-lg"
              title="PDF Preview"
            />
          )}
          {!fileType.canPreview && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 dark:text-slate-400">
                Không thể xem trước loại file này
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Get File Type Info
 */
function getFileType(mimeType) {
  // Handle undefined or null mimeType
  if (!mimeType) {
    return {
      label: 'FILE',
      bgClass: 'bg-slate-100 dark:bg-slate-800',
      iconClass: 'text-slate-600 dark:text-slate-400',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      canPreview: false
    };
  }
  
  // Convert to lowercase for case-insensitive comparison
  const type = mimeType.toLowerCase();
  
  // Check for PDF
  if (type === 'application/pdf' || type === 'pdf') {
    return {
      label: 'PDF',
      bgClass: 'bg-red-100 dark:bg-red-900',
      iconClass: 'text-red-600 dark:text-red-400',
      badgeClass: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
      canPreview: true
    };
  } 
  
  // Check for Word documents
  if (type.includes('word') || type.includes('document') || type === 'doc' || type === 'docx') {
    return {
      label: 'DOC',
      bgClass: 'bg-blue-100 dark:bg-blue-900',
      iconClass: 'text-blue-600 dark:text-blue-400',
      badgeClass: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
      canPreview: false
    };
  } 
  
  // Check for images
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(type)) {
    return {
      label: 'IMG',
      bgClass: 'bg-emerald-100 dark:bg-emerald-900',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
      canPreview: true
    };
  }
  
  // Default fallback
  return {
    label: 'FILE',
    bgClass: 'bg-slate-100 dark:bg-slate-800',
    iconClass: 'text-slate-600 dark:text-slate-400',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    canPreview: false
  };
}

/**
 * ExistingFileCard - Shows the already-uploaded JD file when editing
 */
function ExistingFileCard({ url, onReplace }) {
  const fileName = url.split('/').pop().split('?')[0] || 'job-description';
  return (
    <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 p-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
          <FileText className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mb-1">
                {fileName}
              </h3>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                ĐÃ TẢI LÊN
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Xem file hiện tại
            </a>
            <button
              onClick={onReplace}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Thay thế file
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
