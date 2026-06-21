import { Sparkles, Flame, Target, Flag, Clock, Eye, CheckCircle2, Edit3 } from 'lucide-react';
import type { PlotPoint, PlotPointType, PlotPointStatus } from '@shared/types';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface PlotTimelineViewProps {
  plotPoints: PlotPoint[];
  onEdit: (plotPoint: PlotPoint) => void;
}

const typeConfig: Record<PlotPointType, { label: string; icon: LucideIcon; color: string; dotColor: string; lineColor: string }> = {
  foreshadow: { label: '伏笔', icon: Sparkles, color: 'text-purple-600', dotColor: 'bg-purple-500', lineColor: 'bg-purple-200' },
  climax: { label: '高潮', icon: Flame, color: 'text-orange-600', dotColor: 'bg-orange-500', lineColor: 'bg-orange-200' },
  turning: { label: '转折', icon: Target, color: 'text-blue-600', dotColor: 'bg-blue-500', lineColor: 'bg-blue-200' },
  ending: { label: '结局', icon: Flag, color: 'text-green-600', dotColor: 'bg-green-500', lineColor: 'bg-green-200' },
};

const statusConfig: Record<PlotPointStatus, { label: string; icon: LucideIcon; color: string }> = {
  pending: { label: '待回收', icon: Clock, color: 'text-ink-600' },
  active: { label: '进行中', icon: Eye, color: 'text-amber-600' },
  resolved: { label: '已回收', icon: CheckCircle2, color: 'text-green-600' },
};

export default function PlotTimelineView({ plotPoints, onEdit }: PlotTimelineViewProps) {
  const sortedPlots = [...plotPoints].sort((a, b) => {
    const posA = a.timelinePosition ?? 0;
    const posB = b.timelinePosition ?? 0;
    if (posA !== posB) return posA - posB;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  if (sortedPlots.length === 0) {
    return (
      <div className="card p-12 text-center">
        <Clock className="w-16 h-16 text-ink-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-ink-600 mb-2">暂无情节点</h3>
        <p className="text-ink-400">点击上方按钮添加新的情节点</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-serif text-lg font-bold text-ink-800 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-gold-500" />
        时间轴视图
        <span className="text-sm font-normal text-ink-400 ml-2">按小说内时间线排列</span>
      </h3>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-paper-200" />

        <div className="space-y-6">
          {sortedPlots.map((plot, index) => {
            const typeInfo = typeConfig[plot.type];
            const statusInfo = statusConfig[plot.status];
            const TypeIcon = typeInfo.icon;
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={plot.id}
                className={cn(
                  'relative pl-16 group',
                  'animate-fade-in-up'
                )}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className={cn(
                  'absolute left-4 w-5 h-5 rounded-full border-4 border-white shadow-md',
                  typeInfo.dotColor
                )} style={{ top: '1.25rem' }} />

                <div
                  className="card card-hover p-5 cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => onEdit(plot)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={cn('p-2 rounded-lg', typeInfo.color, 'bg-opacity-10')} style={{ backgroundColor: 'currentColor', opacity: 0.1 }}>
                        <TypeIcon className={cn('w-4 h-4', typeInfo.color)} />
                      </span>
                      <div>
                        <h4 className="font-serif text-base font-bold text-ink-800">
                          {plot.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={cn('text-xs font-medium', typeInfo.color)}>
                            {typeInfo.label}
                          </span>
                          <span className={cn('text-xs flex items-center gap-1', statusInfo.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                          {plot.timelinePosition !== undefined && (
                            <span className="text-xs text-ink-400">
                              位置 #{plot.timelinePosition}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-paper-100 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(plot);
                      }}
                    >
                      <Edit3 className="w-4 h-4 text-ink-400" />
                    </button>
                  </div>

                  <p className="text-sm text-ink-500 line-clamp-2 mb-3">
                    {plot.description}
                  </p>

                  {plot.relatedChapterIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {plot.relatedChapterIds.slice(0, 3).map((chapterId) => (
                        <span
                          key={chapterId}
                          className="px-2 py-0.5 bg-paper-100 text-ink-500 text-xs rounded"
                        >
                          第{chapterId.split('-')[1]}章
                        </span>
                      ))}
                      {plot.relatedChapterIds.length > 3 && (
                        <span className="px-2 py-0.5 bg-paper-100 text-ink-400 text-xs rounded">
                          +{plot.relatedChapterIds.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
