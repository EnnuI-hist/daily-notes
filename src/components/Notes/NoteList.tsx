import React from 'react';
import { useApp } from '../../context/AppContext';
import { NoteCard } from './NoteCard';
import { Pin, FileText, Plus } from 'lucide-react';

export const NoteList: React.FC = () => {
  const { notes, selectedTag, setActiveNoteModal } = useApp();

  // Filter notes by tag if selected
  const filteredNotes = notes.filter(note => {
    if (selectedTag && !note.tags?.includes(selectedTag)) {
      return false;
    }
    return true;
  });

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const otherNotes = filteredNotes.filter(n => !n.pinned);

  const handleCreateNew = () => {
    setActiveNoteModal({
      id: '',
      title: '',
      content: '',
      pinned: false,
      tags: selectedTag ? [selectedTag] : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {filteredNotes.length}{' '}
          {filteredNotes.length === 1
            ? 'заметка'
            : filteredNotes.length >= 2 && filteredNotes.length <= 4
            ? 'заметки'
            : 'заметок'}
        </div>

        <button
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl transition-all cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Новая заметка</span>
        </button>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {selectedTag ? `Нет заметок с тегом #${selectedTag}` : 'Нет заметок'}
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-xs mt-1 mb-4">
            Нажмите кнопку ниже или используйте горячие клавиши Cmd+N для создания первой заметки.
          </p>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Создать заметку</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Pinned Notes Section */}
          {pinnedNotes.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <Pin className="w-3.5 h-3.5 rotate-45 fill-current text-indigo-500" />
                <span>Закрепленные</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinnedNotes.map(note => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </div>
          )}

          {/* Other Notes Section */}
          {otherNotes.length > 0 && (
            <div className="flex flex-col gap-3">
              {pinnedNotes.length > 0 && (
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Все заметки
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherNotes.map(note => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
