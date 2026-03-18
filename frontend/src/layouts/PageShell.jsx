import React from "react";

export default function PageShell({ title, right, children }) {
  return (
    <div className="w-full animate-in fade-in duration-300">
      {/* Page Header */}
      {(title || right) && (
        <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
          {title && <h1 className="text-2xl font-bold text-slate-800 m-0 tracking-tight">{title}</h1>}
          {right && <div className="flex gap-3 items-center">{right}</div>}
        </div>
      )}

      {/* Page Content */}
      <div className="w-full">{children}</div>
    </div>
  );
}
