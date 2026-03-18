/**
 * Shared StatCard component — reusable across HR, DM, Director
 * Props: icon, label, value, unit, tint, badge
 */
const StatCard = ({ icon, label, value, unit, tint = 'slate', badge }) => {
  const tintMap = {
    blue: {
      bg:    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      icon:  'text-blue-500 dark:text-blue-400',
      label: 'text-blue-500/80 dark:text-blue-400/80',
      value: 'text-blue-700 dark:text-blue-300',
    },
    green: {
      bg:    'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
      icon:  'text-emerald-500 dark:text-emerald-400',
      label: 'text-emerald-500/80 dark:text-emerald-400/80',
      value: 'text-emerald-700 dark:text-emerald-300',
    },
    purple: {
      bg:    'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
      icon:  'text-purple-500 dark:text-purple-400',
      label: 'text-purple-500/80 dark:text-purple-400/80',
      value: 'text-purple-700 dark:text-purple-300',
    },
    amber: {
      bg:    'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
      icon:  'text-amber-500 dark:text-amber-400',
      label: 'text-amber-500/80 dark:text-amber-400/80',
      value: 'text-amber-700 dark:text-amber-300',
    },
    red: {
      bg:    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      icon:  'text-red-500 dark:text-red-400',
      label: 'text-red-500/80 dark:text-red-400/80',
      value: 'text-red-700 dark:text-red-300',
    },
    orange: {
      bg:    'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      icon:  'text-orange-500 dark:text-orange-400',
      label: 'text-orange-500/80 dark:text-orange-400/80',
      value: 'text-orange-700 dark:text-orange-300',
    },
    slate: {
      bg:    'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600',
      icon:  'text-slate-400 dark:text-slate-500',
      label: 'text-slate-500 dark:text-slate-400',
      value: 'text-slate-700 dark:text-slate-200',
    },
  };

  const t = tintMap[tint] ?? tintMap.slate;

  return (
    <div className={`rounded-2xl p-5 border ${t.bg} transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className={t.icon}>{icon}</div>
        {badge}
      </div>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${t.label}`}>
        {label}
      </p>
      <div className="flex items-end gap-2">
        <p className={`text-xl font-bold tracking-tight ${t.value}`}>
          {value}
        </p>
        {unit && (
          <span className={`text-[10px] font-bold uppercase mb-1 ${t.label}`}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
