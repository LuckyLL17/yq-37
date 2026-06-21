import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  PieChart,
  Target,
  Calendar,
  Flame,
  Loader2,
} from 'lucide-react';
import { api } from '@/services/api';
import type { DashboardData, DashboardChapterRadar } from '@shared/types';

export default function WritingDashboard() {
  const { projectId } = useParams<{ projectId: string }>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapterIndex, setSelectedChapterIndex] = useState(0);

  const fetchDashboard = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await api.dashboard.get(projectId);
      setData(res);
    } catch (e) {
      console.error('Failed to fetch dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-gold-500 animate-spin mx-auto mb-3" />
          <p className="text-ink-500 font-serif">正在加载写作数据…</p>
        </div>
      </div>
    );
  }

  const { totalWords, authorCount, avgWordsPerDay, writingDays, monthlyWords, authorContributions, heatmap, chapterRadars } = data;

  const maxMonthlyWords = Math.max(...monthlyWords.map(d => d.words), 1);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-paper-100';
    if (count === 1) return 'bg-gold-100';
    if (count === 2) return 'bg-gold-200';
    if (count === 3) return 'bg-gold-300';
    if (count <= 5) return 'bg-gold-400';
    return 'bg-gold-500';
  };

  const pieColors = ['#d4af37', '#486581', '#627d98', '#829ab1', '#9fb3c8'];

  const totalAuthorWords = authorContributions.reduce((s, a) => s + a.words, 0);

  const calculatePieSlices = () => {
    let currentAngle = 0;
    return authorContributions.map((item, index) => {
      const percentage = totalAuthorWords > 0 ? item.words / totalAuthorWords : 0;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      currentAngle += angle;

      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (startAngle + angle - 90) * (Math.PI / 180);

      const x1 = 100 + 80 * Math.cos(startRad);
      const y1 = 100 + 80 * Math.sin(startRad);
      const x2 = 100 + 80 * Math.cos(endRad);
      const y2 = 100 + 80 * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;
      const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return { ...item, percentage, color: pieColors[index % pieColors.length], pathData };
    });
  };

  const pieSlices = calculatePieSlices();

  const heatmapGrid = (() => {
    const grid: number[][] = [];
    for (let d = 0; d < 7; d++) {
      const row: number[] = [];
      for (let h = 0; h < 24; h++) {
        const cell = heatmap.find(c => c.day === d && c.hour === h);
        row.push(cell ? cell.count : 0);
      }
      grid.push(row);
    }
    return grid;
  })();

  const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  const radarLabels = ['完成度', '情节推进', '人物刻画', '描写功力', '对话质量'];

  const selectedRadar: DashboardChapterRadar | undefined = chapterRadars[selectedChapterIndex];

  const calculateRadarPoints = (values: number[], size: number = 160) => {
    const center = size / 2;
    const radius = size * 0.38;
    return values.map((value, index) => {
      const angle = (index * 2 * Math.PI) / values.length - Math.PI / 2;
      const r = (value / 100) * radius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return { x, y, value };
    });
  };

  const radarValues = selectedRadar
    ? [selectedRadar.completion, selectedRadar.plotProgress, selectedRadar.characterDepth, selectedRadar.description, selectedRadar.dialogue]
    : [];

  const radarPoints = calculateRadarPoints(radarValues);

  const getRadarGridPoints = (level: number, size: number = 160) => {
    const center = size / 2;
    const radius = (size * 0.38 * level) / 4;
    return radarLabels.map((_, index) => {
      const angle = (index * 2 * Math.PI) / radarLabels.length - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  const getRadarLabelPositions = (size: number = 160) => {
    const center = size / 2;
    const radius = size * 0.48;
    return radarLabels.map((label, index) => {
      const angle = (index * 2 * Math.PI) / radarLabels.length - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { label, x, y };
    });
  };

  const radarLabelPositions = getRadarLabelPositions();

  return (
    <div className="space-y-6">
      <div className="card p-6 relative overflow-hidden grain-overlay">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-gold opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-ink-900" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-ink-800">写作数据盘</h1>
              <p className="text-sm text-ink-500">全方位洞察你的创作历程</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-ink-800">{totalWords.toLocaleString()}</div>
              <div className="text-sm text-ink-500">总字数</div>
            </div>
          </div>
        </div>
        <div className="card p-4 card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-ink-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-ink-800">{authorCount}</div>
              <div className="text-sm text-ink-500">参与作者</div>
            </div>
          </div>
        </div>
        <div className="card p-4 card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-ink-800">{avgWordsPerDay.toLocaleString()}</div>
              <div className="text-sm text-ink-500">日均字数</div>
            </div>
          </div>
        </div>
        <div className="card p-4 card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brick-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-brick-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-ink-800">{writingDays}</div>
              <div className="text-sm text-ink-500">创作天数</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-lg font-bold text-ink-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold-500" />
              月字数变化趋势
            </h2>
            <span className="text-sm text-ink-500">近6个月</span>
          </div>

          {monthlyWords.every(d => d.words === 0) ? (
            <div className="h-64 flex items-center justify-center text-ink-400">
              <div className="text-center">
                <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>暂无字数趋势数据</p>
                <p className="text-sm mt-1">开始编辑章节后将自动生成</p>
              </div>
            </div>
          ) : (
            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#d4af37" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1="40"
                    y1={20 + i * 40}
                    x2="580"
                    y2={20 + i * 40}
                    stroke="#e5ddd0"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                ))}

                {(() => {
                  const points = monthlyWords.map((d, i) => {
                    const x = 40 + (i * 540) / (monthlyWords.length - 1);
                    const y = 180 - (d.words / maxMonthlyWords) * 160;
                    return { x, y, ...d };
                  });

                  const areaPath = `M 40 180 L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} 180 Z`;
                  const linePath = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;

                  return (
                    <>
                      <path d={areaPath} fill="url(#lineGradient)" />
                      <path d={linePath} fill="none" stroke="#d4af37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      {points.map((point, index) => (
                        <g key={index}>
                          <circle cx={point.x} cy={point.y} r="6" fill="#fdfcfa" stroke="#d4af37" strokeWidth="3" />
                          <circle cx={point.x} cy={point.y} r="3" fill="#d4af37" />
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>

              <div className="absolute bottom-0 left-10 right-5 flex justify-between">
                {monthlyWords.map((d, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xs font-medium text-ink-600">{d.month}</div>
                    <div className="text-xs text-ink-400">{d.words > 0 ? (d.words / 1000).toFixed(1) + 'k' : '0'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-gold-500" />
            <h2 className="font-serif text-lg font-bold text-ink-800">作者贡献占比</h2>
          </div>

          {authorContributions.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-ink-400">
              <div className="text-center">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>暂无贡献数据</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <svg viewBox="0 0 200 200" className="w-48 h-48">
                  {pieSlices.map((slice, index) => (
                    <path
                      key={index}
                      d={slice.pathData}
                      fill={slice.color}
                      className="transition-opacity hover:opacity-80 cursor-pointer"
                      style={{ transformOrigin: 'center' }}
                    />
                  ))}
                  <circle cx="100" cy="100" r="50" fill="#fdfcfa" />
                  <text x="100" y="95" textAnchor="middle" className="text-2xl font-bold" fill="#1e3a5f">
                    {totalAuthorWords.toLocaleString()}
                  </text>
                  <text x="100" y="115" textAnchor="middle" className="text-xs" fill="#627d98">
                    总贡献字
                  </text>
                </svg>
              </div>

              <div className="space-y-3">
                {pieSlices.slice(0, 5).map((slice, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-ink-700 truncate">{slice.username}</span>
                        <span className="text-sm text-ink-500">{slice.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-paper-200 rounded-full mt-1">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${slice.percentage}%`, backgroundColor: slice.color }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-lg font-bold text-ink-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold-500" />
              创作时段热力图
            </h2>
            <span className="text-sm text-ink-500">按星期和时段统计</span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="flex mb-2">
                <div className="w-14 flex-shrink-0" />
                <div className="flex-1 flex justify-between">
                  {[0, 6, 12, 18, 23].map(h => (
                    <span key={h} className="text-xs text-ink-400 w-10 text-center">{h}:00</span>
                  ))}
                </div>
              </div>

              {dayLabels.map((day, dayIndex) => (
                <div key={dayIndex} className="flex items-center mb-1">
                  <div className="w-14 flex-shrink-0 text-sm text-ink-500">{day}</div>
                  <div className="flex-1 flex gap-0.5">
                    {heatmapGrid[dayIndex].map((count, hourIndex) => (
                      <div
                        key={hourIndex}
                        className={`flex-1 h-6 rounded-sm ${getHeatmapColor(count)} hover:ring-2 hover:ring-gold-400 transition-all cursor-pointer`}
                        title={`${day} ${hourIndex}:00 - 创作 ${count} 次`}
                      />
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-end gap-2 mt-4">
                <span className="text-xs text-ink-400">少</span>
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 5, 6].map(level => (
                    <div
                      key={level}
                      className={`w-4 h-4 rounded-sm ${getHeatmapColor(level)}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-ink-400">多</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-gold-500" />
            <h2 className="font-serif text-lg font-bold text-ink-800">章节完成度雷达</h2>
          </div>

          {chapterRadars.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-ink-400">
              <div className="text-center">
                <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>暂无章节数据</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <svg viewBox="0 0 160 160" className="w-48 h-48">
                  {[1, 2, 3, 4].map(level => (
                    <polygon
                      key={level}
                      points={getRadarGridPoints(level)}
                      fill="none"
                      stroke="#e5ddd0"
                      strokeWidth="1"
                    />
                  ))}

                  {radarLabels.map((_, index) => {
                    const angle = (index * 2 * Math.PI) / radarLabels.length - Math.PI / 2;
                    const x = 80 + 61 * Math.cos(angle);
                    const y = 80 + 61 * Math.sin(angle);
                    return (
                      <line
                        key={index}
                        x1="80"
                        y1="80"
                        x2={x}
                        y2={y}
                        stroke="#e5ddd0"
                        strokeWidth="1"
                      />
                    );
                  })}

                  <polygon
                    points={radarPoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="rgba(212, 175, 55, 0.3)"
                    stroke="#d4af37"
                    strokeWidth="2"
                  />

                  {radarPoints.map((point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#d4af37"
                      stroke="#fdfcfa"
                      strokeWidth="2"
                    />
                  ))}

                  {radarLabelPositions.map((item, index) => (
                    <text
                      key={index}
                      x={item.x}
                      y={item.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs"
                      fill="#486581"
                    >
                      {item.label}
                    </text>
                  ))}
                </svg>
              </div>

              <div className="space-y-2">
                {chapterRadars.map((chapter, index) => (
                  <div
                    key={chapter.chapterId}
                    onClick={() => setSelectedChapterIndex(index)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      index === selectedChapterIndex
                        ? 'bg-gold-50 border-gold-300 shadow-paper'
                        : 'bg-paper-50 border-paper-200 hover:border-gold-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-ink-700 truncate">{chapter.chapterTitle}</span>
                      <span className="text-xs text-gold-600 font-medium">{chapter.completion}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-paper-200 rounded-full">
                      <div
                        className="h-full bg-gradient-gold rounded-full"
                        style={{ width: `${chapter.completion}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
