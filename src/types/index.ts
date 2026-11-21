export type Priority = 'low' | 'medium' | 'high';

export type TaskStatus = 'todo' | 'done';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string; // YYYY-MM-DD
  priority: Priority;
  tags: string[];
  createdAt: number;
  completedAt?: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export type ViewTab = 'today' | 'all-tasks' | 'notes' | 'archive';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppData {
  tasks: Task[];
  notes: Note[];
  theme: ThemeMode;
  sidebarOpen: boolean;
}
