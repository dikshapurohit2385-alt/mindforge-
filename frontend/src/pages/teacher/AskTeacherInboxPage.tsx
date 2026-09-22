import React, { useEffect, useState } from 'react';
import { askTeacherService } from '../../api/services';
import type { AskTeacherQuestion } from '../../types';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Send, 
  User, 
  X,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AskTeacherInboxPage: React.FC = () => {
  const [questions, setQuestions] = useState<AskTeacherQuestion[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ANSWERED' | 'ALL'>('PENDING');
  const [loading, setLoading] = useState(true);

  const [selectedQuestion, setSelectedQuestion] = useState<AskTeacherQuestion | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async () => {
    try {
      const data = await askTeacherService.getTeacherQuestions();
      setQuestions(data);
    } catch (err) {
      console.error("Error fetching teacher questions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const openAnswerModal = (q: AskTeacherQuestion) => {
    setSelectedQuestion(q);
    setAnswerText(q.answer || '');
  };

  const handleSendAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !answerText) return;

    setSubmitting(true);
    try {
      await askTeacherService.answerQuestion(selectedQuestion.id, {
        answer: answerText,
        status: 'ANSWERED'
      });
      setSelectedQuestion(null);
      fetchQuestions();
    } catch (err) {
      console.error("Answer question error:", err);
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
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Student Doubts & Questions</h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
            Review and answer questions submitted by your students
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-sky-200/80 dark:border-sky-900/60 pb-1">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'PENDING'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Pending Review ({questions.filter(q => q.status === 'PENDING').length})
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
      </div>

      {loading ? (
        <div className="azure-card rounded-2xl p-12 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
          Loading student questions...
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="azure-card rounded-2xl p-12 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-sky-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No questions in this view</h3>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            {activeTab === 'PENDING' 
              ? "Great job! All student questions have been answered."
              : "No questions match your current tab selection."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <div 
              key={q.id}
              className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 space-y-4 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-blue-600 dark:text-sky-400 font-bold text-xs flex items-center justify-center border border-sky-200 dark:border-sky-800">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{q.student_name}</h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {q.subject_name} {q.chapter_title ? `• ${q.chapter_title}` : ''} {q.module_title ? `• ${q.module_title}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                  {q.status === 'PENDING' ? (
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Pending Answer
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
                  <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold block uppercase tracking-wider mb-0.5">Reference Snippet:</span>
                  "{q.selected_text}"
                </div>
              )}

              <div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Student Question:</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{q.question}</p>
              </div>

              {q.answer ? (
                <div className="bg-sky-50/70 dark:bg-slate-800/60 rounded-xl p-4 border border-sky-100 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                      Your Official Answer:
                    </span>
                    <button
                      onClick={() => openAnswerModal(q)}
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Answer</span>
                    </button>
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {q.answer}
                  </p>
                </div>
              ) : (
                <div className="pt-2">
                  <button
                    onClick={() => openAnswerModal(q)}
                    className="px-4 py-2 btn-primary rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Answer This Question</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Answer Modal */}
      <AnimatePresence>
        {selectedQuestion && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="azure-card bg-white dark:bg-slate-900 rounded-2xl p-7 max-w-xl w-full border border-sky-200 dark:border-sky-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-sky-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Answer Question from {selectedQuestion.student_name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-sky-50/60 dark:bg-slate-800/60 rounded-xl border border-sky-100 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Question:</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{selectedQuestion.question}</p>
                {selectedQuestion.selected_text && (
                  <p className="text-xs font-mono text-sky-700 dark:text-sky-300 mt-1 italic">
                    Ref: "{selectedQuestion.selected_text}"
                  </p>
                )}
              </div>

              <form onSubmit={handleSendAnswer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Your Official Answer / Clarification *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Provide a clear, pedagogical explanation to resolve the student's doubt..."
                    className="w-full p-3.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500 leading-relaxed"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-sky-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedQuestion(null)}
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
                    <span>{submitting ? 'Submitting...' : 'Submit Official Answer'}</span>
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
