import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  CheckSquare,
  FileText,
  CalendarArrowRight,
  Plus,
  Sun,
  Moon,
  Database,
  ArrowRight,
} from 'lucide-react';
import type { Task, Note } from '../types';

interface PaletteAction {
  id: string;
  type: 'action';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  perform: () => void;
}

interface PaletteTask {
  id: string;
  type: 'task';
  task: Task;
}

interface PaletteNote {
  id: string;
  type: 'note';
  note: Note;
}

type PaletteItem = PaletteAction | PaletteTask | PaletteNote;

export const CommandPalette: React.FC = () => {
  const {
    searchModalOpen,
    setSearchModalOpen,
    tasks,
    notes,
    toggleTask,
    setActiveNoteModal,
    setCurrentTab,
    theme,
    setTheme,
    rolloverUnfinishedTasksToTomorrow,
    setBackupModalOpen,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchModalOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchModalOpen]);

  // Actions list
  const actions: PaletteAction[] = [
    {
      id: 'act-new-note',
      type: 'action',
      title: 'Создать новую заметку',
      subtitle: 'Открыть редактор заметок',
      icon: <Plus className="w-4 h-4 text-emerald-500" />,
      perform: () => {
        setCurrentTab('notes');
        setActiveNoteModal({
          id: '',
          title: '',
          content: '',
          pinned: false,
          tags: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        setSearchModalOpen(false);
      },
    },
    {
      id: 'act-rollover',
      type: 'action',
      title: 'Перенести невыполненные задачи на завтра',
      subtitle: 'Сдвинуть все долги на один день вперед',
      icon: <CalendarArrowRight className="w-4 h-4 text-indigo-500" />,
      perform: () => {
        rolloverUnfinishedTasksToTomorrow();
        setSearchModalOpen(false);
      },
    },
    {
      id: 'act-toggle-theme',
      type: 'action',
      title: `Переключить тему на ${theme === 'dark' ? 'светлую' : 'темную'}`,
      subtitle: 'Сменить цветовое оформление интерфейса',
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      perform: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        setSearchModalOpen(false);
      },
    },
    {
      id: 'act-backup',
      type: 'action',
      title: 'Экспорт и резервное копирование',
      subtitle: 'Скачать JSON или Markdown бэкап',
      icon: <Database className="w-4 h-4 text-blue-500" />,
      perform: () => {
        setBackupModalOpen(true);
        setSearchModalOpen(false);
      },
    },
  ];

  // Filter items
  const cleanQuery = query.toLowerCase().trim();

  const filteredActions: PaletteItem[] = actions.filter(
    a => !cleanQuery || a.title.toLowerCase().includes(cleanQuery) || a.subtitle?.toLowerCase().includes(cleanQuery)
  );

  const matchedTasks: PaletteItem[] = tasks
    .filter(t => !cleanQuery || t.title.toLowerCase().includes(cleanQuery) || t.tags.some(tag => tag.toLowerCase().includes(cleanQuery)))
    .slice(0, 5)
    .map(t => ({ id: t.id, type: 'task', task: t }));

  const matchedNotes: PaletteItem[] = notes
    .filter(
      n =>
        !cleanQuery ||
        n.title.toLowerCase().includes(cleanQuery) ||
        n.content.toLowerCase().includes(cleanQuery) ||
        n.tags.some(tag => tag.toLowerCase().includes(cleanQuery))
    )
    .slice(0, 5)
    .map(n => ({ id: n.id, type: 'note', note: n }));

  const allItems: PaletteItem[] = [
    ...filteredActions,
    ...matchedTasks,
    ...matchedNotes,
  ];

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : allItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = allItems[selectedIndex];
      if (item) handleSelect(item);
    }
  };

  const handleSelect = (item: PaletteItem) => {
    if (item.type === 'action') {
      item.perform();
    } else if (item.type === 'task') {
      setCurrentTab('today');
      toggleTask(item.task.id);
      setSearchModalOpen(false);
    } else if (item.type === 'note') {
      setCurrentTab('notes');
      setActiveNoteModal(item.note);
      setSearchModalOpen(false);
    }
  };

  if (!searchModalOpen) return null;

  return (
    <div
      onClick={() => setSearchModalOpen(false)}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800 gap-3">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ищите задачи, заметки или введите команду..."
            className="w-full bg-transparent border-0 text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              Ничего не найдено по запросу «{query}»
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {allItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">
                        {item.type === 'action' && item.icon}
                        {item.type === 'task' && (
                          <CheckSquare
                            className={`w-4 h-4 ${
                              item.task.completed ? 'text-indigo-500' : 'text-zinc-400'
                            }`}
                          />
                        )}
                        {item.type === 'note' && (
                          <FileText className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate flex items-center gap-2">
                          <span>
                            {item.type === 'action'
                              ? item.title
                              : item.type === 'task'
                              ? item.task.title
                              : item.note.title || 'Без названия'}
                          </span>
                          {item.type === 'task' && item.task.completed && (
                            <span className="text-[10px] uppercase font-semibold text-zinc-400">
                              (выполнено)
                            </span>
                          )}
                        </div>
                        {item.type === 'action' && item.subtitle && (
                          <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5 ml-2">
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-700/60 text-zinc-500 dark:text-zinc-400">
                        {item.type === 'action' ? 'действие' : item.type === 'task' ? 'задача' : 'заметка'}
                      </span>
                      {isSelected && (
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40 text-[11px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span>↑↓ Навигация</span>
            <span>•</span>
            <span>↵ Выбрать</span>
          </div>
          <span>Поиск по содержимому и тегам</span>
        </div>
      </div>
    </div>
  );
};
