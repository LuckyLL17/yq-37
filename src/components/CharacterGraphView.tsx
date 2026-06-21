import { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RefreshCw, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Character, CharacterRelation } from '@shared/types';

interface GraphNode {
  id: string;
  character: Character;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: CharacterRelation;
}

const RELATION_COLORS: Record<string, { color: string; label: string }> = {
  '恋人': { color: '#f05252', label: '恋人' },
  '上下级': { color: '#d4af37', label: '上下级' },
  '敌对': { color: '#e02424', label: '敌对' },
  '朋友': { color: '#48bb78', label: '朋友' },
  '师徒': { color: '#805ad5', label: '师徒' },
  '家人': { color: '#ed8936', label: '家人' },
  '同事': { color: '#4299e1', label: '同事' },
};

const DEFAULT_COLOR = '#627d98';
const NODE_RADIUS = 36;
const AVATAR_RADIUS = 30;

function getRelationColor(type: string): string {
  return RELATION_COLORS[type]?.color || DEFAULT_COLOR;
}

function getRelationLabel(type: string): string {
  return RELATION_COLORS[type]?.label || type;
}

interface CharacterGraphViewProps {
  characters: Character[];
  onSelectCharacter: (character: Character) => void;
  selectedCharacterId?: string;
}

export default function CharacterGraphView({
  characters,
  onSelectCharacter,
  selectedCharacterId,
}: CharacterGraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const animationRef = useRef<number>();
  const draggingRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  const uniqueRelationTypes = Array.from(
    new Set(characters.flatMap(c => c.relationships.map(r => r.type)))
  );

  const initializeGraph = useCallback(() => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    const nodes: GraphNode[] = characters.map((char, i) => {
      const angle = (i / characters.length) * Math.PI * 2;
      const radius = Math.min(dimensions.width, dimensions.height) / 3.5;
      return {
        id: char.id,
        character: char,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: NODE_RADIUS,
      };
    });

    const edgeSet = new Set<string>();
    const edges: GraphEdge[] = [];

    characters.forEach(char => {
      char.relationships.forEach(rel => {
        const keyParts = [char.id, rel.targetId].sort();
        const key = `${keyParts[0]}-${keyParts[1]}-${rel.type}`;
        if (!edgeSet.has(key) && characters.find(c => c.id === rel.targetId)) {
          edgeSet.add(key);
          edges.push({
            id: rel.id,
            source: char.id,
            target: rel.targetId,
            relation: rel,
          });
        }
      });
    });

    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [characters, dimensions]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    initializeGraph();
  }, [initializeGraph]);

  useEffect(() => {
    const nodes = nodesRef.current;
    const edges = edgesRef.current;

    if (nodes.length === 0) return;

    const width = dimensions.width;
    const height = dimensions.height;

    const simulate = () => {
      const centerX = width / 2;
      const centerY = height / 2;

      nodes.forEach(node => {
        if (draggingRef.current?.id === node.id) return;

        node.vx += (centerX - node.x) * 0.0005;
        node.vy += (centerY - node.y) * 0.0005;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const distSq = dx * dx + dy * dy;
          const minDist = NODE_RADIUS * 2.5;

          if (distSq < minDist * minDist && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const force = (minDist - dist) / dist * 0.8;
            const fx = dx * force;
            const fy = dy * force;

            if (draggingRef.current?.id !== nodes[i].id) {
              nodes[i].vx -= fx;
              nodes[i].vy -= fy;
            }
            if (draggingRef.current?.id !== nodes[j].id) {
              nodes[j].vx += fx;
              nodes[j].vy += fy;
            }
          }
        }
      }

      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 180;
        const force = (dist - targetDist) * 0.003;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (draggingRef.current?.id !== source.id) {
          source.vx += fx;
          source.vy += fy;
        }
        if (draggingRef.current?.id !== target.id) {
          target.vx -= fx;
          target.vy -= fy;
        }
      });

      nodes.forEach(node => {
        if (draggingRef.current?.id === node.id) return;

        node.vx *= 0.85;
        node.vy *= 0.85;
        node.x += node.vx;
        node.y += node.vy;

        const padding = NODE_RADIUS + 20;
        node.x = Math.max(padding, Math.min(width - padding, node.x));
        node.y = Math.max(padding, Math.min(height - padding, node.y));
      });

      const svg = svgRef.current;
      if (!svg) return;

      svg.querySelectorAll('[data-edge]').forEach((el) => {
        const edgeEl = el as SVGLineElement;
        const edgeId = edgeEl.getAttribute('data-edge');
        const edge = edges.find(e => e.id === edgeId);
        if (!edge) return;
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return;
        edgeEl.setAttribute('x1', String(source.x));
        edgeEl.setAttribute('y1', String(source.y));
        edgeEl.setAttribute('x2', String(target.x));
        edgeEl.setAttribute('y2', String(target.y));
      });

      svg.querySelectorAll('[data-node]').forEach((el) => {
        const nodeEl = el as SVGGElement;
        const nodeId = nodeEl.getAttribute('data-node');
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        nodeEl.setAttribute('transform', `translate(${node.x}, ${node.y})`);
      });

      svg.querySelectorAll('[data-edgelabel]').forEach((el) => {
        const labelEl = el as SVGTextElement;
        const edgeId = labelEl.getAttribute('data-edgelabel');
        const edge = edges.find(e => e.id === edgeId);
        if (!edge) return;
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return;
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2;
        labelEl.setAttribute('x', String(midX));
        labelEl.setAttribute('y', String(midY));
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, characters.length]);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const svgX = (e.clientX - rect.left - transform.x) / transform.scale;
    const svgY = (e.clientY - rect.top - transform.y) / transform.scale;

    draggingRef.current = {
      id: nodeId,
      offsetX: svgX - node.x,
      offsetY: svgY - node.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const svgX = (e.clientX - rect.left - transform.x) / transform.scale;
    const svgY = (e.clientY - rect.top - transform.y) / transform.scale;

    const node = nodesRef.current.find(n => n.id === draggingRef.current!.id);
    if (!node) return;

    node.x = svgX - draggingRef.current.offsetX;
    node.y = svgY - draggingRef.current.offsetY;
    node.vx = 0;
    node.vy = 0;
  };

  const handleMouseUp = () => {
    draggingRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.3, Math.min(3, prev.scale * delta)),
    }));
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
    initializeGraph();
  };

  const zoomIn = () => {
    setTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }));
  };

  const zoomOut = () => {
    setTransform(prev => ({ ...prev, scale: Math.max(0.3, prev.scale / 1.2) }));
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-paper-50 rounded-xl border border-paper-200 overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="p-2 bg-white border border-paper-200 rounded-lg shadow-sm hover:bg-paper-50 transition-colors"
          title="放大"
        >
          <ZoomIn className="w-4 h-4 text-ink-600" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 bg-white border border-paper-200 rounded-lg shadow-sm hover:bg-paper-50 transition-colors"
          title="缩小"
        >
          <ZoomOut className="w-4 h-4 text-ink-600" />
        </button>
        <button
          onClick={resetView}
          className="p-2 bg-white border border-paper-200 rounded-lg shadow-sm hover:bg-paper-50 transition-colors"
          title="重置视图"
        >
          <RefreshCw className="w-4 h-4 text-ink-600" />
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl border border-paper-200 shadow-sm p-3 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-ink-500" />
          <span className="text-sm font-medium text-ink-700">关系图例</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {uniqueRelationTypes.map(type => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getRelationColor(type) }}
              />
              <span className="text-xs text-ink-600">{getRelationLabel(type)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 z-10 text-xs text-ink-400 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-paper-100">
        拖拽节点可调整位置 · 滚轮缩放 · 点击节点查看详情
      </div>

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5ddd0" strokeWidth="0.5" />
          </pattern>
          <clipPath id="avatar-clip">
            <circle r={AVATAR_RADIUS} />
          </clipPath>
          <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#1e3a5f" floodOpacity="0.15" />
          </filter>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          <rect
            x={-dimensions.width}
            y={-dimensions.height}
            width={dimensions.width * 3}
            height={dimensions.height * 3}
            fill="url(#grid)"
          />

          {edgesRef.current.map(edge => {
            const source = nodesRef.current.find(n => n.id === edge.source);
            const target = nodesRef.current.find(n => n.id === edge.target);
            if (!source || !target) return null;

            const isHighlighted =
              (selectedCharacterId && (edge.source === selectedCharacterId || edge.target === selectedCharacterId)) ||
              hoveredEdge === edge.id ||
              (hoveredNode && (edge.source === hoveredNode || edge.target === hoveredNode));

            const isDimmed =
              (selectedCharacterId && edge.source !== selectedCharacterId && edge.target !== selectedCharacterId) ||
              (hoveredNode && edge.source !== hoveredNode && edge.target !== hoveredNode);

            return (
              <g key={edge.id}>
                <line
                  data-edge={edge.id}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={getRelationColor(edge.relation.type)}
                  strokeWidth={isHighlighted ? 3 : 1.5}
                  strokeOpacity={isDimmed ? 0.15 : isHighlighted ? 1 : 0.6}
                  className="transition-all duration-200"
                  onMouseEnter={() => setHoveredEdge(edge.id)}
                  onMouseLeave={() => setHoveredEdge(null)}
                />
                {(isHighlighted || hoveredEdge === edge.id) && (
                  <text
                    data-edgelabel={edge.id}
                    x={(source.x + target.x) / 2}
                    y={(source.y + target.y) / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-medium pointer-events-none select-none"
                    fill={getRelationColor(edge.relation.type)}
                    style={{ paintOrder: 'stroke', stroke: '#fdfcfa', strokeWidth: 3 }}
                  >
                    {getRelationLabel(edge.relation.type)}
                  </text>
                )}
              </g>
            );
          })}

          {nodesRef.current.map(node => {
            const isSelected = selectedCharacterId === node.id;
            const isHovered = hoveredNode === node.id;
            const isConnected =
              selectedCharacterId &&
              edgesRef.current.some(
                e =>
                  (e.source === selectedCharacterId && e.target === node.id) ||
                  (e.target === selectedCharacterId && e.source === node.id)
              );
            const isDimmed = selectedCharacterId && !isSelected && !isConnected;

            return (
              <g
                key={node.id}
                data-node={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer"
                style={{
                  opacity: isDimmed ? 0.3 : 1,
                  transition: 'opacity 0.2s',
                }}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!draggingRef.current) {
                    onSelectCharacter(node.character);
                  }
                }}
              >
                <circle
                  r={NODE_RADIUS + (isSelected || isHovered ? 4 : 0)}
                  fill={isSelected ? '#d4af37' : isHovered ? '#f6db7d' : 'white'}
                  filter="url(#node-shadow)"
                  className="transition-all duration-200"
                />
                <circle
                  r={AVATAR_RADIUS}
                  fill="#f0ebe2"
                  stroke={isSelected ? '#d4af37' : '#e5ddd0'}
                  strokeWidth={isSelected ? 3 : 1}
                  className="transition-all duration-200"
                />
                <g clipPath="url(#avatar-clip)">
                  <image
                    href={
                      node.character.avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${node.character.id}`
                    }
                    x={-AVATAR_RADIUS}
                    y={-AVATAR_RADIUS}
                    width={AVATAR_RADIUS * 2}
                    height={AVATAR_RADIUS * 2}
                    preserveAspectRatio="xMidYMid slice"
                  />
                </g>
                <text
                  y={NODE_RADIUS + 18}
                  textAnchor="middle"
                  className={cn(
                    'font-medium pointer-events-none select-none transition-all duration-200',
                    isSelected ? 'fill-gold-700 text-base font-bold' : 'fill-ink-700 text-sm'
                  )}
                >
                  {node.character.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
