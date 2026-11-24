import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckSquare, Bookmark, Pin, Calendar, ArrowRight } from 'lucide-react';
import type { Task, Note, TabType } from '../types';
import { formatDateBadge } from '../utils/date';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  notes: Note[];
  onSelectTab: (tab: TabType) => void;
  onSelectTagFilter?: (tag: string | null) => void;
}

const SearchDialog: React.FC<{
  onClose: () => void;
  tasks: Task[];
  notes: Note[];
  onSelectTab: (tab: TabType) => void;
  onSelectTagFilter?: (tag: string | null) => void;
}> = ({ onClose, tasks, notes, onSelectTab, onSelectTagFilter }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const trimmed = query.trim().toLowerCase();

  const activeTasks = tasks.filter(t => !t.deleted);
  const activeNotes = notes.filter(n => !n.deleted);

  const matchedTasks = trimmed
    ? activeTasks.filter(t => t.text.toLowerCase().includes(trimmed))
    : [];

  const matchedNotes = trimmed
    ? activeNotes.filter(n => {
        const inTitle = n.title?.toLowerCase().includes(trimmed);
        const inContent = n.content.toLowerCase().includes(trimmed);
        const inTags = n.tags.some(t => t.toLowerCase().includes(trimmed.replace(/^#/, '')));
        return inTitle || inContent || inTags;
      })
    : [];

  const totalResults = matchedTasks.length + matchedNotes.length;

  const handleSelectNote = (tag?: string) => {
    onSelectTab('notes');
    if (tag && onSelectTagFilter) {
      onSelectTagFilter(tag);
    }
    onClose();
  };

  const handleSelectTask = () => {
    onSelectTab('tasks');
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:pt-20 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-[#121215] text-zinc-900 dark:text-zinc-100 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
      >
        {/* Top Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск по задачам, заметкам, ссылкам и #тегам..."
            className="w-full bg-transparent border-0 text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-3 flex flex-col gap-4">
          {!trimmed ? (
            <div className="py-12 text-center text-xs text-zinc-400 dark:text-zinc-500">
              Введите ключевое слово, ссылку или #тег для поиска
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400 dark:text-zinc-500">
              Ничего не найдено по запросу «{query}»
            </div>
          ) : (
            <>
              {/* Notes Results */}
              {matchedNotes.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Заметки и закладки ({matchedNotes.length})</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    {matchedNotes.map(n => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleSelectNote()}
                        className="w-full flex items-start justify-between gap-3 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {n.pinned && (
                              <Pin className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {n.title || n.content.slice(0, 45) || 'Заметка'}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                            {n.content}
                          </p>

                          {n.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              {n.tags.map(t => (
                                <span
                                  key={t}
                                  className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                                >
                                  #{t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks Results */}
              {matchedTasks.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Задачи ({matchedTasks.length})</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    {matchedTasks.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={handleSelectTask}
                        className="w-full flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              t.completed ? 'bg-zinc-400' : 'bg-emerald-500'
                            }`}
                          />
                          <span
                            className={`text-sm truncate ${
                              t.completed
                                ? 'line-through text-zinc-400 dark:text-zinc-600'
                                : 'text-zinc-800 dark:text-zinc-200'
                            }`}
                          >
                            {t.text}
                          </span>
                          {t.dueDate && (
                            <span className="text-[11px] text-zinc-400 shrink-0 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDateBadge(t.dueDate)}</span>
                            </span>
                          )}
                        </div>

                        <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  tasks,
  notes,
  onSelectTab,
  onSelectTagFilter,
}) => {
  if (!isOpen) return null;

  return (
    <SearchDialog
      onClose={onClose}
      tasks={tasks}
      notes={notes}
      onSelectTab={onSelectTab}
      onSelectTagFilter={onSelectTagFilter}
    />
  );
};
