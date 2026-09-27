import React from 'react';
import { BookOpen, ChevronRight, Layers, ArrowRight } from 'lucide-react';
import { DashboardCard } from '../../common/DashboardCard';
import type { Subject } from '../../../types';

interface EnrolledSubjectsCardProps {
  subjects: Subject[];
  onViewAll: () => void;
  onSelectSubject: (id: string) => void;
  className?: string;
}

export const EnrolledSubjectsCard: React.FC<EnrolledSubjectsCardProps> = ({
  subjects,
  onViewAll,
  onSelectSubject,
  className = ''
}) => {
  return (
    <DashboardCard
      className={className}
      headerIcon={<BookOpen className="w-5 h-5 text-indigo-600 dark:text-sky-400" />}
      title={
        <span className="flex items-center gap-2">
          <span>My Enrolled Subjects</span>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700">
            {subjects.length}
          </span>
        </span>
      }
      subtitle="Access your active course syllabus & adaptive textbooks"
      action={
        <button
          onClick={onViewAll}
          className="text-xs font-bold text-indigo-600 dark:text-sky-400 hover:text-indigo-800 dark:hover:text-sky-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      }
    >
      {subjects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 flex items-center justify-center mb-3 text-indigo-600 dark:text-sky-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-1">
            No enrolled subjects yet
          </h3>
          <p className="text-xs text-stone-500 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">
            You are not enrolled in any academic subjects yet. Explore your available class curriculum to start learning.
          </p>
          <button
            onClick={onViewAll}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-sky-600 dark:hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>Explore Subjects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subjects.map((sub) => {
            const chapterCount = sub.chapters?.length || sub.chapter_count || 0;
            return (
              <div
                key={sub.id}
                onClick={() => onSelectSubject(sub.id)}
                className="bg-stone-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 p-4 rounded-xl border border-stone-200/90 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-sky-500/50 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 dark:text-sky-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900">
                      {sub.class_name || 'Class Subject'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition-colors" />
                  </div>

                  <h3 className="text-sm font-bold text-stone-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                    {sub.name}
                  </h3>

                  <p className="text-xs text-stone-500 dark:text-slate-400 line-clamp-2 font-medium leading-relaxed">
                    {sub.description || 'Subject curriculum & adaptive textbook modules.'}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-stone-600 dark:text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <Layers className="w-3.5 h-3.5 text-stone-400" />
                    <span>{chapterCount} Chapter(s)</span>
                  </span>
                  <span className="text-indigo-600 dark:text-sky-400 font-bold group-hover:translate-x-0.5 transition-transform text-[11px]">
                    Open Subject →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
};
