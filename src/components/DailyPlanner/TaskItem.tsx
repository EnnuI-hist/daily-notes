import React, { useState, useRef, useEffect } from 'react';
import type { Task, Priority } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Flag,
  Trash2,
  Check,
  MoreHorizontal,
  ArrowRight,
} from 'lucide-react';
import {
  formatDateLabel,
  isPastDate,
  getTodayDateString,
  getTomorrowDateString,
} from '../../utils/dateUtils';
import { renderInlineMarkdown } from '../../utils/markdown';

export const TaskItem: React.FC<{ task: Task }> = ({ task }) => {
  const { toggleTask, updateTask, deleteTask, setSelectedTag } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOverdue = !task.completed && isPastDate(task.dueDate);

  useEffect(() => {
    if (isEditing) {
      editInputRef.current?.focus();
    }
  }, [isEditing]);

  // Click outside to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      updateTask(task.id, { title: editTitle.trim() });
    } else {
      setEditTitle(task.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveTitle();
    if (e.key === 'Escape') {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  const priorityColors = {
    low: 'text-zinc-400 bg-zinc-100 dark:bg-zinc-800',
    medium: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50',
    high: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 font-medium',
  };

  return (
    <div
      className={`group relative flex items-start gap-3 p-3 sm:px-4 sm:py-3 rounded-xl border transition-all duration-150 ${
        task.completed
          ? 'bg-zinc-50/50 dark:bg-zinc-950/20 border-zinc-200/60 dark:border-zinc-800/40 opacity-70'
          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-xs'
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => toggleTask(task.id)}
        type="button"
        className={`mt-0.5 shrink-0 w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-200 cursor-pointer ${
          task.completed
            ? 'bg-indigo-600 border-indigo-600 text-white scale-100 shadow-xs'
            : 'border-zinc-300 dark:border-zinc-600 hover:border-indigo-500 hover:scale-105 bg-white dark:bg-zinc-800'
        }`}
        title={task.completed ? 'Отметить как невыполненную' : 'Выполнить задачу'}
      >
        {task.completed && <Check className="w-3.5 h-3.5 stroke-[3] animate-in zoom-in-50 duration-150" />}
      </button>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleKeyDown}
            className="w-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-sm text-zinc-900 dark:text-zinc-100 border border-indigo-500 focus:outline-none"
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className={`text-sm leading-snug cursor-text select-text transition-colors ${
              task.completed
                ? 'line-through text-zinc-400 dark:text-zinc-500'
                : 'text-zinc-800 dark:text-zinc-100'
            }`}
          >
            {renderInlineMarkdown(task.title, tag => setSelectedTag(tag))}
          </div>
        )}

        {/* Metadata Badges: Date, Priority, Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
          {/* Due Date badge */}
          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px] ${
                isOverdue
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60'
                  : task.dueDate === getTodayDateString()
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{formatDateLabel(task.dueDate)}</span>
              {isOverdue && <span className="text-[10px] uppercase font-bold ml-0.5">Просрочено</span>}
            </span>
          )}

          {/* Priority badge */}
          {task.priority !== 'low' && (
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityColors[task.priority]}`}>
              <Flag className="w-2.5 h-2.5" />
              <span>{task.priority === 'high' ? 'Высокий' : 'Средний'}</span>
            </span>
          )}

          {/* Tags */}
          {task.tags?.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={e => {
                e.stopPropagation();
                setSelectedTag(tag);
              }}
              className="text-[11px] text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer font-mono transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Hover Action Menu */}
      <div className="relative shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {/* Quick Rollover to Tomorrow (if not completed and today/past) */}
        {!task.completed && task.dueDate <= getTodayDateString() && (
          <button
            type="button"
            onClick={() => updateTask(task.id, { dueDate: getTomorrowDateString() })}
            className="p-1 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Перенести на завтра"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {/* More Options Dropdown */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Опции"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg p-1.5 z-20 text-xs text-zinc-700 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                Срок задачи
              </div>
              <button
                onClick={() => {
                  updateTask(task.id, { dueDate: getTodayDateString() });
                  setMenuOpen(false);
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-between cursor-pointer"
              >
                <span>Сегодня</span>
                {task.dueDate === getTodayDateString() && <Check className="w-3 h-3 text-indigo-500" />}
              </button>
              <button
                onClick={() => {
                  updateTask(task.id, { dueDate: getTomorrowDateString() });
                  setMenuOpen(false);
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-between cursor-pointer"
              >
                <span>Завтра</span>
                {task.dueDate === getTomorrowDateString() && <Check className="w-3 h-3 text-indigo-500" />}
              </button>
              <button
                onClick={() => {
                  updateTask(task.id, { dueDate: '' });
                  setMenuOpen(false);
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-between cursor-pointer"
              >
                <span>Без даты</span>
                {!task.dueDate && <Check className="w-3 h-3 text-indigo-500" />}
              </button>

              <div className="border-t border-zinc-100 dark:border-zinc-700 my-1" />

              <div className="px-2 py-1 text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                Приоритет
              </div>
              {(['low', 'medium', 'high'] as Priority[]).map(p => (
                <button
                  key={p}
                  onClick={() => {
                    updateTask(task.id, { priority: p });
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-between cursor-pointer capitalize"
                >
                  <span>{p === 'low' ? 'Обычный' : p === 'medium' ? 'Средний' : 'Высокий'}</span>
                  {task.priority === p && <Check className="w-3 h-3 text-indigo-500" />}
                </button>
              ))}

              <div className="border-t border-zinc-100 dark:border-zinc-700 my-1" />

              <button
                onClick={() => {
                  deleteTask(task.id);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-2 py-1 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Удалить задачу</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
