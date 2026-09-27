import React from 'react';
import { School, AlertTriangle, Users, CalendarCheck2, ArrowRight } from 'lucide-react';
import { DashboardCard } from '../../common/DashboardCard';
import type { SubjectAttendanceSummary } from '../../../types';

interface AttendanceViewerCardProps {
  attendanceSummary: SubjectAttendanceSummary[];
  onViewRoster: () => void;
  onCatchUp: (subjectId: string) => void;
  className?: string;
}

export const AttendanceViewerCard: React.FC<AttendanceViewerCardProps> = ({
  attendanceSummary,
  onViewRoster,
  onCatchUp,
  className = ''
}) => {
  const needsCatchUpCount = attendanceSummary.filter(att => att.needs_catchup).length;

  return (
    <DashboardCard
      className={className}
      headerIcon={<School className="w-5 h-5 text-indigo-600 dark:text-sky-400" />}
      title="Attendance Overview"
      subtitle="Class presence & catch-up tracking"
      action={
        needsCatchUpCount > 0 ? (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>{needsCatchUpCount} Catch-up</span>
          </span>
        ) : attendanceSummary.length > 0 ? (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Good Standing
          </span>
        ) : null
      }
      footer={
        <button
          onClick={onViewRoster}
          className="w-full py-2 px-3 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700/80 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer transition-colors flex items-center justify-center gap-2"
        >
          <Users className="w-3.5 h-3.5 text-stone-500 dark:text-slate-400" />
          <span>View Full Class Roster</span>
        </button>
      }
    >
      {attendanceSummary.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700 flex items-center justify-center mb-3 text-stone-400 dark:text-slate-500">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
            No attendance logs recorded yet
          </p>
          <p className="text-[11px] text-stone-500 dark:text-slate-400 max-w-xs leading-relaxed">
            Attendance records will appear here as your teachers submit roll calls for each class session.
          </p>
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {attendanceSummary.map((att) => {
            const isGood = att.attendance_percentage >= 75;
            return (
              <div
                key={att.subject_id}
                className="p-3.5 rounded-xl bg-stone-50/80 dark:bg-slate-800/60 border border-stone-200/90 dark:border-slate-700/80 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-white">
                  <span className="truncate pr-2">{att.subject_name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-extrabold shrink-0 ${
                      isGood
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {att.attendance_percentage.toFixed(0)}%
                  </span>
                </div>

                {/* Mini Progress Bar */}
                <div className="w-full bg-stone-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isGood ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-rose-500 dark:bg-rose-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, att.attendance_percentage))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400 font-medium">
                  <span>
                    {att.attended_classes} of {att.total_classes} sessions
                  </span>
                  <span>{att.status_label || (isGood ? 'On Track' : 'Needs Attention')}</span>
                </div>

                {att.needs_catchup && (
                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Catch-Up Needed</span>
                    </span>
                    <button
                      onClick={() => onCatchUp(att.subject_id)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-sky-400 hover:text-indigo-800 dark:hover:text-sky-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Catch-Up Path</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
};
