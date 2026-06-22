import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Lock,
  Unlock,
  Save,
  History,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Info,
  User,
  Clock,
  Edit3,
  BookOpen,
  Volume2,
  X,
  Play,
  Square,
  ChevronDown,
  Layers,
  PenLine,
  GitBranch,
  ChevronRight,
  Wrench,
  ChevronUp,
  Sparkles,
  UserCircle,
  CalendarDays,
  MapPin,
  Sparkles as SparklesIcon,
  ScrollText,
  Filter,
} from 'lucide-react';
import type { ConflictCategory } from '@shared/types';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { speak, stopSpeak, isSpeaking } from '@/lib/tts';
import type { ConflictWarning, Character, ChapterBranch } from '@shared/types';
import ChapterOutline from '@/components/ChapterOutline';

export default function ChapterEditor() {
  const { projectId, chapterId } = useParams<{ projectId: string; chapterId: string }>();
  const navigate = useNavigate();
  const {
    chapters,
    currentChapter,
    setCurrentChapter,
    updateChapterContent,
    updateChapterTitle,
    lockChapter,
    unlockChapter,
    createChapter,
    createVersion,
    checkConflicts,
    resolveConflict,
    applyFixSuggestion,
    checkAndReleaseExpiredLocks,
    getCharactersForChapter,
    getPlotPointsForChapter,
    characters,
    currentUser,
    isLoading,
    getChapterBranches,
    getMainBranch,
    getCurrentBranch,
    setCurrentBranch,
    loadChapterBranches,
    createBranchVersion,
    currentBranchId,
  } = useAppStore();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versionSummary, setVersionSummary] = useState('');
  const [conflicts, setConflicts] = useState<ConflictWarning[]>([]);
  const [showNewChapterModal, setShowNewChapterModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [expandedConflictId, setExpandedConflictId] = useState<string | null>(null);
  const [conflictFilter, setConflictFilter] = useState<ConflictCategory | 'all'>('all');
  const [applyingFix, setApplyingFix] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'info' | 'conflicts'>('info');
  const lockCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [selectedText, setSelectedText] = useState('');
  const [showSpeakToolbar, setShowSpeakToolbar] = useState(false);
  const [speakToolbarPos, setSpeakToolbarPos] = useState({ top: 0, left: 0 });
  const [isCurrentlySpeaking, setIsCurrentlySpeaking] = useState(false);
  const [showCharacterDropdown, setShowCharacterDropdown] = useState(false);
  const [speakingCharacterName, setSpeakingCharacterName] = useState<string>('');
  const [editorMode, setEditorMode] = useState<'writing' | 'outline'>('writing');
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const branchSelectorRef = useRef<HTMLDivElement>(null);

  const projectCharacters = characters.filter(c => c.projectId === projectId);
  const projectChapters = chapters.filter(c => c.projectId === projectId);
  const branches = chapterId ? getChapterBranches(chapterId) : [];
  const mainBranch = chapterId ? getMainBranch(chapterId) : null;
  const currentBranch = getCurrentBranch();

  useEffect(() => {
    if (chapterId) {
      setCurrentChapter(chapterId);
      loadChapterBranches(chapterId);
    } else {
      setCurrentChapter(null);
    }
  }, [chapterId, setCurrentChapter, loadChapterBranches]);

  useEffect(() => {
    if (chapterId && !currentBranchId && mainBranch?.id) {
      setCurrentBranch(mainBranch.id);
      setContent(mainBranch.currentContent);
    }
  }, [chapterId, currentBranchId, mainBranch?.id, mainBranch?.currentContent, setCurrentBranch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchSelectorRef.current && !branchSelectorRef.current.contains(e.target as Node)) {
        setShowBranchSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentChapter) {
      setContent(currentChapter.content);
      setTitle(currentChapter.title);
      setIsLockedByMe(currentChapter.lock?.userId === currentUser.id);
      setLastSaved(null);
      if (currentChapter.id) {
        checkConflicts(currentChapter.id).then(setConflicts);
      }
    }
  }, [currentChapter, currentUser.id, checkConflicts]);

  useEffect(() => {
    lockCheckIntervalRef.current = setInterval(() => {
      checkAndReleaseExpiredLocks();
      if (currentChapter) {
        const updatedChapter = useAppStore.getState().chapters.find(c => c.id === currentChapter.id);
        if (updatedChapter) {
          if (!updatedChapter.lock && isLockedByMe) {
            setIsLockedByMe(false);
          }
          if (updatedChapter.lock?.userId === currentUser.id && !isLockedByMe) {
            setIsLockedByMe(true);
          }
        }
      }
    }, 10000);

    return () => {
      if (lockCheckIntervalRef.current) {
        clearInterval(lockCheckIntervalRef.current);
      }
    };
  }, [currentChapter, isLockedByMe, currentUser.id, checkAndReleaseExpiredLocks]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSpeaking()) {
        setIsCurrentlySpeaking(false);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleTextSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end);

    if (text.trim().length > 0) {
      setSelectedText(text);

      const rect = textarea.getBoundingClientRect();
      const linesBefore = textarea.value.substring(0, start).split('\n').length;
      const lineHeight = 32;
      const scrollTop = textarea.scrollTop;

      setSpeakToolbarPos({
        top: rect.top + Math.min(linesBefore * lineHeight - scrollTop, rect.height - 100) + window.scrollY - 60,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
      setShowSpeakToolbar(true);
    } else {
      setShowSpeakToolbar(false);
      setSelectedText('');
      setShowCharacterDropdown(false);
    }
  }, []);

  const handleSpeakWithCharacter = async (character: Character) => {
    if (!selectedText.trim()) return;

    if (isCurrentlySpeaking) {
      stopSpeak();
      setIsCurrentlySpeaking(false);
      return;
    }

    setShowCharacterDropdown(false);
    setIsCurrentlySpeaking(true);
    setSpeakingCharacterName(character.name);

    await speak({
      text: selectedText,
      pitch: character.voiceSettings?.pitch ?? 1.0,
      rate: character.voiceSettings?.rate ?? 1.0,
      voiceURI: character.voiceSettings?.voiceURI,
      lang: character.voiceSettings?.lang || 'zh-CN',
      onEnd: () => {
        setIsCurrentlySpeaking(false);
        setSpeakingCharacterName('');
      },
      onError: () => {
        setIsCurrentlySpeaking(false);
        setSpeakingCharacterName('');
      },
    });
  };

  const handleStopSpeaking = () => {
    stopSpeak();
    setIsCurrentlySpeaking(false);
    setSpeakingCharacterName('');
  };

  const handleContentChange = useCallback(async (newContent: string) => {
    setContent(newContent);
    
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    
    autoSaveTimerRef.current = setTimeout(async () => {
      if (currentChapter && isLockedByMe) {
        await updateChapterContent(currentChapter.id, newContent);
        setLastSaved(new Date());
        if (currentChapter.id) {
          const newConflicts = await checkConflicts(currentChapter.id);
          setConflicts(newConflicts);
        }
      }
    }, 2000);
  }, [currentChapter, isLockedByMe, updateChapterContent, checkConflicts]);

  const handleLock = async () => {
    if (!currentChapter) return;
    const success = await lockChapter(currentChapter.id);
    if (success) {
      setIsLockedByMe(true);
    }
  };

  const handleUnlock = async () => {
    if (!currentChapter) return;
    await unlockChapter(currentChapter.id);
    setIsLockedByMe(false);
  };

  const handleSaveVersion = async () => {
    if (!currentBranchId || !versionSummary.trim()) return;
    await createBranchVersion(currentBranchId, content, versionSummary);
    setVersionSummary('');
    setShowVersionModal(false);
    setLastSaved(new Date());
  };

  const handleSwitchBranch = (branch: ChapterBranch) => {
    setCurrentBranch(branch.id);
    setContent(branch.currentContent);
    setShowBranchSelector(false);
  };

  const CATEGORY_CONFIG: Record<ConflictCategory | 'all', { label: string; icon: any; color: string }> = {
    all: { label: '全部', icon: Filter, color: 'bg-ink-500' },
    foreshadow: { label: '伏笔线索', icon: ScrollText, color: 'bg-purple-500' },
    character_trait: { label: '人物属性', icon: UserCircle, color: 'bg-indigo-500' },
    character_personality: { label: '人物性格', icon: SparklesIcon, color: 'bg-pink-500' },
    timeline: { label: '时间线', icon: CalendarDays, color: 'bg-teal-500' },
    geography: { label: '地理场景', icon: MapPin, color: 'bg-green-600' },
    custom_rule: { label: '自定义规则', icon: Wrench, color: 'bg-amber-500' },
    character_appearance: { label: '人物出场', icon: User, color: 'bg-blue-500' },
  };

  const handleApplyFix = async (conflictId: string, suggestionId: string) => {
    setApplyingFix(`${conflictId}-${suggestionId}`);
    try {
      const result = await applyFixSuggestion(conflictId, suggestionId);
      if (result.success && result.updatedChapter) {
        setContent(result.updatedChapter.content);
      }
      const updated = await checkConflicts(currentChapter?.id || '');
      setConflicts(updated);
      setExpandedConflictId(null);
    } finally {
      setApplyingFix(null);
    }
  };

  const toggleConflictExpand = (id: string) => {
    setExpandedConflictId(prev => prev === id ? null : id);
  };

  const unresolvedConflicts = conflicts.filter(c => !c.resolved);
  const filteredUnresolvedConflicts = unresolvedConflicts.filter(
    c => conflictFilter === 'all' || c.category === conflictFilter
  );

  const handleCreateChapter = async () => {
    if (!newChapterTitle.trim() || !projectId) return;
    const newChapter = await createChapter(projectId, newChapterTitle);
    setShowNewChapterModal(false);
    setNewChapterTitle('');
    navigate(`/projects/${projectId}/chapters/${newChapter.id}`);
  };

  const handleWordCount = (text: string) => {
    return text.replace(/\s/g, '').length;
  };

  useEffect(() => {
    return () => {
      stopSpeak();
    };
  }, []);

  const relatedCharacters = currentChapter ? getCharactersForChapter(currentChapter.id) : [];
  const relatedPlotPoints = currentChapter ? getPlotPointsForChapter(currentChapter.id) : [];

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 relative">
      <div className="w-64 flex-shrink-0">
        <div className="card p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-ink-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold-500" />
              章节目录
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
            {projectChapters.map((chapter, index) => {
              const isActive = currentChapter?.id === chapter.id;
              const isLocked = !!chapter.lock;
              const isLockedByOther = isLocked && chapter.lock?.userId !== currentUser.id;

              return (
                <Link
                  key={chapter.id}
                  to={`/projects/${projectId}/chapters/${chapter.id}`}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg transition-all group',
                    isActive
                      ? 'bg-ink-800 text-white'
                      : isLockedByOther
                        ? 'bg-brick-50 text-brick-700 cursor-not-allowed opacity-75'
                        : 'hover:bg-paper-200 text-ink-700'
                  )}
                >
                  <span className={cn(
                    'w-6 h-6 rounded flex items-center justify-center text-sm font-serif',
                    isActive ? 'bg-ink-700' : 'bg-paper-200 text-ink-500'
                  )}>
                    {index + 1}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium">
                    {chapter.title}
                  </span>
                  {isLocked && (
                    <span
                      title={isLockedByOther ? `被 ${chapter.lock?.user.username} 锁定` : '已被您锁定'}
                    >
                      <Lock
                        className={cn(
                          'w-4 h-4',
                          isActive ? 'text-gold-400' : 'text-brick-500'
                        )}
                      />
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
          <button
            onClick={() => setShowNewChapterModal(true)}
            className="mt-4 btn-secondary w-full flex items-center justify-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            新建章节
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {currentChapter ? (
          <>
            <div className="card p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => updateChapterTitle(currentChapter.id, title)}
                    className={cn(
                      'font-serif text-2xl font-bold bg-transparent border-none outline-none w-full',
                      isLockedByMe
                        ? 'text-ink-800 focus:ring-2 focus:ring-gold-200 rounded px-2'
                        : 'text-ink-500 cursor-not-allowed'
                    )}
                    disabled={!isLockedByMe}
                  />
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-sm text-ink-400 flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {handleWordCount(content).toLocaleString()} 字
                  </div>
                  {lastSaved && (
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      已自动保存
                    </div>
                  )}
                  {isLockedByMe ? (
                    <>
                      <button
                        onClick={() => setShowVersionModal(true)}
                        className="btn-secondary flex items-center gap-2 text-sm"
                      >
                        <Save className="w-4 h-4" />
                        保存版本
                      </button>
                      <Link
                        to={`/projects/${projectId}/chapters/${currentChapter.id}/history`}
                        className="btn-secondary flex items-center gap-2 text-sm"
                      >
                        <History className="w-4 h-4" />
                        历史版本
                      </Link>
                      <button
                        onClick={handleUnlock}
                        className="btn-secondary flex items-center gap-2 text-sm"
                      >
                        <Unlock className="w-4 h-4" />
                        解锁
                      </button>
                    </>
                  ) : currentChapter.lock ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-brick-50 rounded-lg border border-brick-200">
                      <Lock className="w-4 h-4 text-brick-500" />
                      <div className="text-sm">
                        <div className="text-brick-700 font-medium">
                          被 {currentChapter.lock.user.username} 锁定
                        </div>
                        <div className="text-brick-500 text-xs">
                          {currentChapter.lock.expiresAt && `将在 ${new Date(currentChapter.lock.expiresAt).toLocaleTimeString()} 过期`}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleLock}
                      className="btn-gold flex items-center gap-2 text-sm"
                      disabled={isLoading}
                    >
                      <Lock className="w-4 h-4" />
                      {isLoading ? '锁定中...' : '锁定并编辑'}
                    </button>
                  )}
                </div>
              </div>

              {currentBranch && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-paper-200">
                  <div className="relative" ref={branchSelectorRef}>
                    <button
                      onClick={() => setShowBranchSelector(!showBranchSelector)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-paper-100 hover:bg-paper-200 rounded-lg transition-colors"
                    >
                      <GitBranch className="w-4 h-4 text-ink-500" />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: currentBranch.color }}
                      />
                      <span className="text-sm font-medium text-ink-700">
                        {currentBranch.name}
                      </span>
                      {currentBranch.isMain && (
                        <span className="text-xs px-1.5 py-0.5 bg-gold-100 text-gold-700 rounded">
                          主线
                        </span>
                      )}
                      <ChevronDown className="w-4 h-4 text-ink-400" />
                    </button>

                    {showBranchSelector && (
                      <div className="absolute top-full left-0 mt-2 w-72 card shadow-ink-lg z-50 animate-slide-in-right overflow-hidden">
                        <div className="p-2 border-b border-paper-200">
                          <div className="text-xs text-ink-400 uppercase tracking-wider px-2 py-1">
                            选择分支
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto scrollbar-thin p-2 space-y-1">
                          {branches.map((branch) => {
                            const isActive = branch.id === currentBranchId;
                            return (
                              <button
                                key={branch.id}
                                onClick={() => handleSwitchBranch(branch)}
                                className={cn(
                                  'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                                  isActive
                                    ? 'bg-gold-50 border border-gold-200'
                                    : 'hover:bg-paper-100'
                                )}
                              >
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: branch.color }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-ink-800 truncate">
                                      {branch.name}
                                    </span>
                                    {branch.isMain && (
                                      <span className="text-xs px-1.5 py-0.5 bg-gold-100 text-gold-700 rounded flex-shrink-0">
                                        主线
                                      </span>
                                    )}
                                    {branch.status === 'merged' && (
                                      <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded flex-shrink-0">
                                        已合并
                                      </span>
                                    )}
                                  </div>
                                  {branch.description && (
                                    <p className="text-xs text-ink-500 truncate mt-0.5">
                                      {branch.description}
                                    </p>
                                  )}
                                  <div className="text-xs text-ink-400 mt-1">
                                    {branch.wordCount.toLocaleString()} 字 · {branch.creator?.username}
                                  </div>
                                </div>
                                {isActive && (
                                  <ChevronRight className="w-4 h-4 text-gold-500 flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <div className="p-2 border-t border-paper-200">
                          <Link
                            to={`/projects/${projectId}/chapters/${currentChapter.id}/history`}
                            onClick={() => setShowBranchSelector(false)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-ink-600 hover:text-ink-800 hover:bg-paper-100 rounded-lg transition-colors"
                          >
                            <GitBranch className="w-4 h-4" />
                            管理分支
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-sm text-ink-400">
                    {currentBranch.description || '当前分支'}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4 pt-4 border-t border-paper-200">
                <button
                  onClick={() => setEditorMode('writing')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    editorMode === 'writing'
                      ? 'bg-ink-800 text-white shadow-ink'
                      : 'bg-paper-100 text-ink-600 hover:bg-paper-200'
                  )}
                >
                  <PenLine className="w-4 h-4" />
                  内容编辑
                </button>
                <button
                  onClick={() => setEditorMode('outline')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    editorMode === 'outline'
                      ? 'bg-gradient-gold text-ink-900 shadow-gold'
                      : 'bg-paper-100 text-ink-600 hover:bg-paper-200'
                  )}
                >
                  <Layers className="w-4 h-4" />
                  大纲规划
                </button>
              </div>
            </div>

            {editorMode === 'writing' ? (
              <div className="card flex-1 flex flex-col overflow-hidden relative">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    handleContentChange(e.target.value);
                  }}
                  onSelect={handleTextSelection}
                  onKeyUp={handleTextSelection}
                  onMouseUp={handleTextSelection}
                  disabled={!isLockedByMe}
                  placeholder={isLockedByMe ? '开始创作...\n\n小提示：选中文字后可以选择人物进行朗读！' : '章节已被锁定，无法编辑'}
                  className={cn(
                    'flex-1 w-full p-8 resize-none bg-paper-50/50 paper-bg font-serif text-lg leading-8 text-ink-800',
                    'outline-none border-none scrollbar-thin',
                    !isLockedByMe && 'cursor-not-allowed opacity-60',
                    isLockedByMe && 'animate-pulse-gold'
                  )}
                  spellCheck={false}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-hidden">
                <ChapterOutline chapterId={currentChapter.id} projectId={projectId!} />
              </div>
            )}
          </>
        ) : (
          <div className="card flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 text-ink-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-ink-600 mb-2">选择章节</h3>
              <p className="text-ink-400">从左侧目录选择一个章节开始编辑</p>
            </div>
          </div>
        )}
      </div>

      {showSpeakToolbar && selectedText && (
        <div
          className="fixed z-50 animate-slide-in-up"
          style={{
            top: speakToolbarPos.top,
            left: speakToolbarPos.left,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="card shadow-ink-xl p-2 flex items-center gap-2 bg-ink-800 border-ink-700">
            {isCurrentlySpeaking ? (
              <button
                onClick={handleStopSpeaking}
                className="flex items-center gap-2 px-3 py-2 bg-brick-500 hover:bg-brick-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Square className="w-4 h-4" />
                停止 {speakingCharacterName && `(${speakingCharacterName})`}
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowCharacterDropdown(!showCharacterDropdown)}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Play className="w-4 h-4" />
                  选择人物朗读
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showCharacterDropdown && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 card shadow-ink-xl border border-paper-200 max-h-80 overflow-y-auto scrollbar-thin">
                    <div className="p-2">
                      <div className="text-xs text-ink-400 uppercase tracking-wider mb-2 px-2">本章出场人物</div>
                      {relatedCharacters.length > 0 ? (
                        relatedCharacters.map((char) => (
                          <button
                            key={char.id}
                            onClick={() => handleSpeakWithCharacter(char)}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-purple-50 transition-colors text-left"
                          >
                            <img
                              src={char.avatarUrl}
                              alt={char.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-ink-800">{char.name}</div>
                              <div className="text-xs text-ink-400 truncate">
                                {char.voiceSettings ? `音高${char.voiceSettings.pitch.toFixed(2)} · 语速${char.voiceSettings.rate.toFixed(2)}x` : '默认声音'}
                              </div>
                            </div>
                            <Volume2 className="w-4 h-4 text-purple-500" />
                          </button>
                        ))
                      ) : (
                        <div className="text-sm text-ink-400 px-2 py-2">暂无出场人物</div>
                      )}
                      {projectCharacters.length > relatedCharacters.length && (
                        <>
                          <div className="border-t border-paper-200 my-2" />
                          <div className="text-xs text-ink-400 uppercase tracking-wider mb-2 px-2">全部人物</div>
                          {projectCharacters
                            .filter(c => !relatedCharacters.find(r => r.id === c.id))
                            .map((char) => (
                              <button
                                key={char.id}
                                onClick={() => handleSpeakWithCharacter(char)}
                                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-purple-50 transition-colors text-left"
                              >
                                <img
                                  src={char.avatarUrl}
                                  alt={char.name}
                                  className="w-8 h-8 rounded-full opacity-70"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-ink-700">{char.name}</div>
                                  <div className="text-xs text-ink-400 truncate">
                                    {char.voiceSettings ? `音高${char.voiceSettings.pitch.toFixed(2)} · 语速${char.voiceSettings.rate.toFixed(2)}x` : '默认声音'}
                                  </div>
                                </div>
                                <Volume2 className="w-4 h-4 text-purple-400" />
                              </button>
                            ))}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="w-px h-6 bg-ink-600 mx-1" />
            <div className="text-xs text-ink-300 px-2 max-w-[120px] truncate">
              "{selectedText.slice(0, 20)}{selectedText.length > 20 ? '...' : ''}"
            </div>
            <button
              onClick={() => {
                setShowSpeakToolbar(false);
                setSelectedText('');
                setShowCharacterDropdown(false);
                handleStopSpeaking();
              }}
              className="p-1.5 hover:bg-ink-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-ink-400" />
            </button>
          </div>
        </div>
      )}

      {currentChapter && (
        <div className="w-80 flex-shrink-0">
          <div className="card h-full flex flex-col">
            <div className="flex border-b border-paper-200">
              <button
                onClick={() => setSidebarTab('info')}
                className={cn(
                  'flex-1 px-4 py-3 text-sm font-medium transition-colors',
                  sidebarTab === 'info'
                    ? 'text-ink-800 border-b-2 border-gold-500'
                    : 'text-ink-400 hover:text-ink-600'
                )}
              >
                相关信息
              </button>
              <button
                onClick={() => setSidebarTab('conflicts')}
                className={cn(
                  'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
                  sidebarTab === 'conflicts'
                    ? 'text-ink-800 border-b-2 border-gold-500'
                    : 'text-ink-400 hover:text-ink-600'
                )}
              >
                冲突检测
                {unresolvedConflicts.length > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-brick-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unresolvedConflicts.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
              {sidebarTab === 'info' ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-gold-500" />
                      本章出场人物
                    </h3>
                    {relatedCharacters.length > 0 ? (
                      <div className="space-y-2">
                        {relatedCharacters.map((char) => (
                          <div
                            key={char.id}
                            className="flex items-center gap-3 p-2 bg-paper-100 rounded-lg group"
                          >
                            <img
                              src={char.avatarUrl}
                              alt={char.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-ink-700">{char.name}</div>
                              <div className="text-xs text-ink-400 truncate">
                                {char.traits.occupation}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedText(`${char.name}：${char.description.slice(0, 30)}...`);
                                const ta = textareaRef.current;
                                if (ta) {
                                  const rect = ta.getBoundingClientRect();
                                  setSpeakToolbarPos({
                                    top: rect.top + window.scrollY - 60,
                                    left: rect.left + rect.width / 2 + window.scrollX,
                                  });
                                  setShowSpeakToolbar(true);
                                  setTimeout(() => {
                                    setShowCharacterDropdown(true);
                                    handleSpeakWithCharacter(char);
                                  }, 100);
                                }
                              }}
                              className="p-1.5 hover:bg-purple-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                              title="试听此人物声音"
                            >
                              <Volume2 className="w-4 h-4 text-purple-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-ink-400">暂无出场人物</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-gold-500" />
                      关联伏笔
                    </h3>
                    {relatedPlotPoints.length > 0 ? (
                      <div className="space-y-2">
                        {relatedPlotPoints.map((point) => (
                          <div
                            key={point.id}
                            className="p-3 bg-paper-100 rounded-lg"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                'px-2 py-0.5 rounded text-xs font-medium',
                                point.status === 'resolved'
                                  ? 'bg-green-100 text-green-700'
                                  : point.status === 'active'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-ink-100 text-ink-600'
                              )}>
                                {point.status === 'resolved' ? '已回收' : point.status === 'active' ? '进行中' : '待回收'}
                              </span>
                              <span className="text-xs text-gold-600 bg-gold-50 px-2 py-0.5 rounded">
                                {point.type === 'foreshadow' ? '伏笔' : point.type === 'climax' ? '高潮' : point.type === 'turning' ? '转折' : '结局'}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-ink-700">{point.title}</div>
                            <p className="text-xs text-ink-400 mt-1 line-clamp-2">{point.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-ink-400">暂无关联伏笔</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gold-500" />
                      章节信息
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-ink-400">创建时间</span>
                        <span className="text-ink-600">
                          {currentChapter.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-400">最后更新</span>
                        <span className="text-ink-600">
                          {currentChapter.updatedAt.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-400">当前字数</span>
                        <span className="text-ink-600">
                          {handleWordCount(content).toLocaleString()} 字
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {unresolvedConflicts.length > 0 && (
                    <div className="flex flex-wrap gap-2 pb-3 border-b border-paper-200">
                      {(['all', 'foreshadow', 'character_personality', 'character_trait', 'timeline', 'geography', 'custom_rule', 'character_appearance'] as const).map(cat => {
                        const cfg = CATEGORY_CONFIG[cat];
                        const count = cat === 'all'
                          ? unresolvedConflicts.length
                          : unresolvedConflicts.filter(c => c.category === cat).length;
                        if (count === 0 && cat !== 'all') return null;
                        const Icon = cfg.icon;
                        const active = conflictFilter === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setConflictFilter(cat)}
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs flex items-center gap-1 transition-all',
                              active
                                ? `${cfg.color} text-white shadow-sm`
                                : 'bg-paper-100 text-ink-500 hover:bg-paper-200'
                            )}
                          >
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                            <span className={cn('px-1 rounded-full text-[10px]',
                              active ? 'bg-white/20 text-white' : 'bg-paper-200 text-ink-400'
                            )}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {filteredUnresolvedConflicts.length > 0 ? (
                    filteredUnresolvedConflicts.map((warning) => {
                      const isExpanded = expandedConflictId === warning.id;
                      const categoryCfg = warning.category ? CATEGORY_CONFIG[warning.category] : null;
                      const CatIcon = categoryCfg?.icon || Info;
                      const hasSuggestions = warning.suggestions && warning.suggestions.length > 0;
                      return (
                        <div
                          key={warning.id}
                          className={cn(
                            'rounded-xl border overflow-hidden',
                            warning.severity === 'error'
                              ? 'bg-brick-50 border-brick-200'
                              : warning.severity === 'warning'
                                ? 'bg-amber-50 border-amber-200'
                                : 'bg-blue-50 border-blue-200'
                          )}
                        >
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                                warning.severity === 'error'
                                  ? 'bg-brick-100 text-brick-600'
                                  : warning.severity === 'warning'
                                    ? 'bg-amber-100 text-amber-600'
                                    : 'bg-blue-100 text-blue-600'
                              )}>
                                {warning.severity === 'error' ? (
                                  <AlertTriangle className="w-4 h-4" />
                                ) : warning.severity === 'warning' ? (
                                  <AlertTriangle className="w-4 h-4" />
                                ) : (
                                  <Info className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {categoryCfg && (
                                    <span className={cn(
                                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-white',
                                      categoryCfg.color
                                    )}>
                                      <CatIcon className="w-2.5 h-2.5" />
                                      {categoryCfg.label}
                                    </span>
                                  )}
                                  <span className={cn(
                                    'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium',
                                    warning.severity === 'error'
                                      ? 'bg-brick-200 text-brick-700'
                                      : warning.severity === 'warning'
                                        ? 'bg-amber-200 text-amber-700'
                                        : 'bg-blue-200 text-blue-700'
                                  )}>
                                    {warning.severity === 'error' ? '严重' : warning.severity === 'warning' ? '警告' : '提示'}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-ink-800 mt-1.5">{warning.message}</p>
                                {warning.detailedDescription && !isExpanded && (
                                  <p className="text-xs text-ink-500 mt-1 line-clamp-2">{warning.detailedDescription}</p>
                                )}
                                <div className="flex items-center gap-3 mt-2 text-xs text-ink-400">
                                  {warning.lineNumber && (
                                    <span className="flex items-center gap-1">
                                      <Edit3 className="w-3 h-3" />
                                      第 {warning.lineNumber} 行
                                    </span>
                                  )}
                                  {hasSuggestions && (
                                    <span className="flex items-center gap-1 text-amber-600">
                                      <Sparkles className="w-3 h-3" />
                                      {warning.suggestions!.length} 条修复建议
                                    </span>
                                  )}
                                </div>
                              </div>
                              {(warning.detailedDescription || warning.evidence?.length || hasSuggestions) && (
                                <button
                                  onClick={() => toggleConflictExpand(warning.id)}
                                  className="p-1 rounded hover:bg-white/60 transition-colors flex-shrink-0"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-ink-500" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-ink-500" />
                                  )}
                                </button>
                              )}
                            </div>

                            {isExpanded && (
                              <div className="mt-4 space-y-3 animate-fade-in">
                                {warning.detailedDescription && (
                                  <div className="p-3 bg-white/60 rounded-lg">
                                    <p className="text-xs text-ink-600 leading-relaxed">{warning.detailedDescription}</p>
                                  </div>
                                )}
                                {warning.conflictingText && (
                                  <div className="p-3 bg-white/60 rounded-lg border-l-2 border-amber-400">
                                    <p className="text-[10px] uppercase tracking-wide text-ink-400 mb-1">冲突文本</p>
                                    <p className="text-sm text-ink-700 font-mono bg-paper-50 p-2 rounded">
                                      {warning.conflictingText}
                                    </p>
                                  </div>
                                )}
                                {warning.evidence && warning.evidence.length > 0 && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wide text-ink-400 mb-2">证据</p>
                                    <div className="space-y-1.5">
                                      {warning.evidence.map((ev, idx) => (
                                        <div key={idx} className="p-2 bg-white/60 rounded-lg flex items-start gap-2">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-ink-400 mt-0.5 flex-shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs text-ink-700 break-words">{ev.text}</p>
                                            <p className="text-[10px] text-ink-400 mt-0.5">{ev.source}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {hasSuggestions && (
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wide text-amber-600 mb-2 flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" />
                                      AI 修复建议
                                    </p>
                                    <div className="space-y-2">
                                      {warning.suggestions!.map((suggestion) => {
                                        const isApplying = applyingFix === `${warning.id}-${suggestion.id}`;
                                        return (
                                          <div key={suggestion.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-sm font-medium text-ink-800">{suggestion.title}</span>
                                                  {suggestion.autoApplicable && (
                                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">
                                                      可一键应用
                                                    </span>
                                                  )}
                                                </div>
                                                {suggestion.description && (
                                                  <p className="text-xs text-ink-500 mt-1">{suggestion.description}</p>
                                                )}
                                                {suggestion.suggestedText && (
                                                  <div className="mt-2 p-2 bg-white rounded border border-paper-200">
                                                    <p className="text-[10px] text-ink-400 mb-1">推荐内容：</p>
                                                    <p className="text-sm text-ink-700 font-mono break-all">{suggestion.suggestedText}</p>
                                                  </div>
                                                )}
                                              </div>
                                              {suggestion.autoApplicable && (
                                                <button
                                                  onClick={() => handleApplyFix(warning.id, suggestion.id)}
                                                  disabled={isApplying}
                                                  className={cn(
                                                    'flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1',
                                                    isApplying
                                                      ? 'bg-paper-200 text-ink-400 cursor-wait'
                                                      : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-95'
                                                  )}
                                                >
                                                  <Wrench className="w-3 h-3" />
                                                  {isApplying ? '应用中...' : '建议修复'}
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center gap-3 pt-2 border-t border-amber-200/50">
                                  <button
                                    onClick={() => resolveConflict(warning.id)}
                                    className="text-xs text-ink-500 hover:text-ink-700 flex items-center gap-1"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    标记为已处理
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <p className="text-ink-600 font-medium">
                        {conflictFilter === 'all' ? '未检测到冲突' : `该分类暂无冲突`}
                      </p>
                      <p className="text-sm text-ink-400 mt-1">情节和人物设定保持一致</p>
                    </div>
                  )}

                  {conflicts.filter(c => c.resolved).length > 0 && (
                    <div className="pt-4 border-t border-paper-200">
                      <h4 className="text-sm font-medium text-ink-500 mb-3 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        已处理的警告
                        <span className="text-xs font-normal text-ink-400">({conflicts.filter(c => c.resolved).length})</span>
                      </h4>
                      <div className="space-y-2">
                        {conflicts.filter(c => c.resolved).slice(0, 5).map((warning) => (
                          <div
                            key={warning.id}
                            className="p-3 bg-paper-100 rounded-lg opacity-60"
                          >
                            <p className="text-xs text-ink-500 line-through">{warning.message}</p>
                            {warning.resolutionNote && (
                              <p className="text-[10px] text-green-600 mt-1">✓ {warning.resolutionNote}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showVersionModal && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="card p-6 w-full max-w-md mx-4 animate-slide-in-right">
            <h2 className="font-serif text-xl font-bold text-ink-800 mb-4">
              保存版本
            </h2>
            <p className="text-sm text-ink-500 mb-4">
              为本次修改添加一个简短的说明，方便后续追溯。
            </p>
            <textarea
              value={versionSummary}
              onChange={(e) => setVersionSummary(e.target.value)}
              className="textarea h-24"
              placeholder="例如：完善了开头场景描写，优化了对话..."
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowVersionModal(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleSaveVersion}
                className="btn-gold flex-1"
                disabled={!versionSummary.trim()}
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewChapterModal && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="card p-6 w-full max-w-md mx-4 animate-slide-in-right">
            <h2 className="font-serif text-xl font-bold text-ink-800 mb-4">
              新建章节
            </h2>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                章节标题
              </label>
              <input
                type="text"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                className="input"
                placeholder="输入章节标题"
                autoFocus
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewChapterModal(false);
                  setNewChapterTitle('');
                }}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleCreateChapter}
                className="btn-gold flex-1"
                disabled={!newChapterTitle.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
