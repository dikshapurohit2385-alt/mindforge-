import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
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
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DigitalNotebookPage: React.FC = () => {
  const location = useLocation();
  const stateParams = (location.state as any) || {};

  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
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
      setSuccessMsg(activeNoteId ? "Note saved successfully!" : "Note created!");
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
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      await noteService.delete(id);
      fetchNotesAndSubjects();
    } catch (err) {
      console.error("Delete note error:", err);
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchesSubject = selectedSubjectFilter === 'ALL' || n.subject_id === selectedSubjectFilter;
    const matchesQuery = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         n.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">Digital Notebook</h1>
          <p className="text-xs font-medium text-emerald-800/80 mt-1">
            Organize personal study notes by Subject, Chapter, and Module
          </p>
        </div>

        <button
          onClick={openNewNoteModal}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 hover:from-emerald-900 hover:to-teal-900 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Note</span>
        </button>
      </div>

      <div className="glass-card rounded-2xl p-4 border border-emerald-200/70 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-emerald-600/60 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search note titles or content..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/90 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 placeholder-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <Filter className="w-3.5 h-3.5 text-emerald-600/70 shrink-0" />
          <button
            onClick={() => setSelectedSubjectFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedSubjectFilter === 'ALL'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-white text-emerald-900 hover:bg-emerald-100/60'
            }`}
          >
            All Notes ({notes.length})
          </button>
          {subjects.map(sub => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectFilter(sub.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedSubjectFilter === sub.id
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-emerald-900 hover:bg-emerald-100/60'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="glass-card rounded-3xl p-12 text-center text-xs font-semibold text-emerald-700/80">
          Loading digital notes...
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-emerald-300 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-950">No notes found</h3>
          <p className="text-xs text-emerald-700/80 max-w-sm mx-auto font-medium">
            {searchQuery || selectedSubjectFilter !== 'ALL'
              ? "No notes matched your current filter criteria."
              : "Click 'Create New Note' above to start taking notes for your subjects."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotes.map((note) => (
            <motion.div
              key={note.id}
              whileHover={{ y: -3 }}
              onClick={() => openEditNoteModal(note)}
              className="glass-card rounded-3xl p-6 border border-emerald-200/80 bg-white flex flex-col justify-between h-60 transition-all hover:border-emerald-400 hover:shadow-lg cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {note.subject_name || 'Subject'}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="p-1 text-emerald-600 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-emerald-950 line-clamp-1">{note.title}</h3>
                <p className="text-xs font-medium text-emerald-800/80 mt-2 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>

              <div className="pt-3 border-t border-emerald-100 mt-auto flex items-center justify-between text-[10px] text-emerald-700/80 font-semibold">
                <span>
                  {note.chapter_title ? `${note.chapter_title}` : 'General Subject Note'}
                </span>
                <span>
                  {new Date(note.updated_at).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card bg-white rounded-3xl p-7 max-w-2xl w-full border border-emerald-200 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-800" />
                  <h2 className="text-lg font-bold text-emerald-950">
                    {activeNoteId ? 'Edit Digital Note' : 'Create New Digital Note'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 text-emerald-600 hover:text-emerald-900 rounded-full hover:bg-emerald-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-emerald-950 mb-1">Subject *</label>
                    <select
                      required
                      value={subjectId}
                      onChange={(e) => {
                        setSubjectId(e.target.value);
                        setChapterId('');
                        setModuleId('');
                      }}
                      className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-950 mb-1">Chapter (Optional)</label>
                    <select
                      value={chapterId}
                      onChange={(e) => {
                        setChapterId(e.target.value);
                        setModuleId('');
                      }}
                      className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">All Chapters</option>
                      {availableChapters.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-emerald-950 mb-1">Module (Optional)</label>
                    <select
                      value={moduleId}
                      onChange={(e) => setModuleId(e.target.value)}
                      className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">All Modules</option>
                      {availableModules.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Note Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Photosynthesis Light Reaction Formulas"
                    className="w-full px-4 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Note Content *</label>
                  <textarea
                    required
                    rows={8}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your study notes here..."
                    className="w-full px-4 py-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-emerald-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-900 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Note'}</span>
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
