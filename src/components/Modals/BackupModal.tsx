import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Download,
  Upload,
  FileJson,
  FileText,
  ShieldCheck,
  AlertCircle,
  Database,
} from 'lucide-react';
import {
  exportToJson,
  exportNotesToMarkdown,
  parseImportJsonFile,
} from '../../utils/exportImport';

export const BackupModal: React.FC = () => {
  const {
    backupModalOpen,
    setBackupModalOpen,
    tasks,
    notes,
    importData,
    showToast,
  } = useApp();

  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importing, setImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!backupModalOpen) return null;

  const handleJsonExport = () => {
    const filename = `mindflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    exportToJson({ tasks, notes }, filename);
    showToast('JSON бэкап сохранен на диск', 'success');
  };

  const handleMarkdownExport = () => {
    const filename = `mindflow-notes-${new Date().toISOString().slice(0, 10)}.md`;
    exportNotesToMarkdown(notes, filename);
    showToast('Заметки экспортированы в Markdown', 'success');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setImporting(true);

    try {
      const data = await parseImportJsonFile(file);
      if (data.tasks.length === 0 && data.notes.length === 0) {
        throw new Error('Файл не содержит задач или заметок');
      }

      importData(data.tasks, data.notes, importMode === 'replace');
      setBackupModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка при чтении файла бэкапа';
      setErrorMsg(message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      onClick={() => setBackupModalOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 flex flex-col gap-6 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Резервное копирование и экспорт
              </h2>
              <p className="text-xs text-zinc-400">
                Ваши данные хранятся локально в браузере (localStorage)
              </p>
            </div>
          </div>
          <button
            onClick={() => setBackupModalOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Summary */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Сохранено в памяти устройства:</span>
          </div>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {tasks.length} задач • {notes.length} заметок
          </span>
        </div>

        {/* Export Section */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Экспорт данных
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleJsonExport}
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer text-left group"
            >
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                  <span>Бэкап JSON</span>
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="text-[11px] text-zinc-400">Задачи, заметки, настройки</div>
              </div>
            </button>

            <button
              onClick={handleMarkdownExport}
              className="flex items-center gap-3 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer text-left group"
            >
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
                  <span>Заметки (.md)</span>
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="text-[11px] text-zinc-400">Единый файл с разметкой</div>
              </div>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="flex flex-col gap-2.5">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Импорт из бэкапа
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span>Режим импорта:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
                className="text-indigo-600"
              />
              <span>Объединить</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
                className="text-rose-600"
              />
              <span className="text-rose-600 dark:text-rose-400 font-medium">Заменить всё</span>
            </label>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            <span>{importing ? 'Загрузка данных...' : 'Выбрать файл mindflow-backup.json'}</span>
          </button>

          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={() => setBackupModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
