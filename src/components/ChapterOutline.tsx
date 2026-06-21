import { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  FileText,
  Sparkles,
  TrendingUp,
  Hash,
  BookOpen,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import type { NarrativeStructureType, BeatCard, EmotionPoint } from '@shared/types';
import BeatCardComponent from './BeatCard';
import EmotionCurve from './EmotionCurve';
import StructureTemplateSelector from './StructureTemplateSelector';

interface ChapterOutlineProps {
  chapterId: string;
  projectId: string;
}

export default function ChapterOutline({ chapterId, projectId }: ChapterOutlineProps) {
  const {
    getBeatsForChapter,
    getChapterOutline,
    createBeat,
    reorderBeats,
    applyStructureTemplate,
    updateOutlineSummary,
    structureTemplates,
    characters,
    plotPoints,
  } = useAppStore();

  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [draggingBeatId, setDraggingBeatId] = useState<string | null>(null);
  const [dragOverBeatId, setDragOverBeatId] = useState<string | null>(null);
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  const beats = getBeatsForChapter(chapterId);
  const outline = getChapterOutline(chapterId);
  const projectCharacters = characters.filter(c => c.projectId === projectId);
  const projectPlotPoints = plotPoints.filter(p => p.projectId === projectId);

  const structureName = useMemo(() => {
    if (!outline?.structureType) return '自由结构';
    const template = structureTemplates.find(t => t.type === outline.structureType);
    return template?.name || '自由结构';
  }, [outline?.structureType, structureTemplates]);

  const actsWithBeats = useMemo(() => {
    if (!outline?.structureType || outline.structureType === 'custom') {
      return [{ key: 'custom', name: '自定义节拍', beats }];
    }
    const template = structureTemplates.find(t => t.type === outline.structureType);
    if (!template) return [{ key: 'custom', name: '自定义节拍', beats }];

    return template.acts.map(act => {
      const actBeats = beats.filter(b => b.act === act.key);
      const ordered = act.beats
        .map(beatDef => actBeats.find(b => b.beatKey === beatDef.key))
        .filter(Boolean) as BeatCard[];
      const extras = actBeats.filter(b => !ordered.find(o => o.id === b.id));
      return {
        key: act.key,
        name: act.name,
        description: act.description,
        beats: [...ordered, ...extras],
      };
    }).filter(act => act.beats.length > 0);
  }, [beats, outline?.structureType, structureTemplates]);

  const overallEmotionCurve: EmotionPoint[] = useMemo(() => {
    if (beats.length === 0) return [];
    const totalBeats = beats.length;
    const points: EmotionPoint[] = [];
    beats.forEach((beat, idx) => {
      beat.emotionCurve.forEach(point => {
        points.push({
          position: (idx + point.position) / totalBeats,
          intensity: point.intensity,
        });
      });
    });
    return points.sort((a, b) => a.position - b.position);
  }, [beats]);

  const totalEstimatedWords = beats.reduce((sum, b) => sum + (b.estimatedWords || 0), 0);

  const handleDragStart = (e: React.DragEvent, beatId: string) => {
    setDraggingBeatId(beatId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragOverBeat = (e: React.DragEvent, beatId: string) => {
    e.preventDefault();
    if (beatId !== draggingBeatId) {
      setDragOverBeatId(beatId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetBeatId: string) => {
    e.preventDefault();
    if (!draggingBeatId || draggingBeatId === targetBeatId) {
      setDraggingBeatId(null);
      setDragOverBeatId(null);
      return;
    }

    const beatIds = beats.map(b => b.id);
    const fromIdx = beatIds.indexOf(draggingBeatId);
    const toIdx = beatIds.indexOf(targetBeatId);

    if (fromIdx === -1 || toIdx === -1) return;

    const newOrder = [...beatIds];
    const [removed] = newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, removed);

    reorderBeats(chapterId, newOrder);
    setDraggingBeatId(null);
    setDragOverBeatId(null);
  };

  const handleApplyTemplate = async (type: NarrativeStructureType) => {
    await applyStructureTemplate(chapterId, type);
  };

  const handleAddBeat = () => {
    createBeat(chapterId, {
      title: '新节拍',
      structureType: outline?.structureType || 'custom',
    });
  };

  const startEditingSummary = () => {
    setSummaryText(outline?.summary || '');
    setEditingSummary(true);
  };

  const finishEditingSummary = () => {
    updateOutlineSummary(chapterId, summaryText);
    setEditingSummary(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
              <Layers className="w-5 h-5 text-ink-900" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-ink-800">章节大纲</h2>
              <div className="flex items-center gap-2 text-xs text-ink-500">
                <span className="px-2 py-0.5 bg-gold-50 text-gold-700 rounded-full font-medium">
                  {structureName}
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {beats.length} 个节拍
                </span>
                {totalEstimatedWords > 0 && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    预估 {totalEstimatedWords.toLocaleString()} 字
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Sparkles className="w-4 h-4" />
              选择结构模板
            </button>
            <button
              onClick={handleAddBeat}
              className="btn-gold flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              添加节拍
            </button>
          </div>
        </div>

        {beats.length > 0 && overallEmotionCurve.length > 0 && (
          <div className="pt-4 border-t border-paper-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gold-600" />
              <span className="text-sm font-medium text-ink-700">整章情感张力曲线</span>
            </div>
            <div className="p-3 bg-paper-100 rounded-lg">
              <EmotionCurve
                points={overallEmotionCurve}
                readonly
                color="#d4af37"
                width={600}
                height={50}
              />
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-paper-200 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-gold-600" />
            <span className="text-sm font-medium text-ink-700">章节概要</span>
          </div>
          {editingSummary ? (
            <textarea
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              onBlur={finishEditingSummary}
              className="textarea h-24 text-sm"
              placeholder="为这一章写一个简短的概要..."
              autoFocus
            />
          ) : (
            <div
              className={cn(
                'p-3 rounded-lg bg-paper-100 text-sm cursor-text hover:bg-paper-200 transition-colors min-h-[60px]',
                !outline?.summary && 'text-ink-400 italic'
              )}
              onClick={startEditingSummary}
            >
              {outline?.summary || '点击添加章节概要...'}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-2">
        {beats.length === 0 ? (
          <div className="card p-12 text-center">
            <Layers className="w-16 h-16 text-ink-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-ink-600 mb-2">还没有节拍</h3>
            <p className="text-ink-400 mb-6">开始规划你的章节结构吧</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                应用结构模板
              </button>
              <button
                onClick={handleAddBeat}
                className="btn-gold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                手动添加节拍
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {actsWithBeats.map((act) => (
              <div key={act.key}>
                {(actsWithBeats.length > 1) && (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-paper-300" />
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-ink-800 rounded-full">
                      <span className="text-sm font-medium text-white">{act.name}</span>
                    </div>
                    <div className="h-px flex-1 bg-paper-300" />
                  </div>
                )}
                <div className="space-y-3">
                  {act.beats.map((beat) => (
                    <BeatCardComponent
                      key={beat.id}
                      beat={beat}
                      order={beat.order}
                      actName={actsWithBeats.length > 1 ? undefined : undefined}
                      onDragStart={handleDragStart}
                      onDragOver={(e) => handleDragOverBeat(e, beat.id)}
                      onDrop={(e) => handleDrop(e, beat.id)}
                      isDragging={draggingBeatId === beat.id}
                      isDragOver={dragOverBeatId === beat.id}
                      characters={projectCharacters}
                      plotPoints={projectPlotPoints}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div
              className="border-2 border-dashed border-paper-300 rounded-xl p-6 text-center cursor-pointer hover:border-gold-400 hover:bg-gold-50/30 transition-colors"
              onClick={handleAddBeat}
              onDragOver={handleDragOver}
            >
              <Plus className="w-8 h-8 text-ink-400 mx-auto mb-2" />
              <p className="text-sm text-ink-500">点击添加新节拍</p>
            </div>
          </div>
        )}
      </div>

      {showTemplateSelector && (
        <StructureTemplateSelector
          chapterId={chapterId}
          currentStructure={outline?.structureType}
          onClose={() => setShowTemplateSelector(false)}
          onApply={handleApplyTemplate}
        />
      )}
    </div>
  );
}
