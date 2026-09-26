import React, { useState, useEffect, useRef } from 'react';
import { studyWorkspaceService, askTeacherService } from '../../api/services';
import type { TextHighlight, TextComment, ContextualAIAskResponse } from '../../types';
import { 
  Sparkles, 
  MessageSquare, 
  Highlighter, 
  X, 
  Loader2, 
  Trash2, 
  Edit2, 
  Check,
  UserCheck,
  Send,
  Bot,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InteractiveStudyWorkspaceProps {
  subjectId: string;
  chapterId?: string;
  moduleId?: string;
  chapterTitle?: string;
  subjectName?: string;
  children: React.ReactNode;
}

interface ChatMessage {
  id: string;
  sender: 'student' | 'ai';
  text: string;
  selectedTextSnippet?: string;
  citations?: string[];
  isError?: boolean;
  timestamp: string;
}

export const InteractiveStudyWorkspace: React.FC<InteractiveStudyWorkspaceProps> = ({
  subjectId,
  chapterId,
  moduleId,
  chapterTitle = 'Lesson',
  subjectName = 'Course',
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Selection & Toolbar state
  const [selectedText, setSelectedText] = useState('');
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number } | null>(null);

  // Saved workspace items
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const [comments, setComments] = useState<TextComment[]>([]);

  // Active Modals & Panels
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentInput, setCommentInput] = useState('');

  // AI Tutor Drawer/Panel state
  const [isAITutorOpen, setIsAITutorOpen] = useState(true);
  const [customAIInput, setCustomAIInput] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  // AI Conversation History
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: `Hello! I am your persistent AI Tutor for ${chapterTitle}. Ask me anything about this lesson.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Quick Action Chips handler (works with or without text selection)
  const handleQuickChipAction = (mode: 'explain' | 'example' | 'steps' | 'importance') => {
    const activeSnippet = selectedText;
    const modePrompts: Record<string, string> = {
      explain: activeSnippet ? `Explain this text simply: "${activeSnippet.slice(0, 45)}..."` : `Explain the key concepts of ${chapterTitle} simply.`,
      example: activeSnippet ? `Give a practical example for: "${activeSnippet.slice(0, 45)}..."` : `Give practical real-world examples for ${chapterTitle}.`,
      steps: activeSnippet ? `Break this down step-by-step: "${activeSnippet.slice(0, 45)}..."` : `Break down ${chapterTitle} step-by-step.`,
      importance: activeSnippet ? `Why is this concept important? "${activeSnippet.slice(0, 45)}..."` : `Why is ${chapterTitle} important in real life?`
    };
    handleExecuteAskAI(modePrompts[mode], mode, activeSnippet || undefined);
  };

  // Ask Teacher Modal
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherQuestionInput, setTeacherQuestionInput] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [teacherSuccess, setTeacherSuccess] = useState(false);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentInput, setEditCommentInput] = useState('');

  useEffect(() => {
    if (!subjectId) return;
    const fetchWorkspaceData = async () => {
      try {
        const [hlData, cmData] = await Promise.all([
          studyWorkspaceService.getHighlights({ subject_id: subjectId, chapter_id: chapterId, module_id: moduleId }).catch(() => []),
          studyWorkspaceService.getComments({ subject_id: subjectId, chapter_id: chapterId, module_id: moduleId }).catch(() => [])
        ]);
        setHighlights(hlData);
        setComments(cmData);
      } catch (err) {
        console.error("Failed to load study workspace data:", err);
      }
    };

    fetchWorkspaceData();
  }, [subjectId, chapterId, moduleId]);

  // Scroll chat to bottom when messages update
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, loadingAI]);

  // Handle Text Selection Scope Validation
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const anchorNode = sel.anchorNode;
    const focusNode = sel.focusNode;

    // Strict Selection Scope check: must be inside .lesson-reading-area
    const isInsideLessonArea = (node: Node | null) => {
      let curr: Node | null = node;
      while (curr) {
        if (curr instanceof HTMLElement) {
          if (curr.classList.contains('lesson-reading-area')) return true;
          // Exclude AI Tutor panel, form inputs, buttons, comments
          if (curr.classList.contains('ai-tutor-panel') || 
              curr.classList.contains('notebook-editor-area') || 
              curr.tagName === 'INPUT' || 
              curr.tagName === 'TEXTAREA' || 
              curr.tagName === 'BUTTON') {
            return false;
          }
        }
        curr = curr.parentNode;
      }
      return false;
    };

    if (!isInsideLessonArea(anchorNode) || !isInsideLessonArea(focusNode)) {
      return;
    }

    const text = sel.toString().trim();
    if (text.length > 2) {
      setSelectedText(text);
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };

      setToolbarPos({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 48
      });
    }
  };

  const clearSelection = () => {
    setSelectedText('');
    setToolbarPos(null);
    setShowColorPicker(false);
  };

  // 1. Create Highlight
  const handleSaveHighlight = async (color: 'yellow' | 'blue' | 'green') => {
    if (!selectedText || !subjectId) return;
    try {
      const hl = await studyWorkspaceService.createHighlight({
        subject_id: subjectId,
        chapter_id: chapterId,
        module_id: moduleId,
        selected_text: selectedText,
        color
      });
      setHighlights(prev => [hl, ...prev]);
    } catch (err) {
      console.error("Failed to save highlight:", err);
    } finally {
      clearSelection();
    }
  };

  const handleDeleteHighlight = async (id: string) => {
    try {
      await studyWorkspaceService.deleteHighlight(id);
      setHighlights(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.error("Failed to delete highlight:", err);
    }
  };

  // 2. Add Comment
  const handleSaveComment = async () => {
    if (!selectedText || !commentInput.trim() || !subjectId) return;
    try {
      const cm = await studyWorkspaceService.createComment({
        subject_id: subjectId,
        chapter_id: chapterId,
        module_id: moduleId,
        selected_text: selectedText,
        comment_text: commentInput.trim()
      });
      setComments(prev => [cm, ...prev]);
      setShowCommentModal(false);
      setCommentInput('');
    } catch (err) {
      console.error("Failed to save comment:", err);
    } finally {
      clearSelection();
    }
  };

  const handleUpdateComment = async (id: string) => {
    if (!editCommentInput.trim()) return;
    try {
      const updated = await studyWorkspaceService.updateComment(id, { comment_text: editCommentInput.trim() });
      setComments(prev => prev.map(c => (c.id === id ? updated : c)));
      setEditingCommentId(null);
    } catch (err) {
      console.error("Failed to update comment:", err);
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      await studyWorkspaceService.deleteComment(id);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  // 3. Ask AI (from selection or custom prompt)
  const handleExecuteAskAI = async (
    promptText: string, 
    mode: 'explain' | 'example' | 'steps' | 'importance' | 'custom' = 'explain',
    snippetToUse?: string
  ) => {
    if (!subjectId) return;

    const targetSnippet = snippetToUse || selectedText;
    const userMsg: ChatMessage = {
      id: strUuid(),
      sender: 'student',
      text: promptText,
      selectedTextSnippet: targetSnippet || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setIsAITutorOpen(true);
    setLoadingAI(true);
    clearSelection();

    try {
      const res: ContextualAIAskResponse = await studyWorkspaceService.askAI({
        subject_id: subjectId,
        chapter_id: chapterId,
        module_id: moduleId,
        selected_text: targetSnippet || promptText,
        mode
      });

      const aiMsg: ChatMessage = {
        id: strUuid(),
        sender: 'ai',
        text: res.explanation || res.answer || "Explanation generated.",
        selectedTextSnippet: targetSnippet || undefined,
        citations: res.citations,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail || "Gemini AI service is unconfigured or unavailable.";
      const errorMsg: ChatMessage = {
        id: strUuid(),
        sender: 'ai',
        text: errorDetail,
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoadingAI(false);
    }
  };

  // Submit custom AI message from input box
  const handleSendCustomAIMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAIInput.trim()) return;
    const textToSend = customAIInput.trim();
    setCustomAIInput('');
    handleExecuteAskAI(textToSend, 'custom');
  };

  // 4. Ask Teacher
  const handleOpenAskTeacher = () => {
    setShowTeacherModal(true);
    setTeacherSuccess(false);
  };

  const handleSubmitTeacherQuestion = async () => {
    if (!selectedText || !teacherQuestionInput.trim() || !subjectId) return;
    setSubmittingQuestion(true);
    try {
      await askTeacherService.submitQuestion({
        subject_id: subjectId,
        chapter_id: chapterId,
        module_id: moduleId,
        selected_text: selectedText,
        question: teacherQuestionInput.trim()
      });
      setTeacherSuccess(true);
      setTimeout(() => {
        setShowTeacherModal(false);
        setTeacherQuestionInput('');
        clearSelection();
      }, 1500);
    } catch (err) {
      console.error("Failed to submit question to teacher:", err);
    } finally {
      setSubmittingQuestion(false);
    }
  };

  return (
    <div ref={containerRef} onMouseUp={handleMouseUp} className="relative transition-all">
      {/* 3-Part Study Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (68% width on desktop): Lesson Content + Bottom Notes */}
        <div className={`transition-all duration-300 ${isAITutorOpen ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          
          {/* Header Toggle for AI Tutor when collapsed */}
          {!isAITutorOpen && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsAITutorOpen(true)}
                className="px-4 py-2 bg-indigo-900 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 hover:bg-indigo-950 cursor-pointer"
              >
                <PanelRightOpen className="w-4 h-4 text-sky-400" />
                <span>Open AI Tutor</span>
              </button>
            </div>
          )}

          {/* Lesson Content wrapped in lesson-reading-area class */}
          <div className="lesson-reading-area space-y-6">
            {children}
          </div>

          {/* Saved Highlights Summary */}
          {highlights.length > 0 && (
            <div className="mt-6 p-4 rounded-2xl bg-amber-50/70 dark:bg-slate-900/80 border border-amber-200 dark:border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider block">
                Saved Lesson Highlights ({highlights.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {highlights.map(hl => (
                  <div 
                    key={hl.id} 
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border ${
                      hl.color === 'yellow' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                      hl.color === 'blue' ? 'bg-sky-100 text-sky-900 border-sky-300' :
                      'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}
                  >
                    <span className="italic">"{hl.selected_text.slice(0, 35)}..."</span>
                    <button 
                      onClick={() => handleDeleteHighlight(hl.id)}
                      className="text-stone-500 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saved Comments List */}
          {comments.length > 0 && (
            <div className="mt-4 p-4 rounded-2xl bg-[#faf8f5] dark:bg-slate-900/80 border border-stone-200 dark:border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-stone-700 dark:text-slate-300 uppercase tracking-wider block">
                Inline Lesson Comments ({comments.length})
              </span>
              <div className="space-y-2">
                {comments.map(cm => (
                  <div key={cm.id} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span className="italic font-mono text-indigo-700 dark:text-sky-400">"{cm.selected_text}"</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditingCommentId(cm.id); setEditCommentInput(cm.comment_text); }} className="p-1 text-stone-400 hover:text-indigo-600"><Edit2 className="w-3 h-3" /></button>
                        <button onClick={() => handleDeleteComment(cm.id)} className="p-1 text-stone-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    {editingCommentId === cm.id ? (
                      <div className="flex items-center gap-2 pt-1">
                        <input type="text" value={editCommentInput} onChange={(e) => setEditCommentInput(e.target.value)} className="w-full px-2 py-1 text-xs border rounded-md" />
                        <button onClick={() => handleUpdateComment(cm.id)} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">Save</button>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-stone-900 dark:text-white">{cm.comment_text}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (32% width on desktop): Persistent AI Tutor Panel */}
        {isAITutorOpen && (
          <aside className="lg:col-span-4 ai-tutor-panel sticky top-20 bg-[#faf9f6] dark:bg-slate-900 rounded-3xl border border-indigo-200/80 dark:border-slate-800 shadow-md flex flex-col min-h-[580px] max-h-[82vh]">
            
            {/* AI Tutor Panel Header */}
            <div className="p-4 border-b border-stone-200/80 dark:border-slate-800 flex items-center justify-between bg-stone-900 text-white rounded-t-3xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">AI Tutor</h3>
                  <span className="text-[10px] text-sky-300 font-medium block truncate max-w-[180px]">
                    {subjectName} • {chapterTitle}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsAITutorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                title="Collapse AI Tutor"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Conversation History Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col space-y-1 ${
                    msg.sender === 'student' ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Selected Text Snippet Card inside AI Chat */}
                  {msg.selectedTextSnippet && (
                    <div className="max-w-[85%] p-2 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-900/60 text-[11px] font-mono text-indigo-950 dark:text-sky-300 italic mb-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider block text-indigo-700 dark:text-sky-400 not-italic mb-0.5">Lesson Reference:</span>
                      "{msg.selectedTextSnippet}"
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] p-3.5 rounded-2xl font-medium leading-relaxed ${
                      msg.sender === 'student'
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : msg.isError
                        ? 'bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 rounded-tl-xs'
                        : 'bg-white dark:bg-slate-800 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-slate-700 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-stone-200 dark:border-slate-700 text-[10px] text-stone-500 dark:text-slate-400 font-sans">
                        <span className="font-bold">Citations:</span> {msg.citations.join(', ')}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400 dark:text-slate-500 font-mono px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {loadingAI && (
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 dark:text-sky-400 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-slate-700 max-w-[80%]">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Synthesizing contextual AI explanation...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Persistent Quick Action Chips */}
            <div className="p-3 bg-indigo-50/80 dark:bg-slate-850 border-t border-stone-200/80 dark:border-slate-800 space-y-2">
              {selectedText ? (
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-950 dark:text-sky-300">
                  <span>Selected Text Action:</span>
                  <button onClick={clearSelection} className="text-stone-400 hover:text-stone-700 cursor-pointer">Clear</button>
                </div>
              ) : (
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 block">
                  Quick AI Actions:
                </span>
              )}

              {selectedText && (
                <p className="text-[11px] font-mono text-stone-800 dark:text-stone-200 truncate italic bg-white dark:bg-slate-800 p-1.5 rounded-md border border-indigo-100 dark:border-slate-700">
                  "{selectedText}"
                </p>
              )}

              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => handleQuickChipAction('explain')} className="p-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-indigo-950 dark:text-sky-300 hover:bg-indigo-100/60 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-2xs">Explain simply</button>
                <button onClick={() => handleQuickChipAction('example')} className="p-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-indigo-950 dark:text-sky-300 hover:bg-indigo-100/60 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-2xs">Give example</button>
                <button onClick={() => handleQuickChipAction('steps')} className="p-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-indigo-950 dark:text-sky-300 hover:bg-indigo-100/60 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-2xs">Step-by-step</button>
                <button onClick={() => handleQuickChipAction('importance')} className="p-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 rounded-xl text-[11px] font-bold text-indigo-950 dark:text-sky-300 hover:bg-indigo-100/60 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-2xs">Why important?</button>
              </div>
            </div>

            {/* Custom Question Input Box */}
            <form onSubmit={handleSendCustomAIMessage} className="p-3 border-t border-stone-200/80 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900 rounded-b-3xl">
              <input
                type="text"
                value={customAIInput}
                onChange={(e) => setCustomAIInput(e.target.value)}
                placeholder="Ask something about this lesson..."
                className="flex-1 px-3.5 py-2 bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-medium text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/25"
              />
              <button
                type="submit"
                disabled={!customAIInput.trim() || loadingAI}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-40 cursor-pointer transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </aside>
        )}
      </div>

      {/* Floating Text Selection Toolbar (Emoji Free) */}
      <AnimatePresence>
        {toolbarPos && selectedText && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            style={{
              position: 'absolute',
              left: `${Math.max(120, Math.min(toolbarPos.x, 500))}px`,
              top: `${Math.max(10, toolbarPos.y)}px`,
              transform: 'translateX(-50%)'
            }}
            className="z-40 flex items-center gap-1 p-1.5 rounded-2xl bg-stone-900 text-white border border-stone-700 shadow-2xl backdrop-blur-md text-xs font-bold"
          >
            {/* 1. Highlight */}
            {!showColorPicker ? (
              <button
                onClick={() => setShowColorPicker(true)}
                className="px-3 py-1.5 rounded-xl hover:bg-stone-800 text-amber-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span>Highlight</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-2">
                <button onClick={() => handleSaveHighlight('yellow')} className="w-5 h-5 rounded-full bg-yellow-400 hover:scale-110 border border-white cursor-pointer" title="Yellow" />
                <button onClick={() => handleSaveHighlight('blue')} className="w-5 h-5 rounded-full bg-sky-400 hover:scale-110 border border-white cursor-pointer" title="Blue" />
                <button onClick={() => handleSaveHighlight('green')} className="w-5 h-5 rounded-full bg-emerald-400 hover:scale-110 border border-white cursor-pointer" title="Green" />
              </div>
            )}

            <div className="w-px h-4 bg-stone-700" />

            {/* 2. Add Comment */}
            <button
              onClick={() => setShowCommentModal(true)}
              className="px-3 py-1.5 rounded-xl hover:bg-stone-800 text-sky-300 flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Add Comment</span>
            </button>

            <div className="w-px h-4 bg-stone-700" />

            {/* 3. Ask AI */}
            <button
              onClick={() => handleExecuteAskAI(`Explain this text: "${selectedText.slice(0, 50)}..."`, 'explain', selectedText)}
              className="px-3 py-1.5 rounded-xl hover:bg-stone-800 text-indigo-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </button>

            <div className="w-px h-4 bg-stone-700" />

            {/* 4. Ask Teacher */}
            <button
              onClick={handleOpenAskTeacher}
              className="px-3 py-1.5 rounded-xl hover:bg-stone-800 text-emerald-300 flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Ask Teacher</span>
            </button>

            <button onClick={clearSelection} className="p-1 text-stone-400 hover:text-white rounded-lg">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Comment Popover Modal */}
      <AnimatePresence>
        {showCommentModal && (
          <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-stone-200 dark:border-slate-800 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-sky-600" />
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">Add Inline Comment</h3>
                </div>
                <button onClick={() => setShowCommentModal(false)} className="p-1 text-stone-400 hover:text-stone-700"><X className="w-4 h-4" /></button>
              </div>

              <div className="p-2.5 bg-stone-50 dark:bg-slate-800 rounded-xl text-xs font-mono text-indigo-700 dark:text-sky-300">
                "{selectedText}"
              </div>

              <textarea
                rows={3}
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Type your personal note or clarification on this text..."
                className="w-full p-3 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-medium text-stone-900 dark:text-white focus:outline-hidden"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowCommentModal(false)} className="px-3 py-1.5 text-xs font-bold text-stone-600">Cancel</button>
                <button onClick={handleSaveComment} className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">Save Comment</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ask Teacher Question Modal */}
      <AnimatePresence>
        {showTeacherModal && (
          <div className="fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-stone-200 dark:border-slate-800 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white">Ask Teacher Question</h3>
                </div>
                <button onClick={() => setShowTeacherModal(false)} className="p-1 text-stone-400 hover:text-stone-700"><X className="w-4 h-4" /></button>
              </div>

              {teacherSuccess ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold text-center space-y-1">
                  <Check className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p>Question submitted! Your teacher will review and reply in your Q&A inbox.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-stone-50 dark:bg-slate-800 rounded-xl text-xs font-mono text-stone-800 dark:text-stone-200">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Snippet:</span>
                    "{selectedText}"
                  </div>

                  <textarea
                    rows={4}
                    value={teacherQuestionInput}
                    onChange={(e) => setTeacherQuestionInput(e.target.value)}
                    placeholder="Describe your question or difficulty regarding this lesson section..."
                    className="w-full p-3 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl text-xs font-medium text-stone-900 dark:text-white focus:outline-hidden"
                  />

                  <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setShowTeacherModal(false)} className="px-3 py-1.5 text-xs font-bold text-stone-600">Cancel</button>
                    <button
                      onClick={handleSubmitTeacherQuestion}
                      disabled={submittingQuestion || !teacherQuestionInput.trim()}
                      className="px-4 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                    >
                      {submittingQuestion ? 'Submitting...' : 'Submit Question'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

function strUuid() {
  return Math.random().toString(36).substring(2, 9);
}
