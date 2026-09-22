import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subjectService, chapterService, moduleService } from '../../api/services';
import type { Subject, Chapter, Module } from '../../types';
import { 
  ArrowLeft, 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ChapterModuleManagementPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapTitle, setChapTitle] = useState('');
  const [chapDesc, setChapDesc] = useState('');
  const [chapOrder, setChapOrder] = useState<number>(1);
  const [savingChap, setSavingChap] = useState(false);

  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [targetChapterId, setTargetChapterId] = useState<string | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [modTitle, setModTitle] = useState('');
  const [modDesc, setModDesc] = useState('');
  const [modOrder, setModOrder] = useState<number>(1);
  const [savingMod, setSavingMod] = useState(false);

  const fetchSubjectAndChapters = async () => {
    if (!subjectId) return;
    try {
      const subData = await subjectService.getById(subjectId);
      setSubject(subData);
      const chapData = await chapterService.getBySubject(subjectId);
      setChapters(chapData);
    } catch (err) {
      console.error("Error fetching subject chapters:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectAndChapters();
  }, [subjectId]);

  const openCreateChapterModal = () => {
    setEditingChapterId(null);
    setChapTitle('');
    setChapDesc('');
    setChapOrder(chapters.length + 1);
    setIsChapterModalOpen(true);
  };

  const openEditChapterModal = (c: Chapter) => {
    setEditingChapterId(c.id);
    setChapTitle(c.title);
    setChapDesc(c.description || '');
    setChapOrder(c.order_index);
    setIsChapterModalOpen(true);
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId || !chapTitle) return;

    setSavingChap(true);
    try {
      if (editingChapterId) {
        await chapterService.update(editingChapterId, {
          title: chapTitle,
          description: chapDesc,
          order_index: chapOrder
        });
      } else {
        await chapterService.create(subjectId, {
          title: chapTitle,
          description: chapDesc,
          order_index: chapOrder
        });
      }
      setIsChapterModalOpen(false);
      fetchSubjectAndChapters();
    } catch (err) {
      console.error("Save chapter error:", err);
    } finally {
      setSavingChap(false);
    }
  };

  const handleDeleteChapter = async (chapId: string) => {
    if (!window.confirm("Are you sure you want to delete this chapter and all its modules?")) return;
    try {
      await chapterService.delete(chapId);
      fetchSubjectAndChapters();
    } catch (err) {
      console.error("Delete chapter error:", err);
    }
  };

  const openCreateModuleModal = (chapterId: string, moduleCount: number) => {
    setTargetChapterId(chapterId);
    setEditingModuleId(null);
    setModTitle('');
    setModDesc('');
    setModOrder(moduleCount + 1);
    setIsModuleModalOpen(true);
  };

  const openEditModuleModal = (chapterId: string, m: Module) => {
    setTargetChapterId(chapterId);
    setEditingModuleId(m.id);
    setModTitle(m.title);
    setModDesc(m.description || '');
    setModOrder(m.order_index);
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetChapterId || !modTitle) return;

    setSavingMod(true);
    try {
      if (editingModuleId) {
        await moduleService.update(editingModuleId, {
          title: modTitle,
          description: modDesc,
          order_index: modOrder
        });
      } else {
        await moduleService.create(targetChapterId, {
          title: modTitle,
          description: modDesc,
          order_index: modOrder
        });
      }
      setIsModuleModalOpen(false);
      fetchSubjectAndChapters();
    } catch (err) {
      console.error("Save module error:", err);
    } finally {
      setSavingMod(false);
    }
  };

  const handleDeleteModule = async (modId: string) => {
    if (!window.confirm("Are you sure you want to delete this module?")) return;
    try {
      await moduleService.delete(modId);
      fetchSubjectAndChapters();
    } catch (err) {
      console.error("Delete module error:", err);
    }
  };

  return (
    <div className="space-y-6 transition-colors duration-200">
      <button
        onClick={() => navigate('/teacher/subjects')}
        className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 dark:text-sky-400 hover:text-blue-900 dark:hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Subject Management</span>
      </button>

      {subject && (
        <div className="azure-card rounded-2xl p-7 border border-sky-200/90 dark:border-sky-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 bg-sky-100 dark:bg-sky-950 px-2.5 py-1 rounded-md border border-sky-200 dark:border-sky-800 mb-2 inline-block">
              Subject Overview
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{subject.name}</h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">{subject.description || 'No description provided.'}</p>
          </div>

          <button
            onClick={openCreateChapterModal}
            className="px-5 py-2.5 btn-primary rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chapter</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="azure-card rounded-2xl p-12 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
          Loading curriculum hierarchy...
        </div>
      ) : chapters.length === 0 ? (
        <div className="azure-card rounded-2xl p-12 text-center space-y-3">
          <Layers className="w-10 h-10 text-sky-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No chapters added yet</h3>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
            Click 'Add Chapter' to start structuring chapters and learning modules for this subject.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {chapters.map((chap, cIdx) => (
            <div 
              key={chap.id}
              className="azure-card rounded-2xl p-6 border border-sky-200/90 dark:border-sky-900/60 space-y-4 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-extrabold text-xs flex items-center justify-center border border-sky-200 dark:border-sky-800">
                    {chap.order_index || cIdx + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{chap.title}</h3>
                    {chap.description && (
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">{chap.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditChapterModal(chap)}
                    className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Chapter</span>
                  </button>
                  <button
                    onClick={() => handleDeleteChapter(chap.id)}
                    className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <div className="pl-4 border-l-2 border-sky-200 dark:border-sky-800 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider">
                    Modules ({chap.modules?.length || 0})
                  </span>
                  <button
                    onClick={() => openCreateModuleModal(chap.id, chap.modules?.length || 0)}
                    className="px-3 py-1 bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-700 dark:text-sky-300 rounded-lg text-xs font-bold border border-sky-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Module</span>
                  </button>
                </div>

                {(!chap.modules || chap.modules.length === 0) ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-2 italic font-medium">
                    No modules yet. Click 'Add Module' to create the first learning unit.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {chap.modules.map((mod, mIdx) => (
                      <div
                        key={mod.id}
                        className="p-3 rounded-xl bg-sky-50/50 dark:bg-slate-800/50 border border-sky-100 dark:border-slate-700 flex items-center justify-between gap-3 hover:border-sky-300 dark:hover:border-sky-600 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-sky-700 dark:text-sky-400">
                            {(mIdx + 1).toString().padStart(2, '0')}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white block">{mod.title}</span>
                            {mod.description && (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{mod.description}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditModuleModal(chap.id, mod)}
                            className="p-1 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-sky-100 dark:hover:bg-slate-700 transition-colors"
                            title="Edit Module"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteModule(mod.id)}
                            className="p-1 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Module"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Chapter Modal */}
      <AnimatePresence>
        {isChapterModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="azure-card bg-white dark:bg-slate-900 rounded-2xl p-7 max-w-md w-full border border-sky-200 dark:border-sky-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-sky-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingChapterId ? 'Edit Chapter' : 'Add New Chapter'}
                </h2>
                <button
                  onClick={() => setIsChapterModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveChapter} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Chapter Title *</label>
                  <input
                    type="text"
                    required
                    value={chapTitle}
                    onChange={(e) => setChapTitle(e.target.value)}
                    placeholder="e.g. Chapter 1: Introduction"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Order Index</label>
                  <input
                    type="number"
                    value={chapOrder}
                    onChange={(e) => setChapOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Description (Optional)</label>
                  <textarea
                    rows={3}
                    value={chapDesc}
                    onChange={(e) => setChapDesc(e.target.value)}
                    placeholder="Outline what this chapter covers..."
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsChapterModalOpen(false)}
                    className="px-4 py-2 btn-secondary rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingChap}
                    className="px-5 py-2 btn-primary rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {savingChap ? 'Saving...' : 'Save Chapter'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Module Modal */}
      <AnimatePresence>
        {isModuleModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="azure-card bg-white dark:bg-slate-900 rounded-2xl p-7 max-w-md w-full border border-sky-200 dark:border-sky-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-sky-100 dark:border-slate-800 pb-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingModuleId ? 'Edit Module' : 'Add New Module'}
                </h2>
                <button
                  onClick={() => setIsModuleModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full hover:bg-sky-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveModule} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Module Title *</label>
                  <input
                    type="text"
                    required
                    value={modTitle}
                    onChange={(e) => setModTitle(e.target.value)}
                    placeholder="e.g. Module 1.1: Core Concepts"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Order Index</label>
                  <input
                    type="number"
                    value={modOrder}
                    onChange={(e) => setModOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Description (Optional)</label>
                  <textarea
                    rows={3}
                    value={modDesc}
                    onChange={(e) => setModDesc(e.target.value)}
                    placeholder="Summary of topics in this module..."
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModuleModalOpen(false)}
                    className="px-4 py-2 btn-secondary rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingMod}
                    className="px-5 py-2 btn-primary rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {savingMod ? 'Saving...' : 'Save Module'}
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
