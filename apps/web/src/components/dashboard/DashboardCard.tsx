import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string;
  className?: string;
  accentColor?: string;
}

export function DashboardCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  className = '',
  accentColor = 'border-l-blue-500'
}: DashboardCardProps) {
  return (
    <div className={`bg-card border border-border/80 hover:border-border rounded-lg p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 border-l-4 ${accentColor} ${className}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold mt-1 text-slate-100 font-mono tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className="p-2 bg-slate-900 border border-border/40 rounded-lg text-slate-400">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {description && (
        <div className="mt-3 pt-3 border-t border-border/40">
          <p className="text-[11px] text-slate-400 font-medium truncate">{description}</p>
        </div>
      )}
    </div>
  );
}
export default DashboardCard;
