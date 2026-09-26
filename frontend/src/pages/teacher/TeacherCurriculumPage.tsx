import React, { useState, useEffect, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentService, subjectService, chapterService, classService } from '../../api/services';
import type { DocumentItem, Subject, Chapter, SchoolClass, DocumentStatus } from '../../types';
import { 
  FileUp, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  XCircle, 
  Download, 
  Trash2, 
  Eye, 
  Search, 
  FileText,
  Loader2,
  X,
  Plus
} from 'lucide-react';

export const TeacherCurriculumPage: React.FC = () => {
  const navigate = useNavigate();
  const titleInputId = useId();
  const subjectSelectId = useId();
  const chapterSelectId = useId();
  const classSelectId = useId();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DocumentStatus>('ALL');

  // PDF Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsData, subsData, clsData] = await Promise.all([
        documentService.getAll(),
        subjectService.getAll(),
        classService.getAll().catch(() => [])
      ]);
      setDocuments(docsData);
      setSubjects(subsData);
      setClasses(clsData);
    } catch (err) {
      console.error('Failed to load curriculum documents data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch chapters when subject selection changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      setSelectedChapterId('');
      return;
    }
    const fetchChapters = async () => {
      try {
        const chaps = await chapterService.getBySubject(selectedSubjectId);
        setChapters(chaps);
        setSelectedChapterId('');
      } catch (err) {
        console.error('Failed to load subject chapters:', err);
      }
    };
    fetchChapters();
  }, [selectedSubjectId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadError('Only PDF files (.pdf) are supported.');
        setSelectedFile(null);
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setUploadError('File size exceeds the 25MB limit.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setUploadError(null);
      if (!uploadTitle.trim()) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setUploadTitle(nameWithoutExt);
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please choose a PDF document.');
      return;
    }
    if (!uploadTitle.trim()) {
      setUploadError('Please enter a document title.');
      return;
    }
    if (!selectedSubjectId) {
      setUploadError('Please select a subject.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadStatusMsg('Uploading PDF to server...');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadTitle.trim());
    formData.append('subject_id', selectedSubjectId);
    if (selectedChapterId) formData.append('chapter_id', selectedChapterId);

    try {
      setUploadStatusMsg('Processing PDF & extracting curriculum chunks...');
      await documentService.upload(formData);
      setUploadStatusMsg('Processed successfully! Indexed into RAG storage.');
      
      setTimeout(() => {
        setIsUploadOpen(false);
        resetUploadForm();
        loadData();
      }, 1200);
    } catch (err: any) {
      setUploadStatusMsg(null);
      const msg = err.response?.data?.detail || 'Processing failed. Check PDF formatting or permissions.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadTitle('');
    setSelectedClassId('');
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setSelectedFile(null);
    setUploadError(null);
    setUploadStatusMsg(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await documentService.delete(deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (doc: DocumentItem) => {
    try {
      await documentService.downloadBlob(doc.id, doc.original_filename);
    } catch (err) {
      console.error('Failed to download document:', err);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(q) ||
      doc.original_filename.toLowerCase().includes(q) ||
      (doc.subject_name && doc.subject_name.toLowerCase().includes(q)) ||
      (doc.chapter_title && doc.chapter_title.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'APPROVED':
      case 'EXTRACTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Processed</span>
          </span>
        );
      case 'PROCESSING':
      case 'UPLOADED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>Processing...</span>
          </span>
        );
      case 'REVIEW_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Review Required</span>
          </span>
        );
      case 'FAILED':
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <XCircle className="w-3.5 h-3.5" />
            <span>Processing Failed</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-6 pb-16 max-w-6xl mx-auto transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-slate-800 pb-6">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-sky-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-sky-400" />
            <span>Teacher Portal</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-tight">
            Curriculum Management
          </h1>
          <p className="text-xs font-medium text-stone-600 dark:text-slate-400 mt-1">
            Upload textbook PDFs and curriculum materials to index into the RAG knowledge base for student Study Space AI Tutors.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
        >
          <FileUp className="w-4 h-4" />
          <span>Upload PDF Material</span>
        </button>
      </div>

      {/* Toolbar & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-stone-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search uploaded materials by title, filename, or subject..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="w-full sm:w-auto px-3 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-bold text-stone-800 dark:text-slate-200 focus:outline-hidden"
        >
          <option value="ALL">All Statuses ({documents.length})</option>
          <option value="APPROVED">Processed</option>
          <option value="PROCESSING">Processing</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Curriculum Materials Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-stone-600 dark:text-slate-400">Loading curriculum materials...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center space-y-3 border border-stone-200 dark:border-slate-800">
          <FileText className="w-10 h-10 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-900 dark:text-white">No curriculum materials found</h3>
          <p className="text-xs text-stone-500 dark:text-slate-400">Upload your first chapter PDF to enrich the student Study Space RAG knowledge base.</p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload PDF</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-stone-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-800 text-[11px] font-bold text-stone-600 dark:text-slate-300 uppercase tracking-wider">
                  <th className="p-4 pl-6">Material Title</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Chapter</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800 text-xs">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-stone-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-sky-300 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-stone-900 dark:text-white">{doc.title}</h4>
                          <p className="text-[11px] text-stone-500 font-mono truncate max-w-[200px]">
                            {doc.original_filename} • {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {doc.subject_name || 'General Science'}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="font-medium text-stone-600 dark:text-slate-300">
                        {doc.chapter_title || 'General Chapter'}
                      </span>
                    </td>

                    <td className="p-4">
                      {getStatusBadge(doc.status)}
                    </td>

                    <td className="p-4 pr-6 text-right space-x-1">
                      <button
                        onClick={() => navigate(`/teacher/documents/${doc.id}/review`)}
                        className="p-1.5 text-stone-500 hover:text-indigo-600 dark:hover:text-sky-400 cursor-pointer rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800"
                        title="View Extracted Chunks"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 text-stone-500 hover:text-indigo-600 dark:hover:text-sky-400 cursor-pointer rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setDeleteTarget(doc)}
                        className="p-1.5 text-stone-500 hover:text-rose-600 cursor-pointer rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800"
                        title="Delete Material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-stone-200 dark:border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-indigo-600 dark:text-sky-400" />
                <h3 className="text-base font-bold text-stone-900 dark:text-white">
                  Upload Curriculum PDF
                </h3>
              </div>
              <button onClick={() => { setIsUploadOpen(false); resetUploadForm(); }} className="p-1 text-stone-400 hover:text-stone-700"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Drag and drop / File selector zone */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                  PDF Document File *
                </label>
                <div className="border-2 border-dashed border-stone-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-400 transition-colors bg-stone-50/50 dark:bg-slate-800/50">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="curriculum-pdf-input"
                  />
                  <label htmlFor="curriculum-pdf-input" className="cursor-pointer space-y-2 block">
                    <FileUp className="w-8 h-8 text-indigo-600 dark:text-sky-400 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-stone-800 dark:text-slate-200">
                        {selectedFile ? selectedFile.name : 'Drag & Drop PDF here or Click to Choose'}
                      </p>
                      <p className="text-[10px] text-stone-500 mt-0.5">PDF files up to 25MB supported</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Title input */}
              <div>
                <label htmlFor={titleInputId} className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                  Material Title *
                </label>
                <input
                  id={titleInputId}
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Class 9 Science Chapter 2 Textbook"
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-stone-900 dark:text-white"
                />
              </div>

              {/* Class & Subject Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={classSelectId} className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                    Class Target
                  </label>
                  <select
                    id={classSelectId}
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-bold text-stone-900 dark:text-white"
                  >
                    <option value="">Class 9 (Default)</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor={subjectSelectId} className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                    Subject *
                  </label>
                  <select
                    id={subjectSelectId}
                    required
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-bold text-stone-900 dark:text-white"
                  >
                    <option value="">Select Subject...</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Chapter Dropdown */}
              <div>
                <label htmlFor={chapterSelectId} className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
                  Associated Chapter (Optional)
                </label>
                <select
                  id={chapterSelectId}
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  disabled={!selectedSubjectId}
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-bold text-stone-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">Select Chapter (Optional)...</option>
                  {chapters.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              {/* Status Messages */}
              {uploadStatusMsg && (
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-900 dark:text-sky-200 text-xs font-bold flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                  <span>{uploadStatusMsg}</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsUploadOpen(false); resetUploadForm(); }}
                  className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile || !uploadTitle.trim() || !selectedSubjectId}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                  <span>{uploading ? 'Processing...' : 'Upload & Process'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-stone-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-stone-900 dark:text-white">Delete Curriculum Material?</h3>
            <p className="text-xs text-stone-600 dark:text-slate-300">
              Are you sure you want to remove <span className="font-bold text-stone-900 dark:text-white">"{deleteTarget.title}"</span>? This will unindex its chunks from student RAG search.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDeleteTarget(null)} className="px-3 py-1.5 text-xs font-bold text-stone-600">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
