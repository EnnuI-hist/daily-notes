import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Keyboard } from 'lucide-react';

export const ShortcutsModal: React.FC = () => {
  const { shortcutsModalOpen, setShortcutsModalOpen } = useApp();

  if (!shortcutsModalOpen) return null;

  const shortcuts = [
    { key: '⌘ / Ctrl + K', desc: 'Глобальный поиск и командная строка' },
    { key: '⌘ / Ctrl + N', desc: 'Создать новую заметку' },
    { key: '⌘ / Ctrl + B', desc: 'Свернуть или развернуть боковое меню' },
    { key: '/', desc: 'Фокус на верхней строке инбокса' },
    { key: 'Enter', desc: 'Мгновенно сохранить задачу или мысль в инбоксе' },
    { key: 'Esc', desc: 'Закрыть текущее окно или модалку' },
    { key: '⌘ / Ctrl + /', desc: 'Открыть список горячих клавиш' },
  ];

  const markdownTips = [
    { key: '[] текст', desc: 'Автоматически превращает ввод в задачу' },
    { key: '#тег', desc: 'Создает кликабельный тег для фильтрации' },
    { key: '#, ##, ###', desc: 'Заголовки разных уровней' },
    { key: '**текст**', desc: 'Полужирное начертание' },
    { key: '*текст*', desc: 'Курсивное начертание' },
    { key: '`код`', desc: 'Моноширинный инлайн-код' },
    { key: 'https://...', desc: 'Автоматическая кликабельная ссылка' },
  ];

  return (
    <div
      onClick={() => setShortcutsModalOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 flex flex-col gap-6 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Горячие клавиши
              </h2>
              <p className="text-xs text-zinc-400">
                Управляйте своими мыслями без мышки
              </p>
            </div>
          </div>
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Навигация и управление
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {shortcuts.map(s => (
              <div
                key={s.key}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/60 text-xs"
              >
                <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                  {s.desc}
                </span>
                <kbd className="px-2 py-0.5 font-mono text-[11px] font-semibold bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-2xs">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Markdown tricks */}
        <div className="flex flex-col gap-2">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Синтаксис и умный ввод
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {markdownTips.map(m => (
              <div
                key={m.key}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-800/40 text-[11px]"
              >
                <kbd className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                  {m.key}
                </kbd>
                <span className="text-zinc-400 truncate ml-2">{m.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => setShortcutsModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};
