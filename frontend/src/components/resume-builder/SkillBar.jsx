import React from 'react';
import EditableText from './EditableText.jsx';

/**
 * SkillBar - Skill with editable name and level slider
 */
export default function SkillBar({
  skill,
  onChange,
  onDelete,
  editMode,
  canDelete = true,
}) {
  const handleNameChange = (name) => onChange({ ...skill, name });
  const handleLevelChange = (e) => onChange({ ...skill, level: parseInt(e.target.value, 10) });

  return (
    <div className="group flex flex-col gap-1 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <EditableText
          value={skill.name}
          onChange={handleNameChange}
          editMode={editMode}
          placeholder="Skill name"
          className="text-sm text-white/95"
        />
        {editMode && canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-white/60 hover:text-red-300 text-xs px-1 opacity-0 group-hover:opacity-100"
            aria-label="Remove skill"
          >
            ×
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {editMode ? (
          <input
            type="range"
            min={0}
            max={100}
            value={skill.level ?? 80}
            onChange={handleLevelChange}
            className="flex-1 h-1.5 accent-slate-300"
          />
        ) : null}
        <span className="text-xs text-white/80 w-8">{skill.level ?? 80}%</span>
      </div>
      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-slate-300 rounded-full transition-all"
          style={{ width: `${skill.level ?? 80}%` }}
        />
      </div>
    </div>
  );
}
