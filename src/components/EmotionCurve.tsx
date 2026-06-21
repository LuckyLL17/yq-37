import { useState, useRef, useEffect, useCallback } from 'react';
import type { EmotionPoint } from '@shared/types';
import { cn } from '@/lib/utils';

interface EmotionCurveProps {
  points: EmotionPoint[];
  onChange?: (points: EmotionPoint[]) => void;
  readonly?: boolean;
  height?: number;
  width?: number;
  color?: string;
}

export default function EmotionCurve({
  points,
  onChange,
  readonly = false,
  height = 60,
  width = 200,
  color = '#d4af37',
}: EmotionCurveProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [localPoints, setLocalPoints] = useState<EmotionPoint[]>(points);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  useEffect(() => {
    setLocalPoints(points);
  }, [points]);

  const getSvgCoords = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    return { x, y };
  }, []);

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    if (readonly) return;
    e.preventDefault();
    setDraggingIndex(index);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingIndex === null || readonly) return;
    const coords = getSvgCoords(e.clientX, e.clientY);
    if (!coords) return;

    setLocalPoints(prev => {
      const newPoints = [...prev];
      newPoints[draggingIndex] = {
        position: coords.x,
        intensity: coords.y,
      };
      newPoints.sort((a, b) => a.position - b.position);
      return newPoints;
    });
  }, [draggingIndex, readonly, getSvgCoords]);

  const handleMouseUp = useCallback(() => {
    if (draggingIndex !== null) {
      onChange?.(localPoints);
      setDraggingIndex(null);
    }
  }, [draggingIndex, localPoints, onChange]);

  useEffect(() => {
    if (draggingIndex !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingIndex, handleMouseMove, handleMouseUp]);

  const sortedPoints = [...localPoints].sort((a, b) => a.position - b.position);

  const pathData = sortedPoints
    .map((p, i) => {
      const x = p.position * width;
      const y = (1 - p.intensity) * height;
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  const areaPathData = `M 0 ${height} ${sortedPoints
    .map(p => `L ${p.position * width} ${(1 - p.intensity) * height}`)
    .join(' ')} L ${width} ${height} Z`;

  const addPoint = (e: React.MouseEvent) => {
    if (readonly) return;
    const coords = getSvgCoords(e.clientX, e.clientY);
    if (!coords) return;
    const newPoints = [...localPoints, { position: coords.x, intensity: coords.y }]
      .sort((a, b) => a.position - b.position);
    setLocalPoints(newPoints);
    onChange?.(newPoints);
  };

  const removePoint = (index: number, e: React.MouseEvent) => {
    if (readonly || localPoints.length <= 2) return;
    e.stopPropagation();
    const newPoints = localPoints.filter((_, i) => i !== index);
    setLocalPoints(newPoints);
    onChange?.(newPoints);
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className={cn(readonly ? 'cursor-default' : 'cursor-crosshair')}
        onClick={addPoint}
      >
        <defs>
          <linearGradient id={`emotion-gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map(p => (
          <line
            key={p}
            x1={0}
            y1={p * height}
            x2={width}
            y2={p * height}
            stroke="#e5ddd0"
            strokeWidth={1}
            strokeDasharray="2,2"
          />
        ))}

        <path
          d={areaPathData}
          fill={`url(#emotion-gradient-${color.replace('#', '')})`}
        />

        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {sortedPoints.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.position * width}
              cy={(1 - p.intensity) * height}
              r={readonly ? 4 : 7}
              fill="white"
              stroke={color}
              strokeWidth={2}
              className={cn(
                !readonly && 'cursor-grab active:cursor-grabbing transition-transform hover:r-9',
                draggingIndex === i && 'r-9'
              )}
              onMouseDown={(e) => handleMouseDown(i, e)}
              onDoubleClick={(e) => removePoint(i, e)}
            />
          </g>
        ))}
      </svg>

      {!readonly && (
        <div className="flex justify-between text-[10px] text-ink-400 mt-1 px-1">
          <span>低张力</span>
          <span>高张力</span>
        </div>
      )}
    </div>
  );
}
