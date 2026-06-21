import { useEffect, useState } from 'react';
import { X, Sparkles, Flame, Target, Flag, Clock, Eye, CheckCircle2 } from 'lucide-react';
import type { PlotPoint, PlotPointType, PlotPointStatus, Chapter } from '@shared/types';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface PlotEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<PlotPoint>) => void;
  plotPoint?: PlotPoint | null;
  chapters: Chapter[];
  mode: 'create' | 'edit';
}

const typeConfig: Record<PlotPointType, { label: string; icon: LucideIcon; color: string; bgColor: string }> = {
  foreshadow: { label: '伏笔', icon: Sparkles, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  climax: { label: '高潮', icon: Flame, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  turning: { label: '转折', icon: Target, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  ending: { label: '结局', icon: Flag, color: 'text-green-600', bgColor: 'bg-green-100' },
};

const statusConfig: Record<PlotPointStatus, { label: string; icon: LucideIcon; color: string; bgColor: string }> = {
  pending: { label: '待回收', icon: Clock, color: 'text-ink-600', bgColor: 'bg-ink-100' },
  active: { label: '进行中', icon: Eye, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  resolved: { label: '已回收', icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100' },
};

export default function PlotEditModal({ isOpen, onClose, onSave, plotPoint, chapters, mode }: PlotEditModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'foreshadow' as PlotPointType,
    status: 'pending' as PlotPointStatus,
    relatedChapterIds: [] as string[],
    timelinePosition: 0,
  });

  useEffect(() => {
    if (plotPoint && mode === 'edit') {
      setFormData({
        title: plotPoint.title,
        description: plotPoint.description,
        type: plotPoint.type,
        status: plotPoint.status,
        relatedChapterIds: plotPoint.relatedChapterIds,
        timelinePosition: plotPoint.timelinePosition ?? 0,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'foreshadow',
        status: 'pending',
        relatedChapterIds: [],
        timelinePosition: 0,
      });
    }
  }, [plotPoint, mode, isOpen]);

  const handleSubmit = () => {
    if (!formData.title.trim()) return;
    onSave(formData);
    onClose();
  };

  const toggleChapter = (chapterId: string) => {
    setFormData(prev => ({
      ...prev,
      relatedChapterIds: prev.relatedChapterIds.includes(chapterId)
        ? prev.relatedChapterIds.filter(id => id !== chapterId)
        : [...prev.relatedChapterIds, chapterId],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="card p-6 w-full max-w-lg mx-4 animate-slide-in-right max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-bold text-ink-800">
            {mode === 'create' ? '添加情节' : '编辑情节'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-paper-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-ink-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              情节标题
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="如：神秘信号伏笔"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              情节描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="textarea h-24"
              placeholder="描述这个情节的内容和作用..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                类型
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PlotPointType })}
                className="input"
              >
                {Object.entries(typeConfig).map(([value, config]) => (
                  <option key={value} value={value}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                状态
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PlotPointStatus })}
                className="input"
              >
                {Object.entries(statusConfig).map(([value, config]) => (
                  <option key={value} value={value}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              时间轴位置
              <span className="text-ink-400 font-normal ml-2">（数值越小越靠前）</span>
            </label>
            <input
              type="number"
              value={formData.timelinePosition}
              onChange={(e) => setFormData({ ...formData, timelinePosition: Number(e.target.value) })}
              className="input"
              min={0}
              step={1}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">
              关联章节
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto scrollbar-thin p-2 border border-paper-200 rounded-lg">
              {chapters.length === 0 ? (
                <p className="text-sm text-ink-400 w-full text-center py-2">暂无章节</p>
              ) : (
                chapters.map((chapter) => (
                  <label
                    key={chapter.id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors text-sm',
                      formData.relatedChapterIds.includes(chapter.id)
                        ? 'bg-gold-100 text-gold-700'
                        : 'bg-paper-100 text-ink-700 hover:bg-paper-200'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formData.relatedChapterIds.includes(chapter.id)}
                      onChange={() => toggleChapter(chapter.id)}
                      className="sr-only"
                    />
                    <span>{chapter.title}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="btn-gold flex-1"
              disabled={!formData.title.trim()}
            >
              {mode === 'create' ? '创建情节' : '保存修改'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
