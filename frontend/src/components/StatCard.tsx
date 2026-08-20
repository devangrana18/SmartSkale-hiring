import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'purple';
  trend?: string;
  alert?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  colorScheme = 'indigo',
  trend,
  alert = false,
}) => {
  const schemeStyles = {
    indigo: {
      bgIcon: 'bg-indigo-50 text-smartskale-indigo',
      border: 'border-indigo-100',
      badge: 'bg-indigo-50 text-smartskale-indigo',
    },
    emerald: {
      bgIcon: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
      badge: 'bg-emerald-50 text-emerald-700',
    },
    amber: {
      bgIcon: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
      badge: 'bg-amber-50 text-amber-700',
    },
    blue: {
      bgIcon: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
      badge: 'bg-blue-50 text-blue-700',
    },
    purple: {
      bgIcon: 'bg-purple-50 text-purple-600',
      border: 'border-purple-100',
      badge: 'bg-purple-50 text-purple-700',
    },
  }[colorScheme];

  return (
    <div
      className={`relative p-5 rounded-2xl bg-white border ${schemeStyles.border} shadow-sm hover:shadow-md transition-all duration-200 ${
        alert ? 'ring-2 ring-amber-400/50 bg-amber-50/20' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
            {trend && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${schemeStyles.badge}`}>
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${schemeStyles.bgIcon}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {alert && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          Requires HR attention
        </div>
      )}
    </div>
  );
};

export default StatCard;
