import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Filter, X, Lightbulb, Search, Grid3X3, List, Link, Zap, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import StickyNoteComponent from '@/components/StickyNote';
import NoteConnectionLayer from '@/components/NoteConnectionLayer';
import NoteConnectionModal from '@/components/NoteConnectionModal';
import type { StickyNote, StickyNoteColor, NoteConnection, NoteConnectionRecommendation, NoteConnectionType } from '@shared/types';
import { cn } from '@/lib/utils';

const colorConfig: Record<StickyNoteColor, { bg: string; name: string }> = {
  yellow: { bg: 'bg-yellow-200 border-yellow-300', name: '黄色' },
  pink: { bg: 'bg-pink-200 border-pink-300', name: '粉色' },
  blue: { bg: 'bg-sky-200 border-sky-300', name: '蓝色' },
  green: { bg: 'bg-emerald-200 border-emerald-300', name: '绿色' },
  orange: { bg: 'bg-orange-200 border-orange-300', name: '橙色' },
  purple: { bg: 'bg-violet-200 border-violet-300', name: '紫色' },
};

const colorOptions: StickyNoteColor[] = ['yellow', 'pink', 'blue', 'green', 'orange', 'purple'];

export default function InspirationWall() {
  const { projectId } = useParams<{ projectId: string }>();
  const { 
    currentProject, 
    stickyNotes, 
    noteConnections,
    connectionRecommendations,
    createStickyNote, 
    updateStickyNote, 
    updateNotePosition, 
    deleteStickyNote, 
    reorderNotes,
    loadNoteConnections,
    createNoteConnection,
    updateNoteConnection,
    deleteNoteConnection,
    loadConnectionRecommendations,
  } = useAppStore();
  const wallRef = useRef<HTMLDivElement>(null);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<StickyNoteColor | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [notePositions, setNotePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [viewMode, setViewMode] = useState<'wall' | 'list'>('wall');
  const [isConnectionMode, setIsConnectionMode] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<NoteConnection | null>(null);
  const [tempConnection, setTempConnection] = useState<{
    sourceNoteId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(new Set());
  const [pendingConnection, setPendingConnection] = useState<{
    sourceNoteId: string;
    targetNoteId: string;
  } | null>(null);

  const projectNotes = useMemo(() => {
    if (!projectId) return [];
    return stickyNotes.filter(n => n.projectId === projectId);
  }, [stickyNotes, projectId]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projectNotes.forEach(note => note.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [projectNotes]);

  const filteredNotes = useMemo(() => {
    let notes = [...projectNotes];

    if (selectedColor) {
      notes = notes.filter(n => n.color === selectedColor);
    }

    if (selectedTags.length > 0) {
      notes = notes.filter(n => selectedTags.some(tag => n.tags.includes(tag)));
    }

    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      notes = notes.filter(n =>
        n.content.toLowerCase().includes(search) ||
        n.tags.some(t => t.toLowerCase().includes(search))
      );
    }

    return notes.sort((a, b) => a.zIndex - b.zIndex);
  }, [projectNotes, selectedColor, selectedTags, searchText]);

  const projectConnections = useMemo(() => {
    if (!projectId) return [];
    return noteConnections.filter(c => c.projectId === projectId);
  }, [noteConnections, projectId]);

  const filteredRecommendations = useMemo(() => {
    return connectionRecommendations.filter(rec => 
      !dismissedRecommendations.has(`${rec.sourceNoteId}-${rec.targetNoteId}`)
    );
  }, [connectionRecommendations, dismissedRecommendations]);

  const notesWithConnections = useMemo(() => {
    const ids = new Set<string>();
    projectConnections.forEach(c => {
      ids.add(c.sourceNoteId);
      ids.add(c.targetNoteId);
    });
    return ids;
  }, [projectConnections]);

  const getNoteConnectionCount = useCallback((noteId: string) => {
    return projectConnections.filter(c => 
      c.sourceNoteId === noteId || c.targetNoteId === noteId
    ).length;
  }, [projectConnections]);

  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    projectNotes.forEach(note => {
      positions[note.id] = { x: note.positionX, y: note.positionY };
    });
    setNotePositions(positions);
  }, [projectNotes]);

  const handleDragStart = useCallback((e: React.MouseEvent, noteId: string) => {
    setDraggingNoteId(noteId);
  }, []);

  const handleDrag = useCallback((noteId: string, x: number, y: number) => {
    setNotePositions(prev => ({
      ...prev,
      [noteId]: { x, y },
    }));
  }, []);

  const handleDragEnd = useCallback(async (noteId: string, x: number, y: number) => {
    setDraggingNoteId(null);
    if (projectId) {
      await updateNotePosition(noteId, { positionX: x, positionY: y });
    }
  }, [projectId, updateNotePosition]);

  const handleBringToFront = useCallback(async (noteId: string) => {
    const maxZ = Math.max(...projectNotes.map(n => n.zIndex), 0);
    const note = projectNotes.find(n => n.id === noteId);
    if (note && note.zIndex !== maxZ) {
      const orderedIds = projectNotes
        .filter(n => n.id !== noteId)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map(n => n.id);
      orderedIds.push(noteId);
      if (projectId) {
        await reorderNotes(projectId, orderedIds);
      }
    }
  }, [projectNotes, projectId, reorderNotes]);

  const handleCreateNote = async () => {
    if (!projectId) return;

    const colors: StickyNoteColor[] = ['yellow', 'pink', 'blue', 'green', 'orange', 'purple'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const wallRect = wallRef.current?.getBoundingClientRect();
    const offsetX = wallRect ? 50 + Math.random() * (wallRect.width - 300) : 100;
    const offsetY = wallRect ? 50 + Math.random() * (wallRect.height - 200) : 100;

    await createStickyNote(projectId, {
      content: '',
      color: randomColor,
      tags: [],
      positionX: offsetX,
      positionY: offsetY,
    });
  };

  const handleUpdateNote = async (noteId: string, data: Partial<StickyNote>) => {
    await updateStickyNote(noteId, data);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('确定要删除这个灵感便签吗？')) {
      await deleteStickyNote(noteId);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedColor(null);
    setSelectedTags([]);
    setSearchText('');
  };

  const handleStartConnection = useCallback((noteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wallRect = wallRef.current?.getBoundingClientRect();
    if (!wallRect) return;
    
    const scrollLeft = wallRef.current?.scrollLeft || 0;
    const scrollTop = wallRef.current?.scrollTop || 0;
    
    const startX = e.clientX - wallRect.left + scrollLeft;
    const startY = e.clientY - wallRect.top + scrollTop;
    
    setTempConnection({
      sourceNoteId: noteId,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
    });
    setIsConnectionMode(true);
  }, []);

  const handleConnectionMouseMove = useCallback((e: React.MouseEvent) => {
    if (!tempConnection || !wallRef.current) return;
    
    const wallRect = wallRef.current.getBoundingClientRect();
    const scrollLeft = wallRef.current.scrollLeft;
    const scrollTop = wallRef.current.scrollTop;
    
    const currentX = e.clientX - wallRect.left + scrollLeft;
    const currentY = e.clientY - wallRect.top + scrollTop;
    
    setTempConnection(prev => prev ? {
      ...prev,
      currentX,
      currentY,
    } : null);
  }, [tempConnection]);

  const handleConnectionMouseUp = useCallback((e: React.MouseEvent) => {
    if (!tempConnection || !wallRef.current) return;
    
    const wallRect = wallRef.current.getBoundingClientRect();
    const scrollLeft = wallRef.current.scrollLeft;
    const scrollTop = wallRef.current.scrollTop;
    
    const mouseX = e.clientX - wallRect.left + scrollLeft;
    const mouseY = e.clientY - wallRect.top + scrollTop;
    
    let targetNoteId: string | null = null;
    
    for (const note of projectNotes) {
      const pos = notePositions[note.id] || { x: note.positionX, y: note.positionY };
      if (
        mouseX >= pos.x &&
        mouseX <= pos.x + note.width &&
        mouseY >= pos.y &&
        mouseY <= pos.y + note.height &&
        note.id !== tempConnection.sourceNoteId
      ) {
        targetNoteId = note.id;
        break;
      }
    }
    
    if (targetNoteId) {
      const exists = projectConnections.some(c =>
        (c.sourceNoteId === tempConnection.sourceNoteId && c.targetNoteId === targetNoteId) ||
        (c.sourceNoteId === targetNoteId && c.targetNoteId === tempConnection.sourceNoteId)
      );
      
      if (!exists) {
        setPendingConnection({
          sourceNoteId: tempConnection.sourceNoteId,
          targetNoteId,
        });
        setShowConnectionModal(true);
      }
    }
    
    setTempConnection(null);
    setIsConnectionMode(false);
  }, [tempConnection, projectNotes, notePositions, projectConnections]);

  const handleConnectionClick = useCallback((connection: NoteConnection) => {
    setEditingConnection(connection);
    setShowConnectionModal(true);
  }, []);

  const handleConnectionDelete = useCallback(async (connectionId: string) => {
    if (window.confirm('确定要删除这条关联线吗？')) {
      await deleteNoteConnection(connectionId);
    }
  }, [deleteNoteConnection]);

  const handleSaveConnection = useCallback(async (data: {
    sourceNoteId: string;
    targetNoteId: string;
    type: NoteConnectionType;
    label?: string;
    description?: string;
    color?: string;
  }) => {
    if (!projectId) return;
    
    if (editingConnection) {
      await updateNoteConnection(editingConnection.id, {
        type: data.type,
        label: data.label,
        description: data.description,
        color: data.color,
      });
    } else {
      await createNoteConnection(projectId, data);
      if (showRecommendations) {
        await loadConnectionRecommendations(projectId);
      }
    }
    
    setShowConnectionModal(false);
    setEditingConnection(null);
    setPendingConnection(null);
  }, [projectId, editingConnection, updateNoteConnection, createNoteConnection, showRecommendations, loadConnectionRecommendations]);

  const handleCloseModal = useCallback(() => {
    setShowConnectionModal(false);
    setEditingConnection(null);
    setPendingConnection(null);
  }, []);

  const handleAcceptRecommendation = useCallback(async (recommendation: NoteConnectionRecommendation) => {
    if (!projectId) return;
    
    await createNoteConnection(projectId, {
      sourceNoteId: recommendation.sourceNoteId,
      targetNoteId: recommendation.targetNoteId,
      type: recommendation.suggestedType,
      label: recommendation.commonTags[0] || undefined,
      description: recommendation.reason,
    });
    
    await loadConnectionRecommendations(projectId);
  }, [projectId, createNoteConnection, loadConnectionRecommendations]);

  const handleDismissRecommendation = useCallback((recommendation: NoteConnectionRecommendation) => {
    setDismissedRecommendations(prev => {
      const next = new Set(prev);
      next.add(`${recommendation.sourceNoteId}-${recommendation.targetNoteId}`);
      return next;
    });
  }, []);

  const toggleConnectionMode = useCallback(() => {
    setIsConnectionMode(prev => !prev);
    if (tempConnection) {
      setTempConnection(null);
    }
  }, [tempConnection]);

  const toggleShowRecommendations = useCallback(async () => {
    const newValue = !showRecommendations;
    setShowRecommendations(newValue);
    
    if (newValue && projectId && connectionRecommendations.length === 0) {
      await loadConnectionRecommendations(projectId);
    }
  }, [showRecommendations, projectId, connectionRecommendations.length, loadConnectionRecommendations]);

  const refreshRecommendations = useCallback(async () => {
    if (!projectId) return;
    setDismissedRecommendations(new Set());
    await loadConnectionRecommendations(projectId);
  }, [projectId, loadConnectionRecommendations]);

  const getNoteWithPosition = (note: StickyNote) => {
    const pos = notePositions[note.id] || { x: note.positionX, y: note.positionY };
    return { ...note, positionX: pos.x, positionY: pos.y };
  };

  if (!currentProject || !projectId) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  const hasActiveFilters = selectedColor || selectedTags.length > 0 || searchText.trim();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink-800 flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-gold-500" />
            灵感墙
          </h1>
          <p className="text-sm text-ink-500 mt-1">
            自由记录你的创作灵感，拖拽排序，颜色分类
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-paper-50 rounded-lg border border-paper-300 p-0.5">
            <button
              onClick={() => setViewMode('wall')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'wall' ? 'bg-white shadow-sm text-ink-800' : 'text-ink-400 hover:text-ink-600'
              )}
              title="墙视图"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'list' ? 'bg-white shadow-sm text-ink-800' : 'text-ink-400 hover:text-ink-600'
              )}
              title="列表视图"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {viewMode === 'wall' && (
            <>
              <button
                onClick={toggleConnectionMode}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                  isConnectionMode
                    ? 'bg-blue-100 border-blue-400 text-blue-700'
                    : 'bg-white border-paper-300 text-ink-600 hover:border-blue-400'
                )}
                title="关联线模式"
              >
                <Link className="w-4 h-4" />
                <span className="text-sm">连线</span>
                {projectConnections.length > 0 && (
                  <span className="w-5 h-5 bg-gold-500 text-white rounded-full text-xs flex items-center justify-center">
                    {projectConnections.length}
                  </span>
                )}
              </button>

              <button
                onClick={toggleShowRecommendations}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
                  showRecommendations
                    ? 'bg-green-100 border-green-400 text-green-700'
                    : 'bg-white border-paper-300 text-ink-600 hover:border-green-400'
                )}
                title="智能推荐"
              >
                {showRecommendations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="text-sm">推荐</span>
                {showRecommendations && filteredRecommendations.length > 0 && (
                  <span className="w-5 h-5 bg-green-500 text-white rounded-full text-xs flex items-center justify-center">
                    {filteredRecommendations.length}
                  </span>
                )}
              </button>

              {showRecommendations && filteredRecommendations.length > 0 && (
                <button
                  onClick={refreshRecommendations}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-paper-300 bg-white text-ink-600 hover:border-gold-400 transition-all"
                  title="刷新推荐"
                >
                  <Zap className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
              hasActiveFilters
                ? 'bg-gold-100 border-gold-300 text-gold-700'
                : 'bg-white border-paper-300 text-ink-600 hover:border-gold-400'
            )}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm">筛选</span>
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-gold-500 text-white rounded-full text-xs flex items-center justify-center">
                {(selectedColor ? 1 : 0) + selectedTags.length + (searchText ? 1 : 0)}
              </span>
            )}
          </button>

          <button onClick={handleCreateNote} className="btn-gold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>新建便签</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card p-4 mb-4 animate-fade-in">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-medium text-ink-700">筛选条件</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-ink-400 hover:text-brick-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                清除筛选
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-ink-500 block mb-2">搜索内容</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="搜索便签内容或标签..."
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-ink-500 block mb-2">按颜色筛选</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedColor(null)}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110',
                    selectedColor === null ? 'ring-2 ring-gold-500' : 'border-paper-300'
                  )}
                  title="全部颜色"
                >
                  <span className="text-xs">全</span>
                </button>
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(selectedColor === color ? null : color)}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                      colorConfig[color].bg,
                      selectedColor === color && 'ring-2 ring-gold-500 ring-offset-1'
                    )}
                    title={colorConfig[color].name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-ink-500 block mb-2">按标签筛选</label>
              {allTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-full transition-all',
                        selectedTags.includes(tag)
                          ? 'bg-gold-500 text-white'
                          : 'bg-paper-100 text-ink-600 hover:bg-gold-100'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-400">暂无标签</p>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-paper-200 text-sm text-ink-500">
            共 {filteredNotes.length} / {projectNotes.length} 个便签
          </div>
        </div>
      )}

      {viewMode === 'wall' ? (
        <div
          ref={wallRef}
          className={cn(
            'flex-1 relative overflow-auto rounded-xl border',
            'min-h-[600px]',
            isConnectionMode && 'cursor-crosshair'
          )}
          style={{
            background: `
              linear-gradient(135deg, rgba(139, 90, 43, 0.1) 0%, rgba(139, 90, 43, 0.05) 50%, rgba(139, 90, 43, 0.1) 100%),
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.02) 2px,
                rgba(0, 0, 0, 0.02) 4px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(0, 0, 0, 0.02) 2px,
                rgba(0, 0, 0, 0.02) 4px
              )
            `,
            backgroundColor: '#d4a574',
            borderColor: '#a67c52',
            boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.1)',
          }}
          onMouseMove={tempConnection ? handleConnectionMouseMove : undefined}
          onMouseUp={tempConnection ? handleConnectionMouseUp : undefined}
          onMouseLeave={tempConnection ? handleConnectionMouseUp : undefined}
        >
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />

          <div
            className="absolute top-0 left-0 right-0 h-4 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.15), transparent)',
            }}
          />

          {isConnectionMode && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse">
              🎯 拖拽便签边缘的蓝色圆点到另一个便签，创建关联线
            </div>
          )}

          {filteredNotes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-paper-100 flex items-center justify-center">
                  <Lightbulb className="w-8 h-8 text-ink-400" />
                </div>
                <p className="text-ink-500 mb-2">
                  {hasActiveFilters ? '没有匹配的便签' : '还没有灵感便签'}
                </p>
                {!hasActiveFilters && (
                  <button
                    onClick={handleCreateNote}
                    className="btn-gold text-sm"
                  >
                    创建第一个便签
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full" style={{ minHeight: '800px', minWidth: '1200px' }}>
              <NoteConnectionLayer
                notes={projectNotes}
                connections={projectConnections}
                recommendations={filteredRecommendations}
                notePositions={notePositions}
                tempConnection={tempConnection}
                showRecommendations={showRecommendations}
                onConnectionClick={handleConnectionClick}
                onConnectionDelete={handleConnectionDelete}
                onRecommendationAccept={handleAcceptRecommendation}
                onRecommendationDismiss={handleDismissRecommendation}
              />

              {filteredNotes.map((note) => (
                <StickyNoteComponent
                  key={note.id}
                  note={getNoteWithPosition(note)}
                  onDragStart={handleDragStart}
                  onDrag={handleDrag}
                  onDragEnd={handleDragEnd}
                  onUpdate={handleUpdateNote}
                  onDelete={handleDeleteNote}
                  onBringToFront={handleBringToFront}
                  isDragging={draggingNoteId === note.id}
                  onStartConnection={handleStartConnection}
                  isConnectionMode={isConnectionMode}
                  isConnectionTarget={tempConnection !== null && tempConnection.sourceNoteId !== note.id}
                  hasConnections={notesWithConnections.has(note.id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  'card p-4 cursor-pointer hover:shadow-paper-hover transition-all',
                  'border-l-4'
                )}
                style={{
                  borderLeftColor: note.color === 'yellow' ? '#facc15' :
                    note.color === 'pink' ? '#f9a8d4' :
                    note.color === 'blue' ? '#7dd3fc' :
                    note.color === 'green' ? '#6ee7b7' :
                    note.color === 'orange' ? '#fdba74' :
                    '#c4b5fd',
                }}
                onClick={() => {
                  handleBringToFront(note.id);
                  setViewMode('wall');
                }}
              >
                <p className="text-sm text-ink-700 line-clamp-4 mb-3 font-serif">
                  {note.content || '（空）'}
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {note.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs rounded-full bg-paper-100 text-ink-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-ink-400">
                  {new Date(note.updatedAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-center text-xs text-ink-400">
        💡 提示：拖拽便签可以移动位置，点击悬浮按钮可以编辑、更换颜色或添加标签 | 
        🔗 点击「连线」按钮拖拽便签边缘圆点创建关联线 | 
        🤖 点击「推荐」查看AI智能推荐的便签关联
      </div>

      <NoteConnectionModal
        isOpen={showConnectionModal}
        connection={editingConnection}
        sourceNoteId={pendingConnection?.sourceNoteId}
        targetNoteId={pendingConnection?.targetNoteId}
        notes={projectNotes.map(n => ({ id: n.id, content: n.content }))}
        onClose={handleCloseModal}
        onSave={handleSaveConnection}
      />
    </div>
  );
}
