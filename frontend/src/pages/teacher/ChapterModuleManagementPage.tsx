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
    <div className="space-y-6">
      <button
        onClick={() => navigate('/teacher/subjects')}
        className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Subject Management</span>
      </button>

      {subject && (
        <div className="glass-card rounded-3xl p-8 border border-emerald-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 marble-texture">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-2 inline-block">
              Subject Overview
            </span>
            <h1 className="text-2xl font-extrabold text-emerald-950">{subject.name}</h1>
            <p className="text-xs font-medium text-emerald-800/80 mt-1 max-w-xl">{subject.description || 'No description provided.'}</p>
          </div>

          <button
            onClick={openCreateChapterModal}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chapter</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="glass-card rounded-3xl p-12 text-center text-xs font-semibold text-emerald-700/80">
          Loading curriculum hierarchy...
        </div>
      ) : chapters.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center space-y-3">
          <Layers className="w-10 h-10 text-emerald-300 mx-auto" />
          <h3 className="text-sm font-bold text-emerald-950">No chapters added yet</h3>
          <p className="text-xs font-medium text-emerald-700/80 max-w-sm mx-auto">
            Click 'Add Chapter' to start structuring chapters and learning modules for this subject.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {chapters.map((chap, cIdx) => (
            <div 
              key={chap.id}
              className="glass-card rounded-3xl p-6 border border-emerald-200/80 bg-white space-y-4 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-900 font-extrabold text-xs flex items-center justify-center border border-emerald-200">
                    {chap.order_index || cIdx + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-emerald-950">{chap.title}</h3>
                    {chap.description && (
                      <p className="text-xs font-medium text-emerald-800/80 mt-0.5">{chap.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditChapterModal(chap)}
                    className="p-1.5 text-emerald-700 hover:text-emerald-950 rounded-xl hover:bg-emerald-50 transition-colors text-xs font-semibold flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Chapter</span>
                  </button>
                  <button
                    onClick={() => handleDeleteChapter(chap.id)}
                    className="p-1.5 text-emerald-700 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>

              <div className="pl-4 border-l-2 border-emerald-200 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    Modules ({chap.modules?.length || 0})
                  </span>
                  <button
                    onClick={() => openCreateModuleModal(chap.id, chap.modules?.length || 0)}
                    className="px-3 py-1 bg-emerald-100/80 hover:bg-emerald-200/80 text-emerald-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-emerald-200"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Module</span>
                  </button>
                </div>

                {(!chap.modules || chap.modules.length === 0) ? (
                  <p className="text-xs font-medium text-emerald-700/70 italic py-2">
                    No modules added to this chapter yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {chap.modules.map((mod, mIdx) => (
                      <div 
                        key={mod.id}
                        className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between hover:bg-white hover:shadow-xs transition-all"
                      >
                        <div className="truncate pr-2">
                          <span className="text-[10px] font-mono font-bold text-emerald-800 block">
                            Module {mod.order_index || mIdx + 1}
                          </span>
                          <span className="text-xs font-extrabold text-emerald-950 truncate block">{mod.title}</span>
                          {mod.description && (
                            <span className="text-[11px] font-medium text-emerald-700/80 truncate block mt-0.5">{mod.description}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditModuleModal(chap.id, mod)}
                            className="p-1 text-emerald-600 hover:text-emerald-950 rounded-lg hover:bg-emerald-100/60"
                            title="Edit Module"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteModule(mod.id)}
                            className="p-1 text-emerald-600 hover:text-red-600 rounded-lg hover:bg-red-50"
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

      <AnimatePresence>
        {isChapterModalOpen && (
          <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card bg-white rounded-3xl p-7 max-w-md w-full border border-emerald-200 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                <h2 className="text-lg font-bold text-emerald-950">
                  {editingChapterId ? 'Edit Chapter' : 'Add Chapter'}
                </h2>
                <button onClick={() => setIsChapterModalOpen(false)} className="p-1 text-emerald-600 hover:text-emerald-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveChapter} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Chapter Title *</label>
                  <input
                    type="text"
                    required
                    value={chapTitle}
                    onChange={(e) => setChapTitle(e.target.value)}
                    placeholder="e.g. Chapter 1: Chemical Bonding"
                    className="w-full px-4 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={chapDesc}
                    onChange={(e) => setChapDesc(e.target.value)}
                    placeholder="e.g. Ionic, covalent, and metallic bonding concepts"
                    className="w-full px-4 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Order Index</label>
                  <input
                    type="number"
                    value={chapOrder}
                    onChange={(e) => setChapOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-emerald-100">
                  <button
                    type="button"
                    onClick={() => setIsChapterModalOpen(false)}
                    className="px-4 py-2 bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-900 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingChap}
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20"
                  >
                    {savingChap ? 'Saving...' : 'Save Chapter'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModuleModalOpen && (
          <div className="fixed inset-0 z-50 bg-emerald-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card bg-white rounded-3xl p-7 max-w-md w-full border border-emerald-200 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                <h2 className="text-lg font-bold text-emerald-950">
                  {editingModuleId ? 'Edit Module' : 'Add Module'}
                </h2>
                <button onClick={() => setIsModuleModalOpen(false)} className="p-1 text-emerald-600 hover:text-emerald-900">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveModule} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Module Title *</label>
                  <input
                    type="text"
                    required
                    value={modTitle}
                    onChange={(e) => setModTitle(e.target.value)}
                    placeholder="e.g. Module 1.1: Lewis Dot Structures"
                    className="w-full px-4 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={modDesc}
                    onChange={(e) => setModDesc(e.target.value)}
                    placeholder="e.g. Valence electron representation"
                    className="w-full px-4 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">Order Index</label>
                  <input
                    type="number"
                    value={modOrder}
                    onChange={(e) => setModOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-emerald-100">
                  <button
                    type="button"
                    onClick={() => setIsModuleModalOpen(false)}
                    className="px-4 py-2 bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-900 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingMod}
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20"
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
