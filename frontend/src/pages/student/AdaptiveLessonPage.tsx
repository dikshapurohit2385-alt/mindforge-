import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adaptiveContentService, noteService } from '../../api/services';
import type { ChapterAdaptiveLesson, StudentNote } from '../../types';
import { VisualDiagramRenderer } from '../../components/common/VisualDiagramRenderer';
import { InteractiveStudyWorkspace } from '../../components/common/InteractiveStudyWorkspace';
import { 
  ArrowLeft, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  Lightbulb, 
  Brain, 
  HelpCircle, 
  Flame, 
  CheckSquare, 
  FileText,
  Loader2,
  AlertTriangle,
  Award,
  Compass,
  Save,
  Check,
  Trash2,
  Edit3
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AdaptiveLessonPage: React.FC = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<ChapterAdaptiveLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for interactive quick checks in lesson
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({});

  // Integrated Bottom My Notes State
  const [chapterNotes, setChapterNotes] = useState<StudentNote[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaveSuccess, setNoteSaveSuccess] = useState<string | null>(null);

  const fetchLesson = async () => {
    if (!chapterId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adaptiveContentService.getChapterLesson(chapterId);
      setLesson(data);

      // Fetch existing notes for this chapter
      const notes = await noteService.getAll({ subject_id: data.subject_id, chapter_id: data.chapter_id });
      setChapterNotes(notes);
    } catch (err: any) {
      console.error("Failed to load adaptive lesson:", err);
      setError(err.response?.data?.detail || "Failed to load adaptive lesson. Please take the diagnostic assessment first.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson();
  }, [chapterId]);

  const handleSelectQuickCheck = (sectionIdx: number, optionIdx: number) => {
    setUserAnswers(prev => ({ ...prev, [sectionIdx]: optionIdx }));
    setShowFeedback(prev => ({ ...prev, [sectionIdx]: true }));
  };

  // Save or Update Integrated Lesson Note
  const handleSaveLessonNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lesson || !noteTitle.trim() || !noteContent.trim()) return;

    setSavingNote(true);
    try {
      if (activeNoteId) {
        await noteService.update(activeNoteId, {
          title: noteTitle.trim(),
          content: noteContent.trim(),
          subject_id: lesson.subject_id,
          chapter_id: lesson.chapter_id
        });
        setNoteSaveSuccess("Note updated!");
      } else {
        await noteService.create({
          subject_id: lesson.subject_id,
          chapter_id: lesson.chapter_id,
          title: noteTitle.trim(),
          content: noteContent.trim()
        });
        setNoteSaveSuccess("Note saved to notebook!");
      }

      setNoteTitle('');
      setNoteContent('');
      setActiveNoteId(null);
      setTimeout(() => setNoteSaveSuccess(null), 3000);

      // Refresh chapter notes
      const updatedNotes = await noteService.getAll({ subject_id: lesson.subject_id, chapter_id: lesson.chapter_id });
      setChapterNotes(updatedNotes);
    } catch (err) {
      console.error("Failed to save lesson note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  const handleEditNote = (note: StudentNote) => {
    setActiveNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };

  const handleDeleteNote = async (id: string) => {
    if (!window.confirm("Delete this lesson note?")) return;
    try {
      await noteService.delete(id);
      if (lesson) {
        const updatedNotes = await noteService.getAll({ subject_id: lesson.subject_id, chapter_id: lesson.chapter_id });
        setChapterNotes(updatedNotes);
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4 max-w-md mx-auto">
        <Loader2 className="w-10 h-10 text-indigo-600 dark:text-sky-400 animate-spin mx-auto" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Generating AI Adaptive Lesson...</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Synthesizing learner profile, RAG course materials, and knowledge graph prerequisites into a calm visual learning flow.
        </p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="azure-card rounded-3xl p-10 text-center space-y-5 max-w-lg mx-auto my-12 border border-sky-200 dark:border-sky-900 shadow-lg">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Diagnostic Required</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {error || "To view this chapter's adaptive lesson, complete the diagnostic assessment first."}
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/student/subjects')}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Back to Subjects
          </button>
          {chapterId && (
            <button
              onClick={() => navigate(`/student/diagnostic/chapter/${chapterId}`)}
              className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Take Chapter Diagnostic</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const { learner_profile } = lesson;

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/student/subjects/${lesson.subject_id}`)}
          className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-sky-400 hover:text-indigo-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {lesson.subject_name}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            AI Calibrated Lesson
          </span>
        </div>
      </div>

      {/* Main Chapter Title Banner */}
      <div className="rounded-3xl p-6 sm:p-8 border border-indigo-900/40 bg-slate-900 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-widest">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>Chapter Adaptive Textbook • {lesson.subject_name}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            {lesson.chapter_title}
          </h1>

          <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-sky-400/30 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-extrabold text-sky-300 uppercase tracking-wider block">
                Personalized Adaptation Strategy
              </span>
              <p className="text-slate-200 leading-relaxed font-medium">
                {lesson.student_explanation}
              </p>
              {learner_profile && (
                <div className="flex flex-wrap gap-2 pt-1 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-sky-300 border border-slate-700">
                    Level: {learner_profile.knowledge_level.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-emerald-300 border border-slate-700">
                    Visual: {learner_profile.visual_support_need.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prerequisites Recap Banner (if any) */}
      {lesson.prerequisites_recap && lesson.prerequisites_recap.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
          <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-600" />
            Prerequisite Knowledge Refresh
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-amber-950 dark:text-amber-200">
            {lesson.prerequisites_recap.map((recap, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{recap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3-Part Study Workspace Container */}
      <InteractiveStudyWorkspace 
        subjectId={lesson.subject_id} 
        chapterId={lesson.chapter_id}
        chapterTitle={lesson.chapter_title}
        subjectName={lesson.subject_name}
      >
        {/* Lesson Sections (Wrapped in lesson-reading-area by InteractiveStudyWorkspace) */}
        <div className="space-y-6">
          {lesson.sections.map((sec, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-stone-200 dark:border-slate-800 shadow-2xs space-y-4"
            >
              {/* Section Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-stone-100 dark:border-slate-800">
                <div className={`p-2 rounded-xl text-white font-bold ${
                  sec.section_type === 'concept' ? 'bg-indigo-600' :
                  sec.section_type === 'in_simple_words' ? 'bg-sky-600' :
                  sec.section_type === 'real_world_application' ? 'bg-emerald-600' :
                  sec.section_type === 'remember_tip' ? 'bg-amber-500' : 'bg-purple-600'
                }`}>
                  {sec.section_type === 'concept' ? <BookOpen className="w-4 h-4" /> :
                   sec.section_type === 'in_simple_words' ? <Lightbulb className="w-4 h-4" /> :
                   sec.section_type === 'real_world_application' ? <Brain className="w-4 h-4" /> :
                   sec.section_type === 'remember_tip' ? <Sparkles className="w-4 h-4" /> :
                   <HelpCircle className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700 dark:text-sky-400 block">
                    {sec.section_type.replace(/_/g, ' ')}
                  </span>
                  <h3 className="text-lg font-extrabold text-stone-900 dark:text-white">
                    {sec.title}
                  </h3>
                </div>
              </div>

              {/* Section Main Text Content */}
              <div className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200 leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
                {sec.content}
              </div>

              {/* Bullet Points */}
              {sec.bullet_points && sec.bullet_points.length > 0 && (
                <div className="space-y-2 pt-1">
                  {sec.bullet_points.map((pt, pIdx) => (
                    <div key={pIdx} className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800/80 border border-stone-200/80 dark:border-slate-700 text-xs font-semibold text-stone-800 dark:text-slate-200 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{pt}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Visual Component Diagram */}
              {sec.visual_component && (
                <VisualDiagramRenderer component={sec.visual_component} />
              )}

              {/* Quick Check Question */}
              {sec.quick_check_question && (
                <div className="mt-4 p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-extrabold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                      Quick Concept Check
                    </h4>
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                    {sec.quick_check_question.question}
                  </p>

                  <div className="space-y-2">
                    {sec.quick_check_question.options.map((opt, oIdx) => {
                      const isChosen = userAnswers[idx] === oIdx;
                      const isCorrect = oIdx === sec.quick_check_question?.correct_option_index;
                      const answered = showFeedback[idx];

                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectQuickCheck(idx, oIdx)}
                          className={`w-full p-3 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                            answered && isCorrect
                              ? 'bg-emerald-100 dark:bg-emerald-950 border-emerald-400 text-emerald-950 dark:text-emerald-200'
                              : answered && isChosen && !isCorrect
                              ? 'bg-rose-100 dark:bg-rose-950 border-rose-400 text-rose-950 dark:text-rose-200'
                              : isChosen
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white dark:bg-slate-900 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-slate-700 hover:border-indigo-300'
                          }`}
                        >
                          <span>{opt}</span>
                          {answered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {answered && isChosen && !isCorrect && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {showFeedback[idx] && sec.quick_check_question.explanation && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-stone-700 dark:text-slate-300 leading-relaxed">
                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 block mb-0.5">Explanation:</span>
                      {sec.quick_check_question.explanation}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Integrated Bottom Note-Taking Area (`My Notes`) */}
        <div className="notebook-editor-area mt-10 bg-[#fcfbf7] dark:bg-slate-900 rounded-3xl p-6 border border-stone-300 dark:border-slate-800 shadow-sm space-y-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-600" />
          
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3 pl-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-800 dark:text-amber-400" />
              <h3 className="text-base font-bold text-stone-900 dark:text-white font-serif">
                My Notes for {lesson.chapter_title}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              Auto-linked to Notebook
            </span>
          </div>

          {noteSaveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{noteSaveSuccess}</span>
            </div>
          )}

          {/* Note Input Form */}
          <form onSubmit={handleSaveLessonNote} className="space-y-3 pl-2">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                Note Heading *
              </label>
              <input
                type="text"
                required
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="e.g. Key formula derivation & summary..."
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/25"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                Personal Lesson Notes *
              </label>
              <textarea
                required
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Type personal explanations, formulas, or takeaways while reading..."
                className="w-full p-3.5 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/25 leading-relaxed font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-stone-500 font-medium">
                {chapterNotes.length} note(s) written for this chapter
              </span>
              <div className="flex items-center gap-2">
                {activeNoteId && (
                  <button
                    type="button"
                    onClick={() => { setActiveNoteId(null); setNoteTitle(''); setNoteContent(''); }}
                    className="px-3 py-1.5 text-xs font-bold text-stone-600 cursor-pointer"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingNote || !noteTitle.trim() || !noteContent.trim()}
                  className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingNote ? 'Saving...' : activeNoteId ? 'Update Lesson Note' : 'Save to Notebook'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* List of existing notes written for this chapter */}
          {chapterNotes.length > 0 && (
            <div className="pt-4 border-t border-stone-200 dark:border-slate-800 space-y-2 pl-2">
              <span className="text-[11px] font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider block">
                Saved Chapter Notes:
              </span>
              <div className="space-y-2">
                {chapterNotes.map((n) => (
                  <div key={n.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white font-serif">{n.title}</h4>
                      <p className="text-xs text-stone-700 dark:text-stone-300 font-medium whitespace-pre-wrap">{n.content}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleEditNote(n)} className="p-1 text-stone-400 hover:text-amber-700"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteNote(n.id)} className="p-1 text-stone-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Consolidate Actions */}
        <div className="mt-8 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Consolidate Learning for {lesson.chapter_title}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => navigate(`/student/quizzes?subject_id=${lesson.subject_id}&chapter_id=${lesson.chapter_id}`)}
              className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-sky-200" />
              <span>Take Chapter Quiz</span>
            </button>

            <button
              onClick={() => navigate(`/student/flashcards?subject_id=${lesson.subject_id}&chapter_id=${lesson.chapter_id}`)}
              className="p-3.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-200" />
              <span>Practice Flashcards</span>
            </button>

            <button
              onClick={() => navigate('/student/notebook', {
                state: {
                  subjectId: lesson.subject_id,
                  chapterId: lesson.chapter_id,
                  title: `Notes: ${lesson.chapter_title}`
                }
              })}
              className="p-3.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>View Full Notebook</span>
            </button>
          </div>
        </div>
      </InteractiveStudyWorkspace>
    </div>
  );
};
