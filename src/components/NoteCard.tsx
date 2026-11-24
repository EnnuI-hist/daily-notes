import React from 'react';
import { Pin, X, Check, Pencil } from 'lucide-react';
import type { Note } from '../types';
import { MarkdownView } from './MarkdownView';
import { LinkCard } from './LinkCard';
import { extractUrls, formatNoteDate } from '../utils/notes';

interface NoteCardProps {
  note: Note;
  isConfirmingDelete: boolean;
  onStartDelete: (id: string, e: React.MouseEvent) => void;
  onExecuteDelete: (id: string, e?: React.MouseEvent) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onEdit: (note: Note) => void;
  onTagClick: (tag: string) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isConfirmingDelete,
  onStartDelete,
  onExecuteDelete,
  onTogglePin,
  onEdit,
  onTagClick,
}) => {
  const urls = extractUrls(note.content);

  return (
    <div
      onClick={() => onEdit(note)}
      className={`group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left select-none ${
        note.pinned
          ? 'bg-white dark:bg-[#131317] border-amber-300/80 dark:border-amber-500/30 shadow-xs hover:border-amber-400 dark:hover:border-amber-500/50'
          : 'bg-white dark:bg-[#121215] border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs hover:shadow-xs'
      }`}
    >
      <div>
        {/* Card Header: Optional Title + Top Actions (Pin, Edit, Delete) */}
        <div className="flex items-start justify-between gap-2 mb-2">
          {note.title ? (
            <h3 className="text-sm sm:text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 break-words line-clamp-2">
              {note.title}
            </h3>
          ) : (
            <div className="flex-1" />
          )}

          <div
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 shrink-0 ml-auto"
          >
            {/* Pin Button */}
            <button
              type="button"
              onClick={e => onTogglePin(note.id, e)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                note.pinned
                  ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100'
              }`}
              title={note.pinned ? 'Открепить' : 'Закрепить'}
            >
              <Pin
                className={`w-3.5 h-3.5 ${
                  note.pinned ? 'fill-amber-500 rotate-45' : ''
                }`}
              />
            </button>

            {/* Quick Edit Icon */}
            <button
              type="button"
              onClick={() => onEdit(note)}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity cursor-pointer"
              title="Редактировать"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>

            {/* Delete Confirmation Button */}
            {isConfirmingDelete ? (
              <button
                type="button"
                data-delete-btn
                onClick={e => onExecuteDelete(note.id, e)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-200 dark:border-rose-900/80 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer shadow-2xs animate-in fade-in zoom-in-95 duration-150 select-none"
                title="Нажмите ещё раз для подтверждения"
              >
                <Check className="w-3 h-3 stroke-[3]" />
                <span>Удалить?</span>
              </button>
            ) : (
              <button
                type="button"
                data-delete-btn
                onClick={e => onStartDelete(note.id, e)}
                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 rounded-lg transition-all cursor-pointer"
                title="Удалить заметку"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Note Body (Markdown Content) */}
        <div className="select-text">
          <MarkdownView
            content={note.content}
            onTagClick={onTagClick}
            className="text-zinc-700 dark:text-zinc-300"
          />
        </div>

        {/* Extracted Link Previews / Bookmarks */}
        {urls.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {urls.slice(0, 3).map(url => (
              <LinkCard key={url} url={url} />
            ))}
          </div>
        )}
      </div>

      {/* Card Footer: Tags & Date */}
      <div className="mt-4 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {note.tags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={e => {
                e.stopPropagation();
                onTagClick(tag);
              }}
              className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-[11px] font-medium transition-colors cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 font-normal">
          {formatNoteDate(note.createdAt)}
        </span>
      </div>
    </div>
  );
};
