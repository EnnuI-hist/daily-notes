import React from 'react';
import {
  CheckSquare,
  Bookmark,
  Search,
  Cloud,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { TabType, SyncStatus, SyncConfig } from '../types';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeTasksCount: number;
  activeNotesCount: number;
  syncConfig: SyncConfig | null;
  syncStatus: SyncStatus;
  onOpenSyncModal: () => void;
  onOpenSearch: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeTasksCount,
  activeNotesCount,
  syncConfig,
  syncStatus,
  onOpenSyncModal,
  onOpenSearch,
}) => {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

  return (
    <aside className="hidden md:flex flex-col justify-between w-60 lg:w-64 h-screen sticky top-0 px-4 py-6 border-r border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#0c0c0e]/50 backdrop-blur-md select-none shrink-0">
      <div className="flex flex-col gap-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 px-3 py-1">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-sm tracking-tight shadow-2xs">
            M
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              MindFlow
            </span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium tracking-wide">
              Второй мозг
            </span>
          </div>
        </div>

        {/* Quick Search Shortcut Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
            <span>Поиск...</span>
          </div>
          <kbd className="flex items-center gap-0.5 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </button>

        {/* Navigation Sections */}
        <nav className="flex flex-col gap-1">
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Разделы
          </div>

          {/* Tasks Tab */}
          <button
            type="button"
            onClick={() => onSelectTab('tasks')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              currentTab === 'tasks'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckSquare className="w-4 h-4" />
              <span>Задачи</span>
            </div>
            {activeTasksCount > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  currentTab === 'tasks'
                    ? 'bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800'
                    : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {activeTasksCount}
              </span>
            )}
          </button>

          {/* Notes Tab */}
          <button
            type="button"
            onClick={() => onSelectTab('notes')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              currentTab === 'notes'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bookmark className="w-4 h-4" />
              <span>Заметки</span>
            </div>
            {activeNotesCount > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  currentTab === 'notes'
                    ? 'bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800'
                    : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {activeNotesCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Footer: Cloud Sync Status Card */}
      <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
        <button
          type="button"
          onClick={onOpenSyncModal}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-xs cursor-pointer shadow-2xs group text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
              {syncStatus === 'syncing' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
              ) : syncStatus === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                {syncConfig ? 'Синхронизация' : 'Подключить Gist'}
              </span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                {syncStatus === 'syncing'
                  ? 'Сохранение...'
                  : syncStatus === 'error'
                  ? 'Ошибка синхронизации'
                  : syncConfig
                  ? 'ПК ↔ Телефон'
                  : 'Нажмите для настройки'}
              </span>
            </div>
          </div>

          {syncConfig && syncStatus === 'synced' && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-1.5" />
          )}
        </button>
      </div>
    </aside>
  );
};
