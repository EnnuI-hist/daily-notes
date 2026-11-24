import React, { useState, useRef } from 'react';
import {
  Plus,
  Pin,
  Tag,
  X,
  Bookmark,
} from 'lucide-react';
import type { Note } from '../types';
import { NoteCard } from './NoteCard';
import { NoteEditModal } from './NoteEditModal';
import { extractTags } from '../utils/notes';

interface NotesViewProps {
  notes: Note[];
  onAddNote: (note: { title?: string; content: string; tags: string[]; pinned?: boolean }) => void;
  onUpdateNote: (note: { id: string; title?: string; content: string; tags: string[]; pinned: boolean }) => void;
  onDeleteNote: (id: string, e?: React.MouseEvent) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  confirmingDeleteId: string | null;
  onStartDelete: (id: string, e: React.MouseEvent) => void;
  activeTagFilter: string | null;
  onSelectTagFilter: (tag: string | null) => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
  confirmingDeleteId,
  onStartDelete,
  activeTagFilter,
  onSelectTagFilter,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPinned, setNewPinned] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  // Active notes (exclude deleted tombstones)
  const activeNotes = notes.filter(n => !n.deleted);

  // Collect all unique tags and counts across active notes
  const tagCounts = new Map<string, number>();
  for (const n of activeNotes) {
    for (const t of n.tags) {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    }
  }
  const allTags = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);

  // Filter notes by active tag if selected
  const filteredNotes = activeTagFilter
    ? activeNotes.filter(n => n.tags.includes(activeTagFilter.toLowerCase()))
    : activeNotes;

  // Separate pinned and regular notes
  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const otherNotes = filteredNotes.filter(n => !n.pinned);

  const handleCreateSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedContent = newContent.trim();
    if (!trimmedContent && !newTitle.trim()) return;

    const detectedTags = extractTags(`${newTitle} ${newContent}`);

    onAddNote({
      title: newTitle.trim() || undefined,
      content: trimmedContent,
      tags: detectedTags,
      pinned: newPinned,
    });

    setNewTitle('');
    setNewContent('');
    setNewPinned(false);
    setIsExpanded(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleCreateSubmit();
    } else if (e.key === 'Escape' && !newTitle && !newContent) {
      setIsExpanded(false);
    }
  };

  const previewTags = extractTags(`${newTitle} ${newContent}`);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Quick Add Card / Bar */}
      <div
        ref={containerRef}
        className={`w-full rounded-2xl border transition-all duration-200 ${
          isExpanded
            ? 'p-4 sm:p-5 bg-white dark:bg-[#121215] border-zinc-300 dark:border-zinc-700 shadow-md'
            : 'p-3 sm:p-3.5 bg-white dark:bg-[#121215] border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-2xs'
        }`}
      >
        {isExpanded ? (
          <form onSubmit={handleCreateSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Заголовок (необязательно)..."
              className="w-full bg-transparent border-0 text-base font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            />

            <textarea
              ref={contentInputRef}
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Заметка, мысль или ссылка https://... Поддерживает #теги и Markdown"
              rows={4}
              className="w-full bg-transparent border-0 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none resize-y min-h-[90px]"
              autoFocus
            />

            {/* Live detected tags pill preview */}
            {previewTags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-400">Теги:</span>
                {previewTags.map(t => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewPinned(prev => !prev)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    newPinned
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/80'
                      : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border-zinc-200 dark:border-zinc-700'
                  }`}
                  title="Закрепить наверху"
                >
                  <Pin className={`w-3 h-3 ${newPinned ? 'fill-amber-500' : ''}`} />
                  <span>{newPinned ? 'Закрепить' : 'Закрепить'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    setNewTitle('');
                    setNewContent('');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Отмена
                </button>

                <button
                  type="submit"
                  disabled={!newContent.trim() && !newTitle.trim()}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div
            onClick={() => setIsExpanded(true)}
            className="flex items-center justify-between gap-3 cursor-text text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300"
          >
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Plus className="w-4 h-4 text-zinc-400 shrink-0" />
              <span className="text-sm truncate select-none">
                Новая заметка, мысль или ссылка https://...
              </span>
            </div>

            <span className="hidden sm:inline-flex text-[11px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded select-none">
              #теги • Markdown
            </span>
          </div>
        )}
      </div>

      {/* Tags Filter Bar */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
          <button
            type="button"
            onClick={() => onSelectTagFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 cursor-pointer ${
              activeTagFilter === null
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs'
                : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            Все ({activeNotes.length})
          </button>

          {allTags.map(([tag, count]) => {
            const isActive = activeTagFilter === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectTagFilter(isActive ? null : tag)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500 shadow-2xs'
                    : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <span>#{tag}</span>
                <span className={`text-[10px] ${isActive ? 'text-indigo-200' : 'text-zinc-400'}`}>
                  {count}
                </span>
                {isActive && <X className="w-3 h-3 ml-0.5" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400">
            <Bookmark className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {activeTagFilter ? `Нет заметок с тегом #${activeTagFilter}` : 'Здесь пока пусто'}
            </h4>
            <p className="text-xs text-zinc-400 max-w-sm mt-1 leading-relaxed">
              {activeTagFilter
                ? 'Попробуйте выбрать другой тег или сбросить фильтр.'
                : 'Сохраняйте важные мысли, идеи, ссылки и статьи. Они хранятся вечно и не исчезают в архив.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Pinned section if both exist */}
          {pinnedNotes.length > 0 && otherNotes.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider select-none">
                <Pin className="w-3.5 h-3.5 fill-amber-500" />
                <span>Закреплённые ({pinnedNotes.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 items-start">
                {pinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isConfirmingDelete={confirmingDeleteId === note.id}
                    onStartDelete={onStartDelete}
                    onExecuteDelete={onDeleteNote}
                    onTogglePin={onTogglePin}
                    onEdit={setEditingNote}
                    onTagClick={tag => onSelectTagFilter(tag)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular notes (or all if only one section) */}
          {(pinnedNotes.length === 0 || otherNotes.length === 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 items-start">
              {filteredNotes.map(note => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isConfirmingDelete={confirmingDeleteId === note.id}
                  onStartDelete={onStartDelete}
                  onExecuteDelete={onDeleteNote}
                  onTogglePin={onTogglePin}
                  onEdit={setEditingNote}
                  onTagClick={tag => onSelectTagFilter(tag)}
                />
              ))}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider select-none">
                <span>Остальные заметки ({otherNotes.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 items-start">
                {otherNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    isConfirmingDelete={confirmingDeleteId === note.id}
                    onStartDelete={onStartDelete}
                    onExecuteDelete={onDeleteNote}
                    onTogglePin={onTogglePin}
                    onEdit={setEditingNote}
                    onTagClick={tag => onSelectTagFilter(tag)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Note Edit Modal */}
      <NoteEditModal
        note={editingNote}
        isOpen={Boolean(editingNote)}
        onClose={() => setEditingNote(null)}
        onSave={onUpdateNote}
      />
    </div>
  );
};
