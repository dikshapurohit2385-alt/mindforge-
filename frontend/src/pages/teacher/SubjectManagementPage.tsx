import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subjectService } from '../../api/services';
import type { Subject } from '../../types';
import { 
  BookOpen, 
  Plus, 
  Edit3, 
  Trash2, 
  Layers, 
  ArrowRight, 
  X, 
  AlertTriangle,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const SubjectManagementPage: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSubjects = async () => {
    try {
      const data = await subjectService.getAll();
      setSubjects(data);
    } catch (err) {
      console.error("Error fetching subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openCreateModal = () => {
    setEditingSubjectId(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: Subject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubjectId(s.id);
    setName(s.name);
    setDescription(s.description || '');
    setIsModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSaving(true);
    try {
      if (editingSubjectId) {
        await subjectService.update(editingSubjectId, { name, description });
      } else {
        await subjectService.create({ name, description });
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err) {
      console.error("Save subject error:", err);
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteSubject = async () => {
    if (!deletingSubject) return;
    setDeleting(true);
    try {
      await subjectService.delete(deletingSubject.id);
      setDeletingSubject(null);
      fetchSubjects();
    } catch (err) {
      console.error("Delete subject error:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Subject Management</h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
            Create and maintain academic courses for students
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 btn-primary rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Subject</span>
        </button>
      </div>

      {loading ? (
        <div className="azure-card rounded-2xl p-12 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
          Loading academic subjects...
        </div>
      ) : subjects.length === 0 ? (
        <div className="azure-card rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-sky-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No subjects created yet</h3>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            Click 'Create New Subject' above to start building your academic curriculum.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => (
            <motion.div
              key={sub.id}
              whileHover={{ y: -3 }}
              className="azure-card azure-card-hover rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 flex flex-col justify-between h-60 transition-all shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2.5 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                    Subject ID: {sub.id.slice(0, 8)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => openEditModal(sub, e)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Subject"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingSubject(sub);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1">{sub.name}</h3>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {sub.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-sky-100 dark:border-slate-800 mt-auto flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  {sub.chapter_count || sub.chapters?.length || 0} Chapters
                </span>
                <button
                  onClick={() => navigate(`/teacher/subjects/${sub.id}/manage`)}
                  className="px-3.5 py-1.5 btn-primary rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Manage Chapters</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit / Create Subject Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="azure-card bg-white dark:bg-slate-900 rounded-2xl p-7 max-w-lg w-full border border-sky-200 dark:border-sky-800 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-sky-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingSubjectId ? 'Edit Subject' : 'Create New Subject'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSubject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Advanced Chemistry"
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Description (Optional)</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a brief overview of the course scope..."
                    className="w-full p-3.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-sky-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 btn-secondary rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 btn-primary rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Subject'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingSubject && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="azure-card bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-rose-200 dark:border-rose-900 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Subject?</h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{deletingSubject.name}"</span>? 
                This will permanently delete all associated chapters, modules, and notes. This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingSubject(null)}
                  className="px-4 py-2 btn-secondary rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={confirmDeleteSubject}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/25 cursor-pointer disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
