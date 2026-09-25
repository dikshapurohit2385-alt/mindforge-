import React, { useState, useEffect, useId } from 'react';
import { useNavigate } from 'react-router-dom';
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
  BookOpen
} from 'lucide-react';
import { documentService, subjectService, chapterService, moduleService } from '../../api/services';
import type { DocumentItem, Subject, Chapter, Module, DocumentStatus } from '../../types';

export const DocumentManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const titleInputId = useId();
  const subjectSelectId = useId();
  const chapterSelectId = useId();
  const moduleSelectId = useId();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | DocumentStatus>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Delete Confirm State
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docsData, subsData] = await Promise.all([
        documentService.getAll(),
        subjectService.getAll()
      ]);
      setDocuments(docsData);
      setSubjects(subsData);
    } catch (err) {
      console.error('Failed to load documents data:', err);
    } finally {
      setLoading(false);
    }
  };

  // When subject changes in upload modal, fetch chapters
  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      setSelectedChapterId('');
      setModules([]);
      setSelectedModuleId('');
      return;
    }
    const fetchChapters = async () => {
      try {
        const chaps = await chapterService.getBySubject(selectedSubjectId);
        setChapters(chaps);
        setSelectedChapterId('');
        setModules([]);
        setSelectedModuleId('');
      } catch (err) {
        console.error('Failed to load chapters:', err);
      }
    };
    fetchChapters();
  }, [selectedSubjectId]);

  // When chapter changes in upload modal, fetch modules
  useEffect(() => {
    if (!selectedChapterId) {
      setModules([]);
      setSelectedModuleId('');
      return;
    }
    const fetchModules = async () => {
      try {
        const mods = await moduleService.getByChapter(selectedChapterId);
        setModules(mods);
        setSelectedModuleId('');
      } catch (err) {
        console.error('Failed to load modules:', err);
      }
    };
    fetchModules();
  }, [selectedChapterId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadError('Only PDF files are supported.');
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
      setUploadError('Please select a PDF file.');
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

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadTitle.trim());
    formData.append('subject_id', selectedSubjectId);
    if (selectedChapterId) formData.append('chapter_id', selectedChapterId);
    if (selectedModuleId) formData.append('module_id', selectedModuleId);

    try {
      await documentService.upload(formData);
      setIsUploadOpen(false);
      resetUploadForm();
      await loadData();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to upload document. Please check the file.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadTitle('');
    setSelectedSubjectId('');
    setSelectedChapterId('');
    setSelectedModuleId('');
    setSelectedFile(null);
    setUploadError(null);
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

  // Filtering
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.original_filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.subject_name && doc.subject_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'ALL' || doc.status === statusFilter;
    const matchesSubject = subjectFilter === 'ALL' || doc.subject_id === subjectFilter;

    return matchesSearch && matchesStatus && matchesSubject;
  });

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Approved
          </span>
        );
      case 'REVIEW_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Review Required
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-700">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600 dark:text-sky-400" />
            Extracting Content...
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Rejected
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border border-red-300 dark:border-red-700">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const reviewNeededCount = documents.filter(d => d.status === 'REVIEW_REQUIRED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 azure-card rounded-2xl p-6 border border-sky-200/80 dark:border-sky-900/60 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              Phase 2: Ingestion & Review Studio
            </span>
            {reviewNeededCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white animate-pulse">
                {reviewNeededCount} action needed
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Curriculum Documents
          </h1>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 max-w-2xl font-medium">
            Upload course materials, syllabus guides, and chapter notes. Documents are parsed via PyMuPDF into educational units, reviewed, and approved for student access.
          </p>
        </div>

        <button
          onClick={() => {
            resetUploadForm();
            setIsUploadOpen(true);
          }}
          className="btn-primary inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl font-bold shadow-md shadow-blue-600/20 shrink-0 cursor-pointer"
        >
          <FileUp className="w-5 h-5" />
          <span>Upload PDF Document</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="azure-card rounded-2xl p-4 border border-sky-200/80 dark:border-sky-900/60 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-sky-100/70 dark:hover:bg-slate-800'
            }`}
          >
            All ({documents.length})
          </button>
          <button
            onClick={() => setStatusFilter('REVIEW_REQUIRED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'REVIEW_REQUIRED'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-sky-100/70 dark:hover:bg-slate-800'
            }`}
          >
            <span>Review Required</span>
            {reviewNeededCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                statusFilter === 'REVIEW_REQUIRED' ? 'bg-amber-700 text-white' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
              }`}>
                {reviewNeededCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-sky-100/70 dark:hover:bg-slate-800'
            }`}
          >
            Approved ({documents.filter(d => d.status === 'APPROVED').length})
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'REJECTED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-sky-100/70 dark:hover:bg-slate-800'
            }`}
          >
            Rejected ({documents.filter(d => d.status === 'REJECTED').length})
          </button>
        </div>

        {/* Search & Subject Select */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Documents Content */}
      {loading ? (
        <div className="azure-card rounded-2xl p-12 text-center border border-sky-200/80 dark:border-sky-900/60">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loading curriculum documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="azure-card rounded-2xl p-12 text-center border border-sky-200/80 dark:border-sky-900/60">
          <div className="w-16 h-16 rounded-2xl bg-sky-100 dark:bg-slate-800 border border-sky-200 dark:border-sky-800 flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-sky-400 shadow-sm">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {searchQuery || statusFilter !== 'ALL' || subjectFilter !== 'ALL'
              ? 'No documents match your filter'
              : 'No documents uploaded yet'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
            Upload your first course syllabus or lecture PDF. The system will automatically extract text, headings, and topic blocks for review.
          </p>
          <button
            onClick={() => {
              resetUploadForm();
              setIsUploadOpen(true);
            }}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            <FileUp className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="azure-card rounded-2xl p-5 border border-sky-200/80 dark:border-sky-900/60 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(doc.status)}
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-sky-100/80 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {doc.page_count > 0 ? `${doc.page_count} pages` : 'Pending pages'}
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {formatFileSize(doc.file_size)}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    File: <span className="font-mono text-slate-700 dark:text-slate-300">{doc.original_filename}</span>
                  </p>
                </div>

                {/* Subject / Chapter / Module Breadcrumb Chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                    <BookOpen className="w-3 h-3" />
                    {doc.subject_name || 'Subject'}
                  </span>
                  {doc.chapter_title && (
                    <>
                      <span className="text-slate-400">/</span>
                      <span className="font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-900">
                        {doc.chapter_title}
                      </span>
                    </>
                  )}
                  {doc.module_title && (
                    <>
                      <span className="text-slate-400">/</span>
                      <span className="font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900">
                        {doc.module_title}
                      </span>
                    </>
                  )}
                </div>

                {/* Error or Review Feedback Warning */}
                {doc.error_message && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>{doc.error_message}</span>
                  </div>
                )}

                {doc.review_comment && (
                  <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200">
                    <span className="font-bold">Review Note:</span> {doc.review_comment}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0">
                <button
                  onClick={() => navigate(`/teacher/documents/${doc.id}/review`)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    doc.status === 'REVIEW_REQUIRED'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-amber-700'
                      : 'btn-secondary'
                  }`}
                  title="Review extracted structured text and educational sections"
                >
                  <Eye className="w-4 h-4" />
                  <span>{doc.status === 'REVIEW_REQUIRED' ? 'Review & Approve' : 'Open Studio'}</span>
                </button>

                <button
                  onClick={() => handleDownload(doc)}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-sky-100/70 dark:hover:bg-slate-800 border border-sky-200/80 dark:border-sky-900/60 transition-colors cursor-pointer"
                  title="Download original PDF"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDeleteTarget(doc)}
                  className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer"
                  title="Delete document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="azure-card rounded-2xl max-w-lg w-full p-6 border border-sky-300 dark:border-sky-800 shadow-2xl relative">
            <button
              onClick={() => {
                setIsUploadOpen(false);
                resetUploadForm();
              }}
              className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Upload Curriculum PDF</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Extract, structure, and assign to your syllabus</p>
              </div>
            </div>

            {uploadError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Document Title */}
              <div>
                <label htmlFor={titleInputId} className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Document Title *
                </label>
                <input
                  id={titleInputId}
                  type="text"
                  required
                  placeholder="e.g. Chapter 4: Photosynthesis & Cellular Energy"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Subject Selector */}
              <div>
                <label htmlFor={subjectSelectId} className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Target Subject *
                </label>
                <select
                  id={subjectSelectId}
                  required
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer font-medium"
                >
                  <option value="">-- Choose Subject --</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>

              {/* Chapter Selector (Cascading) */}
              <div>
                <label htmlFor={chapterSelectId} className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Chapter <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  id={chapterSelectId}
                  disabled={!selectedSubjectId || chapters.length === 0}
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium"
                >
                  <option value="">
                    {!selectedSubjectId 
                      ? 'First select a subject' 
                      : chapters.length === 0 
                      ? 'No chapters in this subject' 
                      : '-- Choose Chapter --'}
                  </option>
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>{ch.title}</option>
                  ))}
                </select>
              </div>

              {/* Module Selector (Cascading) */}
              <div>
                <label htmlFor={moduleSelectId} className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Module <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <select
                  id={moduleSelectId}
                  disabled={!selectedChapterId || modules.length === 0}
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-medium"
                >
                  <option value="">
                    {!selectedChapterId 
                      ? 'First select a chapter' 
                      : modules.length === 0 
                      ? 'No modules in this chapter' 
                      : '-- Choose Module --'}
                  </option>
                  {modules.map((mod) => (
                    <option key={mod.id} value={mod.id}>{mod.title}</option>
                  ))}
                </select>
              </div>

              {/* PDF File Picker / Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  PDF Document File *
                </label>
                <div className="relative border-2 border-dashed border-sky-300 dark:border-sky-800 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-4 text-center transition-colors bg-sky-50/50 dark:bg-slate-900/50">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
                      <FileText className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-bold truncate max-w-xs">{selectedFile.name}</span>
                      <span className="text-[11px] text-slate-500">({formatFileSize(selectedFile.size)})</span>
                    </div>
                  ) : (
                    <div>
                      <FileUp className="w-8 h-8 text-sky-500 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Click to select or drag and drop PDF
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        PDF format up to 25MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-sky-100 dark:border-sky-900">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadOpen(false);
                    resetUploadForm();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer shadow-md shadow-blue-600/25"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ingesting PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-4 h-4" />
                      <span>Upload & Extract</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="azure-card rounded-2xl max-w-md w-full p-6 border border-rose-300 dark:border-rose-900 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3 font-bold">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white text-center mb-1">
              Delete Document?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 text-center mb-6">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">"{deleteTarget.title}"</span>? This will permanently remove the PDF file and all extracted educational structured content.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/25 cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
