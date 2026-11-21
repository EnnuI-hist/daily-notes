import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  CheckSquare,
  FileText,
  Archive,
  Hash,
  Database,
  Sparkles,
  X,
  Keyboard,
  ShieldCheck,
} from 'lucide-react';
import { getTodayDateString } from '../utils/dateUtils';
import type { ViewTab } from '../types';

export const Sidebar: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    selectedTag,
    setSelectedTag,
    sidebarOpen,
    setSidebarOpen,
    tasks,
    notes,
    allTags,
    setBackupModalOpen,
    setShortcutsModalOpen,
  } = useApp();

  const today = getTodayDateString();
  const todayUncompletedCount = tasks.filter(t => !t.completed && t.dueDate === today).length;
  const allUncompletedTasksCount = tasks.filter(t => !t.completed).length;
  const completedTasksCount = tasks.filter(t => t.completed).length;

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'today',
      label: 'Сегодня',
      icon: <Calendar className="w-4 h-4" />,
      count: todayUncompletedCount,
    },
    {
      id: 'all-tasks',
      label: 'Все задачи',
      icon: <CheckSquare className="w-4 h-4" />,
      count: allUncompletedTasksCount,
    },
    {
      id: 'notes',
      label: 'Заметки',
      icon: <FileText className="w-4 h-4" />,
      count: notes.length,
    },
    {
      id: 'archive',
      label: 'Архив',
      icon: <Archive className="w-4 h-4" />,
      count: completedTasksCount,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 shrink-0 bg-zinc-50/90 dark:bg-zinc-950/90 backdrop-blur-md border-r border-zinc-200/80 dark:border-zinc-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-base tracking-tight">
                  MindFlow
                </span>
                <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 font-semibold">
                  v1.0
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            <div className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2.5 mb-1">
              Разделы
            </div>
            {navItems.map(item => {
              const isActive = currentTab === item.id && !selectedTag;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setSelectedTag(null);
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                        isActive
                          ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 font-bold'
                          : 'bg-zinc-200/60 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Tags Section */}
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center justify-between px-2.5 mb-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                <Hash className="w-3 h-3" />
                <span>Теги</span>
              </div>
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="text-[11px] text-indigo-500 hover:underline cursor-pointer"
                >
                  Все
                </button>
              )}
            </div>

            {allTags.length === 0 ? (
              <div className="text-xs text-zinc-400 dark:text-zinc-600 px-3 py-2 italic">
                Добавляйте #теги в текст задач и заметок
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 max-h-52 overflow-y-auto pr-1">
                {allTags.map(({ tag, count }) => {
                  const isTagActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(isTagActive ? null : tag);
                        if (window.innerWidth < 1024) setSidebarOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isTagActive
                          ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <span className="truncate">#{tag}</span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Panel */}
        <div className="p-4 border-t border-zinc-200/80 dark:border-zinc-800/80 flex flex-col gap-2">
          {/* Local Storage Indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 text-xs text-zinc-400 dark:text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">Локально & Приватно</span>
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => setBackupModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Бэкап и экспорт данных"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Бэкап</span>
            </button>

            <button
              onClick={() => setShortcutsModalOpen(true)}
              className="flex items-center justify-center p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Горячие клавиши (Cmd+/)"
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
