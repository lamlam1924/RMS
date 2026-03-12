import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { candidateService } from '../../services/candidateService';

const formatDate = (s) => (s ? new Date(s).toLocaleDateString('vi-VN') : '');

function generateCvPdf(cv) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 14;
  let y = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(cv.fullName || 'CV', margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const contact = [cv.email, cv.phone].filter(Boolean).join(' | ');
  if (contact) {
    doc.text(contact, margin, y);
    y += 8;
  }

  if (cv.yearsOfExperience != null && cv.yearsOfExperience !== '') {
    doc.text(`Năm kinh nghiệm: ${cv.yearsOfExperience}`, margin, y);
    y += 8;
  }

  if (cv.summary) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Giới thiệu', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const split = doc.splitTextToSize(cv.summary, 180);
    doc.text(split, margin, y);
    y += split.length * 6 + 8;
  }

  if (cv.experiences?.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Kinh nghiệm làm việc', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    cv.experiences.forEach((exp) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(`${exp.companyName} - ${exp.jobTitle}`, margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`${formatDate(exp.startDate)} — ${exp.endDate ? formatDate(exp.endDate) : 'Hiện tại'}`, margin, y);
      y += 6;
      if (exp.description) {
        const descLines = doc.splitTextToSize(exp.description, 180);
        doc.text(descLines, margin, y);
        y += descLines.length * 5 + 4;
      } else {
        y += 4;
      }
    });
    y += 6;
  }

  if (cv.educations?.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Học vấn', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    cv.educations.forEach((edu) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(edu.schoolName, margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`${edu.degree || ''} ${edu.major ? `· ${edu.major}` : ''}`, margin, y);
      y += 6;
      doc.text(`${edu.startYear || ''} — ${edu.endYear || '—'}${edu.gpa != null ? ` · GPA ${edu.gpa}` : ''}`, margin, y);
      y += 10;
    });
    y += 4;
  }

  if (cv.certificates?.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Chứng chỉ', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    cv.certificates.forEach((c) => {
      doc.text(`${c.certificateName}${c.issuer ? ` (${c.issuer})` : ''}${c.issuedYear ? ` · ${c.issuedYear}` : ''}`, margin, y);
      y += 8;
    });
  }

  return doc;
}

export default function MyProfile() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cv, setCv] = useState(null);

  useEffect(() => {
    loadCv();
  }, []);

  const loadCv = async () => {
    try {
      setError('');
      const data = await candidateService.getMyCv();
      setCv(data);
    } catch (err) {
      setError(err.message || 'Không thể tải CV');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!cv) return;
    try {
      const doc = generateCvPdf(cv);
      const fileName = `CV_${(cv.fullName || 'Candidate').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    } catch (err) {
      setError('Không thể tạo file PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-slate-600 bg-white p-6 rounded-xl shadow-sm">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span className="font-medium">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">CV của tôi</h1>
          <p className="text-slate-500 mt-1">
            {cv ? 'Thông tin CV của bạn' : 'Chưa có CV trong hệ thống'}
          </p>
        </div>
        {cv && (
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
            </svg>
            Tải CV PDF
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!cv ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-slate-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Chưa có CV</h3>
          <p className="text-slate-500">Bạn chưa tạo CV trong hệ thống. Liên hệ quản trị viên nếu cần hỗ trợ.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full" />
              Thông tin cá nhân
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 text-slate-700">
              <div><span className="text-slate-500 text-sm">Họ và tên:</span> <span className="font-medium">{cv.fullName}</span></div>
              <div><span className="text-slate-500 text-sm">Email:</span> {cv.email || '—'}</div>
              <div><span className="text-slate-500 text-sm">Số điện thoại:</span> {cv.phone || '—'}</div>
              <div><span className="text-slate-500 text-sm">Năm kinh nghiệm:</span> {cv.yearsOfExperience ?? '—'}</div>
              {cv.summary && (
                <div className="sm:col-span-2"><span className="text-slate-500 text-sm block mb-1">Giới thiệu:</span><p className="text-slate-700 whitespace-pre-line">{cv.summary}</p></div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full" />
              Kinh nghiệm làm việc
            </h2>
            {(cv.experiences?.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {cv.experiences.map((exp, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl">
                    <div className="font-medium text-slate-800">{exp.companyName} · {exp.jobTitle}</div>
                    <div className="text-sm text-slate-500">{formatDate(exp.startDate)} — {exp.endDate ? formatDate(exp.endDate) : 'Hiện tại'}</div>
                    {exp.description && <p className="text-slate-600 text-sm mt-2">{exp.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-2">Chưa có kinh nghiệm.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full" />
              Học vấn
            </h2>
            {(cv.educations?.length ?? 0) > 0 ? (
              <div className="space-y-4">
                {cv.educations.map((edu, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-xl">
                    <div className="font-medium text-slate-800">{edu.schoolName}</div>
                    <div className="text-sm text-slate-600">{edu.degree} {edu.major && `· ${edu.major}`}</div>
                    <div className="text-sm text-slate-500">{edu.startYear} — {edu.endYear || '—'} {edu.gpa != null && `· GPA ${edu.gpa}`}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-2">Chưa có học vấn.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-600 rounded-full" />
              Chứng chỉ
            </h2>
            {(cv.certificates?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap gap-2">
                {cv.certificates.map((c, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-100 rounded-lg text-sm text-slate-700">{c.certificateName}{c.issuer && ` (${c.issuer})`}{c.issuedYear && ` · ${c.issuedYear}`}</span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm py-2">Chưa có chứng chỉ.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
