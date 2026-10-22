import { authenticatedRequest } from '@/lib/api';
import type { ApiSuccess, CursorPage } from '@/types/api';

import type { ChangeRequest } from './changes.types';

export const changeKeys = {
  all: ['change-requests'] as const,
  list: (projectId: string) => [...changeKeys.all, projectId, 'list'] as const,
};

export function listChangeRequests(projectId: string, cursor?: string, limit = 20) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set('cursor', cursor);
  return authenticatedRequest<CursorPage<ChangeRequest>>(
    `/projects/${projectId}/change-requests?${query.toString()}`,
  );
}

export function createChangeRequest(
  projectId: string,
  input: { reason: string; expectedActiveVersionId: string },
) {
  return authenticatedRequest<ApiSuccess<ChangeRequest>>(`/projects/${projectId}/change-requests`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
