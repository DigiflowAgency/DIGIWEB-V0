'use client';

import { useState, useRef, useEffect } from 'react';
import { Tag, Plus, X, Check } from 'lucide-react';
import type { TaskLabel, ProjectLabel } from '@/types/projects';
import useSWR from 'swr';

interface TaskLabelPickerProps {
  taskId: string;
  projectId: string;
  currentLabels: TaskLabel[];
  onUpdate: () => void;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erreur');
  return data;
};

export default function TaskLabelPicker({ taskId, projectId, currentLabels, onUpdate }: TaskLabelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: projectLabels } = useSWR<ProjectLabel[]>(
    `/api/projects/${projectId}/labels`,
    fetcher
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSelected = (labelId: string) => {
    return currentLabels.some(tl => tl.labelId === labelId);
  };

  const handleToggleLabel = async (labelId: string) => {
    setLoading(true);
    try {
      const selected = isSelected(labelId);
      const res = await fetch(`/api/projects/tasks/${taskId}/labels`, {
        method: selected ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ labelId }),
      });

      if (!res.ok) throw new Error('Erreur lors de la modification');
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle label:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Labels Display */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {currentLabels.map(tl => (
          <span
            key={tl.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${tl.label?.color}20`,
              color: tl.label?.color,
            }}
          >
            {tl.label?.name}
            <button
              onClick={() => handleToggleLabel(tl.labelId)}
              className="hover:bg-black/10 rounded-full p-0.5"
              disabled={loading}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Tag className="w-3 h-3" />
          <span>Labels</span>
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-20 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase">Labels du projet</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {projectLabels?.map(label => (
              <button
                key={label.id}
                onClick={() => handleToggleLabel(label.id)}
                disabled={loading}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                  style={{
                    borderColor: label.color,
                    backgroundColor: isSelected(label.id) ? label.color : 'transparent',
                  }}
                >
                  {isSelected(label.id) && <Check className="w-3 h-3 text-white" />}
                </div>
                <span
                  className="flex-1 text-left"
                  style={{ color: label.color }}
                >
                  {label.name}
                </span>
              </button>
            ))}
            {(!projectLabels || projectLabels.length === 0) && (
              <p className="px-3 py-2 text-sm text-gray-500">
                Aucun label dans ce projet
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
