import { create } from 'zustand';
import type {
  User,
  Project,
  Chapter,
  ChapterVersion,
  Character,
  PlotPoint,
  ConflictWarning,
  PdfExportConfig,
  EpubExportConfig,
  MarkdownExportConfig,
  TxtExportConfig,
  PdfTemplateId,
  PdfTemplateStyle,
  StickyNote,
  ChapterBranch,
  BranchVersion,
  MergeResult,
  NoteConnection,
  NoteConnectionRecommendation,
} from '@shared/types';
import { Diff, diff_match_patch } from 'diff-match-patch';
import { api } from '@/services/api';

const dmp = new diff_match_patch();

export const PDF_TEMPLATES: Record<PdfTemplateId, { name: string; description: string; style: PdfTemplateStyle }> = {
  classic: {
    name: '经典文学',
    description: '深蓝封面，金色点缀，庄重典雅',
    style: {
      coverBg: '#1e3a5f',
      coverTextColor: '#ffffff',
      accentColor: '#d4af37',
      fontFamily: '"Noto Serif SC", "SimSun", "Source Han Serif CN", serif',
      chapterTitleColor: '#1e3a5f',
      bodyBgColor: '#ffffff',
      bodyTextColor: '#000000',
      tocTitleColor: '#1e3a5f',
      dividerStyle: '2px solid #d4af37',
    },
  },
  elegant: {
    name: '优雅古籍',
    description: '米黄底纹，仿古风格，书卷气息',
    style: {
      coverBg: '#8b4513',
      coverTextColor: '#fff8dc',
      accentColor: '#daa520',
      fontFamily: '"Noto Serif SC", "STKaiti", "KaiTi", serif',
      chapterTitleColor: '#8b4513',
      bodyBgColor: '#fffaf0',
      bodyTextColor: '#3d2b1f',
      tocTitleColor: '#8b4513',
      dividerStyle: '1px double #8b4513',
    },
  },
  modern: {
    name: '现代简约',
    description: '黑白灰调，几何线条，清爽利落',
    style: {
      coverBg: '#1a1a1a',
      coverTextColor: '#ffffff',
      accentColor: '#4a90d9',
      fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
      chapterTitleColor: '#1a1a1a',
      bodyBgColor: '#ffffff',
      bodyTextColor: '#222222',
      tocTitleColor: '#4a90d9',
      dividerStyle: '3px solid #4a90d9',
    },
  },
  minimal: {
    name: '极简纯白',
    description: '极简主义，大量留白，阅读舒适',
    style: {
      coverBg: '#fafafa',
      coverTextColor: '#333333',
      accentColor: '#888888',
      fontFamily: '"Noto Sans SC", "PingFang SC", sans-serif',
      chapterTitleColor: '#333333',
      bodyBgColor: '#ffffff',
      bodyTextColor: '#333333',
      tocTitleColor: '#333333',
      dividerStyle: '1px solid #e0e0e0',
    },
  },
  warm: {
    name: '暖调手账',
    description: '暖色调，柔和舒适，温馨治愈',
    style: {
      coverBg: '#c06c5a',
      coverTextColor: '#fff5eb',
      accentColor: '#e8a87c',
      fontFamily: '"Noto Serif SC", "STKaiti", serif',
      chapterTitleColor: '#8b5a3c',
      bodyBgColor: '#fffaf5',
      bodyTextColor: '#5c4033',
      tocTitleColor: '#c06c5a',
      dividerStyle: '2px dashed #e8a87c',
    },
  },
};

