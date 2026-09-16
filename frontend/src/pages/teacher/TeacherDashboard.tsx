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
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="glass-card rounded-3xl p-8 border border-emerald-200/80 bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white relative overflow-hidden shadow-lg shadow-emerald-950/15 marble-texture">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Teacher Management Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name || 'Educator'}! 🎓
          </h1>
          <p className="text-sm font-medium text-emerald-100 mt-2 leading-relaxed">
            Manage your subjects, publish chapters and modules, and answer student questions directly.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/teacher/subjects')}
              className="px-5 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Subject</span>
            </button>
            <button 
              onClick={() => navigate('/teacher/questions')}
              className="px-5 py-2.5 bg-emerald-800/80 hover:bg-emerald-800 text-white rounded-2xl text-xs font-semibold backdrop-blur-xs border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Question Inbox ({pendingQuestions} pending)</span>
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none"></div>
      </section>

      {/* Real Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-3xl p-5 border border-emerald-200/80 bg-white">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100/90 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200">Real Data</span>
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-950">{totalSubjects}</h3>
          <p className="text-xs font-semibold text-emerald-800/80 mt-0.5">Total Subjects</p>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-emerald-200/80 bg-white">
          <div className="flex items-center justify-between text-teal-700 mb-2">
            <Layers className="w-5 h-5" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-teal-100/90 text-teal-900 px-2 py-0.5 rounded-full border border-teal-200">Real Data</span>
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-950">{totalChapters}</h3>
          <p className="text-xs font-semibold text-emerald-800/80 mt-0.5">Total Chapters</p>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-emerald-200/80 bg-white">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <FileCheck2 className="w-5 h-5" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100/90 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-200">Real Data</span>
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-950">{totalModules}</h3>
          <p className="text-xs font-semibold text-emerald-800/80 mt-0.5">Total Modules</p>
        </div>

        <div className="glass-card rounded-3xl p-5 border border-emerald-200/80 bg-white">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-100/90 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">Action Needed</span>
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-950">{pendingQuestions}</h3>
          <p className="text-xs font-semibold text-emerald-800/80 mt-0.5">Pending Questions</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-800" />
              <h2 className="text-lg font-bold text-emerald-950">My Managed Subjects</h2>
            </div>
            <Link to="/teacher/subjects" className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1">
              Manage All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="glass-card rounded-3xl p-8 text-center text-xs font-semibold text-emerald-700/80">
              Loading managed subjects...
            </div>
          ) : subjects.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-emerald-300 mx-auto" />
              <h3 className="text-xs font-bold text-emerald-950">No subjects created yet</h3>
              <button
                onClick={() => navigate('/teacher/subjects')}
                className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Create Your First Subject
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {subjects.map((sub) => (
                <div 
                  key={sub.id}
                  className="glass-card rounded-2xl p-5 border border-emerald-200/80 bg-white flex items-center justify-between transition-all hover:border-emerald-300"
                >
                  <div>
                    <h3 className="font-extrabold text-sm text-emerald-950">{sub.name}</h3>
                    <p className="text-xs font-medium text-emerald-800/80 mt-0.5 line-clamp-1">{sub.description || 'No description provided.'}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-emerald-700/80 font-semibold">
                      <span>{sub.chapter_count || sub.chapters?.length || 0} Chapters</span>
                      <span>•</span>
                      <span>Created {new Date(sub.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/teacher/subjects/${sub.id}/manage`)}
                    className="px-4 py-2 bg-emerald-100/80 hover:bg-emerald-200/80 text-emerald-900 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer border border-emerald-200"
                  >
                    <span>Manage Content</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-emerald-950">Pending Doubts</h2>
            </div>
            <Link to="/teacher/questions" className="text-xs font-bold text-emerald-800 hover:text-emerald-950">
              Inbox →
            </Link>
          </div>

          <div className="glass-card rounded-3xl p-6 border border-emerald-200/80 bg-white space-y-3">
            {questions.filter(q => q.status === 'PENDING').length === 0 ? (
              <div className="text-center py-6 text-xs font-semibold text-emerald-700/80">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                No pending questions! All student doubts answered.
              </div>
            ) : (
              questions.filter(q => q.status === 'PENDING').slice(0, 3).map((q) => (
                <div 
                  key={q.id}
                  onClick={() => navigate('/teacher/questions')}
                  className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 hover:bg-amber-100/70 transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-extrabold text-amber-950">{q.student_name}</span>
                    <span className="text-amber-800 font-bold">{q.subject_name}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 line-clamp-2">"{q.question}"</p>
                  <span className="text-[10px] text-emerald-800 font-extrabold block mt-1">Click to Answer →</span>
                </div>
              ))
            )}
          </div>

          <div className="glass-card rounded-3xl p-5 border border-emerald-200 bg-gradient-to-br from-emerald-100/60 to-white space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded-full border border-emerald-300/80">
              Phase 3 Architecture Ready
            </span>
            <h4 className="text-xs font-bold text-emerald-950">PDF Ingestion & Chunk Verifier</h4>
            <p className="text-[11px] font-medium text-emerald-800/80 leading-normal">
              Teacher PDF upload pipelines, RAG chunking, and Knowledge Graph prerequisite management will be activated in upcoming phases.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
