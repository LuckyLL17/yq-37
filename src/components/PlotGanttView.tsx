import { Sparkles, Flame, Target, Flag, Clock, Eye, CheckCircle2, BarChart3, Edit3 } from 'lucide-react';
import type { PlotPoint, PlotPointType, PlotPointStatus, Chapter } from '@shared/types';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface PlotGanttViewProps {
  plotPoints: PlotPoint[];
  chapters: Chapter[];
  onEdit: (plotPoint: PlotPoint) => void;
}

const typeConfig: Record<PlotPointType, { label: string; icon: LucideIcon; color: string; bgColor: string; barColor: string }> = {
  foreshadow: { label: '伏笔', icon: Sparkles, color: 'text-purple-600', bgColor: 'bg-purple-100', barColor: 'bg-purple-500' },
  climax: { label: '高潮', icon: Flame, color: 'text-orange-600', bgColor: 'bg-orange-100', barColor: 'bg-orange-500' },
  turning: { label: '转折', icon: Target, color: 'text-blue-600', bgColor: 'bg-blue-100', barColor: 'bg-blue-500' },
  ending: { label: '结局', icon: Flag, color: 'text-green-600', bgColor: 'bg-green-100', barColor: 'bg-green-500' },
};

const statusConfig: Record<PlotPointStatus, { label: string; icon: LucideIcon; color: string }> = {
  pending: { label: '待回收', icon: Clock, color: 'text-ink-600' },
  active: { label: '进行中', icon: Eye, color: 'text-amber-600' },
  resolved: { label: '已回收', icon: CheckCircle2, color: 'text-green-600' },
};

export default function PlotGanttView({ plotPoints, chapters, onEdit }: PlotGanttViewProps) {
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);

  const getChapterRange = (plot: PlotPoint) => {
    if (plot.relatedChapterIds.length === 0) return null;

    const relatedChapters = sortedChapters.filter(c => plot.relatedChapterIds.includes(c.id));
    if (relatedChapters.length === 0) return null;

    const minOrder = Math.min(...relatedChapters.map(c => c.order));
    const maxOrder = Math.max(...relatedChapters.map(c => c.order));

    return { minOrder, maxOrder, startIndex: minOrder - 1, endIndex: maxOrder - 1 };
  };

  const sortedPlots = [...plotPoints].sort((a, b) => {
    const rangeA = getChapterRange(a);
    const rangeB = getChapterRange(b);
    if (!rangeA && !rangeB) return 0;
    if (!rangeA) return 1;
    if (!rangeB) return -1;
    return rangeA.minOrder - rangeB.minOrder;
  });

  const totalChapters = sortedChapters.length;

  if (plotPoints.length === 0) {
    return (
      <div className="card p-12 text-center">
        <BarChart3 className="w-16 h-16 text-ink-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-ink-600 mb-2">暂无情节点</h3>
        <p className="text-ink-400">点击上方按钮添加新的情节点</p>
      </div>
    );
  }

  return (
    <div className="card p-6 overflow-x-auto">
      <h3 className="font-serif text-lg font-bold text-ink-800 mb-6 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-gold-500" />
        甘特图视图
        <span className="text-sm font-normal text-ink-400 ml-2">展示每个情节点覆盖的章节范围</span>
      </h3>

      {sortedChapters.length === 0 ? (
        <div className="text-center py-12 text-ink-400">
          暂无章节数据，无法展示甘特图
        </div>
      ) : (
        <div className="min-w-[600px]">
          <div className="flex border-b border-paper-200 pb-3 mb-4">
            <div className="w-48 flex-shrink-0 text-sm font-medium text-ink-500 pl-2">
              情节点
            </div>
            <div className="flex-1 flex">
              {sortedChapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="flex-1 text-center text-xs text-ink-400 truncate px-1"
                  title={chapter.title}
                >
                  第{chapter.order}章
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {sortedPlots.map((plot, index) => {
              const typeInfo = typeConfig[plot.type];
              const statusInfo = statusConfig[plot.status];
              const TypeIcon = typeInfo.icon;
              const range = getChapterRange(plot);

              const barStyle = range
                ? {
                    left: `${(range.startIndex / totalChapters) * 100}%`,
                    width: `${((range.endIndex - range.startIndex + 1) / totalChapters) * 100}%`,
                  }
                : { left: '0', width: '100%' };

              return (
                <div
                  key={plot.id}
                  className={cn(
                    'flex items-center group relative',
                    'animate-fade-in-up'
                  )}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="w-48 flex-shrink-0 pr-3">
                    <div
                      className="flex items-center gap-2 cursor-pointer hover:bg-paper-50 p-2 rounded-lg transition-colors"
                      onClick={() => onEdit(plot)}
                    >
                      <span className={cn('p-1.5 rounded', typeInfo.bgColor)}>
                        <TypeIcon className={cn('w-3.5 h-3.5', typeInfo.color)} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-700 truncate">
                          {plot.title}
                        </p>
                        <p className={cn('text-xs', statusInfo.color)}>
                          {statusInfo.label}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 relative h-10 bg-paper-50 rounded-lg">
                    {range ? (
                      <div
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 h-7 rounded-lg cursor-pointer',
                          'transition-all hover:h-8 hover:shadow-md',
                          typeInfo.barColor,
                          'opacity-80 hover:opacity-100'
                        )}
                        style={barStyle}
                        onClick={() => onEdit(plot)}
                      >
                        <div className="absolute inset-0 flex items-center justify-center px-2">
                          <span className="text-xs text-white font-medium truncate">
                            {plot.title}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-paper-100 rounded-lg transition-colors"
                        onClick={() => onEdit(plot)}
                      >
                        <span className="text-xs text-ink-400 italic">未关联章节</span>
                      </div>
                    )}

                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/50 transition-all z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(plot);
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-paper-200">
            <span className="text-sm text-ink-500">图例：</span>
            {Object.entries(typeConfig).map(([type, config]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className={cn('w-3 h-3 rounded', config.barColor)} />
                <span className="text-xs text-ink-600">{config.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
