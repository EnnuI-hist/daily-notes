import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  CheckSquare,
  FileText,
  CornerDownLeft,
  Sparkles,
  Calendar,
  Flag,
  Globe,
} from 'lucide-react';
import { getTodayDateString, getTomorrowDateString } from '../utils/dateUtils';
import { extractTags } from '../utils/markdown';
import type { Priority } from '../types';

export const QuickCapture: React.FC = () => {
  const { addTask, addNote, currentTab } = useApp();
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'auto' | 'task' | 'note'>('auto');
  const [targetDate, setTargetDate] = useState<string>(getTodayDateString());
  const [priority, setPriority] = useState<Priority>('medium');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-detect if input looks like a task
  const isCheckboxPrefix = /^(\[\s?\]|- \[\s?\]|- )/.test(text.trim());
  const hasUrl = /https?:\/\/[^\s]+/.test(text);
  const detectedTags = extractTags(text);

  const effectiveMode =
    mode === 'auto'
      ? isCheckboxPrefix
        ? 'task'
        : currentTab === 'notes'
        ? 'note'
        : 'task'
      : mode;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    if (effectiveMode === 'task') {
      // Strip checkbox prefix if present
      const cleanTitle = trimmed.replace(/^(\[\s?\]|- \[\s?\]|- )\s*/, '');
      addTask(cleanTitle, {
        dueDate: targetDate,
        priority: priority,
      });
    } else {
      // Save as note: first line is title, rest is content
      const lines = trimmed.split('\n');
      const title = lines[0];
      const content = lines.length > 1 ? lines.slice(1).join('\n') : '';

      addNote({
        title: title || 'Новая заметка',
        content: content || title,
      });
    }

    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Keyboard shortcut: focus quick capture when user presses '/' outside of an input
  useEffect(() => {
    const handleSlash = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes(target.tagName) &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleSlash);
    return () => window.removeEventListener('keydown', handleSlash);
  }, []);

  return (
    <div className="w-full mb-6">
      <div
        className={`relative rounded-2xl bg-white dark:bg-zinc-900 border transition-all duration-200 shadow-sm ${
          isFocused
            ? 'border-indigo-500/80 dark:border-indigo-500/80 ring-3 ring-indigo-500/10 shadow-md'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
        }`}
      >
        <div className="flex items-center px-4 py-3 gap-3">
          {/* Mode Indicator Icon */}
          <div className="shrink-0 text-zinc-400 dark:text-zinc-500">
            {effectiveMode === 'task' ? (
              <CheckSquare className="w-5 h-5 text-indigo-500 animate-in zoom-in duration-150" />
            ) : (
              <FileText className="w-5 h-5 text-emerald-500 animate-in zoom-in duration-150" />
            )}
          </div>

          {/* Quick Input */}
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={
              effectiveMode === 'task'
                ? 'Новая задача или мысль... (начни с [] или напиши текст)'
                : 'Запишите мысль или заметку... (поддерживает #теги и ссылки)'
            }
            className="w-full bg-transparent border-0 text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
          />

          {/* Submit Action */}
          <button
            onClick={() => handleSubmit()}
            disabled={!text.trim()}
            type="button"
            className={`shrink-0 p-2 rounded-xl transition-all duration-150 cursor-pointer ${
              text.trim()
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-xs'
                : 'text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
            }`}
            title="Отправить (Enter)"
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Options Toolbar: visible on focus or when text is present */}
        {(isFocused || text.length > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 rounded-b-2xl text-xs text-zinc-500 animate-in fade-in duration-150">
            {/* Mode selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-medium mr-1">Тип:</span>
              <button
                type="button"
                onClick={() => setMode('auto')}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                  mode === 'auto'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium shadow-xs border border-zinc-200/80 dark:border-zinc-700'
                    : 'hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Авто
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode('task')}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                  mode === 'task'
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-medium shadow-xs border border-zinc-200/80 dark:border-zinc-700'
                    : 'hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Задача
              </button>
              <button
                type="button"
                onClick={() => setMode('note')}
                className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                  mode === 'note'
                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 font-medium shadow-xs border border-zinc-200/80 dark:border-zinc-700'
                    : 'hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Заметка
              </button>
            </div>

            {/* Task specific options */}
            {effectiveMode === 'task' && (
              <div className="flex items-center gap-3">
                {/* Date quick toggle */}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  <button
                    type="button"
                    onClick={() => setTargetDate(getTodayDateString())}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      targetDate === getTodayDateString()
                        ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                        : 'hover:text-zinc-700'
                    }`}
                  >
                    Сегодня
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <button
                    type="button"
                    onClick={() => setTargetDate(getTomorrowDateString())}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      targetDate === getTomorrowDateString()
                        ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                        : 'hover:text-zinc-700'
                    }`}
                  >
                    Завтра
                  </button>
                </div>

                {/* Priority */}
                <div className="flex items-center gap-1">
                  <Flag className="w-3 h-3 text-zinc-400" />
                  {(['low', 'medium', 'high'] as Priority[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`px-1.5 py-0.5 rounded uppercase text-[10px] cursor-pointer ${
                        priority === p
                          ? p === 'high'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 font-semibold'
                            : p === 'medium'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 font-semibold'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold'
                          : 'text-zinc-400 hover:text-zinc-600'
                      }`}
                    >
                      {p === 'low' ? 'Низк' : p === 'medium' ? 'Сред' : 'Выс'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Smart badges preview */}
            <div className="flex items-center gap-1.5">
              {hasUrl && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11px]">
                  <Globe className="w-2.5 h-2.5" />
                  Ссылка
                </span>
              )}
              {detectedTags.map(tag => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[11px] font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
