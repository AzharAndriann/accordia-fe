import { authenticatedRequest } from '@/lib/api';
import type { ApiSuccess, CursorPage, ProjectRole } from '@/types/api';

import type { CreateInvitationForm } from './invitations.schema';

export type CreatedInvitation = {
  id: string;
  projectId: string;
  targetEmail: string;
  expiresAt: string;
  createdAt: string;
  token: string;
};

export type AcceptedInvitation = {
  invitationId: string;
  projectId: string;
  role: ProjectRole;
  acceptedAt: string;
};

export type PendingInvitation = {
  id: string;
  projectId: string;
  projectTitle: string;
  inviterName: string;
  targetEmail: string;
  expiresAt: string;
  createdAt: string;
};

export type ProjectInvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REMOVAL_PENDING'
  | 'REMOVED'
  | 'CANCELLED'
  | 'EXPIRED';

export type MembershipRemovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ProjectInvitation = {
  id: string;
  projectId: string;
  targetEmail: string;
  status: ProjectInvitationStatus;
  expiresAt: string;
  acceptedAt: string | null;
  cancelledAt: string | null;
  removalStatus: MembershipRemovalStatus | null;
  removalRequestedAt: string | null;
  removalRespondedAt: string | null;
  createdAt: string;
};

export type MembershipRemovalRequest = {
  invitationId: string;
  projectId: string;
  projectTitle: string;
  freelancerName: string;
  requestedAt: string;
};

export type MembershipRemovalResult = {
  invitationId: string;
  projectId: string;
  status: 'APPROVED' | 'REJECTED';
  respondedAt: string;
};

export const invitationKeys = {
  all: ['invitations'] as const,
  pending: () => [...invitationKeys.all, 'pending'] as const,
  project: (projectId: string) => [...invitationKeys.all, 'project', projectId] as const,
  removals: () => [...invitationKeys.all, 'removals'] as const,
};

export function createInvitation(projectId: string, input: CreateInvitationForm) {
  return authenticatedRequest<ApiSuccess<CreatedInvitation>>(`/projects/${projectId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listPendingInvitations(cursor?: string, limit = 20) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set('cursor', cursor);
  return authenticatedRequest<CursorPage<PendingInvitation>>(`/invitations?${query.toString()}`);
}

export function listProjectInvitations(projectId: string, cursor?: string, limit = 20) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set('cursor', cursor);
  return authenticatedRequest<CursorPage<ProjectInvitation>>(
    `/projects/${projectId}/invitations?${query.toString()}`,
  );
}

export function cancelProjectInvitation(projectId: string, invitationId: string) {
  return authenticatedRequest<ApiSuccess<{
    id: string;
    projectId: string;
    cancelledAt: string;
  }>>(`/projects/${projectId}/invitations/${invitationId}`, { method: 'DELETE' });
}

export function requestClientRemoval(projectId: string, invitationId: string) {
  return authenticatedRequest<ApiSuccess<MembershipRemovalRequest>>(
    `/projects/${projectId}/invitations/${invitationId}/removal-request`,
    { method: 'POST' },
  );
}

export function listMembershipRemovalRequests(cursor?: string, limit = 20) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) query.set('cursor', cursor);
  return authenticatedRequest<CursorPage<MembershipRemovalRequest>>(
    `/membership-removal-requests?${query.toString()}`,
  );
}

export function respondToMembershipRemoval(
  invitationId: string,
  decision: 'approve' | 'reject',
) {
  return authenticatedRequest<ApiSuccess<MembershipRemovalResult>>(
    `/membership-removal-requests/${invitationId}/${decision}`,
    { method: 'POST' },
  );
}

export function acceptInvitation(invitationId: string) {
  return authenticatedRequest<ApiSuccess<AcceptedInvitation>>(`/invitations/${invitationId}/accept`, {
    method: 'POST',
  });
}
