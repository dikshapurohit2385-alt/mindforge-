import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subjectService, teacherAssistantService } from '../../api/services';
import type { Subject } from '../../types';
import { 
  Sparkles, 
  BookOpen, 
  CheckSquare, 
  Flame, 
  FileText, 
  Send, 
  Check, 
  Copy, 
  Loader2, 
  ArrowLeft, 
  CheckCircle2, 
  Zap, 
  ListOrdered
} from 'lucide-react';

type ContentType = 'QUIZ' | 'FLASHCARDS' | 'LESSON_PLAN' | 'SUMMARY' | 'ASSIGNMENT';

export const AITeacherAssistantPage: React.FC = () => {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [contentType, setContentType] = useState<ContentType>('QUIZ');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [itemCount, setItemCount] = useState(5);
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  // Generation & Publishing State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    content_type: string;
    topic: string;
    difficulty: string;
    generated_data: any;
  } | null>(null);

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const subs = await subjectService.getAll();
        setSubjects(subs);
        if (subs.length > 0) {
          setSelectedSubjectId(subs[0].id);
        }
      } catch (err) {
        console.error("Failed to load subjects:", err);
      }
    };
    loadSubjects();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !topic.trim()) return;

    setIsGenerating(true);
    setPublishedSuccess(false);
    try {
      const res = await teacherAssistantService.generate({
        subject_id: selectedSubjectId,
        content_type: contentType,
        topic: topic.trim(),
        difficulty,
        item_count: itemCount,
        additional_instructions: additionalInstructions.trim() || undefined
      });
      setGeneratedResult(res);
    } catch (err) {
      console.error("Failed to generate content:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generatedResult || !selectedSubjectId) return;

    setIsPublishing(true);
    try {
      if (generatedResult.content_type === 'QUIZ') {
        await teacherAssistantService.publishQuiz({
          subject_id: selectedSubjectId,
          title: `Quiz: ${generatedResult.topic}`,
          difficulty: generatedResult.difficulty,
          questions: generatedResult.generated_data.questions || generatedResult.generated_data
        });
      } else if (generatedResult.content_type === 'FLASHCARDS') {
        await teacherAssistantService.publishFlashcards({
          subject_id: selectedSubjectId,
          flashcards: generatedResult.generated_data.flashcards || generatedResult.generated_data
        });
      }
      setPublishedSuccess(true);
    } catch (err) {
      console.error("Failed to publish content to curriculum:", err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopy = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(JSON.stringify(generatedResult.generated_data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 transition-colors duration-200 pb-16 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/teacher/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-400 hover:text-blue-900 dark:hover:text-white transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Teacher Dashboard</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-yellow-500" />
            AI Teacher Assistant Studio
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Instantly create dynamic quizzes, spaced-repetition flashcard decks, lesson plans, and assignments.
          </p>
        </div>
      </div>

      {/* Generator Studio Grid: Left Configuration, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Content Configuration Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Generator Parameters
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Target Subject */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Target Subject
                </label>
                <select
                  required
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Select Subject</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              {/* Content Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Content Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'QUIZ', label: 'Quiz Questions', icon: CheckSquare },
                    { id: 'FLASHCARDS', label: 'Flashcards', icon: Flame },
                    { id: 'LESSON_PLAN', label: 'Lesson Plan', icon: BookOpen },
                    { id: 'SUMMARY', label: 'Study Summary', icon: FileText },
                    { id: 'ASSIGNMENT', label: 'Assignment', icon: ListOrdered }
                  ].map((ct) => {
                    const Icon = ct.icon;
                    const isSelected = contentType === ct.id;
                    return (
                      <button
                        type="button"
                        key={ct.id}
                        onClick={() => {
                          setContentType(ct.id as ContentType);
                          setGeneratedResult(null);
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-sky-200 dark:border-sky-800 text-slate-700 dark:text-slate-300 hover:bg-sky-50'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{ct.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Topic Focus */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Topic / Concept
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asynchronous JavaScript, Recursion, CNNs..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Difficulty Level */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setDifficulty(lvl)}
                      className={`py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                        difficulty === lvl
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-100/70 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {lvl === 'BEGINNER' ? 'Beginner' : lvl === 'INTERMEDIATE' ? 'Intermediate' : 'Advanced'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Item Count for Quizzes and Flashcards */}
              {(contentType === 'QUIZ' || contentType === 'FLASHCARDS') && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Number of Items
                  </label>
                  <div className="flex gap-2">
                    {[3, 5, 8, 10].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setItemCount(num)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          itemCount === num
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-sky-100/70 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Teacher Instructions */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Special Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Include real-world healthcare examples, avoid code, focus on edge cases..."
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating || !selectedSubjectId || !topic.trim()}
                className="w-full btn-primary inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40 shadow-sm"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-300" />}
                <span>{isGenerating ? 'Synthesizing Content...' : 'Generate with AI'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Output & One-Click Publishing */}
        <div className="lg:col-span-7 space-y-4">
          <div className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 shadow-xs flex flex-col min-h-[500px]">
            {/* Output Header */}
            <div className="flex items-center justify-between border-b border-sky-100 dark:border-sky-900 pb-3 mb-4">
              <div>
                <span className="text-xs font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider block">
                  Studio Output
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {generatedResult ? `${generatedResult.content_type}: ${generatedResult.topic}` : 'Preview & Publish'}
                </h3>
              </div>

              {generatedResult && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    title="Copy JSON"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {(generatedResult.content_type === 'QUIZ' || generatedResult.content_type === 'FLASHCARDS') && (
                    <button
                      onClick={handlePublish}
                      disabled={isPublishing || publishedSuccess}
                      className="btn-primary inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {isPublishing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : publishedSuccess ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>{publishedSuccess ? 'Published to Students!' : 'Publish to Curriculum'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Output Body */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {isGenerating ? (
                <div className="py-24 text-center">
                  <Loader2 className="w-9 h-9 text-blue-600 animate-spin mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    AI Pedagogical Engine is generating {contentType.toLowerCase().replace('_', ' ')}...
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Calibrating difficulty and learning objectives</p>
                </div>
              ) : !generatedResult ? (
                <div className="py-24 text-center space-y-2 border border-dashed border-sky-200 dark:border-sky-800 rounded-xl">
                  <Sparkles className="w-8 h-8 text-sky-400 mx-auto opacity-70" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No content generated yet.
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Fill in the parameters on the left and click "Generate with AI" to preview and publish.
                  </p>
                </div>
              ) : (
                /* Formatted Output Renderer based on Content Type */
                <div className="space-y-4">
                  {/* Quiz Preview */}
                  {generatedResult.content_type === 'QUIZ' && (
                    <div className="space-y-3">
                      {(generatedResult.generated_data.questions || generatedResult.generated_data).map((q: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-purple-700 dark:text-purple-400">Question {i + 1}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold">
                              {q.concept_tag || 'Concept'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{q.question}</p>
                          <div className="space-y-1 pl-2">
                            {q.options?.map((opt: string, oIdx: number) => (
                              <div key={oIdx} className={`p-1.5 rounded-lg text-[11px] flex items-center gap-2 ${
                                q.correct_answer === oIdx 
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800' 
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}>
                                <span className="font-mono">{String.fromCharCode(65 + oIdx)}.</span>
                                <span>{opt}</span>
                                {q.correct_answer === oIdx && <span className="ml-auto text-[10px]">✓ Correct</span>}
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <p className="text-[11px] text-slate-500 italic border-l-2 border-purple-400 pl-2 mt-1">
                              Explanation: {q.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Flashcards Preview */}
                  {generatedResult.content_type === 'FLASHCARDS' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(generatedResult.generated_data.flashcards || generatedResult.generated_data).map((card: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900 shadow-2xs space-y-2">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Card {i + 1} • {card.concept_tag || 'Concept'}</span>
                          <div className="space-y-1">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Front</span>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{card.front_question}</p>
                          </div>
                          <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase">Back</span>
                            <p className="text-xs text-slate-700 dark:text-slate-300">{card.back_answer}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Lesson Plan, Summary, or Assignment Preview */}
                  {(generatedResult.content_type === 'LESSON_PLAN' || generatedResult.content_type === 'SUMMARY' || generatedResult.content_type === 'ASSIGNMENT') && (
                    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-sky-100 dark:border-sky-900 shadow-2xs space-y-4">
                      {typeof generatedResult.generated_data === 'string' ? (
                        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                          {generatedResult.generated_data}
                        </p>
                      ) : (
                        <pre className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(generatedResult.generated_data, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
