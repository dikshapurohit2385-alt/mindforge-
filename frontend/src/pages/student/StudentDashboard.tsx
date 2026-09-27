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
  ArrowRight, 
  School,
  HelpCircle
} from 'lucide-react';
import { EnrolledSubjectsCard } from '../../components/student/dashboard/EnrolledSubjectsCard';
import { AttendanceViewerCard } from '../../components/student/dashboard/AttendanceViewerCard';
import { RecentNotesCard } from '../../components/student/dashboard/RecentNotesCard';

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

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/OnePath_AI_Student_Guide.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-xl bg-sky-50 dark:bg-sky-950/70 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-800 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800 flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Download or open the Student Guide instructions PDF"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Student Guide (PDF)</span>
          </a>
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
                onClick={() => navigate('/student/study-space')}
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>Start Learning</span>
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

          {/* Main Grid: My Subjects Card + Attendance Viewer Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left 8 Cols: Enrolled Subjects Card */}
            <div className="lg:col-span-8 flex flex-col">
              <EnrolledSubjectsCard
                subjects={subjects}
                onViewAll={() => navigate('/student/subjects')}
                onSelectSubject={(id) => navigate(`/student/subjects/${id}`)}
                className="h-full"
              />
            </div>

            {/* Right 4 Cols: Attendance Viewer Card */}
            <div className="lg:col-span-4 flex flex-col">
              <AttendanceViewerCard
                attendanceSummary={attendanceSummary}
                onViewRoster={() => navigate('/student/my-class')}
                onCatchUp={(subjectId) => navigate(`/student/attendance-catchup/${subjectId}`)}
                className="h-full"
              />
            </div>
          </div>

          {/* Bottom Row: Recent Personal Notes Card */}
          <RecentNotesCard
            recentNotes={recentNotes}
            onOpenNotebook={() => navigate('/student/notebook')}
          />

        </div>
      )}
    </div>
  );
};
