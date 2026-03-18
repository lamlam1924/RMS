import React from 'react';

/**
 * EditableText - Inline editable text (controlled input or textarea)
 * Renders as input/textarea in edit mode, span/div in view mode
 */
export default function EditableText({
  value = '',
  onChange,
  as = 'text',
  placeholder = '',
  editMode = true,
  className = '',
  multiline = false,
}) {
  if (!editMode) {
    return (
      <span className={className}>
        {value || <span className="text-slate-400 italic">{placeholder}</span>}
      </span>
    );
  }

  const common = {
    value: value || '',
    onChange: (e) => onChange(e.target.value),
    placeholder,
    className: `w-full bg-transparent border-none outline-none focus:ring-0 p-0 ${className}`,
  };

  if (multiline) {
    return <textarea {...common} rows={3} />;
  }
  return <input type="text" {...common} />;
}
