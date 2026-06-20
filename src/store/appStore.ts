import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  User,
  Project,
  Chapter,
  ChapterVersion,
  Character,
  PlotPoint,
  ConflictWarning,
  PdfExportConfig,
} from '@shared/types';
import {
  mockUsers,
  mockProjects,
  mockChapters,
  mockChapterVersions,
  mockCharacters,
  mockPlotPoints,
  mockConflictWarnings,
  currentUser as mockCurrentUser,
} from './mockData';
import { diff_match_patch, Diff } from 'diff-match-patch';

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
  isLoading: boolean;

  setCurrentProject: (projectId: string) => void;
  setCurrentChapter: (chapterId: string | null) => void;
  updateChapterContent: (chapterId: string, content: string) => Promise<void>;
  lockChapter: (chapterId: string) => Promise<boolean>;
  unlockChapter: (chapterId: string) => Promise<void>;
  checkAndReleaseExpiredLocks: () => void;
  createVersion: (chapterId: string, summary: string) => Promise<void>;
  revertToVersion: (versionId: string) => Promise<void>;
  getDiff: (oldContent: string, newContent: string) => Diff[];
  getChapterVersions: (chapterId: string) => ChapterVersion[];
  getCharactersForChapter: (chapterId: string) => Character[];
  getPlotPointsForChapter: (chapterId: string) => PlotPoint[];
  checkConflicts: (chapterId: string) => Promise<ConflictWarning[]>;
  resolveConflict: (conflictId: string) => void;
  exportToPdf: (config: PdfExportConfig) => Promise<void>;
  createProject: (title: string, description: string) => Promise<Project>;
  createChapter: (projectId: string, title: string, parentId?: string) => Promise<Chapter>;
  updateChapterTitle: (chapterId: string, title: string) => void;
  createCharacter: (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Character>;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  createPlotPoint: (plotPoint: Omit<PlotPoint, 'id' | 'createdAt'>) => Promise<PlotPoint>;
  updatePlotPoint: (plotPointId: string, updates: Partial<PlotPoint>) => void;
  addPlotHint: (plotPointId: string, hint: Omit<PlotPoint['hints'][0], 'id' | 'createdAt'>) => void;
}

const dmp = new diff_match_patch();

