import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Task, Note, TabType, SyncConfig, SyncStatus } from './types';
import {
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Cloud,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Undo2,
} from 'lucide-react';
import {
  createPrivateGist,
  fetchGistData,
  updateGistData,
  mergeTasks,
  mergeNotes,
  decodeSyncPairing,
} from './services/gistSync';
import { SyncModal } from './components/SyncModal';
import { DatePickerPopover } from './components/DatePickerPopover';
import { Sidebar } from './components/Sidebar';
import { MobileHeader, MobileBottomNav } from './components/MobileNav';
import { NotesView } from './components/NotesView';
import { SearchModal } from './components/SearchModal';
import {
  formatDateBadge,
  isDateOverdue,
  timestampToDateString,
  formatArchiveDayHeader,
} from './utils/date';

const TASKS_STORAGE_KEY = 'mindflow_minimal_tasks_v2';
const NOTES_STORAGE_KEY = 'mindflow_notes_v1';
const SYNC_CONFIG_KEY = 'mindflow_sync_config_v1';
const ACTIVE_TAB_KEY = 'mindflow_active_tab_v1';

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

const INITIAL_NOTES: Note[] = [
  {
    id: 'n-1',
    title: 'Добро пожаловать в «Заметки»!',
    content:
      'Здесь можно вечно сохранять важные мысли, ссылки, статьи и идеи. Они никогда не улетают в архив!\n\nПоддерживается **жирный текст**, *курсив*, `код` и списки:\n- Быстрый доступ с ПК и телефона\n- Теги вроде #мысли или #важное\n- Ссылки автоматически превращаются в карточки',
    tags: ['важное', 'старт'],
    pinned: true,
    createdAt: Date.now() - 4000,
    updatedAt: Date.now() - 4000,
  },
  {
    id: 'n-2',
    title: 'Полезные ссылки',
    content:
      'Репозиторий проекта MindFlow:\nhttps://github.com/EnnuI-hist/daily-notes\n\nСохраняйте любые полезные материалы #ссылки #dev',
    tags: ['ссылки', 'dev'],
    pinned: false,
    createdAt: Date.now() - 2000,
    updatedAt: Date.now() - 2000,
  },
];

