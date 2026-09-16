import React, { useEffect, useState } from 'react';
import { askTeacherService } from '../../api/services';
import type { AskTeacherQuestion } from '../../types';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Send, 
  User, 
  X
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">Student Doubts & Questions</h1>
          <p className="text-xs font-medium text-emerald-800/80 mt-1">
            Review and answer questions submitted by your students
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-emerald-200/80 pb-1">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'PENDING'
              ? 'border-amber-600 text-amber-800 font-extrabold'
              : 'border-transparent text-emerald-700/80 hover:text-emerald-950'
          }`}
        >
          Pending Review ({questions.filter(q => q.status === 'PENDING').length})
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
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'ALL'
              ? 'border-emerald-800 text-emerald-900 font-extrabold'
              : 'border-transparent text-emerald-700/80 hover:text-emerald-950'
          }`}
        >
          All Inbox ({questions.length})
        </button>
      </div>

      {loading ? (
        <div className="glass-card rounded-3xl p-12 text-center text-xs font-semibold text-emerald-700/80">
          Loading student inbox...
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-emerald-300 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-950">Inbox empty</h3>
          <p className="text-xs font-medium text-emerald-700/80 max-w-sm mx-auto">
            {activeTab === 'PENDING'
              ? "All student questions have been answered!"
              : "No student questions found in this tab."}
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
                  <span className="text-[10px] text-emerald-900 font-bold flex items-center gap-1">
                    <User className="w-3 h-3 text-emerald-700" />
                    Student: {q.student_name || 'Anonymous Student'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-600 font-medium">
                    Received {new Date(q.created_at).toLocaleDateString()}
                  </span>
                  {q.status === 'PENDING' ? (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending Reply
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
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider mb-0.5">Context Snippet:</span>
                  "{q.selected_text}"
                </div>
              )}

              <div>
                <span className="text-[11px] font-bold text-emerald-700/80 block mb-1">Student Question:</span>
                <p className="text-xs font-bold text-emerald-950 leading-relaxed">{q.question}</p>
              </div>

              {q.answer ? (
                <div className="p-4 rounded-2xl bg-emerald-100/90 border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-emerald-950">Your Official Answer:</span>
                    <button
                      onClick={() => openAnswerModal(q)}
                      className="text-emerald-900 font-extrabold hover:underline"
                    >
                      Edit Answer
                    </button>
                  </div>
                  <p className="text-xs font-medium text-emerald-950 leading-relaxed whitespace-pre-wrap">{q.answer}</p>
                </div>
              ) : (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => openAnswerModal(q)}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Answer Student Question</span>
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedQuestion && (
          <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card bg-white rounded-3xl p-7 max-w-xl w-full border border-emerald-200 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-emerald-950">Answer Student Question</h2>
                  <p className="text-xs text-emerald-800 font-semibold">Student: {selectedQuestion.student_name}</p>
                </div>
                <button
                  onClick={() => setSelectedQuestion(null)}
                  className="p-1 text-emerald-600 hover:text-emerald-900 rounded-full hover:bg-emerald-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 text-xs font-semibold text-emerald-950">
                <span className="text-[10px] text-emerald-700/80 block font-bold mb-0.5">Question:</span>
                "{selectedQuestion.question}"
              </div>

              <form onSubmit={handleSendAnswer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Your Detailed Explanation *</label>
                  <textarea
                    required
                    rows={6}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Provide a clear, pedagogical answer for the student..."
                    className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-emerald-100">
                  <button
                    type="button"
                    onClick={() => setSelectedQuestion(null)}
                    className="px-4 py-2 bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Submitting...' : 'Send Answer'}</span>
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
