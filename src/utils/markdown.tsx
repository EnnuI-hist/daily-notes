import React from 'react';

/**
 * Extracts hashtags from text (supports Russian & English, numbers, dashes, underscores)
 */
export function extractTags(text: string): string[] {
  if (!text) return [];
  // Match #tag, ignoring inside code or links if possible
  const matches = text.match(/(?:^|\s)#([a-zA-Zа-яА-Я0-9_-]+)/g);
  if (!matches) return [];
  const tags = matches.map(m => m.trim().substring(1).toLowerCase());
  return Array.from(new Set(tags));
}

/**
 * Parses inline formatting: bold, italic, code, links, tags, strikethrough, autolinks
 */
export function renderInlineMarkdown(text: string, onTagClick?: (tag: string) => void): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  // Regex for inline tokens
  // 1: Bold **...**
  // 2: Italic *...*
  // 3: Strike ~~...~~
  // 4: Inline code `...`
  // 5: Link [title](url)
  // 6: Raw URL https://...
  // 7: Tag #tag
  const tokenRegex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(~~([^~]+)~~)|(`([^`]+)`)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s<)]+)|(#([a-zA-Zа-яА-Я0-9_-]+))/;

  while (remaining) {
    const match = remaining.match(tokenRegex);
    if (!match || match.index === undefined) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (match.index > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, match.index)}</span>);
    }

    const fullMatch = match[0];

    if (match[1]) {
      // Bold
      parts.push(
        <strong key={key++} className="font-semibold text-zinc-900 dark:text-zinc-100">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Italic
      parts.push(
        <em key={key++} className="italic text-zinc-800 dark:text-zinc-200">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      // Strike
      parts.push(
        <del key={key++} className="line-through text-zinc-400 dark:text-zinc-500">
          {match[6]}
        </del>
      );
    } else if (match[7]) {
      // Code
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 mx-0.5 rounded text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-pink-600 dark:text-pink-400 border border-zinc-200 dark:border-zinc-700/60"
        >
          {match[8]}
        </code>
      );
    } else if (match[9]) {
      // [title](url)
      parts.push(
        <a
          key={key++}
          href={match[11]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 font-medium"
          onClick={e => e.stopPropagation()}
        >
          {match[10]}
        </a>
      );
    } else if (match[12]) {
      // Raw URL
      const url = match[12];
      let displayUrl = url.replace(/^https?:\/\/(www\.)?/, '');
      if (displayUrl.length > 35) displayUrl = displayUrl.slice(0, 32) + '...';
      parts.push(
        <a
          key={key++}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 text-xs bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/50 font-mono"
          onClick={e => e.stopPropagation()}
        >
          {displayUrl}
        </a>
      );
    } else if (match[13]) {
      // Tag #tag
      const tag = match[14].toLowerCase();
      parts.push(
        <button
          key={key++}
          type="button"
          onClick={e => {
            e.stopPropagation();
            onTagClick?.(tag);
          }}
          className="inline-flex items-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded-full mx-0.5 cursor-pointer transition-colors"
        >
          #{tag}
        </button>
      );
    }

    remaining = remaining.slice(match.index + fullMatch.length);
  }

  return parts;
}

/**
 * Renders block-level markdown into React elements
 */
export function MarkdownRenderer({
  content,
  onTagClick,
}: {
  content: string;
  onTagClick?: (tag: string) => void;
}) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check code blocks ```
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <div key={`codeblock-${i}`} className="my-3 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-100 p-3 font-mono text-xs">
            {codeLang && <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{codeLang}</div>}
            <pre className="overflow-x-auto">
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBuffer = [];
        codeLang = '';
      } else {
        inCodeBlock = true;
        codeLang = line.replace('```', '').trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${i}`} className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-4 mb-1.5">
          {renderInlineMarkdown(line.slice(4), onTagClick)}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${i}`} className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-4 mb-2">
          {renderInlineMarkdown(line.slice(3), onTagClick)}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-5 mb-2.5">
          {renderInlineMarkdown(line.slice(2), onTagClick)}
        </h1>
      );
      continue;
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-2 border-indigo-500 pl-3 my-2 italic text-zinc-600 dark:text-zinc-400 text-sm"
        >
          {renderInlineMarkdown(line.slice(2), onTagClick)}
        </blockquote>
      );
      continue;
    }

    // Checkbox list
    if (line.match(/^[-*]\s+\[([ xX])\]\s+/)) {
      const isChecked = line.match(/^[-*]\s+\[([xX])\]/);
      const text = line.replace(/^[-*]\s+\[([ xX])\]\s+/, '');
      elements.push(
        <div key={`check-${i}`} className="flex items-start gap-2 my-1 text-sm">
          <input
            type="checkbox"
            checked={!!isChecked}
            readOnly
            className="mt-1 h-3.5 w-3.5 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-0"
          />
          <span className={isChecked ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}>
            {renderInlineMarkdown(text, onTagClick)}
          </span>
        </div>
      );
      continue;
    }

    // Unordered List
    if (line.match(/^[-*]\s+/)) {
      elements.push(
        <li key={`li-${i}`} className="ml-4 list-disc text-sm text-zinc-700 dark:text-zinc-300 my-0.5">
          {renderInlineMarkdown(line.replace(/^[-*]\s+/, ''), onTagClick)}
        </li>
      );
      continue;
    }

    // Ordered List
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      elements.push(
        <div key={`oli-${i}`} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300 my-0.5">
          <span className="font-mono text-xs text-zinc-400 w-4 text-right">{orderedMatch[1]}.</span>
          <span>{renderInlineMarkdown(orderedMatch[2], onTagClick)}</span>
        </div>
      );
      continue;
    }

    // Blank line
    if (!line.trim()) {
      elements.push(<div key={`blank-${i}`} className="h-2" />);
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 my-1">
        {renderInlineMarkdown(line, onTagClick)}
      </p>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
}
