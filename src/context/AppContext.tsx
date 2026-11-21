import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Task, Note, ViewTab, ThemeMode, Priority } from '../types';
import { INITIAL_TASKS, INITIAL_NOTES } from '../utils/initialData';
import { getTodayDateString, getTomorrowDateString } from '../utils/dateUtils';
import { extractTags } from '../utils/markdown';

interface ToastState {
  id: number;
  message: string;
  type?: 'info' | 'success' | 'warning';
}

interface AppContextType {
  tasks: Task[];
  notes: Note[];
  currentTab: ViewTab;
  selectedTag: string | null;
  theme: ThemeMode;
  isDark: boolean;
  sidebarOpen: boolean;
  searchModalOpen: boolean;
  activeNoteModal: Note | null;
  isCreatingNote: boolean;
  backupModalOpen: boolean;
  shortcutsModalOpen: boolean;
  toast: ToastState | null;
  allTags: { tag: string; count: number }[];

  // Actions
  addTask: (title: string, options?: { dueDate?: string; priority?: Priority; tags?: string[] }) => Task;
  toggleTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  rolloverUnfinishedTasksToTomorrow: () => number;
  addNote: (noteData?: { title?: string; content?: string; pinned?: boolean; tags?: string[] }) => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  setTheme: (theme: ThemeMode) => void;
  setCurrentTab: (tab: ViewTab) => void;
  setSelectedTag: (tag: string | null) => void;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSearchModalOpen: (open: boolean) => void;
  setActiveNoteModal: (note: Note | null) => void;
  setIsCreatingNote: (val: boolean) => void;
  setBackupModalOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  showToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
  importData: (newTasks: Task[], newNotes: Note[], replace?: boolean) => void;
  clearCompletedTasks: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const TASKS_STORAGE_KEY = 'mindflow_tasks_v1';
const NOTES_STORAGE_KEY = 'mindflow_notes_v1';
const THEME_STORAGE_KEY = 'mindflow_theme_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load tasks
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem(TASKS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load tasks from localStorage', e);
    }
    return INITIAL_TASKS;
  });

  // Load notes
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const stored = localStorage.getItem(NOTES_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load notes from localStorage', e);
    }
    return INITIAL_NOTES;
  });

  // Theme
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch {
      // ignore
    }
    return 'system';
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Navigation & Modals
  const [currentTab, setCurrentTab] = useState<ViewTab>('today');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') return window.innerWidth >= 1024;
    return true;
  });
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeNoteModal, setActiveNoteModal] = useState<Note | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Watch system theme change
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemDark);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save notes', e);
    }
  }, [notes]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  };

  const showToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 3000);
  };

  // Compute all unique tags across notes and tasks
  const allTags = React.useMemo(() => {
    const map = new Map<string, number>();

    tasks.forEach(t => {
      t.tags?.forEach(tag => {
        const clean = tag.toLowerCase().trim();
        if (clean) map.set(clean, (map.get(clean) || 0) + 1);
      });
    });

    notes.forEach(n => {
      n.tags?.forEach(tag => {
        const clean = tag.toLowerCase().trim();
        if (clean) map.set(clean, (map.get(clean) || 0) + 1);
      });
    });

    return Array.from(map.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [tasks, notes]);

  // Task Actions
  const addTask = (title: string, options?: { dueDate?: string; priority?: Priority; tags?: string[] }) => {
    const autoTags = extractTags(title);
    const combinedTags = Array.from(new Set([...(options?.tags || []), ...autoTags]));

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      completed: false,
      dueDate: options?.dueDate || getTodayDateString(),
      priority: options?.priority || 'medium',
      tags: combinedTags,
      createdAt: Date.now(),
    };

    setTasks(prev => [newTask, ...prev]);
    showToast('Задача добавлена в список', 'success');
    return newTask;
  };

  const toggleTask = (id: string) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === id) {
          const newCompleted = !t.completed;
          return {
            ...t,
            completed: newCompleted,
            completedAt: newCompleted ? Date.now() : undefined,
          };
        }
        return t;
      });

      // Check if all today's tasks are completed
      const today = getTodayDateString();
      const todayTasks = updated.filter(t => t.dueDate === today);
      const isTargetTask = prev.find(t => t.id === id);

      if (isTargetTask && !isTargetTask.completed && todayTasks.length > 0 && todayTasks.every(t => t.completed)) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#6366f1', '#f59e0b'],
        });
        showToast('Все дела на сегодня выполнены! Прекрасная работа 🚀', 'success');
      }

      return updated;
    });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const merged = { ...t, ...updates };
          if (updates.title) {
            const detectedTags = extractTags(updates.title);
            merged.tags = Array.from(new Set([...merged.tags, ...detectedTags]));
          }
          return merged;
        }
        return t;
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast('Задача удалена');
  };

  const clearCompletedTasks = () => {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      showToast('Нет выполненных задач для очистки', 'info');
      return;
    }
    setTasks(prev => prev.filter(t => !t.completed));
    showToast(`Очищено ${completedCount} завершенных задач`, 'success');
  };

  const rolloverUnfinishedTasksToTomorrow = (): number => {
    const today = getTodayDateString();
    const tomorrow = getTomorrowDateString();

    let count = 0;
    setTasks(prev =>
      prev.map(t => {
        if (!t.completed && t.dueDate <= today) {
          count++;
          return { ...t, dueDate: tomorrow };
        }
        return t;
      })
    );

    if (count > 0) {
      showToast(
        count === 1
          ? '1 задача перенесена на завтра'
          : `${count} задач(и) перенесены на завтра 📅`,
        'success'
      );
    } else {
      showToast('Нет невыполненных задач на сегодня', 'info');
    }
    return count;
  };

  // Note Actions
  const addNote = (noteData?: { title?: string; content?: string; pinned?: boolean; tags?: string[] }): Note => {
    const rawContent = noteData?.content || '';
    const rawTitle = noteData?.title || '';
    const autoTags = extractTags(`${rawTitle} ${rawContent}`);
    const combinedTags = Array.from(new Set([...(noteData?.tags || []), ...autoTags]));

    const newNote: Note = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: rawTitle || 'Новая заметка',
      content: rawContent,
      pinned: noteData?.pinned || false,
      tags: combinedTags,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setNotes(prev => [newNote, ...prev]);
    showToast('Заметка создана', 'success');
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev =>
      prev.map(n => {
        if (n.id === id) {
          const merged = { ...n, ...updates, updatedAt: Date.now() };
          const autoTags = extractTags(`${merged.title} ${merged.content}`);
          merged.tags = Array.from(new Set([...(updates.tags || merged.tags), ...autoTags]));
          return merged;
        }
        return n;
      })
    );
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteModal?.id === id) {
      setActiveNoteModal(null);
    }
    showToast('Заметка удалена');
  };

  const togglePinNote = (id: string) => {
    setNotes(prev =>
      prev.map(n => {
        if (n.id === id) {
          const nextPinned = !n.pinned;
          showToast(nextPinned ? 'Заметка закреплена наверху 📌' : 'Заметка откреплена');
          return { ...n, pinned: nextPinned };
        }
        return n;
      })
    );
  };

  const importData = (newTasks: Task[], newNotes: Note[], replace = false) => {
    if (replace) {
      setTasks(newTasks);
      setNotes(newNotes);
      showToast(`Импортировано: ${newTasks.length} задач, ${newNotes.length} заметок (замена)`, 'success');
    } else {
      // Merge by ID avoiding duplicates
      setTasks(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const toAdd = newTasks.filter(t => !existingIds.has(t.id));
        return [...toAdd, ...prev];
      });
      setNotes(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const toAdd = newNotes.filter(n => !existingIds.has(n.id));
        return [...toAdd, ...prev];
      });
      showToast(`Успешно объединено: ${newTasks.length} задач, ${newNotes.length} заметок`, 'success');
    }
  };

  return (
    <AppContext.Provider
      value={{
        tasks,
        notes,
        currentTab,
        selectedTag,
        theme,
        isDark,
        sidebarOpen,
        searchModalOpen,
        activeNoteModal,
        isCreatingNote,
        backupModalOpen,
        shortcutsModalOpen,
        toast,
        allTags,
        addTask,
        toggleTask,
        updateTask,
        deleteTask,
        rolloverUnfinishedTasksToTomorrow,
        addNote,
        updateNote,
        deleteNote,
        togglePinNote,
        setTheme,
        setCurrentTab,
        setSelectedTag,
        setSidebarOpen,
        setSearchModalOpen,
        setActiveNoteModal,
        setIsCreatingNote,
        setBackupModalOpen,
        setShortcutsModalOpen,
        showToast,
        importData,
        clearCompletedTasks,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
