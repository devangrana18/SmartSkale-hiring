import React from 'react';

interface StatusBadgeProps {
  status?: string | null;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'Active', className = '' }) => {
  const normalized = (status || 'Active').toLowerCase();

  let colors = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let dotColor = 'bg-emerald-500';

  if (normalized === 'inactive') {
    colors = 'bg-slate-100 text-slate-700 border-slate-200';
    dotColor = 'bg-slate-400';
  } else if (normalized === 'pending') {
    colors = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
  } else if (normalized === 'onboarding') {
    colors = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dotColor = 'bg-indigo-500';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${colors} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status || 'Active'}
    </span>
  );
};

export default StatusBadge;
