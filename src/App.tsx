import React, { useState, useEffect, useRef } from 'react';
import type { Task } from './types';
import { Check, X, ChevronRight, ChevronDown } from 'lucide-react';

const STORAGE_KEY = 'mindflow_minimal_tasks_v2';

const INITIAL_TASKS: Task[] = [
  { id: '1', text: 'Записать главную мысль или задачу', completed: false, createdAt: Date.now() - 2000 },
  { id: '2', text: 'Попробовать нажать на чекбокс слева', completed: false, createdAt: Date.now() - 1000 },
];

export function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_TASKS;
  });

  const [inputVal, setInputVal] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }, [tasks]);

  const activeTasks = tasks.filter(t => !t.completed);
  const archivedTasks = tasks.filter(t => t.completed);

  // Add task on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = inputVal.trim();
      if (!trimmed) return;

      const newTask: Task = {
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: trimmed,
        completed: false,
        createdAt: Date.now(),
      };

      setTasks(prev => [newTask, ...prev]);
      setInputVal('');
    }
  };

  // Complete task with smooth disappearing animation
  const handleComplete = (id: string) => {
    setCompletingIds(prev => new Set(prev).add(id));

    setTimeout(() => {
      setTasks(prev =>
        prev.map(t =>
          t.id === id ? { ...t, completed: true, completedAt: Date.now() } : t
        )
      );
      setCompletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 320);
  };

  // Restore task from archive back to active list
  const handleRestore = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: false } : t))
    );
  };

  // Delete task
  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0c0c0e] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors">
      <main className="w-full max-w-xl mx-auto px-6 pt-16 sm:pt-24 pb-12 flex-1">
        {/* Top Minimal Input */}
        <div className="mb-10">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Новая задача..."
            autoFocus
            className="w-full bg-transparent border-0 border-b border-zinc-200 dark:border-zinc-800/80 pb-3 text-lg sm:text-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-300 transition-colors font-normal tracking-tight"
          />
        </div>

        {/* Active Tasks List */}
        <div className="flex flex-col gap-1">
          {activeTasks.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-600 font-light select-none">
              Все задачи выполнены
            </div>
          ) : (
            activeTasks.map(task => {
              const isFading = completingIds.has(task.id);
              return (
                <div
                  key={task.id}
                  className={`group flex items-center justify-between py-2.5 px-1 rounded-lg hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40 transition-all duration-300 ${
                    isFading
                      ? 'opacity-0 -translate-x-3 pointer-events-none scale-98'
                      : 'opacity-100 translate-x-0'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Circle Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleComplete(task.id)}
                      className={`shrink-0 w-4.5 h-4.5 rounded-full border border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-400 flex items-center justify-center transition-all cursor-pointer ${
                        isFading ? 'bg-zinc-900 border-zinc-900 dark:bg-zinc-100 dark:border-zinc-100' : ''
                      }`}
                      aria-label="Завершить задачу"
                    >
                      {isFading && (
                        <Check className="w-3 h-3 text-white dark:text-zinc-900 stroke-[3]" />
                      )}
                    </button>

                    {/* Task Text */}
                    <span
                      className={`text-base leading-relaxed break-words transition-all duration-200 ${
                        isFading
                          ? 'line-through text-zinc-400 dark:text-zinc-600'
                          : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {task.text}
                    </span>
                  </div>

                  {/* Delete Button (visible on hover) */}
                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded transition-opacity cursor-pointer shrink-0 ml-2"
                    title="Удалить"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Archive Section at the Bottom */}
      {archivedTasks.length > 0 && (
        <footer className="w-full max-w-xl mx-auto px-6 pb-12 pt-4">
          <div className="border-t border-zinc-100 dark:border-zinc-900 pt-4">
            <button
              type="button"
              onClick={() => setShowArchive(prev => !prev)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer select-none font-medium py-1"
            >
              {showArchive ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
              <span>Архив ({archivedTasks.length})</span>
            </button>

            {/* Collapsed Archive Items */}
            {showArchive && (
              <div className="mt-3 flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                {archivedTasks.map(task => (
                  <div
                    key={task.id}
                    className="group flex items-center justify-between py-2 px-1 rounded-lg text-zinc-400 dark:text-zinc-600 hover:bg-zinc-100/40 dark:hover:bg-zinc-900/20 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Checkbox (Click to restore) */}
                      <button
                        type="button"
                        onClick={() => handleRestore(task.id)}
                        className="shrink-0 w-4.5 h-4.5 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                        title="Вернуть в активные"
                      >
                        <Check className="w-3 h-3 text-zinc-500 dark:text-zinc-400 stroke-[2.5]" />
                      </button>

                      <span className="text-sm line-through break-words text-zinc-400 dark:text-zinc-600">
                        {task.text}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1 rounded transition-opacity cursor-pointer shrink-0 ml-2"
                      title="Удалить навсегда"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
