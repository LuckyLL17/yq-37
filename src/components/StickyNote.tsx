import React, { useState, useRef, useEffect } from 'react';
import { X, Edit3, Palette, Tag, Check, Link } from 'lucide-react';
import { StickyNote, StickyNoteColor } from '@shared/types';
import { cn } from '@/lib/utils';

interface StickyNoteProps {
  note: StickyNote;
  onDragStart: (e: React.MouseEvent, noteId: string) => void;
  onDrag: (noteId: string, x: number, y: number) => void;
  onDragEnd: (noteId: string, x: number, y: number) => void;
  onUpdate: (noteId: string, data: Partial<StickyNote>) => void;
  onDelete: (noteId: string) => void;
  onBringToFront: (noteId: string) => void;
  isDragging: boolean;
  onStartConnection?: (noteId: string, e: React.MouseEvent) => void;
  isConnectionMode?: boolean;
  isConnectionTarget?: boolean;
  hasConnections?: boolean;
}

const colorConfig: Record<StickyNoteColor, { bg: string; border: string; text: string; tape: string }> = {
  yellow: {
    bg: 'bg-yellow-200',
    border: 'border-yellow-300',
    text: 'text-yellow-900',
    tape: 'bg-yellow-100/60',
  },
  pink: {
    bg: 'bg-pink-200',
    border: 'border-pink-300',
    text: 'text-pink-900',
    tape: 'bg-pink-100/60',
  },
  blue: {
    bg: 'bg-sky-200',
    border: 'border-sky-300',
    text: 'text-sky-900',
    tape: 'bg-sky-100/60',
  },
  green: {
    bg: 'bg-emerald-200',
    border: 'border-emerald-300',
    text: 'text-emerald-900',
    tape: 'bg-emerald-100/60',
  },
  orange: {
    bg: 'bg-orange-200',
    border: 'border-orange-300',
    text: 'text-orange-900',
    tape: 'bg-orange-100/60',
  },
  purple: {
    bg: 'bg-violet-200',
    border: 'border-violet-300',
    text: 'text-violet-900',
    tape: 'bg-violet-100/60',
  },
};

const colorOptions: StickyNoteColor[] = ['yellow', 'pink', 'blue', 'green', 'orange', 'purple'];

