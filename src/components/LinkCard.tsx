import React, { useState } from 'react';
import { ExternalLink, Globe, Copy, Check } from 'lucide-react';
import { getDomain, getPathPreview } from '../utils/notes';

interface LinkCardProps {
  url: string;
}

export const LinkCard: React.FC<LinkCardProps> = ({ url }) => {
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);
  const domain = getDomain(url);
  const pathPreview = getPathPreview(url);

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  return (
    <div
      onClick={e => e.stopPropagation()}
      className="group/link flex items-center justify-between p-2.5 rounded-xl bg-zinc-50/90 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-indigo-300 dark:hover:border-indigo-700/60 transition-all text-xs"
    >
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-90"
        title={url}
      >
        <div className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
          {!imgError ? (
            <img
              src={faviconUrl}
              alt={domain}
              className="w-4 h-4 object-contain"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
          )}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 font-medium text-zinc-800 dark:text-zinc-200 truncate">
            <span>{domain}</span>
            <ExternalLink className="w-3 h-3 text-zinc-400 group-hover/link:text-indigo-500 shrink-0 transition-colors" />
          </div>
          {pathPreview && (
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono truncate">
              {pathPreview}
            </span>
          )}
        </div>
      </a>

      <button
        type="button"
        onClick={handleCopy}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0 ml-1.5"
        title={copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};
