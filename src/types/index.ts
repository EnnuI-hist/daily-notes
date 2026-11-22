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

export type SyncStatus = 'offline' | 'synced' | 'syncing' | 'error';

export interface SyncConfig {
  token: string;
  gistId: string;
  lastSyncedAt?: number;
}
