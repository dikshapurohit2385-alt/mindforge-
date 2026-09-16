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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">Ask Teacher</h1>
          <p className="text-xs font-medium text-emerald-800/80 mt-1">
            Submit questions directly to your assigned subject teachers
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 hover:from-emerald-900 hover:to-teal-900 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ask a Question</span>
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-emerald-200/80 pb-1">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'ALL'
              ? 'border-emerald-800 text-emerald-900 font-extrabold'
              : 'border-transparent text-emerald-700/80 hover:text-emerald-950'
          }`}
        >
          All Questions ({questions.length})
        </button>
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'PENDING'
              ? 'border-amber-600 text-amber-700 font-extrabold'
              : 'border-transparent text-emerald-700/80 hover:text-emerald-950'
          }`}
        >
          Pending ({questions.filter(q => q.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setActiveTab('ANSWERED')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'ANSWERED'
              ? 'border-emerald-700 text-emerald-800 font-extrabold'
              : 'border-transparent text-emerald-700/80 hover:text-emerald-950'
          }`}
        >
          Answered ({questions.filter(q => q.status !== 'PENDING').length})
        </button>
      </div>

      {loading ? (
        <div className="glass-card rounded-3xl p-12 text-center text-xs font-semibold text-emerald-700/80">
          Loading your questions...
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-emerald-300 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-950">No questions found</h3>
          <p className="text-xs font-medium text-emerald-700/80 max-w-sm mx-auto">
            {activeTab !== 'ALL'
              ? `No questions currently in ${activeTab.toLowerCase()} status.`
              : "Have doubt on any concept? Click 'Ask a Question' to send it directly to your teacher."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-3xl p-6 border border-emerald-200/80 bg-white space-y-4 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {q.subject_name}
                  </span>
                  <span className="text-[10px] text-emerald-700/80 font-medium">
                    To: {q.teacher_name || 'Subject Teacher'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-600 font-medium">
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                  {q.status === 'PENDING' ? (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending Teacher Reply
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      Answered
                    </span>
                  )}
                </div>
              </div>

              {q.selected_text && (
                <div className="p-3 bg-emerald-50/60 border-l-4 border-emerald-600 rounded-r-xl text-xs font-mono text-emerald-950">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider mb-0.5">Reference Text:</span>
                  "{q.selected_text}"
                </div>
              )}

              <div>
                <span className="text-[11px] font-bold text-emerald-700/80 block mb-1">Your Question:</span>
                <p className="text-xs font-bold text-emerald-950 leading-relaxed">{q.question}</p>
              </div>

              {q.answer ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-100/90 to-teal-100/90 border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-800" />
                      Teacher Response from {q.teacher_name}:
                    </span>
                    {q.answered_at && (
                      <span className="text-[10px] text-emerald-800 font-semibold">
                        {new Date(q.answered_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-emerald-950 leading-relaxed pl-5 whitespace-pre-wrap">
                    {q.answer}
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-100 text-[11px] text-amber-900 font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Your question is queued in your teacher's inbox. You will see the reply here as soon as they answer.</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card bg-white rounded-3xl p-7 max-w-xl w-full border border-emerald-200 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-800" />
                  <h2 className="text-lg font-bold text-emerald-950">Ask Your Teacher a Question</h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-emerald-600 hover:text-emerald-900 rounded-full hover:bg-emerald-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Subject *</label>
                  <select
                    required
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} (Teacher: {s.teacher_name})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-emerald-950 mb-1">Chapter (Optional)</label>
                    <select
                      value={chapterId}
                      onChange={(e) => setChapterId(e.target.value)}
                      className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">All Chapters</option>
                      {availableChapters.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-emerald-950 mb-1">Module (Optional)</label>
                    <select
                      value={moduleId}
                      onChange={(e) => setModuleId(e.target.value)}
                      className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">All Modules</option>
                      {availableModules.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Selected Text / Context Snippet (Optional)</label>
                  <input
                    type="text"
                    value={selectedText}
                    onChange={(e) => setSelectedText(e.target.value)}
                    placeholder="e.g. 'Photosynthesis takes place in chloroplasts...'"
                    className="w-full px-3.5 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Your Question *</label>
                  <textarea
                    required
                    rows={4}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Describe what you find confusing or need help understanding..."
                    className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-emerald-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-900 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Send to Teacher'}</span>
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
