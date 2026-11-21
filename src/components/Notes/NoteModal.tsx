import React, { useState, useEffect } from 'react';
import type { Note } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  X,
  Pin,
  Trash2,
  Eye,
  Edit3,
  Columns,
  Bold,
  Italic,
  Code,
  List,
  CheckSquare,
  Heading,
  Quote,
} from 'lucide-react';
import { MarkdownRenderer, extractTags } from '../../utils/markdown';

export const NoteModal: React.FC<{ note: Note; onClose: () => void }> = ({
  note,
  onClose,
}) => {
  const { addNote, updateNote, deleteNote, togglePinNote, setSelectedTag } = useApp();

  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [pinned, setPinned] = useState(note.pinned);
  const [currentNoteId, setCurrentNoteId] = useState<string>(note.id);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');

  // Sync state if a different note is selected
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setPinned(note.pinned);
    setCurrentNoteId(note.id);
  }, [note]);

  // Handle saving
  const handleSave = (newTitle = title, newContent = content, newPinned = pinned) => {
    if (!currentNoteId) {
      if (newTitle.trim() || newContent.trim()) {
        const created = addNote({
          title: newTitle.trim() || 'Новая заметка',
          content: newContent,
          pinned: newPinned,
        });
        setCurrentNoteId(created.id);
      }
    } else {
      updateNote(currentNoteId, {
        title: newTitle.trim() || 'Без названия',
        content: newContent,
        pinned: newPinned,
      });
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    handleSave(val, content, pinned);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    handleSave(title, val, pinned);
  };

  const handleTogglePin = () => {
    const nextPinned = !pinned;
    setPinned(nextPinned);
    if (currentNoteId) {
      togglePinNote(currentNoteId);
    } else {
      handleSave(title, content, nextPinned);
    }
  };

  const handleDelete = () => {
    if (currentNoteId) {
      deleteNote(currentNoteId);
    }
    onClose();
  };

  // Helper formatting shortcuts in textarea
  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = document.getElementById('note-content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    const replacement = `${prefix}${selected || 'текст'}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);

    setContent(newContent);
    handleSave(title, newContent, pinned);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 5));
    }, 10);
  };

  // Word count & stats
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const tags = extractTags(`${title} ${content}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-zinc-200/60 dark:bg-zinc-800 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                viewMode === 'edit'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Редактор</span>
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                viewMode === 'preview'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Превью</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Сплит</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleTogglePin}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                pinned
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title={pinned ? 'Открепить заметку' : 'Закрепить наверху'}
            >
              <Pin className={`w-4 h-4 ${pinned ? 'fill-current rotate-45' : ''}`} />
            </button>

            {currentNoteId && (
              <button
                onClick={handleDelete}
                className="p-2 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                title="Удалить заметку"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer ml-1"
              title="Закрыть (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Title Input */}
        <div className="px-6 pt-5 pb-2">
          <input
            type="text"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            placeholder="Заголовок заметки..."
            className="w-full text-xl sm:text-2xl font-bold bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 border-0 focus:outline-none"
          />
        </div>

        {/* Markdown Formatting Toolbar (visible in edit or split mode) */}
        {viewMode !== 'preview' && (
          <div className="flex items-center gap-1 px-6 py-1.5 border-b border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400 overflow-x-auto">
            <button
              onClick={() => insertFormatting('**', '**')}
              className="p-1.5 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
              title="Жирный (**текст**)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('*', '*')}
              className="p-1.5 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
              title="Курсив (*текст*)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('### ')}
              className="p-1.5 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
              title="Заголовок (### )"
            >
              <Heading className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('`', '`')}
              className="p-1.5 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
              title="Код (`код`)"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('- ')}
              className="p-1.5 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
              title="Список (- )"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('- [ ] ')}
              className="p-1.5 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
              title="Чекбокс (- [ ] )"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => insertFormatting('> ')}
              className="p-1.5 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer"
              title="Цитата (> )"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Edit Area */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className={`h-full overflow-y-auto p-6 ${viewMode === 'split' ? 'w-1/2 border-r border-zinc-200 dark:border-zinc-800' : 'w-full'}`}>
              <textarea
                id="note-content-editor"
                value={content}
                onChange={e => handleContentChange(e.target.value)}
                placeholder="Пишите ваши мысли, используя Markdown (заголовки, списки, ссылки, #теги)..."
                className="w-full h-full bg-transparent resize-none border-0 text-sm sm:text-base leading-relaxed text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none font-mono"
              />
            </div>
          )}

          {/* Preview Area */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={`h-full overflow-y-auto p-6 bg-zinc-50/30 dark:bg-zinc-950/20 ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
              {content.trim() ? (
                <MarkdownRenderer content={content} onTagClick={t => setSelectedTag(t)} />
              ) : (
                <div className="text-zinc-400 italic text-sm">Текст для предпросмотра отсутствует</div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer: Statistics & Detected Tags */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-xs text-zinc-400">
          <div className="flex items-center gap-3">
            <span>{wordCount} слов</span>
            <span>•</span>
            <span>{charCount} символов</span>
            {tags.length > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  {tags.map(tag => (
                    <span key={tag} className="font-mono text-indigo-600 dark:text-indigo-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
            >
              Готово
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
