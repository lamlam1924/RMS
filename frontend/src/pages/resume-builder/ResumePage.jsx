import React, { useState, useEffect, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import Sidebar from '../../components/resume-builder/Sidebar.jsx';
import MainContent from '../../components/resume-builder/MainContent.jsx';
import { createResume, getResume, updateResume } from '../../services/resumeBuilderApi.js';
import { authService } from '../../services/authService.js';

const STORAGE_KEY = 'resume-builder-draft';
const DEFAULT_RESUME = {
  id: null,
  candidateId: 1,
  name: '',
  title: '',
  profile: '',
  details: { address: '', phone: '', email: '' },
  skills: [{ id: 1, name: 'Communication', level: 80 }],
  jobs: [{ id: 1, title: '', company: '', location: '', date: '', description: [] }],
  education: [],
  references: [],
};

/**
 * ResumePage - Full editable resume builder
 * - Two-column layout (30% sidebar / 70% main)
 * - Edit / View mode toggle
 * - Auto-save to localStorage
 * - Save to API (POST/PUT)
 * - Download PDF
 */
export default function ResumePage() {
  const [resume, setResume] = useState(() => {
    const user = authService.getUserInfo();
    const candidateId = user?.candidateId ?? user?.sub ?? user?.id ?? 1;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_RESUME, candidateId, ...JSON.parse(saved) };
    } catch (_) {}
    return { ...DEFAULT_RESUME, candidateId };
  });
  const [editMode, setEditMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const resumeRef = useRef(null);

  // Load resume from API when ID in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      setLoading(true);
      getResume(id)
        .then((res) => {
          const payload = res?.data ?? res;
          if (payload) {
            const merged = typeof payload === 'object' && 'data' in payload
              ? payload.data
              : payload;
            setResume({ ...DEFAULT_RESUME, ...merged, id: res.id ?? payload.id ?? parseInt(id, 10) });
          }
        })
        .catch(() => setToast({ type: 'error', msg: 'Failed to load resume' }))
        .finally(() => setLoading(false));
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resume));
    } catch (_) {}
  }, [resume]);

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { candidateId: resume.candidateId, data: resume };
      if (resume.id) {
        await updateResume(resume.id, { data: resume });
        showToast('success', 'Resume saved successfully!');
      } else {
        const result = await createResume(payload);
        setResume((r) => ({ ...r, id: result.id }));
        showToast('success', 'Resume created successfully!');
        window.history.replaceState({}, '', `?id=${result.id}`);
      }
    } catch (err) {
      showToast('error', err?.response?.data?.error || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!resumeRef.current) return;
    const wasEditMode = editMode;
    setEditMode(false);
    await new Promise((r) => setTimeout(r, 150));
    try {
      const el = resumeRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageW) / canvas.width;
      const totalPages = Math.ceil(imgHeight / pageH) || 1;
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -(i * pageH), pageW, imgHeight);
      }
      pdf.save('resume.pdf');
      showToast('success', 'PDF downloaded!');
    } catch (err) {
      showToast('error', 'Failed to generate PDF');
    } finally {
      setEditMode(wasEditMode);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Resume Builder</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditMode(!editMode)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-medium"
            >
              {editMode ? 'View Mode' : 'Edit Mode'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800 font-medium"
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
            }`}
          >
            {toast.msg}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Resume container - A4 friendly, no shadow when print */}
        {!loading && (
          <div
            ref={resumeRef}
            className="bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none print:rounded-none resume-print"
            style={{ maxWidth: 1000 }}
          >
            <div className="flex">
              <Sidebar data={resume} onChange={setResume} editMode={editMode} />
              <MainContent data={resume} onChange={setResume} editMode={editMode} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          .resume-print { box-shadow: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
