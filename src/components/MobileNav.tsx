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

interface MobileNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  activeTasksCount: number;
  activeNotesCount: number;
  syncConfig: SyncConfig | null;
  syncStatus: SyncStatus;
  onOpenSyncModal: () => void;
  onOpenSearch: () => void;
}

export const MobileHeader: React.FC<MobileNavProps> = ({
  syncConfig,
  syncStatus,
  onOpenSyncModal,
  onOpenSearch,
}) => {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-[#0c0c0e]/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 sticky top-0 z-30 select-none">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center font-bold text-xs">
          M
        </div>
        <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
          MindFlow
        </span>
      </div>

      <div className="flex items-center gap-1">
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          title="Поиск (Ctrl+K)"
          aria-label="Поиск"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Mobile Sync Indicator */}
        <button
          type="button"
          onClick={onOpenSyncModal}
          className="relative p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          title="Синхронизация"
          aria-label="Синхронизация"
        >
          {syncStatus === 'syncing' ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
          ) : syncStatus === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          ) : (
            <Cloud className="w-4 h-4" />
          )}

          {syncConfig && syncStatus === 'synced' && (
            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>
    </header>
  );
};

export const MobileBottomNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  activeTasksCount,
  activeNotesCount,
  onOpenSearch,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#0c0c0e]/90 backdrop-blur-lg border-t border-zinc-200/80 dark:border-zinc-800/80 px-6 py-2 pb-safe select-none">
      <div className="flex items-center justify-around max-w-sm mx-auto">
        {/* Tasks Tab */}
        <button
          type="button"
          onClick={() => onSelectTab('tasks')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer relative ${
            currentTab === 'tasks'
              ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <div className="relative">
            <CheckSquare className="w-5 h-5 stroke-[2]" />
            {activeTasksCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {activeTasksCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">Задачи</span>
        </button>

        {/* Notes Tab */}
        <button
          type="button"
          onClick={() => onSelectTab('notes')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer relative ${
            currentTab === 'notes'
              ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
          }`}
        >
          <div className="relative">
            <Bookmark className="w-5 h-5 stroke-[2]" />
            {activeNotesCount > 0 && (
              <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {activeNotesCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">Заметки</span>
        </button>

        {/* Search Action */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
        >
          <Search className="w-5 h-5 stroke-[2]" />
          <span className="text-[11px]">Поиск</span>
        </button>
      </div>
    </nav>
  );
};
