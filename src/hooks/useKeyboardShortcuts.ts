import { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export function useKeyboardShortcuts() {
  const {
    setSearchModalOpen,
    searchModalOpen,
    setSidebarOpen,
    setActiveNoteModal,
    activeNoteModal,
    backupModalOpen,
    setBackupModalOpen,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    setCurrentTab,
  } = useApp();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K: Command palette / Search
      if (isMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(!searchModalOpen);
        return;
      }

      // Cmd/Ctrl + N: New Note
      if (isMeta && e.key.toLowerCase() === 'n') {
        e.preventDefault();
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
        return;
      }

      // Cmd/Ctrl + B: Toggle Sidebar
      if (isMeta && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
        return;
      }

      // Cmd/Ctrl + / or ? : Shortcuts cheat sheet
      if (isMeta && (e.key === '/' || e.key === '?')) {
        e.preventDefault();
        setShortcutsModalOpen(!shortcutsModalOpen);
        return;
      }

      // Esc: Close any open modal
      if (e.key === 'Escape') {
        if (searchModalOpen) setSearchModalOpen(false);
        if (activeNoteModal) setActiveNoteModal(null);
        if (backupModalOpen) setBackupModalOpen(false);
        if (shortcutsModalOpen) setShortcutsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    searchModalOpen,
    setSearchModalOpen,
    setSidebarOpen,
    setActiveNoteModal,
    activeNoteModal,
    backupModalOpen,
    setBackupModalOpen,
    shortcutsModalOpen,
    setShortcutsModalOpen,
    setCurrentTab,
  ]);
}
