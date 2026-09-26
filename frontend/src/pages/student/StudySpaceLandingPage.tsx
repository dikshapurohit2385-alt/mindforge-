import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subjectService } from '../../api/services';
import type { Subject, Chapter } from '../../types';
import { 
  BookOpen, 
  Compass, 
  ArrowRight, 
  Loader2, 
  Search, 
  FileText, 
  Layers
} from 'lucide-react';

export const StudySpaceLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');

  useEffect(() => {
    const fetchCurriculum = async () => {
      setLoading(true);
      try {
        const data = await subjectService.getAll();
        setSubjects(data);
      } catch (err) {
        console.error("Failed to load study space curriculum:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurriculum();
  }, []);

  const filteredSubjects = subjects.filter(sub => {
    if (selectedSubjectId !== 'ALL' && sub.id !== selectedSubjectId) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchSub = sub.name.toLowerCase().includes(query);
    const matchChap = sub.chapters?.some(c => c.title.toLowerCase().includes(query) || c.description?.toLowerCase().includes(query));
    return matchSub || matchChap;
  });

  return (
    <div className="w-full space-y-8 pb-16 max-w-6xl mx-auto transition-colors duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-sky-400 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
              <span>Digital Study Space</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            Study Space Library
          </h1>
          <p className="text-xs font-medium text-stone-600 dark:text-slate-400 mt-1">
            Select a subject and chapter to open your dedicated digital textbook reading room.
          </p>
        </div>

        <button
          onClick={() => navigate('/student/notebook')}
          className="px-4 py-2.5 bg-stone-900 text-white hover:bg-black rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Personal Notebook</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects or chapter topics..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <span className="text-xs font-bold text-stone-500 dark:text-slate-400 hidden sm:inline">Subject:</span>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-bold text-stone-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="ALL">All Subjects ({subjects.length})</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Subjects & Chapters Library */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-stone-600 dark:text-slate-400">Loading Study Space library...</p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center space-y-3 border border-stone-200 dark:border-slate-800">
          <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-900 dark:text-white">No chapters match your search</h3>
          <p className="text-xs text-stone-500 dark:text-slate-400">Try clearing your search query or choosing a different subject filter.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredSubjects.map((subject) => (
            <div 
              key={subject.id}
              className="bg-[#faf9f5] dark:bg-slate-900/90 rounded-3xl p-6 sm:p-7 border border-stone-300/80 dark:border-slate-800 shadow-xs space-y-5"
            >
              {/* Subject Header */}
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-indigo-600 text-white font-bold shadow-xs">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 dark:text-sky-400 block">
                      CURRICULUM • CLASS 9
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold font-serif text-stone-900 dark:text-white">
                      {subject.name}
                    </h2>
                  </div>
                </div>

                <span className="text-xs font-bold px-3 py-1 bg-stone-200/80 dark:bg-slate-800 text-stone-700 dark:text-slate-300 rounded-full border border-stone-300/80 dark:border-slate-700">
                  {subject.chapters?.length || 0} Chapters
                </span>
              </div>

              {/* Chapters List */}
              {(!subject.chapters || subject.chapters.length === 0) ? (
                <div className="p-4 bg-white dark:bg-slate-800/60 rounded-2xl text-xs font-semibold text-stone-500 text-center border border-stone-200 dark:border-slate-700">
                  No chapters published for this subject yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subject.chapters.map((chap: Chapter, cIdx: number) => (
                    <div 
                      key={chap.id}
                      className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-stone-200 dark:border-slate-700/80 flex flex-col justify-between gap-4 hover:border-indigo-300 dark:hover:border-slate-600 transition-all shadow-2xs group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">
                            Chapter {cIdx + 1}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                            Digital Textbook
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-stone-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-sky-400 transition-colors">
                          {chap.title}
                        </h3>
                        {chap.description && (
                          <p className="text-xs text-stone-600 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
                            {chap.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-slate-700/60">
                        <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{chap.modules?.length || 3} Learning Units</span>
                        </span>

                        <button
                          onClick={() => navigate(`/student/study-space/${chap.id}`)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                        >
                          <span>Start Learning</span>
                          <ArrowRight className="w-3.5 h-3.5 text-sky-200" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
