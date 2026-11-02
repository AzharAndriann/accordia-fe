import { authenticatedRequest } from '@/lib/api';
import type { ApiSuccess, CursorPage } from '@/types/api';
export type ProjectRequest = {
  id: string; projectId: string; type: 'CANCELLATION' | 'DISPUTE';
  status: 'OPEN' | 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
  reason: string; requestedById: string; respondentId: string | null; resolution: string | null;
  proposedById: string | null; responseReason: string | null; createdAt: string; updatedAt: string;
};
export const requestKeys = { all: ['project-requests'] as const, list: (id: string) => ['project-requests', id] as const };
export const listProjectRequests = (id: string, cursor?: string) => authenticatedRequest<CursorPage<ProjectRequest>>(`/projects/${id}/requests?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
export const createProjectRequest = (id: string, type: ProjectRequest['type'], reason: string) => authenticatedRequest<ApiSuccess<ProjectRequest>>(`/projects/${id}/requests`, { method: 'POST', body: JSON.stringify({ type, reason }) });
export type RequestAction = 'propose' | 'approve' | 'reject' | 'withdraw';
export const respondProjectRequest = (request: ProjectRequest, action: RequestAction, reason: string) => authenticatedRequest<ApiSuccess<ProjectRequest>>(`/project-requests/${request.id}/respond`, { method: 'POST', body: JSON.stringify({ action, reason, expectedUpdatedAt: request.updatedAt }) });
