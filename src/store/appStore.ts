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
  StickyNote,
} from '@shared/types';
import { Diff, diff_match_patch } from 'diff-match-patch';
import { api } from '@/services/api';

const dmp = new diff_match_patch();

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
  isLoading: boolean;
  initialized: boolean;

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
  isLoading: false,
  initialized: false,

  initApp: async () => {
    if (get().initialized) return;
    set({ isLoading: true });
    try {
      const projectsList = await api.projects.list();
      const [users, projects, chapters, characters, plotPoints, stickyNotes] = await Promise.all([
        api.users.list(),
        projectsList,
        Promise.all(projectsList.map((p: any) => api.chapters.list(p.id))).then(arrs => arrs.flat()),
        Promise.all(projectsList.map((p: any) => api.characters.list(p.id))).then(arrs => arrs.flat()),
        Promise.all(projectsList.map((p: any) => api.plot.list(p.id))).then(arrs => arrs.flat()),
        Promise.all(projectsList.map((p: any) => api.notes.list(p.id))).then(arrs => arrs.flat()),
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
      set({ currentChapter: null });
      return;
    }
    try {
      const chapter = reviveDates(await api.chapters.get(chapterId));
      set({ currentChapter: chapter });
      const versions = reviveDates(await api.versions.list(chapterId));
      set(state => ({
        chapterVersions: [
          ...state.chapterVersions.filter(v => v.chapterId !== chapterId),
          ...versions,
        ],
      }));
    } catch {
      set({ currentChapter: null });
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

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = config.margin;
      const contentWidth = pageWidth - margin.left - margin.right;
      const contentHeight = pageHeight - margin.top - margin.bottom;
      const mmToPx = 3.7795275591;

      const renderHtmlToCanvas = async (htmlContent: string, widthPx: number): Promise<HTMLCanvasElement> => {
        const container = document.createElement('div');
        container.style.width = `${widthPx}px`;
        container.style.padding = '0';
        container.style.margin = '0';
        container.style.fontFamily = '"Noto Serif SC", "SimSun", "Source Han Serif CN", serif';
        container.style.fontSize = `${config.fontSize}px`;
        container.style.lineHeight = `${config.lineHeight}`;
        container.style.color = '#000000';
        container.style.background = '#ffffff';
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.innerHTML = htmlContent;
        document.body.appendChild(container);
        await new Promise(resolve => setTimeout(resolve, 50));
        const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
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
          numCtx.fillStyle = '#ffffff';
          numCtx.fillRect(0, 0, numCanvas.width, numCanvas.height);
          numCtx.fillStyle = '#888888';
          numCtx.font = '16px "Noto Serif SC", "SimSun", serif';
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
          <div style="width:100%;height:${(pageHeight * mmToPx)}px;background:#1e3a5f;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:'Noto Serif SC','SimSun',serif;">
            <h1 style="font-size:${coverTitleSize}px;font-weight:bold;text-align:center;margin-bottom:16px;color:white;padding:0 40px;">${config.title}</h1>
            ${config.author ? `<p style="font-size:${coverAuthorSize}px;color:#d4af37;">${config.author}</p>` : ''}
            <div style="width:60px;height:2px;background:#d4af37;margin-top:32px;"></div>
          </div>`;
        const canvas = await renderHtmlToCanvas(coverHtml, Math.round(pageWidth * mmToPx));
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
        const tocHtml = `<div style="padding:0;"><h2 style="font-size:${tocTitleSize}px;font-weight:bold;color:#1e3a5f;margin-bottom:16px;">目录</h2>${tocItems}</div>`;
        const canvas = await renderHtmlToCanvas(tocHtml, Math.round(contentWidth * mmToPx));
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
            <h2 style="font-size:${chapterTitleSize}px;font-weight:bold;color:#1e3a5f;margin-bottom:8px;">${chapter.title}</h2>
            <div style="width:40px;height:2px;background:#d4af37;margin-bottom:16px;"></div>
            <div style="font-size:${config.fontSize}px;line-height:${config.lineHeight};">${chapterContent}</div>
          </div>`;
        const widthPx = Math.round(contentWidth * mmToPx);
        const canvas = await renderHtmlToCanvas(chapterHtml, widthPx);
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
            ctx.fillStyle = '#ffffff';
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
}));