export default function StickyNoteComponent({
  note,
  onDragStart,
  onDrag,
  onDragEnd,
  onUpdate,
  onDelete,
  onBringToFront,
  isDragging,
  onStartConnection,
  isConnectionMode = false,
  isConnectionTarget = false,
  hasConnections = false,
}: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [newTag, setNewTag] = useState('');
  const noteRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });

  const config = colorConfig[note.color];

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(0, 0);
    }
  }, [isEditing]);

  useEffect(() => {
    setEditContent(note.content);
  }, [note.content]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showColorPicker || showTagInput) {
        if (noteRef.current && !noteRef.current.contains(e.target as Node)) {
          setShowColorPicker(false);
          setShowTagInput(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker, showTagInput]);

  const shouldIgnoreDrag = (target: HTMLElement): boolean => {
    if (isEditing) return true;
    if (target.closest('.note-controls')) return true;
    if (target.closest('.note-popup')) return true;
    if (target.closest('.note-connection-point')) return true;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.tagName === 'BUTTON') return true;
    return false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    if (shouldIgnoreDrag(target)) {
      return;
    }

    e.preventDefault();
    onBringToFront(note.id);

    const rect = noteRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    startPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
    hasMovedRef.current = false;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);

      if (!isDraggingRef.current && (dx > 3 || dy > 3)) {
        isDraggingRef.current = true;
        hasMovedRef.current = true;
        onDragStart(e as unknown as React.MouseEvent, note.id);
      }

      if (isDraggingRef.current) {
        const wallRect = noteRef.current?.parentElement?.getBoundingClientRect();
        if (wallRect) {
          const x = e.clientX - wallRect.left - dragOffset.current.x;
          const y = e.clientY - wallRect.top - dragOffset.current.y;
          onDrag(note.id, Math.max(0, x), Math.max(0, y));
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const wallRect = noteRef.current?.parentElement?.getBoundingClientRect();
        if (wallRect) {
          const x = e.clientX - wallRect.left - dragOffset.current.x;
          const y = e.clientY - wallRect.top - dragOffset.current.y;
          onDragEnd(note.id, Math.max(0, x), Math.max(0, y));
        }
      } else if (!hasMovedRef.current) {
        if (target.closest('.note-content-area') && !isEditing) {
          setIsEditing(true);
          setShowColorPicker(false);
          setShowTagInput(false);
        }
      }

      isDraggingRef.current = false;
      hasMovedRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSaveContent = () => {
    if (editContent.trim() !== note.content) {
      onUpdate(note.id, { content: editContent.trim() });
    }
    setIsEditing(false);
  };

  const handleColorChange = (color: StickyNoteColor) => {
    onUpdate(note.id, { color });
    setShowColorPicker(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !note.tags.includes(newTag.trim())) {
      onUpdate(note.id, { tags: [...note.tags, newTag.trim()] });
    }
    setNewTag('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdate(note.id, { tags: note.tags.filter(t => t !== tagToRemove) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSaveContent();
    }
    if (e.key === 'Escape') {
      setEditContent(note.content);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={noteRef}
      className={cn(
        'absolute cursor-grab select-none group',
        'transition-transform duration-75',
        isDragging && 'cursor-grabbing z-50',
        isConnectionMode && 'ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent rounded-sm',
        isConnectionTarget && 'ring-2 ring-green-400 ring-offset-2 ring-offset-transparent rounded-sm scale-105'
      )}
      style={{
        left: note.positionX,
        top: note.positionY,
        width: note.width,
        height: note.height,
        zIndex: isDragging ? 1000 : note.zIndex,
        transform: `rotate(${note.rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className={cn(
          'relative h-full rounded-sm border',
          config.bg,
          config.border,
          config.text,
          'shadow-lg hover:shadow-xl',
          'transition-shadow duration-200',
          'overflow-hidden'
        )}
        style={{
          boxShadow: isDragging
            ? '0 20px 40px -10px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)'
            : '0 4px 15px -5px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          className={cn(
            'absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5',
            config.tape,
            'backdrop-blur-sm',
            'border-x border-b border-white/50'
          )}
          style={{
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        />

        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="absolute top-1 right-1 note-controls flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowColorPicker(!showColorPicker);
              setShowTagInput(false);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-black/10 transition-colors"
            title="更改颜色"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowTagInput(!showTagInput);
              setShowColorPicker(false);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-black/10 transition-colors"
            title="添加标签"
          >
            <Tag className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsEditing(true);
              setShowColorPicker(false);
              setShowTagInput(false);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-black/10 transition-colors"
            title="编辑"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(note.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-red-500/30 transition-colors"
            title="删除"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {showColorPicker && (
          <div
            className="note-popup absolute top-8 right-2 z-30 bg-white rounded-lg shadow-lg p-2 border border-gray-200 flex gap-1"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {colorOptions.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                onMouseDown={(e) => e.stopPropagation()}
                className={cn(
                  'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                  colorConfig[color].bg,
                  colorConfig[color].border,
                  note.color === color && 'ring-2 ring-ink-500 ring-offset-1'
                )}
              />
            ))}
          </div>
        )}

        {showTagInput && (
          <div
            className="note-popup absolute top-8 right-2 z-30 bg-white rounded-lg shadow-lg p-2 border border-gray-200 w-48"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex gap-1 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder="输入标签..."
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-gold-500"
                autoFocus
              />
              <button
                onClick={handleAddTag}
                onMouseDown={(e) => e.stopPropagation()}
                className="px-2 py-1 bg-gold-500 text-white rounded text-xs hover:bg-gold-600"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-paper-100 text-xs rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="note-content-area relative h-full p-4 pt-5 flex flex-col">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveContent}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'flex-1 w-full bg-transparent resize-none outline-none cursor-text',
                'font-serif text-sm leading-relaxed',
                config.text
              )}
              style={{ fontFamily: '"Noto Serif SC", serif' }}
            />
          ) : (
            <p
              className={cn(
                'flex-1 text-sm leading-relaxed overflow-hidden cursor-text',
                'whitespace-pre-wrap break-words',
                config.text
              )}
              style={{
                fontFamily: '"Noto Serif SC", serif',
                display: '-webkit-box',
                WebkitLineClamp: 6,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {note.content || '点击编辑...'}
            </p>
          )}

          {note.tags.length > 0 && !isEditing && (
            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-black/10">
              {note.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'px-2 py-0.5 text-xs rounded-full',
                    'bg-black/10 backdrop-blur-sm'
                  )}
                >
                  {tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-black/10">
                  +{note.tags.length - 3}
                </span>
              )}
            </div>
          )}

          <div
            className={cn(
              'absolute bottom-2 right-3 text-xs opacity-50',
              'transition-opacity duration-200',
              'group-hover:opacity-70'
            )}
          >
            {new Date(note.updatedAt).toLocaleDateString('zh-CN', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.05))',
          }}
        />
      </div>

      {(isConnectionMode || hasConnections) && (
        <>
          <div
            className={cn(
              'note-connection-point absolute -left-2 top-1/2 -translate-y-1/2',
              'w-5 h-5 rounded-full bg-white border-2 border-gray-300',
              'flex items-center justify-center cursor-crosshair',
              'opacity-0 group-hover:opacity-100 transition-all duration-200',
              'hover:border-blue-500 hover:bg-blue-50 hover:scale-110',
              isConnectionMode && 'opacity-100 border-blue-400 bg-blue-50 animate-pulse'
            )}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onStartConnection?.(note.id, e);
            }}
            title="拖拽创建关联线"
          >
            <Link className="w-3 h-3 text-gray-500" />
          </div>

          <div
            className={cn(
              'note-connection-point absolute -right-2 top-1/2 -translate-y-1/2',
              'w-5 h-5 rounded-full bg-white border-2 border-gray-300',
              'flex items-center justify-center cursor-crosshair',
              'opacity-0 group-hover:opacity-100 transition-all duration-200',
              'hover:border-blue-500 hover:bg-blue-50 hover:scale-110',
              isConnectionMode && 'opacity-100 border-blue-400 bg-blue-50 animate-pulse'
            )}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onStartConnection?.(note.id, e);
            }}
            title="拖拽创建关联线"
          >
            <Link className="w-3 h-3 text-gray-500" />
          </div>

          <div
            className={cn(
              'note-connection-point absolute left-1/2 -translate-x-1/2 -top-2',
              'w-5 h-5 rounded-full bg-white border-2 border-gray-300',
              'flex items-center justify-center cursor-crosshair',
              'opacity-0 group-hover:opacity-100 transition-all duration-200',
              'hover:border-blue-500 hover:bg-blue-50 hover:scale-110',
              isConnectionMode && 'opacity-100 border-blue-400 bg-blue-50 animate-pulse'
            )}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onStartConnection?.(note.id, e);
            }}
            title="拖拽创建关联线"
          >
            <Link className="w-3 h-3 text-gray-500" />
          </div>

          <div
            className={cn(
              'note-connection-point absolute left-1/2 -translate-x-1/2 -bottom-2',
              'w-5 h-5 rounded-full bg-white border-2 border-gray-300',
              'flex items-center justify-center cursor-crosshair',
              'opacity-0 group-hover:opacity-100 transition-all duration-200',
              'hover:border-blue-500 hover:bg-blue-50 hover:scale-110',
              isConnectionMode && 'opacity-100 border-blue-400 bg-blue-50 animate-pulse'
            )}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onStartConnection?.(note.id, e);
            }}
            title="拖拽创建关联线"
          >
            <Link className="w-3 h-3 text-gray-500" />
          </div>
        </>
      )}

      <div
        className="absolute inset-0 -z-10 opacity-30 pointer-events-none"
        style={{
          filter: 'blur(8px)',
          transform: 'translateY(4px) scale(0.98)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      />
    </div>
  );
}
