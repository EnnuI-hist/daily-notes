import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { QuickCapture } from './components/QuickCapture';
import { TaskList } from './components/DailyPlanner/TaskList';
import { NoteList } from './components/Notes/NoteList';
import { NoteModal } from './components/Notes/NoteModal';
import { CommandPalette } from './components/CommandPalette';
import { BackupModal } from './components/Modals/BackupModal';
import { ShortcutsModal } from './components/Modals/ShortcutsModal';
import { Toast } from './components/Toast';
import { BottomNav } from './components/BottomNav';

const MainLayout: React.FC = () => {
  const { currentTab, activeNoteModal, setActiveNoteModal } = useApp();

  // Initialize keyboard shortcuts listeners
  useKeyboardShortcuts();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 select-none">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Header />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24 lg:pb-12 select-text">
          <div className="max-w-3xl mx-auto flex flex-col">
            {/* Quick Capture Bar - always accessible */}
            <QuickCapture />

            {/* View Switcher: Daily Planner / Tasks vs Notes */}
            {currentTab === 'notes' ? (
              <NoteList />
            ) : (
              <TaskList />
            )}
          </div>
        </main>
      </div>

      {/* Modals & Overlays */}
      {activeNoteModal && (
        <NoteModal
          note={activeNoteModal}
          onClose={() => setActiveNoteModal(null)}
        />
      )}

      <CommandPalette />
      <BackupModal />
      <ShortcutsModal />
      <Toast />
      <BottomNav />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
