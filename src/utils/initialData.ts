import type { Task, Note } from '../types';
import { getTodayDateString } from './dateUtils';

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Нажать Cmd+K или Ctrl+K для вызова командной строки ⚡',
    completed: false,
    dueDate: getTodayDateString(),
    priority: 'high',
    tags: ['горячие-клавиши'],
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'task-2',
    title: 'Попробовать быстрый инбокс: ввести мысль в поле сверху и нажать Enter',
    completed: false,
    dueDate: getTodayDateString(),
    priority: 'medium',
    tags: ['инбокс', 'quickstart'],
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'task-3',
    title: 'Проверить кнопку «Перенести невыполненные на завтра» в панели фильтров',
    completed: false,
    dueDate: getTodayDateString(),
    priority: 'low',
    tags: ['планировщик'],
    createdAt: Date.now() - 10800000,
  },
  {
    id: 'task-4',
    title: 'Поставить галочку на первой выполненной задаче и насладиться анимацией ✨',
    completed: true,
    dueDate: getTodayDateString(),
    priority: 'low',
    tags: ['мотивация'],
    createdAt: Date.now() - 14400000,
    completedAt: Date.now() - 1000,
  },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-welcome',
    title: 'Добро пожаловать в MindFlow 🧠',
    content: `# Твой персональный второй мозг

MindFlow создан как сверхбыстрая и чистая альтернатива Telegram «Избранное», Notion и Apple Notes.

### Главные фичи:
- **Мгновенный ввод:** Верхняя строка всегда готова. Напиши мысль -> нажми \`Enter\`. Если начать строку с \`[] \` или \`- [ ]\`, она автоматически превратится в задачу.
- **Умные теги:** Ставь #тег в любом месте заметки или задачи — они сразу появятся в боковом меню для фильтрации.
- **Markdown из коробки:** Заголовки, **жирный**, *курсив*, \`код\`, списки и цитаты.
- **Командная палитра:** Нажми \`Cmd + K\` (или \`Ctrl + K\`) в любой момент для глобального поиска и горячих действий.
- **Приватность:** Все данные хранятся локально в твоем браузере. В любой момент можно сделать бэкап через экспорт в JSON или Markdown.`,
    pinned: true,
    tags: ['старт', 'инструкция', 'mindflow'],
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'note-cheatsheet',
    title: 'Горячие клавиши и шорткаты ⌨️',
    content: `Управляй приложением со скоростью мысли:

- \`Cmd / Ctrl + K\` — Глобальный поиск и командная палитра
- \`Cmd / Ctrl + N\` — Создать новую заметку
- \`Cmd / Ctrl + T\` — Создать задачу на сегодня
- \`Cmd / Ctrl + B\` — Свернуть / развернуть боковое меню
- \`Esc\` — Закрыть любое модальное окно или отменить поиск
- \`Enter\` в инбоксе — Быстрое сохранение мысли

Попробуй кликнуть на тег #горячие-клавиши или отфильтровать список!`,
    pinned: true,
    tags: ['горячие-клавиши', 'продуктивность'],
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 43200000,
  },
  {
    id: 'note-links',
    title: 'Полезные ссылки и вдохновение 🌐',
    content: `Автоматическое распознавание ссылок работает прямо в тексте:

- Дизайн-система Linear: https://linear.app
- Заметки и архитектура: https://obsidian.md
- Минимализм в вебе: https://tonsky.me

Добавляй свои ссылки через инбокс или [красивые названия](https://github.com)!`,
    pinned: false,
    tags: ['ссылки', 'дизайн'],
    createdAt: Date.now() - 21600000,
    updatedAt: Date.now() - 21600000,
  },
];
