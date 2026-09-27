import React from 'react';
import { FileText, ExternalLink, Calendar, ArrowRight } from 'lucide-react';
import { DashboardCard } from '../../common/DashboardCard';
import type { StudentNote } from '../../../types';

interface RecentNotesCardProps {
  recentNotes: StudentNote[];
  onOpenNotebook: () => void;
  className?: string;
}

export const RecentNotesCard: React.FC<RecentNotesCardProps> = ({
  recentNotes,
  onOpenNotebook,
  className = ''
}) => {
  return (
    <DashboardCard
      className={className}
      headerIcon={<FileText className="w-5 h-5 text-indigo-600 dark:text-sky-400" />}
      title={
        <span className="flex items-center gap-2">
          <span>Recent Personal Notes</span>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700">
            {recentNotes.length}
          </span>
        </span>
      }
      subtitle="Study thoughts & bookmarks saved from your lesson reading"
      action={
        <button
          onClick={onOpenNotebook}
          className="text-xs font-bold text-indigo-600 dark:text-sky-400 hover:text-indigo-800 dark:hover:text-sky-300 hover:underline flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <span>Open Digital Notebook</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      }
    >
      {recentNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700 flex items-center justify-center mb-3 text-amber-600 dark:text-amber-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white mb-1">
            No notes saved yet
          </h3>
          <p className="text-xs text-stone-500 dark:text-slate-400 max-w-md mb-5 leading-relaxed">
            Write notes and highlight key definitions while reading adaptive lessons to populate your digital notebook.
          </p>
          <button
            onClick={onOpenNotebook}
            className="px-4 py-2 bg-stone-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer border border-stone-800 dark:border-slate-700"
          >
            <span>Open Digital Notebook</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentNotes.map((note) => (
            <div
              key={note.id}
              onClick={onOpenNotebook}
              className="p-4 rounded-xl bg-stone-50/70 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-800 border border-stone-200/90 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-sky-500/50 space-y-2.5 transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider">
                  <span className="px-2 py-0.5 rounded bg-stone-200/60 dark:bg-slate-700/60 text-stone-700 dark:text-slate-300 font-extrabold truncate max-w-[130px]">
                    {note.subject_name || 'General Note'}
                  </span>
                  <span className="flex items-center gap-1 text-stone-400 shrink-0">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(note.created_at).toLocaleDateString()}</span>
                  </span>
                </div>

                <h4 className="text-xs font-bold text-stone-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition-colors">
                  {note.title}
                </h4>

                <p className="text-xs text-stone-600 dark:text-slate-400 line-clamp-2 font-medium leading-relaxed">
                  {note.content}
                </p>
              </div>

              <div className="pt-2 border-t border-stone-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400">
                <span className="truncate text-stone-400">
                  {note.chapter_title ? `Ch: ${note.chapter_title}` : 'Lesson Note'}
                </span>
                <span className="text-indigo-600 dark:text-sky-400 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                  Read Note →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
};
