import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subjectService } from '../../api/services';
import type { Subject, Chapter, Module } from '../../types';
import { 
  ArrowLeft, 
  BookOpen, 
  Layers, 
  ChevronRight, 
  FileText, 
  MessageSquare, 
  User, 
  Info,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SubjectDetailPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<{ chapter: Chapter; module: Module } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subjectId) return;
    const fetchSubject = async () => {
      try {
        const data = await subjectService.getById(subjectId);
        setSubject(data);
        if (data.chapters && data.chapters.length > 0) {
          setActiveChapterId(data.chapters[0].id);
          if (data.chapters[0].modules && data.chapters[0].modules.length > 0) {
            setActiveModule({ chapter: data.chapters[0], module: data.chapters[0].modules[0] });
          }
        }
      } catch (err) {
        console.error("Error loading subject details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
  }, [subjectId]);

  if (loading) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center text-xs font-semibold text-emerald-700/70">
        Loading curriculum details...
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-emerald-950">Subject Not Found</h2>
        <button
          onClick={() => navigate('/student/subjects')}
          className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold"
        >
          Back to Subjects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/student/subjects')}
        className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Subjects</span>
      </button>

      <div className="glass-card rounded-3xl p-8 border border-emerald-200/80 bg-white marble-texture">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <User className="w-3 h-3 text-emerald-700" />
                Teacher: {subject.teacher_name || 'Assigned Teacher'}
              </span>
              <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                <Layers className="w-3 h-3 text-emerald-700" />
                {subject.chapters?.length || 0} Chapters
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-emerald-950">{subject.name}</h1>
            <p className="text-xs font-medium text-emerald-800/80 mt-1 max-w-2xl">{subject.description || 'No description provided.'}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/student/notebook', { state: { subjectId: subject.id } })}
              className="px-4 py-2.5 bg-emerald-100/80 hover:bg-emerald-200/80 text-emerald-900 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-emerald-200"
            >
              <FileText className="w-4 h-4" />
              <span>Subject Notes</span>
            </button>
            <button
              onClick={() => navigate('/student/ask-teacher', { state: { subjectId: subject.id } })}
              className="px-4 py-2.5 bg-teal-100/80 hover:bg-teal-200/80 text-teal-950 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-teal-200"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Teacher</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-800" />
            Curriculum Structure
          </h2>

          {(!subject.chapters || subject.chapters.length === 0) ? (
            <div className="glass-card rounded-3xl p-6 text-center text-xs font-medium text-emerald-700/80">
              No chapters published for this subject yet.
            </div>
          ) : (
            <div className="space-y-3">
              {subject.chapters.map((chap, cIdx) => (
                <div 
                  key={chap.id}
                  className="glass-card rounded-2xl border border-emerald-200/70 overflow-hidden"
                >
                  <button
                    onClick={() => setActiveChapterId(activeChapterId === chap.id ? null : chap.id)}
                    className="w-full p-4 text-left flex items-center justify-between bg-white/90 hover:bg-emerald-50/50 transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] font-extrabold text-emerald-800 block uppercase tracking-wider">
                        Chapter {cIdx + 1}
                      </span>
                      <span className="font-bold text-xs text-emerald-950">{chap.title}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-emerald-600 transition-transform ${activeChapterId === chap.id ? 'rotate-90 text-emerald-800' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {activeChapterId === chap.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-emerald-50/50 p-2 space-y-1 border-t border-emerald-100"
                      >
                        {(!chap.modules || chap.modules.length === 0) ? (
                          <p className="text-[11px] text-emerald-700/70 p-2 italic font-medium">No modules in this chapter.</p>
                        ) : (
                          chap.modules.map((mod, mIdx) => (
                            <button
                              key={mod.id}
                              onClick={() => setActiveModule({ chapter: chap, module: mod })}
                              className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                                activeModule?.module.id === mod.id
                                  ? 'bg-emerald-800 text-white shadow-xs'
                                  : 'text-emerald-950 hover:bg-white'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <span className="opacity-75 text-[10px] block font-mono">Mod {mIdx + 1}</span>
                                <span className="truncate block">{mod.title}</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
                            </button>
                          ))
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            Module Viewer
          </h2>

          {!activeModule ? (
            <div className="glass-card rounded-3xl p-12 text-center text-xs font-semibold text-emerald-700/80">
              Select a chapter and module on the left to start learning.
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-8 border border-emerald-200/80 bg-white space-y-6">
              <div className="border-b border-emerald-100 pb-4">
                <div className="flex items-center gap-2 text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider mb-1">
                  <span>{subject.name}</span>
                  <span>/</span>
                  <span>{activeModule.chapter.title}</span>
                </div>
                <h3 className="text-xl font-extrabold text-emerald-950">{activeModule.module.title}</h3>
                <p className="text-xs font-medium text-emerald-800/80 mt-1">{activeModule.module.description || 'Standard module unit.'}</p>
              </div>

              <div className="bg-emerald-50/60 rounded-2xl p-8 border border-dashed border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                  <Info className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-emerald-950">Digital Content Ingestion Ready</h4>
                <p className="text-[11px] font-medium text-emerald-800/80 max-w-md mx-auto leading-relaxed">
                  Full PDF extraction, chunk vector search, and grounded AI transformations will be integrated in Phase 3. 
                  You can already save notes and ask your teacher questions about this module below!
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => navigate('/student/notebook', { 
                      state: { 
                        subjectId: subject.id,
                        chapterId: activeModule.chapter.id,
                        moduleId: activeModule.module.id,
                        title: `Notes: ${activeModule.module.title}`
                      } 
                    })}
                    className="px-4 py-2 bg-emerald-800 text-white hover:bg-emerald-900 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Create Note for this Module</span>
                  </button>
                  <button
                    onClick={() => navigate('/student/ask-teacher', {
                      state: {
                        subjectId: subject.id,
                        chapterId: activeModule.chapter.id,
                        moduleId: activeModule.module.id
                      }
                    })}
                    className="px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Ask Question</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
