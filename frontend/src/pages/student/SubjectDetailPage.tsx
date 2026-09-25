import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  subjectService, 
  documentService,
  adaptiveContentService,
  ragService,
  noteService
} from '../../api/services';
import type { 
  Subject, 
  Chapter, 
  Module, 
  DocumentItem, 
  ExtractedContentItem,
  AdaptiveExplainResponse,
  PersonalizedNoteItem,
  RAGQueryResponse
} from '../../types';
import { 
  ArrowLeft, 
  BookOpen, 
  Layers, 
  ChevronRight, 
  ChevronLeft,
  FileText, 
  MessageSquare, 
  User, 
  Sparkles,
  Download,
  BookMarked,
  X,
  Tag,
  Loader2,
  Bot,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Flame,
  CheckSquare,
  Search,
  Brain,
  ShieldCheck,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SubjectDetailPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<{ chapter: Chapter; module: Module } | null>(null);
  const [loading, setLoading] = useState(true);

  // Lesson Documents for active module
  const [moduleDocuments, setModuleDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Interactive Lesson Reader Modal
  const [activeDocForReading, setActiveDocForReading] = useState<DocumentItem | null>(null);
  const [docPages, setDocPages] = useState<ExtractedContentItem[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [readerPageIndex, setReaderPageIndex] = useState(0);

  // AI Adaptive Explanations Modal State
  const [showExplainModal, setShowExplainModal] = useState(false);
  const [explainLevel, setExplainLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');
  const [explainFormat, setExplainFormat] = useState<'SIMPLE' | 'ANALOGY' | 'CODE' | 'STEP_BY_STEP' | 'QUESTIONS' | 'SUMMARY'>('SIMPLE');
  const [customQuestion, setCustomQuestion] = useState('');
  const [explainResult, setExplainResult] = useState<AdaptiveExplainResponse | null>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);

  // Personalized 7-Section Notes Modal State
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesResult, setNotesResult] = useState<PersonalizedNoteItem | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [noteSavedSuccess, setNoteSavedSuccess] = useState(false);

  // RAG Document AI Assistant Modal State
  const [showRAGModal, setShowRAGModal] = useState(false);
  const [ragQuestion, setRagQuestion] = useState('');
  const [ragResult, setRagResult] = useState<RAGQueryResponse | null>(null);
  const [loadingRAG, setLoadingRAG] = useState(false);

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

  // When activeModule changes, fetch approved documents for that module
  useEffect(() => {
    if (!activeModule) {
      setModuleDocuments([]);
      return;
    }
    const fetchDocs = async () => {
      setLoadingDocs(true);
      try {
        // Students only receive APPROVED documents by backend security rule
        const docs = await documentService.getAll({
          subject_id: subjectId,
          module_id: activeModule.module.id
        });
        setModuleDocuments(docs);
      } catch (err) {
        console.error("Failed to load module documents:", err);
        setModuleDocuments([]);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocs();
  }, [activeModule, subjectId]);

  // Open interactive reader
  const handleOpenReader = async (doc: DocumentItem) => {
    setActiveDocForReading(doc);
    setReaderPageIndex(0);
    setLoadingPages(true);
    try {
      const pages = await documentService.getContent(doc.id);
      setDocPages(pages);
    } catch (err) {
      console.error("Failed to load document content for reader:", err);
    } finally {
      setLoadingPages(false);
    }
  };

  const handleDownloadPdf = async (doc: DocumentItem) => {
    try {
      await documentService.downloadBlob(doc.id, doc.original_filename);
    } catch (err) {
      console.error("Failed to download PDF:", err);
    }
  };

  // AI Adaptive Explanations Handler
  const handleOpenExplain = async () => {
    if (!activeModule || !subjectId) return;
    setShowExplainModal(true);
    setLoadingExplain(true);
    try {
      const res = await adaptiveContentService.explain({
        subject_id: subjectId,
        module_id: activeModule.module.id,
        topic_title: activeModule.module.title,
        explanation_level: explainLevel,
        format_type: explainFormat,
        custom_question: customQuestion.trim() || undefined
      });
      setExplainResult(res);
    } catch (err) {
      console.error("Failed to generate adaptive explanation:", err);
    } finally {
      setLoadingExplain(false);
    }
  };

  const handleFetchExplanationWithParams = async (
    lvl: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    fmt: 'SIMPLE' | 'ANALOGY' | 'CODE' | 'STEP_BY_STEP' | 'QUESTIONS' | 'SUMMARY'
  ) => {
    if (!activeModule || !subjectId) return;
    setExplainLevel(lvl);
    setExplainFormat(fmt);
    setLoadingExplain(true);
    try {
      const res = await adaptiveContentService.explain({
        subject_id: subjectId,
        module_id: activeModule.module.id,
        topic_title: activeModule.module.title,
        explanation_level: lvl,
        format_type: fmt,
        custom_question: customQuestion.trim() || undefined
      });
      setExplainResult(res);
    } catch (err) {
      console.error("Failed to re-generate explanation:", err);
    } finally {
      setLoadingExplain(false);
    }
  };

  // Personalized Notes Handler
  const handleOpenNotes = async () => {
    if (!activeModule || !subjectId) return;
    setShowNotesModal(true);
    setNoteSavedSuccess(false);
    setLoadingNotes(true);
    try {
      const res = await adaptiveContentService.generateNotes({
        subject_id: subjectId,
        module_id: activeModule.module.id,
        topic_title: activeModule.module.title
      });
      setNotesResult(res);
    } catch (err) {
      console.error("Failed to generate personalized notes:", err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleSaveNotesToNotebook = async () => {
    if (!notesResult || !subjectId || !activeModule) return;
    setSavingNote(true);
    try {
      const noteMarkdown = `# ${notesResult.topic_title}\n\n` +
        `## 1. Overview\n${notesResult.overview}\n\n` +
        `## 2. Core Concepts\n${notesResult.key_concepts.map(k => `- ${k}`).join('\n')}\n\n` +
        `## 3. Simple Explanation\n${notesResult.simple_explanation}\n\n` +
        `## 4. Key Definitions\n${notesResult.important_definitions.map(d => `**${d.term}**: ${d.definition}`).join('\n\n')}\n\n` +
        `## 5. Walkthroughs & Examples\n${notesResult.examples.map(e => `### ${e.title}\n${e.description}\n${e.code_or_math ? '```\n' + e.code_or_math + '\n```' : ''}`).join('\n\n')}\n\n` +
        `## 6. Common Mistakes\n${notesResult.common_mistakes.map(m => `⚠️ **${m.mistake}**\n*Correction:* ${m.correction}\n*Why:* ${m.why}`).join('\n\n')}\n\n` +
        `## 7. Quick Revision Checklist\n${notesResult.quick_revision}`;

      await noteService.create({
        subject_id: subjectId,
        chapter_id: activeModule.chapter.id,
        module_id: activeModule.module.id,
        title: `AI Notes: ${notesResult.topic_title}`,
        content: noteMarkdown
      });
      setNoteSavedSuccess(true);
    } catch (err) {
      console.error("Failed to save note to notebook:", err);
    } finally {
      setSavingNote(false);
    }
  };

  // RAG Document AI Assistant Handler
  const handleAskRAG = async () => {
    if (!ragQuestion.trim() || !subjectId) return;
    setLoadingRAG(true);
    try {
      const res = await ragService.query({
        subject_id: subjectId,
        module_id: activeModule?.module.id,
        question: ragQuestion.trim()
      });
      setRagResult(res);
    } catch (err) {
      console.error("Failed to query RAG:", err);
    } finally {
      setLoadingRAG(false);
    }
  };

  if (loading) {
    return (
      <div className="azure-card rounded-2xl p-12 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
        Loading curriculum details...
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="azure-card rounded-2xl p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Subject Not Found</h2>
        <button
          onClick={() => navigate('/student/subjects')}
          className="px-4 py-2 btn-primary rounded-xl text-xs font-bold cursor-pointer"
        >
          Back to Subjects
        </button>
      </div>
    );
  }

  const currentReadingPage = docPages[readerPageIndex];
  const structuredData = currentReadingPage?.structured_data;

  return (
    <div className="space-y-6 transition-colors duration-200 pb-16">
      <button
        onClick={() => navigate('/student/subjects')}
        className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 dark:text-sky-400 hover:text-blue-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Subjects</span>
      </button>

      {/* Subject Header Banner */}
      <div className="azure-card rounded-2xl p-7 border border-sky-200/90 dark:border-sky-900/60 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2.5 py-1 rounded-md border border-sky-200 dark:border-sky-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Teacher: {subject.teacher_name || 'Assigned Educator'}
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 bg-sky-50 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-sky-100 dark:border-slate-700">
                <Layers className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                {subject.chapters?.length || 0} Chapters
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{subject.name}</h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1.5 max-w-2xl leading-relaxed">{subject.description || 'No description provided.'}</p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/student/ask-teacher', { state: { subjectId: subject.id } })}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask Teacher</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Two-Column View: Curriculum Tree vs Module Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Chapters & Modules Accordion */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            Curriculum Navigation
          </h2>

          {(!subject.chapters || subject.chapters.length === 0) ? (
            <div className="azure-card rounded-2xl p-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
              No chapters published yet.
            </div>
          ) : (
            <div className="space-y-3">
              {subject.chapters.map((chap, cIdx) => (
                <div key={chap.id} className="azure-card rounded-xl overflow-hidden border border-sky-200/80 dark:border-sky-900/60">
                  <button
                    onClick={() => setActiveChapterId(activeChapterId === chap.id ? null : chap.id)}
                    className="w-full p-3.5 text-left font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center justify-between hover:bg-sky-50/70 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 text-xs flex items-center justify-center font-bold">
                        {cIdx + 1}
                      </span>
                      <span className="truncate">{chap.title}</span>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {chap.modules?.length || 0} mods
                    </span>
                  </button>

                  <AnimatePresence>
                    {activeChapterId === chap.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-sky-50/50 dark:bg-slate-800/50 p-2 space-y-1 border-t border-sky-100 dark:border-slate-800"
                      >
                        {(!chap.modules || chap.modules.length === 0) ? (
                          <p className="text-xs text-slate-500 dark:text-slate-400 p-2 italic font-medium">No modules in this chapter.</p>
                        ) : (
                          chap.modules.map((mod, mIdx) => (
                            <button
                              key={mod.id}
                              onClick={() => setActiveModule({ chapter: chap, module: mod })}
                              className={`w-full p-2.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                activeModule?.module.id === mod.id
                                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <span className="opacity-80 text-[10px] block font-mono">Mod {mIdx + 1}</span>
                                <span className="truncate block">{mod.title}</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />
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

        {/* Right Column: Module Viewer & Ingested Document Materials */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            Module Viewer
          </h2>

          {!activeModule ? (
            <div className="azure-card rounded-2xl p-12 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
              Select a chapter and module on the left to start learning.
            </div>
          ) : (
            <div className="azure-card rounded-2xl p-7 border border-sky-200/90 dark:border-sky-900/60 space-y-6">
              <div className="border-b border-sky-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider mb-1">
                  <span>{subject.name}</span>
                  <span>/</span>
                  <span>{activeModule.chapter.title}</span>
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">{activeModule.module.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{activeModule.module.description || 'Standard module unit.'}</p>
              </div>

              {/* Module Action Tools */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handleOpenExplain}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>AI Tutor & Explanations</span>
                </button>
                <button
                  onClick={handleOpenNotes}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-sm"
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>Personalized Notes</span>
                </button>
                <button
                  onClick={() => setShowRAGModal(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-sky-50 dark:bg-slate-800 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700 hover:bg-sky-100"
                >
                  <Search className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Ask Document AI</span>
                </button>
                <button
                  onClick={() => navigate(`/student/quizzes?subject_id=${subject.id}&module_id=${activeModule.module.id}`)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
                  <span>Module Quiz</span>
                </button>
                <button
                  onClick={() => navigate(`/student/flashcards?subject_id=${subject.id}&module_id=${activeModule.module.id}`)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                >
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  <span>Flashcards</span>
                </button>
                <button
                  onClick={() => navigate('/student/notebook', { 
                    state: { 
                    subjectId: subject.id,
                    chapterId: activeModule.chapter.id,
                    moduleId: activeModule.module.id,
                    title: `Notes: ${activeModule.module.title}`
                  } 
                })}
                className="px-3.5 py-2 btn-primary rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Take Notes</span>
              </button>
              <button
                onClick={() => navigate('/student/ask-teacher', {
                  state: {
                    subjectId: subject.id,
                    chapterId: activeModule.chapter.id,
                    moduleId: activeModule.module.id
                  }
                })}
                className="px-3.5 py-2 btn-secondary rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask Teacher Question</span>
              </button>
            </div>

              {/* Course Materials & Lesson Ingestion Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookMarked className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                    Teacher Lecture Notes & Lesson Materials
                  </h4>
                  <span className="text-xs font-semibold text-slate-500">
                    {moduleDocuments.length} approved {moduleDocuments.length === 1 ? 'document' : 'documents'}
                  </span>
                </div>

                {loadingDocs ? (
                  <div className="p-6 text-center text-xs font-medium text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading lesson materials...
                  </div>
                ) : moduleDocuments.length === 0 ? (
                  <div className="p-6 rounded-xl bg-sky-50/50 dark:bg-slate-800/40 border border-dashed border-sky-200 dark:border-sky-800 text-center space-y-1.5">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      No teacher documents assigned to this module yet
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Your teacher hasn't uploaded a PDF for this specific module yet. You can still use the notebook and ask teacher tools above!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {moduleDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-sky-200/80 dark:border-sky-900/60 hover:border-blue-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Approved Lesson
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}
                            </span>
                          </div>
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {doc.title}
                          </h5>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                            {doc.original_filename}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleOpenReader(doc)}
                            className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Read Lesson</span>
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(doc)}
                            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-sky-100/70 dark:hover:bg-slate-800 border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Lesson Reader Modal */}
      {activeDocForReading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="azure-card rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-sky-300 dark:border-sky-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-sky-100 dark:border-sky-900 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-400 mb-0.5">
                  <span>Lesson Reader</span>
                  <span>•</span>
                  <span>{activeDocForReading.subject_name}</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
                  {activeDocForReading.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(activeDocForReading)}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-sky-100/70 dark:hover:bg-slate-800 border border-sky-200 dark:border-sky-800 cursor-pointer"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setActiveDocForReading(null);
                    setDocPages([]);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Page Content */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {loadingPages ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Loading structured page content...</p>
                </div>
              ) : docPages.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No text content extracted for this document.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Topic Chips */}
                  {structuredData?.learning_topics && structuredData.learning_topics.length > 0 && (
                    <div className="p-3 rounded-xl bg-sky-50/80 dark:bg-slate-900/60 border border-sky-200 dark:border-sky-800/60 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-800 dark:text-sky-300">
                        <Tag className="w-3.5 h-3.5" />
                        Topics Covered:
                      </span>
                      {structuredData.learning_topics.map((topic, i) => (
                        <span key={i} className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Render Structured Sections or Paragraphs */}
                  {structuredData?.sections && structuredData.sections.length > 0 ? (
                    <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-sky-100 dark:border-sky-900/60 shadow-xs">
                      {structuredData.sections.map((sec, idx) => {
                        if (sec.type === 'heading') {
                          return (
                            <h2 key={idx} className="text-xl font-extrabold text-blue-950 dark:text-sky-100 pt-3 border-b border-sky-100 dark:border-sky-800/40 pb-1.5">
                              {sec.text}
                            </h2>
                          );
                        }
                        if (sec.type === 'subheading') {
                          return (
                            <h3 key={idx} className="text-base font-bold text-slate-900 dark:text-slate-100 pt-2">
                              {sec.text}
                            </h3>
                          );
                        }
                        if (sec.type === 'list') {
                          return (
                            <div key={idx} className="pl-2 space-y-1.5">
                              {sec.text && <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{sec.text}</p>}
                              <ul className="space-y-1 pl-5 list-disc text-sm text-slate-700 dark:text-slate-300">
                                {sec.items?.map((item: string, i: number) => (
                                  <li key={i} className="leading-relaxed">{item}</li>
                                ))}
                              </ul>
                            </div>
                          );
                        }
                        return (
                          <p key={idx} className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                            {sec.text}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-sky-100 dark:border-sky-900/60 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                      {currentReadingPage?.content_text}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Navigation Footer */}
            {docPages.length > 0 && (
              <div className="p-4 border-t border-sky-100 dark:border-sky-900 flex items-center justify-between gap-3 bg-sky-50/50 dark:bg-slate-900/50">
                <button
                  disabled={readerPageIndex === 0}
                  onClick={() => setReaderPageIndex(readerPageIndex - 1)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous Page</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Page {readerPageIndex + 1} of {docPages.length}
                  </span>
                </div>

                <button
                  disabled={readerPageIndex >= docPages.length - 1}
                  onClick={() => setReaderPageIndex(readerPageIndex + 1)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Next Page</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 1. AI Adaptive Explanations Modal */}
      {showExplainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="azure-card rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-sky-300 dark:border-sky-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-sky-100 dark:border-sky-900 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-400 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                  <span>Adaptive AI Tutor</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
                  {activeModule?.module.title || 'Topic Explanation'}
                </h3>
              </div>
              <button
                onClick={() => setShowExplainModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Level & Format Controls */}
            <div className="p-4 bg-sky-50/60 dark:bg-slate-900/60 border-b border-sky-100 dark:border-sky-900 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Depth:</span>
                  {(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => handleFetchExplanationWithParams(lvl, explainFormat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        explainLevel === lvl
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-100/70 border border-sky-200 dark:border-slate-700'
                      }`}
                    >
                      {lvl === 'BEGINNER' ? '🌱 Beginner' : lvl === 'INTERMEDIATE' ? '⚡ Intermediate' : '🚀 Advanced'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Style:</span>
                  {(['SIMPLE', 'ANALOGY', 'CODE', 'STEP_BY_STEP', 'QUESTIONS', 'SUMMARY'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => handleFetchExplanationWithParams(explainLevel, fmt)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        explainFormat === fmt
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-sky-100/70 border border-sky-200 dark:border-slate-700'
                      }`}
                    >
                      {fmt === 'SIMPLE' ? 'Simple' : fmt === 'ANALOGY' ? 'Analogy' : fmt === 'CODE' ? 'Code' : fmt === 'STEP_BY_STEP' ? 'Steps' : fmt === 'QUESTIONS' ? 'Q&A' : 'Summary'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom question prompt */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask a specific question about this topic (optional)..."
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchExplanationWithParams(explainLevel, explainFormat)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleFetchExplanationWithParams(explainLevel, explainFormat)}
                  className="px-3 py-1.5 btn-primary rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Update</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {loadingExplain ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Adapting explanation to {explainLevel.toLowerCase()} level ({explainFormat.toLowerCase()} style)...
                  </p>
                </div>
              ) : explainResult ? (
                <div className="space-y-4">
                  {/* Main Content */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-sky-100 dark:border-sky-900 shadow-xs">
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                      {explainResult.content}
                    </p>
                  </div>

                  {/* Code Snippet if present */}
                  {explainResult.code_snippet && (
                    <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-4">
                      <div className="text-[11px] font-mono font-bold text-sky-400 uppercase tracking-wider mb-2">Code Example</div>
                      <pre className="text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre">
                        {explainResult.code_snippet}
                      </pre>
                    </div>
                  )}

                  {/* Key Points */}
                  {explainResult.key_points && explainResult.key_points.length > 0 && (
                    <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-slate-900/60 border border-sky-200 dark:border-sky-800 space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        Key Takeaways
                      </h4>
                      <ul className="space-y-1.5 pl-4 list-disc text-xs text-slate-700 dark:text-slate-300">
                        {explainResult.key_points.map((pt, i) => (
                          <li key={i} className="leading-relaxed">{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Practice Prompt */}
                  {explainResult.practice_prompt && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1.5">
                      <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        Check Your Understanding
                      </h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {explainResult.practice_prompt}
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 2. Personalized 7-Section Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="azure-card rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-teal-300 dark:border-teal-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-teal-100 dark:border-teal-900 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-700 dark:text-teal-400 mb-0.5">
                  <Brain className="w-3.5 h-3.5 text-teal-600" />
                  <span>Personalized 7-Section Learning Notes</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
                  {notesResult?.topic_title || activeModule?.module.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {notesResult && (
                  <button
                    onClick={handleSaveNotesToNotebook}
                    disabled={savingNote || noteSavedSuccess}
                    className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {savingNote ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : noteSavedSuccess ? (
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    <span>{noteSavedSuccess ? 'Saved to Notebook!' : 'Save to Notebook'}</span>
                  </button>
                )}
                <button
                  onClick={() => setShowNotesModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {loadingNotes ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Generating structured 7-section notes based on your learning profile...
                  </p>
                </div>
              ) : notesResult ? (
                <div className="space-y-6">
                  {/* Section 1: Overview */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-900 shadow-2xs space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">1. Overview</span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">{notesResult.overview}</p>
                  </div>

                  {/* Section 2: Key Concepts */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-900 shadow-2xs space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">2. Key Concepts</span>
                    <div className="flex flex-wrap gap-2">
                      {notesResult.key_concepts.map((concept, i) => (
                        <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Simple Explanation */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-900 shadow-2xs space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">3. Plain Explanation</span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">{notesResult.simple_explanation}</p>
                  </div>

                  {/* Section 4: Important Definitions */}
                  {notesResult.important_definitions && notesResult.important_definitions.length > 0 && (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-900 shadow-2xs space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">4. Key Terminology</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {notesResult.important_definitions.map((def, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">{def.term}</span>
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed block mt-0.5">{def.definition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 5: Walkthroughs & Examples */}
                  {notesResult.examples && notesResult.examples.length > 0 && (
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-900 shadow-2xs space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">5. Walkthroughs & Examples</span>
                      {notesResult.examples.map((ex, i) => (
                        <div key={i} className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">{ex.title}</h5>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{ex.description}</p>
                          {ex.code_or_math && (
                            <pre className="text-[11px] font-mono p-2.5 rounded bg-slate-950 text-emerald-300 overflow-x-auto">
                              {ex.code_or_math}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Section 6: Common Mistakes */}
                  {notesResult.common_mistakes && notesResult.common_mistakes.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 shadow-2xs space-y-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        6. Common Pitfalls & Mistakes
                      </span>
                      <div className="space-y-2">
                        {notesResult.common_mistakes.map((mis, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-amber-900/60 space-y-1">
                            <div className="text-xs font-bold text-rose-600 dark:text-rose-400">⚠️ Mistake: {mis.mistake}</div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">✓ Fix: {mis.correction}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{mis.why}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 7: Quick Revision */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-900 shadow-2xs space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">7. Quick Revision Checklist</span>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono bg-sky-50 dark:bg-slate-800/80 p-3 rounded-lg border border-sky-100 dark:border-slate-700">
                      {notesResult.quick_revision}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 3. Ask Document AI (RAG Assistant) Modal */}
      {showRAGModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="azure-card rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-sky-300 dark:border-sky-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-sky-100 dark:border-sky-900 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-700 dark:text-sky-400 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Verified Document AI (Grounded RAG)</span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white truncate">
                  Ask Your Teacher's Documents
                </h3>
              </div>
              <button
                onClick={() => setShowRAGModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Question Input Bar */}
            <div className="p-4 bg-sky-50/60 dark:bg-slate-900/60 border-b border-sky-100 dark:border-sky-900 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. How does gradient descent minimize cost functions?"
                  value={ragQuestion}
                  onChange={(e) => setRagQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskRAG()}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  disabled={loadingRAG || !ragQuestion.trim()}
                  onClick={handleAskRAG}
                  className="px-4 py-2 btn-primary rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shrink-0"
                >
                  {loadingRAG ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  <span>Search Docs</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Guaranteed Anti-Hallucination: Answers are synthesized exclusively from approved teacher PDFs with exact page citations.
              </p>
            </div>

            {/* Modal Body / Results */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {loadingRAG ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Scanning semantic document vectors and verifying source relevance...
                  </p>
                </div>
              ) : ragResult ? (
                <div className="space-y-4">
                  {/* Grounded Answer Card */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-blue-600" />
                        AI Response
                      </span>
                      {ragResult.source_found && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          {Math.round(ragResult.confidence_score * 100)}% Confidence Match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                      {ragResult.answer}
                    </p>
                  </div>

                  {/* Anti-Hallucination fallback banner if source_found is false */}
                  {!ragResult.source_found && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Anti-Hallucination Guard Triggered</span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 block">
                          {ragResult.anti_hallucination_note || "The uploaded documents do not contain sufficient evidence to answer this question accurately."}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Source Citations */}
                  {ragResult.citations && ragResult.citations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <BookMarked className="w-3.5 h-3.5 text-blue-600" />
                        Source Citations ({ragResult.citations.length})
                      </h4>
                      <div className="space-y-2">
                        {ragResult.citations.map((cite, i) => (
                          <div key={i} className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-slate-900/60 border border-sky-200 dark:border-sky-800 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-sky-900 dark:text-sky-200 truncate">
                                📄 {cite.document_title}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                                Page {cite.page_number}
                              </span>
                            </div>
                            <blockquote className="text-[11px] text-slate-600 dark:text-slate-400 italic border-l-2 border-sky-400 pl-2 mt-1 leading-relaxed">
                              "{cite.snippet}"
                            </blockquote>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500">
                  Ask a question above to retrieve verified answers and exact page citations from your course material.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
