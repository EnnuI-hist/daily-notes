import React from 'react';
import type { Note } from '../../types';
import { useApp } from '../../context/AppContext';
import { Pin, Trash2, Calendar } from 'lucide-react';
import { formatTimestamp } from '../../utils/dateUtils';
import { renderInlineMarkdown } from '../../utils/markdown';

export const NoteCard: React.FC<{ note: Note }> = ({ note }) => {
  const { togglePinNote, deleteNote, setActiveNoteModal, setSelectedTag } = useApp();

  // Extract first 3 lines of preview text without markdown hash headers for snippet
  const previewLines = note.content
    .split('\n')
    .filter(line => line.trim().length > 0)
    .slice(0, 3)
    .join(' ');

  return (
    <div
      onClick={() => setActiveNoteModal(note)}
      className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all duration-200 cursor-pointer text-left"
    >
      <div>
        {/* Top Header: Title & Pin Action */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {note.title || 'Без названия'}
          </h3>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                togglePinNote(note.id);
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                note.pinned
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100'
              }`}
              title={note.pinned ? 'Открепить заметку' : 'Закрепить наверху'}
            >
              <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-current rotate-45' : ''}`} />
            </button>

            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                deleteNote(note.id);
              }}
              className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 rounded-lg transition-colors cursor-pointer"
              title="Удалить заметку"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Snippet */}
        <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed mb-4">
          {previewLines ? (
            renderInlineMarkdown(previewLines, tag => setSelectedTag(tag))
          ) : (
            <span className="italic text-zinc-400">Пустая заметка</span>
          )}
        </div>
      </div>

      {/* Footer: Date and Tags */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 text-xs text-zinc-400">
        <div className="flex items-center gap-1 text-[11px]">
          <Calendar className="w-3 h-3" />
          <span>{formatTimestamp(note.updatedAt || note.createdAt)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {note.tags?.slice(0, 3).map(tag => (
            <button
              key={tag}
              type="button"
              onClick={e => {
                e.stopPropagation();
                setSelectedTag(tag);
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
            >
              #{tag}
            </button>
          ))}
          {note.tags && note.tags.length > 3 && (
            <span className="text-[10px] font-mono text-zinc-400">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