function reviveDates(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(reviveDates);
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
      result[key] = new Date(val);
    } else if (Array.isArray(val)) {
      result[key] = val.map(reviveDates);
    } else if (val && typeof val === 'object') {
      result[key] = reviveDates(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

interface AppState {
  currentUser: User;
  users: User[];
  projects: Project[];
  currentProject: Project | null;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  chapterVersions: ChapterVersion[];
  characters: Character[];
  plotPoints: PlotPoint[];
  conflictWarnings: ConflictWarning[];
  stickyNotes: StickyNote[];
  noteConnections: NoteConnection[];
  connectionRecommendations: NoteConnectionRecommendation[];
  isLoading: boolean;
  initialized: boolean;
  chapterBranches: ChapterBranch[];
  branchVersions: BranchVersion[];
  currentBranchId: string | null;

  loadChapterBranches: (chapterId: string) => Promise<void>;
  getChapterBranches: (chapterId: string) => ChapterBranch[];
  getMainBranch: (chapterId: string) => ChapterBranch | null;
  getCurrentBranch: () => ChapterBranch | null;
  setCurrentBranch: (branchId: string) => void;
  createBranch: (chapterId: string, data: {
    name: string;
    description?: string;
    parentBranchId?: string;
    color?: string;
  }) => Promise<ChapterBranch>;
  updateBranch: (branchId: string, updates: Partial<ChapterBranch>) => Promise<void>;
  deleteBranch: (branchId: string) => Promise<void>;
  loadBranchVersions: (branchId: string) => Promise<void>;
  getBranchVersions: (branchId: string) => BranchVersion[];
  createBranchVersion: (branchId: string, content: string, summary: string) => Promise<void>;
  mergeBranch: (sourceBranchId: string, targetBranchId: string, resolutions?: Record<string, string>) => Promise<MergeResult>;
  getBranchDiff: (branchAId: string, branchBId: string) => Promise<any>;

  initApp: () => Promise<void>;
  setCurrentProject: (projectId: string) => Promise<void>;
  setCurrentChapter: (chapterId: string | null) => Promise<void>;
  updateChapterContent: (chapterId: string, content: string) => Promise<void>;
  lockChapter: (chapterId: string) => Promise<boolean>;
  unlockChapter: (chapterId: string) => Promise<void>;
  checkAndReleaseExpiredLocks: () => Promise<void>;
  createVersion: (chapterId: string, summary: string) => Promise<void>;
  revertToVersion: (versionId: string) => Promise<void>;
  getDiff: (oldContent: string, newContent: string) => Diff[];
  getChapterVersions: (chapterId: string) => ChapterVersion[];
  getCharactersForChapter: (chapterId: string) => Character[];
  getPlotPointsForChapter: (chapterId: string) => PlotPoint[];
  checkConflicts: (chapterId: string) => Promise<ConflictWarning[]>;
  resolveConflict: (conflictId: string) => Promise<void>;
  exportToPdf: (config: PdfExportConfig) => Promise<void>;
  exportToMarkdown: (config: MarkdownExportConfig) => Promise<void>;
  exportToTxt: (config: TxtExportConfig) => Promise<void>;
  exportToEpub: (config: EpubExportConfig) => Promise<void>;
  createProject: (title: string, description: string) => Promise<Project>;
  createChapter: (projectId: string, title: string, parentId?: string) => Promise<Chapter>;
  updateChapterTitle: (chapterId: string, title: string) => Promise<void>;
  createCharacter: (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Character>;
  updateCharacter: (characterId: string, updates: Partial<Character>) => Promise<void>;
  createPlotPoint: (plotPoint: Omit<PlotPoint, 'id' | 'createdAt'>) => Promise<PlotPoint>;
  updatePlotPoint: (plotPointId: string, updates: Partial<PlotPoint>) => Promise<void>;
  addPlotHint: (plotPointId: string, hint: Omit<PlotPoint['hints'][0], 'id' | 'createdAt'>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>;
  deleteCharacter: (characterId: string) => Promise<void>;
  deletePlotPoint: (plotPointId: string) => Promise<void>;
  loadStickyNotes: (projectId: string) => Promise<void>;
  createStickyNote: (projectId: string, data: Partial<StickyNote>) => Promise<StickyNote>;
  updateStickyNote: (noteId: string, data: Partial<StickyNote>) => Promise<void>;
  updateNotePosition: (noteId: string, data: { positionX: number; positionY: number; zIndex?: number; rotation?: number }) => Promise<void>;
  deleteStickyNote: (noteId: string) => Promise<void>;
  reorderNotes: (projectId: string, noteIds: string[]) => Promise<void>;
  loadNoteConnections: (projectId: string) => Promise<void>;
  createNoteConnection: (projectId: string, data: {
    sourceNoteId: string;
    targetNoteId: string;
    type?: string;
    label?: string;
    description?: string;
    color?: string;
  }) => Promise<NoteConnection>;
  updateNoteConnection: (connectionId: string, data: Partial<NoteConnection>) => Promise<void>;
  deleteNoteConnection: (connectionId: string) => Promise<void>;
  loadConnectionRecommendations: (projectId: string, threshold?: number) => Promise<void>;
  getNoteConnectionsForNote: (noteId: string) => NoteConnection[];
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: {
    id: 'user-1',
    username: '墨雨堂主',
    email: 'moyu@example.com',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=moyu',
    createdAt: new Date('2025-01-15'),
  },
  users: [],
  projects: [],
  currentProject: null,
  chapters: [],
  currentChapter: null,
  chapterVersions: [],
  characters: [],
  plotPoints: [],
  conflictWarnings: [],
  stickyNotes: [],
  noteConnections: [],
  connectionRecommendations: [],
  isLoading: false,
  initialized: false,
  chapterBranches: [],
  branchVersions: [],
  currentBranchId: null,

  initApp: async () => {
    if (get().initialized) return;
    set({ isLoading: true });
    try {
      const projectsList = await api.projects.list();
      const [users, projects, chapters, characters, plotPoints, stickyNotes, noteConnections] = await Promise.all([
        api.users.list(),
        projectsList,
        Promise.all(projectsList.map((p: any) => api.chapters.list(p.id))).then(arrs => arrs.flat()),
        Promise.all(projectsList.map((p: any) => api.characters.list(p.id))).then(arrs => arrs.flat()),
        Promise.all(projectsList.map((p: any) => api.plot.list(p.id))).then(arrs => arrs.flat()),
        Promise.all(projectsList.map((p: any) => api.notes.list(p.id))).then(arrs => arrs.flat()),
        Promise.all(projectsList.map((p: any) => api.connections.list(p.id))).then(arrs => arrs.flat()),
      ]);

      const allChapterIds = chapters.map((c: any) => c.id);
      const versions = await Promise.all(
        allChapterIds.slice(0, 10).map(id => api.versions.list(id).catch(() => []))
      ).then(arrs => arrs.flat());

      set({
        users: reviveDates(users),
        projects: reviveDates(projects),
        chapters: reviveDates(chapters),
        chapterVersions: reviveDates(versions),
        characters: reviveDates(characters),
        plotPoints: reviveDates(plotPoints),
        stickyNotes: reviveDates(stickyNotes),
        noteConnections: reviveDates(noteConnections),
        connectionRecommendations: [],
        conflictWarnings: [],
        currentUser: reviveDates(users[0]) || get().currentUser,
        initialized: true,
        isLoading: false,
      });
    } catch (e) {
      console.error('Failed to initialize app:', e);
      set({ isLoading: false });
    }
  },

  setCurrentProject: async (projectId: string) => {
    if (!projectId) {
      set({ currentProject: null });
      return;
    }
    try {
      const project = reviveDates(await api.projects.get(projectId));
      set({ currentProject: project });
    } catch {
      set({ currentProject: null });
    }
  },

  setCurrentChapter: async (chapterId: string | null) => {
    if (!chapterId) {
      set({ currentChapter: null, currentBranchId: null });
      return;
    }
    try {
      const chapter = reviveDates(await api.chapters.get(chapterId));
      set({ currentChapter: chapter, currentBranchId: null });
      const versions = reviveDates(await api.versions.list(chapterId));
      set(state => ({
        chapterVersions: [
          ...state.chapterVersions.filter(v => v.chapterId !== chapterId),
          ...versions,
        ],
      }));
    } catch {
      set({ currentChapter: null, currentBranchId: null });
    }
  },

  updateChapterContent: async (chapterId: string, content: string) => {
    set({ isLoading: true });
    try {
      const updated = reviveDates(await api.chapters.update(chapterId, { content }));
      set(state => ({
        chapters: state.chapters.map(c => c.id === chapterId ? updated : c),
        currentChapter: state.currentChapter?.id === chapterId ? updated : state.currentChapter,
        isLoading: false,
      }));
    } catch (e) {
      console.error('Failed to update chapter content:', e);
      set({ isLoading: false });
    }
  },

  lockChapter: async (chapterId: string): Promise<boolean> => {
    try {
      const result = reviveDates(await api.chapters.lock(chapterId, get().currentUser.id));
      if (result.success) {
        const chapter = reviveDates(await api.chapters.get(chapterId));
        set(state => ({
          chapters: state.chapters.map(c => c.id === chapterId ? chapter : c),
          currentChapter: state.currentChapter?.id === chapterId ? chapter : state.currentChapter,
        }));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  unlockChapter: async (chapterId: string) => {
    try {
      await api.chapters.unlock(chapterId);
      set(state => ({
        chapters: state.chapters.map(c =>
          c.id === chapterId ? { ...c, lock: undefined } : c
        ),
        currentChapter: state.currentChapter?.id === chapterId
          ? { ...state.currentChapter, lock: undefined }
          : state.currentChapter,
      }));
    } catch (e) {
      console.error('Failed to unlock chapter:', e);
    }
  },

  checkAndReleaseExpiredLocks: async () => {
    try {
      await api.chapters.releaseExpired();
      const state = get();
      const projectChapters = state.chapters.filter(c => c.projectId === state.currentProject?.id);
      const refreshed = await Promise.all(projectChapters.map(c => api.chapters.get(c.id).catch(() => null)));
      const revived = refreshed.filter(Boolean).map(reviveDates) as Chapter[];
      set(state => {
        const newChapters = state.chapters.map(c => {
          const fresh = revived.find(r => r.id === c.id);
          return fresh || c;
        });
        return {
          chapters: newChapters,
          currentChapter: state.currentChapter
            ? newChapters.find(c => c.id === state.currentChapter!.id) || state.currentChapter
            : null,
        };
      });
    } catch (e) {
      console.error('Failed to release expired locks:', e);
    }
  },

  createVersion: async (chapterId: string, summary: string) => {
    const state = get();
    const chapter = state.chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    try {
      const version = reviveDates(await api.versions.create(chapterId, {
        content: chapter.content,
        authorId: state.currentUser.id,
        changeSummary: summary,
      }));
      set(state => ({
        chapterVersions: [...state.chapterVersions, version],
      }));
    } catch (e) {
      console.error('Failed to create version:', e);
    }
  },

  revertToVersion: async (versionId: string) => {
    try {
      const result = reviveDates(await api.versions.revert(versionId));
      if (result.chapter) {
        const chapter = result.chapter;
        set(state => ({
          chapters: state.chapters.map(c => c.id === chapter.id ? chapter : c),
          currentChapter: state.currentChapter?.id === chapter.id ? chapter : state.currentChapter,
        }));
      }
    } catch (e) {
      console.error('Failed to revert version:', e);
    }
  },

  getDiff: (oldContent: string, newContent: string): Diff[] => {
    return dmp.diff_main(oldContent, newContent);
  },

  getChapterVersions: (chapterId: string): ChapterVersion[] => {
    return get().chapterVersions
      .filter(v => v.chapterId === chapterId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getCharactersForChapter: (chapterId: string): Character[] => {
    return get().characters.filter(c =>
      c.appearances.some(a => a.chapterId === chapterId)
    );
  },

  getPlotPointsForChapter: (chapterId: string): PlotPoint[] => {
    return get().plotPoints.filter(p =>
      p.relatedChapterIds.includes(chapterId) ||
      p.hints.some(h => h.chapterId === chapterId)
    );
  },

  checkConflicts: async (chapterId: string): Promise<ConflictWarning[]> => {
    const projectId = get().currentProject?.id;
    if (!projectId) return [];
    try {
      const warnings = reviveDates(await api.conflicts.check(projectId, chapterId));
      set(state => ({
        conflictWarnings: [
          ...state.conflictWarnings.filter(c => c.chapterId !== chapterId || c.resolved),
          ...warnings,
        ],
      }));
      return warnings;
    } catch (e) {
      console.error('Failed to check conflicts:', e);
      return [];
    }
  },

  resolveConflict: async (conflictId: string) => {
    try {
      await api.conflicts.resolve(conflictId);
      set(state => ({
        conflictWarnings: state.conflictWarnings.map(c =>
          c.id === conflictId ? { ...c, resolved: true, resolvedAt: new Date() } : c
        ),
      }));
    } catch (e) {
      console.error('Failed to resolve conflict:', e);
    }
  },

  exportToPdf: async (config: PdfExportConfig) => {
    set({ isLoading: true });
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;
      const template = PDF_TEMPLATES[config.templateId || 'classic'].style;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = config.margin;
      const contentWidth = pageWidth - margin.left - margin.right;
      const contentHeight = pageHeight - margin.top - margin.bottom;
      const mmToPx = 3.7795275591;

      const renderHtmlToCanvas = async (htmlContent: string, widthPx: number, bgColor: string): Promise<HTMLCanvasElement> => {
        const container = document.createElement('div');
        container.style.width = `${widthPx}px`;
        container.style.padding = '0';
        container.style.margin = '0';
        container.style.fontFamily = template.fontFamily;
        container.style.fontSize = `${config.fontSize}px`;
        container.style.lineHeight = `${config.lineHeight}`;
        container.style.color = template.bodyTextColor;
        container.style.background = bgColor;
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.innerHTML = `<style>${config.customCss || ''}</style>` + htmlContent;
        document.body.appendChild(container);
        await new Promise(resolve => setTimeout(resolve, 50));
        const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false, backgroundColor: bgColor });
        document.body.removeChild(container);
        return canvas;
      };

      const drawPageNumber = (num: number) => {
        if (!config.includePageNumbers) return;
        const numCanvas = document.createElement('canvas');
        numCanvas.width = 400;
        numCanvas.height = 40;
        const numCtx = numCanvas.getContext('2d');
        if (numCtx) {
          numCtx.fillStyle = template.bodyBgColor;
          numCtx.fillRect(0, 0, numCanvas.width, numCanvas.height);
          numCtx.fillStyle = template.accentColor;
          numCtx.font = `16px ${template.fontFamily}`;
          numCtx.textAlign = 'center';
          numCtx.textBaseline = 'middle';
          numCtx.fillText(`- ${num} -`, numCanvas.width / 2, numCanvas.height / 2);
        }
        const numImgData = numCanvas.toDataURL('image/png');
        doc.addImage(numImgData, 'PNG', (pageWidth - 30) / 2, pageHeight - margin.bottom / 2 - 1.5, 30, 3);
      };

      let globalPageNum = 0;
      const nextPage = () => { doc.addPage(); globalPageNum++; };

      if (config.includeCover) {
        globalPageNum++;
        const coverTitleSize = Math.max(24, config.fontSize + 20);
        const coverAuthorSize = Math.max(14, config.fontSize + 4);
        const coverHtml = `
          <div style="width:100%;height:${(pageHeight * mmToPx)}px;background:${template.coverBg};display:flex;flex-direction:column;align-items:center;justify-content:center;color:${template.coverTextColor};font-family:${template.fontFamily};">
            <h1 style="font-size:${coverTitleSize}px;font-weight:bold;text-align:center;margin-bottom:16px;color:${template.coverTextColor};padding:0 40px;">${config.title}</h1>
            ${config.author ? `<p style="font-size:${coverAuthorSize}px;color:${template.accentColor};">${config.author}</p>` : ''}
            <div style="width:60px;height:2px;background:${template.accentColor};margin-top:32px;"></div>
          </div>`;
        const canvas = await renderHtmlToCanvas(coverHtml, Math.round(pageWidth * mmToPx), template.coverBg);
        doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageWidth, pageHeight);
        drawPageNumber(globalPageNum);
        nextPage();
      }

      if (config.includeToc) {
        globalPageNum++;
        const tocTitleSize = Math.max(16, config.fontSize + 6);
        const tocItems = config.chapterIds.map((cid, idx) => {
          const ch = get().chapters.find(c => c.id === cid);
          return ch ? `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dotted #ccc;font-size:${config.fontSize}px;"><span>${idx + 1}. ${ch.title}</span><span>${idx + 2 + (config.includeCover ? 1 : 0)}</span></div>` : '';
        }).join('');
        const tocHtml = `<div style="padding:0;"><h2 style="font-size:${tocTitleSize}px;font-weight:bold;color:${template.tocTitleColor};margin-bottom:16px;">目录</h2>${tocItems}</div>`;
        const canvas = await renderHtmlToCanvas(tocHtml, Math.round(contentWidth * mmToPx), template.bodyBgColor);
        const imgHeight = Math.min((canvas.height * contentWidth) / canvas.width, contentHeight);
        doc.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin.left, margin.top, contentWidth, imgHeight);
        drawPageNumber(globalPageNum);
        nextPage();
      }

      const chapterTitleSize = Math.max(14, config.fontSize + 4);
      for (let i = 0; i < config.chapterIds.length; i++) {
        const chapter = get().chapters.find(c => c.id === config.chapterIds[i]);
        if (!chapter) continue;
        const chapterContent = chapter.content.replace(/\n/g, '<br/>');
        const chapterHtml = `
          <div style="padding:0;">
            <h2 style="font-size:${chapterTitleSize}px;font-weight:bold;color:${template.chapterTitleColor};margin-bottom:8px;">${chapter.title}</h2>
            <div style="width:40px;height:${template.dividerStyle.includes('dashed') ? '2' : template.dividerStyle.includes('double') ? '3' : '2'}px;background:transparent;border-bottom:${template.dividerStyle};margin-bottom:16px;"></div>
            <div style="font-size:${config.fontSize}px;line-height:${config.lineHeight};">${chapterContent}</div>
          </div>`;
        const widthPx = Math.round(contentWidth * mmToPx);
        const canvas = await renderHtmlToCanvas(chapterHtml, widthPx, template.bodyBgColor);
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let yOffset = 0;
        let firstSlice = true;
        while (yOffset < imgHeight) {
          if (!(i === 0 && !config.includeCover && !config.includeToc && firstSlice)) {
            if (!firstSlice) { nextPage(); } else { globalPageNum++; }
          } else { globalPageNum++; }
          const sliceHeight = Math.min(contentHeight, imgHeight - yOffset);
          const sourceY = (yOffset / imgHeight) * canvas.height;
          const sourceHeight = (sliceHeight / imgHeight) * canvas.height;
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.max(1, sourceHeight);
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = template.bodyBgColor;
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
          }
          doc.addImage(pageCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', margin.left, margin.top, imgWidth, sliceHeight);
          drawPageNumber(globalPageNum);
          yOffset += contentHeight;
          firstSlice = false;
        }
      }
      doc.save(`${config.title || '小说'}.pdf`);
    } catch (e) {
      console.error('PDF export failed:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  exportToMarkdown: async (config: MarkdownExportConfig) => {
    set({ isLoading: true });
    try {
      let content = '';
      if (config.includeCover) {
        content += `# ${config.title}\n\n`;
        if (config.author) {
          content += `**作者：${config.author}**\n\n`;
        }
        content += `---\n\n`;
      }
      if (config.includeToc) {
        content += `## 目录\n\n`;
        config.chapterIds.forEach((cid, idx) => {
          const ch = get().chapters.find(c => c.id === cid);
          if (ch) {
            const prefix = config.useChapterNumbers ? `${idx + 1}. ` : '';
            content += `- ${prefix}${ch.title}\n`;
          }
        });
        content += `\n---\n\n`;
      }
      config.chapterIds.forEach((cid, idx) => {
        const ch = get().chapters.find(c => c.id === cid);
        if (!ch) return;
        const prefix = config.useChapterNumbers ? `第${idx + 1}章 ` : '';
        content += `## ${prefix}${ch.title}\n\n${ch.content}\n\n---\n\n`;
      });
      if (config.customCss) {
        content = `<!-- Custom CSS:\n${config.customCss}\n-->\n\n` + content;
      }
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.title || '小说'}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Markdown export failed:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  exportToTxt: async (config: TxtExportConfig) => {
    set({ isLoading: true });
    try {
      let content = '';
      const sep = config.chapterSeparator || '\n\n====================\n\n';
      if (config.includeCover) {
        content += `${config.title}\n`;
        if (config.author) {
          content += `作者：${config.author}\n`;
        }
        content += `\n${'='.repeat(40)}\n\n`;
      }
      if (config.includeToc) {
        content += `目录\n\n`;
        config.chapterIds.forEach((cid, idx) => {
          const ch = get().chapters.find(c => c.id === cid);
          if (ch) {
            const prefix = config.useChapterNumbers ? `${idx + 1}. ` : '';
            content += `${prefix}${ch.title}\n`;
          }
        });
        content += `\n${'='.repeat(40)}\n\n`;
      }
      config.chapterIds.forEach((cid, idx) => {
        const ch = get().chapters.find(c => c.id === cid);
        if (!ch) return;
        const prefix = config.useChapterNumbers ? `第${idx + 1}章 ` : '';
        content += `${prefix}${ch.title}\n\n${ch.content}${sep}`;
      });
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.title || '小说'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('TXT export failed:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  exportToEpub: async (config: EpubExportConfig) => {
    set({ isLoading: true });
    try {
      const uuid = config.identifier || `urn:uuid:${crypto.randomUUID()}`;
      const lang = config.language || 'zh-CN';
      const date = new Date().toISOString().split('T')[0];

      let chaptersHtml = '';
      let tocNcx = '';
      let manifestItems = '';
      let spineItems = '';

      config.chapterIds.forEach((cid, idx) => {
        const ch = get().chapters.find(c => c.id === cid);
        if (!ch) return;
        const chapterFilename = `chapter_${idx + 1}.xhtml`;
        chaptersHtml += `
          <item id="chapter_${idx + 1}" href="${chapterFilename}" media-type="application/xhtml+xml"/>
        `;
        spineItems += `<itemref idref="chapter_${idx + 1}"/>`;
        tocNcx += `
          <navPoint id="navPoint-${idx + 1}" playOrder="${idx + 1 + (config.includeToc ? 1 : 0) + (config.includeCover ? 1 : 0)}">
            <navLabel><text>${ch.title}</text></navLabel>
            <content src="${chapterFilename}"/>
          </navPoint>
        `;
      });

      let coverHtml = '';
      if (config.includeCover) {
        coverHtml = `
          <item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>
        `;
        spineItems = `<itemref idref="cover"/>` + spineItems;
      }
      let tocHtml = '';
      if (config.includeToc) {
        tocHtml = `<item id="toc" href="toc.xhtml" media-type="application/xhtml+xml"/>`;
        spineItems += `<itemref idref="toc"/>`;
      }
      manifestItems = coverHtml + tocHtml + chaptersHtml;

      const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

      const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId" xml:lang="${lang}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${config.title}</dc:title>
    <dc:creator>${config.author || '匿名'}</dc:creator>
    <dc:language>${lang}</dc:language>
    <dc:identifier id="BookId">${uuid}</dc:identifier>
    <dc:date>${date}</dc:date>
    ${config.customCss ? `<meta name="custom-css" content="embedded"/>` : ''}
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    ${config.customCss ? `<item id="css" href="style.css" media-type="text/css"/>` : ''}
    ${manifestItems}
  </manifest>
  <spine toc="ncx">
    ${spineItems}
  </spine>
</package>`;

      const tocNcxXml = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${config.title}</text></docTitle>
  <navMap>
    ${tocNcx}
  </navMap>
</ncx>`;

      const coverXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${lang}">
<head>
  <title>封面</title>
  ${config.customCss ? `<link rel="stylesheet" type="text/css" href="style.css"/>` : ''}
</head>
<body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;">
  <h1 style="font-size:2em;font-weight:bold;">${config.title}</h1>
  ${config.author ? `<p style="font-size:1.2em;">${config.author}</p>` : ''}
</body>
</html>`;

      const tocXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${lang}">
<head>
  <title>目录</title>
  ${config.customCss ? `<link rel="stylesheet" type="text/css" href="style.css"/>` : ''}
</head>
<body>
  <h1>目录</h1>
  <ul>
    ${config.chapterIds.map((cid, idx) => {
      const ch = get().chapters.find(c => c.id === cid);
      return ch ? `<li><a href="chapter_${idx + 1}.xhtml">${ch.title}</a></li>` : '';
    }).join('')}
  </ul>
</body>
</html>`;

      const chapterFiles: Record<string, string> = {};
      config.chapterIds.forEach((cid, idx) => {
        const ch = get().chapters.find(c => c.id === cid);
        if (!ch) return;
        const escapedContent = ch.content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/\n/g, '<br/>');
        chapterFiles[`OEBPS/chapter_${idx + 1}.xhtml`] = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${lang}">
<head>
  <title>${ch.title}</title>
  ${config.customCss ? `<link rel="stylesheet" type="text/css" href="style.css"/>` : ''}
</head>
<body>
  <h2>${ch.title}</h2>
  <div>${escapedContent}</div>
</body>
</html>`;
      });

      const files: Record<string, string> = {
        'mimetype': 'application/epub+zip',
        'META-INF/container.xml': containerXml,
        'OEBPS/content.opf': contentOpf,
        'OEBPS/toc.ncx': tocNcxXml,
        ...chapterFiles,
      };
      if (config.includeCover) files['OEBPS/cover.xhtml'] = coverXhtml;
      if (config.includeToc) files['OEBPS/toc.xhtml'] = tocXhtml;
      if (config.customCss) files['OEBPS/style.css'] = config.customCss;

      const crc32Table = (() => {
        const table = new Uint32Array(256);
        for (let i = 0; i < 256; i++) {
          let c = i;
          for (let j = 0; j < 8; j++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
          }
          table[i] = c >>> 0;
        }
        return table;
      })();
      const crc32 = (data: Uint8Array) => {
        let crc = 0xffffffff;
        for (const byte of data) crc = crc32Table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
        return (crc ^ 0xffffffff) >>> 0;
      };

      const encoder = new TextEncoder();
      const localFileHeaders: Uint8Array[] = [];
      const centralDirHeaders: Uint8Array[] = [];
      let offset = 0;

      Object.entries(files).forEach(([filename, content], idx) => {
        const data = encoder.encode(content);
        const crc = crc32(data);
        const compressedSize = data.length;
        const uncompressedSize = data.length;
        const filenameBytes = encoder.encode(filename);

        const lfh = new Uint8Array(30 + filenameBytes.length);
        const ldv = new DataView(lfh.buffer);
        ldv.setUint32(0, 0x04034b50, true);
        ldv.setUint16(4, idx === 0 && filename === 'mimetype' ? 10 : 20, true);
        ldv.setUint16(6, idx === 0 && filename === 'mimetype' ? 0 : 0, true);
        ldv.setUint16(8, 0, true);
        ldv.setUint16(10, 0, true);
        ldv.setUint16(12, 0, true);
        ldv.setUint32(14, crc, true);
        ldv.setUint32(18, compressedSize, true);
        ldv.setUint32(22, uncompressedSize, true);
        ldv.setUint16(26, filenameBytes.length, true);
        ldv.setUint16(28, 0, true);
        lfh.set(filenameBytes, 30);
        localFileHeaders.push(lfh, data);

        const cdh = new Uint8Array(46 + filenameBytes.length);
        const cdv = new DataView(cdh.buffer);
        cdv.setUint32(0, 0x02014b50, true);
        cdv.setUint16(4, 20, true);
        cdv.setUint16(6, idx === 0 && filename === 'mimetype' ? 10 : 20, true);
        cdv.setUint16(8, 0, true);
        cdv.setUint16(10, 0, true);
        cdv.setUint16(12, 0, true);
        cdv.setUint32(14, crc, true);
        cdv.setUint32(18, compressedSize, true);
        cdv.setUint32(22, uncompressedSize, true);
        cdv.setUint16(26, filenameBytes.length, true);
        cdv.setUint16(28, 0, true);
        cdv.setUint16(30, 0, true);
        cdv.setUint16(32, 0, true);
        cdv.setUint16(34, 0, true);
        cdv.setUint32(36, 0, true);
        cdv.setUint32(40, offset, true);
        cdh.set(filenameBytes, 46);
        centralDirHeaders.push(cdh);

        offset += lfh.length + data.length;
      });

      const centralDirSize = centralDirHeaders.reduce((sum, arr) => sum + arr.length, 0);
      const eocd = new Uint8Array(22);
      const eocdv = new DataView(eocd.buffer);
      eocdv.setUint32(0, 0x06054b50, true);
      eocdv.setUint16(4, 0, true);
      eocdv.setUint16(6, 0, true);
      eocdv.setUint16(8, Object.keys(files).length, true);
      eocdv.setUint16(10, Object.keys(files).length, true);
      eocdv.setUint32(12, centralDirSize, true);
      eocdv.setUint32(16, offset, true);
      eocdv.setUint16(20, 0, true);

      const totalSize = offset + centralDirSize + eocd.length;
      const epub = new Uint8Array(totalSize);
      let pos = 0;
      [...localFileHeaders, ...centralDirHeaders, eocd].forEach(arr => {
        epub.set(arr, pos);
        pos += arr.length;
      });

      const blob = new Blob([epub], { type: 'application/epub+zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.title || '小说'}.epub`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('EPUB export failed:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (title: string, description: string): Promise<Project> => {
    const project = reviveDates(await api.projects.create({
      title,
      description,
      creatorId: get().currentUser.id,
    }));
    set(state => ({ projects: [...state.projects, project] }));
    return project;
  },

  createChapter: async (projectId: string, title: string, parentId?: string): Promise<Chapter> => {
    const chapter = reviveDates(await api.chapters.create(projectId, { title, parentId }));
    set(state => ({
      chapters: [...state.chapters, chapter],
    }));
    return chapter;
  },

  updateChapterTitle: async (chapterId: string, title: string) => {
    const updated = reviveDates(await api.chapters.update(chapterId, { title }));
    set(state => ({
      chapters: state.chapters.map(c => c.id === chapterId ? updated : c),
      currentChapter: state.currentChapter?.id === chapterId ? updated : state.currentChapter,
    }));
  },

  createCharacter: async (characterData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<Character> => {
    const character = reviveDates(await api.characters.create(characterData.projectId, {
      name: characterData.name,
      description: characterData.description,
      avatarUrl: characterData.avatarUrl,
      traits: characterData.traits,
      projectId: characterData.projectId,
      voiceSettings: characterData.voiceSettings,
    }));
    set(state => ({ characters: [...state.characters, character] }));
    return character;
  },

  updateCharacter: async (characterId: string, updates: Partial<Character>) => {
    const updated = reviveDates(await api.characters.update(characterId, updates));
    set(state => ({
      characters: state.characters.map(c => c.id === characterId ? updated : c),
    }));
  },

  createPlotPoint: async (plotData: Omit<PlotPoint, 'id' | 'createdAt'>): Promise<PlotPoint> => {
    const plotPoint = reviveDates(await api.plot.create(plotData.projectId, {
      title: plotData.title,
      description: plotData.description,
      type: plotData.type,
      status: plotData.status,
      relatedChapterIds: plotData.relatedChapterIds,
      relatedCharacterIds: plotData.relatedCharacterIds,
    }));
    set(state => ({ plotPoints: [...state.plotPoints, plotPoint] }));
    return plotPoint;
  },

  updatePlotPoint: async (plotPointId: string, updates: Partial<PlotPoint>) => {
    const updated = reviveDates(await api.plot.update(plotPointId, updates));
    set(state => ({
      plotPoints: state.plotPoints.map(p => p.id === plotPointId ? updated : p),
    }));
  },

  addPlotHint: async (plotPointId: string, hint) => {
    const newHint = reviveDates(await api.plot.addHint(plotPointId, hint));
    set(state => ({
      plotPoints: state.plotPoints.map(p =>
        p.id === plotPointId ? { ...p, hints: [...p.hints, newHint] } : p
      ),
    }));
  },

  deleteProject: async (projectId: string) => {
    await api.projects.delete(projectId);
    set(state => ({
      projects: state.projects.filter(p => p.id !== projectId),
      chapters: state.chapters.filter(c => c.projectId !== projectId),
      characters: state.characters.filter(c => c.projectId !== projectId),
      plotPoints: state.plotPoints.filter(p => p.projectId !== projectId),
      stickyNotes: state.stickyNotes.filter(n => n.projectId !== projectId),
      currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
    }));
  },

  deleteChapter: async (chapterId: string) => {
    await api.chapters.delete(chapterId);
    set(state => ({
      chapters: state.chapters.filter(c => c.id !== chapterId),
      chapterVersions: state.chapterVersions.filter(v => v.chapterId !== chapterId),
      currentChapter: state.currentChapter?.id === chapterId ? null : state.currentChapter,
    }));
  },

  deleteCharacter: async (characterId: string) => {
    await api.characters.delete(characterId);
    set(state => ({
      characters: state.characters.filter(c => c.id !== characterId),
    }));
  },

  deletePlotPoint: async (plotPointId: string) => {
    await api.plot.delete(plotPointId);
    set(state => ({
      plotPoints: state.plotPoints.filter(p => p.id !== plotPointId),
    }));
  },

  loadStickyNotes: async (projectId: string) => {
    try {
      const notes = await api.notes.list(projectId);
      set({ stickyNotes: reviveDates(notes) });
    } catch (e) {
      console.error('Failed to load sticky notes:', e);
    }
  },

  createStickyNote: async (projectId: string, data: Partial<StickyNote>): Promise<StickyNote> => {
    const note = reviveDates(await api.notes.create(projectId, data));
    set(state => ({ stickyNotes: [...state.stickyNotes, note] }));
    return note;
  },

  updateStickyNote: async (noteId: string, data: Partial<StickyNote>) => {
    try {
      const updated = reviveDates(await api.notes.update(noteId, data));
      set(state => ({
        stickyNotes: state.stickyNotes.map(n => n.id === noteId ? updated : n),
      }));
    } catch (e) {
      console.error('Failed to update note:', e);
    }
  },

  updateNotePosition: async (noteId: string, data: { positionX: number; positionY: number; zIndex?: number; rotation?: number }) => {
    try {
      const updated = reviveDates(await api.notes.updatePosition(noteId, data));
      set(state => ({
        stickyNotes: state.stickyNotes.map(n => n.id === noteId ? updated : n),
      }));
    } catch (e) {
      console.error('Failed to update note position:', e);
    }
  },

  deleteStickyNote: async (noteId: string) => {
    try {
      await api.notes.delete(noteId);
      set(state => ({
        stickyNotes: state.stickyNotes.filter(n => n.id !== noteId),
        noteConnections: state.noteConnections.filter(c =>
          c.sourceNoteId !== noteId && c.targetNoteId !== noteId
        ),
      }));
    } catch (e) {
      console.error('Failed to delete note:', e);
    }
  },

  reorderNotes: async (projectId: string, noteIds: string[]) => {
    try {
      await api.notes.reorder(projectId, noteIds);
      set(state => ({
        stickyNotes: state.stickyNotes.map(n => {
          const idx = noteIds.indexOf(n.id);
          if (idx !== -1) {
            return { ...n, zIndex: idx + 1 };
          }
          return n;
        }),
      }));
    } catch (e) {
      console.error('Failed to reorder notes:', e);
    }
  },

  loadNoteConnections: async (projectId: string) => {
    try {
      const connections = await api.connections.list(projectId);
      set({ noteConnections: reviveDates(connections) });
    } catch (e) {
      console.error('Failed to load note connections:', e);
    }
  },

  createNoteConnection: async (projectId: string, data) => {
    const connection = reviveDates(await api.connections.create(projectId, data));
    set(state => ({ noteConnections: [...state.noteConnections, connection] }));
    return connection;
  },

  updateNoteConnection: async (connectionId: string, data: Partial<NoteConnection>) => {
    try {
      const updated = reviveDates(await api.connections.update(connectionId, data));
      set(state => ({
        noteConnections: state.noteConnections.map(c =>
          c.id === connectionId ? updated : c
        ),
      }));
    } catch (e) {
      console.error('Failed to update note connection:', e);
    }
  },

  deleteNoteConnection: async (connectionId: string) => {
    try {
      await api.connections.delete(connectionId);
      set(state => ({
        noteConnections: state.noteConnections.filter(c => c.id !== connectionId),
      }));
    } catch (e) {
      console.error('Failed to delete note connection:', e);
    }
  },

  loadConnectionRecommendations: async (projectId: string, threshold?: number) => {
    try {
      const recommendations = await api.connections.getRecommendations(projectId, threshold);
      set({ connectionRecommendations: reviveDates(recommendations) });
    } catch (e) {
      console.error('Failed to load connection recommendations:', e);
    }
  },

  getNoteConnectionsForNote: (noteId: string): NoteConnection[] => {
    return get().noteConnections.filter(c =>
      c.sourceNoteId === noteId || c.targetNoteId === noteId
    );
  },

  loadChapterBranches: async (chapterId: string) => {
    try {
      const branches = reviveDates(await api.branches.list(chapterId));
      set(state => {
        const otherBranches = state.chapterBranches.filter(b => b.chapterId !== chapterId);
        return { chapterBranches: [...otherBranches, ...branches] };
      });
    } catch (e) {
      console.error('Failed to load chapter branches:', e);
    }
  },

  getChapterBranches: (chapterId: string) => {
    return get().chapterBranches.filter(b => b.chapterId === chapterId);
  },

  getMainBranch: (chapterId: string) => {
    return get().chapterBranches.find(b => b.chapterId === chapterId && b.isMain) || null;
  },

  getCurrentBranch: () => {
    const { currentBranchId, chapterBranches, currentChapter } = get();
    if (!currentBranchId || !currentChapter) return null;
    const branch = chapterBranches.find(b => b.id === currentBranchId);
    if (!branch || branch.chapterId !== currentChapter.id) return null;
    return branch;
  },

  setCurrentBranch: (branchId: string) => {
    set({ currentBranchId: branchId });
    const branch = get().chapterBranches.find(b => b.id === branchId);
    if (branch) {
      const chapter = get().chapters.find(c => c.id === branch.chapterId);
      if (chapter) {
        const updatedChapter = {
          ...chapter,
          content: branch.currentContent,
          wordCount: branch.wordCount,
        };
        set(state => ({
          chapters: state.chapters.map(c => c.id === chapter.id ? updatedChapter : c),
          currentChapter: updatedChapter,
        }));
      }
    }
  },

  createBranch: async (chapterId, data) => {
    const branch = reviveDates(await api.branches.create(chapterId, data));
    set(state => ({ chapterBranches: [...state.chapterBranches, branch] }));
    return branch;
  },

  updateBranch: async (branchId, updates) => {
    try {
      const updated = reviveDates(await api.branches.update(branchId, updates));
      set(state => ({
        chapterBranches: state.chapterBranches.map(b => b.id === branchId ? updated : b),
      }));
    } catch (e) {
      console.error('Failed to update branch:', e);
    }
  },

  deleteBranch: async (branchId) => {
    try {
      await api.branches.delete(branchId);
      set(state => ({
        chapterBranches: state.chapterBranches.filter(b => b.id !== branchId),
      }));
    } catch (e) {
      console.error('Failed to delete branch:', e);
    }
  },

  loadBranchVersions: async (branchId) => {
    try {
      const versions = reviveDates(await api.branches.versions(branchId));
      set(state => {
        const otherVersions = state.branchVersions.filter(v => v.branchId !== branchId);
        return { branchVersions: [...otherVersions, ...versions] };
      });
    } catch (e) {
      console.error('Failed to load branch versions:', e);
    }
  },

  getBranchVersions: (branchId) => {
    return get().branchVersions
      .filter(v => v.branchId === branchId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createBranchVersion: async (branchId, content, summary) => {
    try {
      const version = reviveDates(await api.branches.createVersion(branchId, { content, summary }));
      set(state => ({ branchVersions: [...state.branchVersions, version] }));

      const branch = get().chapterBranches.find(b => b.id === branchId);
      if (branch) {
        const updatedBranch = {
          ...branch,
          currentContent: content,
          wordCount: version.wordCount,
          updatedAt: version.createdAt,
        };
        set(state => ({
          chapterBranches: state.chapterBranches.map(b => b.id === branchId ? updatedBranch : b),
        }));

        if (branch.isMain) {
          const chapter = get().chapters.find(c => c.id === branch.chapterId);
          if (chapter) {
            const updatedChapter = {
              ...chapter,
              content,
              wordCount: version.wordCount,
              updatedAt: version.createdAt,
            };
            set(state => ({
              chapters: state.chapters.map(c => c.id === chapter.id ? updatedChapter : c),
              currentChapter: updatedChapter,
            }));
          }
        }
      }
    } catch (e) {
      console.error('Failed to create branch version:', e);
    }
  },

  mergeBranch: async (sourceBranchId, targetBranchId, resolutions) => {
    const result = reviveDates(await api.branches.merge(sourceBranchId, targetBranchId, resolutions));
    if (result.success) {
      const { chapterBranches, loadChapterBranches, chapters } = get();
      const targetBranch = chapterBranches.find(b => b.id === targetBranchId);
      if (targetBranch) {
        await loadChapterBranches(targetBranch.chapterId);
        if (targetBranch.isMain) {
          const chapter = chapters.find(c => c.id === targetBranch.chapterId);
          if (chapter && result.mergedContent) {
            const updatedChapter = {
              ...chapter,
              content: result.mergedContent,
              wordCount: result.mergedContent.replace(/\s/g, '').length,
              updatedAt: new Date(),
            };
            set(state => ({
              chapters: state.chapters.map(c => c.id === chapter.id ? updatedChapter : c),
              currentChapter: updatedChapter,
            }));
          }
        }
      }
    }
    return result;
  },

  getBranchDiff: async (branchAId, branchBId) => {
    return reviveDates(await api.branches.diff(branchAId, branchBId));
  },
}));
