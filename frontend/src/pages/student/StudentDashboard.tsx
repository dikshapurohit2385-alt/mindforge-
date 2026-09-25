import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  subjectService, 
  noteService, 
  profileService, 
  revisionService, 
  recommendationService 
} from '../../api/services';
import type { 
  Subject, 
  StudentNote, 
  StudentProfile, 
  RevisionItem, 
  RecommendationItem 
} from '../../types';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  BrainCircuit,
  Compass,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Target,
  CheckSquare,
  Award,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentNotes, setRecentNotes] = useState<StudentNote[]>([]);
  const [revisionQueue, setRevisionQueue] = useState<RevisionItem[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [profData, subData, noteData, revData, recData] = await Promise.all([
        profileService.getMe().catch(() => null),
        subjectService.getAll().catch(() => []),
        noteService.getAll().catch(() => []),
        revisionService.getQueue().catch(() => []),
        recommendationService.getAll().catch(() => [])
      ]);
      setProfile(profData);
      setSubjects(subData);
      setRecentNotes(noteData.slice(0, 3));
      setRevisionQueue(revData);
      setRecommendations(recData);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCompleteRevision = async (id: string) => {
    try {
      await revisionService.complete(id);
      setRevisionQueue(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Failed to complete revision item:", err);
    }
  };

  const primaryRecommendation = recommendations.length > 0 ? recommendations[0] : null;

  return (
    <div className="space-y-8 transition-colors duration-200">
      {/* Welcome & Recommended Next Action Banner */}
      <section className="rounded-3xl p-8 border border-sky-800/40 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white relative overflow-hidden shadow-xl shadow-blue-950/20">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800/60 text-sky-200 text-xs font-bold backdrop-blur-md border border-sky-500/30">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              <span>MindForge Adaptive Engine Active</span>
            </span>
            {profile && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>{profile.streak_days} Day Streak</span>
              </span>
            )}
            {profile && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>{profile.knowledge_level} Level</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-sm font-medium text-sky-100/90 mt-2 leading-relaxed max-w-2xl">
            Your personalized learning path continuously adapts to your diagnostic scores, quiz accuracy, and spaced repetition intervals.
          </p>

          {/* Primary Recommended Action Highlight */}
          {primaryRecommendation && (
            <div className="mt-6 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/80 text-white">
                    Next Recommended Action
                  </span>
                  <span className="text-xs text-sky-200 font-medium">
                    {primaryRecommendation.reason}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  {primaryRecommendation.title}
                </h4>
                <p className="text-xs text-sky-100/80 line-clamp-1">
                  {primaryRecommendation.description}
                </p>
              </div>

              <button
                onClick={() => {
                  if (primaryRecommendation.target_url) {
                    navigate(primaryRecommendation.target_url);
                  }
                }}
                className="px-5 py-2.5 bg-white text-slate-900 hover:bg-sky-50 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <span>Continue Learning</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              </button>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/student/learning-path')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-sky-200" />
              <span>Adaptive Path & Graph</span>
            </button>
            <button 
              onClick={() => navigate('/student/quizzes')}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold backdrop-blur-xs border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-emerald-300" />
              <span>Take Quiz</span>
            </button>
            <button 
              onClick={() => navigate('/student/flashcards')}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold backdrop-blur-xs border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span>Review Flashcards</span>
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-80 h-80 rounded-full bg-sky-500/20 blur-3xl pointer-events-none"></div>
      </section>

      {/* Progress & Analytics Metrics Row (Phase 3.9) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Progress */}
        <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Progress</span>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-sky-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {profile?.overall_progress || 0}%
            </span>
            <span className="text-xs text-slate-500 font-semibold">of syllabus</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 to-sky-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.max(5, profile?.overall_progress || 0)}%` }}
            ></div>
          </div>
        </div>

        {/* Quiz Accuracy */}
        <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quiz Accuracy</span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {profile?.quiz_accuracy || 0}%
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              {profile && profile.quiz_accuracy >= 75 ? 'Strong' : 'Calibrating'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">Based on real question submissions</p>
        </div>

        {/* Learning Streak */}
        <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Streak</span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-300">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {profile?.streak_days || 1}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">Days in a row</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">Consistent daily practice bonus</p>
        </div>

        {/* Spaced Revision Due */}
        <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revision Queue</span>
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {revisionQueue.length}
            </span>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">Items scheduled</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">Spaced repetition queue for today</p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Subjects & Revision Queue (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Revision Queue (Phase 3.7 Spaced Repetition) */}
          <div className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Today's Revision Queue</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {revisionQueue.length} Due Today
              </span>
            </div>

            {revisionQueue.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-50/50 dark:bg-slate-800/40 border border-dashed border-emerald-200 dark:border-emerald-900/60 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">All caught up on revisions!</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You have reviewed all scheduled topics. Continue your adaptive learning path below.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {revisionQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-900/60 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          item.priority === 'HIGH' 
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}>
                          {item.priority === 'HIGH' ? '⚠ High Priority' : '⚠ Revision'}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 truncate">
                          {item.subject_name}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {item.topic_name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {item.reason}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => navigate(`/student/subjects/${item.subject_id}`)}
                        className="btn-primary px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Study
                      </button>
                      <button
                        onClick={() => handleCompleteRevision(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="Mark Done"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enrolled Subjects List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Subjects</h2>
              </div>
              <Link to="/student/subjects" className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1">
                View all ({subjects.length}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="azure-card rounded-2xl p-8 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                Loading enrolled subjects...
              </div>
            ) : subjects.length === 0 ? (
              <div className="azure-card rounded-2xl p-8 text-center space-y-3 border border-dashed border-sky-300 dark:border-sky-800">
                <Compass className="w-8 h-8 text-sky-400 mx-auto" />
                <p className="text-sm font-bold text-slate-900 dark:text-white">No subjects available yet.</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                  Your teachers have not published any subject modules yet. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjects.map((subject) => (
                  <motion.div
                    key={subject.id}
                    whileHover={{ y: -2 }}
                    className="azure-card azure-card-hover rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60 flex flex-col justify-between h-52 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 bg-sky-100/90 dark:bg-sky-950 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                          {subject.teacher_name || 'Educator'}
                        </span>
                        <button
                          onClick={() => navigate(`/student/diagnostic/${subject.id}`)}
                          className="text-[11px] font-bold text-blue-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>Diagnostic</span>
                        </button>
                      </div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-1">{subject.name}</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{subject.description || 'Curriculum unit.'}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-sky-100 dark:border-slate-800 mt-auto">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        {subject.chapter_count || subject.chapters?.length || 0} Chapters
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate(`/student/learning-path?subjectId=${subject.id}`)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Path
                        </button>
                        <button
                          onClick={() => navigate(`/student/subjects/${subject.id}`)}
                          className="px-3.5 py-1.5 btn-primary rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <span>Explore</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Strengths/Weaknesses & Notes (1 col) */}
        <div className="space-y-6">
          {/* Concept Mastery Radar / Badges (Phase 3.1) */}
          <div className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 space-y-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Concept Mastery</h3>
            </div>

            {/* Strong Concepts */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Strong Concepts ({profile?.strong_concepts?.length || 0})
              </span>
              {(!profile?.strong_concepts || profile.strong_concepts.length === 0) ? (
                <p className="text-xs text-slate-500 italic">Complete quizzes to demonstrate strong mastery.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {profile.strong_concepts.map((concept, idx) => (
                    <span key={idx} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      ✓ {concept}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Weak Concepts */}
            <div className="space-y-2 pt-2 border-t border-sky-100 dark:border-slate-800">
              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Concepts Needing Practice ({profile?.weak_concepts?.length || 0})
              </span>
              {(!profile?.weak_concepts || profile.weak_concepts.length === 0) ? (
                <p className="text-xs text-slate-500 italic">No persistent weak spots detected!</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {profile.weak_concepts.map((concept, idx) => (
                    <span key={idx} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      ⚠ {concept}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Practice Actions */}
          <div className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Quick Practice
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/student/quizzes')}
                className="w-full p-3 rounded-xl bg-sky-50/70 dark:bg-slate-800/60 hover:bg-sky-100 border border-sky-200/80 dark:border-sky-800 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition-all"
              >
                <span>Adaptive Quick Quiz</span>
                <ChevronRight className="w-4 h-4 text-sky-600" />
              </button>
              <button
                onClick={() => navigate('/student/flashcards')}
                className="w-full p-3 rounded-xl bg-sky-50/70 dark:bg-slate-800/60 hover:bg-sky-100 border border-sky-200/80 dark:border-sky-800 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer transition-all"
              >
                <span>Spaced Repetition Cards</span>
                <ChevronRight className="w-4 h-4 text-sky-600" />
              </button>
            </div>
          </div>

          {/* Recent Digital Notes */}
          <div className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Notes</h3>
              </div>
              <Link to="/student/notebook" className="text-xs font-bold text-sky-600 hover:underline">
                View all
              </Link>
            </div>

            {recentNotes.length === 0 ? (
              <div className="text-center py-4 text-xs font-medium text-slate-500">
                No digital notes yet.
                <button
                  onClick={() => navigate('/student/notebook')}
                  className="block mx-auto mt-2 text-sky-600 font-bold hover:underline cursor-pointer"
                >
                  Create your first note →
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentNotes.map((note) => (
                  <div 
                    key={note.id}
                    onClick={() => navigate('/student/notebook')}
                    className="p-3 rounded-xl bg-sky-50/50 dark:bg-slate-800/50 border border-sky-100 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer shadow-2xs"
                  >
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{note.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">{note.content}</p>
                    <span className="text-[11px] text-sky-700 dark:text-sky-300 font-bold block mt-1">
                      {note.subject_name || 'General'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
