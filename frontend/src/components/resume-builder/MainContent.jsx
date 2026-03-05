import React from 'react';
import EditableText from './EditableText.jsx';
import JobItem from './JobItem.jsx';

/**
 * MainContent - Right column (70%) white background
 * Profile, Employment History, Education, References
 */
export default function MainContent({ data, onChange, editMode }) {
  const jobs = data.jobs || [];
  const education = data.education || [];
  const references = data.references || [];

  const addJob = () => {
    onChange({
      ...data,
      jobs: [
        ...jobs,
        { id: Date.now(), title: '', company: '', location: '', date: '', description: [] },
      ],
    });
  };

  const updateJob = (index, job) => {
    const next = [...jobs];
    next[index] = job;
    onChange({ ...data, jobs: next });
  };

  const removeJob = (index) => {
    onChange({ ...data, jobs: jobs.filter((_, i) => i !== index) });
  };

  const addBullet = (jobIndex) => {
    const job = jobs[jobIndex];
    const desc = Array.isArray(job.description) ? job.description : [];
    updateJob(jobIndex, { ...job, description: [...desc, ''] });
  };

  const removeBullet = (jobIndex, bulletIndex) => {
    const job = jobs[jobIndex];
    const desc = Array.isArray(job.description) ? job.description : [];
    updateJob(jobIndex, { ...job, description: desc.filter((_, i) => i !== bulletIndex) });
  };

  const updateBullet = (jobIndex, bulletIndex, value) => {
    const job = jobs[jobIndex];
    const desc = [...(job.description || [])];
    desc[bulletIndex] = value;
    updateJob(jobIndex, { ...job, description: desc });
  };

  const addEducation = () => {
    onChange({
      ...data,
      education: [
        ...education,
        { id: Date.now(), school: '', degree: '', year: '' },
      ],
    });
  };

  const updateEducation = (index, edu) => {
    const next = [...education];
    next[index] = edu;
    onChange({ ...data, education: next });
  };

  const removeEducation = (index) => {
    onChange({ ...data, education: education.filter((_, i) => i !== index) });
  };

  const addReference = () => {
    onChange({
      ...data,
      references: [...references, { id: Date.now(), name: '', company: '', contact: '' }],
    });
  };

  const updateReference = (index, ref) => {
    const next = [...references];
    next[index] = ref;
    onChange({ ...data, references: next });
  };

  const removeReference = (index) => {
    onChange({ ...data, references: references.filter((_, i) => i !== index) });
  };

  return (
    <div className="w-[70%] p-8 text-slate-800 print:p-6">
      {/* Profile */}
      <h2 className="text-sm font-bold uppercase text-slate-900 mb-3 border-b border-slate-200 pb-1">
        Profile
      </h2>
      <EditableText
        value={data.profile}
        onChange={(v) => onChange({ ...data, profile: v })}
        editMode={editMode}
        placeholder="Professional summary..."
        multiline
        className="text-sm leading-relaxed"
      />
      <div className="h-6" />

      {/* Employment History */}
      <h2 className="text-sm font-bold uppercase text-slate-900 mb-3 border-b border-slate-200 pb-1">
        Employment History
      </h2>
      {jobs.map((job, i) => (
        <JobItem
          key={job.id ?? i}
          job={job}
          onChange={(j) => updateJob(i, j)}
          onDelete={() => removeJob(i)}
          onAddBullet={() => addBullet(i)}
          onRemoveBullet={(bi) => removeBullet(i, bi)}
          onBulletChange={(bi, v) => updateBullet(i, bi, v)}
          editMode={editMode}
          canDelete={jobs.length > 1}
        />
      ))}
      {editMode && (
        <button
          type="button"
          onClick={addJob}
          className="text-sm text-blue-600 hover:text-blue-700 mt-2"
        >
          + Add job
        </button>
      )}
      <div className="h-6" />

      {/* Education */}
      <h2 className="text-sm font-bold uppercase text-slate-900 mb-3 border-b border-slate-200 pb-1">
        Education
      </h2>
      {education.map((edu, i) => (
        <div key={edu.id ?? i} className="mb-4 group">
          <div className="flex justify-between gap-2">
            <div>
              <EditableText
                value={edu.school}
                onChange={(v) => updateEducation(i, { ...edu, school: v })}
                editMode={editMode}
                placeholder="School name"
                className="font-semibold text-sm block"
              />
              <div className="text-sm text-slate-600">
                <EditableText
                  value={edu.degree}
                  onChange={(v) => updateEducation(i, { ...edu, degree: v })}
                  editMode={editMode}
                  placeholder="Degree"
                />
                {' · '}
                <EditableText
                  value={edu.year}
                  onChange={(v) => updateEducation(i, { ...edu, year: v })}
                  editMode={editMode}
                  placeholder="Year"
                />
              </div>
            </div>
            {editMode && education.length > 1 && (
              <button
                type="button"
                onClick={() => removeEducation(i)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
      {editMode && (
        <button
          type="button"
          onClick={addEducation}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          + Add education
        </button>
      )}
      <div className="h-6" />

      {/* References */}
      <h2 className="text-sm font-bold uppercase text-slate-900 mb-3 border-b border-slate-200 pb-1">
        References
      </h2>
      {references.map((ref, i) => (
        <div key={ref.id ?? i} className="mb-2 group">
          <EditableText
            value={ref.name}
            onChange={(v) => updateReference(i, { ...ref, name: v })}
            editMode={editMode}
            placeholder="Name"
            className="font-semibold text-sm"
          />
          <div className="text-sm text-slate-600">
            <EditableText
              value={ref.company}
              onChange={(v) => updateReference(i, { ...ref, company: v })}
              editMode={editMode}
              placeholder="Company"
            />
            {' · '}
            <EditableText
              value={ref.contact}
              onChange={(v) => updateReference(i, { ...ref, contact: v })}
              editMode={editMode}
              placeholder="Email | Phone"
            />
          </div>
          {editMode && references.length > 1 && (
            <button
              type="button"
              onClick={() => removeReference(i)}
              className="text-red-400 text-xs mt-0.5"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      {editMode && (
        <button
          type="button"
          onClick={addReference}
          className="text-sm text-blue-600 hover:text-blue-700 mt-2"
        >
          + Add reference
        </button>
      )}
    </div>
  );
}
