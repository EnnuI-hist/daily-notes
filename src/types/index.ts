export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  updatedAt: number;
  deleted?: boolean;
}

export type SyncStatus = 'offline' | 'synced' | 'syncing' | 'error';

export interface SyncConfig {
  token: string;
  gistId: string;
  lastSyncedAt?: number;
}
