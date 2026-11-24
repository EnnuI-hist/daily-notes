import React from 'react';

interface MarkdownViewProps {
  content: string;
  onTagClick?: (tag: string) => void;
  className?: string;
}

// Parses inline tokens: code, bold, italic, strikethrough, markdown links, raw urls, and #tags
function parseInlineTokens(
  text: string,
  onTagClick?: (tag: string) => void
): React.ReactNode[] {
  // Regex to match markdown links [text](url), raw URLs, inline code `code`, bold **text**, italic *text*, strike ~~text~~, and #tags
  const tokenRegex =
    /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|~~[^~]+~~|\[[^\]]+\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s<]+[^<.,:;"')\]\s]|(?:^|\s)#[\p{L}\p{N}_-]+)/gu;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchStr = match[0];

    // Push plain text before this match
    if (matchStart > lastIndex) {
      elements.push(text.slice(lastIndex, matchStart));
    }

    if (matchStr.startsWith('`') && matchStr.endsWith('`') && matchStr.length > 2) {
      elements.push(
        <code
          key={matchStart}
          className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-pink-600 dark:text-pink-400 font-mono text-xs font-medium"
        >
          {matchStr.slice(1, -1)}
        </code>
      );
    } else if (matchStr.startsWith('**') && matchStr.endsWith('**') && matchStr.length > 4) {
      elements.push(
        <strong key={matchStart} className="font-semibold text-zinc-900 dark:text-zinc-100">
          {matchStr.slice(2, -2)}
        </strong>
      );
    } else if (matchStr.startsWith('*') && matchStr.endsWith('*') && matchStr.length > 2) {
      elements.push(
        <em key={matchStart} className="italic text-zinc-800 dark:text-zinc-200">
          {matchStr.slice(1, -1)}
        </em>
      );
    } else if (matchStr.startsWith('~~') && matchStr.endsWith('~~') && matchStr.length > 4) {
      elements.push(
        <del key={matchStart} className="line-through text-zinc-400 dark:text-zinc-500">
          {matchStr.slice(2, -2)}
        </del>
      );
    } else if (matchStr.startsWith('[') && matchStr.includes('](')) {
      const closingBracket = matchStr.indexOf('](');
      const label = matchStr.slice(1, closingBracket);
      const url = matchStr.slice(closingBracket + 2, -1);
      elements.push(
        <a
          key={matchStart}
          href={url}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-400/40 hover:decoration-indigo-600 font-medium transition-colors inline-flex items-center gap-0.5 break-all"
        >
          {label}
        </a>
      );
    } else if (matchStr.startsWith('http://') || matchStr.startsWith('https://')) {
      elements.push(
        <a
          key={matchStart}
          href={matchStr}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          className="text-indigo-600 dark:text-indigo-400 underline decoration-indigo-400/40 hover:decoration-indigo-600 font-medium transition-colors break-all"
        >
          {matchStr}
        </a>
      );
    } else if (matchStr.includes('#')) {
      const leadingSpace = matchStr.startsWith(' ') || matchStr.startsWith('\t') ? ' ' : '';
      const tagContent = matchStr.trim();
      const rawTag = tagContent.slice(1).toLowerCase();

      elements.push(
        <span key={matchStart}>
          {leadingSpace}
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onTagClick?.(rawTag);
            }}
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors cursor-pointer hover:underline"
          >
            {tagContent}
          </button>
        </span>
      );
    } else {
      elements.push(matchStr);
    }

    lastIndex = matchStart + matchStr.length;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({
  content,
  onTagClick,
  className = '',
}) => {
  if (!content) return null;

  // Split into lines to parse markdown blocks
  const rawLines = content.split('\n');
  const renderedBlocks: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockBuffer: string[] = [];
  let codeBlockKey = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        inCodeBlock = false;
        renderedBlocks.push(
          <pre
            key={`code-${codeBlockKey}`}
            className="my-2 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono overflow-x-auto text-zinc-800 dark:text-zinc-200"
          >
            <code>{codeBlockBuffer.join('\n')}</code>
          </pre>
        );
        codeBlockBuffer = [];
      } else {
        inCodeBlock = true;
        codeBlockKey = i;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      renderedBlocks.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      renderedBlocks.push(
        <h4
          key={`h3-${i}`}
          className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-2 mb-1"
        >
          {parseInlineTokens(trimmed.slice(4), onTagClick)}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      renderedBlocks.push(
        <h3
          key={`h2-${i}`}
          className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-2.5 mb-1"
        >
          {parseInlineTokens(trimmed.slice(3), onTagClick)}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      renderedBlocks.push(
        <h2
          key={`h1-${i}`}
          className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-3 mb-1"
        >
          {parseInlineTokens(trimmed.slice(2), onTagClick)}
        </h2>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      renderedBlocks.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-2 border-indigo-400 dark:border-indigo-500 pl-3 my-1.5 text-zinc-600 dark:text-zinc-400 italic text-sm"
        >
          {parseInlineTokens(trimmed.slice(2), onTagClick)}
        </blockquote>
      );
      continue;
    }

    // Unordered List
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      renderedBlocks.push(
        <div key={`li-${i}`} className="flex items-start gap-2 my-0.5 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 mt-2 shrink-0" />
          <span className="flex-1 leading-relaxed text-zinc-700 dark:text-zinc-300">
            {parseInlineTokens(trimmed.slice(2), onTagClick)}
          </span>
        </div>
      );
      continue;
    }

    // Ordered List
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      renderedBlocks.push(
        <div key={`oli-${i}`} className="flex items-start gap-2 my-0.5 text-sm">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5 shrink-0 w-4">
            {orderedMatch[1]}.
          </span>
          <span className="flex-1 leading-relaxed text-zinc-700 dark:text-zinc-300">
            {parseInlineTokens(orderedMatch[2], onTagClick)}
          </span>
        </div>
      );
      continue;
    }

    // Normal paragraph line
    renderedBlocks.push(
      <p
        key={`p-${i}`}
        className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 break-words my-0.5"
      >
        {parseInlineTokens(line, onTagClick)}
      </p>
    );
  }

  // If unclosed code block at EOF
  if (inCodeBlock && codeBlockBuffer.length > 0) {
    renderedBlocks.push(
      <pre
        key={`code-end`}
        className="my-2 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono overflow-x-auto text-zinc-800 dark:text-zinc-200"
      >
        <code>{codeBlockBuffer.join('\n')}</code>
      </pre>
    );
  }

  return <div className={`flex flex-col ${className}`}>{renderedBlocks}</div>;
};
