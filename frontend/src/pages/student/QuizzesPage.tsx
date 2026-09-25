import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { quizService, subjectService } from '../../api/services';
import type { QuizItem, QuizAttemptResult, Subject } from '../../types';
import { 
  CheckSquare, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Plus, 
  Loader2, 
  Filter, 
  X, 
  Award, 
  Zap, 
  Tag
} from 'lucide-react';

export const QuizzesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedSubjectId = searchParams.get('subject_id') || '';
  const selectedModuleId = searchParams.get('module_id') || '';

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Quiz Taking State
  const [activeQuiz, setActiveQuiz] = useState<QuizItem | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState<QuizAttemptResult | null>(null);

  // Generate Modal State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateSubjectId, setGenerateSubjectId] = useState(selectedSubjectId);
  const [generateTopicTitle, setGenerateTopicTitle] = useState('');
  const [generateDifficulty, setGenerateDifficulty] = useState('ADAPTIVE');
  const [generateCount, setGenerateCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load subjects
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const subs = await subjectService.getAll();
        setSubjects(subs);
        if (!selectedSubjectId && subs.length > 0) {
          setGenerateSubjectId(subs[0].id);
        }
      } catch (err) {
        console.error("Failed to load subjects:", err);
      }
    };
    loadSubjects();
  }, [selectedSubjectId]);

  // Load quizzes
  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const data = await quizService.getAll({
        subject_id: selectedSubjectId || undefined,
        module_id: selectedModuleId || undefined
      });
      setQuizzes(data);
    } catch (err) {
      console.error("Failed to load quizzes:", err);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [selectedSubjectId, selectedModuleId]);

  const handleSubjectChange = (newSubId: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newSubId) {
      nextParams.set('subject_id', newSubId);
      setGenerateSubjectId(newSubId);
    } else {
      nextParams.delete('subject_id');
    }
    nextParams.delete('module_id');
    setSearchParams(nextParams);
  };

  // Start a quiz
  const handleStartQuiz = async (quiz: QuizItem) => {
    // If the quiz doesn't have detailed questions yet, fetch by ID
    if (!quiz.questions || quiz.questions.length === 0) {
      try {
        const detailed = await quizService.getById(quiz.id);
        setActiveQuiz(detailed);
      } catch (err) {
        console.error("Failed to fetch full quiz details:", err);
        return;
      }
    } else {
      setActiveQuiz(quiz);
    }
    setCurrentQIndex(0);
    setSelectedAnswers({});
    setAttemptResult(null);
  };

  // Select an answer
  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  // Submit quiz
  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setIsSubmitting(true);
    try {
      const result = await quizService.submit(activeQuiz.id, selectedAnswers);
      setAttemptResult(result);
    } catch (err) {
      console.error("Failed to submit quiz attempt:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate new adaptive quiz
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateSubjectId) return;

    setIsGenerating(true);
    try {
      const newQuiz = await quizService.generate({
        subject_id: generateSubjectId,
        topic_title: generateTopicTitle.trim() || undefined,
        difficulty: generateDifficulty,
        question_count: generateCount
      });
      setShowGenerateModal(false);
      setGenerateTopicTitle('');
      await loadQuizzes();
      // Directly start newly generated quiz
      handleStartQuiz(newQuiz);
    } catch (err) {
      console.error("Failed to generate quiz:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 transition-colors duration-200 pb-16 max-w-4xl mx-auto">
      {/* 1. Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => {
              if (activeQuiz || attemptResult) {
                setActiveQuiz(null);
                setAttemptResult(null);
              } else {
                navigate('/student/dashboard');
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-400 hover:text-blue-900 dark:hover:text-white transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{activeQuiz || attemptResult ? 'Back to Quizzes List' : 'Dashboard'}</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-purple-600" />
            Adaptive Concept Quizzes
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Dynamic quizzes that adapt to your knowledge level and focus on your growth areas.
          </p>
        </div>

        {!activeQuiz && !attemptResult && (
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Generate Adaptive Quiz</span>
          </button>
        )}
      </div>

      {/* 2. MODE A: Graded Results View */}
      {attemptResult ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Results Score Banner */}
          <div className="azure-card rounded-2xl p-7 border border-purple-200 dark:border-purple-900/60 shadow-md">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300">
                    Quiz Complete
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(attemptResult.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  Score: {attemptResult.score} / {attemptResult.max_score} ({Math.round(attemptResult.percentage)}%)
                </h2>
                {attemptResult.recommendation && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
                    💡 <span className="font-semibold">Next Action:</span> {attemptResult.recommendation}
                  </p>
                )}
              </div>

              {/* Accuracy Badge */}
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex flex-col items-center justify-center shadow-lg shrink-0">
                <span className="text-2xl font-black">{Math.round(attemptResult.percentage)}%</span>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Accuracy</span>
              </div>
            </div>

            {/* Concept Mastery Breakdown */}
            {attemptResult.concept_breakdown && Object.keys(attemptResult.concept_breakdown).length > 0 && (
              <div className="mt-6 pt-5 border-t border-purple-100 dark:border-purple-900/60 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Concept Mastery Updates:
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(attemptResult.concept_breakdown).map(([concept, status]) => {
                    const isStrong = status === 'STRONG';
                    const isMedium = status === 'MEDIUM';
                    return (
                      <span
                        key={concept}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                          isStrong
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : isMedium
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {isStrong ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : isMedium ? <Zap className="w-3.5 h-3.5 text-amber-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                        <span>{concept}</span>
                        <span className="opacity-70 font-mono text-[10px]">({status})</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Question-by-Question Review */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              Detailed Question Review
            </h3>

            {attemptResult.graded_questions.map((gq, idx) => (
              <div
                key={gq.question_id || idx}
                className={`azure-card rounded-2xl p-5 border shadow-2xs space-y-3 ${
                  gq.is_correct
                    ? 'border-emerald-200/90 dark:border-emerald-900/60'
                    : 'border-rose-200/90 dark:border-rose-900/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                      {gq.concept_tag}
                    </span>
                  </div>

                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                    gq.is_correct
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                  }`}>
                    {gq.is_correct ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {gq.is_correct ? 'Correct (+1 pt)' : 'Incorrect'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {gq.question}
                </h4>

                {/* Options List */}
                <div className="space-y-1.5 pl-2">
                  {gq.options.map((opt, oIdx) => {
                    const isUserPick = gq.user_answer === oIdx;
                    const isCorrectAnswer = gq.correct_answer === oIdx;

                    let bgStyle = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300';
                    if (isCorrectAnswer) {
                      bgStyle = 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold';
                    } else if (isUserPick && !gq.is_correct) {
                      bgStyle = 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 line-through';
                    }

                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${bgStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono opacity-60 font-semibold">{String.fromCharCode(65 + oIdx)}.</span>
                          <span>{opt}</span>
                        </div>
                        {isCorrectAnswer && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">✓ Correct</span>
                        )}
                        {isUserPick && !isCorrectAnswer && (
                          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300">✗ Your Choice</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pedagogical Explanation */}
                {gq.explanation && (
                  <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                    <span className="font-bold text-purple-900 dark:text-purple-300 block">Explanation:</span>
                    <p className="leading-relaxed">{gq.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setActiveQuiz(null);
                setAttemptResult(null);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              Return to Quizzes
            </button>
            <button
              onClick={() => {
                if (activeQuiz) {
                  setSelectedAnswers({});
                  setCurrentQIndex(0);
                  setAttemptResult(null);
                }
              }}
              className="btn-primary px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      ) : activeQuiz ? (
        /* 3. MODE B: Active Quiz Taking Interface */
        <div className="space-y-6 animate-in fade-in">
          {/* Quiz Top Header */}
          <div className="azure-card rounded-2xl p-5 border border-purple-200 dark:border-purple-900/60 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
                {activeQuiz.title}
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Question {currentQIndex + 1} of {activeQuiz.questions.length}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {activeQuiz.difficulty}
              </span>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="w-full h-2 rounded-full bg-sky-100 dark:bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%` }}
            />
          </div>

          {/* Current Question Card */}
          {activeQuiz.questions[currentQIndex] && (
            <div className="azure-card rounded-2xl p-6 sm:p-8 border border-sky-200/90 dark:border-sky-900/60 shadow-lg space-y-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Tag className="w-3 h-3" />
                  {activeQuiz.questions[currentQIndex].concept_tag}
                </span>

                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                  {activeQuiz.questions[currentQIndex].question}
                </h3>
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-3">
                {activeQuiz.questions[currentQIndex].options.map((opt, oIdx) => {
                  const currentQId = activeQuiz.questions[currentQIndex].id;
                  const isSelected = selectedAnswers[currentQId] === oIdx;

                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectOption(currentQId, oIdx)}
                      className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-sky-200 dark:border-sky-800 text-slate-800 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-purple-800 text-white'
                            : 'bg-sky-100 dark:bg-slate-800 text-sky-800 dark:text-sky-300'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between gap-3">
            <button
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex(currentQIndex - 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous Question</span>
            </button>

            {currentQIndex < activeQuiz.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQIndex(currentQIndex + 1)}
                className="btn-primary inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                disabled={isSubmitting}
                onClick={handleSubmitQuiz}
                className="btn-primary inline-flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold cursor-pointer bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isSubmitting ? 'Grading Answers...' : 'Submit Quiz'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 4. MODE C: Available Quizzes Catalog */
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="azure-card rounded-2xl p-4 border border-sky-200/90 dark:border-sky-900/60 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Filter className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Subject:</span>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'} available
            </div>
          </div>

          {/* Quizzes List */}
          {loading ? (
            <div className="azure-card rounded-2xl p-16 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading curriculum quizzes...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="azure-card rounded-2xl p-12 text-center space-y-4 border border-dashed border-sky-200 dark:border-sky-800">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mx-auto">
                <CheckSquare className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No Quizzes Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Generate an AI adaptive quiz targeted directly at your current learning level and weak concepts.
                </p>
              </div>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Adaptive Quiz</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="azure-card rounded-2xl p-5 border border-sky-200/80 dark:border-sky-900/60 hover:border-purple-400 dark:hover:border-purple-600 transition-all flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {quiz.difficulty}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {quiz.question_count || quiz.questions?.length || 5} questions
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {quiz.title}
                    </h4>

                    {quiz.subject_name && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        📚 {quiz.subject_name}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    className="w-full btn-primary inline-flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Take Quiz</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. Generate AI Quiz Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="azure-card rounded-2xl max-w-lg w-full border border-sky-300 dark:border-sky-800 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-sky-100 dark:border-sky-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Generate Adaptive Quiz
                </h3>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateQuiz} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Subject
                </label>
                <select
                  required
                  value={generateSubjectId}
                  onChange={(e) => setGenerateSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Topic Focus (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Loops, Functions, Neural Networks (Leave blank for full subject)..."
                  value={generateTopicTitle}
                  onChange={(e) => setGenerateTopicTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['ADAPTIVE', 'EASY', 'MEDIUM', 'HARD'].map((diff) => (
                    <button
                      type="button"
                      key={diff}
                      onClick={() => setGenerateDifficulty(diff)}
                      className={`py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        generateDifficulty === diff
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-100/70 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Number of Questions
                </label>
                <div className="flex gap-2">
                  {[3, 5, 8, 10].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setGenerateCount(num)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        generateCount === num
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-100/70 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating || !generateSubjectId}
                  className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40"
                >
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isGenerating ? 'Synthesizing...' : 'Generate Quiz'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
