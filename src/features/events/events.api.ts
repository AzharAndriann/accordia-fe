import { authenticatedRequest } from '@/lib/api';
import type { CursorPage } from '@/types/api';

import type { AuditEvent } from './events.types';

export const eventKeys = {
  all: ['project-events'] as const,
  list: (projectId: string) => [...eventKeys.all, projectId, 'list'] as const,
};

export function listProjectEvents(projectId: string, cursor?: string, limit = 30) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set('cursor', cursor);
  return authenticatedRequest<CursorPage<AuditEvent>>(`/projects/${projectId}/events?${query.toString()}`);
}
