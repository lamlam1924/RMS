import React from 'react';
import EditableText from './EditableText.jsx';

/**
 * JobItem - Employment history entry with editable fields and bullet points
 */
export default function JobItem({
  job,
  onChange,
  onDelete,
  onAddBullet,
  onRemoveBullet,
  onBulletChange,
  editMode,
  canDelete = true,
}) {
  const bullets = Array.isArray(job.description) ? job.description : [];

  return (
    <div className="border-b border-slate-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0 group">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <EditableText
            value={job.title}
            onChange={(v) => onChange({ ...job, title: v })}
            editMode={editMode}
            placeholder="Job title"
            className="font-semibold text-sm block"
          />
          <div className="flex flex-wrap gap-x-2 text-slate-600 text-sm mt-0.5">
            <EditableText
              value={job.company}
              onChange={(v) => onChange({ ...job, company: v })}
              editMode={editMode}
              placeholder="Company"
              className="inline"
            />
            {(editMode || job.location || job.date) && (
              <>
                <span className="text-slate-400">|</span>
                <EditableText
                  value={job.location}
                  onChange={(v) => onChange({ ...job, location: v })}
                  editMode={editMode}
                  placeholder="Location"
                  className="inline flex-1 min-w-[80px]"
                />
                <span className="text-slate-400">|</span>
                <EditableText
                  value={job.date}
                  onChange={(v) => onChange({ ...job, date: v })}
                  editMode={editMode}
                  placeholder="Date range"
                  className="inline min-w-[100px]"
                />
              </>
            )}
          </div>
        </div>
        {editMode && canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 text-sm opacity-0 group-hover:opacity-100"
          >
            Delete
          </button>
        )}
      </div>

      {bullets.length > 0 && (
        <ul className="mt-2 space-y-0.5 list-disc list-inside text-sm text-slate-700">
          {bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-1 group/bullet">
              <EditableText
                value={bullet}
                onChange={(v) => onBulletChange(i, v)}
                editMode={editMode}
                placeholder="Bullet point"
                className="flex-1"
              />
              {editMode && (
                <button
                  type="button"
                  onClick={() => onRemoveBullet(i)}
                  className="text-red-400 hover:text-red-600 text-xs shrink-0"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editMode && (
        <button
          type="button"
          onClick={onAddBullet}
          className="mt-2 text-xs text-blue-600 hover:text-blue-700"
        >
          + Add bullet
        </button>
      )}
    </div>
  );
}