const reviver = (_key: string, value: unknown): unknown => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value);
  }
  return value;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: mockCurrentUser,
      users: mockUsers,
      projects: mockProjects,
      currentProject: null,
      chapters: mockChapters,
      currentChapter: null,
      chapterVersions: mockChapterVersions,
      characters: mockCharacters,
      plotPoints: mockPlotPoints,
      conflictWarnings: mockConflictWarnings,
      isLoading: false,

  setCurrentProject: (projectId: string) => {
    const project = get().projects.find(p => p.id === projectId) || null;
    set({ currentProject: project, currentChapter: null });
  },

  setCurrentChapter: (chapterId: string | null) => {
    const chapter = chapterId
      ? get().chapters.find(c => c.id === chapterId) || null
      : null;
    set({ currentChapter: chapter });
  },

  updateChapterContent: async (chapterId: string, content: string) => {
    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 300));

    const state = get();
    const prevChapter = state.chapters.find(c => c.id === chapterId);
    const wordCount = content.replace(/\s/g, '').length;

    set(state => ({
      chapters: state.chapters.map(c =>
        c.id === chapterId
          ? { ...c, content, wordCount, updatedAt: new Date() }
          : c
      ),
      currentChapter: state.currentChapter?.id === chapterId
        ? { ...state.currentChapter, content, wordCount, updatedAt: new Date() }
        : state.currentChapter,
      isLoading: false,
    }));

    if (prevChapter && prevChapter.content !== content) {
      const dmp = new diff_match_patch();
      const diffs = dmp.diff_main(prevChapter.content, content);
      let changedChars = 0;
      diffs.forEach(d => {
        if (d[0] !== 0) changedChars += d[1].replace(/\s/g, '').length;
      });

      if (changedChars >= 10) {
        const prevLen = prevChapter.content.replace(/\s/g, '').length;
        const newLen = wordCount;
        const delta = newLen - prevLen;
        const autoSummary = changedChars > 0
          ? `自动保存（${delta >= 0 ? '+' : ''}${delta}字）`
          : '自动保存';
        const newVersion: ChapterVersion = {
          id: `version-${Date.now()}`,
          chapterId,
          content,
          authorId: state.currentUser.id,
          author: state.currentUser,
          changeSummary: autoSummary,
          createdAt: new Date(),
        };
        set(state => ({
          chapterVersions: [...state.chapterVersions, newVersion],
        }));
      }
    }
  },

  lockChapter: async (chapterId: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const state = get();
    const chapter = state.chapters.find(c => c.id === chapterId);
    
    if (chapter?.lock && chapter.lock.userId !== state.currentUser.id) {
      return false;
    }

    const lock = {
      userId: state.currentUser.id,
      user: state.currentUser,
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };

    set(state => ({
      chapters: state.chapters.map(c =>
        c.id === chapterId ? { ...c, lock } : c
      ),
      currentChapter: state.currentChapter?.id === chapterId
        ? { ...state.currentChapter, lock }
        : state.currentChapter,
    }));

    return true;
  },

  unlockChapter: async (chapterId: string) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    set(state => ({
      chapters: state.chapters.map(c =>
        c.id === chapterId ? { ...c, lock: undefined } : c
      ),
      currentChapter: state.currentChapter?.id === chapterId
        ? { ...state.currentChapter, lock: undefined }
        : state.currentChapter,
    }));
  },

  checkAndReleaseExpiredLocks: () => {
    const now = new Date();
    set(state => {
      const updatedChapters = state.chapters.map(c => {
        if (c.lock && new Date(c.lock.expiresAt) <= now) {
          return { ...c, lock: undefined };
        }
        return c;
      });
      const currentChapterUpdated = state.currentChapter?.lock && new Date(state.currentChapter.lock.expiresAt) <= now
        ? { ...state.currentChapter, lock: undefined }
        : state.currentChapter;
      return {
        chapters: updatedChapters,
        currentChapter: currentChapterUpdated,
      };
    });
  },

  createVersion: async (chapterId: string, summary: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const state = get();
    const chapter = state.chapters.find(c => c.id === chapterId);
    if (!chapter) return;

    const newVersion: ChapterVersion = {
      id: `version-${Date.now()}`,
      chapterId,
      content: chapter.content,
      authorId: state.currentUser.id,
      author: state.currentUser,
      changeSummary: summary,
      createdAt: new Date(),
    };

    set(state => ({
      chapterVersions: [...state.chapterVersions, newVersion],
    }));
  },

  revertToVersion: async (versionId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const state = get();
    const version = state.chapterVersions.find(v => v.id === versionId);
    if (!version) return;

    const wordCount = version.content.replace(/\s/g, '').length;

    set(state => ({
      chapters: state.chapters.map(c =>
        c.id === version.chapterId
          ? { ...c, content: version.content, wordCount, updatedAt: new Date() }
          : c
      ),
      currentChapter: state.currentChapter?.id === version.chapterId
        ? { ...state.currentChapter, content: version.content, wordCount, updatedAt: new Date() }
        : state.currentChapter,
    }));

    await get().createVersion(version.chapterId, `回滚到版本 ${version.createdAt.toLocaleString()}`);
  },

  getDiff: (oldContent: string, newContent: string): Diff[] => {
    return dmp.diff_main(oldContent, newContent);
  },

  getChapterVersions: (chapterId: string): ChapterVersion[] => {
    return get().chapterVersions
      .filter(v => v.chapterId === chapterId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
    await new Promise(resolve => setTimeout(resolve, 300));
    const state = get();
    const chapter = state.chapters.find(c => c.id === chapterId);
    if (!chapter) return [];

    const warnings: ConflictWarning[] = [];

    set(s => ({
      conflictWarnings: s.conflictWarnings.filter(
        c => c.chapterId !== chapterId || c.resolved
      ),
    }));

    const contentLines = chapter.content.split('\n');

    state.characters.forEach(character => {
      if (character.projectId !== chapter.projectId) return;
      const nameMentions = contentLines.filter(line => line.includes(character.name));
      if (nameMentions.length > 0) {
        const existingAppearance = character.appearances.find(a => a.chapterId === chapterId);
        if (!existingAppearance) {
          let firstLine = -1;
          contentLines.forEach((line, idx) => {
            if (line.includes(character.name) && firstLine === -1) firstLine = idx + 1;
          });
          warnings.push({
            id: `conflict-char-${Date.now()}-${character.id}`,
            chapterId,
            characterId: character.id,
            character,
            severity: 'info',
            message: `检测到人物"${character.name}"在本章出场，但未在人物百科中标记为出场角色。建议更新人物出场记录。`,
            lineNumber: firstLine > 0 ? firstLine : undefined,
            createdAt: new Date(),
            resolved: false,
          });
        }

        const traitEntries = Object.entries(character.traits);
        for (const [key, value] of traitEntries) {
          const knownTraits = String(value).split(/[、,，]/);
          for (const trait of knownTraits) {
            const trimmed = trait.trim();
            if (trimmed.length >= 2) {
              const contradictoryPatterns = [
                { pattern: new RegExp(`不${trimmed}|非${trimmed}|没有${trimmed}|无${trimmed}`, 'g'), desc: `与"${trimmed}"矛盾` },
              ];
              for (const cp of contradictoryPatterns) {
                const matches = contentLines.filter(line => cp.pattern.test(line) && line.includes(character.name));
                if (matches.length > 0) {
                  warnings.push({
                    id: `conflict-trait-${Date.now()}-${character.id}-${key}`,
                    chapterId,
                    characterId: character.id,
                    character,
                    severity: 'warning',
                    message: `本章内容可能${cp.desc}：人物"${character.name}"的属性"${key}"设定为"${trimmed}"，但文中出现了"${cp.pattern.source.replace(/[\\|]/g, '|')}"的表述。`,
                    createdAt: new Date(),
                    resolved: false,
                  });
                }
              }
            }
          }
        }
      }
    });

    state.plotPoints.forEach(plotPoint => {
      if (plotPoint.status === 'resolved') return;
      if (plotPoint.projectId !== chapter.projectId) return;

      const relatedHints = plotPoint.hints.filter(h => h.chapterId === chapterId);
      const isRelatedChapter = plotPoint.relatedChapterIds.includes(chapterId);

      if (relatedHints.length > 0 || isRelatedChapter) {
        plotPoint.hints.forEach(hint => {
          if (hint.chapterId === chapterId) {
            const wasPresentBefore = relatedHints.length > 0;
            const isStillPresent = chapter.content.includes(hint.hintText) ||
              chapter.content.includes(hint.hintText.slice(0, Math.min(15, hint.hintText.length)));

            if (wasPresentBefore && !isStillPresent) {
              warnings.push({
                id: `conflict-foreshadow-removed-${Date.now()}-${hint.id}`,
                chapterId,
                plotPointId: plotPoint.id,
                plotPoint,
                severity: 'error',
                message: `伏笔"${plotPoint.title}"的线索"${hint.hintText.slice(0, 40)}..."似乎已从本章内容中被删除。这可能导致后续情节无法回收，请确认是否为有意修改。`,
                createdAt: new Date(),
                resolved: false,
              });
            } else if (isStillPresent) {
              let lineNumber = -1;
              contentLines.forEach((line, idx) => {
                if (line.includes(hint.hintText.slice(0, 15)) && lineNumber === -1) {
                  lineNumber = idx + 1;
                }
              });
              warnings.push({
                id: `conflict-foreshadow-present-${Date.now()}-${hint.id}`,
                chapterId,
                plotPointId: plotPoint.id,
                plotPoint,
                severity: 'info',
                message: `检测到伏笔"${plotPoint.title}"的线索：${hint.hintText.slice(0, 50)}。请确保与后续情节保持一致。`,
                lineNumber: lineNumber > 0 ? lineNumber : undefined,
                createdAt: new Date(),
                resolved: false,
              });
            }
          }
        });

        if (plotPoint.status === 'pending' && isRelatedChapter) {
          const descriptionKeywords = plotPoint.description
            .replace(/[，。！？、；：""''（）【】]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length >= 2);

          const matchedKeywords = descriptionKeywords.filter(kw =>
            chapter.content.includes(kw)
          );

          if (matchedKeywords.length > 0) {
            warnings.push({
              id: `conflict-pending-${Date.now()}-${plotPoint.id}`,
              chapterId,
              plotPointId: plotPoint.id,
              plotPoint,
              severity: 'warning',
              message: `本章内容涉及伏笔"${plotPoint.title}"（匹配关键词：${matchedKeywords.slice(0, 5).join('、')}），但该伏笔仍为"待回收"状态。如果本章推进了该伏笔的情节，请更新伏笔状态为"进行中"。`,
              createdAt: new Date(),
              resolved: false,
            });
          }
        }
      }
    });

    if (warnings.length > 0) {
      set(s => ({
        conflictWarnings: [
          ...s.conflictWarnings.filter(c => c.chapterId !== chapterId),
          ...warnings,
        ],
      }));
    }

    return warnings;
  },

  resolveConflict: (conflictId: string) => {
    set(state => ({
      conflictWarnings: state.conflictWarnings.map(c =>
        c.id === conflictId
          ? { ...c, resolved: true, resolvedAt: new Date() }
          : c
      ),
    }));
  },

  exportToPdf: async (config: PdfExportConfig) => {
    set({ isLoading: true });

    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

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

        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });

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
        const numImgWidth = 30;
        const numImgHeight = 3;
        doc.addImage(numImgData, 'PNG', (pageWidth - numImgWidth) / 2, pageHeight - margin.bottom / 2 - numImgHeight / 2, numImgWidth, numImgHeight);
      };

      let globalPageNum = 0;

      const nextPage = () => {
        doc.addPage();
        globalPageNum++;
      };

      if (config.includeCover) {
        globalPageNum++;
        const coverTitleSize = Math.max(24, config.fontSize + 20);
        const coverAuthorSize = Math.max(14, config.fontSize + 4);
        const coverHtml = `
          <div style="width:100%;height:${(pageHeight * mmToPx)}px;background:#1e3a5f;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;font-family:'Noto Serif SC','SimSun',serif;">
            <h1 style="font-size:${coverTitleSize}px;font-weight:bold;text-align:center;margin-bottom:16px;color:white;padding:0 40px;">${config.title}</h1>
            ${config.author ? `<p style="font-size:${coverAuthorSize}px;color:#d4af37;">${config.author}</p>` : ''}
            <div style="width:60px;height:2px;background:#d4af37;margin-top:32px;"></div>
          </div>
        `;
        const canvas = await renderHtmlToCanvas(coverHtml, Math.round(pageWidth * mmToPx));
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
        drawPageNumber(globalPageNum);
        nextPage();
      }

      if (config.includeToc) {
        globalPageNum++;
        const tocTitleSize = Math.max(16, config.fontSize + 6);
        const tocItems = config.chapterIds.map((chapterId, index) => {
          const chapter = get().chapters.find(c => c.id === chapterId);
          return chapter
            ? `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dotted #ccc;font-size:${config.fontSize}px;">
                <span>${index + 1}. ${chapter.title}</span>
                <span>${index + 2 + (config.includeCover ? 1 : 0)}</span>
              </div>`
            : '';
        }).join('');

        const tocHtml = `
          <div style="padding:0;">
            <h2 style="font-size:${tocTitleSize}px;font-weight:bold;color:#1e3a5f;margin-bottom:16px;">目录</h2>
            ${tocItems}
          </div>
        `;
        const canvas = await renderHtmlToCanvas(tocHtml, Math.round(contentWidth * mmToPx));
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgHeight = Math.min((canvas.height * contentWidth) / canvas.width, contentHeight);
        doc.addImage(imgData, 'JPEG', margin.left, margin.top, contentWidth, imgHeight);
        drawPageNumber(globalPageNum);
        nextPage();
      }

      const chapterTitleSize = Math.max(14, config.fontSize + 4);

      for (let i = 0; i < config.chapterIds.length; i++) {
        const chapterId = config.chapterIds[i];
        const chapter = get().chapters.find(c => c.id === chapterId);
        if (!chapter) continue;

        const chapterContent = chapter.content.replace(/\n/g, '<br/>');
        const chapterHtml = `
          <div style="padding:0;">
            <h2 style="font-size:${chapterTitleSize}px;font-weight:bold;color:#1e3a5f;margin-bottom:8px;">${chapter.title}</h2>
            <div style="width:40px;height:2px;background:#d4af37;margin-bottom:16px;"></div>
            <div style="font-size:${config.fontSize}px;line-height:${config.lineHeight};">${chapterContent}</div>
          </div>
        `;

        const widthPx = Math.round(contentWidth * mmToPx);
        const canvas = await renderHtmlToCanvas(chapterHtml, widthPx);

        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pageContentHeight = contentHeight;

        let yOffset = 0;
        let firstSliceOfChapter = true;
        while (yOffset < imgHeight) {
          if (!(i === 0 && !config.includeCover && !config.includeToc && firstSliceOfChapter)) {
            if (!firstSliceOfChapter) {
              nextPage();
            } else {
              globalPageNum++;
            }
          } else {
            globalPageNum++;
          }

          const sliceHeight = Math.min(pageContentHeight, imgHeight - yOffset);
          const sourceY = (yOffset / imgHeight) * canvas.height;
          const sourceHeight = (sliceHeight / imgHeight) * canvas.height;

          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.max(1, sourceHeight);
          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(
              canvas,
              0, sourceY, canvas.width, sourceHeight,
              0, 0, canvas.width, sourceHeight
            );
          }

          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
          doc.addImage(pageImgData, 'JPEG', margin.left, margin.top, imgWidth, sliceHeight);

          drawPageNumber(globalPageNum);
          yOffset += pageContentHeight;
          firstSliceOfChapter = false;
        }
      }

      doc.save(`${config.title || '小说'}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (title: string, description: string): Promise<Project> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const state = get();
    const newProject: Project = {
      id: `project-${Date.now()}`,
      title,
      description,
      creatorId: state.currentUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      members: [{
        userId: state.currentUser.id,
        user: state.currentUser,
        role: 'creator',
        joinedAt: new Date(),
      }],
    };

    set(state => ({
      projects: [...state.projects, newProject],
    }));

    return newProject;
  },

  createChapter: async (projectId: string, title: string, parentId?: string): Promise<Chapter> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const state = get();
    const projectChapters = state.chapters.filter(c => c.projectId === projectId);
    const newChapter: Chapter = {
      id: `chapter-${Date.now()}`,
      projectId,
      parentId,
      title,
      content: '',
      order: projectChapters.length + 1,
      wordCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set(state => ({
      chapters: [...state.chapters, newChapter],
    }));

    return newChapter;
  },

  updateChapterTitle: (chapterId: string, title: string) => {
    set(state => ({
      chapters: state.chapters.map(c =>
        c.id === chapterId ? { ...c, title, updatedAt: new Date() } : c
      ),
      currentChapter: state.currentChapter?.id === chapterId
        ? { ...state.currentChapter, title, updatedAt: new Date() }
        : state.currentChapter,
    }));
  },

  createCharacter: async (character): Promise<Character> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newCharacter: Character = {
      ...character,
      id: `char-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      relationships: [],
      appearances: [],
    } as Character;

    set(state => ({
      characters: [...state.characters, newCharacter],
    }));

    return newCharacter;
  },

  updateCharacter: (characterId: string, updates: Partial<Character>) => {
    set(state => ({
      characters: state.characters.map(c =>
        c.id === characterId
          ? { ...c, ...updates, updatedAt: new Date() }
          : c
      ),
    }));
  },

  createPlotPoint: async (plotPoint): Promise<PlotPoint> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newPlotPoint: PlotPoint = {
      ...plotPoint,
      id: `plot-${Date.now()}`,
      createdAt: new Date(),
      hints: [],
    };

    set(state => ({
      plotPoints: [...state.plotPoints, newPlotPoint],
    }));

    return newPlotPoint;
  },

  updatePlotPoint: (plotPointId: string, updates: Partial<PlotPoint>) => {
    set(state => ({
      plotPoints: state.plotPoints.map(p =>
        p.id === plotPointId
          ? { ...p, ...updates }
          : p
      ),
    }));
  },

  addPlotHint: (plotPointId: string, hint) => {
    set(state => ({
      plotPoints: state.plotPoints.map(p =>
        p.id === plotPointId
          ? {
              ...p,
              hints: [
                ...p.hints,
                {
                  ...hint,
                  id: `hint-${Date.now()}`,
                  createdAt: new Date(),
                },
              ],
            }
          : p
      ),
    }));
  },
    }),
    {
      name: 'novel-studio-storage',
      storage: createJSONStorage(() => localStorage, { reviver }),
      partialize: (state) => ({
        projects: state.projects,
        chapters: state.chapters,
        chapterVersions: state.chapterVersions,
        characters: state.characters,
        plotPoints: state.plotPoints,
        conflictWarnings: state.conflictWarnings,
      }),
      version: 1,
    }
  )
);
