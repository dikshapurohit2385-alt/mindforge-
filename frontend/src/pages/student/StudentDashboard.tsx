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

  const cardGradients = [
    'from-emerald-500/15 via-teal-500/10 to-emerald-600/15 border-emerald-300/80',
    'from-teal-500/15 via-emerald-400/10 to-emerald-500/15 border-teal-300/80',
    'from-emerald-600/15 via-teal-600/10 to-emerald-500/15 border-emerald-300/80',
    'from-teal-600/15 via-emerald-500/10 to-teal-500/15 border-teal-300/80'
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <section className="glass-card rounded-3xl p-8 border border-emerald-200/80 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white relative overflow-hidden shadow-lg shadow-emerald-950/15 marble-texture">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/40 text-emerald-100 text-[11px] font-bold backdrop-blur-md mb-3 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phase 1 Learning Workspace</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-sm font-medium text-emerald-100 mt-2 leading-relaxed">
            Ready to continue your journey? OnePath AI adapts to your learning pace and connects directly with your teacher's approved curriculum.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button 
              onClick={() => navigate('/student/subjects')}
              className="px-5 py-2.5 bg-white text-emerald-950 hover:bg-emerald-50 rounded-2xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Explore My Subjects</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => navigate('/student/notebook')}
              className="px-5 py-2.5 bg-emerald-800/80 hover:bg-emerald-800 text-white rounded-2xl text-xs font-semibold backdrop-blur-xs border border-white/20 transition-all cursor-pointer"
            >
              Open Digital Notebook
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none"></div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Subjects (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-800" />
              <h2 className="text-lg font-bold text-emerald-950">My Subjects</h2>
            </div>
            <Link to="/student/subjects" className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1">
              View all ({subjects.length}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="glass-card rounded-3xl p-8 text-center text-xs font-semibold text-emerald-700/70">
              Loading enrolled subjects...
            </div>
          ) : subjects.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center space-y-3 border border-dashed border-emerald-200">
              <Compass className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-emerald-900">No subjects available yet.</p>
              <p className="text-[11px] text-emerald-700/80 max-w-sm mx-auto">Your teachers have not published any subject modules yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((subject, idx) => (
                <motion.div
                  key={subject.id}
                  whileHover={{ y: -3 }}
                  className={`glass-card rounded-3xl p-5 border bg-gradient-to-br ${cardGradients[idx % cardGradients.length]} flex flex-col justify-between h-48 transition-all`}
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-white/90 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs inline-block mb-3">
                      {subject.teacher_name || 'Teacher'}
                    </span>
                    <h3 className="font-extrabold text-base text-emerald-950 line-clamp-1">{subject.name}</h3>
                    <p className="text-xs text-emerald-800/80 mt-1 line-clamp-2">{subject.description || 'No description provided.'}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-emerald-200/60 mt-auto">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-700" />
                      {subject.chapter_count || subject.chapters?.length || 0} Chapters
                    </span>
                    <button
                      onClick={() => navigate(`/student/subjects/${subject.id}`)}
                      className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
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
          <div className="glass-card rounded-3xl p-6 border border-emerald-200/80">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-emerald-950">Continue Learning Progress</h3>
            </div>
            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 text-center">
              <p className="text-xs font-semibold text-emerald-900">No active chapter in progress.</p>
              <p className="text-[11px] text-emerald-700/80 mt-1">Select a subject above to start reading modules and taking digital notes.</p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Companion Visual Placeholder */}
          <div className="glass-card rounded-3xl p-6 border border-emerald-200/90 bg-gradient-to-b from-emerald-100/50 via-teal-50/40 to-white text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-700 to-teal-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-900/15 animate-bounce">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-200/70 px-2.5 py-0.5 rounded-full border border-emerald-300/60">
                Phase 3 System
              </span>
              <h3 className="text-base font-extrabold text-emerald-950 mt-2">AI Companion</h3>
              <p className="text-xs font-medium text-emerald-800/80 mt-1 leading-relaxed">
                "Your personalized learning assistant is getting ready to connect with teacher-approved RAG content."
              </p>
            </div>
            <div className="p-3 bg-emerald-100/70 rounded-2xl border border-emerald-200/80 text-[11px] font-bold text-emerald-950">
              ⚡ Grounded transformations & hinge explanations arriving in Phase 3.
            </div>
          </div>

          {/* Recent Digital Notes Summary */}
          <div className="glass-card rounded-3xl p-6 border border-emerald-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-800" />
                <h3 className="text-sm font-bold text-emerald-950">My Notes</h3>
              </div>
              <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {recentNotes.length} Total
              </span>
            </div>

            {recentNotes.length === 0 ? (
              <div className="text-center py-4 text-xs font-medium text-emerald-700/80">
                You haven't created any digital notes yet.
                <button
                  onClick={() => navigate('/student/notebook')}
                  className="block mx-auto mt-2 text-emerald-800 font-bold hover:underline"
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
                    className="p-3 rounded-2xl bg-white border border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer shadow-2xs"
                  >
                    <h4 className="text-xs font-bold text-emerald-950 line-clamp-1">{note.title}</h4>
                    <p className="text-[11px] text-emerald-700/80 line-clamp-1 mt-0.5">{note.content}</p>
                    <span className="text-[10px] text-emerald-800 font-bold block mt-1">
                      {note.subject_name || 'General'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Future Learning Profile Placeholder */}
          <div className="glass-card rounded-3xl p-6 border border-emerald-200/80 bg-gradient-to-b from-emerald-50/60 to-white text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-emerald-900">
              <BrainCircuit className="w-5 h-5 text-emerald-700" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider">
                Learning Insights
              </h3>
            </div>
            <p className="text-xs font-extrabold text-emerald-950">
              Available as you learn
            </p>
            <p className="text-[11px] text-emerald-800/80 leading-normal font-medium">
              Personalized evaluation metrics, foundation weak-spot graph & SuperMemo flashcards will unlock dynamically in future updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
