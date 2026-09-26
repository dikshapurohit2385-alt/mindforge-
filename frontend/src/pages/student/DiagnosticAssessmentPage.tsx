import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { diagnosticService, subjectService } from '../../api/services';
import type { 
  DiagnosticQuestion, 
  DiagnosticResult, 
  Subject, 
  ChapterDiagnosticQuestion, 
  ChapterLearnerProfile 
} from '../../types';
import { 
  ArrowLeft, 
  Sparkles, 
  AlertTriangle, 
  Zap, 
  ArrowRight, 
  BrainCircuit, 
  Loader2,
  Eye,
  Globe,
  Compass,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';

export const DiagnosticAssessmentPage: React.FC = () => {
  const { subjectId, chapterId: paramChapterId } = useParams<{ subjectId?: string; chapterId?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const chapterId = paramChapterId || searchParams.get('chapterId') || searchParams.get('chapter_id');

  const [subject, setSubject] = useState<Subject | null>(null);
  const [questions, setQuestions] = useState<(DiagnosticQuestion | ChapterDiagnosticQuestion)[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Results state (Subject baseline vs Chapter Learner Profile)
  const [subjectResult, setSubjectResult] = useState<DiagnosticResult | null>(null);
  const [chapterProfileResult, setChapterProfileResult] = useState<ChapterLearnerProfile | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (chapterId) {
          // Chapter level diagnostic
          const qs = await diagnosticService.getChapterQuestions(chapterId);
          setQuestions(qs);
        } else if (subjectId) {
          // Subject level diagnostic
          const [sub, qs] = await Promise.all([
            subjectService.getById(subjectId),
            diagnosticService.getQuestions(subjectId)
          ]);
          setSubject(sub);
          setQuestions(qs);
        }
      } catch (err) {
        console.error("Failed to load diagnostic assessment:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [subjectId, chapterId]);

  const handleSelectOption = (optionIndex: number) => {
    if (!questions[currentIdx]) return;
    setAnswers(prev => ({
      ...prev,
      [questions[currentIdx].id]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (chapterId) {
        // Submit chapter assessment -> backend returns DiagnosticResult with learner_profile attached
        const res: any = await diagnosticService.submitChapterAssessment(chapterId, answers);
        if (res && res.learner_profile) {
          setChapterProfileResult(res.learner_profile);
        } else {
          // Fallback fetch profile
          const prof = await diagnosticService.getChapterProfile(chapterId);
          setChapterProfileResult(prof);
        }
      } else if (subjectId) {
        const res = await diagnosticService.submitAssessment(subjectId, answers);
        setSubjectResult(res);
      }
    } catch (err) {
      console.error("Failed to submit diagnostic assessment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const getQuestionTypeBadge = (q: any) => {
    const type = q.question_type;
    switch (type) {
      case 'PRIOR_KNOWLEDGE':
        return (
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
            <BrainCircuit className="w-3.5 h-3.5" />
            Prior Knowledge Check
          </span>
        );
      case 'DIFFICULTY_PERCEPTION':
        return (
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            Difficulty Perception
          </span>
        );
      case 'INTEREST_LEVEL':
        return (
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Topic Interest Level
          </span>
        );
      case 'VISUAL_PREFERENCE':
        return (
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            Visual Diagram Preference
          </span>
        );
      case 'REAL_WORLD_INTEREST':
        return (
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" />
            Real-World Application Interest
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
            Concept Domain: {q.concept || 'General'}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Preparing diagnostic questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="azure-card rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto my-12 border border-sky-200 dark:border-sky-900 shadow-md">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Diagnostic Not Configured</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No diagnostic assessment questions found for this unit.
        </p>
        <button
          onClick={() => navigate('/student/subjects')}
          className="btn-primary px-4 py-2 rounded-xl text-xs font-bold"
        >
          Back to Subjects
        </button>
      </div>
    );
  }

  // Chapter Diagnostic Profile Result View (Phase 5)
  if (chapterProfileResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto space-y-6 my-6"
      >
        <div className="azure-card rounded-3xl p-8 border border-indigo-200 dark:border-indigo-900 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-400 text-white flex items-center justify-center mx-auto shadow-md shadow-indigo-500/30">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-3 py-1 rounded-md">
              Chapter Diagnostic Complete
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Learner Profile Synthesized
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              MindForge AI has processed your 9 diagnostic signals to generate a tailored adaptive learning strategy.
            </p>
          </div>

          {/* AI Explanation Banner */}
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-900 dark:text-indigo-300">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Personalized Adaptation Strategy:</span>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
              "{chapterProfileResult.student_explanation}"
            </p>
          </div>

          {/* Signals Matrix Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Knowledge Level</span>
              <span className="text-sm font-extrabold text-indigo-600 dark:text-sky-400 uppercase mt-0.5 block">
                {chapterProfileResult.knowledge_level}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Visual Support Need</span>
              <span className="text-sm font-extrabold text-sky-600 dark:text-sky-400 uppercase mt-0.5 block">
                {chapterProfileResult.visual_support_need}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Real-World Interest</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 uppercase mt-0.5 block">
                {chapterProfileResult.real_world_interest}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Content Density</span>
              <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400 uppercase mt-0.5 block">
                {chapterProfileResult.content_density}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Explanation Depth</span>
              <span className="text-sm font-extrabold text-teal-600 dark:text-teal-400 uppercase mt-0.5 block">
                {chapterProfileResult.explanation_complexity}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Memory Support</span>
              <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 uppercase mt-0.5 block">
                {chapterProfileResult.memory_support}
              </span>
            </div>
          </div>

          {chapterProfileResult.contradiction_flag && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>MindForge detected high self-assumed confidence alongside prior-knowledge errors. Lesson contains step-by-step foundational calibration.</span>
            </div>
          )}

          {/* Action to Launch Lesson */}
          <div className="pt-4 flex justify-end gap-3">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate(`/student/adaptive-lesson/${chapterId}`)}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Launch Chapter Adaptive Lesson</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Subject Baseline Result View (Phase 3)
  if (subjectResult) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <div className="azure-card rounded-3xl p-8 border border-sky-300 dark:border-sky-800 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/30">
              <BrainCircuit className="w-8 h-8" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-3 py-1 rounded-md">
              Diagnostic Assessment Complete
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Baseline Calibrated: {subjectResult.assigned_level} Level
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Your results have been analyzed across individual conceptual domains. MindForge has initialized your personalized learning path accordingly.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-slate-800/80 border border-sky-200 dark:border-sky-800 text-center">
              <span className="text-xs text-slate-500 font-semibold block">Overall Score</span>
              <span className="text-3xl font-extrabold text-blue-600 dark:text-sky-300">
                {subjectResult.total_score} / {subjectResult.max_score}
              </span>
              <span className="text-xs text-slate-500 block mt-1">{subjectResult.percentage}% Accuracy</span>
            </div>
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-slate-800/80 border border-sky-200 dark:border-sky-800 text-center">
              <span className="text-xs text-slate-500 font-semibold block">Assigned Knowledge Tier</span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {subjectResult.assigned_level}
              </span>
              <span className="text-xs text-slate-500 block mt-1">Adaptive curriculum active</span>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              onClick={() => navigate('/student/dashboard')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate(`/student/learning-path?subjectId=${subjectId}`)}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <span>Explore Personalized Learning Path</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const currentQ = questions[currentIdx];
  const selectedOption = answers[currentQ.id];
  const progressPercent = Math.round(((currentIdx + 1) / questions.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6 my-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 dark:text-sky-400 hover:text-indigo-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {/* Header Card */}
      <div className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold text-indigo-700 dark:text-sky-400 uppercase tracking-wider">
              {chapterId ? 'Chapter Learner Profiling' : `Subject Diagnostic • ${subject?.name}`}
            </span>
          </div>
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
            Question {currentIdx + 1} of {questions.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-indigo-600 dark:bg-sky-400 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Active Question Box */}
      <div className="azure-card rounded-3xl p-7 sm:p-8 border border-indigo-200/80 dark:border-indigo-900/60 shadow-md space-y-6">
        <div className="space-y-3">
          {getQuestionTypeBadge(currentQ)}
          <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
            {currentQ.question}
          </h3>
        </div>

        {/* Multiple Choice Options */}
        <div className="space-y-3">
          {currentQ.options.map((opt, oIdx) => {
            const isSelected = selectedOption === oIdx;
            return (
              <button
                key={oIdx}
                onClick={() => handleSelectOption(oIdx)}
                className={`w-full p-4.5 rounded-2xl text-left text-sm font-semibold transition-all border flex items-center justify-between cursor-pointer ${
                  isSelected 
                    ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-950 dark:text-white shadow-xs'
                    : 'border-sky-200/80 dark:border-sky-900/50 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-indigo-400'
                }`}
              >
                <span className="pr-3 leading-relaxed">{opt}</span>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center justify-between pt-5 border-t border-sky-100 dark:border-slate-800">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Previous
          </button>

          {currentIdx === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < questions.length}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Submit & Synthesize Strategy</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={selectedOption === undefined}
              className="btn-primary px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
