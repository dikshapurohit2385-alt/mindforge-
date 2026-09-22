import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  BookOpen, 
  Download, 
  Save, 
  Edit3, 
  Eye, 
  Tag, 
  Loader2, 
  ChevronLeft, 
  ChevronRight,
  Check
} from 'lucide-react';
import { documentService } from '../../api/services';
import type { DocumentDetail, ExtractedContentItem, DocumentStatus } from '../../types';

export const DocumentReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'STRUCTURED' | 'RAW_EDIT'>('STRUCTURED');

  // Page Editing State
  const [editedText, setEditedText] = useState('');
  const [savingPage, setSavingPage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Review Modals
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      loadDocument(id);
    }
  }, [id]);

  const loadDocument = async (docId: string) => {
    setLoading(true);
    try {
      const data = await documentService.getById(docId);
      setDocument(data);
      if (data.contents && data.contents.length > 0) {
        setEditedText(data.contents[0].content_text);
      }
    } catch (err) {
      console.error('Failed to load document detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPage = (index: number) => {
    if (!document || !document.contents[index]) return;
    setActivePageIndex(index);
    setEditedText(document.contents[index].content_text);
    setSaveSuccess(false);
  };

  const handleSavePageContent = async () => {
    if (!document || !document.contents[activePageIndex]) return;
    const currentContent = document.contents[activePageIndex];
    setSavingPage(true);
    setSaveSuccess(false);

    try {
      // Keep existing structured data or update text
      const updated = await documentService.updateContent(document.id, currentContent.id, {
        content_text: editedText,
        structured_data: currentContent.structured_data
      });

      // Update state in place
      const newContents = [...document.contents];
      newContents[activePageIndex] = updated;
      setDocument({
        ...document,
        contents: newContents
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save page changes:', err);
    } finally {
      setSavingPage(false);
    }
  };

  const handleReviewSubmit = async (status: 'APPROVED' | 'REJECTED') => {
    if (!document) return;
    setSubmittingReview(true);
    try {
      const updatedDoc = await documentService.review(document.id, {
        status,
        comment: reviewComment.trim() || undefined
      });
      setDocument({
        ...document,
        status: updatedDoc.status,
        review_comment: updatedDoc.review_comment,
        reviewed_by: updatedDoc.reviewed_by,
        reviewed_at: updatedDoc.reviewed_at
      });
      setIsApproveOpen(false);
      setIsRejectOpen(false);
      setReviewComment('');
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDownload = async () => {
    if (!document) return;
    try {
      await documentService.downloadBlob(document.id, document.original_filename);
    } catch (err) {
      console.error('Failed to download document:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 text-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Opening Review Studio...</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Loading extracted pages and structured education units</p>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center azure-card rounded-2xl p-8 border border-sky-200 dark:border-sky-800">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Document Not Found</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 mb-6">
          The requested document could not be retrieved or you do not have permission to view it.
        </p>
        <button
          onClick={() => navigate('/teacher/documents')}
          className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Documents</span>
        </button>
      </div>
    );
  }

  const currentPage: ExtractedContentItem | undefined = document.contents[activePageIndex];
  const structuredData = currentPage?.structured_data;

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
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Navigation */}
      <div className="azure-card rounded-2xl p-6 border border-sky-200/80 dark:border-sky-900/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/teacher/documents')}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Documents</span>
            </button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            {getStatusBadge(document.status)}
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {document.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
              <BookOpen className="w-3 h-3" />
              {document.subject_name || 'Subject'}
            </span>
            {document.chapter_title && (
              <>
                <span className="text-slate-400">/</span>
                <span className="font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-900">
                  {document.chapter_title}
                </span>
              </>
            )}
            {document.module_title && (
              <>
                <span className="text-slate-400">/</span>
                <span className="font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-900">
                  {document.module_title}
                </span>
              </>
            )}
            <span className="text-slate-400">•</span>
            <span>{document.page_count} Pages Ingested</span>
          </div>
        </div>

        {/* Global Review Actions Bar */}
        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
          <button
            onClick={handleDownload}
            className="p-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-sky-100/70 dark:hover:bg-slate-800 border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
            title="Download Original PDF"
          >
            <Download className="w-4 h-4" />
          </button>

          {document.status !== 'APPROVED' && (
            <button
              onClick={() => {
                setReviewComment('');
                setIsApproveOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve for Students</span>
            </button>
          )}

          {document.status !== 'REJECTED' && (
            <button
              onClick={() => {
                setReviewComment('');
                setIsRejectOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Review Alert Notice */}
      {document.status === 'REVIEW_REQUIRED' && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Pending Teacher Approval</p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                Students will only see this document and its lessons once you click "Approve for Students". Check extracted topics and formatting below.
              </p>
            </div>
          </div>
        </div>
      )}

      {document.status === 'APPROVED' && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">Approved & Published</p>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-0.5">
              This curriculum document is actively visible to enrolled students in their course viewer and notebook.
            </p>
          </div>
        </div>
      )}

      {document.status === 'REJECTED' && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Document Rejected</p>
            <p className="text-[11px] text-rose-800 dark:text-rose-300 mt-0.5">
              Reason: {document.review_comment || 'No reason provided.'}
            </p>
          </div>
        </div>
      )}

      {/* Main Studio Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Page Thumbnails / Selector */}
        <div className="lg:col-span-1 space-y-3">
          <div className="azure-card rounded-2xl p-4 border border-sky-200/80 dark:border-sky-900/60">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Pages ({document.contents.length})
              </span>
              <span className="text-[11px] font-bold text-blue-600 dark:text-sky-400">
                Page {activePageIndex + 1}
              </span>
            </div>

            <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
              {document.contents.map((content, idx) => (
                <button
                  key={content.id}
                  onClick={() => handleSelectPage(idx)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                    idx === activePageIndex
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-sky-100/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className={`w-3.5 h-3.5 ${idx === activePageIndex ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">Page {content.page_number}</span>
                  </div>
                  {content.is_edited && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                      idx === activePageIndex ? 'bg-blue-800 text-white' : 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300'
                    }`}>
                      Edited
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Page Info Card */}
          {currentPage && (
            <div className="azure-card rounded-2xl p-4 border border-sky-200/80 dark:border-sky-900/60 space-y-2.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Extraction Metrics</span>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Method:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{currentPage.extraction_method}</span>
              </div>
              {structuredData?.confidence_score !== undefined && (
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Confidence:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {(structuredData.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
              )}
              {structuredData?.learning_topics && structuredData.learning_topics.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Key Topics:</span>
                  <div className="flex flex-wrap gap-1">
                    {structuredData.learning_topics.map((t, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Page Viewer & Editor Studio */}
        <div className="lg:col-span-3 space-y-4">
          <div className="azure-card rounded-2xl p-5 border border-sky-200/80 dark:border-sky-900/60 space-y-4">
            {/* Page Header Bar with Tab Switches & Prev/Next */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-sky-100 dark:border-sky-900">
              {/* Tab Selector */}
              <div className="flex items-center gap-1 bg-sky-100/70 dark:bg-slate-900 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('STRUCTURED')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'STRUCTURED'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Structured Preview</span>
                </button>
                <button
                  onClick={() => setActiveTab('RAW_EDIT')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'RAW_EDIT'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Raw Text</span>
                </button>
              </div>

              {/* Prev / Next Page controls */}
              <div className="flex items-center gap-2">
                <button
                  disabled={activePageIndex === 0}
                  onClick={() => handleSelectPage(activePageIndex - 1)}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-sky-100/70 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Page {activePageIndex + 1} of {document.contents.length}
                </span>
                <button
                  disabled={activePageIndex >= document.contents.length - 1}
                  onClick={() => handleSelectPage(activePageIndex + 1)}
                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-sky-100/70 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* TAB 1: Structured Educational Preview */}
            {activeTab === 'STRUCTURED' && (
              <div className="space-y-4 min-h-[420px]">
                {/* Learning Topic Badges */}
                {structuredData?.learning_topics && structuredData.learning_topics.length > 0 && (
                  <div className="p-3 rounded-xl bg-sky-50/80 dark:bg-slate-900/60 border border-sky-200 dark:border-sky-800/60 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-800 dark:text-sky-300">
                      <Tag className="w-3.5 h-3.5" />
                      Topic Tags:
                    </span>
                    {structuredData.learning_topics.map((tag, i) => (
                      <span key={i} className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Structured Sections Render */}
                {structuredData?.sections && structuredData.sections.length > 0 ? (
                  <div className="space-y-3.5 p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-sky-100 dark:border-sky-900/60">
                    {structuredData.sections.map((sec, idx) => {
                      if (sec.type === 'heading') {
                        return (
                          <h2 key={idx} className="text-lg font-extrabold text-blue-900 dark:text-sky-200 pt-2 border-b border-sky-100 dark:border-sky-800/40 pb-1">
                            {sec.text}
                          </h2>
                        );
                      }
                      if (sec.type === 'subheading') {
                        return (
                          <h3 key={idx} className="text-sm font-bold text-slate-800 dark:text-slate-200 pt-1">
                            {sec.text}
                          </h3>
                        );
                      }
                      if (sec.type === 'list') {
                        return (
                          <div key={idx} className="pl-2">
                            {sec.text && <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{sec.text}</p>}
                            <ul className="space-y-1 pl-4 list-disc text-xs text-slate-700 dark:text-slate-300">
                              {sec.items?.map((item: string, i: number) => (
                                <li key={i} className="leading-relaxed">{item}</li>
                              ))}
                            </ul>
                          </div>
                        );
                      }
                      return (
                        <p key={idx} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {sec.text}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900/80 border border-sky-100 dark:border-sky-900/60 whitespace-pre-wrap text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                    {currentPage?.content_text}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Raw Text Editor */}
            {activeTab === 'RAW_EDIT' && (
              <div className="space-y-3 min-h-[420px]">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    Modify extracted text to fix typos or adjust educational notes for page {activePageIndex + 1}:
                  </p>
                  {saveSuccess && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <Check className="w-3.5 h-3.5" />
                      Changes Saved!
                    </span>
                  )}
                </div>

                <textarea
                  rows={16}
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full p-4 rounded-xl text-xs font-mono bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={savingPage}
                    onClick={handleSavePageContent}
                    className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-blue-600/20 disabled:opacity-50"
                  >
                    {savingPage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Page...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Page Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {isApproveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="azure-card rounded-2xl max-w-md w-full p-6 border border-emerald-300 dark:border-emerald-800 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white text-center mb-1">
              Approve Curriculum Document?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 text-center mb-4">
              Approving <span className="font-bold text-slate-900 dark:text-white">"{document.title}"</span> will immediately publish this material to students enrolled in {document.subject_name}.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Approval Note <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Approved for Term 1 midterm exam prep"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsApproveOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={() => handleReviewSubmit('APPROVED')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/25 cursor-pointer disabled:opacity-50"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Approval</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {isRejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="azure-card rounded-2xl max-w-md w-full p-6 border border-rose-300 dark:border-rose-900 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3 font-bold">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white text-center mb-1">
              Reject Document?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 text-center mb-4">
              Rejected documents will remain hidden from students. Please provide a reason for the rejection:
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Rejection Feedback *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Scanned text missing formulas on pages 3-5, needs clearer scan."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRejectOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingReview || !reviewComment.trim()}
                onClick={() => handleReviewSubmit('REJECTED')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/25 cursor-pointer disabled:opacity-50"
              >
                {submittingReview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Confirm Rejection</span>
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
