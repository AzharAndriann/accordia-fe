import { authenticatedRequest } from '@/lib/api';
import type { ApiSuccess, ProjectRole } from '@/types/api';

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

export function createInvitation(projectId: string, input: CreateInvitationForm) {
  return authenticatedRequest<ApiSuccess<CreatedInvitation>>(`/projects/${projectId}/invitations`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function acceptInvitation(token: string) {
  return authenticatedRequest<ApiSuccess<AcceptedInvitation>>('/invitations/accept', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
