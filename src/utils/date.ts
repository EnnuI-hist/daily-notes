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
