import { useState, useEffect } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Wrench,
  AlertTriangle,
  Info,
  AlertCircle,
  Save,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import type {
  CustomRule,
  CustomRuleCondition,
  ConflictSeverity,
  ConflictCategory,
} from '@shared/types';

interface Props {
  projectId: string;
  onClose?: () => void;
}

const CATEGORY_OPTIONS: { value: ConflictCategory; label: string }[] = [
  { value: 'custom_rule', label: '自定义规则' },
  { value: 'character_trait', label: '人物属性' },
  { value: 'character_personality', label: '人物性格' },
  { value: 'timeline', label: '时间线' },
  { value: 'geography', label: '地理场景' },
  { value: 'foreshadow', label: '伏笔线索' },
];

const SEVERITY_OPTIONS: { value: ConflictSeverity; label: string; color: string; icon: any }[] = [
  { value: 'info', label: '提示', color: 'bg-blue-100 text-blue-600', icon: Info },
  { value: 'warning', label: '警告', color: 'bg-amber-100 text-amber-600', icon: AlertTriangle },
  { value: 'error', label: '严重', color: 'bg-brick-100 text-brick-600', icon: AlertCircle },
];

const CONDITION_TYPE_OPTIONS = [
  { value: 'keyword_present', label: '包含关键词' },
  { value: 'keyword_absent', label: '不包含关键词' },
  { value: 'regex_match', label: '正则匹配' },
];

