import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Cloud, ExternalLink, Copy, Check, RefreshCw, Unlink, AlertCircle } from 'lucide-react';
import type { SyncConfig } from '../types';
import { encodeSyncPairing } from '../services/gistSync';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SyncConfig | null;
  onConnect: (token: string, gistId?: string) => Promise<void>;
  onDisconnect: () => void;
  onForceSync: () => Promise<void>;
  isSyncing: boolean;
  lastSyncedAt?: number;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  config,
  onConnect,
  onDisconnect,
  onForceSync,
  isSyncing,
  lastSyncedAt,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [gistIdInput, setGistIdInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isConnected = !!(config && config.token && config.gistId);

  // Compute pairing URL with hash #sync=...
  const pairingUrl = isConnected
    ? `${window.location.origin}${window.location.pathname}#sync=${encodeSyncPairing(config)}`
    : '';

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setErrorMsg('Пожалуйста, введите токен GitHub');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      await onConnect(tokenInput.trim(), gistIdInput.trim() || undefined);
      setTokenInput('');
      setGistIdInput('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Ошибка подключения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!pairingUrl) return;
    try {
      await navigator.clipboard.writeText(pairingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const createTokenUrl = 'https://github.com/settings/tokens/new?scopes=gist&description=MindFlow%20Sync';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#121215] text-zinc-900 dark:text-zinc-100 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 flex flex-col gap-6 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Синхронизация (GitHub Gist)
              </h2>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                ПК ↔ Телефон без сторонних серверов
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isConnected ? (
          /* Connected State: Status & Phone Pairing QR */
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  Активно
                </span>
                {lastSyncedAt && (
                  <span className="text-zinc-400">
                    • {new Date(lastSyncedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              <a
                href={`https://gist.github.com/${config.gistId}`}
                target="_blank"
                rel="noreferrer"
                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1 font-mono text-[11px] underline"
              >
                <span>{config.gistId.slice(0, 8)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* QR Code Section for Phone */}
            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 text-center">
              <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Привязать телефон за 1 секунду
              </div>

              <div className="p-3 bg-white rounded-2xl shadow-xs border border-zinc-200/60 inline-block">
                <QRCodeSVG
                  value={pairingUrl}
                  size={175}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-xs leading-relaxed">
                Наведите камеру смартфона на QR-код. Телефон автоматически привяжется к вашей базе задач без ручного ввода токенов.
              </p>

              <button
                type="button"
                onClick={handleCopyLink}
                className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-all cursor-pointer shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Ссылка скопирована!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Скопировать ссылку для телефона</span>
                  </>
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={onForceSync}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Синхронизация...' : 'Синхронизировать сейчас'}</span>
              </button>

              <button
                type="button"
                onClick={onDisconnect}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Отключить</span>
              </button>
            </div>
          </div>
        ) : (
          /* Setup Form */
          <form onSubmit={handleConnectSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  GitHub Personal Access Token (classic)
                </label>
                <a
                  href={createTokenUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Создать токен ↗</span>
                </a>
              </div>

              <input
                type="password"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-300 font-mono transition-colors"
                autoFocus
              />
              <span className="text-[11px] text-zinc-400 leading-tight">
                Требуется только галочка <code className="font-mono text-zinc-600 dark:text-zinc-300">gist</code>. Токен хранится строго в localStorage вашего браузера.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Gist ID <span className="text-zinc-400 font-normal">(необязательно)</span>
              </label>
              <input
                type="text"
                value={gistIdInput}
                onChange={e => setGistIdInput(e.target.value)}
                placeholder="Оставьте пустым для автосоздания"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-300 font-mono transition-colors"
              />
              <span className="text-[11px] text-zinc-400 leading-tight">
                Если оставить пустым, приложение само создаст приватный Gist при первом подключении.
              </span>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
              >
                Отмена
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isLoading ? 'Подключение...' : 'Подключить синхронизацию'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
