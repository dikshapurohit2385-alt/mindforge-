import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subjectService, askTeacherService, teacherAnalyticsService } from '../../api/services';
import type { Subject, AskTeacherQuestion, TeacherAnalyticsOverview } from '../../types';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, 
  Layers, 
  MessageSquare, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Award
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<AskTeacherQuestion[]>([]);
  const [analytics, setAnalytics] = useState<TeacherAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subData, qData, analyticsData] = await Promise.all([
          subjectService.getAll(),
          askTeacherService.getTeacherQuestions(),
          teacherAnalyticsService.getOverview().catch(() => null)
        ]);
        setSubjects(subData);
        setQuestions(qData);
        setAnalytics(analyticsData);
      } catch (err) {
        console.error("Teacher dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pendingQuestions = questions.filter(q => q.status === 'PENDING').length;

  return (
    <div className="space-y-8 transition-colors duration-200">
      {/* Welcome Banner */}
      <section className="rounded-2xl p-8 border border-sky-800/40 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white relative overflow-hidden shadow-xl shadow-blue-950/20">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/50 text-sky-200 text-xs font-bold backdrop-blur-md mb-3 border border-sky-500/30">
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            <span>AI-Powered Teacher Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome, {user?.name || 'Educator'}! 🎓
          </h1>
          <p className="text-sm font-medium text-sky-100/90 mt-2 leading-relaxed">
            Monitor real-time cohort mastery, intervene for struggling students, and synthesize curriculum content using AI.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/teacher/ai-assistant')}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>AI Content Assistant</span>
            </button>
            <button 
              onClick={() => navigate('/teacher/analytics')}
              className="px-5 py-2.5 bg-white text-slate-900 hover:bg-sky-50 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Cohort Analytics</span>
            </button>
            <button 
              onClick={() => navigate('/teacher/questions')}
              className="px-5 py-2.5 bg-blue-900/60 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold backdrop-blur-xs border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Doubts ({pendingQuestions} pending)</span>
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-sky-500/20 blur-3xl pointer-events-none"></div>
      </section>

      {/* Real Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60">
          <div className="flex items-center justify-between text-blue-600 dark:text-sky-400 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">Cohort</span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {analytics?.total_students ?? 0}
          </h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Enrolled Students</p>
        </div>

        <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">Progress</span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {Math.round(analytics?.average_class_progress ?? 0)}%
          </h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Cohort Avg Progress</p>
        </div>

        <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
            <Award className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">Accuracy</span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {Math.round(analytics?.average_quiz_accuracy ?? 0)}%
          </h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Quiz Mastery Avg</p>
        </div>

        <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <MessageSquare className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">Doubts</span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{pendingQuestions}</h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Pending Questions</p>
        </div>
      </div>

      {/* Students Needing Attention Section */}
      {analytics && analytics.students_needing_attention && analytics.students_needing_attention.length > 0 && (
        <div className="azure-card rounded-2xl p-6 border border-amber-200/90 dark:border-amber-900/50 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Students Needing Support ({analytics.students_needing_attention.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Learners with below-target accuracy or recurring struggles requiring timely educator intervention.
                </p>
              </div>
            </div>
            <Link
              to="/teacher/analytics"
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1"
            >
              <span>View Full Cohort</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {analytics.students_needing_attention.slice(0, 3).map((st) => (
              <div
                key={st.student_id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 space-y-2.5 shadow-2xs hover:border-amber-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {st.student_name}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                    st.risk_level === 'HIGH'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {st.risk_level} RISK
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Quiz Accuracy: <b className="text-slate-800 dark:text-slate-200">{Math.round(st.quiz_accuracy)}%</b></span>
                  <span>Progress: <b className="text-slate-800 dark:text-slate-200">{Math.round(st.overall_progress)}%</b></span>
                </div>

                {st.struggling_topics && st.struggling_topics.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Struggling with:</span>
                    <div className="flex flex-wrap gap-1">
                      {st.struggling_topics.slice(0, 3).map((top, idx) => (
                        <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                          {top}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => navigate(`/teacher/analytics?studentId=${st.student_id}`)}
                  className="w-full mt-1 py-1.5 rounded-lg text-xs font-bold text-blue-700 dark:text-blue-300 bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Student Drilldown</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Difficult vs Improved Topics Row */}
      {analytics && (analytics.most_difficult_topics?.length > 0 || analytics.most_improved_topics?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Difficult Topics */}
          <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Most Challenging Concepts</h4>
            </div>
            <div className="space-y-2">
              {analytics.most_difficult_topics.slice(0, 3).map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-rose-50/50 dark:bg-slate-900/60 border border-rose-100 dark:border-rose-950 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.topic_name}</span>
                    <span className="text-[10px] text-slate-500">{item.subject_name}</span>
                  </div>
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
                    {Math.round(item.failure_rate_percentage)}% failure rate
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Improved Topics */}
          <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Top Mastered Concepts</h4>
            </div>
            <div className="space-y-2">
              {analytics.most_improved_topics.slice(0, 3).map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-slate-900/60 border border-emerald-100 dark:border-emerald-950 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.topic_name}</span>
                    <span className="text-[10px] text-slate-500">{item.subject_name}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {Math.round(item.average_score)}% mastery
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300">
                <BookOpen className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Managed Subjects</h2>
            </div>
            <Link to="/teacher/subjects" className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 flex items-center gap-1">
              Manage All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="azure-card rounded-2xl p-8 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
              Loading managed subjects...
            </div>
          ) : subjects.length === 0 ? (
            <div className="azure-card rounded-2xl p-8 text-center space-y-3 border border-dashed border-sky-300 dark:border-sky-800">
              <BookOpen className="w-8 h-8 text-sky-400 mx-auto" />
              <p className="text-sm font-bold text-slate-900 dark:text-white">No subjects created yet.</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">Create your first subject to start organizing chapters and modules for your students.</p>
              <button
                onClick={() => navigate('/teacher/subjects')}
                className="mt-2 px-4 py-2 btn-primary rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Subject</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map((sub) => (
                <div 
                  key={sub.id} 
                  className="azure-card azure-card-hover rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                >
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{sub.name}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-1">{sub.description || 'No description provided.'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                        {sub.chapter_count || sub.chapters?.length || 0} Chapters
                      </span>
                      <span>•</span>
                      <span>Created {new Date(sub.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/teacher/subjects/${sub.id}/manage`)}
                    className="px-4 py-2 btn-secondary rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <span>Curriculum Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Pending Questions Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Doubts</h2>
            </div>
            <Link to="/teacher/questions" className="text-sm font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700">
              Inbox ({pendingQuestions})
            </Link>
          </div>

          <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60 space-y-3">
            {questions.length === 0 ? (
              <div className="text-center py-6 text-xs font-medium text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p>No questions from students yet.</p>
              </div>
            ) : (
              questions.slice(0, 4).map((q) => (
                <div 
                  key={q.id}
                  onClick={() => navigate('/teacher/questions')}
                  className="p-3 rounded-xl bg-sky-50/60 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{q.student_name}</span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      q.status === 'PENDING' 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800' 
                        : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                    }`}>
                      {q.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{q.question}</p>
                  <span className="text-[10px] text-sky-700 dark:text-sky-400 font-semibold block mt-1">
                    {q.subject_name} {q.chapter_title ? `• ${q.chapter_title}` : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
