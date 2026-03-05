import React from 'react';
import EditableText from './EditableText.jsx';
import SkillBar from './SkillBar.jsx';

/**
 * Sidebar - Left column (30%) dark green background
 * Contains: photo, name, title, details, skills
 */
export default function Sidebar({ data, onChange, editMode }) {
  const details = data.details || { address: '', phone: '', email: '' };
  const skills = data.skills || [];

  const updateDetails = (key, value) => {
    onChange({ ...data, details: { ...details, [key]: value } });
  };

  const addSkill = () => {
    const newSkill = { id: Date.now(), name: '', level: 80 };
    onChange({ ...data, skills: [...skills, newSkill] });
  };

  const updateSkill = (index, skill) => {
    const next = [...skills];
    next[index] = skill;
    onChange({ ...data, skills: next });
  };

  const removeSkill = (index) => {
    const next = skills.filter((_, i) => i !== index);
    onChange({ ...data, skills: next });
  };

  return (
    <div className="w-[30%] bg-[#1e4d3c] text-white p-6 flex flex-col print:bg-[#1e4d3c]">
      {/* Photo placeholder */}
      <div className="w-24 h-24 rounded-full bg-white/20 border-2 border-amber-400/60 mx-auto mb-4 flex items-center justify-center overflow-hidden">
        <svg className="w-12 h-12 text-white/80" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>

      <EditableText
        value={data.name}
        onChange={(v) => onChange({ ...data, name: v })}
        editMode={editMode}
        placeholder="Your name"
        className="text-xl font-bold text-center mb-1 block"
      />
      <EditableText
        value={data.title}
        onChange={(v) => onChange({ ...data, title: v })}
        editMode={editMode}
        placeholder="Professional title"
        className="text-xs uppercase tracking-wider text-center text-white/90 mb-6 block"
      />

      <h2 className="text-sm font-bold uppercase mb-2 border-b border-white/30 pb-1">Details</h2>
      <div className="space-y-2 text-sm text-white/95">
        <EditableText
          value={details.address}
          onChange={(v) => updateDetails('address', v)}
          editMode={editMode}
          placeholder="Address"
          className="block"
        />
        <EditableText
          value={details.phone}
          onChange={(v) => updateDetails('phone', v)}
          editMode={editMode}
          placeholder="Phone"
          className="block"
        />
        <EditableText
          value={details.email}
          onChange={(v) => updateDetails('email', v)}
          editMode={editMode}
          placeholder="Email"
          className="block"
        />
      </div>

      <h2 className="text-sm font-bold uppercase mt-6 mb-2 border-b border-white/30 pb-1">Skills</h2>
      <div className="space-y-0">
        {skills.map((skill, i) => (
          <SkillBar
            key={skill.id ?? i}
            skill={skill}
            onChange={(s) => updateSkill(i, s)}
            onDelete={() => removeSkill(i)}
            editMode={editMode}
            canDelete={skills.length > 1}
          />
        ))}
      </div>
      {editMode && (
        <button
          type="button"
          onClick={addSkill}
          className="mt-3 text-xs text-white/80 hover:text-white border border-white/40 rounded px-2 py-1"
        >
          + Add skill
        </button>
      )}
    </div>
  );
}
