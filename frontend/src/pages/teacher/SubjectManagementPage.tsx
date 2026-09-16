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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-emerald-950 tracking-tight">Subject Management</h1>
          <p className="text-xs font-medium text-emerald-800/80 mt-1">
            Create and maintain academic courses for students
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 hover:from-emerald-900 hover:to-teal-900 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Subject</span>
        </button>
      </div>

      {loading ? (
        <div className="glass-card rounded-3xl p-12 text-center text-xs font-semibold text-emerald-700/80">
          Loading academic subjects...
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-emerald-300 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-950">No subjects created yet</h3>
          <p className="text-xs font-medium text-emerald-700/80 max-w-sm mx-auto">
            Click 'Create New Subject' above to start building your academic curriculum.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => (
            <motion.div
              key={sub.id}
              whileHover={{ y: -3 }}
              className="glass-card rounded-3xl p-6 border border-emerald-200/80 bg-white flex flex-col justify-between h-56 transition-all hover:border-emerald-400 shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Subject ID: {sub.id.slice(0, 8)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => openEditModal(sub, e)}
                      className="p-1 text-emerald-600 hover:text-emerald-900 rounded-lg hover:bg-emerald-50 transition-colors"
                      title="Edit Subject"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingSubject(sub);
                      }}
                      className="p-1 text-emerald-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-emerald-950 line-clamp-1">{sub.name}</h3>
                <p className="text-xs font-medium text-emerald-800/80 mt-2 line-clamp-2 leading-relaxed">
                  {sub.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-emerald-100 mt-auto flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-700" />
                  {sub.chapter_count || sub.chapters?.length || 0} Chapters
                </span>
                <button
                  onClick={() => navigate(`/teacher/subjects/${sub.id}/manage`)}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>Manage Chapters</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card bg-white rounded-3xl p-7 max-w-lg w-full border border-emerald-200 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-800" />
                  <h2 className="text-lg font-bold text-emerald-950">
                    {editingSubjectId ? 'Edit Subject' : 'Create New Subject'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-emerald-600 hover:text-emerald-900 rounded-full hover:bg-emerald-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSubject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Advanced Chemistry"
                    className="w-full px-4 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Description (Optional)</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a brief overview of the course scope..."
                    className="w-full px-4 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-emerald-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-900 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 flex items-center gap-1.5 cursor-pointer"
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

      <AnimatePresence>
        {deletingSubject && (
          <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card bg-white rounded-3xl p-7 max-w-md w-full border border-red-200 shadow-2xl space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Subject?</h3>
              <p className="text-xs text-slate-600 font-medium">
                Are you sure you want to delete <strong className="text-slate-900">"{deletingSubject.name}"</strong>? 
                All associated chapters and modules will also be permanently removed.
              </p>

              <div className="flex justify-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setDeletingSubject(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteSubject}
                  disabled={deleting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-200 cursor-pointer"
                >
                  {deleting ? 'Deleting...' : 'Delete Subject'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
