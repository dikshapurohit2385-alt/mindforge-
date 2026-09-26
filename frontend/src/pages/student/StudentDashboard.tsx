import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  subjectService, 
  noteService, 
  profileService, 
  recommendationService,
  attendanceService
} from '../../api/services';
import type { 
  Subject, 
  StudentNote, 
  StudentProfile, 
  RecommendationItem,
  SubjectAttendanceSummary
} from '../../types';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  ArrowRight, 
  AlertTriangle, 
  School,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentNotes, setRecentNotes] = useState<StudentNote[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<SubjectAttendanceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [profData, subData, noteData, recData, attData] = await Promise.all([
        profileService.getMe().catch(() => null),
        subjectService.getAll().catch(() => []),
        noteService.getAll().catch(() => []),
        recommendationService.getAll().catch(() => []),
        attendanceService.getStudentSummary().catch(() => [])
      ]);
      setProfile(profData);
      setSubjects(subData);
      setRecentNotes(noteData.slice(0, 3));
      setRecommendations(recData);
      setAttendanceSummary(attData);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const primaryRecommendation = recommendations.length > 0 ? recommendations[0] : null;

  // Find active lesson chapter to continue
  const firstSubjectWithChapters = subjects.find(s => s.chapters && s.chapters.length > 0);
  const continueChapter = firstSubjectWithChapters?.chapters?.[0];

  return (
    <div className="space-y-8 transition-colors duration-200 pb-16 max-w-6xl mx-auto">
      {/* Clean Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            Welcome, {user?.name || 'Student'}
          </h1>
          <p className="text-xs font-medium text-stone-600 dark:text-slate-400 mt-1">
            Student Academic Overview & Learning Progress
          </p>
        </div>

        <div className="flex items-center gap-2">
          {profile?.class_name && (
            <span className="px-3 py-1 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-800 dark:text-stone-200 text-xs font-bold border border-stone-200 dark:border-slate-700 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-indigo-600 dark:text-sky-400" />
              <span>{profile.class_name}</span>
            </span>
          )}
          {profile?.knowledge_level && (
            <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-sky-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider">
              {profile.knowledge_level} Level
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-semibold text-stone-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-800">
          Loading learning dashboard...
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Section 1: Continue Learning Banner */}
          {firstSubjectWithChapters && continueChapter && (
            <div className="p-6 sm:p-7 rounded-3xl bg-stone-900 text-white border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
              <div className="space-y-2 max-w-2xl">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400">
                  Continue Learning • {firstSubjectWithChapters.name}
                </span>
                <h2 className="text-xl font-black text-white tracking-tight">
                  {continueChapter.title}
                </h2>
                <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed font-medium">
                  {continueChapter.description || 'Resume your adaptive textbook lesson calibrated for your current understanding level.'}
                </p>
              </div>

              <button
                onClick={() => navigate(`/student/study-space/${continueChapter.id}`)}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>Continue Studying</span>
                <ArrowRight className="w-4 h-4 text-sky-200" />
              </button>
            </div>
          )}

          {/* Section 2: Recommended Steps / Next Actions (if any) */}
          {primaryRecommendation && (
            <div className="p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 dark:text-sky-300">
                  Recommended Learning Step
                </span>
                <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                  {primaryRecommendation.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-slate-300 font-medium">
                  {primaryRecommendation.description}
                </p>
              </div>

              {primaryRecommendation.target_url && (
                <button
                  onClick={() => navigate(primaryRecommendation.target_url!)}
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  Start Action
                </button>
              )}
            </div>
          )}

          {/* Main Grid: My Subjects + Attendance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 8 Cols: My Subjects */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
                  <h2 className="text-base font-bold text-stone-900 dark:text-white">
                    My Enrolled Subjects ({subjects.length})
                  </h2>
                </div>

                <button
                  onClick={() => navigate('/student/subjects')}
                  className="text-xs font-bold text-indigo-700 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjects.map((sub) => {
                  const chapterCount = sub.chapters?.length || 0;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => navigate(`/student/subjects/${sub.id}`)}
                      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-stone-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 transition-all cursor-pointer space-y-3 shadow-2xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 dark:text-sky-300 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900">
                          {sub.class_name || 'Class Subject'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-indigo-600 transition-colors" />
                      </div>

                      <h3 className="text-base font-bold text-stone-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-sky-400 transition-colors">
                        {sub.name}
                      </h3>

                      <p className="text-xs text-stone-500 dark:text-slate-400 line-clamp-2 font-medium">
                        {sub.description || 'Subject curriculum & adaptive textbook modules.'}
                      </p>

                      <div className="pt-2 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs text-stone-600 dark:text-slate-400 font-semibold">
                        <span>{chapterCount} Chapter(s)</span>
                        <span className="text-indigo-600 dark:text-sky-400 font-bold">Open Subject →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 4 Cols: Attendance Summary */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
                  <h2 className="text-base font-bold text-stone-900 dark:text-white">
                    Attendance Overview
                  </h2>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-stone-200 dark:border-slate-800 space-y-4 shadow-2xs">
                {attendanceSummary.length === 0 ? (
                  <p className="text-xs font-medium text-stone-500 dark:text-slate-400">
                    No attendance logs recorded yet for your class sessions.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {attendanceSummary.map((att) => (
                      <div key={att.subject_id} className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-stone-900 dark:text-white">
                          <span>{att.subject_name}</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] ${
                            att.attendance_percentage >= 75
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {att.attendance_percentage.toFixed(0)}% Attendance
                          </span>
                        </div>

                        {att.needs_catchup && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Catch-Up Needed
                            </span>
                            <button
                              onClick={() => navigate(`/student/attendance-catchup/${att.subject_id}`)}
                              className="text-[11px] font-bold text-indigo-600 dark:text-sky-400 hover:underline cursor-pointer"
                            >
                              Catch-Up Path →
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => navigate('/student/my-class')}
                  className="w-full py-2 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer transition-colors"
                >
                  View Full Class Roster
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Recent Activity Notes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
                <h2 className="text-base font-bold text-stone-900 dark:text-white">
                  Recent Personal Notes
                </h2>
              </div>

              <button
                onClick={() => navigate('/student/notebook')}
                className="text-xs font-bold text-indigo-700 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Open Digital Notebook</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentNotes.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800">
                <p className="text-xs text-stone-500 font-medium">
                  No notes saved yet. Write notes while reading adaptive lessons to populate your digital notebook.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recentNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => navigate('/student/notebook')}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-2 hover:border-indigo-300 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      <span>{note.subject_name || 'Note'}</span>
                      <span>{new Date(note.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-xs font-bold text-stone-900 dark:text-white line-clamp-1 font-serif">
                      {note.title}
                    </h4>
                    <p className="text-xs text-stone-600 dark:text-slate-400 line-clamp-2 font-medium">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