export function App() {
  const [currentTab, setCurrentTab] = useState<TabType>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_TAB_KEY);
      if (saved === 'notes' || saved === 'tasks') return saved;
    } catch {
      // ignore
    }
    return 'tasks';
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem(TASKS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_TASKS;
  });

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(NOTES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_NOTES;
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

  // Active tag filter in Notes
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  // Task Input States
  const [inputVal, setInputVal] = useState('');
  const [inputDate, setInputDate] = useState<string | null>(null);
  const [showInputDatePicker, setShowInputDatePicker] = useState(false);
  const [editingDateTaskId, setEditingDateTaskId] = useState<string | null>(null);

  // Deletion Confirmation States
  const [confirmingDeleteTaskId, setConfirmingDeleteTaskId] = useState<string | null>(null);
  const [confirmingDeleteNoteId, setConfirmingDeleteNoteId] = useState<string | null>(null);
  const [undoItem, setUndoItem] = useState<{ type: 'task' | 'note'; task?: Task; note?: Note } | null>(null);

  // Archive & Modals
  const [showArchive, setShowArchive] = useState(false);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const isPullingRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);
  const deleteTimerRef = useRef<number | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const syncConfigRef = useRef(syncConfig);
  syncConfigRef.current = syncConfig;

  // Persist tab
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_TAB_KEY, currentTab);
    } catch (e) {
      console.error('Failed to save tab', e);
    }
  }, [currentTab]);

  // Persist tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }, [tasks]);

  // Persist notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save notes', e);
    }
  }, [notes]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Click outside to cancel delete confirmations
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        (confirmingDeleteTaskId || confirmingDeleteNoteId) &&
        !target.closest('[data-delete-btn]')
      ) {
        setConfirmingDeleteTaskId(null);
        setConfirmingDeleteNoteId(null);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, [confirmingDeleteTaskId, confirmingDeleteNoteId]);

  // Pull from Gist (both tasks and notes)
  const pullFromRemote = useCallback(async (configToUse = syncConfigRef.current) => {
    if (!configToUse || !configToUse.token || !configToUse.gistId) {
      setSyncStatus('offline');
      return;
    }

    try {
      isPullingRef.current = true;
      const remoteData = await fetchGistData(configToUse);

      const mergedTasks = mergeTasks(tasksRef.current, remoteData.tasks);
      const mergedNotes = mergeNotes(notesRef.current, remoteData.notes);

      if (JSON.stringify(mergedTasks) !== JSON.stringify(tasksRef.current)) {
        setTasks(mergedTasks);
      }
      if (JSON.stringify(mergedNotes) !== JSON.stringify(notesRef.current)) {
        setNotes(mergedNotes);
      }

      const now = Date.now();
      setLastSyncedAt(now);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Pull failed', err);
      setSyncStatus('error');
    } finally {
      setTimeout(() => {
        isPullingRef.current = false;
      }, 300);
    }
  }, []);

  // Push local data to Gist
  const pushToRemote = useCallback(async () => {
    const config = syncConfigRef.current;
    if (!config || !config.token || !config.gistId) return;
    if (isPullingRef.current) return;

    try {
      setSyncStatus('syncing');
      await updateGistData(config, tasksRef.current, notesRef.current);
      setLastSyncedAt(Date.now());
      setSyncStatus('synced');
    } catch (err) {
      console.error('Push failed', err);
      setSyncStatus('error');
    }
  }, []);

  // Debounced push to Gist (1.8s debounce)
  const schedulePush = useCallback(() => {
    const config = syncConfigRef.current;
    if (!config || !config.token || !config.gistId) return;
    if (isPullingRef.current) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    setSyncStatus('syncing');
    debounceTimerRef.current = window.setTimeout(() => {
      pushToRemote();
    }, 1800);
  }, [pushToRemote]);

  // Initial load: parse hash (#sync=...) or pull once on mount
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
        syncConfigRef.current = newConfig;
        localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(newConfig));

        window.history.replaceState(null, '', window.location.pathname);

        setToastMessage('Синхронизация привязана с ПК! 🚀');
        setTimeout(() => setToastMessage(null), 3000);

        pullFromRemote(newConfig);
        return;
      }
    }

    const savedConfig = syncConfigRef.current;
    if (savedConfig && savedConfig.token && savedConfig.gistId) {
      pullFromRemote(savedConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect handler in Modal
  const handleConnectSync = async (token: string, existingGistId?: string) => {
    let gistId = existingGistId;

    if (!gistId) {
      gistId = await createPrivateGist(token, tasksRef.current, notesRef.current);
    } else {
      const remoteData = await fetchGistData({ token, gistId });
      const mergedT = mergeTasks(tasksRef.current, remoteData.tasks);
      const mergedN = mergeNotes(notesRef.current, remoteData.notes);
      setTasks(mergedT);
      setNotes(mergedN);
    }

    const newConfig: SyncConfig = {
      token,
      gistId,
      lastSyncedAt: Date.now(),
    };

    setSyncConfig(newConfig);
    syncConfigRef.current = newConfig;
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(newConfig));
    setSyncStatus('synced');
    setLastSyncedAt(Date.now());

    await updateGistData(newConfig, tasksRef.current, notesRef.current);

    setToastMessage('Синхронизация подключена!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Disconnect handler
  const handleDisconnectSync = () => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    setSyncConfig(null);
    syncConfigRef.current = null;
    localStorage.removeItem(SYNC_CONFIG_KEY);
    setSyncStatus('offline');
    setLastSyncedAt(undefined);
    setIsSyncModalOpen(false);
    setToastMessage('Синхронизация отключена');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Force sync action from Modal
  const handleForceSync = async () => {
    await pullFromRemote();
    await pushToRemote();
    setToastMessage('Синхронизировано!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Active / Archived Tasks
  const activeTasks = tasks.filter(t => !t.completed && !t.deleted);
  const archivedTasks = tasks.filter(t => t.completed && !t.deleted);

  // Active Notes
  const activeNotes = notes.filter(n => !n.deleted);

  // Add task on Enter
  const handleTaskKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
        dueDate: inputDate || undefined,
      };

      setTasks(prev => [newTask, ...prev]);
      setInputVal('');
      setInputDate(null);
      schedulePush();
    }
  };

  // Complete task
  const handleCompleteTask = (id: string) => {
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

  // Restore task from archive
  const handleRestoreTask = (id: string) => {
    const now = Date.now();
    setTasks(prev =>
      prev.map(t =>
        t.id === id ? { ...t, completed: false, completedAt: undefined, updatedAt: now } : t
      )
    );
    schedulePush();
  };

  // Task delete confirmation step 1
  const handleStartDeleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmingDeleteTaskId === id) {
      executeDeleteTask(id, e);
      return;
    }

    setConfirmingDeleteTaskId(id);

    if (deleteTimerRef.current) {
      window.clearTimeout(deleteTimerRef.current);
    }
    deleteTimerRef.current = window.setTimeout(() => {
      setConfirmingDeleteTaskId(prev => (prev === id ? null : prev));
    }, 3000);
  };

  // Task delete confirmation step 2
  const executeDeleteTask = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (deleteTimerRef.current) {
      window.clearTimeout(deleteTimerRef.current);
    }
    setConfirmingDeleteTaskId(null);

    const targetTask = tasks.find(t => t.id === id);
    if (!targetTask) return;

    const now = Date.now();
    setTasks(prev =>
      prev.map(t =>
        t.id === id ? { ...t, deleted: true, updatedAt: now } : t
      )
    );
    schedulePush();

    setUndoItem({ type: 'task', task: targetTask });
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
    undoTimerRef.current = window.setTimeout(() => {
      setUndoItem(null);
    }, 4500);
  };

  // Note delete confirmation step 1
  const handleStartDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmingDeleteNoteId === id) {
      executeDeleteNote(id, e);
      return;
    }

    setConfirmingDeleteNoteId(id);

    if (deleteTimerRef.current) {
      window.clearTimeout(deleteTimerRef.current);
    }
    deleteTimerRef.current = window.setTimeout(() => {
      setConfirmingDeleteNoteId(prev => (prev === id ? null : prev));
    }, 3000);
  };

  // Note delete confirmation step 2
  const executeDeleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (deleteTimerRef.current) {
      window.clearTimeout(deleteTimerRef.current);
    }
    setConfirmingDeleteNoteId(null);

    const targetNote = notes.find(n => n.id === id);
    if (!targetNote) return;

    const now = Date.now();
    setNotes(prev =>
      prev.map(n =>
        n.id === id ? { ...n, deleted: true, updatedAt: now } : n
      )
    );
    schedulePush();

    setUndoItem({ type: 'note', note: targetNote });
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
    undoTimerRef.current = window.setTimeout(() => {
      setUndoItem(null);
    }, 4500);
  };

  // Undo deletion
  const handleUndo = () => {
    if (!undoItem) return;

    const now = Date.now();
    if (undoItem.type === 'task' && undoItem.task) {
      const restored = undoItem.task;
      setTasks(prev =>
        prev.map(t =>
          t.id === restored.id ? { ...t, deleted: false, updatedAt: now } : t
        )
      );
    } else if (undoItem.type === 'note' && undoItem.note) {
      const restored = undoItem.note;
      setNotes(prev =>
        prev.map(n =>
          n.id === restored.id ? { ...n, deleted: false, updatedAt: now } : n
        )
      );
    }
    schedulePush();

    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
    }
    setUndoItem(null);
    setToastMessage('Запись восстановлена ✨');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Add Note
  const handleAddNote = (newNoteData: {
    title?: string;
    content: string;
    tags: string[];
    pinned?: boolean;
  }) => {
    const now = Date.now();
    const newNote: Note = {
      id: `n-${now}-${Math.random().toString(36).slice(2, 6)}`,
      title: newNoteData.title,
      content: newNoteData.content,
      tags: newNoteData.tags,
      pinned: newNoteData.pinned,
      createdAt: now,
      updatedAt: now,
    };

    setNotes(prev => [newNote, ...prev]);
    schedulePush();
    setToastMessage('Заметка сохранена ✨');
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Update Note
  const handleUpdateNote = (updatedData: {
    id: string;
    title?: string;
    content: string;
    tags: string[];
    pinned: boolean;
  }) => {
    const now = Date.now();
    setNotes(prev =>
      prev.map(n =>
        n.id === updatedData.id
          ? {
              ...n,
              title: updatedData.title,
              content: updatedData.content,
              tags: updatedData.tags,
              pinned: updatedData.pinned,
              updatedAt: now,
            }
          : n
      )
    );
    schedulePush();
    setToastMessage('Заметка обновлена');
    setTimeout(() => setToastMessage(null), 2000);
  };

  // Toggle Note Pin
  const handleTogglePinNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    setNotes(prev =>
      prev.map(n =>
        n.id === id ? { ...n, pinned: !n.pinned, updatedAt: now } : n
      )
    );
    schedulePush();
  };

  // Update task date
  const handleUpdateTaskDate = (id: string, date: string | null) => {
    const now = Date.now();
    setTasks(prev =>
      prev.map(t =>
        t.id === id ? { ...t, dueDate: date || undefined, updatedAt: now } : t
      )
    );
    schedulePush();
  };

  // Static sync cloud icon for header
  const renderSyncIndicator = () => {
    if (!syncConfig) {
      return (
        <button
          type="button"
          onClick={() => setIsSyncModalOpen(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer select-none"
          title="Синхронизация отключена (нажмите для настройки)"
          aria-label="Синхронизация отключена"
        >
          <Cloud className="w-4 h-4 opacity-40 hover:opacity-80 transition-opacity" />
        </button>
      );
    }

    if (syncStatus === 'error') {
      return (
        <button
          type="button"
          onClick={() => setIsSyncModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 h-8 rounded-full text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-950/70 transition-colors cursor-pointer select-none"
          title="Ошибка синхронизации (нажмите для проверки настроек)"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Ошибка</span>
        </button>
      );
    }

    if (syncStatus === 'syncing') {
      return (
        <button
          type="button"
          onClick={() => setIsSyncModalOpen(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer select-none"
          title="Сохранение в Gist..."
          aria-label="Сохранение"
        >
          <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => setIsSyncModalOpen(true)}
        className="relative w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer select-none"
        title="Синхронизировано (нажмите для настроек или QR-кода)"
        aria-label="Синхронизировано"
      >
        <Cloud className="w-4 h-4" />
        <span className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0c0c0e] text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors">
      {/* Desktop Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeTasksCount={activeTasks.length}
        activeNotesCount={activeNotes.length}
        syncConfig={syncConfig}
        syncStatus={syncStatus}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <MobileHeader
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          activeTasksCount={activeTasks.length}
          activeNotesCount={activeNotes.length}
          syncConfig={syncConfig}
          syncStatus={syncStatus}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          onOpenSearch={() => setIsSearchModalOpen(true)}
        />

        <div className="flex-1 flex flex-col justify-between pb-24 md:pb-12">
          {currentTab === 'tasks' ? (
            /* ================= TASKS TAB ================= */
            <main className="w-full max-w-xl mx-auto px-6 pt-6 sm:pt-12 pb-12 flex-1">
              {/* Header with Compact Static Sync Icon on desktop */}
              <div className="hidden md:flex items-center justify-end mb-6 h-8">
                {renderSyncIndicator()}
              </div>

              {/* Top Minimal Input with Optional Date Picker */}
              <div className="relative mb-10">
                <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800/80 pb-3 focus-within:border-zinc-900 dark:focus-within:border-zinc-300 transition-colors">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={handleTaskKeyDown}
                    placeholder="Новая задача..."
                    autoFocus
                    className="w-full bg-transparent border-0 text-lg sm:text-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none font-normal tracking-tight"
                  />

                  {/* Optional Date Picker in Input */}
                  <div className="relative shrink-0 flex items-center ml-2">
                    {inputDate ? (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/60">
                        <button
                          type="button"
                          onClick={() => setShowInputDatePicker(prev => !prev)}
                          className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                          title="Изменить дату"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDateBadge(inputDate)}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setInputDate(null)}
                          className="p-0.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-400 hover:text-indigo-600 cursor-pointer ml-0.5"
                          title="Убрать дату"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowInputDatePicker(prev => !prev)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors cursor-pointer"
                        title="Привязать дату (необязательно)"
                        aria-label="Привязать дату"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    )}

                    {showInputDatePicker && (
                      <DatePickerPopover
                        currentDate={inputDate}
                        onSelectDate={date => {
                          setInputDate(date);
                          setShowInputDatePicker(false);
                          inputRef.current?.focus();
                        }}
                        onClose={() => setShowInputDatePicker(false)}
                        position="bottom-right"
                      />
                    )}
                  </div>
                </div>
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
                    const overdue = task.dueDate ? isDateOverdue(task.dueDate, task.completed) : false;
                    const isConfirming = confirmingDeleteTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        className={`group flex items-start justify-between py-2.5 px-1 rounded-lg hover:bg-zinc-100/60 dark:hover:bg-zinc-900/40 transition-all duration-300 ${
                          isFading
                            ? 'opacity-0 -translate-x-3 pointer-events-none scale-98'
                            : 'opacity-100 translate-x-0'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          {/* Circle Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleCompleteTask(task.id)}
                            className={`mt-1 shrink-0 w-4.5 h-4.5 rounded-full border border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-400 flex items-center justify-center transition-all cursor-pointer ${
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

                          {/* Task Text & Optional Date Badge */}
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-base leading-relaxed break-words transition-all duration-200 block ${
                                isFading
                                  ? 'line-through text-zinc-400 dark:text-zinc-600'
                                  : 'text-zinc-800 dark:text-zinc-200'
                              }`}
                            >
                              {task.text}
                            </span>

                            {task.dueDate && (
                              <div className="relative mt-1 inline-block">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingDateTaskId(editingDateTaskId === task.id ? null : task.id)
                                  }
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer select-none ${
                                    overdue
                                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-950/80'
                                      : 'bg-zinc-100/90 text-zinc-500 dark:bg-zinc-800/90 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60'
                                  }`}
                                  title="Кликните, чтобы изменить или убрать дату"
                                >
                                  <Calendar className="w-3 h-3 shrink-0" />
                                  <span>{formatDateBadge(task.dueDate)}</span>
                                  {overdue && (
                                    <span className="text-[10px] font-semibold uppercase tracking-wider ml-0.5">
                                      просрочено
                                    </span>
                                  )}
                                </button>

                                {editingDateTaskId === task.id && (
                                  <DatePickerPopover
                                    currentDate={task.dueDate}
                                    onSelectDate={date => {
                                      handleUpdateTaskDate(task.id, date);
                                      setEditingDateTaskId(null);
                                    }}
                                    onClose={() => setEditingDateTaskId(null)}
                                    position="bottom-left"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Hover Actions */}
                        <div className="relative shrink-0 flex items-center ml-2 mt-0.5">
                          {!task.dueDate && !isConfirming && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingDateTaskId(editingDateTaskId === task.id ? null : task.id)
                                }
                                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded transition-opacity cursor-pointer mr-0.5"
                                title="Привязать дату"
                                aria-label="Привязать дату"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>

                              {editingDateTaskId === task.id && (
                                <DatePickerPopover
                                  currentDate={task.dueDate}
                                  onSelectDate={date => {
                                    handleUpdateTaskDate(task.id, date);
                                    setEditingDateTaskId(null);
                                  }}
                                  onClose={() => setEditingDateTaskId(null)}
                                  position="bottom-right"
                                />
                              )}
                            </>
                          )}

                          {isConfirming ? (
                            <button
                              type="button"
                              data-delete-btn
                              onClick={e => executeDeleteTask(task.id, e)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-200 dark:border-rose-900/80 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer shadow-2xs animate-in fade-in zoom-in-95 duration-150 select-none shrink-0"
                              title="Нажмите ещё раз для подтверждения"
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>Удалить?</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              data-delete-btn
                              onClick={e => handleStartDeleteTask(task.id, e)}
                              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded transition-opacity cursor-pointer"
                              title="Удалить"
                              aria-label="Удалить"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </main>
          ) : (
            /* ================= NOTES TAB ================= */
            <main className="w-full max-w-4xl mx-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-12 flex-1">
              {/* Header with section title & sync icon */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Заметки и закладки
                  </h1>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Вечное хранение мыслей, ссылок и заметок без привязки к датам
                  </p>
                </div>

                <div className="hidden md:flex items-center">
                  {renderSyncIndicator()}
                </div>
              </div>

              <NotesView
                notes={notes}
                onAddNote={handleAddNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={executeDeleteNote}
                onTogglePin={handleTogglePinNote}
                confirmingDeleteId={confirmingDeleteNoteId}
                onStartDelete={handleStartDeleteNote}
                activeTagFilter={activeTagFilter}
                onSelectTagFilter={setActiveTagFilter}
              />
            </main>
          )}

          {/* Archive Section at the Bottom (shown in Tasks tab) */}
          {currentTab === 'tasks' && archivedTasks.length > 0 && (
            <footer className="w-full max-w-xl mx-auto px-6 pb-6 pt-4">
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

                {showArchive && (() => {
                  const sorted = [...archivedTasks].sort((a, b) => {
                    const ta = a.completedAt ?? a.updatedAt ?? a.createdAt;
                    const tb = b.completedAt ?? b.updatedAt ?? b.createdAt;
                    return tb - ta;
                  });

                  const groups: { dateStr: string; tasks: typeof sorted }[] = [];
                  for (const task of sorted) {
                    const ts = task.completedAt ?? task.updatedAt ?? task.createdAt;
                    const dateStr = timestampToDateString(ts);
                    const existing = groups.find(g => g.dateStr === dateStr);
                    if (existing) {
                      existing.tasks.push(task);
                    } else {
                      groups.push({ dateStr, tasks: [task] });
                    }
                  }

                  return (
                    <div className="mt-3 flex flex-col gap-5 animate-in fade-in slide-in-from-top-1 duration-200">
                      {groups.map(({ dateStr, tasks: groupTasks }) => (
                        <div key={dateStr}>
                          <div className="flex items-center gap-2 mb-2 select-none">
                            <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                              {formatArchiveDayHeader(dateStr)}
                            </span>
                            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800/80" />
                          </div>

                          <div className="flex flex-col gap-0.5">
                            {groupTasks.map(task => {
                              const isConfirming = confirmingDeleteTaskId === task.id;

                              return (
                                <div
                                  key={task.id}
                                  className="group flex items-start justify-between py-2 px-1 rounded-lg text-zinc-400 dark:text-zinc-600 hover:bg-zinc-100/40 dark:hover:bg-zinc-900/20 transition-colors"
                                >
                                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={() => handleRestoreTask(task.id)}
                                      className="mt-0.5 shrink-0 w-4.5 h-4.5 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                                      title="Вернуть в активные"
                                    >
                                      <Check className="w-3 h-3 text-zinc-500 dark:text-zinc-400 stroke-[2.5]" />
                                    </button>

                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm line-through break-words text-zinc-400 dark:text-zinc-600">
                                        {task.text}
                                      </span>
                                      {task.dueDate && (
                                        <div className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-600 flex items-center gap-1 select-none">
                                          <Calendar className="w-3 h-3" />
                                          <span>{formatDateBadge(task.dueDate)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {isConfirming ? (
                                    <button
                                      type="button"
                                      data-delete-btn
                                      onClick={e => executeDeleteTask(task.id, e)}
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-200 dark:border-rose-900/80 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer shadow-2xs animate-in fade-in zoom-in-95 duration-150 select-none shrink-0 ml-2"
                                      title="Нажмите ещё раз для подтверждения удаления навсегда"
                                    >
                                      <Check className="w-3 h-3 stroke-[3]" />
                                      <span>Удалить?</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      data-delete-btn
                                      onClick={e => handleStartDeleteTask(task.id, e)}
                                      className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1 rounded transition-opacity cursor-pointer shrink-0 ml-2"
                                      title="Удалить навсегда"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </footer>
          )}
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <MobileBottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          activeTasksCount={activeTasks.length}
          activeNotesCount={activeNotes.length}
          syncConfig={syncConfig}
          syncStatus={syncStatus}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          onOpenSearch={() => setIsSearchModalOpen(true)}
        />
      </div>

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

      {/* Global Search Palette (Ctrl+K) */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        tasks={tasks}
        notes={notes}
        onSelectTab={setCurrentTab}
        onSelectTagFilter={setActiveTagFilter}
      />

      {/* Floating Undo Notification */}
      {undoItem && (
        <div className="fixed bottom-16 md:bottom-6 right-6 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium shadow-2xl border border-zinc-800 dark:border-zinc-200">
            <span className="text-zinc-300 dark:text-zinc-600">
              {undoItem.type === 'task' ? 'Задача удалена' : 'Заметка удалена'}
            </span>
            <button
              type="button"
              onClick={handleUndo}
              className="font-bold text-indigo-400 dark:text-indigo-600 hover:underline cursor-pointer flex items-center gap-1 transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Отменить</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 md:bottom-6 right-6 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
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
