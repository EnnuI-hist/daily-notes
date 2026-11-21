import type { Task, Note } from '../types';

export function exportToJson(data: { tasks: Task[]; notes: Note[] }, filename = 'mindflow-backup.json') {
  const exportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: data.tasks,
    notes: data.notes,
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportNotesToMarkdown(notes: Note[], filename = 'mindflow-notes.md') {
  let mdContent = `# MindFlow Notes Export\n_Экспортировано: ${new Date().toLocaleString('ru-RU')}_\n\n---\n\n`;

  notes.forEach((note, idx) => {
    mdContent += `## ${idx + 1}. ${note.title || 'Без названия'}\n`;
    mdContent += `*Создано:* ${new Date(note.createdAt).toLocaleString('ru-RU')}  \n`;
    if (note.tags.length > 0) {
      mdContent += `*Теги:* ${note.tags.map(t => `#${t}`).join(' ')}  \n`;
    }
    mdContent += `\n${note.content}\n\n---\n\n`;
  });

  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function parseImportJsonFile(file: File): Promise<{ tasks: Task[]; notes: Note[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation
        const tasks: Task[] = Array.isArray(parsed.tasks) ? parsed.tasks : [];
        const notes: Note[] = Array.isArray(parsed.notes) ? parsed.notes : [];

        resolve({ tasks, notes });
      } catch (err) {
        reject(new Error('Неверный формат JSON файла'));
      }
    };
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsText(file);
  });
}
