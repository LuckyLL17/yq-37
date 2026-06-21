import { useState, useRef } from 'react';
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  TrendingUp,
  Trash2,
  Edit3,
  Users,
  BookOpen,
  Hash,
} from 'lucide-react';
import type { BeatCard as BeatCardType, EmotionPoint, Character, PlotPoint } from '@shared/types';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import EmotionCurve from './EmotionCurve';

interface BeatCardProps {
  beat: BeatCardType;
  order: number;
  actName?: string;
  onDragStart: (e: React.DragEvent, beatId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, beatId: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  characters?: Character[];
  plotPoints?: PlotPoint[];
}

export default function BeatCard({
  beat,
  order,
  actName,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  isDragOver,
  characters,
  plotPoints,
}: BeatCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const { updateBeat, deleteBeat, updateBeatEmotionCurve } = useAppStore();

  const relatedChars = characters?.filter(c => beat.relatedCharacterIds.includes(c.id)) || [];
  const relatedPlots = plotPoints?.filter(p => beat.relatedPlotPointIds.includes(p.id)) || [];

  const startEditing = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const finishEditing = () => {
    if (editingField) {
      const field = editingField as keyof BeatCardType;
      if (editValue !== getBeatFieldValue(field)) {
        updateBeat(beat.id, { [field]: editValue });
      }
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleEmotionChange = (points: EmotionPoint[]) => {
    updateBeatEmotionCurve(beat.id, points);
  };

  const fieldConfig: { key: keyof BeatCardType; label: string; icon: typeof Target; placeholder: string }[] = [
    { key: 'goal', label: '场景目标', icon: Target, placeholder: '这个场景想要达成什么...' },
    { key: 'conflict', label: '核心冲突', icon: Zap, placeholder: '阻碍目标实现的矛盾是...' },
    { key: 'turningPoint', label: '转折点', icon: TrendingUp, placeholder: '局面如何被改变...' },
  ];

  const getBeatFieldValue = (field: keyof BeatCardType): string => {
    const value = beat[field];
    return typeof value === 'string' ? value : '';
  };

  return (
    <div
      className={cn(
        'card border-l-4 transition-all duration-200',
        isDragging && 'opacity-50 scale-[0.98]',
        isDragOver && 'ring-2 ring-gold-400 ring-offset-2 scale-[1.01]',
        'hover:shadow-paper-hover'
      )}
      style={{ borderLeftColor: beat.color }}
      draggable
      onDragStart={(e) => onDragStart(e, beat.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, beat.id)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="mt-1 cursor-grab active:cursor-grabbing text-ink-300 hover:text-ink-500 transition-colors"
            title="拖拽排序"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="gold-badge">节拍 {order}</span>
              {actName && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-paper-200 text-ink-600">
                  {actName}
                </span>
              )}
              {beat.estimatedWords > 0 && (
                <span className="flex items-center gap-1 text-xs text-ink-400">
                  <Hash className="w-3 h-3" />
                  预估 {beat.estimatedWords} 字
                </span>
              )}
            </div>

            {editingField === 'title' ? (
              <textarea
                ref={editInputRef as React.RefObject<HTMLTextAreaElement>}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), finishEditing())}
                className="w-full font-serif text-lg font-bold text-ink-800 bg-paper-100 rounded-lg px-3 py-2 outline-none ring-2 ring-gold-400 resize-none"
                rows={2}
              />
            ) : (
              <h3
                className="font-serif text-lg font-bold text-ink-800 cursor-pointer hover:text-gold-600 transition-colors flex items-center gap-2"
                onClick={() => startEditing('title', beat.title)}
              >
                {beat.title}
                <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
            )}

            {editingField === 'description' ? (
              <textarea
                ref={editInputRef as React.RefObject<HTMLTextAreaElement>}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={finishEditing}
                className="w-full text-sm text-ink-600 bg-paper-100 rounded-lg px-3 py-2 mt-2 outline-none ring-2 ring-gold-400 resize-none"
                rows={2}
                placeholder="简要描述这个场景..."
              />
            ) : (
              beat.description && (
                <p
                  className="text-sm text-ink-600 mt-1 cursor-pointer hover:text-ink-800 transition-colors"
                  onClick={() => startEditing('description', beat.description)}
                >
                  {beat.description}
                </p>
              )
            )}

            {(relatedChars.length > 0 || relatedPlots.length > 0) && (
              <div className="flex flex-wrap gap-2 mt-3">
                {relatedChars.map(char => (
                  <div key={char.id} className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 rounded-full" title={char.name}>
                    <Users className="w-3 h-3 text-purple-500" />
                    <span className="text-xs text-purple-700">{char.name}</span>
                  </div>
                ))}
                {relatedPlots.map(plot => (
                  <div key={plot.id} className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-full" title={plot.title}>
                    <BookOpen className="w-3 h-3 text-amber-600" />
                    <span className="text-xs text-amber-700">{plot.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-paper-200 rounded-lg transition-colors text-ink-500"
              title={isExpanded ? '收起详情' : '展开详情'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => deleteBeat(beat.id)}
              className="p-2 hover:bg-brick-50 rounded-lg transition-colors text-ink-400 hover:text-brick-500"
              title="删除节拍"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-paper-200 space-y-4 animate-fade-in">
            {fieldConfig.map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" style={{ color: beat.color }} />
                  <label className="text-sm font-medium text-ink-700">{label}</label>
                </div>
                {editingField === key ? (
                  <textarea
                    ref={editInputRef as React.RefObject<HTMLTextAreaElement>}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={finishEditing}
                    className="textarea h-20 text-sm"
                    placeholder={placeholder}
                  />
                ) : (
                  <div
                    className={cn(
                      'p-3 rounded-lg bg-paper-100 text-sm cursor-text hover:bg-paper-200 transition-colors min-h-[60px]',
                      !getBeatFieldValue(key) && 'text-ink-400 italic'
                    )}
                    onClick={() => startEditing(key, getBeatFieldValue(key))}
                  >
                    {getBeatFieldValue(key) || `点击添加${label}...`}
                  </div>
                )}
              </div>
            ))}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" style={{ color: beat.color }} />
                <label className="text-sm font-medium text-ink-700">情感张力曲线</label>
                <span className="text-xs text-ink-400">（点击添加节点，拖拽调整，双击删除）</span>
              </div>
              <div className="p-3 bg-paper-100 rounded-lg">
                <EmotionCurve
                  points={beat.emotionCurve}
                  onChange={handleEmotionChange}
                  color={beat.color}
                  width={280}
                  height={70}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
