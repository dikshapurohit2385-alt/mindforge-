import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subjectService, askTeacherService } from '../../api/services';
import type { Subject, AskTeacherQuestion } from '../../types';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, 
  Layers, 
  MessageSquare, 
  Plus, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  FileCheck2
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<AskTeacherQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subData, qData] = await Promise.all([
          subjectService.getAll(),
          askTeacherService.getTeacherQuestions()
        ]);
        setSubjects(subData);
        setQuestions(qData);
      } catch (err) {
        console.error("Teacher dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalSubjects = subjects.length;
  const totalChapters = subjects.reduce((acc, s) => acc + (s.chapters?.length || s.chapter_count || 0), 0);
  const totalModules = subjects.reduce((acc, s) => {
    return acc + (s.chapters ? s.chapters.reduce((mAcc, c) => mAcc + (c.modules?.length || 0), 0) : 0);
  }, 0);
  const pendingQuestions = questions.filter(q => q.status === 'PENDING').length;

  return (
    <div className="space-y-8 transition-colors duration-200">
      {/* Welcome Banner */}
      <section className="rounded-2xl p-8 border border-sky-800/40 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white relative overflow-hidden shadow-xl shadow-blue-950/20">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/50 text-sky-200 text-xs font-bold backdrop-blur-md mb-3 border border-sky-500/30">
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            <span>Teacher Management Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome, {user?.name || 'Educator'}! 🎓
          </h1>
          <p className="text-sm font-medium text-sky-100/90 mt-2 leading-relaxed">
            Manage your subjects, publish chapters and modules, and answer student questions directly.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/teacher/subjects')}
              className="px-5 py-2.5 bg-white text-slate-900 hover:bg-sky-50 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Create New Subject</span>
            </button>
            <button 
              onClick={() => navigate('/teacher/questions')}
              className="px-5 py-2.5 bg-blue-900/60 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold backdrop-blur-xs border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Question Inbox ({pendingQuestions} pending)</span>
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-sky-500/20 blur-3xl pointer-events-none"></div>
      </section>

      {/* Real Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60">
          <div className="flex items-center justify-between text-blue-600 dark:text-sky-400 mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">Subjects</span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalSubjects}</h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Active Courses</p>
        </div>

        <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60">
          <div className="flex items-center justify-between text-sky-600 dark:text-sky-400 mb-2">
            <Layers className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">Chapters</span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalChapters}</h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Total Chapters</p>
        </div>

        <div className="azure-card rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60">
          <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 mb-2">
            <FileCheck2 className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800">Modules</span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalModules}</h3>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">Total Modules</p>
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
