import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Laptop,
  Download,
  HelpCircle,
  Plus,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentTab,
    selectedTag,
    setSelectedTag,
    setSidebarOpen,
    setSearchModalOpen,
    theme,
    setTheme,
    setBackupModalOpen,
    setShortcutsModalOpen,
    setActiveNoteModal,
    setCurrentTab,
  } = useApp();

  const getTitle = () => {
    if (selectedTag) {
      return (
        <div className="flex items-center gap-2">
          <span>Тег:</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">#{selectedTag}</span>
          <button
            onClick={() => setSelectedTag(null)}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline ml-1 cursor-pointer"
          >
            сбросить
          </button>
        </div>
      );
    }
    switch (currentTab) {
      case 'today':
        return 'Сегодня';
      case 'all-tasks':
        return 'Все задачи';
      case 'notes':
        return 'Заметки';
      case 'archive':
        return 'Архив выполненного';
      default:
        return 'MindFlow';
    }
  };

  const todayFormatted = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun className="w-4 h-4 text-amber-500" />;
    if (theme === 'dark') return <Moon className="w-4 h-4 text-indigo-400" />;
    return <Laptop className="w-4 h-4 text-zinc-500" />;
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          className="p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          title="Свернуть/развернуть меню (Cmd+B)"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 text-lg flex items-center gap-2 tracking-tight">
            {getTitle()}
          </div>
          {currentTab === 'today' && !selectedTag && (
            <div className="text-xs text-zinc-400 dark:text-zinc-500 capitalize">
              {todayFormatted}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Search Button */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800/80 transition-all cursor-pointer shadow-xs"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Поиск...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded">
            ⌘K
          </kbd>
        </button>

        {/* New Note Button */}
        <button
          onClick={() => {
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
          }}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-lg transition-all cursor-pointer shadow-xs"
          title="Создать заметку (Cmd+N)"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Заметка</span>
        </button>

        {/* Backup / Export */}
        <button
          onClick={() => setBackupModalOpen(true)}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          title="Резервное копирование и экспорт"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Shortcuts */}
        <button
          onClick={() => setShortcutsModalOpen(true)}
          className="hidden sm:block p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          title="Горячие клавиши (Cmd+/)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Theme Switcher */}
        <button
          onClick={cycleTheme}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          title={`Тема: ${theme === 'system' ? 'Системная' : theme === 'light' ? 'Светлая' : 'Темная'} (клик для смены)`}
        >
          {getThemeIcon()}
        </button>
      </div>
    </header>
  );
};
