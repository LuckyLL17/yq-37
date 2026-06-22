import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  RotateCcw,
  GitCompare,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  GitBranch,
  Plus,
  Trash2,
  Merge,
  X,
  AlertTriangle,
  CheckCircle,
  Circle,
  History,
  Sparkles,
  ArrowRightLeft,
  Save,
  EyeOff,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { Diff, diff_match_patch } from 'diff-match-patch';
import type {
  ChapterBranch,
  ConflictBlock,
  MergeResult,
} from '@shared/types';

type TabType = 'versions' | 'branches';

export default function VersionHistory() {
  const { projectId, chapterId } = useParams<{ projectId: string; chapterId: string }>();
  const {
    chapters,
    getChapterVersions,
    getDiff,
    revertToVersion,
    currentUser,
    getChapterBranches,
    getMainBranch,
    createBranch,
    deleteBranch,
    getBranchVersions,
    mergeBranch,
    getBranchDiff,
    loadChapterBranches,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('branches');
  const chapter = chapters.find(c => c.id === chapterId);
  const versions = chapterId ? getChapterVersions(chapterId) : [];
  const branches = chapterId ? getChapterBranches(chapterId) : [];
  const mainBranch = chapterId ? getMainBranch(chapterId) : null;

  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [compareVersion, setCompareVersion] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [showRevertConfirm, setShowRevertConfirm] = useState<string | null>(null);

  const [showCreateBranchModal, setShowCreateBranchModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState<string | null>(null);
  const [showConflictResolver, setShowConflictResolver] = useState<{
    sourceBranchId: string;
    targetBranchId: string;
    conflicts: ConflictBlock[];
  } | null>(null);
  const [showDiffModal, setShowDiffModal] = useState<{
    branchAId: string;
    branchBId: string;
  } | null>(null);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [confirmDeleteBranch, setConfirmDeleteBranch] = useState<string | null>(null);

  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchDesc, setNewBranchDesc] = useState('');
  const [newBranchParentId, setNewBranchParentId] = useState<string | undefined>(undefined);
  const [newBranchColor, setNewBranchColor] = useState('#d4af37');

  const [isLoading, setIsLoading] = useState(false);
  const [diffResultData, setDiffResultData] = useState<{
    branchA?: ChapterBranch;
    branchB?: ChapterBranch;
    diffs?: Diff[];
    wordCountDelta?: number;
  } | null>(null);

  useEffect(() => {
    if (chapterId) {
      loadChapterBranches(chapterId);
    }
  }, [chapterId, loadChapterBranches]);

  const branchColors = ['#d4af37', '#7c3aed', '#059669', '#dc2626', '#2563eb', '#ea580c', '#0891b2'];

  const diffResult = useMemo((): Diff[] => {
    if (!selectedVersion || !compareVersion) return [];
    const v1 = versions.find(v => v.id === compareVersion);
    const v2 = versions.find(v => v.id === selectedVersion);
    if (!v1 || !v2) return [];
    return getDiff(v1.content, v2.content);
  }, [selectedVersion, compareVersion, versions, getDiff]);

  useEffect(() => {
    if (showDiffModal) {
      setIsLoading(true);
      getBranchDiff(showDiffModal.branchAId, showDiffModal.branchBId)
        .then(data => setDiffResultData(data))
        .finally(() => setIsLoading(false));
    } else {
      setDiffResultData(null);
    }
  }, [showDiffModal, getBranchDiff]);

  const handleRevert = async (versionId: string) => {
    await revertToVersion(versionId);
    setShowRevertConfirm(null);
  };

  const handleCreateBranch = async () => {
    if (!chapterId || !newBranchName.trim()) return;
    setIsLoading(true);
    try {
      await createBranch(chapterId, {
        name: newBranchName.trim(),
        description: newBranchDesc.trim(),
        parentBranchId: newBranchParentId,
        color: newBranchColor,
      });
      setShowCreateBranchModal(false);
      setNewBranchName('');
      setNewBranchDesc('');
      setNewBranchParentId(undefined);
      setNewBranchColor('#d4af37');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBranch = async (branchId: string) => {
    await deleteBranch(branchId);
    setConfirmDeleteBranch(null);
  };

  const handleMergeBranch = async (sourceBranchId: string, targetBranchId: string) => {
    setIsLoading(true);
    try {
      const result: MergeResult = await mergeBranch(sourceBranchId, targetBranchId);
      if (result.hasConflicts && result.conflicts) {
        setShowConflictResolver({
          sourceBranchId,
          targetBranchId,
          conflicts: result.conflicts,
        });
      }
      setShowMergeModal(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveConflicts = async (resolutions: Record<string, string>) => {
    if (!showConflictResolver) return;
    setIsLoading(true);
    try {
      const result: MergeResult = await mergeBranch(
        showConflictResolver.sourceBranchId,
        showConflictResolver.targetBranchId,
        resolutions
      );
      if (result.success) {
        setShowConflictResolver(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderDiff = (diffs: Diff[]) => {
    return diffs.map((diff, index) => {
      const [type, text] = diff;
      let className = 'text-ink-700';
      if (type === 1) className = 'bg-green-100 text-green-800';
      else if (type === -1) className = 'bg-red-100 text-red-800 line-through';

      return (
        <span key={index} className={className}>
          {text}
        </span>
      );
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBranchTreeData = () => {
    const main = branches.find(b => b.isMain);
    if (!main) return { nodes: [], edges: [], nodeMap: new Map<string, number>() };

    const nodes: Array<{
      branch: ChapterBranch;
      depth: number;
      x: number;
      y: number;
    }> = [];
    const edges: Array<{ from: string; to: string }> = [];

    const nodeMap = new Map<string, number>();
    let yOffset = 0;

    const addNode = (branch: ChapterBranch, depth: number) => {
      if (nodeMap.has(branch.id)) return;
      nodeMap.set(branch.id, nodes.length);
      nodes.push({
        branch,
        depth,
        x: depth * 180 + 100,
        y: yOffset * 80 + 60,
      });
      yOffset++;

      const children = branches.filter(b => b.parentBranchId === branch.id);
      children.forEach(child => {
        edges.push({ from: branch.id, to: child.id });
        addNode(child, depth + 1);
      });
    };

    addNode(main, 0);
    return { nodes, edges, nodeMap };
  };

  const treeData = useMemo(() => getBranchTreeData(), [branches]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
            <Circle className="w-2 h-2 fill-green-500" />
            活跃
          </span>
        );
      case 'merged':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
            <CheckCircle className="w-2 h-2" />
            已合并
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-ink-100 text-ink-600">
            <EyeOff className="w-2 h-2" />
            已归档
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to={`/projects/${projectId}/chapters/${chapterId}`}
            className="p-2 hover:bg-paper-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-ink-600" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink-800">
              版本历史
            </h1>
            <p className="text-ink-500">
              {chapter?.title} · 共 {versions.length} 个版本 · {branches.length} 个分支
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-paper-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('versions')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'versions'
              ? 'bg-white text-ink-800 shadow-sm'
              : 'text-ink-500 hover:text-ink-700'
          )}
        >
          <History className="w-4 h-4" />
          历史版本
        </button>
        <button
          onClick={() => setActiveTab('branches')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeTab === 'branches'
              ? 'bg-white text-ink-800 shadow-sm'
              : 'text-ink-500 hover:text-ink-700'
          )}
        >
          <GitBranch className="w-4 h-4" />
          分支管理
        </button>
      </div>

      {activeTab === 'versions' && (
        <>
          {selectedVersion && compareVersion && diffResult.length > 0 && (
            <div className="card p-6">
              <h2 className="font-serif text-lg font-bold text-ink-800 mb-4 flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-gold-500" />
                版本差异对比
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-xs text-red-600 font-medium mb-1">旧版本</div>
                  <div className="text-sm text-ink-600">
                    {formatDate(versions.find(v => v.id === compareVersion)?.createdAt || new Date())}
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs text-green-600 font-medium mb-1">新版本</div>
                  <div className="text-sm text-ink-600">
                    {formatDate(versions.find(v => v.id === selectedVersion)?.createdAt || new Date())}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-paper-50 rounded-xl border border-paper-200 font-serif text-sm leading-relaxed max-h-96 overflow-y-auto scrollbar-thin whitespace-pre-wrap">
                {renderDiff(diffResult)}
              </div>
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-paper-200">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
                  <span className="text-ink-500">新增内容</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-4 h-4 bg-red-100 border border-red-300 rounded" />
                  <span className="text-ink-500">删除内容</span>
                </div>
              </div>
            </div>
          )}

          <div className="card p-6">
            <h2 className="font-serif text-lg font-bold text-ink-800 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold-500" />
              历史版本记录
            </h2>

            {versions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-ink-300 mx-auto mb-4" />
                <p className="text-ink-500">暂无版本记录</p>
                <p className="text-sm text-ink-400 mt-1">每次保存都会创建一个新版本</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-paper-300" />

                {versions.map((version, index) => {
                  const isSelected = selectedVersion === version.id;
                  const isCompare = compareVersion === version.id;
                  const isExpanded = expandedVersion === version.id;
                  const isLatest = index === 0;

                  return (
                    <div
                      key={version.id}
                      className={cn(
                        'relative pl-14 pb-8 last:pb-0',
                        'animate-fade-in'
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={cn(
                        'absolute left-4 w-5 h-5 rounded-full border-4 transition-all',
                        isSelected
                          ? 'bg-gold-500 border-gold-200 scale-125'
                          : isCompare
                            ? 'bg-ink-600 border-ink-200 scale-110'
                            : 'bg-paper-50 border-paper-300'
                      )}>
                        {isLatest && (
                          <div className="absolute -right-1 -top-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>

                      <div className={cn(
                        'p-4 rounded-xl border transition-all cursor-pointer',
                        isSelected
                          ? 'bg-gold-50 border-gold-300 shadow-gold'
                          : isCompare
                            ? 'bg-ink-50 border-ink-300'
                            : 'bg-paper-50 border-paper-200 hover:border-gold-200 hover:shadow-paper-hover'
                      )}>
                        <div
                          onClick={() => setExpandedVersion(isExpanded ? null : version.id)}
                          className="flex items-start justify-between"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-ink-100 text-ink-600">
                                v{versions.length - index}
                              </span>
                              {isLatest && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-medium">
                                  当前版本
                                </span>
                              )}
                              <span className="text-sm text-ink-400">
                                {formatDate(version.createdAt)}
                              </span>
                            </div>
                            <p className="font-medium text-ink-800">
                              {version.changeSummary}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-ink-500">
                              <div className="flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                <span>{version.author.username}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
                                <span>{version.content.replace(/\s/g, '').length.toLocaleString()} 字</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-ink-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-ink-400" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-paper-200 animate-fade-in">
                            <div className="p-4 bg-paper-100 rounded-lg font-serif text-sm leading-relaxed text-ink-700 max-h-60 overflow-y-auto scrollbar-thin whitespace-pre-wrap">
                              {version.content}
                            </div>
                            <div className="flex items-center gap-3 mt-4">
                              {!selectedVersion ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedVersion(version.id);
                                  }}
                                  className="btn-gold text-sm flex items-center gap-2"
                                >
                                  <GitCompare className="w-4 h-4" />
                                  选择为新版本
                                </button>
                              ) : !isCompare && selectedVersion !== version.id ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCompareVersion(version.id);
                                  }}
                                  className="btn-secondary text-sm flex items-center gap-2"
                                >
                                  <GitCompare className="w-4 h-4" />
                                  选择为旧版本
                                </button>
                              ) : null}
                              {!isLatest && version.author.id === currentUser.id && (
                                <>
                                  {showRevertConfirm === version.id ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-brick-600">确认回滚？</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRevert(version.id);
                                        }}
                                        className="btn-danger text-sm"
                                      >
                                        确认
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowRevertConfirm(null);
                                        }}
                                        className="btn-secondary text-sm"
                                      >
                                        取消
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowRevertConfirm(version.id);
                                      }}
                                      className="btn-secondary text-sm flex items-center gap-2 text-brick-600 hover:bg-brick-50"
                                    >
                                      <RotateCcw className="w-4 h-4" />
                                      回滚到此版本
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'branches' && (
        <>
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-lg font-bold text-ink-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold-500" />
                分支树
              </h2>
              <button
                onClick={() => setShowCreateBranchModal(true)}
                className="btn-gold text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建实验分支
              </button>
            </div>

            {branches.length === 0 ? (
              <div className="text-center py-12">
                <GitBranch className="w-12 h-12 text-ink-300 mx-auto mb-4" />
                <p className="text-ink-500">暂无分支</p>
                <p className="text-sm text-ink-400 mt-1">创建实验分支，安全地尝试不同的写作方向</p>
              </div>
            ) : (
              <div className="relative overflow-x-auto pb-4">
                <svg
                  className="w-full min-w-[600px]"
                  style={{ height: Math.max(200, treeData.nodes.length * 80 + 40) }}
                >
                  {treeData.edges.map((edge, idx) => {
                    const from = treeData.nodes[treeData.nodeMap.get(edge.from)!];
                    const to = treeData.nodes[treeData.nodeMap.get(edge.to)!];
                    if (!from || !to) return null;
                    const midX = (from.x + to.x) / 2;
                    return (
                      <path
                        key={idx}
                        d={`M ${from.x + 16} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x - 16} ${to.y}`}
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="2"
                        strokeDasharray={to.branch.status === 'merged' ? '4 4' : undefined}
                      />
                    );
                  })}
                  {treeData.nodes.map((node) => (
                    <g
                      key={node.branch.id}
                      className="cursor-pointer"
                      onClick={() => setExpandedBranch(expandedBranch === node.branch.id ? null : node.branch.id)}
                    >
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="18"
                        fill={node.branch.color}
                        stroke="white"
                        strokeWidth="3"
                        className="drop-shadow-md"
                      />
                      {node.branch.isMain && (
                        <text
                          x={node.x}
                          y={node.y + 5}
                          textAnchor="middle"
                          fill="white"
                          fontSize="14"
                          fontWeight="bold"
                        >
                          M
                        </text>
                      )}
                      {!node.branch.isMain && node.branch.status === 'merged' && (
                        <Check className="w-4 h-4 text-white" style={{ transform: `translate(${node.x - 8}px, ${node.y - 8}px)` }} />
                      )}
                      <rect
                        x={node.x - 80}
                        y={node.y + 28}
                        width="160"
                        height="50"
                        rx="8"
                        fill="white"
                        stroke={expandedBranch === node.branch.id ? node.branch.color : '#e2e8f0'}
                        strokeWidth={expandedBranch === node.branch.id ? 2 : 1}
                      />
                      <text
                        x={node.x}
                        y={node.y + 48}
                        textAnchor="middle"
                        fill="#1e293b"
                        fontSize="12"
                        fontWeight="600"
                      >
                        {node.branch.name.length > 10 ? node.branch.name.slice(0, 10) + '...' : node.branch.name}
                      </text>
                      <text
                        x={node.x}
                        y={node.y + 64}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="10"
                      >
                        {node.branch.wordCount} 字 · {node.branch.creator?.username}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-serif text-lg font-bold text-ink-800 mb-6 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-gold-500" />
              分支列表
            </h2>

            <div className="space-y-4">
              {branches.map((branch) => {
                const branchVers = getBranchVersions(branch.id);
                const isExpanded = expandedBranch === branch.id;
                const parentBranch = branch.parentBranchId
                  ? branches.find(b => b.id === branch.parentBranchId)
                  : null;

                return (
                  <div
                    key={branch.id}
                    className={cn(
                      'rounded-xl border transition-all',
                      isExpanded
                        ? 'border-2 shadow-paper-hover'
                        : 'border-paper-200 hover:border-paper-300'
                    )}
                    style={{ borderColor: isExpanded ? branch.color : undefined }}
                  >
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedBranch(isExpanded ? null : branch.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                            style={{ backgroundColor: branch.color }}
                          >
                            {branch.isMain ? 'M' : branch.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-ink-800">
                                {branch.name}
                              </span>
                              {getStatusBadge(branch.status)}
                              {branch.isMain && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gold-100 text-gold-700 font-medium">
                                  主线
                                </span>
                              )}
                            </div>
                            {branch.description && (
                              <p className="text-sm text-ink-500 mt-1">
                                {branch.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-ink-400">
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{branch.creator?.username}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                <span>{branch.wordCount.toLocaleString()} 字</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(branch.updatedAt)}</span>
                              </div>
                              {parentBranch && (
                                <div className="flex items-center gap-1">
                                  <ArrowRightLeft className="w-3 h-3" />
                                  <span>基于 {parentBranch.name}</span>
                                </div>
                              )}
                              {branchVers.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <History className="w-3 h-3" />
                                  <span>{branchVers.length} 个版本</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-ink-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-ink-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-paper-100 animate-fade-in">
                        <div className="p-4 bg-paper-50 rounded-lg font-serif text-sm leading-relaxed text-ink-700 max-h-48 overflow-y-auto scrollbar-thin whitespace-pre-wrap mt-4">
                          {branch.currentContent}
                        </div>

                        {branchVers.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-semibold text-ink-700 mb-3">分支版本历史</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                              {branchVers.map((bv, idx) => (
                                <div key={bv.id} className="p-3 bg-paper-50 rounded-lg border border-paper-100">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-ink-100 text-ink-600">
                                        v{branchVers.length - idx}
                                      </span>
                                      <span className="text-sm font-medium text-ink-700">
                                        {bv.changeSummary}
                                      </span>
                                    </div>
                                    <span className="text-xs text-ink-400">
                                      {formatDate(bv.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-4 flex-wrap">
                          {!branch.isMain && branch.status === 'active' && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowMergeModal(branch.id);
                                }}
                                className="btn-gold text-sm flex items-center gap-2"
                              >
                                <Merge className="w-4 h-4" />
                                合并到主线
                              </button>
                              {mainBranch && mainBranch.id !== branch.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDiffModal({
                                      branchAId: mainBranch.id,
                                      branchBId: branch.id,
                                    });
                                  }}
                                  className="btn-secondary text-sm flex items-center gap-2"
                                >
                                  <GitCompare className="w-4 h-4" />
                                  与主线对比
                                </button>
                              )}
                              {confirmDeleteBranch === branch.id ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-brick-600">确认删除？</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteBranch(branch.id);
                                    }}
                                    className="btn-danger text-sm"
                                  >
                                    确认
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmDeleteBranch(null);
                                    }}
                                    className="btn-secondary text-sm"
                                  >
                                    取消
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteBranch(branch.id);
                                  }}
                                  className="btn-secondary text-sm flex items-center gap-2 text-brick-600 hover:bg-brick-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  删除分支
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {showCreateBranchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-ink-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold-500" />
                创建实验分支
              </h3>
              <button
                onClick={() => setShowCreateBranchModal(false)}
                className="p-1 hover:bg-paper-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-ink-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  分支名称 <span className="text-brick-500">*</span>
                </label>
                <input
                  type="text"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="例如：实验分支：悬疑氛围强化"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  描述
                </label>
                <textarea
                  value={newBranchDesc}
                  onChange={(e) => setNewBranchDesc(e.target.value)}
                  placeholder="描述这个分支的实验目的..."
                  rows={3}
                  className="input resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  基于分支
                </label>
                <select
                  value={newBranchParentId || ''}
                  onChange={(e) => setNewBranchParentId(e.target.value || undefined)}
                  className="input"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} {b.isMain ? '(主线)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  分支颜色
                </label>
                <div className="flex gap-2">
                  {branchColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewBranchColor(color)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all',
                        newBranchColor === color ? 'ring-2 ring-offset-2 ring-ink-400 scale-110' : 'hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateBranchModal(false)}
                className="btn-secondary"
                disabled={isLoading}
              >
                取消
              </button>
              <button
                onClick={handleCreateBranch}
                className="btn-gold flex items-center gap-2"
                disabled={isLoading || !newBranchName.trim()}
              >
                {isLoading ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                创建分支
              </button>
            </div>
          </div>
        </div>
      )}

      {showMergeModal && mainBranch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-ink-800 flex items-center gap-2">
                <Merge className="w-5 h-5 text-gold-500" />
                合并分支
              </h3>
              <button
                onClick={() => setShowMergeModal(null)}
                className="p-1 hover:bg-paper-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-ink-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-paper-50 rounded-lg">
                <div className="text-sm text-ink-500 mb-1">源分支</div>
                <div className="font-semibold text-ink-800">
                  {branches.find(b => b.id === showMergeModal)?.name}
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRightLeft className="w-6 h-6 text-gold-500" />
              </div>

              <div className="p-4 bg-gold-50 rounded-lg border border-gold-200">
                <div className="text-sm text-gold-600 mb-1">目标分支</div>
                <div className="font-semibold text-ink-800">
                  {mainBranch.name} (主线)
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  合并后，如果存在内容冲突，系统会弹出冲突解决界面让您手动处理。
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowMergeModal(null)}
                className="btn-secondary"
                disabled={isLoading}
              >
                取消
              </button>
              <button
                onClick={() => handleMergeBranch(showMergeModal, mainBranch.id)}
                className="btn-gold flex items-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <Merge className="w-4 h-4" />
                )}
                确认合并
              </button>
            </div>
          </div>
        </div>
      )}

      {showConflictResolver && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-ink-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-brick-500" />
                解决内容冲突
              </h3>
              <button
                onClick={() => setShowConflictResolver(null)}
                className="p-1 hover:bg-paper-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-ink-500" />
              </button>
            </div>

            <p className="text-ink-600 mb-6">
              以下内容存在冲突，请选择保留哪个版本，或手动编辑合并内容。共 {showConflictResolver.conflicts.length} 处冲突。
            </p>

            <ConflictResolver
              conflicts={showConflictResolver.conflicts}
              onResolve={handleResolveConflicts}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {showDiffModal && diffResultData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl font-bold text-ink-800 flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-gold-500" />
                分支差异对比
              </h3>
              <button
                onClick={() => setShowDiffModal(null)}
                className="p-1 hover:bg-paper-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-ink-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-xs text-red-600 font-medium mb-1">
                  {diffResultData.branchA?.name || '分支 A'}
                </div>
                <div className="text-sm text-ink-600">
                  {diffResultData.branchA?.wordCount?.toLocaleString() || 0} 字
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xs text-green-600 font-medium mb-1">
                  {diffResultData.branchB?.name || '分支 B'}
                </div>
                <div className="text-sm text-ink-600">
                  {diffResultData.branchB?.wordCount?.toLocaleString() || 0} 字
                  <span className="ml-2">
                    {diffResultData.wordCountDelta > 0
                      ? `(+${diffResultData.wordCountDelta})`
                      : `(${diffResultData.wordCountDelta})`}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-paper-50 rounded-xl border border-paper-200 font-serif text-sm leading-relaxed max-h-96 overflow-y-auto scrollbar-thin whitespace-pre-wrap">
              {renderDiff(diffResultData.diffs || [])}
            </div>

            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-paper-200">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
                <span className="text-ink-500">新增内容</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-4 h-4 bg-red-100 border border-red-300 rounded" />
                <span className="text-ink-500">删除内容</span>
              </div>
            </div>

            <div className="flex items-center justify-end mt-6">
              <button
                onClick={() => setShowDiffModal(null)}
                className="btn-secondary"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConflictResolver({
  conflicts,
  onResolve,
  isLoading,
}: {
  conflicts: ConflictBlock[];
  onResolve: (resolutions: Record<string, string>) => void;
  isLoading: boolean;
}) {
  const [localResolutions, setLocalResolutions] = useState<Record<string, string>>({});

  const updateResolution = (conflictId: string, value: string) => {
    setLocalResolutions(prev => ({ ...prev, [conflictId]: value }));
  };

  const handleSubmit = () => {
    const finalResolutions: Record<string, string> = {};
    conflicts.forEach((c) => {
      const res = localResolutions[c.id];
      if (res === 'keep-base' || res === 'keep-branch') {
        finalResolutions[c.id] = res;
      } else if (res) {
        finalResolutions[c.id] = res;
      } else {
        finalResolutions[c.id] = 'keep-branch';
      }
    });
    onResolve(finalResolutions);
  };

  return (
    <div className="space-y-6">
      {conflicts.map((conflict, idx) => (
        <div key={conflict.id} className="p-4 rounded-xl border border-brick-200 bg-brick-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-brick-700">
              冲突 #{idx + 1}（第 {conflict.startIndex + 1} 行）
            </span>
            {localResolutions[conflict.id] && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                <CheckCircle className="w-3 h-3" />
                已处理
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div
              className={cn(
                'p-3 rounded-lg border-2 cursor-pointer transition-all',
                localResolutions[conflict.id] === 'keep-base'
                  ? 'border-red-500 bg-red-50'
                  : 'border-red-200 bg-white hover:border-red-400'
              )}
              onClick={() => updateResolution(conflict.id, 'keep-base')}
            >
              <div className="text-xs text-red-600 font-medium mb-2 flex items-center gap-1">
                <Circle className="w-3 h-3" />
                主线版本
              </div>
              <div className="font-serif text-sm text-ink-700 whitespace-pre-wrap">
                {conflict.baseContent || '(空)'}
              </div>
            </div>

            <div
              className={cn(
                'p-3 rounded-lg border-2 cursor-pointer transition-all',
                localResolutions[conflict.id] === 'keep-branch'
                  ? 'border-green-500 bg-green-50'
                  : 'border-green-200 bg-white hover:border-green-400'
              )}
              onClick={() => updateResolution(conflict.id, 'keep-branch')}
            >
              <div className="text-xs text-green-600 font-medium mb-2 flex items-center gap-1">
                <Circle className="w-3 h-3" />
                实验分支版本
              </div>
              <div className="font-serif text-sm text-ink-700 whitespace-pre-wrap">
                {conflict.branchContent || '(空)'}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-ink-500 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              或自定义合并内容
            </div>
            <textarea
              value={typeof localResolutions[conflict.id] === 'string' && !['keep-base', 'keep-branch'].includes(localResolutions[conflict.id])
                ? localResolutions[conflict.id]
                : ''
              }
              onChange={(e) => updateResolution(conflict.id, e.target.value)}
              placeholder="在此输入自定义的合并内容..."
              className="input w-full font-serif text-sm resize-none"
              rows={2}
              onFocus={() => {
                if (!localResolutions[conflict.id] || ['keep-base', 'keep-branch'].includes(localResolutions[conflict.id])) {
                  updateResolution(conflict.id, '');
                }
              }}
            />
          </div>
        </div>
      ))}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-paper-200">
        <button
          onClick={() => setLocalResolutions({})}
          className="btn-secondary"
          disabled={isLoading}
        >
          重置选择
        </button>
        <button
          onClick={handleSubmit}
          className="btn-gold flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="animate-spin">⌛</span>
          ) : (
            <Save className="w-4 h-4" />
          )}
          应用解决方案 ({Object.keys(localResolutions).length}/{conflicts.length})
        </button>
      </div>
    </div>
  );
}
