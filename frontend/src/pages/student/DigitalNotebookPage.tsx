import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { noteService, subjectService } from '../../api/services';
import type { StudentNote, Subject, Chapter, Module } from '../../types';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Check, 
  Filter,
  ExternalLink,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DigitalNotebookPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const stateParams = (location.state as any) || {};

  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [selectedChapterFilter, setSelectedChapterFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState(stateParams.title || '');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState(stateParams.subjectId || '');
  const [chapterId, setChapterId] = useState(stateParams.chapterId || '');
  const [moduleId, setModuleId] = useState(stateParams.moduleId || '');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [availableChapters, setAvailableChapters] = useState<Chapter[]>([]);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);

  const fetchNotesAndSubjects = async () => {
    try {
      const [noteData, subData] = await Promise.all([
        noteService.getAll(),
        subjectService.getAll()
      ]);
      setNotes(noteData);
      setSubjects(subData);
      if (subData.length > 0 && !subjectId) {
        setSubjectId(subData[0].id);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotesAndSubjects();
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setAvailableChapters([]);
      return;
    }
    const foundSubject = subjects.find(s => s.id === subjectId);
    if (foundSubject && foundSubject.chapters) {
      setAvailableChapters(foundSubject.chapters);
    } else {
      setAvailableChapters([]);
    }
  }, [subjectId, subjects]);

  useEffect(() => {
    if (!chapterId) {
      setAvailableModules([]);
      return;
    }
    const foundChapter = availableChapters.find(c => c.id === chapterId);
    if (foundChapter && foundChapter.modules) {
      setAvailableModules(foundChapter.modules);
    } else {
      setAvailableModules([]);
    }
  }, [chapterId, availableChapters]);

  const openNewNoteModal = () => {
    setActiveNoteId(null);
    setTitle('');
    setContent('');
    if (subjects.length > 0 && !subjectId) {
      setSubjectId(subjects[0].id);
    }
    setChapterId('');
    setModuleId('');
    setIsEditing(true);
  };

  const openEditNoteModal = (note: StudentNote) => {
    setActiveNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setSubjectId(note.subject_id);
    setChapterId(note.chapter_id || '');
    setModuleId(note.module_id || '');
    setIsEditing(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !subjectId) return;

    setSaving(true);
    try {
      if (activeNoteId) {
        await noteService.update(activeNoteId, {
          title,
          content,
          subject_id: subjectId,
          chapter_id: chapterId || undefined,
          module_id: moduleId || undefined
        });
      } else {
        await noteService.create({
          subject_id: subjectId,
          chapter_id: chapterId || undefined,
          module_id: moduleId || undefined,
          title,
          content
        });
      }
      setSuccessMsg(activeNoteId ? "Note saved successfully" : "Note created");
      setTimeout(() => setSuccessMsg(null), 3000);
      setIsEditing(false);
      fetchNotesAndSubjects();
    } catch (err) {
      console.error("Save note error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this personal note?")) return;

    try {
      await noteService.delete(id);
      fetchNotesAndSubjects();
    } catch (err) {
      console.error("Delete note error:", err);
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchesSubject = selectedSubjectFilter === 'ALL' || n.subject_id === selectedSubjectFilter;
    const matchesChapter = selectedChapterFilter === 'ALL' || n.chapter_id === selectedChapterFilter;
    const matchesQuery = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesChapter && matchesQuery;
  });

  // Unique chapters across notes for the chapter filter
  const filterableChapters = Array.from(
    new Map(
      notes
        .filter(n => n.chapter_id && (selectedSubjectFilter === 'ALL' || n.subject_id === selectedSubjectFilter))
        .map(n => [n.chapter_id, { id: n.chapter_id, title: n.chapter_title || 'Chapter' }])
    ).values()
  );

  return (
    <div className="space-y-6 transition-colors duration-200 min-h-screen bg-[#faf9f6] dark:bg-slate-950 p-2 sm:p-4 rounded-3xl">
      {/* Notebook Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight font-serif">
              Personal Study Notebook
            </h1>
            <p className="text-xs font-medium text-stone-600 dark:text-stone-400 mt-0.5">
              Paper-style digital notebook linked to your adaptive textbook chapters
            </p>
          </div>
        </div>

        <button
          onClick={openNewNoteModal}
          className="px-4 py-2.5 bg-stone-900 hover:bg-black dark:bg-amber-600 dark:hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Note</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#f7f5ef] dark:bg-slate-900/90 rounded-2xl p-4 border border-stone-200/90 dark:border-slate-800 flex flex-col md:flex-row gap-3 justify-between items-center shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by keyword..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Subject:</span>
          </div>

          <button
            onClick={() => { setSelectedSubjectFilter('ALL'); setSelectedChapterFilter('ALL'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedSubjectFilter === 'ALL'
                ? 'bg-amber-800 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100'
            }`}
          >
            All ({notes.length})
          </button>
          {subjects.map(sub => (
            <button
              key={sub.id}
              onClick={() => { setSelectedSubjectFilter(sub.id); setSelectedChapterFilter('ALL'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedSubjectFilter === sub.id
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-stone-700 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:bg-stone-100'
              }`}
            >
              {sub.name}
            </button>
          ))}

          {filterableChapters.length > 0 && (
            <select
              value={selectedChapterFilter}
              onChange={(e) => setSelectedChapterFilter(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-lg text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer"
            >
              <option value="ALL">All Chapters</option>
              {filterableChapters.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-[#fcfbf7] dark:bg-slate-900 rounded-2xl p-12 text-center text-xs font-semibold text-stone-500 dark:text-slate-400 border border-stone-200 dark:border-slate-800">
          Opening digital notebook...
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bg-[#fcfbf7] dark:bg-slate-900/80 rounded-2xl p-12 text-center space-y-3 border border-stone-200 dark:border-slate-800">
          <FileText className="w-8 h-8 text-amber-300 dark:text-amber-700 mx-auto" />
          <h3 className="text-base font-bold text-stone-900 dark:text-white font-serif">Notebook Empty</h3>
          <p className="text-xs text-stone-600 dark:text-slate-400 max-w-sm mx-auto font-medium">
            {searchQuery || selectedSubjectFilter !== 'ALL'
              ? "No notes matched your search or subject selection."
              : "Click 'Write New Note' above or take notes while reading adaptive lessons."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              whileHover={{ y: -3 }}
              onClick={() => openEditNoteModal(note)}
              className="bg-[#fdfcf9] dark:bg-slate-900 rounded-2xl p-5 border border-stone-200/90 dark:border-slate-800 flex flex-col justify-between min-h-[220px] transition-all cursor-pointer group shadow-2xs hover:shadow-md relative overflow-hidden"
            >
              {/* Notebook Left Margin Line */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-300 dark:bg-rose-900/60" />

              <div className="pl-2">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200/80 dark:border-amber-900 flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {note.subject_name || 'Subject'}
                  </span>
                  
                  <button
                    onClick={(e) => handleDeleteNote(note.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                    title="Delete note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 font-serif line-clamp-1">
                  {note.title}
                </h3>
                <p className="text-xs font-medium text-stone-700 dark:text-stone-300 mt-2 line-clamp-4 leading-relaxed whitespace-pre-wrap font-sans">
                  {note.content}
                </p>
              </div>

              <div className="pt-3 border-t border-stone-200/60 dark:border-slate-800 mt-4 flex items-center justify-between text-[11px] text-stone-500 dark:text-slate-400 font-medium pl-2">
                <span className="truncate pr-2">
                  {note.chapter_title ? note.chapter_title : 'General Note'}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (note.chapter_id) {
                      navigate(`/student/study-space/${note.chapter_id}`);
                    } else if (note.subject_id) {
                      navigate(`/student/subjects/${note.subject_id}`);
                    }
                  }}
                  className="text-amber-800 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold shrink-0 cursor-pointer"
                >
                  <span>Open Lesson</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit / Create Note Paper Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#fcfbf7] dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-stone-300 dark:border-slate-800 shadow-2xl space-y-5 relative"
            >
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-800 dark:text-amber-400" />
                  <h2 className="text-base font-bold text-stone-900 dark:text-white font-serif">
                    {activeNoteId ? 'Edit Personal Note' : 'Write Personal Note'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-white rounded-full hover:bg-stone-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-slate-200 mb-1">Subject *</label>
                    <select
                      required
                      value={subjectId}
                      onChange={(e) => {
                        setSubjectId(e.target.value);
                        setChapterId('');
                        setModuleId('');
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-slate-200 mb-1">Chapter (Optional)</label>
                    <select
                      value={chapterId}
                      onChange={(e) => {
                        setChapterId(e.target.value);
                        setModuleId('');
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500"
                    >
                      <option value="">All Chapters</option>
                      {availableChapters.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-800 dark:text-slate-200 mb-1">Module (Optional)</label>
                    <select
                      value={moduleId}
                      onChange={(e) => setModuleId(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500"
                    >
                      <option value="">All Modules</option>
                      {availableModules.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-slate-200 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-bold text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 font-serif"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 dark:text-slate-200 mb-1">Notes *</label>
                  <textarea
                    required
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write key derivations, explanations, or formulas..."
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 leading-relaxed font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? 'Saving...' : activeNoteId ? 'Update Note' : 'Save Note'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
