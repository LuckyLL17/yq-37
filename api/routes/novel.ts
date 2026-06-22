import express from 'express';
import type { Request, Response } from 'express';
import {
  mockUsers,
  mockProjects,
  mockChapters,
  mockChapterVersions,
  mockCharacters,
  mockPlotPoints,
  mockConflictWarnings,
  mockStickyNotes,
  mockChapterBranches,
  mockBranchVersions,
} from '../data/mockData.js';
import type {
  PdfExportConfig,
  ConflictWarning,
  StickyNote,
  ChapterBranch,
  BranchVersion,
  ConflictBlock,
  BranchStatus,
} from '../../shared/types.js';
import { diff_match_patch } from 'diff-match-patch';
import { jsPDF } from 'jspdf';

const router = express.Router();
const dmp = new diff_match_patch();

// ==================== Users ====================

router.get('/users', (_req: Request, res: Response) => {
  res.json(mockUsers);
});

// ==================== Projects CRUD ====================

router.get('/projects', (_req: Request, res: Response) => {
  res.json(mockProjects);
});

router.get('/projects/:id', (req: Request, res: Response) => {
  const project = mockProjects.find(p => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

router.post('/projects', (req: Request, res: Response) => {
  const { title, description, creatorId } = req.body;
  const creator = mockUsers.find(u => u.id === creatorId);
  const newProject = {
    id: `project-${Date.now()}`,
    title,
    description: description || '',
    creatorId,
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [{
      userId: creatorId,
      user: creator!,
      role: 'creator' as const,
      joinedAt: new Date(),
    }],
  };
  mockProjects.push(newProject);
  res.status(201).json(newProject);
});

router.put('/projects/:id', (req: Request, res: Response) => {
  const { title, description, coverImage } = req.body;
  const index = mockProjects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });
  mockProjects[index] = {
    ...mockProjects[index],
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(coverImage !== undefined && { coverImage }),
    updatedAt: new Date(),
  };
  res.json(mockProjects[index]);
});

router.delete('/projects/:id', (req: Request, res: Response) => {
  const index = mockProjects.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Project not found' });

  const projectId = req.params.id;
  mockProjects.splice(index, 1);

  for (let i = mockChapters.length - 1; i >= 0; i--) {
    if (mockChapters[i].projectId === projectId) mockChapters.splice(i, 1);
  }
  for (let i = mockCharacters.length - 1; i >= 0; i--) {
    if (mockCharacters[i].projectId === projectId) mockCharacters.splice(i, 1);
  }
  for (let i = mockPlotPoints.length - 1; i >= 0; i--) {
    if (mockPlotPoints[i].projectId === projectId) mockPlotPoints.splice(i, 1);
  }

  res.json({ success: true });
});

// ==================== Chapters CRUD ====================

router.get('/projects/:id/chapters', (req: Request, res: Response) => {
  const chapters = mockChapters
    .filter(c => c.projectId === req.params.id)
    .sort((a, b) => a.order - b.order);
  res.json(chapters);
});

router.get('/chapters/:id', (req: Request, res: Response) => {
  const chapter = mockChapters.find(c => c.id === req.params.id);
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
  res.json(chapter);
});

router.post('/projects/:id/chapters', (req: Request, res: Response) => {
  const { title, parentId } = req.body;
  const projectId = req.params.id;
  const project = mockProjects.find(p => p.id === projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const projectChapters = mockChapters.filter(c => c.projectId === projectId);
  const maxOrder = projectChapters.length > 0
    ? Math.max(...projectChapters.map(c => c.order))
    : 0;

  const newChapter = {
    id: `chapter-${Date.now()}`,
    projectId,
    ...(parentId && { parentId }),
    title: title || `第${projectChapters.length + 1}章`,
    content: '',
    order: maxOrder + 1,
    wordCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockChapters.push(newChapter);
  res.status(201).json(newChapter);
});

router.put('/chapters/:id', (req: Request, res: Response) => {
  const { content, title } = req.body;
  const chapterIndex = mockChapters.findIndex(c => c.id === req.params.id);
  if (chapterIndex === -1) return res.status(404).json({ error: 'Chapter not found' });

  mockChapters[chapterIndex] = {
    ...mockChapters[chapterIndex],
    content: content ?? mockChapters[chapterIndex].content,
    title: title ?? mockChapters[chapterIndex].title,
    wordCount: content ? content.replace(/\s/g, '').length : mockChapters[chapterIndex].wordCount,
    updatedAt: new Date(),
  };
  res.json(mockChapters[chapterIndex]);
});

router.delete('/chapters/:id', (req: Request, res: Response) => {
  const index = mockChapters.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Chapter not found' });

  const chapterId = req.params.id;
  mockChapters.splice(index, 1);

  for (let i = mockChapterVersions.length - 1; i >= 0; i--) {
    if (mockChapterVersions[i].chapterId === chapterId) mockChapterVersions.splice(i, 1);
  }
  for (let i = mockConflictWarnings.length - 1; i >= 0; i--) {
    if (mockConflictWarnings[i].chapterId === chapterId) mockConflictWarnings.splice(i, 1);
  }

  res.json({ success: true });
});

// ==================== Chapter Lock ====================

router.post('/chapters/:id/lock', (req: Request, res: Response) => {
  const { userId } = req.body;
  const chapter = mockChapters.find(c => c.id === req.params.id);
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

  if (chapter.lock && chapter.lock.userId !== userId) {
    return res.status(409).json({ error: 'Chapter already locked by another user' });
  }

  const user = mockUsers.find(u => u.id === userId);
  chapter.lock = {
    userId,
    user: user!,
    lockedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  };
  res.json({ success: true, lock: chapter.lock });
});

router.post('/chapters/:id/unlock', (req: Request, res: Response) => {
  const chapter = mockChapters.find(c => c.id === req.params.id);
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });
  chapter.lock = undefined;
  res.json({ success: true });
});

router.post('/chapters/release-expired', (_req: Request, res: Response) => {
  const now = new Date();
  let released = 0;
  mockChapters.forEach(c => {
    if (c.lock && new Date(c.lock.expiresAt) <= now) {
      c.lock = undefined;
      released++;
    }
  });
  res.json({ success: true, released });
});

// ==================== Versions ====================

router.get('/chapters/:id/history', (req: Request, res: Response) => {
  const versions = mockChapterVersions
    .filter(v => v.chapterId === req.params.id)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  res.json(versions);
});

router.post('/chapters/:id/versions', (req: Request, res: Response) => {
  const { content, authorId, changeSummary } = req.body;
  const author = mockUsers.find(u => u.id === authorId);
  const newVersion = {
    id: `version-${Date.now()}`,
    chapterId: req.params.id,
    content,
    authorId,
    author: author!,
    changeSummary,
    createdAt: new Date(),
  };
  mockChapterVersions.push(newVersion);
  res.status(201).json(newVersion);
});

router.post('/versions/:id/revert', (req: Request, res: Response) => {
  const version = mockChapterVersions.find(v => v.id === req.params.id);
  if (!version) return res.status(404).json({ error: 'Version not found' });

  const chapterIndex = mockChapters.findIndex(c => c.id === version.chapterId);
  if (chapterIndex === -1) return res.status(404).json({ error: 'Chapter not found' });

  mockChapters[chapterIndex] = {
    ...mockChapters[chapterIndex],
    content: version.content,
    wordCount: version.content.replace(/\s/g, '').length,
    updatedAt: new Date(),
  };
  res.json({ success: true, chapter: mockChapters[chapterIndex] });
});

router.get('/versions/diff', (req: Request, res: Response) => {
  const { oldContent, newContent } = req.query;
  if (typeof oldContent !== 'string' || typeof newContent !== 'string') {
    return res.status(400).json({ error: 'Invalid parameters' });
  }
  const diff = dmp.diff_main(oldContent, newContent);
  res.json(diff);
});

// ==================== Characters CRUD ====================

router.get('/projects/:id/characters', (req: Request, res: Response) => {
  const characters = mockCharacters.filter(c => c.projectId === req.params.id);
  res.json(characters);
});

router.get('/characters/:id', (req: Request, res: Response) => {
  const character = mockCharacters.find(c => c.id === req.params.id);
  if (!character) return res.status(404).json({ error: 'Character not found' });
  res.json(character);
});

router.post('/projects/:id/characters', (req: Request, res: Response) => {
  const character = {
    ...req.body,
    id: `char-${Date.now()}`,
    projectId: req.params.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    relationships: req.body.relationships || [],
    appearances: req.body.appearances || [],
  };
  mockCharacters.push(character);
  res.status(201).json(character);
});

router.put('/characters/:id', (req: Request, res: Response) => {
  const index = mockCharacters.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Character not found' });
  mockCharacters[index] = { ...mockCharacters[index], ...req.body, updatedAt: new Date() };
  res.json(mockCharacters[index]);
});

router.delete('/characters/:id', (req: Request, res: Response) => {
  const index = mockCharacters.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Character not found' });

  const charId = req.params.id;
  mockCharacters.splice(index, 1);

  for (let i = mockConflictWarnings.length - 1; i >= 0; i--) {
    if (mockConflictWarnings[i].characterId === charId) mockConflictWarnings.splice(i, 1);
  }

  res.json({ success: true });
});

// ==================== Plot CRUD ====================

router.get('/projects/:id/plot', (req: Request, res: Response) => {
  const plotPoints = mockPlotPoints.filter(p => p.projectId === req.params.id);
  res.json(plotPoints);
});

router.post('/projects/:id/plot', (req: Request, res: Response) => {
  const newPlotPoint = {
    ...req.body,
    id: `plot-${Date.now()}`,
    projectId: req.params.id,
    createdAt: new Date(),
    hints: req.body.hints || [],
  };
  mockPlotPoints.push(newPlotPoint);
  res.status(201).json(newPlotPoint);
});

router.put('/plot/:id', (req: Request, res: Response) => {
  const index = mockPlotPoints.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Plot point not found' });
  mockPlotPoints[index] = { ...mockPlotPoints[index], ...req.body };
  res.json(mockPlotPoints[index]);
});

router.delete('/plot/:id', (req: Request, res: Response) => {
  const index = mockPlotPoints.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Plot point not found' });

  const plotId = req.params.id;
  mockPlotPoints.splice(index, 1);

  for (let i = mockConflictWarnings.length - 1; i >= 0; i--) {
    if (mockConflictWarnings[i].plotPointId === plotId) mockConflictWarnings.splice(i, 1);
  }

  res.json({ success: true });
});

router.post('/plot/:id/hints', (req: Request, res: Response) => {
  const plotPoint = mockPlotPoints.find(p => p.id === req.params.id);
  if (!plotPoint) return res.status(404).json({ error: 'Plot point not found' });

  const hint = {
    ...req.body,
    id: `hint-${Date.now()}`,
    plotPointId: req.params.id,
    createdAt: new Date(),
  };
  plotPoint.hints.push(hint);
  res.status(201).json(hint);
});

// ==================== Conflict Check ====================

router.post('/projects/:id/plot/check', (req: Request, res: Response) => {
  const { chapterId } = req.body;
  const chapter = mockChapters.find(c => c.id === chapterId);
  if (!chapter) return res.status(404).json({ error: 'Chapter not found' });

  for (let i = mockConflictWarnings.length - 1; i >= 0; i--) {
    if (mockConflictWarnings[i].chapterId === chapterId && !mockConflictWarnings[i].resolved) {
      mockConflictWarnings.splice(i, 1);
    }
  }

  const warnings: ConflictWarning[] = [];
  const contentLines = chapter.content.split('\n');
  const projectId = req.params.id;

  mockCharacters.forEach(character => {
    if (character.projectId !== projectId) return;
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
            const pattern = new RegExp(`不${trimmed}|非${trimmed}|没有${trimmed}|无${trimmed}`, 'g');
            const matches = contentLines.filter(line => pattern.test(line) && line.includes(character.name));
            if (matches.length > 0) {
              warnings.push({
                id: `conflict-trait-${Date.now()}-${character.id}-${key}`,
                chapterId,
                characterId: character.id,
                character,
                severity: 'warning',
                message: `本章内容可能与"${trimmed}"矛盾：人物"${character.name}"的属性"${key}"设定为"${trimmed}"，但文中出现了否定表述。`,
                createdAt: new Date(),
                resolved: false,
              });
            }
          }
        }
      }
    }
  });

  mockPlotPoints.forEach(plotPoint => {
    if (plotPoint.status === 'resolved') return;
    if (plotPoint.projectId !== projectId) return;

    const relatedHints = plotPoint.hints.filter(h => h.chapterId === chapterId);
    const isRelatedChapter = plotPoint.relatedChapterIds.includes(chapterId);

    if (relatedHints.length > 0 || isRelatedChapter) {
      plotPoint.hints.forEach(hint => {
        if (hint.chapterId === chapterId) {
          const isStillPresent = chapter.content.includes(hint.hintText) ||
            chapter.content.includes(hint.hintText.slice(0, Math.min(15, hint.hintText.length)));

          if (!isStillPresent) {
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
          } else {
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

  warnings.forEach(w => mockConflictWarnings.push(w));

  res.json(warnings);
});

// ==================== Conflict Resolution ====================

router.put('/conflicts/:id/resolve', (req: Request, res: Response) => {
  const warning = mockConflictWarnings.find(c => c.id === req.params.id);
  if (!warning) return res.status(404).json({ error: 'Conflict not found' });
  warning.resolved = true;
  warning.resolvedAt = new Date();
  res.json({ success: true });
});

// ==================== PDF Export ====================

router.post('/export/pdf', async (req: Request, res: Response) => {
  const config: PdfExportConfig = req.body;

  const selectedChapters = mockChapters
    .filter(c => config.chapterIds.includes(c.id))
    .sort((a, b) => {
      const aIdx = config.chapterIds.indexOf(a.id);
      const bIdx = config.chapterIds.indexOf(b.id);
      return aIdx - bIdx;
    });

  try {
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

    let pageNum = 0;

    const addPageNum = () => {
      pageNum++;
      if (config.includePageNumbers) {
        doc.setFontSize(10);
        doc.setTextColor(136, 136, 136);
        doc.text(`- ${pageNum} -`, pageWidth / 2, pageHeight - margin.bottom / 2, { align: 'center' });
      }
    };

    if (config.includeCover) {
      doc.setFillColor(30, 58, 95);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(Math.max(24, config.fontSize + 20));
      doc.text(config.title, pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });
      if (config.author) {
        doc.setTextColor(212, 175, 55);
        doc.setFontSize(Math.max(14, config.fontSize + 4));
        doc.text(config.author, pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });
      }
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 - 30, pageHeight / 2 + 25, pageWidth / 2 + 30, pageHeight / 2 + 25);
      addPageNum();
      doc.addPage();
    }

    if (config.includeToc) {
      doc.setTextColor(30, 58, 95);
      doc.setFontSize(Math.max(16, config.fontSize + 6));
      doc.text('目录', margin.left, margin.top + 10);
      doc.setFontSize(config.fontSize);
      doc.setTextColor(0, 0, 0);
      let tocY = margin.top + 25;
      selectedChapters.forEach((ch, idx) => {
        doc.text(`${idx + 1}. ${ch.title}`, margin.left, tocY);
        tocY += 8;
      });
      addPageNum();
      doc.addPage();
    }

    for (const chapter of selectedChapters) {
      doc.setTextColor(30, 58, 95);
      doc.setFontSize(Math.max(14, config.fontSize + 4));
      doc.text(chapter.title, margin.left, margin.top + 10);
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(margin.left, margin.top + 14, margin.left + 40, margin.top + 14);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(config.fontSize);
      const lines = doc.splitTextToSize(chapter.content, contentWidth);
      let y = margin.top + 25;
      const lineHeight = config.fontSize * config.lineHeight * 0.35;

      for (const line of lines) {
        if (y + lineHeight > pageHeight - margin.bottom) {
          addPageNum();
          doc.addPage();
          y = margin.top;
        }
        doc.text(line, margin.left, y);
        y += lineHeight;
      }
      addPageNum();
      if (selectedChapters.indexOf(chapter) < selectedChapters.length - 1) {
        doc.addPage();
      }
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(config.title || '小说')}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF export failed:', err);
    res.json({
      success: true,
      filename: `${config.title || '小说'}.pdf`,
      chapterCount: selectedChapters.length,
      totalWords: selectedChapters.reduce((sum, c) => sum + c.wordCount, 0),
    });
  }
});

// ==================== Sticky Notes CRUD ====================

router.get('/projects/:id/notes', (req: Request, res: Response) => {
  const notes = mockStickyNotes.filter(n => n.projectId === req.params.id);
  res.json(notes);
});

router.post('/projects/:id/notes', (req: Request, res: Response) => {
  const projectId = req.params.id;
  const project = mockProjects.find(p => p.id === projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const maxZ = mockStickyNotes.filter(n => n.projectId === projectId).length;
  const newNote: StickyNote = {
    id: `note-${Date.now()}`,
    projectId,
    content: req.body.content || '',
    color: req.body.color || 'yellow',
    tags: req.body.tags || [],
    positionX: req.body.positionX ?? 100 + Math.random() * 200,
    positionY: req.body.positionY ?? 100 + Math.random() * 200,
    zIndex: maxZ + 1,
    width: req.body.width || 240,
    height: req.body.height || 160,
    rotation: req.body.rotation ?? (Math.random() - 0.5) * 6,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockStickyNotes.push(newNote);
  res.status(201).json(newNote);
});

router.put('/notes/:id', (req: Request, res: Response) => {
  const index = mockStickyNotes.findIndex(n => n.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Note not found' });

  mockStickyNotes[index] = {
    ...mockStickyNotes[index],
    ...req.body,
    updatedAt: new Date(),
  };
  res.json(mockStickyNotes[index]);
});

router.put('/notes/:id/position', (req: Request, res: Response) => {
  const index = mockStickyNotes.findIndex(n => n.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Note not found' });

  const { positionX, positionY, zIndex, rotation } = req.body;
  mockStickyNotes[index] = {
    ...mockStickyNotes[index],
    positionX: positionX ?? mockStickyNotes[index].positionX,
    positionY: positionY ?? mockStickyNotes[index].positionY,
    zIndex: zIndex ?? mockStickyNotes[index].zIndex,
    rotation: rotation ?? mockStickyNotes[index].rotation,
    updatedAt: new Date(),
  };
  res.json(mockStickyNotes[index]);
});

router.delete('/notes/:id', (req: Request, res: Response) => {
  const index = mockStickyNotes.findIndex(n => n.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Note not found' });
  mockStickyNotes.splice(index, 1);
  res.json({ success: true });
});

router.put('/projects/:id/notes/reorder', (req: Request, res: Response) => {
  const projectId = req.params.id;
  const { noteIds } = req.body;

  const projectNotes = mockStickyNotes.filter(n => n.projectId === projectId);
  noteIds.forEach((noteId: string, index: number) => {
    const note = projectNotes.find(n => n.id === noteId);
    if (note) {
      note.zIndex = index + 1;
      note.updatedAt = new Date();
    }
  });

  res.json({ success: true });
});

// ==================== Branches ====================

const ensureMainBranch = (chapterId: string) => {
  const existingMain = mockChapterBranches.find(b => b.chapterId === chapterId && b.isMain);
  if (existingMain) return existingMain;

  const chapter = mockChapters.find(c => c.id === chapterId);
  if (!chapter) return null;

  const mainBranch: ChapterBranch = {
    id: `branch-${chapterId}-main`,
    chapterId,
    name: '主线',
    description: `${chapter.title} 主线剧情`,
    isMain: true,
    status: 'active',
    creatorId: mockUsers[0].id,
    creator: mockUsers[0],
    currentContent: chapter.content,
    wordCount: chapter.wordCount,
    createdAt: chapter.createdAt,
    updatedAt: chapter.updatedAt,
    color: '#d4af37',
  };

  mockChapterBranches.unshift(mainBranch);
  return mainBranch;
};

router.get('/chapters/:id/branches', (req: Request, res: Response) => {
  const chapterId = req.params.id;
  ensureMainBranch(chapterId);
  const branches = mockChapterBranches.filter(b => b.chapterId === chapterId);
  res.json(branches);
});

router.get('/branches/:id', (req: Request, res: Response) => {
  const branch = mockChapterBranches.find(b => b.id === req.params.id);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });
  res.json(branch);
});

router.post('/chapters/:id/branches', (req: Request, res: Response) => {
  const chapterId = req.params.id;
  const { name, description, parentBranchId, color, baseVersionId } = req.body;

  const mainBranch = ensureMainBranch(chapterId);
  if (!mainBranch) return res.status(404).json({ error: 'Chapter not found' });

  const parentBranch = parentBranchId
    ? mockChapterBranches.find(b => b.id === parentBranchId)
    : mainBranch;

  if (!parentBranch) return res.status(400).json({ error: 'Parent branch not found' });

  const creator = mockUsers[0];
  const newBranch: ChapterBranch = {
    id: `branch-${Date.now()}`,
    chapterId,
    name: name || '新分支',
    description: description || '',
    parentBranchId: parentBranch.id,
    baseVersionId: baseVersionId,
    isMain: false,
    status: 'active',
    creatorId: creator.id,
    creator,
    currentContent: parentBranch.currentContent,
    wordCount: parentBranch.wordCount,
    createdAt: new Date(),
    updatedAt: new Date(),
    color: color || '#7c3aed',
  };

  mockChapterBranches.push(newBranch);

  const initialVersion: BranchVersion = {
    id: `bv-${Date.now()}`,
    branchId: newBranch.id,
    content: parentBranch.currentContent,
    authorId: creator.id,
    author: creator,
    changeSummary: '创建分支',
    createdAt: new Date(),
    wordCount: parentBranch.wordCount,
  };
  mockBranchVersions.push(initialVersion);

  res.status(201).json(newBranch);
});

router.put('/branches/:id', (req: Request, res: Response) => {
  const branch = mockChapterBranches.find(b => b.id === req.params.id);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });

  const { name, description, status } = req.body;
  if (name !== undefined) branch.name = name;
  if (description !== undefined) branch.description = description;
  if (status !== undefined) branch.status = status as BranchStatus;
  branch.updatedAt = new Date();

  res.json(branch);
});

router.delete('/branches/:id', (req: Request, res: Response) => {
  const index = mockChapterBranches.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Branch not found' });

  const branch = mockChapterBranches[index];
  if (branch.isMain) return res.status(400).json({ error: 'Cannot delete main branch' });

  for (let i = mockBranchVersions.length - 1; i >= 0; i--) {
    if (mockBranchVersions[i].branchId === branch.id) {
      mockBranchVersions.splice(i, 1);
    }
  }

  mockChapterBranches.splice(index, 1);
  res.json({ success: true });
});

router.get('/branches/:id/versions', (req: Request, res: Response) => {
  const branchId = req.params.id;
  const versions = mockBranchVersions
    .filter(v => v.branchId === branchId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(versions);
});

router.post('/branches/:id/versions', (req: Request, res: Response) => {
  const branch = mockChapterBranches.find(b => b.id === req.params.id);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });

  const { content, summary } = req.body;
  const creator = mockUsers[0];
  const wordCount = (content || branch.currentContent).replace(/\s/g, '').length;

  const newVersion: BranchVersion = {
    id: `bv-${Date.now()}`,
    branchId: branch.id,
    content: content || branch.currentContent,
    authorId: creator.id,
    author: creator,
    changeSummary: summary || '更新内容',
    createdAt: new Date(),
    wordCount,
  };

  mockBranchVersions.push(newVersion);
  branch.currentContent = content || branch.currentContent;
  branch.wordCount = wordCount;
  branch.updatedAt = new Date();

  if (branch.isMain) {
    const chapter = mockChapters.find(c => c.id === branch.chapterId);
    if (chapter) {
      chapter.content = content || branch.currentContent;
      chapter.wordCount = wordCount;
      chapter.updatedAt = new Date();
    }
  }

  res.status(201).json(newVersion);
});

router.post('/branches/:id/merge', (req: Request, res: Response) => {
  const sourceBranch = mockChapterBranches.find(b => b.id === req.params.id);
  if (!sourceBranch) return res.status(404).json({ error: 'Source branch not found' });

  const { targetBranchId, resolutions } = req.body;
  const targetBranch = mockChapterBranches.find(b => b.id === targetBranchId);
  if (!targetBranch) return res.status(404).json({ error: 'Target branch not found' });

  const diffResult = dmp.diff_main(targetBranch.currentContent, sourceBranch.currentContent);
  dmp.diff_cleanupSemantic(diffResult);

  const conflicts: ConflictBlock[] = [];
  let mergedContent = '';
  let hasConflicts = false;
  let conflictIndex = 0;

  const sourceLines = sourceBranch.currentContent.split('\n');
  const targetLines = targetBranch.currentContent.split('\n');
  const minLines = Math.min(sourceLines.length, targetLines.length);

  for (let i = 0; i < minLines; i++) {
    if (sourceLines[i] !== targetLines[i]) {
      hasConflicts = true;
      const conflict: ConflictBlock = {
        id: `conflict-${conflictIndex++}`,
        startIndex: i,
        endIndex: i,
        baseContent: targetLines[i],
        branchContent: sourceLines[i],
        resolution: 'pending',
      };
      conflicts.push(conflict);

      if (resolutions && resolutions[conflict.id]) {
        const resolution = resolutions[conflict.id];
        if (resolution === 'keep-base') {
          mergedContent += targetLines[i] + '\n';
        } else if (resolution === 'keep-branch') {
          mergedContent += sourceLines[i] + '\n';
        } else if (resolution === 'custom' && resolutions[`${conflict.id}-custom`]) {
          mergedContent += resolutions[`${conflict.id}-custom`] + '\n';
        } else {
          mergedContent += targetLines[i] + '\n';
        }
      } else {
        mergedContent += targetLines[i] + '\n';
      }
    } else {
      mergedContent += targetLines[i] + '\n';
    }
  }

  if (sourceLines.length > minLines) {
    for (let i = minLines; i < sourceLines.length; i++) {
      hasConflicts = true;
      const conflict: ConflictBlock = {
        id: `conflict-${conflictIndex++}`,
        startIndex: i,
        endIndex: i,
        baseContent: '',
        branchContent: sourceLines[i],
        resolution: 'pending',
      };
      conflicts.push(conflict);
      if (resolutions && resolutions[conflict.id] === 'keep-branch') {
        mergedContent += sourceLines[i] + '\n';
      }
    }
  }

  if (targetLines.length > minLines) {
    for (let i = minLines; i < targetLines.length; i++) {
      mergedContent += targetLines[i] + '\n';
    }
  }

  mergedContent = mergedContent.trimEnd();

  if (!hasConflicts || (resolutions && Object.keys(resolutions).length > 0)) {
    targetBranch.currentContent = mergedContent;
    targetBranch.wordCount = mergedContent.replace(/\s/g, '').length;
    targetBranch.updatedAt = new Date();

    if (sourceBranch.status === 'active') {
      sourceBranch.status = 'merged';
      sourceBranch.mergedAt = new Date();
    }

    if (targetBranch.isMain) {
      const chapter = mockChapters.find(c => c.id === targetBranch.chapterId);
      if (chapter) {
        chapter.content = mergedContent;
        chapter.wordCount = mergedContent.replace(/\s/g, '').length;
        chapter.updatedAt = new Date();
      }
    }

    res.json({
      success: true,
      hasConflicts,
      conflicts,
      mergedContent,
      message: hasConflicts ? '已解决冲突并完成合并' : '合并成功，无冲突',
    });
  } else {
    res.json({
      success: false,
      hasConflicts: true,
      conflicts,
      message: '检测到冲突，请解决后再合并',
    });
  }
});

router.get('/branches/diff', (req: Request, res: Response) => {
  const { branchAId, branchBId } = req.query;
  const branchA = mockChapterBranches.find(b => b.id === branchAId);
  const branchB = mockChapterBranches.find(b => b.id === branchBId);

  if (!branchA || !branchB) {
    return res.status(404).json({ error: 'Branch not found' });
  }

  const diffs = dmp.diff_main(branchA.currentContent, branchB.currentContent);
  dmp.diff_cleanupSemantic(diffs);

  const wordCountDelta = branchB.wordCount - branchA.wordCount;

  res.json({
    branchA,
    branchB,
    diffs,
    wordCountDelta,
  });
});

export default router;
