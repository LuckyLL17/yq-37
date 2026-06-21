import { useState } from 'react';
import {
  Layers,
  Sparkles,
  ChevronRight,
  Check,
  AlertTriangle,
  X,
} from 'lucide-react';
import type { NarrativeStructureType } from '@shared/types';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

interface StructureTemplateSelectorProps {
  chapterId: string;
  currentStructure?: NarrativeStructureType;
  onClose: () => void;
  onApply: (type: NarrativeStructureType) => void;
}

export default function StructureTemplateSelector({
  chapterId,
  currentStructure,
  onClose,
  onApply,
}: StructureTemplateSelectorProps) {
  const { structureTemplates, getBeatsForChapter } = useAppStore();
  const [selectedType, setSelectedType] = useState<NarrativeStructureType | null>(currentStructure || null);
  const [showConfirm, setShowConfirm] = useState(false);

  const existingBeats = getBeatsForChapter(chapterId);
  const hasExistingBeats = existingBeats.length > 0;

  const getTemplateIcon = (type: NarrativeStructureType) => {
    switch (type) {
      case 'three-act': return '🎬';
      case 'hero-journey': return '🗡️';
      case 'save-the-cat': return '🐱';
      case 'freytag': return '📐';
      case 'custom': return '✏️';
    }
  };

  const handleApply = () => {
    if (!selectedType) return;
    if (hasExistingBeats) {
      setShowConfirm(true);
    } else {
      onApply(selectedType);
      onClose();
    }
  };

  const confirmApply = () => {
    if (selectedType) {
      onApply(selectedType);
      onClose();
    }
  };

  const selectedTemplate = structureTemplates.find(t => t.type === selectedType);

  return (
    <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="card p-0 w-full max-w-2xl mx-4 animate-slide-in-right max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-paper-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
              <Layers className="w-5 h-5 text-ink-900" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-ink-800">选择叙事结构模板</h2>
              <p className="text-sm text-ink-500">为你的章节选择一个经典的叙事框架</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-paper-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-ink-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {structureTemplates.map((template) => (
              <button
                key={template.type}
                onClick={() => setSelectedType(template.type)}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all duration-200',
                  selectedType === template.type
                    ? 'border-gold-500 bg-gold-50 shadow-gold'
                    : 'border-paper-200 hover:border-gold-300 hover:bg-paper-100'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{getTemplateIcon(template.type)}</span>
                  {selectedType === template.type && (
                    <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="font-serif font-bold text-ink-800 mb-1">{template.name}</h3>
                <p className="text-xs text-ink-500 line-clamp-2">{template.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-2 py-0.5 bg-paper-200 rounded text-xs text-ink-600">
                    {template.acts.length} 幕
                  </span>
                  <span className="px-2 py-0.5 bg-paper-200 rounded text-xs text-ink-600">
                    {template.acts.reduce((sum, a) => sum + a.beats.length, 0)} 个节拍
                  </span>
                </div>
              </button>
            ))}
          </div>

          {selectedTemplate && (
            <div className="border border-paper-200 rounded-xl p-4 bg-paper-50">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-gold-500" />
                <h3 className="font-semibold text-ink-800">
                  {selectedTemplate.name} - 结构预览
                </h3>
              </div>
              <div className="space-y-4">
                {selectedTemplate.acts.map((act) => (
                  <div key={act.key}>
                    <div className="flex items-center gap-2 mb-2">
                      <ChevronRight className="w-4 h-4 text-gold-500" />
                      <span className="text-sm font-medium text-ink-700">{act.name}</span>
                    </div>
                    <p className="text-xs text-ink-500 mb-2 ml-6">{act.description}</p>
                    <div className="flex flex-wrap gap-2 ml-6">
                      {act.beats.map((beat) => (
                        <div
                          key={beat.key}
                          className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${beat.color}15`,
                            color: beat.color,
                          }}
                        >
                          {beat.name}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasExistingBeats && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">注意：已有 {existingBeats.length} 个节拍</p>
                <p className="text-xs text-amber-600 mt-1">
                  应用新模板将覆盖现有的所有节拍，此操作不可撤销。
                </p>
              </div>
            </div>
          )}
        </div>

        {showConfirm ? (
          <div className="p-6 border-t border-paper-200 bg-amber-50/50">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">确认覆盖现有节拍？</p>
                <p className="text-sm text-amber-600 mt-1">
                  应用 "{selectedTemplate?.name}" 模板将删除现有的 {existingBeats.length} 个节拍。
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={confirmApply}
                className="btn-gold flex-1"
              >
                确认覆盖
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 border-t border-paper-200 flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedType}
              className="btn-gold flex-1"
            >
              应用此模板
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
