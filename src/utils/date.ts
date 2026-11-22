export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateBadge(dateStr: string): string {
  if (!dateStr) return '';
  const today = getTodayDateString();
  const tomorrow = getTomorrowDateString();

  if (dateStr === today) return 'Сегодня';
  if (dateStr === tomorrow) return 'Завтра';

  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const currentYear = new Date().getFullYear();
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: y !== currentYear ? 'numeric' : undefined,
    });
  } catch {
    return dateStr;
  }
}

export function isDateOverdue(dateStr: string, completed: boolean): boolean {
  if (!dateStr || completed) return false;
  return dateStr < getTodayDateString();
}

/**
 * Converts a unix-ms timestamp to a local YYYY-MM-DD string.
 */
export function timestampToDateString(ts: number): string {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a human-readable Russian date header for the archive groups.
 * "Сегодня" / "Вчера" / "25 ноября" / "15 декабря 2023"
 */
export function formatArchiveDayHeader(dateStr: string): string {
  const today = getTodayDateString();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  if (dateStr === today) return 'Сегодня';
  if (dateStr === yesterday) return 'Вчера';

  try {
    const [y, m, day] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, day);
    const currentYear = new Date().getFullYear();
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: y !== currentYear ? 'numeric' : undefined,
    });
  } catch {
    return dateStr;
  }
}