export default function CustomRuleManager({ projectId, onClose }: Props) {
  const {
    customRules,
    loadCustomRules,
    createCustomRule,
    updateCustomRule,
    toggleCustomRule,
    deleteCustomRule,
    isLoading,
  } = useAppStore();

  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<CustomRule | null>(null);
  const [formData, setFormData] = useState<Partial<CustomRule>>({
    name: '',
    description: '',
    severity: 'warning',
    category: 'custom_rule',
    conditions: [],
    conditionOperator: 'or',
    action: 'warn',
    customMessage: '',
    isEnabled: true,
    suggestions: [],
  });

  useEffect(() => {
    if (projectId) {
      loadCustomRules(projectId);
    }
  }, [projectId, loadCustomRules]);

  const handleOpenCreate = () => {
    setEditingRule(null);
    setFormData({
      name: '',
      description: '',
      severity: 'warning',
      category: 'custom_rule',
      conditions: [],
      conditionOperator: 'or',
      action: 'warn',
      customMessage: '',
      isEnabled: true,
      suggestions: [],
    });
    setShowModal(true);
  };

  const handleOpenEdit = (rule: CustomRule) => {
    setEditingRule(rule);
    setFormData({ ...rule });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) return;
    try {
      if (editingRule) {
        await updateCustomRule(editingRule.id, formData);
      } else {
        await createCustomRule(projectId, formData);
      }
      setShowModal(false);
    } catch (e) {
      console.error('Failed to save rule:', e);
    }
  };

  const addCondition = () => {
    const newCondition: CustomRuleCondition = {
      id: `cond-${Date.now()}`,
      type: 'keyword_present',
      value: '',
      description: '',
    };
    setFormData(prev => ({
      ...prev,
      conditions: [...(prev.conditions || []), newCondition],
    }));
  };

  const updateCondition = (id: string, updates: Partial<CustomRuleCondition>) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions?.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  };

  const removeCondition = (id: string) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions?.filter(c => c.id !== id),
    }));
  };

  const projectRules = customRules.filter(r => r.projectId === projectId);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-paper-200">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-amber-600" />
          <h3 className="font-serif text-lg font-bold text-ink-800">自定义冲突规则</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="btn-gold text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            新建规则
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-paper-100 text-ink-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {projectRules.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="w-12 h-12 text-paper-300 mx-auto mb-3" />
            <p className="text-ink-500 font-medium">暂无自定义规则</p>
            <p className="text-sm text-ink-400 mt-1">创建属于你自己的冲突检测规则</p>
            <button
              onClick={handleOpenCreate}
              className="btn-gold text-sm mt-4 inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              创建第一条规则
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {projectRules.map(rule => {
              const severityCfg = SEVERITY_OPTIONS.find(s => s.value === rule.severity) || SEVERITY_OPTIONS[1];
              const SevIcon = severityCfg.icon;
              const categoryCfg = CATEGORY_OPTIONS.find(c => c.value === rule.category);
              return (
                <div
                  key={rule.id}
                  className={cn(
                    'p-4 rounded-xl border bg-white',
                    !rule.isEnabled && 'opacity-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-ink-800">{rule.name}</h4>
                        {rule.isBuiltIn && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-[10px] rounded-full">
                            内置
                          </span>
                        )}
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]', severityCfg.color)}>
                          <SevIcon className="w-2.5 h-2.5" />
                          {severityCfg.label}
                        </span>
                        {categoryCfg && (
                          <span className="px-2 py-0.5 bg-paper-100 text-ink-500 text-[10px] rounded-full">
                            {categoryCfg.label}
                          </span>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-sm text-ink-500 mt-1">{rule.description}</p>
                      )}
                      {rule.conditions.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap mt-2">
                          <span className="text-xs text-ink-400">条件：</span>
                          {rule.conditions.map((cond, idx) => (
                            <span key={cond.id} className="text-xs">
                              {idx > 0 && (
                                <span className="text-ink-400 mx-1">
                                  {rule.conditionOperator === 'and' ? '且' : '或'}
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 bg-paper-100 text-ink-600 rounded">
                                {CONDITION_TYPE_OPTIONS.find(c => c.value === cond.type)?.label}: {cond.value || '(空)'}
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                      {rule.customMessage && (
                        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {rule.customMessage}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleCustomRule(rule.id)}
                        disabled={rule.isBuiltIn}
                        className={cn('p-1.5 rounded-lg transition-colors',
                          rule.isBuiltIn ? 'cursor-not-allowed opacity-50' : 'hover:bg-paper-100'
                        )}
                      >
                        {rule.isEnabled ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-ink-400" />
                        )}
                      </button>
                      {!rule.isBuiltIn && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(rule)}
                            className="p-1.5 rounded-lg hover:bg-paper-100 text-ink-500"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCustomRule(rule.id)}
                            className="p-1.5 rounded-lg hover:bg-brick-50 text-brick-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="card p-6 w-full max-w-2xl mx-4 animate-slide-in-right max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-ink-800">
                {editingRule ? '编辑规则' : '新建规则'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-paper-100 text-ink-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">规则名称 *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input"
                  placeholder="例如：禁止出现网络用语"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">描述</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="textarea h-20"
                  placeholder="规则的详细说明..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">严重程度</label>
                  <select
                    value={formData.severity}
                    onChange={e => setFormData(prev => ({ ...prev, severity: e.target.value as ConflictSeverity }))}
                    className="input"
                  >
                    {SEVERITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">分类</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as ConflictCategory }))}
                    className="input"
                  >
                    {CATEGORY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-1">条件关系</label>
                  <select
                    value={formData.conditionOperator}
                    onChange={e => setFormData(prev => ({ ...prev, conditionOperator: e.target.value as 'and' | 'or' }))}
                    className="input"
                  >
                    <option value="or">任一条件满足 (OR)</option>
                    <option value="and">所有条件都满足 (AND)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">检测条件</label>
                <div className="space-y-2">
                  {(formData.conditions || []).map((cond, idx) => (
                    <div key={cond.id} className="p-3 bg-paper-50 rounded-lg border border-paper-200">
                      <div className="flex items-center gap-2">
                        {idx > 0 && (
                          <span className="text-xs text-ink-400 w-10 text-center">
                            {formData.conditionOperator === 'and' ? '且' : '或'}
                          </span>
                        )}
                        <select
                          value={cond.type}
                          onChange={e => updateCondition(cond.id, { type: e.target.value as any })}
                          className="input flex-1"
                        >
                          {CONDITION_TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={cond.value}
                          onChange={e => updateCondition(cond.id, { value: e.target.value })}
                          className="input flex-1"
                          placeholder={cond.type === 'regex_match' ? '正则表达式' : '关键词'}
                        />
                        <button
                          onClick={() => removeCondition(cond.id)}
                          className="p-1.5 rounded-lg hover:bg-brick-50 text-brick-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addCondition}
                    className="w-full py-2 border-2 border-dashed border-paper-300 rounded-lg text-sm text-ink-500 hover:border-amber-400 hover:text-amber-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    添加条件
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">触发时显示的提示</label>
                <textarea
                  value={formData.customMessage || ''}
                  onChange={e => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
                  className="textarea h-20"
                  placeholder="自定义警告信息，留空则使用默认提示..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name?.trim()}
                className="btn-gold flex-1 flex items-center justify-center gap-1"
              >
                <Save className="w-4 h-4" />
                保存规则
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
