import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { flashcardService, subjectService } from '../../api/services';
import type { FlashcardItem, Subject } from '../../types';
import { 
  Flame, 
  Sparkles, 
  RotateCw, 
  CheckCircle2, 
  Brain, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Loader2, 
  Filter, 
  ArrowLeft, 
  X, 
  Tag
} from 'lucide-react';
import { motion } from 'framer-motion';

export const FlashcardsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedSubjectId = searchParams.get('subject_id') || '';
  const selectedModuleId = searchParams.get('module_id') || '';

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [flashcards, setFlashcards] = useState<FlashcardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDueOnly, setFilterDueOnly] = useState(false);

  // Deck traversal state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [deckCompleted, setDeckCompleted] = useState(false);

  // Generate modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateSubjectId, setGenerateSubjectId] = useState(selectedSubjectId);
  const [generateTopicTitle, setGenerateTopicTitle] = useState('');
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

  // Load flashcards
  const loadCards = async () => {
    setLoading(true);
    setIsFlipped(false);
    setDeckCompleted(false);
    try {
      const cards = await flashcardService.getAll({
        subject_id: selectedSubjectId || undefined,
        module_id: selectedModuleId || undefined,
        due_only: filterDueOnly || undefined
      });
      setFlashcards(cards);
      setCurrentIndex(0);
    } catch (err) {
      console.error("Failed to load flashcards:", err);
      setFlashcards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [selectedSubjectId, selectedModuleId, filterDueOnly]);

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

  // Flip card
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Submit SM-2 Review
  const handleRate = async (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    if (flashcards.length === 0) return;
    const currentCard = flashcards[currentIndex];
    setReviewingId(currentCard.id);

    try {
      await flashcardService.review(currentCard.id, rating);
      
      // Advance to next card or complete
      if (currentIndex < flashcards.length - 1) {
        setIsFlipped(false);
        setCurrentIndex(currentIndex + 1);
      } else {
        setDeckCompleted(true);
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setReviewingId(null);
    }
  };

  // Generate flashcards handler
  const handleGenerateFlashcards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generateSubjectId || !generateTopicTitle.trim()) return;

    setIsGenerating(true);
    try {
      await flashcardService.generate({
        subject_id: generateSubjectId,
        topic_title: generateTopicTitle.trim(),
        count: generateCount
      });
      setShowGenerateModal(false);
      setGenerateTopicTitle('');
      // Refresh cards
      await loadCards();
    } catch (err) {
      console.error("Failed to generate flashcards:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentCard = flashcards[currentIndex];

  return (
    <div className="space-y-6 transition-colors duration-200 pb-16 max-w-4xl mx-auto">
      {/* Top Navigation & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/student/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-400 hover:text-blue-900 dark:hover:text-white transition-colors cursor-pointer mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Flame className="w-7 h-7 text-amber-500" />
            Spaced Repetition Flashcards
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Retain mastery through scientifically timed SM-2 spaced repetition intervals.
          </p>
        </div>

        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>Generate AI Flashcards</span>
        </button>
      </div>

      {/* Filter Toolbar */}
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

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filterDueOnly}
              onChange={(e) => setFilterDueOnly(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Due for Review Today Only</span>
          </label>
        </div>

        <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {flashcards.length} {flashcards.length === 1 ? 'card' : 'cards'} available
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="azure-card rounded-2xl p-16 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Loading flashcard deck...</p>
        </div>
      ) : flashcards.length === 0 ? (
        /* Empty State */
        <div className="azure-card rounded-2xl p-12 text-center space-y-4 border border-dashed border-sky-200 dark:border-sky-800">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto">
            <Flame className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Flashcards Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {filterDueOnly
                ? "You have no cards due for review right now! Great job staying caught up."
                : "No flashcards generated for this topic yet. Generate your first AI deck in seconds!"}
            </p>
          </div>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Flashcards Now</span>
          </button>
        </div>
      ) : deckCompleted ? (
        /* Deck Completed State */
        <div className="azure-card rounded-2xl p-12 text-center space-y-5 border border-emerald-300 dark:border-emerald-800">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Session Completed! 🎉</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
              You reviewed all {flashcards.length} cards in this deck. Your SM-2 memory intervals have been updated automatically.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsFlipped(false);
                setDeckCompleted(false);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              Restart Deck
            </button>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="btn-primary px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* Active Flashcard Viewer */
        <div className="space-y-6">
          {/* Deck Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>Card {currentIndex + 1} of {flashcards.length}</span>
              <span>{Math.round(((currentIndex + 1) / flashcards.length) * 100)}% Complete</span>
            </div>
            <div className="w-full h-2 rounded-full bg-sky-100 dark:bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Interactive Flip Card (3D Style) */}
          <div 
            onClick={handleFlip}
            className="cursor-pointer min-h-[340px] perspective-1000 select-none"
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className="relative w-full min-h-[340px] rounded-3xl preserve-3d"
            >
              {/* FRONT FACE */}
              <div className={`absolute inset-0 backface-hidden azure-card rounded-3xl p-8 border-2 border-sky-300/80 dark:border-sky-800 shadow-xl flex flex-col justify-between ${isFlipped ? 'pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <Tag className="w-3 h-3" />
                    {currentCard.concept_tag || 'Concept'}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {currentCard.difficulty}
                    </span>
                    {currentCard.is_due && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        Due Today
                      </span>
                    )}
                  </div>
                </div>

                {/* Question */}
                <div className="py-8 text-center space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Question</span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                    {currentCard.front_question}
                  </h3>
                </div>

                {/* Flip Prompt Footer */}
                <div className="text-center pt-4 border-t border-sky-100 dark:border-sky-900/60 flex items-center justify-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Click to reveal answer</span>
                </div>
              </div>

              {/* BACK FACE */}
              <div className={`absolute inset-0 backface-hidden rotate-y-180 azure-card rounded-3xl p-8 border-2 border-indigo-400/80 dark:border-indigo-800 shadow-xl flex flex-col justify-between ${!isFlipped ? 'pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5" />
                    Answer & Explanation
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Interval: {currentCard.interval_days}d • Reps: {currentCard.repetitions}
                  </span>
                </div>

                {/* Answer Content */}
                <div className="py-6 text-center space-y-2">
                  <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                    {currentCard.back_answer}
                  </p>
                </div>

                {/* SM-2 Self-Rating Buttons */}
                <div 
                  onClick={(e) => e.stopPropagation()} 
                  className="space-y-2 pt-4 border-t border-indigo-100 dark:border-indigo-900/60"
                >
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block text-center">
                    How well did you recall this? (SM-2 Spaced Repetition)
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      disabled={reviewingId !== null}
                      onClick={() => handleRate('AGAIN')}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer transition-colors text-center"
                    >
                      <div className="font-extrabold">Again</div>
                      <div className="text-[10px] opacity-75 font-normal">&lt; 1 day</div>
                    </button>

                    <button
                      disabled={reviewingId !== null}
                      onClick={() => handleRate('HARD')}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-pointer transition-colors text-center"
                    >
                      <div className="font-extrabold">Hard</div>
                      <div className="text-[10px] opacity-75 font-normal">1 day</div>
                    </button>

                    <button
                      disabled={reviewingId !== null}
                      onClick={() => handleRate('GOOD')}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors text-center"
                    >
                      <div className="font-extrabold">Good</div>
                      <div className="text-[10px] opacity-75 font-normal">3-5 days</div>
                    </button>

                    <button
                      disabled={reviewingId !== null}
                      onClick={() => handleRate('EASY')}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-colors text-center"
                    >
                      <div className="font-extrabold">Easy</div>
                      <div className="text-[10px] opacity-75 font-normal">Bonus days</div>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stepper controls */}
          <div className="flex items-center justify-between gap-3">
            <button
              disabled={currentIndex === 0}
              onClick={() => {
                setCurrentIndex(currentIndex - 1);
                setIsFlipped(false);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleFlip}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-100 dark:bg-slate-800 text-sky-800 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Flip Card</span>
            </button>

            <button
              disabled={currentIndex >= flashcards.length - 1}
              onClick={() => {
                setCurrentIndex(currentIndex + 1);
                setIsFlipped(false);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Generate AI Flashcards Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="azure-card rounded-2xl max-w-lg w-full border border-sky-300 dark:border-sky-800 shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-sky-100 dark:border-sky-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Generate AI Flashcards
                </h3>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateFlashcards} className="p-5 space-y-4">
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
                  Topic or Concept to Practice
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Binary Search, Recursion, Gradient Descent..."
                  value={generateTopicTitle}
                  onChange={(e) => setGenerateTopicTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Number of Cards
                </label>
                <div className="flex gap-2">
                  {[3, 5, 8, 10].map((num) => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setGenerateCount(num)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        generateCount === num
                          ? 'bg-blue-600 text-white shadow-xs'
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
                  disabled={isGenerating || !generateSubjectId || !generateTopicTitle.trim()}
                  className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40"
                >
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isGenerating ? 'Generating...' : 'Generate Deck'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
