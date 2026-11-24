import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Pin, Tag } from 'lucide-react';
import type { Note } from '../types';
import { extractTags } from '../utils/notes';

interface NoteEditModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: { id: string; title?: string; content: string; tags: string[]; pinned: boolean }) => void;
}

const NoteEditDialog: React.FC<{
  note: Note;
  onClose: () => void;
  onSave: NoteEditModalProps['onSave'];
}> = ({ note, onClose, onSave }) => {
  const [title, setTitle] = useState(note.title || '');
  const [content, setContent] = useState(note.content || '');
  const [pinned, setPinned] = useState(Boolean(note.pinned));
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSave = () => {
    const trimmedContent = content.trim();
    if (!trimmedContent && !title.trim()) {
      onClose();
      return;
    }

    const detectedTags = extractTags(`${title} ${content}`);

    onSave({
      id: note.id,
      title: title.trim() || undefined,
      content: trimmedContent,
      tags: detectedTags,
      pinned,
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const tags = extractTags(`${title} ${content}`);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="w-full max-w-lg bg-white dark:bg-[#121215] text-zinc-900 dark:text-zinc-100 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPinned(prev => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                pinned
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/80'
                  : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border-zinc-200 dark:border-zinc-700'
              }`}
              title="Закрепить наверху"
            >
              <Pin className={`w-3.5 h-3.5 ${pinned ? 'fill-amber-500' : ''}`} />
              <span>{pinned ? 'Закреплено' : 'Закрепить'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title Input */}
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Заголовок (необязательно)..."
          className="w-full bg-transparent border-0 text-base font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
        />

        {/* Content Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Текст заметки, мысль или ссылка https://... Поддерживает #теги и Markdown"
          rows={7}
          className="w-full bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-300 resize-y transition-colors font-sans"
        />

        {/* Tags preview */}
        {tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <Tag className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="text-zinc-400">Обнаруженные теги:</span>
            {tags.map(t => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-medium"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] text-zinc-400">
            <kbd className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">Ctrl+Enter</kbd> сохранить
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Сохранить</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NoteEditModal: React.FC<NoteEditModalProps> = ({
  note,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !note) return null;

  return <NoteEditDialog key={note.id} note={note} onClose={onClose} onSave={onSave} />;
};
