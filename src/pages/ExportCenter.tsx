import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Download,
  FileText,
  Check,
  ChevronsUpDown,
  BookOpen,
  FileDown,
  Settings,
  Eye,
  Loader2,
  CheckCircle2,
  FileType,
  FileCode,
  BookMarked,
  Palette,
  Code2,
  RefreshCw,
} from 'lucide-react';
import { useAppStore, PDF_TEMPLATES } from '@/store/appStore';
import { cn } from '@/lib/utils';
import type {
  ExportFormat,
  PdfTemplateId,
  PdfExportConfig,
  EpubExportConfig,
  MarkdownExportConfig,
  TxtExportConfig,
} from '@shared/types';

export default function ExportCenter() {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    chapters,
    currentProject,
    exportToPdf,
    exportToMarkdown,
    exportToTxt,
    exportToEpub,
    isLoading,
  } = useAppStore();

  const [step, setStep] = useState<'select' | 'format' | 'config' | 'preview'>('select');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [customCss, setCustomCss] = useState('');
  const [showCssEditor, setShowCssEditor] = useState(false);
  const [previewMode, setPreviewMode] = useState<'cover' | 'content' | 'toc'>('cover');

  const [pdfConfig, setPdfConfig] = useState<PdfExportConfig>({
    projectId: projectId!,
    chapterIds: [],
    includeCover: true,
    includeToc: true,
    includePageNumbers: true,
    title: currentProject?.title || '',
    author: '',
    fontSize: 12,
    lineHeight: 1.5,
    margin: { top: 20, bottom: 20, left: 25, right: 25 },
    templateId: 'classic',
    customCss: '',
  });

  const [epubConfig, setEpubConfig] = useState<EpubExportConfig>({
    projectId: projectId!,
    chapterIds: [],
    includeCover: true,
    includeToc: true,
    title: currentProject?.title || '',
    author: '',
    language: 'zh-CN',
    customCss: '',
  });

  const [mdConfig, setMdConfig] = useState<MarkdownExportConfig>({
    projectId: projectId!,
    chapterIds: [],
    includeCover: true,
    includeToc: true,
    title: currentProject?.title || '',
    author: '',
    useChapterNumbers: true,
    customCss: '',
  });

  const [txtConfig, setTxtConfig] = useState<TxtExportConfig>({
    projectId: projectId!,
    chapterIds: [],
    includeCover: true,
    includeToc: true,
    title: currentProject?.title || '',
    author: '',
    useChapterNumbers: true,
    chapterSeparator: '\n\n====================\n\n',
    customCss: '',
  });

  const projectChapters = useMemo(
    () => chapters.filter((c) => c.projectId === projectId),
    [chapters, projectId]
  );

  const totalWords = useMemo(
    () =>
      selectedChapters.reduce((sum, id) => {
        const chapter = projectChapters.find((c) => c.id === id);
        return sum + (chapter?.wordCount || 0);
      }, 0),
    [selectedChapters, projectChapters]
  );

  const currentTemplate = PDF_TEMPLATES[pdfConfig.templateId || 'classic'];

  const toggleChapter = (chapterId: string) => {
    setSelectedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const selectAll = () => {
    setSelectedChapters(projectChapters.map((c) => c.id));
  };

  const deselectAll = () => {
    setSelectedChapters([]);
  };

  const moveChapter = (index: number, direction: 'up' | 'down') => {
    const newSelected = [...selectedChapters];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newSelected.length) return;
    [newSelected[index], newSelected[newIndex]] = [
      newSelected[newIndex],
      newSelected[index],
    ];
    setSelectedChapters(newSelected);
  };

  const getChapterTitle = (chapterId: string) => {
    return projectChapters.find((c) => c.id === chapterId)?.title || '未知章节';
  };

  const getChapterWordCount = (chapterId: string) => {
    return projectChapters.find((c) => c.id === chapterId)?.wordCount || 0;
  };

  const handleExport = async () => {
    const baseConfig = {
      projectId: projectId!,
      chapterIds: selectedChapters,
      customCss: customCss || undefined,
    };

    if (exportFormat === 'pdf') {
      await exportToPdf({ ...pdfConfig, ...baseConfig });
    } else if (exportFormat === 'epub') {
      await exportToEpub({ ...epubConfig, ...baseConfig });
    } else if (exportFormat === 'markdown') {
      await exportToMarkdown({ ...mdConfig, ...baseConfig });
    } else if (exportFormat === 'txt') {
      await exportToTxt({ ...txtConfig, ...baseConfig });
    }
  };

  const formatOptions: Array<{
    id: ExportFormat;
    name: string;
    description: string;
    icon: typeof FileText;
    ext: string;
  }> = [
    { id: 'pdf', name: 'PDF 文档', description: '适合印刷和分享，保留排版样式', icon: FileText, ext: '.pdf' },
    { id: 'epub', name: 'EPUB 电子书', description: '适用于 Kindle、Apple Books 等阅读器', icon: BookMarked, ext: '.epub' },
    { id: 'markdown', name: 'Markdown', description: '纯文本轻量格式，便于版本管理', icon: FileCode, ext: '.md' },
    { id: 'txt', name: 'TXT 纯文本', description: '兼容性最好，可在任何设备打开', icon: FileType, ext: '.txt' },
  ];

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-bold text-ink-800 flex items-center gap-3">
              <Download className="w-7 h-7 text-gold-500" />
              导出中心
            </h1>
            <p className="text-ink-500 mt-1">
              选择章节和导出格式，配置模板和样式，实时预览导出效果
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                step === 'select'
                  ? 'bg-ink-800 text-white'
                  : 'bg-paper-200 text-ink-500'
              )}
            >
              1. 选择章节
            </span>
            <ChevronsUpDown className="w-4 h-4 text-ink-300" />
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                step === 'format'
                  ? 'bg-ink-800 text-white'
                  : 'bg-paper-200 text-ink-500'
              )}
            >
              2. 选择格式
            </span>
            <ChevronsUpDown className="w-4 h-4 text-ink-300" />
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                step === 'config'
                  ? 'bg-ink-800 text-white'
                  : 'bg-paper-200 text-ink-500'
              )}
            >
              3. 配置
            </span>
            <ChevronsUpDown className="w-4 h-4 text-ink-300" />
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium transition-colors',
                step === 'preview'
                  ? 'bg-ink-800 text-white'
                  : 'bg-paper-200 text-ink-500'
              )}
            >
              4. 预览导出
            </span>
          </div>
        </div>

        {step === 'select' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="font-serif text-lg font-bold text-ink-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gold-500" />
                  选择要导出的章节
                </h2>
                <span className="text-sm text-ink-400">
                  已选择 {selectedChapters.length} / {projectChapters.length} 章
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-gold-600 hover:text-gold-700 font-medium"
                >
                  全选
                </button>
                <span className="text-ink-300">|</span>
                <button
                  onClick={deselectAll}
                  className="text-sm text-ink-500 hover:text-ink-600 font-medium"
                >
                  取消全选
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-paper-50 rounded-xl border border-paper-200 p-4">
                <h3 className="font-medium text-ink-700 mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gold-500" />
                  可选章节
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                  {projectChapters.map((chapter, index) => {
                    const isSelected = selectedChapters.includes(chapter.id);
                    return (
                      <div
                        key={chapter.id}
                        onClick={() => !isSelected && toggleChapter(chapter.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                          isSelected
                            ? 'bg-gold-50 border-gold-300 opacity-50 cursor-not-allowed'
                            : 'bg-white border-paper-200 hover:border-gold-300 hover:shadow-paper-hover'
                        )}
                      >
                        <div
                          className={cn(
                            'w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0',
                            isSelected
                              ? 'bg-gold-500 border-gold-500 text-white'
                              : 'border-ink-300'
                          )}
                        >
                          {isSelected && <Check className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-ink-400">
                              第{index + 1}章
                            </span>
                            <span className="font-medium text-ink-700 truncate">
                              {chapter.title}
                            </span>
                          </div>
                          <span className="text-xs text-ink-400">
                            {chapter.wordCount.toLocaleString()} 字
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-xs px-2 py-0.5 bg-gold-100 text-gold-700 rounded-full">
                            已选择
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-paper-50 rounded-xl border border-paper-200 p-4">
                <h3 className="font-medium text-ink-700 mb-4 flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-gold-500" />
                  导出顺序（可调整）
                </h3>
                {selectedChapters.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                    {selectedChapters.map((chapterId, index) => (
                      <div
                        key={chapterId}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gold-200 shadow-sm group"
                      >
                        <div className="w-6 h-6 rounded bg-gold-100 text-gold-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-ink-700 truncate block">
                            {getChapterTitle(chapterId)}
                          </span>
                          <span className="text-xs text-ink-400">
                            {getChapterWordCount(chapterId).toLocaleString()} 字
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => moveChapter(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-paper-200 rounded disabled:opacity-30"
                          >
                            <ChevronsUpDown className="w-4 h-4 text-ink-400 rotate-90" />
                          </button>
                          <button
                            onClick={() => moveChapter(index, 'down')}
                            disabled={index === selectedChapters.length - 1}
                            className="p-1 hover:bg-paper-200 rounded disabled:opacity-30"
                          >
                            <ChevronsUpDown className="w-4 h-4 text-ink-400 -rotate-90" />
                          </button>
                          <button
                            onClick={() => toggleChapter(chapterId)}
                            className="p-1 hover:bg-brick-50 text-brick-500 rounded ml-1"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-40 text-ink-400">
                    从左侧选择要导出的章节
                  </div>
                )}

                {selectedChapters.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-paper-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-500">总章节数</span>
                      <span className="font-medium text-ink-700">
                        {selectedChapters.length} 章
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-ink-500">总字数</span>
                      <span className="font-medium text-ink-700">
                        {totalWords.toLocaleString()} 字
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-ink-500">预计页数</span>
                      <span className="font-medium text-ink-700">
                        约 {Math.ceil(totalWords / 500)} 页
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-paper-200">
              <button
                onClick={() => {
                  setStep('format');
                }}
                className="btn-gold flex items-center gap-2"
                disabled={selectedChapters.length === 0}
              >
                下一步：选择格式
                <ChevronsUpDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
        )}

        {step === 'format' && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-serif text-lg font-bold text-ink-800 flex items-center gap-2">
              <FileType className="w-5 h-5 text-gold-500" />
              选择导出格式
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formatOptions.map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = exportFormat === fmt.id;
                return (
                  <div
                    key={fmt.id}
                    onClick={() => setExportFormat(fmt.id)}
                    className={cn(
                      'p-5 rounded-xl border-2 cursor-pointer transition-all',
                      isSelected
                        ? 'border-gold-400 bg-gold-50 shadow-md'
                        : 'border-paper-200 bg-white hover:border-gold-200 hover:shadow-paper-hover'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                          isSelected ? 'bg-gold-500 text-white' : 'bg-paper-100 text-ink-500'
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-ink-800">{fmt.name}</h3>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-mono',
                              isSelected ? 'bg-gold-200 text-gold-800' : 'bg-paper-100 text-ink-500'
                            )}
                          >
                            {fmt.ext}
                          </span>
                        </div>
                        <p className="text-sm text-ink-500 mt-1">{fmt.description}</p>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-paper-200">
              <button onClick={() => setStep('select')} className="btn-secondary">
                返回选择章节
              </button>
              <button
                onClick={() => {
                  const commonTitle = currentProject?.title || '';
                  setPdfConfig((prev) => ({
                    ...prev,
                    chapterIds: selectedChapters,
                    title: commonTitle,
                    customCss: customCss || undefined,
                  }));
                  setEpubConfig((prev) => ({
                    ...prev,
                    chapterIds: selectedChapters,
                    title: commonTitle,
                    customCss: customCss || undefined,
                  }));
                  setMdConfig((prev) => ({
                    ...prev,
                    chapterIds: selectedChapters,
                    title: commonTitle,
                    customCss: customCss || undefined,
                  }));
                  setTxtConfig((prev) => ({
                    ...prev,
                    chapterIds: selectedChapters,
                    title: commonTitle,
                    customCss: customCss || undefined,
                  }));
                  setStep('config');
                }}
                className="btn-gold flex items-center gap-2"
              >
                下一步：配置选项
                <ChevronsUpDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
        )}

        {step === 'config' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-ink-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-gold-500" />
                {formatOptions.find((f) => f.id === exportFormat)?.name} 配置
              </h2>
              <button
                onClick={() => setShowCssEditor(!showCssEditor)}
                className={cn(
                  'btn-secondary flex items-center gap-2',
                  showCssEditor && 'ring-2 ring-gold-400'
                )}
              >
                <Code2 className="w-4 h-4" />
                自定义 CSS
              </button>
            </div>

            {showCssEditor && (
              <div className="bg-ink-900 rounded-xl p-4 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-paper-100 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-gold-400" />
                    自定义 CSS 样式（适用于 PDF / EPUB）
                  </label>
                  <button
                    onClick={() => setCustomCss('')}
                    className="text-xs text-ink-400 hover:text-paper-100 flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    清空
                  </button>
                </div>
                <textarea
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value)}
                  placeholder={`/* 示例：修改章节标题颜色 */\nh2 {\n  color: #d4af37 !important;\n}\n\n/* 修改正文样式 */\ndiv {\n  text-indent: 2em;\n}`}
                  className="w-full h-40 bg-ink-800 text-paper-100 font-mono text-sm p-3 rounded-lg border border-ink-700 focus:border-gold-500 focus:outline-none resize-none scrollbar-thin"
                  spellCheck={false}
                />
                <p className="text-xs text-ink-400 mt-2">
                  提示：自定义 CSS 会嵌入到导出文件中，PDF 和 EPUB 格式支持此功能
                </p>
              </div>
            )}

            {exportFormat === 'pdf' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-paper-50 rounded-xl border border-paper-200 p-5">
                    <h3 className="font-medium text-ink-700 mb-4">基本信息</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-2">
                          作品标题
                        </label>
                        <input
                          type="text"
                          value={pdfConfig.title}
                          onChange={(e) =>
                            setPdfConfig({ ...pdfConfig, title: e.target.value })
                          }
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-ink-700 mb-2">
                          作者署名
                        </label>
                        <input
                          type="text"
                          value={pdfConfig.author}
                          onChange={(e) =>
                            setPdfConfig({ ...pdfConfig, author: e.target.value })
                          }
                          className="input"
                          placeholder="可选，将显示在封面"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-paper-50 rounded-xl border border-paper-200 p-5">
                    <h3 className="font-medium text-ink-700 mb-4 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-gold-500" />
                      选择模板
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(Object.keys(PDF_TEMPLATES) as PdfTemplateId[]).map((tid) => {
                        const tpl = PDF_TEMPLATES[tid];
                        const isSelected = pdfConfig.templateId === tid;
                        return (
                          <div
                            key={tid}
                            onClick={() =>
                              setPdfConfig({ ...pdfConfig, templateId: tid })
                            }
                            className={cn(
                              'p-3 rounded-lg border-2 cursor-pointer transition-all text-center',
                              isSelected
                                ? 'border-gold-400 bg-gold-50'
                                : 'border-paper-200 bg-white hover:border-gold-200'
                            )}
                          >
                            <div
                              className="w-full h-10 rounded mb-2 flex items-center justify-center"
                              style={{ backgroundColor: tpl.style.coverBg }}
                            >
                              <div
                                className="w-8 h-0.5"
                                style={{ backgroundColor: tpl.style.accentColor }}
                              />
                            </div>
                            <div className="text-sm font-medium text-ink-700">
                              {tpl.name}
                            </div>
                            <div className="text-xs text-ink-400 mt-0.5 line-clamp-1">
                              {tpl.description}
                            </div>
                            {isSelected && (
                              <div className="mt-1">
                                <span className="text-xs text-gold-600 font-medium">✓ 已选择</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-paper-50 rounded-xl border border-paper-200 p-5">
                    <h3 className="font-medium text-ink-700 mb-4">排版选项</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-ink-700">生成封面页</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pdfConfig.includeCover}
                            onChange={(e) =>
                              setPdfConfig({ ...pdfConfig, includeCover: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-paper-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-ink-700">生成目录</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pdfConfig.includeToc}
                            onChange={(e) =>
                              setPdfConfig({ ...pdfConfig, includeToc: e.target.checked })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-paper-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-ink-700">显示页码</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pdfConfig.includePageNumbers}
                            onChange={(e) =>
                              setPdfConfig({
                                ...pdfConfig,
                                includePageNumbers: e.target.checked,
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-paper-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-paper-50 rounded-xl border border-paper-200 p-5">
                    <h3 className="font-medium text-ink-700 mb-4">字体与间距</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-ink-700">正文字号</span>
                          <span className="text-ink-500">{pdfConfig.fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="16"
                          value={pdfConfig.fontSize}
                          onChange={(e) =>
                            setPdfConfig({ ...pdfConfig, fontSize: Number(e.target.value) })
                          }
                          className="w-full h-2 bg-paper-200 rounded-lg appearance-none cursor-pointer accent-gold-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-ink-700">行高</span>
                          <span className="text-ink-500">{pdfConfig.lineHeight.toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min="1.2"
                          max="2.0"
                          step="0.1"
                          value={pdfConfig.lineHeight}
                          onChange={(e) =>
                            setPdfConfig({
                              ...pdfConfig,
                              lineHeight: Number(e.target.value),
                            })
                          }
                          className="w-full h-2 bg-paper-200 rounded-lg appearance-none cursor-pointer accent-gold-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-paper-50 rounded-xl border border-paper-200 p-5">
                    <h3 className="font-medium text-ink-700 mb-4">页面边距 (mm)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-ink-600 mb-1">上边距</label>
                        <input
                          type="number"
                          value={pdfConfig.margin.top}
                          onChange={(e) =>
                            setPdfConfig({
                              ...pdfConfig,
                              margin: { ...pdfConfig.margin, top: Number(e.target.value) },
                            })
                          }
                          className="input py-2 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-ink-600 mb-1">下边距</label>
                        <input
                          type="number"
                          value={pdfConfig.margin.bottom}
                          onChange={(e) =>
                            setPdfConfig({
                              ...pdfConfig,
                              margin: { ...pdfConfig.margin, bottom: Number(e.target.value) },
                            })
                          }
                          className="input py-2 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-ink-600 mb-1">左边距</label>
                        <input
                          type="number"
                          value={pdfConfig.margin.left}
                          onChange={(e) =>
                            setPdfConfig({
                              ...pdfConfig,
                              margin: { ...pdfConfig.margin, left: Number(e.target.value) },
                            })
                          }
                          className="input py-2 text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-ink-600 mb-1">右边距</label>
                        <input
                          type="number"
                          value={pdfConfig.margin.right}
                          onChange={(e) =>
                            setPdfConfig({
                              ...pdfConfig,
                              margin: { ...pdfConfig.margin, right: Number(e.target.value) },
                            })
                          }
                          className="input py-2 text-center"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {exportFormat === 'epub' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-paper-50 rounded-xl border border-paper-200 p-5">
                  <h3 className="font-medium text-ink-700 mb-4">基本信息</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-2">
                        作品标题
                      </label>
                      <input
                        type="text"
                        value={epubConfig.title}
                        onChange={(e) =>
                          setEpubConfig({ ...epubConfig, title: e.target.value })
                        }
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-2">
                        作者署名
                      </label>
                      <input
                        type="text"
                        value={epubConfig.author}
                        onChange={(e) =>
                          setEpubConfig({ ...epubConfig, author: e.target.value })
                        }
                        className="input"
                        placeholder="可选"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-2">
                        语言
                      </label>
                      <input
                        type="text"
                        value={epubConfig.language}
                        onChange={(e) =>
                          setEpubConfig({ ...epubConfig, language: e.target.value })
                        }
                        className="input"
                        placeholder="zh-CN"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-paper-50 rounded-xl border border-paper-200 p-5">
                  <h3 className="font-medium text-ink-700 mb-4">内容选项</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-700">生成封面页</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={epubConfig.includeCover}
                          onChange={(e) =>
                            setEpubConfig({ ...epubConfig, includeCover: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-paper-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-700">生成目录</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={epubConfig.includeToc}
                          onChange={(e) =>
                            setEpubConfig({ ...epubConfig, includeToc: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-paper-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {exportFormat === 'markdown' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-paper-50 rounded-xl border border-paper-200 p-5">
                  <h3 className="font-medium text-ink-700 mb-4">基本信息</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-2">
                        作品标题
                      </label>
                      <input
                        type="text"
                        value={mdConfig.title}
                        onChange={(e) =>
                          setMdConfig({ ...mdConfig, title: e.target.value })
                        }
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-2">
                        作者署名
                      </label>
                      <input
                        type="text"
                        value={mdConfig.author}
                        onChange={(e) =>
                          setMdConfig({ ...mdConfig, author: e.target.value })
                        }
                        className="input"
                        placeholder="可选"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-paper-50 rounded-xl border border-paper-200 p-5">
                  <h3 className="font-medium text-ink-700 mb-4">内容选项</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-700">生成封面元信息</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mdConfig.includeCover}
                          onChange={(e) =>
                            setMdConfig({ ...mdConfig, includeCover: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-paper-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-700">生成目录</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mdConfig.includeToc}
                          onChange={(e) =>
                            setMdConfig({ ...mdConfig, includeToc: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-paper-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-700">章节标题添加序号</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mdConfig.useChapterNumbers}
                          onChange={(e) =>
                            setMdConfig({
                              ...mdConfig,
                              useChapterNumbers: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-paper-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {exportFormat === 'txt' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-paper-50 rounded-xl border border-paper-200 p-5">
                  <h3 className="font-medium text-ink-700 mb-4">基本信息</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-2">
                        作品标题
                      </label>
                      <input
                        type="text"
                        value={txtConfig.title}
                        onChange={(e) =>
                          setTxtConfig({ ...txtConfig, title: e.target.value })
                        }
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-2">
                        作者署名
                      </label>
                      <input
                        type="text"
                        value={txtConfig.author}
                        onChange={(e) =>
                          setTxtConfig({ ...txtConfig, author: e.target.value })
                        }
                        className="input"
                        placeholder="可选"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-2">
                        章节分隔符
                      </label>
                      <textarea
                        value={txtConfig.chapterSeparator}
                        onChange={(e) =>
                          setTxtConfig({ ...txtConfig, chapterSeparator: e.target.value })
                        }
                        className="input py-2 font-mono text-sm"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-paper-50 rounded-xl border border-paper-200 p-5">
                  <h3 className="font-medium text-ink-700 mb-4">内容选项</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-700">生成标题页</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={txtConfig.includeCover}
                          onChange={(e) =>
                            setTxtConfig({ ...txtConfig, includeCover: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-paper-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-700">生成目录</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={txtConfig.includeToc}
                          onChange={(e) =>
                            setTxtConfig({ ...txtConfig, includeToc: e.target.checked })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-paper-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink-700">章节标题添加序号</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={txtConfig.useChapterNumbers}
                          onChange={(e) =>
                            setTxtConfig({
                              ...txtConfig,
                              useChapterNumbers: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-paper-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-paper-200">
              <button onClick={() => setStep('format')} className="btn-secondary">
                返回选择格式
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('preview')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  预览效果
                </button>
                <button
                  onClick={handleExport}
                  disabled={isLoading}
                  className="btn-gold flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      直接导出
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-ink-800 flex items-center gap-2">
                <Eye className="w-5 h-5 text-gold-500" />
                导出预览
                <span className="text-sm font-normal text-ink-400 ml-2">
                  ({formatOptions.find((f) => f.id === exportFormat)?.name})
                </span>
              </h2>
              {exportFormat === 'pdf' && (
                <div className="flex items-center gap-2 bg-paper-100 rounded-lg p-1">
                  {(['cover', 'toc', 'content'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPreviewMode(mode)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-md transition-colors',
                        previewMode === mode
                          ? 'bg-white text-ink-800 shadow-sm font-medium'
                          : 'text-ink-500 hover:text-ink-700'
                      )}
                    >
                      {mode === 'cover' ? '封面' : mode === 'toc' ? '目录' : '正文'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <style>{customCss}</style>

            {exportFormat === 'pdf' && (
              <div className="bg-ink-900 rounded-xl p-8 flex items-center justify-center">
                <div
                  className="bg-white rounded shadow-2xl w-full max-w-md aspect-[210/297] flex flex-col overflow-hidden"
                  style={{ fontFamily: currentTemplate.style.fontFamily }}
                >
                  {previewMode === 'cover' && pdfConfig.includeCover && (
                    <div
                      className="flex-1 flex flex-col items-center justify-center p-8"
                      style={{
                        backgroundColor: currentTemplate.style.coverBg,
                        color: currentTemplate.style.coverTextColor,
                      }}
                    >
                      <h1
                        className="font-serif text-2xl font-bold text-center mb-4"
                        style={{ color: currentTemplate.style.coverTextColor }}
                      >
                        {pdfConfig.title || '作品标题'}
                      </h1>
                      {pdfConfig.author && (
                        <p style={{ color: currentTemplate.style.accentColor }}>
                          {pdfConfig.author}
                        </p>
                      )}
                      <div
                        className="w-16 mt-8"
                        style={{
                          height: 2,
                          backgroundColor: currentTemplate.style.accentColor,
                        }}
                      />
                    </div>
                  )}

                  {previewMode === 'toc' && pdfConfig.includeToc && (
                    <div
                      className="flex-1 p-6 overflow-hidden"
                      style={{
                        backgroundColor: currentTemplate.style.bodyBgColor,
                        color: currentTemplate.style.bodyTextColor,
                      }}
                    >
                      <h2
                        className="font-serif font-bold mb-4"
                        style={{ color: currentTemplate.style.tocTitleColor }}
                      >
                        目录
                      </h2>
                      <div className="space-y-2">
                        {selectedChapters.slice(0, 6).map((cid, idx) => (
                          <div
                            key={cid}
                            className="flex justify-between text-sm py-1 border-b border-dotted"
                            style={{ borderColor: currentTemplate.style.accentColor + '44' }}
                          >
                            <span>
                              {idx + 1}. {getChapterTitle(cid)}
                            </span>
                            <span className="text-ink-400">{idx + 2}</span>
                          </div>
                        ))}
                        {selectedChapters.length > 6 && (
                          <p className="text-xs text-ink-400 text-center pt-2">
                            ...还有 {selectedChapters.length - 6} 章
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {previewMode === 'content' && (
                    <div
                      className="flex-1 p-6 overflow-hidden"
                      style={{
                        backgroundColor: currentTemplate.style.bodyBgColor,
                        color: currentTemplate.style.bodyTextColor,
                        fontSize: `${pdfConfig.fontSize}px`,
                        lineHeight: pdfConfig.lineHeight,
                      }}
                    >
                      {selectedChapters.slice(0, 2).map((chapterId) => (
                        <div key={chapterId} className="mb-4">
                          <h3
                            className="font-serif font-bold mb-2"
                            style={{
                              color: currentTemplate.style.chapterTitleColor,
                              fontSize: `${pdfConfig.fontSize + 4}px`,
                            }}
                          >
                            {getChapterTitle(chapterId)}
                          </h3>
                          <div
                            className="mb-3"
                            style={{
                              width: 40,
                              borderBottom: currentTemplate.style.dividerStyle,
                            }}
                          />
                          <p className="leading-relaxed line-clamp-6" style={{ color: currentTemplate.style.bodyTextColor }}>
                            {projectChapters
                              .find((c) => c.id === chapterId)
                              ?.content.slice(0, 180)}
                            ...
                          </p>
                        </div>
                      ))}
                      {selectedChapters.length > 2 && (
                        <p className="text-xs text-center" style={{ color: currentTemplate.style.bodyTextColor + '88' }}>
                          ...还有 {selectedChapters.length - 2} 章
                        </p>
                      )}
                    </div>
                  )}

                  {pdfConfig.includePageNumbers && previewMode !== 'cover' && (
                    <div
                      className="p-2 text-center text-xs border-t"
                      style={{
                        color: currentTemplate.style.accentColor,
                        borderColor: currentTemplate.style.accentColor + '33',
                      }}
                    >
                      - 1 -
                    </div>
                  )}
                </div>
              </div>
            )}

            {exportFormat === 'epub' && (
              <div className="bg-ink-900 rounded-xl p-8 flex items-center justify-center">
                <div className="bg-white rounded shadow-2xl w-full max-w-md aspect-[3/4] flex flex-col overflow-hidden">
                  {epubConfig.includeCover && (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-ink-700 to-ink-900 text-white">
                      <h1 className="font-serif text-2xl font-bold text-center mb-4">
                        {epubConfig.title || '作品标题'}
                      </h1>
                      {epubConfig.author && (
                        <p className="text-gold-400">{epubConfig.author}</p>
                      )}
                      <div className="text-xs text-ink-400 mt-6">EPUB 电子书</div>
                    </div>
                  )}
                  {!epubConfig.includeCover && (
                    <div className="flex-1 p-6">
                      <h2 className="font-serif font-bold text-ink-800 mb-3">
                        {getChapterTitle(selectedChapters[0])}
                      </h2>
                      <p className="text-sm text-ink-600 leading-relaxed line-clamp-6">
                        {projectChapters
                          .find((c) => c.id === selectedChapters[0])
                          ?.content.slice(0, 200)}
                        ...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {exportFormat === 'markdown' && (
              <div className="bg-ink-900 rounded-xl p-6">
                <div className="text-xs text-ink-400 mb-3 flex items-center gap-2">
                  <FileCode className="w-4 h-4" />
                  Markdown 预览
                </div>
                <pre className="bg-ink-800 text-paper-100 font-mono text-sm p-4 rounded-lg overflow-auto max-h-96 scrollbar-thin whitespace-pre-wrap">
{`${mdConfig.includeCover ? `# ${mdConfig.title || '作品标题'}\n\n${mdConfig.author ? `**作者：${mdConfig.author}**\n\n` : ''}---\n\n` : ''}${
  mdConfig.includeToc
    ? `## 目录\n\n${selectedChapters
        .slice(0, 5)
        .map(
          (cid, idx) =>
            `- ${mdConfig.useChapterNumbers ? `${idx + 1}. ` : ''}${getChapterTitle(cid)}`
        )
        .join('\n')}\n\n---\n\n`
    : ''
}${selectedChapters
  .slice(0, 2)
  .map((cid, idx) => {
    const ch = projectChapters.find((c) => c.id === cid);
    const prefix = mdConfig.useChapterNumbers ? `第${idx + 1}章 ` : '';
    return `## ${prefix}${ch?.title || '章节标题'}\n\n${ch?.content.slice(0, 80)}...`;
  })
  .join('\n\n---\n\n')}`}
                </pre>
              </div>
            )}

            {exportFormat === 'txt' && (
              <div className="bg-ink-900 rounded-xl p-6">
                <div className="text-xs text-ink-400 mb-3 flex items-center gap-2">
                  <FileType className="w-4 h-4" />
                  TXT 预览
                </div>
                <pre className="bg-ink-800 text-paper-100 font-mono text-sm p-4 rounded-lg overflow-auto max-h-96 scrollbar-thin whitespace-pre-wrap">
{`${txtConfig.includeCover ? `${txtConfig.title || '作品标题'}\n${txtConfig.author ? `作者：${txtConfig.author}\n` : ''}\n${'='.repeat(40)}\n\n` : ''}${
  txtConfig.includeToc
    ? `目录\n\n${selectedChapters
        .slice(0, 5)
        .map(
          (cid, idx) =>
            `${txtConfig.useChapterNumbers ? `${idx + 1}. ` : ''}${getChapterTitle(cid)}`
        )
        .join('\n')}\n\n${'='.repeat(40)}\n\n`
    : ''
}${selectedChapters
  .slice(0, 2)
  .map((cid, idx) => {
    const ch = projectChapters.find((c) => c.id === cid);
    const prefix = txtConfig.useChapterNumbers ? `第${idx + 1}章 ` : '';
    return `${prefix}${ch?.title || '章节标题'}\n\n${ch?.content.slice(0, 80)}...`;
  })
  .join(txtConfig.chapterSeparator)}`}
                </pre>
              </div>
            )}

            <div className="card p-4">
              <div className="flex items-center gap-3 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <p className="font-medium">配置已就绪</p>
                  <p className="text-sm text-green-600/80">
                    共 {selectedChapters.length} 章，{totalWords.toLocaleString()} 字，
                    约 {Math.ceil(totalWords / 500)} 页
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-paper-200">
              <button onClick={() => setStep('config')} className="btn-secondary">
                返回修改配置
              </button>
              <button
                onClick={handleExport}
                disabled={isLoading}
                className="btn-gold flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    确认导出
                    <span className="text-xs opacity-75">
                      {formatOptions.find((f) => f.id === exportFormat)?.ext}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
