export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface ProjectMember {
  userId: string;
  user: User;
  role: 'creator' | 'author' | 'viewer';
  joinedAt: Date;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  creatorId: string;
  createdAt: Date;
  updatedAt: Date;
  members: ProjectMember[];
}

export interface ChapterLock {
  userId: string;
  user: User;
  lockedAt: Date;
  expiresAt: Date;
}

export interface Chapter {
  id: string;
  projectId: string;
  parentId?: string;
  title: string;
  content: string;
  order: number;
  wordCount: number;
  lock?: ChapterLock;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChapterVersion {
  id: string;
  chapterId: string;
  content: string;
  authorId: string;
  author: User;
  changeSummary: string;
  createdAt: Date;
}

export interface CharacterRelation {
  id: string;
  characterId: string;
  targetId: string;
  target: Character;
  type: string;
  description?: string;
}

export interface CharacterAppearance {
  id: string;
  characterId: string;
  chapterId: string;
  chapter: Chapter;
  context?: string;
  createdAt: Date;
}

export interface VoiceSettings {
  pitch: number;
  rate: number;
  voiceName: string;
  voiceURI?: string;
  lang?: string;
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  avatarUrl?: string;
  description: string;
  traits: Record<string, string>;
  relationships: CharacterRelation[];
  appearances: CharacterAppearance[];
  voiceSettings?: VoiceSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlotHint {
  id: string;
  plotPointId: string;
  chapterId?: string;
  chapter?: Chapter;
  hintText: string;
  locationDescription?: string;
  createdAt: Date;
}

export type PlotPointType = 'foreshadow' | 'climax' | 'turning' | 'ending';
export type PlotPointStatus = 'pending' | 'active' | 'resolved';

export interface PlotPoint {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: PlotPointType;
  status: PlotPointStatus;
  relatedChapterIds: string[];
  relatedCharacterIds: string[];
  hints: PlotHint[];
  createdAt: Date;
}

export type ConflictSeverity = 'info' | 'warning' | 'error';

export interface ConflictWarning {
  id: string;
  chapterId: string;
  plotPointId?: string;
  plotPoint?: PlotPoint;
  characterId?: string;
  character?: Character;
  severity: ConflictSeverity;
  message: string;
  lineNumber?: number;
  columnNumber?: number;
  createdAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface DiffSegment {
  type: 'equal' | 'insert' | 'delete';
  content: string;
}

export interface PdfExportConfig {
  projectId: string;
  chapterIds: string[];
  includeCover: boolean;
  includeToc: boolean;
  includePageNumbers: boolean;
  title: string;
  author?: string;
  fontSize: number;
  lineHeight: number;
  margin: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export type StickyNoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple';

export interface StickyNote {
  id: string;
  projectId: string;
  content: string;
  color: StickyNoteColor;
  tags: string[];
  positionX: number;
  positionY: number;
  zIndex: number;
  width: number;
  height: number;
  rotation: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InspirationWall {
  id: string;
  projectId: string;
  notes: StickyNote[];
  background: 'cork' | 'paper' | 'wood';
}

export interface DashboardMonthlyWord {
  month: string;
  words: number;
}

export interface DashboardAuthorContribution {
  userId: string;
  username: string;
  avatarUrl: string;
  words: number;
  percentage: number;
}

export interface DashboardHeatmapCell {
  day: number;
  hour: number;
  count: number;
}

export interface DashboardChapterRadar {
  chapterId: string;
  chapterTitle: string;
  completion: number;
  plotProgress: number;
  characterDepth: number;
  description: number;
  dialogue: number;
}

export interface DashboardData {
  totalWords: number;
  authorCount: number;
  avgWordsPerDay: number;
  writingDays: number;
  monthlyWords: DashboardMonthlyWord[];
  authorContributions: DashboardAuthorContribution[];
  heatmap: DashboardHeatmapCell[];
  chapterRadars: DashboardChapterRadar[];
}
