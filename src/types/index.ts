export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  updatedAt: number;
  deleted?: boolean;
  dueDate?: string | null; // YYYY-MM-DD format
}

export interface Note {
  id: string;
  title?: string;
  content: string;
  tags: string[];
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
}

export type TabType = 'tasks' | 'notes';

export type SyncStatus = 'offline' | 'synced' | 'syncing' | 'error';

export interface SyncConfig {
  token: string;
  gistId: string;
  lastSyncedAt?: number;
}

