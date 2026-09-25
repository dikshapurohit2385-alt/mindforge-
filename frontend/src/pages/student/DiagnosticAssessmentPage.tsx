import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { diagnosticService, subjectService } from '../../api/services';
import type { DiagnosticQuestion, DiagnosticResult, Subject } from '../../types';
import { 
  ArrowLeft, 
  Sparkles, 
  AlertTriangle, 
  Zap, 
  ArrowRight, 
  TrendingUp, 
  BrainCircuit, 
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

export const DiagnosticAssessmentPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [questions, setQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  useEffect(() => {
    if (!subjectId) return;

    const loadData = async () => {
      try {
        const [sub, qs] = await Promise.all([
          subjectService.getById(subjectId),
          diagnosticService.getQuestions(subjectId)
        ]);
        setSubject(sub);
        setQuestions(qs);
      } catch (err) {
        console.error("Failed to load diagnostic assessment:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [subjectId]);

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
    if (!subjectId) return;
    setSubmitting(true);
    try {
      const res = await diagnosticService.submitAssessment(subjectId, answers);
      setResult(res);
    } catch (err) {
      console.error("Failed to submit diagnostic assessment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading diagnostic assessment...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="azure-card rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Diagnostic Not Configured</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your instructor has not prepared diagnostic questions for this subject yet.
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

  // Diagnostic Result Modal / Card (Phase 3.2)
  if (result) {
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
              Baseline Calibrated: {result.assigned_level} Level
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Your results have been analyzed across individual conceptual domains. MindForge has initialized your personalized learning path accordingly.
            </p>
          </div>

          {/* Score Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-slate-800/80 border border-sky-200 dark:border-sky-800 text-center">
              <span className="text-xs text-slate-500 font-semibold block">Overall Score</span>
              <span className="text-3xl font-extrabold text-blue-600 dark:text-sky-300">
                {result.total_score} / {result.max_score}
              </span>
              <span className="text-xs text-slate-500 block mt-1">{result.percentage}% Accuracy</span>
            </div>
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-slate-800/80 border border-sky-200 dark:border-sky-800 text-center">
              <span className="text-xs text-slate-500 font-semibold block">Assigned Knowledge Tier</span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {result.assigned_level}
              </span>
              <span className="text-xs text-slate-500 block mt-1">Adaptive curriculum active</span>
            </div>
          </div>

          {/* Topic-Wise Breakdown (Phase 3.2 Requirement Example) */}
          <div className="space-y-3 pt-2 border-t border-sky-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Topic-Wise Competency Breakdown
            </h4>

            <div className="space-y-2">
              {result.topic_results.map((item, idx) => {
                const isStrong = item.status.toLowerCase() === 'strong';
                const isMedium = item.status.toLowerCase() === 'medium';
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900/60 flex items-center justify-between"
                  >
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      {item.topic}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">{item.score}%</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                        isStrong 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isMedium
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action to Start Path */}
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
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/student/subjects')}
        className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 dark:text-sky-400 hover:text-blue-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Subjects</span>
      </button>

      {/* Header Card */}
      <div className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
              Diagnostic Assessment • {subject?.name}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Question {currentIdx + 1} of {questions.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Active Question Box */}
      <div className="azure-card rounded-3xl p-7 border border-sky-200/90 dark:border-sky-900/60 shadow-sm space-y-6">
        <div className="space-y-2">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
            Concept Domain: {currentQ.concept}
          </span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
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
                className={`w-full p-4 rounded-2xl text-left text-sm font-semibold transition-all border flex items-center justify-between cursor-pointer ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/60 text-blue-950 dark:text-white shadow-xs'
                    : 'border-sky-200/80 dark:border-sky-900/50 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-blue-300'
                }`}
              >
                <span>{opt}</span>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Stepper Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-sky-100 dark:border-slate-800">
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
              disabled={submitting || Object.keys(answers).length === 0}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Submit & Calibrate Profile</span>
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="btn-primary px-5 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer flex items-center gap-1.5"
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
