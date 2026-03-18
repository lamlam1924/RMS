import React from 'react';

/**
 * CV Template - Professional two-column layout
 * Left: dark green sidebar (photo, name, title, contact, skills)
 * Right: white content (Profile, Employment History, Education, References)
 */
export default function CvTemplate({ cv, className = '' }) {
  if (!cv) return null;

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
      'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const parseReferences = (text) => {
    if (!text?.trim()) return [];
    return text.split('\n').filter(Boolean).map(line => {
      const parts = line.split('|').map(p => p.trim());
      return { name: parts[0] || '', company: parts[1] || '', email: parts[2] || '', phone: parts[3] || '' };
    });
  };

  const skills = cv.skillsText?.split(/[,;\n]/).map(s => s.trim()).filter(Boolean) || [];
  const references = parseReferences(cv.referencesText);

  return (
    <div className={`cv-template bg-white shadow-lg ${className}`} style={{ maxWidth: 794 }}>
      <div className="flex">
        {/* Left column - dark green sidebar */}
        <div className="w-[36%] bg-[#1e4d3c] text-white p-6 flex flex-col">
          {/* Photo placeholder */}
          <div className="w-24 h-24 rounded-full bg-white/20 border-2 border-amber-400/60 mx-auto mb-4 flex items-center justify-center overflow-hidden">
            <svg className="w-12 h-12 text-white/80" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>

          <h1 className="text-xl font-bold text-center mb-1">{cv.fullName}</h1>
          <p className="text-xs uppercase tracking-wider text-center text-white/90 mb-6">
            {cv.professionalTitle || 'Professional'}
          </p>

          <h2 className="text-sm font-bold uppercase mb-2">Details</h2>
          <div className="space-y-2 text-sm text-white/95">
            {cv.address && <p>{cv.address}</p>}
            {cv.phone && <p>{cv.phone}</p>}
            {cv.email && <p>{cv.email}</p>}
          </div>

          <h2 className="text-sm font-bold uppercase mt-6 mb-2">Skills</h2>
          {skills.length > 0 ? (
            <div className="space-y-2">
              {skills.map((skill, i) => (
                <div key={i} className="text-sm">
                  <p className="text-white/95">{skill}</p>
                  <div className="h-1.5 mt-0.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-slate-300 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/70 italic">Chưa có kỹ năng. Nhấn Cập nhật để thêm.</p>
          )}
        </div>

        {/* Right column - white content */}
        <div className="w-[64%] p-8 text-slate-800">
          <h2 className="text-base font-bold uppercase mb-3 text-slate-900">Profile</h2>
          {cv.summary ? (
            <p className="text-sm leading-relaxed">{cv.summary}</p>
          ) : (
            <p className="text-sm text-slate-500 italic">Chưa có giới thiệu. Nhấn Cập nhật để thêm.</p>
          )}
          <div className="h-6" />

          <h2 className="text-base font-bold uppercase mb-3 text-slate-900">Employment History</h2>
          {(cv.experiences?.length ?? 0) > 0 ? (
            <div className="space-y-4">
              {cv.experiences.map((exp, i) => (
                <div key={i}>
                  <p className="font-semibold text-sm">
                    {exp.jobTitle}, {exp.companyName}{exp.location ? `, ${exp.location}` : ''}
                  </p>
                  <p className="text-xs text-slate-500 mb-1">
                    {formatMonthYear(exp.startDate)} - {exp.endDate ? formatMonthYear(exp.endDate) : 'PRESENT'}
                  </p>
                  {exp.description && (
                    <ul className="text-sm space-y-0.5 list-disc list-inside text-slate-700">
                      {exp.description.split(/[.\n]/).filter(Boolean).map((line, j) => (
                        <li key={j}>{line.trim()}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">Chưa có kinh nghiệm. Nhấn Cập nhật để thêm.</p>
          )}
          <div className="h-6" />

          <h2 className="text-base font-bold uppercase mb-3 text-slate-900">Education</h2>
          {(cv.educations?.length ?? 0) > 0 ? (
            <div className="space-y-4">
              {cv.educations.map((edu, i) => (
                <div key={i}>
                  <p className="font-semibold text-sm">
                    {[edu.degree, edu.major, edu.schoolName, edu.location].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {edu.startYear && edu.endYear ? `${edu.startYear} - ${edu.endYear}` : edu.endYear || ''}
                    {edu.gpa != null && ` · GPA ${edu.gpa}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">Chưa có học vấn. Nhấn Cập nhật để thêm.</p>
          )}
          <div className="h-6" />

          <h2 className="text-base font-bold uppercase mb-3 text-slate-900">References</h2>
          {references.length > 0 ? (
            <div className="space-y-2 text-sm">
              {references.map((ref, i) => (
                <p key={i}>
                  <span className="font-semibold">{ref.name}{ref.company ? ` from ${ref.company}` : ''}</span>
                  {(ref.email || ref.phone) && (
                    <span className="text-slate-600"> · {[ref.email, ref.phone].filter(Boolean).join(' | ')}</span>
                  )}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">Chưa có người tham chiếu. Nhấn Cập nhật để thêm.</p>
          )}
        </div>
      </div>
    </div>
  );
}
