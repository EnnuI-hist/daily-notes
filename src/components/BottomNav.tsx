import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  CheckSquare,
  FileText,
  Search,
  Plus,
} from 'lucide-react';
import type { ViewTab } from '../types';

export const BottomNav: React.FC = () => {
  const {
    currentTab,
    setCurrentTab,
    setSelectedTag,
    setSearchModalOpen,
    setActiveNoteModal,
  } = useApp();

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Сегодня', icon: <Calendar className="w-5 h-5" /> },
    { id: 'all-tasks', label: 'Задачи', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'notes', label: 'Заметки', icon: <FileText className="w-5 h-5" /> },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-t border-zinc-200/80 dark:border-zinc-800/80 px-4 py-2 flex items-center justify-around">
      {navItems.slice(0, 2).map(item => {
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setCurrentTab(item.id);
              setSelectedTag(null);
            }}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}

      {/* Center + Action */}
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
        className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md active:scale-95 transition-transform -mt-3 cursor-pointer"
        title="Быстрая заметка"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* Notes tab */}
      {navItems.slice(2).map(item => {
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setCurrentTab(item.id);
              setSelectedTag(null);
            }}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
              isActive
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}

      {/* Search Trigger */}
      <button
        onClick={() => setSearchModalOpen(true)}
        className="flex flex-col items-center gap-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 cursor-pointer"
      >
        <Search className="w-5 h-5" />
        <span>Поиск</span>
      </button>
    </div>
  );
};
