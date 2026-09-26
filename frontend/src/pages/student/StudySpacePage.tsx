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
  Save,
  Check,
  Trash2,
  Edit3
} from 'lucide-react';

export const StudySpacePage: React.FC = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<ChapterAdaptiveLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick concept check answers state
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [showFeedback, setShowFeedback] = useState<Record<number, boolean>>({});

  // Bottom Take Notes Editor State
  const [chapterNotes, setChapterNotes] = useState<StudentNote[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaveSuccess, setNoteSaveSuccess] = useState<string | null>(null);

  const fetchLessonAndNotes = async () => {
    if (!chapterId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adaptiveContentService.getChapterLesson(chapterId);
      setLesson(data);

      // Load existing notes written for this chapter
      const notes = await noteService.getAll({ subject_id: data.subject_id, chapter_id: data.chapter_id });
      setChapterNotes(notes);
    } catch (err: any) {
      console.error("Failed to load study space lesson:", err);
      setError(err.response?.data?.detail || "Failed to load study space. Complete the diagnostic assessment first.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessonAndNotes();
  }, [chapterId]);

  const handleSelectQuickCheck = (sectionIdx: number, optionIdx: number) => {
    setUserAnswers(prev => ({ ...prev, [sectionIdx]: optionIdx }));
    setShowFeedback(prev => ({ ...prev, [sectionIdx]: true }));
  };

  // Save or Update Note in Bottom Take Notes Editor
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
        setNoteSaveSuccess("Saved to Notebook");
      }

      setNoteTitle('');
      setNoteContent('');
      setActiveNoteId(null);
      setTimeout(() => setNoteSaveSuccess(null), 3000);

      // Refresh list of notes
      const updatedNotes = await noteService.getAll({ subject_id: lesson.subject_id, chapter_id: lesson.chapter_id });
      setChapterNotes(updatedNotes);
    } catch (err) {
      console.error("Failed to save note:", err);
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
    if (!window.confirm("Delete this study note?")) return;
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
        <h3 className="text-base font-bold text-stone-800 dark:text-stone-100">Opening Study Space...</h3>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Preparing textbook content, RAG context, and persistent AI Tutor.
        </p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center space-y-5 max-w-lg mx-auto my-12 border border-stone-200 dark:border-slate-800 shadow-md">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-stone-900 dark:text-white">Diagnostic Assessment Required</h3>
          <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
            {error || "To open this chapter's Study Space, complete the diagnostic assessment first."}
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/student/subjects')}
            className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Back to Subjects
          </button>
          {chapterId && (
            <button
              onClick={() => navigate(`/student/diagnostic/chapter/${chapterId}`)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              <span>Take Chapter Diagnostic</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-20 max-w-7xl mx-auto">
      {/* 3-Part Study Space Workspace Container */}
      <InteractiveStudyWorkspace 
        subjectId={lesson.subject_id} 
        chapterId={lesson.chapter_id}
        chapterTitle={lesson.chapter_title}
        subjectName={lesson.subject_name}
      >
        {/* CENTER AREA (~70% width): Unified Digital Textbook Page inside .lesson-reading-area */}
        <div className="space-y-6">
          
          {/* Digital Textbook Reading Sheet */}
          <div className="bg-[#fcfbf7] dark:bg-slate-900 border border-stone-300/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
            {/* Textbook Page Decorative Left Margin Line */}
            <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-rose-300/40 dark:bg-rose-950/40 pointer-events-none" />

            {/* Unified Top Header Bar matching specification */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 dark:border-slate-800 pb-5 mb-8 pl-4 sm:pl-6">
              <button
                onClick={() => navigate(`/student/subjects/${lesson.subject_id}`)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="text-center font-serif">
                <span className="text-[10px] font-extrabold tracking-widest text-stone-500 uppercase block mb-0.5">
                  {lesson.subject_name} · CLASS 9
                </span>
                <h1 className="text-lg sm:text-2xl font-black text-stone-900 dark:text-white tracking-tight">
                  {lesson.chapter_title}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                {lesson.learner_profile?.knowledge_level && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100/80 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                    <span>AI Calibrated ({lesson.learner_profile.knowledge_level})</span>
                  </span>
                )}
                <button
                  onClick={() => navigate('/student/notebook')}
                  className="px-3.5 py-1.5 bg-stone-900 text-white hover:bg-black rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Notebook</span>
                </button>
              </div>
            </div>

            {/* Textbook Reading Content */}
            <div className="space-y-8 pl-4 sm:pl-6">
              {lesson.sections.map((sec, idx) => (
                <div key={idx} className="space-y-4 pb-6 border-b border-stone-200/60 dark:border-slate-800/80 last:border-b-0 last:pb-0">
                  {/* Section Title */}
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg text-white font-bold shrink-0 ${
                      sec.section_type === 'concept' ? 'bg-indigo-700' :
                      sec.section_type === 'in_simple_words' ? 'bg-sky-700' :
                      sec.section_type === 'real_world_application' ? 'bg-emerald-700' :
                      sec.section_type === 'remember_tip' ? 'bg-amber-600' : 'bg-purple-700'
                    }`}>
                      {sec.section_type === 'concept' ? <BookOpen className="w-3.5 h-3.5" /> :
                       sec.section_type === 'in_simple_words' ? <Lightbulb className="w-3.5 h-3.5" /> :
                       sec.section_type === 'real_world_application' ? <Brain className="w-3.5 h-3.5" /> :
                       sec.section_type === 'remember_tip' ? <Sparkles className="w-3.5 h-3.5" /> :
                       <HelpCircle className="w-3.5 h-3.5" />}
                    </div>
                    <h2 className="text-base sm:text-xl font-bold font-serif text-stone-900 dark:text-stone-100">
                      {sec.title}
                    </h2>
                  </div>

                  {/* Section Body Text */}
                  <div className="text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap font-sans space-y-3">
                    {sec.content}
                  </div>

                  {/* Bullet Points */}
                  {sec.bullet_points && sec.bullet_points.length > 0 && (
                    <div className="space-y-2 pt-1 pl-2">
                      {sec.bullet_points.map((pt, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-2 text-xs sm:text-sm text-stone-800 dark:text-slate-200 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{pt}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Visual Component Diagram */}
                  {sec.visual_component && (
                    <div className="my-4">
                      <VisualDiagramRenderer component={sec.visual_component} />
                    </div>
                  )}

                  {/* Quick Concept Check Callout Box */}
                  {sec.quick_check_question && (
                    <div className="mt-5 p-5 rounded-2xl bg-amber-50/80 dark:bg-slate-800/90 border border-amber-200/90 dark:border-slate-700 space-y-3">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-amber-800 dark:text-amber-400" />
                        <h4 className="text-xs font-extrabold text-amber-950 dark:text-amber-300 uppercase tracking-wider">
                          Concept Check
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
                                  ? 'bg-amber-800 text-white border-amber-800'
                                  : 'bg-white dark:bg-slate-900 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-slate-700 hover:border-amber-400'
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
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 text-xs font-semibold text-stone-700 dark:text-slate-300 leading-relaxed">
                          <span className="font-extrabold text-amber-800 dark:text-amber-400 block mb-0.5">Explanation:</span>
                          {sec.quick_check_question.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: FOCUSED TAKE NOTES EDITOR BELOW LESSON */}
        <div className="notebook-editor-area mt-8 bg-[#fcfbf7] dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-stone-300 dark:border-slate-800 shadow-xs space-y-4 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-600" />
          
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-3 pl-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-800 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-stone-900 dark:text-white font-serif">
                TAKE NOTES
              </h3>
            </div>
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
              Write notes while studying
            </span>
          </div>

          {noteSaveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{noteSaveSuccess}</span>
            </div>
          )}

          {/* Clean Note Editor Form */}
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
                placeholder="e.g. Acid definition and key derivations..."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/25"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                Personal Study Notes *
              </label>
              <textarea
                required
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write your personal notes while reading..."
                className="w-full p-3.5 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/25 leading-relaxed font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-stone-500 font-medium">
                Saved notes persist on /student/notebook
              </span>
              <div className="flex items-center gap-2">
                {activeNoteId && (
                  <button
                    type="button"
                    onClick={() => { setActiveNoteId(null); setNoteTitle(''); setNoteContent(''); }}
                    className="px-3 py-1.5 text-xs font-bold text-stone-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingNote || !noteTitle.trim() || !noteContent.trim()}
                  className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingNote ? 'Saving...' : activeNoteId ? 'Update Note' : 'Save to Notebook'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Saved Notes Confirmation List */}
          {chapterNotes.length > 0 && (
            <div className="pt-4 border-t border-stone-200 dark:border-slate-800 space-y-2 pl-2">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                Saved Notes for this Chapter ({chapterNotes.length}):
              </span>
              <div className="space-y-2">
                {chapterNotes.slice(0, 3).map((n) => (
                  <div key={n.id} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <h4 className="font-bold text-stone-900 dark:text-white">{n.title}</h4>
                      <p className="text-[11px] text-stone-600 dark:text-slate-300 font-medium line-clamp-1">{n.content}</p>
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

        {/* Consolidate Practice Actions Bar */}
        <div className="mt-6 p-5 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-stone-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Consolidate Chapter Practice
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => navigate(`/student/quizzes?subject_id=${lesson.subject_id}&chapter_id=${lesson.chapter_id}`)}
              className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-sky-200" />
              <span>Take Chapter Quiz</span>
            </button>

            <button
              onClick={() => navigate(`/student/flashcards?subject_id=${lesson.subject_id}&chapter_id=${lesson.chapter_id}`)}
              className="p-3 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-200" />
              <span>Practice Flashcards</span>
            </button>

            <button
              onClick={() => navigate('/student/notebook')}
              className="p-3 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer"
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

