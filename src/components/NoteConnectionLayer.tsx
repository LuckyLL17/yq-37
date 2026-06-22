import React, { useMemo, useCallback } from 'react';
import { X, Edit3 } from 'lucide-react';
import type { NoteConnection, NoteConnectionRecommendation, StickyNote } from '@shared/types';

interface NoteConnectionLayerProps {
  notes: StickyNote[];
  connections: NoteConnection[];
  recommendations: NoteConnectionRecommendation[];
  notePositions: Record<string, { x: number; y: number }>;
  tempConnection?: {
    sourceNoteId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null;
  showRecommendations?: boolean;
  onConnectionClick?: (connection: NoteConnection) => void;
  onConnectionDelete?: (connectionId: string) => void;
  onRecommendationAccept?: (recommendation: NoteConnectionRecommendation) => void;
  onRecommendationDismiss?: (recommendation: NoteConnectionRecommendation) => void;
}

const connectionTypeConfig: Record<string, { name: string; dashPattern?: string }> = {
  causal: { name: '因果' },
  reference: { name: '引用' },
  extension: { name: '延伸' },
  contrast: { name: '对比' },
  inspiration: { name: '启发' },
  other: { name: '其他' },
};

export default function NoteConnectionLayer({
  notes,
  connections,
  recommendations,
  notePositions,
  tempConnection,
  showRecommendations = true,
  onConnectionClick,
  onConnectionDelete,
  onRecommendationAccept,
  onRecommendationDismiss,
}: NoteConnectionLayerProps) {
  const getNoteCenter = useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return { x: 0, y: 0 };
    
    const pos = notePositions[noteId] || { x: note.positionX, y: note.positionY };
    return {
      x: pos.x + note.width / 2,
      y: pos.y + note.height / 2,
    };
  }, [notes, notePositions]);

  const getNoteEdgePoint = useCallback((noteId: string, targetX: number, targetY: number) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return { x: 0, y: 0 };
    
    const pos = notePositions[noteId] || { x: note.positionX, y: note.positionY };
    const centerX = pos.x + note.width / 2;
    const centerY = pos.y + note.height / 2;
    
    const dx = targetX - centerX;
    const dy = targetY - centerY;
    
    if (dx === 0 && dy === 0) return { x: centerX, y: centerY };
    
    const halfW = note.width / 2;
    const halfH = note.height / 2;
    
    const scale = Math.min(
      Math.abs(halfW / dx),
      Math.abs(halfH / dy)
    );
    
    return {
      x: centerX + dx * scale,
      y: centerY + dy * scale,
    };
  }, [notes, notePositions]);

  const createCurvePath = useCallback((x1: number, y1: number, x2: number, y2: number) => {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const controlOffset = Math.min(dx, dy) * 0.5 + 30;
    
    const cx1 = x1 + (x2 > x1 ? controlOffset : -controlOffset);
    const cy1 = y1;
    const cx2 = x2 - (x2 > x1 ? controlOffset : -controlOffset);
    const cy2 = y2;
    
    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  }, []);

  const renderConnection = useCallback((connection: NoteConnection) => {
    const sourceCenter = getNoteCenter(connection.sourceNoteId);
    const targetCenter = getNoteCenter(connection.targetNoteId);
    
    if (sourceCenter.x === 0 || targetCenter.x === 0) return null;
    
    const start = getNoteEdgePoint(connection.sourceNoteId, targetCenter.x, targetCenter.y);
    const end = getNoteEdgePoint(connection.targetNoteId, sourceCenter.x, sourceCenter.y);
    
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    const path = createCurvePath(start.x, start.y, end.x, end.y);
    const color = connection.color || '#6b7280';
    
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const arrowLength = 12;
    const arrowAngle = Math.PI / 6;
    
    const arrow1 = {
      x: end.x - arrowLength * Math.cos(angle - arrowAngle),
      y: end.y - arrowLength * Math.sin(angle - arrowAngle),
    };
    const arrow2 = {
      x: end.x - arrowLength * Math.cos(angle + arrowAngle),
      y: end.y - arrowLength * Math.sin(angle + arrowAngle),
    };

    return (
      <g key={connection.id} className="group">
        <path
          d={path}
          stroke={color}
          strokeWidth="2"
          fill="none"
          className="transition-all duration-200 group-hover:stroke-width-3"
          style={{
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
          }}
        />
        
        <path
          d={`M ${end.x} ${end.y} L ${arrow1.x} ${arrow1.y} L ${arrow2.x} ${arrow2.y} Z`}
          fill={color}
          className="transition-all duration-200"
        />
        
        <g
          className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onConnectionClick?.(connection)}
        >
          <path
            d={path}
            stroke="transparent"
            strokeWidth="16"
            fill="none"
          />
        </g>
        
        {connection.label && (
          <g>
            <rect
              x={midX - 35}
              y={midY - 12}
              width="70"
              height="24"
              rx="12"
              fill="white"
              stroke={color}
              strokeWidth="1"
              className="drop-shadow-md"
            />
            <text
              x={midX}
              y={midY + 4}
              textAnchor="middle"
              className="text-xs font-medium"
              fill={color}
            >
              {connection.label || connectionTypeConfig[connection.type]?.name}
            </text>
          </g>
        )}
        
        <g
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onConnectionClick?.(connection);
          }}
        >
          <circle cx={midX} cy={midY} r="16" fill="white" stroke={color} strokeWidth="1" />
          <Edit3
            x={midX - 8}
            y={midY - 8}
            width="16"
            height="16"
            color={color}
          />
        </g>
        
        <g
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onConnectionDelete?.(connection.id);
          }}
        >
          <circle cx={midX + 20} cy={midY - 12} r="12" fill="#ef4444" />
          <X
            x={midX + 20 - 6}
            y={midY - 12 - 6}
            width="12"
            height="12"
            color="white"
          />
        </g>
      </g>
    );
  }, [getNoteCenter, getNoteEdgePoint, createCurvePath, onConnectionClick, onConnectionDelete]);

  const renderRecommendation = useCallback((recommendation: NoteConnectionRecommendation) => {
    const sourceCenter = getNoteCenter(recommendation.sourceNoteId);
    const targetCenter = getNoteCenter(recommendation.targetNoteId);
    
    if (sourceCenter.x === 0 || targetCenter.x === 0) return null;
    
    const start = getNoteEdgePoint(recommendation.sourceNoteId, targetCenter.x, targetCenter.y);
    const end = getNoteEdgePoint(recommendation.targetNoteId, sourceCenter.x, sourceCenter.y);
    
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    const path = createCurvePath(start.x, start.y, end.x, end.y);
    const color = '#9ca3af';

    return (
      <g key={`rec-${recommendation.sourceNoteId}-${recommendation.targetNoteId}`} className="group">
        <path
          d={path}
          stroke={color}
          strokeWidth="2"
          strokeDasharray="8,4"
          fill="none"
          className="transition-all duration-200"
          opacity="0.6"
        />
        
        <g className="cursor-pointer">
          <path
            d={path}
            stroke="transparent"
            strokeWidth="16"
            fill="none"
          />
        </g>
        
        <g className="opacity-0 group-hover:opacity-100 transition-opacity">
          <rect
            x={midX - 90}
            y={midY - 30}
            width="180"
            height="60"
            rx="8"
            fill="white"
            stroke="#d1d5db"
            strokeWidth="1"
            className="drop-shadow-lg"
          />
          <text
            x={midX}
            y={midY - 12}
            textAnchor="middle"
            className="text-xs font-medium"
            fill="#374151"
          >
            相似度: {Math.round(recommendation.similarity * 100)}%
          </text>
          <text
            x={midX}
            y={midY + 4}
            textAnchor="middle"
            className="text-xs"
            fill="#6b7280"
          >
            {connectionTypeConfig[recommendation.suggestedType]?.name}关系
          </text>
          <g
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onRecommendationAccept?.(recommendation);
            }}
          >
            <rect
              x={midX - 80}
              y={midY + 12}
              width="70"
              height="22"
              rx="4"
              fill="#10b981"
            />
            <text
              x={midX - 45}
              y={midY + 27}
              textAnchor="middle"
              className="text-xs font-medium"
              fill="white"
            >
              添加
            </text>
          </g>
          <g
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onRecommendationDismiss?.(recommendation);
            }}
          >
            <rect
              x={midX + 10}
              y={midY + 12}
              width="70"
              height="22"
              rx="4"
              fill="#e5e7eb"
            />
            <text
              x={midX + 45}
              y={midY + 27}
              textAnchor="middle"
              className="text-xs font-medium"
              fill="#6b7280"
            >
              忽略
            </text>
          </g>
        </g>
      </g>
    );
  }, [getNoteCenter, getNoteEdgePoint, createCurvePath, onRecommendationAccept, onRecommendationDismiss]);

  const renderTempConnection = useCallback(() => {
    if (!tempConnection) return null;
    
    const start = getNoteEdgePoint(tempConnection.sourceNoteId, tempConnection.currentX, tempConnection.currentY);
    const path = createCurvePath(start.x, start.y, tempConnection.currentX, tempConnection.currentY);
    
    return (
      <g>
        <path
          d={path}
          stroke="#3b82f6"
          strokeWidth="3"
          strokeDasharray="6,3"
          fill="none"
          className="animate-pulse"
        />
        <circle
          cx={tempConnection.currentX}
          cy={tempConnection.currentY}
          r="8"
          fill="#3b82f6"
          className="animate-pulse"
        />
      </g>
    );
  }, [tempConnection, getNoteEdgePoint, createCurvePath]);

  const bounds = useMemo(() => {
    if (notes.length === 0) return { width: 2000, height: 1000 };
    
    let maxX = 1200;
    let maxY = 800;
    
    notes.forEach(note => {
      const pos = notePositions[note.id] || { x: note.positionX, y: note.positionY };
      maxX = Math.max(maxX, pos.x + note.width + 100);
      maxY = Math.max(maxY, pos.y + note.height + 100);
    });
    
    return { width: maxX, height: maxY };
  }, [notes, notePositions]);

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      width={bounds.width}
      height={bounds.height}
      style={{ minWidth: '1200px', minHeight: '800px' }}
    >
      <defs>
        <filter id="connection-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.3" />
        </filter>
      </defs>
      
      <g className="pointer-events-auto">
        {showRecommendations && recommendations.map(renderRecommendation)}
      </g>
      
      <g className="pointer-events-auto">
        {connections.map(renderConnection)}
      </g>
      
      <g className="pointer-events-none">
        {renderTempConnection()}
      </g>
    </svg>
  );
}
