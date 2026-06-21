import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  UsersRound,
  Plus,
  Search,
  X,
  Edit3,
  Trash2,
  User,
  Calendar,
  FileText,
  Link,
  ChevronRight,
  Volume2,
  Play,
  Square,
  Settings,
  Mic,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { speak, stopSpeak, isSpeaking, getChineseVoices } from '@/lib/tts';
import type { Character, VoiceSettings } from '@shared/types';

export default function CharacterEncyclopedia() {
  const { projectId } = useParams<{ projectId: string }>();
  const { characters, chapters, createCharacter, updateCharacter, deleteCharacter } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [editingVoiceCharId, setEditingVoiceCharId] = useState<string | null>(null);
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    description: '',
    traits: {} as Record<string, string>,
  });
  const [traitKey, setTraitKey] = useState('');
  const [traitValue, setTraitValue] = useState('');

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    pitch: 1.0,
    rate: 1.0,
    voiceName: '默认',
    lang: 'zh-CN',
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPreviewSpeaking, setIsPreviewSpeaking] = useState(false);
  const [previewText, setPreviewText] = useState('你好，我是这个人物的声音，欢迎来到我们的故事世界。');

  useEffect(() => {
    getChineseVoices().then(voices => {
      setAvailableVoices(voices);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSpeaking()) {
        setIsPreviewSpeaking(false);
      }
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const projectCharacters = characters.filter(c => c.projectId === projectId);
  const filteredCharacters = projectCharacters.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addTrait = () => {
    if (!traitKey.trim() || !traitValue.trim()) return;
    setNewCharacter(prev => ({
      ...prev,
      traits: { ...prev.traits, [traitKey]: traitValue },
    }));
    setTraitKey('');
    setTraitValue('');
  };

  const removeTrait = (key: string) => {
    setNewCharacter(prev => {
      const traits = { ...prev.traits };
      delete traits[key];
      return { ...prev, traits };
    });
  };

  const getChapterTitle = (chapterId: string) => {
    return chapters.find(c => c.id === chapterId)?.title || '未知章节';
  };

  const handleCreateCharacter = async () => {
    if (!newCharacter.name.trim() || !projectId) return;
    await createCharacter({
      name: newCharacter.name,
      description: newCharacter.description,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
      projectId,
      traits: newCharacter.traits,
      appearances: [],
      relationships: [],
      voiceSettings: {
        pitch: 1.0,
        rate: 1.0,
        voiceName: '默认',
        lang: 'zh-CN',
      },
    });
    setShowCreateModal(false);
    setNewCharacter({ name: '', description: '', traits: {} });
  };

  const handleDeleteCharacter = async (charId: string) => {
    if (confirm('确定要删除这个人物吗？')) {
      await deleteCharacter(charId);
      if (selectedCharacter?.id === charId) {
        setSelectedCharacter(null);
      }
    }
  };

  const openVoiceModal = (char: Character) => {
    setEditingVoiceCharId(char.id);
    setVoiceSettings(char.voiceSettings || {
      pitch: 1.0,
      rate: 1.0,
      voiceName: '默认',
      lang: 'zh-CN',
    });
    setPreviewText(`${char.name}：你好，我是${char.name}。`);
    setShowVoiceModal(true);
  };

  const saveVoiceSettings = async () => {
    if (!editingVoiceCharId) return;
    await updateCharacter(editingVoiceCharId, { voiceSettings });
    setShowVoiceModal(false);
    setEditingVoiceCharId(null);
    const updated = characters.find(c => c.id === editingVoiceCharId);
    if (updated) {
      setSelectedCharacter({ ...updated, voiceSettings });
    }
  };

  const handlePreviewSpeak = async () => {
    if (isPreviewSpeaking) {
      stopSpeak();
      setIsPreviewSpeaking(false);
      return;
    }
    setIsPreviewSpeaking(true);
    await speak({
      text: previewText,
      pitch: voiceSettings.pitch,
      rate: voiceSettings.rate,
      voiceURI: voiceSettings.voiceURI,
      lang: voiceSettings.lang || 'zh-CN',
      onEnd: () => setIsPreviewSpeaking(false),
      onError: () => setIsPreviewSpeaking(false),
    });
  };

  const handleCharacterSpeak = async (char: Character) => {
    await speak({
      text: `我是${char.name}。${char.description.slice(0, 30)}...`,
      pitch: char.voiceSettings?.pitch ?? 1.0,
      rate: char.voiceSettings?.rate ?? 1.0,
      voiceURI: char.voiceSettings?.voiceURI,
      lang: char.voiceSettings?.lang || 'zh-CN',
    });
  };

  useEffect(() => {
    return () => {
      stopSpeak();
    };
  }, []);

  const totalAppearances = selectedCharacter?.appearances.length || 0;

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      <div className="w-80 flex-shrink-0">
        <div className="card p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold text-ink-800 flex items-center gap-2">
              <UsersRound className="w-5 h-5 text-gold-500" />
              人物列表
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 bg-gold-100 hover:bg-gold-200 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-gold-700" />
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 py-2"
              placeholder="搜索人物..."
            />
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2">
            {filteredCharacters.map((character, index) => (
              <div
                key={character.id}
                onClick={() => setSelectedCharacter(character)}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all',
                  'perspective-1000 group',
                  selectedCharacter?.id === character.id
                    ? 'bg-ink-800 text-white'
                    : 'bg-paper-50 border border-paper-200 hover:border-gold-300 hover:shadow-paper-hover hover:-translate-y-0.5'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl overflow-hidden flex-shrink-0',
                  'transition-transform duration-300 group-hover:scale-105'
                )}>
                  <img
                    src={character.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${character.id}`}
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    'font-semibold truncate',
                    selectedCharacter?.id === character.id ? 'text-white' : 'text-ink-800'
                  )}>
                    {character.name}
                  </h3>
                  <p className={cn(
                    'text-xs truncate',
                    selectedCharacter?.id === character.id ? 'text-ink-200' : 'text-ink-400'
                  )}>
                    {character.traits.occupation || '未设定职业'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCharacterSpeak(character);
                    }}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      selectedCharacter?.id === character.id
                        ? 'hover:bg-ink-700 text-gold-400'
                        : 'hover:bg-paper-200 text-ink-500'
                    )}
                    title="试听声音"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <div className={cn(
                    'text-xs px-2 py-1 rounded-full',
                    selectedCharacter?.id === character.id
                      ? 'bg-ink-700 text-gold-400'
                      : 'bg-gold-100 text-gold-700'
                  )}>
                    {character.appearances.length}次
                  </div>
                </div>
              </div>
            ))}

            {filteredCharacters.length === 0 && (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-ink-300 mx-auto mb-4" />
                <p className="text-ink-500">
                  {searchQuery ? '未找到匹配人物' : '暂无人物'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1">
        {selectedCharacter ? (
          <div className="card p-6 h-full overflow-y-auto scrollbar-thin">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-ink">
                  <img
                    src={selectedCharacter.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCharacter.id}`}
                    alt={selectedCharacter.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="font-serif text-3xl font-bold text-ink-800 mb-2 flex items-center gap-3">
                    {selectedCharacter.name}
                    <button
                      onClick={() => handleCharacterSpeak(selectedCharacter)}
                      className="p-2 bg-gold-100 hover:bg-gold-200 rounded-lg transition-colors"
                      title="试听声音"
                    >
                      <Volume2 className="w-5 h-5 text-gold-700" />
                    </button>
                  </h1>
                  <p className="text-ink-500 max-w-xl">
                    {selectedCharacter.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openVoiceModal(selectedCharacter)}
                  className="p-2 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
                  title="声音设定"
                >
                  <Settings className="w-5 h-5 text-purple-700" />
                </button>
                <button
                  onClick={() => handleDeleteCharacter(selectedCharacter.id)}
                  className="p-2 hover:bg-brick-100 rounded-lg transition-colors"
                  title="删除人物"
                >
                  <Trash2 className="w-5 h-5 text-brick-500" />
                </button>
                <button className="p-2 hover:bg-paper-200 rounded-lg transition-colors">
                  <Edit3 className="w-5 h-5 text-ink-500" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
                  <h3 className="font-serif text-lg font-bold text-ink-800 mb-4 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-purple-600" />
                    声音设定
                    <button
                      onClick={() => openVoiceModal(selectedCharacter)}
                      className="ml-auto text-sm text-purple-600 hover:text-purple-800 font-normal"
                    >
                      编辑配置
                    </button>
                  </h3>
                  {selectedCharacter.voiceSettings ? (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 bg-white rounded-lg border border-purple-100">
                        <div className="text-xs text-purple-500 uppercase tracking-wider mb-1">音高</div>
                        <div className="text-ink-700 font-medium">
                          {selectedCharacter.voiceSettings.pitch.toFixed(2)}
                          <span className="text-xs text-ink-400 ml-1">
                            ({selectedCharacter.voiceSettings.pitch < 0.9 ? '低沉' : selectedCharacter.voiceSettings.pitch > 1.1 ? '高亢' : '正常'})
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-purple-100">
                        <div className="text-xs text-purple-500 uppercase tracking-wider mb-1">语速</div>
                        <div className="text-ink-700 font-medium">
                          {selectedCharacter.voiceSettings.rate.toFixed(2)}x
                          <span className="text-xs text-ink-400 ml-1">
                            ({selectedCharacter.voiceSettings.rate < 0.9 ? '慢速' : selectedCharacter.voiceSettings.rate > 1.1 ? '快速' : '正常'})
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-lg border border-purple-100">
                        <div className="text-xs text-purple-500 uppercase tracking-wider mb-1">音色</div>
                        <div className="text-ink-700 font-medium truncate">
                          {selectedCharacter.voiceSettings.voiceName || '默认'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-ink-400 text-sm">未配置声音设定，点击"编辑配置"开始设置</p>
                  )}
                </div>

                <div className="bg-paper-50 rounded-xl p-5 border border-paper-200">
                  <h3 className="font-serif text-lg font-bold text-ink-800 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gold-500" />
                    人物设定
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedCharacter.traits).map(([key, value]) => (
                      <div key={key} className="p-3 bg-white rounded-lg border border-paper-200">
                        <div className="text-xs text-ink-400 uppercase tracking-wider mb-1">
                          {key}
                        </div>
                        <div className="text-ink-700 font-medium">{value as string}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-paper-50 rounded-xl p-5 border border-paper-200">
                  <h3 className="font-serif text-lg font-bold text-ink-800 mb-4 flex items-center gap-2">
                    <Link className="w-4 h-4 text-gold-500" />
                    人物关系
                  </h3>
                  {selectedCharacter.relationships.length > 0 ? (
                    <div className="space-y-3">
                      {selectedCharacter.relationships.map((rel) => {
                        const targetChar = projectCharacters.find(c => c.id === rel.targetId);
                        return (
                          <div
                            key={rel.id}
                            onClick={() => targetChar && setSelectedCharacter(targetChar)}
                            className="flex items-center gap-4 p-3 bg-white rounded-lg border border-paper-200 cursor-pointer hover:border-gold-300 transition-colors group"
                          >
                            <img
                              src={targetChar?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rel.targetId}`}
                              alt=""
                              className="w-10 h-10 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-ink-800 group-hover:text-gold-600">
                                  {targetChar?.name || '未知'}
                                </span>
                                <ChevronRight className="w-4 h-4 text-ink-300 group-hover:text-gold-500 transition-colors" />
                              </div>
                              <div className="text-sm text-ink-500">{rel.description}</div>
                            </div>
                            <span className="px-3 py-1 bg-gold-100 text-gold-700 text-xs font-medium rounded-full">
                              {rel.type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-ink-400 text-sm">暂无人物关系</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-ink rounded-xl p-5 text-white">
                  <h3 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gold-400" />
                    出场统计
                  </h3>
                  <div className="text-center py-4">
                    <div className="text-5xl font-bold text-gold-400">{totalAppearances}</div>
                    <div className="text-ink-200 mt-1">章节出场次数</div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-ink-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-ink-300">创建时间</span>
                      <span>{selectedCharacter.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-paper-50 rounded-xl p-5 border border-paper-200">
                  <h3 className="font-serif text-lg font-bold text-ink-800 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gold-500" />
                    出场章节
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                    {selectedCharacter.appearances.map((appearance) => (
                      <div
                        key={appearance.id}
                        className="p-3 bg-white rounded-lg border border-paper-200"
                      >
                        <div className="font-medium text-ink-700 text-sm">
                          {getChapterTitle(appearance.chapterId)}
                        </div>
                        {appearance.context && (
                          <div className="text-xs text-ink-400 mt-1 italic">
                            "{appearance.context}"
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card h-full flex items-center justify-center">
            <div className="text-center">
              <UsersRound className="w-16 h-16 text-ink-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-ink-600 mb-2">选择人物</h3>
              <p className="text-ink-400">从左侧列表选择一个人物查看详情</p>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="card p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto scrollbar-thin animate-slide-in-right">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-bold text-ink-800">
                新增人物
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-paper-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-ink-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  人物姓名
                </label>
                <input
                  type="text"
                  value={newCharacter.name}
                  onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
                  className="input"
                  placeholder="输入人物姓名"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  人物简介
                </label>
                <textarea
                  value={newCharacter.description}
                  onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
                  className="textarea h-24"
                  placeholder="描述人物的性格、背景等..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  人物属性
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={traitKey}
                    onChange={(e) => setTraitKey(e.target.value)}
                    className="input flex-1 py-2"
                    placeholder="属性名（如：职业）"
                  />
                  <input
                    type="text"
                    value={traitValue}
                    onChange={(e) => setTraitValue(e.target.value)}
                    className="input flex-1 py-2"
                    placeholder="属性值（如：天文官）"
                  />
                  <button
                    onClick={addTrait}
                    className="btn-secondary px-4 py-2"
                  >
                    添加
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(newCharacter.traits).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gold-100 text-gold-700 rounded-full text-sm"
                    >
                      <span className="font-medium">{key}:</span>
                      <span>{value}</span>
                      <button
                        onClick={() => removeTrait(key)}
                        className="ml-1 hover:text-gold-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateCharacter}
                  className="btn-gold flex-1"
                  disabled={!newCharacter.name.trim()}
                >
                  创建人物
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showVoiceModal && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="card p-6 w-full max-w-md mx-4 animate-slide-in-right">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl font-bold text-ink-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600" />
                声音设定
              </h2>
              <button
                onClick={() => {
                  setShowVoiceModal(false);
                  setEditingVoiceCharId(null);
                  stopSpeak();
                  setIsPreviewSpeaking(false);
                }}
                className="p-1.5 hover:bg-paper-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-ink-500" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  音色选择
                </label>
                <select
                  value={voiceSettings.voiceURI || ''}
                  onChange={(e) => {
                    const voice = availableVoices.find(v => v.voiceURI === e.target.value);
                    setVoiceSettings(prev => ({
                      ...prev,
                      voiceURI: e.target.value || undefined,
                      voiceName: voice?.name || '默认',
                      lang: voice?.lang || prev.lang,
                    }));
                  }}
                  className="input"
                >
                  <option value="">默认系统语音</option>
                  {availableVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang}) {v.default ? ' - 默认' : ''}
                    </option>
                  ))}
                </select>
                {availableVoices.length === 0 && (
                  <p className="text-xs text-ink-400 mt-1">正在加载系统语音...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2 flex justify-between">
                  <span>音高 (Pitch)</span>
                  <span className="text-purple-600 font-semibold">{voiceSettings.pitch.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={voiceSettings.pitch}
                  onChange={(e) => setVoiceSettings(prev => ({
                    ...prev,
                    pitch: parseFloat(e.target.value),
                  }))}
                  className="w-full h-2 bg-paper-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-ink-400 mt-1">
                  <span>低沉</span>
                  <span>正常</span>
                  <span>高亢</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2 flex justify-between">
                  <span>语速 (Rate)</span>
                  <span className="text-purple-600 font-semibold">{voiceSettings.rate.toFixed(2)}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={voiceSettings.rate}
                  onChange={(e) => setVoiceSettings(prev => ({
                    ...prev,
                    rate: parseFloat(e.target.value),
                  }))}
                  className="w-full h-2 bg-paper-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-ink-400 mt-1">
                  <span>慢速</span>
                  <span>正常</span>
                  <span>快速</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  试听文本
                </label>
                <textarea
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="textarea h-20"
                  placeholder="输入要试听的文本..."
                />
              </div>

              <button
                onClick={handlePreviewSpeak}
                className={cn(
                  'w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
                  isPreviewSpeaking
                    ? 'bg-brick-500 hover:bg-brick-600 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl'
                )}
              >
                {isPreviewSpeaking ? (
                  <>
                    <Square className="w-5 h-5" />
                    停止播放
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    试听声音
                  </>
                )}
              </button>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                <div className="text-xs text-purple-600 font-medium mb-1">当前配置预览</div>
                <div className="text-sm text-ink-600">
                  音色: {voiceSettings.voiceName || '默认'} · 音高: {voiceSettings.pitch.toFixed(2)} · 语速: {voiceSettings.rate.toFixed(2)}x
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowVoiceModal(false);
                    setEditingVoiceCharId(null);
                    stopSpeak();
                    setIsPreviewSpeaking(false);
                  }}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={saveVoiceSettings}
                  className="btn-gold flex-1"
                >
                  保存设定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
