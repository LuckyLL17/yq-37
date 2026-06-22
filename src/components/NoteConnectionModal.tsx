import React, { useState, useEffect } from 'react';
import { X, Check, Palette } from 'lucide-react';
import type { NoteConnection, NoteConnectionType } from '@shared/types';
import { cn } from '@/lib/utils';

interface NoteConnectionModalProps {
  isOpen: boolean;
  connection?: NoteConnection | null;
  sourceNoteId?: string;
  targetNoteId?: string;
  notes: Array<{ id: string; content: string }>;
  onClose: () => void;
  onSave: (data: {
    sourceNoteId: string;
    targetNoteId: string;
    type: NoteConnectionType;
    label?: string;
    description?: string;
    color?: string;
  }) => void;
}

const connectionTypes: Array<{
  value: NoteConnectionType;
  label: string;
  description: string;
  defaultColor: string;
}> = [
  { value: 'causal', label: '因果', description: 'A 导致或引出 B', defaultColor: '#d97706' },
  { value: 'reference', label: '引用', description: 'A 引用或呼应 B', defaultColor: '#dc2626' },
  { value: 'extension', label: '延伸', description: 'A 是 B 的扩展或补充', defaultColor: '#2563eb' },
  { value: 'contrast', label: '对比', description: 'A 与 B 形成对比', defaultColor: '#7c3aed' },
  { value: 'inspiration', label: '启发', description: 'A 启发了 B', defaultColor: '#059669' },
  { value: 'other', label: '其他', description: '自定义关联类型', defaultColor: '#6b7280' },
];

const colorPresets = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#78716c',
];

export default function NoteConnectionModal({
  isOpen,
  connection,
  sourceNoteId,
  targetNoteId,
  notes,
  onClose,
  onSave,
}: NoteConnectionModalProps) {
  const [type, setType] = useState<NoteConnectionType>('reference');
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#dc2626');
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (connection) {
      setType(connection.type);
      setLabel(connection.label || '');
      setDescription(connection.description || '');
      setColor(connection.color || connectionTypes.find(t => t.value === connection.type)?.defaultColor || '#6b7280');
      setSourceId(connection.sourceNoteId);
      setTargetId(connection.targetNoteId);
    } else {
      setType('reference');
      setLabel('');
      setDescription('');
      setColor('#dc2626');
      setSourceId(sourceNoteId || '');
      setTargetId(targetNoteId || '');
    }
  }, [connection, sourceNoteId, targetNoteId, isOpen]);

  useEffect(() => {
    const typeConfig = connectionTypes.find(t => t.value === type);
    if (typeConfig && !label) {
      setLabel(typeConfig.label);
    }
    if (typeConfig && color === '') {
      setColor(typeConfig.defaultColor);
    }
  }, [type, label, color]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId) return;
    
    onSave({
      sourceNoteId: sourceId,
      targetNoteId: targetId,
      type,
      label: label.trim() || undefined,
      description: description.trim() || undefined,
      color,
    });
  };

  const handleSwapNotes = () => {
    setSourceId(targetId);
    setTargetId(sourceId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {connection ? '编辑关联线' : '创建关联线'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                源便签
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-sm"
                disabled={!!connection}
              >
                <option value="">选择便签...</option>
                {notes.map(note => (
                  <option key={note.id} value={note.id} disabled={note.id === targetId}>
                    {note.content.slice(0, 30)}{note.content.length > 30 ? '...' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSwapNotes}
                className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gold-600 hover:bg-gold-50 rounded-lg border border-gray-200 transition-colors"
                disabled={!!connection}
              >
                ↔ 交换方向
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目标便签
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-sm"
              disabled={!!connection}
            >
              <option value="">选择便签...</option>
              {notes.map(note => (
                <option key={note.id} value={note.id} disabled={note.id === sourceId}>
                  {note.content.slice(0, 30)}{note.content.length > 30 ? '...' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              关联类型
            </label>
            <div className="grid grid-cols-3 gap-2">
              {connectionTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setType(t.value);
                    setColor(t.defaultColor);
                  }}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all',
                    type === t.value
                      ? 'border-gold-500 bg-gold-50 text-gold-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {connectionTypes.find(t => t.value === type)?.description}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签文字
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="输入关联线标签（可选）"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-sm"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述说明
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述这个关联的具体含义（可选）"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-sm resize-none"
              rows={2}
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              线条颜色
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div
                  className="w-6 h-6 rounded-full border-2 border-gray-300"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-600">{color}</span>
                <Palette className="w-4 h-4 text-gray-400 ml-auto" />
              </button>
              
              {showColorPicker && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-lg shadow-lg border border-gray-200 z-10 grid grid-cols-6 gap-2">
                  {colorPresets.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => {
                        setColor(c);
                        setShowColorPicker(false);
                      }}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                        color === c ? 'border-gold-500 ring-2 ring-gold-200' : 'border-gray-200'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!sourceId || !targetId}
              className="flex-1 px-4 py-2.5 bg-gold-500 text-white rounded-lg hover:bg-gold-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              {connection ? '保存修改' : '创建关联'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
