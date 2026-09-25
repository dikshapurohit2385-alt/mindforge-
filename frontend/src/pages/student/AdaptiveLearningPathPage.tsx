import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  learningPathService, 
  knowledgeGraphService, 
  subjectService 
} from '../../api/services';
import type { 
  Subject, 
  LearningPathData, 
  LearningPathModule, 
  KnowledgeGraphData,
  PrerequisiteCheckResult
} from '../../types';
import { 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  BrainCircuit, 
  Loader2,
  Info,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AdaptiveLearningPathPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [pathData, setPathData] = useState<LearningPathData | null>(null);
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PATH' | 'GRAPH'>('PATH');

  // Prerequisite inspect modal
  const [inspectPrereq, setInspectPrereq] = useState<PrerequisiteCheckResult | null>(null);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const subs = await subjectService.getAll();
        setSubjects(subs);
        const querySubjId = searchParams.get('subjectId');
        if (querySubjId && subs.some(s => s.id === querySubjId)) {
          setSelectedSubjectId(querySubjId);
        } else if (subs.length > 0) {
          setSelectedSubjectId(subs[0].id);
        }
      } catch (err) {
        console.error("Failed to load subjects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedSubjectId) return;

    const loadPathAndGraph = async () => {
      setLoading(true);
      try {
        const [path, graph] = await Promise.all([
          learningPathService.getPath(selectedSubjectId),
          knowledgeGraphService.getGraph(selectedSubjectId).catch(() => null)
        ]);
        setPathData(path);
        setGraphData(graph);
      } catch (err) {
        console.error("Failed to load learning path:", err);
      } finally {
        setLoading(false);
      }
    };

    loadPathAndGraph();
  }, [selectedSubjectId]);

  const handleInspectPrerequisite = async (nodeId: string) => {
    try {
      const res = await knowledgeGraphService.checkPrerequisites(selectedSubjectId, nodeId);
      setInspectPrereq(res);
    } catch (err) {
      console.error("Prerequisite check failed:", err);
    }
  };

  const getStatusBadge = (status: LearningPathModule['status']) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed ✓
          </span>
        );
      case 'NEEDS_REVISION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            Needs Revision ⚠
          </span>
        );
      case 'CURRENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Current Step →
          </span>
        );
      case 'LOCKED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <Lock className="w-3.5 h-3.5" />
            Locked 🔒
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 transition-colors duration-200 pb-16">
      {/* Top Controls & Subject Selector */}
      <div className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Compass className="w-5 h-5 text-blue-600 dark:text-sky-400" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Adaptive Learning Path
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            AI-sequenced curriculum based on diagnostic scores, concept mastery, and verified prerequisites.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-sky-300 dark:border-sky-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white cursor-pointer"
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Toggle View: Path vs Knowledge Graph */}
          <div className="flex p-1 rounded-xl bg-sky-100/70 dark:bg-slate-800 border border-sky-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('PATH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'PATH' 
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-300 shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Path Sequence
            </button>
            <button
              onClick={() => setActiveTab('GRAPH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'GRAPH' 
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-sky-300 shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Knowledge Graph
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Calculating prerequisite graph & adaptive trajectory...</p>
        </div>
      ) : !pathData ? (
        <div className="azure-card rounded-2xl p-12 text-center text-xs text-slate-500">
          No curriculum modules found for this subject.
        </div>
      ) : activeTab === 'PATH' ? (
        /* Sequential Adaptive Learning Path (Phase 3.3) */
        <div className="space-y-4">
          {/* Progress Header */}
          <div className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                Curriculum Progression
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {pathData.completed_modules} of {pathData.total_modules} Modules Completed
                </span>
                <span className="text-xs font-bold text-blue-600 dark:text-sky-400">
                  ({pathData.overall_progress_percentage}%)
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate(`/student/diagnostic/${selectedSubjectId}`)}
              className="btn-secondary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
              <span>Retake Diagnostic Assessment</span>
            </button>
          </div>

          {/* Sequential Step Timeline */}
          <div className="azure-card rounded-3xl p-6 sm:p-8 border border-sky-200/90 dark:border-sky-900/60 shadow-sm">
            <div className="relative pl-6 border-l-2 border-sky-200 dark:border-sky-900 space-y-6">
              {pathData.modules.map((mod, index) => {
                const isCurrent = mod.status === 'CURRENT';
                const isNeedsRevision = mod.status === 'NEEDS_REVISION';
                const isCompleted = mod.status === 'COMPLETED';
                const isLocked = mod.status === 'LOCKED';

                return (
                  <div key={mod.id} className="relative group">
                    {/* Node Dot on Timeline */}
                    <div className={`absolute -left-[31px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                      isCompleted 
                        ? 'bg-emerald-500 border-emerald-300 text-white'
                        : isNeedsRevision
                        ? 'bg-amber-500 border-amber-300 text-white'
                        : isCurrent
                        ? 'bg-blue-600 border-sky-300 text-white shadow-md shadow-blue-500/40 animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Step Card */}
                    <div className={`p-5 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-r from-blue-50/80 to-sky-50/80 dark:from-blue-950/40 dark:to-slate-900 border-blue-400 shadow-md'
                        : isNeedsRevision
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60'
                        : isLocked
                        ? 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75'
                        : 'bg-white dark:bg-slate-900 border-sky-100 dark:border-sky-900/50 shadow-2xs'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">
                              {mod.chapter_title}
                            </span>
                            <span>•</span>
                            {getStatusBadge(mod.status)}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {mod.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                            {mod.description || 'Standard curriculum module unit.'}
                          </p>

                          {/* Prerequisite warning banner if locked or needs revision */}
                          {isLocked && mod.unmet_prerequisites.length > 0 && (
                            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-900">
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                              <span>Prerequisite Required: {mod.unmet_prerequisites.join(', ')}</span>
                            </div>
                          )}

                          {isNeedsRevision && (
                            <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-900">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Revision required: Recent quiz or flashcard error detected.</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isLocked ? (
                            <button
                              onClick={() => {
                                // Find knowledge node to inspect
                                const knNode = graphData?.nodes.find(n => n.name.toLowerCase() === mod.title.toLowerCase());
                                if (knNode) {
                                  handleInspectPrerequisite(knNode.id);
                                }
                              }}
                              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                            >
                              <Info className="w-3.5 h-3.5" />
                              <span>Check Lock</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/student/subjects/${selectedSubjectId}`)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer ${
                                isCurrent ? 'btn-primary' : 'btn-secondary'
                              }`}
                            >
                              <span>{isCompleted ? 'Review' : 'Study Now'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Interactive Knowledge Graph View (Phase 4.5 & 4.6) */
        <div className="space-y-4">
          <div className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                Concept Dependency Graph
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nodes represent conceptual competencies. Arrows define strict pedagogical prerequisites.
              </p>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Mastered</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> In Progress</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Weak</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span> Unvisited</span>
            </div>
          </div>

          <div className="azure-card rounded-3xl p-8 border border-sky-200/90 dark:border-sky-900/60 shadow-sm min-h-[400px]">
            {(!graphData || graphData.nodes.length === 0) ? (
              <p className="text-center text-xs text-slate-500 py-12">No graph nodes defined for this subject.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {graphData.nodes.map((node) => {
                  const isStrong = node.mastery_status === 'STRONG';
                  const isWeak = node.mastery_status === 'WEAK';
                  const isMedium = node.mastery_status === 'MEDIUM';

                  return (
                    <motion.div
                      key={node.id}
                      whileHover={{ scale: 1.02 }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        isStrong 
                          ? 'border-emerald-300 dark:border-emerald-900 bg-emerald-50/40 dark:bg-emerald-950/20' 
                          : isWeak
                          ? 'border-rose-300 dark:border-rose-900 bg-rose-50/40 dark:bg-rose-950/20'
                          : isMedium
                          ? 'border-amber-300 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20'
                          : 'border-sky-100 dark:border-sky-900/60 bg-white dark:bg-slate-900'
                      }`}
                      onClick={() => handleInspectPrerequisite(node.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                          {node.difficulty}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isStrong ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          isWeak ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                          isMedium ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {node.mastery_status}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{node.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {node.description}
                      </p>
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-blue-600 dark:text-sky-400 font-bold">
                        <span>Check Prerequisites →</span>
                        <span>{node.mastery_score}%</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prerequisite Inspection Modal (Phase 4.6) */}
      {inspectPrereq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="azure-card rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-sky-300 dark:border-sky-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {inspectPrereq.can_proceed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                )}
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Prerequisite Audit: {inspectPrereq.node_name}
                </h3>
              </div>
              <button
                onClick={() => setInspectPrereq(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className={`p-4 rounded-2xl border text-xs font-medium ${
              inspectPrereq.can_proceed
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200'
            }`}>
              {inspectPrereq.recommendation}
            </div>

            {inspectPrereq.unmet_prerequisites.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Unmet Prerequisites:
                </span>
                <div className="space-y-1.5">
                  {inspectPrereq.unmet_prerequisites.map((p, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs flex justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{p.prerequisite_name}</span>
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">{p.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectPrereq(null)}
                className="btn-primary px-5 py-2 rounded-xl text-xs font-bold"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
