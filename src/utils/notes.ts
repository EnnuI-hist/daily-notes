export function extractTags(text: string): string[] {
  const tagRegex = /(?:^|\s)#([\p{L}\p{N}_-]+)/gu;
  const tags = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(text)) !== null) {
    const t = match[1].toLowerCase().trim();
    if (t) tags.add(t);
  }
  return Array.from(tags);
}

export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  const urls = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(text)) !== null) {
    urls.add(match[1]);
  }
  return Array.from(urls);
}

export function getDomain(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
}

export function getPathPreview(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    const path = u.pathname + u.search;
    if (!path || path === '/') return '';
    return decodeURIComponent(path.length > 40 ? path.slice(0, 37) + '...' : path);
  } catch {
    return '';
  }
}

export function formatNoteDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Сегодня, ${timeStr}`;
  if (isYesterday) return `Вчера, ${timeStr}`;

  const isThisYear = date.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}, ${timeStr}`;
  }
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}
