import React from 'react';

interface DashboardCardProps {
  id?: string;
  className?: string;
  headerIcon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  id,
  className = '',
  headerIcon,
  title,
  subtitle,
  action,
  children,
  footer
}) => {
  return (
    <div
      id={id}
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col transition-all duration-200 ${className}`}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          {headerIcon && (
            <div className="shrink-0 text-indigo-600 dark:text-sky-400">
              {headerIcon}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-base font-bold text-stone-900 dark:text-white truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-stone-500 dark:text-slate-400 font-medium truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {action && (
          <div className="shrink-0 ml-3">
            {action}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col">
        {children}
      </div>

      {/* Card Footer */}
      {footer && (
        <div className="px-5 py-3.5 bg-stone-50/70 dark:bg-slate-800/40 border-t border-stone-200 dark:border-slate-800 mt-auto">
          {footer}
        </div>
      )}
    </div>
  );
};
