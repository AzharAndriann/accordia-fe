import { ApiError, apiRequest } from '@/lib/api';
import { getAccessToken } from '@/lib/session';
import type { ApiSuccess, CursorPage, ProjectSummary } from '@/types/api';

import type { CreateProjectForm } from './projects.schema';

export const projectKeys = {
  all: ['projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
};

function projectRequest<T>(path: string, options?: RequestInit) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new ApiError(401, 'UNAUTHENTICATED', 'Silakan masuk kembali untuk melanjutkan');
  }
  return apiRequest<T>(path, { ...options, accessToken });
}

export function listProjects({ cursor, limit = 20 }: { cursor?: string; limit?: number } = {}) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set('cursor', cursor);
  return projectRequest<CursorPage<ProjectSummary>>(`/projects?${query.toString()}`);
}

export function createProject(input: CreateProjectForm) {
  return projectRequest<ApiSuccess<ProjectSummary>>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function findProjectById(id: string) {
  let cursor: string | undefined;
  const visitedCursors = new Set<string>();

  do {
    const page = await listProjects({ cursor, limit: 100 });
    const project = page.data.find((item) => item.id === id);
    if (project) return project;

    cursor = page.nextCursor ?? undefined;
    if (cursor && visitedCursors.has(cursor)) break;
    if (cursor) visitedCursors.add(cursor);
  } while (cursor);

  throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Proyek tidak ditemukan');
}
