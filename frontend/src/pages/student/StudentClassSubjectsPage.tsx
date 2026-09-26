import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classService, attendanceService } from '../../api/services';
import type { SchoolClass, Subject, SubjectAttendanceSummary } from '../../types';
import { 
  BookOpen, 
  Layers, 
  ArrowRight, 
  AlertTriangle, 
  Zap,
  Loader2,
  CalendarCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

export const StudentClassSubjectsPage: React.FC = () => {
  const navigate = useNavigate();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendanceSummaries, setAttendanceSummaries] = useState<SubjectAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const [clData, attData] = await Promise.all([
          classService.getAll().catch(() => []),
          attendanceService.getStudentSummary().catch(() => [])
        ]);
        setClasses(clData);
        setAttendanceSummaries(attData);

        if (clData.length > 0) {
          const c9 = clData.find(c => c.name.includes("9")) || clData[0];
          setSelectedClassId(c9.id);
        }
      } catch (err) {
        console.error("Failed to load classes:", err);
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    const fetchClassSubjects = async () => {
      setLoading(true);
      try {
        const subs = await classService.getSubjects(selectedClassId);
        setSubjects(subs);
      } catch (err) {
        console.error("Failed to load class subjects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClassSubjects();
  }, [selectedClassId]);

  const activeClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-8 transition-colors duration-200 pb-16">
      {/* Top Banner */}
      <div className="azure-card rounded-3xl p-7 sm:p-8 border border-sky-200/90 dark:border-sky-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-700 dark:text-sky-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800">
              Curriculum Architecture
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            School Curriculum & Subjects
          </h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
            Navigate through official school classes, subjects, chapter modules, and attendance catch-up pathways.
          </p>
        </div>

        {/* Class selector pill tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-sky-100/70 dark:bg-slate-900 rounded-2xl border border-sky-200 dark:border-slate-800 overflow-x-auto scrollbar-none">
          {classes.map(cl => (
            <button
              key={cl.id}
              onClick={() => setSelectedClassId(cl.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedClassId === cl.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {cl.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading {activeClass?.name || 'Class'} subjects...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="azure-card rounded-3xl p-12 text-center text-xs font-bold text-slate-500">
          No subjects found for this class.
        </div>
      ) : (
        /* Subjects Grid */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-sky-400" />
              {activeClass?.name || 'Class'} Enrolled Subjects ({subjects.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map(sub => {
              const attSummary = attendanceSummaries.find(a => a.subject_id === sub.id);
              const needsCatchup = attSummary?.needs_catchup || false;
              const attPct = attSummary?.attendance_percentage ?? 85.0;

              return (
                <motion.div
                  key={sub.id}
                  whileHover={{ y: -3 }}
                  className="azure-card azure-card-hover rounded-3xl p-6 border border-sky-200/90 dark:border-sky-900/60 shadow-md flex flex-col justify-between space-y-4 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {sub.teacher_name || 'Assigned Educator'}
                      </span>

                      {/* Attendance Badge */}
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md flex items-center gap-1 ${
                        needsCatchup 
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}>
                        <CalendarCheck className="w-3 h-3" />
                        <span>{attPct}% Att.</span>
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-white line-clamp-1">{sub.name}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{sub.description || 'Standard NCERT curriculum subject.'}</p>

                    {/* Catch-Up Banner if low attendance */}
                    {needsCatchup && (
                      <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-rose-900 dark:text-rose-300 font-extrabold">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Catch-Up Recommended</span>
                        </div>
                        <button
                          onClick={() => navigate(`/student/attendance-catchup/${sub.id}`)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-[10px] cursor-pointer shrink-0"
                        >
                          Catch Up →
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-sky-100 dark:border-slate-800 flex items-center justify-between mt-auto">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
                      {sub.chapter_count || sub.chapters?.length || 0} Chapters
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/student/diagnostic/${sub.id}`)}
                        className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 border border-amber-200 dark:border-amber-900 cursor-pointer"
                        title="Take Diagnostic"
                      >
                        <Zap className="w-4 h-4 text-amber-500" />
                      </button>
                      <button
                        onClick={() => navigate(`/student/subjects/${sub.id}`)}
                        className="btn-primary px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <span>Explore</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
