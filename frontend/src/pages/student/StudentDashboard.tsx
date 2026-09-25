import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { subjectService, noteService } from '../../api/services';
import type { Subject, StudentNote } from '../../types';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Bot, 
  Layers, 
  Clock, 
  BrainCircuit,
  Compass
} from 'lucide-react';
import { motion } from 'framer-motion';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [recentNotes, setRecentNotes] = useState<StudentNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subData, noteData] = await Promise.all([
          subjectService.getAll(),
          noteService.getAll()
        ]);
        setSubjects(subData);
        setRecentNotes(noteData.slice(0, 3));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-8 transition-colors duration-200">
      {/* Welcome Banner */}
      <section className="rounded-2xl p-8 border border-sky-800/40 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white relative overflow-hidden shadow-xl shadow-blue-950/20">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/50 text-sky-200 text-xs font-bold backdrop-blur-md mb-3 border border-sky-500/30">
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            <span>Phase 1 Learning Workspace</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-sm font-medium text-sky-100/90 mt-2 leading-relaxed">
            Ready to continue your journey? OnePath AI adapts to your learning pace and connects directly with your teacher's approved curriculum.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/student/subjects')}
              className="px-5 py-2.5 bg-white text-slate-900 hover:bg-sky-50 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Explore My Subjects</span>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </button>
            <button 
              onClick={() => navigate('/student/notebook')}
              className="px-5 py-2.5 bg-blue-900/60 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
            >
              Open Digital Notebook
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-sky-500/20 blur-3xl pointer-events-none"></div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Subjects (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
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
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">Your teachers have not published any subject modules yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((subject) => (
                <motion.div
                  key={subject.id}
                  whileHover={{ y: -2 }}
                  className="azure-card azure-card-hover rounded-2xl p-5 border border-sky-200/90 dark:border-sky-900/60 flex flex-col justify-between h-48 transition-all"
                >
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 bg-sky-100/90 dark:bg-sky-950 px-2.5 py-1 rounded-md border border-sky-200 dark:border-sky-800 inline-block mb-2.5">
                      Teacher: {subject.teacher_name || 'Assigned Educator'}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-1">{subject.name}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{subject.description || 'Curriculum unit.'}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-sky-100 dark:border-slate-800 mt-auto">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      {subject.chapter_count || subject.chapters?.length || 0} Chapters
                    </span>
                    <button
                      onClick={() => navigate(`/student/subjects/${subject.id}`)}
                      className="px-3.5 py-1.5 btn-primary rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Continue Learning Section */}
          <div className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Curriculum Progress</h3>
            </div>
            <div className="bg-sky-50/70 dark:bg-slate-800/60 rounded-xl p-4 border border-sky-100 dark:border-sky-900/40 text-center">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Ready to begin learning</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Select a subject above to start reading modules and taking digital notes.</p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Companion Visual Placeholder */}
          <div className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-sky-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/25">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2.5 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                Phase 3 Engine
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2">AI Companion</h3>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                "Your personalized learning assistant is getting ready to connect with teacher-approved RAG content."
              </p>
            </div>
            <div className="p-3 bg-sky-50 dark:bg-slate-800/80 rounded-xl border border-sky-200/80 dark:border-sky-800 text-xs font-bold text-sky-900 dark:text-sky-300">
              ⚡ Grounded transformations & hinge explanations arriving in Phase 3.
            </div>
          </div>

          {/* Recent Digital Notes Summary */}
          <div className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">My Notes</h3>
              </div>
              <span className="text-xs font-bold text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2.5 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                {recentNotes.length} Total
              </span>
            </div>

            {recentNotes.length === 0 ? (
              <div className="text-center py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                You haven't created any digital notes yet.
                <button
                  onClick={() => navigate('/student/notebook')}
                  className="block mx-auto mt-2 text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer"
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

          {/* Future Learning Profile Placeholder */}
          <div className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-slate-900 dark:text-white">
              <BrainCircuit className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider">
                Learning Insights
              </h3>
            </div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">
              Available as you learn
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              Personalized evaluation metrics, foundation weak-spot graph & SuperMemo flashcards will unlock dynamically in future updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
