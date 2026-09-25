import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { askTeacherService, subjectService } from '../../api/services';
import type { AskTeacherQuestion, Subject, Chapter, Module } from '../../types';
import { 
  MessageSquare, 
  Plus, 
  Clock, 
  CheckCircle2, 
  Send, 
  User, 
  X,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const StudentAskTeacherPage: React.FC = () => {
  const location = useLocation();
  const stateParams = (location.state as any) || {};

  const [questions, setQuestions] = useState<AskTeacherQuestion[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'ANSWERED'>('ALL');
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjectId, setSubjectId] = useState(stateParams.subjectId || '');
  const [chapterId, setChapterId] = useState(stateParams.chapterId || '');
  const [moduleId, setModuleId] = useState(stateParams.moduleId || '');
  const [selectedText, setSelectedText] = useState(stateParams.selectedText || '');
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableChapters, setAvailableChapters] = useState<Chapter[]>([]);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);

  const fetchQuestionsAndSubjects = async () => {
    try {
      const [qData, subData] = await Promise.all([
        askTeacherService.getStudentQuestions(),
        subjectService.getAll()
      ]);
      setQuestions(qData);
      setSubjects(subData);
      if (subData.length > 0 && !subjectId) {
        setSubjectId(subData[0].id);
      }
    } catch (err) {
      console.error("Error fetching student questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionsAndSubjects();
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setAvailableChapters([]);
      return;
    }
    const foundSubject = subjects.find(s => s.id === subjectId);
    if (foundSubject && foundSubject.chapters) {
      setAvailableChapters(foundSubject.chapters);
    } else {
      setAvailableChapters([]);
    }
  }, [subjectId, subjects]);

  useEffect(() => {
    if (!chapterId) {
      setAvailableModules([]);
      return;
    }
    const foundChapter = availableChapters.find(c => c.id === chapterId);
    if (foundChapter && foundChapter.modules) {
      setAvailableModules(foundChapter.modules);
    } else {
      setAvailableModules([]);
    }
  }, [chapterId, availableChapters]);

  const handleOpenModal = () => {
    setQuestionText('');
    setSelectedText('');
    if (subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
    setIsModalOpen(true);
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !questionText) return;

    setError(null);
    setSubmitting(true);
    try {
      await askTeacherService.submitQuestion({
        subject_id: subjectId,
        chapter_id: chapterId || undefined,
        module_id: moduleId || undefined,
        selected_text: selectedText || undefined,
        question: questionText
      });
      setIsModalOpen(false);
      fetchQuestionsAndSubjects();
    } catch (err: any) {
      console.error("Submit question error:", err);
      setError(err.response?.data?.detail || "Failed to submit question.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (activeTab === 'PENDING') return q.status === 'PENDING';
    if (activeTab === 'ANSWERED') return q.status === 'ANSWERED' || q.status === 'RESOLVED';
    return true;
  });

  return (
    <div className="space-y-6 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Ask Teacher</h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
            Submit questions directly to your assigned subject teachers
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-5 py-2.5 btn-primary rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ask a Question</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-sky-200/80 dark:border-sky-900/60 pb-1">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'ALL'
              ? 'border-blue-600 text-blue-600 dark:text-sky-400 font-extrabold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          All Questions ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'PENDING'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Pending ({questions.filter(q => q.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setActiveTab('ANSWERED')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'ANSWERED'
              ? 'border-blue-600 text-blue-600 dark:text-sky-400 font-extrabold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Answered ({questions.filter(q => q.status !== 'PENDING').length})
        </button>
      </div>

      {loading ? (
        <div className="azure-card rounded-2xl p-12 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
          Loading your questions...
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="azure-card rounded-2xl p-12 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-sky-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No questions found</h3>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            {activeTab !== 'ALL'
              ? `No questions currently in ${activeTab.toLowerCase()} status.`
              : "Have a doubt on any concept? Click 'Ask a Question' to send it directly to your teacher."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 space-y-4 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2.5 py-1 rounded-md border border-sky-200 dark:border-sky-800">
                    {q.subject_name}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    To: {q.teacher_name || 'Subject Teacher'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                  {q.status === 'PENDING' ? (
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Pending Teacher Reply
                    </span>
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2.5 py-0.5 rounded-md border border-sky-200 dark:border-sky-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                      Answered
                    </span>
                  )}
                </div>
              </div>

              {q.selected_text && (
                <div className="p-3 bg-sky-50 dark:bg-slate-800/80 border-l-4 border-blue-600 rounded-r-xl text-xs font-mono text-slate-800 dark:text-slate-200">
                  <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold block uppercase tracking-wider mb-0.5">Reference Text:</span>
                  "{q.selected_text}"
                </div>
              )}

              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Your Question:</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{q.question}</p>
              </div>

              {q.answer ? (
                <div className="bg-sky-50/70 dark:bg-slate-800/60 rounded-xl p-4 border border-sky-100 dark:border-slate-700 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
                      Answer from {q.teacher_name || 'Teacher'}
                    </span>
                    {q.answered_at && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {new Date(q.answered_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {q.answer}
                  </p>
                </div>
              ) : (
                <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
                  Your question has been assigned to {q.teacher_name || 'your teacher'} and is awaiting review.
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Ask Question Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="azure-card bg-white dark:bg-slate-900 rounded-2xl p-7 max-w-xl w-full border border-sky-200 dark:border-sky-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-sky-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ask Teacher a Question</h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Subject *</label>
                    <select
                      required
                      value={subjectId}
                      onChange={(e) => {
                        setSubjectId(e.target.value);
                        setChapterId('');
                        setModuleId('');
                      }}
                      className="w-full px-3 py-2 bg-sky-50/50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Chapter (Optional)</label>
                    <select
                      value={chapterId}
                      onChange={(e) => {
                        setChapterId(e.target.value);
                        setModuleId('');
                      }}
                      className="w-full px-3 py-2 bg-sky-50/50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500"
                    >
                      <option value="">All Chapters</option>
                      {availableChapters.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Module (Optional)</label>
                    <select
                      value={moduleId}
                      onChange={(e) => setModuleId(e.target.value)}
                      className="w-full px-3 py-2 bg-sky-50/50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500"
                    >
                      <option value="">All Modules</option>
                      {availableModules.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Highlighted Reference Text (Optional)</label>
                  <textarea
                    rows={2}
                    value={selectedText}
                    onChange={(e) => setSelectedText(e.target.value)}
                    placeholder="Paste specific paragraph or equation from curriculum module..."
                    className="w-full p-3 bg-sky-50/50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Your Question / Doubt *</label>
                  <textarea
                    required
                    rows={4}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Clearly describe what concept you need help with..."
                    className="w-full p-3.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-sky-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 btn-secondary rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 btn-primary rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Submit Question'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
