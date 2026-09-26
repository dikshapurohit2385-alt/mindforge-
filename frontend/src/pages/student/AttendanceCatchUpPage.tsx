import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceService } from '../../api/services';
import type { CatchUpPathData } from '../../types';
import { VisualDiagramRenderer } from '../../components/common/VisualDiagramRenderer';
import { 
  ArrowLeft, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2,
  CalendarCheck,
  CheckSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AttendanceCatchUpPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const [catchupData, setCatchupData] = useState<CatchUpPathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subjectId) return;

    const fetchCatchUp = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await attendanceService.getCatchUpPath(subjectId);
        setCatchupData(data);
      } catch (err: any) {
        console.error("Failed to load attendance catch-up path:", err);
        setError(err.response?.data?.detail || "AI Catch-Up generation failed or service is unconfigured.");
      } finally {
        setLoading(false);
      }
    };

    fetchCatchUp();
  }, [subjectId]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <Loader2 className="w-10 h-10 text-indigo-600 dark:text-sky-400 animate-spin mx-auto" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Synthesizing AI Catch-Up Path...</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Analyzing missed attendance sessions, RAG course materials, and quiz accuracy to build your tailored catch-up plan.
        </p>
      </div>
    );
  }

  if (error || !catchupData) {
    return (
      <div className="azure-card rounded-3xl p-10 text-center space-y-5 max-w-lg mx-auto my-12 border border-sky-200 dark:border-sky-900 shadow-lg">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">AI Catch-Up Service Unavailable</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {error || "Live AI catch-up plan generation requires active Gemini API integration. Check backend configuration."}
          </p>
        </div>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const isAccelerated = catchupData.catchup_tier === 'ACCELERATED';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <button
        onClick={() => navigate(`/student/subjects/${catchupData.subject_id}`)}
        className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 dark:text-sky-400 hover:text-indigo-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to {catchupData.subject_name}</span>
      </button>

      {/* Header Banner */}
      <div className="azure-card rounded-3xl p-8 border border-indigo-200/80 dark:border-indigo-900/60 shadow-md bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5" />
              {catchupData.attendance_percentage}% Attendance
            </span>
            <span className={`text-xs font-extrabold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
              isAccelerated
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              {isAccelerated ? '🚀 Accelerated Catch-Up' : '🌱 Foundational Catch-Up'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Attendance Catch-Up Plan • {catchupData.subject_name}
          </h1>

          <div className="p-4 rounded-2xl bg-slate-800/90 border border-sky-400/30 backdrop-blur-md space-y-2 text-xs">
            <span className="font-extrabold text-sky-300 uppercase tracking-wider block">
              AI Attendance Decision Analysis
            </span>
            <p className="text-slate-200 leading-relaxed font-medium">
              "{catchupData.recommendation_summary}"
            </p>
          </div>
        </div>
      </div>

      {/* Catch-Up Sections */}
      <div className="space-y-6">
        {catchupData.sections.map((sec, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="azure-card rounded-3xl p-6 sm:p-8 border border-sky-200/90 dark:border-sky-900/60 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-3 pb-3 border-b border-sky-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-indigo-600 text-white font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-700 dark:text-sky-400 block">
                  {sec.section_type.replace(/_/g, ' ')}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {sec.title}
                </h3>
              </div>
            </div>

            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {sec.content}
            </p>

            {sec.bullet_points && sec.bullet_points.length > 0 && (
              <div className="space-y-2 pt-2">
                {sec.bullet_points.map((pt, pIdx) => (
                  <div key={pIdx} className="p-3 rounded-xl bg-sky-50/70 dark:bg-slate-900/70 border border-sky-100 dark:border-sky-900/40 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            )}

            {sec.diagram_headers && sec.diagram_rows && (
              <VisualDiagramRenderer
                component={{
                  type: 'comparison_table',
                  title: sec.title,
                  headers: sec.diagram_headers,
                  rows: sec.diagram_rows
                }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Action Toolbar */}
      <div className="azure-card rounded-3xl p-6 sm:p-8 border border-sky-200/90 dark:border-sky-900/60 shadow-md space-y-4 text-center">
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
          Ready to verify your catch-up mastery?
        </h3>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => navigate(`/student/quizzes?subject_id=${catchupData.subject_id}`)}
            className="btn-primary px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Take Quick Quiz</span>
          </button>
        </div>
      </div>
    </div>
  );
};
