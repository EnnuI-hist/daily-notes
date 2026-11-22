import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Task, SyncConfig, SyncStatus } from './types';
import {
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Cloud,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  createPrivateGist,
  fetchGistTasks,
  updateGistTasks,
  mergeTasks,
  decodeSyncPairing,
} from './services/gistSync';
import { SyncModal } from './components/SyncModal';

const TASKS_STORAGE_KEY = 'mindflow_minimal_tasks_v2';
const SYNC_CONFIG_KEY = 'mindflow_sync_config_v1';

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    text: 'Записать главную мысль или задачу',
    completed: false,
    createdAt: Date.now() - 2000,
    updatedAt: Date.now() - 2000,
  },
  {
    id: '2',
    text: 'Попробовать нажать на чекбокс слева',
    completed: false,
    createdAt: Date.now() - 1000,
    updatedAt: Date.now() - 1000,
  },
];

export function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(TASKS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_TASKS;
  });

  const [syncConfig, setSyncConfig] = useState<SyncConfig | null>(() => {
    try {
      const saved = localStorage.getItem(SYNC_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    syncConfig ? 'synced' : 'offline'
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<number | undefined>(
    syncConfig?.lastSyncedAt
  );

  const [inputVal, setInputVal] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const isPullingRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  // Sync tasks to localStorage whenever tasks change
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }, [tasks]);

  // Pull tasks from Gist and merge with local
  const pullFromRemote = useCallback(
    async (configToUse = syncConfig) => {
      if (!configToUse || !configToUse.token || !configToUse.gistId) {
        setSyncStatus('offline');
        return;
      }

      try {
        isPullingRef.current = true;
        setSyncStatus('syncing');

        const remoteTasks = await fetchGistTasks(configToUse);
        const merged = mergeTasks(tasksRef.current, remoteTasks);

        setTasks(merged);
        const now = Date.now();
        setLastSyncedAt(now);
        setSyncStatus('synced');

        // Update last synced in config
        const updatedConfig = { ...configToUse, lastSyncedAt: now };
        setSyncConfig(updatedConfig);
        localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(updatedConfig));
      } catch (err) {
        console.error('Pull failed', err);
        setSyncStatus('error');
      } finally {
        setTimeout(() => {
          isPullingRef.current = false;
        }, 500);
      }
    },
    [syncConfig]
  );

  // Push local tasks to Gist
  const pushToRemote = useCallback(
    async (configToUse = syncConfig) => {
      if (!configToUse || !configToUse.token || !configToUse.gistId) return;

      try {
        setSyncStatus('syncing');
        await updateGistTasks(configToUse, tasksRef.current);
        const now = Date.now();
        setLastSyncedAt(now);
        setSyncStatus('synced');

        const updatedConfig = { ...configToUse, lastSyncedAt: now };
        setSyncConfig(updatedConfig);
        localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(updatedConfig));
      } catch (err) {
        console.error('Push failed', err);
        setSyncStatus('error');
      }
    },
    [syncConfig]
  );

  // Debounced push to Gist whenever tasks change locally
  const schedulePush = useCallback(() => {
    if (!syncConfig || !syncConfig.token || !syncConfig.gistId) return;
    if (isPullingRef.current) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    setSyncStatus('syncing');
    debounceTimerRef.current = window.setTimeout(() => {
      pushToRemote();
    }, 1800);
  }, [syncConfig, pushToRemote]);

  // Handle Pairing URL from hash (#sync=...) on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#sync=')) {
      const hashData = window.location.hash.slice(6);
      const pairing = decodeSyncPairing(hashData);

      if (pairing && pairing.token && pairing.gistId) {
        const newConfig: SyncConfig = {
          token: pairing.token,
          gistId: pairing.gistId,
          lastSyncedAt: Date.now(),
        };

        setSyncConfig(newConfig);
        localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(newConfig));

        // Immediately clean secret hash from address bar and history
        window.history.replaceState(null, '', window.location.pathname);

        setToastMessage('Синхронизация успешно привязана с ПК! 🚀');
        setTimeout(() => setToastMessage(null), 3500);

        // Immediately pull remote tasks
        pullFromRemote(newConfig);
      }
    }
  }, [pullFromRemote]);

  // Initial pull and event listeners for window focus & visibilitychange
  useEffect(() => {
    if (syncConfig) {
      pullFromRemote(syncConfig);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && syncConfig) {
        pullFromRemote();
      }
    };

    const handleFocus = () => {
      if (syncConfig) {
        pullFromRemote();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncConfig, pullFromRemote]);

  // Connect handler in Modal
  const handleConnectSync = async (token: string, existingGistId?: string) => {
    let gistId = existingGistId;

    if (!gistId) {
      // Create new private Gist
      gistId = await createPrivateGist(token, tasksRef.current);
    } else {
      // Test fetch from existing Gist and merge
      const remote = await fetchGistTasks({ token, gistId });
      const merged = mergeTasks(tasksRef.current, remote);
      setTasks(merged);
    }

    const newConfig: SyncConfig = {
      token,
      gistId,
      lastSyncedAt: Date.now(),
    };

    setSyncConfig(newConfig);
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(newConfig));
    setSyncStatus('synced');
    setLastSyncedAt(Date.now());

    // Push initial merged state to gist
    await updateGistTasks(newConfig, tasksRef.current);

    setToastMessage('Синхронизация успешно подключена!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Disconnect handler
  const handleDisconnectSync = () => {
    setSyncConfig(null);
    localStorage.removeItem(SYNC_CONFIG_KEY);
    setSyncStatus('offline');
    setLastSyncedAt(undefined);
    setIsSyncModalOpen(false);
    setToastMessage('Синхронизация отключена');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Force sync action
  const handleForceSync = async () => {
    await pullFromRemote();
    await pushToRemote();
    setToastMessage('Данные синхронизированы!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Filter out deleted tasks (tombstones) for display
  const activeTasks = tasks.filter(t => !t.completed && !t.deleted);
  const archivedTasks = tasks.filter(t => t.completed && !t.deleted);

  // Add task on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = inputVal.trim();
      if (!trimmed) return;

      const now = Date.now();
      const newTask: Task = {
        id: `t-${now}-${Math.random().toString(36).slice(2, 6)}`,
        text: trimmed,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };

      setTasks(prev => [newTask, ...prev]);
      setInputVal('');
      schedulePush();
    }
  };

  // Complete task with smooth disappearing animation
  const handleComplete = (id: string) => {
    setCompletingIds(prev => new Set(prev).add(id));

    setTimeout(() => {
      const now = Date.now();
      setTasks(prev =>
        prev.map(t =>
          t.id === id
            ? { ...t, completed: true, completedAt: now, updatedAt: now }
            : t
        )
      );
      setCompletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      schedulePush();
    }, 320);
  };

  // Restore task from archive back to active list
  const handleRestore = (id: string) => {
    const now = Date.now();
    setTasks(prev =>
      prev.map(t =>
        t.id === id ? { ...t, completed: false, updatedAt: now } : t
      )
    );
    schedulePush();
  };

  // Delete task (soft delete tombstone so deletion syncs to other devices)
  const handleDelete = (id: string) => {
    const now = Date.now();
    setTasks(prev =>
      prev.map(t =>
        t.id === id ? { ...t, deleted: true, updatedAt: now } : t
      )
    );
    schedulePush();
  };

  // Helper for Status indicator
  const renderSyncIndicator = () => {
    if (!syncConfig) {
      return (
        <button
          type="button"
          onClick={() => setIsSyncModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer select-none"
          title="Настроить синхронизацию с телефоном"
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Офлайн</span>
        </button>
      );
    }

    if (syncStatus === 'syncing') {
      return (
        <button
          type="button"
          onClick={() => setIsSyncModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 transition-colors cursor-pointer select-none"
          title="Синхронизация данных..."
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Сохранение...</span>
        </button>
      );
    }

    if (syncStatus === 'error') {
      return (
        <button
          type="button"
          onClick={() => setIsSyncModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 transition-colors cursor-pointer select-none"
          title="Ошибка синхронизации (клик для настроек)"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Ошибка</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setIsSyncModalOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer select-none"
        title="Синхронизировано (клик для настроек или QR-кода)"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span className="hidden sm:inline">Синхронизировано</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0c0c0e] text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors">
      <main className="w-full max-w-xl mx-auto px-6 pt-10 sm:pt-16 pb-12 flex-1">
        {/* Header with Sync Status Indicator */}
        <div className="flex items-center justify-end mb-8">
          {renderSyncIndicator()}
        </div>

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
                        isFading
                          ? 'bg-zinc-900 border-zinc-900 dark:bg-zinc-100 dark:border-zinc-100'
                          : ''
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

      {/* Sync Configuration & QR Pairing Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        config={syncConfig}
        onConnect={handleConnectSync}
        onDisconnect={handleDisconnectSync}
        onForceSync={handleForceSync}
        isSyncing={syncStatus === 'syncing'}
        lastSyncedAt={lastSyncedAt}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium shadow-xl border border-zinc-800 dark:border-zinc-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
