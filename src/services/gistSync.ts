import type { Task, SyncConfig } from '../types';

const GIST_FILENAME = 'mindflow-data.json';
const GIST_API_BASE = 'https://api.github.com/gists';

interface GistPayload {
  version: number;
  lastSyncedAt: number;
  tasks: Task[];
}

/**
 * Creates a new secret/private GitHub Gist to store MindFlow tasks.
 */
export async function createPrivateGist(token: string, tasks: Task[]): Promise<string> {
  const payload: GistPayload = {
    version: 1,
    lastSyncedAt: Date.now(),
    tasks,
  };

  const response = await fetch(GIST_API_BASE, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token.trim()}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'MindFlow Cloud Sync (Private Storage)',
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(payload, null, 2),
        },
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Ошибка создания Gist (${response.status})`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * Fetches tasks from an existing Gist.
 */
export async function fetchGistTasks(config: SyncConfig): Promise<Task[]> {
  const response = await fetch(`${GIST_API_BASE}/${config.gistId.trim()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token.trim()}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Gist не найден. Проверьте Gist ID.');
    }
    if (response.status === 401) {
      throw new Error('Неверный токен GitHub или истёк срок его действия.');
    }
    throw new Error(`Ошибка загрузки Gist (${response.status})`);
  }

  const data = await response.json();
  const file = data.files?.[GIST_FILENAME];
  if (!file || !file.content) {
    return [];
  }

  try {
    const parsed: GistPayload = JSON.parse(file.content);
    return Array.isArray(parsed.tasks) ? parsed.tasks : [];
  } catch (err) {
    console.error('Failed to parse Gist content', err);
    return [];
  }
}

/**
 * Updates an existing Gist with local tasks.
 */
export async function updateGistTasks(config: SyncConfig, tasks: Task[]): Promise<void> {
  const payload: GistPayload = {
    version: 1,
    lastSyncedAt: Date.now(),
    tasks,
  };

  const response = await fetch(`${GIST_API_BASE}/${config.gistId.trim()}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token.trim()}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'MindFlow Cloud Sync (Private Storage)',
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(payload, null, 2),
        },
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Ошибка сохранения в Gist (${response.status})`);
  }
}

/**
 * Merges two task arrays using Last-Write-Wins (LWW) based on updatedAt / createdAt.
 */
export function mergeTasks(local: Task[], remote: Task[]): Task[] {
  const map = new Map<string, Task>();

  // Add all local tasks
  for (const t of local) {
    map.set(t.id, {
      ...t,
      updatedAt: t.updatedAt || t.createdAt || Date.now(),
    });
  }

  // Merge remote tasks
  for (const r of remote) {
    const remoteUpdated = r.updatedAt || r.createdAt || Date.now();
    const existing = map.get(r.id);

    if (!existing) {
      map.set(r.id, { ...r, updatedAt: remoteUpdated });
    } else {
      const localUpdated = existing.updatedAt || existing.createdAt || 0;
      if (remoteUpdated >= localUpdated) {
        map.set(r.id, { ...r, updatedAt: remoteUpdated });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    // Keep active before completed, then sort by createdAt descending
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (b.createdAt || 0) - (a.createdAt || 0);
  });
}

/**
 * Encodes pairing configuration into a URL-safe base64 string.
 */
export function encodeSyncPairing(config: SyncConfig): string {
  const json = JSON.stringify({
    token: config.token.trim(),
    gistId: config.gistId.trim(),
  });
  return btoa(unescape(encodeURIComponent(json)));
}

/**
 * Decodes pairing configuration from a base64 string.
 */
export function decodeSyncPairing(encoded: string): { token: string; gistId: string } | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed.token === 'string' && typeof parsed.gistId === 'string') {
      return {
        token: parsed.token.trim(),
        gistId: parsed.gistId.trim(),
      };
    }
  } catch (err) {
    console.error('Failed to decode sync pairing', err);
  }
  return null;
}
